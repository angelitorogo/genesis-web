/**
 * Point-20.6 qualitative stability of the solid-surface thermal climate.
 *
 * DEEP_ENVELOPE is a semantic branch rather than a claim that giant-planet
 * meteorology is stable; phase 20.6 deliberately does not invent a solid
 * surface or detailed deep-atmosphere circulation for those worlds.
 */
export enum PlanetClimateStabilityRegime {
  STABLE =
    'STABLE',

  MODERATELY_VARIABLE =
    'MODERATELY_VARIABLE',

  STRONGLY_VARIABLE =
    'STRONGLY_VARIABLE',

  EXTREME =
    'EXTREME',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export function planetClimateStabilityRegimeForIndex01(
  stabilityIndex01:
    number | null,

  isDeepEnvelope:
    boolean,
): PlanetClimateStabilityRegime {

  if (
    isDeepEnvelope
  ) {
    if (
      stabilityIndex01 !==
      null
    ) {
      throw new RangeError(
        'Deep-envelope climate stability requires stabilityIndex01 = null.',
      );
    }

    return PlanetClimateStabilityRegime.DEEP_ENVELOPE;
  }

  if (
    stabilityIndex01 ===
      null ||
    !Number.isFinite(
      stabilityIndex01,
    ) ||
    stabilityIndex01 <
      0 ||
    stabilityIndex01 >
      1
  ) {
    throw new RangeError(
      'Solid-surface climate stabilityIndex01 must be finite and in [0, 1].',
    );
  }

  if (
    stabilityIndex01 >=
    0.80
  ) {
    return PlanetClimateStabilityRegime.STABLE;
  }

  if (
    stabilityIndex01 >=
    0.60
  ) {
    return PlanetClimateStabilityRegime.MODERATELY_VARIABLE;
  }

  if (
    stabilityIndex01 >=
    0.35
  ) {
    return PlanetClimateStabilityRegime.STRONGLY_VARIABLE;
  }

  return PlanetClimateStabilityRegime.EXTREME;
}
