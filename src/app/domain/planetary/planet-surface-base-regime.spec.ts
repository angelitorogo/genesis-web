import {
  PlanetSurfaceBaseRegime,
} from './planet-surface-base-regime';

describe(
  'PlanetSurfaceBaseRegime point 19.6',
  () => {
    it(
      'should expose the eight coarse solid/envelope baseline regimes',
      () => {
        expect(
          Object.values(
            PlanetSurfaceBaseRegime,
          ),
        ).toEqual([
          'MINERAL_REGOLITH',
          'MASSIVE_MINERAL_REGOLITH',
          'ARID_MINERAL',
          'VOLATILE_RICH_SOLID',
          'FROZEN_VOLATILE',
          'THERMALLY_REWORKED_MINERAL',
          'DEEP_ENVELOPE',
          'ICE_RICH_DEEP_ENVELOPE',
        ]);
      },
    );
  },
);
