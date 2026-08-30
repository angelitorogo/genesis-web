import {
  MoonAtmosphereRegime,
} from './moon-atmosphere-regime';

import {
  MoonEnvironmentState,
} from './moon-environment-state';

import {
  MoonGeologyRegime,
} from './moon-geology-regime';

import {
  MoonWaterRegime,
} from './moon-water-regime';

describe(
  'MoonEnvironmentState point 21.5',
  () => {
    it(
      'should preserve a coherent atmosphere/water/geology projection without a habitability verdict',
      () => {
        const state =
          new MoonEnvironmentState(
            2,
            1,
            0.02,
            0.35,
            2.2,
            0.16,
            1,
            0.60,
            0.70,
            0.42,
            260,
            281,
            0.55,
            MoonAtmosphereRegime.SUBSTANTIAL,
            0.70,
            0.60,
            0.50,
            MoonWaterRegime.MIXED,
            0.50,
            0.60,
            MoonGeologyRegime.TIDALLY_ACTIVE,
          );

        expect(
          state.hasAtmosphere,
        ).toBe(true);
        expect(
          state.hasSubstantialAtmosphere,
        ).toBe(true);
        expect(
          state.hasWater,
        ).toBe(true);
        expect(
          state.hasSubsurfaceOcean,
        ).toBe(true);
        expect(
          state.hasSurfaceLiquidWater,
        ).toBe(true);
        expect(
          state.isGeologicallyActive,
        ).toBe(true);
        expect(
          'habitability' in state,
        ).toBe(false);
      },
    );

    it(
      'should reject atmosphere, water or geology labels that disagree with their frozen indices',
      () => {
        const create = (
          atmosphereRegime:
            MoonAtmosphereRegime,

          waterRegime:
            MoonWaterRegime,

          geologyRegime:
            MoonGeologyRegime,
        ) =>
          new MoonEnvironmentState(
            1,
            1,
            0.01,
            0.25,
            3,
            0.16,
            1,
            0.60,
            0.40,
            0.30,
            260,
            281,
            0.55,
            atmosphereRegime,
            0.50,
            0.60,
            0.50,
            waterRegime,
            0.50,
            0.60,
            geologyRegime,
          );

        expect(
          () =>
            create(
              MoonAtmosphereRegime.NONE,
              MoonWaterRegime.MIXED,
              MoonGeologyRegime.TIDALLY_ACTIVE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              MoonAtmosphereRegime.SUBSTANTIAL,
              MoonWaterRegime.SURFACE_ICE,
              MoonGeologyRegime.TIDALLY_ACTIVE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            create(
              MoonAtmosphereRegime.SUBSTANTIAL,
              MoonWaterRegime.MIXED,
              MoonGeologyRegime.INERT,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
