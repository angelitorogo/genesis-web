import {
  STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
} from './stellar-evolution-input';

import {
  StellarPhysicalProperties,
} from './stellar-physical-properties';

describe(
  'StellarPhysicalProperties',
  () => {
    it(
      'should preserve the point-15.1 physical baseline in canonical solar/Kelvin units',
      () => {
        const properties =
          new StellarPhysicalProperties(
            1.0,
            1.0,
            1.0,
            1.0,
            5_772,
          );

        expect(
          properties,
        ).toEqual(
          expect.objectContaining({
            initialMassSolar:
              1.0,
            currentMassSolar:
              1.0,
            radiusSolar:
              1.0,
            luminositySolar:
              1.0,
            effectiveTemperatureKelvin:
              5_772,
          }),
        );
      },
    );

    it(
      'should accept the complete frozen phase-14 initial-mass envelope',
      () => {
        expect(
          new StellarPhysicalProperties(
            STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
            STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
            0.1,
            0.00001,
            1_100,
          )
            .initialMassSolar,
        ).toBe(
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
        );

        expect(
          new StellarPhysicalProperties(
            STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
            STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
            15,
            500_000,
            45_000,
          )
            .initialMassSolar,
        ).toBe(
          STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
        );
      },
    );

    it(
      'should reject invalid masses including current mass greater than the initial mass',
      () => {
        for (
          const initialMassSolar
          of [
            0,
            STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR -
              0.001,
            STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR +
              0.001,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new StellarPhysicalProperties(
                initialMassSolar,
                1,
                1,
                1,
                5_772,
              ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const currentMassSolar
          of [
            0,
            -1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
            1.01,
          ]
        ) {
          expect(
            () =>
              new StellarPhysicalProperties(
                1,
                currentMassSolar,
                1,
                1,
                5_772,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject non-positive or non-finite radius, luminosity and temperature',
      () => {
        const invalid = [
          0,
          -1,
          Number.NaN,
          Number.POSITIVE_INFINITY,
        ];

        for (
          const value
          of invalid
        ) {
          expect(
            () =>
              new StellarPhysicalProperties(
                1,
                1,
                value,
                1,
                5_772,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new StellarPhysicalProperties(
                1,
                1,
                1,
                value,
                5_772,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new StellarPhysicalProperties(
                1,
                1,
                1,
                1,
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
