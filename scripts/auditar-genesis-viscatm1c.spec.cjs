'use strict';
/** Auditoría reproducible y portable en Windows: Node + TypeScript local. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));
const dir = path.join(root, 'src/app/presentation/system');
let passed = 0;
const check = (name, fn) => {
  try { fn(); passed++; } catch (error) { console.error(`FAIL ${name}`); throw error; }
};
require.extensions['.ts'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  module._compile(result.outputText, filename);
};
const { buildSystemSceneGiantAtmospherePresentationV1: present } = require(path.join(dir, 'system-scene-giant-atmosphere-presentation.ts'));
const { buildSystemSceneGiantAtmosphereTextureV1: texture } = require(path.join(dir, 'system-scene-giant-atmosphere-texture.ts'));
const { refineGiantAtmosphereMultiresVISCATM1: refine,
  GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1: version } = require(path.join(dir, 'system-scene-giant-atmosphere-multires-viscatm1.ts'));
const { refinePlanetRgbaTextureV1: interpolate } = require(path.join(dir, 'system-scene-planet-texture-refinement.ts'));
const { GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C: segments,
  giantAtmosphereFineShellRequiredVISCATM1c: needFine } = require(path.join(dir, 'system-scene-giant-atmosphere-geometry-viscatm1c.ts'));
const scene = fs.readFileSync(path.join(dir, 'system-scene.ts'), 'utf8');
const fiche = fs.readFileSync(path.join(root, 'src/app/presentation/scientific-body-preview/scientific-body-preview.ts'), 'utf8');
function input(kind) {
  return present({ planetType: kind, massEarth: kind === 'GAS_GIANT' ? 260 : 18,
    radiusEarth: kind === 'GAS_GIANT' ? 10.5 : 4, densityGramsPerCubicCentimeter: 1.1,
    envelopeMassFraction01: .78, iceBearingFractionOfSolids01: .72,
    rotationPeriodHours: 16, equilibriumTemperatureKelvin: 70, referenceBondAlbedo01: .47,
    retainedMeanMolarMassGramsPerMole: 2.6, retainedGasComposition: [
      { gas: 'HYDROGEN', moleFraction01: .72 }, { gas: 'HELIUM', moleFraction01: .2 },
      { gas: 'METHANE', moleFraction01: .08 },
    ],
  });
}
function energy(p, w) {
  let sum = 0, n = 0;
  for (let y = 22; y < w / 2 - 22; y += 4) for (let x = 3; x < w - 8; x += 7) {
    const i = (y * w + x) * 4;
    sum += Math.abs(p[i] - p[i + 4]) + Math.abs(p[i] - p[i + w * 4]); n += 2;
  }
  return sum / n;
}
check('versión de caché visual', () => assert.equal(version, 3));
check('resolución de malla cercana', () => {
  assert(segments.widthSegments >= 128 && segments.heightSegments >= 96);
  assert(Math.PI * Math.PI * 800 / (4 * segments.widthSegments ** 2) < 0.11);
});
check('geometría de LOD con histéresis', () => {
  assert(!needFine(210, false)); assert(needFine(240, false));
  assert(needFine(190, true)); assert(!needFine(140, true));
});
check('la misma malla fina se comparte en las tres capas', () => {
  assert(scene.includes('binding.mesh.geometry = this.giantAtmosphereFineSphereVISCATM1c'));
  assert(scene.includes('shell.mesh.geometry = this.giantAtmosphereFineSphereVISCATM1c'));
  assert(scene.includes('giantAtmosphereFineSphereVISCATM1c = new THREE.SphereGeometry('));
});
check('geometría restaurada y memoria liberada', () => {
  assert(scene.includes('shell.mesh.geometry = shell.originalGeometry'));
  assert(scene.includes('this.giantAtmosphereFineSphereVISCATM1c?.dispose()'));
  assert(scene.includes('this.giantAtmosphereShellsVISCATM1c.clear()'));
});
check('un único gigante próximo y LOD de los otros cuerpos intacto', () => {
  assert(scene.includes('const geometryFocus = visibleGiant'));
  assert(scene.includes('closestPlanet!.projectedDiameter'));
  assert(scene.includes('this.updateGiantAtmosphereFineGeometryVISCATM1c(geometryFocus)'));
});
check('la ficha usa la misma geometría fina solo en gigantes', () => {
  assert(fiche.includes('planet.giantAtmosphere !== null'));
  assert(fiche.includes('GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C'));
});
check('bruma transparente sin cortes alfa duros', () => {
  assert(scene.includes('subpixel cloud-edge transparency'));
  assert(scene.includes('alphaTest:\n        0,'));
});
check('sin cambios en el sombreado de sólidos', () => {
  assert(scene.includes("surfaceRenderModeVISSURF5c"));
  assert(scene.includes("planet.giantAtmosphere !== null && textureWidth >= 512"));
});
const performances = [];
for (const kind of ['GAS_GIANT','ICE_GIANT','MINI_NEPTUNE']) {
  const atm = input(kind);
  const x = { systemIdentity: 'GAL/G0', planetId: kind, atmosphere: atm };
  const base = texture(x);
  const t0 = performance.now();
  const high = texture({ ...x, width: 1024, height: 512 });
  performances.push([kind, Math.round(performance.now() - t0)]);
  const focused = refine(base.albedoRgba, 256, 128, 1024, base.seedUint32, atm, 'CLOUD_TOPS');
  const old = interpolate(base.albedoRgba, 256, 128, 1024, base.seedUint32, 'GAS');
  check(`${kind} detalle espacial medible`, () => assert(energy(high.albedoRgba, 1024) > energy(old, 1024) * 1.3));
  check(`${kind} atlas único ficha/escena`, () => assert.deepEqual(high.albedoRgba, focused));
  check(`${kind} determinismo`, () => assert.deepEqual(focused, refine(base.albedoRgba,256,128,1024,base.seedUint32,atm,'CLOUD_TOPS')));
  check(`${kind} alpha original`, () => { for(let i=3; i<focused.length;i+=4) assert.equal(focused[i], 255); });
  check(`${kind} costura UV`, () => {for(let y=0;y<512;y++){const a=y*1024*4,b=a+1023*4;for(let c=0;c<4;c++)assert.equal(focused[a+c],focused[b+c]);}});
  if (base.upperHazeRgba !== null) {
    check(`${kind} misma neblina ficha/escena`, () => assert.deepEqual(high.upperHazeRgba, refine(base.upperHazeRgba,256,128,1024,base.seedUint32,atm,'UPPER_HAZE')));
  }
}
console.log(`PASS GENESIS VISCATM.1c — ${passed} comprobaciones portátiles. Duraciones por atlas 1024: ${performances.map(([k,ms])=>`${k} ${ms} ms`).join(', ')}.`);
