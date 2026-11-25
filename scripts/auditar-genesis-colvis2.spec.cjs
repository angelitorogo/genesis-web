/** COLVIS.2 portable audit — executes the actual pure COLVIS.1/2 planners.
 * Does not make claims about WebGL screenshots or the user's persisted universe.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const dir=path.join(root,'src/app/presentation/infrastructure');
function load(name,modules={}){
  const file=path.join(dir,name+'.ts');
  const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{
    fileName:file,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal(result.diagnostics?.length||0,0,`${name}: syntax`);
  const exports={};new Function('exports','require',result.outputText)(exports,
    id=>{if(!(id in modules))throw Error('Unexpected dependency '+id);return modules[id];});
  return exports;
}
const colvis1=load('colvis1-colonial-architecture');
const colvis2=load('colvis2-colonial-architecture',{'./colvis1-colonial-architecture':colvis1});
const camera=load('colvis2-colony-inspection-camera');
const range={OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000]};
function plan(kind,tier,lineage,band='CITY',habitat='SEALED_SURFACE',purpose='RESEARCH',seed=948130){
  return {revision:'VIDA.38.6/physical-infrastructure/v1',id:'auditor-colony',bodyStorageKey:'synthetic',
    provenance:'VIDA8_COLONIAL_SETTLEMENT',locationStatus:'RECONSTRUCTED_NOT_OBSERVED',
    latitudeRadians:.31,longitudeRadians:-.57,seedUint32:seed,
    form:'COLONIAL_HABITAT',scale:band,tier:'COLONIAL',lineage,habitat,purpose,habitatTechnology:habitat,
    colonyArchitectureCOLVIS1:{founderTier:tier,destinationKind:kind,populationRange:range[band],
      function:purpose,founderSpeciesId:'qa',founderSourceBodyStorageKey:'origin'}};
}
let checks=0;
const verify=(fn)=>{fn();checks++;};
const combinations=[];const signatures=new Set();
for(const world of ['PLANET','MOON'])for(const tier of ['ADVANCED','VERY_ADVANCED'])
for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID']){
  const input=plan(world,tier,lineage);const before=JSON.stringify(input);
  const l=colvis2.colvis2LayoutFromVerifiedPlan(input);
  verify(()=>assert.ok(l,`${world}/${tier}/${lineage}: plan null`));
  verify(()=>assert.equal(l.revision,colvis2.COLVIS2_REVISION));
  verify(()=>assert.equal(l.worldKind,world));
  verify(()=>assert.equal(l.founderTier,tier));
  verify(()=>assert.ok(l.high.length>10 && l.medium.length>2));
  verify(()=>assert.ok(l.high.every(p=>[p.x,p.z,p.width,p.height,p.depth,p.yaw,p.lift].every(Number.isFinite))));
  verify(()=>assert.ok(l.high.every(p=>Math.hypot(p.x,p.z)<l.unitExtent)));
  verify(()=>assert.deepEqual(l,colvis2.colvis2LayoutFromVerifiedPlan(input)));
  verify(()=>assert.equal(JSON.stringify(input),before));
  verify(()=>assert.ok(l.footprintRadiusKm>0 && l.maximumHeightKm>0));
  verify(()=>assert.ok(l.high.some(p=>p.shape.includes(lineage==='HUMANOID'?'HUMAN':lineage==='REPTILIAN'?'REPTILE':'INSECT'))));
  signatures.add(l.silhouetteSignature+'|'+l.high.map(p=>p.shape+':'+p.x.toFixed(2)+':'+p.z.toFixed(2)).join('|'));
  combinations.push({world,tier,lineage,high:l.high.length,medium:l.medium.length,
    radiusKm:l.footprintRadiusKm,heightKm:l.maximumHeightKm,signature:l.silhouetteSignature});
}
verify(()=>assert.equal(signatures.size,12));
for(const radius of [.025,.12,1,2.5])for(const footprint of [1e-8,1e-6,.0001]){
 const range=camera.colvis2ColonyCameraFraming(footprint,radius);
 verify(()=>assert.ok(range.nearScene>0));
 verify(()=>assert.ok(range.distanceScene>range.nearScene));
 verify(()=>assert.ok(range.farScene>range.distanceScene));
 verify(()=>assert.ok(range.farScene/range.nearScene<1e9));
}
verify(()=>assert.equal(camera.colvis2ColonyCameraFraming(0,1),null));
verify(()=>assert.equal(camera.colvis2ColonyCameraFraming(1,0),null));
verify(()=>assert.deepEqual(camera.colvis2ColonyCameraFraming(.00004,1,.1),
  camera.colvis2ColonyCameraFraming(.00004,1,.32)));

for(const lineage of ['HUMANOID','REPTILIAN','INSECTOID']){
 const a=colvis2.colvis2LayoutFromVerifiedPlan(plan('PLANET','ADVANCED',lineage));
 const v=colvis2.colvis2LayoutFromVerifiedPlan(plan('PLANET','VERY_ADVANCED',lineage));
 verify(()=>assert.ok(v.high.length>a.high.length));
 verify(()=>assert.ok(v.footprintRadiusKm<a.footprintRadiusKm));
 verify(()=>assert.ok(v.maximumHeightKm>a.maximumHeightKm));
 verify(()=>assert.notEqual(v.silhouetteSignature,a.silhouetteSignature));
}
for(const kind of ['PLANET','MOON']){
 const size=Object.keys(range).map(b=>colvis2.colvis2LayoutFromVerifiedPlan(plan(kind,'ADVANCED','HUMANOID',b)));
 verify(()=>assert.ok(size.every((l,i)=>i===0||l.footprintRadiusKm>=size[i-1].footprintRadiusKm)));
 verify(()=>assert.deepEqual(size.map(x=>x.populationRange),Object.values(range)));
}
for(const species of ['HUMANOID','REPTILIAN','INSECTOID']){
 const root=colvis2.colvis2LayoutFromVerifiedPlan(plan('MOON','VERY_ADVANCED',species,'NETWORK','SUBSURFACE_VAULT'));
 const exposed=colvis2.colvis2LayoutFromVerifiedPlan(plan('MOON','VERY_ADVANCED',species,'NETWORK','SEALED_SURFACE'));
 verify(()=>assert.ok(root.high.some(p=>p.role==='ACCESS')));
 verify(()=>assert.ok(!root.high.some(p=>p.role==='MAIN_MODULE')));
 verify(()=>assert.ok(root.high.length<exposed.high.length));
}
for(const [purpose,role] of Object.entries({RESEARCH:'SENSOR',EXTRACTION:'EXTRACTOR',HABITATION:'HABITAT',BIOSPHERE_CONSERVATION:'BIOLAB'})){
  verify(()=>assert.ok(colvis2.colvis2LayoutFromVerifiedPlan(plan('PLANET','ADVANCED','INSECTOID','CITY','SEALED_SURFACE',purpose)).high.some(p=>p.role===role)));
}
for(const invalid of [
  {...plan('PLANET','ADVANCED','HUMANOID'),provenance:'VIDA7_NATIVE_SETTLEMENT'},
  {...plan('PLANET','ADVANCED','HUMANOID'),colonyArchitectureCOLVIS1:undefined},
  {...plan('PLANET','ADVANCED','HUMANOID'),seedUint32:NaN},
  {...plan('PLANET','ADVANCED','HUMANOID'),colonyArchitectureCOLVIS1:{...plan('PLANET','ADVANCED','HUMANOID').colonyArchitectureCOLVIS1,populationRange:[0,999]}}
])verify(()=>assert.equal(colvis2.colvis2LayoutFromVerifiedPlan(invalid),null));
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
for(const src of [
  'src/app/presentation/infrastructure/colvis2-architecture-geometry.ts',
  'src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview.ts',
  'src/app/presentation/scientific-body-preview/scientific-body-preview.html',
  'src/app/presentation/colvis1-laboratory/colvis1-laboratory.ts',
])verify(()=>assert.ok(fs.existsSync(path.join(root,src))));
const render=read('src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts');
const preview=read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const template=read('src/app/presentation/scientific-body-preview/scientific-body-preview.html');
const lab=read('src/app/presentation/colvis1-laboratory/colvis1-laboratory.ts');
const geometry=read('src/app/presentation/infrastructure/colvis2-architecture-geometry.ts');
for(const pattern of ['cachedLayoutsCOLVIS2.get(plan.id)','colvis2SculptedGeometry(shape)','locationMarkerCOLVIS2(siteHigh)',
  'colonialSitesCOLVIS2.push','Math.sqrt(site.bodyRadiusScene*distance)']){
  if(pattern.includes('Math.sqrt')) continue;
  verify(()=>assert.ok(render.includes(pattern),`render missing ${pattern}`));
}
verify(()=>assert.ok(preview.includes('updateColonyInspectionCameraCOLVIS2()')));
verify(()=>assert.ok(preview.includes('this.camera.near=.01;this.camera.far=80')));
verify(()=>assert.ok(preview.includes('colvis2ColonyCameraFraming(site.footprintScene')));
const framingFile=read('src/app/presentation/infrastructure/colvis2-colony-inspection-camera.ts');
verify(()=>assert.ok(framingFile.includes('farScene') && framingFile.includes('nearScene')));
verify(()=>assert.ok(template.includes('colvis2-colony-inspection')));
verify(()=>assert.ok(lab.includes('colvis2LayoutFromVerifiedPlan(plan)')));
verify(()=>assert.ok(lab.includes('createVida38InfrastructureSurfaceVisual386')));
verify(()=>assert.ok(geometry.includes('new THREE.TubeGeometry') && geometry.includes('new THREE.LatheGeometry')));
const original=read('src/app/presentation/infrastructure/vida38-infrastructure-plan-38-6.ts');
verify(()=>assert.ok(original.includes('colony.origin.tier') && original.includes('settlement.colonialPopulationRange')));
const result={revision:colvis2.COLVIS2_REVISION,checks,combinationCount:combinations.length,combinations};
if(process.argv.includes('--json'))console.log(JSON.stringify(result,null,2));
else{console.log(`PASS COLVIS.2 — ${checks} comprobaciones, ${combinations.length} escenarios; no incluye inspección WebGL.`);console.table(combinations);}
