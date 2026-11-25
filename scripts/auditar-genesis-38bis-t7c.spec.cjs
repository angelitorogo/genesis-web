/** 38.bis-T7c — auditoría portable de contrato y limpieza (sin WebGL). */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const prefix='src/app/presentation/';
const pop=read(prefix+'genesis-archive/38-bis/genesis-universal-archive-colonial-population-38bis-t7.ts');
const html=read(prefix+'genesis-archive/genesis-archive.html');
const listLayout=read(prefix+'genesis-archive/38-bis/genesis-universal-archive-list-layout-38-bis-b1.ts');
const body=read(prefix+'scientific-body-preview/scientific-body-preview.ts');
const template=read(prefix+'scientific-body-preview/scientific-body-preview.html');
const styles=read(prefix+'scientific-body-preview/scientific-body-preview.scss');
const renderer=read(prefix+'infrastructure/vida38-infrastructure-render-38-6.ts');
const helper=read(prefix+'infrastructure/colvis3-colony-visibility-t7c.ts');
let checks=0;const check=(fn)=>{fn();checks++;};
for(const source of [pop,body,renderer,helper,listLayout]) {
  const result=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  check(()=>assert.equal(result.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length??0,0));
}
const isolated={};new Function('exports',ts.transpileModule(pop,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(isolated);
for(const [a,b] of [[12,150],[151,5000],[5001,120000],[120001,1500000]]){
  check(()=>assert.equal(isolated.archiveColonialPopulationLabel38BisT7(isolated.archiveColonialPopulation38BisT7([
    {settlement:{colonialPopulationRange:[a,b]}}])),`${String(a).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}–${String(b).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}`));
}
check(()=>assert.equal(isolated.archiveColonialPopulationLabel38BisT7(null),'No evaluable'));
check(()=>assert.ok(!html.includes('archive-population-sort-note')));
check(()=>assert.ok(!html.includes('Ordenación orientativa por el punto medio')));
check(()=>assert.ok(!pop.includes('hab. (intervalo estimado)')));

// Mixed persisted revisions: older IndexedDB rows must render clean immediately.
const list={};new Function('exports','require',ts.transpileModule(listLayout,{compilerOptions:{
 module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(list,()=>({archivePublicCopyA6:x=>x}));
for(const category of ['colonies','colonized-planets','colonized-moons']){
 const row={category,cells:{population:'5.152–125.000 hab. (intervalo estimado)'},actions:[]};
 const before=JSON.stringify(row);
 const value=list.archiveCompactFields38BisB1(row,'Galaxia 1').find(x=>x.key==='population').value;
 check(()=>assert.equal(value,'5.152–125.000'));
 check(()=>assert.equal(JSON.stringify(row),before));
}


// The visual-only helper has no runtime dependencies; exercise production functions.
const details={};new Function('exports',ts.transpileModule(helper,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(details);
const fixture=(tier,fn,kind)=>({provenance:'VIDA8_COLONIAL_SETTLEMENT',
 locationStatus:'RECONSTRUCTED_NOT_OBSERVED',scale:'CITY',lineage:'INSECTOID',
 habitatTechnology:'SEALED_SURFACE',colonyArchitectureCOLVIS1:{founderTier:tier,
 destinationKind:kind,function:fn,populationRange:[5001,120000],
 founderSourceBodyStorageKey:'verified'}});
const advanced=details.colvis3ColonyDetailsFromVerifiedPlanT7c(fixture('ADVANCED','EXTRACTION','MOON'));
const extreme=details.colvis3ColonyDetailsFromVerifiedPlanT7c(fixture('VERY_ADVANCED','RESEARCH','PLANET'));
check(()=>assert.equal(advanced.destinationLabel,'Luna'));
check(()=>assert.equal(advanced.populationLabel,'5.001–120.000 habitantes'));
check(()=>assert.equal(advanced.purposeLabel,'Extracción'));
check(()=>assert.ok(extreme.lampBudget>advanced.lampBudget));
check(()=>assert.notEqual(extreme.lampHex,advanced.lampHex));
check(()=>assert.equal(details.colvis3ColonyDetailsFromVerifiedPlanT7c({...fixture('ADVANCED','RESEARCH','PLANET'),provenance:'VIDA7_NATIVE_SETTLEMENT'}),null));
for(const d of [90,200,750,1600]){
 check(()=>assert.ok(details.colvis3MarkerRadiusSceneT7c(1,d)>=.025));
 check(()=>assert.ok(details.colvis3MarkerRadiusSceneT7c(1,d)<=.090));
}
check(()=>assert.equal(details.colvis3IsColonyClickT7c(0,18,true),true));
for(const [travel,distance,visible] of [[8,18,true],[0,40,true],[0,18,false]])
 check(()=>assert.equal(details.colvis3IsColonyClickT7c(travel,distance,visible),false));

for(const s of ['colonyInspectionIndexCOLVIS2','t7c-colony-details','t7c-colony-backdrop',
  't7c-colony-close','role','aria-modal','exitColonyInspectionCOLVIS2','colonyInspectionDetailsT7c'])
  check(()=>assert.ok(template.includes(s),'Plantilla '+s));
for(const s of ['pickVerifiedColonyT7c','onColonyEscapeT7c','updateColonyNightLightsT7c',
  'this.inspectColonyCOLVIS2(found)','createVida38InfrastructureSurfaceVisual386(planet.infrastructurePlans,radius,appearance.nightLightsTexture,null,true',
  'createVida38InfrastructureSurfaceVisual386(moonInfrastructure,radius,null,irregularSurface,true'])
  check(()=>assert.ok(body.includes(s),'Visor '+s));
for(const s of ['colvis3ColonyDetailsFromVerifiedPlanT7c','colvis3MarkerRadiusSceneT7c',
  'lampBudget','lampMaterial,verifiedDetailsT7c','setColonialInspectionActiveCOLVIS2'])
  check(()=>assert.ok(renderer.includes(s),'Render '+s));
for(const s of ['.scientific-preview__viewport--colony-modal','.scientific-preview__colony-panel',
  '.scientific-preview__colony-scrim'])check(()=>assert.ok(styles.includes(s),'CSS '+s));
check(()=>assert.ok(renderer.includes('colonyMarkerEnhancementT7c = false')));
check(()=>assert.ok(body.includes('iceCoverage01:moon.presentationIceCoverage01},true')));
check(()=>assert.ok(body.includes('iceCoverage01:planet.surface?.surfaceIceCoverageFraction01??null},true')));
check(()=>assert.ok(helper.includes('RECONSTRUCTED_NOT_OBSERVED')));
check(()=>assert.ok(helper.includes("'VIDA8_COLONIAL_SETTLEMENT'")));
check(()=>assert.equal((body.match(/new THREE\.WebGLRenderer\(/g)||[]).length,1));

check(()=>assert.ok(!template.includes('>Colonia confirmada<')));
check(()=>assert.ok(!template.includes('Procedencia')));
check(()=>assert.ok(!template.includes('Nombre público')));
check(()=>assert.ok(!template.includes('(estimación VIDA.8)')));
for(const s of ['colonyHostBodyLabelT7d','lockBackgroundScrollT7d','unlockBackgroundScrollT7d'])
  check(()=>assert.ok(body.includes(s),'T7d visor '+s));
check(()=>assert.ok(!renderer.includes('addColonySurfacePatchT7d')));
check(()=>assert.ok(body.includes('attachColonySurfaceContextT7e')));
console.log(`PASS GENESIS 38.bis-T7c: ${checks} comprobaciones portátiles; Archivo, selección, detalle, luz y salvaguardas.`);
