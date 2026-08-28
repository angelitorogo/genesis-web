/**
 * Point-18.2 coarse mature-system architecture.
 *
 * These regimes describe only how many mature planet slots survive and how
 * their inherited formation radii are distributed. They are not planet types,
 * orbital-element/stability classes or habitability labels.
 */
export enum PlanetarySystemArchitectureRegime {
  EMPTY =
    'EMPTY',

  DYNAMICALLY_EXCLUDED =
    'DYNAMICALLY_EXCLUDED',

  SINGLE_PLANET =
    'SINGLE_PLANET',

  COMPACT_MULTIPLANET =
    'COMPACT_MULTIPLANET',

  DISTRIBUTED_MULTIPLANET =
    'DISTRIBUTED_MULTIPLANET',

  MULTI_ZONE_MULTIPLANET =
    'MULTI_ZONE_MULTIPLANET',
}
