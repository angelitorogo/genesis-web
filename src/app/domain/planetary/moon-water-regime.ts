/**
 * Point-21.5 water-expression regime for a relevant moon.
 *
 * V1 distinguishes inventory/phase opportunities only. It does not assert exact
 * ocean depth, salinity, chemistry or permanent surface coverage.
 */
export enum MoonWaterRegime {
  NONE = 'NONE',
  SURFACE_ICE = 'SURFACE_ICE',
  SUBSURFACE_OCEAN = 'SUBSURFACE_OCEAN',
  ICE_AND_SUBSURFACE_OCEAN = 'ICE_AND_SUBSURFACE_OCEAN',
  SURFACE_LIQUID = 'SURFACE_LIQUID',
  MIXED = 'MIXED',
}
