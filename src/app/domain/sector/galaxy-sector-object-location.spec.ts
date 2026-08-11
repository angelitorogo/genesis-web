import {
  GalaxySectorObjectLocation,
} from './galaxy-sector-object-location';

describe(
  'GalaxySectorObjectLocation',
  () => {
    const sectorCoordinates =
      Object.freeze({
        x:
          12,

        y:
          -34,
      });

    it(
      'should preserve sector coordinates and normalized local position',
      () => {
        const location =
          new GalaxySectorObjectLocation(
            sectorCoordinates,
            0.25,
            0.75,
          );

        expect(
          location.sectorCoordinates,
        ).toBe(
          sectorCoordinates,
        );

        expect(
          location.normalizedX,
        ).toBe(
          0.25,
        );

        expect(
          location.normalizedY,
        ).toBe(
          0.75,
        );
      },
    );

    it(
      'should accept the inclusive zero boundary',
      () => {
        expect(
          () =>
            new GalaxySectorObjectLocation(
              sectorCoordinates,
              0,
              0,
            ),
        ).not.toThrow();
      },
    );

    it(
      'should accept values immediately below the exclusive upper boundary',
      () => {
        const maximumUint32Normalized =
          4294967295 /
          4294967296;

        expect(
          () =>
            new GalaxySectorObjectLocation(
              sectorCoordinates,
              maximumUint32Normalized,
              maximumUint32Normalized,
            ),
        ).not.toThrow();
      },
    );

    it(
      'should reject invalid normalizedX values',
      () => {
        for (
          const invalid
          of [
            -Number.EPSILON,
            1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new GalaxySectorObjectLocation(
                sectorCoordinates,
                invalid,
                0.5,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject invalid normalizedY values',
      () => {
        for (
          const invalid
          of [
            -Number.EPSILON,
            1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
            Number.NEGATIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new GalaxySectorObjectLocation(
                sectorCoordinates,
                0.5,
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