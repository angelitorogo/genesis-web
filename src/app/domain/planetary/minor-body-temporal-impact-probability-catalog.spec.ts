import { type MinorBodyImpactRiskCatalog } from './minor-body-impact-risk-catalog';
import { type MinorBodyTemporalImpactProbabilityAssessment } from './minor-body-temporal-impact-probability-assessment';
import { MinorBodyTemporalImpactProbabilityCatalog } from './minor-body-temporal-impact-probability-catalog';

describe('MinorBodyTemporalImpactProbabilityCatalog point 23.8',()=>{
  it('should preserve a one-to-one matrix over the exact 23.7 assessments',()=>{
    const riskA={} as any;
    const riskB={} as any;
    const source={assessments:[riskA,riskB]} as unknown as MinorBodyImpactRiskCatalog;
    const temporalA={impactRiskAssessment:riskA,timeWindowYears:100,orbitalRiskCandidate:false,hasNonZeroTemporalImpactProbability:false,regime:{},temporalImpactProbability01:0,expectedImpactCount:0,minorBodyProceduralId:'A'} as unknown as MinorBodyTemporalImpactProbabilityAssessment;
    const temporalB={impactRiskAssessment:riskB,timeWindowYears:100,orbitalRiskCandidate:true,hasNonZeroTemporalImpactProbability:true,regime:{},temporalImpactProbability01:0.01,expectedImpactCount:0.01,minorBodyProceduralId:'B'} as unknown as MinorBodyTemporalImpactProbabilityAssessment;
    const catalog=new MinorBodyTemporalImpactProbabilityCatalog(source,100,[temporalA,temporalB]);
    expect(catalog.assessmentCount).toBe(2);
    expect(catalog.orbitalRiskCandidateCount).toBe(1);
    expect(catalog.nonZeroTemporalProbabilityCount).toBe(1);
    expect(catalog.highestTemporalImpactProbability01).toBe(0.01);
  });
});
