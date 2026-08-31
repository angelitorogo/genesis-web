import { MinorBodyImpactEnergyRegime } from './minor-body-impact-energy-regime';

describe('MinorBodyImpactEnergyRegime point 23.9',()=>{
  it('should round-trip every stable code',()=>{
    for(const value of MinorBodyImpactEnergyRegime.values) expect(MinorBodyImpactEnergyRegime.fromCode(value.code)).toBe(value);
    expect(MinorBodyImpactEnergyRegime.fromCodeOrNull(99)).toBeNull();
  });
});
