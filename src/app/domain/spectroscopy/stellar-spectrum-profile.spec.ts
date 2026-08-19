import {
  STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN,
  STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN,
  StellarSpectrumProfile,
} from './stellar-spectrum-profile';

describe(
  'point-13.2 StellarSpectrumProfile',
  () => {

    it(
      'should preserve the supplied effective temperature without inventing a Star identity or spectral classification',
      () => {
        const profile =
          new StellarSpectrumProfile(
            5_778,
          );

        expect(
          profile
            .effectiveTemperatureKelvin,
        ).toBe(
          5_778,
        );

        expect(
          Object.keys(
            profile,
          ),
        ).toEqual([
          'effectiveTemperatureKelvin',
        ]);
      },
    );

    it(
      'should accept both frozen V1 temperature-envelope boundaries',
      () => {
        expect(
          new StellarSpectrumProfile(
            STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN,
          )
            .effectiveTemperatureKelvin,
        ).toBe(
          STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN,
        );

        expect(
          new StellarSpectrumProfile(
            STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN,
          )
            .effectiveTemperatureKelvin,
        ).toBe(
          STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN,
        );
      },
    );

    it(
      'should reject non-finite or out-of-envelope temperatures',
      () => {
        for (
          const invalid
          of [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            STELLAR_SPECTRUM_MIN_EFFECTIVE_TEMPERATURE_KELVIN -
              1,
            STELLAR_SPECTRUM_MAX_EFFECTIVE_TEMPERATURE_KELVIN +
              1,
          ]
        ) {
          expect(
            () =>
              new StellarSpectrumProfile(
                invalid,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
