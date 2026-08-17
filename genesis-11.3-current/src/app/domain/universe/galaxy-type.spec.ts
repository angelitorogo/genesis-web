import {
  GalaxyType,
} from './galaxy-type';

describe(
  'GalaxyType',
  () => {
    it(
      'should preserve the exact Android GalaxyType codes',
      () => {
        expect(
          GalaxyType.SPIRAL.code,
        ).toBe(1);

        expect(
          GalaxyType.BARRED_SPIRAL.code,
        ).toBe(2);

        expect(
          GalaxyType.ELLIPTICAL.code,
        ).toBe(3);

        expect(
          GalaxyType.IRREGULAR.code,
        ).toBe(4);

        expect(
          GalaxyType.DWARF.code,
        ).toBe(5);
      },
    );

    it(
      'should expose exactly the five official galaxy types',
      () => {
        expect(
          GalaxyType.values
            .map(
              (
                value,
              ) =>
                value.name,
            ),
        ).toEqual([
          'SPIRAL',
          'BARRED_SPIRAL',
          'ELLIPTICAL',
          'IRREGULAR',
          'DWARF',
        ]);

        expect(
          GalaxyType.values,
        ).toHaveLength(5);
      },
    );

    it(
      'should resolve every valid code to its canonical singleton',
      () => {
        expect(
          GalaxyType
            .fromCode(
              1,
            ),
        ).toBe(
          GalaxyType.SPIRAL,
        );

        expect(
          GalaxyType
            .fromCode(
              2,
            ),
        ).toBe(
          GalaxyType.BARRED_SPIRAL,
        );

        expect(
          GalaxyType
            .fromCode(
              3,
            ),
        ).toBe(
          GalaxyType.ELLIPTICAL,
        );

        expect(
          GalaxyType
            .fromCode(
              4,
            ),
        ).toBe(
          GalaxyType.IRREGULAR,
        );

        expect(
          GalaxyType
            .fromCode(
              5,
            ),
        ).toBe(
          GalaxyType.DWARF,
        );
      },
    );

    it(
      'should reject unknown galaxy type codes',
      () => {
        expect(
          GalaxyType
            .fromCodeOrNull(
              0,
            ),
        ).toBeNull();

        expect(
          GalaxyType
            .fromCodeOrNull(
              6,
            ),
        ).toBeNull();

        expect(
          () =>
            GalaxyType
              .fromCode(
                0,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            GalaxyType
              .fromCode(
                6,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);