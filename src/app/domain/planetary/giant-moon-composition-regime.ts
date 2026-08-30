/**
 * Point-21.7 coarse composition family for a relevant moon of a giant planet.
 *
 * V1 reuses the point-21.5 density-derived ice-richness proxy. This is not a
 * mineralogical or chemical-composition claim.
 */
export enum GiantMoonCompositionRegime {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  ROCK_RICH = 'ROCK_RICH',
  MIXED_ROCK_ICE = 'MIXED_ROCK_ICE',
  ICE_RICH = 'ICE_RICH',
}

export function giantMoonCompositionRegimeV1(
  isGiantHost:
    boolean,

  inferredIceRichnessIndex01:
    number,
): GiantMoonCompositionRegime {
  if (
    !Number.isFinite(
      inferredIceRichnessIndex01,
    ) ||
    inferredIceRichnessIndex01 <
      0 ||
    inferredIceRichnessIndex01 >
      1
  ) {
    throw new RangeError(
      'inferredIceRichnessIndex01 must be finite in [0, 1].',
    );
  }

  if (
    !isGiantHost
  ) {
    return GiantMoonCompositionRegime.NOT_APPLICABLE;
  }

  if (
    inferredIceRichnessIndex01 <
    0.25
  ) {
    return GiantMoonCompositionRegime.ROCK_RICH;
  }

  if (
    inferredIceRichnessIndex01 <
    0.65
  ) {
    return GiantMoonCompositionRegime.MIXED_ROCK_ICE;
  }

  return GiantMoonCompositionRegime.ICE_RICH;
}
