export type StellarMainSequenceClassName =
  | 'O'
  | 'B'
  | 'A'
  | 'F'
  | 'G'
  | 'K'
  | 'M';

/**
 * Point-14.2 broad stellar family for a MAIN_SEQUENCE Star.
 *
 * GENESIS intentionally models the complete canonical O/B/A/F/G/K/M sequence
 * even though the roadmap calls out M/K/G/F/A explicitly: O and B are needed
 * to represent the high-mass end of the main sequence without creating an
 * artificial gap before the later giant/supergiant and remnant states.
 *
 * Important roadmap boundary:
 * - this is a broad main-sequence family, not the final spectral type;
 * - point 15.1 will generate mass/radius/luminosity/temperature;
 * - point 15.2 will derive the detailed spectral type/subclass and color;
 * - no physical threshold is encoded here yet.
 *
 * Codes are stable V1 serialization values ordered from the hottest broad
 * main-sequence family (O) to the coolest (M). Consumers must compare name/code
 * rather than relying on singleton identity across structuredClone boundaries.
 */
export class StellarMainSequenceClass {

  static readonly O =
    new StellarMainSequenceClass(
      'O',
      1,
    );

  static readonly B =
    new StellarMainSequenceClass(
      'B',
      2,
    );

  static readonly A =
    new StellarMainSequenceClass(
      'A',
      3,
    );

  static readonly F =
    new StellarMainSequenceClass(
      'F',
      4,
    );

  static readonly G =
    new StellarMainSequenceClass(
      'G',
      5,
    );

  static readonly K =
    new StellarMainSequenceClass(
      'K',
      6,
    );

  static readonly M =
    new StellarMainSequenceClass(
      'M',
      7,
    );

  static readonly values:
    readonly StellarMainSequenceClass[] =
      Object.freeze([
        StellarMainSequenceClass.O,
        StellarMainSequenceClass.B,
        StellarMainSequenceClass.A,
        StellarMainSequenceClass.F,
        StellarMainSequenceClass.G,
        StellarMainSequenceClass.K,
        StellarMainSequenceClass.M,
      ]);

  private constructor(
    readonly name:
      StellarMainSequenceClassName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarMainSequenceClass | null {

    return (
      StellarMainSequenceClass.values
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
  ): StellarMainSequenceClass {

    const value =
      StellarMainSequenceClass
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarMainSequenceClass code: ${code}.`,
      );
    }

    return value;
  }
}
