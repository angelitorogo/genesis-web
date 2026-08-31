import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { type MinorBodyHistoricalImpactEvent } from './minor-body-historical-impact-event';

const TOLERANCE=1e-10;

/**
 * Point-23.13 competing-risk realization for one existing minor body.
 * A body can produce at most one historical impact: once it collides it cannot
 * independently hit a second planet/moon later in the same frozen history.
 */
export class MinorBodyHistoricalImpactRealization {
  readonly sourceAssessments:readonly MinorBodyEarlyDeliveryAssessment[];

  constructor(
    readonly minorBodyProceduralId:string,
    sourceAssessments:readonly MinorBodyEarlyDeliveryAssessment[],
    readonly isSinglePassage:boolean,
    readonly aggregateHazardOrPassProbability:number,
    readonly historicalImpactProbability01:number,
    readonly realizationSample01:number|null,
    readonly targetSelectionSample01:number|null,
    readonly timingSample01:number|null,
    readonly event:MinorBodyHistoricalImpactEvent|null,
  ) {
    if(sourceAssessments.length===0) throw new RangeError('Point-23.13 realization requires at least one source assessment.');
    if(sourceAssessments.some(item=>item.minorBodyProceduralId!==minorBodyProceduralId)) {
      throw new RangeError('Point-23.13 realization source assessments must belong to one minor body.');
    }
    if(sourceAssessments.some(item=>item.temporalAssessment.isSinglePassage!==isSinglePassage)) {
      throw new RangeError('Point-23.13 one minor body cannot mix bound and single-passage temporal modes.');
    }
    this.sourceAssessments=Object.freeze([...sourceAssessments]);

    const expectedAggregate=historicalImpactAggregateV1(this.sourceAssessments,isSinglePassage);
    if(relativeError(aggregateHazardOrPassProbability,expectedAggregate)>TOLERANCE) {
      throw new RangeError('Point-23.13 aggregate competing-risk weight must match point 23.8.');
    }
    const expectedProbability=historicalImpactProbabilityV1(expectedAggregate,isSinglePassage);
    if(Math.abs(historicalImpactProbability01-expectedProbability)>TOLERANCE) {
      throw new RangeError('Point-23.13 historical impact probability must match the competing-risk V1 model.');
    }

    if(expectedProbability===0) {
      if(realizationSample01!==null||targetSelectionSample01!==null||timingSample01!==null||event!==null) {
        throw new RangeError('Impossible point-23.13 impacts must consume no realization samples and produce no event.');
      }
      return;
    }

    const realization=requiredUnitSample(realizationSample01,'realizationSample01');
    const target=requiredUnitSample(targetSelectionSample01,'targetSelectionSample01');
    const timing=requiredUnitSample(timingSample01,'timingSample01');
    const shouldOccur=realization<expectedProbability;
    if((event!==null)!==shouldOccur) throw new RangeError('Point-23.13 event existence must match the deterministic realization sample.');
    if(event===null) return;

    const selected=historicalImpactSelectedAssessmentV1(this.sourceAssessments,isSinglePassage,target);
    if(event.deliveryAssessment!==selected.assessment) {
      throw new RangeError('Point-23.13 realized event must preserve the deterministically selected point-23.11 assessment reference.');
    }
    if(Math.abs(event.targetSelectionWeight01-selected.weight01)>TOLERANCE) {
      throw new RangeError('Point-23.13 event target-selection weight must match competing risks.');
    }
    const expectedTime=historicalImpactTimeYearsAfterWindowStartV1(
      this.timeWindowYears,isSinglePassage,expectedAggregate,expectedProbability,timing,
    );
    if(relativeError(event.yearsAfterWindowStart,expectedTime)>TOLERANCE) {
      throw new RangeError('Point-23.13 event timing must match the frozen V1 history sample.');
    }
  }

  get timeWindowYears(){return this.sourceAssessments[0].timeWindowYears;}
  get realized(){return this.event!==null;}
  get minorBody(){return this.sourceAssessments[0].minorBody;}
  get minorBodyDesignation(){return this.sourceAssessments[0].minorBodyDesignation;}
}

export function historicalImpactAggregateV1(
  assessments:readonly MinorBodyEarlyDeliveryAssessment[],
  isSinglePassage:boolean,
):number {
  const weights=assessments.map(item=>historicalImpactTargetWeightV1(item,isSinglePassage));
  return weights.reduce((sum,value)=>sum+value,0);
}

export function historicalImpactProbabilityV1(aggregate:number,isSinglePassage:boolean):number {
  if(!Number.isFinite(aggregate)||aggregate<0) throw new RangeError('aggregate must be finite and >= 0.');
  return isSinglePassage?Math.min(1,aggregate):1-Math.exp(-aggregate);
}

export function historicalImpactTargetWeightV1(
  assessment:MinorBodyEarlyDeliveryAssessment,
  isSinglePassage:boolean,
):number {
  if(assessment.temporalAssessment.isSinglePassage!==isSinglePassage) throw new RangeError('Point-23.13 target weight temporal mode mismatch.');
  const value=isSinglePassage?assessment.temporalImpactProbability01:assessment.expectedImpactCount;
  if(!Number.isFinite(value)||value<0) throw new RangeError('Point-23.13 target weight must be finite and >= 0.');
  return value;
}

export function historicalImpactSelectedAssessmentV1(
  assessments:readonly MinorBodyEarlyDeliveryAssessment[],
  isSinglePassage:boolean,
  sample01:number,
):{readonly assessment:MinorBodyEarlyDeliveryAssessment;readonly weight01:number} {
  requiredUnitSample(sample01,'sample01');
  const weighted=assessments.map(assessment=>({assessment,weight:historicalImpactTargetWeightV1(assessment,isSinglePassage)})).filter(item=>item.weight>0);
  const total=weighted.reduce((sum,item)=>sum+item.weight,0);
  if(total<=0) throw new RangeError('Point-23.13 cannot select a target without positive competing-risk weight.');
  const threshold=sample01*total;
  let cumulative=0;
  for(const item of weighted) {
    cumulative+=item.weight;
    if(threshold<cumulative) return Object.freeze({assessment:item.assessment,weight01:item.weight/total});
  }
  const last=weighted[weighted.length-1];
  return Object.freeze({assessment:last.assessment,weight01:last.weight/total});
}

export function historicalImpactTimeYearsAfterWindowStartV1(
  timeWindowYears:number,
  isSinglePassage:boolean,
  aggregate:number,
  probability01:number,
  timingSample01:number,
):number {
  if(!Number.isFinite(timeWindowYears)||timeWindowYears<=0) throw new RangeError('timeWindowYears must be finite and > 0.');
  requiredUnitSample(timingSample01,'timingSample01');
  if(isSinglePassage) return timingSample01*timeWindowYears;
  if(!Number.isFinite(aggregate)||aggregate<=0) throw new RangeError('Bound point-23.13 timing requires positive aggregate hazard.');
  const expectedProbability=1-Math.exp(-aggregate);
  if(Math.abs(probability01-expectedProbability)>TOLERANCE) throw new RangeError('Bound point-23.13 timing probability mismatch.');
  const rate=aggregate/timeWindowYears;
  return -Math.log(1-timingSample01*probability01)/rate;
}

function requiredUnitSample(value:number|null,name:string):number {
  if(value===null||!Number.isFinite(value)||value<0||value>=1) throw new RangeError(`${name} must be finite in [0, 1).`);
  return value;
}
function relativeError(actual:number,expected:number):number {return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
