import { MinorBodyResonanceRegime } from './minor-body-resonance-regime';

describe('MinorBodyResonanceRegime point 23.4',()=>{
  it('should expose stable unique codes and round-trip them',()=>{
    expect(MinorBodyResonanceRegime.values.map(value=>value.name)).toEqual([
      'NOT_APPLICABLE_UNBOUND','NONE','CO_ORBITAL','INTERIOR','EXTERIOR',
    ]);
    for(const value of MinorBodyResonanceRegime.values){
      expect(MinorBodyResonanceRegime.fromCode(value.code)).toBe(value);
    }
    expect(MinorBodyResonanceRegime.fromCodeOrNull(99)).toBeNull();
  });
});
