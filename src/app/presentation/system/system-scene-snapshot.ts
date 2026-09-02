import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type Atmosphere,
} from '../../domain/planetary/atmosphere';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  type PlanetarySystemHabitableZone,
} from '../../domain/planetary/planetary-system-habitable-zone';

import {
  type MoonSystem,
} from '../../domain/planetary/moon-system';

import {
  MinorBodyKind,
  type MinorBodyKindValue,
} from '../../domain/planetary/minor-body-kind';

import {
  type MinorBodyOrbitalElementsCatalog,
} from '../../domain/planetary/minor-body-orbital-elements-catalog';

import {
  type MinorBodyImpactRiskCatalog,
} from '../../domain/planetary/minor-body-impact-risk-catalog';

import {
  type MinorBodyGroundTruthObject,
} from '../../domain/planetary/minor-body-ground-truth-inventory';

import {
  PlanetSurfaceBaseRegime,
} from '../../domain/planetary/planet-surface-base-regime';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  type StellarSpectralAppearance,
} from '../../domain/stellar/stellar-spectral-appearance';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  type ArchiveStellarSystemCardModel,
  type ArchiveStellarSystemKnowledgeLevel,
} from '../genesis-archive/archive-stellar-system-card';


import {
  adaptiveSystemPlanetRadiusScene,
  adaptiveSystemStarRadiusScene,
  buildLinearFitSystemScale,
  buildMultipleAdaptiveSystemScaleV1,
  buildSingleAdaptiveSystemScaleV1,
  buildTripleHierarchicalSystemScaleV1,
  SystemSceneProjectionSpace,
  systemSceneProjectedOverlayRadiusAuInSpace,
  systemSceneProjectedRadiusAu,
  systemSceneProjectedRadiusAuInSpace,
  type SystemSceneProjectionSpace as SystemSceneProjectionSpaceValue,
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

export type {
  SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';

import {
  buildSystemSceneHabitableZonePresentationV2,
} from './system-scene-habitable-zone-presentation';

import {
  buildTripleDensePlanetaryLayoutV1,
} from './system-scene-triple-planetary-layout';

import {
  buildSystemScenePlanetSurfacePresentationV1,
  type SystemScenePlanetSurfacePresentationSnapshot,
} from './system-scene-planet-surface-presentation';

import {
  buildSystemSceneGiantAtmospherePresentationV1,
  type SystemSceneGiantAtmospherePresentationSnapshot,
} from './system-scene-giant-atmosphere-presentation';

import {
  AtmosphereGenerator,
} from '../../simulation/planetary/atmosphere-generator';

import {
  PlanetGenerator,
} from '../../simulation/planetary/planet-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from '../../simulation/planetary/planetary-formation-maturation-generator';

import {
  PlanetarySystemGenerator,
} from '../../simulation/planetary/planetary-system-generator';

import {
  PlanetarySystemHabitableZoneGenerator,
} from '../../simulation/planetary/planetary-system-habitable-zone-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from '../../simulation/planetary/protoplanetary-formation-snapshot-generator';

import {
  MoonGenerator,
} from '../../simulation/planetary/moon-generator';

import {
  AsteroidBeltGenerator,
} from '../../simulation/planetary/asteroid-belt-generator';

import {
  CometGenerator,
} from '../../simulation/planetary/comet-generator';

import {
  TransNeptunianObjectGenerator,
} from '../../simulation/planetary/trans-neptunian-object-generator';

import {
  InterstellarObjectGenerator,
} from '../../simulation/planetary/interstellar-object-generator';

import {
  CapturedExtrasolarObjectGenerator,
} from '../../simulation/planetary/captured-extrasolar-object-generator';

import {
  MinorBodyDynamicsEngine,
} from '../../simulation/planetary/minor-body-dynamics-engine';

import {
  GalaxySectorGridGenerator,
} from '../../simulation/sector/galaxy-sector-grid-generator';

import {
  GalaxySectorStellarDensityGenerator,
} from '../../simulation/sector/galaxy-sector-stellar-density-generator';

import {
  GalaxySectorStellarPopulationPropertiesGenerator,
} from '../../simulation/sector/galaxy-sector-stellar-population-properties-generator';

import {
  StellarGenerator,
} from '../../simulation/stellar/stellar-generator';

import {
  StellarPopulationProfileGenerator,
} from '../../simulation/stellar/stellar-population-profile-generator';

import {
  StellarSystemGenerator,
} from '../../simulation/stellar/stellar-system-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  type SystemOrbitalMotionDefinition,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  systemSimulationPlaybackDaysPerSecond,
} from './system-simulation-clock';

import {
  systemSceneMinorBodyPresentationTimeScale,
  systemSceneMoonPresentationTimeScale,
} from './system-scene-secondary-motion';

import {
  projectSystemSceneMotionContributions,
  type SystemSceneMotionProjectionContribution,
} from './system-scene-motion-projection';

import {
  systemSceneStellarLightIntensity,
  type SystemSceneBodySpinSnapshot,
} from './system-scene-body-render-state';

export type {
  SystemSceneBodySpinSnapshot,
} from './system-scene-body-render-state';


export interface SystemSceneAddress {
  readonly galaxyIndex:
    string;

  readonly sectorKey:
    string;

  readonly galacticObjectIndex:
    string;
}

export interface SystemSceneVector3 {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
}

export interface SystemSceneMotionContributionSnapshot
  extends SystemSceneMotionProjectionContribution {}

export interface SystemSceneOrbitalMotionSnapshot
  extends SystemOrbitalMotionDefinition {}

export interface SystemSceneOrbitSnapshot {
  readonly id:
    string;

  readonly kind:
    'stellar' |
    'planetary' |
    'moon' |
    'minor-body';

  readonly label:
    string;

  readonly colorHex:
    string;

  readonly opacity:
    number;

  readonly semiMajorScene:
    number;

  readonly semiMinorScene:
    number;

  readonly focusOffsetScene:
    number;

  readonly rotationDegrees:
    number;

  readonly inclinationDegrees:
    number;

  readonly motionId:
    string | null;

  readonly motionScale:
    number;

  readonly anchorMotionContributions:
    readonly SystemSceneMotionContributionSnapshot[];

  readonly projectionSpace?:
    SystemSceneProjectionSpaceValue;

  readonly linearScenePerAu?:
    number;
}

export interface SystemSceneBodySnapshot {
  readonly id:
    string;

  readonly kind:
    'star' |
    'planet';

  readonly label:
    string;

  readonly title:
    string;

  readonly colorHex:
    string;

  readonly radiusScene:
    number;

  readonly position:
    SystemSceneVector3;

  readonly orbitId:
    string | null;

  readonly motionContributions:
    readonly SystemSceneMotionContributionSnapshot[];

  readonly surfaceStyle:
    'emissive' |
    'rocky' |
    'oceanic' |
    'icy' |
    'gaseous' |
    'volcanic';

  readonly lightIntensity:
    number;

  /** Direct domain luminosity for stars; null for non-stellar spherical bodies. */
  readonly sourceLuminositySolar:
    number | null;

  readonly spin:
    SystemSceneBodySpinSnapshot;

  /** Point-25.3 solid-surface environment; null for stars. */
  readonly surfaceEnvironment:
    SystemScenePlanetSurfacePresentationSnapshot | null;

  /** Point-25.4 deep-envelope cloud-top atmosphere; null for stars/solid worlds. */
  readonly giantAtmosphere:
    SystemSceneGiantAtmospherePresentationSnapshot | null;
}

export interface SystemSceneMoonSnapshot {
  readonly id:
    string;

  readonly kind:
    'moon';

  readonly label:
    string;

  readonly title:
    string;

  readonly hostPlanetId:
    string;

  readonly hostPlanetOrdinal:
    number;

  readonly colorHex:
    string;

  readonly radiusScene:
    number;

  readonly position:
    SystemSceneVector3;

  readonly orbitId:
    string;

  readonly motionContributions:
    readonly SystemSceneMotionContributionSnapshot[];

  readonly spin:
    SystemSceneBodySpinSnapshot;
}

export interface SystemSceneMinorBodySnapshot {
  readonly id:
    string;

  readonly kind:
    'minor-body';

  readonly minorBodyKind:
    MinorBodyKindValue;

  readonly label:
    string;

  readonly title:
    string;

  readonly colorHex:
    string;

  readonly radiusScene:
    number;

  readonly position:
    SystemSceneVector3;

  readonly orbitId:
    string;

  readonly motionContributions:
    readonly SystemSceneMotionContributionSnapshot[];
}

export interface SystemSceneHabitableZoneSnapshot {
  readonly topology:
    'CIRCUMSTELLAR' |
    'CIRCUMBINARY';

  readonly radiativeInnerEdgeAu:
    number;

  readonly radiativeOuterEdgeAu:
    number;

  readonly dynamicallyHabitableInnerEdgeAu:
    number | null;

  readonly dynamicallyHabitableOuterEdgeAu:
    number | null;

  readonly radiativeInnerRadiusScene:
    number;

  readonly radiativeOuterRadiusScene:
    number;

  readonly dynamicallyHabitableInnerRadiusScene:
    number | null;

  readonly dynamicallyHabitableOuterRadiusScene:
    number | null;

  readonly presentationAdjusted:
    boolean;

  readonly dynamicalOverlapFraction01:
    number;

  readonly anchorMotionContributions:
    readonly SystemSceneMotionContributionSnapshot[];

  readonly projectionSpace?:
    SystemSceneProjectionSpaceValue;
}

export interface SystemSceneOrbitalRiskTargetSnapshot {
  readonly id:
    string;

  readonly targetBodyId:
    string;

  readonly targetOrbitId:
    string;

  readonly targetKind:
    'planet' |
    'moon';

  readonly targetLabel:
    string;

  readonly sourceMinorBodyCount:
    number;

  readonly riskCandidateCount:
    number;

  readonly approachCorridorCount:
    number;

  readonly radialCrossingOnlyCount:
    number;

  readonly directCollisionGeometryCount:
    number;

  readonly severity:
    'CROSSING' |
    'APPROACH' |
    'COLLISION_GEOMETRY';

  readonly highestOrbitalRiskIndex01:
    number;

  readonly highestRegimeName:
    string;

  readonly colorHex:
    string;
}

export interface SystemSceneLayerAvailabilitySnapshot {
  readonly moonCount:
    number;

  readonly minorBodyCount:
    number;

  readonly habitableZoneAvailable:
    boolean;

  readonly orbitalRiskTargetCount:
    number;

  readonly orbitalCrossingTargetCount:
    number;

  readonly orbitalApproachTargetCount:
    number;

  readonly orbitalCollisionGeometryTargetCount:
    number;
}

export interface SystemSceneSimulationSnapshot {
  readonly epochSimulationDay:
    number;

  readonly playbackDaysPerRealSecond:
    number;
}

/**
 * Point-24.10 immutable presentation snapshot, extended through 25.3 with body spin/light and phase-20 surface-environment inputs.
 *
 * The snapshot now carries precomputed presentation geometry for resolved
 * stellar components, mature planets and orbital guides. Three.js still does
 * not derive authoritative astrophysics: it only consumes this frozen visual
 * projection.
 */
export interface SystemSceneSnapshot {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly address:
    SystemSceneAddress;

  readonly proceduralIdentity:
    string;

  readonly title:
    string;

  readonly discoveryStateCode:
    number;

  readonly discoveryStateLabel:
    string;

  readonly knowledgeLevel:
    ArchiveStellarSystemKnowledgeLevel;

  readonly multiplicityName:
    string | null;

  readonly componentCount:
    number | null;

  readonly accessibleLabel:
    string;

  readonly stars:
    readonly SystemSceneBodySnapshot[];

  readonly planets:
    readonly SystemSceneBodySnapshot[];

  readonly moons:
    readonly SystemSceneMoonSnapshot[];

  readonly minorBodies:
    readonly SystemSceneMinorBodySnapshot[];

  readonly habitableZone:
    SystemSceneHabitableZoneSnapshot | null;

  readonly orbitalRiskTargets:
    readonly SystemSceneOrbitalRiskTargetSnapshot[];

  readonly layers:
    SystemSceneLayerAvailabilitySnapshot;

  readonly orbits:
    readonly SystemSceneOrbitSnapshot[];

  readonly motions:
    readonly SystemSceneOrbitalMotionSnapshot[];

  readonly simulation:
    SystemSceneSimulationSnapshot;

  readonly scale:
    SystemSceneScaleSnapshot;
}

export interface SystemSceneSnapshotSource {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  readonly locator:
    SystemLocator;

  readonly proceduralIdentity:
    string;

  readonly discoveryState:
    DiscoveryStateValue;

  readonly discoveryStateLabel:
    string;

  readonly stellarSystemCard:
    ArchiveStellarSystemCardModel;

  /**
   * Laboratory/debug-only Ground Truth reveal for phase-22 minor bodies.
   * Gameplay callers leave this false so undiscovered individual bodies are
   * never leaked by the system renderer.
   */
  readonly revealMinorBodyGroundTruth?:
    boolean;
}

interface MaterializedStellarSceneWorld {
  readonly stellarSystem:
    ReturnType<typeof StellarSystemGenerator.generate>;

  readonly generationKey:
    UniverseGenerationKey;

  readonly locator:
    SystemLocator;

  readonly title:
    string;

  readonly multiplicityName:
    string;

  readonly componentCount:
    number;

  readonly stars:
    readonly ResolvedStarSceneSource[];

  readonly planetarySystem:
    PlanetarySystem | null;

  readonly planets:
    readonly Planet[];

  readonly atmospheres:
    readonly Atmosphere[];

  readonly moonSystems:
    readonly MoonSystem[];

  readonly minorBodyOrbitalCatalog:
    MinorBodyOrbitalElementsCatalog | null;

  readonly habitableZone:
    PlanetarySystemHabitableZone;

  readonly impactRiskCatalog:
    MinorBodyImpactRiskCatalog | null;
}

interface ResolvedStarSceneSource {
  readonly id:
    string;

  readonly label:
    string;

  readonly title:
    string;

  readonly colorHex:
    string;

  readonly radiusSolar:
    number;

  readonly massSolar:
    number;

  readonly luminositySolar:
    number;

  readonly referenceMassSolar:
    number;

  readonly semiMajorAxisAu:
    number | null;

  readonly eccentricity:
    number;

  readonly inclinationDegrees:
    number;

  readonly rotationDegrees:
    number;

  readonly orbitalPhaseDegrees:
    number;
}

const DEFAULT_OUTER_RADIUS_AU =
  4;

const TARGET_OUTER_RADIUS_SCENE =
  4.8;

const MINOR_BODY_MIN_STAR_CLEARANCE_SCENE =
  0.22;

const MINOR_BODY_MIN_PERIAPSIS_FLOOR_SCENE =
  0.48;

export class SystemSceneSnapshotBuilder {

  private constructor() {}

  static build(
    model:
      ArchiveDiscoveryDetailModel,
  ): SystemSceneSnapshot {

    if (
      model.locatorKind !==
        ArchiveDiscoveryLocatorKind.SYSTEM ||
      model.stellarSystemCard ===
        null
    ) {
      throw new RangeError(
        'Point-24.3 SystemSceneSnapshot requires one resolved stellar-system Archive model.',
      );
    }

    return this.buildFromSource(
      Object.freeze({
        universeSeed:
          model.universeSeed,
        generatorVersionCode:
          model.generatorVersionCode,
        locator:
          new SystemLocator(
            model.galaxyIndex,
            model.sectorKey,
            model.galacticObjectIndex,
          ),
        proceduralIdentity:
          model.proceduralIdentity,
        discoveryState:
          model.discoveryState,
        discoveryStateLabel:
          model.discoveryStateLabel,
        stellarSystemCard:
          model.stellarSystemCard,
      }),
    );
  }

  static buildFromSource(
    source:
      SystemSceneSnapshotSource,
  ): SystemSceneSnapshot {

    const baseSnapshot =
      snapshotBase(
        source,
      );

    if (
      source.discoveryState.code <
      DiscoveryState.CATALOGUED.code
    ) {
      return Object.freeze({
        ...baseSnapshot,
        accessibleLabel:
          `${baseSnapshot.accessibleLabel} Arquitectura física todavía no resuelta.`,
        stars:
          Object.freeze([]),
        planets:
          Object.freeze([]),
        moons:
          Object.freeze([]),
        minorBodies:
          Object.freeze([]),
        habitableZone:
          null,
        orbitalRiskTargets:
          Object.freeze([]),
        layers:
          Object.freeze({
            moonCount: 0,
            minorBodyCount: 0,
            habitableZoneAvailable: false,
            orbitalRiskTargetCount: 0,
            orbitalCrossingTargetCount: 0,
            orbitalApproachTargetCount: 0,
            orbitalCollisionGeometryTargetCount: 0,
          }),
        orbits:
          Object.freeze([]),
        motions:
          Object.freeze([]),
        simulation:
          Object.freeze({
            epochSimulationDay:
              0,
            playbackDaysPerRealSecond:
              1,
          }),
        scale:
          buildLinearFitSystemScale(
            DEFAULT_OUTER_RADIUS_AU,
            TARGET_OUTER_RADIUS_SCENE,
          ),
      });
    }

    const world =
      materializeSceneWorld(
        source,
      );

    const projected =
      projectSceneGeometry(
        world,
      );

    return Object.freeze({
      ...baseSnapshot,
      accessibleLabel:
        `${baseSnapshot.accessibleLabel} ${projected.stars.length} estrella${projected.stars.length === 1 ? '' : 's'}, ${projected.planets.length} planeta${projected.planets.length === 1 ? '' : 's'}, ${projected.moons.length} luna${projected.moons.length === 1 ? '' : 's'} relevante${projected.moons.length === 1 ? '' : 's'} y ${projected.minorBodies.length} cuerpo${projected.minorBodies.length === 1 ? '' : 's'} menor${projected.minorBodies.length === 1 ? '' : 'es'} disponible${projected.minorBodies.length === 1 ? '' : 's'} por capas. Zona habitable de referencia disponible. ${projected.layers.orbitalRiskTargetCount} objetivo${projected.layers.orbitalRiskTargetCount === 1 ? '' : 's'} con corredor de riesgo y ${projected.layers.orbitalCrossingTargetCount} objetivo${projected.layers.orbitalCrossingTargetCount === 1 ? '' : 's'} con cruce radial solamente.`,
      stars:
        projected.stars,
      planets:
        projected.planets,
      moons:
        projected.moons,
      minorBodies:
        projected.minorBodies,
      habitableZone:
        projected.habitableZone,
      orbitalRiskTargets:
        projected.orbitalRiskTargets,
      layers:
        projected.layers,
      orbits:
        projected.orbits,
      motions:
        projected.motions,
      simulation:
        projected.simulation,
      scale:
        projected.scale,
    });
  }
}

function snapshotBase(
  source:
    SystemSceneSnapshotSource,
): Omit<
  SystemSceneSnapshot,
  'stars' |
  'planets' |
  'moons' |
  'minorBodies' |
  'habitableZone' |
  'orbitalRiskTargets' |
  'layers' |
  'orbits' |
  'motions' |
  'simulation' |
  'scale'
> {

  const systemCard =
    source.stellarSystemCard;

  return Object.freeze({
    universeSeed:
      source.universeSeed,

    generatorVersionCode:
      source.generatorVersionCode,

    address:
      Object.freeze({
        galaxyIndex:
          source.locator.galaxyIndex.toString(),

        sectorKey:
          source.locator.sectorKey.toString(),

        galacticObjectIndex:
          source.locator.galacticObjectIndex.toString(),
      }),

    proceduralIdentity:
      source.proceduralIdentity,

    title:
      systemCard.title,

    discoveryStateCode:
      source.discoveryState.code,

    discoveryStateLabel:
      source.discoveryStateLabel,

    knowledgeLevel:
      systemCard.knowledgeLevel,

    multiplicityName:
      systemCard
        .render
        .multiplicity
        ?.name ??
      null,

    componentCount:
      systemCard.componentCount,

    accessibleLabel:
      `Escena tridimensional del sistema estelar ${systemCard.title}.`,
  });
}

function materializeSceneWorld(
  source:
    SystemSceneSnapshotSource,
): MaterializedStellarSceneWorld {

  const generationKey =
    new UniverseGenerationKey(
      UniverseSeed.parse(
        source.universeSeed,
      ),
      GeneratorVersion.fromCode(
        source.generatorVersionCode,
      ),
    );

  const locator =
    source.locator;

  const galaxy =
    GalaxyGenerator.generate(
      generationKey,
      locator.galaxyIndex,
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
            locator.sectorKey,
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

  const system =
    StellarSystemGenerator
      .generate(
        generationKey,
        locator,
        stellarPopulation,
        stellarPopulationProfile,
      );

  const primaryPhysicalProperties =
    StellarGenerator
      .generatePhysicalProperties(
        generationKey,
        locator,
        stellarPopulation,
        stellarPopulationProfile,
      );

  const primarySpectralAppearance =
    StellarGenerator
      .generateSpectralAppearance(
        generationKey,
        primaryPhysicalProperties,
        stellarPopulation,
      );

  const stars =
    resolveStarSources(
      system,
      primaryPhysicalProperties,
      primarySpectralAppearance,
    );

  const planetaryWorld =
    resolvePlanetaryWorld(
      generationKey,
      locator,
      system,
      source.revealMinorBodyGroundTruth ===
        true,
    );

  return Object.freeze({
    stellarSystem:
      system,
    generationKey,
    locator,
    title:
      system.designation.name,
    multiplicityName:
      system.multiplicity.name,
    componentCount:
      system.multiplicity
        .stellarComponentCount,
    stars,
    planetarySystem:
      planetaryWorld.planetarySystem,
    planets:
      planetaryWorld.planets,
    atmospheres:
      planetaryWorld.atmospheres,
    moonSystems:
      planetaryWorld.moonSystems,
    minorBodyOrbitalCatalog:
      planetaryWorld.minorBodyOrbitalCatalog,
    habitableZone:
      planetaryWorld.habitableZone,
    impactRiskCatalog:
      planetaryWorld.impactRiskCatalog,
  });
}

function resolveStarSources(
  system:
    ReturnType<typeof StellarSystemGenerator.generate>,

  primaryPhysicalProperties:
    StellarPhysicalProperties,

  primarySpectralAppearance:
    StellarSpectralAppearance,
): readonly ResolvedStarSceneSource[] {

  const primary =
    Object.freeze({
      id:
        'star-a',
      label:
        'A',
      title:
        `${system.designation.name} A`,
      colorHex:
        primarySpectralAppearance.color.hex,
      radiusSolar:
        primaryPhysicalProperties.radiusSolar,
      massSolar:
        primaryPhysicalProperties.currentMassSolar,
      luminositySolar:
        primaryPhysicalProperties.luminositySolar,
      referenceMassSolar:
        primaryPhysicalProperties.initialMassSolar,
      semiMajorAxisAu:
        system.orbitHierarchy.innerOrbit === null
          ? null
          : companionSemiMajorAxisAu(
              system.orbitHierarchy
                .innerOrbit
                .semiMajorAxisAu,
              primaryPhysicalProperties.currentMassSolar,
              system.secondaryCompanion
                ?.physicalProperties
                .currentMassSolar ??
                0,
            ),
      eccentricity:
        system.orbitHierarchy.innerOrbit
          ?.eccentricity ??
        0,
      inclinationDegrees:
        0,
      rotationDegrees:
        0,
      orbitalPhaseDegrees:
        180,
    } satisfies ResolvedStarSceneSource);

  const companions =
    [
      companionSource(
        system.secondaryCompanion,
        system.designation.name,
        system.orbitHierarchy.innerOrbit
          ?.semiMajorAxisAu ??
          null,
        primaryPhysicalProperties.currentMassSolar,
        0,
      ),
      companionSource(
        system.tertiaryCompanion,
        system.designation.name,
        system.orbitHierarchy.outerOrbit
          ?.semiMajorAxisAu ??
          null,
        primaryPhysicalProperties.currentMassSolar +
          (system.secondaryCompanion
            ?.physicalProperties
            .currentMassSolar ??
            0),
        92,
      ),
    ]
      .filter(
        (
          value,
        ):
          value is ResolvedStarSceneSource =>
            value !==
            null,
      );

  return Object.freeze([
    primary,
    ...companions,
  ]);
}

function companionSource(
  companion:
    StellarCompanion | null,

  systemName:
    string,

  totalSemiMajorAxisAu:
    number | null,

  barycentrePrimaryMassSolar:
    number,

  rotationDegrees:
    number,
): ResolvedStarSceneSource | null {

  if (
    companion ===
    null
  ) {
    return null;
  }

  const ownSemiMajorAxisAu =
    totalSemiMajorAxisAu ===
      null
      ? null
      : companionSemiMajorAxisAu(
          totalSemiMajorAxisAu,
          barycentrePrimaryMassSolar,
          companion.physicalProperties
            .currentMassSolar,
        );

  return Object.freeze({
    id:
      `star-${companion.componentLabel.name.toLowerCase()}`,
    label:
      companion.componentLabel.name,
    title:
      `${systemName} ${companion.componentLabel.name}`,
    colorHex:
      companion.spectralAppearance.color.hex,
    radiusSolar:
      companion.physicalProperties.radiusSolar,
    massSolar:
      companion.physicalProperties.currentMassSolar,
    luminositySolar:
      companion.physicalProperties.luminositySolar,
    referenceMassSolar:
      companion.physicalProperties.initialMassSolar,
    semiMajorAxisAu:
      ownSemiMajorAxisAu,
    eccentricity:
      0,
    inclinationDegrees:
      companion.componentLabel ===
      StellarSystemComponentLabel.C
        ? 18
        : 0,
    rotationDegrees,
    orbitalPhaseDegrees:
      seededPhaseDegrees(
        companion.componentSeedHex,
      ),
  } satisfies ResolvedStarSceneSource);
}

function companionSemiMajorAxisAu(
  totalSemiMajorAxisAu:
    number,

  anchorMassSolar:
    number,

  otherMassSolar:
    number,
): number {

  const totalMassSolar =
    anchorMassSolar +
    otherMassSolar;

  if (
    totalMassSolar <=
    0
  ) {
    return totalSemiMajorAxisAu / 2;
  }

  return totalSemiMajorAxisAu * (
    otherMassSolar /
    totalMassSolar
  );
}

interface ResolvedPlanetarySceneWorld {
  readonly planetarySystem:
    PlanetarySystem | null;

  readonly planets:
    readonly Planet[];

  readonly atmospheres:
    readonly Atmosphere[];

  readonly moonSystems:
    readonly MoonSystem[];

  readonly minorBodyOrbitalCatalog:
    MinorBodyOrbitalElementsCatalog | null;

  readonly habitableZone:
    PlanetarySystemHabitableZone;

  readonly impactRiskCatalog:
    MinorBodyImpactRiskCatalog | null;
}

function resolvePlanetaryWorld(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  system:
    ReturnType<typeof StellarSystemGenerator.generate>,

  revealMinorBodyGroundTruth:
    boolean,
): ResolvedPlanetarySceneWorld {

  const habitableZone =
    PlanetarySystemHabitableZoneGenerator
      .generate(
        generationKey,
        system,
      );

  const formationSnapshot =
    ProtoplanetaryFormationSnapshotGenerator
      .generateMaturationReferenceOrNull(
        generationKey,
        locator,
      );

  if (
    formationSnapshot ===
    null
  ) {
    return Object.freeze({
      planetarySystem: null,
      planets: Object.freeze([]),
      atmospheres: Object.freeze([]),
      moonSystems: Object.freeze([]),
      minorBodyOrbitalCatalog: null,
      habitableZone,
      impactRiskCatalog: null,
    });
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
        system,
        formationBlueprint,
      );

  const planets =
    planetarySystem.hasPlanets
      ? PlanetGenerator
          .generateAll(
            generationKey,
            planetarySystem,
          )
      : Object.freeze([]);

  const atmospheres =
    planets.length ===
      0
      ? Object.freeze([])
      : AtmosphereGenerator
          .generateAll(
            generationKey,
            planetarySystem,
            planets,
          );

  const moonSystems =
    planets.length ===
      0
      ? Object.freeze([])
      : MoonGenerator
          .generateAll(
            generationKey,
            planetarySystem,
            planets,
          );

  if (
    !revealMinorBodyGroundTruth
  ) {
    return Object.freeze({
      planetarySystem,
      planets:
        Object.freeze([
          ...planets,
        ]),
      atmospheres,
      moonSystems,
      minorBodyOrbitalCatalog: null,
      habitableZone,
      impactRiskCatalog: null,
    });
  }

  const asteroidBelts =
    AsteroidBeltGenerator.generate(
      generationKey,
      planetarySystem,
    );
  const comets =
    CometGenerator.generate(
      generationKey,
      planetarySystem,
    );
  const transNeptunianObjects =
    TransNeptunianObjectGenerator.generate(
      generationKey,
      planetarySystem,
    );
  const interstellarObjects =
    InterstellarObjectGenerator.generate(
      generationKey,
      planetarySystem,
    );
  const capturedExtrasolarObjects =
    CapturedExtrasolarObjectGenerator.generate(
      generationKey,
      planetarySystem,
    );

  const dynamicsState =
    MinorBodyDynamicsEngine.initialize(
      generationKey,
      planetarySystem,
      asteroidBelts,
      comets,
      transNeptunianObjects,
      interstellarObjects,
      capturedExtrasolarObjects,
    );

  const minorBodyOrbitalCatalog =
    MinorBodyDynamicsEngine
      .orbitalElements(
        dynamicsState,
      );

  const proximityCatalog =
    MinorBodyDynamicsEngine
      .proximities(
        minorBodyOrbitalCatalog,
        planets,
        moonSystems,
      );

  const resonanceCatalog =
    MinorBodyDynamicsEngine
      .resonances(
        minorBodyOrbitalCatalog,
        proximityCatalog,
      );

  const giantInfluenceCatalog =
    MinorBodyDynamicsEngine
      .giantInfluences(
        resonanceCatalog,
      );

  const closeEncounterCatalog =
    MinorBodyDynamicsEngine
      .closeEncounters(
        giantInfluenceCatalog,
      );

  const impactRiskCatalog =
    MinorBodyDynamicsEngine
      .impactRisks(
        closeEncounterCatalog,
      );

  return Object.freeze({
    planetarySystem,
    planets:
      Object.freeze([
        ...planets,
      ]),
    atmospheres,
    moonSystems,
    minorBodyOrbitalCatalog,
    habitableZone,
    impactRiskCatalog,
  });
}

function projectSceneGeometry(
  world:
    MaterializedStellarSceneWorld,
): {
  readonly stars:
    readonly SystemSceneBodySnapshot[];

  readonly planets:
    readonly SystemSceneBodySnapshot[];

  readonly moons:
    readonly SystemSceneMoonSnapshot[];

  readonly minorBodies:
    readonly SystemSceneMinorBodySnapshot[];

  readonly habitableZone:
    SystemSceneHabitableZoneSnapshot | null;

  readonly orbitalRiskTargets:
    readonly SystemSceneOrbitalRiskTargetSnapshot[];

  readonly layers:
    SystemSceneLayerAvailabilitySnapshot;

  readonly orbits:
    readonly SystemSceneOrbitSnapshot[];

  readonly motions:
    readonly SystemSceneOrbitalMotionSnapshot[];

  readonly simulation:
    SystemSceneSimulationSnapshot;

  readonly scale:
    SystemSceneScaleSnapshot;
} {

  const innerOrbit =
    world.stellarSystem
      .orbitHierarchy
      .innerOrbit;

  const outerOrbit =
    world.stellarSystem
      .orbitHierarchy
      .outerOrbit;

  const primary =
    world.stars.find(
      star =>
        star.label ===
        'A',
    )!;

  const secondary =
    world.stars.find(
      star =>
        star.label ===
        'B',
    ) ??
    null;

  const tertiary =
    world.stars.find(
      star =>
        star.label ===
        'C',
    ) ??
    null;

  const innerTotalMassSolar =
    primary.referenceMassSolar +
    (
      secondary
        ?.referenceMassSolar ??
      0
    );

  const primaryInnerScale =
    secondary ===
      null
      ? 0
      : -secondary.referenceMassSolar /
        innerTotalMassSolar;

  const secondaryInnerScale =
    secondary ===
      null
      ? 0
      : primary.referenceMassSolar /
        innerTotalMassSolar;

  const outerTotalMassSolar =
    innerTotalMassSolar +
    (
      tertiary
        ?.referenceMassSolar ??
      0
    );

  const innerPairOuterScale =
    tertiary ===
      null
      ? 0
      : -tertiary.referenceMassSolar /
        outerTotalMassSolar;

  const tertiaryOuterScale =
    tertiary ===
      null
      ? 0
      : innerTotalMassSolar /
        outerTotalMassSolar;

  const planetOuterRadiusAu =
    world.planets
      .map(
        planet =>
          planet.orbit.apoastronAu,
      )
      .reduce(
        (
          maxValue,
          value,
        ) =>
          Math.max(
            maxValue,
            value,
          ),
        0,
      );

  const innerStellarOuterBoundAu =
    innerOrbit ===
      null
      ? 0
      : innerOrbit.apoastronAu *
        Math.max(
          Math.abs(
            primaryInnerScale,
          ),
          Math.abs(
            secondaryInnerScale,
          ),
        );

  const innerPairOuterAnchorBoundAu =
    outerOrbit ===
      null
      ? 0
      : outerOrbit.apoastronAu *
        Math.abs(
          innerPairOuterScale,
        );

  const tertiaryOuterBoundAu =
    outerOrbit ===
      null
      ? 0
      : outerOrbit.apoastronAu *
        Math.abs(
          tertiaryOuterScale,
        );

  const resolvedOuterRadiusAu =
    Math.max(
      innerPairOuterAnchorBoundAu +
        innerStellarOuterBoundAu,
      innerPairOuterAnchorBoundAu +
        planetOuterRadiusAu,
      tertiaryOuterBoundAu,
      planetOuterRadiusAu,
    );

  const outerRadiusAu =
    resolvedOuterRadiusAu >
      0
      ? resolvedOuterRadiusAu
      : DEFAULT_OUTER_RADIUS_AU;

  const starRadiusSceneById =
    new Map(
      world.stars.map(
        star =>
          [
            star.id,
            adaptiveSystemStarRadiusScene(
              star.radiusSolar,
            ),
          ] as const,
      ),
    );

  const planetRadiusSceneByOrdinal =
    new Map(
      world.planets.map(
        planet =>
          [
            planet.planetOrdinal,
            adaptiveSystemPlanetRadiusScene(
              planet.physicalProperties
                .radiusEarth,
            ),
          ] as const,
      ),
    );

  const innerPlanetPeriapsisAu =
    world.planets
      .map(
        planet =>
          planet.orbit.periastronAu,
      )
      .filter(
        value =>
          Number.isFinite(
            value,
          ) &&
          value >
            0,
      )
      .reduce<number | null>(
        (
          minimum,
          value,
        ) =>
          minimum ===
            null
            ? value
            : Math.min(
                minimum,
                value,
              ),
        null,
      );

  const primaryStarRadiusScene =
    starRadiusSceneById.get(
      primary.id,
    ) ??
    0.28;

  const secondaryStarRadiusScene =
    secondary ===
      null
      ? 0
      : starRadiusSceneById.get(
          secondary.id,
        ) ??
        0.26;

  const maxPlanetRadiusScene =
    Math.max(
      0,
      ...planetRadiusSceneByOrdinal.values(),
    );

  const tertiaryStarRadiusScene =
    tertiary ===
      null
      ? 0
      : starRadiusSceneById.get(
          tertiary.id,
        ) ??
        0.24;

  const sceneScale =
    world.multiplicityName ===
      'SINGLE'
      ? buildSingleAdaptiveSystemScaleV1({
          outerRadiusAu,
          targetOuterRadiusScene:
            TARGET_OUTER_RADIUS_SCENE,
          innerPeriapsisAu:
            innerPlanetPeriapsisAu,
          starRadiusScene:
            primaryStarRadiusScene,
          maxPlanetRadiusScene,
        })
      : world.multiplicityName ===
          'TRIPLE' &&
        innerOrbit !==
          null &&
        outerOrbit !==
          null &&
        tertiary !==
          null
        ? buildTripleHierarchicalSystemScaleV1({
            outerRadiusAu,
            targetOuterRadiusScene:
              TARGET_OUTER_RADIUS_SCENE,
            innerBinaryPeriapsisAu:
              innerOrbit.periastronAu,
            innerBinaryApoapsisAu:
              innerOrbit.apoastronAu,
            localPlanetOuterRadiusAu:
              planetOuterRadiusAu,
            outerRelativePeriapsisAu:
              outerOrbit.periastronAu,
            outerRelativeApoapsisAu:
              outerOrbit.apoastronAu,
            primaryStarRadiusScene,
            secondaryStarRadiusScene,
            tertiaryStarRadiusScene,
            maxPlanetRadiusScene,
            innerPairOuterScale,
            tertiaryOuterScale,
          })
        : buildMultipleAdaptiveSystemScaleV1({
            architecture:
              'BINARY',
            outerRadiusAu,
            targetOuterRadiusScene:
              TARGET_OUTER_RADIUS_SCENE,
            innerBinaryPeriapsisAu:
              innerOrbit
                ?.periastronAu ??
              null,
            primaryStarRadiusScene,
            secondaryStarRadiusScene,
          });

  const triplePlanetaryLayout =
    world.multiplicityName ===
      'TRIPLE'
      ? buildTripleDensePlanetaryLayoutV1(
          world.planets.map(
            planet =>
              Object.freeze({
                ordinal:
                  planet.planetOrdinal,
                semiMajorAxisAu:
                  planet.orbit.semiMajorAxisAu,
                eccentricity:
                  planet.orbit.eccentricity,
                radiusScene:
                  planetRadiusSceneByOrdinal.get(
                    planet.planetOrdinal,
                  )!,
              }),
          ),
          sceneScale,
        )
      : null;

  const triplePlanetaryLayoutByOrdinal =
    new Map(
      triplePlanetaryLayout
        ?.entries
        .map(
          entry =>
            [
              entry.ordinal,
              entry,
            ] as const,
        ) ??
      [],
    );

  if (
    triplePlanetaryLayout !==
      null
  ) {
    for (
      const entry
      of triplePlanetaryLayout.entries
    ) {
      planetRadiusSceneByOrdinal.set(
        entry.ordinal,
        entry.radiusScene,
      );
    }
  }

  const motions: SystemSceneOrbitalMotionSnapshot[] = [];
  const orbits: SystemSceneOrbitSnapshot[] = [];

  const innerMotion =
    innerOrbit ===
      null
      ? null
      : Object.freeze({
          id:
            'stellar-inner-relative',
          semiMajorAxisAu:
            innerOrbit.semiMajorAxisAu,
          eccentricity:
            innerOrbit.eccentricity,
          periodDays:
            innerOrbit.periodDays,
          rotationDegrees:
            0,
          inclinationDegrees:
            0,
          epochMeanAnomalyDegrees:
            seededPhaseDegrees(
              `${world.stellarSystem.seed.normalizedValue}:INNER`,
            ),
        } satisfies SystemSceneOrbitalMotionSnapshot);

  const outerMotion =
    outerOrbit ===
      null
      ? null
      : Object.freeze({
          id:
            'stellar-outer-relative',
          semiMajorAxisAu:
            outerOrbit.semiMajorAxisAu,
          eccentricity:
            outerOrbit.eccentricity,
          periodDays:
            outerOrbit.periodDays,
          rotationDegrees:
            92,
          inclinationDegrees:
            18,
          epochMeanAnomalyDegrees:
            seededPhaseDegrees(
              `${world.stellarSystem.seed.normalizedValue}:OUTER`,
            ),
        } satisfies SystemSceneOrbitalMotionSnapshot);

  if (
    innerMotion !==
    null
  ) {
    motions.push(
      innerMotion,
    );
  }

  if (
    outerMotion !==
    null
  ) {
    motions.push(
      outerMotion,
    );
  }

  const innerPairAnchorContributions =
    outerMotion ===
      null
      ? Object.freeze([])
      : Object.freeze([
          Object.freeze({
            motionId:
              outerMotion.id,
            scale:
              innerPairOuterScale,
            projectionSpace:
              world.multiplicityName ===
                'TRIPLE'
                ? SystemSceneProjectionSpace.TRIPLE_OUTER
                : SystemSceneProjectionSpace.GLOBAL,
          }),
        ] satisfies SystemSceneMotionContributionSnapshot[]);

  const stars =
    world.stars.map(
      star => {
        const contributions: SystemSceneMotionContributionSnapshot[] = [];

        if (
          outerMotion !==
            null &&
          star.label !==
            'C'
        ) {
          contributions.push(
            Object.freeze({
              motionId:
                outerMotion.id,
              scale:
                innerPairOuterScale,
              projectionSpace:
                world.multiplicityName ===
                  'TRIPLE'
                  ? SystemSceneProjectionSpace.TRIPLE_OUTER
                  : SystemSceneProjectionSpace.GLOBAL,
            }),
          );
        }

        let orbitId:
          string | null =
          null;

        if (
          innerMotion !==
            null &&
          star.label ===
            'A'
        ) {
          contributions.push(
            Object.freeze({
              motionId:
                innerMotion.id,
              scale:
                primaryInnerScale,
              ...(
                world.multiplicityName ===
                  'TRIPLE'
                  ? {
                      projectionSpace:
                        SystemSceneProjectionSpace.TRIPLE_LOCAL,
                    }
                  : {}
              ),
            }),
          );

          orbitId =
            'orbit-star-a';

          orbits.push(
            stellarOrbitSnapshot(
              orbitId,
              'A',
              innerMotion,
              primaryInnerScale,
              innerPairAnchorContributions,
              sceneScale,
              world.multiplicityName ===
                'TRIPLE'
                ? SystemSceneProjectionSpace.TRIPLE_LOCAL
                : SystemSceneProjectionSpace.GLOBAL,
            ),
          );
        }

        if (
          innerMotion !==
            null &&
          star.label ===
            'B'
        ) {
          contributions.push(
            Object.freeze({
              motionId:
                innerMotion.id,
              scale:
                secondaryInnerScale,
              ...(
                world.multiplicityName ===
                  'TRIPLE'
                  ? {
                      projectionSpace:
                        SystemSceneProjectionSpace.TRIPLE_LOCAL,
                    }
                  : {}
              ),
            }),
          );

          orbitId =
            'orbit-star-b';

          orbits.push(
            stellarOrbitSnapshot(
              orbitId,
              'B',
              innerMotion,
              secondaryInnerScale,
              innerPairAnchorContributions,
              sceneScale,
              world.multiplicityName ===
                'TRIPLE'
                ? SystemSceneProjectionSpace.TRIPLE_LOCAL
                : SystemSceneProjectionSpace.GLOBAL,
            ),
          );
        }

        if (
          outerMotion !==
            null &&
          star.label ===
            'C'
        ) {
          contributions.push(
            Object.freeze({
              motionId:
                outerMotion.id,
              scale:
                tertiaryOuterScale,
              projectionSpace:
                SystemSceneProjectionSpace.TRIPLE_OUTER,
            }),
          );

          orbitId =
            'orbit-star-c';

          orbits.push(
            stellarOrbitSnapshot(
              orbitId,
              'C',
              outerMotion,
              tertiaryOuterScale,
              Object.freeze([]),
              sceneScale,
              SystemSceneProjectionSpace.TRIPLE_OUTER,
            ),
          );
        }

        const frozenContributions =
          Object.freeze(
            contributions,
          );

        return Object.freeze({
          id:
            star.id,
          kind:
            'star' as const,
          label:
            star.label,
          title:
            star.title,
          colorHex:
            star.colorHex,
          radiusScene:
            starRadiusSceneById.get(
              star.id,
            )!,
          position:
            orbitalContributionPositionScene(
              frozenContributions,
              motions,
              0,
              sceneScale,
            ),
          orbitId,
          motionContributions:
            frozenContributions,
          surfaceStyle:
            'emissive' as const,
          lightIntensity:
            systemSceneStellarLightIntensity(
              star.luminositySolar,
            ),
          sourceLuminositySolar:
            star.luminositySolar,
          spin:
            Object.freeze({
              source:
                'UNAVAILABLE' as const,
              rotationPeriodHours:
                null,
              axialTiltDegrees:
                null,
              isRetrograde:
                null,
              isSynchronized:
                false,
              epochPhaseDegrees:
                seededPhaseDegrees(
                  `${world.stellarSystem.seed.normalizedValue}:${star.label}:SPIN`,
                ),
            } satisfies SystemSceneBodySpinSnapshot),
          surfaceEnvironment:
            null,
          giantAtmosphere:
            null,
        });
      },
    );

  const atmosphereByPlanetOrdinal =
    new Map(
      world.atmospheres.map(
        atmosphere =>
          [
            atmosphere.hostPlanet.planetOrdinal,
            atmosphere,
          ] as const,
      ),
    );

  const planets =
    world.planets.map(
      planet => {
        const orbitId =
          `orbit-planet-${planet.planetOrdinal}`;

        const tripleLayoutEntry =
          triplePlanetaryLayoutByOrdinal.get(
            planet.planetOrdinal,
          ) ??
          null;

        const motion =
          Object.freeze({
            id:
              `planet-${planet.planetOrdinal}-motion`,
            semiMajorAxisAu:
              planet.orbit.semiMajorAxisAu,
            eccentricity:
              planet.orbit.eccentricity,
            periodDays:
              planet.orbitalPeriod.periodDays,
            rotationDegrees:
              normalizedAngle(
                planet.orbit
                  .longitudeOfAscendingNodeDegrees +
                planet.orbit
                  .argumentOfPeriapsisDegrees,
              ),
            inclinationDegrees:
              planet.orbit
                .inclinationDegrees,
            epochMeanAnomalyDegrees:
              seededPhaseDegrees(
                planet.orbit.bodySeed
                  .normalizedValue,
              ),
          } satisfies SystemSceneOrbitalMotionSnapshot);

        motions.push(
          motion,
        );

        const anchorContributions =
          world.stellarSystem
            .orbitHierarchy
            .outerOrbit ===
              null
              ? Object.freeze([])
              : innerPairAnchorContributions;

        const motionContributions =
          Object.freeze([
            ...anchorContributions,
            Object.freeze({
              motionId:
                motion.id,
              scale:
                1,
              ...(
                world.multiplicityName ===
                  'TRIPLE'
                  ? {
                      projectionSpace:
                        SystemSceneProjectionSpace.TRIPLE_LOCAL,
                      ...(
                        tripleLayoutEntry ===
                          null
                          ? {}
                          : {
                              linearScenePerAu:
                                tripleLayoutEntry.scenePerAu,
                            }
                      ),
                    }
                  : {}
              ),
            }),
          ] satisfies SystemSceneMotionContributionSnapshot[]);

        const planetProjectionSpace =
          world.multiplicityName ===
            'TRIPLE'
            ? SystemSceneProjectionSpace.TRIPLE_LOCAL
            : SystemSceneProjectionSpace.GLOBAL;

        const semiMajorScene =
          tripleLayoutEntry
            ?.semiMajorScene ??
          systemSceneProjectedRadiusAuInSpace(
            planet.orbit.semiMajorAxisAu,
            sceneScale,
            planetProjectionSpace,
          );

        orbits.push(
          Object.freeze({
            id:
              orbitId,
            kind:
              'planetary' as const,
            label:
              planet.designation.name,
            colorHex:
              '#99BCCD',
            opacity:
              0.26,
            semiMajorScene,
            semiMinorScene:
              tripleLayoutEntry ===
                null
                ? systemSceneProjectedRadiusAuInSpace(
                    planet.orbit.semiMajorAxisAu *
                      Math.sqrt(
                        1 -
                          planet.orbit.eccentricity ** 2,
                      ),
                    sceneScale,
                    planetProjectionSpace,
                  )
                : semiMajorScene *
                  Math.sqrt(
                    1 -
                      planet.orbit.eccentricity ** 2,
                  ),
            focusOffsetScene:
              tripleLayoutEntry ===
                null
                ? systemSceneProjectedRadiusAuInSpace(
                    planet.orbit.semiMajorAxisAu *
                      planet.orbit.eccentricity,
                    sceneScale,
                    planetProjectionSpace,
                  )
                : semiMajorScene *
                  planet.orbit.eccentricity,
            rotationDegrees:
              motion.rotationDegrees,
            inclinationDegrees:
              motion.inclinationDegrees,
            motionId:
              motion.id,
            motionScale:
              1,
            anchorMotionContributions:
              anchorContributions,
            ...(
              planetProjectionSpace ===
                SystemSceneProjectionSpace.GLOBAL
                ? {}
                : {
                    projectionSpace:
                      planetProjectionSpace,
                  }
            ),
            ...(
              tripleLayoutEntry ===
                null
                ? {}
                : {
                    linearScenePerAu:
                      tripleLayoutEntry.scenePerAu,
                  }
            ),
          }),
        );

        return Object.freeze({
          id:
            `planet-${planet.planetOrdinal}`,
          kind:
            'planet' as const,
          label:
            planet.designation.name,
          title:
            planet.designation.name,
          colorHex:
            planetColor(
              planet,
            ),
          radiusScene:
            planetRadiusSceneByOrdinal.get(
              planet.planetOrdinal,
            )!,
          position:
            orbitalContributionPositionScene(
              motionContributions,
              motions,
              0,
              sceneScale,
            ),
          orbitId,
          motionContributions,
          surfaceStyle:
            planetSurfaceStyle(
              planet,
            ),
          lightIntensity:
            0,
          sourceLuminositySolar:
            null,
          spin:
            Object.freeze({
              source:
                'PLANET_19_3' as const,
              rotationPeriodHours:
                planet.rotationPeriodHours,
              axialTiltDegrees:
                planet.axialTiltDegrees,
              isRetrograde:
                planet.isRetrogradeRotation,
              isSynchronized:
                planet.isTidallySynchronized,
              epochPhaseDegrees:
                seededPhaseDegrees(
                  `${planet.orbit.bodySeed.normalizedValue}:SPIN`,
                ),
            } satisfies SystemSceneBodySpinSnapshot),
          surfaceEnvironment:
            projectPlanetSurfaceEnvironment(
              atmosphereByPlanetOrdinal.get(
                planet.planetOrdinal,
              ) ??
              null,
            ),
          giantAtmosphere:
            projectPlanetGiantAtmosphere(
              planet,
              atmosphereByPlanetOrdinal.get(
                planet.planetOrdinal,
              ) ??
              null,
            ),
        });
      },
    );

  // Point 24.6 layers must not alter the already-validated point-24.3
  // playback cadence. Freeze the stellar/planetary periods before adding
  // faster moon or minor-body motions.
  const primaryPlaybackPeriodsDays =
    Object.freeze(
      motions.map(
        motion =>
          motion.periodDays,
      ),
    );

  const playbackDaysPerRealSecond =
    systemSimulationPlaybackDaysPerSecond(
      primaryPlaybackPeriodsDays,
    );

  const planetSnapshotByOrdinal =
    new Map(
      planets.map(
        (planetSnapshot, index) =>
          [
            world.planets[index]!.planetOrdinal,
            planetSnapshot,
          ] as const,
      ),
    );

  const moons =
    projectMoonLayer(
      world,
      planetSnapshotByOrdinal,
      motions,
      orbits,
      sceneScale,
      playbackDaysPerRealSecond,
    );

  const maximumVisibleStarRadiusScene =
    Math.max(
      primaryStarRadiusScene,
      secondaryStarRadiusScene,
      tertiaryStarRadiusScene,
    );

  const minorBodies =
    projectMinorBodyLayer(
      world,
      innerPairAnchorContributions,
      motions,
      orbits,
      sceneScale,
      maximumVisibleStarRadiusScene,
      playbackDaysPerRealSecond,
    );

  const habitableHostVisualExtentScene =
    world.multiplicityName ===
      'SINGLE' ||
    innerOrbit ===
      null ||
    secondary ===
      null
      ? primaryStarRadiusScene
      : Math.max(
          primaryStarRadiusScene +
            systemSceneProjectedRadiusAuInSpace(
              innerOrbit.semiMajorAxisAu,
              sceneScale,
              world.multiplicityName === 'TRIPLE'
                ? SystemSceneProjectionSpace.TRIPLE_LOCAL
                : SystemSceneProjectionSpace.GLOBAL,
            ) *
            Math.abs(primaryInnerScale),
          secondaryStarRadiusScene +
            systemSceneProjectedRadiusAuInSpace(
              innerOrbit.semiMajorAxisAu,
              sceneScale,
              world.multiplicityName === 'TRIPLE'
                ? SystemSceneProjectionSpace.TRIPLE_LOCAL
                : SystemSceneProjectionSpace.GLOBAL,
            ) *
            Math.abs(secondaryInnerScale),
        );

  const habitableZone =
    projectHabitableZoneLayer(
      world,
      innerPairAnchorContributions,
      sceneScale,
      habitableHostVisualExtentScene,
    );

  const orbitalRiskTargets =
    projectOrbitalRiskLayer(
      world,
      planets,
      moons,
    );

  const frozenMotions =
    Object.freeze(
      motions,
    );

  return Object.freeze({
    stars:
      Object.freeze(stars),
    planets:
      Object.freeze(planets),
    moons,
    minorBodies,
    habitableZone,
    orbitalRiskTargets,
    layers:
      Object.freeze({
        moonCount:
          moons.length,
        minorBodyCount:
          minorBodies.length,
        habitableZoneAvailable:
          habitableZone !== null,
        orbitalRiskTargetCount:
          orbitalRiskTargets.filter(
            target =>
              target.severity !== 'CROSSING',
          ).length,
        orbitalCrossingTargetCount:
          orbitalRiskTargets.filter(
            target =>
              target.severity === 'CROSSING',
          ).length,
        orbitalApproachTargetCount:
          orbitalRiskTargets.filter(
            target =>
              target.severity === 'APPROACH',
          ).length,
        orbitalCollisionGeometryTargetCount:
          orbitalRiskTargets.filter(
            target =>
              target.severity === 'COLLISION_GEOMETRY',
          ).length,
      }),
    orbits:
      Object.freeze(orbits),
    motions:
      frozenMotions,
    simulation:
      Object.freeze({
        epochSimulationDay:
          0,
        playbackDaysPerRealSecond,
      }),
    scale:
      sceneScale,
  });
}


function projectHabitableZoneLayer(
  world:
    MaterializedStellarSceneWorld,

  innerPairAnchorContributions:
    readonly SystemSceneMotionContributionSnapshot[],

  sceneScale:
    SystemSceneScaleSnapshot,

  habitableHostVisualExtentScene:
    number,
): SystemSceneHabitableZoneSnapshot | null {

  const zone =
    world.habitableZone;

  const projectionSpace =
    world.multiplicityName ===
      'TRIPLE'
      ? SystemSceneProjectionSpace.TRIPLE_LOCAL
      : SystemSceneProjectionSpace.GLOBAL;

  const anchorMotionContributions =
    world.multiplicityName ===
      'TRIPLE'
      ? innerPairAnchorContributions
      : Object.freeze([]);

  const dynamicInner =
    zone.dynamicallyHabitableInnerEdgeAu;

  const dynamicOuter =
    zone.dynamicallyHabitableOuterEdgeAu;

  const rawRadiativeInnerScene =
    systemSceneProjectedOverlayRadiusAuInSpace(
      zone.radiativeInnerEdgeAu,
      sceneScale,
      projectionSpace,
    );

  const rawRadiativeOuterScene =
    systemSceneProjectedOverlayRadiusAuInSpace(
      zone.radiativeOuterEdgeAu,
      sceneScale,
      projectionSpace,
    );

  const presentation =
    buildSystemSceneHabitableZonePresentationV2({
      radiativeInnerAu:
        zone.radiativeInnerEdgeAu,
      radiativeOuterAu:
        zone.radiativeOuterEdgeAu,
      dynamicallyHabitableInnerAu:
        dynamicInner,
      dynamicallyHabitableOuterAu:
        dynamicOuter,
      rawRadiativeInnerScene,
      rawRadiativeOuterScene,
      hostVisualExtentScene:
        habitableHostVisualExtentScene,
    });

  return Object.freeze({
    topology:
      zone.orbitTopology ===
        'CIRCUMSTELLAR'
        ? 'CIRCUMSTELLAR' as const
        : 'CIRCUMBINARY' as const,
    radiativeInnerEdgeAu:
      zone.radiativeInnerEdgeAu,
    radiativeOuterEdgeAu:
      zone.radiativeOuterEdgeAu,
    dynamicallyHabitableInnerEdgeAu:
      dynamicInner,
    dynamicallyHabitableOuterEdgeAu:
      dynamicOuter,
    radiativeInnerRadiusScene:
      presentation.radiativeInnerScene,
    radiativeOuterRadiusScene:
      presentation.radiativeOuterScene,
    dynamicallyHabitableInnerRadiusScene:
      presentation.dynamicallyHabitableInnerScene,
    dynamicallyHabitableOuterRadiusScene:
      presentation.dynamicallyHabitableOuterScene,
    presentationAdjusted:
      Math.abs(
        presentation.radiativeInnerScene -
        rawRadiativeInnerScene,
      ) > 1e-9 ||
      Math.abs(
        presentation.radiativeOuterScene -
        rawRadiativeOuterScene,
      ) > 1e-9,
    dynamicalOverlapFraction01:
      zone.dynamicalOverlapFraction01,
    anchorMotionContributions:
      Object.freeze([
        ...anchorMotionContributions,
      ]),
    ...(
      projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL
        ? {}
        : {
            projectionSpace,
          }
    ),
  });
}

function projectOrbitalRiskLayer(
  world:
    MaterializedStellarSceneWorld,

  planets:
    readonly SystemSceneBodySnapshot[],

  moons:
    readonly SystemSceneMoonSnapshot[],
): readonly SystemSceneOrbitalRiskTargetSnapshot[] {

  const catalog =
    world.impactRiskCatalog;

  if (
    catalog ===
      null
  ) {
    return Object.freeze([]);
  }

  const bodyById =
    new Map<
      string,
      SystemSceneBodySnapshot |
      SystemSceneMoonSnapshot
    >([
      ...planets.map(
        body =>
          [
            body.id,
            body,
          ] as const,
      ),
      ...moons.map(
        body =>
          [
            body.id,
            body,
          ] as const,
      ),
    ]);

  interface MutableRiskAggregate {
    readonly targetBodyId:
      string;

    readonly targetOrbitId:
      string;

    readonly targetKind:
      'planet' |
      'moon';

    readonly targetLabel:
      string;

    readonly sourceMinorBodyIds:
      Set<string>;

    riskCandidateCount:
      number;

    radialCrossingOnlyCount:
      number;

    directCollisionGeometryCount:
      number;

    highestOrbitalRiskIndex01:
      number;

    highestRegimeName:
      string;

    highestRegimePriority:
      number;
  }

  const aggregates =
    new Map<
      string,
      MutableRiskAggregate
    >();

  for (
    const assessment
    of catalog.relevantAssessments
  ) {
    const targetBodyId =
      assessment.isPlanetTarget
        ? `planet-${assessment.targetPlanetOrdinal}`
        : `moon-${assessment.targetPlanetOrdinal}-${assessment.targetMoonOrdinal}`;

    const targetBody =
      bodyById.get(
        targetBodyId,
      ) ??
      null;

    if (
      targetBody ===
        null ||
      targetBody.orbitId ===
        null
    ) {
      continue;
    }

    const regimePriority =
      orbitalRiskRegimePriority(
        assessment.regime.name,
      );

    let aggregate =
      aggregates.get(
        targetBodyId,
      ) ??
      null;

    if (
      aggregate ===
        null
    ) {
      aggregate = {
        targetBodyId,
        targetOrbitId:
          targetBody.orbitId,
        targetKind:
          assessment.isPlanetTarget
            ? 'planet'
            : 'moon',
        targetLabel:
          targetBody.title,
        sourceMinorBodyIds:
          new Set<string>(),
        riskCandidateCount: 0,
        radialCrossingOnlyCount: 0,
        directCollisionGeometryCount: 0,
        highestOrbitalRiskIndex01: 0,
        highestRegimeName:
          assessment.regime.name,
        highestRegimePriority:
          regimePriority,
      };

      aggregates.set(
        targetBodyId,
        aggregate,
      );
    }

    aggregate.sourceMinorBodyIds.add(
      assessment.minorBodyProceduralId,
    );

    if (
      assessment.riskCandidate
    ) {
      aggregate.riskCandidateCount +=
        1;
    }

    if (
      assessment.regime.name ===
        'RADIAL_CROSSING_ONLY'
    ) {
      aggregate.radialCrossingOnlyCount +=
        1;
    }

    if (
      assessment.directCollisionGeometryCandidate
    ) {
      aggregate.directCollisionGeometryCount +=
        1;
    }

    aggregate.highestOrbitalRiskIndex01 =
      Math.max(
        aggregate.highestOrbitalRiskIndex01,
        assessment.orbitalRiskIndex01,
      );

    if (
      regimePriority >
        aggregate.highestRegimePriority
    ) {
      aggregate.highestRegimePriority =
        regimePriority;
      aggregate.highestRegimeName =
        assessment.regime.name;
    }
  }

  return Object.freeze(
    [...aggregates.values()]
      .map(
        aggregate =>
          Object.freeze({
            id:
              `orbital-risk-${aggregate.targetBodyId}`,
            targetBodyId:
              aggregate.targetBodyId,
            targetOrbitId:
              aggregate.targetOrbitId,
            targetKind:
              aggregate.targetKind,
            targetLabel:
              aggregate.targetLabel,
            sourceMinorBodyCount:
              aggregate.sourceMinorBodyIds.size,
            riskCandidateCount:
              aggregate.riskCandidateCount,
            approachCorridorCount:
              Math.max(
                0,
                aggregate.riskCandidateCount -
                aggregate.directCollisionGeometryCount,
              ),
            radialCrossingOnlyCount:
              aggregate.radialCrossingOnlyCount,
            directCollisionGeometryCount:
              aggregate.directCollisionGeometryCount,
            severity:
              aggregate.directCollisionGeometryCount > 0
                ? 'COLLISION_GEOMETRY' as const
                : aggregate.riskCandidateCount > 0
                  ? 'APPROACH' as const
                  : 'CROSSING' as const,
            highestOrbitalRiskIndex01:
              aggregate.highestOrbitalRiskIndex01,
            highestRegimeName:
              aggregate.highestRegimeName,
            colorHex:
              orbitalRiskColorHex(
                aggregate.directCollisionGeometryCount,
                aggregate.riskCandidateCount,
              ),
          }),
      )
      .sort(
        (left, right) =>
          right.highestOrbitalRiskIndex01 -
          left.highestOrbitalRiskIndex01 ||
          left.targetBodyId.localeCompare(
            right.targetBodyId,
          ),
      ),
  );
}

function orbitalRiskRegimePriority(
  regimeName:
    string,
): number {

  switch (
    regimeName
  ) {
    case 'PLANET_COLLISION_CORRIDOR':
      return 4;
    case 'PLANET_APPROACH_CORRIDOR':
    case 'MOON_ORBITAL_REGION':
      return 3;
    case 'RADIAL_CROSSING_ONLY':
      return 2;
    default:
      return 0;
  }
}

function orbitalRiskColorHex(
  directCollisionGeometryCount:
    number,

  riskCandidateCount:
    number,
): string {

  if (
    directCollisionGeometryCount >
      0
  ) {
    return '#FF624A';
  }

  if (
    riskCandidateCount >
      0
  ) {
    return '#FFAA52';
  }

  return '#F2D56B';
}


const AU_KILOMETERS =
  149_597_870.7;

function projectMoonLayer(
  world:
    MaterializedStellarSceneWorld,

  planetSnapshotByOrdinal:
    ReadonlyMap<number, SystemSceneBodySnapshot>,

  motions:
    SystemSceneOrbitalMotionSnapshot[],

  orbits:
    SystemSceneOrbitSnapshot[],

  sceneScale:
    SystemSceneScaleSnapshot,

  playbackDaysPerRealSecond:
    number,
): readonly SystemSceneMoonSnapshot[] {

  const moons:
    SystemSceneMoonSnapshot[] = [];

  for (
    const moonSystem
    of world.moonSystems
  ) {
    const hostPlanet =
      planetSnapshotByOrdinal.get(
        moonSystem.hostPlanet.planetOrdinal,
      ) ??
      null;

    if (
      hostPlanet ===
        null
    ) {
      continue;
    }

    const relevantMoons =
      [...moonSystem.relevantMoons]
        .sort(
          (left, right) =>
            left.orbit.semiMajorAxisKilometers -
            right.orbit.semiMajorAxisKilometers,
        );

    for (
      let index = 0;
      index <
        relevantMoons.length;
      index += 1
    ) {
      const moon =
        relevantMoons[index]!;

      const moonRadiusScene =
        clamp(
          0.009 +
            0.012 *
              Math.sqrt(
                moon.physicalProperties.radiusEarth,
              ),
          0.012,
          0.032,
        );

      const targetSemiMajorScene =
        hostPlanet.radiusScene +
        0.070 +
        moonRadiusScene +
        index *
          0.075;

      const semiMajorAxisAu =
        moon.orbit.semiMajorAxisKilometers /
        AU_KILOMETERS;

      const linearScenePerAu =
        targetSemiMajorScene /
        semiMajorAxisAu;

      const motion =
        Object.freeze({
          id:
            `moon-${moon.hostPlanetOrdinal}-${moon.moonOrdinal}-motion`,
          semiMajorAxisAu,
          eccentricity:
            moon.orbit.eccentricity,
          periodDays:
            moon.orbit.orbitalPeriodDays,
          rotationDegrees:
            seededPhaseDegrees(
              `${moon.identity.seed.normalizedValue}:NODE`,
            ),
          inclinationDegrees:
            moon.orbit.inclinationDegrees,
          epochMeanAnomalyDegrees:
            seededPhaseDegrees(
              moon.identity.seed.normalizedValue,
            ),
        } satisfies SystemSceneOrbitalMotionSnapshot);

      motions.push(
        motion,
      );

      const localContribution =
        Object.freeze({
          motionId:
            motion.id,
          scale:
            1,
          linearScenePerAu,
          presentationTimeScale:
            systemSceneMoonPresentationTimeScale(
              moon.orbit.orbitalPeriodDays,
              playbackDaysPerRealSecond,
            ),
        } satisfies SystemSceneMotionContributionSnapshot);

      const motionContributions =
        Object.freeze([
          ...hostPlanet.motionContributions,
          localContribution,
        ]);

      const orbitId =
        `orbit-moon-${moon.hostPlanetOrdinal}-${moon.moonOrdinal}`;

      orbits.push(
        Object.freeze({
          id:
            orbitId,
          kind:
            'moon' as const,
          label:
            moon.identity.designation.name,
          colorHex:
            '#7EAFC6',
          opacity:
            0.32,
          semiMajorScene:
            targetSemiMajorScene,
          semiMinorScene:
            targetSemiMajorScene *
            Math.sqrt(
              1 -
              moon.orbit.eccentricity **
                2,
            ),
          focusOffsetScene:
            targetSemiMajorScene *
            moon.orbit.eccentricity,
          rotationDegrees:
            motion.rotationDegrees,
          inclinationDegrees:
            motion.inclinationDegrees,
          motionId:
            motion.id,
          motionScale:
            1,
          anchorMotionContributions:
            hostPlanet.motionContributions,
          linearScenePerAu,
        }),
      );

      moons.push(
        Object.freeze({
          id:
            `moon-${moon.hostPlanetOrdinal}-${moon.moonOrdinal}`,
          kind:
            'moon' as const,
          label:
            moon.identity.designation.romanNumeral,
          title:
            moon.identity.designation.name,
          hostPlanetId:
            hostPlanet.id,
          hostPlanetOrdinal:
            moon.hostPlanetOrdinal,
          colorHex:
            moonColorHex(
              moon.physicalProperties.meanDensityGramsPerCubicCentimeter,
            ),
          radiusScene:
            moonRadiusScene,
          position:
            orbitalContributionPositionScene(
              motionContributions,
              motions,
              0,
              sceneScale,
            ),
          orbitId,
          motionContributions,
          spin:
            Object.freeze({
              source:
                'MOON_21_4' as const,
              rotationPeriodHours:
                moon.rotationPeriodHours,
              axialTiltDegrees:
                null,
              isRetrograde:
                null,
              isSynchronized:
                moon.isTidallyLocked,
              epochPhaseDegrees:
                seededPhaseDegrees(
                  `${moon.identity.seed.normalizedValue}:SPIN`,
                ),
            } satisfies SystemSceneBodySpinSnapshot),
        }),
      );
    }
  }

  return Object.freeze(
    moons,
  );
}

function projectMinorBodyLayer(
  world:
    MaterializedStellarSceneWorld,

  innerPairAnchorContributions:
    readonly SystemSceneMotionContributionSnapshot[],

  motions:
    SystemSceneOrbitalMotionSnapshot[],

  orbits:
    SystemSceneOrbitSnapshot[],

  sceneScale:
    SystemSceneScaleSnapshot,

  maximumVisibleStarRadiusScene:
    number,

  playbackDaysPerRealSecond:
    number,
): readonly SystemSceneMinorBodySnapshot[] {

  const catalog =
    world.minorBodyOrbitalCatalog;

  if (
    catalog ===
    null
  ) {
    return Object.freeze([]);
  }

  const minorBodies:
    SystemSceneMinorBodySnapshot[] = [];

  for (
    const entry
    of catalog.entries
  ) {
    const orbital =
      entry.orbitalElements;

    // Phase 22.8 interstellar visitors deliberately have no frozen orbital
    // epoch/period, so 24.6 does not invent a current position for them.
    if (
      !orbital.isBound ||
      orbital.orbitalPeriodYears ===
        null ||
      orbital.meanAnomalyDegrees ===
        null
    ) {
      continue;
    }

    const motion =
      Object.freeze({
        id:
          `minor-${orbital.kind.code}-${orbital.proceduralId}-motion`,
        semiMajorAxisAu:
          orbital.semiMajorAxisAu,
        eccentricity:
          orbital.eccentricity,
        periodDays:
          orbital.orbitalPeriodYears *
          365.25,
        rotationDegrees:
          normalizedAngle(
            orbital.longitudeAscendingNodeDegrees +
            orbital.argumentOfPeriapsisDegrees,
          ),
        inclinationDegrees:
          orbital.inclinationDegrees,
        longitudeAscendingNodeDegrees:
          orbital.longitudeAscendingNodeDegrees,
        argumentOfPeriapsisDegrees:
          orbital.argumentOfPeriapsisDegrees,
        epochMeanAnomalyDegrees:
          orbital.meanAnomalyDegrees,
      } satisfies SystemSceneOrbitalMotionSnapshot);

    motions.push(
      motion,
    );

    const projectionSpace =
      world.multiplicityName ===
        'TRIPLE'
        ? SystemSceneProjectionSpace.TRIPLE_LOCAL
        : SystemSceneProjectionSpace.GLOBAL;

    const anchorContributions =
      world.multiplicityName ===
        'TRIPLE'
        ? innerPairAnchorContributions
        : Object.freeze([]);

    const semiMajorScene =
      systemSceneProjectedRadiusAuInSpace(
        orbital.semiMajorAxisAu,
        sceneScale,
        projectionSpace,
      );

    const projectedPeriapsisScene =
      semiMajorScene *
      (
        1 -
        orbital.eccentricity
      );

    const minimumPeriapsisScene =
      Math.max(
        MINOR_BODY_MIN_PERIAPSIS_FLOOR_SCENE,
        maximumVisibleStarRadiusScene +
          MINOR_BODY_MIN_STAR_CLEARANCE_SCENE,
      );

    const presentationExpansionFactor =
      projectedPeriapsisScene >
        Number.EPSILON &&
      projectedPeriapsisScene <
        minimumPeriapsisScene
        ? minimumPeriapsisScene /
          projectedPeriapsisScene
        : 1;

    const presentedSemiMajorScene =
      semiMajorScene *
      presentationExpansionFactor;

    const presentedLinearScenePerAu =
      presentationExpansionFactor > 1 &&
      orbital.semiMajorAxisAu >
        Number.EPSILON
        ? presentedSemiMajorScene /
          orbital.semiMajorAxisAu
        : null;

    const localContribution =
      Object.freeze({
        motionId:
          motion.id,
        scale:
          1,
        presentationTimeScale:
          systemSceneMinorBodyPresentationTimeScale(
            motion.periodDays,
            playbackDaysPerRealSecond,
          ),
        ...(
          presentedLinearScenePerAu ===
            null
            ? {}
            : {
                linearScenePerAu:
                  presentedLinearScenePerAu,
              }
        ),
        ...(
          projectionSpace ===
            SystemSceneProjectionSpace.GLOBAL
            ? {}
            : {
                projectionSpace,
              }
        ),
      } satisfies SystemSceneMotionContributionSnapshot);

    const motionContributions =
      Object.freeze([
        ...anchorContributions,
        localContribution,
      ]);

    const orbitOpacity =
      clamp(
        (
          orbital.kind ===
            MinorBodyKind.COMET
            ? 0.28
            : 0.18
        ) +
        (
          presentationExpansionFactor >
            1
            ? 0.10
            : 0
        ),
        0.18,
        0.38,
      );

    const orbitId =
      `orbit-minor-${orbital.kind.code}-${orbital.proceduralId}`;

    orbits.push(
      Object.freeze({
        id:
          orbitId,
        kind:
          'minor-body' as const,
        label:
          orbital.localDesignation,
        colorHex:
          minorBodyColorHex(
            orbital.kind,
          ),
        opacity:
          orbitOpacity,
        semiMajorScene:
          presentedSemiMajorScene,
        semiMinorScene:
          presentedSemiMajorScene *
          Math.sqrt(
            1 -
            orbital.eccentricity **
              2,
          ),
        focusOffsetScene:
          presentedSemiMajorScene *
          orbital.eccentricity,
        rotationDegrees:
          motion.rotationDegrees,
        inclinationDegrees:
          motion.inclinationDegrees,
        motionId:
          motion.id,
        motionScale:
          1,
        anchorMotionContributions:
          anchorContributions,
        ...(
          presentedLinearScenePerAu ===
            null
            ? {}
            : {
                linearScenePerAu:
                  presentedLinearScenePerAu,
              }
        ),
        ...(
          projectionSpace ===
            SystemSceneProjectionSpace.GLOBAL
            ? {}
            : {
                projectionSpace,
              }
        ),
      }),
    );

    minorBodies.push(
      Object.freeze({
        id:
          `minor-${orbital.kind.code}-${orbital.proceduralId}`,
        kind:
          'minor-body' as const,
        minorBodyKind:
          orbital.kind,
        label:
          orbital.localDesignation,
        title:
          minorBodyTitle(
            orbital.kind,
            orbital.localDesignation,
          ),
        colorHex:
          minorBodyColorHex(
            orbital.kind,
          ),
        radiusScene:
          minorBodyRadiusScene(
            entry.body,
            orbital.kind,
          ),
        position:
          orbitalContributionPositionScene(
            motionContributions,
            motions,
            0,
            sceneScale,
          ),
        orbitId,
        motionContributions,
      }),
    );
  }

  return Object.freeze(
    minorBodies,
  );
}

function moonColorHex(
  density:
    number,
): string {
  if (
    density <
      1.8
  ) {
    return '#B9D8E8';
  }

  if (
    density <
      3.2
  ) {
    return '#A8A79F';
  }

  return '#8C8179';
}

function minorBodyColorHex(
  kind:
    MinorBodyKindValue,
): string {
  if (
    kind ===
    MinorBodyKind.COMET
  ) {
    return '#A8E9F3';
  }

  if (
    kind ===
    MinorBodyKind.TRANS_NEPTUNIAN_OBJECT
  ) {
    return '#75A9D2';
  }

  if (
    kind ===
    MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT
  ) {
    return '#C5A1E8';
  }

  return '#B59A78';
}

function minorBodyTitle(
  kind:
    MinorBodyKindValue,

  designation:
    string,
): string {
  switch (
    kind
  ) {
    case MinorBodyKind.ASTEROID:
      return `Asteroide ${designation}`;
    case MinorBodyKind.COMET:
      return `Cometa ${designation}`;
    case MinorBodyKind.TRANS_NEPTUNIAN_OBJECT:
      return `Objeto transneptuniano ${designation}`;
    case MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT:
      return `Objeto extrasolar capturado ${designation}`;
    default:
      return designation;
  }
}

function minorBodyRadiusScene(
  body:
    MinorBodyGroundTruthObject,

  _kind:
    MinorBodyKindValue,
): number {

  const directDiameter =
    'diameterKilometers' in
      body &&
    typeof body.diameterKilometers ===
      'number'
      ? body.diameterKilometers
      : null;

  const propertiesDiameter =
    'properties' in
      body &&
    body.properties !==
      null &&
    typeof body.properties ===
      'object' &&
    'diameterKilometers' in
      body.properties &&
    typeof body.properties.diameterKilometers ===
      'number'
      ? body.properties.diameterKilometers
      : null;

  const diameterKilometers =
    directDiameter ??
    propertiesDiameter ??
    1;

  return clamp(
    0.010 +
      0.004 *
        Math.log10(
          1 +
          Math.max(
            0,
            diameterKilometers,
          ),
        ),
    0.011,
    0.028,
  );
}

function stellarOrbitSnapshot(
  orbitId:
    string,

  label:
    string,

  motion:
    SystemSceneOrbitalMotionSnapshot,

  motionScale:
    number,

  anchorMotionContributions:
    readonly SystemSceneMotionContributionSnapshot[],

  sceneScale:
    SystemSceneScaleSnapshot,

  projectionSpace:
    SystemSceneProjectionSpaceValue =
      SystemSceneProjectionSpace.GLOBAL,
): SystemSceneOrbitSnapshot {

  const absoluteScale =
    Math.abs(
      motionScale,
    );

  const semiMajorScene =
    projectionSpace ===
      SystemSceneProjectionSpace.GLOBAL
      ? systemSceneProjectedRadiusAu(
          motion.semiMajorAxisAu *
            absoluteScale,
          sceneScale,
        )
      : systemSceneProjectedRadiusAuInSpace(
          motion.semiMajorAxisAu,
          sceneScale,
          projectionSpace,
        ) *
        absoluteScale;

  return Object.freeze({
    id:
      orbitId,
    kind:
      'stellar' as const,
    label,
    colorHex:
      '#FFFFFF',
    opacity:
      0.22,
    semiMajorScene,
    semiMinorScene:
      semiMajorScene *
      Math.sqrt(
        1 -
          motion.eccentricity ** 2,
      ),
    focusOffsetScene:
      semiMajorScene *
      motion.eccentricity,
    rotationDegrees:
      motion.rotationDegrees,
    inclinationDegrees:
      motion.inclinationDegrees,
    motionId:
      motion.id,
    motionScale,
    anchorMotionContributions,
    ...(
      projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL
        ? {}
        : {
            projectionSpace,
          }
    ),
  });
}

function orbitalContributionPositionScene(
  contributions:
    readonly SystemSceneMotionContributionSnapshot[],

  motions:
    readonly SystemSceneOrbitalMotionSnapshot[],

  simulationDay:
    number,

  sceneScale:
    SystemSceneScaleSnapshot,
): SystemSceneVector3 {

  return projectSystemSceneMotionContributions(
    contributions,
    motionId =>
      motions.find(
        candidate =>
          candidate.id ===
            motionId,
      ),
    simulationDay,
    sceneScale,
  );
}

function planetColor(
  planet:
    Planet,
): string {

  if (
    planet.surfaceBaseProperties
      .surfaceRegime ===
      PlanetSurfaceBaseRegime.FROZEN_VOLATILE
  ) {
    return '#BADDF2';
  }

  switch (
    planet.typeClassification
      .planetType
  ) {
    case PlanetType.ROCKY:
      return '#9A8F86';

    case PlanetType.SUPER_EARTH:
      return '#8FA292';

    case PlanetType.DESERT:
      return '#C8A36A';

    case PlanetType.OCEAN:
      return '#4B7FCB';

    case PlanetType.ICE:
      return '#DCECF8';

    case PlanetType.VOLCANIC:
      return '#C76339';

    case PlanetType.MINI_NEPTUNE:
      return '#4FB0BE';

    case PlanetType.GAS_GIANT:
      return '#D1A16C';

    case PlanetType.ICE_GIANT:
      return '#7BC3DC';

    default:
      return '#9AAFC1';
  }
}

function projectPlanetSurfaceEnvironment(
  atmosphere:
    Atmosphere | null,
): SystemScenePlanetSurfacePresentationSnapshot | null {

  if (
    atmosphere ===
      null
  ) {
    return null;
  }

  return buildSystemScenePlanetSurfacePresentationV1({
    waterInventoryIndex01:
      atmosphere.waterInventoryIndex01,
    surfaceLiquidWaterCoverageFraction01:
      atmosphere.surfaceLiquidWaterCoverageFraction01,
    surfaceIceCoverageFraction01:
      atmosphere.surfaceIceCoverageFraction01,
    waterVaporFraction01:
      atmosphere.waterVaporFraction01,
    retainedAtmosphericWaterVaporMoleFraction01:
      atmosphere.waterInventory.sourceRetainedAtmosphericWaterVaporMoleFraction01,
    meanSurfaceTemperatureKelvin:
      atmosphere.climateState.meanSurfaceTemperatureKelvin,
    climateStabilityIndex01:
      atmosphere.climateVariabilityState.stabilityIndex01,
    retainedSurfacePressurePascal:
      atmosphere.retentionState.retainedSurfacePressurePascal,
    geologicalActivityIndex01:
      atmosphere.geologicalActivityIndex01,
    volcanismIndex01:
      atmosphere.volcanismIndex01,
    surfaceWaterRegime:
      atmosphere.surfaceWaterRegime,
    volcanismRegime:
      atmosphere.volcanismRegime,
  });
}

function projectPlanetGiantAtmosphere(
  planet:
    Planet,

  atmosphere:
    Atmosphere | null,
): SystemSceneGiantAtmospherePresentationSnapshot | null {

  if (
    atmosphere ===
      null
  ) {
    return null;
  }

  return buildSystemSceneGiantAtmospherePresentationV1({
    planetType:
      planet.planetType,
    massEarth:
      planet.massEarth,
    radiusEarth:
      planet.radiusEarth,
    densityGramsPerCubicCentimeter:
      planet.physicalProperties
        .densityGramsPerCubicCentimeter,
    envelopeMassFraction01:
      planet.physicalProperties
        .envelopeMassFraction01,
    iceBearingFractionOfSolids01:
      planet.internalComposition
        .iceBearingFractionOfSolids01,
    rotationPeriodHours:
      planet.rotationPeriodHours,
    equilibriumTemperatureKelvin:
      atmosphere.climateState
        .equilibriumTemperatureKelvin,
    referenceBondAlbedo01:
      planet.referenceBondAlbedo01,
    retainedMeanMolarMassGramsPerMole:
      atmosphere.retainedMeanMolarMassGramsPerMole,
    retainedGasComposition:
      atmosphere.retainedGasComposition.map(
        component =>
          Object.freeze({
            gas:
              component.gas,
            moleFraction01:
              component.moleFraction01,
          }),
      ),
  });
}

function planetSurfaceStyle(
  planet:
    Planet,
): SystemSceneBodySnapshot['surfaceStyle'] {

  if (
    planet.surfaceBaseProperties
      .isDeepEnvelopeSurface
  ) {
    return 'gaseous';
  }

  switch (
    planet.typeClassification
      .planetType
  ) {
    case PlanetType.OCEAN:
      return 'oceanic';

    case PlanetType.ICE:
      return 'icy';

    case PlanetType.VOLCANIC:
      return 'volcanic';

    case PlanetType.MINI_NEPTUNE:
    case PlanetType.GAS_GIANT:
    case PlanetType.ICE_GIANT:
      return 'gaseous';

    default:
      return 'rocky';
  }
}

function scaledRadius(
  value:
    number,

  minInput:
    number,

  maxInput:
    number,

  minRadius:
    number,

  maxRadius:
    number,
): number {

  if (
    maxInput <=
    minInput
  ) {
    return (
      minRadius +
      maxRadius
    ) / 2;
  }

  const normalized =
    clamp01(
      (
        Math.sqrt(
          value,
        ) -
        Math.sqrt(
          minInput,
        )
      ) /
      (
        Math.sqrt(
          maxInput,
        ) -
        Math.sqrt(
          minInput,
        )
      ),
    );

  return minRadius +
    (
      maxRadius -
      minRadius
    ) *
      normalized;
}

function radiusRange(
  values:
    readonly number[],
): {
  readonly min:
    number;

  readonly max:
    number;
} {

  if (
    values.length ===
    0
  ) {
    return Object.freeze({
      min: 1,
      max: 1,
    });
  }

  return Object.freeze({
    min:
      Math.min(
        ...values,
      ),
    max:
      Math.max(
        ...values,
      ),
  });
}

function seededPhaseDegrees(
  seedText:
    string,
): number {

  let accumulator =
    0;

  for (
    let index = 0;
    index <
      seedText.length;
    index += 1
  ) {
    accumulator =
      (
        accumulator *
          33 +
        seedText.charCodeAt(
          index,
        )
      ) %
      360;
  }

  return accumulator;
}

function normalizedAngle(
  value:
    number,
): number {

  const result =
    value %
    360;

  return result < 0
    ? result + 360
    : result;
}

function clamp01(
  value:
    number,
): number {

  return clamp(
    value,
    0,
    1,
  );
}

function clamp(
  value:
    number,

  min:
    number,

  max:
    number,
): number {

  return Math.min(
    max,
    Math.max(
      min,
      value,
    ),
  );
}
