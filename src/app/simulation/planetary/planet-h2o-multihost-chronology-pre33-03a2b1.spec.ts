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
import {PlanetH2OMultihostChronologyPRE3303A2B1 as engine} from './planet-h2o-multihost-chronology-pre33-03a2b1';
const key=new UniverseGenerationKey(UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),GeneratorVersion.V1);
function fixtures(ages=[4,8],masses=[1,.8],planetHost:'A'|'B'|'AB'='A',temp:number|null=290){
 const loc={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
 const planet={name:'test',locator:loc,planetOrdinal:1,
   seed:{kind:'body',normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'},
   orbit:{semiMajorAxisAu:planetHost==='AB'?260:1,eccentricity:.04},
   orbitTopology:planetHost==='AB'?'CIRCUMBINARY':'CIRCUMSTELLAR',
   physicalProperties:{massEarth:2,radiusEarth:1.2,accretedEnvelopeMassEarth:.2,surfaceGravityMetersPerSecondSquared:13.625},
   internalComposition:{metallicCoreMassEarth:.4,silicateInteriorMassEarth:.8,
     condensedIceMassEarth:.4,volatileRichInteriorMassEarth:.2,gaseousEnvelopeMassEarth:.2}} as unknown as Planet;
 const p=temp===null?null:80000;
 const atm={hostPlanet:planet,retentionState:{bodyLocator:loc,planetOrdinal:1,retainedSurfacePressurePascal:p},
  climateState:{planetOrdinal:1,meanSurfaceTemperatureKelvin:temp},
  climateVariabilityState:{planetOrdinal:1,sourceRetainedSurfacePressurePascal:p},
  waterInventory:{bodyLocator:loc,planetOrdinal:1,sourceRetainedSurfacePressurePascal:p,
   waterInventoryIndex01:.5,surfaceLiquidWaterCoverageFraction01:.1,surfaceIceCoverageFraction01:.2},
  greenhouseEffect:{condensableEquilibriumState:p===null?null:{converged:true,sourceSurfacePressurePascal:p,
   effectiveSurfacePressurePascal:p,effectiveGasComponents:[{gas:'NITROGEN',moleFraction01:.98},
    {gas:'WATER_VAPOR',moleFraction01:.02}],speciesEquilibria:[]},waterVaporEquilibriumState:null}} as unknown as Atmosphere;
 const components=ages.map((age,i)=>({label:'ABC'[i],internalGenerationKey:key,
   physical:{initialMassSolar:masses[i],currentMassSolar:masses[i],luminositySolar:masses[i]},
   lifetime:{ageBillionYears:age,evolutionAssessment:StellarEvolutionEngine.evaluate(key,new StellarEvolutionInput(masses[i],1,age))}}));
 const entry={host:planetHost,planet,atmosphere:atm} as GeneratedPublicPlanet;
 const mult={parentLocator:loc,components,publicPlanets:[entry],
   innerOrbit:{semiMajorAxisAu:100,eccentricity:.12},outerOrbit:ages.length===3?{semiMajorAxisAu:1000,eccentricity:.18}:null} as unknown as GeneratedMultipleHost;
 return {mult,entry,formation:PlanetH2OFormationEnginePRE3303A.project(planet,atm)};
}
const go=(ages?:number[],masses?:number[],host?:'A'|'B'|'AB',temp?:number|null)=>{
 const f=fixtures(ages,masses,host,temp);return {out:engine.project(f.mult,f.entry,f.formation),...f};
};
describe('PRE-33.03a.2b.1 coeval shadow, frozen V2 remains immutable',()=>{
 it('detects root problem: two frozen, independently aged component assessments',()=>{
  const a=go();expect(a.out.components.map(x=>x.frozenAgeBillionYears)).toEqual([4,8]);
  expect(a.out.sharedAgeReferenceBillionYears).toBe(4);
  expect(a.out.frozenComponentsCoEval).toBe(false);
 });
 it('recomputes age-4 B with the original mass and metallicity, not the age-8 stellar clock',()=>{
  const a=go();expect(a.out.components[1].recomputedAtPrimaryAgeState).toBe('MAIN_SEQUENCE');
  expect(a.out.status).toBe('COEVAL_REFERENCE_CONDITIONAL_COMPLETED');
  expect(a.out.conditionalReference?.history?.segments.at(-1)?.endYear).toBe(4e9);
 });
 it('never overwrites the V2 original age, assessment or planet identity',()=>{
  const json=(v:unknown)=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x);
  const x=fixtures(),before=json(x.mult.components),loc=x.entry.planet.locator;
  const out=engine.project(x.mult,x.entry,x.formation);
  expect(json(x.mult.components)).toBe(before);expect(x.entry.planet.locator).toBe(loc);
  expect(out.editsFrozenV2).toBe(false);expect(out.editsPhase32).toBe(false);
 });
 it('cannot certify CT0 ocean, chronology or knowledge even if model conserves H2O',()=>{
  const a=go().out;expect(a.waterCT0Certified).toBe(false);
  expect(a.realMultiHostHistoryCertified).toBe(false);
  expect(a.conditionalReference?.evolution?.massBalance.conditionalConservationVerified).toBe(true);
  expect(a.conditionalReference?.observedEvidenceGranted).toBe(false);
 });
 it('cannot re-age a WHITE_DWARF into MAIN_SEQUENCE without exposing conflict',()=>{
  const a=go([4,12],[1,1]);expect(a.out.status).toBe('UNRESOLVED_COEVAL_PHASE_CONFLICT');
  expect(a.out.conditionalReference).toBeNull();expect(a.out.components[1].phaseCompatible).toBe(false);
 });
 it('keeps the already-coeval original history distinguished from reconstruction',()=>{
  const a=go([4,4]);expect(a.out.status).toBe('FROZEN_COMPONENTS_ALREADY_COEVAL');
  expect(a.out.frozenComponentsCoEval).toBe(true);
 });
 it('P-type history remains P-type with phase averaged A/B, never S-type',()=>{
  const a=go([4,8],[1,.8],'AB');expect(a.out.status).toBe('COEVAL_REFERENCE_CONDITIONAL_COMPLETED');
  expect(a.out.conditionalReference?.status).toBe('MODELED_DATED_CONDITIONAL_MULTIPLE_P');
 });
 it('triple remains three independent stellar masses and phases',()=>{
  const a=go([4,8,6],[1,.8,.6]);expect(a.out.components.length).toBe(3);
  expect(a.out.conditionalReference?.componentSourceKeys.length).toBe(3);
 });
 it('surface absence does not invent an ocean',()=>{
  const a=go([4,8],[1,.8],'A',null);expect(a.out.status).toBe('UNRESOLVED_FORCING_OR_SURFACE');
  expect(a.out.conditionalReference?.history).toBeNull();
 });
 it('rejects a public body foreign to the parent aggregate',()=>{
  const x=fixtures(),y=fixtures();expect(()=>engine.project(x.mult,y.entry,x.formation)).toThrow(/FOREIGN_PUBLIC_BODY/);
 });
 it('deterministic across repeated calls',()=>{
  const x=fixtures();expect(JSON.stringify(engine.project(x.mult,x.entry,x.formation)))
   .toBe(JSON.stringify(engine.project(x.mult,x.entry,x.formation)));
 });
 it('chronology years are finite and never secondary-age borrowed',()=>{
  const a=go().out;expect(a.components[0].mainSequenceEndBillionYears).toBeGreaterThan(4);
  expect(a.conditionalReference?.history?.ageYearsCT0).toBe(4e9);
 });
});
