import { MinorBodyEarlyDeliveryCatalog } from './minor-body-early-delivery-catalog';
import { MinorBodyEarlyDeliveryRegime } from './minor-body-early-delivery-regime';
import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { type MinorBodyImpactEffectsAssessment } from './minor-body-impact-effects-assessment';
import { type MinorBodyImpactEffectsCatalog } from './minor-body-impact-effects-catalog';

function assessment(source:MinorBodyImpactEffectsAssessment,id:string,water:number,organic:number,regime:typeof MinorBodyEarlyDeliveryRegime.values[number]):MinorBodyEarlyDeliveryAssessment {
  return {
    impactEffectsAssessment:source,deliveryScenarioApplicable:true,minorBodyProceduralId:id,
    expectedRetainedWaterMassKilogramsOverTimeWindow:water,
    expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow:organic,
    conditionalRetainedWaterMassKilograms:water/2,
    conditionalRetainedOrganicCarrierMassProxyKilograms:organic/2,
    regime,
  } as unknown as MinorBodyEarlyDeliveryAssessment;
}

describe('MinorBodyEarlyDeliveryCatalog point 23.11',()=>{
  it('should preserve one-to-one point-23.10 references and aggregate expected payloads',()=>{
    const first={} as MinorBodyImpactEffectsAssessment;
    const second={} as MinorBodyImpactEffectsAssessment;
    const source={assessments:[first,second]} as unknown as MinorBodyImpactEffectsCatalog;
    const catalog=new MinorBodyEarlyDeliveryCatalog(source,[
      assessment(first,'A',100,20,MinorBodyEarlyDeliveryRegime.WATER_RICH),
      assessment(second,'B',50,40,MinorBodyEarlyDeliveryRegime.MIXED_WATER_ORGANIC),
    ]);
    expect(catalog.assessmentCount).toBe(2);
    expect(catalog.expectedRetainedWaterMassKilogramsOverTimeWindow).toBe(150);
    expect(catalog.expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow).toBe(60);
    expect(catalog.waterRichDeliveryCount).toBe(2);
    expect(catalog.organicCarrierRichDeliveryCount).toBe(1);
    expect(catalog.forMinorBody('B')).toHaveLength(1);
    expect(Object.isFrozen(catalog.assessments)).toBe(true);
  });

  it('should reject reordered or missing point-23.10 coverage',()=>{
    const first={} as MinorBodyImpactEffectsAssessment;
    const second={} as MinorBodyImpactEffectsAssessment;
    const source={assessments:[first,second]} as unknown as MinorBodyImpactEffectsCatalog;
    expect(()=>new MinorBodyEarlyDeliveryCatalog(source,[assessment(second,'B',0,0,MinorBodyEarlyDeliveryRegime.TRACE_DELIVERY)])).toThrow(RangeError);
  });
});
