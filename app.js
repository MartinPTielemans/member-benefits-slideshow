import {
  getNextIndex,
  getPrevIndex,
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
  currentIndex: 0,
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
        <h1>Member Benefits</h1>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

function render() {
  if (!state.items.length) {
    renderEmpty(state.error || 'No benefits available right now.');
    return;
  }

  const item = state.items[state.currentIndex];
  const imageStyle = item.image
    ? `style="background-image: url('${escapeHtml(item.image)}')"`
    : '';
  const safeTitle = escapeHtml(item.title);
  const safeDescription = escapeHtml(item.description);
  const safeLink = item.link ? escapeHtml(item.link) : '';

  app.innerHTML = `
    <section class="slide" id="slide">
      <div class="slide-copy">
        <p class="slide-index">Benefit ${state.currentIndex + 1} of ${state.items.length}</p>
        <h1>${safeTitle}</h1>
        <p>${safeDescription}</p>
        ${item.link ? `<a href="${safeLink}" target="_blank" rel="noreferrer">Open Offer</a>` : ''}
      </div>
      <div class="slide-media" ${imageStyle}></div>
    </section>

    <section class="controls">
      <button type="button" id="prev" aria-label="Previous slide">‹</button>
      <div class="status"><div class="status-progress" style="width:${getProgressPercent()}%"></div></div>
      <button type="button" id="next" aria-label="Next slide">›</button>
    </section>

    <section class="footer">
      <span>Last updated: ${formatTime(state.updatedAt)} ${state.stale ? '(cached)' : ''}</span>
      <span class="${state.error ? 'error' : ''}">${state.error || 'Live sync active'}</span>
    </section>
  `;

  attachInteractionHandlers();
}

function markInteraction() {
  state.lastInteractionAt = Date.now();
}

function nextSlide(userInitiated = false) {
  if (!state.items.length) {
    return;
  }

  state.currentIndex = getNextIndex(state.currentIndex, state.items.length);
  if (userInitiated) {
    markInteraction();
  }
  state.lastAdvanceAt = Date.now();
  render();
}

function prevSlide(userInitiated = false) {
  if (!state.items.length) {
    return;
  }

  state.currentIndex = getPrevIndex(state.currentIndex, state.items.length);
  if (userInitiated) {
    markInteraction();
  }
  state.lastAdvanceAt = Date.now();
  render();
}

function attachInteractionHandlers() {
  const prevButton = document.querySelector('#prev');
  const nextButton = document.querySelector('#next');
  const slide = document.querySelector('#slide');

  prevButton?.addEventListener('click', () => prevSlide(true));
  nextButton?.addEventListener('click', () => nextSlide(true));

  if (!slide) {
    return;
  }

  let touchStartX = 0;
  slide.addEventListener(
    'touchstart',
    (event) => {
      touchStartX = event.touches[0].clientX;
    },
    { passive: true }
  );

  slide.addEventListener(
    'touchend',
    (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) < 35) {
        return;
      }

      if (deltaX < 0) {
        nextSlide(true);
      } else {
        prevSlide(true);
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
    state.currentIndex = Math.min(state.currentIndex, state.items.length - 1);
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
    if (!state.items.length) {
      return;
    }

    const now = Date.now();
    if (!canAutoAdvance(state.lastInteractionAt, now, interactionPauseMs)) {
      render();
      return;
    }

    if (now - state.lastAdvanceAt >= slideIntervalMs) {
      nextSlide(false);
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

renderEmpty('Loading benefits...');
refreshBenefits();
startAutoAdvance();
startRefreshLoop();
