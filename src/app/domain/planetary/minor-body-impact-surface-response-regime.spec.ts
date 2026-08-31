import { MinorBodyImpactSurfaceResponseRegime } from './minor-body-impact-surface-response-regime';

describe('MinorBodyImpactSurfaceResponseRegime point 23.10',()=>{
  it('should expose stable target-surface response states and round-trip their codes',()=>{
    expect(MinorBodyImpactSurfaceResponseRegime.values.map(value=>value.name)).toEqual([
      'NOT_APPLICABLE','NO_SOLID_SURFACE','CRATERING','LARGE_CRATER_BASIN','GLOBAL_RESHAPING','BULK_DISRUPTION',
    ]);
    for(const value of MinorBodyImpactSurfaceResponseRegime.values) {
      expect(MinorBodyImpactSurfaceResponseRegime.fromCode(value.code)).toBe(value);
    }
    expect(MinorBodyImpactSurfaceResponseRegime.fromCodeOrNull(99)).toBeNull();
  });
});
