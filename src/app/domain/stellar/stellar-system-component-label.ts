export type StellarSystemComponentLabelName =
  | 'A'
  | 'B'
  | 'C';

/**
 * Stable component labels inside one stellar system.
 *
 * A is the frozen phase-15 canonical primary, B is the point-16.2 binary
 * companion and C is the point-16.3 tertiary companion. Codes 1/2 remain
 * unchanged when C is introduced so persisted/component-level identities can
 * grow without reinterpreting earlier systems.
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

  static readonly C =
    new StellarSystemComponentLabel(
      'C',
      3,
    );

  static readonly values:
    readonly StellarSystemComponentLabel[] =
      Object.freeze([
        StellarSystemComponentLabel.A,
        StellarSystemComponentLabel.B,
        StellarSystemComponentLabel.C,
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
