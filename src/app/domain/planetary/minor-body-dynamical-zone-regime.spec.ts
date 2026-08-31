import { MinorBodyDynamicalZoneRegime } from './minor-body-dynamical-zone-regime';

describe('MinorBodyDynamicalZoneRegime point 23.4',()=>{
  it('should keep unbound/background/resonant/chaotic diagnoses separate',()=>{
    expect(MinorBodyDynamicalZoneRegime.values.map(value=>value.name)).toEqual([
      'UNBOUND_PASSAGE','BACKGROUND','RESONANT_BAND','CHAOTIC_ZONE','CHAOTIC_RESONANT_OVERLAP',
    ]);
    for(const value of MinorBodyDynamicalZoneRegime.values){
      expect(MinorBodyDynamicalZoneRegime.fromCode(value.code)).toBe(value);
    }
  });
});
