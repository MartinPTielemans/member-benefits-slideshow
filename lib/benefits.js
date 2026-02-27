const TAG_RE = /<[^>]+>/g;
const SPACE_RE = /\s+/g;

const ENTITY_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' '
};

function decodeHtml(value) {
  let decoded = value;
  for (const [entity, replacement] of Object.entries(ENTITY_MAP)) {
    decoded = decoded.replaceAll(entity, replacement);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
  return decoded;
}

function cleanText(value) {
  return decodeHtml(value.replace(TAG_RE, ' ').replace(SPACE_RE, ' ').trim());
}

function toAbsoluteUrl(href, pageUrl) {
  if (!href) {
    return null;
  }

  try {
    return new URL(href, pageUrl).toString();
  } catch {
    return null;
  }
}

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replaceAll('æ', 'ae')
    .replaceAll('ø', 'oe')
    .replaceAll('å', 'aa')
    .replaceAll('%', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTitle(value) {
  return value.toLowerCase().replace(SPACE_RE, ' ').trim();
}

function isGroupOnlySection(title) {
  const normalized = normalizeTitle(title);
  return (
    /(fordele).*(grupper|foreninger|organisationer)/i.test(normalized) ||
    /(grupper|foreninger|organisationer).*(fordele)/i.test(normalized)
  );
}

function parseSection(sectionHtml, title, pageUrl) {
  const paragraphMatches = Array.from(sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const linkMatch = sectionHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/i);
  const imageMatch = sectionHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);

  const description = paragraphMatches.map((match) => cleanText(match[1])).filter(Boolean).join(' ');
  const link = linkMatch ? toAbsoluteUrl(linkMatch[1], pageUrl) : null;
  const image = imageMatch ? toAbsoluteUrl(imageMatch[1], pageUrl) : null;

  return {
    id: slugifyTitle(title),
    title,
    description,
    link,
    image
  };
}

export function parseBenefitsHtml(html, pageUrl) {
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headings = [];

  for (const match of html.matchAll(headingRegex)) {
    headings.push({
      index: match.index ?? 0,
      level: Number(match[1]),
      rawTitle: match[2],
      headingLength: match[0].length
    });
  }

  const items = [];
  const seenTitles = new Set();
  let activeSectionTitle = '';

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index];
    const next = headings[index + 1];
    const title = cleanText(current.rawTitle);

    if (current.level <= 2) {
      activeSectionTitle = title;
      continue;
    }

    if (current.level < 3) {
      continue;
    }

    if (!title || title.length < 3 || title.length > 90) {
      continue;
    }

    if (/^(medlemsfordele|kontakt|om os)$/i.test(title)) {
      continue;
    }

    const normalizedTitle = normalizeTitle(title);
    if (activeSectionTitle && isGroupOnlySection(activeSectionTitle)) {
      continue;
    }

    if (seenTitles.has(normalizedTitle)) {
      continue;
    }

    const sectionStart = current.index + current.headingLength;
    const sectionEnd = next ? next.index : html.length;
    const sectionHtml = html.slice(sectionStart, sectionEnd);

    const item = parseSection(sectionHtml, title, pageUrl);
    if (!item.link || item.description.length < 20) {
      continue;
    }

    seenTitles.add(normalizedTitle);
    items.push(item);
  }

  return items;
}
