import {
  GiantMoonCompositionRegime,
  giantMoonCompositionRegimeV1,
} from './giant-moon-composition-regime';

describe(
  'GiantMoonCompositionRegime point 21.7',
  () => {
    it(
      'should map the frozen point-21.5 ice-richness proxy without claiming exact chemistry',
      () => {
        expect(
          giantMoonCompositionRegimeV1(
            false,
            0.9,
          ),
        ).toBe(
          GiantMoonCompositionRegime.NOT_APPLICABLE,
        );

        expect(
          giantMoonCompositionRegimeV1(
            true,
            0.1,
          ),
        ).toBe(
          GiantMoonCompositionRegime.ROCK_RICH,
        );

        expect(
          giantMoonCompositionRegimeV1(
            true,
            0.4,
          ),
        ).toBe(
          GiantMoonCompositionRegime.MIXED_ROCK_ICE,
        );

        expect(
          giantMoonCompositionRegimeV1(
            true,
            0.8,
          ),
        ).toBe(
          GiantMoonCompositionRegime.ICE_RICH,
        );
      },
    );

    it(
      'should reject values outside the normalized interval',
      () => {
        for (
          const value of [
            -0.1,
            1.1,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              giantMoonCompositionRegimeV1(
                true,
                value,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
