/**
 * Point-20.8 coarse lithosphere/tectonic mobility families.
 *
 * These names are dynamical approximations, not a claim that V1 resolves real
 * plate boundaries, continents, faults or crustal ages.
 */
export enum PlanetTectonicRegime {
  DEEP_ENVELOPE =
    'DEEP_ENVELOPE',

  STAGNANT_LID =
    'STAGNANT_LID',

  EPISODIC_MOBILITY =
    'EPISODIC_MOBILITY',

  MOBILE_LID =
    'MOBILE_LID',

  PLATE_TECTONICS =
    'PLATE_TECTONICS',
}

export function planetTectonicRegimeForMobilityIndex01(
  mobilityIndex01:
    number | null,
): PlanetTectonicRegime {

  if (
    mobilityIndex01 ===
    null
  ) {
    return PlanetTectonicRegime
      .DEEP_ENVELOPE;
  }

  assertNormalized(
    mobilityIndex01,
  );

  if (
    mobilityIndex01 <
    0.30
  ) {
    return PlanetTectonicRegime
      .STAGNANT_LID;
  }

  if (
    mobilityIndex01 <
    0.52
  ) {
    return PlanetTectonicRegime
      .EPISODIC_MOBILITY;
  }

  if (
    mobilityIndex01 <
    0.65
  ) {
    return PlanetTectonicRegime
      .MOBILE_LID;
  }

  return PlanetTectonicRegime
    .PLATE_TECTONICS;
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
      `mobilityIndex01 must be finite and in [0, 1]: ${value}.`,
    );
  }
}
