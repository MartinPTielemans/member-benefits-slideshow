export function getNextIndex(currentIndex, itemCount) {
  if (itemCount <= 0) {
    return 0;
  }

  return (currentIndex + 1) % itemCount;
}

export function getPrevIndex(currentIndex, itemCount) {
  if (itemCount <= 0) {
    return 0;
  }

  return (currentIndex - 1 + itemCount) % itemCount;
}

export function paginateItems(items, pageSize = 4) {
  const safeSize = Math.max(1, Number.parseInt(String(pageSize), 10) || 4);
  const pages = [];

  for (let i = 0; i < items.length; i += safeSize) {
    pages.push(items.slice(i, i + safeSize));
  }

  return pages;
}

export function canAutoAdvance(lastInteractionAt, now, pauseMs) {
  if (lastInteractionAt == null) {
    return true;
  }

  return now - lastInteractionAt >= pauseMs;
}

export function toIntervalMs(rawSeconds) {
  const parsed = Number.parseInt(rawSeconds ?? '', 10);
  const seconds = Number.isFinite(parsed) ? parsed : 10;
  return Math.max(3, seconds) * 1_000;
}

export function toRefreshMs(rawMinutes) {
  const parsed = Number.parseInt(rawMinutes ?? '', 10);
  const minutes = Number.isFinite(parsed) ? parsed : 20;
  return Math.max(5, minutes) * 60_000;
}
