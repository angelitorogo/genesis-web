import { type Atmosphere } from '../../domain/planetary/atmosphere';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyEarlyDeliveryRegime } from '../../domain/planetary/minor-body-early-delivery-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type MinorBodyTemporalImpactProbabilityAssessment } from '../../domain/planetary/minor-body-temporal-impact-probability-assessment';
import { type MinorBodyTemporalImpactProbabilityCatalog } from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';
import { type Planet } from '../../domain/planetary/planet';
import { EarlyWaterOrganicDeliveryEngine, impactPayloadRetentionV1, minorBodyDeliveryCompositionV1 } from './early-water-organic-delivery-engine';
import { ImpactEffectsEngine } from './impact-effects-engine';
import { ImpactEnergyClassificationEngine } from './impact-energy-classification-engine';
import { MinorBodyDynamicsEngine } from './minor-body-dynamics-engine';

const ID='000000000000000000000000000000B0';

describe('EarlyWaterOrganicDeliveryEngine point 23.11',()=>{
  it('should map all five frozen phase-22 composition families without new random material properties',()=>{
    const asteroid=minorBodyDeliveryCompositionV1(MinorBodyKind.ASTEROID,{taxonomy:{iceFraction01:0.20,carbonaceousFraction01:0.50}} as never);
    const comet=minorBodyDeliveryCompositionV1(MinorBodyKind.COMET,{nucleusProperties:{iceFraction01:0.65,dustFraction01:0.35,volatileRichnessIndex01:0.80}} as never);
    const tno=minorBodyDeliveryCompositionV1(MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,{properties:{iceFraction01:0.70,rockFraction01:0.30}} as never);
    const interstellar=minorBodyDeliveryCompositionV1(MinorBodyKind.INTERSTELLAR_OBJECT,{properties:{volatileFraction01:0.60,refractoryFraction01:0.40}} as never);
    const captured=minorBodyDeliveryCompositionV1(MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,{properties:{volatileFraction01:0.40,refractoryFraction01:0.60}} as never);

    expect(asteroid.sourceWaterEquivalentFraction01).toBeCloseTo(0.25,12);
    expect(asteroid.sourceOrganicCarrierFractionProxy01).toBeCloseTo(0.225,12);
    expect(comet.sourceWaterEquivalentFraction01).toBeCloseTo(0.5525,12);
    expect(comet.sourceOrganicCarrierFractionProxy01).toBeCloseTo(0.196,12);
    expect(tno.sourceWaterEquivalentFraction01).toBeCloseTo(0.49,12);
    expect(interstellar.sourceWaterEquivalentFraction01).toBeCloseTo(0.30,12);
    expect(captured.sourceWaterEquivalentFraction01).toBeCloseTo(0.20,12);
  });

  it('should retain organics more conservatively than water as impact severity rises',()=>{
    const mild=impactPayloadRetentionV1(12,11.2,0.2,0.05);
    const severe=impactPayloadRetentionV1(35,11.2,0.9,0.8);
    expect(mild.waterRetentionEfficiency01).toBeGreaterThan(mild.organicCarrierRetentionEfficiency01);
    expect(severe.waterRetentionEfficiency01).toBeGreaterThan(severe.organicCarrierRetentionEfficiency01);
    expect(severe.waterRetentionEfficiency01).toBeLessThan(mild.waterRetentionEfficiency01);
    expect(severe.organicCarrierRetentionEfficiency01).toBeLessThan(mild.organicCarrierRetentionEfficiency01);
  });

  it('should compute conditional and probability-weighted retained payload while preserving the exact 23.8-23.10 chain',()=>{
    const planet={planetOrdinal:1,name:'P1'} as Planet;
    const body={
      diameterKilometers:10,
      taxonomy:{
        bulkDensityGramsPerCubicCentimeter:3,
        iceFraction01:0.12,
        carbonaceousFraction01:0.60,
      },
    };
    const temporal=temporalAssessment(true,planet,body,20,11.2,6371,0.02,0.01,100_000_000);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const effects=ImpactEffectsEngine.generate(energy,[solidAtmosphere(planet)]);
    const catalog=EarlyWaterOrganicDeliveryEngine.generate(effects);
    const result=catalog.assessments[0];

    expect(result.impactEffectsAssessment).toBe(effects.assessments[0]);
    expect(result.temporalImpactProbability01).toBe(temporal.temporalImpactProbability01);
    expect(result.sourceWaterEquivalentFraction01).toBeCloseTo(0.18,12);
    expect(result.sourceOrganicCarrierFractionProxy01).toBeCloseTo(0.27,12);
    expect(result.conditionalRetainedWaterMassKilograms).toBeGreaterThan(0);
    expect(result.conditionalRetainedOrganicCarrierMassProxyKilograms).toBeGreaterThan(0);
    expect(result.expectedRetainedWaterMassKilogramsOverTimeWindow).toBeCloseTo(
      result.conditionalRetainedWaterMassKilograms!*temporal.expectedImpactCount,
      6,
    );
    expect(result.expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow).toBeCloseTo(
      result.conditionalRetainedOrganicCarrierMassProxyKilograms!*temporal.expectedImpactCount,
      6,
    );
    expect(result.regime).not.toBe(MinorBodyEarlyDeliveryRegime.NOT_APPLICABLE);
  });

  it('should preserve NOT_APPLICABLE and expose the same projection through MinorBodyDynamicsEngine',()=>{
    const planet={planetOrdinal:1,name:'P1'} as Planet;
    const body={diameterKilometers:10,taxonomy:{bulkDensityGramsPerCubicCentimeter:3,iceFraction01:0.2,carbonaceousFraction01:0.5}};
    const temporal=temporalAssessment(false,planet,body,20,11.2,6371,0,0,100_000_000);
    const energy=ImpactEnergyClassificationEngine.generate({assessments:[temporal]} as unknown as MinorBodyTemporalImpactProbabilityCatalog);
    const effects=ImpactEffectsEngine.generate(energy,[]);
    const direct=EarlyWaterOrganicDeliveryEngine.generate(effects);
    const coordinated=MinorBodyDynamicsEngine.earlyWaterOrganicDelivery(effects);
    expect(direct.assessments[0].deliveryScenarioApplicable).toBe(false);
    expect(direct.assessments[0].regime).toBe(MinorBodyEarlyDeliveryRegime.NOT_APPLICABLE);
    expect(direct.assessments[0].conditionalRetainedWaterMassKilograms).toBeNull();
    expect(coordinated.assessments[0].regime).toBe(direct.assessments[0].regime);
  });
});

function temporalAssessment(
  applicable:boolean,
  planet:Planet,
  body:unknown,
  relativeSpeed:number,
  escapeSpeed:number,
  targetRadiusKilometers:number,
  expectedImpactCount:number,
  temporalImpactProbability01:number,
  timeWindowYears:number,
):MinorBodyTemporalImpactProbabilityAssessment {
  const risk={
    minorBodyKind:MinorBodyKind.ASTEROID,
    transition:{minorBody:{body}},
    characteristicRelativeSpeedKmPerSecond:relativeSpeed,
    targetEscapeVelocityKmPerSecond:escapeSpeed,
    targetPhysicalRadiusAu:targetRadiusKilometers/149_597_870.7,
  };
  return {
    impactRiskAssessment:risk,
    hasNonZeroTemporalImpactProbability:applicable,
    temporalImpactProbability01:applicable?temporalImpactProbability01:0,
    expectedImpactCount:applicable?expectedImpactCount:0,
    timeWindowYears,
    minorBody:{},minorBodyProceduralId:ID,minorBodyDesignation:'AST-001',
    targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,targetName:planet.name,
  } as unknown as MinorBodyTemporalImpactProbabilityAssessment;
}

function solidAtmosphere(planet:Planet):Atmosphere {
  return {
    hostPlanet:planet,
    retentionState:{
      isDeepEnvelope:false,
      hasRetainedGasInventory:true,
      retainedMoleInventoryFraction01:0.9,
      retainedSurfacePressurePascal:101325,
    },
    waterInventory:{waterInventoryIndex01:0.5},
    geologyState:{hasDefinedSolidSurfaceGeology:true},
  } as unknown as Atmosphere;
}
