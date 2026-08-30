/**
 * Point-19.8 basic rarity traits derived from already-generated planet physics.
 *
 * These are Ground-Truth physical diagnostics, not discovery/knowledge states
 * and not rewards. They intentionally stay within information available by the
 * end of phase 19: no atmosphere, biosphere, moons, detailed geology or later
 * historical events are inferred here.
 */
export enum PlanetRarityTrait {
  PUFFY_LOW_DENSITY =
    'PUFFY_LOW_DENSITY',

  ULTRA_DENSE =
    'ULTRA_DENSE',

  EXTREME_SURFACE_GRAVITY =
    'EXTREME_SURFACE_GRAVITY',

  RAPID_ROTATOR =
    'RAPID_ROTATOR',

  EXTREME_OBLIQUITY =
    'EXTREME_OBLIQUITY',

  STRONGLY_RETROGRADE_ROTATION =
    'STRONGLY_RETROGRADE_ROTATION',

  HIGH_ORBITAL_ECCENTRICITY =
    'HIGH_ORBITAL_ECCENTRICITY',

  EXTREME_IRRADIATION =
    'EXTREME_IRRADIATION',

  EXTREME_TIDAL_HEATING =
    'EXTREME_TIDAL_HEATING',

  MASSIVE_SOLID_WORLD =
    'MASSIVE_SOLID_WORLD',

  METAL_RICH_INTERIOR =
    'METAL_RICH_INTERIOR',

  VOLATILE_RICH_INTERIOR =
    'VOLATILE_RICH_INTERIOR',

  EXTREME_BASE_ALBEDO =
    'EXTREME_BASE_ALBEDO',
}
