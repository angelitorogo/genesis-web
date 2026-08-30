import {
  MoonHabitabilityRegime,
  moonHabitabilityRegimeV1,
} from './moon-habitability-regime';

const SOURCE_TOLERANCE =
  1e-9;

/**
 * Point-21.6 potential-habitability projection for one relevant moon.
 *
 * V1 keeps surface and subsurface pathways separate. The indices are normalized
 * comparative scores, not probabilities of life, medical limits or biosignature
 * claims. All source fields are frozen point-21.5/21.4 products.
 */
export class MoonHabitabilityState {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly moonOrdinal:
      number,

    readonly sourceMoonSurfaceGravityEarth:
      number,

    readonly sourceEstimatedSurfaceTemperatureKelvin:
      number,

    readonly sourceAtmosphereRetentionIndex01:
      number,

    readonly sourceWaterInventoryIndex01:
      number,

    readonly sourceSubsurfaceOceanPotentialIndex01:
      number,

    readonly sourceSurfaceLiquidWaterPotentialIndex01:
      number,

    readonly sourceInternalHeatRetentionIndex01:
      number,

    readonly sourceGeologicalActivityIndex01:
      number,

    readonly sourceTidalHeatingIndex01:
      number,

    readonly surfaceTemperatureSupportIndex01:
      number,

    readonly surfaceAtmosphereSupportIndex01:
      number,

    readonly surfaceGravitySupportIndex01:
      number,

    readonly tidalModerationIndex01:
      number,

    readonly subsurfaceEnergySupportIndex01:
      number,

    readonly surfaceHabitabilityIndex01:
      number,

    readonly subsurfaceHabitabilityIndex01:
      number,

    readonly overallHabitabilityIndex01:
      number,

    readonly surfaceCandidate:
      boolean,

    readonly subsurfaceCandidate:
      boolean,

    readonly habitabilityRegime:
      MoonHabitabilityRegime,
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
      sourceMoonSurfaceGravityEarth,
      'sourceMoonSurfaceGravityEarth',
    );

    assertPositiveFinite(
      sourceEstimatedSurfaceTemperatureKelvin,
      'sourceEstimatedSurfaceTemperatureKelvin',
    );

    for (
      const [
        label,
        value,
      ] of [
        ['sourceAtmosphereRetentionIndex01', sourceAtmosphereRetentionIndex01],
        ['sourceWaterInventoryIndex01', sourceWaterInventoryIndex01],
        ['sourceSubsurfaceOceanPotentialIndex01', sourceSubsurfaceOceanPotentialIndex01],
        ['sourceSurfaceLiquidWaterPotentialIndex01', sourceSurfaceLiquidWaterPotentialIndex01],
        ['sourceInternalHeatRetentionIndex01', sourceInternalHeatRetentionIndex01],
        ['sourceGeologicalActivityIndex01', sourceGeologicalActivityIndex01],
        ['sourceTidalHeatingIndex01', sourceTidalHeatingIndex01],
        ['surfaceTemperatureSupportIndex01', surfaceTemperatureSupportIndex01],
        ['surfaceAtmosphereSupportIndex01', surfaceAtmosphereSupportIndex01],
        ['surfaceGravitySupportIndex01', surfaceGravitySupportIndex01],
        ['tidalModerationIndex01', tidalModerationIndex01],
        ['subsurfaceEnergySupportIndex01', subsurfaceEnergySupportIndex01],
        ['surfaceHabitabilityIndex01', surfaceHabitabilityIndex01],
        ['subsurfaceHabitabilityIndex01', subsurfaceHabitabilityIndex01],
        ['overallHabitabilityIndex01', overallHabitabilityIndex01],
      ] as const
    ) {
      assertUnitInterval(
        value,
        label,
      );
    }

    const expectedOverall =
      Math.min(
        1,
        Math.max(
          surfaceHabitabilityIndex01,
          subsurfaceHabitabilityIndex01,
        ) +
        0.10 *
          Math.min(
            surfaceHabitabilityIndex01,
            subsurfaceHabitabilityIndex01,
          ),
      );

    if (
      !approximatelyEqual(
        overallHabitabilityIndex01,
        expectedOverall,
      )
    ) {
      throw new RangeError(
        'MoonHabitabilityState overallHabitabilityIndex01 must preserve the point-21.6 route aggregation rule.',
      );
    }

    if (
      typeof surfaceCandidate !==
        'boolean' ||
      typeof subsurfaceCandidate !==
        'boolean'
    ) {
      throw new TypeError(
        'MoonHabitabilityState candidate flags must be boolean.',
      );
    }

    if (
      habitabilityRegime !==
      moonHabitabilityRegimeV1(
        surfaceCandidate,
        subsurfaceCandidate,
      )
    ) {
      throw new RangeError(
        'MoonHabitabilityState habitabilityRegime must match the surface/subsurface candidate flags.',
      );
    }
  }

  get isPotentiallyHabitable():
    boolean {

    return this
      .habitabilityRegime !==
      MoonHabitabilityRegime.NONE;
  }

  get supportsPotentialSurfaceHabitability():
    boolean {

    return this
      .surfaceCandidate;
  }

  get supportsPotentialSubsurfaceHabitability():
    boolean {

    return this
      .subsurfaceCandidate;
  }
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

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {
  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return Math.abs(
    left -
    right,
  ) <=
    SOURCE_TOLERANCE *
    scale;
}
