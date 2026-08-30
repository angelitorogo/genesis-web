import {
  MoonTidalRegime,
  moonTidalRegimeForHeatingIndex01,
} from './moon-tidal-regime';

describe(
  'MoonTidalRegime point 21.4',
  () => {
    it(
      'should map the frozen V1 heating thresholds',
      () => {
        expect(
          moonTidalRegimeForHeatingIndex01(
            0,
          ),
        ).toBe(
          MoonTidalRegime.NEGLIGIBLE,
        );

        expect(
          moonTidalRegimeForHeatingIndex01(
            0.05,
          ),
        ).toBe(
          MoonTidalRegime.WEAK,
        );

        expect(
          moonTidalRegimeForHeatingIndex01(
            0.20,
          ),
        ).toBe(
          MoonTidalRegime.MODERATE,
        );

        expect(
          moonTidalRegimeForHeatingIndex01(
            0.45,
          ),
        ).toBe(
          MoonTidalRegime.STRONG,
        );

        expect(
          moonTidalRegimeForHeatingIndex01(
            0.75,
          ),
        ).toBe(
          MoonTidalRegime.EXTREME,
        );
      },
    );

    it(
      'should reject values outside [0, 1]',
      () => {
        for (
          const value
          of [
            -0.01,
            1.01,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              moonTidalRegimeForHeatingIndex01(
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
