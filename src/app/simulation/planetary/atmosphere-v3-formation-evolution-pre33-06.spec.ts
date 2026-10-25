import { describe, expect, it } from 'vitest';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import type { Planet } from '../../domain/planetary/planet';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { V3DiskWaterOrigin } from './planet-h2o-v3-formation-origin';
import { AtmosphereV3FormationEvolutionPRE3306 as Engine } from './atmosphere-v3-formation-evolution-pre33-06';

const origin={sourceId:'TEST-V3-DISK',assemblyTemperatureKelvin:160,
  carbonOxygenRatio:.54,metallicitySolarRatio:1,datedHistoryComplete:true,
  timeSinceFormationYears:4.49e9,stellarAgeYearsCT0:4.5e9,
  sourceStellarMassSolar:1,sourceBolometricLuminositySolar:1} as V3DiskWaterOrigin;
const planet={massEarth:1,radiusEarth:1,surfaceGravityEarth:1,orbit:{semiMajorAxisAu:1},
  internalComposition:{sourceSolidMassEarth:1,sourceEnvelopeMassEarth:0}} as unknown as Planet;
const atmosphere={hostPlanet:planet,isDeepEnvelope:false,retainedSurfacePressurePascal:1e5,
  retainedGasComposition:[{gas:AtmosphereGas.NITROGEN,moleFraction01:1}],
  climateState:{meanSurfaceTemperatureKelvin:290}} as unknown as Atmosphere;
const moon={massEarth:.012,radiusEarth:.27,surfaceGravityEarth:.16,hostPlanetOrdinal:1,moonOrdinal:1} as unknown as MoonPhysicalProperties;
const inventory={hostPlanetOrdinal:1,moonOrdinal:1,otherCondensableMassKilograms:1e20,
  waterIceMassKilograms:1e21,maximumPotentialVolatileSupplyKilograms:1.1e21,
  contractVersion:'32.F.1d-density-endmember-scenario-v1'} as MoonFormationInventory32F1d;

describe('PRE-33.06 V3, gas formation and stellar-dated atmospheric evolution',()=>{
  it('derives mass independently of phase-20 pressure',()=>{
    const a=Engine.planet(planet,atmosphere,origin);
    const b=Engine.planet(planet,{...atmosphere,retainedSurfacePressurePascal:2e6} as Atmosphere,origin);
    expect(a.candidateForwardPressurePascal).toBe(b.candidateForwardPressurePascal);
    expect(a.scenarioPressurePascal).not.toBe(b.scenarioPressurePascal);
    expect(a.biologyAuthorized).toBe(false);
  });
  it('closes history mass and dates epochs from formation',()=>{
    const a=Engine.planet(planet,atmosphere,origin);
    expect(a.historyEpochs?.length).toBeGreaterThan(1);
    expect(a.historyEpochs?.at(-1)?.toYears).toBe(origin.timeSinceFormationYears);
    expect(a.relativeMassResidual01).toBeLessThan(1e-7);
    expect(a.initialGasKilograms!+a.suppliedKilograms!).toBeLessThanOrEqual(a.formationReservoirKilograms!*(1+1e-9));
    expect(a.observedPressure).toBe(false);
  });
  it('lunar unidentified species remain a conditional, not an observed pressure',()=>{
    const a=Engine.moon(moon,null,inventory,planet,origin,160);
    expect(a.assumedChemistry).toBe('UNIDENTIFIED_LUNAR_VOLATILE_ENDMEMBER');
    expect(a.status).toBe('CONDITIONAL_FORWARD_SCENARIO');
    expect(a.candidateForwardPressurePascal).not.toBeNull();
    expect(a.causalModelPressurePascal).toBeNull();
    expect(a.relativeMassResidual01).toBeLessThan(1e-7);
  });
  it('V3 without dated stellar origin must not fabricate a physical column',()=>{
    const x=Engine.planet(planet,atmosphere,{...origin,datedHistoryComplete:false});
    expect(x.initialGasKilograms).toBeNull();
    expect(x.causalModelPressurePascal).toBeNull();
  });
  it('does not claim a rocky surface pressure on deep gas envelopes',()=>{
    const x=Engine.planet(planet,{...atmosphere,isDeepEnvelope:true} as Atmosphere,origin);
    expect(x.status).toBe('NO_SOLID_SURFACE_REFERENCE');
    expect(x.causalModelPressurePascal).toBeNull();
  });
});
