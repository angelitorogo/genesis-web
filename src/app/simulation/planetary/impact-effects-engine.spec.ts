import { type Atmosphere } from '../../domain/planetary/atmosphere';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyImpactSurfaceResponseRegime } from '../../domain/planetary/minor-body-impact-surface-response-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type MinorBodyTemporalImpactProbabilityAssessment } from '../../domain/planetary/minor-body-temporal-impact-probability-assessment';
import { type MinorBodyTemporalImpactProbabilityCatalog } from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';
import { type Planet } from '../../domain/planetary/planet';
import { type RelevantMoon } from '../../domain/planetary/relevant-moon';
import { ImpactEffectsEngine, impactCraterDiameterKilometersV1 } from './impact-effects-engine';
import { ImpactEnergyClassificationEngine } from './impact-energy-classification-engine';
import { MinorBodyDynamicsEngine } from './minor-body-dynamics-engine';

const ID='000000000000000000000000000000A0';

describe('ImpactEffectsEngine point 23.10',()=>{
  it('should project a Chicxulub-scale solid-planet response while preserving point-23.8 probability and point-23.9 energy',()=>{
    const planet={planetOrdinal:1,name:'P1'} as Planet;
    const temporal=temporalAssessment(true,planet,null,MinorBodyApproachTargetKind.PLANET,10,3,20,11.2,6371);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const atmosphere=solidAtmosphere(planet,101325,0.7);
    const result=ImpactEffectsEngine.generate(energy,[atmosphere]).assessments[0];

    expect(result.energyAssessment).toBe(energy.assessments[0]);
    expect(result.temporalImpactProbability01).toBe(temporal.temporalImpactProbability01);
    expect(result.kineticEnergyJoules).toBe(energy.assessments[0].kineticEnergyJoules);
    expect(result.hasSolidSurface).toBe(true);
    expect(result.craterDiameterKilometers).toBeGreaterThan(150);
    expect(result.craterDiameterKilometers).toBeLessThan(250);
    expect(result.surfaceResponseRegime).toBe(MinorBodyImpactSurfaceResponseRegime.LARGE_CRATER_BASIN);
    expect(result.atmosphericShockIndex01).toBeGreaterThan(0.5);
    expect(result.atmosphericLossPotentialIndex01).toBeLessThan(0.1);
    expect(result.hydrosphereShockIndex01).toBeGreaterThan(0);
    expect(result.geologicalShockIndex01).toBe(result.targetResponseSeverityIndex01);
  });

  it('should not invent a crater, hydrosphere or geology below a deep planetary envelope',()=>{
    const planet={planetOrdinal:1,name:'G1'} as Planet;
    const temporal=temporalAssessment(true,planet,null,MinorBodyApproachTargetKind.PLANET,20,1.5,30,45,70000);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const atmosphere=deepEnvelopeAtmosphere(planet);
    const result=ImpactEffectsEngine.generate(energy,[atmosphere]).assessments[0];

    expect(result.hasSolidSurface).toBe(false);
    expect(result.surfaceResponseRegime).toBe(MinorBodyImpactSurfaceResponseRegime.NO_SOLID_SURFACE);
    expect(result.craterDiameterKilometers).toBeNull();
    expect(result.hydrosphereShockIndex01).toBeNull();
    expect(result.geologicalShockIndex01).toBeNull();
    expect(result.ejectaGenerationIndex01).toBeNull();
    expect(result.atmosphericShockIndex01).toBeGreaterThan(0);
  });

  it('should derive moon atmosphere/water/geology response from the frozen point-21.5 environment without requiring a phase-20 atmosphere',()=>{
    const planet={planetOrdinal:1,name:'P1'} as Planet;
    const moon={
      hostPlanetOrdinal:1,
      name:'M1',
      environmentState:{
        hasAtmosphere:true,
        atmosphereRetentionIndex01:0.2,
        waterInventoryIndex01:0.8,
      },
    } as unknown as RelevantMoon;
    const temporal=temporalAssessment(true,planet,moon,MinorBodyApproachTargetKind.MOON,2,2.2,15,2.4,1737.4);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const result=ImpactEffectsEngine.generate(energy,[]).assessments[0];

    expect(result.targetMoon).toBe(moon);
    expect(result.hasSolidSurface).toBe(true);
    expect(result.craterDiameterKilometers).toBeGreaterThan(0);
    expect(result.atmosphericLossPotentialIndex01).toBeGreaterThan(0);
    expect(result.hydrosphereShockIndex01).toBeGreaterThan(0);
    expect(result.geologicalShockIndex01).toBeGreaterThan(0);
  });

  it('should require one unambiguous phase-20 Atmosphere aggregate only for applicable planetary targets',()=>{
    const planet={planetOrdinal:1,name:'P1'} as Planet;
    const temporal=temporalAssessment(true,planet,null,MinorBodyApproachTargetKind.PLANET,5,3,18,11.2,6371);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const atmosphere=solidAtmosphere(planet,101325,0.5);

    expect(()=>ImpactEffectsEngine.generate(energy,[])).toThrow(RangeError);
    expect(()=>ImpactEffectsEngine.generate(energy,[atmosphere,atmosphere])).toThrow(RangeError);
  });

  it('should preserve NOT_APPLICABLE for zero-probability pairs and expose the same projection through MinorBodyDynamicsEngine',()=>{
    const planet={planetOrdinal:1,name:'P1'} as Planet;
    const temporal=temporalAssessment(false,planet,null,MinorBodyApproachTargetKind.PLANET,10,3,20,11.2,6371);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const direct=ImpactEffectsEngine.generate(energy,[]);
    const coordinated=MinorBodyDynamicsEngine.impactEffects(energy,[]);
    expect(direct.assessments[0].impactScenarioApplicable).toBe(false);
    expect(direct.assessments[0].targetResponseSeverityIndex01).toBeNull();
    expect(direct.assessments[0].surfaceResponseRegime).toBe(MinorBodyImpactSurfaceResponseRegime.NOT_APPLICABLE);
    expect(coordinated.assessments[0].surfaceResponseRegime).toBe(direct.assessments[0].surfaceResponseRegime);
  });

  it('should freeze the 10-km Earth-gravity crater scaling reference near 180 km at 20 km/s',()=>{
    expect(impactCraterDiameterKilometersV1(10,3,20,1)).toBeCloseTo(180,10);
  });
});

function temporalAssessment(
  applicable:boolean,
  planet:Planet,
  moon:RelevantMoon|null,
  targetKind:typeof MinorBodyApproachTargetKind.values[number],
  diameterKilometers:number,
  density:number,
  relativeSpeed:number,
  escapeSpeed:number,
  targetRadiusKilometers:number,
):MinorBodyTemporalImpactProbabilityAssessment {
  const risk={
    minorBodyKind:MinorBodyKind.ASTEROID,
    transition:{minorBody:{body:{diameterKilometers,taxonomy:{bulkDensityGramsPerCubicCentimeter:density}}}},
    characteristicRelativeSpeedKmPerSecond:relativeSpeed,
    targetEscapeVelocityKmPerSecond:escapeSpeed,
    targetPhysicalRadiusAu:targetRadiusKilometers/149_597_870.7,
  };
  return {
    impactRiskAssessment:risk,
    hasNonZeroTemporalImpactProbability:applicable,
    temporalImpactProbability01:applicable?1e-6:0,
    minorBody:{},minorBodyProceduralId:ID,minorBodyDesignation:'AST-001',
    targetKind,targetPlanet:planet,targetMoon:moon,targetName:moon?.name??planet.name,
  } as unknown as MinorBodyTemporalImpactProbabilityAssessment;
}

function solidAtmosphere(planet:Planet,pressurePascal:number,waterInventoryIndex01:number):Atmosphere {
  return {
    hostPlanet:planet,
    retentionState:{
      isDeepEnvelope:false,
      hasRetainedGasInventory:pressurePascal>0,
      retainedMoleInventoryFraction01:pressurePascal>0?0.9:0,
      retainedSurfacePressurePascal:pressurePascal,
    },
    waterInventory:{waterInventoryIndex01},
    geologyState:{hasDefinedSolidSurfaceGeology:true},
  } as unknown as Atmosphere;
}

function deepEnvelopeAtmosphere(planet:Planet):Atmosphere {
  return {
    hostPlanet:planet,
    retentionState:{
      isDeepEnvelope:true,
      hasRetainedGasInventory:true,
      retainedMoleInventoryFraction01:0.95,
      retainedSurfacePressurePascal:null,
    },
    waterInventory:{waterInventoryIndex01:0.9},
    geologyState:{hasDefinedSolidSurfaceGeology:false},
  } as unknown as Atmosphere;
}
