/**
 * GENESIS VISCATM.1c: all three visible layers share the same fine unit
 * sphere at close range. A 40x28 shell at >350 px projected diameter has
 * visibly faceted chords, regardless of atlas resolution.
 *
 * The high geometry is allocated once by SystemScene and only bound to one
 * close giant. Other planet/moon geometry and global LOD are unchanged.
 */
export const GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C = Object.freeze({
  widthSegments: 144,
  heightSegments: 104,
});

export function giantAtmosphereFineShellRequiredVISCATM1c(
  projectedDiameterPixels: number,
  alreadyFine: boolean,
): boolean {
  if (!Number.isFinite(projectedDiameterPixels) || projectedDiameterPixels < 0) return false;
  return projectedDiameterPixels >= (alreadyFine ? 160 : 220);
}
