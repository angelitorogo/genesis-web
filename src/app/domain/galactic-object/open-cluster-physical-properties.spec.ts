import {
  OpenClusterPhysicalProperties,
} from './open-cluster-physical-properties';

describe(
  'OpenClusterPhysicalProperties',
  () => {
    function valid() {
      return new OpenClusterPhysicalProperties(
        540,
        220,
        750,
        1.1,
        2.4,
        12.0,
        0.42,
        0.73,
      );
    }

    it(
      'should preserve a valid aggregate open-cluster profile',
      () => {
        expect(
          valid(),
        ).toEqual(
          expect.objectContaining({
            stellarCount:
              540,
            massSolarMasses:
              220,
            ageMillionYears:
              750,
            metallicitySolarRatio:
              1.1,
            halfMassRadiusParsecs:
              2.4,
            tidalRadiusParsecs:
              12.0,
            binaryFraction:
              0.42,
            boundFraction:
              0.73,
          }),
        );
      },
    );

    it(
      'should reject a non-positive or non-integral stellar count',
      () => {
        for (
          const value
          of [
            0,
            -1,
            1.5,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              new OpenClusterPhysicalProperties(
                value,
                220,
                750,
                1.1,
                2.4,
                12,
                0.42,
                0.73,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject an invalid cluster mass',
      () => {
        expect(
          () =>
            new OpenClusterPhysicalProperties(
              540,
              0,
              750,
              1.1,
              2.4,
              12,
              0.42,
              0.73,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid age or metallicity',
      () => {
        expect(
          () =>
            new OpenClusterPhysicalProperties(
              540,
              220,
              0,
              1.1,
              2.4,
              12,
              0.42,
              0.73,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new OpenClusterPhysicalProperties(
              540,
              220,
              750,
              -0.1,
              2.4,
              12,
              0.42,
              0.73,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should require a positive tidal radius larger than the half-mass radius',
      () => {
        for (
          const tidalRadius
          of [
            0,
            2.4,
            2.0,
          ]
        ) {
          expect(
            () =>
              new OpenClusterPhysicalProperties(
                540,
                220,
                750,
                1.1,
                2.4,
                tidalRadius,
                0.42,
                0.73,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject a binary fraction outside the normalized range',
      () => {
        expect(
          () =>
            new OpenClusterPhysicalProperties(
              540,
              220,
              750,
              1.1,
              2.4,
              12,
              1.1,
              0.73,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a bound fraction outside the normalized range',
      () => {
        expect(
          () =>
            new OpenClusterPhysicalProperties(
              540,
              220,
              750,
              1.1,
              2.4,
              12,
              0.42,
              -0.01,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
