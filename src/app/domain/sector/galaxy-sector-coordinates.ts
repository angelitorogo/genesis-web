const INT32_MIN =
  -2_147_483_648;

const INT32_MAX =
  2_147_483_647;

export class GalaxySectorCoordinates {
  constructor(
    readonly x:
      number,

    readonly y:
      number,
  ) {
    requireInt32(
      x,
      'x',
    );

    requireInt32(
      y,
      'y',
    );
  }
}

function requireInt32(
  value: number,
  name: string,
): void {
  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      INT32_MIN ||
    value >
      INT32_MAX
  ) {
    throw new RangeError(
      `${name} debe pertenecer al rango Int32.`,
    );
  }
}