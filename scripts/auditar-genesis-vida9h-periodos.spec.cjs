'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const base = path.join(process.cwd(), 'src', 'app', 'presentation', 'galaxy-knowledge-catalog');
const unitSource = fs.readFileSync(path.join(base, 'galaxy-knowledge-catalog-units.ts'), 'utf8');
const catalogueSource = fs.readFileSync(path.join(base, 'galaxy-knowledge-planets-moons-catalog.data-source.ts'), 'utf8');
const js = ts.transpileModule(unitSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const moduleRef = { exports: {} };
new Function('module', 'exports', js)(moduleRef, moduleRef.exports);
const format = moduleRef.exports.formatCatalogOrbitalPeriodDays;

function reconstruct(label) {
  const year = /([\d.]+) años?/.exec(label);
  const month = /(\d+) mes(?:es)?/.exec(label);
  const day = /(\d+) días?/.exec(label);
  const number = v => Number(v.replaceAll('.', ''));
  return (year ? number(year[1]) * 365 : 0)
    + (month ? Math.round(Number(month[1]) * 365 / 12) : 0)
    + (day ? Number(day[1]) : 0);
}

test('meses y años en español sin decimales ni referencias a la simulación', () => {
  for (const [value, expected] of [
    [5.52, '6 días'], [29, '29 días'], [30, '1 mes'], [31, '1 mes y 1 día'],
    [61, '2 meses'], [260, '8 meses y 17 días'], [365, '1 año'],
    [480, '1 año, 3 meses y 24 días'], [760, '2 años y 1 mes'],
    [89_620_014, '245.534 años, 3 meses y 13 días'],
  ]) {
    assert.equal(format(value), expected, `Días iniciales: ${value}`);
    assert.doesNotMatch(expected, /CT-0|V\d|motor|[\d],[\d]/);
  }
});

test('desglose reversible y no negativo en los primeros 5.000 días', () => {
  for (let days = 1; days <= 5000; days++) {
    const label = format(days);
    assert.ok(label && !label.includes(',0') && !label.includes('0 días y'));
    assert.equal(reconstruct(label), days, `Días: ${days}; texto: ${label}`);
  }
});

test('la misma función formatea planeta y luna; la ordenación es numérica y sin redondeos', () => {
  assert.equal((catalogueSource.match(/period: formatCatalogOrbitalPeriodDays\(record\.orbitalPeriodDays\)/g) || []).length, 2);
  assert.equal((catalogueSource.match(/case 'period': return compareNullableNumber\(left\.orbitalPeriodDays, right\.orbitalPeriodDays\);/g) || []).length, 2);
  assert.equal(format(null), undefined);
  assert.equal(format(0.25), '< 1 día');
  assert.equal(format(0), '0 días');
});
