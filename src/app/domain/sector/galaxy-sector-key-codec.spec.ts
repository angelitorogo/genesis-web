import {
  GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from './galaxy-sector-key-codec';

describe(
  'GalaxySectorKeyCodec',
  () => {
    const officialVectors =
      [
        {
          x: 0,
          y: 0,
          key: 0n,
        },
        {
          x: 0,
          y: 1,
          key: 1n,
        },
        {
          x: 1,
          y: 0,
          key:
            4294967296n,
        },
        {
          x: -1,
          y: 0,
          key:
            -4294967296n,
        },
        {
          x: 0,
          y: -1,
          key:
            4294967295n,
        },
        {
          x: -1,
          y: -1,
          key: -1n,
        },
      ] as const;

    it(
      'should encode the official Android vectors exactly',
      () => {
        for (
          const vector
          of officialVectors
        ) {
          expect(
            GalaxySectorKeyCodec
              .encode(
                new GalaxySectorCoordinates(
                  vector.x,
                  vector.y,
                ),
              ),
          ).toBe(
            vector.key,
          );
        }
      },
    );

    it(
      'should decode the official Android vectors exactly',
      () => {
        for (
          const vector
          of officialVectors
        ) {
          expect(
            GalaxySectorKeyCodec
              .decode(
                vector.key,
              ),
          ).toEqual(
            new GalaxySectorCoordinates(
              vector.x,
              vector.y,
            ),
          );
        }
      },
    );

    it(
      'should round-trip signed Int32 coordinate extremes',
      () => {
        const vectors = [
          new GalaxySectorCoordinates(
            -2147483648,
            -2147483648,
          ),

          new GalaxySectorCoordinates(
            2147483647,
            2147483647,
          ),

          new GalaxySectorCoordinates(
            -2147483648,
            2147483647,
          ),

          new GalaxySectorCoordinates(
            2147483647,
            -2147483648,
          ),
        ];

        for (
          const coordinates
          of vectors
        ) {
          const encoded =
            GalaxySectorKeyCodec
              .encode(
                coordinates,
              );

          expect(
            GalaxySectorKeyCodec
              .decode(
                encoded,
              ),
          ).toEqual(
            coordinates,
          );
        }
      },
    );

    it(
      'should preserve the frozen 12,-34 vector',
      () => {
        const coordinates =
          new GalaxySectorCoordinates(
            12,
            -34,
          );

        expect(
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            ),
        ).toBe(
          55834574814n,
        );

        expect(
          GalaxySectorKeyCodec
            .decode(
              55834574814n,
            ),
        ).toEqual(
          coordinates,
        );
      },
    );

    it(
      'should preserve exact Int32 boundary keys',
      () => {
        expect(
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                2147483647,
                2147483647,
              ),
            ),
        ).toBe(
          9223372034707292159n,
        );

        expect(
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                -2147483648,
                -2147483648,
              ),
            ),
        ).toBe(
          -9223372034707292160n,
        );
      },
    );

    it(
      'should reject x outside the signed Int32 range',
      () => {
        expect(
          () =>
            new GalaxySectorCoordinates(
              2147483648,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorCoordinates(
              -2147483649,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject y outside the signed Int32 range',
      () => {
        expect(
          () =>
            new GalaxySectorCoordinates(
              0,
              2147483648,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxySectorCoordinates(
              0,
              -2147483649,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject sector keys outside the signed Long range',
      () => {
        expect(
          () =>
            GalaxySectorKeyCodec
              .decode(
                1n << 63n,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            GalaxySectorKeyCodec
              .decode(
                -(1n << 63n) -
                  1n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);