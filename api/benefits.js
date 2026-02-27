import { parseBenefitsHtml } from '../lib/benefits.js';
import { getCachedBenefits, setCachedBenefits } from '../lib/cache.js';

export const SOURCE_URL = 'https://www.studentersamfundet.dk/medlemsfordele';

function parsePositiveInt(raw, fallback, minimum) {
  const parsed = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, parsed);
}

function getRuntimeConfig() {
  return {
    slideIntervalSeconds: parsePositiveInt(process.env.SLIDE_INTERVAL_SECONDS, 10, 3),
    refreshIntervalMinutes: parsePositiveInt(process.env.REFRESH_INTERVAL_MINUTES, 20, 5)
  };
}

async function fetchSourceHtml(fetchImpl) {
  const response = await fetchImpl(SOURCE_URL, {
    headers: {
      'user-agent': 'MemberBenefitsSlideshow/1.0 (+vercel)'
    }
  });

  if (!response.ok) {
    throw new Error(`Upstream request failed with status ${response.status}`);
  }

  return response.text();
}

function buildPayload(items, now) {
  return {
    items,
    updatedAt: new Date(now()).toISOString(),
    sourceUrl: SOURCE_URL,
    config: getRuntimeConfig(),
    stale: false
  };
}

export async function loadBenefits({ fetchImpl = fetch, now = Date.now } = {}) {
  const nowValue = now();

  try {
    const html = await fetchSourceHtml(fetchImpl);
    const items = parseBenefitsHtml(html, SOURCE_URL);

    if (items.length === 0) {
      throw new Error('Parser returned zero benefit items');
    }

    const payload = buildPayload(items, () => nowValue);
    setCachedBenefits({
      fetchedAt: nowValue,
      payload
    });

    return payload;
  } catch (error) {
    const staleCache = getCachedBenefits();
    if (staleCache) {
      return {
        ...staleCache.payload,
        stale: true
      };
    }

    throw error;
  }
}

export default async function handler(_req, res) {
  try {
    const payload = await loadBenefits();

    res.setHeader('cache-control', 'public, max-age=0, s-maxage=300');
    res.status(200).json(payload);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Unable to load benefits',
      sourceUrl: SOURCE_URL
    });
  }
}
