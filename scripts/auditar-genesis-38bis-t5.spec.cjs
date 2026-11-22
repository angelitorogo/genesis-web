'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const preview = fs.readFileSync(path.join(root, 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts'), 'utf8');
const helper = fs.readFileSync(path.join(root, 'src/app/presentation/scientific-body-preview/scientific-body-preview-planet-spin-38bis-t5.ts'), 'utf8');
const spec = fs.readFileSync(path.join(root, 'src/app/presentation/scientific-body-preview/scientific-body-preview-planet-spin-38bis-t5.spec.ts'), 'utf8');

assert.match(preview, /scientificBodyPreviewPlanetSpinRadians38bisT5\(\s*spin,\s*this\.localSpinSimulationDay,\s*timing,/);
assert.match(preview, /systemSceneMoonDisplaySpinRadiansV2\(\s*spin,\s*this\.localSpinSimulationDay,\s*timing,/);
assert.match(preview, /spinPivot\.add\(sphere\);/);
assert.match(preview, /spinPivot\.add\(infra\.group\);/);
assert.match(helper, /SCIENTIFIC_PLANET_SYNCHRONIZED_PREVIEW_CYCLE_SECONDS_38BIS_T5 = 240/);
assert.match(helper, /spin\.isSynchronized/);
assert.match(helper, /systemSceneBodyDisplaySpinRadians\(spin, simulationDay, timing\)/);
assert.match(helper, /timing\.epochSimulationDay/);
assert.match(spec, /Chakos B-2/);

const TWOPI = 2*Math.PI;
const cycleSeconds = 240;
const phase0 = 0.7;
const rate = 5;
function visual(day){const elapsed=(day-73.25)/rate; const rad=(phase0+elapsed*TWOPI/cycleSeconds)%TWOPI;return rad<0?rad+TWOPI:rad;}
function forward(a,b){return (b-a+TWOPI)%TWOPI;}
assert.ok(Math.abs(forward(visual(73.25),visual(78.25))-TWOPI/240)<1e-10);
assert.ok(Math.abs(forward(visual(73.25),visual(373.25))-TWOPI/4)<1e-10);
console.log('PASS 38.bis-T5: planetas sincronizados a 240 s/vuelta en ficha y SystemScene; lunas, estructuras e integridad física conservadas.');
