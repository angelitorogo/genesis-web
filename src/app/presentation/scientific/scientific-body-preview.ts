import {
  type PlanetScientificResolvedTarget,
} from '../../simulation/planetary/planet-scientific-target-resolver';

import {
  MinorBodyScientificTargetKind,
  type MinorBodyScientificResolvedTarget,
} from '../../simulation/planetary/minor-body-scientific-target-resolver';

import {
  type MoonScientificResolvedTarget,
} from '../../simulation/planetary/moon-scientific-target-resolver';

import {
  type ArchiveDiscoveryDetailModel,
} from '../genesis-archive/archive-discovery-detail.facade';

import {
  type SystemSceneBodySpinSnapshot,
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneSnapshot,
  SystemSceneSnapshotBuilder,
} from '../system/system-scene-snapshot';

import {
  type SystemScenePlanetSurfacePresentationSnapshot,
} from '../system/system-scene-planet-surface-presentation';

import {
  type SystemSceneGiantAtmospherePresentationSnapshot,
} from '../system/system-scene-giant-atmosphere-presentation';

import {
  systemScenePlanetTextureSeed,
} from '../system/system-scene-planet-texture';

import {
  systemScenePlanetSurfaceTextureSeedV1,
} from '../system/system-scene-planet-surface-texture';

import {
  systemSceneGiantAtmosphereTextureSeedV1,
} from '../system/system-scene-giant-atmosphere-texture';

import {
  type SystemSceneAsteroidCompositionRegime,
  type SystemSceneAsteroidMultiplicityRegime,
  type SystemSceneAsteroidPresentationV1,
  type SystemSceneAsteroidStructureRegime,
} from '../system/system-scene-asteroid-presentation';

import {
  systemSceneCometActivityAtDistanceV1,
  type SystemSceneCometActivityRegimeV1,
  type SystemSceneCometPeriodRegimeV1,
  type SystemSceneCometPresentationV1,
} from '../system/system-scene-comet-presentation';

export const ScientificBodyPreviewKind =
  Object.freeze({
    PLANET:
      'PLANET',
    MOON:
      'MOON',
    ASTEROID:
      'ASTEROID',
    COMET:
      'COMET',
    TRANS_NEPTUNIAN_OBJECT:
      'TRANS_NEPTUNIAN_OBJECT',
  } as const);

export type ScientificBodyPreviewKind =
  typeof ScientificBodyPreviewKind[
    keyof typeof ScientificBodyPreviewKind
  ];

export const SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE =
  0.42;

export type ScientificPlanetSurfaceStyle =
  | 'rocky'
  | 'oceanic'
  | 'icy'
  | 'gaseous'
  | 'volcanic';

export interface ScientificPlanetRingPreviewVisual {
  readonly innerRadiusPlanetRadii:
    number;
  readonly outerRadiusPlanetRadii:
    number;
  readonly opticalDepth01:
    number;
  readonly iceFraction01:
    number;
  readonly dustFraction01:
    number;
  readonly bandCount:
    number;
  readonly gapCount:
    number;
  readonly visualVariantUint32:
    number;
  readonly presentationBaseColorHex:
    string;
  readonly presentationAccentColorHex:
    string;
}

export interface ScientificPlanetPreviewVisual {
  readonly title:
    string;

  readonly planetId:
    string;

  readonly radiusEarth:
    number;

  readonly sourceRadiusScene:
    number;

  readonly baseColorHex:
    string;

  readonly surfaceStyle:
    ScientificPlanetSurfaceStyle;

  readonly spin:
    SystemSceneBodySpinSnapshot;

  readonly surface:
    SystemScenePlanetSurfacePresentationSnapshot | null;

  readonly giantAtmosphere:
    SystemSceneGiantAtmospherePresentationSnapshot | null;

  readonly ring:
    ScientificPlanetRingPreviewVisual | null;

  readonly equatorialScale:
    number;

  readonly polarScale:
    number;

  /** Exact SystemScene texture identity, renamed so no seed contract leaks. */
  readonly albedoVisualVariantUint32:
    number;

  readonly surfaceVisualVariantUint32:
    number;

  readonly giantAtmosphereVisualVariantUint32:
    number | null;
}

export interface ScientificMoonOrbitPreviewVisual {
  /** Physical phase-21.3 semi-major axis, expressed in host-planet radii. */
  readonly semiMajorAxisPlanetRadii:
    number;

  readonly eccentricity:
    number;

  readonly inclinationDegrees:
    number;

  /** Same deterministic presentation-node orientation used by SystemScene. */
  readonly rotationDegrees:
    number;

  readonly epochMeanAnomalyDegrees:
    number;

  readonly orbitalPeriodDays:
    number;

  readonly periapsisPlanetRadii:
    number;

  readonly apoapsisPlanetRadii:
    number;
}

export interface ScientificMoonPreviewVisual {
  readonly title:
    string;

  readonly moonOrdinal:
    number;

  readonly semiMajorAxisPlanetRadii:
    number;

  /** Safe local-orbit projection copied from the exact SystemScene motion. */
  readonly orbit:
    ScientificMoonOrbitPreviewVisual;

  readonly sourceRadiusScene:
    number;

  readonly spin:
    SystemSceneBodySpinSnapshot;

  readonly radiusEarth:
    number;

  readonly shapeClass:
    'MINOR_IRREGULAR' | 'REGULAR_SMALL' | 'MAJOR_PLANETARY';

  readonly surfaceStyle:
    'ROCKY' | 'ICY' | 'OCEANIC' | 'VOLCANIC' | 'MIXED';

  readonly presentationRadiusScene:
    number;

  readonly presentationIrregularity01:
    number;

  readonly presentationLiquidCoverage01:
    number;

  readonly presentationIceCoverage01:
    number;

  readonly presentationVolcanicCoverage01:
    number;

  readonly presentationCloudCoverage01:
    number;

  readonly presentationAtmospherePresent:
    boolean;

  readonly presentationAtmosphereStrength01:
    number;

  readonly presentationAtmosphereShellScale:
    number;

  readonly presentationBaseColorHex:
    string;

  readonly presentationAccentColorHex:
    string;

  readonly presentationAtmosphereColorHex:
    string;

  /** Exact SystemScene visual variant; never a domain seed. */
  readonly visualVariantUint32:
    number;
}

export interface ScientificAsteroidPreviewVisual {
  readonly version:
    1;

  readonly compositionRegime:
    SystemSceneAsteroidCompositionRegime;

  readonly structureRegime:
    SystemSceneAsteroidStructureRegime;

  readonly multiplicityRegime:
    SystemSceneAsteroidMultiplicityRegime;

  readonly visualVariantUint32:
    number;

  readonly presentationColorHex:
    string;

  readonly presentationRoughness01:
    number;

  readonly presentationMetalness01:
    number;

  readonly presentationIrregularity01:
    number;

  readonly presentationFacetContrast01:
    number;

  readonly presentationAxisScaleX:
    number;

  readonly presentationAxisScaleY:
    number;

  readonly presentationAxisScaleZ:
    number;

  readonly presentationOrientationXRadians:
    number;

  readonly presentationOrientationYRadians:
    number;

  readonly presentationOrientationZRadians:
    number;

  readonly presentationContactSecondaryRadiusScale01:
    number | null;

  readonly presentationDetachedSecondaryRadiusScale01:
    number | null;

  readonly presentationDetachedSeparation01:
    number | null;

  readonly presentationSeparationAdjusted:
    boolean;
}

export interface ScientificCometPreviewVisual {
  readonly version:
    1;

  readonly visualVariantUint32:
    number;

  readonly presentationNucleusColorHex:
    string;

  readonly presentationComaColorHex:
    string;

  readonly presentationDustTailColorHex:
    string;

  readonly presentationIonTailColorHex:
    string;

  readonly presentationNucleusRoughness01:
    number;

  readonly presentationNucleusAxisScaleX:
    number;

  readonly presentationNucleusAxisScaleY:
    number;

  readonly presentationNucleusAxisScaleZ:
    number;

  readonly presentationNucleusIrregularity01:
    number;
}

export interface ScientificCometActivityPreviewVisual {
  readonly activityRegime:
    SystemSceneCometActivityRegimeV1;

  readonly hasComa:
    boolean;

  readonly hasDustTail:
    boolean;

  readonly hasIonTail:
    boolean;

  readonly presentationComaRadiusScale:
    number;

  readonly presentationComaOpacity01:
    number;

  readonly presentationDustTailOpacity01:
    number;

  readonly presentationIonTailOpacity01:
    number;

  readonly presentationComaRadiusScene:
    number;

  readonly presentationDustTailLengthScene:
    number;

  readonly presentationDustTailWidthScene:
    number;

  readonly presentationIonTailLengthScene:
    number;

  readonly presentationIonTailWidthScene:
    number;
}

export interface ScientificTransNeptunianPreviewVisual {
  readonly title:
    string;

  readonly colorHex:
    string;

  readonly sourceRadiusScene:
    number;
}

export type ScientificBodyPreviewModel =
  | Readonly<{
      kind:
        typeof ScientificBodyPreviewKind.PLANET;
      accessibleLabel:
        string;
      primary:
        ScientificPlanetPreviewVisual;
      moons:
        readonly ScientificMoonPreviewVisual[];
      /** SystemScene epoch used as the deterministic starting instant of the local scientific view. */
      epochSimulationDay:
        number;
      /** SystemScene playback cadence reused only for readable body-spin presentation. */
      spinPlaybackDaysPerRealSecond:
        number;
    }>
  | Readonly<{
      kind:
        typeof ScientificBodyPreviewKind.MOON;
      accessibleLabel:
        string;
      primary:
        ScientificMoonPreviewVisual;
      hostPlanet:
        ScientificPlanetPreviewVisual | null;
      moons:
        readonly ScientificMoonPreviewVisual[];
      /** SystemScene epoch used as the deterministic starting instant of the local scientific view. */
      epochSimulationDay:
        number;
      /** SystemScene playback cadence reused only for readable body-spin presentation. */
      spinPlaybackDaysPerRealSecond:
        number;
    }>
  | Readonly<{
      kind:
        typeof ScientificBodyPreviewKind.ASTEROID;
      accessibleLabel:
        string;
      title:
        string;
      primary:
        ScientificAsteroidPreviewVisual;
    }>
  | Readonly<{
      kind:
        typeof ScientificBodyPreviewKind.COMET;
      accessibleLabel:
        string;
      title:
        string;
      primary:
        ScientificCometPreviewVisual;
      activity:
        ScientificCometActivityPreviewVisual;
    }>
  | Readonly<{
      kind:
        typeof ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT;
      accessibleLabel:
        string;
      title:
        string;
      primary:
        ScientificTransNeptunianPreviewVisual;
    }>;

export interface ScientificBodyPreviewSceneResolver {
  build(
    systemModel: ArchiveDiscoveryDetailModel,
  ): SystemSceneSnapshot;
}

export const DEFAULT_SCIENTIFIC_BODY_PREVIEW_SCENE_RESOLVER:
  ScientificBodyPreviewSceneResolver =
  Object.freeze({
    build(
      systemModel: ArchiveDiscoveryDetailModel,
    ): SystemSceneSnapshot {
      return SystemSceneSnapshotBuilder.build(
        systemModel,
      );
    },
  });

/**
 * Absolute visual-parity bridge for the scientific fiche renderer.
 *
 * Intrinsic appearance is copied from the same immutable SystemScene snapshot
 * used by the full system renderer. Only camera/framing/local orbital spacing
 * may differ. Raw seeds/procedural ids are stripped before the model reaches UI.
 */
export class ScientificBodyPreviewAssembler {

  private constructor() {}

  static planet(
    target:
      PlanetScientificResolvedTarget,

    scene:
      SystemSceneSnapshot,
  ): ScientificBodyPreviewModel {

    const planetId =
      `planet-${target.identity.planetOrdinal}`;

    const sourcePlanet =
      requiredPlanet(
        scene,
        planetId,
      );

    const primary =
      planetVisual(
        scene,
        sourcePlanet,
        target.detail.general.radiusEarth,
      );

    const semiMajorByOrdinal =
      new Map(
        target.detail.moons.relevantMoons.map(
          moon => [
            moon.moonOrdinal,
            moon.semiMajorAxisPlanetRadii,
          ] as const,
        ),
      );

    const moons =
      Object.freeze(
        scene.moons
          .filter(
            moon =>
              moon.hostPlanetId ===
                planetId,
          )
          .map(
            moon =>
              moonVisual(
                scene,
                moon,
                semiMajorByOrdinal.get(
                  moonOrdinalFromSnapshot(
                    moon,
                  ),
                ) ??
                  1,
              ),
          )
          .sort(
            (left, right) =>
              left.moonOrdinal -
              right.moonOrdinal,
          ),
      );

    return Object.freeze({
      kind:
        ScientificBodyPreviewKind.PLANET,
      accessibleLabel:
        `${target.identity.designation}. Representación tridimensional con paridad visual SystemScene${moons.length > 0 ? ` y ${moons.length} luna${moons.length === 1 ? '' : 's'} relevante${moons.length === 1 ? '' : 's'} disponible${moons.length === 1 ? '' : 's'} como contexto opcional.` : '.'}`,
      primary,
      moons,
      epochSimulationDay:
        scene.simulation.epochSimulationDay,
      spinPlaybackDaysPerRealSecond:
        scene.simulation.playbackDaysPerRealSecond,
    });
  }

  static moon(
    target:
      MoonScientificResolvedTarget,

    hostPlanetTarget:
      PlanetScientificResolvedTarget | null,

    scene:
      SystemSceneSnapshot,
  ): ScientificBodyPreviewModel {

    const hostPlanetId =
      `planet-${target.identity.hostPlanetOrdinal}`;

    const sourceMoon =
      scene.moons.find(
        moon =>
          moon.hostPlanetId ===
            hostPlanetId &&
          moonOrdinalFromSnapshot(
            moon,
          ) ===
            target.identity.moonOrdinal,
      );

    if (
      sourceMoon ===
        undefined
    ) {
      throw new RangeError(
        'Scientific moon preview requires the exact SystemScene moon snapshot.',
      );
    }

    const primary =
      moonVisual(
        scene,
        sourceMoon,
        target.detail.orbit.semiMajorAxisPlanetRadii,
      );

    if (
      hostPlanetTarget ===
        null
    ) {
      return Object.freeze({
        kind:
          ScientificBodyPreviewKind.MOON,
        accessibleLabel:
          `${target.identity.designation}. Representación tridimensional con paridad visual SystemScene.`,
        primary,
        hostPlanet:
          null,
        moons:
          Object.freeze([
            primary,
          ]),
        epochSimulationDay:
          scene.simulation.epochSimulationDay,
        spinPlaybackDaysPerRealSecond:
          scene.simulation.playbackDaysPerRealSecond,
      });
    }

    const sourcePlanet =
      requiredPlanet(
        scene,
        hostPlanetId,
      );

    const hostPlanet =
      planetVisual(
        scene,
        sourcePlanet,
        hostPlanetTarget.detail.general.radiusEarth,
      );

    const semiMajorByOrdinal =
      new Map(
        hostPlanetTarget.detail.moons.relevantMoons.map(
          moon => [
            moon.moonOrdinal,
            moon.semiMajorAxisPlanetRadii,
          ] as const,
        ),
      );

    const moons =
      Object.freeze(
        scene.moons
          .filter(
            moon =>
              moon.hostPlanetId ===
                hostPlanetId,
          )
          .map(
            moon =>
              moonVisual(
                scene,
                moon,
                semiMajorByOrdinal.get(
                  moonOrdinalFromSnapshot(
                    moon,
                  ),
                ) ??
                  1,
              ),
          )
          .sort(
            (left, right) =>
              left.moonOrdinal -
              right.moonOrdinal,
          ),
      );

    return Object.freeze({
      kind:
        ScientificBodyPreviewKind.MOON,
      accessibleLabel:
        `${target.identity.designation}. Representación tridimensional con paridad visual SystemScene. Puede activarse el planeta anfitrión y las demás lunas relevantes.`,
      primary,
      hostPlanet,
      moons,
      epochSimulationDay:
        scene.simulation.epochSimulationDay,
      spinPlaybackDaysPerRealSecond:
        scene.simulation.playbackDaysPerRealSecond,
    });
  }

  static minorBody(
    target:
      MinorBodyScientificResolvedTarget,

    proceduralId:
      string,

    scene:
      SystemSceneSnapshot,
  ): ScientificBodyPreviewModel {

    const source =
      requiredMinorBody(
        scene,
        target.detail.kind,
        proceduralId,
      );

    if (
      target.detail.kind ===
        MinorBodyScientificTargetKind.ASTEROID
    ) {
      if (
        source.asteroidPresentation ===
          null
      ) {
        throw new RangeError(
          'Scientific asteroid preview requires the exact SystemScene asteroid presentation.',
        );
      }

      return Object.freeze({
        kind:
          ScientificBodyPreviewKind.ASTEROID,
        accessibleLabel:
          `${target.identity.designation}. Representación tridimensional con paridad visual SystemScene.`,
        title:
          target.identity.designation,
        primary:
          safeAsteroidVisual(
            source.asteroidPresentation,
          ),
      });
    }

    if (
      target.detail.kind ===
        MinorBodyScientificTargetKind.TRANS_NEPTUNIAN_OBJECT
    ) {
      if (
        source.minorBodyKind.name !==
          'TRANS_NEPTUNIAN_OBJECT'
      ) {
        throw new RangeError(
          'Scientific TNO preview requires the exact SystemScene trans-Neptunian snapshot.',
        );
      }

      return Object.freeze({
        kind:
          ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT,
        accessibleLabel:
          `${target.identity.designation}. Representación tridimensional con paridad visual SystemScene del objeto transneptuniano.`,
        title:
          target.identity.designation,
        primary:
          Object.freeze({
            title:
              source.title,
            colorHex:
              source.colorHex,
            sourceRadiusScene:
              source.radiusScene,
          }),
      });
    }

    if (
      source.cometPresentation ===
        null
    ) {
      throw new RangeError(
        'Scientific comet preview requires the exact SystemScene comet presentation.',
      );
    }

    const presentation =
      source.cometPresentation;

    const activity =
      systemSceneCometActivityAtDistanceV1(
        presentation,
        presentation.periapsisAu,
        SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE,
      );

    return Object.freeze({
      kind:
        ScientificBodyPreviewKind.COMET,
      accessibleLabel:
        `${target.identity.designation}. Representación tridimensional con paridad visual SystemScene; la actividad se presenta en periastro.`,
      title:
        target.identity.designation,
      primary:
        safeCometVisual(
          presentation,
        ),
      activity:
        Object.freeze({
          activityRegime:
            activity.activityRegime,
          hasComa:
            activity.hasComa,
          hasDustTail:
            activity.hasDustTail,
          hasIonTail:
            activity.hasIonTail,
          presentationComaRadiusScale:
            activity.presentationComaRadiusScale,
          presentationComaOpacity01:
            activity.presentationComaOpacity01,
          presentationDustTailOpacity01:
            activity.presentationDustTailOpacity01,
          presentationIonTailOpacity01:
            activity.presentationIonTailOpacity01,
          presentationComaRadiusScene:
            activity.presentationComaRadiusScene,
          presentationDustTailLengthScene:
            activity.presentationDustTailLengthScene,
          presentationDustTailWidthScene:
            activity.presentationDustTailWidthScene,
          presentationIonTailLengthScene:
            activity.presentationIonTailLengthScene,
          presentationIonTailWidthScene:
            activity.presentationIonTailWidthScene,
        }),
    });
  }
}

function requiredPlanet(
  scene:
    SystemSceneSnapshot,

  planetId:
    string,
): SystemSceneBodySnapshot {

  const source =
    scene.planets.find(
      planet =>
        planet.id ===
          planetId,
    );

  if (
    source ===
      undefined
  ) {
    throw new RangeError(
      `Scientific preview cannot resolve SystemScene planet ${planetId}.`,
    );
  }

  return source;
}

function requiredMinorBody(
  scene:
    SystemSceneSnapshot,

  kind:
    MinorBodyScientificTargetKind,

  proceduralId:
    string,
): SystemSceneMinorBodySnapshot {

  const domainKindName =
    kind ===
      MinorBodyScientificTargetKind.ASTEROID
      ? 'ASTEROID'
      : kind ===
        MinorBodyScientificTargetKind.COMET
        ? 'COMET'
        : 'TRANS_NEPTUNIAN_OBJECT';

  const source =
    scene.minorBodies.find(
      body =>
        body.minorBodyKind.name ===
          domainKindName &&
        body.id.endsWith(
          proceduralId,
        ),
    );

  if (
    source ===
      undefined
  ) {
    throw new RangeError(
      'Scientific preview cannot resolve the exact SystemScene minor body.',
    );
  }

  return source;
}

function planetVisual(
  scene:
    SystemSceneSnapshot,

  source:
    SystemSceneBodySnapshot,

  radiusEarth:
    number,
): ScientificPlanetPreviewVisual {

  if (
    source.surfaceStyle ===
      'emissive'
  ) {
    throw new RangeError(
      'Scientific planet preview cannot consume a stellar emissive body.',
    );
  }

  const systemIdentity =
    `${scene.universeSeed}|v${scene.generatorVersionCode}|${scene.proceduralIdentity}`;

  const special =
    source.specialPresentation;

  return Object.freeze({
    title:
      source.title,
    planetId:
      source.id,
    radiusEarth,
    sourceRadiusScene:
      source.radiusScene,
    baseColorHex:
      source.colorHex,
    surfaceStyle:
      source.surfaceStyle,
    spin:
      source.spin,
    surface:
      source.surfaceEnvironment,
    giantAtmosphere:
      source.giantAtmosphere,
    ring:
      special?.rings ===
        null ||
      special?.rings ===
        undefined
        ? null
        : Object.freeze({
            innerRadiusPlanetRadii:
              special.rings.innerRadiusPlanetRadii,
            outerRadiusPlanetRadii:
              special.rings.outerRadiusPlanetRadii,
            opticalDepth01:
              special.rings.opticalDepth01,
            iceFraction01:
              special.rings.iceFraction01,
            dustFraction01:
              special.rings.dustFraction01,
            bandCount:
              special.rings.bandCount,
            gapCount:
              special.rings.gapCount,
            visualVariantUint32:
              special.rings.presentationSeedUint32,
            presentationBaseColorHex:
              special.rings.presentationBaseColorHex,
            presentationAccentColorHex:
              special.rings.presentationAccentColorHex,
          }),
    equatorialScale:
      special?.oblateness.presentationEquatorialScale ??
      1,
    polarScale:
      special?.oblateness.presentationPolarScale ??
      1,
    albedoVisualVariantUint32:
      systemScenePlanetTextureSeed({
        systemIdentity,
        planetId:
          source.id,
        surfaceStyle:
          source.surfaceStyle,
      }),
    surfaceVisualVariantUint32:
      systemScenePlanetSurfaceTextureSeedV1(
        systemIdentity,
        source.id,
      ),
    giantAtmosphereVisualVariantUint32:
      source.giantAtmosphere ===
        null
        ? null
        : systemSceneGiantAtmosphereTextureSeedV1(
            systemIdentity,
            source.id,
            source.giantAtmosphere.regime,
          ),
  });
}

function moonVisual(
  scene:
    SystemSceneSnapshot,

  source:
    SystemSceneMoonSnapshot,

  semiMajorAxisPlanetRadii:
    number,
): ScientificMoonPreviewVisual {

  const visual =
    source.visualPresentation;

  const orbit =
    requiredMoonOrbit(
      scene,
      source,
      semiMajorAxisPlanetRadii,
    );

  return Object.freeze({
    title:
      source.title,
    moonOrdinal:
      moonOrdinalFromSnapshot(
        source,
      ),
    semiMajorAxisPlanetRadii,
    orbit,
    sourceRadiusScene:
      source.radiusScene,
    spin:
      source.spin,
    radiusEarth:
      visual.sourceRadiusEarth,
    shapeClass:
      visual.shapeClass,
    surfaceStyle:
      visual.surfaceStyle,
    presentationRadiusScene:
      visual.presentationRadiusScene,
    presentationIrregularity01:
      visual.presentationIrregularity01,
    presentationLiquidCoverage01:
      visual.presentationLiquidCoverage01,
    presentationIceCoverage01:
      visual.presentationIceCoverage01,
    presentationVolcanicCoverage01:
      visual.presentationVolcanicCoverage01,
    presentationCloudCoverage01:
      visual.presentationCloudCoverage01,
    presentationAtmospherePresent:
      visual.presentationAtmospherePresent,
    presentationAtmosphereStrength01:
      visual.presentationAtmosphereStrength01,
    presentationAtmosphereShellScale:
      visual.presentationAtmosphereShellScale,
    presentationBaseColorHex:
      visual.presentationBaseColorHex,
    presentationAccentColorHex:
      visual.presentationAccentColorHex,
    presentationAtmosphereColorHex:
      visual.presentationAtmosphereColorHex,
    visualVariantUint32:
      visual.presentationSeedUint32,
  });
}

function requiredMoonOrbit(
  scene:
    SystemSceneSnapshot,

  moon:
    SystemSceneMoonSnapshot,

  semiMajorAxisPlanetRadii:
    number,
): ScientificMoonOrbitPreviewVisual {

  const orbit =
    scene.orbits.find(
      candidate =>
        candidate.id ===
          moon.orbitId,
    );

  if (
    orbit ===
      undefined ||
    orbit.motionId ===
      null
  ) {
    throw new RangeError(
      `Scientific local moon view requires one SystemScene orbit for ${moon.id}.`,
    );
  }

  const motion =
    scene.motions.find(
      candidate =>
        candidate.id ===
          orbit.motionId,
    );

  if (
    motion ===
      undefined
  ) {
    throw new RangeError(
      `Scientific local moon view requires SystemScene motion ${orbit.motionId}.`,
    );
  }

  return Object.freeze({
    semiMajorAxisPlanetRadii,
    eccentricity:
      motion.eccentricity,
    inclinationDegrees:
      motion.inclinationDegrees,
    rotationDegrees:
      motion.rotationDegrees,
    epochMeanAnomalyDegrees:
      motion.epochMeanAnomalyDegrees,
    orbitalPeriodDays:
      motion.periodDays,
    periapsisPlanetRadii:
      semiMajorAxisPlanetRadii *
      (1 - motion.eccentricity),
    apoapsisPlanetRadii:
      semiMajorAxisPlanetRadii *
      (1 + motion.eccentricity),
  });
}

function moonOrdinalFromSnapshot(
  moon:
    SystemSceneMoonSnapshot,
): number {

  const match =
    /moon-(\d+)-(\d+)$/.exec(
      moon.id,
    );

  if (
    match ===
      null
  ) {
    throw new RangeError(
      `Unexpected SystemScene moon id: ${moon.id}.`,
    );
  }

  return Number(
    match[2],
  );
}

function safeAsteroidVisual(
  presentation:
    SystemSceneAsteroidPresentationV1,
): ScientificAsteroidPreviewVisual {

  return Object.freeze({
    version:
      1 as const,
    compositionRegime:
      presentation.compositionRegime,
    structureRegime:
      presentation.structureRegime,
    multiplicityRegime:
      presentation.multiplicityRegime,
    visualVariantUint32:
      presentation.shapeSeedUint32,
    presentationColorHex:
      presentation.presentationColorHex,
    presentationRoughness01:
      presentation.presentationRoughness01,
    presentationMetalness01:
      presentation.presentationMetalness01,
    presentationIrregularity01:
      presentation.presentationIrregularity01,
    presentationFacetContrast01:
      presentation.presentationFacetContrast01,
    presentationAxisScaleX:
      presentation.presentationAxisScaleX,
    presentationAxisScaleY:
      presentation.presentationAxisScaleY,
    presentationAxisScaleZ:
      presentation.presentationAxisScaleZ,
    presentationOrientationXRadians:
      presentation.presentationOrientationXRadians,
    presentationOrientationYRadians:
      presentation.presentationOrientationYRadians,
    presentationOrientationZRadians:
      presentation.presentationOrientationZRadians,
    presentationContactSecondaryRadiusScale01:
      presentation.presentationContactSecondaryRadiusScale01,
    presentationDetachedSecondaryRadiusScale01:
      presentation.presentationDetachedSecondaryRadiusScale01,
    presentationDetachedSeparation01:
      presentation.presentationDetachedSeparation01,
    presentationSeparationAdjusted:
      presentation.presentationSeparationAdjusted,
  });
}

function safeCometVisual(
  presentation:
    SystemSceneCometPresentationV1,
): ScientificCometPreviewVisual {

  return Object.freeze({
    version:
      1 as const,
    visualVariantUint32:
      presentation.shapeSeedUint32,
    presentationNucleusColorHex:
      presentation.presentationNucleusColorHex,
    presentationComaColorHex:
      presentation.presentationComaColorHex,
    presentationDustTailColorHex:
      presentation.presentationDustTailColorHex,
    presentationIonTailColorHex:
      presentation.presentationIonTailColorHex,
    presentationNucleusRoughness01:
      presentation.presentationNucleusRoughness01,
    presentationNucleusAxisScaleX:
      presentation.presentationNucleusAxisScaleX,
    presentationNucleusAxisScaleY:
      presentation.presentationNucleusAxisScaleY,
    presentationNucleusAxisScaleZ:
      presentation.presentationNucleusAxisScaleZ,
    presentationNucleusIrregularity01:
      presentation.presentationNucleusIrregularity01,
  });
}
