'use strict';
/** Auditoria aislada de VIDA.8, sin inventario de galaxias: escenarios sinteticos. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(
  fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022}}).outputText,f);
const engine=require('../src/app/simulation/life/vida8-technological-colonization.ts').Vida8TechnologicalColonization;
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const identity=(kind,body,moon=null)=>({universeSeed:seed,generatorVersionCode:3,
  kind,galaxyIndex:'0',sectorKey:'0',galacticObjectIndex:'0',bodyIndex:String(body),moonIndex:moon});
const sourceIdentity=identity('PLANET',0);
const sourceEco={revision:'VIDA.6/ecosystems-species/v1',identity:sourceIdentity,
  bodyStorageKey:'0:0:0:0:PLANET:-',digest:'source-eco',species:[
    {id:'ancestral',group:'HUMANOIDS'},{id:'microbe',group:'MICROORGANISMS'},
    {id:'plant',group:'PLANTS_TREES'}]};
const sourceCiv={revision:'VIDA.7/intelligence-civilizations/v1',identity:sourceIdentity,
  bodyStorageKey:sourceEco.bodyStorageKey,ecosystemDigest:sourceEco.digest,digest:'source-civ',
  civilizationPresent:true,intelligencePresent:true,intelligentSpecies:{speciesId:'ancestral'},
  civilization:{founderSpeciesId:'ancestral',lineage:'HUMANOID',tier:'VERY_ADVANCED',
    technology:['ORBITAL_CAPABILITY']}};
const source={ecosystem:sourceEco,civilization:sourceCiv};
const physical={contract:'VIDA.2/plausibility/v2',classification:'NOT_PLAUSIBLE',
  selectedRoute:null,routes:[],lifeGenerated:false};
function target(n,kind='MOON',life=false){
  const identity2=identity(kind,n,kind==='MOON'?'0':null);
  return {ecosystem:{revision:'VIDA.6/ecosystems-species/v1',identity:identity2,
    bodyStorageKey:`0:0:0:${n}:${kind}:${identity2.moonIndex??'-'}`,
    biospherePresent:life,digest:`eco-${kind}-${n}`},
    nativeCivilization:{revision:'VIDA.7/intelligence-civilizations/v1',identity:identity2,
      bodyStorageKey:`0:0:0:${n}:${kind}:${identity2.moonIndex??'-'}`,
      ecosystemDigest:`eco-${kind}-${n}`,digest:`native-${kind}-${n}`,
      civilizationPresent:false,intelligencePresent:false},solidSurface:true,physical};
}
test('VIDA.8: 1000 destinos lunares, reproducibilidad y procedencia real',()=>{
  let colonies=0,sterileColonies=0,imported=0;
  for(let n=1;n<=1000;n++){
    const t=target(n,'MOON');
    const a=engine.evaluate(t,[source]),b=engine.evaluate(t,[source]);
    assert.deepEqual(a,b);assert.equal(a.nativeLifePresent,false);
    assert.equal(a.nativeCivilizationPresent,false);
    assert.equal(a.colonies.length>0,a.colonialPopulationPresent);
    for(const c of a.colonies){colonies++;sterileColonies++;
      assert.equal(c.origin.founderSpeciesId,'ancestral');
      assert.equal(c.provenance,'TECHNOLOGICAL_COLONIZATION');
      assert.equal(c.terraform,null);
      assert(c.introducedOrganisms.every(x=>sourceEco.species.some(s=>s.id===x.originSpeciesId)));
      imported+=c.introducedOrganisms.length;
    }
  }
  assert(colonies>100&&imported>0);
  console.log('VIDA8_SYNTHETIC_LUNAR',{targets:1000,colonies,sterileColonies,imported});
});
test('VIDA.8: terraformacion sin alteracion fisica, bajo civilizacion muy avanzada',()=>{
  let projects=0,colonies=0;
  for(let n=2000;n<3000;n++){
    const t=target(n,'PLANET'),unchanged=JSON.stringify(t);
    const snapshot=engine.evaluate(t,[source]);
    assert.equal(JSON.stringify(t),unchanged);
    for(const c of snapshot.colonies){
      colonies++;
      if(c.terraform){projects++;assert.equal(c.terraform.environmentChanged,false);
        assert.equal(c.terraform.ecologicalReleaseAuthorized,false);}
    }
  }
  assert(colonies>100&&projects>10);
  console.log('VIDA8_SYNTHETIC_TERRAFORM',{targets:1000,colonies,projects});
});
test('VIDA.8: ni colonias primitivas ni planetas sin superficie solida',()=>{
  const primitive={...source,civilization:{...sourceCiv,
    civilization:{...sourceCiv.civilization,tier:'PRIMITIVE',technology:['HAND_TOOLS']}}};
  assert.equal(engine.evaluate(target(5,'MOON'),[primitive]).colonies.length,0);
  assert.equal(engine.evaluate({...target(5,'PLANET'),solidSurface:false},[source]).colonies.length,0);
});
