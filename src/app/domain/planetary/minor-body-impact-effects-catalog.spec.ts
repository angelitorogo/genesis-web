import { MinorBodyImpactEffectsCatalog } from './minor-body-impact-effects-catalog';
import { type MinorBodyImpactEffectsAssessment } from './minor-body-impact-effects-assessment';
import { type MinorBodyImpactEnergyAssessment } from './minor-body-impact-energy-assessment';
import { type MinorBodyImpactEnergyCatalog } from './minor-body-impact-energy-catalog';

const energyA={} as MinorBodyImpactEnergyAssessment;
const energyB={} as MinorBodyImpactEnergyAssessment;
const source={assessments:[energyA,energyB]} as unknown as MinorBodyImpactEnergyCatalog;

describe('MinorBodyImpactEffectsCatalog point 23.10',()=>{
  it('should preserve exact point-23.9 order/references',()=>{
    const effectA={energyAssessment:energyA} as MinorBodyImpactEffectsAssessment;
    const effectB={energyAssessment:energyB} as MinorBodyImpactEffectsAssessment;
    expect(new MinorBodyImpactEffectsCatalog(source,[effectA,effectB]).assessmentCount).toBe(2);
    expect(()=>new MinorBodyImpactEffectsCatalog(source,[effectB,effectA])).toThrow(RangeError);
  });
});
