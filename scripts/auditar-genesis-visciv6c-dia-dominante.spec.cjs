'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const shader = fs.readFileSync(path.join(process.cwd(), 'src/app/presentation/system/system-scene-atmosphere-material.ts'), 'utf8');
assert.match(shader, /float genesisDominantStarDayFactor = genesisDayFactor0;/);
assert.match(shader, /genesisWeight1 > genesisWeight0 && genesisWeight1 >= genesisWeight2/);
assert.match(shader, /genesisDominantStarDayFactor = genesisDayFactor2;/);
assert.match(shader, /smoothstep\(0\.25, 0\.55, genesisDominantStarDayFactor\)/);
assert.match(shader, /smoothstep\(0\.16, 0\.28, genesisDayFactor\)/);
assert.match(shader, /smoothstep\(0\.70, 0\.92, genesisDayFactor\)/);
assert.doesNotMatch(shader, /genesisPeakDayFactor/);

const smoothstep = (left, right, value) => {
  const t = Math.max(0, Math.min(1, (value - left) / (right - left)));
  return t * t * (3 - 2 * t);
};
function visibility(incidence, weights) {
  const day = Math.max(0, Math.min(1, incidence.reduce((sum, value, i) => sum + value * weights[i], 0)));
  let strongest = 0;
  if (weights[1] > weights[0] && weights[1] >= weights[2]) strongest = 1;
  else if (weights[2] > weights[0] && weights[2] > weights[1]) strongest = 2;
  const deepNight = 1 - smoothstep(0.05, 0.16, day);
  const penumbra = smoothstep(0.16, 0.28, day) * (1 - smoothstep(0.70, 0.92, day));
  const suppress = smoothstep(0.25, 0.55, incidence[strongest]);
  return Math.max(0, Math.min(1, deepNight + 0.22 * penumbra * (1 - suppress)));
}

assert.equal(visibility([1, 0.05, 0], [0.52, 0.48, 0]), 0, 'día principal binario, apagado');
assert.ok(visibility([0.08, 1, 0], [0.52, 0.48, 0]) > 0.1, 'penumbra secundaria, tenue');
assert.equal(visibility([0, 0, 0], [0.52, 0.48, 0]), 1, 'noche, brillo normal');
assert.equal(visibility([0.1, 1, 0.1], [0.25, 0.6, 0.15]), 0, 'dominante en segunda posición');
assert.ok(visibility([0.95, 0, 0.8], [0.25, 0.6, 0.15]) > 0.1, 'secundarias con dominante oculta');
assert.equal(visibility([1, 0, 0], [1, 0, 0]), 0, 'día fuerte de estrella única');
console.log('VISCIV6C_DOMINANT_STAR_DAYLIGHT_PASSED (6 casos + GLSL)');
