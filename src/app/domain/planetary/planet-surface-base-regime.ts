/**
 * Point-19.6 coarse surface/envelope expression regimes.
 *
 * These values describe only the baseline physical surface presented by the
 * phase-19 planet model. They are not atmosphere, climate, hydrology or detailed
 * geology states. In particular VOLATILE_RICH_SOLID does not assert liquid
 * oceans and THERMALLY_REWORKED_MINERAL does not replace the later geology model.
 */
export enum PlanetSurfaceBaseRegime {
  MINERAL_REGOLITH =
    'MINERAL_REGOLITH',

  MASSIVE_MINERAL_REGOLITH =
    'MASSIVE_MINERAL_REGOLITH',

  ARID_MINERAL =
    'ARID_MINERAL',

  VOLATILE_RICH_SOLID =
    'VOLATILE_RICH_SOLID',

  FROZEN_VOLATILE =
    'FROZEN_VOLATILE',

  THERMALLY_REWORKED_MINERAL =
    'THERMALLY_REWORKED_MINERAL',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',

  ICE_RICH_DEEP_ENVELOPE =
    'ICE_RICH_DEEP_ENVELOPE',
}
