import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../style.css', import.meta.url), 'utf8');
const appel = css.match(/\.page-body a\[href\^="#ref-"\]\s*\{([^}]+)\}/)?.[1];

test('appels bibliographiques : taille réduite avec minimum lisible et exposant', () => {
  assert.ok(appel, 'style limité aux liens de référence dans le corps');
  assert.match(appel, /font-size:\s*max\(\.75rem,\s*\.72em\)/);
  assert.match(appel, /vertical-align:\s*super/);
  assert.match(appel, /line-height:\s*0/);
  assert.match(appel, /white-space:\s*nowrap/);
});

test('appels bibliographiques : liens, contraste et focus restent disponibles', () => {
  assert.doesNotMatch(appel, /pointer-events|visibility|display|opacity|color\s*:|outline\s*:/);
  assert.match(css, /:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--focus\)/);
  assert.match(css, /a:hover\s*\{\s*text-decoration:\s*underline/);
});
