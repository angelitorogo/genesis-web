/* VISSURF.5b — auditoría portable no destructiva sobre el generador compartido. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const file = path.join(process.cwd(),
  'src/app/presentation/system/system-scene-planet-coherent-geography-vissurf5.ts');
const source = fs.readFileSync(file, 'utf8');
for (const forbidden of [
  'Math.abs(regional - 0.5) / 0.18',
  'Math.abs(structural - 0.22) / 0.10',
]) {
  assert.ok(!source.includes(forbidden), `No reintroducir aislíneas artificiales: ${forbidden}`);
}
for (const needed of [
  'forestProvince', 'forestDensity', 'exposedSoil', 'sediments',
  'roughness = 111 + 19 * shallow', 'materialGain',
  'averagedNeighborColorVISSURF5(',
]) {
  assert.ok(source.includes(needed), `Elemento de VISSURF.5b ausente: ${needed}`);
}

const previous = Module._extensions['.ts'];
Module._extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  assert.equal(output.diagnostics?.length ?? 0, 0, `TS inválido: ${filename}`);
  module._compile(output.outputText, filename);
};
let build;
try {
  ({ buildCoherentSolidPlanetSurfaceVISSURF5: build } = require(file));
} finally {
  if (previous) Module._extensions['.ts'] = previous;
  else delete Module._extensions['.ts'];
}

function makeInput() {
  const width = 256, height = 128;
  const rgba = new Uint8Array(width * height * 4);
  const reliefRgba = new Uint8Array(rgba.length);
  const roughnessRgba = new Uint8Array(rgba.length);
  const surfaceClassMask = new Uint8Array(width * height);
  const palette = { 1: [21, 76, 170], 2: [221, 233, 236], 3: [124, 118, 109],
    4: [173, 139, 94], 5: [148, 83, 145], 6: [87, 80, 76] };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const u = x / (width - 1), v = y / height;
      const coast = 0.37 + 0.10 * Math.sin(6 * Math.PI * u) + 0.025 * Math.sin(17 * Math.PI * u);
      const kind = v < 0.10 || v > 0.91 ? 2 : v < coast ? 1 : v < 0.55 ? 5 : v < 0.70 ? 3 : v < 0.82 ? 4 : 6;
      const i = y * width + x;
      surfaceClassMask[i] = kind;
      rgba.set([...palette[kind], 255], 4 * i);
      const roughness = kind === 1 ? 50 : kind === 2 ? 115 : 180;
      const elevation = kind === 1 ? 95 : 128;
      roughnessRgba.set([roughness, roughness, roughness, 255], 4 * i);
      reliefRgba.set([elevation, elevation, elevation, 255], 4 * i);
    }
    const a = y * width * 4, b = (y * width + width - 1) * 4;
    for (const texture of [rgba, roughnessRgba, reliefRgba]) {
      texture.set(texture.subarray(a, a + 4), b);
    }
    surfaceClassMask[y * width + width - 1] = surfaceClassMask[y * width];
  }
  return { width, height, rgba, reliefRgba, roughnessRgba, surfaceClassMask };
}

const fixture = makeInput();
const original = {
  rgba: new Uint8Array(fixture.rgba),
  mask: new Uint8Array(fixture.surfaceClassMask),
};
for (const seed of [0x257691ab, 872311, 0x17e9bc41]) {
  const atlas = build(fixture, 1024, seed);
  const stats = { water: { count: 0, rough: 0, contrast: 0 },
    rock: { count: 0, rough: 0, contrast: 0, extreme: 0 },
    flora: { count: 0, red: 0, green: 0 } };
  for (let y = 8; y < atlas.height - 8; y += 2) {
    for (let x = 8; x < atlas.width - 8; x += 2) {
      const i = y * atlas.width + x, o = i * 4;
      const normal = Math.abs(atlas.normalRgba[o] - 128) +
        Math.abs(atlas.normalRgba[o + 1] - 128);
      const kind = atlas.classMask[i];
      if (kind === 1) {
        stats.water.count++;
        stats.water.rough += atlas.roughnessRgba[o + 1];
        stats.water.contrast += normal;
      } else if (kind === 3) {
        stats.rock.count++;
        stats.rock.rough += atlas.roughnessRgba[o + 1];
        stats.rock.contrast += normal;
        stats.rock.extreme += Number(normal > 80);
      } else if (kind === 5) {
        stats.flora.count++;
        stats.flora.red += atlas.rgba[o];
        stats.flora.green += atlas.rgba[o + 1];
      }
    }
  }
  const sea = stats.water.rough / stats.water.count;
  const rock = stats.rock.contrast / stats.rock.count;
  const waterNormal = stats.water.contrast / stats.water.count;
  const extremeFraction = stats.rock.extreme / stats.rock.count;
  assert.ok(sea >= 105 && sea < 145, `Rugosidad oceánica inesperada: ${sea}`);
  assert.ok(waterNormal < rock * 0.2, `Océano no suave: ${waterNormal}`);
  assert.ok(rock > 19 && rock < 42, `Relieve fuera de rango: ${rock}`);
  assert.ok(extremeFraction < 0.025, `Pendientes extremas: ${extremeFraction}`);
  assert.ok(stats.flora.red / stats.flora.count > stats.flora.green / stats.flora.count + 22,
    'La vegetación ha perdido su pigmento no verde');
  assert.equal('cloudRgba' in atlas, false);
  for (let y = 0; y < atlas.height; y += 59) {
    const l = y * atlas.width * 4, r = (y * atlas.width + atlas.width - 1) * 4;
    assert.deepEqual(atlas.rgba.subarray(l, l + 4), atlas.rgba.subarray(r, r + 4));
    assert.deepEqual(atlas.normalRgba.subarray(l, l + 4), atlas.normalRgba.subarray(r, r + 4));
  }
  console.log(`VISSURF.5b seed=${seed}: océano rugosidad ${sea.toFixed(1)} · relieve ${rock.toFixed(1)} · normales extremas ${(100 * extremeFraction).toFixed(2)}%`);
}
assert.deepEqual(fixture.rgba, original.rgba);
assert.deepEqual(fixture.surfaceClassMask, original.mask);
console.log('VISSURF.5b: PASS');
