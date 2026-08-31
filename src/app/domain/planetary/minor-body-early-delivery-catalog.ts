import { MinorBodyEarlyDeliveryRegime } from './minor-body-early-delivery-regime';
import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { type MinorBodyImpactEffectsCatalog } from './minor-body-impact-effects-catalog';

/** Point-23.11 one-to-one retained water/organic-carrier projection over point 23.10. */
export class MinorBodyEarlyDeliveryCatalog {
  readonly assessments:readonly MinorBodyEarlyDeliveryAssessment[];

  constructor(
    readonly impactEffectsCatalog:MinorBodyImpactEffectsCatalog,
    assessments:readonly MinorBodyEarlyDeliveryAssessment[],
  ) {
    this.assessments=Object.freeze([...assessments]);
    const source=impactEffectsCatalog.assessments;
    if(this.assessments.length!==source.length) {
      throw new RangeError('Point-23.11 requires exactly one delivery assessment for every point-23.10 effects assessment.');
    }
    for(let index=0;index<this.assessments.length;index+=1) {
      if(this.assessments[index].impactEffectsAssessment!==source[index]) {
        throw new RangeError('Point-23.11 must preserve exact point-23.10 assessment order/references.');
      }
    }
  }

  get assessmentCount(){return this.assessments.length;}
  get applicableDeliveryScenarioCount(){return this.assessments.filter(item=>item.deliveryScenarioApplicable).length;}
  get waterRichDeliveryCount(){return this.assessments.filter(item=>item.regime===MinorBodyEarlyDeliveryRegime.WATER_RICH||item.regime===MinorBodyEarlyDeliveryRegime.MIXED_WATER_ORGANIC).length;}
  get organicCarrierRichDeliveryCount(){return this.assessments.filter(item=>item.regime===MinorBodyEarlyDeliveryRegime.ORGANIC_CARRIER_RICH||item.regime===MinorBodyEarlyDeliveryRegime.MIXED_WATER_ORGANIC).length;}
  get expectedRetainedWaterMassKilogramsOverTimeWindow(){return this.assessments.reduce((sum,item)=>sum+(item.expectedRetainedWaterMassKilogramsOverTimeWindow??0),0);}
  get expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow(){return this.assessments.reduce((sum,item)=>sum+(item.expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow??0),0);}
  get maximumConditionalRetainedWaterMassKilograms(){return this.assessments.reduce((maximum,item)=>Math.max(maximum,item.conditionalRetainedWaterMassKilograms??0),0);}
  get maximumConditionalRetainedOrganicCarrierMassProxyKilograms(){return this.assessments.reduce((maximum,item)=>Math.max(maximum,item.conditionalRetainedOrganicCarrierMassProxyKilograms??0),0);}
  get deliveryRelevantAssessments(){return Object.freeze(this.assessments.filter(item=>item.deliveryScenarioApplicable));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(item=>item.minorBodyProceduralId===proceduralId));}
}
