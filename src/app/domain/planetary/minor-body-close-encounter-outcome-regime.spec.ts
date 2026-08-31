import { MinorBodyCloseEncounterOutcomeRegime as R } from './minor-body-close-encounter-outcome-regime';

describe('MinorBodyCloseEncounterOutcomeRegime point 23.6',()=>{
  it('should round-trip every frozen close-encounter outcome code',()=>{
    for(const value of R.values) expect(R.fromCode(value.code)).toBe(value);
    expect(R.fromCodeOrNull(99)).toBeNull();
    expect(()=>R.fromCode(99)).toThrow(RangeError);
  });
});
