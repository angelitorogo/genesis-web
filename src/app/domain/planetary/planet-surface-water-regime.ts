/**
 * Point-20.7 morphology of ordinary liquid water over a solid planetary surface.
 *
 * Coverage is deliberately coarse: LOCAL_LIQUID means sub-sea-scale liquid
 * coverage without asserting lakes/rivers, while SEAS/OCEANS/GLOBAL_OCEAN are
 * progressively larger surface-coverage classes. Deep-envelope planets have no
 * modeled solid surface and therefore use DEEP_ENVELOPE instead of a coverage.
 */
export enum PlanetSurfaceWaterRegime {
  NONE =
    'NONE',

  LOCAL_LIQUID =
    'LOCAL_LIQUID',

  SEAS =
    'SEAS',

  OCEANS =
    'OCEANS',

  GLOBAL_OCEAN =
    'GLOBAL_OCEAN',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export function planetSurfaceWaterRegimeForCoverage01(
  liquidWaterSurfaceCoverageFraction01:
    number | null,

  isDeepEnvelope:
    boolean,
): PlanetSurfaceWaterRegime {

  if (
    isDeepEnvelope
  ) {
    if (
      liquidWaterSurfaceCoverageFraction01 !==
      null
    ) {
      throw new RangeError(
        'Deep-envelope surface-water classification requires null liquid-water coverage.',
      );
    }

    return PlanetSurfaceWaterRegime.DEEP_ENVELOPE;
  }

  if (
    liquidWaterSurfaceCoverageFraction01 ===
      null ||
    !Number.isFinite(
      liquidWaterSurfaceCoverageFraction01,
    ) ||
    liquidWaterSurfaceCoverageFraction01 <
      0 ||
    liquidWaterSurfaceCoverageFraction01 >
      1
  ) {
    throw new RangeError(
      'Solid-surface liquid-water coverage must be finite and in [0, 1].',
    );
  }

  if (
    liquidWaterSurfaceCoverageFraction01 ===
    0
  ) {
    return PlanetSurfaceWaterRegime.NONE;
  }

  if (
    liquidWaterSurfaceCoverageFraction01 <
    0.05
  ) {
    return PlanetSurfaceWaterRegime.LOCAL_LIQUID;
  }

  if (
    liquidWaterSurfaceCoverageFraction01 <
    0.35
  ) {
    return PlanetSurfaceWaterRegime.SEAS;
  }

  if (
    liquidWaterSurfaceCoverageFraction01 <
    0.85
  ) {
    return PlanetSurfaceWaterRegime.OCEANS;
  }

  return PlanetSurfaceWaterRegime.GLOBAL_OCEAN;
}
