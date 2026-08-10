import {
  SupermassiveBlackHole,
} from './supermassive-black-hole';

describe(
  'SupermassiveBlackHole',
  () => {
    it(
      'should preserve its mass exactly',
      () => {
        const blackHole =
          new SupermassiveBlackHole(
            139081637.61111212,
          );

        expect(
          blackHole.massSolarMasses,
        ).toBe(
          139081637.61111212,
        );
      },
    );

    it(
      'should accept any finite strictly positive mass',
      () => {
        expect(
          new SupermassiveBlackHole(
            Number.MIN_VALUE,
          ).massSolarMasses,
        ).toBe(
          Number.MIN_VALUE,
        );

        expect(
          new SupermassiveBlackHole(
            Number.MAX_VALUE,
          ).massSolarMasses,
        ).toBe(
          Number.MAX_VALUE,
        );
      },
    );

    it(
      'should reject zero and negative masses',
      () => {
        expect(
          () =>
            new SupermassiveBlackHole(
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new SupermassiveBlackHole(
              -1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject non-finite masses',
      () => {
        for (
          const value of [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new SupermassiveBlackHole(
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