import {
  GiantMoonOrbitalFamily,
  giantMoonOrbitalFamilyV1,
} from './giant-moon-orbital-family';

describe(
  'GiantMoonOrbitalFamily point 21.7',
  () => {
    it(
      'should classify only giant-host relevant moons into regular radial families',
      () => {
        expect(
          giantMoonOrbitalFamilyV1(
            false,
            8,
          ),
        ).toBe(
          GiantMoonOrbitalFamily.NOT_APPLICABLE,
        );

        expect(
          giantMoonOrbitalFamilyV1(
            true,
            8,
          ),
        ).toBe(
          GiantMoonOrbitalFamily.INNER_REGULAR,
        );

        expect(
          giantMoonOrbitalFamilyV1(
            true,
            20,
          ),
        ).toBe(
          GiantMoonOrbitalFamily.MAJOR_REGULAR,
        );

        expect(
          giantMoonOrbitalFamilyV1(
            true,
            45,
          ),
        ).toBe(
          GiantMoonOrbitalFamily.OUTER_REGULAR,
        );
      },
    );

    it(
      'should reject invalid orbital radii',
      () => {
        for (
          const value of [
            0,
            -1,
            Number.NaN,
          ]
        ) {
          expect(
            () =>
              giantMoonOrbitalFamilyV1(
                true,
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
