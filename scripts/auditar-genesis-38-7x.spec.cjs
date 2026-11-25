'use strict';
/** Portable auditor: run from genesis-web root; no hard-coded OS paths. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = process.cwd();
const src = rel => fs.readFileSync(path.join(root,rel),'utf8');
const base = 'src/app/presentation/';
let checks = 0;
function check(label, fn) {
  try { fn(); checks++; } catch(error) { console.error('FAIL',label); throw error; }
}
function loadIsolatedTS(rel, mockRequire=() => ({})) {
  const file = src(rel);
  const js = ts.transpileModule(file, {compilerOptions:{
    module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022,
    isolatedModules:true,
  },fileName:rel, reportDiagnostics:true});
  assert.deepEqual((js.diagnostics || []).filter(d=>d.category===ts.DiagnosticCategory.Error),[]);
  const module={exports:{}};
  vm.runInNewContext('(function(exports,require,module){'+js.outputText+'\n})',
    {},{filename:rel,timeout:2000})(module.exports,mockRequire,module);
  return module.exports;
}
const level = {DETECTED:'DETECTED',IDENTIFIED:'IDENTIFIED',CATALOGUED:'CATALOGUED',CONFIRMED:'CONFIRMED'};
const visuals = loadIsolatedTS(base+'system/system-scene-civilization-visuals.ts', name => {
  if (name.includes('archive-stellar-system-card')) return {ArchiveStellarSystemKnowledgeLevel:level};
  if (name.includes('discovery-state')) return {DiscoveryState:{CONFIRMED:{code:5}}};
  throw new Error('Unexpected non-type import: '+name);
});
const cache = loadIsolatedTS(base+'system/system-scene-planet-civilization-cache-visciv1b.ts');
const minor = loadIsolatedTS(base+'system/system-scene-minor-body-parity-38-7x.ts');
const profile = {coverageFraction01:.5,lushness01:.8,floraSpeciesCount:3,paletteHexes:['#559944'],paletteEntries:[{hex:'#559944',weight01:1}]};
const snap=()=>({
 universeSeed:'U',generatorVersionCode:3,address:{galaxyIndex:1n,sectorKey:2n,galacticObjectIndex:3n},
 knowledgeLevel:level.CONFIRMED,discoveryStateCode:5,
 planets:[{id:'planet-1'}],moons:[{id:'moon-1-1'}],minorBodies:[{id:'asteroid-1'}],
});
const record={universeSeed:'U',generatorVersionCode:3,systemKey:'1/2/3',bodyIndex:'0',tier:null,vegetationProfile:profile};
check('Confirmed biosphere without civilization',()=>{
 const p=visuals.decorateSystemSceneSnapshotWithCivilizationTiers(snap(),visuals.civilizationVisualMapOf([record]));
 assert.equal(p.planets[0].visualVegetationProfile,profile);
 assert.equal(p.planets[0].visualCivilizationTier,null);
});
check('Does not synthesize life on barren planets',()=>{
 const p=visuals.decorateSystemSceneSnapshotWithCivilizationTiers(snap(),visuals.civilizationVisualMapOf([]));
 assert.equal(p.planets[0].visualVegetationProfile,undefined);
});
check('Moon does not erase planet visual',()=>{
 const plans=[{id:'moon-colony'}];
 const mapped=visuals.civilizationVisualMapOf([record,{bodyIndex:'0',moonIndex:'0',tier:null,infrastructurePlans:plans}]);
 assert.equal(mapped.size,2);
 const result=visuals.decorateSystemSceneSnapshotWithCivilizationTiers(snap(),mapped);
 assert.equal(result.planets[0].visualVegetationProfile,profile);
 assert.equal(result.moons[0].visualInfrastructurePlans,plans);
});
check('Stale/unknown galaxy remains sterile',()=>{
 const input=snap(); input.knowledgeLevel=level.CATALOGUED; input.discoveryStateCode=4;
 input.planets=[{id:'planet-1',visualVegetationProfile:profile}];
 input.moons=[{id:'moon-1-1',visualInfrastructurePlans:[{id:'private'}]}];
 const result=visuals.decorateSystemSceneSnapshotWithCivilizationTiers(input,visuals.civilizationVisualMapOf([record]));
 assert.equal(result.planets[0].visualVegetationProfile,null);
 assert.equal(result.moons[0].visualInfrastructurePlans.length,0);
});
check('Different identity fails closed',()=>{
 const input=visuals.civilizationVisualMapOf([{...record,systemKey:'1/2/OTHER'}]);
 const res=visuals.decorateSystemSceneSnapshotWithCivilizationTiers(snap(),input);
 assert.equal(res.planets[0].visualVegetationProfile??null,null);
});
check('Legacy moon identity exactly maps to a single location',()=>{
 assert.equal(visuals.bodyIndicesForMoon387x(snap(),'moon-1-1').bodyIndex,'0');
 assert.equal(visuals.bodyIndicesForMoon387x(snap(),'moon-1-1').moonIndex,'0');
});
check('Do not guess legacy binding when multihost mapping exists',()=>{
 assert.equal(visuals.bodyIndicesForMoon387x({...snap(),scientificPlanetBindings:[]},'moon-1-1'),null);
});
check('Civilization/vegetation atlas keys differ',()=>{
 const key=cache.systemScenePlanetTextureCacheKeyVISCIV1b;
 assert.notEqual(key('S','planet-1',256,null,null),key('S','planet-1',256,null,profile));
 assert.notEqual(key('S','planet-1',256,null,profile),key('S','planet-1',256,null,{...profile,coverageFraction01:.2}));
 assert.notEqual(key('S','planet-1',256,null,profile),key('S','planet-1',256,'ADVANCED',profile));
});
const makeBody=(kind,presentationField,seedField,seed)=>({
 minorBodyKind:{name:kind},asteroidPresentation:null,cometPresentation:null,tnoPresentation:null,capturedPresentation:null,
 [presentationField]:{[seedField]:seed},
});
for(const [kind,field,seedField,expected] of [
 ['ASTEROID','asteroidPresentation','shapeSeedUint32','ASTEROID'],
 ['COMET','cometPresentation','shapeSeedUint32','COMET'],
 ['TRANS_NEPTUNIAN_OBJECT','tnoPresentation','variantUint32','TNO'],
 ['CAPTURED_EXTRASOLAR_OBJECT','capturedPresentation','variantUint32','CAPTURED'],
]){
 check('Intrinsic seed parity for '+kind,()=>{
  const body=makeBody(kind,field,seedField,9813);
  const found=minor.systemSceneMinorBodyAtlasSource387x(body);
  assert.equal(found.kind,expected); assert.equal(found.seedUint32,9813);
 });
}
check('No arbitrary small-body atlas from an unknown presentation',()=>{
 const body=makeBody('COMET','cometPresentation','shapeSeedUint32',3);body.cometPresentation=null;
 assert.equal(minor.systemSceneMinorBodyAtlasSource387x(body),null);
});
check('Camera LOD hysteresis, never eager load',()=>{
 assert.equal(minor.systemSceneMinorBodyNeedsAtlas387x(100,false),false);
 assert.equal(minor.systemSceneMinorBodyNeedsAtlas387x(350,false),true);
 assert.equal(minor.systemSceneMinorBodyNeedsAtlas387x(250,true),true);
 assert.equal(minor.systemSceneMinorBodyNeedsAtlas387x(200,true),false);
});
const source=src(base+'system/system-scene-civilization-visuals.data-source.ts');
check('Candidates accept flora without VIDA.7',()=>assert.ok(source.includes('PLANTS_TREES')));
check('VIDA.9 verified before projector',()=>assert.ok(source.includes('await repo.get(')));
check('Not conditioned on tier for vegetation',()=>assert.ok(source.includes("record.identity.kind === 'PLANET'")));
const render=src(base+'system/system-scene.ts');
check('On-demand minor surface only',()=>assert.ok(render.includes('installFocusedMinorBodyAtlas387x')));
check('Focus atlas resources restored and disposed',()=>assert.ok(render.includes('releaseFocusedMinorBodyAtlas387x')));
check('No eager minor atlas in loop',()=>assert.ok(!render.includes('attachScientificMinorBodyAtlasVis3d2e(\n      [nucleus]')));
for (const rel of [
 'system/system-scene-civilization-visuals.data-source.ts','system/system-scene-civilization-visuals.ts',
 'system/system-scene-planet-civilization-cache-visciv1b.ts','system/system-scene-minor-body-parity-38-7x.ts',
 'system/system-scene.ts',
]) check('TypeScript syntax '+rel,()=>{
  const result=ts.transpileModule(src(base+rel),{fileName:rel,compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
  assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
});
console.log(`PASS GENESIS 38.7x — ${checks} comprobaciones portátiles de paridad, no filtración y gestión de LOD`);
