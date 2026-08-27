export type StellarSystemMultiplicityName =
  | 'SINGLE';

/**
 * Canonical stellar-component multiplicity of a stellar system.
 *
 * Point 16.1 intentionally introduces only SINGLE. BINARY and TRIPLE are
 * roadmap points 16.2 and 16.3 and are not pre-generated here.
 *
 * Numeric codes form a stable V1 serialization boundary so later persistence,
 * Worker and UI layers do not depend on singleton object identity.
 */
export class StellarSystemMultiplicity {

  static readonly SINGLE =
    new StellarSystemMultiplicity(
      'SINGLE',
      1,
      1,
    );

  static readonly values:
    readonly StellarSystemMultiplicity[] =
      Object.freeze([
        StellarSystemMultiplicity.SINGLE,
      ]);

  private constructor(
    readonly name:
      StellarSystemMultiplicityName,

    readonly code:
      number,

    readonly stellarComponentCount:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarSystemMultiplicity | null {

    return (
      StellarSystemMultiplicity.values
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
  ): StellarSystemMultiplicity {

    const value =
      StellarSystemMultiplicity
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarSystemMultiplicity code: ${code}.`,
      );
    }

    return value;
  }
}
