import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  GalaxySectorGridGenerator,
} from '../sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../sector/galaxy-sector-stellar-population-properties-generator';

import {
  StellarPopulationProfileGenerator,
} from '../stellar/stellar-population-profile-generator';

import {
  StellarSystemGenerator,
} from '../stellar/stellar-system-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  AtmosphereGenerator,
} from './atmosphere-generator';

import {
  MoonGenerator,
} from './moon-generator';

import {
  PlanetGenerator,
} from './planet-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from './planetary-formation-maturation-generator';

import {
  PlanetarySystemGenerator,
} from './planetary-system-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from './protoplanetary-formation-snapshot-generator';

export interface PlanetScientificIdentitySource {
  readonly locator:
    BodyLocator;

  readonly planetOrdinal:
    number;

  readonly designation:
    string;

  readonly hostSystemDesignation:
    string;

  readonly orbitTopology:
    PlanetarySystemOrbitTopology;

  readonly hostPlanetCount:
    number;
}

export interface PlanetScientificGasSource {
  readonly gas:
    string;

  readonly moleFraction01:
    number;
}

export interface PlanetScientificRelevantMoonSource {
  readonly designation:
    string;

  readonly moonOrdinal:
    number;

  readonly massEarth:
    number;

  readonly radiusEarth:
    number;

  readonly meanDensityGramsPerCubicCentimeter:
    number;

  readonly surfaceGravityEarth:
    number;

  readonly semiMajorAxisPlanetRadii:
    number;

  readonly orbitalPeriodDays:
    number;

  readonly rotationPeriodHours:
    number;

  readonly isTidallyLocked:
    boolean;

  readonly estimatedSurfaceTemperatureKelvin:
    number;

  readonly atmosphereRegime:
    string;

  readonly waterRegime:
    string;

  readonly geologyRegime:
    string;

  readonly habitabilityRegime:
    string;

  readonly overallHabitabilityIndex01:
    number;

  readonly hasSubsurfaceOcean:
    boolean;

  readonly hasSurfaceLiquidWater:
    boolean;
}

export interface PlanetScientificDetailSource {
  readonly general:
    Readonly<{
      planetType: string;
      massEarth: number;
      radiusEarth: number;
      densityGramsPerCubicCentimeter: number;
      surfaceGravityEarth: number;
      surfaceGravityMetersPerSecondSquared: number;
      rotationPeriodHours: number;
      dayLengthHours: number | null;
      axialTiltDegrees: number;
      isRetrogradeRotation: boolean;
      isTidallySynchronized: boolean;
      referenceBondAlbedo01: number;
      isTypePhysicallyCoherent: boolean;
      metallicCoreMassFraction01: number;
      silicateInteriorMassFraction01: number;
      condensedIceMassFraction01: number;
      volatileRichInteriorMassFraction01: number;
      gaseousEnvelopeMassFraction01: number;
    }>;

  readonly orbit:
    Readonly<{
      semiMajorAxisAu: number;
      eccentricity: number;
      inclinationDegrees: number;
      periastronAu: number;
      apoastronAu: number;
      periodDays: number;
      periodYears: number;
      radiativeHabitableZoneRelation: string;
      dynamicallyAvailableHabitableZoneRelation: string | null;
      referenceMeanInsolationEarth: number;
      tidalHeatingProxy: number;
    }>;

  readonly surface:
    Readonly<{
      surfaceBaseRegime: string;
      hasDefinedSolidSurfaceBase: boolean;
      baseSolidSurfaceRoughness01: number | null;
      waterInventoryIndex01: number;
      waterPhaseRegime: string;
      surfaceWaterRegime: string;
      waterIceFraction01: number | null;
      waterLiquidFraction01: number | null;
      waterVaporFraction01: number | null;
      surfaceIceCoverageFraction01: number | null;
      surfaceLiquidWaterCoverageFraction01: number | null;
      hasPersistentSurfaceLiquidWater: boolean;
      surfaceRadiationRegime: string;
      surfaceRadiationProtectionRegime: string;
      surfaceRadiationExposureIndex01: number | null;
      surfaceRadiationProtectionIndex01: number | null;
      hasEffectiveSurfaceRadiationProtection: boolean;
    }>;

  readonly atmosphere:
    Readonly<{
      pressureRegime: string;
      retainedPressureRegime: string;
      retainedSurfacePressurePascal: number | null;
      retentionRegime: string;
      atmosphericInventoryRetentionFraction01: number;
      retainedReferenceDensityKilogramsPerCubicMeter: number;
      retainedMeanMolarMassGramsPerMole: number | null;
      greenhouseRegime: string;
      longwaveTrappingFraction01: number;
      isVacuum: boolean;
      isDeepEnvelope: boolean;
      retainedGasComposition: readonly PlanetScientificGasSource[];
    }>;

  readonly climate:
    Readonly<{
      equilibriumTemperatureKelvin: number;
      meanSurfaceTemperatureKelvin: number | null;
      greenhouseSurfaceWarmingKelvin: number | null;
      climateStabilityRegime: string;
      climateStabilityIndex01: number | null;
      seasonalTemperatureAmplitudeKelvin: number | null;
      diurnalTemperatureRangeKelvin: number | null;
      minimumSurfaceTemperatureKelvin: number | null;
      maximumSurfaceTemperatureKelvin: number | null;
      heatRedistributionEfficiency01: number;
    }>;

  readonly geology:
    Readonly<{
      geologyRegime: string;
      volcanismRegime: string;
      tectonicRegime: string;
      internalHeatRetentionIndex01: number | null;
      tidalHeatingIndex01: number | null;
      geologicalActivityIndex01: number | null;
      volcanismIndex01: number | null;
      tectonicMobilityIndex01: number | null;
      volatileOutgassingPotential01: number | null;
      surfaceRenewalPotential01: number | null;
      isGeologicallyActive: boolean;
      magneticFieldRegime: string;
      magnetosphereRegime: string;
      dynamoPotentialIndex01: number;
      intrinsicMagneticFieldIndex01: number;
      magnetosphericProtectionIndex01: number;
      hasSustainedDynamo: boolean;
    }>;

  readonly moons:
    Readonly<{
      moonCount: number;
      relevantMoonCount: number;
      unmaterializedMinorMoonCount: number;
      potentiallyHabitableMoonCount: number;
      surfaceHabitabilityCandidateCount: number;
      subsurfaceHabitabilityCandidateCount: number;
      relevantMoons: readonly PlanetScientificRelevantMoonSource[];
    }>;
}

export interface PlanetScientificResolvedTarget {
  readonly identity:
    PlanetScientificIdentitySource;

  readonly detail:
    PlanetScientificDetailSource;
}

interface Phase18PlanetTarget {
  readonly identity:
    PlanetScientificIdentitySource;

  readonly planetarySystem:
    ReturnType<typeof PlanetarySystemGenerator.generate>;
}

/**
 * Point-26.3/26.4 deterministic resolver for one mature planet.
 *
 * `resolve(...)` preserves the point-26.3 identity-only contract and stops at
 * the frozen phase-18 planetary-system boundary. `resolveDetailed(...)` is the
 * point-26.4 extension: after the caller has enforced the CONFIRMED host-system
 * boundary, it materializes the already-frozen phase-19 Planet plus the phase-20
 * atmosphere/environment aggregate and phase-21 moon system exactly once.
 *
 * The returned detail payload is a safe primitive projection. Domain objects,
 * generation keys and procedural seeds are deliberately not returned to the UI.
 */
export class PlanetScientificTargetResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificIdentitySource | null {

    return resolvePhase18Target(
      generationKey,
      locator,
    )?.identity ??
      null;
  }

  static resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    locator:
      BodyLocator,
  ): PlanetScientificResolvedTarget | null {

    const target =
      resolvePhase18Target(
        generationKey,
        locator,
      );

    if (
      target ===
        null
    ) {
      return null;
    }

    const planet =
      PlanetGenerator
        .generate(
          generationKey,
          target.planetarySystem,
          target.identity.locator,
        );

    const atmosphere =
      AtmosphereGenerator
        .generate(
          generationKey,
          planet,
        );

    const moonSystem =
      MoonGenerator
        .generate(
          generationKey,
          planet,
        );

    return Object.freeze({
      identity:
        target.identity,
      detail:
        Object.freeze({
          general:
            Object.freeze({
              planetType:
                planet.planetType,
              massEarth:
                planet.massEarth,
              radiusEarth:
                planet.radiusEarth,
              densityGramsPerCubicCentimeter:
                planet.densityGramsPerCubicCentimeter,
              surfaceGravityEarth:
                planet.surfaceGravityEarth,
              surfaceGravityMetersPerSecondSquared:
                planet.surfaceGravityMetersPerSecondSquared,
              rotationPeriodHours:
                planet.rotationPeriodHours,
              dayLengthHours:
                planet.dayLengthHours,
              axialTiltDegrees:
                planet.axialTiltDegrees,
              isRetrogradeRotation:
                planet.isRetrogradeRotation,
              isTidallySynchronized:
                planet.isTidallySynchronized,
              referenceBondAlbedo01:
                planet.referenceBondAlbedo01,
              isTypePhysicallyCoherent:
                planet.isTypePhysicallyCoherent,
              metallicCoreMassFraction01:
                planet.internalComposition.metallicCoreMassFraction01,
              silicateInteriorMassFraction01:
                planet.internalComposition.silicateInteriorMassFraction01,
              condensedIceMassFraction01:
                planet.internalComposition.condensedIceMassFraction01,
              volatileRichInteriorMassFraction01:
                planet.internalComposition.volatileRichInteriorMassFraction01,
              gaseousEnvelopeMassFraction01:
                planet.internalComposition.gaseousEnvelopeMassFraction01,
            }),
          orbit:
            Object.freeze({
              semiMajorAxisAu:
                planet.orbit.semiMajorAxisAu,
              eccentricity:
                planet.orbit.eccentricity,
              inclinationDegrees:
                planet.orbit.inclinationDegrees,
              periastronAu:
                planet.orbit.periastronAu,
              apoastronAu:
                planet.orbit.apoastronAu,
              periodDays:
                planet.orbitalPeriod.periodDays,
              periodYears:
                planet.orbitalPeriod.periodYears,
              radiativeHabitableZoneRelation:
                planet.habitableZoneClassification.radiativeRelation,
              dynamicallyAvailableHabitableZoneRelation:
                planet.habitableZoneClassification.dynamicallyAvailableRelation,
              referenceMeanInsolationEarth:
                planet.typeClassification.referenceMeanInsolationEarth,
              tidalHeatingProxy:
                planet.typeClassification.tidalHeatingProxy,
            }),
          surface:
            Object.freeze({
              surfaceBaseRegime:
                planet.surfaceBaseRegime,
              hasDefinedSolidSurfaceBase:
                planet.hasDefinedSolidSurfaceBase,
              baseSolidSurfaceRoughness01:
                planet.baseSolidSurfaceRoughness01,
              waterInventoryIndex01:
                atmosphere.waterInventoryIndex01,
              waterPhaseRegime:
                atmosphere.waterPhaseRegime,
              surfaceWaterRegime:
                atmosphere.surfaceWaterRegime,
              waterIceFraction01:
                atmosphere.waterIceFraction01,
              waterLiquidFraction01:
                atmosphere.waterLiquidFraction01,
              waterVaporFraction01:
                atmosphere.waterVaporFraction01,
              surfaceIceCoverageFraction01:
                atmosphere.surfaceIceCoverageFraction01,
              surfaceLiquidWaterCoverageFraction01:
                atmosphere.surfaceLiquidWaterCoverageFraction01,
              hasPersistentSurfaceLiquidWater:
                atmosphere.hasPersistentSurfaceLiquidWater,
              surfaceRadiationRegime:
                atmosphere.surfaceRadiationRegime,
              surfaceRadiationProtectionRegime:
                atmosphere.surfaceRadiationProtectionRegime,
              surfaceRadiationExposureIndex01:
                atmosphere.surfaceRadiationExposureIndex01,
              surfaceRadiationProtectionIndex01:
                atmosphere.surfaceRadiationProtectionIndex01,
              hasEffectiveSurfaceRadiationProtection:
                atmosphere.hasEffectiveSurfaceRadiationProtection,
            }),
          atmosphere:
            Object.freeze({
              pressureRegime:
                atmosphere.pressureRegime,
              retainedPressureRegime:
                atmosphere.retainedPressureRegime,
              retainedSurfacePressurePascal:
                atmosphere.retainedSurfacePressurePascal,
              retentionRegime:
                atmosphere.retentionRegime,
              atmosphericInventoryRetentionFraction01:
                atmosphere.atmosphericInventoryRetentionFraction01,
              retainedReferenceDensityKilogramsPerCubicMeter:
                atmosphere.retainedReferenceDensityKilogramsPerCubicMeter,
              retainedMeanMolarMassGramsPerMole:
                atmosphere.retainedMeanMolarMassGramsPerMole,
              greenhouseRegime:
                atmosphere.greenhouseRegime,
              longwaveTrappingFraction01:
                atmosphere.longwaveTrappingFraction01,
              isVacuum:
                atmosphere.isVacuum,
              isDeepEnvelope:
                atmosphere.isDeepEnvelope,
              retainedGasComposition:
                Object.freeze(
                  atmosphere
                    .retainedGasComposition
                    .map(
                      component =>
                        Object.freeze({
                          gas:
                            component.gas,
                          moleFraction01:
                            component.moleFraction01,
                        }),
                    ),
                ),
            }),
          climate:
            Object.freeze({
              equilibriumTemperatureKelvin:
                atmosphere.equilibriumTemperatureKelvin,
              meanSurfaceTemperatureKelvin:
                atmosphere.meanSurfaceTemperatureKelvin,
              greenhouseSurfaceWarmingKelvin:
                atmosphere.greenhouseSurfaceWarmingKelvin,
              climateStabilityRegime:
                atmosphere.climateStabilityRegime,
              climateStabilityIndex01:
                atmosphere.climateStabilityIndex01,
              seasonalTemperatureAmplitudeKelvin:
                atmosphere.seasonalTemperatureAmplitudeKelvin,
              diurnalTemperatureRangeKelvin:
                atmosphere.diurnalTemperatureRangeKelvin,
              minimumSurfaceTemperatureKelvin:
                atmosphere.minimumSurfaceTemperatureKelvin,
              maximumSurfaceTemperatureKelvin:
                atmosphere.maximumSurfaceTemperatureKelvin,
              heatRedistributionEfficiency01:
                atmosphere.heatRedistributionEfficiency01,
            }),
          geology:
            Object.freeze({
              geologyRegime:
                atmosphere.geologyRegime,
              volcanismRegime:
                atmosphere.volcanismRegime,
              tectonicRegime:
                atmosphere.tectonicRegime,
              internalHeatRetentionIndex01:
                atmosphere.internalHeatRetentionIndex01,
              tidalHeatingIndex01:
                atmosphere.tidalHeatingIndex01,
              geologicalActivityIndex01:
                atmosphere.geologicalActivityIndex01,
              volcanismIndex01:
                atmosphere.volcanismIndex01,
              tectonicMobilityIndex01:
                atmosphere.tectonicMobilityIndex01,
              volatileOutgassingPotential01:
                atmosphere.volatileOutgassingPotential01,
              surfaceRenewalPotential01:
                atmosphere.surfaceRenewalPotential01,
              isGeologicallyActive:
                atmosphere.isGeologicallyActive,
              magneticFieldRegime:
                atmosphere.magneticFieldRegime,
              magnetosphereRegime:
                atmosphere.magnetosphereRegime,
              dynamoPotentialIndex01:
                atmosphere.dynamoPotentialIndex01,
              intrinsicMagneticFieldIndex01:
                atmosphere.intrinsicMagneticFieldIndex01,
              magnetosphericProtectionIndex01:
                atmosphere.magnetosphericProtectionIndex01,
              hasSustainedDynamo:
                atmosphere.hasSustainedDynamo,
            }),
          moons:
            Object.freeze({
              moonCount:
                moonSystem.moonCount,
              relevantMoonCount:
                moonSystem.relevantMoonCount,
              unmaterializedMinorMoonCount:
                moonSystem.unmaterializedMinorMoonCount,
              potentiallyHabitableMoonCount:
                moonSystem.potentiallyHabitableMoonCount,
              surfaceHabitabilityCandidateCount:
                moonSystem.surfaceHabitabilityCandidateCount,
              subsurfaceHabitabilityCandidateCount:
                moonSystem.subsurfaceHabitabilityCandidateCount,
              relevantMoons:
                Object.freeze(
                  moonSystem
                    .relevantMoons
                    .map(
                      moon =>
                        Object.freeze({
                          designation:
                            moon.name,
                          moonOrdinal:
                            moon.moonOrdinal,
                          massEarth:
                            moon.massEarth,
                          radiusEarth:
                            moon.radiusEarth,
                          meanDensityGramsPerCubicCentimeter:
                            moon.meanDensityGramsPerCubicCentimeter,
                          surfaceGravityEarth:
                            moon.surfaceGravityEarth,
                          semiMajorAxisPlanetRadii:
                            moon.semiMajorAxisPlanetRadii,
                          orbitalPeriodDays:
                            moon.orbitalPeriodDays,
                          rotationPeriodHours:
                            moon.rotationPeriodHours,
                          isTidallyLocked:
                            moon.isTidallyLocked,
                          estimatedSurfaceTemperatureKelvin:
                            moon.environmentState.estimatedSurfaceTemperatureKelvin,
                          atmosphereRegime:
                            moon.atmosphereRegime,
                          waterRegime:
                            moon.waterRegime,
                          geologyRegime:
                            moon.geologyRegime,
                          habitabilityRegime:
                            moon.habitabilityRegime,
                          overallHabitabilityIndex01:
                            moon.overallHabitabilityIndex01,
                          hasSubsurfaceOcean:
                            moon.hasSubsurfaceOcean,
                          hasSurfaceLiquidWater:
                            moon.hasSurfaceLiquidWater,
                        }),
                    ),
                ),
            }),
        }),
    });
  }
}

function resolvePhase18Target(
  generationKey:
    UniverseGenerationKey,

  locator:
    BodyLocator,
): Phase18PlanetTarget | null {

  const systemLocator =
    new SystemLocator(
      locator.galaxyIndex,
      locator.sectorKey,
      locator.galacticObjectIndex,
    );

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      systemLocator.galaxyIndex,
    );

  const grid =
    GalaxySectorGridGenerator
      .generate(
        galaxy,
      );

  const stellarDensity =
    GalaxySectorStellarDensityGenerator
      .generate(
        galaxy,
        grid,
        GalaxySectorKeyCodec
          .decode(
            systemLocator.sectorKey,
          ),
      );

  const stellarPopulation =
    GalaxySectorStellarPopulationPropertiesGenerator
      .generate(
        galaxy,
        stellarDensity,
      );

  const stellarPopulationProfile =
    StellarPopulationProfileGenerator
      .generate(
        generationKey,
        galaxy.physicalProperties,
        stellarPopulation,
      );

  const stellarSystem =
    StellarSystemGenerator
      .generate(
        generationKey,
        systemLocator,
        stellarPopulation,
        stellarPopulationProfile,
      );

  const formationSnapshot =
    ProtoplanetaryFormationSnapshotGenerator
      .generateMaturationReferenceOrNull(
        generationKey,
        systemLocator,
      );

  if (
    formationSnapshot ===
      null
  ) {
    return null;
  }

  const formationBlueprint =
    PlanetaryFormationMaturationGenerator
      .generate(
        generationKey,
        formationSnapshot.systemSeed,
        formationSnapshot.diskProfile,
        formationSnapshot.diskStructure,
        formationSnapshot.planetFormationProfile,
        formationSnapshot.candidatePopulation,
        formationSnapshot.earlyDynamics,
      );

  const planetarySystem =
    PlanetarySystemGenerator
      .generate(
        generationKey,
        stellarSystem,
        formationBlueprint,
      );

  if (
    locator.bodyIndex <
      0n ||
    locator.bodyIndex >=
      BigInt(
        planetarySystem
          .planetCount,
      )
  ) {
    return null;
  }

  const index =
    Number(
      locator.bodyIndex,
    );

  const slot =
    planetarySystem
      .planetSlots[index];

  const designation =
    planetarySystem
      .planetDesignations[index];

  if (
    slot ===
      undefined ||
    designation ===
      undefined ||
    slot.bodyLocator.bodyIndex !==
      locator.bodyIndex
  ) {
    return null;
  }

  return Object.freeze({
    identity:
      Object.freeze({
        locator:
          slot.bodyLocator,
        planetOrdinal:
          slot.planetOrdinal,
        designation:
          designation.name,
        hostSystemDesignation:
          stellarSystem.designation.name,
        orbitTopology:
          planetarySystem
            .architecture
            .orbitTopology,
        hostPlanetCount:
          planetarySystem
            .planetCount,
      }),
    planetarySystem,
  });
}
