import { earlyDeliveryRegimeForRetainedFractionsV1, MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { MinorBodyEarlyDeliveryRegime } from './minor-body-early-delivery-regime';
import { type MinorBodyImpactEffectsAssessment } from './minor-body-impact-effects-assessment';

function effects(applicable=true):MinorBodyImpactEffectsAssessment {
  return {
    impactScenarioApplicable:applicable,
    energyAssessment:{impactorMassKilograms:applicable?1000:null},
    temporalAssessment:{expectedImpactCount:applicable?2:0,timeWindowYears:100_000_000},
  } as unknown as MinorBodyImpactEffectsAssessment;
}

describe('MinorBodyEarlyDeliveryAssessment point 23.11',()=>{
  it('should freeze retained-fraction delivery regime boundaries',()=>{
    expect(earlyDeliveryRegimeForRetainedFractionsV1(0,0)).toBe(MinorBodyEarlyDeliveryRegime.REFRACTORY_DOMINATED);
    expect(earlyDeliveryRegimeForRetainedFractionsV1(0.02,0.01)).toBe(MinorBodyEarlyDeliveryRegime.TRACE_DELIVERY);
    expect(earlyDeliveryRegimeForRetainedFractionsV1(0.25,0.01)).toBe(MinorBodyEarlyDeliveryRegime.WATER_RICH);
    expect(earlyDeliveryRegimeForRetainedFractionsV1(0.02,0.08)).toBe(MinorBodyEarlyDeliveryRegime.ORGANIC_CARRIER_RICH);
    expect(earlyDeliveryRegimeForRetainedFractionsV1(0.20,0.04)).toBe(MinorBodyEarlyDeliveryRegime.MIXED_WATER_ORGANIC);
  });

  it('should preserve NOT_APPLICABLE and forbid invented delivery quantities',()=>{
    expect(()=>new MinorBodyEarlyDeliveryAssessment(
      effects(false),false,null,null,null,null,null,null,null,null,null,null,null,null,
      MinorBodyEarlyDeliveryRegime.NOT_APPLICABLE,
    )).not.toThrow();
    expect(()=>new MinorBodyEarlyDeliveryAssessment(
      effects(false),false,0,null,null,null,null,null,null,null,null,null,null,null,
      MinorBodyEarlyDeliveryRegime.NOT_APPLICABLE,
    )).toThrow(RangeError);
  });

  it('should enforce conditional and expected mass conservation against points 23.9 and 23.8',()=>{
    expect(()=>new MinorBodyEarlyDeliveryAssessment(
      effects(),true,0.4,0.1,0.5,0.8,0.5,0.25,0.2,0.025,200,25,400,50,
      MinorBodyEarlyDeliveryRegime.WATER_RICH,
    )).not.toThrow();
  });
});
