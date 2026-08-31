import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { type MinorBodyImpactRiskAssessment } from './minor-body-impact-risk-assessment';
import { MinorBodyTemporalImpactProbabilityAssessment, regimeForProbability } from './minor-body-temporal-impact-probability-assessment';
import { MinorBodyTemporalImpactProbabilityRegime } from './minor-body-temporal-impact-probability-regime';

const source={
  evaluatedOrbitalElements:{isHyperbolic:false},
  targetKind:MinorBodyApproachTargetKind.PLANET,
  directCollisionGeometryCandidate:true,
  riskCandidate:true,
  minorBody:{},minorBodyProceduralId:'0'.repeat(32),minorBodyDesignation:'AST',targetPlanet:{},targetMoon:null,targetName:'P1',orbitalRiskIndex01:0.5,
} as unknown as MinorBodyImpactRiskAssessment;

describe('MinorBodyTemporalImpactProbabilityAssessment point 23.8',()=>{
  it('should preserve orbital risk while validating a finite-window Poisson probability',()=>{
    const frequency=2;
    const perOpportunity=1e-6;
    const years=100;
    const expected=frequency*years*perOpportunity;
    const probability=1-Math.exp(-expected);
    const assessment=new MinorBodyTemporalImpactProbabilityAssessment(
      source,years,false,frequency,frequency*years,1,1,perOpportunity,expected,probability,regimeForProbability(probability),
    );
    expect(assessment.orbitalRiskCandidate).toBe(true);
    expect(assessment.temporalImpactProbability01).toBeGreaterThan(0);
    expect(assessment.temporalImpactProbability01).toBeLessThan(assessment.orbitalRiskIndex01);
  });

  it('should reject treating an orbital-only planet approach as a non-zero temporal impact probability',()=>{
    const orbitalOnly={...source,directCollisionGeometryCandidate:false} as unknown as MinorBodyImpactRiskAssessment;
    expect(()=>new MinorBodyTemporalImpactProbabilityAssessment(
      orbitalOnly,100,false,2,200,1,1,1e-6,2e-4,1-Math.exp(-2e-4),MinorBodyTemporalImpactProbabilityRegime.LOW,
    )).toThrow(RangeError);
  });
});
