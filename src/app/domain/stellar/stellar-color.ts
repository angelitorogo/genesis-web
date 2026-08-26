/**
 * Renderer-independent point-15.2 representative stellar color.
 *
 * Channels are 8-bit sRGB display values derived from effective temperature by
 * the simulation layer. They are deliberately a visual approximation, not a
 * calibrated photometric measurement and not an observed color index.
 *
 * Storing both channels and the canonical hexadecimal form keeps the value
 * structured-clone safe for later Worker use without coupling domain code to
 * Canvas, CSS or Three.js.
 */
export class StellarColor {

  readonly hex:
    string;

  constructor(
    readonly red:
      number,

    readonly green:
      number,

    readonly blue:
      number,
  ) {
    assertChannel(
      red,
      'red',
    );

    assertChannel(
      green,
      'green',
    );

    assertChannel(
      blue,
      'blue',
    );

    this.hex =
      `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }
}

function assertChannel(
  value:
    number,

  name:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <
      0 ||
    value >
      255
  ) {
    throw new RangeError(
      `${name} must be an integer in [0, 255]: ${value}.`,
    );
  }
}

function toHex(
  value:
    number,
): string {

  return value
    .toString(
      16,
    )
    .padStart(
      2,
      '0',
    )
    .toUpperCase();
}
