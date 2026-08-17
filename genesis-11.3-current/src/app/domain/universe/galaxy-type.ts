export type GalaxyTypeName =
  | 'SPIRAL'
  | 'BARRED_SPIRAL'
  | 'ELLIPTICAL'
  | 'IRREGULAR'
  | 'DWARF';

/**
 * Canonical morphological type of a galaxy.
 *
 * Codes are part of the cross-platform GENESIS domain contract and match
 * the Android implementation exactly.
 */
export class GalaxyType {

  static readonly SPIRAL =
    new GalaxyType(
      'SPIRAL',
      1,
    );

  static readonly BARRED_SPIRAL =
    new GalaxyType(
      'BARRED_SPIRAL',
      2,
    );

  static readonly ELLIPTICAL =
    new GalaxyType(
      'ELLIPTICAL',
      3,
    );

  static readonly IRREGULAR =
    new GalaxyType(
      'IRREGULAR',
      4,
    );

  static readonly DWARF =
    new GalaxyType(
      'DWARF',
      5,
    );

  static readonly values:
    readonly GalaxyType[] =
      Object.freeze([
        GalaxyType.SPIRAL,
        GalaxyType.BARRED_SPIRAL,
        GalaxyType.ELLIPTICAL,
        GalaxyType.IRREGULAR,
        GalaxyType.DWARF,
      ]);

  private constructor(
    readonly name:
      GalaxyTypeName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): GalaxyType | null {

    return (
      GalaxyType.values
        .find(
          (
            value,
          ) =>
            value.code ===
            code,
        ) ??
      null
    );
  }

  static fromCode(
    code:
      number,
  ): GalaxyType {

    const value =
      GalaxyType
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
      null
    ) {
      throw new RangeError(
        `Unknown GalaxyType code: ${code}.`,
      );
    }

    return value;
  }
}