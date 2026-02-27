import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { parseBenefitsHtml } from '../lib/benefits.js';

const fixturePath = new URL('./fixtures/medlemsfordele.sample.html', import.meta.url);

test('parseBenefitsHtml extracts benefit cards', async () => {
  const html = await readFile(fixturePath, 'utf8');
  const items = parseBenefitsHtml(html, 'https://www.studentersamfundet.dk/medlemsfordele');

  assert.equal(items.length, 5);
  assert.deepEqual(items[0], {
    id: '10-paa-yousee-musik',
    title: '10% på YouSee Musik',
    description: 'Få 10% rabat på YouSee Musik i op til 6 måneder efter oprettelsen.',
    link: 'https://example.com/yousee',
    image: 'https://www.studentersamfundet.dk/media/yousee.jpg'
  });
  assert.equal(items[2].title, '50% hos IHA');
  assert.equal(items[2].link, 'https://www.studentersamfundet.dk/iha');
});

test('parseBenefitsHtml skips sections without links and weak descriptions', () => {
  const html = `
    <h3>Tilfældig side overskrift</h3>
    <p>Kort.</p>
    <h3>God fordel</h3>
    <p>Dette er en valid beskrivelse med nok længde til at blive vist på sliden.</p>
    <a href="/fordel">Læs mere</a>
  `;

  const items = parseBenefitsHtml(html, 'https://www.studentersamfundet.dk/medlemsfordele');

  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'God fordel');
});
