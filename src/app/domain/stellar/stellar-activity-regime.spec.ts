import {
  StellarActivityRegime,
} from './stellar-activity-regime';

describe(
  'StellarActivityRegime',
  () => {
    it(
      'should expose the five stable point-15.4 activity regimes in increasing activity order',
      () => {
        expect(
          StellarActivityRegime.values
            .map(
              value => [
                value.name,
                value.code,
              ],
            ),
        ).toEqual([
          ['QUIESCENT', 1],
          ['LOW', 2],
          ['MODERATE', 3],
          ['HIGH', 4],
          ['EXTREME', 5],
        ]);
      },
    );

    it(
      'should classify the frozen V1 activity-index boundaries',
      () => {
        expect(
          StellarActivityRegime
            .fromActivityIndex(
              0,
            ),
        ).toBe(
          StellarActivityRegime.QUIESCENT,
        );

        expect(
          StellarActivityRegime
            .fromActivityIndex(
              0.08,
            ),
        ).toBe(
          StellarActivityRegime.LOW,
        );

        expect(
          StellarActivityRegime
            .fromActivityIndex(
              0.25,
            ),
        ).toBe(
          StellarActivityRegime.MODERATE,
        );

        expect(
          StellarActivityRegime
            .fromActivityIndex(
              0.50,
            ),
        ).toBe(
          StellarActivityRegime.HIGH,
        );

        expect(
          StellarActivityRegime
            .fromActivityIndex(
              0.75,
            ),
        ).toBe(
          StellarActivityRegime.EXTREME,
        );
      },
    );

    it(
      'should support stable-code rehydration without singleton identity assumptions',
      () => {
        for (
          const regime
          of StellarActivityRegime.values
        ) {
          expect(
            StellarActivityRegime
              .fromCode(
                regime.code,
              )
              .name,
          ).toBe(
            regime.name,
          );
        }

        expect(
          StellarActivityRegime
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        expect(
          () =>
            StellarActivityRegime
              .fromCode(
                999,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject non-finite or out-of-range activity indices',
      () => {
        for (
          const invalid
          of [
            -0.01,
            1.01,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              StellarActivityRegime
                .fromActivityIndex(
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
