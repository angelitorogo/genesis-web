import { MinorBodyGiantInfluenceRegime } from './minor-body-giant-influence-regime';

describe('MinorBodyGiantInfluenceRegime point 23.5',()=>{
  it('should preserve stable codes and reject unknown codes',()=>{
    expect(MinorBodyGiantInfluenceRegime.values.map(value=>value.name)).toEqual([
      'BACKGROUND','PERTURBATION_CANDIDATE','TEMPORARY_CAPTURE_CANDIDATE','EJECTION_CANDIDATE','UNBOUND_DEFLECTION_CANDIDATE',
    ]);
    for(const value of MinorBodyGiantInfluenceRegime.values) expect(MinorBodyGiantInfluenceRegime.fromCode(value.code)).toBe(value);
    expect(MinorBodyGiantInfluenceRegime.fromCodeOrNull(99)).toBeNull();
  });
});
