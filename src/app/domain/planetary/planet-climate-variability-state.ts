import {
  type BodyLocator,
} from '../generation/procedural-locator';

import {
  type BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetClimateStabilityRegime,
  planetClimateStabilityRegimeForIndex01,
} from './planet-climate-stability-regime';

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.6 seasonal/diurnal variability and thermal-stability projection.
 *
 * The extrema are coarse global surface-envelope bounds, not local weather
 * forecasts. They combine the frozen point-20.5 mean thermal baseline with
 * point-18 eccentricity, point-19.3 spin/obliquity and the retained atmosphere's
 * ability to redistribute heat. Deep-envelope worlds deliberately keep all
 * solid-surface extrema and the stability index null.
 */
export class PlanetClimateVariabilityState {

  constructor(
    readonly planetOrdinal:
      number,

    readonly bodyLocator:
      BodyLocator,

    readonly bodySeed:
      BodySeed,

    readonly sourceEquilibriumTemperatureKelvin:
      number,

    readonly sourceMeanSurfaceTemperatureKelvin:
      number | null,

    readonly sourceOrbitalEccentricity:
      number,

    readonly sourceAxialTiltDegrees:
      number,

    readonly sourceRotationPeriodHours:
      number,

    readonly sourceDayLengthHours:
      number | null,

    readonly sourceRetainedSurfacePressurePascal:
      number | null,

    readonly sourceLongwaveTrappingFraction01:
      number,

    readonly axialSeasonalityFactor01:
      number,

    readonly eccentricitySeasonalityFactor01:
      number,

    readonly heatRedistributionEfficiency01:
      number,

    readonly seasonalTemperatureAmplitudeKelvin:
      number | null,

    readonly diurnalTemperatureRangeKelvin:
      number | null,

    readonly minimumSurfaceTemperatureKelvin:
      number | null,

    readonly maximumSurfaceTemperatureKelvin:
      number | null,

    readonly stabilityIndex01:
      number | null,

    readonly stabilityRegime:
      PlanetClimateStabilityRegime,
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
        'Point-20.6 climate variability must use the BodyLocator belonging to planetOrdinal.',
      );
    }

    if (
      bodySeed.kind !==
      'body'
    ) {
      throw new RangeError(
        'PlanetClimateVariabilityState requires a BodySeed.',
      );
    }

    assertPositiveFinite(
      sourceEquilibriumTemperatureKelvin,
      'sourceEquilibriumTemperatureKelvin',
    );

    if (
      sourceMeanSurfaceTemperatureKelvin !==
      null
    ) {
      assertPositiveFinite(
        sourceMeanSurfaceTemperatureKelvin,
        'sourceMeanSurfaceTemperatureKelvin',
      );
    }

    if (
      !Number.isFinite(
        sourceOrbitalEccentricity,
      ) ||
      sourceOrbitalEccentricity <
        0 ||
      sourceOrbitalEccentricity >=
        1
    ) {
      throw new RangeError(
        'sourceOrbitalEccentricity must be finite and in [0, 1).',
      );
    }

    if (
      !Number.isFinite(
        sourceAxialTiltDegrees,
      ) ||
      sourceAxialTiltDegrees <
        0 ||
      sourceAxialTiltDegrees >
        180
    ) {
      throw new RangeError(
        'sourceAxialTiltDegrees must be finite and in [0, 180].',
      );
    }

    assertPositiveFinite(
      sourceRotationPeriodHours,
      'sourceRotationPeriodHours',
    );

    if (
      sourceDayLengthHours !==
      null
    ) {
      assertPositiveFinite(
        sourceDayLengthHours,
        'sourceDayLengthHours',
      );
    }

    if (
      sourceRetainedSurfacePressurePascal !==
      null
    ) {
      assertNonNegativeFinite(
        sourceRetainedSurfacePressurePascal,
        'sourceRetainedSurfacePressurePascal',
      );
    }

    assertNormalized(
      sourceLongwaveTrappingFraction01,
      'sourceLongwaveTrappingFraction01',
    );

    assertNormalized(
      axialSeasonalityFactor01,
      'axialSeasonalityFactor01',
    );

    assertNormalized(
      eccentricitySeasonalityFactor01,
      'eccentricitySeasonalityFactor01',
    );

    assertNormalized(
      heatRedistributionEfficiency01,
      'heatRedistributionEfficiency01',
    );

    const isDeepEnvelope =
      sourceMeanSurfaceTemperatureKelvin ===
      null;

    if (
      isDeepEnvelope
    ) {
      if (
        sourceRetainedSurfacePressurePascal !==
          null ||
        seasonalTemperatureAmplitudeKelvin !==
          null ||
        diurnalTemperatureRangeKelvin !==
          null ||
        minimumSurfaceTemperatureKelvin !==
          null ||
        maximumSurfaceTemperatureKelvin !==
          null ||
        stabilityIndex01 !==
          null ||
        stabilityRegime !==
          PlanetClimateStabilityRegime.DEEP_ENVELOPE
      ) {
        throw new RangeError(
          'Point-20.6 deep-envelope climate variability requires null solid-surface pressure/extrema/stability index and DEEP_ENVELOPE regime.',
        );
      }
    } else {
      assertNonNegativeFinite(
        seasonalTemperatureAmplitudeKelvin,
        'seasonalTemperatureAmplitudeKelvin',
      );

      assertNonNegativeFinite(
        diurnalTemperatureRangeKelvin,
        'diurnalTemperatureRangeKelvin',
      );

      assertPositiveFinite(
        minimumSurfaceTemperatureKelvin,
        'minimumSurfaceTemperatureKelvin',
      );

      assertPositiveFinite(
        maximumSurfaceTemperatureKelvin,
        'maximumSurfaceTemperatureKelvin',
      );

      if (
        minimumSurfaceTemperatureKelvin! >
        sourceMeanSurfaceTemperatureKelvin! ||
        maximumSurfaceTemperatureKelvin! <
        sourceMeanSurfaceTemperatureKelvin! ||
        minimumSurfaceTemperatureKelvin! >
        maximumSurfaceTemperatureKelvin!
      ) {
        throw new RangeError(
          'Point-20.6 surface extrema must bracket the point-20.5 mean surface temperature.',
        );
      }

      assertNormalized(
        stabilityIndex01,
        'stabilityIndex01',
      );

      const expectedRegime =
        planetClimateStabilityRegimeForIndex01(
          stabilityIndex01!,
          false,
        );

      if (
        stabilityRegime !==
        expectedRegime
      ) {
        throw new RangeError(
          'stabilityRegime must match the frozen point-20.6 stability-index thresholds.',
        );
      }
    }
  }

  get hasDefinedSolidSurfaceExtremes():
    boolean {

    return this
      .minimumSurfaceTemperatureKelvin !==
      null;
  }

  get approximateSurfaceTemperatureRangeKelvin():
    number | null {

    if (
      this.minimumSurfaceTemperatureKelvin ===
        null ||
      this.maximumSurfaceTemperatureKelvin ===
        null
    ) {
      return null;
    }

    return this
      .maximumSurfaceTemperatureKelvin -
      this
        .minimumSurfaceTemperatureKelvin;
  }

  get isTidallySynchronizedClimate():
    boolean {

    return this
      .sourceDayLengthHours ===
      null;
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
