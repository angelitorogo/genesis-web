import {
  MoonAtmosphereRegime,
  moonAtmosphereRegimeForRetentionIndex01,
} from './moon-atmosphere-regime';

import {
  MoonGeologyRegime,
  moonGeologyRegimeV1,
} from './moon-geology-regime';

import {
  MoonWaterRegime,
} from './moon-water-regime';

const SOURCE_TOLERANCE =
  1e-9;

/**
 * Point-21.5 atmosphere/water/geology state for one relevant moon.
 *
 * All values are first-order deterministic proxies. Atmosphere is expressed as
 * retention support rather than exact pressure/composition; water describes
 * phase/inventory opportunities rather than ocean depth; geology combines size
 * heat retention with the already frozen point-21.4 tidal-heating source.
 */
export class MoonEnvironmentState {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly moonOrdinal:
      number,

    readonly sourceMoonMassEarth:
      number,

    readonly sourceMoonRadiusEarth:
      number,

    readonly sourceMoonMeanDensityGramsPerCubicCentimeter:
      number,

    readonly sourceMoonSurfaceGravityEarth:
      number,

    readonly sourceReferenceMeanInsolationEarth:
      number,

    readonly sourceTidalHeatingIndex01:
      number,

    readonly inferredIceRichnessIndex01:
      number,

    readonly inferredBondAlbedo01:
      number,

    readonly equilibriumTemperatureKelvin:
      number,

    readonly estimatedSurfaceTemperatureKelvin:
      number,

    readonly atmosphereRetentionIndex01:
      number,

    readonly atmosphereRegime:
      MoonAtmosphereRegime,

    readonly waterInventoryIndex01:
      number,

    readonly subsurfaceOceanPotentialIndex01:
      number,

    readonly surfaceLiquidWaterPotentialIndex01:
      number,

    readonly waterRegime:
      MoonWaterRegime,

    readonly internalHeatRetentionIndex01:
      number,

    readonly geologicalActivityIndex01:
      number,

    readonly geologyRegime:
      MoonGeologyRegime,
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
      sourceMoonMeanDensityGramsPerCubicCentimeter,
      'sourceMoonMeanDensityGramsPerCubicCentimeter',
    );

    assertPositiveFinite(
      sourceMoonSurfaceGravityEarth,
      'sourceMoonSurfaceGravityEarth',
    );

    assertPositiveFinite(
      sourceReferenceMeanInsolationEarth,
      'sourceReferenceMeanInsolationEarth',
    );

    assertUnitInterval(
      sourceTidalHeatingIndex01,
      'sourceTidalHeatingIndex01',
    );

    assertUnitInterval(
      inferredIceRichnessIndex01,
      'inferredIceRichnessIndex01',
    );

    if (
      !Number.isFinite(
        inferredBondAlbedo01,
      ) ||
      inferredBondAlbedo01 <
        0 ||
      inferredBondAlbedo01 >=
        1
    ) {
      throw new RangeError(
        'inferredBondAlbedo01 must be finite in [0, 1).',
      );
    }

    assertPositiveFinite(
      equilibriumTemperatureKelvin,
      'equilibriumTemperatureKelvin',
    );

    assertPositiveFinite(
      estimatedSurfaceTemperatureKelvin,
      'estimatedSurfaceTemperatureKelvin',
    );

    if (
      estimatedSurfaceTemperatureKelvin +
        SOURCE_TOLERANCE <
      equilibriumTemperatureKelvin
    ) {
      throw new RangeError(
        'estimatedSurfaceTemperatureKelvin cannot be below the radiative equilibrium baseline in point 21.5.',
      );
    }

    assertUnitInterval(
      atmosphereRetentionIndex01,
      'atmosphereRetentionIndex01',
    );

    if (
      atmosphereRegime !==
      moonAtmosphereRegimeForRetentionIndex01(
        atmosphereRetentionIndex01,
      )
    ) {
      throw new RangeError(
        'MoonEnvironmentState atmosphereRegime must match atmosphereRetentionIndex01.',
      );
    }

    assertUnitInterval(
      waterInventoryIndex01,
      'waterInventoryIndex01',
    );

    assertUnitInterval(
      subsurfaceOceanPotentialIndex01,
      'subsurfaceOceanPotentialIndex01',
    );

    assertUnitInterval(
      surfaceLiquidWaterPotentialIndex01,
      'surfaceLiquidWaterPotentialIndex01',
    );

    assertWaterRegimeConsistency(
      waterRegime,
      waterInventoryIndex01,
      subsurfaceOceanPotentialIndex01,
      surfaceLiquidWaterPotentialIndex01,
      estimatedSurfaceTemperatureKelvin,
    );

    assertUnitInterval(
      internalHeatRetentionIndex01,
      'internalHeatRetentionIndex01',
    );

    assertUnitInterval(
      geologicalActivityIndex01,
      'geologicalActivityIndex01',
    );

    if (
      geologyRegime !==
      moonGeologyRegimeV1(
        geologicalActivityIndex01,
        sourceTidalHeatingIndex01,
      )
    ) {
      throw new RangeError(
        'MoonEnvironmentState geologyRegime must match geologicalActivityIndex01 and the frozen tidal-heating source.',
      );
    }
  }

  get hasAtmosphere():
    boolean {

    return this
      .atmosphereRegime !==
      MoonAtmosphereRegime.NONE;
  }

  get hasSubstantialAtmosphere():
    boolean {

    return this
      .atmosphereRegime ===
      MoonAtmosphereRegime.SUBSTANTIAL;
  }

  get hasWater():
    boolean {

    return this
      .waterRegime !==
      MoonWaterRegime.NONE;
  }

  get hasSubsurfaceOcean():
    boolean {

    return (
      this.waterRegime ===
        MoonWaterRegime.SUBSURFACE_OCEAN ||
      this.waterRegime ===
        MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN ||
      this.waterRegime ===
        MoonWaterRegime.MIXED
    );
  }

  get hasSurfaceLiquidWater():
    boolean {

    return (
      this.waterRegime ===
        MoonWaterRegime.SURFACE_LIQUID ||
      this.waterRegime ===
        MoonWaterRegime.MIXED
    );
  }

  get isGeologicallyActive():
    boolean {

    return (
      this.geologyRegime ===
        MoonGeologyRegime.ACTIVE ||
      this.geologyRegime ===
        MoonGeologyRegime.TIDALLY_ACTIVE ||
      this.geologyRegime ===
        MoonGeologyRegime.EXTREME
    );
  }
}

function assertWaterRegimeConsistency(
  waterRegime:
    MoonWaterRegime,

  waterInventoryIndex01:
    number,

  subsurfaceOceanPotentialIndex01:
    number,

  surfaceLiquidWaterPotentialIndex01:
    number,

  estimatedSurfaceTemperatureKelvin:
    number,
): void {
  if (
    waterInventoryIndex01 <
    0.08
  ) {
    if (
      waterRegime !==
      MoonWaterRegime.NONE
    ) {
      throw new RangeError(
        'MoonEnvironmentState with negligible water inventory must use waterRegime NONE.',
      );
    }

    return;
  }

  const hasSubsurface =
    subsurfaceOceanPotentialIndex01 >=
    0.35;

  const hasSurfaceLiquid =
    surfaceLiquidWaterPotentialIndex01 >=
    0.35;

  let expected:
    MoonWaterRegime;

  if (
    hasSubsurface &&
    hasSurfaceLiquid
  ) {
    expected =
      MoonWaterRegime.MIXED;
  } else if (
    hasSurfaceLiquid
  ) {
    expected =
      MoonWaterRegime.SURFACE_LIQUID;
  } else if (
    hasSubsurface
  ) {
    expected =
      estimatedSurfaceTemperatureKelvin <
        260
        ? MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN
        : MoonWaterRegime.SUBSURFACE_OCEAN;
  } else {
    expected =
      MoonWaterRegime.SURFACE_ICE;
  }

  if (
    waterRegime !==
    expected
  ) {
    throw new RangeError(
      'MoonEnvironmentState waterRegime must match the frozen point-21.5 water potentials.',
    );
  }
}

function assertPositiveInteger(
  value:
    number,

  name:
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
      `${name} must be a positive integer.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  name:
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
      `${name} must be positive and finite.`,
    );
  }
}

function assertUnitInterval(
  value:
    number,

  name:
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
      `${name} must be finite in [0, 1].`,
    );
  }
}
