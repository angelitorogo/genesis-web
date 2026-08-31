import { MinorBodyImpactRiskRegime } from './minor-body-impact-risk-regime';

describe('MinorBodyImpactRiskRegime point 23.7',()=>{
  it('should round-trip every frozen risk regime code',()=>{
    for(const regime of MinorBodyImpactRiskRegime.values) expect(MinorBodyImpactRiskRegime.fromCode(regime.code)).toBe(regime);
  });
  it('should reject unknown codes',()=>{
    expect(MinorBodyImpactRiskRegime.fromCodeOrNull(99)).toBeNull();
    expect(()=>MinorBodyImpactRiskRegime.fromCode(99)).toThrow(RangeError);
  });
});
