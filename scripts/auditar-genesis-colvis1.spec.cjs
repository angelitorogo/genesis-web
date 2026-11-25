/** COLVIS.1 portable auditor: executes the actual pure architectural planner.
 * Requires only the TypeScript compiler already installed by GENESIS (devDependency).
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=path.join(root,'src/app/presentation/infrastructure/colvis1-colonial-architecture.ts');
const ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync(src,'utf8'),{fileName:'colvis1-colonial-architecture.ts',
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
if(code.diagnostics?.length)throw Error(ts.formatDiagnostics(code.diagnostics,{
  getCanonicalFileName:s=>s,getCurrentDirectory:()=>root,getNewLine:()=>"\n"}));
const library={};new Function('exports',code.outputText)(library);
const planFor=(kind,tier,lineage,scale='CITY',habitatTechnology='SEALED_SURFACE',purpose='RESEARCH',seed=9861)=>{
  const ranges={OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000]};
  return {revision:'VIDA.38.6/physical-infrastructure/v1',id:'colonial-qa',provenance:'VIDA8_COLONIAL_SETTLEMENT',
    bodyStorageKey:'0:0:0:0:MOON:0',seedUint32:seed,locationStatus:'RECONSTRUCTED_NOT_OBSERVED',
    latitudeRadians:.23,longitudeRadians:-.87,form:'COLONIAL_HABITAT',scale,tier:'COLONIAL',lineage,
    habitat:habitatTechnology,purpose,habitatTechnology,
    colonyArchitectureCOLVIS1:{founderTier:tier,destinationKind:kind,populationRange:ranges[scale],
      function:purpose,founderSpeciesId:'synthetic',founderSourceBodyStorageKey:'synthetic'}};
};
let checks=0;
const check=(fn)=>{fn();checks++;};
const summary=[];const distinct=new Set();
for(const kind of ['PLANET','MOON'])for(const tier of ['ADVANCED','VERY_ADVANCED'])
for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID']){
 const p=planFor(kind,tier,lineage);const before=JSON.stringify(p);
 const l=library.colvis1LayoutFromVerifiedPlan(p);
 check(()=>assert.equal(l?.revision,'COLVIS.1/architectural-reconstruction/v1'));
 check(()=>assert.equal(l.worldKind,kind));
 check(()=>assert.equal(l.founderTier,tier));
 check(()=>assert.equal(JSON.stringify(p),before));
 check(()=>assert.deepEqual(l,library.colvis1LayoutFromVerifiedPlan(p)));
 check(()=>assert.ok(l.high.length>15 && l.medium.length>2 && l.high.length<112));
 check(()=>assert.ok(l.high.every(o=>[o.x,o.z,o.width,o.height,o.depth,o.lift,o.yaw].every(Number.isFinite))));
 check(()=>assert.ok(l.high.every(o=>Math.hypot(o.x,o.z)<4.5)));
 distinct.add(l.high.map(o=>`${o.role}:${o.shape}:${o.x.toFixed(2)}:${o.lift.toFixed(2)}`).join('|'));
 summary.push({family:l.family,worldKind:kind,highParts:l.high.length,
   footprintRadiusKm:l.footprintRadiusKm,maximumHeightKm:l.maximumHeightKm});
}
check(()=>assert.equal(distinct.size,12));
for(const [env,role] of [[{temperatureKelvin:915,pressurePascal:1500},'PANEL'],
  [{temperatureKelvin:85,pressurePascal:0},'FOUNDATION']] ){
 const altered=library.colvis1LayoutFromVerifiedPlan(planFor('PLANET','ADVANCED','HUMANOID'),env);
 check(()=>assert.ok(altered.high.some(p=>p.role===role)));
}

for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID']){
 const adv=library.colvis1LayoutFromVerifiedPlan(planFor('PLANET','ADVANCED',lineage));
 const very=library.colvis1LayoutFromVerifiedPlan(planFor('PLANET','VERY_ADVANCED',lineage));
 check(()=>assert.ok(very.high.length>adv.high.length));
 check(()=>assert.ok(very.footprintRadiusKm<adv.footprintRadiusKm));
}
for(const kind of ['PLANET','MOON']){
 const sizes=['OUTPOST','SETTLEMENT','CITY','NETWORK'].map(
   band=>library.colvis1LayoutFromVerifiedPlan(planFor(kind,'ADVANCED','HUMANOID',band)).footprintRadiusKm);
 check(()=>assert.ok(sizes.every((v,i)=>i===0||v>sizes[i-1])));
}
for(const purpose of ['RESEARCH','EXTRACTION','HABITATION','BIOSPHERE_CONSERVATION']){
 const role={RESEARCH:'SENSOR',EXTRACTION:'EXTRACTOR',HABITATION:'HABITAT',BIOSPHERE_CONSERVATION:'BIOLAB'}[purpose];
 const l=library.colvis1LayoutFromVerifiedPlan(planFor('PLANET','ADVANCED','INSECTOID','CITY','SEALED_SURFACE',purpose));
 check(()=>assert.ok(l.high.some(o=>o.role===role)));
}
for(const habitat of ['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD']){
 const l=library.colvis1LayoutFromVerifiedPlan(planFor('MOON','VERY_ADVANCED','REPTILIAN','CITY',habitat));
 check(()=>assert.equal(l.habitatTechnology,habitat));
 if(habitat==='ENVIRONMENTAL_SHIELD')check(()=>assert.ok(l.high.some(o=>o.role==='ENVIRONMENTAL_COVER')));
 if(habitat==='SUBSURFACE_VAULT')check(()=>assert.ok(!l.high.some(o=>o.role==='ENVIRONMENTAL_COVER')));
}
check(()=>assert.equal(library.colvis1LayoutFromVerifiedPlan({...planFor('PLANET','ADVANCED','HUMANOID'),
  provenance:'VIDA7_NATIVE_SETTLEMENT'}),null));
check(()=>assert.equal(library.colvis1LayoutFromVerifiedPlan({...planFor('PLANET','ADVANCED','HUMANOID'),
  colonyArchitectureCOLVIS1:undefined}),null));
for(const required of ['src/app/presentation/infrastructure/vida38-infrastructure-plan-38-6.ts',
  'src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts',
  'src/app/presentation/colvis1-laboratory/colvis1-laboratory.ts','src/app/app.routes.ts']){
 check(()=>assert.ok(fs.existsSync(path.join(root,required))));
}
const render=fs.readFileSync(path.join(root,'src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts'),'utf8');
const adapter=fs.readFileSync(path.join(root,'src/app/presentation/infrastructure/vida38-infrastructure-plan-38-6.ts'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app/app.routes.ts'),'utf8');
// COLVIS.2 replaces the production planner; the COLVIS.1 planner remains
// available and is still exercised above for backwards-compatible fixtures.
check(()=>assert.ok(render.includes('colvis1LayoutFromVerifiedPlan(plan,environmentCOLVIS1)') ||
  render.includes('colvis2LayoutFromVerifiedPlan(plan,environmentCOLVIS1)')));
check(()=>assert.ok(render.includes('sourceRadiusKm*.0075')));
check(()=>assert.ok(render.includes('colonyComplex(siteHigh,layout.high')));
check(()=>assert.ok(adapter.includes('colony.origin.tier') && adapter.includes('settlement.colonialPopulationRange')));
check(()=>assert.ok(app.includes("path: 'laboratorio/colvis1'")));
const identity=fs.readFileSync(path.join(root,'src/app/presentation/infrastructure/vida38-infrastructure-plan-38-6.ts'),'utf8');
check(()=>assert.ok(identity.includes("locationStatus: 'RECONSTRUCTED_NOT_OBSERVED'")));
console.log(`COLVIS.1 AUDITORÍA PASS (${checks} verificaciones; 12 escenarios)`);
console.table(summary);
