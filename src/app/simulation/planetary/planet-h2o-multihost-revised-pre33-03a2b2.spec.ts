import {describe,it,expect} from 'vitest';
import {UniverseSeed} from '../../domain/universe/universe-seed';
import {UniverseGenerationKey} from '../../domain/generation/universe-generation-key';
import {GeneratorVersion} from '../../domain/generation/generator-version';
import {StellarEvolutionInput} from '../../domain/stellar/stellar-evolution-input';
import {StellarEvolutionEngine} from '../stellar/stellar-evolution-engine';
import type {GeneratedMultipleHost,GeneratedPublicPlanet} from '../stellar/stellar-multihost-formation';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import {PlanetH2OFormationEnginePRE3303A} from './planet-h2o-formation-engine-pre33-03a';
import {PlanetH2OMultihostRevisedPRE3303A2B2 as engine} from './planet-h2o-multihost-revised-pre33-03a2b2';
const v1=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V1);
const v2=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V2);
function inputs(ages=[4,8],masses=[1,.8],host:'A'|'B'|'AB'='A',temp:number|null=290){
 const loc={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
 const planet={name:'fixture',locator:loc,planetOrdinal:1,
  seed:{kind:'body',normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'},
  orbit:{semiMajorAxisAu:host==='AB'?260:1,eccentricity:.04},
  orbitTopology:host==='AB'?'CIRCUMBINARY':'CIRCUMSTELLAR',
  physicalProperties:{massEarth:2,radiusEarth:1.2,accretedEnvelopeMassEarth:.2,surfaceGravityMetersPerSecondSquared:13.625},
  internalComposition:{metallicCoreMassEarth:.4,silicateInteriorMassEarth:.8,
    condensedIceMassEarth:.4,volatileRichInteriorMassEarth:.2,gaseousEnvelopeMassEarth:.2}} as unknown as Planet;
 const p=temp===null?null:80000;
 const atmosphere={hostPlanet:planet,retentionState:{bodyLocator:loc,planetOrdinal:1,retainedSurfacePressurePascal:p},
  climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:temp},
  climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
  waterInventory:{bodyLocator:loc,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
   waterInventoryIndex01:.5,surfaceLiquidWaterCoverageFraction01:.1,surfaceIceCoverageFraction01:.2},
  greenhouseEffect:{condensableEquilibriumState:p===null?null:{converged:true,sourceSurfacePressurePascal:p,
   effectiveSurfacePressurePascal:p,effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:.98},
    {gas:'WATER_VAPOR',moleFraction01:.02}],speciesEquilibria:[]},waterVaporEquilibriumState:null}} as unknown as Atmosphere;
 const components=ages.map((age,i)=>({label:'ABC'[i],internalGenerationKey:v1,
  physical:{initialMassSolar:masses[i],currentMassSolar:masses[i],luminositySolar:masses[i]},
  lifetime:{ageBillionYears:age,evolutionAssessment:StellarEvolutionEngine.evaluate(v1,
   new StellarEvolutionInput(masses[i]!,1,age))}}));
 const entry={host,planet,atmosphere} as GeneratedPublicPlanet;
 const mult={parentGenerationKey:v2,parentLocator:loc,components,publicPlanets:[entry],
  innerOrbit:{semiMajorAxisAu:100,eccentricity:.12},
  outerOrbit:ages.length===3?{semiMajorAxisAu:1000,eccentricity:.18}:null} as unknown as GeneratedMultipleHost;
 return {mult,entry,formation:PlanetH2OFormationEnginePRE3303A.project(planet,atmosphere)};
}
function go(ages?:number[],masses?:number[],host?:'A'|'B'|'AB',temp?:number|null){
 const x=inputs(ages,masses,host,temp);
 return {result:engine.project(x.mult,x.entry,x.formation),...x};
}
describe('PRE-33.03a.2b.2 versioned H2O scientific forcing boundary',()=>{
 it('uses new revised coeval lifetimes even when frozen B age differs',()=>{
  const r=go().result;
  expect(r.scientificSource.components.map(c=>c.revisedAgeBillionYears)).toEqual([4,4]);
  expect(r.status).toBe('VERSIONED_COEVAL_HISTORY_CONDITIONAL');
  expect(r.conditionalH2O?.history?.ageYearsCT0).toBe(4e9);
 });
 it('blocks mixing WHITE_DWARF frozen B with MAIN_SEQUENCE revised B and old planets',()=>{
  const r=go([4,12],[1,1]).result;
  expect(r.scientificSource.components[1].phaseChanged).toBe(true);
  expect(r.status).toBe('REQUIRES_ATOMIC_PLANET_REGENERATION');
  expect(r.conditionalH2O).toBeNull();
 });
 it('never promotes modeled CT0 masses to an observed or certified ocean',()=>{
  const r=go().result;
  expect(r.oceanCT0Certified).toBe(false);
  expect(r.conditionalH2O?.ct0Certified).toBe(false);
  expect(r.conditionalH2O?.observedEvidenceGranted).toBe(false);
 });
 it('enforces atomic regeneration and no implicit migration',()=>{
  const r=go().result;
  expect(r.noAutomaticSavedUniverseMigration).toBe(true);
  expect(r.scientificSource.gameCutoverActivated).toBe(false);
  expect(r.scientificSource.migrationRequiresAtomicRegeneration).toBe(true);
 });
 it('preserves S vs P architecture with separate flux sources',()=>{
  const s=go().result,p=go([4,8],[1,.8],'AB').result;
  expect(s.conditionalH2O?.status).toBe('MODELED_DATED_CONDITIONAL_MULTIPLE_S');
  expect(p.conditionalH2O?.status).toBe('MODELED_DATED_CONDITIONAL_MULTIPLE_P');
 });
 it('does not fabricate a surface or H2O history when surface climate is absent',()=>{
  const r=go([4,8],[1,.8],'A',null).result;
  expect(r.status).toBe('NO_RESOLVED_FORCING_OR_SURFACE');
  expect(r.conditionalH2O?.history).toBeNull();
 });
 it('passes through the original planet identity but does not change V2 data',()=>{
  const x=inputs();const old=x.mult.components.map(c=>c.lifetime.ageBillionYears).join(',');
  const original=x.entry.planet.locator;
  const r=engine.project(x.mult,x.entry,x.formation);
  expect(x.mult.components.map(c=>c.lifetime.ageBillionYears).join(',')).toBe(old);
  expect(x.entry.planet.locator).toBe(original);
  expect(r.copiedFrozenPlanetSnapshot).toBe(true);
 });
 it('rejects bodies not owned by that system',()=>{
  const x=inputs(),y=inputs();
  expect(()=>engine.project(x.mult,y.entry,x.formation)).toThrow(/FOREIGN_PUBLIC_PLANET/);
 });
 it('is fully deterministic',()=>{
  const x=inputs();
  expect(JSON.stringify(engine.project(x.mult,x.entry,x.formation)))
   .toBe(JSON.stringify(engine.project(x.mult,x.entry,x.formation)));
 });
});
