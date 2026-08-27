export type StellarRotationRegimeName =
  | 'VERY_FAST'
  | 'FAST'
  | 'MODERATE'
  | 'SLOW'
  | 'VERY_SLOW';

/**
 * Point-15.5 coarse surface-rotation regime for the ordinary stellar model.
 *
 * The regime is derived only from a positive rotation period expressed in
 * Earth days. It is intentionally an absolute descriptive vocabulary rather
 * than a spectral-family-specific judgement: consumers that need the exact
 * physics should use rotationPeriodDays from StellarRotationStabilityProfile.
 *
 * Compact remnants are outside this ordinary surface-rotation contract because
 * white-dwarf/neutron-star rotation and black-hole spin require specialized
 * current-radius/spin physics not yet represented by the point-15.1 reference
 * physical baseline.
 *
 * Numeric codes are stable V1 serialization values for Worker/structuredClone
 * rehydration.
 */
export class StellarRotationRegime {

  static readonly VERY_FAST =
    new StellarRotationRegime(
      'VERY_FAST',
      1,
    );

  static readonly FAST =
    new StellarRotationRegime(
      'FAST',
      2,
    );

  static readonly MODERATE =
    new StellarRotationRegime(
      'MODERATE',
      3,
    );

  static readonly SLOW =
    new StellarRotationRegime(
      'SLOW',
      4,
    );

  static readonly VERY_SLOW =
    new StellarRotationRegime(
      'VERY_SLOW',
      5,
    );

  static readonly values:
    readonly StellarRotationRegime[] =
      Object.freeze([
        StellarRotationRegime.VERY_FAST,
        StellarRotationRegime.FAST,
        StellarRotationRegime.MODERATE,
        StellarRotationRegime.SLOW,
        StellarRotationRegime.VERY_SLOW,
      ]);

  private constructor(
    readonly name:
      StellarRotationRegimeName,

    readonly code:
      number,
  ) {}

  static fromRotationPeriodDays(
    rotationPeriodDays:
      number,
  ): StellarRotationRegime {

    if (
      !Number.isFinite(
        rotationPeriodDays,
      ) ||
      rotationPeriodDays <=
        0
    ) {
      throw new RangeError(
        'rotationPeriodDays must be finite and greater than 0.',
      );
    }

    if (
      rotationPeriodDays <
      0.5
    ) {
      return StellarRotationRegime.VERY_FAST;
    }

    if (
      rotationPeriodDays <
      3.0
    ) {
      return StellarRotationRegime.FAST;
    }

    if (
      rotationPeriodDays <
      15.0
    ) {
      return StellarRotationRegime.MODERATE;
    }

    if (
      rotationPeriodDays <
      60.0
    ) {
      return StellarRotationRegime.SLOW;
    }

    return StellarRotationRegime.VERY_SLOW;
  }

  static fromCodeOrNull(
    code:
      number,
  ): StellarRotationRegime | null {

    return (
      StellarRotationRegime.values
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
  ): StellarRotationRegime {

    const value =
      StellarRotationRegime
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
      null
    ) {
      throw new RangeError(
        `Unknown StellarRotationRegime code: ${code}.`,
      );
    }

    return value;
  }
}
