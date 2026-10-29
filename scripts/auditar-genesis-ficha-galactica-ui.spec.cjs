'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const template = fs.readFileSync(
  path.join(projectRoot, 'src/app/presentation/galaxy-detail/galaxy-detail.html'),
  'utf8',
);
const unitTest = fs.readFileSync(
  path.join(projectRoot, 'src/app/presentation/galaxy-detail/galaxy-detail.spec.ts'),
  'utf8',
);
const navigationE2e = fs.readFileSync(path.join(projectRoot, 'e2e/app-navigation.spec.ts'), 'utf8');

test('la ficha galáctica no exhibe identificadores ni referencias de desarrollo', () => {
  for (const marker of [
    /26\.1\s*·\s*V2/i,
    /26\.1b/i,
    /28\.1\s*\//i,
    /27\.7/i,
    /GEN-V\d+-/i,
    /designationCode/,
    /CAPA\s+0[34]/i,
    /\bDISCOVERY STATE\b/,
    /\bIDENTIDAD PROCEDURAL\b/,
    /Ground Truth/i,
    /\bDiscoveryState\b/,
    /\bseeds\b/i,
    /DETECTED\s*→\s*DISCOVERED/,
    /DISCOVERED\s*→\s*VISITED/,
    /VISITED\s*→\s*CATALOGUED/,
    /CATALOGUED\s*→\s*CONFIRMED/,
  ]) {
    assert.doesNotMatch(template, marker, `Texto interno visible: ${marker}`);
  }
  assert.doesNotMatch(template, /data-testid="galaxy-detail-designation"/);
  assert.doesNotMatch(template, /data-testid="galaxy-detail-boundary"/);
});

test('se conservan las secciones científicas y el inventario de exploración', () => {
  for (const heading of [
    'SECCIÓN 03 · FÍSICA',
    'SECCIÓN 04 · ESTRUCTURA',
    'SECCIÓN 04 · NÚCLEO',
    'OBSERVACIÓN DEL NÚCLEO',
    'EXPLORACIÓN GALÁCTICA',
    'Inventario y exploración',
    'ESTADO CIENTÍFICO',
    'IDENTIFICACIÓN',
  ]) assert.ok(template.includes(heading), `Falta el encabezado: ${heading}`);
  for (const testId of [
    'galaxy-detail-physical-properties', 'galaxy-detail-structure',
    'galaxy-detail-nucleus', 'galaxy-detail-accretion-observation',
    'galaxy-detail-progress', 'galaxy-detail-total-sectors',
    'galaxy-detail-explored-percentage', 'galaxy-detail-known-civilizations',
  ]) assert.ok(template.includes(`data-testid="${testId}"`), `Falta la sección ${testId}`);
});

test('se conservan los bloqueos y las acciones de descubrimiento sin alterar su lógica', () => {
  for (const expression of [
    '@switch (facade.state().kind)',
    '@if (model.scientificProfile.physicalProperties; as physical)',
    '@if (model.scientificProfile.structure; as structure)',
    '@if (model.scientificProfile.nucleus; as nucleus)',
    '@if (model.accretionDiskObservation; as disk)',
    'canValidateDetection(model.scientificProfile.knowledgeState)',
    'canCatalogue(model.scientificProfile.knowledgeState)',
    'canConfirm(model.scientificProfile.knowledgeState)',
    '[disabled]="facade.focusPending()"',
    '(click)="changeFocus()"',
    '(click)="validateDetection()"',
    '(click)="catalogueGalaxy()"',
    '(click)="confirmGalaxy()"',
    '(click)="observeAccretionDisk()"',
  ]) assert.ok(template.includes(expression), `Falta condición o acción: ${expression}`);
  assert.ok(template.includes('Coste científico: {{ formatBigInt(catalogueDiscoveryPointCost) }} PD'));
  assert.ok(template.includes('Coste científico: {{ formatBigInt(confirmDiscoveryPointCost) }} PD'));
});

test('los tests unitarios y E2E reflejan el nuevo texto sin reintroducir notas internas', () => {
  assert.match(unitTest, /galaxy-detail-boundary[\s\S]{0,100}\.toBeNull\(\)/);
  assert.match(navigationE2e, /galaxy-detail-boundary[\s\S]{0,100}\.toHaveCount\(0\)/);
  assert.match(navigationE2e, /'EXPLORACIÓN GALÁCTICA'/);
  assert.match(navigationE2e, /'Esta galaxia es el foco activo'/);
});
