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

test('parseBenefitsHtml excludes all benefits under group-only section', () => {
  const html = `
    <h2>Studentersamfundets medlemsfordele</h2>
    <h3>Gyldig individuel fordel A</h3>
    <p>Denne fordel er for individuelle medlemmer og har nok tekst til at blive vist korrekt.</p>
    <a href="/gyldig-a">Læs mere</a>
    <h2>Fordele for grupper og foreninger</h2>
    <h3>Bella Italia AAU</h3>
    <p>Kun for grupper og organisationer under Studentersamfundet.</p>
    <a href="/bella">Læs mere</a>
    <h3>Ekstra gruppetilbud</h3>
    <p>Dette tilbud gælder kun interne grupper under Studentersamfundet og ikke individuelle medlemmer.</p>
    <a href="/gruppe">Læs mere</a>
    <h2>Ekstra medlemsfordele</h2>
    <h3>Gyldig individuel fordel B</h3>
    <p>Også en gyldig fordel for individuelle medlemmer med en tydelig nok beskrivelse.</p>
    <a href="/gyldig-b">Læs mere</a>
  `;

  const items = parseBenefitsHtml(html, 'https://www.studentersamfundet.dk/medlemsfordele');

  assert.equal(items.length, 2);
  assert.equal(items[0].title, 'Gyldig individuel fordel A');
  assert.equal(items[1].title, 'Gyldig individuel fordel B');
});

test('parseBenefitsHtml keeps full description across multiple paragraphs', () => {
  const html = `
    <h3>Aalborg Pirates</h3>
    <p>Få 70% besparelse på</p>
    <p>oprettelsgebyr for sæsonkort.</p>
    <p>Rabatten kan findes på medlemssiden.</p>
    <a href="/aalborg-pirates">Læs mere</a>
  `;

  const items = parseBenefitsHtml(html, 'https://www.studentersamfundet.dk/medlemsfordele');

  assert.equal(items.length, 1);
  assert.equal(
    items[0].description,
    'Få 70% besparelse på oprettelsgebyr for sæsonkort. Rabatten kan findes på medlemssiden.'
  );
});
