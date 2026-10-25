import {describe,it,expect} from 'vitest';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import {PlanetH2OForwardCT0EnginePRE3303A3 as Engine} from './planet-h2o-forward-ct0-pre33-03a3';
import {validateH2OForwardCT0Result} from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';

function fixture(radiusAu=8,withSource=true){
 const locator={galaxyIndex:0n,sectorKey:12n,galacticObjectIndex:2n,bodyIndex:0n};
 const planet={locator,architectureSlot:{referenceAssemblyRadiusAu:radiusAu},
   physicalProperties:{massEarth:1.0,inheritedSolidCoreMassEarth:.95,radiusEarth:1.5},
   internalComposition:{condensedIceMassEarth:.25,volatileRichInteriorMassEarth:.15,
     gaseousEnvelopeMassEarth:.05,metallicCoreMassEarth:.2,silicateInteriorMassEarth:.35},
   hostPlanetarySystem:{hostStellarSystem:{primaryReferenceLuminositySolar:withSource?1:null}}
  } as unknown as Planet;
 const atmosphere={hostPlanet:planet,climateState:{meanSurfaceTemperatureKelvin:270},
   waterInventory:{sourceRetainedSurfacePressurePascal:90000}} as unknown as Atmosphere;
 return {planet,atmosphere};
}
const env={sourceId:'formation disk star A',stellarLuminosityAtFormationSolar:1,metallicitySolarRatio:1};
const h={sourceId:'dated model',ageYearsCT0:1000,complete:true as const,
 intervals:[{sourceId:'xuv-interval',fromYear:0,toYear:1000,
  incidentXuvWattsPerSquareMeter:2,heatingEfficiency01:.1,escapingH2OMassFraction01:1,rocheFactor01:1}],
 transfers:[{sourceId:'outgas',epochYears:0,from:'INTERIOR_WATER' as const,
  to:'ATMOSPHERIC_VAPOR' as const,process:'OUTGASS' as const,kilograms:1e12}]
};
describe('PRE-33.03a.3: forward chemistry, dated balance and layers',()=>{
 it('forms water beyond the snow line without any random percentage of 19.5',()=>{
  const {planet,atmosphere}=fixture();
  const r=Engine.project(planet,atmosphere,env);
  expect(r.waterKilograms.modeledFormation).toBeGreaterThan(0);
  expect(r.status).toBe('MODELED_FORMATION_NO_COMPLETE_HISTORY');
  expect(r.waterKilograms.modeledCT0).toBeNull();
  expect(r.physicalCT0InventoryCertified).toBe(false);
  expect(validateH2OForwardCT0Result(r)).toEqual([]);
 });
 it('ice condensation changes with actual assembly radius, not body seed',()=>{
  const warm=fixture(.2),cold=fixture(8);
  const a=Engine.project(warm.planet,warm.atmosphere,env);
  const b=Engine.project(cold.planet,cold.atmosphere,env);
  expect(a.waterKilograms.modeledFormation).toBe(0);
  expect(b.waterKilograms.modeledFormation).toBeGreaterThan(0);
 });
 it('dated input conserves delivered, escaped and CT0 water with no fabricated events',()=>{
  const {planet,atmosphere}=fixture();
  const r=Engine.project(planet,atmosphere,{...env,history:h});
  expect(r.status).toBe('MODELED_CT0_RESERVOIRS');
  expect(r.relativeMassResidual01).toBeLessThan(1e-9);
  expect(validateH2OForwardCT0Result(r)).toEqual([]);
  expect(r.physicalCT0InventoryCertified).toBe(false);
 });
 it('rejects an incomplete forcing interval, foreign atmosphere or missing provenance',()=>{
  const {planet,atmosphere}=fixture();
  expect(()=>Engine.project(planet,atmosphere,{...env,history:{...h,intervals:[]}})).toThrow();
  expect(()=>Engine.project(planet,{...atmosphere,hostPlanet:{} as Planet} as unknown as Atmosphere)).toThrow();
  expect(()=>Engine.project(planet,atmosphere,{...env,sourceId:''})).toThrow();
 });
 it('rejects transfer without reservoir, prevents double-counted water',()=>{
  const {planet,atmosphere}=fixture();
  const bad={...h,transfers:[{...h.transfers[0]!,kilograms:1e26}]};
  expect(()=>Engine.project(planet,atmosphere,{...env,history:bad})).toThrow();
 });
 it('cannot assert a CT0 ocean without independent P–T source',()=>{
  const {planet,atmosphere}=fixture();
  const r=Engine.project(planet,atmosphere,{...env,history:h});
  expect(r.deepWater.liquidLayerThicknessMeters).toBeNull();
  expect(r.oceanExistenceCertified).toBe(false);
 });
 it('does not change frozen composition or player observation',()=>{
  const {planet,atmosphere}=fixture();
  const before=JSON.stringify(planet.internalComposition);
  const r=Engine.project(planet,atmosphere,env);
  expect(JSON.stringify(planet.internalComposition)).toBe(before);
  expect(r.observedEvidenceGranted).toBe(false);
 });
 it('without a formation environment, returns an honest unresolved model',()=>{
  const {planet,atmosphere}=fixture(8,false);
  const r=Engine.project(planet,atmosphere);
  expect(r.status).toBe('NO_FORMATION_ENVIRONMENT');
  expect(r.waterKilograms.modeledFormation).toBeNull();
 });
});
