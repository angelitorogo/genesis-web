import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetSurfaceWaterRegime,
  planetSurfaceWaterRegimeForCoverage01,
} from './planet-surface-water-regime';

import {
  PlanetWaterPhaseRegime,
  planetWaterPhaseRegimeForFractions01,
} from './planet-water-phase-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.7 deterministic water/hydrosphere state for one mature Planet.
 *
 * waterInventoryIndex01 is deliberately dimensionless: phase 20 has enough
 * information to estimate relative water availability and surface expression,
 * but not enough to claim an exact ocean mass before point-20.8 geology and
 * volatile cycling exist. Phase fractions describe the modeled accessible water
 * inventory. Surface coverage values describe representative exposed solid-
 * surface coverage and therefore remain null for deep-envelope planets.
 */
export class PlanetWaterInventory {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourcePlanetType:
      PlanetType,

    readonly sourceIceBearingInteriorFraction01:
      number,

    readonly sourceRetainedSurfacePressurePascal:
      number | null,

    readonly sourceRetainedAtmosphericWaterVaporMoleFraction01:
      number,

    readonly sourceMeanSurfaceTemperatureKelvin:
      number | null,

    readonly sourceMinimumSurfaceTemperatureKelvin:
      number | null,

    readonly sourceMaximumSurfaceTemperatureKelvin:
      number | null,

    readonly sourceClimateStabilityIndex01:
      number | null,

    readonly waterInventoryIndex01:
      number,

    readonly iceFraction01:
      number | null,

    readonly liquidFraction01:
      number | null,

    readonly vaporFraction01:
      number | null,

    readonly surfaceIceCoverageFraction01:
      number | null,

    readonly surfaceLiquidWaterCoverageFraction01:
      number | null,

    readonly phaseRegime:
      PlanetWaterPhaseRegime,

    readonly surfaceWaterRegime:
      PlanetSurfaceWaterRegime,

    readonly hasPersistentSurfaceLiquidWater:
      boolean,
  ) {
    if (
      !Number.isInteger(
        planetOrdinal,
      ) ||
      planetOrdinal <=
        0
    ) {
      throw new RangeError(
        'planetOrdinal must be a positive integer.',
      );
    }

    if (
      bodyLocator.bodyIndex !==
      BigInt(
        planetOrdinal -
          1,
      )
    ) {
      throw new RangeError(
        'Point-20.7 water inventory must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetWaterInventory requires a BodySeed.',
      );
    }

    if (
      !Object.values(
        PlanetType,
      ).includes(
        sourcePlanetType,
      )
    ) {
      throw new RangeError(
        'sourcePlanetType must be a known PlanetType.',
      );
    }

    assertNormalized(
      sourceIceBearingInteriorFraction01,
      'sourceIceBearingInteriorFraction01',
    );

    assertNormalized(
      sourceRetainedAtmosphericWaterVaporMoleFraction01,
      'sourceRetainedAtmosphericWaterVaporMoleFraction01',
    );

    assertNormalized(
      waterInventoryIndex01,
      'waterInventoryIndex01',
    );

    const isDeepEnvelope =
      sourceRetainedSurfacePressurePascal ===
      null;

    if (
      isDeepEnvelope
    ) {
      if (
        sourceMeanSurfaceTemperatureKelvin !==
          null ||
        sourceMinimumSurfaceTemperatureKelvin !==
          null ||
        sourceMaximumSurfaceTemperatureKelvin !==
          null ||
        sourceClimateStabilityIndex01 !==
          null ||
        iceFraction01 !==
          null ||
        liquidFraction01 !==
          null ||
        vaporFraction01 !==
          null ||
        surfaceIceCoverageFraction01 !==
          null ||
        surfaceLiquidWaterCoverageFraction01 !==
          null ||
        phaseRegime !==
          PlanetWaterPhaseRegime.DEEP_ENVELOPE ||
        surfaceWaterRegime !==
          PlanetSurfaceWaterRegime.DEEP_ENVELOPE ||
        hasPersistentSurfaceLiquidWater
      ) {
        throw new RangeError(
          'Point-20.7 deep-envelope water state requires null solid-surface climate/phases/coverage, DEEP_ENVELOPE regimes and no persistent surface liquid-water claim.',
        );
      }

      return;
    }

    assertNonNegativeFinite(
      sourceRetainedSurfacePressurePascal,
      'sourceRetainedSurfacePressurePascal',
    );

    assertPositiveFinite(
      sourceMeanSurfaceTemperatureKelvin,
      'sourceMeanSurfaceTemperatureKelvin',
    );

    assertPositiveFinite(
      sourceMinimumSurfaceTemperatureKelvin,
      'sourceMinimumSurfaceTemperatureKelvin',
    );

    assertPositiveFinite(
      sourceMaximumSurfaceTemperatureKelvin,
      'sourceMaximumSurfaceTemperatureKelvin',
    );

    if (
      sourceMinimumSurfaceTemperatureKelvin! >
        sourceMeanSurfaceTemperatureKelvin! ||
      sourceMaximumSurfaceTemperatureKelvin! <
        sourceMeanSurfaceTemperatureKelvin! ||
      sourceMinimumSurfaceTemperatureKelvin! >
        sourceMaximumSurfaceTemperatureKelvin!
    ) {
      throw new RangeError(
        'Point-20.7 source surface temperatures must preserve the point-20.6 extrema around the point-20.5 mean.',
      );
    }

    assertNormalized(
      sourceClimateStabilityIndex01,
      'sourceClimateStabilityIndex01',
    );

    assertNormalized(
      iceFraction01,
      'iceFraction01',
    );

    assertNormalized(
      liquidFraction01,
      'liquidFraction01',
    );

    assertNormalized(
      vaporFraction01,
      'vaporFraction01',
    );

    const phaseTotal =
      iceFraction01! +
      liquidFraction01! +
      vaporFraction01!;

    if (
      waterInventoryIndex01 <=
      CONSISTENCY_TOLERANCE
    ) {
      if (
        phaseTotal >
          CONSISTENCY_TOLERANCE ||
        phaseRegime !==
          PlanetWaterPhaseRegime.NONE
      ) {
        throw new RangeError(
          'A zero point-20.7 water inventory requires zero phase fractions and NONE phase regime.',
        );
      }
    } else if (
      Math.abs(
        phaseTotal -
        1,
      ) >
      CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'A non-zero point-20.7 water inventory requires ice/liquid/vapor fractions that sum to 1.',
      );
    }

    const expectedPhaseRegime =
      planetWaterPhaseRegimeForFractions01(
        iceFraction01,
        liquidFraction01,
        vaporFraction01,
        false,
      );

    if (
      phaseRegime !==
      expectedPhaseRegime
    ) {
      throw new RangeError(
        'phaseRegime must match the frozen point-20.7 phase-fraction classifier.',
      );
    }

    assertNormalized(
      surfaceIceCoverageFraction01,
      'surfaceIceCoverageFraction01',
    );

    assertNormalized(
      surfaceLiquidWaterCoverageFraction01,
      'surfaceLiquidWaterCoverageFraction01',
    );

    if (
      surfaceIceCoverageFraction01! +
        surfaceLiquidWaterCoverageFraction01! >
      1 +
        CONSISTENCY_TOLERANCE
    ) {
      throw new RangeError(
        'Point-20.7 representative surface ice and liquid-water coverage cannot exceed the whole solid surface.',
      );
    }

    if (
      liquidFraction01 ===
        0 &&
      surfaceLiquidWaterCoverageFraction01 !==
        0
    ) {
      throw new RangeError(
        'Point-20.7 liquid surface coverage must be zero when the modeled liquid phase fraction is zero.',
      );
    }

    const expectedSurfaceRegime =
      planetSurfaceWaterRegimeForCoverage01(
        surfaceLiquidWaterCoverageFraction01,
        false,
      );

    if (
      surfaceWaterRegime !==
      expectedSurfaceRegime
    ) {
      throw new RangeError(
        'surfaceWaterRegime must match the frozen point-20.7 liquid-water coverage thresholds.',
      );
    }

    if (
      hasPersistentSurfaceLiquidWater &&
      (
        surfaceLiquidWaterCoverageFraction01! <=
          0 ||
        liquidFraction01! <=
          0 ||
        sourceClimateStabilityIndex01! <
          0.35
      )
    ) {
      throw new RangeError(
        'Persistent point-20.7 surface liquid water requires non-zero liquid coverage and at least the point-20.6 STRONGLY_VARIABLE stability boundary.',
      );
    }
  }

  get hasAnyModeledWater():
    boolean {

    return this
      .waterInventoryIndex01 >
      CONSISTENCY_TOLERANCE;
  }

  get hasSurfaceLiquidWater():
    boolean {

    return (
      this
        .surfaceLiquidWaterCoverageFraction01 ??
      0
    ) >
    0;
  }

  get hasSurfaceIce():
    boolean {

    return (
      this
        .surfaceIceCoverageFraction01 ??
      0
    ) >
    0;
  }
}

function assertPositiveFinite(
  value:
    number | null,

  propertyName:
    string,
): void {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and greater than 0.`,
    );
  }
}

function assertNonNegativeFinite(
  value:
    number | null,

  propertyName:
    string,
): void {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and non-negative.`,
    );
  }
}

function assertNormalized(
  value:
    number | null,

  propertyName:
    string,
): void {

  if (
    value ===
      null ||
    !Number.isFinite(
      value,
    ) ||
    value <
      -CONSISTENCY_TOLERANCE ||
    value >
      1 +
        CONSISTENCY_TOLERANCE
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in [0, 1].`,
    );
  }
}
