/**
 * Point-20.8 approximate volcanism intensity for a solid-surface planet.
 */
export enum PlanetVolcanismRegime {
  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',

  NONE =
    'NONE',

  LOW =
    'LOW',

  MODERATE =
    'MODERATE',

  HIGH =
    'HIGH',

  EXTREME =
    'EXTREME',
}

export function planetVolcanismRegimeForIndex01(
  volcanismIndex01:
    number | null,
): PlanetVolcanismRegime {

  if (
    volcanismIndex01 ===
    null
  ) {
    return PlanetVolcanismRegime
      .DEEP_ENVELOPE;
  }

  assertNormalized(
    volcanismIndex01,
  );

  if (
    volcanismIndex01 <
    0.08
  ) {
    return PlanetVolcanismRegime
      .NONE;
  }

  if (
    volcanismIndex01 <
    0.25
  ) {
    return PlanetVolcanismRegime
      .LOW;
  }

  if (
    volcanismIndex01 <
    0.50
  ) {
    return PlanetVolcanismRegime
      .MODERATE;
  }

  if (
    volcanismIndex01 <
    0.82
  ) {
    return PlanetVolcanismRegime
      .HIGH;
  }

  return PlanetVolcanismRegime
    .EXTREME;
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
      `volcanismIndex01 must be finite and in [0, 1]: ${value}.`,
    );
  }
}
