import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type AtmosphereGreenhouseEffect,
} from '../../domain/planetary/atmosphere-greenhouse-effect';

import {
  type AtmosphereRetentionState,
} from '../../domain/planetary/atmosphere-retention-state';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetClimateState,
} from '../../domain/planetary/planet-climate-state';

import {
  planetClimateStabilityRegimeForIndex01,
} from '../../domain/planetary/planet-climate-stability-regime';

import {
  PlanetClimateVariabilityState,
} from '../../domain/planetary/planet-climate-variability-state';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

const V1_PRESSURE_REDISTRIBUTION_HALF_PASCAL =
  50_000;

const V1_DEEP_ENVELOPE_HEAT_REDISTRIBUTION_EFFICIENCY =
  0.98;

const V1_OBLIQUITY_TEMPERATURE_AMPLITUDE_FRACTION =
  0.16;

const V1_DIURNAL_RANGE_FRACTION =
  0.70;

const CONSISTENCY_TOLERANCE =
  1e-9;

/**
 * Point-20.6 deterministic seasonal/extreme/stability climate refinement.
 *
 * V1 consumes zero PRNG draws and derives zero new seeds. It projects the
 * point-20.5 global mean into a coarse surface thermal envelope using the frozen
 * point-18 eccentricity, point-19.3 obliquity/day length and point-20.3/20.4
 * atmosphere heat-redistribution capacity. It is deliberately not a weather or
 * circulation model. Point 20.7 still owns actual water phase/coverage.
 */
export class ClimateVariabilityEngine {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    planet:
      Planet,

    retentionState:
      AtmosphereRetentionState,

    greenhouseEffect:
      AtmosphereGreenhouseEffect,

    climateState:
      PlanetClimateState,
  ): PlanetClimateVariabilityState {

    assertGenerationContext(
      generationKey,
      planet,
      retentionState,
      greenhouseEffect,
      climateState,
    );

    return generateVariabilityV1(
      planet,
      retentionState,
      greenhouseEffect,
      climateState,
    );
  }

  static generateAll(
    generationKey:
      UniverseGenerationKey,

    planetarySystem:
      PlanetarySystem,

    planets:
      readonly Planet[],

    retentionStates:
      readonly AtmosphereRetentionState[],

    greenhouseEffects:
      readonly AtmosphereGreenhouseEffect[],

    climateStates:
      readonly PlanetClimateState[],
  ): readonly PlanetClimateVariabilityState[] {

    if (
      !generationKey.equals(
        planetarySystem.generationKey,
      )
    ) {
      throw new RangeError(
        'ClimateVariabilityEngine requires the PlanetarySystem to share the supplied UniverseGenerationKey.',
      );
    }

    const expectedCount =
      planetarySystem.planetCount;

    if (
      planets.length !==
        expectedCount ||
      retentionStates.length !==
        expectedCount ||
      greenhouseEffects.length !==
        expectedCount ||
      climateStates.length !==
        expectedCount
    ) {
      throw new RangeError(
        'ClimateVariabilityEngine.generateAll requires one Planet and one point-20.3/20.4/20.5 state for every mature planet.',
      );
    }

    return Object.freeze(
      planets.map(
        (
          planet,
          index,
        ) => {
          if (
            planet.hostPlanetarySystem !==
              planetarySystem ||
            planet.planetOrdinal !==
              index +
                1
          ) {
            throw new RangeError(
              'ClimateVariabilityEngine.generateAll requires Planets from the exact supplied system in frozen planetOrdinal order.',
            );
          }

          assertGenerationContext(
            generationKey,
            planet,
            retentionStates[index],
            greenhouseEffects[index],
            climateStates[index],
          );

          return generateVariabilityV1(
            planet,
            retentionStates[index],
            greenhouseEffects[index],
            climateStates[index],
          );
        },
      ),
    );
  }
}

function generateVariabilityV1(
  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  greenhouseEffect:
    AtmosphereGreenhouseEffect,

  climateState:
    PlanetClimateState,
): PlanetClimateVariabilityState {

  const eccentricity =
    planet.orbit.eccentricity;

  const axialTiltDegrees =
    planet.axialTiltDegrees;

  const rotationPeriodHours =
    planet.rotationPeriodHours;

  const dayLengthHours =
    planet.dayLengthHours;

  const effectiveAxialTiltDegrees =
    Math.min(
      axialTiltDegrees,
      180 -
        axialTiltDegrees,
    );

  const axialSeasonalityFactor01 =
    clamp01(
      Math.sin(
        effectiveAxialTiltDegrees *
          Math.PI /
          180,
      ),
    );

  const eccentricitySeasonalityFactor01 =
    clamp01(
      eccentricity /
        0.35,
    );

  const isDeepEnvelope =
    climateState.meanSurfaceTemperatureKelvin ===
    null;

  const heatRedistributionEfficiency01 =
    isDeepEnvelope
      ? V1_DEEP_ENVELOPE_HEAT_REDISTRIBUTION_EFFICIENCY
      : heatRedistributionEfficiencyV1(
          retentionState.retainedSurfacePressurePascal!,
          greenhouseEffect.longwaveTrappingFraction01,
          dayLengthHours,
        );

  if (
    isDeepEnvelope
  ) {
    return new PlanetClimateVariabilityState(
      planet.planetOrdinal,
      planet.locator,
      planet.seed,
      climateState.equilibriumTemperatureKelvin,
      null,
      eccentricity,
      axialTiltDegrees,
      rotationPeriodHours,
      dayLengthHours,
      null,
      greenhouseEffect.longwaveTrappingFraction01,
      axialSeasonalityFactor01,
      eccentricitySeasonalityFactor01,
      heatRedistributionEfficiency01,
      null,
      null,
      null,
      null,
      null,
      planetClimateStabilityRegimeForIndex01(
        null,
        true,
      ),
    );
  }

  const meanSurfaceTemperatureKelvin =
    climateState.meanSurfaceTemperatureKelvin!;

  const orbitalColdBaselineKelvin =
    meanSurfaceTemperatureKelvin /
    Math.sqrt(
      1 +
        eccentricity,
    );

  const orbitalHotBaselineKelvin =
    meanSurfaceTemperatureKelvin /
    Math.sqrt(
      1 -
        eccentricity,
    );

  const eccentricityHalfRangeKelvin =
    (
      orbitalHotBaselineKelvin -
      orbitalColdBaselineKelvin
    ) /
    2;

  const obliquityAmplitudeKelvin =
    meanSurfaceTemperatureKelvin *
    V1_OBLIQUITY_TEMPERATURE_AMPLITUDE_FRACTION *
    axialSeasonalityFactor01 *
    (
      1 -
      0.70 *
        heatRedistributionEfficiency01
    );

  const seasonalTemperatureAmplitudeKelvin =
    eccentricityHalfRangeKelvin +
    obliquityAmplitudeKelvin;

  const diurnalExposureFactor01 =
    diurnalExposureFactorV1(
      dayLengthHours,
    );

  const diurnalTemperatureRangeKelvin =
    meanSurfaceTemperatureKelvin *
    V1_DIURNAL_RANGE_FRACTION *
    (
      1 -
      heatRedistributionEfficiency01
    ) *
    diurnalExposureFactor01;

  const diurnalHalfRangeKelvin =
    diurnalTemperatureRangeKelvin /
    2;

  const rawMinimumSurfaceTemperatureKelvin =
    orbitalColdBaselineKelvin -
    obliquityAmplitudeKelvin -
    diurnalHalfRangeKelvin;

  const rawMaximumSurfaceTemperatureKelvin =
    orbitalHotBaselineKelvin +
    obliquityAmplitudeKelvin +
    diurnalHalfRangeKelvin;

  /*
   * Point-20.6 regression guard: the old absolute 1 K floor could push the
   * minimum above a valid but sub-kelvin point-20.5 mean in extremely cold
   * generated systems. Clamp the lower estimate to a positive floor that can
   * never exceed the authoritative mean, and explicitly bracket the upper
   * estimate as well. Ordinary climates are byte-for-byte numerically
   * unchanged because their raw extrema already bracket the mean.
   */
  const minimumSurfaceTemperatureKelvin =
    Math.min(
      meanSurfaceTemperatureKelvin,
      Math.max(
        Math.min(
          1,
          meanSurfaceTemperatureKelvin,
        ),
        rawMinimumSurfaceTemperatureKelvin,
      ),
    );

  const maximumSurfaceTemperatureKelvin =
    Math.max(
      meanSurfaceTemperatureKelvin,
      rawMaximumSurfaceTemperatureKelvin,
    );

  const approximateRangeKelvin =
    maximumSurfaceTemperatureKelvin -
    minimumSurfaceTemperatureKelvin;

  const relativeRange =
    approximateRangeKelvin /
    meanSurfaceTemperatureKelvin;

  const variabilityMagnitude01 =
    clamp01(
      relativeRange /
        1.20,
    );

  const synchronizationPenalty01 =
    dayLengthHours ===
      null
      ? 1
      : 0;

  const forcingSeverity01 =
    clamp01(
      0.25 *
        eccentricitySeasonalityFactor01 +
      0.20 *
        axialSeasonalityFactor01 *
        (
          1 -
          heatRedistributionEfficiency01
        ) +
      0.25 *
        diurnalExposureFactor01 *
        (
          1 -
          heatRedistributionEfficiency01
        ) +
      0.30 *
        synchronizationPenalty01 *
        (
          1 -
          heatRedistributionEfficiency01
        ),
    );

  const stabilityIndex01 =
    clamp01(
      1 -
      0.65 *
        variabilityMagnitude01 -
      0.35 *
        forcingSeverity01,
    );

  return new PlanetClimateVariabilityState(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    climateState.equilibriumTemperatureKelvin,
    meanSurfaceTemperatureKelvin,
    eccentricity,
    axialTiltDegrees,
    rotationPeriodHours,
    dayLengthHours,
    retentionState.retainedSurfacePressurePascal,
    greenhouseEffect.longwaveTrappingFraction01,
    axialSeasonalityFactor01,
    eccentricitySeasonalityFactor01,
    heatRedistributionEfficiency01,
    seasonalTemperatureAmplitudeKelvin,
    diurnalTemperatureRangeKelvin,
    minimumSurfaceTemperatureKelvin,
    maximumSurfaceTemperatureKelvin,
    stabilityIndex01,
    planetClimateStabilityRegimeForIndex01(
      stabilityIndex01,
      false,
    ),
  );
}

function heatRedistributionEfficiencyV1(
  retainedSurfacePressurePascal:
    number,

  longwaveTrappingFraction01:
    number,

  dayLengthHours:
    number | null,
): number {

  if (
    retainedSurfacePressurePascal <=
    CONSISTENCY_TOLERANCE
  ) {
    return 0;
  }

  const pressureFactor01 =
    retainedSurfacePressurePascal /
    (
      retainedSurfacePressurePascal +
      V1_PRESSURE_REDISTRIBUTION_HALF_PASCAL
    );

  const rotationSupport01 =
    dayLengthHours ===
      null
      ? 0.15
      : clamp01(
          1 -
          Math.log10(
            Math.max(
              1,
              dayLengthHours /
                24,
            ),
          ) /
          2.5,
        );

  return clamp01(
    pressureFactor01 *
    (
      0.55 +
      0.25 *
        longwaveTrappingFraction01 +
      0.20 *
        rotationSupport01
    ),
  );
}

function diurnalExposureFactorV1(
  dayLengthHours:
    number | null,
): number {

  if (
    dayLengthHours ===
    null
  ) {
    return 1;
  }

  const ratio =
    Math.max(
      0,
      dayLengthHours /
        24,
    );

  return clamp01(
    0.20 +
    0.80 *
      Math.log10(
        1 +
          ratio,
      ) /
      Math.log10(
        101,
      ),
  );
}

function assertGenerationContext(
  generationKey:
    UniverseGenerationKey,

  planet:
    Planet,

  retentionState:
    AtmosphereRetentionState,

  greenhouseEffect:
    AtmosphereGreenhouseEffect,

  climateState:
    PlanetClimateState,
): void {

  if (
    generationKey.generatorVersion !==
      GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  if (
    !generationKey.equals(
      planet.generationKey,
    )
  ) {
    throw new RangeError(
      'ClimateVariabilityEngine requires the Planet to share the supplied UniverseGenerationKey.',
    );
  }

  if (
    !planet.isTypePhysicallyCoherent
  ) {
    throw new RangeError(
      'ClimateVariabilityEngine requires a point-19.7 physically coherent Planet.',
    );
  }

  assertIdentity(
    planet,
    retentionState,
    'point-20.3 retention state',
  );

  assertIdentity(
    planet,
    greenhouseEffect,
    'point-20.4 greenhouse effect',
  );

  assertIdentity(
    planet,
    climateState,
    'point-20.5 climate state',
  );

  if (
    greenhouseEffect.sourceRetentionRegime !==
      retentionState.retentionRegime ||
    !approximatelyEqual(
      greenhouseEffect.sourceReferenceMeanInsolationEarth,
      retentionState.sourceReferenceMeanInsolationEarth,
    ) ||
    !approximatelyEqual(
      greenhouseEffect.sourceReferenceBondAlbedo01,
      retentionState.sourceReferenceBondAlbedo01,
    )
  ) {
    throw new RangeError(
      'ClimateVariabilityEngine requires the exact point-20.3 -> point-20.4 atmospheric handoff.',
    );
  }

  if (
    climateState.sourceGreenhouseRegime !==
      greenhouseEffect.regime ||
    !approximatelyEqual(
      climateState.sourceInfraredOpticalDepthProxy,
      greenhouseEffect.infraredOpticalDepthProxy,
    ) ||
    !approximatelyEqual(
      climateState.sourceReferenceMeanInsolationEarth,
      greenhouseEffect.sourceReferenceMeanInsolationEarth,
    ) ||
    !approximatelyEqual(
      climateState.sourceReferenceBondAlbedo01,
      greenhouseEffect.sourceReferenceBondAlbedo01,
    )
  ) {
    throw new RangeError(
      'ClimateVariabilityEngine requires the exact point-20.4 -> point-20.5 thermal handoff.',
    );
  }

  const deepEnvelope =
    climateState.meanSurfaceTemperatureKelvin ===
    null;

  if (
    deepEnvelope !==
      (
        retentionState.retainedSurfacePressurePascal ===
        null
      )
  ) {
    throw new RangeError(
      'ClimateVariabilityEngine requires point-20.3 retained-pressure and point-20.5 solid-surface semantics to agree.',
    );
  }
}

function assertIdentity(
  planet:
    Planet,

  product: {
    readonly planetOrdinal:
      number;
    readonly bodyLocator:
      Planet['locator'];
    readonly bodySeed:
      Planet['seed'];
  },

  productName:
    string,
): void {

  if (
    product.planetOrdinal !==
      planet.planetOrdinal ||
    product.bodyLocator.galaxyIndex !==
      planet.locator.galaxyIndex ||
    product.bodyLocator.sectorKey !==
      planet.locator.sectorKey ||
    product.bodyLocator.galacticObjectIndex !==
      planet.locator.galacticObjectIndex ||
    product.bodyLocator.bodyIndex !==
      planet.locator.bodyIndex ||
    product.bodySeed.normalizedValue !==
      planet.seed.normalizedValue
  ) {
    throw new RangeError(
      `ClimateVariabilityEngine requires the ${productName} to preserve the exact Planet identity.`,
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

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  return Math.abs(
    left -
      right,
  ) <=
    CONSISTENCY_TOLERANCE *
      Math.max(
        1,
        Math.abs(left),
        Math.abs(right),
      );
}
