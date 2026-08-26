export type StellarBrownDwarfClassName =
  | 'L'
  | 'T'
  | 'Y';

/**
 * Point-14.3 broad atmospheric family for a BROWN_DWARF Star.
 *
 * L/T/Y are deliberately modeled here only as the canonical broad families
 * needed to distinguish progressively cooler brown-dwarf regimes. Within the
 * BROWN_DWARF evolutionary branch, an L value always means a substellar L
 * dwarf; GENESIS does not use this type to classify very-low-mass hydrogen-
 * burning stars.
 *
 * Important roadmap boundary:
 * - this is not a detailed spectral subtype such as L4/T7/Y1;
 * - point 15.1 will generate mass/radius/luminosity/temperature;
 * - point 15.2 will derive the detailed spectral type and color;
 * - deuterium/lithium burning and age-dependent cooling are not inferred here;
 * - transition/physical plausibility rules remain points 14.8-14.9.
 *
 * Codes are stable V1 serialization values ordered from the warmer L family
 * to the colder Y family. Consumers must compare name/code rather than relying
 * on singleton identity across structuredClone boundaries.
 */
export class StellarBrownDwarfClass {

  static readonly L =
    new StellarBrownDwarfClass(
      'L',
      1,
    );

  static readonly T =
    new StellarBrownDwarfClass(
      'T',
      2,
    );

  static readonly Y =
    new StellarBrownDwarfClass(
      'Y',
      3,
    );

  static readonly values:
    readonly StellarBrownDwarfClass[] =
      Object.freeze([
        StellarBrownDwarfClass.L,
        StellarBrownDwarfClass.T,
        StellarBrownDwarfClass.Y,
      ]);

  private constructor(
    readonly name:
      StellarBrownDwarfClassName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarBrownDwarfClass | null {

    return (
      StellarBrownDwarfClass.values
        .find(
          value =>
            value.code ===
            code,
        ) ??
      null
    );
  }

  static fromCode(
    code:
      number,
  ): StellarBrownDwarfClass {

    const value =
      StellarBrownDwarfClass
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarBrownDwarfClass code: ${code}.`,
      );
    }

    return value;
  }
}
