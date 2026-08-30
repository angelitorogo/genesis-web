/**
 * Point-20.8 coarse solid-world geological activity families.
 *
 * DEEP_ENVELOPE means V1 deliberately does not invent a solid surface geology
 * for mini-Neptunes or giant planets.
 */
export enum PlanetGeologyRegime {
  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',

  INERT =
    'INERT',

  LOW_ACTIVITY =
    'LOW_ACTIVITY',

  ACTIVE =
    'ACTIVE',

  HIGH_ACTIVITY =
    'HIGH_ACTIVITY',

  EXTREME_ACTIVITY =
    'EXTREME_ACTIVITY',
}

export function planetGeologyRegimeForActivityIndex01(
  activityIndex01:
    number | null,
): PlanetGeologyRegime {

  if (
    activityIndex01 ===
    null
  ) {
    return PlanetGeologyRegime
      .DEEP_ENVELOPE;
  }

  assertNormalized(
    activityIndex01,
  );

  if (
    activityIndex01 <
    0.10
  ) {
    return PlanetGeologyRegime
      .INERT;
  }

  if (
    activityIndex01 <
    0.25
  ) {
    return PlanetGeologyRegime
      .LOW_ACTIVITY;
  }

  if (
    activityIndex01 <
    0.55
  ) {
    return PlanetGeologyRegime
      .ACTIVE;
  }

  if (
    activityIndex01 <
    0.85
  ) {
    return PlanetGeologyRegime
      .HIGH_ACTIVITY;
  }

  return PlanetGeologyRegime
    .EXTREME_ACTIVITY;
}

function assertNormalized(
  value:
    number,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `activityIndex01 must be finite and in [0, 1]: ${value}.`,
    );
  }
}
