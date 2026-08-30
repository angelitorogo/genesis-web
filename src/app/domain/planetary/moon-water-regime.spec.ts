import {
  MoonWaterRegime,
} from './moon-water-regime';

describe(
  'MoonWaterRegime point 21.5',
  () => {
    it(
      'should expose only phase/inventory regimes and no habitability verdict',
      () => {
        expect(
          Object.values(
            MoonWaterRegime,
          ),
        ).toEqual([
          'NONE',
          'SURFACE_ICE',
          'SUBSURFACE_OCEAN',
          'ICE_AND_SUBSURFACE_OCEAN',
          'SURFACE_LIQUID',
          'MIXED',
        ]);
      },
    );
  },
);
