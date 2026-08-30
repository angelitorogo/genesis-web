import {
  type MoonEnvironmentState,
} from '../../domain/planetary/moon-environment-state';

import {
  moonHabitabilityRegimeV1,
} from '../../domain/planetary/moon-habitability-regime';

import {
  MoonHabitabilityState,
} from '../../domain/planetary/moon-habitability-state';

/**
 * Point-21.6 deterministic potential-habitability classifier for relevant moons.
 *
 * V1 deliberately keeps two independent routes: surface habitability requires a
 * temperate liquid-water/atmosphere/gravity window, while subsurface habitability
 * requires an ocean reservoir plus a non-destructive internal/tidal energy source.
 * The resulting indices are comparative candidate scores, never probabilities of
 * life. No new seed, hash or PRNG draw is consumed.
 */
export class MoonHabitabilityEngine {

  private constructor() {}

  static generate(
    environment:
      MoonEnvironmentState,
  ): MoonHabitabilityState {
    const surfaceTemperatureSupportIndex01 =
      surfaceTemperatureSupportV1(
        environment
          .estimatedSurfaceTemperatureKelvin,
      );

    const surfaceAtmosphereSupportIndex01 =
      clamp01(
        (
          environment
            .atmosphereRetentionIndex01 -
          0.25
        ) /
        0.30,
      );

    const surfaceGravitySupportIndex01 =
      surfaceGravitySupportV1(
        environment
          .sourceMoonSurfaceGravityEarth,
      );

    const tidalModerationIndex01 =
      1 -
      clamp01(
        (
          environment
            .sourceTidalHeatingIndex01 -
          0.65
        ) /
        0.35,
      );

    const subsurfaceEnergySupportIndex01 =
      clamp01(
        0.60 *
          environment
            .internalHeatRetentionIndex01 +
        0.65 *
          environment
            .sourceTidalHeatingIndex01,
      );

    const surfaceGeologySupport01 =
      0.65 +
      0.35 *
        environment
          .geologicalActivityIndex01;

    const surfaceHabitabilityIndex01 =
      clamp01(
        environment
          .surfaceLiquidWaterPotentialIndex01 *
        surfaceTemperatureSupportIndex01 *
        surfaceAtmosphereSupportIndex01 *
        surfaceGravitySupportIndex01 *
        tidalModerationIndex01 *
        surfaceGeologySupport01,
      );

    const subsurfaceHabitabilityIndex01 =
      clamp01(
        environment
          .subsurfaceOceanPotentialIndex01 *
        (
          0.55 +
          0.45 *
            environment
              .waterInventoryIndex01
        ) *
        (
          0.45 +
          0.55 *
            subsurfaceEnergySupportIndex01
        ) *
        tidalModerationIndex01,
      );

    const surfaceCandidate =
      environment
        .surfaceLiquidWaterPotentialIndex01 >=
        0.35 &&
      surfaceTemperatureSupportIndex01 >=
        0.50 &&
      environment
        .atmosphereRetentionIndex01 >=
        0.35 &&
      surfaceGravitySupportIndex01 >=
        0.50 &&
      tidalModerationIndex01 >=
        0.50 &&
      surfaceHabitabilityIndex01 >=
        0.25;

    const subsurfaceCandidate =
      environment
        .subsurfaceOceanPotentialIndex01 >=
        0.35 &&
      environment
        .waterInventoryIndex01 >=
        0.20 &&
      subsurfaceEnergySupportIndex01 >=
        0.20 &&
      tidalModerationIndex01 >
        0 &&
      subsurfaceHabitabilityIndex01 >=
        0.30;

    const overallHabitabilityIndex01 =
      clamp01(
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

    return new MoonHabitabilityState(
      environment
        .hostPlanetOrdinal,
      environment
        .moonOrdinal,
      environment
        .sourceMoonSurfaceGravityEarth,
      environment
        .estimatedSurfaceTemperatureKelvin,
      environment
        .atmosphereRetentionIndex01,
      environment
        .waterInventoryIndex01,
      environment
        .subsurfaceOceanPotentialIndex01,
      environment
        .surfaceLiquidWaterPotentialIndex01,
      environment
        .internalHeatRetentionIndex01,
      environment
        .geologicalActivityIndex01,
      environment
        .sourceTidalHeatingIndex01,
      surfaceTemperatureSupportIndex01,
      surfaceAtmosphereSupportIndex01,
      surfaceGravitySupportIndex01,
      tidalModerationIndex01,
      subsurfaceEnergySupportIndex01,
      surfaceHabitabilityIndex01,
      subsurfaceHabitabilityIndex01,
      overallHabitabilityIndex01,
      surfaceCandidate,
      subsurfaceCandidate,
      moonHabitabilityRegimeV1(
        surfaceCandidate,
        subsurfaceCandidate,
      ),
    );
  }
}

function surfaceTemperatureSupportV1(
  temperatureKelvin:
    number,
): number {
  if (
    !Number.isFinite(
      temperatureKelvin,
    ) ||
    temperatureKelvin <=
      250 ||
    temperatureKelvin >=
      350
  ) {
    return 0;
  }

  if (
    temperatureKelvin <
    273
  ) {
    return (
      temperatureKelvin -
      250
    ) /
    23;
  }

  if (
    temperatureKelvin <=
    315
  ) {
    return 1;
  }

  return (
    350 -
    temperatureKelvin
  ) /
  35;
}

function surfaceGravitySupportV1(
  gravityEarth:
    number,
): number {
  if (
    !Number.isFinite(
      gravityEarth,
    ) ||
    gravityEarth <=
      0.05 ||
    gravityEarth >=
      2.5
  ) {
    return 0;
  }

  if (
    gravityEarth <
    0.12
  ) {
    return (
      gravityEarth -
      0.05
    ) /
    0.07;
  }

  if (
    gravityEarth <=
    1.5
  ) {
    return 1;
  }

  return (
    2.5 -
    gravityEarth
  ) /
  1.0;
}

function clamp01(
  value:
    number,
): number {
  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
