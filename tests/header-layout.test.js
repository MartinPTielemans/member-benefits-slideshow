import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appPath = new URL('../app.js', import.meta.url);
const cssPath = new URL('../styles.css', import.meta.url);

test('header uses inline logo + full-width tagline layout', async () => {
  const [appJs, css] = await Promise.all([
    readFile(appPath, 'utf8'),
    readFile(cssPath, 'utf8')
  ]);

  assert.match(appJs, /class="brand-banner"/);
  assert.match(css, /\.brand-banner\s*\{/);
  assert.match(css, /grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /\.brand-tagline\s*\{/);
});
