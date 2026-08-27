export type StellarSystemMultiplicityName =
  | 'SINGLE'
  | 'BINARY'
  | 'TRIPLE';

/**
 * Canonical stellar-component multiplicity of a stellar system.
 *
 * Point 16.1 established SINGLE, point 16.2 added BINARY and point 16.3 adds
 * the deliberately rare TRIPLE architecture. Stable numeric codes are a V1
 * serialization boundary and therefore the existing SINGLE/BINARY codes do
 * not change when TRIPLE is introduced.
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

  static readonly TRIPLE =
    new StellarSystemMultiplicity(
      'TRIPLE',
      3,
      3,
    );

  static readonly values:
    readonly StellarSystemMultiplicity[] =
      Object.freeze([
        StellarSystemMultiplicity.SINGLE,
        StellarSystemMultiplicity.BINARY,
        StellarSystemMultiplicity.TRIPLE,
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
