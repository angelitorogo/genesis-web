/** Structural regression of VIDA.9b. Runtime scientific values are checked by
 * Angular/Vitest on the user's installed project, not invented in this script. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const project = path.resolve(__dirname, '..');
const file = relative => fs.readFileSync(path.join(project, relative), 'utf8');
const layoutPath='src/app/presentation/planet-detail/planet-scientific-fiche-layout.ts';
const runtimePath='src/app/presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime.ts';

test('VIDA.9b: módulos TypeScript modificados sin errores de sintaxis',()=>{
  for(const relative of [layoutPath,runtimePath,
    'src/app/presentation/runtime/galaxy-catalog-effective-planet-vida5.ts',
    'src/app/presentation/planet-detail/planet-scientific-sections.ts']){
    const s=ts.createSourceFile(relative,file(relative),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
    assert.equal(s.parseDiagnostics.length,0,relative);
  }
});
test('VIDA.9b: la ficha sigue la lista compacta solicitada',()=>{
  const source=file(layoutPath);
  const match=source.match(/export const PLANET_FICHE_FIELD_LAYOUT = Object\.freeze\((\{[\s\S]*?\})\s+as const\);/);
  assert.ok(match,'Contrato de layout');
  const fields={};
  for(const [,name,group] of match[1].matchAll(/\b(general|orbit|surface|atmosphere|climate|geology):\s*\[([\s\S]*?)\]/g)){
    fields[name]=[...group.matchAll(/'([^']+)'/g)].map(x=>x[1]);
  }
  assert.deepEqual(fields.surface,[
    'Base superficial','Índice de rugosidad','Índice de inventario de agua',
    'Agua líquida superficial','Distribución hielo / líquido / vapor',
    'Cobertura de hielo','Cobertura de agua','Radiación superficial']);
  assert.deepEqual(fields.geology,[
    'Régimen geológico','Vulcanismo','Tectónica','Índice de retención de calor interno',
    'Campo magnético','Magnetosfera']);
  assert.equal(fields.general.includes('Duración del día'),false);
  assert.equal(source.includes('...chemicalV3'),false);
  assert.equal(source.includes('...radiationV3'),false);
  assert.equal(source.includes('...continuityV3'),false);
});
test('VIDA.9b: catálogo V3 invalidado y valores procedentes de VIDA.5',()=>{
  const runtime=file(runtimePath);
  const adapter=file('src/app/presentation/runtime/galaxy-catalog-effective-planet-vida5.ts');
  assert.match(runtime,/effectivePhysicalProjectionVIDA5 === 2/);
  assert.match(runtime,/resolveEffectivePlanetVIDA5\(generationKey, locator, publicSource\)/);
  assert.match(runtime,/PlanetScientificTargetResolver\.projectGenerated\(/);
  assert.match(runtime,/safeCatalogPlanetProjectionV3/);
  assert.match(runtime,/new StellarMultihostScientificTargetResolver\(multiple\)/);
  assert.doesNotMatch(adapter,/PlanetScientificTargetResolver\.resolveDetailed\(/);
  assert.match(adapter,/source: PlanetScientificResolvedTarget/);
  assert.match(runtime,/effective\?\.detail\.climate\.meanSurfaceTemperatureKelvin/);
  assert.match(runtime,/projectEffectiveAtmosphere\(effective\)/);
  assert.match(adapter,/Vida5cAdvancedBiospheres\.evaluate/);
  assert.match(adapter,/Vida5BiogenicAtmosphere\.applyToTarget/);
});
test('VIDA.9b: restaurada tarjeta lunar plegable con cuadrícula interior',()=>{
  const html=file('src/app/presentation/planet-detail/planet-detail.html');
  const css=file('src/app/presentation/planet-detail/planet-detail.scss');
  assert.match(html,/<details[\s\S]*?planet-detail__moon-card/);
  assert.match(html,/<summary class="planet-detail__moon-summary">/);
  assert.match(css,/\.planet-detail__moon-card\s*\{\s*display:\s*block;/);
  assert.match(css,/\.planet-detail__moon-content > dl\s*\{\s*display:\s*grid;/);
});

test('VIDA.9b.2: PRE-33.02 nonconvergence isolated per body; no old atmospheric fallback',()=>{
  const runtime=file(runtimePath);
  const adapter=file('src/app/presentation/runtime/galaxy-catalog-effective-planet-vida5.ts');
  assert.match(runtime,/safeCatalogPlanetProjectionV3\(\(\) => PlanetScientificTargetResolver\.projectGenerated/);
  assert.match(runtime,/scientific \? safeCatalogPlanetProjectionV3/);
  assert.match(runtime,/effective === null \? null : projectEffectiveAtmosphere\(effective\)/);
  assert.match(adapter,/NON_CONVERGED_PHASE_MODEL/);
  assert.match(adapter,/throw error/);
  assert.match(runtime,/effectivePhysicalProjectionVIDA5: 2 as const/);
});
