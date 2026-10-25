'use strict';
const { test } = require('node:test');
const { strict: assert } = require('node:assert');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
test('nueva seed: V3 automatica sin selector y con ruta V3 publica', () => {
  assert.match(execFileSync(process.execPath, [join(__dirname, 'verificar-genesis-pre33-v3-por-defecto.cjs')], { encoding: 'utf8' }), /^PASS PRE33 V3 automatic:/);
});
test('regresion E2E crea V3 y reabre con el boton ordinario', () => {
  const e2e = readFileSync(join(root, 'e2e/v3-first-universe.spec.ts'), 'utf8');
  assert.match(e2e, /getByTestId\('universe-seed-apply-button'\)\.click\(\)/);
  assert.match(e2e, /page\.reload\(\)/);
  assert.match(e2e, /universe-active-version'\)\)\.toContainText\('V3'\)/);
});
