import {
  MoonAtmosphereRegime,
  moonAtmosphereRegimeForRetentionIndex01,
} from './moon-atmosphere-regime';

describe(
  'MoonAtmosphereRegime point 21.5',
  () => {
    it(
      'should map the frozen retention thresholds',
      () => {
        expect(
          moonAtmosphereRegimeForRetentionIndex01(0),
        ).toBe(
          MoonAtmosphereRegime.NONE,
        );
        expect(
          moonAtmosphereRegimeForRetentionIndex01(0.10),
        ).toBe(
          MoonAtmosphereRegime.EXOSPHERE,
        );
        expect(
          moonAtmosphereRegimeForRetentionIndex01(0.25),
        ).toBe(
          MoonAtmosphereRegime.TRACE,
        );
        expect(
          moonAtmosphereRegimeForRetentionIndex01(0.38),
        ).toBe(
          MoonAtmosphereRegime.THIN,
        );
        expect(
          moonAtmosphereRegimeForRetentionIndex01(0.70),
        ).toBe(
          MoonAtmosphereRegime.SUBSTANTIAL,
        );
      },
    );

    it(
      'should reject invalid indices',
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
              moonAtmosphereRegimeForRetentionIndex01(
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
