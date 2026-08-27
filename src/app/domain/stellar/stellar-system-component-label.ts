export type StellarSystemComponentLabelName =
  | 'A'
  | 'B';

/**
 * Stable component labels inside one stellar system.
 *
 * Point 16.2 introduces A/B only. A is the already-frozen phase-15 canonical
 * primary. B identifies the deterministic binary companion derived inside the
 * same SystemLocator/SystemSeed. A later point 16.3 may extend this vocabulary
 * with C without changing the existing A/B codes.
 */
export class StellarSystemComponentLabel {

  static readonly A =
    new StellarSystemComponentLabel(
      'A',
      1,
    );

  static readonly B =
    new StellarSystemComponentLabel(
      'B',
      2,
    );

  static readonly values:
    readonly StellarSystemComponentLabel[] =
      Object.freeze([
        StellarSystemComponentLabel.A,
        StellarSystemComponentLabel.B,
      ]);

  private constructor(
    readonly name:
      StellarSystemComponentLabelName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarSystemComponentLabel | null {

    return (
      StellarSystemComponentLabel.values
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
  ): StellarSystemComponentLabel {

    const value =
      StellarSystemComponentLabel
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarSystemComponentLabel code: ${code}.`,
      );
    }

    return value;
  }
}
