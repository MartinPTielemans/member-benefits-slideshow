import {
  getNextIndex,
  getPrevIndex,
  paginateItems,
  canAutoAdvance,
  toIntervalMs,
  toRefreshMs
} from '/lib/slideshow.js';

const app = document.querySelector('#app');
let slideIntervalMs = toIntervalMs('10');
let refreshIntervalMs = toRefreshMs('20');
const interactionPauseMs = 12_000;
let autoTimer = null;
let refreshTimer = null;

const state = {
  items: [],
  pages: [],
  currentPageIndex: 0,
  updatedAt: null,
  stale: false,
  error: '',
  lastInteractionAt: null,
  lastAdvanceAt: Date.now()
};

function formatTime(iso) {
  if (!iso) {
    return 'never';
  }

  const date = new Date(iso);
  return new Intl.DateTimeFormat('da-DK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getProgressPercent() {
  const elapsed = Date.now() - state.lastAdvanceAt;
  return Math.min(100, Math.round((elapsed / slideIntervalMs) * 100));
}

function renderEmpty(message) {
  app.innerHTML = `
    <section class="empty">
      <div>
        <p class="brand-chip">STUDENTERSAMFUNDET</p>
        <h1>Medlemsfordele</h1>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function renderCards(pageItems) {
  const pageStartIndex = state.currentPageIndex * 2;

  return pageItems
    .map((item, offset) => {
      const safeTitle = escapeHtml(item.title);
      const safeDescription = escapeHtml(item.description);
      const safeLink = item.link ? escapeHtml(item.link) : '';
      const number = pageStartIndex + offset + 1;

      return `
        <article class="benefit-card">
          <p class="benefit-number">Fordel ${number}</p>
          <h2>${safeTitle}</h2>
          <p>${safeDescription}</p>
          ${
            item.link
              ? `<a href="${safeLink}" target="_blank" rel="noreferrer">Åbn medlemsbevis</a>`
              : '<span class="no-link">Se medlemsside for detaljer</span>'
          }
        </article>
      `;
    })
    .join('');
}

function render() {
  if (!state.pages.length) {
    renderEmpty(state.error || 'Ingen fordele tilgængelige lige nu.');
    return;
  }

  const pageItems = state.pages[state.currentPageIndex];

  app.innerHTML = `
    <header class="brand">
      <div>
        <p class="brand-chip">STUDENTERSAMFUNDET</p>
        <h1>Medlemsfordele</h1>
      </div>
      <p class="page-label">Side ${state.currentPageIndex + 1} af ${state.pages.length}</p>
    </header>

    <section class="page" id="page">
      ${renderCards(pageItems)}
    </section>

    <section class="controls">
      <button type="button" id="prev" aria-label="Previous page">‹</button>
      <div class="status"><div class="status-progress" style="width:${getProgressPercent()}%"></div></div>
      <button type="button" id="next" aria-label="Next page">›</button>
    </section>

    <section class="footer">
      <span>Sidst opdateret: ${formatTime(state.updatedAt)} ${state.stale ? '(cache)' : ''}</span>
      <span class="${state.error ? 'error' : ''}">${state.error || 'Live synkronisering aktiv'}</span>
    </section>
  `;

  attachInteractionHandlers();
}

function markInteraction() {
  state.lastInteractionAt = Date.now();
}

function nextPage(userInitiated = false) {
  if (!state.pages.length) {
    return;
  }

  state.currentPageIndex = getNextIndex(state.currentPageIndex, state.pages.length);
  if (userInitiated) {
    markInteraction();
  }
  state.lastAdvanceAt = Date.now();
  render();
}

function prevPage(userInitiated = false) {
  if (!state.pages.length) {
    return;
  }

  state.currentPageIndex = getPrevIndex(state.currentPageIndex, state.pages.length);
  if (userInitiated) {
    markInteraction();
  }
  state.lastAdvanceAt = Date.now();
  render();
}

function attachInteractionHandlers() {
  const prevButton = document.querySelector('#prev');
  const nextButton = document.querySelector('#next');
  const page = document.querySelector('#page');

  prevButton?.addEventListener('click', () => prevPage(true));
  nextButton?.addEventListener('click', () => nextPage(true));

  if (!page) {
    return;
  }

  let touchStartX = 0;
  page.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true }
  );

  page.addEventListener(
    'touchend',
    (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) < 35) {
        return;
      }

      if (deltaX < 0) {
        nextPage(true);
      } else {
        prevPage(true);
      }
    },
    { passive: true }
  );
}

async function refreshBenefits() {
  try {
    const response = await fetch('/api/benefits', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('No benefit items returned');
    }

    state.items = payload.items;
    state.pages = paginateItems(payload.items, 2);
    state.currentPageIndex = Math.min(state.currentPageIndex, Math.max(0, state.pages.length - 1));
    state.updatedAt = payload.updatedAt;
    state.stale = Boolean(payload.stale);
    state.error = '';

    if (payload.config) {
      const nextSlideIntervalMs = toIntervalMs(String(payload.config.slideIntervalSeconds));
      const nextRefreshIntervalMs = toRefreshMs(String(payload.config.refreshIntervalMinutes));
      const refreshChanged = nextRefreshIntervalMs !== refreshIntervalMs;

      slideIntervalMs = nextSlideIntervalMs;
      refreshIntervalMs = nextRefreshIntervalMs;

      if (refreshChanged) {
        startRefreshLoop();
      }
    }

    render();
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'Unable to refresh benefits';
    render();
  }
}

function startAutoAdvance() {
  if (autoTimer) {
    clearInterval(autoTimer);
  }

  autoTimer = setInterval(() => {
    if (!state.pages.length) {
      return;
    }

    const now = Date.now();
    if (!canAutoAdvance(state.lastInteractionAt, now, interactionPauseMs)) {
      render();
      return;
    }

    if (now - state.lastAdvanceAt >= slideIntervalMs) {
      nextPage(false);
      return;
    }

    render();
  }, 1_000);
}

function startRefreshLoop() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(() => {
    refreshBenefits();
  }, refreshIntervalMs);
}

renderEmpty('Indlæser medlemsfordele...');
refreshBenefits();
startAutoAdvance();
startRefreshLoop();
