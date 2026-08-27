import {
  StellarRotationRegime,
} from './stellar-rotation-regime';

describe(
  'StellarRotationRegime',
  () => {
    it(
      'should expose the five canonical point-15.5 rotation regimes in fast-to-slow order',
      () => {
        expect(
          StellarRotationRegime.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'VERY_FAST',
          'FAST',
          'MODERATE',
          'SLOW',
          'VERY_SLOW',
        ]);

        expect(
          StellarRotationRegime.values
            .map(
              value =>
                value.code,
            ),
        ).toEqual([
          1,
          2,
          3,
          4,
          5,
        ]);
      },
    );

    it(
      'should classify positive rotation periods on the frozen V1 boundaries',
      () => {
        expect(
          StellarRotationRegime
            .fromRotationPeriodDays(
              0.10,
            ),
        ).toBe(
          StellarRotationRegime.VERY_FAST,
        );

        expect(
          StellarRotationRegime
            .fromRotationPeriodDays(
              0.50,
            ),
        ).toBe(
          StellarRotationRegime.FAST,
        );

        expect(
          StellarRotationRegime
            .fromRotationPeriodDays(
              3.0,
            ),
        ).toBe(
          StellarRotationRegime.MODERATE,
        );

        expect(
          StellarRotationRegime
            .fromRotationPeriodDays(
              15.0,
            ),
        ).toBe(
          StellarRotationRegime.SLOW,
        );

        expect(
          StellarRotationRegime
            .fromRotationPeriodDays(
              60.0,
            ),
        ).toBe(
          StellarRotationRegime.VERY_SLOW,
        );
      },
    );

    it(
      'should rehydrate by stable code and reject invalid periods or unknown codes',
      () => {
        for (
          const regime
          of StellarRotationRegime.values
        ) {
          expect(
            StellarRotationRegime
              .fromCode(
                regime.code,
              )
              .name,
          ).toBe(
            regime.name,
          );
        }

        expect(
          StellarRotationRegime
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        for (
          const invalid
          of [
            0,
            -1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              StellarRotationRegime
                .fromRotationPeriodDays(
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
