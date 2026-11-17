// VISCIV.6i.a — portable geometry-parameter sanity check (no browser/Three.js required).
// Full bounds are verified separately by the Vitest spec using THREE.Box3.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname,
  '../src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts'), 'utf8');

const value = (text) => {
  const match = source.match(new RegExp(text));
  assert.ok(match, `Missing VISCIV.6i.a geometry range: ${text}`);
  return match[1].split(',').map(s => Number(s.trim()));
};
const industrial = value(String.raw`\? \[(-0\.14, -0\.05, 0\.05, 0\.14)\]`);
const habitat = value(String.raw`\? \[(-0\.115, -0\.035, 0\.035, 0\.115)\]`);
const transport = value(String.raw`: \[(-0\.085, 0, 0\.085)\]`);
for (const [kind, levels, minimum] of [
  ['HABITAT', habitat, 0.20],
  ['INDUSTRIAL', industrial, 0.24],
  ['TRANSPORT', transport, 0.12],
]) {
  const span = Math.max(...levels) - Math.min(...levels);
  assert.ok(span > minimum, `${kind}: vertical deck range ${span.toFixed(3)} must exceed ${minimum}`);
}
assert.ok(source.includes('VISCIV6ia interdeck structural pylons'));
assert.ok(source.includes('height: deckSpan + beamThickness * 0.45'));
console.log('VISCIV.6i.a — PASS: vertical deck spans and instanced structural pylons');
