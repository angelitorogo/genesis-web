/**
 * Point-20.10 coarse surface-radiation exposure families.
 *
 * These regimes describe a normalized V1 exposure proxy only. They are not
 * medical/occupational dose bands and do not imply a value in sievert/year.
 * DEEP_ENVELOPE means no solid surface exists in the current planet model.
 */
export enum PlanetSurfaceRadiationRegime {
  MINIMAL =
    'MINIMAL',

  LOW =
    'LOW',

  MODERATE =
    'MODERATE',

  HIGH =
    'HIGH',

  EXTREME =
    'EXTREME',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export function planetSurfaceRadiationRegimeForIndex01(
  exposureIndex01:
    number | null,
): PlanetSurfaceRadiationRegime {

  if (
    exposureIndex01 ===
    null
  ) {
    return PlanetSurfaceRadiationRegime
      .DEEP_ENVELOPE;
  }

  assertNormalized(
    exposureIndex01,
  );

  if (
    exposureIndex01 <
    0.08
  ) {
    return PlanetSurfaceRadiationRegime
      .MINIMAL;
  }

  if (
    exposureIndex01 <
    0.25
  ) {
    return PlanetSurfaceRadiationRegime
      .LOW;
  }

  if (
    exposureIndex01 <
    0.50
  ) {
    return PlanetSurfaceRadiationRegime
      .MODERATE;
  }

  if (
    exposureIndex01 <
    0.75
  ) {
    return PlanetSurfaceRadiationRegime
      .HIGH;
  }

  return PlanetSurfaceRadiationRegime
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
      `exposureIndex01 must be finite and in [0, 1]: ${value}.`,
    );
  }
}
