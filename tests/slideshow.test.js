import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getNextIndex,
  getPrevIndex,
  canAutoAdvance,
  toIntervalMs,
  toRefreshMs
} from '../lib/slideshow.js';

test('getNextIndex wraps at the end', () => {
  assert.equal(getNextIndex(0, 5), 1);
  assert.equal(getNextIndex(4, 5), 0);
});

test('getPrevIndex wraps at the beginning', () => {
  assert.equal(getPrevIndex(0, 5), 4);
  assert.equal(getPrevIndex(3, 5), 2);
});

test('canAutoAdvance pauses briefly after interaction', () => {
  const pauseMs = 12_000;

  assert.equal(canAutoAdvance(1_000, 5_000, pauseMs), false);
  assert.equal(canAutoAdvance(1_000, 13_001, pauseMs), true);
  assert.equal(canAutoAdvance(null, 2_000, pauseMs), true);
});

test('interval parsers apply defaults and minimums', () => {
  assert.equal(toIntervalMs('10'), 10_000);
  assert.equal(toIntervalMs('0'), 3_000);
  assert.equal(toIntervalMs('abc'), 10_000);

  assert.equal(toRefreshMs('20'), 1_200_000);
  assert.equal(toRefreshMs('0'), 300_000);
  assert.equal(toRefreshMs('abc'), 1_200_000);
});
