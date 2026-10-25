'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ts=require('typescript');
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),
  {fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {GeochemistryReactionEnginePRE3307:Engine}=require('../src/app/simulation/planetary/geochemistry-reaction-engine-pre33-07.ts');
const {geoChemicalFieldsPRE3307:fields}=require('../src/app/presentation/scientific/geochemistry-fields-pre33-07.ts');
const {unifyPlanetFicheSections}=require('../src/app/presentation/planet-detail/planet-scientific-fiche-layout.ts');
const basis=()=>({niche:{bodyKind:'PLANET',niche:'SOLID_SURFACE',solvent:'H2O',
  solventState:'MODELLED_LIQUID_CT0',waterRockContact:'UNRESOLVED',temperatureKelvin:298.15,
  pressurePascal:1e5,thermalHeatFluxWattsPerSquareMeter:1e8,sourceId:'TEST_SOLVENT'},intervalSeconds:10,
  provenance:'INDEPENDENT_REACTION_MASS_AND_RATE_MODEL',inventory:[
  {species:'H2',phase:'AQUEOUS',amountMoles:2,activity:1,sourceId:'LAB_H2'},
  {species:'O2',phase:'AQUEOUS',amountMoles:1,activity:1,sourceId:'LAB_O2'},
  {species:'H2O',phase:'LIQUID',amountMoles:10,activity:1,sourceId:'LAB_WATER'},
 ],kinetics:[{route:'HYDROGEN_OXIDATION',standardGibbsJoulesPerMole:-474000,temperatureKelvin:298.15,
 pressurePascal:1e5,forwardRateMolesPerSecond:0.01,thermodynamicSourceId:'LAB_GIBBS',kineticSourceId:'LAB_RATE'}]});
test('six balanced reactions',()=>assert.equal(Engine.verifyStoichiometry(),true));
test('independent Gibbs and kinetics -> 4740 W',()=>assert.equal(Engine.assess(basis()).quantifiedPathwayPowerWatts,4740));
test('missing rates cannot infer energy from thermal flux',()=>assert.equal(Engine.assess({...basis(),kinetics:[]}).quantifiedPathwayPowerWatts,null));
test('zero oxidant is absent, not unknown',()=>{const b=basis();assert.equal(Engine.assess({...b,inventory:b.inventory.map(i=>i.species==='O2'?{...i,activity:null,amountMoles:0}:i)}).reactions[0].status,'REACTANT_ABSENT');});
test('missing oxidant is hypothetical, no power',()=>{const b=basis();assert.equal(Engine.assess({...b,inventory:b.inventory.filter(i=>i.species!=='O2')}).reactions[0].chemicalPowerWatts,null);});
test('thermodynamic endergonic route cannot produce power',()=>{const b=basis();assert.equal(Engine.assess({...b,kinetics:b.kinetics.map(k=>({...k,standardGibbsJoulesPerMole:10}))}).reactions[0].chemicalPowerWatts,0);});
test('stock caps rate, no more reactants than supplied',()=>{const b=basis();assert.equal(Engine.assess({...b,kinetics:b.kinetics.map(k=>({...k,forwardRateMolesPerSecond:100}))}).reactions[0].reactionExtentMoles,1);});
test('conditional chemistry is not physical evidence',()=>assert.equal(Engine.assess({...basis(),provenance:'CONDITIONAL_ENDMEMBER'}).quantifiedPathwayPowerWatts,null));
test('no water -> no aqueous bioenergetic route',()=>{const b=basis();assert.equal(Engine.assess({...b,niche:{...b.niche,solvent:'CH4'}}).quantifiedPathwayPowerWatts,null);});
test('thermal flux cannot change resolved reaction power',()=>{const b=basis();assert.equal(Engine.assess({...b,niche:{...b.niche,thermalHeatFluxWattsPerSquareMeter:0}}).quantifiedPathwayPowerWatts,Engine.assess(b).quantifiedPathwayPowerWatts);});
test('outputs present non-evidence correctly',()=>{const a=fields(Engine.assess({...basis(),kinetics:[]}));assert(a.some(x=>x.value.includes('No evaluable')));assert(a.every(x=>!x.value.includes('4740')));});
test('reaction output is deterministic, no random seed',()=>{const a=JSON.stringify(Engine.assess(basis()));assert.equal(a,JSON.stringify(Engine.assess(basis())));});

test('V3 geoquímica planetaria survives canonical fiche; V2 does not gain placeholders',()=>{
  const p={id:'geology',eyebrow:'',title:'',summary:'',fields:[{label:'PRE-33.07 — Potencia química exergónica (ruta)',value:'No evaluable',note:'CT-0'}]};
  const v3=unifyPlanetFicheSections([p])[0],v2=unifyPlanetFicheSections([{...p,fields:[]}])[0];
  assert(v3.fields.some(f=>f.label.startsWith('PRE-33.07')));
  assert(v2.fields.every(f=>!f.label.startsWith('PRE-33.07')));
});
