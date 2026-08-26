export type StellarWhiteDwarfCompositionName =
  | 'HELIUM_CORE'
  | 'CARBON_OXYGEN_CORE'
  | 'OXYGEN_NEON_CORE';

/**
 * Point-14.5 coarse internal composition family for a WHITE_DWARF remnant.
 *
 * This is intentionally NOT the detailed white-dwarf spectral/atmospheric
 * classification (DA/DB/DC/DQ/DZ...), which remains part of the later
 * point-15.2 spectral-classification contract. Point 14.5 only records the
 * broad remnant-core family needed by the stellar-evolution domain.
 *
 * Important roadmap boundaries:
 * - no mass or Chandrasekhar threshold is encoded here (14.8-14.9 / 15.1);
 * - no temperature, luminosity, radius or cooling age is encoded here;
 * - no atmospheric hydrogen/helium abundance or spectral subtype is encoded;
 * - no progenitor transition is inferred here (14.8-14.9).
 *
 * HELIUM_CORE is retained as a domain family for later binary-evolution work;
 * point 14.5 does not claim that every family is reachable through the same
 * isolated-star evolutionary path.
 *
 * Codes are stable V1 serialization values. Consumers must compare name/code
 * rather than relying on singleton identity across structuredClone boundaries.
 */
export class StellarWhiteDwarfComposition {

  static readonly HELIUM_CORE =
    new StellarWhiteDwarfComposition(
      'HELIUM_CORE',
      1,
    );

  static readonly CARBON_OXYGEN_CORE =
    new StellarWhiteDwarfComposition(
      'CARBON_OXYGEN_CORE',
      2,
    );

  static readonly OXYGEN_NEON_CORE =
    new StellarWhiteDwarfComposition(
      'OXYGEN_NEON_CORE',
      3,
    );

  static readonly values:
    readonly StellarWhiteDwarfComposition[] =
      Object.freeze([
        StellarWhiteDwarfComposition.HELIUM_CORE,
        StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE,
        StellarWhiteDwarfComposition.OXYGEN_NEON_CORE,
      ]);

  private constructor(
    readonly name:
      StellarWhiteDwarfCompositionName,

    readonly code:
      number,
  ) {}

  static fromCodeOrNull(
    code:
      number,
  ): StellarWhiteDwarfComposition | null {

    return (
      StellarWhiteDwarfComposition.values
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
  ): StellarWhiteDwarfComposition {

    const value =
      StellarWhiteDwarfComposition
        .fromCodeOrNull(
          code,
        );

    if (
      value ===
        null
    ) {
      throw new RangeError(
        `Unknown StellarWhiteDwarfComposition code: ${code}.`,
      );
    }

    return value;
  }
}
