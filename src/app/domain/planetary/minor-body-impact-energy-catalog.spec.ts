import { MinorBodyImpactConsequenceRegime } from './minor-body-impact-consequence-regime';
import { type MinorBodyImpactEnergyAssessment } from './minor-body-impact-energy-assessment';
import { MinorBodyImpactEnergyCatalog } from './minor-body-impact-energy-catalog';
import { type MinorBodyTemporalImpactProbabilityCatalog } from './minor-body-temporal-impact-probability-catalog';

describe('MinorBodyImpactEnergyCatalog point 23.9',()=>{
  it('should preserve one-to-one source order and expose severity counts',()=>{
    const sourceA={},sourceB={};
    const source={assessments:[sourceA,sourceB]} as unknown as MinorBodyTemporalImpactProbabilityCatalog;
    const first={temporalAssessment:sourceA,impactScenarioApplicable:true,consequenceRegime:MinorBodyImpactConsequenceRegime.REGIONAL,kineticEnergyJoules:1e18,tntEquivalentMegatons:100,minorBodyProceduralId:'A'} as unknown as MinorBodyImpactEnergyAssessment;
    const second={temporalAssessment:sourceB,impactScenarioApplicable:false,consequenceRegime:MinorBodyImpactConsequenceRegime.NOT_APPLICABLE,kineticEnergyJoules:null,tntEquivalentMegatons:null,minorBodyProceduralId:'B'} as unknown as MinorBodyImpactEnergyAssessment;
    const catalog=new MinorBodyImpactEnergyCatalog(source,[first,second]);
    expect(catalog.assessmentCount).toBe(2);
    expect(catalog.applicableImpactScenarioCount).toBe(1);
    expect(catalog.regionalCount).toBe(1);
    expect(catalog.maximumKineticEnergyJoules).toBe(1e18);
  });
});
