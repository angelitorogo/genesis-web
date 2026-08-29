/**
 * Point-19.4 coarse physical planet families.
 *
 * These are generation-time physical phenotypes, not player knowledge states
 * and not complete climate/geology claims. In particular OCEAN, DESERT and
 * VOLCANIC remain coarse type labels whose detailed surface, water, atmosphere
 * and geological realization belongs to later roadmap phases.
 */
export enum PlanetType {
  ROCKY =
    'ROCKY',

  SUPER_EARTH =
    'SUPER_EARTH',

  DESERT =
    'DESERT',

  OCEAN =
    'OCEAN',

  ICE =
    'ICE',

  VOLCANIC =
    'VOLCANIC',

  MINI_NEPTUNE =
    'MINI_NEPTUNE',

  GAS_GIANT =
    'GAS_GIANT',

  ICE_GIANT =
    'ICE_GIANT',
}
