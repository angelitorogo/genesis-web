import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

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
  AsteroidBeltGenerator,
} from './asteroid-belt-generator';

import {
  CometActivityEngine,
} from './comet-activity-engine';

import {
  CometGenerator,
} from './comet-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from './planetary-formation-maturation-generator';

import {
  PlanetarySystemGenerator,
} from './planetary-system-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from './protoplanetary-formation-snapshot-generator';

export const MinorBodyScientificTargetKind =
  Object.freeze({
    ASTEROID:
      'asteroid',
    COMET:
      'comet',
  } as const);

export type MinorBodyScientificTargetKind =
  typeof MinorBodyScientificTargetKind[
    keyof typeof MinorBodyScientificTargetKind
  ];

export interface MinorBodyScientificIdentitySource {
  readonly kind:
    MinorBodyScientificTargetKind;

  readonly designation:
    string;

  readonly hostSystemDesignation:
    string;

}

export interface MinorBodyScientificAsteroidDetailSource {
  readonly kind:
    typeof MinorBodyScientificTargetKind.ASTEROID;

  readonly general:
    Readonly<{
      diameterKilometers: number;
      beltRegion: string;
      compositionRegime: string;
      structureRegime: string;
      multiplicityRegime: string;
      bulkDensityGramsPerCubicCentimeter: number;
      geometricAlbedo01: number;
      porosityIndex01: number;
      sourceBeltPopulationIndex01: number;
      sourceBeltRetainedMassEarth: number;
    }>;

  readonly orbit:
    Readonly<{
      semiMajorAxisAu: number;
      eccentricity: number;
      inclinationDegrees: number;
      periapsisAu: number;
      apoapsisAu: number;
      longitudeAscendingNodeDegrees: number;
      argumentOfPeriapsisDegrees: number;
      meanAnomalyDegrees: number;
      sourceInnerEdgeAu: number;
      sourceOuterEdgeAu: number;
      sourcePeakAu: number;
    }>;

  readonly composition:
    Readonly<{
      carbonaceousFraction01: number;
      silicateFraction01: number;
      metalFraction01: number;
      iceFraction01: number;
      isIceBearing: boolean;
      isMetalRich: boolean;
    }>;

  readonly structure:
    Readonly<{
      isRubblePile: boolean;
      isContactBinary: boolean;
      isDetachedBinary: boolean;
      binaryMassRatio01: number | null;
      binarySeparationPrimaryRadii: number | null;
    }>;
}

export interface MinorBodyScientificCometActivitySource {
  readonly distanceAu:
    number;

  readonly equilibriumTemperatureKelvin:
    number;

  readonly incidentFluxEarth:
    number;

  readonly waterIceActivitySupportIndex01:
    number;

  readonly supervolatileActivitySupportIndex01:
    number;

  readonly activityIndex01:
    number;

  readonly activityRegime:
    string;

  readonly hasComa:
    boolean;

  readonly hasDustTail:
    boolean;

  readonly hasIonTail:
    boolean;
}

export interface MinorBodyScientificCometDetailSource {
  readonly kind:
    typeof MinorBodyScientificTargetKind.COMET;

  readonly general:
    Readonly<{
      diameterKilometers: number;
      periodRegime: string;
      orbitalPeriodYears: number;
      bulkDensityGramsPerCubicCentimeter: number;
      geometricAlbedo01: number;
      porosityIndex01: number;
      volatileRichnessIndex01: number;
      reservoirSupportIndex01: number;
    }>;

  readonly orbit:
    Readonly<{
      semiMajorAxisAu: number;
      eccentricity: number;
      inclinationDegrees: number;
      periapsisAu: number;
      apoapsisAu: number;
      longitudeAscendingNodeDegrees: number;
      argumentOfPeriapsisDegrees: number;
      meanAnomalyDegrees: number;
      orbitalPeriodYears: number;
    }>;

  readonly nucleus:
    Readonly<{
      iceFraction01: number;
      dustFraction01: number;
      porosityIndex01: number;
      bulkDensityGramsPerCubicCentimeter: number;
      geometricAlbedo01: number;
      volatileRichnessIndex01: number;
    }>;

  readonly activity:
    Readonly<{
      periapsis: MinorBodyScientificCometActivitySource;
      apoapsis: MinorBodyScientificCometActivitySource;
    }>;
}

export type MinorBodyScientificDetailSource =
  | MinorBodyScientificAsteroidDetailSource
  | MinorBodyScientificCometDetailSource;

export interface MinorBodyScientificResolvedTarget {
  readonly identity:
    MinorBodyScientificIdentitySource;

  readonly detail:
    MinorBodyScientificDetailSource;
}

const PROCEDURAL_ID_PATTERN =
  /^[0-9A-F]{32}$/;

/**
 * Point-26.6 deterministic resolver for one already-addressed relevant asteroid
 * or comet. The route reuses the frozen point-22.10 `(kind, proceduralId)`
 * identity and never derives a new locator/seed level.
 *
 * The returned payload is a primitive scientific projection only. It exposes
 * phase-22 physical/orbital facts and comet activity at the two frozen apsides.
 * Phase-23 encounter/risk products remain outside this resolver for point 26.8.
 */
export class MinorBodyScientificTargetResolver {

  private constructor() {}

  static resolveDetailed(
    generationKey:
      UniverseGenerationKey,

    systemLocator:
      SystemLocator,

    kind:
      MinorBodyScientificTargetKind,

    proceduralId:
      string,
  ): MinorBodyScientificResolvedTarget | null {

    if (
      !PROCEDURAL_ID_PATTERN
        .test(
          proceduralId,
        )
    ) {
      return null;
    }

    const context =
      resolveMaturePlanetarySystem(
        generationKey,
        systemLocator,
      );

    if (
      context ===
        null
    ) {
      return null;
    }

    if (
      kind ===
      MinorBodyScientificTargetKind.ASTEROID
    ) {
      const asteroidSystem =
        AsteroidBeltGenerator
          .generate(
            generationKey,
            context.planetarySystem,
          );

      const asteroid =
        asteroidSystem
          .relevantAsteroids
          .find(
            candidate =>
              candidate.proceduralId ===
              proceduralId,
          );

      if (
        asteroid ===
          undefined
      ) {
        return null;
      }

      return Object.freeze({
        identity:
          Object.freeze({
            kind,
            designation:
              asteroid.localDesignation,
            hostSystemDesignation:
              context.hostSystemDesignation,
          }),
        detail:
          Object.freeze({
            kind,
            general:
              Object.freeze({
                diameterKilometers:
                  asteroid.diameterKilometers,
                beltRegion:
                  asteroid.beltRegion,
                compositionRegime:
                  asteroid.compositionRegime,
                structureRegime:
                  asteroid.structureRegime,
                multiplicityRegime:
                  asteroid.multiplicityRegime,
                bulkDensityGramsPerCubicCentimeter:
                  asteroid.taxonomy.bulkDensityGramsPerCubicCentimeter,
                geometricAlbedo01:
                  asteroid.taxonomy.geometricAlbedo01,
                porosityIndex01:
                  asteroid.taxonomy.porosityIndex01,
                sourceBeltPopulationIndex01:
                  asteroid.sourceBeltProfile.populationIndex01,
                sourceBeltRetainedMassEarth:
                  asteroid.sourceBeltProfile.retainedMassEarth,
              }),
            orbit:
              Object.freeze({
                semiMajorAxisAu:
                  asteroid.orbit.semiMajorAxisAu,
                eccentricity:
                  asteroid.orbit.eccentricity,
                inclinationDegrees:
                  asteroid.orbit.inclinationDegrees,
                periapsisAu:
                  asteroid.orbit.periapsisAu,
                apoapsisAu:
                  asteroid.orbit.apoapsisAu,
                longitudeAscendingNodeDegrees:
                  asteroid.orbit.longitudeAscendingNodeDegrees,
                argumentOfPeriapsisDegrees:
                  asteroid.orbit.argumentOfPeriapsisDegrees,
                meanAnomalyDegrees:
                  asteroid.orbit.meanAnomalyDegrees,
                sourceInnerEdgeAu:
                  asteroid.orbit.sourceInnerEdgeAu,
                sourceOuterEdgeAu:
                  asteroid.orbit.sourceOuterEdgeAu,
                sourcePeakAu:
                  asteroid.orbit.sourcePeakAu,
              }),
            composition:
              Object.freeze({
                carbonaceousFraction01:
                  asteroid.taxonomy.carbonaceousFraction01,
                silicateFraction01:
                  asteroid.taxonomy.silicateFraction01,
                metalFraction01:
                  asteroid.taxonomy.metalFraction01,
                iceFraction01:
                  asteroid.taxonomy.iceFraction01,
                isIceBearing:
                  asteroid.taxonomy.isIceBearing,
                isMetalRich:
                  asteroid.taxonomy.isMetalRich,
              }),
            structure:
              Object.freeze({
                isRubblePile:
                  asteroid.taxonomy.isRubblePile,
                isContactBinary:
                  asteroid.taxonomy.isContactBinary,
                isDetachedBinary:
                  asteroid.taxonomy.isDetachedBinary,
                binaryMassRatio01:
                  asteroid.taxonomy.binaryMassRatio01,
                binarySeparationPrimaryRadii:
                  asteroid.taxonomy.binarySeparationPrimaryRadii,
              }),
          }),
      });
    }

    const cometSystem =
      CometGenerator
        .generate(
          generationKey,
          context.planetarySystem,
        );

    const comet =
      cometSystem
        .relevantComets
        .find(
          candidate =>
            candidate.proceduralId ===
            proceduralId,
        );

    if (
      comet ===
        undefined
    ) {
      return null;
    }

    const periapsisActivity =
      CometActivityEngine
        .evaluate(
          comet,
          cometSystem.referenceLuminositySolar,
          comet.periapsisAu,
        );

    const apoapsisActivity =
      CometActivityEngine
        .evaluate(
          comet,
          cometSystem.referenceLuminositySolar,
          comet.apoapsisAu,
        );

    return Object.freeze({
      identity:
        Object.freeze({
          kind,
          designation:
            comet.localDesignation,
          hostSystemDesignation:
            context.hostSystemDesignation,
        }),
      detail:
        Object.freeze({
          kind,
          general:
            Object.freeze({
              diameterKilometers:
                comet.diameterKilometers,
              periodRegime:
                comet.periodRegime,
              orbitalPeriodYears:
                comet.orbitalPeriodYears,
              bulkDensityGramsPerCubicCentimeter:
                comet.nucleusProperties.bulkDensityGramsPerCubicCentimeter,
              geometricAlbedo01:
                comet.nucleusProperties.geometricAlbedo,
              porosityIndex01:
                comet.nucleusProperties.porosityIndex01,
              volatileRichnessIndex01:
                comet.nucleusProperties.volatileRichnessIndex01,
              reservoirSupportIndex01:
                cometSystem.reservoirSupportIndex01,
            }),
          orbit:
            Object.freeze({
              semiMajorAxisAu:
                comet.orbit.semiMajorAxisAu,
              eccentricity:
                comet.orbit.eccentricity,
              inclinationDegrees:
                comet.orbit.inclinationDegrees,
              periapsisAu:
                comet.periapsisAu,
              apoapsisAu:
                comet.apoapsisAu,
              longitudeAscendingNodeDegrees:
                comet.orbit.longitudeAscendingNodeDegrees,
              argumentOfPeriapsisDegrees:
                comet.orbit.argumentOfPeriapsisDegrees,
              meanAnomalyDegrees:
                comet.orbit.meanAnomalyDegrees,
              orbitalPeriodYears:
                comet.orbitalPeriodYears,
            }),
          nucleus:
            Object.freeze({
              iceFraction01:
                comet.nucleusProperties.iceFraction01,
              dustFraction01:
                comet.nucleusProperties.dustFraction01,
              porosityIndex01:
                comet.nucleusProperties.porosityIndex01,
              bulkDensityGramsPerCubicCentimeter:
                comet.nucleusProperties.bulkDensityGramsPerCubicCentimeter,
              geometricAlbedo01:
                comet.nucleusProperties.geometricAlbedo,
              volatileRichnessIndex01:
                comet.nucleusProperties.volatileRichnessIndex01,
            }),
          activity:
            Object.freeze({
              periapsis:
                activitySource(
                  periapsisActivity,
                ),
              apoapsis:
                activitySource(
                  apoapsisActivity,
                ),
            }),
        }),
    });
  }
}

function activitySource(
  state:
    ReturnType<typeof CometActivityEngine.evaluate>,
): MinorBodyScientificCometActivitySource {
  return Object.freeze({
    distanceAu:
      state.sourceDistanceAu,
    equilibriumTemperatureKelvin:
      state.equilibriumTemperatureKelvin,
    incidentFluxEarth:
      state.incidentFluxEarth,
    waterIceActivitySupportIndex01:
      state.waterIceActivitySupportIndex01,
    supervolatileActivitySupportIndex01:
      state.supervolatileActivitySupportIndex01,
    activityIndex01:
      state.activityIndex01,
    activityRegime:
      state.activityRegime,
    hasComa:
      state.hasComa,
    hasDustTail:
      state.hasDustTail,
    hasIonTail:
      state.hasIonTail,
  });
}

function resolveMaturePlanetarySystem(
  generationKey:
    UniverseGenerationKey,

  systemLocator:
    SystemLocator,
): Readonly<{
  hostSystemDesignation: string;
  planetarySystem: ReturnType<typeof PlanetarySystemGenerator.generate>;
}> | null {

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

  return Object.freeze({
    hostSystemDesignation:
      stellarSystem.designation.name,
    planetarySystem,
  });
}
