import {
  moonAtmosphereRegimeForRetentionIndex01,
} from '../../domain/planetary/moon-atmosphere-regime';

import {
  MoonEnvironmentState,
} from '../../domain/planetary/moon-environment-state';

import {
  moonGeologyRegimeV1,
} from '../../domain/planetary/moon-geology-regime';

import {
  type MoonPhysicalProperties,
} from '../../domain/planetary/moon-physical-properties';

import {
  type MoonTidalState,
} from '../../domain/planetary/moon-tidal-state';

import {
  MoonWaterRegime,
} from '../../domain/planetary/moon-water-regime';

import {
  type Planet,
} from '../../domain/planetary/planet';

const V1_EQUILIBRIUM_TEMPERATURE_REFERENCE_KELVIN =
  278.33;

const V1_MIN_INFERRED_BOND_ALBEDO01 =
  0.14;

const V1_MAX_INFERRED_BOND_ALBEDO01 =
  0.55;

/**
 * Point-21.5 deterministic first-order lunar environment projection.
 *
 * V1 intentionally does not reuse the planet Atmosphere/Climate aggregates from
 * phase 20: a relevant moon is not promoted to Planet and has no MoonSeed yet.
 * Instead this engine projects whether its frozen point-21.3 bulk state and
 * point-21.4 tidal heat can plausibly support retained gas, water phases and
 * present-day geological activity. No new seed, hash or PRNG draw is consumed.
 */
export class MoonEnvironmentEngine {

  private constructor() {}

  static generate(
    hostPlanet:
      Planet,

    physical:
      MoonPhysicalProperties,

    tidalState:
      MoonTidalState,
  ): MoonEnvironmentState {
    assertSourceAlignment(
      hostPlanet,
      physical,
      tidalState,
    );

    const sourceReferenceMeanInsolationEarth =
      hostPlanet
        .typeClassification
        .referenceMeanInsolationEarth;

    if (
      !Number.isFinite(
        sourceReferenceMeanInsolationEarth,
      ) ||
      sourceReferenceMeanInsolationEarth <=
        0
    ) {
      throw new RangeError(
        'MoonEnvironmentEngine requires a positive finite host referenceMeanInsolationEarth.',
      );
    }

    const inferredIceRichnessIndex01 =
      clamp01(
        (
          3.6 -
          physical
            .meanDensityGramsPerCubicCentimeter
        ) /
        2.0,
      );

    const inferredBondAlbedo01 =
      lerp(
        V1_MIN_INFERRED_BOND_ALBEDO01,
        V1_MAX_INFERRED_BOND_ALBEDO01,
        inferredIceRichnessIndex01,
      );

    const equilibriumTemperatureKelvin =
      V1_EQUILIBRIUM_TEMPERATURE_REFERENCE_KELVIN *
      (
        sourceReferenceMeanInsolationEarth *
        (
          1 -
          inferredBondAlbedo01
        )
      ) **
        0.25;

    const estimatedSurfaceTemperatureKelvin =
      equilibriumTemperatureKelvin +
      35 *
        tidalState
          .tidalHeatingIndex01;

    const escapeVelocityEarth =
      Math.sqrt(
        physical
          .massEarth /
        physical
          .radiusEarth,
      );

    const escapeRetentionSupport01 =
      clamp01(
        (
          escapeVelocityEarth -
          0.08
        ) /
        0.45,
      );

    const volatileInventorySupport01 =
      clamp01(
        0.75 *
          inferredIceRichnessIndex01 +
        0.25 *
          tidalState
            .tidalHeatingIndex01,
      );

    const thermalEscapeStress01 =
      clamp01(
        (
          estimatedSurfaceTemperatureKelvin -
          180
        ) /
        420,
      );

    const atmosphereRetentionIndex01 =
      clamp01(
        0.55 *
          escapeRetentionSupport01 +
        0.37 *
          volatileInventorySupport01 +
        0.08 *
          tidalState
            .tidalHeatingIndex01 -
        0.35 *
          thermalEscapeStress01,
      );

    const waterInventoryIndex01 =
      clamp01(
        0.90 *
          inferredIceRichnessIndex01 +
        0.10 *
          volatileInventorySupport01,
      );

    const subsurfaceOceanPotentialIndex01 =
      clamp01(
        waterInventoryIndex01 *
        (
          0.25 +
          0.75 *
            tidalState
              .tidalHeatingIndex01
        ) *
        2.2,
      );

    const surfaceLiquidWaterPotentialIndex01 =
      clamp01(
        waterInventoryIndex01 *
        surfaceLiquidTemperatureSupport01(
          estimatedSurfaceTemperatureKelvin,
        ) *
        clamp01(
          (
            atmosphereRetentionIndex01 -
            0.15
          ) /
          0.35,
        ) *
        1.4,
      );

    const waterRegime =
      waterRegimeV1(
        waterInventoryIndex01,
        subsurfaceOceanPotentialIndex01,
        surfaceLiquidWaterPotentialIndex01,
        estimatedSurfaceTemperatureKelvin,
      );

    const radiusHeatRetention01 =
      clamp01(
        (
          physical
            .radiusEarth -
          0.08
        ) /
        0.55,
      );

    const massHeatRetention01 =
      clamp01(
        (
          Math.log10(
            Math.max(
              physical
                .massEarth,
              1e-12,
            ),
          ) +
          2.5
        ) /
        1.8,
      );

    const internalHeatRetentionIndex01 =
      clamp01(
        0.60 *
          radiusHeatRetention01 +
        0.40 *
          massHeatRetention01,
      );

    const geologicalActivityIndex01 =
      clamp01(
        0.35 *
          internalHeatRetentionIndex01 +
        0.65 *
          tidalState
            .tidalHeatingIndex01,
      );

    return new MoonEnvironmentState(
      hostPlanet
        .planetOrdinal,
      physical
        .moonOrdinal,
      physical
        .massEarth,
      physical
        .radiusEarth,
      physical
        .meanDensityGramsPerCubicCentimeter,
      physical
        .surfaceGravityEarth,
      sourceReferenceMeanInsolationEarth,
      tidalState
        .tidalHeatingIndex01,
      inferredIceRichnessIndex01,
      inferredBondAlbedo01,
      equilibriumTemperatureKelvin,
      estimatedSurfaceTemperatureKelvin,
      atmosphereRetentionIndex01,
      moonAtmosphereRegimeForRetentionIndex01(
        atmosphereRetentionIndex01,
      ),
      waterInventoryIndex01,
      subsurfaceOceanPotentialIndex01,
      surfaceLiquidWaterPotentialIndex01,
      waterRegime,
      internalHeatRetentionIndex01,
      geologicalActivityIndex01,
      moonGeologyRegimeV1(
        geologicalActivityIndex01,
        tidalState
          .tidalHeatingIndex01,
      ),
    );
  }
}

function waterRegimeV1(
  waterInventoryIndex01:
    number,

  subsurfaceOceanPotentialIndex01:
    number,

  surfaceLiquidWaterPotentialIndex01:
    number,

  estimatedSurfaceTemperatureKelvin:
    number,
): MoonWaterRegime {
  if (
    waterInventoryIndex01 <
    0.08
  ) {
    return MoonWaterRegime.NONE;
  }

  const hasSubsurfaceOcean =
    subsurfaceOceanPotentialIndex01 >=
    0.35;

  const hasSurfaceLiquidWater =
    surfaceLiquidWaterPotentialIndex01 >=
    0.35;

  if (
    hasSubsurfaceOcean &&
    hasSurfaceLiquidWater
  ) {
    return MoonWaterRegime.MIXED;
  }

  if (
    hasSurfaceLiquidWater
  ) {
    return MoonWaterRegime.SURFACE_LIQUID;
  }

  if (
    hasSubsurfaceOcean
  ) {
    return estimatedSurfaceTemperatureKelvin <
      260
      ? MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN
      : MoonWaterRegime.SUBSURFACE_OCEAN;
  }

  return MoonWaterRegime.SURFACE_ICE;
}

function surfaceLiquidTemperatureSupport01(
  temperatureKelvin:
    number,
): number {
  if (
    temperatureKelvin <=
      240 ||
    temperatureKelvin >=
      370
  ) {
    return 0;
  }

  if (
    temperatureKelvin <
    273
  ) {
    return (
      temperatureKelvin -
      240
    ) /
    33;
  }

  if (
    temperatureKelvin <=
    320
  ) {
    return 1;
  }

  return (
    370 -
    temperatureKelvin
  ) /
  50;
}

function assertSourceAlignment(
  hostPlanet:
    Planet,

  physical:
    MoonPhysicalProperties,

  tidalState:
    MoonTidalState,
): void {
  if (
    physical
      .hostPlanetOrdinal !==
      hostPlanet
        .planetOrdinal ||
    tidalState
      .hostPlanetOrdinal !==
      hostPlanet
        .planetOrdinal ||
    physical
      .moonOrdinal !==
      tidalState
        .moonOrdinal
  ) {
    throw new RangeError(
      'MoonEnvironmentEngine requires aligned host/moon ordinals from points 21.3 and 21.4.',
    );
  }

  if (
    !approximatelyEqual(
      tidalState
        .sourceMoonMassEarth,
      physical
        .massEarth,
    ) ||
    !approximatelyEqual(
      tidalState
        .sourceMoonRadiusEarth,
      physical
        .radiusEarth,
    ) ||
    !approximatelyEqual(
      tidalState
        .sourceHostPlanetMassEarth,
      hostPlanet
        .massEarth,
    ) ||
    !approximatelyEqual(
      tidalState
        .sourceHostPlanetRadiusEarth,
      hostPlanet
        .radiusEarth,
    )
  ) {
    throw new RangeError(
      'MoonEnvironmentEngine requires the exact frozen point-21.3/21.4 bulk sources.',
    );
  }
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

function lerp(
  minimum:
    number,

  maximum:
    number,

  fraction:
    number,
): number {
  return minimum +
    (
      maximum -
      minimum
    ) *
    fraction;
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
    1e-9 *
    scale;
}
