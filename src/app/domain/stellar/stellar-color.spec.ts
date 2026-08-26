import {
  StellarColor,
} from './stellar-color';

describe(
  'StellarColor point 15.2',
  () => {
    it(
      'should preserve structured-clone-safe RGB channels and canonical hexadecimal color',
      () => {
        const color =
          new StellarColor(
            255,
            241,
            230,
          );

        expect(
          color.red,
        ).toBe(
          255,
        );

        expect(
          color.green,
        ).toBe(
          241,
        );

        expect(
          color.blue,
        ).toBe(
          230,
        );

        expect(
          color.hex,
        ).toBe(
          '#FFF1E6',
        );

        expect(
          structuredClone(
            color,
          ),
        ).toEqual({
          red:
            255,

          green:
            241,

          blue:
            230,

          hex:
            '#FFF1E6',
        });
      },
    );

    it(
      'should accept both exact 8-bit channel boundaries',
      () => {
        expect(
          new StellarColor(
            0,
            0,
            0,
          )
            .hex,
        ).toBe(
          '#000000',
        );

        expect(
          new StellarColor(
            255,
            255,
            255,
          )
            .hex,
        ).toBe(
          '#FFFFFF',
        );
      },
    );

    it(
      'should reject non-integer or out-of-range channels',
      () => {
        for (
          const invalid
          of [
            -1,
            256,
            1.5,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new StellarColor(
                invalid,
                0,
                0,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);
