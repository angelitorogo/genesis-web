import {
  PlanetType,
} from './planet-type';

import {
  GiantMoonCompositionRegime,
  giantMoonCompositionRegimeV1,
} from './giant-moon-composition-regime';

import {
  GiantMoonOrbitalFamily,
  giantMoonOrbitalFamilyV1,
} from './giant-moon-orbital-family';

/**
 * Point-21.7 specialization of one already-frozen relevant moon when its host is
 * a GAS_GIANT or ICE_GIANT.
 *
 * This object never changes point-21.3 mass/orbit or point-21.4-21.6 environment
 * products. It only classifies the moon inside a giant-planet satellite system.
 */
export class GiantMoonState {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly moonOrdinal:
      number,

    readonly sourceHostPlanetType:
      PlanetType,

    readonly sourceMoonMassEarth:
      number,

    readonly sourceMoonRadiusEarth:
      number,

    readonly sourceSemiMajorAxisPlanetRadii:
      number,

    readonly sourceEccentricity:
      number,

    readonly sourceInclinationDegrees:
      number,

    readonly sourceInferredIceRichnessIndex01:
      number,

    readonly sourceTidalHeatingIndex01:
      number,

    readonly sourceSubsurfaceOceanPotentialIndex01:
      number,

    readonly sourceSurfaceLiquidWaterPotentialIndex01:
      number,

    readonly sourceOverallHabitabilityIndex01:
      number,

    readonly sourceIsPotentiallyHabitable:
      boolean,

    readonly orbitalFamily:
      GiantMoonOrbitalFamily,

    readonly compositionRegime:
      GiantMoonCompositionRegime,

    readonly isLargeMoon:
      boolean,

    readonly isTidallyActive:
      boolean,

    readonly isOceanBearingCandidate:
      boolean,

    readonly isHabitabilityCandidate:
      boolean,
  ) {
    assertPositiveInteger(
      hostPlanetOrdinal,
      'hostPlanetOrdinal',
    );

    assertPositiveInteger(
      moonOrdinal,
      'moonOrdinal',
    );

    assertPositiveFinite(
      sourceMoonMassEarth,
      'sourceMoonMassEarth',
    );

    assertPositiveFinite(
      sourceMoonRadiusEarth,
      'sourceMoonRadiusEarth',
    );

    assertPositiveFinite(
      sourceSemiMajorAxisPlanetRadii,
      'sourceSemiMajorAxisPlanetRadii',
    );

    if (
      !Number.isFinite(
        sourceEccentricity,
      ) ||
      sourceEccentricity <
        0 ||
      sourceEccentricity >=
        1
    ) {
      throw new RangeError(
        'sourceEccentricity must be finite in [0, 1).',
      );
    }

    if (
      !Number.isFinite(
        sourceInclinationDegrees,
      ) ||
      sourceInclinationDegrees <
        0 ||
      sourceInclinationDegrees >
        180
    ) {
      throw new RangeError(
        'sourceInclinationDegrees must be finite in [0, 180].',
      );
    }

    for (
      const [
        label,
        value,
      ] of [
        ['sourceInferredIceRichnessIndex01', sourceInferredIceRichnessIndex01],
        ['sourceTidalHeatingIndex01', sourceTidalHeatingIndex01],
        ['sourceSubsurfaceOceanPotentialIndex01', sourceSubsurfaceOceanPotentialIndex01],
        ['sourceSurfaceLiquidWaterPotentialIndex01', sourceSurfaceLiquidWaterPotentialIndex01],
        ['sourceOverallHabitabilityIndex01', sourceOverallHabitabilityIndex01],
      ] as const
    ) {
      assertUnitInterval(
        value,
        label,
      );
    }

    const giantHost =
      isGiantPlanetTypeV1(
        sourceHostPlanetType,
      );

    if (
      orbitalFamily !==
      giantMoonOrbitalFamilyV1(
        giantHost,
        sourceSemiMajorAxisPlanetRadii,
      )
    ) {
      throw new RangeError(
        'GiantMoonState orbitalFamily must match the point-21.7 host/orbit classifier.',
      );
    }

    if (
      compositionRegime !==
      giantMoonCompositionRegimeV1(
        giantHost,
        sourceInferredIceRichnessIndex01,
      )
    ) {
      throw new RangeError(
        'GiantMoonState compositionRegime must match the point-21.7 ice-richness classifier.',
      );
    }

    const expectedLargeMoon =
      giantHost &&
      sourceMoonRadiusEarth >=
        largeMoonRadiusThresholdEarthV1(
          sourceHostPlanetType,
        );

    const expectedTidallyActive =
      giantHost &&
      sourceTidalHeatingIndex01 >=
        0.45;

    const expectedOceanBearing =
      giantHost &&
      (
        sourceSubsurfaceOceanPotentialIndex01 >=
          0.35 ||
        sourceSurfaceLiquidWaterPotentialIndex01 >=
          0.35
      );

    if (
      typeof sourceIsPotentiallyHabitable !==
      'boolean'
    ) {
      throw new TypeError(
        'sourceIsPotentiallyHabitable must be boolean.',
      );
    }

    const expectedHabitabilityCandidate =
      giantHost &&
      sourceIsPotentiallyHabitable;

    if (
      typeof isLargeMoon !==
        'boolean' ||
      typeof isTidallyActive !==
        'boolean' ||
      typeof isOceanBearingCandidate !==
        'boolean' ||
      typeof isHabitabilityCandidate !==
        'boolean'
    ) {
      throw new TypeError(
        'GiantMoonState flags must be boolean.',
      );
    }

    if (
      isLargeMoon !==
        expectedLargeMoon ||
      isTidallyActive !==
        expectedTidallyActive ||
      isOceanBearingCandidate !==
        expectedOceanBearing ||
      isHabitabilityCandidate !==
        expectedHabitabilityCandidate
    ) {
      throw new RangeError(
        'GiantMoonState flags must preserve the point-21.7 giant-host specialization rules.',
      );
    }
  }

  get isApplicable():
    boolean {

    return isGiantPlanetTypeV1(
      this
        .sourceHostPlanetType,
    );
  }
}

export function isGiantPlanetTypeV1(
  planetType:
    PlanetType,
): boolean {

  return (
    planetType ===
      PlanetType.GAS_GIANT ||
    planetType ===
      PlanetType.ICE_GIANT
  );
}

export function largeMoonRadiusThresholdEarthV1(
  planetType:
    PlanetType,
): number {

  if (
    planetType ===
    PlanetType.GAS_GIANT
  ) {
    return 0.18;
  }

  if (
    planetType ===
    PlanetType.ICE_GIANT
  ) {
    return 0.08;
  }

  return Number.POSITIVE_INFINITY;
}

function assertPositiveInteger(
  value:
    number,

  label:
    string,
): void {
  if (
    !Number.isInteger(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be a positive integer.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  label:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be positive and finite.`,
    );
  }
}

function assertUnitInterval(
  value:
    number,

  label:
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
      `${label} must be finite in [0, 1].`,
    );
  }
}
