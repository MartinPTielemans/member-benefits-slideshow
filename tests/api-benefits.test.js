import test from 'node:test';
import assert from 'node:assert/strict';

import { loadBenefits, SOURCE_URL } from '../api/benefits.js';
import { clearCachedBenefits } from '../lib/cache.js';

const sampleHtml = `
  <h3>10% på YouSee Musik</h3>
  <p>Få 10% rabat på YouSee Musik i op til 6 måneder efter oprettelsen.</p>
  <a href="https://example.com/yousee">Benyt fordel</a>
`;

test('loadBenefits returns normalized live payload', async () => {
  clearCachedBenefits();

  const payload = await loadBenefits({
    fetchImpl: async () => ({
      ok: true,
      text: async () => sampleHtml
    }),
    now: () => 1710000000000
  });

  assert.equal(payload.sourceUrl, SOURCE_URL);
  assert.equal(payload.stale, false);
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].title, '10% på YouSee Musik');
  assert.equal(payload.updatedAt, '2024-03-09T16:00:00.000Z');
});

test('loadBenefits returns stale cached payload when upstream fails', async () => {
  clearCachedBenefits();

  await loadBenefits({
    fetchImpl: async () => ({
      ok: true,
      text: async () => sampleHtml
    }),
    now: () => 1710000000000
  });

  const payload = await loadBenefits({
    fetchImpl: async () => {
      throw new Error('network down');
    },
    now: () => 1710000001000
  });

  assert.equal(payload.stale, true);
  assert.equal(payload.items.length, 1);
  assert.equal(payload.updatedAt, '2024-03-09T16:00:00.000Z');
});

test('loadBenefits throws when upstream fails and cache is empty', async () => {
  clearCachedBenefits();

  await assert.rejects(
    () =>
      loadBenefits({
        fetchImpl: async () => {
          throw new Error('offline');
        }
      }),
    /offline/
  );
});
