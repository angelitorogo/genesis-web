export type StellarSystemMultiplicityName =
  | 'SINGLE'
  | 'BINARY';

/**
 * Canonical stellar-component multiplicity of a stellar system.
 *
 * Point 16.1 established SINGLE. Point 16.2 adds BINARY while preserving the
 * stable SINGLE code. TRIPLE remains point 16.3 and is intentionally absent.
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

  static readonly BINARY =
    new StellarSystemMultiplicity(
      'BINARY',
      2,
      2,
    );

  static readonly values:
    readonly StellarSystemMultiplicity[] =
      Object.freeze([
        StellarSystemMultiplicity.SINGLE,
        StellarSystemMultiplicity.BINARY,
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
