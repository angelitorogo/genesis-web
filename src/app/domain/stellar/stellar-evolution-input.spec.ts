import {
  STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
  STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
  StellarEvolutionInput,
} from './stellar-evolution-input';

describe(
  'StellarEvolutionInput',
  () => {
    it(
      'should preserve valid point-14.8 mass, metallicity and age inputs',
      () => {
        const input =
          new StellarEvolutionInput(
            1.0,
            1.0,
            4.6,
          );

        expect(
          input.initialMassSolar,
        ).toBe(
          1.0,
        );

        expect(
          input.metallicitySolarRatio,
        ).toBe(
          1.0,
        );

        expect(
          input.ageBillionYears,
        ).toBe(
          4.6,
        );
      },
    );

    it(
      'should accept the frozen V1 mass envelope including zero metallicity and zero age',
      () => {
        expect(
          new StellarEvolutionInput(
            STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
            0,
            0,
          )
            .initialMassSolar,
        ).toBe(
          STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR,
        );

        expect(
          new StellarEvolutionInput(
            STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
            3.0,
            13.8,
          )
            .initialMassSolar,
        ).toBe(
          STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR,
        );
      },
    );

    it(
      'should reject masses outside the point-14.8 V1 modeled envelope',
      () => {
        for (
          const invalidMass
          of [
            0,
            STELLAR_EVOLUTION_V1_MIN_INITIAL_MASS_SOLAR -
              0.0001,
            STELLAR_EVOLUTION_V1_MAX_INITIAL_MASS_SOLAR +
              0.001,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new StellarEvolutionInput(
                invalidMass,
                1.0,
                1.0,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject negative or non-finite metallicity and age',
      () => {
        for (
          const invalidMetallicity
          of [
            -0.001,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new StellarEvolutionInput(
                1.0,
                invalidMetallicity,
                1.0,
              ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const invalidAge
          of [
            -0.001,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new StellarEvolutionInput(
                1.0,
                1.0,
                invalidAge,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
