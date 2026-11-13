'use strict';
/**
 * Auditoría portátil sin dependencias de Three/Angular.
 * Comprueba contrato fuente y topología del mallado indexado de 38.2o.e7b.
 * La evaluación WebGL y los tests Vitest se realizan en el proyecto.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const moduleSource = fs.readFileSync(path.join(root, 'src/app/presentation/life-species-visual/vida38-reptilian-organic-garments-38-2oe7b.ts'), 'utf8');
const rendererSource = fs.readFileSync(path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe7b.spec.ts'), 'utf8');

for (const value of [
  'createVida38ReptilianSoftShell38OE7B',
  'createVida38ReptilianOrganicGarments38OE7B',
  'deriveVida38OrganicGarmentPlan38OE7B',
  'rearTailOpening: true',
  'closedThickness: true',
  'insideTailOpening',
  "'NOBLE_MANTLE'", "'COLONIAL_OVERCOAT'", "'PELAGIC_VEIL'", "'TECHNO_HABIT'", "'PRIEST_TUNIC'",
  "garmentGeomKind38OE7'] = 'CONTINUOUS_360_THICK_SHELL'",
]) assert.ok(moduleSource.includes(value), `Falta el contrato ${value}`);
for (const value of [
  'addOrganicSoftGarments38OE7B',
  'createVida38ReptilianOrganicGarments38OE7B',
  "case 'CEREMONIAL_ROBES'", "case 'NOBLE_REGALIA'", "case 'PELAGIC_DRAPE'",
  "case 'SEGMENTED_ARMOR'", "addVeryAdvancedSuit38OD5",
]) assert.ok(rendererSource.includes(value), `Falta la integración ${value}`);
assert.ok(tests.includes('deja libre el centro de la salida de cola'));
assert.ok(tests.includes('integra el hábito orgánico'));
assert.ok(!moduleSource.includes('Math.random('));

// Verificación geométrica sin Three: reproduce el grafo de caras con dos pieles
// y paredes perimetrales, incluyendo el orificio elíptico de la raíz caudal.
const n = 72, rows = 45, legLength = 0.94, hem = 0.45, top = 1.74;
const waistWidth = 0.32;
const tailHalfAngle = Math.max(0.45, Math.min(0.78, Math.atan2(0.20, waistWidth)));
const tailCenter = legLength - 0.025;
const tailHeight = Math.min(0.23, legLength * 0.33);
const vertex = (r, c, inner) => (r * n + (c + n) % n) * 2 + inner;
const hole = (r, c) => {
  const y = hem + (top - hem) * r / rows;
  const angle = c / n * 2 * Math.PI;
  const da = Math.atan2(Math.sin(angle - Math.PI), Math.cos(angle - Math.PI));
  return (da / tailHalfAngle) ** 2 + ((y - tailCenter) / tailHeight) ** 2 < 1;
};
const faces = [], edges = new Map();
const edgeKey = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
const face = (a, b, c) => {
  faces.push([a, b, c], [c + 1, b + 1, a + 1]);
  for (const [u, v] of [[a, b], [b, c], [c, a]]) {
    const key = edgeKey(u, v);
    const entry = edges.get(key);
    if (entry) entry.count++;
    else edges.set(key, { count: 1, a: u, b: v });
  }
};
let cutCells = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < n; c++) {
    const d = (c + 1) % n;
    if ([hole(r, c), hole(r, d), hole(r + 1, c), hole(r + 1, d)].some(Boolean)) {
      cutCells++; continue;
    }
    const a = vertex(r, c, 0), b = vertex(r, d, 0);
    const cTop = vertex(r + 1, c, 0), dTop = vertex(r + 1, d, 0);
    face(a, b, cTop); face(b, dTop, cTop);
  }
}
for (const edge of edges.values()) {
  if (edge.count === 1) faces.push([edge.a, edge.a + 1, edge.b], [edge.b, edge.a + 1, edge.b + 1]);
}
const incidences = new Map();
for (const [a, b, c] of faces) {
  for (const [u, v] of [[a, b], [b, c], [c, a]]) {
    const key = edgeKey(u, v);
    incidences.set(key, (incidences.get(key) || 0) + 1);
  }
}
let exposedEdges = 0, nonManifoldEdges = 0;
for (const count of incidences.values()) {
  if (count === 1) exposedEdges++;
  else if (count !== 2) nonManifoldEdges++;
}
assert.ok(cutCells > 30, 'La abertura para la cola debe tener una extensión real');
assert.equal(exposedEdges, 0, 'Se han detectado aristas abiertas');
assert.equal(nonManifoldEdges, 0, 'La topología presenta aristas no-manifold');
console.log(`GENESIS_38_2OE7B_AUDIT_OK: ${faces.length} triángulos, ${cutCells} celdas recortadas, 0 aristas abiertas, 0 aristas no-manifold`);
