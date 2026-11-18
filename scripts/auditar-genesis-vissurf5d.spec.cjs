/** Portable, deterministic VISSURF.5d audit. No WebGL or browser needed. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const system = path.join(root, 'src/app/presentation/system');
const scene = fs.readFileSync(path.join(system, 'system-scene.ts'), 'utf8');
const integrationCount = (scene.match(/composeSolidPlanetMaterialsVISSURF5d\(/g) || []).length;
assert.equal(integrationCount, 2, 'VISSURF.5d debe conectarse a generación inicial y LOD de sistema');
for (const required of [
  'buildCoherentSolidPlanetSurfaceVISSURF5(',
  'calibrateSolidRoughnessForRendererVISSURF5c(',
  'installSystemSceneDayNightMaterialV1(',
  'installOrbitalSurfaceShadowVISCIV6n(',
  'cloudLayerMeshOrNull(',
  'atmosphereLayerMeshOrNull(',
]) assert.ok(scene.includes(required), `Falta el contrato: ${required}`);

for (const name of [
  'system-scene-planet-material-composition-vissurf5d.ts',
  'system-scene-planet-material-composition-vissurf5d.spec.ts',
  'system-scene.ts',
]) {
  const filename = path.join(system, name);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  });
  const errors = output.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error) ?? [];
  assert.equal(errors.length, 0, `Errores sintácticos en ${name}`);
}

// Transpiles only the pure TS atlas pipeline, never Angular components.
Module._extensions['.ts'] = (module, filename) => {
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  module._compile(code, filename);
};
const { buildCoherentSolidPlanetSurfaceVISSURF5 } = require(path.join(system, 'system-scene-planet-coherent-geography-vissurf5.ts'));
const { composeSolidPlanetMaterialsVISSURF5d } = require(path.join(system, 'system-scene-planet-material-composition-vissurf5d.ts'));

function fixture() {
  const width = 128;
  const height = 64;
  const surfaceClassMask = new Uint8Array(width * height);
  const rgba = new Uint8Array(width * height * 4);
  const reliefRgba = new Uint8Array(rgba.length);
  const roughnessRgba = new Uint8Array(rgba.length);
  const colors = { 1: [18, 68, 166], 2: [220, 227, 231], 3: [121, 111, 101],
    4: [188, 145, 93], 5: [61, 103, 171], 6: [92, 79, 71] };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1);
      const v = y / height;
      const coast = 0.33 + 0.09 * Math.sin(u * 10);
      const kind = v < 0.08 ? 2 : v < coast ? 1 : v < 0.57 ? 5 : v < 0.77 ? 4 : v < 0.89 ? 3 : 6;
      const i = y * width + x;
      surfaceClassMask[i] = kind;
      rgba.set([...colors[kind], 255], i * 4);
      const rough = kind === 1 ? 112 : 186;
      roughnessRgba.set([rough, rough, rough, 255], i * 4);
      const relief = kind === 1 ? 96 : 130;
      reliefRgba.set([relief, relief, relief, 255], i * 4);
    }
    const i = y * width;
    surfaceClassMask[i + width - 1] = surfaceClassMask[i];
    for (const map of [rgba, reliefRgba, roughnessRgba]) {
      map.set(map.subarray(i * 4, i * 4 + 4), (i + width - 1) * 4);
    }
  }
  return { width, height, surfaceClassMask, rgba, roughnessRgba, reliefRgba };
}

let measurements = [];
for (const seed of [0x17e9bc41, 0x8c52ad17, 0x914c27e1]) {
  const source = fixture();
  const frozenClass = new Uint8Array(source.surfaceClassMask);
  const frozenColor = new Uint8Array(source.rgba);
  const atlas = buildCoherentSolidPlanetSurfaceVISSURF5(source, 512, seed);
  const originalClass = new Uint8Array(atlas.classMask);
  const originalColor = new Uint8Array(atlas.rgba);
  const originalHeight = new Uint8Array(atlas.reliefRgba);
  const refined = composeSolidPlanetMaterialsVISSURF5d(atlas, seed);
  assert.deepEqual(source.surfaceClassMask, frozenClass);
  assert.deepEqual(source.rgba, frozenColor);
  assert.deepEqual(refined.classMask, originalClass);
  assert.deepEqual(refined.reliefRgba, originalHeight);
  assert.notDeepEqual(refined.rgba, originalColor);
  for (const y of [0, 41, 131, 255]) {
    const first = y * 512 * 4;
    const last = (y * 512 + 511) * 4;
    for (const map of [refined.rgba, refined.normalRgba, refined.roughnessRgba]) {
      assert.deepEqual(map.slice(first, first + 4), map.slice(last, last + 4));
    }
  }
  let before = 0;
  let after = 0;
  let boundaries = 0;
  for (let y = 4; y < 252; y++) {
    for (let x = 2; x < 510; x++) {
      const i = y * 512 + x;
      const j = i + 1;
      const a = refined.classMask[i];
      const b = refined.classMask[j];
      if (a === b || a < 3 || b < 3) continue;
      boundaries++;
      for (let c = 0; c < 3; c++) {
        before += Math.abs(originalColor[i * 4 + c] - originalColor[j * 4 + c]);
        after += Math.abs(refined.rgba[i * 4 + c] - refined.rgba[j * 4 + c]);
      }
    }
  }
  assert.ok(boundaries > 40, 'La muestra debe contener fronteras terrestres');
  assert.ok(after < before * 0.84, 'Las fronteras terrestres deben reducir saltos de pigmentación');
  const sameSource = buildCoherentSolidPlanetSurfaceVISSURF5(source, 512, seed);
  const repeated = composeSolidPlanetMaterialsVISSURF5d(sameSource, seed);
  assert.deepEqual(repeated.rgba, refined.rgba);
  measurements.push(`${seed.toString(16)}: ${boundaries} fronteras, reducción ${(100 * (1 - after / before)).toFixed(1)} %`);
}
console.log('VISSURF.5d: PASS — máscaras, relieves, biomas, continuidad, determinismo e integración');
console.log('Detalles:', measurements.join(' · '));
