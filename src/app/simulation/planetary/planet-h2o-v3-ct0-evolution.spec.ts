import {describe,it,expect} from 'vitest';
import type {Planet} from '../../domain/planetary/planet';
import type {Atmosphere} from '../../domain/planetary/atmosphere';
import type {V3DiskWaterOrigin} from './planet-h2o-v3-formation-origin';
import {PlanetH2OV3CT0Evolution as Evolution} from './planet-h2o-v3-ct0-evolution';
import {PlanetH2OForwardCT0EnginePRE3303A3 as Forward} from './planet-h2o-forward-ct0-pre33-03a3';
import {validateH2OForwardCT0Result} from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';

function fixture(water=1e23, age=4e9, luminosity=1, temperature=285){
  const slot={referenceAssemblyRadiusAu:8,sourceFormationOrdinals:[1]};
  const planet={
    locator:{galaxyIndex:1n,sectorKey:2n,galacticObjectIndex:3n,bodyIndex:0n},
    architectureSlot:slot,orbit:{semiMajorAxisAu:1,eccentricity:.02},
    physicalProperties:{massEarth:1,radiusEarth:1,inheritedSolidCoreMassEarth:.95},
    internalComposition:{condensedIceMassEarth:.2,volatileRichInteriorMassEarth:.1,
      gaseousEnvelopeMassEarth:.001,metallicCoreMassEarth:.3,silicateInteriorMassEarth:.399},
  } as unknown as Planet;
  const atmosphere={hostPlanet:planet,climateState:{meanSurfaceTemperatureKelvin:temperature},
    waterInventory:{sourceRetainedSurfacePressurePascal:101325}} as unknown as Atmosphere;
  const origin={
    contract:'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1',sourceId:'V3/forming-disk/G1/O3/B0',
    bodyIndex:0n,sourceFormationOrdinals:[1],formationWaterKilograms:water,
    assemblyTemperatureKelvin:145,metallicitySolarRatio:1,carbonOxygenRatio:.549,
    timeSinceFormationYears:age,stellarAgeYearsCT0:age+4e7,
    sourceStellarMassSolar:1,sourceBolometricLuminositySolar:luminosity,
    lateDeliveryWaterBudgetKilograms:water*.02,
  } as unknown as V3DiskWaterOrigin;
  return {planet,atmosphere,origin};
}
function project(f:ReturnType<typeof fixture>){
  const environment=Evolution.fromOrigin(f.planet,f.atmosphere,f.origin);
  return Forward.project(f.planet,f.atmosphere,environment);
}
describe('PRE-33.03a.3: V3 complete physical-model CT0 timeline',()=>{
  it('closes chronology, formation, delivery, escape and all reservoirs by model',()=>{
    const f=fixture();const env=Evolution.fromOrigin(f.planet,f.atmosphere,f.origin);
    expect(env.history?.intervals[0]?.fromYear).toBe(0);
    expect(env.history?.intervals.at(-1)?.toYear).toBe(4e9);
    const r=Forward.project(f.planet,f.atmosphere,env);
    expect(r.status).toBe('MODELED_CT0_RESERVOIRS');
    expect(r.v3ModelBalanceCertified).toBe(true);
    expect(r.waterKilograms.modeledFormation).toBe(1e23);
    expect(r.relativeMassResidual01).toBeLessThan(1e-9);
    expect(validateH2OForwardCT0Result(r)).toEqual([]);
    expect(r.physicalCT0InventoryCertified).toBe(false);
    expect(r.observedEvidenceGranted).toBe(false);
  });
  it('is deterministic and uses no invented seed exception',()=>{
    expect(project(fixture())).toEqual(project(fixture()));
  });
  it('limits delivery to actual leftover disk budget',()=>{
    const f=fixture(),env=Evolution.fromOrigin(f.planet,f.atmosphere,f.origin);
    const delivered=env.history!.transfers.filter(t=>t.from==='EXTERNAL')
      .reduce((s,t)=>s+t.kilograms,0);
    expect(delivered).toBeLessThanOrEqual(f.origin.lateDeliveryWaterBudgetKilograms*(1+1e-10));
  });
  it('resolves conditional surface phases from CT0 climate but not an observed ocean',()=>{
    const hot=project(fixture()),cold=project(fixture(1e23,4e9,1,240));
    expect(hot.waterKilograms.pools.SURFACE_LIQUID).toBeGreaterThan(0);
    expect(cold.waterKilograms.pools.SURFACE_ICE).toBeGreaterThan(0);
    expect(cold.waterKilograms.pools.SURFACE_LIQUID).toBe(0);
    expect(hot.oceanExistenceCertified).toBe(false);
  });
  it('does not create water when no ice condensed at formation',()=>{
    const result=project(fixture(0));
    expect(result.waterKilograms.modeledCT0).toBe(0);
  });
  it('rejected foreign origin and atmosphere',()=>{
    const f=fixture();
    const swapped={...f.origin,bodyIndex:5n} as V3DiskWaterOrigin;
    expect(()=>Evolution.fromOrigin(f.planet,f.atmosphere,swapped)).toThrow();
    const bad={...f.atmosphere,hostPlanet:{} as Planet} as Atmosphere;
    expect(()=>Evolution.fromOrigin(f.planet,bad,f.origin)).toThrow();
  });
  it('never promotes a radiogenic cooling prior to independent P-T evidence for deep liquid',()=>{
    const f=fixture(1e23);
    const planet={...f.planet,physicalProperties:{...f.planet.physicalProperties,
      radiusEarth:1.6}} as Planet;
    const atmosphere={...f.atmosphere,hostPlanet:planet} as Atmosphere;
    const env=Evolution.fromOrigin(planet,atmosphere,f.origin);
    expect(env.waterShellThermalProvenance).toBe('CT0_CLIMATE_PLUS_RADIogenic_COOLING_MODEL');
    const result=Forward.project(planet,atmosphere,env);
    expect(result.deepWater.shellThicknessMeters).not.toBeNull();
    expect(result.deepWater.hasIndependentlySourcedThermalProfile).toBe(false);
    expect(result.deepWater.liquidLayerThicknessMeters).toBeNull();
    expect(validateH2OForwardCT0Result(result)).toEqual([]);
  });
  it('never fills an absent pre-formation history with fabricated ages',()=>{
    const f=fixture(1e23,0);
    const result=project(f);
    expect(result.v3ModelBalanceCertified).toBe(false);
    expect(result.waterKilograms.modeledCT0).toBeNull();
  });
});
