import {
  GalaxyPhysicalProperties,
} from './galaxy-physical-properties';

import {
  GalaxyStructure,
} from './galaxy-structure';

describe(
  'GalaxyPhysicalProperties',
  () => {
    const structure =
      new GalaxyStructure(
        0.65,
        0.82,
        0.14,
        0.72,
        4,
      );

    it(
      'should preserve every physical property exactly',
      () => {
        const properties =
          new GalaxyPhysicalProperties(
            10.5,
            120000,
            8.5e11,
            180000000000n,
            1.15,
            2.75,
            structure,
          );

        expect(
          properties.ageBillionYears,
        ).toBe(10.5);

        expect(
          properties.diameterLightYears,
        ).toBe(120000);

        expect(
          properties.totalMassSolarMasses,
        ).toBe(8.5e11);

        expect(
          properties.stellarPopulation,
        ).toBe(
          180000000000n,
        );

        expect(
          properties.metallicitySolarRatio,
        ).toBe(1.15);

        expect(
          properties
            .starFormationRateSolarMassesPerYear,
        ).toBe(2.75);

        expect(
          properties.structure,
        ).toBe(
          structure,
        );
      },
    );

    it(
      'should allow zero metallicity and zero star formation rate',
      () => {
        const properties =
          new GalaxyPhysicalProperties(
            10,
            100000,
            1e11,
            100000000000n,
            0,
            0,
            structure,
          );

        expect(
          properties.metallicitySolarRatio,
        ).toBe(0);

        expect(
          properties
            .starFormationRateSolarMassesPerYear,
        ).toBe(0);
      },
    );

    it(
      'should reject non-finite numeric physical properties',
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
              new GalaxyPhysicalProperties(
                value,
                100000,
                1e11,
                100000000000n,
                1,
                1,
                structure,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyPhysicalProperties(
                10,
                value,
                1e11,
                100000000000n,
                1,
                1,
                structure,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyPhysicalProperties(
                10,
                100000,
                value,
                100000000000n,
                1,
                1,
                structure,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyPhysicalProperties(
                10,
                100000,
                1e11,
                100000000000n,
                value,
                1,
                structure,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new GalaxyPhysicalProperties(
                10,
                100000,
                1e11,
                100000000000n,
                1,
                value,
                structure,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject non-positive age diameter and total mass',
      () => {
        expect(
          () =>
            new GalaxyPhysicalProperties(
              0,
              100000,
              1e11,
              100000000000n,
              1,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              0,
              1e11,
              100000000000n,
              1,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              100000,
              0,
              100000000000n,
              1,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a non-positive stellar population',
      () => {
        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              100000,
              1e11,
              0n,
              1,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              100000,
              1e11,
              -1n,
              1,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a stellar population above signed Long.MAX_VALUE',
      () => {
        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              100000,
              1e11,
              9223372036854775808n,
              1,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject negative metallicity',
      () => {
        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              100000,
              1e11,
              100000000000n,
              -0.01,
              1,
              structure,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a negative star formation rate',
      () => {
        expect(
          () =>
            new GalaxyPhysicalProperties(
              10,
              100000,
              1e11,
              100000000000n,
              1,
              -0.01,
              structure,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);