import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

const requiredFiles = [
  'package.json',
  '.gitignore',
  'index.html',
  'styles.css',
  'app.js',
  'vercel.json'
];

test('project scaffold files exist', async () => {
  for (const file of requiredFiles) {
    await assert.doesNotReject(() => access(new URL(`../${file}`, import.meta.url)));
  }
});
