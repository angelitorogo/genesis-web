/**
 * Point-17.7 coarse endpoint of the protoplanetary-formation phase.
 *
 * These regimes describe the formation blueprint handed to phase 18. They are
 * not final planet types, architectures or stability classes. Those contracts
 * belong to PlanetarySystemGenerator (phase 18) and PlanetGenerator (phase 19).
 */
export enum PlanetaryFormationMaturityRegime {
  NO_PLANET_FORMING_CORES =
    'NO_PLANET_FORMING_CORES',

  SOLID_CORE_SYSTEM =
    'SOLID_CORE_SYSTEM',

  VOLATILE_RICH_CORE_SYSTEM =
    'VOLATILE_RICH_CORE_SYSTEM',

  GAS_ENVELOPE_FAVORED =
    'GAS_ENVELOPE_FAVORED',

  DYNAMICALLY_REWORKED =
    'DYNAMICALLY_REWORKED',
}
