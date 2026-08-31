import { type MinorBodyImpactEffectsAssessment } from './minor-body-impact-effects-assessment';
import { MinorBodyEarlyDeliveryRegime, type MinorBodyEarlyDeliveryRegimeValue } from './minor-body-early-delivery-regime';

const TOLERANCE=1e-9;

/**
 * Point-23.11 retained volatile/organic-carrier payload for one conditional impact.
 *
 * Organic material is intentionally represented as a carrier-mass proxy rather
 * than an invented molecular abundance. The assessment preserves the exact
 * point-23.10 scenario and never mutates phase-20/21 target water inventories.
 */
export class MinorBodyEarlyDeliveryAssessment {
  constructor(
    readonly impactEffectsAssessment:MinorBodyImpactEffectsAssessment,
    readonly deliveryScenarioApplicable:boolean,
    readonly sourceWaterEquivalentFraction01:number|null,
    readonly sourceOrganicCarrierFractionProxy01:number|null,
    readonly sourceVolatileRichnessIndex01:number|null,
    readonly gravitationalRetentionIndex01:number|null,
    readonly waterRetentionEfficiency01:number|null,
    readonly organicCarrierRetentionEfficiency01:number|null,
    readonly retainedWaterEquivalentFractionOfImpactorMass01:number|null,
    readonly retainedOrganicCarrierFractionOfImpactorMassProxy01:number|null,
    readonly conditionalRetainedWaterMassKilograms:number|null,
    readonly conditionalRetainedOrganicCarrierMassProxyKilograms:number|null,
    readonly expectedRetainedWaterMassKilogramsOverTimeWindow:number|null,
    readonly expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow:number|null,
    readonly regime:MinorBodyEarlyDeliveryRegimeValue,
  ) {
    if(deliveryScenarioApplicable!==impactEffectsAssessment.impactScenarioApplicable) {
      throw new RangeError('Point-23.11 applicability must exactly preserve point-23.10 applicability.');
    }
    if(!MinorBodyEarlyDeliveryRegime.values.includes(regime)) {
      throw new RangeError('Unknown MinorBodyEarlyDeliveryRegime.');
    }

    if(!deliveryScenarioApplicable) {
      const values=[
        sourceWaterEquivalentFraction01,sourceOrganicCarrierFractionProxy01,sourceVolatileRichnessIndex01,
        gravitationalRetentionIndex01,waterRetentionEfficiency01,organicCarrierRetentionEfficiency01,
        retainedWaterEquivalentFractionOfImpactorMass01,retainedOrganicCarrierFractionOfImpactorMassProxy01,
        conditionalRetainedWaterMassKilograms,conditionalRetainedOrganicCarrierMassProxyKilograms,
        expectedRetainedWaterMassKilogramsOverTimeWindow,expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow,
      ] as const;
      if(values.some(value=>value!==null)) {
        throw new RangeError('Non-applicable point-23.11 scenarios must not invent delivered material.');
      }
      if(regime!==MinorBodyEarlyDeliveryRegime.NOT_APPLICABLE) {
        throw new RangeError('Non-applicable point-23.11 scenarios must use NOT_APPLICABLE.');
      }
      return;
    }

    const water=requiredIndex(sourceWaterEquivalentFraction01,'sourceWaterEquivalentFraction01');
    const organic=requiredIndex(sourceOrganicCarrierFractionProxy01,'sourceOrganicCarrierFractionProxy01');
    requiredIndex(sourceVolatileRichnessIndex01,'sourceVolatileRichnessIndex01');
    requiredIndex(gravitationalRetentionIndex01,'gravitationalRetentionIndex01');
    const waterRetention=requiredIndex(waterRetentionEfficiency01,'waterRetentionEfficiency01');
    const organicRetention=requiredIndex(organicCarrierRetentionEfficiency01,'organicCarrierRetentionEfficiency01');
    const retainedWater=requiredIndex(retainedWaterEquivalentFractionOfImpactorMass01,'retainedWaterEquivalentFractionOfImpactorMass01');
    const retainedOrganic=requiredIndex(retainedOrganicCarrierFractionOfImpactorMassProxy01,'retainedOrganicCarrierFractionOfImpactorMassProxy01');
    const conditionalWater=requiredNonNegative(conditionalRetainedWaterMassKilograms,'conditionalRetainedWaterMassKilograms');
    const conditionalOrganic=requiredNonNegative(conditionalRetainedOrganicCarrierMassProxyKilograms,'conditionalRetainedOrganicCarrierMassProxyKilograms');
    const expectedWater=requiredNonNegative(expectedRetainedWaterMassKilogramsOverTimeWindow,'expectedRetainedWaterMassKilogramsOverTimeWindow');
    const expectedOrganic=requiredNonNegative(expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow,'expectedRetainedOrganicCarrierMassProxyKilogramsOverTimeWindow');

    if(Math.abs(retainedWater-water*waterRetention)>TOLERANCE) {
      throw new RangeError('Point-23.11 retained water fraction must equal source water fraction x water retention efficiency.');
    }
    if(Math.abs(retainedOrganic-organic*organicRetention)>TOLERANCE) {
      throw new RangeError('Point-23.11 retained organic-carrier fraction must equal source carrier fraction x carrier retention efficiency.');
    }

    const impactorMass=requiredPositive(impactEffectsAssessment.energyAssessment.impactorMassKilograms,'point-23.9 impactorMassKilograms');
    if(relativeError(conditionalWater,impactorMass*retainedWater)>TOLERANCE) {
      throw new RangeError('Point-23.11 conditional retained water mass must preserve the frozen point-23.9 impactor mass.');
    }
    if(relativeError(conditionalOrganic,impactorMass*retainedOrganic)>TOLERANCE) {
      throw new RangeError('Point-23.11 conditional organic-carrier mass proxy must preserve the frozen point-23.9 impactor mass.');
    }

    const expectedImpactCount=impactEffectsAssessment.temporalAssessment.expectedImpactCount;
    if(!Number.isFinite(expectedImpactCount)||expectedImpactCount<0) {
      throw new RangeError('Point-23.11 requires the non-negative point-23.8 expectedImpactCount.');
    }
    if(relativeError(expectedWater,conditionalWater*expectedImpactCount)>TOLERANCE) {
      throw new RangeError('Point-23.11 expected water delivery must equal conditional retained mass x point-23.8 expected impact count.');
    }
    if(relativeError(expectedOrganic,conditionalOrganic*expectedImpactCount)>TOLERANCE) {
      throw new RangeError('Point-23.11 expected organic-carrier delivery must equal conditional retained proxy mass x point-23.8 expected impact count.');
    }

    const expectedRegime=earlyDeliveryRegimeForRetainedFractionsV1(retainedWater,retainedOrganic);
    if(regime!==expectedRegime) {
      throw new RangeError('Point-23.11 regime must match the retained water/organic-carrier fractions.');
    }
  }

  get energyAssessment(){return this.impactEffectsAssessment.energyAssessment;}
  get temporalAssessment(){return this.impactEffectsAssessment.temporalAssessment;}
  get impactRiskAssessment(){return this.impactEffectsAssessment.impactRiskAssessment;}
  get minorBody(){return this.impactEffectsAssessment.minorBody;}
  get minorBodyProceduralId(){return this.impactEffectsAssessment.minorBodyProceduralId;}
  get minorBodyDesignation(){return this.impactEffectsAssessment.minorBodyDesignation;}
  get targetKind(){return this.impactEffectsAssessment.targetKind;}
  get targetPlanet(){return this.impactEffectsAssessment.targetPlanet;}
  get targetMoon(){return this.impactEffectsAssessment.targetMoon;}
  get targetName(){return this.impactEffectsAssessment.targetName;}
  get temporalImpactProbability01(){return this.impactEffectsAssessment.temporalImpactProbability01;}
  get timeWindowYears(){return this.temporalAssessment.timeWindowYears;}
  get expectedImpactCount(){return this.temporalAssessment.expectedImpactCount;}
}

export function earlyDeliveryRegimeForRetainedFractionsV1(
  retainedWaterEquivalentFraction01:number,
  retainedOrganicCarrierFractionProxy01:number,
):MinorBodyEarlyDeliveryRegimeValue {
  assertIndex(retainedWaterEquivalentFraction01,'retainedWaterEquivalentFraction01');
  assertIndex(retainedOrganicCarrierFractionProxy01,'retainedOrganicCarrierFractionProxy01');
  if(retainedWaterEquivalentFraction01<0.005&&retainedOrganicCarrierFractionProxy01<0.005) {
    return MinorBodyEarlyDeliveryRegime.REFRACTORY_DOMINATED;
  }
  if(retainedWaterEquivalentFraction01>=0.15&&retainedOrganicCarrierFractionProxy01>=0.03) {
    return MinorBodyEarlyDeliveryRegime.MIXED_WATER_ORGANIC;
  }
  if(retainedWaterEquivalentFraction01>=0.20) return MinorBodyEarlyDeliveryRegime.WATER_RICH;
  if(retainedOrganicCarrierFractionProxy01>=0.05) return MinorBodyEarlyDeliveryRegime.ORGANIC_CARRIER_RICH;
  return MinorBodyEarlyDeliveryRegime.TRACE_DELIVERY;
}

function requiredIndex(value:number|null,name:string):number {if(value===null) throw new RangeError(`${name} is required.`);assertIndex(value,name);return value;}
function requiredNonNegative(value:number|null,name:string):number {if(value===null||!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);return value;}
function requiredPositive(value:number|null,name:string):number {if(value===null||!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);return value;}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function relativeError(actual:number,expected:number):number{return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
