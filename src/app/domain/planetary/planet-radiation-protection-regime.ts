/**
 * Point-20.10 coarse protection available at a solid planetary surface.
 *
 * V1 combines atmosphere-column shielding with point-20.9 magnetic shielding.
 * It intentionally does not claim an exact attenuation factor for any specific
 * particle energy or photon wavelength.
 */
export enum PlanetRadiationProtectionRegime {
  NONE =
    'NONE',

  WEAK =
    'WEAK',

  MODERATE =
    'MODERATE',

  STRONG =
    'STRONG',

  VERY_STRONG =
    'VERY_STRONG',

  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',
}

export function planetRadiationProtectionRegimeForIndex01(
  protectionIndex01:
    number | null,
): PlanetRadiationProtectionRegime {

  if (
    protectionIndex01 ===
    null
  ) {
    return PlanetRadiationProtectionRegime
      .DEEP_ENVELOPE;
  }

  assertNormalized(
    protectionIndex01,
  );

  if (
    protectionIndex01 <
    0.10
  ) {
    return PlanetRadiationProtectionRegime
      .NONE;
  }

  if (
    protectionIndex01 <
    0.30
  ) {
    return PlanetRadiationProtectionRegime
      .WEAK;
  }

  if (
    protectionIndex01 <
    0.55
  ) {
    return PlanetRadiationProtectionRegime
      .MODERATE;
  }

  if (
    protectionIndex01 <
    0.80
  ) {
    return PlanetRadiationProtectionRegime
      .STRONG;
  }

  return PlanetRadiationProtectionRegime
    .VERY_STRONG;
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
      `protectionIndex01 must be finite and in [0, 1]: ${value}.`,
    );
  }
}
