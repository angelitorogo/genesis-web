import { type MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonWaterPhaseInventory32F2a } from '../../domain/planetary/moon-water-phase-inventory-32-f-2a';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonRadiationProtection32F3 } from '../../domain/planetary/moon-radiation-protection-32-f-3';
import type { MoonGeochemicalEnergy32F4 } from '../../domain/planetary/moon-geochemical-energy-32-f-4';
import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import { PlanetaryHistoricalRuntime31Fi1 } from '../planetary-history/planetary-historical-runtime-31-f-i-1';
import { type MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import {
  type BodyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetScientificTargetResolver,
  type PlanetScientificRelevantMoonSource,
  type PlanetScientificResolvedTarget,
} from './planet-scientific-target-resolver';

export interface MoonScientificIdentitySource {
  readonly designation:
    string;

  readonly moonOrdinal:
    number;

  readonly moonIndex:
    number;

  readonly hostPlanetDesignation:
    string;

  readonly hostPlanetOrdinal:
    number;

  readonly hostPlanetType:
    string;

  readonly hostSystemDesignation:
    string;

  readonly hostMoonCount:
    number;

  readonly hostRelevantMoonCount:
    number;
}

export interface MoonScientificDetailSource {
  readonly general:
    Readonly<{
      massEarth: number;
      radiusEarth: number;
      meanDensityGramsPerCubicCentimeter: number;
      surfaceGravityEarth: number;
      giantHostSpecialization: boolean;
      giantMoonOrbitalFamily: string;
      giantMoonCompositionRegime: string;
      isLargeGiantMoon: boolean;
    }>;

  readonly orbit:
    Readonly<{
      semiMajorAxisPlanetRadii: number;
      semiMajorAxisKilometers: number;
      eccentricity: number;
      inclinationDegrees: number;
      orbitalPeriodDays: number;
      rocheLimitPlanetRadii: number;
      hillSphereRadiusPlanetRadii: number;
    }>;

  readonly tides:
    Readonly<{
      synchronousOrbitPlanetRadii: number;
      tidalForcingIndex01: number;
      tidalHeatingIndex01: number;
      tidalRegime: string;
      tidalLockingIndex01: number;
      tidalLockingRegime: string;
      rotationPeriodHours: number;
      migrationRegime: string;
      isTidallyLocked: boolean;
      isTidallyActiveGiantMoon: boolean;
    }>;

  readonly environment:
    Readonly<{
      referenceMeanInsolationEarth: number;
      inferredIceRichnessIndex01: number;
      inferredBondAlbedo01: number;
      equilibriumTemperatureKelvin: number;
      estimatedSurfaceTemperatureKelvin: number;
      atmosphereRetentionIndex01: number;
      atmosphereRegime: string;
      atmosphereAssessment?: MoonAtmosphereAssessment | null;
      internalWaterAssessment?: MoonInternalWaterAssessment | null;
      waterPhaseInventory32F2a?: MoonWaterPhaseInventory32F2a | null;
      interiorStructure32F2b?: MoonInteriorStructure32F2b | null;
      oceanReality32F2c?: MoonOceanReality32F2c | null;
      radiationProtection32F3?: MoonRadiationProtection32F3 | null;
      geochemicalEnergy32F4?: MoonGeochemicalEnergy32F4 | null;
      environmentalHistory32F5?: MoonEnvironmentalHistory32F5 | null;
      waterInventoryIndex01: number;
      subsurfaceOceanPotentialIndex01: number;
      surfaceLiquidWaterPotentialIndex01: number;
      waterRegime: string;
      internalHeatRetentionIndex01: number;
      geologicalActivityIndex01: number;
      geologyRegime: string;
      hasAtmosphere: boolean;
      hasWater: boolean;
      hasSubsurfaceOcean: boolean;
      hasSurfaceLiquidWater: boolean;
      isGeologicallyActive: boolean;
      isOceanBearingGiantMoonCandidate: boolean;
    }>;

  readonly habitability:
    Readonly<{
      surfaceTemperatureSupportIndex01: number;
      surfaceAtmosphereSupportIndex01: number;
      surfaceGravitySupportIndex01: number;
      tidalModerationIndex01: number;
      subsurfaceEnergySupportIndex01: number;
      surfaceHabitabilityIndex01: number;
      subsurfaceHabitabilityIndex01: number;
      overallHabitabilityIndex01: number;
      surfaceCandidate: boolean;
      subsurfaceCandidate: boolean;
      habitabilityRegime: string;
      isPotentiallyHabitable: boolean;
    }>;
}

export interface MoonScientificResolvedTarget {
  readonly identity:
    MoonScientificIdentitySource;

  readonly detail:
    MoonScientificDetailSource;
}

export interface MoonScientificPlanetResolver {
  resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificResolvedTarget | null;
}

const DEFAULT_PLANET_RESOLVER:
  MoonScientificPlanetResolver =
  Object.freeze({
    resolveDetailed(
      generationKey:
        UniverseGenerationKey,

      locator:
        BodyLocator,
    ): PlanetScientificResolvedTarget | null {
      return PlanetScientificTargetResolver
        .resolveDetailed(
          generationKey,
          locator,
        );
    },
  });

/**
 * Point-26.5 safe resolver for one individually characterized moon.
 *
 * The resolver deliberately reuses the point-26.4 planet projection, which has
 * already materialized the frozen phase-21 MoonSystem exactly once. Only moons
 * in the bounded relevant subset have a detailed point-21.3-21.7 scientific
 * payload; summarized minor moons therefore do not acquire invented detail.
 */
export class MoonScientificTargetResolver {

  private constructor() {}

  static resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    planetLocator:
      BodyLocator,

    moonIndex:
      bigint,

    planetResolver:
      MoonScientificPlanetResolver =
        DEFAULT_PLANET_RESOLVER,
  ): MoonScientificResolvedTarget | null {

    if (
      moonIndex <
        0n ||
      moonIndex >
        BigInt(
          Number.MAX_SAFE_INTEGER,
        )
    ) {
      return null;
    }

    const planetTarget =
      planetResolver.resolveDetailed(
        generationKey,
        planetLocator,
      );

    if (
      planetTarget ===
        null
    ) {
      return null;
    }

    const numericMoonIndex =
      Number(
        moonIndex,
      );

    const moonOrdinal =
      numericMoonIndex +
      1;

    const moon =
      planetTarget
        .detail
        .moons
        .relevantMoons
        .find(
          candidate =>
            candidate.moonOrdinal ===
              moonOrdinal &&
            candidate.moonIndex ===
              numericMoonIndex,
        ) ??
      null;

    if (
      moon ===
        null
    ) {
      return null;
    }

    return Object.freeze({
      identity:
        identityProjection(
          planetTarget,
          moon,
        ),
      detail:
        detailProjection(
          moon,
          PlanetaryHistoricalRuntime31Fi1.moonEnvironmentalHistory32F5(planetTarget, moonOrdinal),
        ),
    });
  }
}

function identityProjection(
  planetTarget:
    PlanetScientificResolvedTarget,

  moon:
    PlanetScientificRelevantMoonSource,
): MoonScientificIdentitySource {

  return Object.freeze({
    designation:
      moon.designation,
    moonOrdinal:
      moon.moonOrdinal,
    moonIndex:
      moon.moonIndex,
    hostPlanetDesignation:
      planetTarget.identity.designation,
    hostPlanetOrdinal:
      planetTarget.identity.planetOrdinal,
    hostPlanetType:
      planetTarget.detail.general.planetType,
    hostSystemDesignation:
      planetTarget.identity.hostSystemDesignation,
    hostMoonCount:
      planetTarget.detail.moons.moonCount,
    hostRelevantMoonCount:
      planetTarget.detail.moons.relevantMoonCount,
  });
}

function detailProjection(
  moon:
    PlanetScientificRelevantMoonSource,
  history32F5: MoonEnvironmentalHistory32F5 | null,
): MoonScientificDetailSource {

  return Object.freeze({
    general:
      Object.freeze({
        massEarth:
          moon.massEarth,
        radiusEarth:
          moon.radiusEarth,
        meanDensityGramsPerCubicCentimeter:
          moon.meanDensityGramsPerCubicCentimeter,
        surfaceGravityEarth:
          moon.surfaceGravityEarth,
        giantHostSpecialization:
          moon.giantHostSpecialization,
        giantMoonOrbitalFamily:
          moon.giantMoonOrbitalFamily,
        giantMoonCompositionRegime:
          moon.giantMoonCompositionRegime,
        isLargeGiantMoon:
          moon.isLargeGiantMoon,
      }),
    orbit:
      Object.freeze({
        semiMajorAxisPlanetRadii:
          moon.semiMajorAxisPlanetRadii,
        semiMajorAxisKilometers:
          moon.semiMajorAxisKilometers,
        eccentricity:
          moon.eccentricity,
        inclinationDegrees:
          moon.inclinationDegrees,
        orbitalPeriodDays:
          moon.orbitalPeriodDays,
        rocheLimitPlanetRadii:
          moon.rocheLimitPlanetRadii,
        hillSphereRadiusPlanetRadii:
          moon.hillSphereRadiusPlanetRadii,
      }),
    tides:
      Object.freeze({
        synchronousOrbitPlanetRadii:
          moon.synchronousOrbitPlanetRadii,
        tidalForcingIndex01:
          moon.tidalForcingIndex01,
        tidalHeatingIndex01:
          moon.tidalHeatingIndex01,
        tidalRegime:
          moon.tidalRegime,
        tidalLockingIndex01:
          moon.tidalLockingIndex01,
        tidalLockingRegime:
          moon.tidalLockingRegime,
        rotationPeriodHours:
          moon.rotationPeriodHours,
        migrationRegime:
          moon.migrationRegime,
        isTidallyLocked:
          moon.isTidallyLocked,
        isTidallyActiveGiantMoon:
          moon.isTidallyActiveGiantMoon,
      }),
    environment:
      Object.freeze({
        referenceMeanInsolationEarth:
          moon.referenceMeanInsolationEarth,
        inferredIceRichnessIndex01:
          moon.inferredIceRichnessIndex01,
        inferredBondAlbedo01:
          moon.inferredBondAlbedo01,
        equilibriumTemperatureKelvin:
          moon.equilibriumTemperatureKelvin,
        estimatedSurfaceTemperatureKelvin:
          moon.estimatedSurfaceTemperatureKelvin,
        atmosphereRetentionIndex01:
          moon.atmosphereRetentionIndex01,
        atmosphereRegime:
          moon.atmosphereRegime,
        atmosphereAssessment:
          moon.atmosphereAssessment ?? null,
        internalWaterAssessment:
          moon.internalWaterAssessment ?? null,
        waterPhaseInventory32F2a:
          moon.waterPhaseInventory32F2a ?? null,
        interiorStructure32F2b:
          moon.interiorStructure32F2b ?? null,
        oceanReality32F2c:
          moon.oceanReality32F2c ?? null,
        radiationProtection32F3:
          moon.radiationProtection32F3 ?? null,
        geochemicalEnergy32F4:
          moon.geochemicalEnergy32F4 ?? null,
        environmentalHistory32F5: history32F5,
        waterInventoryIndex01:
          moon.waterInventoryIndex01,
        subsurfaceOceanPotentialIndex01:
          moon.subsurfaceOceanPotentialIndex01,
        surfaceLiquidWaterPotentialIndex01:
          moon.surfaceLiquidWaterPotentialIndex01,
        waterRegime:
          moon.waterRegime,
        internalHeatRetentionIndex01:
          moon.internalHeatRetentionIndex01,
        geologicalActivityIndex01:
          moon.geologicalActivityIndex01,
        geologyRegime:
          moon.geologyRegime,
        hasAtmosphere:
          moon.hasAtmosphere,
        hasWater:
          moon.hasWater,
        hasSubsurfaceOcean:
          moon.hasSubsurfaceOcean,
        hasSurfaceLiquidWater:
          moon.hasSurfaceLiquidWater,
        isGeologicallyActive:
          moon.isGeologicallyActive,
        isOceanBearingGiantMoonCandidate:
          moon.isOceanBearingGiantMoonCandidate,
      }),
    habitability:
      Object.freeze({
        surfaceTemperatureSupportIndex01:
          moon.surfaceTemperatureSupportIndex01,
        surfaceAtmosphereSupportIndex01:
          moon.surfaceAtmosphereSupportIndex01,
        surfaceGravitySupportIndex01:
          moon.surfaceGravitySupportIndex01,
        tidalModerationIndex01:
          moon.tidalModerationIndex01,
        subsurfaceEnergySupportIndex01:
          moon.subsurfaceEnergySupportIndex01,
        surfaceHabitabilityIndex01:
          moon.surfaceHabitabilityIndex01,
        subsurfaceHabitabilityIndex01:
          moon.subsurfaceHabitabilityIndex01,
        overallHabitabilityIndex01:
          moon.overallHabitabilityIndex01,
        surfaceCandidate:
          moon.surfaceHabitabilityCandidate,
        subsurfaceCandidate:
          moon.subsurfaceHabitabilityCandidate,
        habitabilityRegime:
          moon.habitabilityRegime,
        isPotentiallyHabitable:
          moon.isPotentiallyHabitable,
      }),
  });
}
