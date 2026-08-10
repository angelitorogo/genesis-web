import {
  GalaxyStructure,
} from './galaxy-structure';

describe(
  'GalaxyStructure',
  () => {
    it(
      'should preserve every structural property exactly',
      () => {
        const structure =
          new GalaxyStructure(
            0.65,
            0.82,
            0.14,
            0.72,
            4,
          );

        expect(
          structure.centralConcentration,
        ).toBe(0.65);

        expect(
          structure.flattening,
        ).toBe(0.82);

        expect(
          structure.asymmetry,
        ).toBe(0.14);

        expect(
          structure.barStrength,
        ).toBe(0.72);

        expect(
          structure.spiralArmCount,
        ).toBe(4);
      },
    );

    it(
      'should accept normalized boundary values',
      () => {
        const minimum =
          new GalaxyStructure(
            0,
            0,
            0,
            0,
            0,
          );

        const maximum =
          new GalaxyStructure(
            1,
            1,
            1,
            1,
            1,
          );

        expect(
          minimum.centralConcentration,
        ).toBe(0);

        expect(
          maximum.centralConcentration,
        ).toBe(1);
      },
    );

    it(
      'should reject non-finite normalized properties',
      () => {
        const invalidValues = [
          Number.NaN,
          Number.POSITIVE_INFINITY,
          Number.NEGATIVE_INFINITY,
        ];

        for (
          const value of
          invalidValues
        ) {
          expect(
            () =>
              new GalaxyStructure(
                value,
                0.5,
                0.5,
                0.5,
                2,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyStructure(
                0.5,
                value,
                0.5,
                0.5,
                2,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyStructure(
                0.5,
                0.5,
                value,
                0.5,
                2,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyStructure(
                0.5,
                0.5,
                0.5,
                value,
                2,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject normalized properties below zero',
      () => {
        expect(
          () =>
            new GalaxyStructure(
              -0.01,
              0.5,
              0.5,
              0.5,
              2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyStructure(
              0.5,
              -0.01,
              0.5,
              0.5,
              2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              -0.01,
              0.5,
              2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              0.5,
              -0.01,
              2,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject normalized properties above one',
      () => {
        expect(
          () =>
            new GalaxyStructure(
              1.01,
              0.5,
              0.5,
              0.5,
              2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyStructure(
              0.5,
              1.01,
              0.5,
              0.5,
              2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              1.01,
              0.5,
              2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              0.5,
              1.01,
              2,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a negative spiral arm count',
      () => {
        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              0.5,
              0.5,
              -1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a non-integer spiral arm count',
      () => {
        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              0.5,
              0.5,
              2.5,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject values above signed Int.MAX_VALUE',
      () => {
        expect(
          () =>
            new GalaxyStructure(
              0.5,
              0.5,
              0.5,
              0.5,
              2147483648,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);