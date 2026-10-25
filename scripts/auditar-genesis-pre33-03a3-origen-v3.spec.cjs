'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module'),path=require('node:path');
// Compile transitive TS imports too: CT0 origin now consumes the V3 history engine.
if (!require.extensions['.ts']) require.extensions['.ts']=(m,f)=>{
 const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{fileName:f,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 m._compile(js,f);
};
function loadOrigin(){
 const file=path.resolve(__dirname,'../src/app/simulation/planetary/planet-h2o-v3-formation-origin.ts');
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m=new Module(file,module);m.filename=file;m.paths=module.paths;m._compile(code,file);
 return m.exports.PlanetH2OV3FormationOrigin;
}
function stub(temp=280){
 const anchors=[{solidCoreMassEarth:1,assemblyRadiusAu:0.1,compositionMixture:{iceBearingFraction01:.5}},
  {solidCoreMassEarth:1,assemblyRadiusAu:10,compositionMixture:{iceBearingFraction01:.5}}];
 const slots=[0n,1n].map((bodyIndex)=>({bodyLocator:{bodyIndex},sourceAnchorOrdinals:[Number(bodyIndex)+1],
  sourceFormationOrdinals:[Number(bodyIndex)+1]}));
 const system={generationKey:{universeSeed:{normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'}},
  hostStellarSystem:{locator:{galaxyIndex:0n,sectorKey:0n,galacticObjectIndex:0n}},
  formationBlueprint:{sourceDustMassEarth:2,formationAnchors:anchors},planetSlots:slots};
 return {system,disk:{referenceTemperatureAt1AuKelvin:temp},profile:{metallicitySolarRatio:1},slots};
}
test('genera la masa H2O desde 17.7 antes de 19.5 y conserva límite de disco',()=>{
 const Origin=loadOrigin();const f=stub();const records=Origin.registerAtFormation(f.system,f.disk,f.profile);
 assert.equal(records[0].formationWaterKilograms,0);
 assert.ok(records[1].formationWaterKilograms>0);
 assert.ok(records.reduce((n,r)=>n+r.formationWaterKilograms,0)<=records[0].diskWaterBudgetKilograms);
 const p={hostPlanetarySystem:f.system,locator:{bodyIndex:1n},architectureSlot:f.slots[1]};
 assert.equal(Origin.sourceForPlanet(p).formationWaterKilograms,records[1].formationWaterKilograms);
 assert.equal(Origin.environmentForPlanet(p).originChemistryContract,'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1');
 assert.throws(()=>Origin.registerAtFormation(f.system,f.disk,f.profile),/DUPLICATE/);
});
test('no asigna agua artificial en un disco caliente',()=>{
 const f=stub(1200),rows=loadOrigin().registerAtFormation(f.system,f.disk,f.profile);
 assert.ok(rows.every(r=>r.formationWaterKilograms===0));
});
