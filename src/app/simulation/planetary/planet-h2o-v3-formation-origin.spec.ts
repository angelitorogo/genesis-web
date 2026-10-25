import {describe, it, expect} from 'vitest';
import type {PlanetarySystem} from '../../domain/planetary/planetary-system';
import type {Planet} from '../../domain/planetary/planet';
import type {ProtoplanetaryDiskProfile} from '../../domain/planetary/protoplanetary-disk-profile';
import type {PlanetFormationProfile} from '../../domain/planetary/planet-formation-profile';
import {PlanetH2OV3FormationOrigin as Origin} from './planet-h2o-v3-formation-origin';
import {PlanetH2OForwardCT0EnginePRE3303A3 as Forward} from './planet-h2o-forward-ct0-pre33-03a3';
import type {Atmosphere} from '../../domain/planetary/atmosphere';

function fixture(t1=280,waterBearing=0.7){
 const locator={galaxyIndex:0n,sectorKey:4n,galacticObjectIndex:0n};
 const anchors=[
  {solidCoreMassEarth:0.6,assemblyRadiusAu:0.3,compositionMixture:{iceBearingFraction01:waterBearing}},
  {solidCoreMassEarth:0.6,assemblyRadiusAu:9,compositionMixture:{iceBearingFraction01:waterBearing}},
 ];
 const slots=[0n,1n].map((i)=>({bodyLocator:{bodyIndex:i},
  sourceAnchorOrdinals:[Number(i)+1],sourceFormationOrdinals:[Number(i)+1],
  referenceAssemblyRadiusAu:i===0n?.3:9}));
 const planetarySystem={generationKey:{universeSeed:{normalizedValue:'7F21A9D418CE4B7092F16A0C6E35D8B5'}},
  hostStellarSystem:{locator},planetSlots:slots,
  formationBlueprint:{formationAnchors:anchors,sourceDustMassEarth:1.2}} as unknown as PlanetarySystem;
 const disk={referenceTemperatureAt1AuKelvin:t1} as ProtoplanetaryDiskProfile;
 const profile={metallicitySolarRatio:1} as PlanetFormationProfile;
 const planet=(i:number)=>({locator:{...locator,bodyIndex:BigInt(i)},
  architectureSlot:slots[i],hostPlanetarySystem:planetarySystem,
  physicalProperties:{massEarth:1.0,radiusEarth:1.5,inheritedSolidCoreMassEarth:.95},
  internalComposition:{condensedIceMassEarth:0,volatileRichInteriorMassEarth:0,
   gaseousEnvelopeMassEarth:.05,metallicCoreMassEarth:.2,silicateInteriorMassEarth:.75}} as unknown as Planet);
 return {planetarySystem,disk,profile,planet};
}

describe('PRE-33.03a.3 V3 origin: disk formation source precedes phase 19.5',()=>{
 it('assigns water using 17.7 anchors and shared disk budget, not mature material buckets',()=>{
  const f=fixture();const records=Origin.registerAtFormation(f.planetarySystem,f.disk,f.profile);
  expect(records).toHaveLength(2);
  expect(records[0]!.formationWaterKilograms).toBe(0);
  expect(records[1]!.formationWaterKilograms).toBeGreaterThan(0);
  expect(records.reduce((s,r)=>s+r.formationWaterKilograms,0))
   .toBeLessThanOrEqual(records[0]!.diskWaterBudgetKilograms*(1+1e-9));
  expect(Origin.sourceForPlanet(f.planet(1))).toBe(records[1]);
  const planet=f.planet(1);const atmosphere={hostPlanet:planet,climateState:{meanSurfaceTemperatureKelvin:250},
   waterInventory:{sourceRetainedSurfacePressurePascal:1000}} as unknown as Atmosphere;
  const result=Forward.project(planet,atmosphere,Origin.environmentForPlanet(planet)!);
  expect(result.source.chemistry).toBe('V3_FORMATION_DISK_ELEMENTAL_MODEL');
  expect(result.waterKilograms.modeledFormation).toBeCloseTo(records[1]!.formationWaterKilograms,1);
  expect(result.waterKilograms.modeledCT0).toBeNull();
  expect(result.physicalCT0InventoryCertified).toBe(false);
 });
 it('rejects duplicate registration, never swaps body identities',()=>{
  const f=fixture();Origin.registerAtFormation(f.planetarySystem,f.disk,f.profile);
  expect(()=>Origin.registerAtFormation(f.planetarySystem,f.disk,f.profile)).toThrow();
  const foreign=f.planet(0) as unknown as {architectureSlot:{sourceFormationOrdinals:number[]}};
  foreign.architectureSlot={sourceFormationOrdinals:[77]};
  expect(()=>Origin.sourceForPlanet(foreign as unknown as Planet)).toThrow();
 });
 it('warm disk cannot create cold condensates and zero ice carriers stay dry',()=>{
  const a=fixture(1200);const b=fixture(280,0);
  expect(Origin.registerAtFormation(a.planetarySystem,a.disk,a.profile).every(x=>x.formationWaterKilograms===0)).toBe(true);
  expect(Origin.registerAtFormation(b.planetarySystem,b.disk,b.profile).every(x=>x.formationWaterKilograms===0)).toBe(true);
 });
 it('rejects a foreign chemistry claim in the forward model',()=>{
  const f=fixture(),p=f.planet(1);
  const atm={hostPlanet:p,climateState:{meanSurfaceTemperatureKelvin:250},
   waterInventory:{sourceRetainedSurfacePressurePascal:1000}} as unknown as Atmosphere;
  expect(()=>Forward.project(p,atm,{sourceId:'forged',stellarLuminosityAtFormationSolar:1,
   metallicitySolarRatio:1,formationWaterKilogramsFromDisk:1e20})).toThrow();
 });
});
