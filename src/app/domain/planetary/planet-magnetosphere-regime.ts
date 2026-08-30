/**
 * Point-20.9 coarse magnetospheric configurations.
 *
 * INDUCED represents a wind/ionosphere obstacle without a sustained intrinsic
 * global dynamo. COMPRESSED/GLOBAL/EXTENDED are intrinsic-magnetosphere states.
 */
export enum PlanetMagnetosphereRegime {
  NONE =
    'NONE',

  INDUCED =
    'INDUCED',

  COMPRESSED =
    'COMPRESSED',

  GLOBAL =
    'GLOBAL',

  EXTENDED =
    'EXTENDED',
}

export function planetMagnetosphereRegimeForState(
  magnetosphericProtectionIndex01:
    number,

  hasSustainedDynamo:
    boolean,

  inducedMagnetospherePotentialIndex01:
    number,
): PlanetMagnetosphereRegime {

  assertNormalized(
    magnetosphericProtectionIndex01,
    'magnetosphericProtectionIndex01',
  );

  assertNormalized(
    inducedMagnetospherePotentialIndex01,
    'inducedMagnetospherePotentialIndex01',
  );

  if (
    !hasSustainedDynamo
  ) {
    return inducedMagnetospherePotentialIndex01 >=
      0.05
      ? PlanetMagnetosphereRegime.INDUCED
      : PlanetMagnetosphereRegime.NONE;
  }

  if (
    magnetosphericProtectionIndex01 <
    0.35
  ) {
    return PlanetMagnetosphereRegime
      .COMPRESSED;
  }

  if (
    magnetosphericProtectionIndex01 <
    0.75
  ) {
    return PlanetMagnetosphereRegime
      .GLOBAL;
  }

  return PlanetMagnetosphereRegime
    .EXTENDED;
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
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
      `${propertyName} must be finite and in [0, 1]: ${value}.`,
    );
  }
}
