import {
  GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

const LONG_MIN =
  -(1n << 63n);

const LONG_MAX =
  (1n << 63n) - 1n;

export const GalaxySectorKeyCodec =
  Object.freeze({
    encode(
      coordinates:
        GalaxySectorCoordinates,
    ): bigint {
      const x =
        BigInt(
          coordinates.x,
        );

      const y =
        BigInt.asUintN(
          32,
          BigInt(
            coordinates.y,
          ),
        );

      return BigInt.asIntN(
        64,
        (x << 32n) |
          y,
      );
    },

    decode(
      sectorKey:
        bigint,
    ): GalaxySectorCoordinates {
      requireLong(
        sectorKey,
      );

      return new GalaxySectorCoordinates(
        Number(
          BigInt.asIntN(
            32,
            sectorKey >>
              32n,
          ),
        ),

        Number(
          BigInt.asIntN(
            32,
            sectorKey,
          ),
        ),
      );
    },
  });

function requireLong(
  value: bigint,
): void {
  if (
    typeof value !==
      'bigint' ||
    value < LONG_MIN ||
    value > LONG_MAX
  ) {
    throw new RangeError(
      'sectorKey debe pertenecer al rango Long de 64 bits.',
    );
  }
}