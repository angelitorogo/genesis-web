import {
  type GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

describe(
  'GalaxySectorCoordinates',
  () => {
    it(
      'should represent the central sector as coordinate zero zero',
      () => {
        const coordinates:
          GalaxySectorCoordinates = {
            x:
              0,

            y:
              0,
          };

        expect(
          coordinates,
        ).toEqual({
          x:
            0,

          y:
            0,
        });
      },
    );

    it(
      'should preserve arbitrary signed Int32 grid coordinates',
      () => {
        const minimum:
          GalaxySectorCoordinates = {
            x:
              -2147483648,

            y:
              -2147483648,
          };

        const maximum:
          GalaxySectorCoordinates = {
            x:
              2147483647,

            y:
              2147483647,
          };

        expect(
          minimum.x,
        ).toBe(
          -2147483648,
        );

        expect(
          minimum.y,
        ).toBe(
          -2147483648,
        );

        expect(
          maximum.x,
        ).toBe(
          2147483647,
        );

        expect(
          maximum.y,
        ).toBe(
          2147483647,
        );
      },
    );
  },
);