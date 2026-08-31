import { MinorBodyTemporalImpactProbabilityRegime } from './minor-body-temporal-impact-probability-regime';

describe('MinorBodyTemporalImpactProbabilityRegime point 23.8',()=>{
  it('should round-trip every stable code',()=>{
    for(const value of MinorBodyTemporalImpactProbabilityRegime.values) {
      expect(MinorBodyTemporalImpactProbabilityRegime.fromCode(value.code)).toBe(value);
    }
    expect(MinorBodyTemporalImpactProbabilityRegime.fromCodeOrNull(99)).toBeNull();
  });
});
