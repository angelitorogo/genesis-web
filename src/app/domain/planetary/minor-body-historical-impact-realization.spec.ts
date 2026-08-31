import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { historicalImpactAggregateV1,historicalImpactProbabilityV1,historicalImpactSelectedAssessmentV1,historicalImpactTimeYearsAfterWindowStartV1 } from './minor-body-historical-impact-realization';
function a(id:string,lambda:number,single=false):MinorBodyEarlyDeliveryAssessment{return {minorBodyProceduralId:id,expectedImpactCount:lambda,temporalImpactProbability01:single?lambda:1-Math.exp(-lambda),timeWindowYears:100,temporalAssessment:{isSinglePassage:single}} as unknown as MinorBodyEarlyDeliveryAssessment;}
describe('MinorBodyHistoricalImpactRealization point 23.13',()=>{
  it('should convert bound competing hazards into one cumulative impact probability',()=>{const list=[a('A'.repeat(32),.2),a('A'.repeat(32),.3)];expect(historicalImpactAggregateV1(list,false)).toBeCloseTo(.5,12);expect(historicalImpactProbabilityV1(.5,false)).toBeCloseTo(1-Math.exp(-.5),12);});
  it('should select exactly one competing target by hazard weight',()=>{const first=a('A'.repeat(32),.2);const second=a('A'.repeat(32),.8);expect(historicalImpactSelectedAssessmentV1([first,second],false,.1).assessment).toBe(first);expect(historicalImpactSelectedAssessmentV1([first,second],false,.9).assessment).toBe(second);});
  it('should place a bound first impact inside the frozen retrospective window',()=>{const t=historicalImpactTimeYearsAfterWindowStartV1(100,false,.5,1-Math.exp(-.5),.75);expect(t).toBeGreaterThanOrEqual(0);expect(t).toBeLessThanOrEqual(100);});
});
