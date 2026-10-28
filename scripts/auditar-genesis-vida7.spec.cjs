'use strict';
/** Auditoria portable VIDA.7 sobre escenarios sinteticos, no censo real de Elixisis. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
if(!require.extensions['.ts'])require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(
 fs.readFileSync(f,'utf8'),{fileName:f,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const root=path.resolve(__dirname,'../src/app');
const load=rel=>require(path.join(root,rel));
const {Vida7IntelligenceCivilizations}=load('simulation/life/vida7-intelligence-civilizations.ts');
const {Vida6EcosystemsSpecies}=load('simulation/life/vida6-ecosystems-species.ts');
const {ProceduralEcologyVIDA4}=load('simulation/life/procedural-ecology-vida4.ts');
const {VIDA4_GROUPS}=load('domain/life/procedural-ecology-vida4.ts');
const {VIDA7_TIER_PROBABILITIES}=load('domain/life/vida7-intelligence-civilizations.ts');
const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
function scenario(n,kind='PLANET',habitat='SURFACE_OPEN'){
 const id={universeSeed:seed,generatorVersionCode:3,kind,galaxyIndex:'0',sectorKey:'0',
   galacticObjectIndex:'0',bodyIndex:String(n),moonIndex:kind==='MOON'?'1':null};
 const micro={revision:'VIDA.3/microbial/v3-aquifer-lunar-surface',identity:id,
  bodyStorageKey:`0:0:0:${n}:${kind}:${id.moonIndex??'-'}`,plausibility:'PLAUSIBLE',
  selectedRoute:habitat==='SUBSURFACE'?'SUBSURFACE':'SURFACE',habitat,lifePresent:true,
  biology:'MICROBIAL',biosphereId:'vida3:audit',digest:n.toString(16).padStart(64,'0')};
 const ecology=ProceduralEcologyVIDA4.evaluate(micro);
 const calibration=kind==='PLANET'&&habitat==='SURFACE_OPEN'?{
  revision:'VIDA.5c/advanced-biosphere/v1',identity:{universeSeed:seed,
   generatorVersionCode:3,galaxyIndex:'0'},bodyStorageKey:micro.bodyStorageKey,
  originalMicrobialDigest:micro.digest,originalEcologyDigest:ecology.digest,
  originalMaturationDigest:'audit',originalMicrobialLifePresent:true,
  effectiveMicrobialLifePresent:true,newlyEstablishedMicrobialLife:false,
  originalEffectiveGroups:ecology.groups,effectiveGroups:VIDA4_GROUPS,
  promotedFromPhysicalEvidence:true,advancedAtmosphereSuitable:true,
  atmosphericFeedback:{status:'APPLIED',oxygenFraction01:.21,oxygenPartialPressurePascal:21000},
  nativeCivilizationPrerequisitesReady:true,
  futureIntelligenceProbability:.65,futureCivilizationConditionalProbability:.60,
  digest:`audit-${n}`}:undefined;
 const ecosystem=Vida6EcosystemsSpecies.evaluate(micro,ecology,calibration);
 const result=Vida7IntelligenceCivilizations.evaluate(ecosystem,calibration);
 return {ecosystem,result};
}
test('VIDA.7 mantiene trazabilidad y dos etapas de seleccion por seed',()=>{
 let intelligence=0,civilizations=0,withoutCivilization=0;
 const lineages=new Set(); const tiers={PRIMITIVE:0,ADVANCED:0,VERY_ADVANCED:0};
 for(let i=0;i<1500;i++){
  const {ecosystem,result}=scenario(i);
  assert.deepEqual(result,Vida7IntelligenceCivilizations.evaluate(ecosystem,{
   revision:'VIDA.5c/advanced-biosphere/v1',identity:{universeSeed:seed,generatorVersionCode:3,galaxyIndex:'0'},
   bodyStorageKey:ecosystem.bodyStorageKey,originalEcologyDigest:ecosystem.originalEcologyDigest,
   originalMicrobialDigest:ecosystem.microbialDigest,effectiveGroups:VIDA4_GROUPS,
   futureIntelligenceProbability:.65,futureCivilizationConditionalProbability:.60,
   digest:ecosystem.calibrationDigest,advancedAtmosphereSuitable:true,
   atmosphericFeedback:{status:'APPLIED',oxygenFraction01:.21,oxygenPartialPressurePascal:21000},
   nativeCivilizationPrerequisitesReady:true,
  }));
  if(result.intelligencePresent)intelligence++;
  if(result.intelligencePresent&&!result.civilizationPresent)withoutCivilization++;
  if(!result.civilization)continue;
  civilizations++;tiers[result.civilization.tier]++;lineages.add(result.civilization.lineage);
  assert(ecosystem.species.some(x=>x.id===result.civilization.founderSpeciesId));
  for(const s of result.civilization.settlementPatterns){
    assert(ecosystem.habitatsOccupied.includes(s.habitat));
    assert(s.habitat.startsWith('SURFACE_'));
    if(s.habitat==='SURFACE_CANOPY')assert.equal(s.builtForm==='CANOPY_NEST'||s.builtForm==='INTEGRATED_HABITAT',true);
  }
 }
 assert(intelligence>600 && civilizations>300 && withoutCivilization>200);
 assert.deepEqual([...lineages].sort(),['HUMANOID','INSECTOID','REPTILIAN']);
 for(const tier of Object.keys(tiers)){
   assert(Math.abs(tiers[tier]/civilizations-VIDA7_TIER_PROBABILITIES[tier]) < (tier==='VERY_ADVANCED'?.03:.06));
 }
 console.log(JSON.stringify({scenarios:1500,intelligence,civilizations,withoutCivilization,tiers,lineages:[...lineages]}));
});
test('VIDA.7 no genera inteligencia en lunas ni subsuelos aislados',()=>{
 for(let i=0;i<200;i++)for(const [kind,hab] of [['MOON','SUBSURFACE'],['PLANET','SUBSURFACE']]){
  const {result}=scenario(i,kind,hab);
  assert.equal(result.intelligencePresent,false);assert.equal(result.civilizationPresent,false);
 }
});
