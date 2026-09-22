import { buildV2CometVisualOrbit } from './system-scene-v2-comet-orbit-presentation';
import { projectPulsarSecondGenerationPlanets } from './system-scene-pulsar-planets';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';
import { v2HostMinorBodyOrbitalCatalog } from './system-scene-v2-minor-body-source';
import { v2MinorBodyTimeScale, V2_COMET_PHASE_WARP } from './system-scene-v2-minor-cadence';
import { withV2SinglePlanetCadence } from './system-scene-v2-planet-cadence';
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
  type RelevantAsteroid,
} from '../../domain/planetary/relevant-asteroid';

import {
  type RelevantComet,
} from '../../domain/planetary/relevant-comet';

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
  buildMultipleAdaptiveSystemScaleV3,
  buildSingleAdaptiveSystemScaleV3,
  buildTripleHierarchicalSystemScaleV3,
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
  buildSystemSceneHabitableZonePresentationV3,
} from './system-scene-habitable-zone-presentation';

import {
  buildSystemSceneHostVisualEnvelopeV3,
  type SystemSceneHostVisualEnvelopeV3,
} from './system-scene-host-visual-envelope';

import {
  buildSystemSceneMultistellarPresentationV4,
  systemSceneHabitableZoneVisualRegimeV4,
  type SystemSceneHabitableZoneVisualRegimeV4,
  type SystemSceneMultistellarPresentationV4,
} from './system-scene-multistellar-presentation';

import {
  buildSystemSceneStellarOrbitClearanceV5,
  type SystemSceneStellarOrbitClearanceV5,
} from './system-scene-stellar-orbit-clearance';

import {
  buildSystemSceneMultistellarPTypeClearanceV51,
  type SystemSceneMultistellarPTypeClearanceV51,
} from './system-scene-multistellar-p-type-clearance';

import {
  buildSystemSceneMultistellarCoreCompactionV52,
  type SystemSceneMultistellarCoreCompactionV52,
} from './system-scene-multistellar-core-compaction';

import {
  buildSystemSceneFirstOrbitAnchorV53,
  type SystemSceneFirstOrbitAnchorV53,
} from './system-scene-first-orbit-anchor';

import {
  SystemSceneScientificDisclosureTier,
  systemSceneScientificAccess,
} from './system-scene-scientific-access';

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
  buildSystemSceneAsteroidPresentationV1,
  type SystemSceneAsteroidPresentationInputV1,
  type SystemSceneAsteroidPresentationV1,
} from './system-scene-asteroid-presentation';

import {
  buildSystemSceneAsteroidBeltBandPresentationV1,
} from './system-scene-asteroid-belt-presentation';

import {
  buildSystemSceneCometPresentationV1,
  type SystemSceneCometPresentationInputV1,
  type SystemSceneCometPresentationV1,
} from './system-scene-comet-presentation';

import {
  buildSystemScenePlanetSpecialPresentationV1,
  type SystemScenePlanetSpecialPresentationV1,
} from './system-scene-planet-special-presentation';

import {
  buildSystemSceneMoonPresentationV1,
  type SystemSceneMoonPresentationV1,
} from './system-scene-moon-presentation';

import {
  limitSystemSceneMoonPresentationToHostV1,
} from './system-scene-moon-host-size-limit';

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
  type GeneratedSingleHost,
} from '../../simulation/stellar/stellar-multihost-formation';

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

  /** Renderer-only V5.2 multiplier applied after AU -> scene projection. */
  readonly postProjectionScale?:
    number;

  readonly anchorMotionContributions:
    readonly SystemSceneMotionContributionSnapshot[];

  readonly projectionSpace?:
    SystemSceneProjectionSpaceValue;

  readonly linearScenePerAu?:
    number;

  /** Visual comet-only elliptical shape, never an authoritative orbital element. */
  readonly presentationEccentricity?: number;
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

  /** Star-only optical reference retained when the photosphere is envelope-limited. */
  readonly opticalRadiusScene?:
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

  /** Real stellar photosphere (never the exaggerated renderer size). V2 activity only. */
  readonly sourceRadiusSolar?: number;
  readonly sourceEffectiveTemperatureKelvin?: number;

  readonly spin:
    SystemSceneBodySpinSnapshot;

  /** Point-25.3 solid-surface environment; null for stars. */
  readonly surfaceEnvironment:
    SystemScenePlanetSurfacePresentationSnapshot | null;

  /** Point-25.4 deep-envelope cloud-top atmosphere; null for stars/solid worlds. */
  readonly giantAtmosphere:
    SystemSceneGiantAtmospherePresentationSnapshot | null;

  /** Point-25.9 ring/special-shape read-only projection; null for stars. */
  readonly specialPresentation:
    SystemScenePlanetSpecialPresentationV1 | null;
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

  /** Point-25.10 read-only surface/atmosphere/size projection from frozen phase-21 moon state. */
  readonly visualPresentation:
    SystemSceneMoonPresentationV1;
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

  readonly asteroidPresentation:
    SystemSceneAsteroidPresentationV1 | null;

  readonly cometPresentation:
    SystemSceneCometPresentationV1 | null;
}

export interface SystemSceneAsteroidBeltSnapshot {
  readonly id:
    string;

  readonly label:
    string;

  readonly region:
    'INNER' |
    'OUTER';

  readonly innerEdgeAu:
    number;

  readonly outerEdgeAu:
    number;

  readonly peakAu:
    number | null;

  readonly populationIndex01:
    number;

  readonly innerRadiusScene:
    number;

  readonly outerRadiusScene:
    number;

  readonly peakRadiusScene:
    number | null;

  readonly colorHex:
    string;

  readonly opacity:
    number;

  readonly peakOpacity:
    number;

  readonly boundaryOpacity:
    number;

  readonly anchorMotionContributions:
    readonly SystemSceneMotionContributionSnapshot[];

  readonly projectionSpace?:
    SystemSceneProjectionSpaceValue;
}

export interface SystemSceneHabitableZoneSnapshot {
  readonly topology:
    'CIRCUMSTELLAR' |
    'CIRCUMBINARY';

  readonly radiativeReferenceApplicable?:
    boolean;

  readonly radiativeReferenceRegime?:
    string | null;

  /** V4 renderer semantics: radiative-only is not presented as a usable HZ. */
  readonly visualRegime?:
    SystemSceneHabitableZoneVisualRegimeV4;

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

  /** Point-16.5 P-type stability envelope, exposed only to the renderer. */
  readonly circumbinaryStabilityInnerEdgeAu?:
    number | null;

  readonly circumbinaryStabilityOuterEdgeAu?:
    number | null;

  readonly circumbinaryStabilityInnerRadiusScene?:
    number | null;

  readonly circumbinaryStabilityOuterRadiusScene?:
    number | null;

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
 * Point-24.10 immutable presentation snapshot, extended through 25.9 with read-only body, surface, atmosphere and special-element projections.
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

  /** Optional, public-only body-to-route mapping for new multihost scenes.
   * Absence means historical V1 ordinal addressing; when present, missing
   * entries MUST NOT fall back to parsing a visual id. */
  readonly scientificPlanetBindings?: readonly Readonly<{
    sceneBodyId: string; bodyIndex: string;
  }>[];
  readonly scientificMoonBindings?: readonly Readonly<{
    sceneBodyId: string; bodyIndex: string; moonIndex: string;
  }>[];

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

  /** V2 SINGLE separate-identity post-collapse worlds. Never phase-18 body indices. */
  readonly pulsarPlanetVisuals?: readonly SystemSceneBodySnapshot[];

  readonly moons:
    readonly SystemSceneMoonSnapshot[];

  readonly minorBodies:
    readonly SystemSceneMinorBodySnapshot[];

  readonly asteroidBelts?:
    readonly SystemSceneAsteroidBeltSnapshot[];

  readonly habitableZone:
    SystemSceneHabitableZoneSnapshot | null;

  /** Host-specific HZ layers supplied only by laboratory composites. */
  readonly habitableZones?:
    readonly SystemSceneHabitableZoneSnapshot[];

  /** Renderer-only V3 constraint for stellar photospheres around the HZ host. */
  readonly hostVisualEnvelope?:
    SystemSceneHostVisualEnvelopeV3 | null;

  /** Renderer-only V4 close-pair/triple photosphere deconfliction. */
  readonly multistellarPresentation?:
    SystemSceneMultistellarPresentationV4 | null;

  /** Renderer-only V5.1 P-type stellar-motion consistency diagnostic. */
  readonly multistellarPTypeClearance?:
    SystemSceneMultistellarPTypeClearanceV51 | null;

  /** Renderer-only V5.2 post-projection A-B core compaction. */
  readonly multistellarCoreCompaction?:
    SystemSceneMultistellarCoreCompactionV52 | null;

  /** Renderer-only V5.3 shared first-orbit anchor; no physics mutation. */
  readonly firstOrbitAnchor?: SystemSceneFirstOrbitAnchorV53 | null;

  /** Renderer-only V5 mandatory stellar/planetary-orbit optical clearance. */
  readonly stellarOrbitClearance?:
    SystemSceneStellarOrbitClearanceV5 | null;

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
   * Explicit laboratory/debug override for phase-22 minor bodies. Production
   * gameplay does not need to set it: a CONFIRMED host system now authorizes
   * the same read-only materialization boundary used by the 26.6 fiche.
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

  readonly asteroidBelts:
    ReturnType<typeof AsteroidBeltGenerator.generate> | null;

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

  readonly effectiveTemperatureKelvin: number;

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

const IDENTIFIED_TARGET_OUTER_RADIUS_SCENE =
  2.6;

const IDENTIFIED_STAR_RADIUS_SCENE =
  0.22;

const IDENTIFIED_STELLAR_ORBIT_COLOR =
  '#6A9FB7';

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

    const scientificAccess =
      systemSceneScientificAccess(
        source.discoveryState.code,
      );

    if (
      scientificAccess.disclosureTier ===
      SystemSceneScientificDisclosureTier.UNRESOLVED
    ) {
      return unresolvedSceneSnapshot(
        baseSnapshot,
      );
    }

    if (
      scientificAccess.disclosureTier ===
      SystemSceneScientificDisclosureTier.IDENTIFIED_STELLAR
    ) {
      return identifiedSceneSnapshot(
        source,
        baseSnapshot,
      );
    }

    const world =
      materializeSceneWorld(
        source,
      );

    return projectResolvedSceneWorld(baseSnapshot, world);
  }

  /**
   * Stage 6 opt-in: project one ALREADY MATERIALIZED physical SINGLE host.
   * Unlike buildFromSource, this boundary never selects multiplicity or
   * generates a second planet/atmosphere/moon population behind the renderer.
   * An aggregate compositor will attach these local snapshots to A/B/C orbits.
   * No live route, persistence or V1 generator switch occurs here.
   */
  static buildFromGeneratedSingle(
    source: SystemSceneSnapshotSource,
    host: GeneratedSingleHost,
  ): SystemSceneSnapshot {
    const key = new UniverseGenerationKey(
      UniverseSeed.parse(source.universeSeed),
      GeneratorVersion.fromCode(source.generatorVersionCode),
    );
    const locator = source.locator;
    const actual = host.stellarSystem.locator;
    if (source.discoveryState.code < DiscoveryState.CATALOGUED.code ||
        !host.internalGenerationKey.equals(host.stellarSystem.generationKey) ||
        host.stellarSystem.multiplicity.name !== 'SINGLE' ||
        locator.galaxyIndex !== actual.galaxyIndex ||
        locator.sectorKey !== actual.sectorKey ||
        locator.galacticObjectIndex !== actual.galacticObjectIndex ||
        host.planets.length !== host.atmospheres.length ||
        host.planets.length !== host.moonSystems.length) {
      throw new RangeError('Generated SINGLE scene needs a complete, catalogued source at the same system address.');
    }
    // A is physically generated in the unchanged V1 source scope even when
    // the public parent belongs to unreleased V2. Never expose that private
    // V1 key as a V2 public route or persistence identity.
    if (host.label === 'A' && !multihostPhysicalSourceKey(key).equals(host.internalGenerationKey)) {
      throw new RangeError('Primary A scene must share the public parent generation key.');
    }
    for (const planet of host.planets) {
      if (planet.hostPlanetarySystem !== host.planetarySystem ||
          host.atmospheres.filter(atmosphere => atmosphere.hostPlanet === planet).length !== 1 ||
          host.moonSystems.filter(moons => moons.hostPlanet === planet).length !== 1) {
        throw new Error('Generated SINGLE scene contains an unrelated planet, atmosphere or moon system.');
      }
    }
    const world: MaterializedStellarSceneWorld = Object.freeze({
      stellarSystem: host.stellarSystem,
      generationKey: host.internalGenerationKey,
      locator: host.stellarSystem.locator,
      title: host.stellarSystem.designation.name,
      multiplicityName: 'SINGLE',
      componentCount: 1,
      stars: resolveStarSources(host.stellarSystem, host.physical, host.spectral),
      planetarySystem: host.planetarySystem,
      planets: host.planets,
      atmospheres: host.atmospheres,
      moonSystems: host.moonSystems,
      minorBodyOrbitalCatalog: source.discoveryState.code >= DiscoveryState.CONFIRMED.code &&
        key.generatorVersion === GeneratorVersion.V2
        ? v2HostMinorBodyOrbitalCatalog(host) : null,
      asteroidBelts: source.discoveryState.code >= DiscoveryState.CONFIRMED.code
        ? host.asteroidBelts : null,
      habitableZone: host.planetarySystem?.habitableZone ??
        PlanetarySystemHabitableZoneGenerator.generate(host.internalGenerationKey, host.stellarSystem),
      impactRiskCatalog: null,
    });
    const base = snapshotBase(source);
    const projected = withV2SinglePlanetCadence(projectResolvedSceneWorld(Object.freeze({
      ...base,
      title: `${base.title} · ${host.label}`,
      multiplicityName: 'SINGLE',
      componentCount: 1,
    }), world));
    // V2-only optical presentation; V1 snapshots retain their exact radii.
    if (source.generatorVersionCode !== GeneratorVersion.V2.code) return projected;
    const visuallyAdjusted = Object.freeze({ ...projected,
      stars: Object.freeze(projected.stars.map(star => Object.freeze({
        ...star, radiusScene: star.radiusScene * 0.78,
        opticalRadiusScene: (star.opticalRadiusScene ?? star.radiusScene) * 0.78,
      }))),
    });
    const population = host.pulsarPlanetPopulation;
    if (population === undefined || population === null) return visuallyAdjusted;
    const extras = projectPulsarSecondGenerationPlanets(population, visuallyAdjusted);
    return Object.freeze({ ...visuallyAdjusted,
      pulsarPlanetVisuals: extras.planets,
      orbits: Object.freeze([...visuallyAdjusted.orbits, ...extras.orbits]),
      motions: Object.freeze([...visuallyAdjusted.motions, ...extras.motions]),
      accessibleLabel: `${visuallyAdjusted.accessibleLabel} ${extras.planets.length} planeta(s) postcolapso de segunda generación: hipótesis de formación.`,
    });
  }
}

/** Shared projection: legacy V1 and pre-generated sources must pass through the
 * EXACT SAME geometry implementation. Physics is already frozen at this point. */
function projectResolvedSceneWorld(
  baseSnapshot: ReturnType<typeof snapshotBase>,
  world: MaterializedStellarSceneWorld,
): SystemSceneSnapshot {
    const projected =
      projectSceneGeometry(
        world,
        baseSnapshot.generatorVersionCode,
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
      asteroidBelts:
        projected.asteroidBelts,
      habitableZone:
        projected.habitableZone,
      hostVisualEnvelope:
        projected.hostVisualEnvelope,
      multistellarPresentation:
        projected.multistellarPresentation,
      multistellarPTypeClearance:
        projected.multistellarPTypeClearance,
      multistellarCoreCompaction:
        projected.multistellarCoreCompaction,
      stellarOrbitClearance:
        projected.stellarOrbitClearance,
      firstOrbitAnchor:
        projected.firstOrbitAnchor,
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

function unresolvedSceneSnapshot(
  baseSnapshot:
    ReturnType<typeof snapshotBase>,
): SystemSceneSnapshot {

  return Object.freeze({
    ...baseSnapshot,
    accessibleLabel:
      `${baseSnapshot.accessibleLabel} Señal detectada: el sistema permanece visualmente sin resolver.`,
    stars:
      Object.freeze([]),
    planets:
      Object.freeze([]),
    moons:
      Object.freeze([]),
    minorBodies:
      Object.freeze([]),
    asteroidBelts:
      Object.freeze([]),
    habitableZone:
      null,
    orbitalRiskTargets:
      Object.freeze([]),
    layers:
      emptyLayerAvailability(),
    orbits:
      Object.freeze([]),
    motions:
      Object.freeze([]),
    simulation:
      unavailableSimulation(),
    scale:
      buildLinearFitSystemScale(
        DEFAULT_OUTER_RADIUS_AU,
        TARGET_OUTER_RADIUS_SCENE,
      ),
  });
}

/**
 * Point-26.2 identified-system projection for DISCOVERED/VISITED.
 *
 * This projection intentionally consumes only the state-safe Archive card. It
 * never materializes StellarSystem Ground Truth. Multiplicity and component
 * identity are already observed knowledge at this layer, so the renderer may
 * show the identified star(s) and schematic stellar orbit guides. Physical
 * masses, radii, luminosities, periods, eccentricities and planetary bodies
 * remain unavailable until CATALOGUED.
 */
function identifiedSceneSnapshot(
  source:
    SystemSceneSnapshotSource,

  baseSnapshot:
    ReturnType<typeof snapshotBase>,
): SystemSceneSnapshot {

  const card =
    source.stellarSystemCard;

  const multiplicityName =
    card.render.multiplicity
      ?.name ??
    null;

  const renderComponents =
    card.render.components;

  const positions =
    identifiedStarPositions(
      multiplicityName,
      renderComponents.length,
    );

  const orbits =
    identifiedStellarOrbits(
      multiplicityName,
    );

  const stars =
    Object.freeze(
      renderComponents.map(
        (
          component,
          index,
        ) => {
          const label =
            component.label;

          const componentCard =
            card.components.find(
              candidate =>
                candidate.componentLabel ===
                label,
            ) ??
            null;

          return Object.freeze({
            id:
              `identified-star-${label}`,
            kind:
              'star' as const,
            label,
            title:
              componentCard?.designation ??
              `Estrella ${label}`,
            colorHex:
              component.colorHex,
            radiusScene:
              IDENTIFIED_STAR_RADIUS_SCENE,
            position:
              positions[index] ??
              positions[0]!,
            orbitId:
              identifiedStarOrbitId(
                multiplicityName,
                label,
              ),
            motionContributions:
              Object.freeze([]),
            surfaceStyle:
              'emissive' as const,
            lightIntensity:
              1.4,
            sourceLuminositySolar:
              null,
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
                  0,
              }),
            surfaceEnvironment:
              null,
            giantAtmosphere:
              null,
            specialPresentation:
              null,
          });
        },
      ),
    );

  return Object.freeze({
    ...baseSnapshot,
    accessibleLabel:
      `${baseSnapshot.accessibleLabel} Arquitectura estelar identificada: ${stars.length} componente${stars.length === 1 ? '' : 's'} visible${stars.length === 1 ? '' : 's'} y órbitas estelares esquemáticas; cuerpos planetarios y magnitudes físicas permanecen bloqueados hasta Catalogado.`,
    stars,
    planets:
      Object.freeze([]),
    moons:
      Object.freeze([]),
    minorBodies:
      Object.freeze([]),
    asteroidBelts:
      Object.freeze([]),
    habitableZone:
      null,
    orbitalRiskTargets:
      Object.freeze([]),
    layers:
      emptyLayerAvailability(),
    orbits,
    motions:
      Object.freeze([]),
    simulation:
      unavailableSimulation(),
    scale:
      buildLinearFitSystemScale(
        2,
        IDENTIFIED_TARGET_OUTER_RADIUS_SCENE,
      ),
  });
}

function identifiedStarPositions(
  multiplicityName:
    string | null,

  componentCount:
    number,
): readonly SystemSceneVector3[] {

  if (
    multiplicityName ===
      'BINARY'
  ) {
    return Object.freeze([
      Object.freeze({
        x: -0.58,
        y: 0,
        z: 0,
      }),
      Object.freeze({
        x: 0.58,
        y: 0,
        z: 0,
      }),
    ]);
  }

  if (
    multiplicityName ===
      'TRIPLE'
  ) {
    return Object.freeze([
      Object.freeze({
        x: -0.46,
        y: 0,
        z: 0,
      }),
      Object.freeze({
        x: 0.46,
        y: 0,
        z: 0,
      }),
      Object.freeze({
        x: 0.35,
        y: 0.18,
        z: 1.35,
      }),
    ]);
  }

  const count =
    Math.max(
      1,
      componentCount,
    );

  return Object.freeze(
    Array.from(
      {
        length:
          count,
      },
      () =>
        Object.freeze({
          x: 0,
          y: 0,
          z: 0,
        }),
    ),
  );
}

function identifiedStellarOrbits(
  multiplicityName:
    string | null,
): readonly SystemSceneOrbitSnapshot[] {

  if (
    multiplicityName ===
      'BINARY'
  ) {
    return Object.freeze([
      identifiedOrbit(
        'identified-stellar-inner',
        'Órbita estelar A–B · esquema observado',
        0.82,
        0.56,
        12,
        18,
      ),
    ]);
  }

  if (
    multiplicityName ===
      'TRIPLE'
  ) {
    return Object.freeze([
      identifiedOrbit(
        'identified-stellar-inner',
        'Órbita estelar interior A–B · esquema observado',
        0.70,
        0.48,
        10,
        16,
      ),
      identifiedOrbit(
        'identified-stellar-outer',
        'Órbita estelar exterior · esquema observado',
        1.65,
        1.12,
        38,
        24,
      ),
    ]);
  }

  return Object.freeze([]);
}

function identifiedOrbit(
  id:
    string,

  label:
    string,

  semiMajorScene:
    number,

  semiMinorScene:
    number,

  rotationDegrees:
    number,

  inclinationDegrees:
    number,
): SystemSceneOrbitSnapshot {

  return Object.freeze({
    id,
    kind:
      'stellar' as const,
    label,
    colorHex:
      IDENTIFIED_STELLAR_ORBIT_COLOR,
    opacity:
      0.32,
    semiMajorScene,
    semiMinorScene,
    focusOffsetScene:
      0,
    rotationDegrees,
    inclinationDegrees,
    motionId:
      null,
    motionScale:
      1,
    anchorMotionContributions:
      Object.freeze([]),
  });
}

function identifiedStarOrbitId(
  multiplicityName:
    string | null,

  componentLabel:
    string,
): string | null {

  if (
    multiplicityName ===
      'BINARY'
  ) {
    return 'identified-stellar-inner';
  }

  if (
    multiplicityName ===
      'TRIPLE'
  ) {
    return componentLabel ===
      'C'
      ? 'identified-stellar-outer'
      : 'identified-stellar-inner';
  }

  return null;
}

function emptyLayerAvailability():
  SystemSceneLayerAvailabilitySnapshot {

  return Object.freeze({
    moonCount: 0,
    minorBodyCount: 0,
    habitableZoneAvailable: false,
    orbitalRiskTargetCount: 0,
    orbitalCrossingTargetCount: 0,
    orbitalApproachTargetCount: 0,
    orbitalCollisionGeometryTargetCount: 0,
  });
}

function unavailableSimulation():
  SystemSceneSimulationSnapshot {

  return Object.freeze({
    epochSimulationDay:
      0,
    playbackDaysPerRealSecond:
      1,
  });
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
        true ||
      source.discoveryState.code >=
        DiscoveryState.CONFIRMED.code,
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
    asteroidBelts:
      planetaryWorld.asteroidBelts,
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
      effectiveTemperatureKelvin: primaryPhysicalProperties.effectiveTemperatureKelvin,
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
    effectiveTemperatureKelvin: companion.physicalProperties.effectiveTemperatureKelvin,
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

  readonly asteroidBelts:
    ReturnType<typeof AsteroidBeltGenerator.generate> | null;

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
      asteroidBelts: null,
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
      asteroidBelts: null,
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
    asteroidBelts,
    habitableZone,
    impactRiskCatalog,
  });
}

function projectSceneGeometry(
  world:
    MaterializedStellarSceneWorld,

  generatorVersionCode:
    number,
): {
  readonly stars:
    readonly SystemSceneBodySnapshot[];

  readonly planets:
    readonly SystemSceneBodySnapshot[];

  readonly moons:
    readonly SystemSceneMoonSnapshot[];

  readonly minorBodies:
    readonly SystemSceneMinorBodySnapshot[];

  readonly asteroidBelts?:
    readonly SystemSceneAsteroidBeltSnapshot[];

  readonly habitableZone:
    SystemSceneHabitableZoneSnapshot | null;

  readonly hostVisualEnvelope:
    SystemSceneHostVisualEnvelopeV3;

  readonly multistellarPresentation:
    SystemSceneMultistellarPresentationV4 | null;

  readonly multistellarPTypeClearance:
    SystemSceneMultistellarPTypeClearanceV51 | null;

  readonly multistellarCoreCompaction:
    SystemSceneMultistellarCoreCompactionV52 | null;

  readonly stellarOrbitClearance:
    SystemSceneStellarOrbitClearanceV5 | null;

  readonly firstOrbitAnchor:
    SystemSceneFirstOrbitAnchorV53 | null;

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

  const starOpticalRadiusSceneById =
    new Map(
      starRadiusSceneById,
    );

  const planetRadiusSceneByOrdinal =
    new Map(
      world.planets.map(
        planet =>
          [
            planet.planetOrdinal,
            presentationPlanetRadiusScene(
              planet,
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

  const initialSceneScale =
    world.multiplicityName ===
      'SINGLE'
      ? buildSingleAdaptiveSystemScaleV3({
          outerRadiusAu,
          targetOuterRadiusScene:
            TARGET_OUTER_RADIUS_SCENE,
          innerPeriapsisAu:
            innerPlanetPeriapsisAu,
          starRadiusScene:
            primaryStarRadiusScene,
          maxPlanetRadiusScene,
          habitableZoneInnerAu:
            world.habitableZone.radiativeInnerEdgeAu,
          habitableZoneOuterAu:
            world.habitableZone.radiativeOuterEdgeAu,
        })
      : world.multiplicityName ===
          'TRIPLE' &&
        innerOrbit !==
          null &&
        outerOrbit !==
          null &&
        tertiary !==
          null
        ? buildTripleHierarchicalSystemScaleV3({
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
            habitableZoneInnerAu:
              world.habitableZone.radiativeInnerEdgeAu,
            habitableZoneOuterAu:
              world.habitableZone.radiativeOuterEdgeAu,
          })
        : buildMultipleAdaptiveSystemScaleV3({
            architecture:
              world.multiplicityName ===
                'TRIPLE'
                ? 'TRIPLE'
                : 'BINARY',
            outerRadiusAu,
            targetOuterRadiusScene:
              TARGET_OUTER_RADIUS_SCENE,
            innerBinaryPeriapsisAu:
              innerOrbit
                ?.periastronAu ??
              null,
            primaryStarRadiusScene,
            secondaryStarRadiusScene,
            habitableZoneInnerAu:
              world.habitableZone.radiativeInnerEdgeAu,
            habitableZoneOuterAu:
              world.habitableZone.radiativeOuterEdgeAu,
          });

  const pTypeProjectionSpace =
    world.multiplicityName ===
      'TRIPLE'
      ? SystemSceneProjectionSpace.TRIPLE_LOCAL
      : SystemSceneProjectionSpace.GLOBAL;

  const firstOrbitAnchor = buildSystemSceneFirstOrbitAnchorV53({
    architecture: world.multiplicityName === 'TRIPLE'
      ? 'TRIPLE'
      : world.multiplicityName === 'SINGLE'
        ? 'SINGLE'
        : 'BINARY',
    projectionSpace: pTypeProjectionSpace,
    nearestPeriapsisAu: innerPlanetPeriapsisAu,
    originalPeriapsisScene: innerPlanetPeriapsisAu === null
      ? null
      : systemSceneProjectedRadiusAuInSpace(
          innerPlanetPeriapsisAu,
          initialSceneScale,
          pTypeProjectionSpace,
        ),
    localOuterRadiusScene: pTypeProjectionSpace ===
      SystemSceneProjectionSpace.TRIPLE_LOCAL
      ? initialSceneScale.tripleHierarchy?.local.targetOuterRadiusScene ??
        initialSceneScale.targetOuterRadiusScene
      : initialSceneScale.targetOuterRadiusScene,
    basePrimaryRadiusScene: primaryStarRadiusScene,
    baseSecondaryRadiusScene: secondaryStarRadiusScene,
    // Conservative body allowance: protects every later planet as well.
    firstPlanetRadiusScene: maxPlanetRadiusScene,
  });

  // The shared projector, not a single orbit-specific offset, owns the anchor.
  // Orbital guides, motions, HZ, belts and risk all reuse this same scale.
  const sceneScale: SystemSceneScaleSnapshot = Object.freeze({
    ...initialSceneScale,
    firstOrbitAnchor,
  });

  const uncompressedPrimaryCenterExcursionScene =
    innerOrbit === null ||
    secondary === null
      ? 0
      : world.multiplicityName ===
          'TRIPLE'
        ? systemSceneProjectedRadiusAuInSpace(
            innerOrbit.apoastronAu,
            sceneScale,
            pTypeProjectionSpace,
          ) *
          Math.abs(primaryInnerScale)
        : systemSceneProjectedRadiusAuInSpace(
            innerOrbit.apoastronAu *
              Math.abs(primaryInnerScale),
            sceneScale,
            pTypeProjectionSpace,
          );

  const uncompressedSecondaryCenterExcursionScene =
    innerOrbit === null ||
    secondary === null
      ? 0
      : world.multiplicityName ===
          'TRIPLE'
        ? systemSceneProjectedRadiusAuInSpace(
            innerOrbit.apoastronAu,
            sceneScale,
            pTypeProjectionSpace,
          ) *
          Math.abs(secondaryInnerScale)
        : systemSceneProjectedRadiusAuInSpace(
            innerOrbit.apoastronAu *
              Math.abs(secondaryInnerScale),
            sceneScale,
            pTypeProjectionSpace,
          );

  const circumbinaryStabilityInnerEdgeAu =
    world.stellarSystem
      .circumbinaryPlanetCompatibility
      ?.minimumStableSemiMajorAxisAu ??
    null;

  const projectedCircumbinaryStabilityInnerScene =
    circumbinaryStabilityInnerEdgeAu ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          circumbinaryStabilityInnerEdgeAu,
          sceneScale,
          pTypeProjectionSpace,
        );

  const multistellarPTypeClearance =
    world.multiplicityName ===
        'SINGLE' ||
      innerOrbit ===
        null ||
      secondary ===
        null
      ? null
      : buildSystemSceneMultistellarPTypeClearanceV51({
          architecture:
            world.multiplicityName ===
              'TRIPLE'
              ? 'TRIPLE'
              : 'BINARY',
          stellarOuterExcursionAu:
            innerStellarOuterBoundAu,
          circumbinaryStabilityInnerEdgeAu,
          nearestPlanetPeriapsisAu:
            innerPlanetPeriapsisAu,
          uncompressedStellarCenterEnvelopeScene:
            Math.max(
              uncompressedPrimaryCenterExcursionScene,
              uncompressedSecondaryCenterExcursionScene,
            ),
          projectedStabilityInnerEdgeScene:
            projectedCircumbinaryStabilityInnerScene,
          projectedNearestPlanetPeriapsisScene:
            innerPlanetPeriapsisAu ===
              null
              ? null
              : systemSceneProjectedOverlayRadiusAuInSpace(
                  innerPlanetPeriapsisAu,
                  sceneScale,
                  pTypeProjectionSpace,
                ),
        }, firstOrbitAnchor === null ? 0.36 : 0.46);

  const multistellarCoreCompaction =
    multistellarPTypeClearance ===
        null ||
      innerOrbit ===
        null ||
      secondary ===
        null
      ? null
      : buildSystemSceneMultistellarCoreCompactionV52({
          architecture:
            world.multiplicityName ===
              'TRIPLE'
              ? 'TRIPLE'
              : 'BINARY',
          requestedPostProjectionScale:
            multistellarPTypeClearance
              .innerPairPresentationScale,
          uncompressedPrimaryCenterExcursionScene,
          uncompressedSecondaryCenterExcursionScene,
          targetStellarCenterEnvelopeScene:
            multistellarPTypeClearance
              .targetStellarCenterEnvelopeScene,
        });

  const innerPairPostProjectionScale =
    multistellarCoreCompaction
      ?.postProjectionScale ??
    1;

  const habitableZoneProjectionSpace =
    pTypeProjectionSpace;

  const hostVisualConstraintInnerAu =
    world.multiplicityName ===
      'SINGLE'
      ? world.habitableZone
          .radiativeInnerEdgeAu
      : world.habitableZone
          .dynamicallyHabitableInnerEdgeAu;

  const projectedHabitableZoneInnerScene =
    hostVisualConstraintInnerAu ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          hostVisualConstraintInnerAu,
          sceneScale,
          habitableZoneProjectionSpace,
        );

  const projectedNearestPlanetPeriapsisScene =
    innerPlanetPeriapsisAu ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          innerPlanetPeriapsisAu,
          sceneScale,
          world.multiplicityName ===
            'TRIPLE'
            ? SystemSceneProjectionSpace.TRIPLE_LOCAL
            : SystemSceneProjectionSpace.GLOBAL,
        );

  const starMaxCenterExcursionSceneById =
    new Map(
      world.stars.map(
        star => {
          const isPrimary =
            star.label ===
              'A';
          const isSecondary =
            star.label ===
              'B';

          let maxCenterExcursionScene =
            0;

          if (
            innerOrbit !==
              null &&
            (
              isPrimary ||
              isSecondary
            )
          ) {
            const barycentricScale =
              isPrimary
                ? Math.abs(
                    primaryInnerScale,
                  )
                : Math.abs(
                    secondaryInnerScale,
                  );

            maxCenterExcursionScene =
              world.multiplicityName ===
                'TRIPLE'
                ? systemSceneProjectedRadiusAuInSpace(
                    innerOrbit.apoastronAu,
                    sceneScale,
                    SystemSceneProjectionSpace.TRIPLE_LOCAL,
                  ) *
                  barycentricScale *
                  innerPairPostProjectionScale
                : systemSceneProjectedRadiusAuInSpace(
                    innerOrbit.apoastronAu *
                      barycentricScale,
                    sceneScale,
                    SystemSceneProjectionSpace.GLOBAL,
                  ) *
                  innerPairPostProjectionScale;
          }

          return [
            star.id,
            maxCenterExcursionScene,
          ] as const;
        },
      ),
    );

  const hostVisualEnvelope =
    buildSystemSceneHostVisualEnvelopeV3(
      world.stars.map(
        star => {
          const isPrimary =
            star.label ===
              'A';
          const isSecondary =
            star.label ===
              'B';
          const participatesInHabitableZoneHost =
            world.multiplicityName ===
              'SINGLE'
              ? isPrimary
              : isPrimary ||
                isSecondary;

          return Object.freeze({
            id:
              star.id,
            baseRadiusScene:
              starOpticalRadiusSceneById.get(
                star.id,
              )!,
            maxCenterExcursionScene:
              starMaxCenterExcursionSceneById.get(
                star.id,
              ) ??
              0,
            participatesInHabitableZoneHost,
          });
        },
      ),
      projectedHabitableZoneInnerScene,
      projectedNearestPlanetPeriapsisScene,
    );

  for (
    const starLayout
    of hostVisualEnvelope.stars
  ) {
    starRadiusSceneById.set(
      starLayout.id,
      starLayout.radiusScene,
    );
    starOpticalRadiusSceneById.set(
      starLayout.id,
      starLayout.opticalRadiusScene,
    );
  }

  const multistellarPresentation =
    world.multiplicityName ===
      'SINGLE' ||
    innerOrbit ===
      null
      ? null
      : buildSystemSceneMultistellarPresentationV4(
          world.multiplicityName ===
            'TRIPLE'
            ? 'TRIPLE'
            : 'BINARY',
          world.stars.map(
            star =>
              Object.freeze({
                id:
                  star.id,
                label:
                  star.label,
                baseRadiusScene:
                  starRadiusSceneById.get(
                    star.id,
                  )!,
                opticalRadiusScene:
                  starOpticalRadiusSceneById.get(
                    star.id,
                  )!,
              }),
          ),
          projectedInnerPairMinimumCenterSeparationScene(
            innerOrbit.periastronAu,
            primaryInnerScale,
            secondaryInnerScale,
            innerPairPostProjectionScale,
            sceneScale,
            world.multiplicityName ===
              'TRIPLE'
              ? SystemSceneProjectionSpace.TRIPLE_LOCAL
              : SystemSceneProjectionSpace.GLOBAL,
          ),
          world.multiplicityName ===
              'TRIPLE' &&
            outerOrbit !==
              null
            ? projectedTertiaryMinimumCenterSeparationToInnerStarScene(
                outerOrbit.periastronAu,
                innerOrbit.apoastronAu,
                innerPairOuterScale,
                tertiaryOuterScale,
                primaryInnerScale,
                secondaryInnerScale,
                innerPairPostProjectionScale,
                sceneScale,
              )
            : null,
        );

  if (
    multistellarPresentation !==
      null
  ) {
    for (
      const starLayout
      of multistellarPresentation.stars
    ) {
      starRadiusSceneById.set(
        starLayout.id,
        starLayout.radiusScene,
      );
      starOpticalRadiusSceneById.set(
        starLayout.id,
        starLayout.opticalRadiusScene,
      );
    }
  }

  const stellarOrbitClearance =
    buildSystemSceneStellarOrbitClearanceV5(
      world.stars.map(
        star => {
          const isPrimary =
            star.label ===
              'A';
          const isSecondary =
            star.label ===
              'B';

          return Object.freeze({
            id:
              star.id,
            label:
              star.label,
            baseRadiusScene:
              starRadiusSceneById.get(
                star.id,
              )!,
            baseOpticalRadiusScene:
              starOpticalRadiusSceneById.get(
                star.id,
              )!,
            maxCenterExcursionScene:
              starMaxCenterExcursionSceneById.get(
                star.id,
              ) ??
              0,
            participatesInPlanetaryHostClearance:
              world.multiplicityName ===
                'SINGLE'
                ? isPrimary
                : isPrimary ||
                  isSecondary,
          });
        },
      ),
      projectedNearestPlanetPeriapsisScene,
      firstOrbitAnchor?.targetPhotosphereRadiusScene ?? null,
      firstOrbitAnchor?.firstPlanetRadiusScene ?? 0,
    );

  for (
    const starLayout
    of stellarOrbitClearance.stars
  ) {
    starRadiusSceneById.set(
      starLayout.id,
      starLayout.radiusScene,
    );
    starOpticalRadiusSceneById.set(
      starLayout.id,
      starLayout.opticalRadiusScene,
    );
  }

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
              postProjectionScale:
                innerPairPostProjectionScale,
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
              innerPairPostProjectionScale,
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
              postProjectionScale:
                innerPairPostProjectionScale,
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
              innerPairPostProjectionScale,
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
              1,
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
          opticalRadiusScene:
            starOpticalRadiusSceneById.get(
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
          ...(generatorVersionCode === 2 ? {
            sourceRadiusSolar: star.radiusSolar,
            sourceEffectiveTemperatureKelvin: star.effectiveTemperatureKelvin,
          } : {}),
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
          specialPresentation:
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

  const moonSystemByPlanetOrdinal =
    new Map(
      world.moonSystems.map(
        moonSystem =>
          [
            moonSystem.hostPlanet.planetOrdinal,
            moonSystem,
          ] as const,
      ),
    );

  const planets =
    world.planets.map(
      planet => {
        const orbitId =
          `orbit-planet-${planet.planetOrdinal}`;

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
              systemSceneProjectedRadiusAuInSpace(
                planet.orbit.semiMajorAxisAu *
                  Math.sqrt(
                    1 -
                      planet.orbit.eccentricity ** 2,
                  ),
                sceneScale,
                planetProjectionSpace,
              ),
            focusOffsetScene:
              systemSceneProjectedRadiusAuInSpace(
                planet.orbit.semiMajorAxisAu *
                  planet.orbit.eccentricity,
                sceneScale,
                planetProjectionSpace,
              ),
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
          specialPresentation:
            projectPlanetSpecialPresentation(
              planet,
              moonSystemByPlanetOrdinal.get(
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
      0,
      ...starRadiusSceneById.values(),
    );
  const maximumOpticalStarRadiusScene = Math.max(0, ...stars.map(
    star => star.opticalRadiusScene ?? star.radiusScene));

  const minorBodies =
    projectMinorBodyLayer(
      world,
      innerPairAnchorContributions,
      motions,
      orbits,
      sceneScale,
      maximumVisibleStarRadiusScene,
      maximumOpticalStarRadiusScene,
      playbackDaysPerRealSecond,
      generatorVersionCode === 2,
    );

  const asteroidBelts =
    projectAsteroidBeltLayers(
      world,
      innerPairAnchorContributions,
      sceneScale,
    );

  const habitableZone =
    projectHabitableZoneLayer(
      world,
      innerPairAnchorContributions,
      sceneScale,
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
    asteroidBelts,
    habitableZone,
    hostVisualEnvelope,
    multistellarPresentation,
    multistellarPTypeClearance,
    multistellarCoreCompaction,
    stellarOrbitClearance,
    firstOrbitAnchor,
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




function projectAsteroidBeltLayers(
  world:
    MaterializedStellarSceneWorld,

  innerPairAnchorContributions:
    readonly SystemSceneMotionContributionSnapshot[],

  sceneScale:
    SystemSceneScaleSnapshot,
): readonly SystemSceneAsteroidBeltSnapshot[] {

  if (
    world.asteroidBelts ===
      null
  ) {
    return Object.freeze([]);
  }

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

  const profiles =
    [
      world.asteroidBelts.innerBelt,
      world.asteroidBelts.outerBelt,
    ];

  return Object.freeze(
    profiles
      .filter(
        profile =>
          profile.exists &&
          profile.innerEdgeAu !==
            null &&
          profile.outerEdgeAu !==
            null &&
          profile.peakAu !==
            null,
      )
      .map(
        profile => {
          const isInner =
            profile.region ===
            'INNER';

          const innerEdgeAu =
            profile.innerEdgeAu!;
          const outerEdgeAu =
            profile.outerEdgeAu!;
          const peakAu =
            profile.peakAu!;

          const presentation =
            buildSystemSceneAsteroidBeltBandPresentationV1({
              region:
                isInner
                  ? 'INNER'
                  : 'OUTER',
              innerEdgeAu,
              outerEdgeAu,
              peakAu,
              populationIndex01:
                profile.populationIndex01,
              innerRadiusScene:
                systemSceneProjectedOverlayRadiusAuInSpace(
                  innerEdgeAu,
                  sceneScale,
                  projectionSpace,
                ),
              outerRadiusScene:
                systemSceneProjectedOverlayRadiusAuInSpace(
                  outerEdgeAu,
                  sceneScale,
                  projectionSpace,
                ),
              peakRadiusScene:
                systemSceneProjectedOverlayRadiusAuInSpace(
                  peakAu,
                  sceneScale,
                  projectionSpace,
                ),
            });

          return Object.freeze({
            id:
              `asteroid-belt-${profile.region.toLowerCase()}`,
            label:
              isInner
                ? 'Cinturón interior'
                : 'Cinturón exterior',
            region:
              presentation.region,
            innerEdgeAu:
              presentation.innerEdgeAu,
            outerEdgeAu:
              presentation.outerEdgeAu,
            peakAu:
              presentation.peakAu,
            populationIndex01:
              presentation.populationIndex01,
            innerRadiusScene:
              presentation.innerRadiusScene,
            outerRadiusScene:
              presentation.outerRadiusScene,
            peakRadiusScene:
              presentation.peakRadiusScene,
            colorHex:
              presentation.colorHex,
            opacity:
              presentation.opacity,
            peakOpacity:
              presentation.peakOpacity,
            boundaryOpacity:
              presentation.boundaryOpacity,
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
        },
      ),
  );
}


function projectHabitableZoneLayer(
  world:
    MaterializedStellarSceneWorld,

  innerPairAnchorContributions:
    readonly SystemSceneMotionContributionSnapshot[],

  sceneScale:
    SystemSceneScaleSnapshot,
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

  const topology =
    zone.orbitTopology ===
      'CIRCUMSTELLAR'
      ? 'CIRCUMSTELLAR' as const
      : 'CIRCUMBINARY' as const;

  const compatibility =
    topology ===
      'CIRCUMBINARY'
      ? world.stellarSystem
          .circumbinaryPlanetCompatibility
      : null;

  const stabilityInnerAu =
    compatibility
      ?.minimumStableSemiMajorAxisAu ??
    null;

  const stabilityOuterAu =
    compatibility
      ?.maximumStableSemiMajorAxisAu ??
    null;

  const stabilityInnerScene =
    stabilityInnerAu ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          stabilityInnerAu,
          sceneScale,
          projectionSpace,
        );

  const stabilityOuterScene =
    stabilityOuterAu ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          stabilityOuterAu,
          sceneScale,
          projectionSpace,
        );

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

  const rawDynamicInnerScene =
    dynamicInner ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          dynamicInner,
          sceneScale,
          projectionSpace,
        );

  const rawDynamicOuterScene =
    dynamicOuter ===
      null
      ? null
      : systemSceneProjectedOverlayRadiusAuInSpace(
          dynamicOuter,
          sceneScale,
          projectionSpace,
        );

  const presentation =
    buildSystemSceneHabitableZonePresentationV3({
      radiativeInnerAu:
        zone.radiativeInnerEdgeAu,
      radiativeOuterAu:
        zone.radiativeOuterEdgeAu,
      dynamicallyHabitableInnerAu:
        dynamicInner,
      dynamicallyHabitableOuterAu:
        dynamicOuter,
      projectedRadiativeInnerScene:
        rawRadiativeInnerScene,
      projectedRadiativeOuterScene:
        rawRadiativeOuterScene,
      projectedDynamicallyHabitableInnerScene:
        rawDynamicInnerScene,
      projectedDynamicallyHabitableOuterScene:
        rawDynamicOuterScene,
    });

  return Object.freeze({
    topology,
    visualRegime:
      systemSceneHabitableZoneVisualRegimeV4(
        topology,
        dynamicInner,
        dynamicOuter,
        zone.dynamicalOverlapFraction01,
        zone.radiativeReferenceApplicable,
      ),
    radiativeReferenceApplicable:
      zone.radiativeReferenceApplicable,
    radiativeReferenceRegime:
      zone.radiativeReferenceRegime,
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
    circumbinaryStabilityInnerEdgeAu:
      stabilityInnerAu,
    circumbinaryStabilityOuterEdgeAu:
      stabilityOuterAu,
    circumbinaryStabilityInnerRadiusScene:
      stabilityInnerScene,
    circumbinaryStabilityOuterRadiusScene:
      stabilityOuterScene,
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

      const sourceVisualPresentation =
        buildSystemSceneMoonPresentationV1({
          moonIdentity:
            moon.identity.seed.normalizedValue,
          hostPlanetType:
            String(moonSystem.hostPlanet.planetType),
          radiusEarth:
            moon.physicalProperties.radiusEarth,
          massEarth:
            moon.physicalProperties.massEarth,
          meanDensityGramsPerCubicCentimeter:
            moon.physicalProperties.meanDensityGramsPerCubicCentimeter,
          surfaceGravityEarth:
            moon.physicalProperties.surfaceGravityEarth,
          atmosphereRetentionIndex01:
            moon.environmentState.atmosphereRetentionIndex01,
          atmosphereRegime:
            String(moon.environmentState.atmosphereRegime),
          waterInventoryIndex01:
            moon.environmentState.waterInventoryIndex01,
          inferredIceRichnessIndex01:
            moon.environmentState.inferredIceRichnessIndex01,
          subsurfaceOceanPotentialIndex01:
            moon.environmentState.subsurfaceOceanPotentialIndex01,
          surfaceLiquidWaterPotentialIndex01:
            moon.environmentState.surfaceLiquidWaterPotentialIndex01,
          waterRegime:
            String(moon.environmentState.waterRegime),
          estimatedSurfaceTemperatureKelvin:
            moon.environmentState.estimatedSurfaceTemperatureKelvin,
          geologicalActivityIndex01:
            moon.environmentState.geologicalActivityIndex01,
          tidalHeatingIndex01:
            moon.tidalState.tidalHeatingIndex01,
          geologyRegime:
            String(moon.environmentState.geologyRegime),
          overallHabitabilityIndex01:
            moon.habitabilityState.overallHabitabilityIndex01,
          isPotentiallyHabitable:
            moon.habitabilityState.isPotentiallyHabitable,
          giantHostSpecialization:
            moon.giantMoonState.isApplicable,
          giantCompositionRegime:
            String(moon.giantMoonState.compositionRegime),
          isLargeGiantMoon:
            moon.giantMoonState.isLargeMoon,
          isTidallyActiveGiantMoon:
            moon.giantMoonState.isTidallyActive,
          isOceanBearingGiantMoonCandidate:
            moon.giantMoonState.isOceanBearingCandidate,
        });

      const visualPresentation =
        limitSystemSceneMoonPresentationToHostV1(
          sourceVisualPresentation,
          hostPlanet.radiusScene,
        );

      const moonRadiusScene =
        visualPresentation.presentationRadiusScene;

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
            visualPresentation.presentationBaseColorHex,
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
          visualPresentation,
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

  maximumOpticalStarRadiusScene: number,

  playbackDaysPerRealSecond:
    number,

  useV2Cadence:
    boolean,
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

  // Rank actual BOUND members independently within each family of this host.
  // Unbound visitors never receive an invented periodic orbit.
  const ranks = new Map<string, { rank: number; count: number }>();
  if (useV2Cadence) {
    for (const kind of MinorBodyKind.values) {
      const entries = catalog.entries.filter(entry => entry.orbitalElements.kind === kind &&
        entry.orbitalElements.isBound && entry.orbitalElements.orbitalPeriodYears !== null &&
        entry.orbitalElements.meanAnomalyDegrees !== null)
        .sort((left, right) => left.orbitalElements.semiMajorAxisAu -
          right.orbitalElements.semiMajorAxisAu ||
          left.orbitalElements.proceduralId.localeCompare(right.orbitalElements.proceduralId));
      entries.forEach((entry, index) => ranks.set(`${kind.code}:${entry.orbitalElements.proceduralId}`,
        { rank: index + 1, count: entries.length }));
    }
  }

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

    const cometVisual = useV2Cadence && orbital.kind === MinorBodyKind.COMET
      ? buildV2CometVisualOrbit({
          physicalSemiMajorScene: semiMajorScene,
          physicalEccentricity: orbital.eccentricity,
          starOpticalRadiusScene: maximumOpticalStarRadiusScene,
          cometRadiusScene: minorBodyRadiusScene(entry.body, orbital.kind),
          maximumApoapsisScene: 4.8,
        }) : null;

    const presentedSemiMajorScene = cometVisual?.semiMajorScene ??
      semiMajorScene * presentationExpansionFactor;
    const visualEccentricity = cometVisual?.eccentricity ?? orbital.eccentricity;

    const presentedLinearScenePerAu =
      (cometVisual !== null || presentationExpansionFactor > 1) &&
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
          useV2Cadence
            ? v2MinorBodyTimeScale(motion.periodDays, playbackDaysPerRealSecond,
                orbital.kind, ranks.get(`${orbital.kind.code}:${orbital.proceduralId}`)!.rank,
                ranks.get(`${orbital.kind.code}:${orbital.proceduralId}`)!.count,
                orbital.proceduralId)
            : systemSceneMinorBodyPresentationTimeScale(motion.periodDays,
                playbackDaysPerRealSecond),
        ...(useV2Cadence && orbital.kind === MinorBodyKind.COMET
          ? { presentationCometPhaseWarp: V2_COMET_PHASE_WARP,
              presentationEccentricity: visualEccentricity } : {}),
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

    const asteroidPresentation =
      orbital.kind ===
        MinorBodyKind.ASTEROID
        ? asteroidPresentationForBody(
            entry.body as RelevantAsteroid,
          )
        : null;

    const cometPresentation =
      orbital.kind ===
        MinorBodyKind.COMET
        ? cometPresentationForBody(
            entry.body as RelevantComet,
            world.habitableZone
              .referenceLuminositySolar,
            localContribution
              .presentationTimeScale ??
              1,
            localContribution.presentationCometPhaseWarp,
          )
        : null;

    const bodyColorHex =
      asteroidPresentation
        ?.presentationColorHex ??
      cometPresentation
        ?.presentationNucleusColorHex ??
      minorBodyColorHex(
        orbital.kind,
      );

    const orbitColorHex =
      asteroidPresentation
        ?.presentationColorHex ??
      cometPresentation
        ?.presentationComaColorHex ??
      minorBodyColorHex(
        orbital.kind,
      );

    orbits.push(
      Object.freeze({
        id:
          orbitId,
        kind:
          'minor-body' as const,
        label:
          orbital.localDesignation,
        colorHex:
          orbitColorHex,
        opacity:
          orbitOpacity,
        semiMajorScene:
          presentedSemiMajorScene,
        semiMinorScene:
          presentedSemiMajorScene *
          Math.sqrt(1 - visualEccentricity ** 2),
        focusOffsetScene:
          presentedSemiMajorScene *
          visualEccentricity,
        rotationDegrees:
          motion.rotationDegrees,
        inclinationDegrees:
          motion.inclinationDegrees,
        motionId:
          motion.id,
        motionScale:
          1,
        ...(cometVisual === null ? {} : { presentationEccentricity: visualEccentricity }),
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
          bodyColorHex,
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
        asteroidPresentation,
        cometPresentation,
      }),
    );
  }

  return Object.freeze(
    minorBodies,
  );
}

function asteroidPresentationForBody(
  asteroid:
    RelevantAsteroid,
): SystemSceneAsteroidPresentationV1 {

  const taxonomy =
    asteroid.taxonomy;

  return buildSystemSceneAsteroidPresentationV1({
    proceduralId:
      asteroid.proceduralId,
    diameterKilometers:
      asteroid.diameterKilometers,
    compositionRegime:
      String(
        taxonomy.compositionRegime,
      ) as SystemSceneAsteroidPresentationInputV1['compositionRegime'],
    structureRegime:
      String(
        taxonomy.structureRegime,
      ) as SystemSceneAsteroidPresentationInputV1['structureRegime'],
    multiplicityRegime:
      String(
        taxonomy.multiplicityRegime,
      ) as SystemSceneAsteroidPresentationInputV1['multiplicityRegime'],
    carbonaceousFraction01:
      taxonomy.carbonaceousFraction01,
    silicateFraction01:
      taxonomy.silicateFraction01,
    metalFraction01:
      taxonomy.metalFraction01,
    iceFraction01:
      taxonomy.iceFraction01,
    porosityIndex01:
      taxonomy.porosityIndex01,
    bulkDensityGramsPerCubicCentimeter:
      taxonomy.bulkDensityGramsPerCubicCentimeter,
    geometricAlbedo01:
      taxonomy.geometricAlbedo01,
    binaryMassRatio01:
      taxonomy.binaryMassRatio01,
    binarySeparationPrimaryRadii:
      taxonomy.binarySeparationPrimaryRadii,
  });
}

function cometPresentationForBody(
  comet:
    RelevantComet,

  referenceLuminositySolar:
    number,

  presentationTimeScale:
    number,

  presentationCometPhaseWarp?:
    number,
): SystemSceneCometPresentationV1 {

  const orbit =
    comet.orbit;
  const nucleus =
    comet.nucleusProperties;

  return buildSystemSceneCometPresentationV1({
    proceduralId:
      comet.proceduralId,
    diameterKilometers:
      comet.diameterKilometers,
    iceFraction01:
      nucleus.iceFraction01,
    dustFraction01:
      nucleus.dustFraction01,
    porosityIndex01:
      nucleus.porosityIndex01,
    bulkDensityGramsPerCubicCentimeter:
      nucleus.bulkDensityGramsPerCubicCentimeter,
    geometricAlbedo01:
      nucleus.geometricAlbedo,
    volatileRichnessIndex01:
      nucleus.volatileRichnessIndex01,
    periodRegime:
      String(
        comet.periodRegime,
      ) as SystemSceneCometPresentationInputV1['periodRegime'],
    semiMajorAxisAu:
      orbit.semiMajorAxisAu,
    eccentricity:
      orbit.eccentricity,
    orbitalPeriodYears:
      orbit.orbitalPeriodYears,
    epochMeanAnomalyDegrees:
      orbit.meanAnomalyDegrees,
    periapsisAu:
      orbit.periapsisAu,
    apoapsisAu:
      orbit.apoapsisAu,
    referenceLuminositySolar,
    presentationTimeScale,
    ...(presentationCometPhaseWarp === undefined ? {} : { presentationCometPhaseWarp }),
  });
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

function projectedInnerPairMinimumCenterSeparationScene(
  relativePeriastronAu:
    number,

  primaryScale:
    number,

  secondaryScale:
    number,

  postProjectionScale:
    number,

  sceneScale:
    SystemSceneScaleSnapshot,

  projectionSpace:
    SystemSceneProjectionSpaceValue,
): number {

  const primaryFraction =
    Math.abs(
      primaryScale,
    );
  const secondaryFraction =
    Math.abs(
      secondaryScale,
    );

  if (
    projectionSpace ===
      SystemSceneProjectionSpace.GLOBAL
  ) {
    return Math.max(
      1e-6,
      (
        systemSceneProjectedRadiusAu(
          relativePeriastronAu *
            primaryFraction,
          sceneScale,
        ) +
        systemSceneProjectedRadiusAu(
          relativePeriastronAu *
            secondaryFraction,
          sceneScale,
        )
      ) *
        postProjectionScale,
    );
  }

  return Math.max(
    1e-6,
    systemSceneProjectedRadiusAuInSpace(
      relativePeriastronAu,
      sceneScale,
      projectionSpace,
    ) *
      (
        primaryFraction +
        secondaryFraction
      ) *
      postProjectionScale,
  );
}

function projectedTertiaryMinimumCenterSeparationToInnerStarScene(
  outerRelativePeriastronAu:
    number,

  innerRelativeApoastronAu:
    number,

  innerPairOuterScale:
    number,

  tertiaryOuterScale:
    number,

  primaryInnerScale:
    number,

  secondaryInnerScale:
    number,

  innerPairPostProjectionScale:
    number,

  sceneScale:
    SystemSceneScaleSnapshot,
): number {

  const outerRelativeSeparationScene =
    systemSceneProjectedRadiusAuInSpace(
      outerRelativePeriastronAu,
      sceneScale,
      SystemSceneProjectionSpace.TRIPLE_OUTER,
    ) *
    (
      Math.abs(
        innerPairOuterScale,
      ) +
      Math.abs(
        tertiaryOuterScale,
      )
    );

  const innerRelativeApoastronScene =
    systemSceneProjectedRadiusAuInSpace(
      innerRelativeApoastronAu,
      sceneScale,
      SystemSceneProjectionSpace.TRIPLE_LOCAL,
    );

  const nearestInnerStarExcursionScene =
    innerRelativeApoastronScene *
    Math.max(
      Math.abs(
        primaryInnerScale,
      ),
      Math.abs(
        secondaryInnerScale,
      ),
    ) *
    innerPairPostProjectionScale;

  return Math.max(
    1e-6,
    outerRelativeSeparationScene -
      nearestInnerStarExcursionScene,
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

  postProjectionScale:
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
    (
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
          absoluteScale
    ) *
    postProjectionScale;

  return Object.freeze({
    id:
      orbitId,
    kind:
      'stellar' as const,
    label,
    colorHex:
      '#D7A46A',
    opacity:
      0.34,
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
    postProjectionScale,
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

function projectPlanetSpecialPresentation(
  planet:
    Planet,

  moonSystem:
    MoonSystem | null,
): SystemScenePlanetSpecialPresentationV1 {

  const giantMoonProfile =
    moonSystem?.giantMoonProfile ??
    null;

  return buildSystemScenePlanetSpecialPresentationV1({
    planetId:
      `${planet.seed.normalizedValue}|planet-${planet.planetOrdinal}`,
    planetType:
      planet.planetType,
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
    axialTiltDegrees:
      planet.axialTiltDegrees,
    referenceBondAlbedo01:
      planet.referenceBondAlbedo01,
    rarityTraits:
      planet.rarities,
    giantMoonProfile:
      giantMoonProfile ===
        null
        ? null
        : {
            sourceMoonCount:
              giantMoonProfile
                .sourceMoonCount,
            sourceSatelliteCapacityIndex01:
              giantMoonProfile
                .sourceSatelliteCapacityIndex01,
            richnessIndex01:
              giantMoonProfile
                .richnessIndex01,
            architectureRegime:
              giantMoonProfile
                .architectureRegime,
          },
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


/**
 * Readability hotfix on top of point 25.10.
 *
 * Planet radii remain a presentation-only proxy derived from frozen phase-19
 * physical size and composition. Gas/ice giants are intentionally presented as
 * much larger than solid worlds, while rocky families keep a smaller but still
 * clearly differentiated spread so bodies no longer collapse to one size.
 */
function presentationPlanetRadiusScene(
  planet:
    Planet,
): number {

  const radiusEarth =
    Math.max(
      planet.radiusEarth,
      0.12,
    );

  const type =
    planet.typeClassification
      .planetType;

  const baseline =
    adaptiveSystemPlanetRadiusScene(
      radiusEarth,
    );

  const deepEnvelope =
    planet.surfaceBaseProperties
      .isDeepEnvelopeSurface ||
    type ===
      PlanetType.MINI_NEPTUNE ||
    type ===
      PlanetType.GAS_GIANT ||
    type ===
      PlanetType.ICE_GIANT;

  const familyRadius =
    deepEnvelope
      ? scaledRadius(
          radiusEarth,
          1.8,
          16,
          0.050,
          0.122,
        )
      : scaledRadius(
          radiusEarth,
          0.30,
          2.8,
          0.013,
          0.036,
        );

  const subtypeScale =
    type ===
      PlanetType.GAS_GIANT
      ? 1.20
      : type ===
          PlanetType.ICE_GIANT
        ? 1.06
        : type ===
            PlanetType.MINI_NEPTUNE
          ? 0.88
          : type ===
              PlanetType.SUPER_EARTH
            ? 1.10
            : type ===
                PlanetType.OCEAN
              ? 1.02
              : type ===
                  PlanetType.DESERT
                ? 0.97
                : type ===
                    PlanetType.ICE
                  ? 0.98
                  : type ===
                      PlanetType.VOLCANIC
                    ? 0.92
                    : 0.88;

  const density =
    planet.physicalProperties
      .densityGramsPerCubicCentimeter;

  const densityScale =
    deepEnvelope
      ? clamp(
          1.07 -
            0.040 *
              (density - 1.4),
          0.94,
          1.12,
        )
      : clamp(
          1.00 -
            0.022 *
              (density - 4.1),
          0.92,
          1.05,
        );

  const envelopeScale =
    deepEnvelope
      ? clamp(
          0.94 +
            0.18 *
              planet.physicalProperties
                .envelopeMassFraction01,
          0.94,
          1.12,
        )
      : 1;

  const blendedRadius =
    (
      deepEnvelope
        ? 0.16 *
            baseline +
          0.84 *
            familyRadius
        : 0.22 *
            baseline +
          0.78 *
            familyRadius
    ) *
    subtypeScale *
    densityScale *
    envelopeScale;

  return clamp(
    blendedRadius,
    deepEnvelope
      ? 0.048
      : 0.012,
    deepEnvelope
      ? 0.138
      : 0.040,
  );
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
