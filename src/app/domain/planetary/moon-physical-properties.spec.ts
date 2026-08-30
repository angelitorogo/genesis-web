import {
  MoonPhysicalProperties,
} from './moon-physical-properties';

describe(
  'MoonPhysicalProperties point 21.3',
  () => {
    it(
      'should preserve one finite positive bulk state without later moon properties',
      () => {
        const physical =
          new MoonPhysicalProperties(
            2,
            1,
            0.0123,
            0.2727,
            3.34,
            0.165,
          );

        expect(
          physical.hostPlanetOrdinal,
        ).toBe(2);

        expect(
          physical.moonOrdinal,
        ).toBe(1);

        expect(
          physical.massEarth,
        ).toBe(0.0123);

        for (
          const laterProperty
          of [
            'tidalState',
            'atmosphere',
            'waterInventory',
            'geology',
            'habitability',
            'designation',
            'seed',
          ]
        ) {
          expect(
            laterProperty in
              physical,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject malformed ordinals and non-positive/non-finite bulk values',
      () => {
        const valid = [
          1,
          1,
          0.01,
          0.2,
          3,
          0.2,
        ] as const;

        expect(
          () =>
            new MoonPhysicalProperties(
              ...valid,
            ),
        ).not.toThrow();

        for (
          const invalid
          of [
            [
              0,
              1,
              0.01,
              0.2,
              3,
              0.2,
            ],
            [
              1,
              0,
              0.01,
              0.2,
              3,
              0.2,
            ],
            [
              1,
              1,
              0,
              0.2,
              3,
              0.2,
            ],
            [
              1,
              1,
              0.01,
              Number.NaN,
              3,
              0.2,
            ],
            [
              1,
              1,
              0.01,
              0.2,
              -1,
              0.2,
            ],
            [
              1,
              1,
              0.01,
              0.2,
              3,
              0,
            ],
          ]
        ) {
          expect(
            () =>
              new MoonPhysicalProperties(
                invalid[0],
                invalid[1],
                invalid[2],
                invalid[3],
                invalid[4],
                invalid[5],
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
