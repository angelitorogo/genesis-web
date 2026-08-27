export type StellarStabilityRegimeName =
  | 'UNSTABLE'
  | 'VARIABLE'
  | 'STABLE'
  | 'HIGHLY_STABLE';

/**
 * Point-15.5 coarse ordinary stellar surface/rotational stability regime.
 *
 * This is a generator-level stability proxy derived from rotation, magnetic
 * activity and evolutionary state. It is not hydrostatic stability, orbital
 * stability of planets, asteroseismic classification or a promise that the
 * star cannot vary. Those are separate scientific contracts.
 *
 * Numeric codes are stable V1 serialization values for Worker/structuredClone
 * rehydration.
 */
export class StellarStabilityRegime {

  static readonly UNSTABLE =
    new StellarStabilityRegime(
      'UNSTABLE',
      1,
    );

  static readonly VARIABLE =
    new StellarStabilityRegime(
      'VARIABLE',
      2,
    );

  static readonly STABLE =
    new StellarStabilityRegime(
      'STABLE',
      3,
    );

  static readonly HIGHLY_STABLE =
    new StellarStabilityRegime(
      'HIGHLY_STABLE',
      4,
    );

  static readonly values:
    readonly StellarStabilityRegime[] =
      Object.freeze([
        StellarStabilityRegime.UNSTABLE,
        StellarStabilityRegime.VARIABLE,
        StellarStabilityRegime.STABLE,
        StellarStabilityRegime.HIGHLY_STABLE,
      ]);

  private constructor(
    readonly name:
      StellarStabilityRegimeName,

    readonly code:
      number,
  ) {}

  static fromStabilityIndex(
    stabilityIndex:
      number,
  ): StellarStabilityRegime {

    if (
      !Number.isFinite(
        stabilityIndex,
      ) ||
      stabilityIndex <
        0 ||
      stabilityIndex >
        1
    ) {
      throw new RangeError(
        'stabilityIndex must be finite and in [0, 1].',
      );
    }

    if (
      stabilityIndex <
      0.25
    ) {
      return StellarStabilityRegime.UNSTABLE;
    }

    if (
      stabilityIndex <
      0.50
    ) {
      return StellarStabilityRegime.VARIABLE;
    }

    if (
      stabilityIndex <
      0.75
    ) {
      return StellarStabilityRegime.STABLE;
    }

    return StellarStabilityRegime.HIGHLY_STABLE;
  }

  static fromCodeOrNull(
    code:
      number,
  ): StellarStabilityRegime | null {

    return (
      StellarStabilityRegime.values
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
  ): StellarStabilityRegime {

    const value =
      StellarStabilityRegime
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
      null
    ) {
      throw new RangeError(
        `Unknown StellarStabilityRegime code: ${code}.`,
      );
    }

    return value;
  }
}
