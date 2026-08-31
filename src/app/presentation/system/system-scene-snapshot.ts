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
  type Planet,
} from '../../domain/planetary/planet';

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
  PlanetGenerator,
} from '../../simulation/planetary/planet-generator';

import {
  PlanetaryFormationMaturationGenerator,
} from '../../simulation/planetary/planetary-formation-maturation-generator';

import {
  PlanetarySystemGenerator,
} from '../../simulation/planetary/planetary-system-generator';

import {
  ProtoplanetaryFormationSnapshotGenerator,
} from '../../simulation/planetary/protoplanetary-formation-snapshot-generator';

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
  SystemOrbitalMotionEngine,
  type SystemOrbitalMotionDefinition,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  systemSimulationPlaybackDaysPerSecond,
} from './system-simulation-clock';


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

export interface SystemSceneMotionContributionSnapshot {
  readonly motionId:
    string;

  readonly scale:
    number;
}

export interface SystemSceneOrbitalMotionSnapshot
  extends SystemOrbitalMotionDefinition {}

export interface SystemSceneOrbitSnapshot {
  readonly id:
    string;

  readonly kind:
    'stellar' |
    'planetary';

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
}

export interface SystemSceneSimulationSnapshot {
  readonly epochSimulationDay:
    number;

  readonly playbackDaysPerRealSecond:
    number;
}

export interface SystemSceneScaleSnapshot {
  readonly outerRadiusAu:
    number;

  readonly orbitScaleScenePerAu:
    number;

  readonly targetOuterRadiusScene:
    number;
}

/**
 * Point-24.3 presentation snapshot accepted by SystemScene.
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

  readonly planets:
    readonly Planet[];
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
          Object.freeze({
            outerRadiusAu:
              DEFAULT_OUTER_RADIUS_AU,
            orbitScaleScenePerAu:
              TARGET_OUTER_RADIUS_SCENE /
              DEFAULT_OUTER_RADIUS_AU,
            targetOuterRadiusScene:
              TARGET_OUTER_RADIUS_SCENE,
          }),
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
        `${baseSnapshot.accessibleLabel} ${projected.stars.length} estrella${projected.stars.length === 1 ? '' : 's'}, ${projected.planets.length} planeta${projected.planets.length === 1 ? '' : 's'} y ${projected.orbits.length} órbita${projected.orbits.length === 1 ? '' : 's'} visibles.`,
      stars:
        projected.stars,
      planets:
        projected.planets,
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

  const planets =
    resolvePlanets(
      generationKey,
      locator,
      system,
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
    planets,
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

function resolvePlanets(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  system:
    ReturnType<typeof StellarSystemGenerator.generate>,
): readonly Planet[] {

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
    return Object.freeze([]);
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

  if (
    !planetarySystem.hasPlanets
  ) {
    return Object.freeze([]);
  }

  const planets =
    PlanetGenerator
      .generateAll(
        generationKey,
        planetarySystem,
      );

  return Object.freeze(
    planets,
  );
}

function projectSceneGeometry(
  world:
    MaterializedStellarSceneWorld,
): {
  readonly stars:
    readonly SystemSceneBodySnapshot[];

  readonly planets:
    readonly SystemSceneBodySnapshot[];

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

  const starOuterRadiusAu =
    Math.max(
      innerOrbit
        ?.apoastronAu ??
        0,
      outerOrbit
        ?.apoastronAu ??
        0,
    );

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

  const outerRadiusAu =
    Math.max(
      DEFAULT_OUTER_RADIUS_AU,
      starOuterRadiusAu,
      planetOuterRadiusAu,
    );

  const orbitScaleScenePerAu =
    TARGET_OUTER_RADIUS_SCENE /
    outerRadiusAu;

  const starRadiusMin =
    0.16;

  const starRadiusMax =
    0.46;

  const starRadiusRange =
    radiusRange(
      world.stars.map(
        star =>
          star.radiusSolar,
      ),
    );

  const planetRadiusMin =
    0.048;

  const planetRadiusMax =
    0.17;

  const planetRadiusRange =
    radiusRange(
      world.planets.map(
        planet =>
          planet.physicalProperties.radiusEarth,
      ),
    );

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
              orbitScaleScenePerAu,
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
              orbitScaleScenePerAu,
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
              orbitScaleScenePerAu,
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
            scaledRadius(
              star.radiusSolar,
              starRadiusRange.min,
              starRadiusRange.max,
              starRadiusMin,
              starRadiusMax,
            ),
          position:
            orbitalContributionPositionScene(
              frozenContributions,
              motions,
              0,
              orbitScaleScenePerAu,
            ),
          orbitId,
          motionContributions:
            frozenContributions,
          surfaceStyle:
            'emissive' as const,
          lightIntensity:
            clamp(
              1.4 +
                Math.log10(
                  star.massSolar + 1,
                ) *
                  1.25,
              1.2,
              3.4,
            ),
        });
      },
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
            }),
          ] satisfies SystemSceneMotionContributionSnapshot[]);

        const semiMajorScene =
          planet.orbit.semiMajorAxisAu *
          orbitScaleScenePerAu;

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
              semiMajorScene *
              Math.sqrt(
                1 -
                  planet.orbit.eccentricity ** 2,
              ),
            focusOffsetScene:
              semiMajorScene *
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
            scaledRadius(
              planet.physicalProperties
                .radiusEarth,
              planetRadiusRange.min,
              planetRadiusRange.max,
              planetRadiusMin,
              planetRadiusMax,
            ),
          position:
            orbitalContributionPositionScene(
              motionContributions,
              motions,
              0,
              orbitScaleScenePerAu,
            ),
          orbitId,
          motionContributions,
          surfaceStyle:
            planetSurfaceStyle(
              planet,
            ),
          lightIntensity:
            0,
        });
      },
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
    orbits:
      Object.freeze(orbits),
    motions:
      frozenMotions,
    simulation:
      Object.freeze({
        epochSimulationDay:
          0,
        playbackDaysPerRealSecond:
          systemSimulationPlaybackDaysPerSecond(
            frozenMotions.map(
              motion =>
                motion.periodDays,
            ),
          ),
      }),
    scale:
      Object.freeze({
        outerRadiusAu,
        orbitScaleScenePerAu,
        targetOuterRadiusScene:
          TARGET_OUTER_RADIUS_SCENE,
      }),
  });
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

  orbitScaleScenePerAu:
    number,
): SystemSceneOrbitSnapshot {

  const absoluteScale =
    Math.abs(
      motionScale,
    );

  const semiMajorScene =
    motion.semiMajorAxisAu *
    absoluteScale *
    orbitScaleScenePerAu;

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
  });
}

function orbitalContributionPositionScene(
  contributions:
    readonly SystemSceneMotionContributionSnapshot[],

  motions:
    readonly SystemSceneOrbitalMotionSnapshot[],

  simulationDay:
    number,

  orbitScaleScenePerAu:
    number,
): SystemSceneVector3 {

  let xAu =
    0;
  let yAu =
    0;
  let zAu =
    0;

  for (
    const contribution
    of contributions
  ) {
    const motion =
      motions.find(
        candidate =>
          candidate.id ===
          contribution.motionId,
      );

    if (
      motion ===
      undefined
    ) {
      throw new RangeError(
        `Unknown SystemScene orbital motion ${contribution.motionId}.`,
      );
    }

    const position =
      SystemOrbitalMotionEngine
        .positionAtSimulationDay(
          motion,
          simulationDay,
        );

    xAu +=
      position.xAu *
      contribution.scale;
    yAu +=
      position.yAu *
      contribution.scale;
    zAu +=
      position.zAu *
      contribution.scale;
  }

  return Object.freeze({
    x:
      xAu *
      orbitScaleScenePerAu,
    y:
      yAu *
      orbitScaleScenePerAu,
    z:
      zAu *
      orbitScaleScenePerAu,
  });
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
