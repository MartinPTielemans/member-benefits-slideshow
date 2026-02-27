import test from 'node:test';
import assert from 'node:assert/strict';

import { BRAND_THEME } from '../lib/theme.js';

test('brand theme matches Studentersamfundet primary palette and typography', () => {
  assert.equal(BRAND_THEME.colors.primaryGreen, '#145014');
  assert.equal(BRAND_THEME.colors.cream, '#FFFAF1');
  assert.equal(BRAND_THEME.colors.textDark, '#333230');
  assert.equal(BRAND_THEME.fonts.brand, 'Days One');
  assert.equal(BRAND_THEME.fonts.ui, 'Poppins');
  assert.equal(BRAND_THEME.logoPath, '/assets/studentersamfundet-logo.png');
});
