import { type MinorBodyImpactRiskCatalog } from './minor-body-impact-risk-catalog';
import { type MinorBodyTemporalImpactProbabilityAssessment } from './minor-body-temporal-impact-probability-assessment';
import { MinorBodyTemporalImpactProbabilityRegime } from './minor-body-temporal-impact-probability-regime';

/** Point-23.8 finite-horizon temporal probability projection over the full 23.7 risk matrix. */
export class MinorBodyTemporalImpactProbabilityCatalog {
  readonly assessments:readonly MinorBodyTemporalImpactProbabilityAssessment[];

  constructor(
    readonly impactRiskCatalog:MinorBodyImpactRiskCatalog,
    readonly timeWindowYears:number,
    assessments:readonly MinorBodyTemporalImpactProbabilityAssessment[],
  ) {
    if(!Number.isFinite(timeWindowYears)||timeWindowYears<=0) throw new RangeError('MinorBodyTemporalImpactProbabilityCatalog timeWindowYears must be finite and > 0.');
    this.assessments=Object.freeze([...assessments]);
    if(this.assessments.length!==impactRiskCatalog.assessments.length) throw new RangeError('Point-23.8 requires exactly one temporal assessment for every point-23.7 risk assessment.');
    for(let index=0;index<this.assessments.length;index+=1) {
      const item=this.assessments[index];
      if(item.impactRiskAssessment!==impactRiskCatalog.assessments[index]||item.timeWindowYears!==timeWindowYears) {
        throw new RangeError('Point-23.8 must preserve exact point-23.7 assessment order/references and one shared time window.');
      }
    }
  }

  get assessmentCount(){return this.assessments.length;}
  get orbitalRiskCandidateCount(){return this.assessments.filter(item=>item.orbitalRiskCandidate).length;}
  get nonZeroTemporalProbabilityCount(){return this.assessments.filter(item=>item.hasNonZeroTemporalImpactProbability).length;}
  get orbitalRiskOnlyCount(){return this.assessments.filter(item=>item.regime===MinorBodyTemporalImpactProbabilityRegime.ORBITAL_RISK_ONLY).length;}
  get singlePassageCount(){return this.assessments.filter(item=>item.regime===MinorBodyTemporalImpactProbabilityRegime.SINGLE_PASSAGE).length;}
  get highestTemporalImpactProbability01(){return this.assessments.reduce((highest,item)=>Math.max(highest,item.temporalImpactProbability01),0);}
  get expectedImpactCount(){return this.assessments.reduce((total,item)=>total+item.expectedImpactCount,0);}
  get temporallyRelevantAssessments(){return Object.freeze(this.assessments.filter(item=>item.orbitalRiskCandidate));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(item=>item.minorBodyProceduralId===proceduralId));}
}
