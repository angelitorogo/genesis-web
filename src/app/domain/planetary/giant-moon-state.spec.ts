import {
  GiantMoonCompositionRegime,
} from './giant-moon-composition-regime';

import {
  GiantMoonOrbitalFamily,
} from './giant-moon-orbital-family';

import {
  GiantMoonState,
} from './giant-moon-state';

import {
  PlanetType,
} from './planet-type';

describe(
  'GiantMoonState point 21.7',
  () => {
    it(
      'should preserve an applicable gas-giant moon specialization',
      () => {
        const state =
          new GiantMoonState(
            2,
            1,
            PlanetType.GAS_GIANT,
            0.015,
            0.25,
            10,
            0.01,
            1,
            0.72,
            0.60,
            0.70,
            0.05,
            0.40,
            true,
            GiantMoonOrbitalFamily.INNER_REGULAR,
            GiantMoonCompositionRegime.ICE_RICH,
            true,
            true,
            true,
            true,
          );

        expect(
          state.isApplicable,
        ).toBe(true);
        expect(
          state.isLargeMoon,
        ).toBe(true);
        expect(
          state.isTidallyActive,
        ).toBe(true);
        expect(
          state.isOceanBearingCandidate,
        ).toBe(true);
        expect(
          state.isHabitabilityCandidate,
        ).toBe(true);
      },
    );

    it(
      'should keep non-giant hosts explicitly non-applicable',
      () => {
        const state =
          new GiantMoonState(
            1,
            1,
            PlanetType.ROCKY,
            0.01,
            0.25,
            20,
            0.02,
            2,
            0.05,
            0.30,
            0.05,
            0.01,
            0.02,
            false,
            GiantMoonOrbitalFamily.NOT_APPLICABLE,
            GiantMoonCompositionRegime.NOT_APPLICABLE,
            false,
            false,
            false,
            false,
          );

        expect(
          state.isApplicable,
        ).toBe(false);
      },
    );

    it(
      'should reject derived classifications or flags that do not match frozen sources',
      () => {
        expect(
          () =>
            new GiantMoonState(
              2,
              1,
              PlanetType.GAS_GIANT,
              0.015,
              0.25,
              10,
              0.01,
              1,
              0.72,
              0.60,
              0.70,
              0.05,
              0.40,
              true,
              GiantMoonOrbitalFamily.OUTER_REGULAR,
              GiantMoonCompositionRegime.ICE_RICH,
              true,
              true,
              true,
              true,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
