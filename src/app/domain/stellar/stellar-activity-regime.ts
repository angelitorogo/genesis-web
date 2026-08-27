export type StellarActivityRegimeName =
  | 'QUIESCENT'
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'EXTREME';

/**
 * Point-15.4 coarse ordinary stellar magnetic-activity regime.
 *
 * This value object classifies the dimensionless V1 activity index. It does
 * not encode rotation period, magnetic-field strength, pulsar/magnetar state,
 * accretion or an event timeline; those remain separate later contracts.
 *
 * Numeric codes are stable V1 serialization values so Worker/structuredClone
 * consumers can rehydrate by code/name instead of singleton identity.
 */
export class StellarActivityRegime {

  static readonly QUIESCENT =
    new StellarActivityRegime(
      'QUIESCENT',
      1,
    );

  static readonly LOW =
    new StellarActivityRegime(
      'LOW',
      2,
    );

  static readonly MODERATE =
    new StellarActivityRegime(
      'MODERATE',
      3,
    );

  static readonly HIGH =
    new StellarActivityRegime(
      'HIGH',
      4,
    );

  static readonly EXTREME =
    new StellarActivityRegime(
      'EXTREME',
      5,
    );

  static readonly values:
    readonly StellarActivityRegime[] =
      Object.freeze([
        StellarActivityRegime.QUIESCENT,
        StellarActivityRegime.LOW,
        StellarActivityRegime.MODERATE,
        StellarActivityRegime.HIGH,
        StellarActivityRegime.EXTREME,
      ]);

  private constructor(
    readonly name:
      StellarActivityRegimeName,

    readonly code:
      number,
  ) {}

  static fromActivityIndex(
    activityIndex:
      number,
  ): StellarActivityRegime {

    if (
      !Number.isFinite(
        activityIndex,
      ) ||
      activityIndex <
        0 ||
      activityIndex >
        1
    ) {
      throw new RangeError(
        'activityIndex must be finite and in [0, 1].',
      );
    }

    if (
      activityIndex <
      0.08
    ) {
      return StellarActivityRegime.QUIESCENT;
    }

    if (
      activityIndex <
      0.25
    ) {
      return StellarActivityRegime.LOW;
    }

    if (
      activityIndex <
      0.50
    ) {
      return StellarActivityRegime.MODERATE;
    }

    if (
      activityIndex <
      0.75
    ) {
      return StellarActivityRegime.HIGH;
    }

    return StellarActivityRegime.EXTREME;
  }

  static fromCodeOrNull(
    code:
      number,
  ): StellarActivityRegime | null {

    return (
      StellarActivityRegime.values
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
  ): StellarActivityRegime {

    const value =
      StellarActivityRegime
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
      null
    ) {
      throw new RangeError(
        `Unknown StellarActivityRegime code: ${code}.`,
      );
    }

    return value;
  }
}
