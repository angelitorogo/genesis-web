import { MinorBodyImpactConsequenceRegime } from './minor-body-impact-consequence-regime';
import { MinorBodyImpactEnergyAssessment } from './minor-body-impact-energy-assessment';
import { MinorBodyImpactEnergyRegime } from './minor-body-impact-energy-regime';
import { type MinorBodyTemporalImpactProbabilityAssessment } from './minor-body-temporal-impact-probability-assessment';

const source={
  hasNonZeroTemporalImpactProbability:true,
  impactRiskAssessment:{},minorBody:{},minorBodyProceduralId:'A'.repeat(32),minorBodyDesignation:'AST-001',targetKind:{},targetPlanet:{},targetMoon:null,targetName:'P1',temporalImpactProbability01:1e-6,
} as unknown as MinorBodyTemporalImpactProbabilityAssessment;

describe('MinorBodyImpactEnergyAssessment point 23.9',()=>{
  it('should validate conditional kinetic energy independently from temporal probability',()=>{
    const mass=1e12;
    const speed=20;
    const energy=0.5*mass*(speed*1000)**2;
    const binding=1e30;
    const assessment=new MinorBodyImpactEnergyAssessment(
      source,true,1,3,mass,15,speed,energy,energy/4.184e15,6e24,binding,energy/binding,
      MinorBodyImpactEnergyRegime.GIGATON_CLASS,MinorBodyImpactConsequenceRegime.GLOBAL,
    );
    expect(assessment.kineticEnergyJoules).toBe(energy);
    expect(assessment.temporalImpactProbability01).toBe(1e-6);
  });

  it('should require null physical outputs when point 23.8 has zero temporal impact probability',()=>{
    const noProbability={...source,hasNonZeroTemporalImpactProbability:false,temporalImpactProbability01:0} as unknown as MinorBodyTemporalImpactProbabilityAssessment;
    const assessment=new MinorBodyImpactEnergyAssessment(
      noProbability,false,null,null,null,null,null,null,null,null,null,null,
      MinorBodyImpactEnergyRegime.NOT_APPLICABLE,MinorBodyImpactConsequenceRegime.NOT_APPLICABLE,
    );
    expect(assessment.impactScenarioApplicable).toBe(false);
    expect(assessment.kineticEnergyJoules).toBeNull();
  });
});
