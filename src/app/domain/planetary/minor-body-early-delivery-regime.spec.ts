import { MinorBodyEarlyDeliveryRegime } from './minor-body-early-delivery-regime';

describe('MinorBodyEarlyDeliveryRegime point 23.11',()=>{
  it('should expose stable codes and round-trip every delivery regime',()=>{
    expect(MinorBodyEarlyDeliveryRegime.values.map(value=>value.name)).toEqual([
      'NOT_APPLICABLE','REFRACTORY_DOMINATED','TRACE_DELIVERY','WATER_RICH','ORGANIC_CARRIER_RICH','MIXED_WATER_ORGANIC',
    ]);
    for(const value of MinorBodyEarlyDeliveryRegime.values) {
      expect(MinorBodyEarlyDeliveryRegime.fromCode(value.code)).toBe(value);
    }
    expect(MinorBodyEarlyDeliveryRegime.fromCodeOrNull(99)).toBeNull();
    expect(()=>MinorBodyEarlyDeliveryRegime.fromCode(99)).toThrow(RangeError);
  });
});
