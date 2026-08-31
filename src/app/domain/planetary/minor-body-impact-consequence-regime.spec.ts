import { MinorBodyImpactConsequenceRegime } from './minor-body-impact-consequence-regime';

describe('MinorBodyImpactConsequenceRegime point 23.9',()=>{
  it('should round-trip every stable code',()=>{
    for(const value of MinorBodyImpactConsequenceRegime.values) expect(MinorBodyImpactConsequenceRegime.fromCode(value.code)).toBe(value);
    expect(MinorBodyImpactConsequenceRegime.fromCodeOrNull(99)).toBeNull();
  });
});
