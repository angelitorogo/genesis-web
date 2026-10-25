'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');
const { spawnSync } = require('node:child_process');

const productionVerifier = join(__dirname, 'verify-architecture.mjs');

function executeFixture(files = {}, missingLayer = null) {
  const root = mkdtempSync(join(tmpdir(), 'genesis-architecture-boundary-'));
  try {
    for (const layer of ['domain', 'simulation', 'observation', 'data/local', 'presentation', 'ui']) {
      if (layer !== missingLayer) {
        mkdirSync(join(root, 'src/app', layer), { recursive: true });
      }
    }
    mkdirSync(join(root, 'scripts'), { recursive: true });
    copyFileSync(productionVerifier, join(root, 'scripts/verify-architecture.mjs'));
    for (const [relativePath, content] of Object.entries(files)) {
      const absolutePath = join(root, relativePath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, content, 'utf8');
    }
    const result = spawnSync(process.execPath, [join(root, 'scripts/verify-architecture.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    return { status: result.status, output: `${result.stdout}${result.stderr}` };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('PRE-33.01a: un spec de integración puede inspeccionar presentation y Angular', () => {
  const r = executeFixture({
    'src/app/simulation/planetary/integration.spec.ts':
      "import { x } from '../../presentation/scientific/ficha'; import { TestBed } from '@angular/core/testing'; void x; void TestBed;",
    'src/app/simulation/planetary/motor.ts':
      "import { x } from '../../domain/x'; void x;",
  });
  assert.equal(r.status, 0, r.output);
  assert.match(r.output, /GENESIS architecture verification PASSED/);
  assert.match(r.output, /Archivos spec excluidos de reglas de producción: 1/);
  assert.match(r.output, /TypeScript files checked: 1/);
});

test('PRE-33.01a: simulation de producción NO puede importar presentation', () => {
  const r = executeFixture({
    'src/app/simulation/planetary/motor.ts':
      "import { x } from '../../presentation/scientific/ficha'; void x;",
  });
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /simulation no puede depender de presentation/);
});

test('PRE-33.01a: Angular sigue prohibido en simulation de producción', () => {
  const r = executeFixture({
    'src/app/simulation/planetary/motor.ts': "import { inject } from '@angular/core'; void inject;",
  });
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /simulation no puede depender de Angular/);
});

test('PRE-33.01a: domain sigue sin poder importar simulation', () => {
  const r = executeFixture({
    'src/app/domain/planetary/body.ts': "import { resolve } from '../../simulation/planetary/motor'; void resolve;",
  });
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /domain no puede depender de simulation/);
});

test('PRE-33.01a: no se exime un archivo de producción terminado en .test.ts', () => {
  const r = executeFixture({
    'src/app/simulation/planetary/broken.test.ts': "import { x } from '../../presentation/ficha'; void x;",
  });
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /simulation no puede depender de presentation/);
});

test('PRE-33.01a: presentación puede consultar simulation', () => {
  const r = executeFixture({
    'src/app/presentation/scientific/ficha.ts': "import { x } from '../../simulation/planetary/motor'; void x;",
  });
  assert.equal(r.status, 0, r.output);
});

test('PRE-33.01a: capas obligatorias siguen siendo obligatorias', () => {
  const r = executeFixture({}, 'observation');
  assert.equal(r.status, 1, r.output);
  assert.match(r.output, /Falta la capa obligatoria: observation/);
});
