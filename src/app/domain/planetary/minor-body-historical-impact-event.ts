import { type HistorySeed } from '../seed/hierarchical-seeds';
import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';

const EVENT_ID_PATTERN=/^[0-9A-F]{32}$/;
const TOLERANCE=1e-9;

/**
 * Point-23.13 one realized minor-body impact inside the retrospective point-23.8
 * window. The exact point-23.11 assessment is the causal root of every exposed
 * physical consequence; no impact physics is regenerated here.
 */
export class MinorBodyHistoricalImpactEvent {
  constructor(
    readonly eventId:string,
    readonly deliveryAssessment:MinorBodyEarlyDeliveryAssessment,
    readonly targetHistorySeed:HistorySeed,
    readonly yearsAfterWindowStart:number,
    readonly yearsBeforeWindowEnd:number,
    readonly targetSelectionWeight01:number,
    readonly realizedRetainedWaterMassKilograms:number,
    readonly realizedRetainedOrganicCarrierMassProxyKilograms:number,
  ) {
    if(!EVENT_ID_PATTERN.test(eventId)) throw new RangeError('Point-23.13 eventId must be uppercase 128-bit hexadecimal.');
    if(!deliveryAssessment.deliveryScenarioApplicable) throw new RangeError('Point-23.13 cannot realize a point-23.11 NOT_APPLICABLE scenario.');
    if(targetHistorySeed.kind!=='history') throw new RangeError('Point-23.13 requires the existing BodySeed -> HistorySeed hierarchy.');
    const window=deliveryAssessment.timeWindowYears;
    assertFiniteRange(yearsAfterWindowStart,0,window,'yearsAfterWindowStart');
    assertFiniteRange(yearsBeforeWindowEnd,0,window,'yearsBeforeWindowEnd');
    if(relativeError(yearsAfterWindowStart+yearsBeforeWindowEnd,window)>TOLERANCE) {
      throw new RangeError('Point-23.13 event chronology must conserve the point-23.8 time window.');
    }
    if(!Number.isFinite(targetSelectionWeight01)||targetSelectionWeight01<=0||targetSelectionWeight01>1) {
      throw new RangeError('targetSelectionWeight01 must be finite in (0, 1].');
    }
    const expectedWater=requiredNonNegative(deliveryAssessment.conditionalRetainedWaterMassKilograms,'conditionalRetainedWaterMassKilograms');
    const expectedOrganic=requiredNonNegative(deliveryAssessment.conditionalRetainedOrganicCarrierMassProxyKilograms,'conditionalRetainedOrganicCarrierMassProxyKilograms');
    if(relativeError(realizedRetainedWaterMassKilograms,expectedWater)>TOLERANCE) {
      throw new RangeError('A realized point-23.13 impact must use the exact point-23.11 conditional retained water mass.');
    }
    if(relativeError(realizedRetainedOrganicCarrierMassProxyKilograms,expectedOrganic)>TOLERANCE) {
      throw new RangeError('A realized point-23.13 impact must use the exact point-23.11 conditional organic-carrier proxy mass.');
    }
  }

  get impactEffectsAssessment(){return this.deliveryAssessment.impactEffectsAssessment;}
  get energyAssessment(){return this.deliveryAssessment.energyAssessment;}
  get temporalAssessment(){return this.deliveryAssessment.temporalAssessment;}
  get impactRiskAssessment(){return this.deliveryAssessment.impactRiskAssessment;}
  get orbitalTransition(){return this.impactRiskAssessment.transition;}
  get minorBody(){return this.deliveryAssessment.minorBody;}
  get minorBodyProceduralId(){return this.deliveryAssessment.minorBodyProceduralId;}
  get minorBodyDesignation(){return this.deliveryAssessment.minorBodyDesignation;}
  get targetKind(){return this.deliveryAssessment.targetKind;}
  get targetPlanet(){return this.deliveryAssessment.targetPlanet;}
  get targetMoon(){return this.deliveryAssessment.targetMoon;}
  get targetName(){return this.deliveryAssessment.targetName;}
  get kineticEnergyJoules(){return this.energyAssessment.kineticEnergyJoules;}
  get consequenceRegime(){return this.energyAssessment.consequenceRegime;}
  get surfaceResponseRegime(){return this.impactEffectsAssessment.surfaceResponseRegime;}
  get timeWindowYears(){return this.deliveryAssessment.timeWindowYears;}
}

function requiredNonNegative(value:number|null,name:string):number {
  if(value===null||!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);
  return value;
}
function assertFiniteRange(value:number,min:number,max:number,name:string):void {
  if(!Number.isFinite(value)||value<min||value>max) throw new RangeError(`${name} must be finite in [${min}, ${max}].`);
}
function relativeError(actual:number,expected:number):number {return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
