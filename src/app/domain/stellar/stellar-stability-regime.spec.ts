import {
  StellarStabilityRegime,
} from './stellar-stability-regime';

describe(
  'StellarStabilityRegime',
  () => {
    it(
      'should expose exactly the four point-15.5 ordinary stability regimes',
      () => {
        expect(
          StellarStabilityRegime.values
            .map(
              value =>
                value.name,
            ),
        ).toEqual([
          'UNSTABLE',
          'VARIABLE',
          'STABLE',
          'HIGHLY_STABLE',
        ]);

        expect(
          StellarStabilityRegime.values
            .map(
              value =>
                value.code,
            ),
        ).toEqual([
          1,
          2,
          3,
          4,
        ]);
      },
    );

    it(
      'should classify the full normalized stability interval on frozen boundaries',
      () => {
        expect(
          StellarStabilityRegime
            .fromStabilityIndex(
              0,
            ),
        ).toBe(
          StellarStabilityRegime.UNSTABLE,
        );

        expect(
          StellarStabilityRegime
            .fromStabilityIndex(
              0.25,
            ),
        ).toBe(
          StellarStabilityRegime.VARIABLE,
        );

        expect(
          StellarStabilityRegime
            .fromStabilityIndex(
              0.50,
            ),
        ).toBe(
          StellarStabilityRegime.STABLE,
        );

        expect(
          StellarStabilityRegime
            .fromStabilityIndex(
              0.75,
            ),
        ).toBe(
          StellarStabilityRegime.HIGHLY_STABLE,
        );

        expect(
          StellarStabilityRegime
            .fromStabilityIndex(
              1,
            ),
        ).toBe(
          StellarStabilityRegime.HIGHLY_STABLE,
        );
      },
    );

    it(
      'should rehydrate by stable code and reject values outside the normalized interval',
      () => {
        for (
          const regime
          of StellarStabilityRegime.values
        ) {
          expect(
            StellarStabilityRegime
              .fromCode(
                regime.code,
              )
              .name,
          ).toBe(
            regime.name,
          );
        }

        expect(
          StellarStabilityRegime
            .fromCodeOrNull(
              999,
            ),
        ).toBeNull();

        for (
          const invalid
          of [
            -0.001,
            1.001,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              StellarStabilityRegime
                .fromStabilityIndex(
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
