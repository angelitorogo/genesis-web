import { ViscorbSystemLocalPresentationV1, viscorbOrbitGeometryRadiiV1 } from './viscorb-system-local-presentation';
import { viscorbStellarViewDirectionV1 } from './viscorb-stellar-frame';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { buildAtmosphereOpticalScienceV1 } from './system-scene-atmosphere-optical-science';
import { resolveSystemSceneAtmospherePhotosphereKelvinV4 } from './system-scene-atmosphere-photosphere-v4';
import { systemSceneCometActivityVisualParityV1 } from './system-scene-comet-activity-parity';
import { createSystemSceneTnoRenderableV1 } from './system-scene-tno-renderable';
import { genesisVisualSceneTrace388 } from '../visual-provenance/genesis-visual-provenance-38-8';
import { createSystemSceneCapturedRenderableV1 } from './system-scene-captured-renderable';
import { attachScientificMinorBodyAtlasVis3d2e, type ScientificMinorBodySurfaceKindVis3d2e } from '../scientific-body-preview/scientific-minor-body-texture-vis3d2e';
import { systemSceneMinorBodyAtlasSource387x, systemSceneMinorBodyNeedsAtlas387x } from './system-scene-minor-body-parity-38-7x';
import { v2CometStellarIrradianceAtDay } from './system-scene-v2-comet-stellar-flux';
import {
  isPlatformBrowser,
} from '@angular/common';

import {
  RouterLink,
} from '@angular/router';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import * as THREE from 'three';
import { systemSceneHasConfirmedColonyT7n, systemSceneColonyBodyRingDiameterT7n } from './system-scene-colonies-t7n';
import { systemSceneColonySiteMarkerPresentationT7t,
  systemSceneColonySiteMarkerWorldDiameterT7t } from './system-scene-colony-sites-t7t';
import { installVida38ColonialRadialOcclusion386c4 } from '../infrastructure/vida38-colonial-radial-occlusion-38-6c4';
import { createVida38InfrastructureSurfaceVisual386, vida38MoonVisibleInfrastructurePlans386c2, type Vida38InfrastructureVisual386 } from '../infrastructure/vida38-infrastructure-render-38-6';
import { createCompactHostLaboratoryVisual, orientCompactBlackHoleToCamera } from './system-compact-host-laboratory-visual';
import { prepareCompactBlackHoleBodyOcclusion, updateCompactBlackHoleBodyOcclusion, type CompactBlackHoleBodyOcclusionBinding } from './system-compact-black-hole-occlusion';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { type LaboratoryCompactSceneGraph } from '../laboratory/galactic-objects/laboratory-compact-scene-graph';

import {
  type MinorBodyKindValue,
} from '../../domain/planetary/minor-body-kind';

import {
  scientificRouteQueryParams,
} from '../scientific/scientific-route-identity';

import {
  type SystemSceneAsteroidBeltSnapshot,
  type SystemSceneBodySnapshot,
  type SystemSceneHabitableZoneSnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitalRiskTargetSnapshot,
  type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneOrbitSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

import {
  SystemSimulationClock,
} from './system-simulation-clock';

import {
  systemSceneScientificAccess,
} from './system-scene-scientific-access';

import {
  SystemSceneCameraController,
} from './system-scene-camera-controller';

import {
  laboratoryStarDistances,
  laboratorySubsystemRadius,
  productionStarFocusRadius,
  type LaboratoryStarDistance,
} from './system-scene-laboratory-controls';
import { ArchiveStellarSystemKnowledgeLevel } from '../genesis-archive/archive-stellar-system-card';
import { systemSceneGameplayHostLayout, systemSceneHabitableZoneHostLabel } from './system-scene-gameplay-hosts';
import { systemScenePlanetFicheRoute, systemSceneMoonFicheRoute } from './system-scene-scientific-route';

import {
  buildSystemSceneBodyCard,
  type SystemSceneBodyCard,
} from './system-scene-body-card';

import {
  SystemSceneActiveTime,
  systemSceneAnimationLoopRequired,
} from './system-scene-active-time';

import {
  projectSystemSceneMotionContributions,
  sampleSystemSceneOrbitLocalAu,
} from './system-scene-motion-projection';

import {
  assertSystemSceneProjectionSnapshot,
} from './system-scene-projection-contract';

import {
  SystemSceneHabitableZoneVisualRegimeV4,
} from './system-scene-multistellar-presentation';

import {
  systemSceneBodyAxialTiltRadians,
  systemSceneBodyDisplaySpinRadians,
  systemSceneSphereSegments,
} from './system-scene-body-render-state';

import { refinePlanetRgbaTextureV1, PLANET_TEXTURE_DETAIL_SIZES_V1, type PlanetTextureRefinementKind } from './system-scene-planet-texture-refinement';
import { SOLID_PLANET_DETAIL_WIDTH_VISSURF2 } from './system-scene-planet-surface-detail-vissurf2';
import { buildCoherentSolidPlanetSurfaceVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';
import { composeSolidPlanetMaterialsVISSURF5d } from './system-scene-planet-material-composition-vissurf5d';
import {
  calibrateSolidRoughnessForRendererVISSURF5c,
  configureSolidSurfaceNormalDetailVISSURF5c,
  installSolidSurfaceDebugShaderVISSURF5c,
  prepareSolidSurfaceDataTextureVISSURF5c,
  readPlanetSurfaceRenderModeVISSURF5c,
  showPlanetOpticalLayerVISSURF5c,
} from './system-scene-planet-render-pipeline-vissurf5c';

import {
  applySystemSceneArtificialOrbitGuideVisibilityV1,
} from './system-scene-artificial-orbit-guide-visibility-visciv5c';

import {
  createSystemSceneArtificialSatelliteVisualV1,
  createSystemSceneOrbitalRingVisualV1,
  updateOrbitalRingNightLightsVISCIV6g,
  updateOrbitalRingTrafficVISCIV6k,
  type SystemSceneOrbitalRingVisualV1,
  createSystemSceneOrbitalStationVisualV1,
  supportsSystemSceneArtificialSatellitesV1,
  type SystemSceneArtificialSatelliteMaterialBindingV1,
} from './system-scene-artificial-satellites-visciv2';
import { buildSystemSceneOrbitalInfrastructureManifestVISCIV6e } from './system-scene-orbital-infrastructure-visciv6e';
import {
  installOrbitalSurfaceShadowVISCIV6n,
  type OrbitalSurfaceShadowBindingVISCIV6n,
  type OrbitalSurfaceShadowRingVISCIV6n,
} from './system-scene-orbital-surface-shadow-visciv6n';

import {
  buildSystemScenePlanetTextureV1,
  systemScenePlanetTextureSeed,
  type SystemScenePlanetTextureSurfaceStyle,
} from './system-scene-planet-texture';

import {
  buildSystemScenePlanetSurfaceTextureV1,
  systemScenePlanetSurfaceTextureSeedV1,
  type SystemScenePlanetVegetationProfileV1,
  type SystemScenePlanetSurfaceTextureData,
} from './system-scene-planet-surface-texture';
import { buildSystemScenePlanetNightLightsV1 } from './system-scene-planet-night-lights-visciv1';
import { systemScenePlanetTextureCacheKeyVISCIV1b } from './system-scene-planet-civilization-cache-visciv1b';
import type { Vida7CivilizationTier } from '../../domain/life/vida7-intelligence-civilizations';
import { resolveOrbitalHomeStarIdsVISCIV6d } from './system-scene-civilization-host-light-visciv6d';

import { GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C,
  giantAtmosphereFineShellRequiredVISCATM1c,
} from './system-scene-giant-atmosphere-geometry-viscatm1c';

import {
  buildSystemSceneGiantAtmosphereTextureV1,
  type SystemSceneGiantAtmosphereTextureData,
} from './system-scene-giant-atmosphere-texture';
import {
  refineGiantAtmosphereMultiresVISCATM1,
  GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1,
  giantAtmosphereFocusWidthVISCATM1,
} from './system-scene-giant-atmosphere-multires-viscatm1';

import {
  buildSystemSceneGlslMaterialProfileV1,
  installSystemSceneGlslMaterialV1,
} from './system-scene-glsl-material';

import {
  buildSystemSceneAtmosphereOpticsV1,
  type SystemSceneAtmosphereOpticsV1,
} from './system-scene-atmosphere-optics';

import {
  createSystemSceneAsteroidRenderableV1,
} from './system-scene-asteroid-geometry';

import {
  systemSceneCometActivityAtSimulationDayV1,
} from './system-scene-comet-presentation';

import {
  applySystemSceneCometActivityVisualV1,
  createSystemSceneCometRenderableV1,
  type SystemSceneCometActivityBindingV1,
} from './system-scene-comet-renderable';

import {
  createSystemSceneRingRenderableV1,
} from './system-scene-ring-renderable';

import {
  createSystemSceneMoonRenderableV1,
  type SystemSceneMoonTextureResourceV1,
} from './system-scene-moon-renderable';
import { buildSystemSceneMoonTextureV1 } from './system-scene-moon-texture';
import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';
import { shouldUseMoonDetailLUNSURF1 } from './system-scene-moon-surface-detail-lunsurf1';
import { PlanetaryLodGroupControllerV1, lodgrpEstimateBytesV1,
  type LodgrpGroupV1 } from './system-scene-planetary-lod-group-lodgrp1';
import { LodgrpTimingsV2, lodgrpProximityV2, lodgrpPrioritiseMoonsV2,
  lodgrpUnstagedAtlasesV2, lodgrpTerminateWorkerV2 }
  from './system-scene-planetary-lod-acceleration-lodgrp2';
import type { LodgrpAtlasRequestV1, LodgrpAtlasResultV1,
  LodgrpAtlasRoleV1, LodgrpSourceTextureV1 } from './system-scene-group-atlas-lodgrp1';

import {
  systemSceneMoonDisplaySpinRadiansV2,
} from './system-scene-moon-spin-presentation';

import {
  SystemSceneBoundedResourceCacheV1,
} from './system-scene-resource-cache';

import {
  SystemSceneSphereGeometryPoolV1,
} from './system-scene-geometry-pool';

import {
  systemSceneBodyLodLevelV1,
  systemSceneProjectedDiameterPixelsV1,
  type SystemSceneBodyLodKindV1,
  type SystemSceneBodyLodLevelV1,
} from './system-scene-lod';

import {
  buildSystemSceneDayNightMaterialProfileV1,
  createSystemSceneAtmosphereShellMaterialV1,
  installSystemSceneDayNightMaterialV1,
  type SystemScenePlanetLightBindingV1,
} from './system-scene-atmosphere-material';

import {
  createV2BodyLightBinding,
  installV2BodyLightingOnSurfaces,
  installV2MoonAtmosphereLighting,
  v2SmallBodyDayNightProfile,
  systemSceneLightingTargets,
  v2TripleBodyLightFluxes,
  v2TripleLightingSources,
} from './system-scene-v2-body-lighting';

import {
  buildSystemSceneRenderBackendAssessmentV1,
  systemSceneWebGpuApiAvailable,
  type SystemSceneRenderBackendAssessmentV1,
  type SystemSceneShaderPipeline,
  type SystemSceneWebGpuEvaluation,
} from './system-scene-render-backend';

import {
  SystemSceneProjectionSpace,
  systemSceneProjectAuVectorInSpace,
  type SystemSceneScaleSnapshot,
} from './system-scene-scale-projection';


const MAX_DEVICE_PIXEL_RATIO =
  2;

const ORBIT_SEGMENT_COUNT =
  160;

export type SystemSceneRenderState =
  | 'initializing'
  | 'ready'
  | 'unavailable'
  | 'error';

export interface SystemSceneRenderInfo {
  readonly renderer:
    'WEBGL2';

  readonly shaderPipeline:
    SystemSceneShaderPipeline;

  readonly webGpuEvaluation:
    SystemSceneWebGpuEvaluation;

  readonly physicalBodyCount:
    number;

  readonly sceneObjectCount:
    number;
}

export interface SystemSceneSelection {
  readonly bodyId:
    string;

  readonly kind:
    'star' |
    'planet' |
    'moon' |
    'minor-body';

  readonly label:
    string;

  readonly title:
    string;
}

export type SystemSceneSelectionChangeHandler =
  (
    selection:
      SystemSceneSelection | null,
  ) => void;

export type SystemSceneMinorBodyLayerKey =
  | 'asteroids'
  | 'comets'
  | 'transNeptunianObjects'
  | 'capturedObjects';

export interface SystemSceneLayerVisibility {
  /** T7n: cuerpos colonizados; desactivado por defecto y opcional para runtimes previos. */
  readonly colonies?: boolean;
  /** Only supplied by the binary/triple laboratory. */
  readonly orbits?: boolean;
  readonly planets:
    boolean;

  readonly moons:
    boolean;

  readonly habitableZone:
    boolean;

  readonly orbitalRisk:
    boolean;

  readonly asteroids:
    boolean;

  readonly comets:
    boolean;

  readonly transNeptunianObjects:
    boolean;

  readonly capturedObjects:
    boolean;

  readonly artificialSatellites:
    boolean;
}

type SystemSceneSelectableBodySnapshot =
  | SystemSceneBodySnapshot
  | SystemSceneMoonSnapshot
  | SystemSceneMinorBodySnapshot;

interface SystemSceneMinorBodyInstanceBatchV1 {
  readonly mesh: THREE.InstancedMesh;
  readonly groups: THREE.Group[];
  readonly radiiScene: number[];
}

interface SystemScenePendingMoonVisualV1 {
  readonly moon: SystemSceneMoonSnapshot;
  readonly spinPivot: THREE.Group;
}

export interface SystemSceneRuntime {
  resize(
    width:
      number,

    height:
      number,

    devicePixelRatio:
      number,
  ): void;

  render(
    snapshot:
      SystemSceneSnapshot,
    laboratoryCloseZoom?: boolean,
  ): SystemSceneRenderInfo;

  resetView?():
    void;

  followBody?(
    bodyId:
      string,
  ): boolean;

  focusLaboratorySystem?(starId: string, radiusScene: number): boolean;

  stopFollowing?():
    void;

  setLayerVisibility?(
    visibility:
      SystemSceneLayerVisibility,
  ): void;

  setPageVisible?(
    visible:
      boolean,
  ): void;

  dispose():
    void;
}

export type SystemSceneRuntimeFactory =
  (
    canvas:
      HTMLCanvasElement,

    onSelectionChange?:
      SystemSceneSelectionChangeHandler,
    onSimulationDay?: (simulationDay: number) => void,
  ) => SystemSceneRuntime;

export class SystemSceneWebGl2UnavailableError
  extends Error {

  constructor() {
    super(
      'WebGL2 is unavailable for the GENESIS stellar-system scene.',
    );

    this.name =
      'SystemSceneWebGl2UnavailableError';
  }
}

export const SYSTEM_SCENE_RUNTIME_FACTORY =
  new InjectionToken<SystemSceneRuntimeFactory>(
    'SYSTEM_SCENE_RUNTIME_FACTORY',
    {
      providedIn:
        'root',

      factory:
        () =>
          (
            canvas:
              HTMLCanvasElement,

            onSelectionChange?:
              SystemSceneSelectionChangeHandler,
            onSimulationDay?: (simulationDay: number) => void,
          ) =>
            createThreeSystemSceneRuntime(
              canvas,
              onSelectionChange,
              onSimulationDay,
            ),
    },
  );

/**
 * Through point-25.2 Angular host for the stellar-system Three.js scene.
 *
 * The component owns browser lifecycle, canvas sizing and renderer disposal.
 * It receives a frozen presentation snapshot and never computes authoritative
 * stellar or planetary physics.
 */
@Component({
  selector:
    'app-system-scene',

  standalone:
    true,

  imports: [
    RouterLink,
  ],

  templateUrl:
    './system-scene.html',

  styleUrl:
    './system-scene.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class SystemScene
  implements
    AfterViewInit,
    OnChanges,
    OnDestroy {

  @Input({
    required:
      true,
  })
  snapshot!:
    SystemSceneSnapshot;

  /** Opt-in camera-only close-up, enabled exclusively by the laboratory. */
  @Input()
  laboratoryCloseZoom = false;

  /** Opt-in controls for composed multiples, never enabled by /system. */
  @Input()
  laboratoryMultipleControls = false;

  /** Opt-in orbit-guide toggle for SINGLE laboratory previews as well. */
  @Input()
  laboratoryOrbitControls = false;

  /** Gameplay controls operate on the canonical snapshot, never on lab fixtures. */
  @Input()
  gameplaySceneControls = false;

  /** Temporary QA panel: enabled by /system?...&debugOrbital=1. */
  @Input()
  orbitalInfrastructureDebug = false;

  /**
   * Optional QA-only route exposed by hosts that deliberately allow opening
   * the phase-26.2 stellar scientific fiche from a selected star. Production
   * SystemPage leaves this null, so the navigation sheet stays gameplay-safe.
   */
  @Input()
  stellarFicheQaRoute:
    string | null =
    null;

  @Output()
  readonly renderInfoChange =
    new EventEmitter<SystemSceneRenderInfo>();

  @Output()
  readonly bodySelectionChange =
    new EventEmitter<SystemSceneSelection | null>();

  @ViewChild(
    'sceneHost',
    {
      static:
        true,
    },
  )
  private sceneHostRef!:
    ElementRef<HTMLElement>;

  @ViewChild(
    'sceneCanvas',
    {
      static:
        true,
    },
  )
  private sceneCanvasRef!:
    ElementRef<HTMLCanvasElement>;

  private readonly platformId =
    inject(
      PLATFORM_ID,
    );

  private readonly runtimeFactory =
    inject(
      SYSTEM_SCENE_RUNTIME_FACTORY,
    );

  private runtime:
    SystemSceneRuntime | null =
    null;

  private resizeObserver:
    ResizeObserver | null =
    null;

  private listeningToWindowResize =
    false;

  private listeningToDocumentVisibility =
    false;

  private readonly onWindowResize =
    () => {
      this.resizeRuntime();
    };

  private readonly onDocumentVisibilityChange =
    () => {
      this.applyDocumentVisibility();
    };

  private readonly renderStateSignal =
    signal<SystemSceneRenderState>(
      'initializing',
    );

  private readonly renderInfoSignal =
    signal<SystemSceneRenderInfo | null>(
      null,
    );

  private readonly selectionSignal =
    signal<SystemSceneSelection | null>(
      null,
    );

  private readonly trackingSelectionSignal =
    signal<SystemSceneSelection | null>(
      null,
    );

  private readonly bodyCardOpenSignal =
    signal(
      false,
    );

  private readonly planetsVisibleSignal =
    signal(
      true,
    );

  private readonly coloniesVisibleSignalT7n=signal(false);
  private lastColonySystemIdentityT7n:string|null=null;

  private readonly moonsVisibleSignal =
    signal(
      false,
    );

  private readonly habitableZoneVisibleSignal =
    signal(
      false,
    );

  private readonly orbitalRiskVisibleSignal =
    signal(
      false,
    );

  private readonly asteroidsVisibleSignal =
    signal(
      false,
    );

  private readonly cometsVisibleSignal =
    signal(
      false,
    );

  private readonly transNeptunianObjectsVisibleSignal =
    signal(
      false,
    );

  private readonly capturedObjectsVisibleSignal =
    signal(
      false,
    );

  private readonly artificialSatellitesVisibleSignal =
    signal(
      false,
    );

  private readonly orbitLinesVisibleSignal = signal(true);
  private readonly focusedLaboratoryStarSignal = signal<string | null>(null);
  private readonly laboratoryDistancesSignal = signal<readonly LaboratoryStarDistance[]>([]);

  readonly orbitLinesVisible = this.orbitLinesVisibleSignal.asReadonly();
  readonly focusedLaboratoryStar = this.focusedLaboratoryStarSignal.asReadonly();
  readonly laboratoryDistances = this.laboratoryDistancesSignal.asReadonly();

  /** Rendered host population only; the simulation/scientific sources stay authoritative. */
  gameplayHostLayout() {
    return this.gameplaySceneControls ? systemSceneGameplayHostLayout(this.snapshot) : [];
  }

  habitableZoneHostLabel(zone: SystemSceneHabitableZoneSnapshot): string {
    return systemSceneHabitableZoneHostLabel(this.snapshot, zone);
  }


  toggleOrbitLines(): void {
    if (!this.laboratoryOrbitControls && !this.laboratoryMultipleControls &&
        !this.gameplaySceneControls) return;
    this.orbitLinesVisibleSignal.update(value => !value);
    this.applyLayerVisibility();
  }

  /** Production reveals stellar telemetry only when its orbit is catalogued. */
  stellarDistanceControlsAvailable(): boolean {
    if (this.snapshot.stars.length < 2) return false;
    if (this.laboratoryMultipleControls) return true;
    return this.gameplaySceneControls &&
      (this.snapshot.knowledgeLevel === ArchiveStellarSystemKnowledgeLevel.CATALOGUED ||
       this.snapshot.knowledgeLevel === ArchiveStellarSystemKnowledgeLevel.CONFIRMED) &&
      this.snapshot.orbits.some(orbit => orbit.kind === 'stellar') &&
      this.snapshot.stars.every(star => star.motionContributions.length > 0) &&
      this.snapshot.motions.length > 0;
  }

  centerLaboratorySystem(starId: string): void {
    if ((!this.laboratoryMultipleControls && !this.gameplaySceneControls) ||
        this.snapshot.stars.length < 2 ||
        !this.snapshot.stars.some(star => star.id === starId)) return;
    const radius = this.laboratoryMultipleControls
      ? laboratorySubsystemRadius(this.snapshot, starId)
      : productionStarFocusRadius(this.snapshot, starId);
    if (this.runtime?.focusLaboratorySystem?.(starId, radius)) {
      this.focusedLaboratoryStarSignal.set(starId);
      this.trackingSelectionSignal.set(null);
    }
  }

  private updateLaboratoryDistances(day: number): void {
    if (this.stellarDistanceControlsAvailable()) {
      this.laboratoryDistancesSignal.set(laboratoryStarDistances(this.snapshot, day));
    } else {
      this.laboratoryDistancesSignal.set([]);
    }
  }

  readonly planetsVisible =
    this.planetsVisibleSignal.asReadonly();

  readonly coloniesVisibleT7n=this.coloniesVisibleSignalT7n.asReadonly();

  colonialBodiesCountT7n():number{
    return [...this.snapshot.planets,...this.snapshot.moons]
      .filter(body=>systemSceneHasConfirmedColonyT7n(body.visualInfrastructurePlans)).length;
  }

  toggleColoniesT7n():void{
    if(this.colonialBodiesCountT7n()===0)return;
    this.coloniesVisibleSignalT7n.update(value=>!value);
    this.applyLayerVisibility();
  }

  readonly moonsVisible =
    this.moonsVisibleSignal.asReadonly();

  readonly habitableZoneVisible =
    this.habitableZoneVisibleSignal.asReadonly();

  readonly orbitalRiskVisible =
    this.orbitalRiskVisibleSignal.asReadonly();

  readonly asteroidsVisible =
    this.asteroidsVisibleSignal.asReadonly();

  readonly cometsVisible =
    this.cometsVisibleSignal.asReadonly();

  readonly transNeptunianObjectsVisible =
    this.transNeptunianObjectsVisibleSignal.asReadonly();

  readonly capturedObjectsVisible =
    this.capturedObjectsVisibleSignal.asReadonly();

  readonly artificialSatellitesVisible =
    this.artificialSatellitesVisibleSignal.asReadonly();

  readonly selection =
    this
      .selectionSignal
      .asReadonly();

  readonly trackingSelection =
    this
      .trackingSelectionSignal
      .asReadonly();

  readonly bodyCardOpen =
    this
      .bodyCardOpenSignal
      .asReadonly();

  readonly renderState =
    this
      .renderStateSignal
      .asReadonly();

  readonly renderInfo =
    this
      .renderInfoSignal
      .asReadonly();

  scientificBodyFichesUnlocked():
    boolean {
    return systemSceneScientificAccess(
      this.snapshot.discoveryStateCode,
    ).scientificBodyFichesUnlocked;
  }

  scientificBodyFicheAccessCode():
    'LOCKED' |
    'UNLOCKED' {
    return this.scientificBodyFichesUnlocked()
      ? 'UNLOCKED'
      : 'LOCKED';
  }

  planetScientificFicheRoute(): readonly string[] | null {
    const selection = this.selectionSignal();
    return this.scientificBodyFichesUnlocked() && selection?.kind === 'planet'
      ? systemScenePlanetFicheRoute(this.snapshot, selection.bodyId) : null;
  }

  moonScientificFicheRoute(): readonly string[] | null {
    const selection = this.selectionSignal();
    return this.scientificBodyFichesUnlocked() && selection?.kind === 'moon'
      ? systemSceneMoonFicheRoute(this.snapshot, selection.bodyId) : null;
  }

  minorBodyScientificFicheRoute():
    readonly string[] | null {

    if (
      !this.scientificBodyFichesUnlocked()
    ) {
      return null;
    }

    const selection =
      this.selectionSignal();

    if (
      selection ===
        null ||
      selection.kind !==
        'minor-body'
    ) {
      return null;
    }

    const body =
      this.snapshot.minorBodies.find(
        candidate =>
          candidate.id ===
          selection.bodyId,
      );

    if (
      body ===
        undefined
    ) {
      return null;
    }

    const targetKind =
      body.minorBodyKind.name ===
        'ASTEROID'
        ? 'asteroid'
        : body.minorBodyKind.name ===
          'COMET'
          ? 'comet'
          : body.minorBodyKind.name ===
            'TRANS_NEPTUNIAN_OBJECT'
            ? 'tno'
            : body.minorBodyKind.name === 'CAPTURED_EXTRASOLAR_OBJECT'
              ? 'captured'
              : null;

    if (
      targetKind ===
        null
    ) {
      return null;
    }

    const match =
      /^(?:mh-[abc]-)?minor-\d+-([0-9A-F]{32})$/.exec(
        body.id,
      );

    if (
      match ===
        null
    ) {
      return null;
    }

    return Object.freeze([
      '/system',
      this.snapshot.address.galaxyIndex,
      this.snapshot.address.sectorKey,
      this.snapshot.address.galacticObjectIndex,
      'minor-body',
      targetKind,
      match[1]!,
    ]);
  }

  planetScientificFicheQueryParams():
    Readonly<{
      u: string;
    }> {

    return scientificRouteQueryParams(
      this.snapshot.universeSeed,
      this.snapshot.generatorVersionCode,
    );
  }

  planetCount():
    number {
    return this.snapshot.planets.length + (this.snapshot.pulsarPlanetVisuals?.length ?? 0);
  }

  habitableZoneCount():
    number {
    return this.snapshot.habitableZones?.length ??
      (this.snapshot.layers.habitableZoneAvailable ? 1 : 0);
  }

  asteroidBeltCount():
    number {
    return this.snapshot.asteroidBelts
      ?.length ??
      0;
  }

  asteroidLayerAvailable():
    boolean {
    return this.asteroidCount() >
      0 ||
      this.asteroidBeltCount() >
      0;
  }

  asteroidBeltLegend():
    string {
    return (
      this.snapshot.asteroidBelts ?? []
    )
      .map(
        belt =>
          `${belt.region} ${this.formatAu(belt.innerEdgeAu)}–${this.formatAu(belt.outerEdgeAu)} AU · pico ${this.formatAu(belt.peakAu)} AU`,
      )
      .join(' · ');
  }

  orbitalRiskTargetCount():
    number {
    return this.snapshot.layers.orbitalRiskTargetCount;
  }

  orbitalRiskRelevantTargetCount():
    number {
    return this.snapshot.orbitalRiskTargets.length;
  }

  orbitalRiskLayerAvailable(): boolean {
    return this.snapshot.orbitalRiskEvaluated === true ||
      this.snapshot.orbitalRiskTargets.length > 0;
  }

  orbitalCrossingTargetCount():
    number {
    return this.snapshot.layers.orbitalCrossingTargetCount;
  }

  orbitalApproachTargetCount():
    number {
    return this.snapshot.layers.orbitalApproachTargetCount;
  }

  orbitalCollisionGeometryTargetCount():
    number {
    return this.snapshot.layers.orbitalCollisionGeometryTargetCount;
  }

  selectedOrbitalRiskTarget():
    SystemSceneOrbitalRiskTargetSnapshot | null {
    const selection =
      this.selectionSignal();

    if (
      selection === null
    ) {
      return null;
    }

    return this.snapshot.orbitalRiskTargets.find(
      target =>
        target.targetBodyId === selection.bodyId,
    ) ?? null;
  }

  formatAu(
    value:
      number | null,
  ): string {
    if (
      value === null
    ) {
      return '—';
    }

    return value < 0.1
      ? value.toFixed(3)
      : value < 10
        ? value.toFixed(2)
        : value.toFixed(1);
  }

  asteroidCount():
    number {
    return this.minorBodyCountForLayer(
      'asteroids',
    );
  }

  cometCount():
    number {
    return this.minorBodyCountForLayer(
      'comets',
    );
  }

  transNeptunianObjectCount():
    number {
    return this.minorBodyCountForLayer(
      'transNeptunianObjects',
    );
  }

  capturedObjectCount():
    number {
    return this.minorBodyCountForLayer(
      'capturedObjects',
    );
  }

  artificialSatellitePlanetCount():
    number {
    return this.snapshot.planets.filter(
      planet => supportsSystemSceneArtificialSatellitesV1(
        planet.visualCivilizationTier ?? null,
      ),
    ).length;
  }

  artificialSatelliteCount():
    number {
    const systemIdentity =
      `${this.snapshot.universeSeed}|v${this.snapshot.generatorVersionCode}|${this.snapshot.proceduralIdentity}`;
    return this.snapshot.planets.reduce((count, planet) => {
      const tier = planet.visualCivilizationTier ?? null;
      if (!supportsSystemSceneArtificialSatellitesV1(tier)) {
        return count;
      }
      const seed = systemScenePlanetSurfaceTextureSeedV1(systemIdentity, planet.id);
      // The shared VISCIV.6e manifest powers both count and actual meshes.
      return count + buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
        seed, tier, planet.radiusScene,
      ).totalCount;
    }, 0);
  }

  /** QA-only projection. Never reads private biology or non-confirmed objects. */
  orbitalInfrastructureDiagnosticRowsVISCIV6e() {
    if (!this.orbitalInfrastructureDebug) return [];
    const identity = `${this.snapshot.universeSeed}|v${this.snapshot.generatorVersionCode}|${this.snapshot.proceduralIdentity}`;
    return this.snapshot.planets.map(planet => {
      const tier = planet.visualCivilizationTier ?? null;
      const manifest = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
        systemScenePlanetSurfaceTextureSeedV1(identity, planet.id), tier, planet.radiusScene,
      );
      return Object.freeze({
        bodyId: planet.id, label: planet.label, tier: tier ?? 'SIN TIER VISUAL',
        satellites: manifest.satelliteCount, stations: manifest.stationCount,
        rings: manifest.ringCount,
      });
    });
  }

  togglePlanets():
    void {

    if (
      this.snapshot.planets.length + (this.snapshot.pulsarPlanetVisuals?.length ?? 0) ===
        0
    ) {
      return;
    }

    this.planetsVisibleSignal.update(
      value =>
        !value,
    );

    this.applyLayerVisibility();
  }

  toggleMoons():
    void {

    if (
      this.snapshot.layers.moonCount ===
        0
    ) {
      return;
    }

    this.moonsVisibleSignal.update(
      value =>
        !value,
    );

    this.applyLayerVisibility();
  }

  toggleHabitableZone():
    void {

    if (
      !this.snapshot.layers.habitableZoneAvailable
    ) {
      return;
    }

    this.habitableZoneVisibleSignal.update(
      value =>
        !value,
    );

    this.applyLayerVisibility();
  }

  toggleOrbitalRisk():
    void {

    if (!this.orbitalRiskLayerAvailable()) {
      return;
    }

    this.orbitalRiskVisibleSignal.update(
      value =>
        !value,
    );

    this.applyLayerVisibility();
  }

  toggleAsteroids():
    void {
    this.toggleMinorBodyLayer(
      'asteroids',
    );
  }

  toggleComets():
    void {
    this.toggleMinorBodyLayer(
      'comets',
    );
  }

  toggleTransNeptunianObjects():
    void {
    this.toggleMinorBodyLayer(
      'transNeptunianObjects',
    );
  }

  toggleCapturedObjects():
    void {
    this.toggleMinorBodyLayer(
      'capturedObjects',
    );
  }

  toggleArtificialSatellites():
    void {

    if (
      this.artificialSatellitePlanetCount() ===
        0
    ) {
      return;
    }

    this.artificialSatellitesVisibleSignal.update(
      value =>
        !value,
    );

    this.applyLayerVisibility();
  }

  selectionKindLabel(
    kind:
      SystemSceneSelection['kind'],
  ): string {
    switch (
      kind
    ) {
      case 'star':
        return 'ESTRELLA';
      case 'planet':
        return 'PLANETA';
      case 'moon':
        return 'LUNA';
      default:
        return 'CUERPO MENOR';
    }
  }

  selectedBodyCard():
    SystemSceneBodyCard | null {
    const selection =
      this.selectionSignal();

    if (
      selection ===
        null
    ) {
      return null;
    }

    return buildSystemSceneBodyCard(
      this.snapshot,
      selection.bodyId,
    );
  }

  openSelectedBodyCard():
    void {
    if (
      this.selectionSignal() !==
        null
    ) {
      this.bodyCardOpenSignal.set(
        true,
      );
    }
  }

  closeSelectedBodyCard():
    void {
    this.bodyCardOpenSignal.set(
      false,
    );
  }

  isSelectedBodyTracked():
    boolean {
    const selection =
      this.selectionSignal();

    const trackingSelection =
      this.trackingSelectionSignal();

    return (
      selection !== null &&
      trackingSelection !== null &&
      selection.bodyId ===
        trackingSelection.bodyId
    );
  }

  followSelectedBody():
    void {
    const selection =
      this.selectionSignal();

    if (
      selection === null
    ) {
      return;
    }

    const followed =
      this.runtime
        ?.followBody
        ?.(
          selection.bodyId,
        ) ??
      false;

    if (
      followed
    ) {
      this.focusedLaboratoryStarSignal.set(null);
      this.trackingSelectionSignal.set(
        selection,
      );
    }
  }

  ngAfterViewInit():
    void {

    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      this
        .renderStateSignal
        .set(
          'unavailable',
        );

      return;
    }

    try {
      this.runtime =
        this
          .runtimeFactory(
            this
              .sceneCanvasRef
              .nativeElement,
            selection => {
              this
                .selectionSignal
                .set(
                  selection,
                );

              this
                .bodyCardOpenSignal
                .set(
                  selection !==
                    null,
                );

              this
                .bodySelectionChange
                .emit(
                  selection,
                );
            },
            day => this.updateLaboratoryDistances(day),
          );

      this.installResizeHandling();
      this.installVisibilityHandling();
      this.resizeRuntime();
      this.renderSnapshot();
    } catch (
      error
    ) {
      this
        .runtime
        ?.dispose();

      this.runtime =
        null;

      this
        .renderStateSignal
        .set(
          error instanceof
            SystemSceneWebGl2UnavailableError
            ? 'unavailable'
            : 'error',
        );
    }
  }

  ngOnChanges(
    changes:
      SimpleChanges,
  ):
    void {

    if(changes['snapshot']!==undefined){
      // No reiniciar la capa si el mismo sistema emite un snapshot nuevo.
      const identity=`${this.snapshot.universeSeed}|${this.snapshot.proceduralIdentity}`;
      if(identity!==this.lastColonySystemIdentityT7n){
        this.coloniesVisibleSignalT7n.set(false);
        this.lastColonySystemIdentityT7n=identity;
      }
    }
    if (
      (changes['snapshot'] !== undefined ||
        changes['laboratoryCloseZoom'] !== undefined) &&
      this.runtime !==
        null
    ) {
      this.renderSnapshot();
    }
  }

  ngOnDestroy():
    void {

    this.removeResizeHandling();
    this.removeVisibilityHandling();

    this
      .runtime
      ?.dispose();

    this.runtime =
      null;
  }

  resetView():
    void {

    this
      .runtime
      ?.resetView
      ?.();

    this.trackingSelectionSignal.set(
      null,
    );
    this.focusedLaboratoryStarSignal.set(null);
  }

  private applyLayerVisibility():
    void {

    this.runtime
      ?.setLayerVisibility?.({
        ...(this.laboratoryOrbitControls || this.laboratoryMultipleControls || this.gameplaySceneControls
          ? { orbits: this.orbitLinesVisibleSignal() } : {}),
        ...(this.coloniesVisibleSignalT7n()?{colonies:true}:{}),
        planets:
          this.planetsVisibleSignal() &&
          this.snapshot.planets.length + (this.snapshot.pulsarPlanetVisuals?.length ?? 0) >
            0,
        moons:
          this.moonsVisibleSignal() &&
          this.snapshot.layers.moonCount >
            0,
        habitableZone:
          this.habitableZoneVisibleSignal() &&
          this.snapshot.layers.habitableZoneAvailable,
        orbitalRisk:
          this.orbitalRiskVisibleSignal() &&
          this.snapshot.orbitalRiskTargets.length >
            0,
        asteroids:
          this.asteroidsVisibleSignal() &&
          this.asteroidLayerAvailable(),
        comets:
          this.cometsVisibleSignal() &&
          this.cometCount() >
            0,
        transNeptunianObjects:
          this.transNeptunianObjectsVisibleSignal() &&
          this.transNeptunianObjectCount() >
            0,
        capturedObjects:
          this.capturedObjectsVisibleSignal() &&
          this.capturedObjectCount() >
            0,
        artificialSatellites:
          this.artificialSatellitesVisibleSignal() &&
          this.artificialSatellitePlanetCount() >
            0,
      });

    const trackingSelection =
      this.trackingSelectionSignal();

    if (
      trackingSelection !==
        null &&
      !this.isSelectionVisible(
        trackingSelection,
      )
    ) {
      this.trackingSelectionSignal.set(
        null,
      );
    }
  }

  private isSelectionVisible(
    selection:
      SystemSceneSelection,
  ): boolean {
    switch (
      selection.kind
    ) {
      case 'star':
        return true;
      case 'planet':
        return this.planetsVisibleSignal();
      case 'moon':
        return this.moonsVisibleSignal();
      case 'minor-body': {
        const body =
          this.snapshot.minorBodies.find(
            candidate =>
              candidate.id ===
              selection.bodyId,
          );

        if (
          body ===
            undefined
        ) {
          return false;
        }

        switch (
          minorBodyLayerKeyForKind(
            body.minorBodyKind,
          )
        ) {
          case 'asteroids':
            return this.asteroidsVisibleSignal();
          case 'comets':
            return this.cometsVisibleSignal();
          case 'transNeptunianObjects':
            return this.transNeptunianObjectsVisibleSignal();
          case 'capturedObjects':
            return this.capturedObjectsVisibleSignal();
        }
      }
    }
  }

  private toggleMinorBodyLayer(
    layer:
      SystemSceneMinorBodyLayerKey,
  ): void {

    if (
      layer ===
        'asteroids'
        ? !this.asteroidLayerAvailable()
        : this.minorBodyCountForLayer(
            layer,
          ) === 0
    ) {
      return;
    }

    switch (
      layer
    ) {
      case 'asteroids':
        this.asteroidsVisibleSignal.update(
          value =>
            !value,
        );
        break;
      case 'comets':
        this.cometsVisibleSignal.update(
          value =>
            !value,
        );
        break;
      case 'transNeptunianObjects':
        this.transNeptunianObjectsVisibleSignal.update(
          value =>
            !value,
        );
        break;
      case 'capturedObjects':
        this.capturedObjectsVisibleSignal.update(
          value =>
            !value,
        );
        break;
    }

    this.applyLayerVisibility();
  }

  private minorBodyCountForLayer(
    layer:
      SystemSceneMinorBodyLayerKey,
  ): number {
    return this.snapshot.minorBodies.filter(
      body =>
        minorBodyLayerKeyForKind(
          body.minorBodyKind,
        ) === layer,
    ).length;
  }

  private installResizeHandling():
    void {

    const host =
      this
        .sceneHostRef
        .nativeElement;

    if (
      typeof ResizeObserver !==
        'undefined'
    ) {
      this.resizeObserver =
        new ResizeObserver(
          () => {
            this.resizeRuntime();
          },
        );

      this
        .resizeObserver
        .observe(
          host,
        );

      return;
    }

    window.addEventListener(
      'resize',
      this.onWindowResize,
      {
        passive:
          true,
      },
    );

    this.listeningToWindowResize =
      true;
  }

  private installVisibilityHandling():
    void {

    document.addEventListener(
      'visibilitychange',
      this.onDocumentVisibilityChange,
      {
        passive:
          true,
      },
    );

    this.listeningToDocumentVisibility =
      true;

    this.applyDocumentVisibility();
  }

  private removeVisibilityHandling():
    void {

    if (
      !this.listeningToDocumentVisibility ||
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      return;
    }

    document.removeEventListener(
      'visibilitychange',
      this.onDocumentVisibilityChange,
    );

    this.listeningToDocumentVisibility =
      false;
  }

  private applyDocumentVisibility():
    void {

    this.runtime
      ?.setPageVisible?.(
        document.visibilityState !==
          'hidden',
      );
  }

  private removeResizeHandling():
    void {

    this
      .resizeObserver
      ?.disconnect();

    this.resizeObserver =
      null;

    if (
      this.listeningToWindowResize &&
      isPlatformBrowser(
        this.platformId,
      )
    ) {
      window.removeEventListener(
        'resize',
        this.onWindowResize,
      );
    }

    this.listeningToWindowResize =
      false;
  }

  private resizeRuntime():
    void {

    if (
      this.runtime ===
        null
    ) {
      return;
    }

    const host =
      this
        .sceneHostRef
        .nativeElement;

    const bounds =
      host
        .getBoundingClientRect();

    const width =
      Math.max(
        1,
        Math.round(
          bounds.width ||
          host.clientWidth ||
          1,
        ),
      );

    const height =
      Math.max(
        1,
        Math.round(
          bounds.height ||
          host.clientHeight ||
          1,
        ),
      );

    this
      .runtime
      .resize(
        width,
        height,
        window.devicePixelRatio ||
          1,
      );
  }

  private renderSnapshot():
    void {

    if (
      this.runtime ===
        null
    ) {
      return;
    }

    this.trackingSelectionSignal.set(
      null,
    );
    this.focusedLaboratoryStarSignal.set(null);
    this.laboratoryDistancesSignal.set([]);

    try {
      assertSystemSceneProjectionSnapshot(
        this.snapshot,
      );

      if (
        this.snapshot.planets.length + (this.snapshot.pulsarPlanetVisuals?.length ?? 0) ===
          0
      ) {
        this.planetsVisibleSignal.set(
          false,
        );
      }

      if (
        this.snapshot.layers.moonCount ===
          0
      ) {
        this.moonsVisibleSignal.set(
          false,
        );
      }

      if (
        !this.snapshot.layers.habitableZoneAvailable
      ) {
        this.habitableZoneVisibleSignal.set(
          false,
        );
      }

      if (!this.orbitalRiskLayerAvailable()) {
        this.orbitalRiskVisibleSignal.set(
          false,
        );
      }

      if (
        this.asteroidCount() ===
          0
      ) {
        this.asteroidsVisibleSignal.set(
          false,
        );
      }

      if (
        this.cometCount() ===
          0
      ) {
        this.cometsVisibleSignal.set(
          false,
        );
      }

      if (
        this.transNeptunianObjectCount() ===
          0
      ) {
        this.transNeptunianObjectsVisibleSignal.set(
          false,
        );
      }

      if (
        this.capturedObjectCount() ===
          0
      ) {
        this.capturedObjectsVisibleSignal.set(
          false,
        );
      }

      if (
        this.artificialSatellitePlanetCount() ===
          0
      ) {
        this.artificialSatellitesVisibleSignal.set(
          false,
        );
      }

      // Keep the production runtime call's original one-argument contract.
      // Only the laboratory explicitly opts into the extra camera setting.
      const info = this.laboratoryCloseZoom
        ? this.runtime.render(this.snapshot, true)
        : this.runtime.render(this.snapshot);

      this.updateLaboratoryDistances(this.snapshot.simulation.epochSimulationDay);

      this.applyLayerVisibility();

      this
        .renderInfoSignal
        .set(
          info,
        );

      this
        .renderStateSignal
        .set(
          'ready',
        );

      this
        .renderInfoChange
        .emit(
          info,
        );
    } catch {
      this
        .renderStateSignal
        .set(
          'error',
        );
    }
  }
}

export function systemSceneDevicePixelRatio(
  devicePixelRatio:
    number,
): number {

  if (
    !Number.isFinite(
      devicePixelRatio,
    )
  ) {
    return 1;
  }

  return Math.min(
    MAX_DEVICE_PIXEL_RATIO,
    Math.max(
      1,
      devicePixelRatio,
    ),
  );
}

function systemSceneVisualExtentRadiusScene(
  body:
    SystemSceneSelectableBodySnapshot,
): number {

  if (
    body.kind ===
      'planet' &&
    body.specialPresentation !==
      null &&
    body.specialPresentation.rings !==
      null
  ) {
    return body.radiusScene *
      body.specialPresentation.rings
        .outerRadiusPlanetRadii;
  }

  return body.radiusScene;
}

export function systemScenePickingRadiusScene(
  kind:
    SystemSceneSelectableBodySnapshot['kind'],

  visibleRadiusScene:
    number,
): number {

  return kind ===
    'star'
    ? Math.max(
        visibleRadiusScene *
          1.45,
        0.13,
      )
    : Math.max(
        visibleRadiusScene *
          2.4,
        0.085,
      );
}

export function systemSceneCameraFovDegrees(
  aspect:
    number,
): number {

  if (
    !Number.isFinite(
      aspect,
    ) ||
    aspect <=
      0
  ) {
    return 44;
  }

  if (
    aspect <
      0.9
  ) {
    return 54;
  }

  if (
    aspect <
      1.2
  ) {
    return 48;
  }

  return 44;
}

function currentHighResolutionTimestampMilliseconds():
  number {

  if (
    typeof performance !==
      'undefined' &&
    typeof performance.now ===
      'function'
  ) {
    const value =
      performance.now();

    if (
      Number.isFinite(
        value,
      )
    ) {
      return value;
    }
  }

  return 0;
}

function minorBodyLayerKeyForKind(
  kind:
    MinorBodyKindValue,
): SystemSceneMinorBodyLayerKey {

  switch (
    kind.name
  ) {
    case 'ASTEROID':
      return 'asteroids';
    case 'COMET':
      return 'comets';
    case 'TRANS_NEPTUNIAN_OBJECT':
      return 'transNeptunianObjects';
    default:
      return 'capturedObjects';
  }
}

function createThreeSystemSceneRuntime(
  canvas:
    HTMLCanvasElement,

  onSelectionChange:
    SystemSceneSelectionChangeHandler =
    () => {},
  onSimulationDay?: (simulationDay: number) => void,
): SystemSceneRuntime {

  return new ThreeSystemSceneRuntime(
    canvas,
    onSelectionChange,
    onSimulationDay,
  );
}

class ThreeSystemSceneRuntime
  implements SystemSceneRuntime {

  private readonly renderer:
    THREE.WebGLRenderer;

  private readonly backendAssessment:
    SystemSceneRenderBackendAssessmentV1;

  private readonly scene =
    new THREE.Scene();

  private readonly camera =
    new THREE.PerspectiveCamera(
      44,
      1,
      0.01,
      1_000,
    );

  private readonly backdropRoot =
    new THREE.Group();

  private readonly presentationRoot =
    new THREE.Group();

  private readonly starHaloTexture:
    THREE.CanvasTexture;

  private readonly starBloomTexture:
    THREE.CanvasTexture;

  private readonly starGlareTexture:
    THREE.CanvasTexture;

  private readonly persistentDisposables:
    Array<{ dispose(): void }> = [];

  private readonly frameDisposables:
    Array<{ dispose(): void }> = [];

  /** Point-25.11 shared bounded geometry/texture resources. */
  private readonly sphereGeometryPool =
    new SystemSceneSphereGeometryPoolV1();

  private readonly planetTextureCache =
    new SystemSceneBoundedResourceCacheV1<SystemScenePlanetTextureResourceV1>(
      18,
      12 * 1024 * 1024,
    );

  private readonly moonTextureCache =
    new SystemSceneBoundedResourceCacheV1<SystemSceneMoonTextureResourceV1>(
      32,
      6 * 1024 * 1024,
    );

  /** Shared laboratory visuals driven by this runtime's simulation clock. */
  private readonly compactVisualBindings = new Map<string, LaboratoryCompactSceneGraph>();
  /** Only BH graphs are screen-facing: NS beams and fields keep genuine 3D rotation. */
  private readonly compactBlackHoleBillboards: THREE.Group[] = [];
  /** 31.4i.1: planets, moons and minor bodies share BH foreground/background ordering. */
  private readonly compactBlackHoleBodyOcclusion: CompactBlackHoleBodyOcclusionBinding[] = [];

  private readonly bodyLodBindings =
    new Map<string, SystemSceneBodyLodBindingV1>();

  /** VISCATM.1c: only the inspected giant uses high-tessellation geometry.
   * The resource is shared across cloud tops, translucent haze and shell. */
  private giantAtmosphereFineSphereVISCATM1c: THREE.SphereGeometry | null = null;
  private focusedGiantAtmosphereVISCATM1c: string | null = null;
  private readonly giantAtmosphereShellsVISCATM1c = new Map<string, readonly {
    mesh: THREE.Mesh;
    originalGeometry: THREE.SphereGeometry;
    originalScale: THREE.Vector3;
    radius: number;
  }[]>();

  /** 38.7x: one high-detail minor-body atlas at a time; restores native
   * materials when zooming away and frees the GPU texture on scene disposal. */
  private readonly minorBodyAtlasSources387x = new Map<string, {
    group: THREE.Group;
    radiusScene: number;
    body: SystemSceneMinorBodySnapshot;
    surfaces: readonly THREE.Mesh[];
    kind: ScientificMinorBodySurfaceKindVis3d2e;
    seedUint32: number;
  }>();
  private focusedMinorBodyAtlas387x: {
    id: string;
    texture: THREE.DataTexture;
    materials: readonly { material: THREE.MeshStandardMaterial; originalMap: THREE.Texture | null }[];
    detailedGeometry: {
      mesh: THREE.Mesh;
      originalGeometry: THREE.BufferGeometry;
      originalScale: THREE.Vector3;
      temporaryGeometry: THREE.BufferGeometry;
    } | null;
  } | null = null;

  /** T7n: indicadores verdes del cuerpo entero; T7t añade otra capa por emplazamiento. */
  private readonly colonyBodyMarkerBindingsT7n:Array<{marker:THREE.Sprite;kind:'planet'|'moon'}>=[];
  /** T7t: círculos pequeños por colonia, visibles SOLO al activar COLONIAS. */
  private readonly colonySiteMarkerBindingsT7t:Array<{
    marker:THREE.Sprite;anchor:THREE.Group;body:THREE.Group;
    kind:'planet'|'moon';radius:number;
  }>=[];
  private readonly colonySiteCameraT7t=new THREE.Vector3();
  private readonly colonySiteWorldT7t=new THREE.Vector3();
  private readonly colonySiteCenterT7t=new THREE.Vector3();
  private readonly colonySiteNormalT7t=new THREE.Vector3();
  private readonly colonySiteToCameraT7t=new THREE.Vector3();

  private readonly infrastructureVisualBindings386: Array<{bodyId:string;radius:number;visual:Vida38InfrastructureVisual386}> = [];

  /** VIS-3D.1: at most one near-camera planet carries extra GPU texture maps. */
  private detailedPlanetTexture: {
    id: string;
    detailWidth: number;
    material: THREE.MeshStandardMaterial;
    originalMap: THREE.Texture | null;
    originalRoughness: THREE.Texture | null;
    originalBump: THREE.Texture | null;
    originalNormal: THREE.Texture | null;
    originalEmissive: THREE.Texture | null;
    cloudMaterial: THREE.MeshStandardMaterial | null;
    originalCloud: THREE.Texture | null;
    detailTextures: readonly THREE.DataTexture[];
  } | null = null;


  /** LUNSURF.1 — one focused lunar atlas only, including irregular moons.
   * The regular orbital scene keeps its established lightweight textures. */
  private readonly lunarSurfaceFocusSourcesLUNSURF1 =
    new Map<string, {mesh: THREE.Mesh; presentation: SystemSceneMoonPresentationV1}>();

  private focusedLunarSurfaceLUNSURF1: {
    id: string;
    material: THREE.MeshPhysicalMaterial;
    map: THREE.Texture | null;
    normalMap: THREE.Texture | null;
    roughnessMap: THREE.Texture | null;
    roughness: number;
    normalScale: THREE.Vector2;
    textures: readonly THREE.DataTexture[];
  } | null = null;

  /** LODGRP.1: one planetary system at a time. HD CPU atlases are generated
   * by a real module Worker, GPU upload is metered, and visible maps swap in
   * one commit. Individual zoom refiners remain only as a graceful fallback. */
  private readonly planetaryLodGroupLODGRP1 = new PlanetaryLodGroupControllerV1();
  private planetaryLodWorkerLODGRP1: Worker | null = null;
  private planetaryLodBusyLODGRP1 = false;
  /** LODGRP.2: stage GPU maps as soon as each worker atlas arrives. */
  private readonly planetaryLodStagedIdsLODGRP2 = new Set<string>();
  private readonly planetaryLodTimingsLODGRP2 = new LodgrpTimingsV2();
  private planetaryLodJobStartLODGRP2 = 0;
  private planetaryLodLastCheckLODGRP1 = -Infinity;
  private planetaryLodEntryStateLODGRP1: 'OUT'|'PREPARING'|'IN' = 'OUT';
  private planetaryLodGpuQueueLODGRP1: Array<{id:string;role:LodgrpAtlasRoleV1;texture:THREE.DataTexture}> = [];
  private planetaryLodGpuReadyLODGRP1: Array<{id:string;role:LodgrpAtlasRoleV1;texture:THREE.DataTexture}> = [];
  private planetaryLodInstalledLODGRP1: Array<{
    material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
    originalMap: THREE.Texture | null;
    originalRoughness: THREE.Texture | null;
    originalBump: THREE.Texture | null;
    originalNormal: THREE.Texture | null;
    originalEmissive: THREE.Texture | null;
    originalNormalScale: THREE.Vector2;
    originalRoughnessValue: number;
    cloudMaterial: THREE.MeshStandardMaterial | null;
    originalCloud: THREE.Texture | null;
  }> = [];
  private planetaryLodRequestFrameLODGRP1 = false;
  private planetaryLodPreparationStartLODGRP1 = 0;
  private readonly planetaryLodDebugLODGRP1 = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('genesisLodGrpDebug') === '1';
  private planetaryLodLastFrameLODGRP1 = 0;
  private readonly planetaryLodFrameSamplesLODGRP1:number[]=[];
  private readonly planetaryLodApoapsisCacheLODGRP1=new Map<string,number>();

  /** Hidden moon layers defer 25.10 texture/material creation until first reveal. */
  private readonly pendingMoonVisuals =
    new Map<string, SystemScenePendingMoonVisualV1>();

  private viewportHeightPixels =
    720;

  /** One invisible instanced picking batch replaces one proxy mesh per body. */
  private selectionProxyBatch:
    THREE.InstancedMesh | null =
    null;

  private readonly selectionProxyBodyIds:
    string[] = [];

  private readonly selectionProxyGroups:
    THREE.Group[] = [];

  private readonly selectionProxyRadii:
    number[] = [];

  private readonly selectionProxyMatrix =
    new THREE.Matrix4();

  private readonly selectionProxyScale =
    new THREE.Vector3();

  private readonly selectionProxyPosition =
    new THREE.Vector3();

  private readonly selectionProxyQuaternion =
    new THREE.Quaternion();

  private readonly lodWorldPosition =
    new THREE.Vector3();

  private readonly cameraWorldPosition =
    new THREE.Vector3();

  private readonly animatedBodies =
    new Map<string, THREE.Group>();

  /** Spin pivot only; orbital translation remains on animatedBodies. */
  private readonly spinningBodies =
    new Map<string, THREE.Object3D>();

  /** Point-25.6 uniforms: planets plus each V2 moon and minor body use the same stellar pass. */
  private readonly bodyLightBindings =
    new Map<string, SystemScenePlanetLightBindingV1>();

  /** The actual presentation day applied to every animated body this frame. */
  private lightingSimulationDay = 0;

  private readonly planetLightPlanetWorldPosition =
    new THREE.Vector3();

  private readonly planetLightStarWorldPosition =
    new THREE.Vector3();

  private readonly planetLightDirectionScratch =
    new THREE.Vector3();

  private readonly planetLightTopDirections =
    [
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ] as const;

  private readonly planetLightTopFluxes =
    [0, 0, 0];

  private readonly planetOrbitHomeDirectionScratch =
    new THREE.Vector3();

  private readonly artificialSatellitePlanetWorldPosition =
    new THREE.Vector3();

  private readonly artificialSatelliteCameraDirection =
    new THREE.Vector3();

  private readonly artificialSatelliteStarWorldPosition =
    new THREE.Vector3();

  private readonly artificialSatelliteLightDirection =
    new THREE.Vector3();

  /** VISCORB.1: transient local presentation of an already known moon system. */
  private readonly viscorbLocalPresentation = new ViscorbSystemLocalPresentationV1();

  private readonly animatedOrbits =
    new Map<string, THREE.LineLoop>();

  private readonly orbitLocalSamplesAu =
    new Map<
      string,
      readonly {
        readonly x:
          number;
        readonly y:
          number;
        readonly z:
          number;
      }[]
    >();

  private readonly selectableObjects:
    THREE.Object3D[] =
    [];

  private readonly bodySnapshotById =
    new Map<string, SystemSceneSelectableBodySnapshot>();

  private readonly planetLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly moonLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly habitableZoneLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly orbitalRiskLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly habitableZoneBindings:
    Array<{
      readonly group: THREE.Group;
      readonly snapshot: SystemSceneHabitableZoneSnapshot;
    }> = [];

  private readonly asteroidBeltLayerBindings:
    Array<{
      readonly group: THREE.Group;
      readonly snapshot: SystemSceneAsteroidBeltSnapshot;
    }> =
    [];

  private readonly orbitalRiskOrbitOverlays:
    Array<{
      readonly line: THREE.LineLoop;
      readonly orbit: SystemSceneOrbitSnapshot;
    }> = [];

  private readonly orbitalRiskMarkers:
    Array<{
      readonly sprite: THREE.Sprite;
      readonly targetBodyId: string;
    }> = [];

  private readonly artificialSatelliteLayerObjects:
    THREE.Object3D[] =
    [];

  /** Only the orbital guide lines, never physical satellite/station/ring meshes. */
  private readonly artificialSatelliteOrbitGuides:
    THREE.LineLoop[] =
    [];

  /** Planet surface ring-shadow shader bindings (only VERY_ADVANCED planets). */
  private readonly orbitalSurfaceShadowBindingsVISCIV6n: OrbitalSurfaceShadowBindingVISCIV6n[] = [];

  private readonly artificialSatelliteBindings:
    Array<{
      readonly hostBodyId: string;
      readonly orbitPivot: THREE.Group;
      readonly basePhaseRadians: number;
      readonly angularSpeedRadiansPerDay: number;
      readonly materials: readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
      readonly orbitMaterial: THREE.LineBasicMaterial | null;
      readonly baseLineOpacity01: number;
      readonly ringVisualVISCIV6g?: SystemSceneOrbitalRingVisualV1;
    }> = [];

  private readonly asteroidLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly cometLayerObjects:
    THREE.Object3D[] =
    [];

  /** Point-25.8 dynamic coma/tail bindings for relevant comets. */
  private readonly cometActivityBindings =
    new Map<string, SystemSceneCometActivityBindingV1>();

  private readonly cometLightDirectionAccumulator =
    new THREE.Vector3();

  private readonly cometLightDirectionScratch =
    new THREE.Vector3();

  private readonly cometWorldPosition =
    new THREE.Vector3();

  private readonly cometStarWorldPosition =
    new THREE.Vector3();

  private readonly transNeptunianObjectLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly capturedObjectLayerObjects:
    THREE.Object3D[] =
    [];

  /** Point-25.11 visible instancing for generic TNO/captured minor bodies. */
  private readonly minorBodyInstanceBatches =
    new Map<SystemSceneMinorBodyLayerKey, SystemSceneMinorBodyInstanceBatchV1>();

  private readonly minorBodyInstanceMatrix =
    new THREE.Matrix4();

  private readonly minorBodyInstanceScale =
    new THREE.Vector3();

  private readonly minorBodyInstanceQuaternion =
    new THREE.Quaternion();

  private minorBodyOrbitLayerKeys =
    new Map<string, SystemSceneMinorBodyLayerKey>();

  private layerVisibility:
    SystemSceneLayerVisibility =
    Object.freeze({
      planets: true,
      colonies:false,
      orbits: true,
      moons: false,
      habitableZone: false,
      orbitalRisk: false,
      asteroids: false,
      comets: false,
      transNeptunianObjects: false,
      capturedObjects: false,
      artificialSatellites: false,
    });

  private readonly raycaster =
    new THREE.Raycaster();

  private readonly pointerNdc =
    new THREE.Vector2();

  private readonly selectionRingTexture:
    THREE.CanvasTexture;

  private selectionMarker:
    THREE.Sprite | null =
    null;

  private selectedBodyId:
    string | null =
    null;

  private trackedBodyId:
    string | null =
    null;

  private readonly trackedWorldPosition =
    new THREE.Vector3();

  private readonly cameraController:
    SystemSceneCameraController;

  /** 38.9: identities shared by all animation frames of the current snapshot.
   * This is NOT a scientific cache: rebuilding a snapshot rebuilds all lookups.
   * In particular, no planet/moon array or host-star Set is allocated per frame.
   */
  private lightingTargets389: readonly (
    SystemSceneSnapshot['planets'][number] |
    SystemSceneSnapshot['moons'][number] |
    SystemSceneSnapshot['minorBodies'][number]
  )[] = [];
  private readonly orbitalHomeStars389 = new Map<string, readonly string[]>();
  private readonly starsById389 = new Map<string, SystemSceneSnapshot['stars'][number]>();
  private hasCompactLightingHost389 = false;

  private currentSnapshot:
    SystemSceneSnapshot | null =
    null;

  private simulationClock:
    SystemSimulationClock | null =
    null;

  private readonly activeTime =
    new SystemSceneActiveTime();

  private pageVisible =
    true;

  private motionById =
    new Map<string, SystemSceneOrbitalMotionSnapshot>();

  private readonly onAnimationFrame =
    (
      realTimestampMilliseconds:
        number,
    ): void => {

      if (
        !this.pageVisible ||
        this.currentSnapshot ===
          null ||
        this.simulationClock ===
          null
      ) {
        return;
      }

      const activeTimestampMilliseconds =
        this.activeTime.project(
          realTimestampMilliseconds,
        );

      const simulationState =
        this.simulationClock.read(
          activeTimestampMilliseconds,
        );

      this.applySimulationDay(
        simulationState.simulationDay,
      );

      if (this.onSimulationDay &&
          realTimestampMilliseconds - this.lastTelemetryTimestamp >= 250) {
        this.lastTelemetryTimestamp = realTimestampMilliseconds;
        this.onSimulationDay(simulationState.simulationDay);
      }

      this.updateTrackedBodyCamera(
        activeTimestampMilliseconds,
      );

      this.renderFrame();
    };

  private disposed =
    false;

  private lastTelemetryTimestamp = Number.NEGATIVE_INFINITY;

  constructor(
    private readonly canvas:
      HTMLCanvasElement,

    private readonly onSelectionChange:
      SystemSceneSelectionChangeHandler,
    private readonly onSimulationDay?: (simulationDay: number) => void,
  ) {

    const context =
      canvas.getContext(
        'webgl2',
        {
          alpha:
            false,
          antialias:
            true,
          depth:
            true,
          stencil:
            false,
          preserveDrawingBuffer:
            false,
          powerPreference:
            'high-performance',
        },
      );

    if (
      context ===
        null
    ) {
      throw new SystemSceneWebGl2UnavailableError();
    }

    this.backendAssessment =
      buildSystemSceneRenderBackendAssessmentV1({
        webGl2Available:
          true,
        webGpuApiAvailable:
          systemSceneWebGpuApiAvailable(
            typeof navigator ===
              'undefined'
              ? null
              : navigator,
          ),
      });

    this.renderer =
      new THREE.WebGLRenderer({
        canvas,
        context,
        antialias:
          true,
        alpha:
          false,
        powerPreference:
          'high-performance',
      });

    this.renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    this.renderer.toneMapping =
      THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure =
      1.10;

    this
      .renderer
      .setClearColor(
        0x010205,
        1,
      );

    this.scene.background =
      new THREE.Color(
        0x010205,
      );

    this.starHaloTexture =
      createRadialGlowTexture(
        'broad',
      );

    this.starBloomTexture =
      createRadialGlowTexture(
        'compact',
      );

    this.starGlareTexture =
      createStellarGlareTexture();

    this.selectionRingTexture =
      createSelectionRingTexture();

    this.persistentDisposables.push(
      this.starHaloTexture,
      this.starBloomTexture,
      this.starGlareTexture,
      this.selectionRingTexture,
    );

    this.backdropRoot.name =
      'GENESIS/SystemBackdrop';

    this.presentationRoot.name =
      'GENESIS/SystemPresentation';
    this.presentationRoot.rotation.x =
      -0.4;
    this.presentationRoot.rotation.z =
      0.08;

    this.scene.add(
      this.backdropRoot,
      this.presentationRoot,
      new THREE.AmbientLight(
        0x45627a,
        0.28,
      ),
      new THREE.HemisphereLight(
        0x7ca0c5,
        0x050608,
        0.18,
      ),
    );

    createBackdropStarField(
      this.backdropRoot,
      this.persistentDisposables,
    );

    this.cameraController =
      new SystemSceneCameraController(
        this.camera,
        canvas,
        () => {
          this.renderFrame();
        },
        (clientX, clientY) => {
          this.selectAtClientPoint(
            clientX,
            clientY,
          );
        },
      );

    this.cameraController.frameSystem(
      4.8,
    );
  }

  resize(
    width:
      number,

    height:
      number,

    devicePixelRatio:
      number,
  ):
    void {

    this.assertAlive();

    const safeWidth =
      Math.max(
        1,
        width,
      );

    const safeHeight =
      Math.max(
        1,
        height,
      );

    const aspect =
      safeWidth /
      safeHeight;

    this.viewportHeightPixels =
      safeHeight;

    this
      .renderer
      .setPixelRatio(
        systemSceneDevicePixelRatio(
          devicePixelRatio,
        ),
      );

    this
      .renderer
      .setSize(
        safeWidth,
        safeHeight,
        false,
      );

    this.camera.aspect =
      aspect;

    this.camera.fov =
      systemSceneCameraFovDegrees(
        aspect,
      );

    this
      .camera
      .updateProjectionMatrix();

    this.renderFrame();
  }

  render(
    snapshot:
      SystemSceneSnapshot,
    laboratoryCloseZoom = false,
  ): SystemSceneRenderInfo {

    this.assertAlive();
    assertSystemSceneProjectionSnapshot(
      snapshot,
    );

    this.camera.near = laboratoryCloseZoom ? 0.003 : 0.01;
    this.camera.updateProjectionMatrix();

    this.scene.name =
      `GENESIS System ${snapshot.proceduralIdentity}`;
    // 38.8: informational provenance only; never a discovery gate or shader change.
    this.scene.userData['genesisVisualTrace38_8'] =
      genesisVisualSceneTrace388(snapshot.proceduralIdentity);

    this
      .renderer
      .setAnimationLoop(
        null,
      );

    this.clearFrameObjects();
    this.lastTelemetryTimestamp = Number.NEGATIVE_INFINITY;
    this.currentSnapshot =
      snapshot;
    // 38.9: build identity-only lighting indexes once for this scene, not at
    // 60 FPS. Dynamics (positions, fluxes, weights) remain live and unchanged.
    this.lightingTargets389 = systemSceneLightingTargets(snapshot);
    this.starsById389.clear();
    for (const star of snapshot.stars) this.starsById389.set(star.id, star);
    this.orbitalHomeStars389.clear();
    for (const planet of snapshot.planets) {
      this.orbitalHomeStars389.set(planet.id,
        resolveOrbitalHomeStarIdsVISCIV6d(planet, snapshot.stars));
    }
    this.hasCompactLightingHost389 = snapshot.stars.some(
      star => star.compactHostKind !== undefined);
    this.simulationClock =
      new SystemSimulationClock(
        snapshot.simulation
          .playbackDaysPerRealSecond,
        snapshot.simulation
          .epochSimulationDay,
      );
    this.motionById =
      new Map(
        snapshot.motions.map(
          motion =>
            [
              motion.id,
              motion,
            ] as const,
        ),
      );

    this.minorBodyOrbitLayerKeys =
      new Map(
        snapshot.minorBodies.map(
          body => [
            body.orbitId,
            minorBodyLayerKeyForKind(
              body.minorBodyKind,
            ),
          ] as const,
        ),
      );

    this.cameraController.frameSystem(
      snapshot.scale
        .targetOuterRadiusScene,
      laboratoryCloseZoom,
    );

    this.initializeSelectionProxyBatch(
      snapshot.stars.length +
      snapshot.planets.length +
      (snapshot.pulsarPlanetVisuals?.length ?? 0) +
      snapshot.moons.length +
      snapshot.minorBodies.length,
    );
    this.initializeMinorBodyInstanceBatches(
      snapshot.minorBodies,
    );

    for (const zone of snapshot.habitableZones ??
      (snapshot.habitableZone === null ? [] : [snapshot.habitableZone])) {
      this.addHabitableZone(zone);
    }

    for (
      const belt
      of snapshot.asteroidBelts ??
        []
    ) {
      this.addAsteroidBeltBand(
        belt,
      );
    }

    for (
      const orbit
      of snapshot.orbits
    ) {
      this.addOrbit(
        orbit,
        snapshot.scale,
      );
    }

    for (
      const star
      of snapshot.stars
    ) {
      this.addStar(
        star,
      );
    }

    const planetTextureSystemIdentity =
      `${snapshot.universeSeed}|v${snapshot.generatorVersionCode}|${snapshot.proceduralIdentity}`;

    for (
      const planet
      of snapshot.planets
    ) {
      this.addPlanet(
        planet,
        planetTextureSystemIdentity,
      );
    }

    for (const planet of snapshot.pulsarPlanetVisuals ?? []) {
      this.addPlanet(planet, planetTextureSystemIdentity);
    }

    for (
      const moon
      of snapshot.moons
    ) {
      this.addMoon(
        moon,
      );
    }

    for (
      const minorBody
      of snapshot.minorBodies
    ) {
      this.addMinorBody(
        minorBody,
      );
    }

    for (
      const riskTarget
      of snapshot.orbitalRiskTargets
    ) {
      this.addOrbitalRiskTarget(
        riskTarget,
        snapshot,
      );
    }

    this.applyLayerVisibilityToObjects();

    this.applySimulationDay(
      snapshot.simulation
        .epochSimulationDay,
    );
    this.renderFrame();

    this.updateAnimationLoop();

    return Object.freeze({
      renderer:
        this.backendAssessment
          .selectedBackend,

      shaderPipeline:
        this.backendAssessment
          .shaderPipeline,

      webGpuEvaluation:
        this.backendAssessment
          .webGpuEvaluation,

      physicalBodyCount:
        snapshot.stars.length +
        snapshot.planets.length +
        (snapshot.pulsarPlanetVisuals?.length ?? 0) +
        snapshot.moons.length +
        snapshot.minorBodies.length,

      sceneObjectCount:
        countDescendants(
          this.scene,
        ),
    });
  }

  setPageVisible(
    visible:
      boolean,
  ): void {

    this.assertAlive();

    if (
      this.pageVisible ===
        visible
    ) {
      return;
    }

    const realTimestampMilliseconds =
      currentHighResolutionTimestampMilliseconds();

    this.pageVisible =
      visible;

    this.activeTime.setVisible(
      visible,
      realTimestampMilliseconds,
    );

    this.updateAnimationLoop();

    if (
      visible
    ) {
      this.renderFrame();
    }
  }

  setLayerVisibility(
    visibility:
      SystemSceneLayerVisibility,
  ): void {

    this.assertAlive();
    const previousMoonsLODGRP1=this.layerVisibility.moons;
    const previousPlanetsLODGRP1=this.layerVisibility.planets;
    this.layerVisibility =
      Object.freeze({
        ...visibility,
      });

    if (
      visibility.moons
    ) {
      this.materializePendingMoonVisuals();
      // Re-enable the local orbit frame while continuing to follow its host.
      const host = this.trackedBodyId === null ? null :
        this.bodySnapshotById.get(this.trackedBodyId);
      if (host?.kind === 'planet' && this.currentSnapshot &&
          !this.viscorbLocalPresentation.resume(host.id)) {
        this.viscorbLocalPresentation.begin(
          host, this.currentSnapshot.planets, this.currentSnapshot.moons,
          this.currentSnapshot.orbits, this.currentSnapshot.scale,
          this.animatedBodies, this.animatedOrbits,
        );
      }
    } else {
      this.viscorbLocalPresentation.release();
    }

    if (previousMoonsLODGRP1 !== visibility.moons ||
        previousPlanetsLODGRP1 !== visibility.planets)
      this.resetPlanetaryLodGroupLODGRP1(false);
    this.applyLayerVisibilityToObjects();
    this.renderFrame();
  }

  private applyLayerVisibilityToObjects():
    void {
    for(const {marker,kind} of this.colonyBodyMarkerBindingsT7n){
      marker.visible=!!this.layerVisibility.colonies &&
        (kind==='planet'?this.layerVisibility.planets:this.layerVisibility.moons);
    }
    // Sin marcas de emplazamientos cuando COLONIAS está desactivado.
    // La visibilidad por hemisferio y zoom se actualiza en cada fotograma.
    for(const {marker} of this.colonySiteMarkerBindingsT7t)marker.visible=false;
    for (
      const object
      of this.planetLayerObjects
    ) {
      object.visible =
        this.layerVisibility.planets;
    }

    for (
      const object
      of this.moonLayerObjects
    ) {
      object.visible =
        this.layerVisibility.moons;
    }

    for (
      const object
      of this.habitableZoneLayerObjects
    ) {
      object.visible =
        this.layerVisibility.habitableZone;
    }

    for (
      const object
      of this.orbitalRiskLayerObjects
    ) {
      object.visible =
        this.layerVisibility.orbitalRisk;
    }

    for (
      const object
      of this.asteroidLayerObjects
    ) {
      object.visible =
        this.layerVisibility.asteroids;
    }

    for (
      const object
      of this.cometLayerObjects
    ) {
      object.visible =
        this.layerVisibility.comets;
    }

    for (
      const object
      of this.transNeptunianObjectLayerObjects
    ) {
      object.visible =
        this.layerVisibility.transNeptunianObjects;
    }

    for (
      const object
      of this.capturedObjectLayerObjects
    ) {
      object.visible =
        this.layerVisibility.capturedObjects;
    }

    for (
      const object
      of this.artificialSatelliteLayerObjects
    ) {
      object.visible =
        this.layerVisibility.artificialSatellites &&
        this.layerVisibility.planets;
    }

    // Satellite/station orbit TRACES follow the same global ORBITS switch as
    // natural paths; the satellite meshes and constructed orbital rings do not.
    applySystemSceneArtificialOrbitGuideVisibilityV1(
      this.artificialSatelliteOrbitGuides,
      this.layerVisibility,
    );

    // Apply last so turning off orbit GUIDES never hides their bodies, and
    // turning guides on cannot reveal an otherwise hidden moon/planet layer.
    for (const [id, line] of this.animatedOrbits) {
      const orbit = this.currentSnapshot?.orbits.find(candidate => candidate.id === id);
      const minorLayer = this.minorBodyOrbitLayerKeys.get(id);
      const hostLayerVisible = orbit?.kind === 'planetary'
        ? this.layerVisibility.planets
        : orbit?.kind === 'moon'
          ? this.layerVisibility.moons
          : orbit?.kind === 'minor-body'
            ? this.layerVisibility[minorLayer ?? 'capturedObjects']
            : true;
      line.visible = (this.layerVisibility.orbits ?? true) && hostLayerVisible;
    }

    if (
      this.trackedBodyId !==
        null
    ) {
      const tracked =
        this.bodySnapshotById.get(
          this.trackedBodyId,
        );

      if (
        tracked ===
          undefined ||
        !this.isBodySnapshotVisible(
          tracked,
        )
      ) {
        this.stopFollowing();
      }
    }

    if (
      this.selectedBodyId !==
        null
    ) {
      const selected =
        this.bodySnapshotById.get(
          this.selectedBodyId,
        );

      if (
        selected?.kind ===
          'planet' &&
        !this.layerVisibility.planets
      ) {
        this.selectBody(
          null,
        );
        return;
      }

      if (
        selected?.kind ===
          'moon' &&
        !this.layerVisibility.moons
      ) {
        this.selectBody(
          null,
        );
        return;
      }

      if (
        selected?.kind ===
          'minor-body' &&
        !this.isMinorBodySnapshotVisible(
          selected,
        )
      ) {
        this.selectBody(
          null,
        );
      }
    }
  }

  private minorBodyLayerObjectArray(
    minorBodyKind:
      MinorBodyKindValue,
  ): THREE.Object3D[] {
    switch (
      minorBodyLayerKeyForKind(
        minorBodyKind,
      )
    ) {
      case 'asteroids':
        return this.asteroidLayerObjects;
      case 'comets':
        return this.cometLayerObjects;
      case 'transNeptunianObjects':
        return this.transNeptunianObjectLayerObjects;
      case 'capturedObjects':
        return this.capturedObjectLayerObjects;
    }
  }

  private minorBodyLayerObjectArrayForKey(
    layerKey:
      SystemSceneMinorBodyLayerKey,
  ): THREE.Object3D[] {
    switch (
      layerKey
    ) {
      case 'asteroids':
        return this.asteroidLayerObjects;
      case 'comets':
        return this.cometLayerObjects;
      case 'transNeptunianObjects':
        return this.transNeptunianObjectLayerObjects;
      case 'capturedObjects':
        return this.capturedObjectLayerObjects;
    }
  }

  private minorBodyOrbitLayerObjectArray(
    orbitId:
      string,
  ): THREE.Object3D[] {
    const layerKey =
      this.minorBodyOrbitLayerKeys.get(
        orbitId,
      ) ?? 'capturedObjects';

    switch (
      layerKey
    ) {
      case 'asteroids':
        return this.asteroidLayerObjects;
      case 'comets':
        return this.cometLayerObjects;
      case 'transNeptunianObjects':
        return this.transNeptunianObjectLayerObjects;
      case 'capturedObjects':
        return this.capturedObjectLayerObjects;
    }
  }

  private isBodySnapshotVisible(
    body:
      SystemSceneSelectableBodySnapshot,
  ): boolean {
    switch (
      body.kind
    ) {
      case 'star':
        return true;
      case 'planet':
        return this.layerVisibility.planets;
      case 'moon':
        return this.layerVisibility.moons;
      case 'minor-body':
        return this.isMinorBodySnapshotVisible(
          body,
        );
    }
  }

  private isMinorBodySnapshotVisible(
    body:
      SystemSceneMinorBodySnapshot,
  ): boolean {
    switch (
      minorBodyLayerKeyForKind(
        body.minorBodyKind,
      )
    ) {
      case 'asteroids':
        return this.layerVisibility.asteroids;
      case 'comets':
        return this.layerVisibility.comets;
      case 'transNeptunianObjects':
        return this.layerVisibility.transNeptunianObjects;
      case 'capturedObjects':
        return this.layerVisibility.capturedObjects;
    }
  }

  dispose():
    void {

    if (
      this.disposed
    ) {
      return;
    }

    this
      .renderer
      .setAnimationLoop(
        null,
      );

    this.disposed =
      true;
    this.pageVisible =
      false;

    this.currentSnapshot =
      null;
    this.simulationClock =
      null;
    this.motionById.clear();

    this.clearFrameObjects();
    this.giantAtmosphereFineSphereVISCATM1c?.dispose();
    this.giantAtmosphereFineSphereVISCATM1c = null;
    this.cameraController.dispose();
    this.releaseDetailedPlanetTexture();
    this.releaseFocusedLunarSurfaceLUNSURF1();
    this.planetTextureCache.dispose();
    this.moonTextureCache.dispose();
    this.sphereGeometryPool.dispose();
    disposeResources(
      this.persistentDisposables,
    );

    this.backdropRoot.clear();
    this.presentationRoot.clear();
    this.scene.clear();

    this
      .renderer
      .renderLists
      .dispose();

    this
      .renderer
      .dispose();

    this
      .renderer
      .forceContextLoss();
  }

  followBody(
    bodyId:
      string,
  ): boolean {

    this.assertAlive();

    const body =
      this.bodySnapshotById.get(
        bodyId,
      );

    const object =
      this.animatedBodies.get(
        bodyId,
      );

    if (
      body ===
        undefined ||
      object ===
        undefined ||
      !this.isBodySnapshotVisible(
        body,
      )
    ) {
      return false;
    }

    // Restore any previous local moon frame before following another body.
    if (this.viscorbLocalPresentation.hostId !== null) {
      this.viscorbLocalPresentation.endImmediately();
      this.applySimulationDay(this.lightingSimulationDay);
    }
    this.scene.updateMatrixWorld(true);
    object.getWorldPosition(this.trackedWorldPosition);
    this.trackedBodyId = bodyId;
    // Start worker module loading at the BEGINNING of the camera journey.
    // Heavy atlas work still starts only when the group proximity policy allows.
    if (body.kind === 'planet' || body.kind === 'moon')
      this.ensurePlanetaryLodWorkerLODGRP1();

    const localOrbitExtent =
      body.kind === 'planet' && this.layerVisibility.moons && this.currentSnapshot
        ? this.viscorbLocalPresentation.begin(
            body, this.currentSnapshot.planets,
            this.currentSnapshot.moons.filter(moon => this.isBodySnapshotVisible(moon)),
            this.currentSnapshot.orbits, this.currentSnapshot.scale,
            this.animatedBodies, this.animatedOrbits,
          )
        : null;

    const stellarSources = this.currentSnapshot?.stars.flatMap(star => {
      const starObject = this.animatedBodies.get(star.id);
      if (!starObject) return [];
      const position = starObject.getWorldPosition(new THREE.Vector3());
      return [{id:star.id,x:position.x,y:position.y,z:position.z,
        sourceLuminositySolar:star.sourceLuminositySolar}];
    }) ?? [];
    const direction = body.kind === 'planet'
      ? viscorbStellarViewDirectionV1(
          this.trackedWorldPosition, stellarSources, body.orbitalHomeStarIds ?? [],
        ) : null;
    this.cameraController.beginBodyTracking(
      this.trackedWorldPosition,
      systemSceneVisualExtentRadiusScene(body),
      Math.max(systemSceneVisualExtentRadiusScene(body),
        localOrbitExtent === null ? 0 : localOrbitExtent * 0.34),
      direction === null ? null : new THREE.Vector3(direction.x,direction.y,direction.z),
    );

    this.updateAnimationLoop();
    this.renderFrame();
    return true;
  }

  focusLaboratorySystem(starId: string, radiusScene: number): boolean {
    this.assertAlive();
    if (!this.currentSnapshot?.stars.some(star => star.id === starId) ||
        !Number.isFinite(radiusScene) || radiusScene <= 0) return false;
    const star = this.animatedBodies.get(starId);
    if (!star) return false;
    this.scene.updateMatrixWorld(true);
    star.getWorldPosition(this.trackedWorldPosition);
    this.trackedBodyId = starId;
    this.viscorbLocalPresentation.release();
    this.cameraController.beginBodyTracking(this.trackedWorldPosition, radiusScene);
    this.updateAnimationLoop();
    this.renderFrame();
    return true;
  }

  stopFollowing():
    void {

    this.assertAlive();

    this.trackedBodyId =
      null;
    this.viscorbLocalPresentation.release();

    this.cameraController.stopBodyTracking();

    this.updateAnimationLoop();
    this.renderFrame();
  }

  resetView():
    void {

    this.assertAlive();
    this.stopFollowing();
    this.cameraController.resetView();
  }

  private addHabitableZone(
    habitableZone:
      SystemSceneHabitableZoneSnapshot,
  ): void {

    const group =
      new THREE.Group();

    group.name =
      'Habitable zone';

    const visualRegime =
      habitableZone.visualRegime ??
      (
        habitableZone.topology ===
          'CIRCUMSTELLAR'
          ? SystemSceneHabitableZoneVisualRegimeV4
              .CIRCUMSTELLAR
          : habitableZone.dynamicallyHabitableInnerRadiusScene ===
                null ||
              habitableZone.dynamicallyHabitableOuterRadiusScene ===
                null
            ? SystemSceneHabitableZoneVisualRegimeV4
                .CIRCUMBINARY_RADIATIVE_ONLY
            : habitableZone.dynamicalOverlapFraction01 >=
                1 -
                  1e-9
              ? SystemSceneHabitableZoneVisualRegimeV4
                  .CIRCUMBINARY_FULLY_STABLE
              : SystemSceneHabitableZoneVisualRegimeV4
                  .CIRCUMBINARY_PARTIALLY_STABLE
      );

    const radiativeOnly =
      visualRegime ===
      SystemSceneHabitableZoneVisualRegimeV4
        .CIRCUMBINARY_RADIATIVE_ONLY;

    const radiativeNotApplicable =
      visualRegime ===
      SystemSceneHabitableZoneVisualRegimeV4
        .CIRCUMBINARY_RADIATIVE_NOT_APPLICABLE;

    const partiallyStable =
      visualRegime ===
      SystemSceneHabitableZoneVisualRegimeV4
        .CIRCUMBINARY_PARTIALLY_STABLE;

    const circumstellar =
      visualRegime ===
      SystemSceneHabitableZoneVisualRegimeV4
        .CIRCUMSTELLAR;

    if (
      !radiativeNotApplicable
    ) {
      const radiativeGeometry =
        new THREE.RingGeometry(
          habitableZone.radiativeInnerRadiusScene,
          habitableZone.radiativeOuterRadiusScene,
          192,
        );

      const radiativeMaterial =
        new THREE.MeshBasicMaterial({
          color:
            radiativeOnly
              ? 0x7c98a2
              : 0x4c9fb2,
          transparent:
            true,
          opacity:
            circumstellar
              ? 0.14
              : radiativeOnly
                ? 0.024
                : partiallyStable
                  ? 0.052
                  : 0.08,
          side:
            THREE.DoubleSide,
          depthWrite:
            false,
          depthTest:
            false,
          blending:
            radiativeOnly
              ? THREE.NormalBlending
              : THREE.AdditiveBlending,
        });

      const radiativeBand =
        new THREE.Mesh(
          radiativeGeometry,
          radiativeMaterial,
        );

      radiativeBand.rotation.x =
        -Math.PI / 2;
      radiativeBand.renderOrder =
        70;

      group.add(
        radiativeBand,
      );

      this.frameDisposables.push(
        radiativeGeometry,
        radiativeMaterial,
      );

      const radiativeBoundaryOpacity =
        circumstellar
          ? 0.58
          : radiativeOnly
            ? 0.34
            : partiallyStable
              ? 0.42
              : 0.48;

      this.addHabitableZoneBoundary(
        group,
        habitableZone.radiativeInnerRadiusScene,
        radiativeOnly
          ? 0x8ca8b1
          : 0x5eb6c8,
        radiativeBoundaryOpacity,
        {
          dashed:
            radiativeOnly,
        },
      );

      this.addHabitableZoneBoundary(
        group,
        habitableZone.radiativeOuterRadiusScene,
        radiativeOnly
          ? 0x8ca8b1
          : 0x5eb6c8,
        radiativeBoundaryOpacity,
        {
          dashed:
            radiativeOnly,
        },
      );

    }

    const dynamicInner =
      habitableZone.dynamicallyHabitableInnerRadiusScene;

    const dynamicOuter =
      habitableZone.dynamicallyHabitableOuterRadiusScene;

    if (
      dynamicInner !==
        null &&
      dynamicOuter !==
        null
    ) {
      const dynamicGeometry =
        new THREE.RingGeometry(
          dynamicInner,
          dynamicOuter,
          192,
        );

      const dynamicMaterial =
        new THREE.MeshBasicMaterial({
          color:
            0x63d79d,
          transparent:
            true,
          opacity:
            0.24,
          side:
            THREE.DoubleSide,
          depthWrite:
            false,
          depthTest:
            false,
          blending:
            THREE.AdditiveBlending,
        });

      const dynamicBand =
        new THREE.Mesh(
          dynamicGeometry,
          dynamicMaterial,
        );

      dynamicBand.rotation.x =
        -Math.PI / 2;
      dynamicBand.position.y =
        0.003;
      dynamicBand.renderOrder =
        72;

      group.add(
        dynamicBand,
      );

      this.frameDisposables.push(
        dynamicGeometry,
        dynamicMaterial,
      );

      this.addHabitableZoneBoundary(
        group,
        dynamicInner,
        0x74e5aa,
        0.88,
      );

      this.addHabitableZoneBoundary(
        group,
        dynamicOuter,
        0x74e5aa,
        0.88,
      );
    }

    if (
      !circumstellar &&
      habitableZone.circumbinaryStabilityInnerRadiusScene !==
        undefined &&
      habitableZone.circumbinaryStabilityInnerRadiusScene !==
        null
    ) {
      this.addHabitableZoneBoundary(
        group,
        habitableZone.circumbinaryStabilityInnerRadiusScene,
        0xe3af64,
        radiativeNotApplicable
          ? 0.78
          : 0.52,
        {
          dashed:
            true,
          dashSize:
            0.075,
          gapSize:
            0.045,
          renderOrder:
            76,
        },
      );

      if (
        habitableZone.circumbinaryStabilityOuterRadiusScene !==
          undefined &&
        habitableZone.circumbinaryStabilityOuterRadiusScene !==
          null
      ) {
        this.addHabitableZoneBoundary(
          group,
          habitableZone.circumbinaryStabilityOuterRadiusScene,
          0xe3af64,
          0.38,
          {
            dashed:
              true,
            dashSize:
              0.06,
            gapSize:
              0.055,
            renderOrder:
              75,
          },
        );
      }
    }

    this.habitableZoneBindings.push({
      group,
      snapshot: habitableZone,
    });

    this.habitableZoneLayerObjects.push(
      group,
    );

    this.presentationRoot.add(
      group,
    );
  }

  private addHabitableZoneBoundary(
    group:
      THREE.Group,

    radiusScene:
      number,

    color:
      number,

    opacity:
      number,

    options?:
      Readonly<{
        dashed?:
          boolean;

        dashSize?:
          number;

        gapSize?:
          number;

        renderOrder?:
          number;
      }>,
  ): void {

    const points =
      Array.from(
        {
          length:
            160,
        },
        (
          _,
          index,
        ) => {
          const angle =
            Math.PI *
            2 *
            index /
            160;

          return new THREE.Vector3(
            Math.cos(angle) *
              radiusScene,
            0.006,
            Math.sin(angle) *
              radiusScene,
          );
        },
      );

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(
          points,
        );

    const material:
      THREE.LineBasicMaterial |
      THREE.LineDashedMaterial =
      options
        ?.dashed ===
        true
        ? new THREE.LineDashedMaterial({
            color,
            transparent:
              true,
            opacity,
            dashSize:
              options.dashSize ??
              0.052,
            gapSize:
              options.gapSize ??
              0.042,
            depthWrite:
              false,
            depthTest:
              false,
            blending:
              THREE.AdditiveBlending,
          })
        : new THREE.LineBasicMaterial({
            color,
            transparent:
              true,
            opacity,
            depthWrite:
              false,
            depthTest:
              false,
            blending:
              THREE.AdditiveBlending,
          });

    const line =
      new THREE.LineLoop(
        geometry,
        material,
      );

    if (
      material instanceof
      THREE.LineDashedMaterial
    ) {
      line.computeLineDistances();
    }

    line.renderOrder =
      options
        ?.renderOrder ??
      74;

    group.add(
      line,
    );

    this.frameDisposables.push(
      geometry,
      material,
    );
  }


  private addAsteroidBeltBand(
    belt:
      SystemSceneAsteroidBeltSnapshot,
  ): void {

    const group =
      new THREE.Group();

    group.name =
      `Asteroid belt ${belt.region}`;

    const bandGeometry =
      new THREE.RingGeometry(
        belt.innerRadiusScene,
        belt.outerRadiusScene,
        256,
      );

    const bandMaterial =
      new THREE.MeshBasicMaterial({
        color:
          belt.colorHex,
        transparent:
          true,
        opacity:
          belt.opacity,
        side:
          THREE.DoubleSide,
        depthWrite:
          false,
        depthTest:
          true,
      });

    const bandMesh =
      new THREE.Mesh(
        bandGeometry,
        bandMaterial,
      );

    bandMesh.rotation.x =
      -Math.PI / 2;
    bandMesh.renderOrder =
      34;

    group.add(
      bandMesh,
    );

    this.frameDisposables.push(
      bandGeometry,
      bandMaterial,
    );

    if (
      belt.peakRadiusScene !==
        null
    ) {
      this.addAsteroidBeltBoundary(
        group,
        belt.peakRadiusScene,
        belt.colorHex,
        belt.peakOpacity,
        0.002,
      );
    }

    this.addAsteroidBeltBoundary(
      group,
      belt.innerRadiusScene,
      belt.colorHex,
      belt.boundaryOpacity,
      0.001,
    );

    this.addAsteroidBeltBoundary(
      group,
      belt.outerRadiusScene,
      belt.colorHex,
      belt.boundaryOpacity,
      0.001,
    );

    this.asteroidLayerObjects.push(
      group,
    );

    this.asteroidBeltLayerBindings.push({
      group,
      snapshot:
        belt,
    });

    this.presentationRoot.add(
      group,
    );
  }

  private addAsteroidBeltBoundary(
    group:
      THREE.Group,

    radiusScene:
      number,

    colorHex:
      string,

    opacity:
      number,

    offsetY:
      number,
  ): void {

    const points: THREE.Vector3[] = [];

    const segmentCount =
      256;

    for (
      let index =
        0;
      index <
        segmentCount;
      index +=
        1
    ) {
      const angle =
        index /
        segmentCount *
        Math.PI *
        2;

      points.push(
        new THREE.Vector3(
          Math.cos(angle) *
            radiusScene,
          offsetY,
          Math.sin(angle) *
            radiusScene,
        ),
      );
    }

    const geometry =
      new THREE.BufferGeometry().setFromPoints(
        points,
      );

    const material =
      new THREE.LineBasicMaterial({
        color:
          colorHex,
        transparent:
          true,
        opacity,
        depthWrite:
          false,
        depthTest:
          true,
      });

    const line =
      new THREE.LineLoop(
        geometry,
        material,
      );

    line.renderOrder =
      36;

    group.add(
      line,
    );

    this.frameDisposables.push(
      geometry,
      material,
    );
  }

  private addOrbitalRiskTarget(
    riskTarget:
      SystemSceneOrbitalRiskTargetSnapshot,

    snapshot:
      SystemSceneSnapshot,
  ): void {

    const sourceOrbit =
      snapshot.orbits.find(
        orbit =>
          orbit.id ===
          riskTarget.targetOrbitId,
      ) ??
      null;

    if (
      sourceOrbit !==
        null
    ) {
      const geometry =
        new THREE.BufferGeometry();

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          new Float32Array(
            ORBIT_SEGMENT_COUNT *
            3,
          ),
          3,
        ),
      );

      const material =
        new THREE.LineBasicMaterial({
          color:
            riskTarget.colorHex,
          transparent:
            true,
          opacity:
            riskTarget.severity === 'COLLISION_GEOMETRY'
              ? 0.78
              : riskTarget.severity === 'APPROACH'
                ? 0.52
                : 0.20,
          depthWrite:
            false,
          depthTest:
            false,
          blending:
            THREE.AdditiveBlending,
        });

      const line =
        new THREE.LineLoop(
          geometry,
          material,
        );

      line.name =
        `Orbital risk ${riskTarget.targetLabel}`;
      line.renderOrder =
        20;

      this.updateOrbitGeometry(
        line,
        sourceOrbit,
        snapshot.scale,
        snapshot.simulation.epochSimulationDay,
      );

      this.orbitalRiskOrbitOverlays.push({
        line,
        orbit:
          sourceOrbit,
      });

      this.orbitalRiskLayerObjects.push(
        line,
      );

      this.frameDisposables.push(
        geometry,
        material,
      );

      this.presentationRoot.add(
        line,
      );
    }

    const targetBody =
      [
        ...snapshot.planets,
        ...snapshot.moons,
      ].find(
        body =>
          body.id ===
          riskTarget.targetBodyId,
      ) ??
      null;

    if (
      targetBody ===
        null
    ) {
      return;
    }

    const markerMaterial =
      new THREE.SpriteMaterial({
        map:
          this.selectionRingTexture,
        color:
          riskTarget.colorHex,
        transparent:
          true,
        opacity:
          riskTarget.severity === 'COLLISION_GEOMETRY'
            ? 0.86
            : riskTarget.severity === 'APPROACH'
              ? 0.64
              : 0.32,
        depthWrite:
          false,
        depthTest:
          false,
        blending:
          THREE.AdditiveBlending,
      });

    const marker =
      new THREE.Sprite(
        markerMaterial,
      );

    const markerScale =
      riskTarget.severity === 'COLLISION_GEOMETRY'
        ? 6.2
        : riskTarget.severity === 'APPROACH'
          ? 5.2
          : 3.8;

    const diameter =
      Math.max(
        targetBody.radiusScene *
          markerScale,
        riskTarget.targetKind ===
          'planet'
          ? riskTarget.severity === 'CROSSING'
            ? 0.22
            : 0.30
          : riskTarget.severity === 'CROSSING'
            ? 0.14
            : 0.18,
      );

    marker.scale.set(
      diameter,
      diameter,
      1,
    );
    marker.position.set(
      targetBody.position.x,
      targetBody.position.y,
      targetBody.position.z,
    );
    marker.renderOrder =
      120;
    marker.name =
      `Risk marker ${riskTarget.targetLabel}`;

    this.orbitalRiskMarkers.push({
      sprite:
        marker,
      targetBodyId:
        riskTarget.targetBodyId,
    });

    this.orbitalRiskLayerObjects.push(
      marker,
    );

    this.frameDisposables.push(
      markerMaterial,
    );

    this.presentationRoot.add(
      marker,
    );
  }

  private addOrbit(
    orbit:
      SystemSceneOrbitSnapshot,

    sceneScale:
      SystemSceneScaleSnapshot,
  ):
    void {

    const motion =
      orbit.motionId ===
        null
        ? null
        : this.motionById.get(
            orbit.motionId,
          ) ??
          null;

    if (
      motion !==
      null
    ) {
      this.orbitLocalSamplesAu.set(
        orbit.id,
        sampleSystemSceneOrbitLocalAu(
          orbit.presentationEccentricity === undefined ? motion :
            { ...motion, eccentricity: orbit.presentationEccentricity },
          orbit.kind,
          ORBIT_SEGMENT_COUNT,
        ),
      );
    }

    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        new Float32Array(
          ORBIT_SEGMENT_COUNT *
          3,
        ),
        3,
      ),
    );

    const material:
      THREE.LineBasicMaterial |
      THREE.LineDashedMaterial =
      orbit.kind ===
        'stellar'
        ? new THREE.LineDashedMaterial({
            color:
              orbit.colorHex,
            transparent:
              true,
            opacity:
              orbit.opacity,
            dashSize:
              0.055,
            gapSize:
              0.035,
          })
        : new THREE.LineBasicMaterial({
            color:
              orbit.colorHex,
            transparent:
              true,
            opacity:
              orbit.opacity,
          });

    this.frameDisposables.push(
      geometry,
      material,
    );

    const line =
      new THREE.LineLoop(
        geometry,
        material,
      );

    line.name =
      `Orbit ${orbit.label}`;

    this.updateOrbitGeometry(
      line,
      orbit,
      sceneScale,
      0,
    );

    this.animatedOrbits.set(
      orbit.id,
      line,
    );

    if (
      orbit.kind ===
      'planetary'
    ) {
      this.planetLayerObjects.push(
        line,
      );
    } else if (
      orbit.kind ===
      'moon'
    ) {
      this.moonLayerObjects.push(
        line,
      );
    } else if (
      orbit.kind ===
      'minor-body'
    ) {
      this.minorBodyOrbitLayerObjectArray(
        orbit.id,
      ).push(
        line,
      );
    }

    this
      .presentationRoot
      .add(
        line,
      );
  }

  private updateOrbitGeometry(
    line:
      THREE.LineLoop,

    orbit:
      SystemSceneOrbitSnapshot,

    sceneScale:
      SystemSceneScaleSnapshot,

    simulationDay:
      number,
  ):
    void {

    const positionAttribute =
      line.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute;

    const localSamplesAu =
      this.orbitLocalSamplesAu.get(
        orbit.id,
      ) ??
      null;

    const projectionSpace =
      orbit.projectionSpace ??
      SystemSceneProjectionSpace.GLOBAL;

    const orbitPostProjectionScale =
      orbit.postProjectionScale ??
      1;

    for (
      let index = 0;
      index <
        ORBIT_SEGMENT_COUNT;
      index += 1
    ) {
      let xScene:
        number;
      let yScene:
        number;
      let zScene:
        number;

      if (
        localSamplesAu !==
        null
      ) {
        const sample =
          localSamplesAu[
            index
          ]!;

        const linearScenePerAu =
          orbit.linearScenePerAu ??
          null;

        if (
          linearScenePerAu !==
            null &&
          Number.isFinite(
            linearScenePerAu,
          ) &&
          linearScenePerAu >
            0
        ) {
          xScene =
            sample.x *
            orbit.motionScale *
            linearScenePerAu *
            orbitPostProjectionScale;
          yScene =
            sample.y *
            orbit.motionScale *
            linearScenePerAu *
            orbitPostProjectionScale;
          zScene =
            sample.z *
            orbit.motionScale *
            linearScenePerAu *
            orbitPostProjectionScale;
        } else {
          const rawSample =
            projectionSpace ===
              SystemSceneProjectionSpace.GLOBAL
              ? {
                  x:
                    sample.x *
                    orbit.motionScale,
                  y:
                    sample.y *
                    orbit.motionScale,
                  z:
                    sample.z *
                    orbit.motionScale,
                }
              : {
                  x:
                    sample.x,
                  y:
                    sample.y,
                  z:
                    sample.z,
                };

          const projected =
            systemSceneProjectAuVectorInSpace(
              rawSample,
              sceneScale,
              projectionSpace,
            );

          const physicalScaleAfterProjection =
            projectionSpace ===
              SystemSceneProjectionSpace.GLOBAL
              ? 1
              : orbit.motionScale;

          const postProjectionScale =
            physicalScaleAfterProjection *
            orbitPostProjectionScale;

          xScene =
            projected.x *
            postProjectionScale;
          yScene =
            projected.y *
            postProjectionScale;
          zScene =
            projected.z *
            postProjectionScale;
        }
      } else {
        const phase =
          (index /
            ORBIT_SEGMENT_COUNT) *
          Math.PI *
          2;

        const localX =
          orbit.semiMajorScene *
            Math.cos(
              phase,
            ) -
          orbit.focusOffsetScene;

        const localZ =
          orbit.semiMinorScene *
          Math.sin(
            phase,
          );

        const position =
          rotateOrbitPoint(
            localX,
            localZ,
            orbit.rotationDegrees,
            orbit.inclinationDegrees,
          );

        xScene =
          position.x;
        yScene =
          position.y;
        zScene =
          position.z;
      }

      positionAttribute.setXYZ(
        index,
        xScene,
        yScene,
        zScene,
      );
    }

    positionAttribute.needsUpdate =
      true;
    line.geometry.computeBoundingSphere();

    if (
      line.material instanceof
      THREE.LineDashedMaterial
    ) {
      line.computeLineDistances();
    }

    const anchorPosition =
      this.positionFromContributions(
        orbit.anchorMotionContributions,
        simulationDay,
        sceneScale,
      );

    line.position.set(
      anchorPosition.x,
      anchorPosition.y,
      anchorPosition.z,
    );
  }

  private addStar(
    star:
      SystemSceneBodySnapshot,
  ):
    void {

    const group =
      new THREE.Group();

    group.name =
      `Star ${star.label}`;
    group.position.set(
      star.position.x,
      star.position.y,
      star.position.z,
    );

    // 31.4c: the host is NOT a luminous conventional star. Reuse the EXACT
    // validated laboratory Three.js graph and keep the system's one renderer.
    if (star.compactHostKind !== undefined) {
      const graph = createCompactHostLaboratoryVisual(
        star.compactHostKind,
        this.currentSnapshot?.proceduralIdentity ?? star.id,
        star.radiusScene,
        star.compactHostAccretionLuminositySolar ?? null,
      );
      group.add(graph.root);
      this.compactVisualBindings.set(star.id, graph);
      if (star.compactHostKind === ExtremeType.STELLAR_MASS_BLACK_HOLE) {
        this.compactBlackHoleBillboards.push(graph.root);
      }
      this.frameDisposables.push(graph);
      const referenceVisualFlux = Math.max(
        star.compactHostPresentationFlux ?? 0,
        star.compactHostInspectionLightFlux ?? 0,
      );
      if (referenceVisualFlux > 0) {
        // A presentation light only: scene-space compression of a *conditional*
        // radiation scenario, never a physical or optical luminosity claim.
        const visualLight = new THREE.PointLight(
          star.compactHostKind === ExtremeType.STELLAR_MASS_BLACK_HOLE ? 0xffd6ab : 0xbadfff,
          12 * referenceVisualFlux, 0, 1.35,
        );
        visualLight.name = `${star.label} conditional presentation irradiance`;
        group.add(visualLight);
      }
      this.animatedBodies.set(star.id, group);
      this.registerSelectableBody(star, group);
      this.presentationRoot.add(group);
      return;
    }

    const initialLod:
      SystemSceneBodyLodLevelV1 =
      'MEDIUM';

    const sphereGeometry =
      this.sphereGeometryPool.get(
        'star',
        initialLod,
      );

    const sphereMaterial =
      new THREE.MeshBasicMaterial({
        color:
          star.colorHex,
        toneMapped:
          false,
      });

    const photosphere =
      new THREE.Mesh(
        sphereGeometry,
        sphereMaterial,
      );

    photosphere.scale.setScalar(
      star.radiusScene,
    );
    photosphere.name =
      `${star.label} photosphere`;

    this.bodyLodBindings.set(
      star.id,
      {
        mesh: photosphere,
        kind: 'star',
        radiusScene: star.radiusScene,
        level: initialLod,
      },
    );

    const optics =
      stellarOpticalProfile(
        star,
      );

    const opticalRadiusScene =
      star.opticalRadiusScene ??
      star.radiusScene;

    const coronaMaterial =
      stellarSpriteMaterial(
        this.starHaloTexture,
        star.colorHex,
        optics.coronaOpacity,
      );

    const corona =
      new THREE.Sprite(
        coronaMaterial,
      );

    const coronaDiameter =
      opticalRadiusScene *
      optics.coronaDiameterScale;

    corona.scale.set(
      coronaDiameter,
      coronaDiameter,
      1,
    );
    corona.name =
      `${star.label} corona`;

    const bloomMaterial =
      stellarSpriteMaterial(
        this.starBloomTexture,
        star.colorHex,
        optics.bloomOpacity,
      );

    const bloom =
      new THREE.Sprite(
        bloomMaterial,
      );

    const bloomDiameter =
      opticalRadiusScene *
      optics.bloomDiameterScale;

    bloom.scale.set(
      bloomDiameter,
      bloomDiameter,
      1,
    );
    bloom.name =
      `${star.label} bloom`;

    const aureoleMaterial =
      stellarSpriteMaterial(
        this.starBloomTexture,
        star.colorHex,
        optics.aureoleOpacity,
      );

    const aureole =
      new THREE.Sprite(
        aureoleMaterial,
      );

    const aureoleDiameter =
      opticalRadiusScene *
      optics.aureoleDiameterScale;

    aureole.scale.set(
      aureoleDiameter,
      aureoleDiameter,
      1,
    );
    aureole.name =
      `${star.label} aureole`;

    const glareMaterial =
      stellarSpriteMaterial(
        this.starGlareTexture,
        stellarDiffractionColor(
          star.colorHex,
          optics.energy01,
        ),
        optics.glareOpacity,
      );

    const glare =
      new THREE.Sprite(
        glareMaterial,
      );

    glare.scale.set(
      opticalRadiusScene *
        optics.glareDiameterScale,
      opticalRadiusScene *
        optics.glareDiameterScale,
      1,
    );
    glare.name =
      `${star.label} diffraction glare`;

    const light =
      new THREE.PointLight(
        star.colorHex,
        star.lightIntensity,
        0,
        1.45,
      );

    light.name =
      `${star.label} illumination`;

    group.add(
      corona,
      glare,
      bloom,
      aureole,
      photosphere,
      light,
    );

    this.frameDisposables.push(
      sphereMaterial,
      coronaMaterial,
      bloomMaterial,
      aureoleMaterial,
      glareMaterial,
    );

    this.animatedBodies.set(
      star.id,
      group,
    );

    this.registerSelectableBody(
      star,
      group,
    );

    this
      .presentationRoot
      .add(
        group,
      );
  }

  private addPlanet(
    planet:
      SystemSceneBodySnapshot,

    systemIdentity:
      string,
  ):
    void {

    const group =
      new THREE.Group();

    group.name =
      `Planet ${planet.label}`;
    group.position.set(
      planet.position.x,
      planet.position.y,
      planet.position.z,
    );

    const initialLod:
      SystemSceneBodyLodLevelV1 =
      'MEDIUM';

    const sphereGeometry =
      this.sphereGeometryPool.get(
        'planet',
        initialLod,
      );

    const appearance =
      createSystemScenePlanetAppearanceV1(
        planet,
        systemIdentity,
        this.planetTextureCache,
        null,
        planet.compactPlanetPresentationFill01 ??
          (this.currentSnapshot?.stars.some(star => star.compactHostKind !== undefined) ? 0.08 : false),
        this.currentSnapshot === null
          ? null
          : resolveSystemSceneAtmospherePhotosphereKelvinV4(this.currentSnapshot.stars),
      );

    this.bodyLightBindings.set(
      planet.id,
      appearance.lightBinding,
    );

    const axialPivot =
      new THREE.Group();
    axialPivot.name =
      `${planet.label} axial tilt`;
    axialPivot.rotation.z =
      systemSceneBodyAxialTiltRadians(
        planet.spin,
      );

    const spinPivot =
      new THREE.Group();
    spinPivot.name =
      `${planet.label} domain spin`;

    const sphere =
      new THREE.Mesh(
        sphereGeometry,
        appearance.material,
      );
    sphere.scale.setScalar(
      planet.radiusScene,
    );

    this.bodyLodBindings.set(
      planet.id,
      {
        mesh: sphere,
        kind: 'planet',
        radiusScene: planet.radiusScene,
        level: initialLod,
        planetSystemIdentity: systemIdentity,
      },
    );

    spinPivot.add(
      sphere,
    );
    if (planet.visualInfrastructurePlans?.length && planet.surfaceStyle !== 'gaseous') {
      const infra = createVida38InfrastructureSurfaceVisual386(planet.visualInfrastructurePlans,planet.radiusScene,appearance.nightLightsTexture,null,true,planet.physicalRadiusEarthCOLVIS1??null,{
        temperatureKelvin:planet.surfaceEnvironment?.meanSurfaceTemperatureKelvin??null,
        pressurePascal:planet.surfaceEnvironment?.retainedSurfacePressurePascal??null,
        iceCoverage01:planet.surfaceEnvironment?.surfaceIceCoverageFraction01??null},false,false);
      this.installColonialNaturalShading386c3(infra,appearance.lightBinding);
      spinPivot.add(infra.group);
      this.addColonySiteMarkersT7t(spinPivot,infra,planet.radiusScene,'planet');
      if(systemSceneHasConfirmedColonyT7n(planet.visualInfrastructurePlans))
        this.addColonyBodyMarkerT7n(spinPivot,planet.radiusScene,'planet');
      this.frameDisposables.push(...infra.resources);
      this.infrastructureVisualBindings386.push({bodyId:planet.id,radius:planet.radiusScene,visual:infra});
    }

    if (planet.giantAtmosphere !== null) {
      const shellBindings = appearance.overlays.filter(
        (overlay): overlay is THREE.Mesh<THREE.SphereGeometry> =>
          overlay instanceof THREE.Mesh && overlay.geometry instanceof THREE.SphereGeometry,
      ).map(mesh => ({
        mesh,
        originalGeometry: mesh.geometry,
        originalScale: mesh.scale.clone(),
        radius: mesh.geometry.parameters.radius,
      }));
      this.giantAtmosphereShellsVISCATM1c.set(planet.id, shellBindings);
    }

    for (
      const overlay
      of appearance.overlays
    ) {
      spinPivot.add(
        overlay,
      );
    }

    const specialPresentation =
      planet.specialPresentation;

    if (
      specialPresentation !==
        null &&
      specialPresentation.oblateness
        .presentationAdjusted
    ) {
      spinPivot.scale.set(
        specialPresentation.oblateness
          .presentationEquatorialScale,
        specialPresentation.oblateness
          .presentationPolarScale,
        specialPresentation.oblateness
          .presentationEquatorialScale,
      );
    }

    axialPivot.add(
      spinPivot,
    );

    const ringRenderable =
      specialPresentation ===
        null ||
      specialPresentation.rings ===
        null
        ? null
        : createSystemSceneRingRenderableV1(
            planet.radiusScene,
            specialPresentation.rings,
          );

    if (
      ringRenderable !==
        null
    ) {
      if ((this.currentSnapshot?.generatorVersionCode === 2 || this.currentSnapshot?.generatorVersionCode === 3)) {
        installV2BodyLightingOnSurfaces(ringRenderable.group, appearance.lightBinding);
      }
      axialPivot.add(
        ringRenderable.group,
      );
    }

    const artificialSatellites = this.createArtificialSatelliteVisuals(
      planet,
      systemIdentity,
    );

    if (
      artificialSatellites !==
        null
    ) {
      axialPivot.add(
        artificialSatellites.group,
      );
      this.artificialSatelliteLayerObjects.push(
        artificialSatellites.group,
      );
      this.artificialSatelliteBindings.push(
        ...artificialSatellites.bindings,
      );
      this.frameDisposables.push(
        ...artificialSatellites.resources,
      );
    }

    if (artificialSatellites !== null && artificialSatellites.ringShadowRingsVISCIV6n.length > 0) {
      this.orbitalSurfaceShadowBindingsVISCIV6n.push(
        installOrbitalSurfaceShadowVISCIV6n(
          appearance.material, sphere,
          artificialSatellites.ringShadowRingsVISCIV6n, planet.radiusScene,
        ),
      );
    }

    group.add(
      axialPivot,
    );

    // The lab BH has intentionally depth-independent layers; all orbital
    // surfaces need consistent front/back compositing, not only planets.
    this.registerCompactBlackHoleBodyOcclusion(group);

    this.spinningBodies.set(
      planet.id,
      spinPivot,
    );

    this.frameDisposables.push(
      appearance.material,
      ...appearance.resources,
      ...(
        ringRenderable?.resources ??
        []
      ),
    );

    this.animatedBodies.set(
      planet.id,
      group,
    );

    this.registerSelectableBody(
      planet,
      group,
    );

    this.planetLayerObjects.push(
      group,
    );

    this
      .presentationRoot
      .add(
        group,
      );
  }

  private createArtificialSatelliteVisuals(
    planet:
      SystemSceneBodySnapshot,
    systemIdentity:
      string,
  ):
    {
      readonly group: THREE.Group;
      readonly bindings: readonly {
        readonly hostBodyId: string;
        readonly orbitPivot: THREE.Group;
        readonly basePhaseRadians: number;
        readonly angularSpeedRadiansPerDay: number;
        readonly materials: readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
        readonly orbitMaterial: THREE.LineBasicMaterial | null;
        readonly baseLineOpacity01: number;
        readonly ringVisualVISCIV6g?: SystemSceneOrbitalRingVisualV1;
      }[];
      readonly resources: readonly { dispose(): void }[];
      readonly ringShadowRingsVISCIV6n: readonly OrbitalSurfaceShadowRingVISCIV6n[];
    } | null {

    const tier =
      planet.visualCivilizationTier ??
      null;

    if (
      !supportsSystemSceneArtificialSatellitesV1(
        tier,
      )
    ) {
      return null;
    }

    const seed = systemScenePlanetSurfaceTextureSeedV1(
      systemIdentity,
      planet.id,
    );

    // VISCIV.6e restores the visual station/ring branches deleted in 38.6.
    // They are procedural *visuals*, not catalogued observational evidence.
    const manifest = buildSystemSceneOrbitalInfrastructureManifestVISCIV6e(
      seed, tier, planet.radiusScene,
    );
    const plans = manifest.satellites;
    const stationPlans = manifest.stations;
    const ringPlans = manifest.rings;

    if (
      plans.length ===
        0 &&
      stationPlans.length ===
        0 &&
      ringPlans.length ===
        0
    ) {
      return null;
    }

    const group =
      new THREE.Group();
    group.name =
      `${planet.label} orbital infrastructure`;

    const bindings: Array<{
      readonly hostBodyId: string;
      readonly orbitPivot: THREE.Group;
      readonly basePhaseRadians: number;
      readonly angularSpeedRadiansPerDay: number;
      readonly materials: readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
      readonly orbitMaterial: THREE.LineBasicMaterial | null;
      readonly baseLineOpacity01: number;
      readonly ringVisualVISCIV6g?: SystemSceneOrbitalRingVisualV1;
    }> = [];
    const resources: Array<{ dispose(): void }> = [];
    const ringShadowRingsVISCIV6n: OrbitalSurfaceShadowRingVISCIV6n[] = [];

    const appendOrbitalAsset = (
      orbitRadiusPlanetRadii: number,
      inclinationRadians: number,
      ascendingNodeRadians: number,
      phaseRadians: number,
      angularSpeedRadiansPerDay: number,
      orbitColorHex: string,
      orbitOpacity01: number,
      assetVisual: Readonly<{
        group: THREE.Group;
        materials: readonly SystemSceneArtificialSatelliteMaterialBindingV1[];
        resources: readonly { dispose(): void }[];
      }>,
    ): void => {
      const orbitPlane =
        new THREE.Group();
      orbitPlane.rotation.z =
        ascendingNodeRadians;
      orbitPlane.rotation.x =
        inclinationRadians;

      const orbitPivot =
        new THREE.Group();
      orbitPivot.rotation.y =
        phaseRadians;

      const orbitRadiusScene =
        planet.radiusScene * orbitRadiusPlanetRadii;

      const orbitGeometry =
        new THREE.BufferGeometry();
      const orbitVertices =
        new Float32Array(
          ORBIT_SEGMENT_COUNT *
          3,
        );

      for (
        let i = 0;
        i < ORBIT_SEGMENT_COUNT;
        i += 1
      ) {
        const angle =
          (i / ORBIT_SEGMENT_COUNT) *
          Math.PI * 2;
        orbitVertices[i * 3] =
          Math.cos(angle) * orbitRadiusScene;
        orbitVertices[i * 3 + 1] =
          0;
        orbitVertices[i * 3 + 2] =
          Math.sin(angle) * orbitRadiusScene;
      }

      orbitGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(
          orbitVertices,
          3,
        ),
      );

      const orbitMaterial =
        new THREE.LineBasicMaterial({
          color: orbitColorHex,
          transparent: true,
          opacity: orbitOpacity01,
          depthWrite: false,
          toneMapped: false,
        });
      const orbitLine =
        new THREE.LineLoop(
          orbitGeometry,
          orbitMaterial,
        );
      this.artificialSatelliteOrbitGuides.push(orbitLine);

      assetVisual.group.position.set(
        orbitRadiusScene,
        0,
        0,
      );

      orbitPivot.add(
        assetVisual.group,
      );
      orbitPlane.add(
        orbitLine,
      );
      orbitPlane.add(
        orbitPivot,
      );
      group.add(
        orbitPlane,
      );

      resources.push(
        orbitMaterial,
        ...assetVisual.resources,
      );
      bindings.push(
        Object.freeze({
          hostBodyId: planet.id,
          orbitPivot,
          basePhaseRadians: phaseRadians,
          angularSpeedRadiansPerDay,
          materials: assetVisual.materials,
          orbitMaterial,
          baseLineOpacity01: orbitOpacity01,
        }),
      );
      this.frameDisposables.push(
        orbitGeometry,
      );
    };

    let assetIndex = 0;

    for (
      const plan
      of plans
    ) {
      const satelliteVisual =
        createSystemSceneArtificialSatelliteVisualV1(
          plan,
          seed + assetIndex * 131,
        );
      appendOrbitalAsset(
        plan.orbitRadiusPlanetRadii,
        plan.inclinationRadians,
        plan.ascendingNodeRadians,
        plan.phaseRadians,
        plan.angularSpeedRadiansPerDay,
        plan.lineColorHex,
        plan.lineOpacity01,
        satelliteVisual,
      );
      assetIndex += 1;
    }

    for (
      const plan
      of stationPlans
    ) {
      const stationVisual =
        createSystemSceneOrbitalStationVisualV1(
          plan,
          seed + 10000 + assetIndex * 173,
        );
      appendOrbitalAsset(
        plan.orbitRadiusPlanetRadii,
        plan.inclinationRadians,
        plan.ascendingNodeRadians,
        plan.phaseRadians,
        plan.angularSpeedRadiansPerDay,
        plan.lineColorHex,
        plan.lineOpacity01,
        stationVisual,
      );
      assetIndex += 1;
    }

    for (const plan of ringPlans) {
      const ringVisual = createSystemSceneOrbitalRingVisualV1(
        plan,
        planet.radiusScene,
      );
      ringVisual.rotationPivot.rotation.y = plan.phaseRadians;
      group.add(ringVisual.group);
      ringShadowRingsVISCIV6n.push({
        root: ringVisual.group, rotor: ringVisual.rotationPivot, plan,
      });
      resources.push(...ringVisual.resources);
      bindings.push(Object.freeze({
        hostBodyId: planet.id,
        orbitPivot: ringVisual.rotationPivot,
        basePhaseRadians: plan.phaseRadians,
        angularSpeedRadiansPerDay: plan.angularSpeedRadiansPerDay,
        materials: ringVisual.materials,
        orbitMaterial: null,
        baseLineOpacity01: 0,
        ringVisualVISCIV6g: ringVisual,
      }));
    }

    return Object.freeze({
      group,
      bindings: Object.freeze(bindings),
      resources: Object.freeze(resources),
      ringShadowRingsVISCIV6n: Object.freeze(ringShadowRingsVISCIV6n),
    });
  }

  private addMoon(
    moon:
      SystemSceneMoonSnapshot,
  ):
    void {

    const group =
      new THREE.Group();

    group.name =
      `Moon ${moon.title}`;
    group.position.set(
      moon.position.x,
      moon.position.y,
      moon.position.z,
    );

    const axialPivot =
      new THREE.Group();
    axialPivot.name =
      `${moon.title} axial frame`;
    axialPivot.rotation.z =
      systemSceneBodyAxialTiltRadians(
        moon.spin,
      );

    const spinPivot =
      new THREE.Group();
    spinPivot.name =
      `${moon.title} domain spin`;

    if ((this.currentSnapshot?.generatorVersionCode === 2 || this.currentSnapshot?.generatorVersionCode === 3)) {
      this.bodyLightBindings.set(moon.id, createV2BodyLightBinding());
    }

    if (
      this.layerVisibility.moons
    ) {
      this.materializeMoonVisual(
        moon,
        spinPivot,
      );
    } else {
      this.pendingMoonVisuals.set(
        moon.id,
        {
          moon,
          spinPivot,
        },
      );
    }

    axialPivot.add(
      spinPivot,
    );
    group.add(
      axialPivot,
    );

    // Visible moons already have their meshes. Hidden moons are prepared when
    // their geometry is materialized (never bind an empty deferred group).
    if (!this.pendingMoonVisuals.has(moon.id)) {
      this.registerCompactBlackHoleBodyOcclusion(group);
    }

    this.spinningBodies.set(
      moon.id,
      spinPivot,
    );

    this.animatedBodies.set(
      moon.id,
      group,
    );

    this.registerSelectableBody(
      moon,
      group,
    );

    this.moonLayerObjects.push(
      group,
    );

    this.presentationRoot.add(
      group,
    );
  }

  private materializePendingMoonVisuals(): void {
    for (
      const pending
      of [...this.pendingMoonVisuals.values()]
    ) {
      this.materializeMoonVisual(
        pending.moon,
        pending.spinPivot,
      );
    }
  }

  private materializeMoonVisual(
    moon:
      SystemSceneMoonSnapshot,

    spinPivot:
      THREE.Group,
  ): void {

    if (
      !this.pendingMoonVisuals.has(
        moon.id,
      ) &&
      spinPivot.children.length >
        0
    ) {
      return;
    }

    const moonInitialLod:
      SystemSceneBodyLodLevelV1 =
      'MEDIUM';
    const sharedMoonGeometry =
      moon.visualPresentation.shapeClass ===
        'MINOR_IRREGULAR'
        ? null
        : this.sphereGeometryPool.get(
            'moon',
            moonInitialLod,
          );

    const renderable =
      createSystemSceneMoonRenderableV1(
        moon.visualPresentation,
        this.moonTextureCache,
        sharedMoonGeometry,
      );

    const moonLight = this.bodyLightBindings.get(moon.id);
    if (moonLight !== undefined) {
      installV2BodyLightingOnSurfaces(
        renderable.root,
        moonLight,
        v2SmallBodyDayNightProfile(
          moon.visualPresentation.presentationAtmospherePresent,
          moon.visualPresentation.presentationAtmosphereColorHex,
        ),
      );
      installV2MoonAtmosphereLighting(renderable.root, moonLight);
    }

    spinPivot.add(
      renderable.root,
    );
    this.lunarSurfaceFocusSourcesLUNSURF1.set(moon.id, {
      mesh: renderable.surfaceMesh,
      presentation: moon.visualPresentation,
    });
    // 38.6c2: do not discard a verified colony because its destination moon
    // has irregular presentation geometry. Align to the real rendered mesh.
    const moonInfrastructure = vida38MoonVisibleInfrastructurePlans386c2(
      moon.visualInfrastructurePlans,moon.visualPresentation.shapeClass==='MINOR_IRREGULAR');
    if (moonInfrastructure.length) {
      const radius = moon.visualPresentation.presentationRadiusScene;
      const irregularSurface = moon.visualPresentation.shapeClass === 'MINOR_IRREGULAR'
        ? {geometry:renderable.surfaceMesh.geometry,geometryScale:1,
           radiusEarth:moon.visualPresentation.sourceRadiusEarth}
        : null;
      const infra = createVida38InfrastructureSurfaceVisual386(moonInfrastructure,radius,null,irregularSurface,true,moon.visualPresentation.sourceRadiusEarth,{
        temperatureKelvin:moon.visualPresentation.sourceEstimatedSurfaceTemperatureKelvin,
        pressurePascal:null,iceCoverage01:moon.visualPresentation.presentationIceCoverage01},false,false);
      if (moonLight) this.installColonialNaturalShading386c3(infra,moonLight);
      spinPivot.add(infra.group);
      this.addColonySiteMarkersT7t(spinPivot,infra,radius,'moon');
      if(systemSceneHasConfirmedColonyT7n(moonInfrastructure))
        this.addColonyBodyMarkerT7n(spinPivot,radius,'moon');
      this.frameDisposables.push(...infra.resources);
      this.infrastructureVisualBindings386.push({bodyId:moon.id,radius,visual:infra});
    }
    this.frameDisposables.push(
      ...renderable.resources,
    );

    if (
      renderable.surfaceUsesSharedUnitGeometry
    ) {
      this.bodyLodBindings.set(
        moon.id,
        {
          mesh: renderable.surfaceMesh,
          kind: 'moon',
          radiusScene:
            moon.visualPresentation
              .presentationRadiusScene,
          level: moonInitialLod,
        },
      );
    }

    this.pendingMoonVisuals.delete(
      moon.id,
    );

    // On initial construction the parent hierarchy does not exist yet; addMoon
    // registers afterwards. On deferred reveal the hierarchy already exists.
    const moonGroup = spinPivot.parent?.parent;
    if (moonGroup instanceof THREE.Group) {
      this.registerCompactBlackHoleBodyOcclusion(moonGroup);
    }
  }

  private initializeMinorBodyInstanceBatches(
    bodies:
      readonly SystemSceneMinorBodySnapshot[],
  ): void {
    // V2 requires a separate multistellar terminator for every object.
    // V1 retains captured-body instancing; TNO-R1 uses individual procedural surfaces.
    if ((this.currentSnapshot?.generatorVersionCode === 2 || this.currentSnapshot?.generatorVersionCode === 3)) return;

    for (
      const layerKey
      of ['capturedObjects'] as const
    ) {
      const candidates =
        bodies.filter(
          body =>
            minorBodyLayerKeyForKind(
              body.minorBodyKind,
            ) ===
              layerKey,
        );

      if (
        candidates.length ===
          0
      ) {
        continue;
      }

      const geometry =
        new THREE.IcosahedronGeometry(
          1,
          1,
        );
      const material =
        new THREE.MeshStandardMaterial({
          color:
            candidates[0]!.colorHex,
          roughness:
            0.92,
          metalness:
            0.02,
        });
      const mesh =
        new THREE.InstancedMesh(
          geometry,
          material,
          candidates.length,
        );

      mesh.name =
        `GENESIS ${layerKey} instanced batch 25.11`;
      mesh.count =
        0;
      mesh.frustumCulled =
        false;
      mesh.instanceMatrix.setUsage(
        THREE.DynamicDrawUsage,
      );

      const batch:
        SystemSceneMinorBodyInstanceBatchV1 =
        {
          mesh,
          groups: [],
          radiiScene: [],
        };

      this.minorBodyInstanceBatches.set(
        layerKey,
        batch,
      );
      this.minorBodyLayerObjectArrayForKey(
        layerKey,
      ).push(
        mesh,
      );
      this.presentationRoot.add(
        mesh,
      );
      this.frameDisposables.push(
        geometry,
        material,
      );
    }
  }

  private updateMinorBodyInstanceBatches(): void {
    for (
      const batch
      of this.minorBodyInstanceBatches.values()
    ) {
      for (
        let index =
          0;
        index <
          batch.groups.length;
        index +=
          1
      ) {
        const group =
          batch.groups[index]!;
        const radius =
          batch.radiiScene[index]!;

        this.minorBodyInstanceScale.set(
          radius,
          radius,
          radius,
        );
        this.minorBodyInstanceMatrix.compose(
          group.position,
          this.minorBodyInstanceQuaternion,
          this.minorBodyInstanceScale,
        );
        batch.mesh.setMatrixAt(
          index,
          this.minorBodyInstanceMatrix,
        );
      }

      batch.mesh.count =
        batch.groups.length;
      batch.mesh.instanceMatrix.needsUpdate =
        true;
    }
  }

  private addMinorBody(
    body:
      SystemSceneMinorBodySnapshot,
  ):
    void {

    const group =
      new THREE.Group();

    group.name =
      `Minor body ${body.title}`;
    group.position.set(
      body.position.x,
      body.position.y,
      body.position.z,
    );

    const minorLight = (this.currentSnapshot?.generatorVersionCode === 2 || this.currentSnapshot?.generatorVersionCode === 3)
      ? createV2BodyLightBinding()
      : null;

    if (
      body.minorBodyKind.name ===
        'ASTEROID' &&
      body.asteroidPresentation !==
        null
    ) {
      const asteroidRenderable =
        createSystemSceneAsteroidRenderableV1(
          body.radiusScene,
          body.asteroidPresentation,
        );

      group.add(
        asteroidRenderable.object,
      );
      this.frameDisposables.push(
        ...asteroidRenderable.resources,
      );
    } else if (
      body.minorBodyKind.name ===
        'COMET' &&
      body.cometPresentation !==
        null
    ) {
      const cometRenderable =
        createSystemSceneCometRenderableV1(
          body.radiusScene,
          body.cometPresentation,
        );

      group.add(
        cometRenderable.object,
      );
      this.cometActivityBindings.set(
        body.id,
        cometRenderable.binding,
      );
      this.frameDisposables.push(
        ...cometRenderable.resources,
      );
    } else if (body.minorBodyKind.name === 'TRANS_NEPTUNIAN_OBJECT' && body.tnoPresentation != null) {
      const renderable = createSystemSceneTnoRenderableV1(body.radiusScene, body.tnoPresentation);
      group.add(renderable.object);
      this.frameDisposables.push(...renderable.resources);
    } else if (body.minorBodyKind.name === 'CAPTURED_EXTRASOLAR_OBJECT' && body.capturedPresentation != null) {
      const renderable = createSystemSceneCapturedRenderableV1(body.radiusScene, body.capturedPresentation);
      group.add(renderable.object);
      this.frameDisposables.push(...renderable.resources);
    } else {
      const layerKey =
        minorBodyLayerKeyForKind(
          body.minorBodyKind,
        );
      const batch =
        this.minorBodyInstanceBatches.get(
          layerKey,
        );

      if (
        batch !==
          undefined
      ) {
        batch.groups.push(
          group,
        );
        batch.radiiScene.push(
          body.radiusScene,
        );
        batch.mesh.count =
          batch.groups.length;
      } else {
        const geometry =
          new THREE.IcosahedronGeometry(
            body.radiusScene,
            1,
          );

        const material =
          new THREE.MeshStandardMaterial({
            color:
              body.colorHex,
            roughness:
              0.92,
            metalness:
              0.02,
          });

        group.add(
          new THREE.Mesh(
            geometry,
            material,
          ),
        );

        this.frameDisposables.push(
          geometry,
          material,
        );
      }
    }

    const atlasSource387x = systemSceneMinorBodyAtlasSource387x(body);
    if (atlasSource387x !== null) {
      const surfaces: THREE.Mesh[] = [];
      group.traverse(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          surfaces.push(child);
        }
      });
      if (surfaces.length > 0) {
        this.minorBodyAtlasSources387x.set(body.id, {
          group, radiusScene: body.radiusScene, body, surfaces,
          kind: atlasSource387x.kind, seedUint32: atlasSource387x.seedUint32,
        });
      }
    }

    if (minorLight !== null) {
      this.bodyLightBindings.set(body.id, minorLight);
      installV2BodyLightingOnSurfaces(group, minorLight);
    }

    // Includes asteroid lobes, comet nucleus/coma/tails, TNO and captured
    // object meshes. Physics and selection objects remain untouched.
    this.registerCompactBlackHoleBodyOcclusion(group);

    this.animatedBodies.set(
      body.id,
      group,
    );

    this.registerSelectableBody(
      body,
      group,
    );

    this.minorBodyLayerObjectArray(
      body.minorBodyKind,
    ).push(
      group,
    );

    this.presentationRoot.add(
      group,
    );
  }

  /** 31.4i.1 — Bind only materialized meshes in BH host scenes. */
  private registerCompactBlackHoleBodyOcclusion(group: THREE.Group): void {
    if (this.compactBlackHoleBillboards.length === 0) return;
    const binding = prepareCompactBlackHoleBodyOcclusion(group);
    if (binding.drawables.length > 0) {
      this.compactBlackHoleBodyOcclusion.push(binding);
    }
  }

  private registerSelectableBody(
    body:
      SystemSceneSelectableBodySnapshot,

    group:
      THREE.Group,
  ):
    void {

    const pickRadius =
      systemScenePickingRadiusScene(
        body.kind,
        systemSceneVisualExtentRadiusScene(
          body,
        ),
      );

    this.bodySnapshotById.set(
      body.id,
      body,
    );

    const proxyBatch =
      this.selectionProxyBatch;

    if (
      proxyBatch ===
        null
    ) {
      return;
    }

    this.selectionProxyBodyIds.push(
      body.id,
    );
    this.selectionProxyGroups.push(
      group,
    );
    this.selectionProxyRadii.push(
      pickRadius,
    );
    proxyBatch.count =
      this.selectionProxyBodyIds.length;
  }

  private initializeSelectionProxyBatch(
    capacity:
      number,
  ): void {

    if (
      capacity <=
        0
    ) {
      return;
    }

    const material =
      new THREE.MeshBasicMaterial({
        transparent:
          true,
        opacity:
          0,
        depthWrite:
          false,
        colorWrite:
          false,
      });

    const mesh =
      new THREE.InstancedMesh(
        this.sphereGeometryPool.get(
          'moon',
          'LOW',
        ),
        material,
        capacity,
      );

    mesh.name =
      'GENESIS selection proxy batch 25.11';
    mesh.count =
      0;
    mesh.frustumCulled =
      false;
    mesh.instanceMatrix.setUsage(
      THREE.DynamicDrawUsage,
    );

    this.selectionProxyBatch =
      mesh;
    this.selectableObjects.push(
      mesh,
    );
    this.presentationRoot.add(
      mesh,
    );
    this.frameDisposables.push(
      material,
    );
  }

  private updateSelectionProxyBatch(): void {
    const mesh =
      this.selectionProxyBatch;

    if (
      mesh ===
        null
    ) {
      return;
    }

    for (
      let index =
        0;
      index <
        this.selectionProxyBodyIds.length;
      index +=
        1
    ) {
      const group =
        this.selectionProxyGroups[index]!;
      const visible =
        objectHierarchyVisible(
          group,
        );
      const radius =
        visible
          ? this.selectionProxyRadii[index]! * group.scale.x
          : 1e-6;

      if (visible) {
        this.selectionProxyPosition.copy(
          group.position,
        );
      } else {
        this.selectionProxyPosition.set(
          1_000_000,
          1_000_000,
          1_000_000,
        );
      }

      this.selectionProxyScale.set(
        radius,
        radius,
        radius,
      );
      this.selectionProxyMatrix.compose(
        this.selectionProxyPosition,
        this.selectionProxyQuaternion,
        this.selectionProxyScale,
      );
      mesh.setMatrixAt(
        index,
        this.selectionProxyMatrix,
      );
    }

    mesh.count =
      this.selectionProxyBodyIds.length;
    mesh.instanceMatrix.needsUpdate =
      true;
  }

  private selectAtClientPoint(
    clientX:
      number,

    clientY:
      number,
  ):
    void {

    const bounds =
      this.canvas
        .getBoundingClientRect();

    if (
      bounds.width <=
        0 ||
      bounds.height <=
        0
    ) {
      return;
    }

    this.pointerNdc.set(
      (
        (clientX -
          bounds.left) /
        bounds.width
      ) *
        2 -
        1,
      -(
        (
          clientY -
          bounds.top
        ) /
        bounds.height
      ) *
        2 +
        1,
    );

    this.scene.updateMatrixWorld(
      true,
    );
    this.camera.updateMatrixWorld(
      true,
    );

    this.raycaster.setFromCamera(
      this.pointerNdc,
      this.camera,
    );

    this.updateSelectionProxyBatch();

    const intersection =
      this.raycaster.intersectObjects(
        this.selectableObjects.filter(
          object =>
            objectHierarchyVisible(
              object,
            ),
        ),
        false,
      )[0];

    const instancedBodyId =
      intersection !==
        undefined &&
      intersection.object ===
        this.selectionProxyBatch &&
      intersection.instanceId !==
        undefined
        ? this.selectionProxyBodyIds[
            intersection.instanceId
          ] ??
          null
        : null;

    const legacyBodyId =
      intersection
        ?.object
        .userData[
          'systemSceneBodyId'
        ];

    this.selectBody(
      instancedBodyId ??
      (
        typeof legacyBodyId ===
          'string'
          ? legacyBodyId
          : null
      ),
    );
  }

  private selectBody(
    bodyId:
      string | null,
  ):
    void {

    if (
      this.selectionMarker !==
      null
    ) {
      this.selectionMarker.removeFromParent();
      this.selectionMarker.material.dispose();
      this.selectionMarker =
        null;
    }

    this.selectedBodyId =
      bodyId;

    if (
      bodyId ===
        null
    ) {
      this.onSelectionChange(
        null,
      );
      this.renderFrame();
      return;
    }

    const body =
      this.bodySnapshotById.get(
        bodyId,
      );

    const group =
      this.animatedBodies.get(
        bodyId,
      );

    if (
      body ===
        undefined ||
      group ===
        undefined
    ) {
      this.onSelectionChange(
        null,
      );
      this.renderFrame();
      return;
    }

    const markerMaterial =
      new THREE.SpriteMaterial({
        map:
          this.selectionRingTexture,
        color:
          0x8ce5ff,
        transparent:
          true,
        opacity:
          0.94,
        depthTest:
          false,
        depthWrite:
          false,
        toneMapped:
          false,
      });

    const marker =
      new THREE.Sprite(
        markerMaterial,
      );

    const visualExtentRadius =
      systemSceneVisualExtentRadiusScene(
        body,
      );

    const diameter =
      body.kind ===
        'star'
        ? Math.max(
            visualExtentRadius *
              4.5,
            0.46,
          )
        : Math.max(
            visualExtentRadius *
              4.8,
            0.34,
          );

    marker.scale.set(
      diameter,
      diameter,
      1,
    );
    marker.renderOrder =
      100;
    marker.name =
      `${body.title} selection marker`;

    group.add(
      marker,
    );

    this.selectionMarker =
      marker;

    this.onSelectionChange(
      Object.freeze({
        bodyId:
          body.id,
        kind:
          body.kind,
        label:
          body.label,
        title:
          body.title,
      }),
    );

    this.renderFrame();
  }

  private applySimulationDay(
    simulationDay:
      number,
  ):
    void {

    const snapshot =
      this.currentSnapshot;

    if (
      snapshot ===
      null
    ) {
      return;
    }

    const sceneScale =
      snapshot.scale;
    this.lightingSimulationDay = simulationDay;

    for (
      const body
      of [
        ...snapshot.stars,
        ...snapshot.planets,
        ...(snapshot.pulsarPlanetVisuals ?? []),
        ...snapshot.moons,
        ...snapshot.minorBodies,
      ]
    ) {
      const object =
        this.animatedBodies.get(
          body.id,
        );

      if (
        object ===
        undefined
      ) {
        continue;
      }

      const position =
        body.motionContributions.length ===
          0
          ? body.position
          : this.positionFromContributions(
              body.motionContributions,
              simulationDay,
              sceneScale,
            );

      object.position.set(
        position.x,
        position.y,
        position.z,
      );

      if (
        body.kind !==
          'minor-body'
      ) {
        const spinObject =
          this.spinningBodies.get(
            body.id,
          );

        if (
          spinObject !==
            undefined
        ) {
          spinObject.rotation.y =
            body.kind ===
              'moon'
              ? systemSceneMoonDisplaySpinRadiansV2(
                  body.spin,
                  simulationDay,
                  snapshot.simulation,
                )
              : systemSceneBodyDisplaySpinRadians(
                  body.spin,
                  simulationDay,
                  snapshot.simulation,
                );
        }
      }
    }

    for (
      const binding
      of this.artificialSatelliteBindings
    ) {
      binding.orbitPivot.rotation.y =
        binding.basePhaseRadians +
        binding.angularSpeedRadiansPerDay *
          (simulationDay - snapshot.simulation.epochSimulationDay);
      if (binding.ringVisualVISCIV6g) {
        updateOrbitalRingTrafficVISCIV6k(
          binding.ringVisualVISCIV6g,
          simulationDay - snapshot.simulation.epochSimulationDay,
        );
      }
    }

    for (
      const orbit
      of snapshot.orbits
    ) {
      const line =
        this.animatedOrbits.get(
          orbit.id,
        );

      if (
        line ===
        undefined
      ) {
        continue;
      }

      const anchorPosition =
        this.positionFromContributions(
          orbit.anchorMotionContributions,
          simulationDay,
          sceneScale,
        );

      line.position.set(
        anchorPosition.x,
        anchorPosition.y,
        anchorPosition.z,
      );
    }

    for (const binding of this.habitableZoneBindings) {
      const anchor = this.positionFromContributions(
        binding.snapshot.anchorMotionContributions,
        simulationDay,
        sceneScale,
      );
      binding.group.position.copy(anchor);
    }

    for (
      const binding
      of this.asteroidBeltLayerBindings
    ) {
      const anchorPosition =
        this.positionFromContributions(
          binding.snapshot
            .anchorMotionContributions,
          simulationDay,
          sceneScale,
        );

      binding.group.position.copy(
        anchorPosition,
      );
    }

    for (
      const overlay
      of this.orbitalRiskOrbitOverlays
    ) {
      const anchorPosition =
        this.positionFromContributions(
          overlay.orbit.anchorMotionContributions,
          simulationDay,
          sceneScale,
        );

      overlay.line.position.copy(
        anchorPosition,
      );
    }

    for (
      const marker
      of this.orbitalRiskMarkers
    ) {
      const targetBody =
        this.animatedBodies.get(
          marker.targetBodyId,
        ) ??
        null;

      if (
        targetBody !==
          null
      ) {
        marker.sprite.position.copy(
          targetBody.position,
        );
      }
    }

    for (const visual of this.compactVisualBindings.values()) {
      // One simulated day advances one visual second, not physical compact spin.
      visual.update(simulationDay);
    }

    this.updateCometActivityPresentation(
      simulationDay,
    );
    this.updateMinorBodyInstanceBatches();
    this.updateSelectionProxyBatch();
  }

  private updateCometActivityPresentation(
    simulationDay:
      number,
  ): void {

    const snapshot =
      this.currentSnapshot;

    if (
      snapshot ===
        null ||
      this.cometActivityBindings.size ===
        0
    ) {
      return;
    }

    this.scene.updateMatrixWorld(
      true,
    );

    for (
      const body
      of snapshot.minorBodies
    ) {
      const presentation =
        body.cometPresentation;
      const binding =
        this.cometActivityBindings.get(
          body.id,
        );
      const cometObject =
        this.animatedBodies.get(
          body.id,
        );

      if (
        presentation ===
          null ||
        binding ===
          undefined ||
        cometObject ===
          undefined
      ) {
        continue;
      }

      const activity =
        systemSceneCometActivityAtSimulationDayV1(
          presentation,
          simulationDay,
          body.radiusScene,
        );

      cometObject.getWorldPosition(
        this.cometWorldPosition,
      );
      this.cometLightDirectionAccumulator.set(
        0,
        0,
        0,
      );
      const stellarFluxes = (snapshot.generatorVersionCode === 2 || snapshot.generatorVersionCode === 3)
        ? v2CometStellarIrradianceAtDay(snapshot, body, simulationDay)
        : null;
      const totalFlux = stellarFluxes?.reduce((sum, source) => sum + source.fluxEarth, 0)
        ?? activity.incidentFluxEarth;

      for (
        const star
        of snapshot.stars
      ) {
        const starObject =
          this.animatedBodies.get(
            star.id,
          );

        if (
          starObject ===
            undefined
        ) {
          continue;
        }

        starObject.getWorldPosition(
          this.cometStarWorldPosition,
        );
        this.cometLightDirectionScratch
          .subVectors(
            this.cometStarWorldPosition,
            this.cometWorldPosition,
          );

        const distanceSquared =
          Math.max(
            this.cometLightDirectionScratch
              .lengthSq(),
            0.0025,
          );
        const fluxWeight = stellarFluxes === null
          ? (star.compactHostKind === undefined ? Math.max(star.sourceLuminositySolar ?? 0.01, 0.01) : 0) / distanceSquared
          : (stellarFluxes.find(source => source.starId === star.id)?.fluxEarth ?? 0);

        if (
          this.cometLightDirectionScratch
            .lengthSq() >
          1e-12
        ) {
          this.cometLightDirectionScratch
            .normalize();
          this.cometLightDirectionAccumulator
            .addScaledVector(
              this.cometLightDirectionScratch,
              fluxWeight,
            );
        }
      }

      if (
        this.cometLightDirectionAccumulator
          .lengthSq() <=
        1e-12
      ) {
        this.cometLightDirectionAccumulator.set(
          -1,
          0,
          0,
        );
      } else {
        this.cometLightDirectionAccumulator
          .normalize()
          .negate();
      }

      applySystemSceneCometActivityVisualV1(
        binding,
        systemSceneCometActivityVisualParityV1(
          snapshot, presentation, activity, body.radiusScene, totalFlux,
        ),
        this.cometLightDirectionAccumulator,
      );
    }
  }

  private updateTrackedBodyCamera(
    realTimestampMilliseconds:
      number,
  ): void {

    if (
      this.trackedBodyId ===
        null
    ) {
      return;
    }

    const object =
      this.animatedBodies.get(
        this.trackedBodyId,
      );

    if (
      object ===
        undefined
    ) {
      this.trackedBodyId =
        null;
      this.cameraController.stopBodyTracking();
      return;
    }

    this.scene.updateMatrixWorld(
      true,
    );

    object.getWorldPosition(
      this.trackedWorldPosition,
    );

    this.cameraController.updateBodyTracking(
      this.trackedWorldPosition,
      realTimestampMilliseconds,
    );
  }

  private positionFromContributions(
    contributions:
      readonly SystemSceneMotionContributionSnapshot[],

    simulationDay:
      number,

    sceneScale:
      SystemSceneScaleSnapshot,
  ): THREE.Vector3 {

    const projected =
      projectSystemSceneMotionContributions(
        contributions,
        motionId =>
          this.motionById.get(
            motionId,
          ),
        simulationDay,
        sceneScale,
      );

    return new THREE.Vector3(
      projected.x,
      projected.y,
      projected.z,
    );
  }

  private clearFrameObjects():
    void {
    // 38.9: release snapshot identity lookups together with scene resources.
    this.lightingTargets389 = [];
    this.starsById389.clear();
    this.orbitalHomeStars389.clear();
    this.hasCompactLightingHost389 = false;
    this.viscorbLocalPresentation.endImmediately();
    this.resetPlanetaryLodGroupLODGRP1(true);
    this.planetaryLodApoapsisCacheLODGRP1.clear();

    if (
      this.selectionMarker !==
        null
    ) {
      this.selectionMarker.removeFromParent();
      this.selectionMarker.material.dispose();
    }

    this.trackedBodyId =
      null;
    this.cameraController.stopBodyTracking();

    this.releaseFocusedMinorBodyAtlas387x();
    this.minorBodyAtlasSources387x.clear();

    disposeResources(
      this.frameDisposables,
    );

    if (
      this.selectedBodyId !==
        null
    ) {
      this.onSelectionChange(
        null,
      );
    }

    this.selectionMarker =
      null;
    this.selectedBodyId =
      null;
    this.selectionProxyBatch =
      null;
    this.selectionProxyBodyIds.length =
      0;
    this.selectionProxyGroups.length =
      0;
    this.selectionProxyRadii.length =
      0;
    this.selectableObjects.length =
      0;
    this.planetLayerObjects.length =
      0;
    this.moonLayerObjects.length =
      0;
    this.artificialSatelliteLayerObjects.length =
      0;
    this.artificialSatelliteOrbitGuides.length =
      0;
    this.artificialSatelliteBindings.length =
      0;
    this.orbitalSurfaceShadowBindingsVISCIV6n.length = 0;
    this.habitableZoneLayerObjects.length =
      0;
    this.orbitalRiskLayerObjects.length =
      0;
    this.habitableZoneBindings.length =
      0;
    this.asteroidBeltLayerBindings.length =
      0;
    this.orbitalRiskOrbitOverlays.length =
      0;
    this.orbitalRiskMarkers.length =
      0;
    this.asteroidLayerObjects.length =
      0;
    this.cometLayerObjects.length =
      0;
    this.cometActivityBindings.clear();
    this.minorBodyInstanceBatches.clear();
    this.transNeptunianObjectLayerObjects.length =
      0;
    this.capturedObjectLayerObjects.length =
      0;
    this.minorBodyOrbitLayerKeys.clear();
    this.updateGiantAtmosphereFineGeometryVISCATM1c(null);
    this.giantAtmosphereShellsVISCATM1c.clear();
    this.bodySnapshotById.clear();
    this.releaseDetailedPlanetTexture();
    this.releaseFocusedLunarSurfaceLUNSURF1();
    this.lunarSurfaceFocusSourcesLUNSURF1.clear();
    this.bodyLodBindings.clear();
    this.infrastructureVisualBindings386.length = 0;
    this.colonyBodyMarkerBindingsT7n.length=0;
    this.colonySiteMarkerBindingsT7t.length=0;
    this.pendingMoonVisuals.clear();
    this.animatedBodies.clear();
    this.spinningBodies.clear();
    this.bodyLightBindings.clear();
    this.compactVisualBindings.clear();
    this.compactBlackHoleBillboards.length = 0;
    this.compactBlackHoleBodyOcclusion.length = 0;
    this.animatedOrbits.clear();
    this.orbitLocalSamplesAu.clear();

    while (
      this.presentationRoot.children.length >
      0
    ) {
      const child =
        this.presentationRoot
          .children[0];

      this.presentationRoot.remove(
        child,
      );
    }
  }

  private updateAnimationLoop():
    void {

    if (
      this.disposed
    ) {
      return;
    }

    const motionCount =
      this.currentSnapshot
        ?.motions.length ??
      0;

    this
      .renderer
      .setAnimationLoop(
        systemSceneAnimationLoopRequired(
          this.pageVisible,
          // Compact stars can pulse/rotate even when they have no planets.
          motionCount + this.compactVisualBindings.size,
          this.trackedBodyId !==
            null,
        )
          ? this.onAnimationFrame
          : null,
      );
  }

  private updateBodyLightDirections():
    void {

    const snapshot =
      this.currentSnapshot;

    if (
      snapshot ===
        null ||
      this.bodyLightBindings.size ===
        0
    ) {
      return;
    }

    this.scene.updateMatrixWorld(
      true,
    );
    this.camera.updateMatrixWorld(
      true,
    );
    this.camera.matrixWorldInverse
      .copy(
        this.camera.matrixWorld,
      )
      .invert();

    // Only the V2 TRIPLE path changes: its independently magnified A/B and C
    // orbits must not be used to estimate physical stellar flux.
    const tripleSources = (snapshot.generatorVersionCode === 2 || snapshot.generatorVersionCode === 3) &&
      snapshot.multiplicityName === 'TRIPLE'
      ? v2TripleLightingSources(snapshot, this.lightingSimulationDay)
      : null;

    for (
      const body
      of this.lightingTargets389
    ) {
      const binding =
        this.bodyLightBindings.get(
          body.id,
        );
      const planetObject =
        this.animatedBodies.get(
          body.id,
        );

      if (
        binding ===
          undefined ||
        planetObject ===
          undefined
      ) {
        continue;
      }

      planetObject.getWorldPosition(
        this.planetLightPlanetWorldPosition,
      );
      // VISCORB.1: enlarged presentation orbits must not change the scientific
      // stellar direction/flux of a moon. Use its untouched projected position.
      if (body.kind === 'moon') {
        const physical = this.viscorbLocalPresentation.physicalMoonPosition(body.id);
        if (physical !== null) {
          this.planetLightPlanetWorldPosition.copy(physical)
            .applyMatrix4(this.presentationRoot.matrixWorld);
        }
      }
      const tripleFluxes = tripleSources === null ? null : v2TripleBodyLightFluxes(
        body.motionContributions, snapshot.motions, tripleSources, this.lightingSimulationDay,
      );
      this.planetLightTopFluxes[0] =
        0;
      this.planetLightTopFluxes[1] =
        0;
      this.planetLightTopFluxes[2] =
        0;

      for (
        const star
        of snapshot.stars
      ) {
        const starObject =
          this.animatedBodies.get(
            star.id,
          );

        if (
          starObject ===
            undefined
        ) {
          continue;
        }

        starObject.getWorldPosition(
          this.planetLightStarWorldPosition,
        );
        this.planetLightDirectionScratch
          .subVectors(
            this.planetLightStarWorldPosition,
            this.planetLightPlanetWorldPosition,
          );

        const distanceSquared =
          Math.max(
            this.planetLightDirectionScratch
              .lengthSq(),
            0.0025,
          );

        if (
          distanceSquared <=
            0
        ) {
          continue;
        }

        const flux = tripleFluxes === null
          ? (star.compactHostKind === undefined
              ? Math.max(star.sourceLuminositySolar ?? 0.01, 0.01)
              : Math.max(star.compactHostPresentationFlux ?? 0, star.compactHostInspectionLightFlux ?? 0)) / distanceSquared
          : (tripleFluxes.find(source => source.starId === star.id)?.flux ?? 0);

        this.planetLightDirectionScratch
          .normalize();
        insertTopPlanetLightContribution(
          this.planetLightTopFluxes,
          this.planetLightTopDirections,
          flux,
          this.planetLightDirectionScratch,
        );
      }

      const compressedWeightSum =
        assignPlanetLightBindingView(
          binding,
          this.planetLightTopFluxes,
          this.planetLightTopDirections,
          this.camera.matrixWorldInverse,
        );

      if (body.kind === 'planet' && binding.orbitalHomeDirectionsView && binding.orbitalHomeFlagsView) {
        const homeIds = this.orbitalHomeStars389.get(body.id) ?? [];
        const homeFlags = binding.orbitalHomeFlagsView;
        homeFlags.set(0, 0);
        for (let hostIndex = 0; hostIndex < Math.min(2, homeIds.length); hostIndex += 1) {
          const homeId = homeIds[hostIndex]!;
          const homeStar = this.starsById389.get(homeId);
          if (!homeStar || (homeStar.sourceLuminositySolar ?? 0) <= 0) continue;
          const homeObject = this.animatedBodies.get(homeId);
          if (!homeObject) continue;
          homeObject.getWorldPosition(this.planetLightStarWorldPosition);
          this.planetOrbitHomeDirectionScratch.subVectors(
            this.planetLightStarWorldPosition,
            this.planetLightPlanetWorldPosition,
          );
          if (this.planetOrbitHomeDirectionScratch.lengthSq() <= 1e-9) continue;
          binding.orbitalHomeDirectionsView[hostIndex]!.copy(
            this.planetOrbitHomeDirectionScratch,
          ).transformDirection(this.camera.matrixWorldInverse);
          if (hostIndex === 0) homeFlags.x = 1;
          else homeFlags.y = 1;
        }
      }

      if (
        compressedWeightSum <=
        1e-9
      ) {
        binding.lightDirectionsView[0].set(
          1,
          0,
          0,
        );
        binding.lightDirectionsView[1].set(
          1,
          0,
          0,
        );
        binding.lightDirectionsView[2].set(
          1,
          0,
          0,
        );
        // If no directional emission or separate disk-inspection lighting is
        // available, only the bounded albedo-following fill remains.
        binding.lightWeightsView.set(
          this.hasCompactLightingHost389 ? 0 : 1,
          0,
          0,
        );
      }
    }
  }

  /** Visible bodies only. Neither private moon records nor undiscovered
   * infrastructure are ever consulted to build a group. */
  private planetaryLodMembersLODGRP1(hostId:string): readonly string[] {
    if (!this.currentSnapshot || !this.layerVisibility.moons) return [];
    return this.currentSnapshot.moons
      .filter(moon => moon.hostPlanetId === hostId && this.isBodySnapshotVisible(moon) &&
        this.lunarSurfaceFocusSourcesLUNSURF1.has(moon.id))
      .map(moon => moon.id);
  }

  private planetaryLodGroupGiantLODGRP1(hostId:string): boolean {
    const body = this.bodySnapshotById.get(hostId);
    return body?.kind === 'planet' && body.giantAtmosphere !== null;
  }

  /** Independent from each moon's pixel diameter. Following ANY moon keeps
   * its host group's LOD and prevents texture regeneration on a focus change. */
  private updatePlanetaryLodGroupLODGRP1(): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.planetaryLodLastCheckLODGRP1 < 120 &&
        this.planetaryLodGpuQueueLODGRP1.length === 0 &&
        this.planetaryLodGroupLODGRP1.status.phase !== 'READY') return;
    this.planetaryLodLastCheckLODGRP1 = now;
    if (!this.currentSnapshot || !this.layerVisibility.planets) {
      this.resetPlanetaryLodGroupLODGRP1(false);return;
    }
    const focusId = this.trackedBodyId;
    const focus = focusId ? this.bodySnapshotById.get(focusId) : null;
    const forcedHost = focus?.kind === 'planet' ? focus.id
      : focus?.kind === 'moon' ? focus.hostPlanetId : null;
    let best: {hostId:string;pixels:number;followed:boolean} | null = null;
    for (const host of this.currentSnapshot.planets) {
      const object = this.animatedBodies.get(host.id);
      if (!object || !objectHierarchyVisible(object)) continue;
      object.getWorldPosition(this.lodWorldPosition);
      const dist = this.cameraWorldPosition.distanceTo(this.lodWorldPosition);
      const centre = this.lodWorldPosition.project(this.camera);
      const explicit = forcedHost === host.id;
      const inView = centre.z >= -1 && centre.z <= 1 &&
        Math.abs(centre.x) <= 1.35 && Math.abs(centre.y) <= 1.35;
      const moonIds = this.planetaryLodMembersLODGRP1(host.id);
      // Apoapsis from existing VISCORB orbit geometry (no changed orbital
      // elements). The projected enquiry is bounded to prevent giant remote
      // orbits from preloading the entire stellar scene.
      let outerRadius=host.radiusScene;
      let nearestMoonPixels=0;
      for (const id of moonIds) {
        const moon=this.bodySnapshotById.get(id);
        if (moon?.kind !== 'moon') continue;
        const line=this.animatedOrbits.get(moon.orbitId);
        if (line) {
          let apoapsis=this.planetaryLodApoapsisCacheLODGRP1.get(moon.orbitId);
          if (apoapsis===undefined) {
            apoapsis=viscorbOrbitGeometryRadiiV1(line.geometry)?.apoapsis ?? 0;
            this.planetaryLodApoapsisCacheLODGRP1.set(moon.orbitId,apoapsis);
          }
          outerRadius=Math.max(outerRadius,apoapsis * Math.max(1,line.scale.x));
        }
        const moonObject=this.animatedBodies.get(id);
        if (!moonObject || !objectHierarchyVisible(moonObject)) continue;
        moonObject.getWorldPosition(this.lodWorldPosition);
        const moonCentre=this.lodWorldPosition.project(this.camera);
        if (moonCentre.z < -1 || moonCentre.z > 1 ||
          Math.abs(moonCentre.x) > 1.35 || Math.abs(moonCentre.y) > 1.35) continue;
        const moonDist=this.cameraWorldPosition.distanceTo(this.lodWorldPosition);
        const moonRadius=this.bodyLodBindings.get(id)?.radiusScene ?? moon.radiusScene;
        const effectiveRadius=moonRadius * moonObject.scale.x;
        nearestMoonPixels=Math.max(nearestMoonPixels,
          systemSceneProjectedDiameterPixelsV1(Math.max(effectiveRadius,host.radiusScene*.4),
            Math.max(moonDist,moonRadius*1.05),this.camera.fov,this.viewportHeightPixels));
      }
      if (!explicit && !inView && nearestMoonPixels < 35) continue;
      const visualEnvelope=Math.min(Math.max(host.radiusScene*2,outerRadius),host.radiusScene*24);
      const hostPixels=inView ? systemSceneProjectedDiameterPixelsV1(visualEnvelope,
        Math.max(dist,host.radiusScene*1.05),this.camera.fov,this.viewportHeightPixels):0;
      const pixels=Math.max(hostPixels,nearestMoonPixels);
      if (!explicit && pixels < 35) continue;
      if (!best || (explicit && !best.followed) ||
          (explicit === best.followed && pixels > best.pixels))
        best = {hostId:host.id,pixels,followed:explicit};
    }
    const currentlyActive = this.planetaryLodGroupLODGRP1.hostId;
    const sameHost = best?.hostId === currentlyActive;
    const proximity = best === null ? 'OUT' : lodgrpProximityV2(best.pixels,
      best.followed,
      sameHost ? this.planetaryLodEntryStateLODGRP1 : 'OUT');
    if (!best || proximity === 'OUT') {
      if (currentlyActive !== null) this.resetPlanetaryLodGroupLODGRP1(false);
      this.planetaryLodEntryStateLODGRP1='OUT';return;
    }
    this.planetaryLodEntryStateLODGRP1=proximity;
    const members=this.planetaryLodMembersLODGRP1(best.hostId);
    // Prioritise the moon being followed, then those nearer the camera. The
    // controller compares membership as a set: focus changes cannot restart it.
    const scores=new Map<string,number>();
    for (const moonId of members) {
      const moonObject=this.animatedBodies.get(moonId);
      if (!moonObject) continue;
      moonObject.getWorldPosition(this.lodWorldPosition);
      scores.set(moonId,-this.cameraWorldPosition.distanceTo(this.lodWorldPosition));
    }
    const orderedMembers=lodgrpPrioritiseMoonsV2(members,
      focus?.kind==='moon' ? focus.id : this.selectedBodyId,scores);
    const group:LodgrpGroupV1={hostId:best.hostId,moonIds:orderedMembers,
      requestedBytes:lodgrpEstimateBytesV1(members.length)};
    if (this.planetaryLodGroupLODGRP1.begin(group)) {
      this.cancelPlanetaryLodWorkerLODGRP1();
      this.releasePlanetaryLodGpuLODGRP1();
      this.releaseDetailedPlanetTexture();
      this.releaseFocusedLunarSurfaceLUNSURF1();
      this.planetaryLodPreparationStartLODGRP1=now;
      this.planetaryLodTimingsLODGRP2.begin(now);
      // Cache hits can be uploaded while the worker calculates missing moons.
      this.stagePlanetaryLodGpuLODGRP1();
      if (this.planetaryLodGroupLODGRP1.status.phase === 'READY')
        this.planetaryLodTimingsLODGRP2.cpuCompleted(now);
      this.debugPlanetaryLodLODGRP1('start');
      this.requestNextPlanetaryLodBodyLODGRP1();
    }
    // Queued maps are prepared concurrently with the remaining CPU atlases.
    // This is intentionally NOT gated on phase READY.
    if (this.planetaryLodGroupLODGRP1.status.phase === 'READY')
      this.stagePlanetaryLodGpuLODGRP1();
    // GPU upload one texture per frame. Map replacement is atomic only after
    // all required textures have already been uploaded.
    if (this.planetaryLodGpuQueueLODGRP1.length) {
      const entry=this.planetaryLodGpuQueueLODGRP1.shift()!;
      try {
        const gpuStart=typeof performance!=='undefined'?performance.now():Date.now();
        this.renderer.initTexture(entry.texture);
        this.planetaryLodTimingsLODGRP2.uploaded(
          (typeof performance!=='undefined'?performance.now():Date.now())-gpuStart);
        this.planetaryLodGpuReadyLODGRP1.push(entry);
      } catch {
        this.planetaryLodGroupLODGRP1.fail();
        this.releasePlanetaryLodGpuLODGRP1();
        this.cancelPlanetaryLodWorkerLODGRP1(true);
        this.debugPlanetaryLodLODGRP1('GPU upload failed; adaptive fallback');
      }
      this.wakePlanetaryLodFrameLODGRP1();
    }
    if (this.planetaryLodGroupLODGRP1.status.phase === 'READY' &&
        !this.planetaryLodGpuQueueLODGRP1.length &&
        this.planetaryLodGpuReadyLODGRP1.length) {
      this.planetaryLodTimingsLODGRP2.gpuCompleted(
        typeof performance!=='undefined'?performance.now():Date.now());
      this.commitPlanetaryLodGroupLODGRP1();
    }
  }

  /** Idle workers survive completed groups. Busy workers are terminated when
   * cancelling obsolete work; a stale result can never overwrite a new group. */
  private ensurePlanetaryLodWorkerLODGRP1(): void {
    if (this.planetaryLodWorkerLODGRP1 || typeof Worker === 'undefined') return;
    try {
      const worker=new Worker(
        new URL('./system-scene-group-atlas-lodgrp1.worker.ts',import.meta.url),{type:'module'});
      this.planetaryLodWorkerLODGRP1=worker;
      worker.onmessage=(event:MessageEvent<{
        ok:boolean;result?:(LodgrpAtlasResultV1 & {cpuMs?:number});generation?:number;
        error?:string;
      }>)=>{
        if (event.currentTarget !== this.planetaryLodWorkerLODGRP1) return;
        this.planetaryLodBusyLODGRP1=false;
        const now=typeof performance!=='undefined'?performance.now():Date.now();
        const msg=event.data;
        if (msg.ok && msg.result && this.planetaryLodGroupLODGRP1.accept(msg.result)) {
          this.planetaryLodTimingsLODGRP2.generated(msg.result.cpuMs ?? 0,
            now-this.planetaryLodJobStartLODGRP2,now);
          // 38.9: reject an over-budget active atlas group before any further
          // GPU staging. Restore native materials and release staged maps.
          if (this.planetaryLodGroupLODGRP1.status.phase === 'BUDGET_LIMITED') {
            this.releasePlanetaryLodGpuLODGRP1();
            this.debugPlanetaryLodLODGRP1('actual CPU atlas budget; adaptive fallback');
            this.wakePlanetaryLodFrameLODGRP1();
            return;
          }
          // The GPU can start while this same worker generates the NEXT moon.
          this.stagePlanetaryLodGpuLODGRP1();
          if (this.planetaryLodGroupLODGRP1.status.phase === 'READY')
            this.planetaryLodTimingsLODGRP2.cpuCompleted(now);
          this.requestNextPlanetaryLodBodyLODGRP1();
          this.wakePlanetaryLodFrameLODGRP1();
        } else if (!msg.ok && msg.generation === this.planetaryLodGroupLODGRP1.status.generation) {
          this.planetaryLodGroupLODGRP1.fail();
          this.releasePlanetaryLodGpuLODGRP1();
          this.debugPlanetaryLodLODGRP1(`worker: ${msg.error ?? 'failure'}`);
          this.cancelPlanetaryLodWorkerLODGRP1(true);
        }
      };
      worker.onerror=(event)=>{
        if (event.currentTarget !== this.planetaryLodWorkerLODGRP1) return;
        this.planetaryLodBusyLODGRP1=false;
        this.planetaryLodGroupLODGRP1.fail();
        this.releasePlanetaryLodGpuLODGRP1();
        this.cancelPlanetaryLodWorkerLODGRP1(true);
        this.debugPlanetaryLodLODGRP1('worker unavailable; adaptive fallback');
      };
    } catch {
      this.planetaryLodWorkerLODGRP1=null;
    }
  }

  private requestNextPlanetaryLodBodyLODGRP1(): void {
    if (!this.planetaryLodGroupLODGRP1.preparing || this.planetaryLodBusyLODGRP1) return;
    const id=this.planetaryLodGroupLODGRP1.pendingIds[0];
    if (!id) return;
    const body=this.bodySnapshotById.get(id);
    let request:LodgrpAtlasRequestV1 | null=null;
    if (body?.kind === 'planet') {
      const binding=this.bodyLodBindings.get(id);
      if (!binding?.planetSystemIdentity || !(binding.mesh.material instanceof THREE.MeshStandardMaterial)) {
        this.planetaryLodGroupLODGRP1.fail();return;
      }
      const material=binding.mesh.material;
      const spin=this.spinningBodies.get(id);
      const cloud=spin?.children.find(child => child !== binding.mesh && child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial && child.material.transparent);
      const cloudMap=cloud instanceof THREE.Mesh && cloud.material instanceof THREE.MeshStandardMaterial
        ? cloud.material.map : null;
      const source=(map:THREE.Texture|null):LodgrpSourceTextureV1 | undefined => {
        if (!(map instanceof THREE.DataTexture)) return undefined;
        const image=map.image as {width:number;height:number;data:Uint8Array};
        return image?.data instanceof Uint8Array
          ? {width:image.width,height:image.height,pixels:image.data} : undefined;
      };
      const originalMap=material.map;
      const genericSeed=systemScenePlanetTextureSeed({systemIdentity:binding.planetSystemIdentity,
        planetId:id,surfaceStyle:planetTextureSurfaceStyle(body)});
      const seed=body.giantAtmosphere === null ? genericSeed :
        originalMap instanceof THREE.DataTexture
          ? (originalMap.userData['genesisGiantAtmosphereSeedVISCATM1'] as number | undefined) ?? genericSeed
          : genericSeed;
      const solidSource=originalMap instanceof THREE.DataTexture
        ? (originalMap.userData['genesisSolidSurfaceSourceVISSURF1'] as SystemScenePlanetSurfaceTextureData | undefined) ?? null
        : null;
      const solidSeed=originalMap instanceof THREE.DataTexture
        ? (originalMap.userData['genesisSolidSurfaceSeedVISSURF1'] as number | undefined) ?? seed : seed;
      request={type:'planet',generation:this.planetaryLodGroupLODGRP1.status.generation,
        bodyId:id,seed,solidSeed,giantAtmosphere:body.giantAtmosphere,
        solidSource:solidSource?.surfaceClassMask ? solidSource : null,
        source:{albedo:source(material.map),roughness:source(material.roughnessMap),
          relief:source(material.bumpMap),emissive:source(material.emissiveMap),
          cloud:source(cloudMap)}};
    } else if (body?.kind === 'moon') {
      const source=this.lunarSurfaceFocusSourcesLUNSURF1.get(id);
      if (!source) {this.planetaryLodGroupLODGRP1.fail();return;}
      request={type:'moon',generation:this.planetaryLodGroupLODGRP1.status.generation,
        bodyId:id,presentation:source.presentation};
    }
    if (!request) {this.planetaryLodGroupLODGRP1.fail();return;}
    try {
      this.ensurePlanetaryLodWorkerLODGRP1();
      if (!this.planetaryLodWorkerLODGRP1) throw new Error('Worker unavailable');
      this.planetaryLodBusyLODGRP1=true;
      this.planetaryLodJobStartLODGRP2=
        typeof performance!=='undefined'?performance.now():Date.now();
      this.planetaryLodWorkerLODGRP1.postMessage(request);
    } catch {
      this.planetaryLodBusyLODGRP1=false;
      this.planetaryLodGroupLODGRP1.fail();
      this.cancelPlanetaryLodWorkerLODGRP1();
    }
  }

  private stagePlanetaryLodGpuLODGRP1(): void {
    for (const atlas of lodgrpUnstagedAtlasesV2(
      this.planetaryLodGroupLODGRP1.prepared,this.planetaryLodStagedIdsLODGRP2)) {
      for (const [role,pixels] of Object.entries(atlas.maps) as [LodgrpAtlasRoleV1,Uint8Array][]) {
        if (!(pixels instanceof Uint8Array)) continue;
        const width=atlas.type==='moon' || (atlas.solid &&
          role!=='cloud' && role!=='emissive') ? 1024 : atlas.width;
        const texture=createRgbaDataTexture(width,width/2,pixels,`GENESIS LODGRP.1 ${atlas.bodyId} ${role}`);
        if (role==='normal'||role==='roughness'||role==='relief') texture.colorSpace=THREE.NoColorSpace;
        if (atlas.solid && (role==='albedo'||role==='normal'||role==='roughness'||role==='relief'))
          prepareSolidSurfaceDataTextureVISSURF5c(texture,
            role==='albedo'?'COLOR':role==='normal'?'NORMAL':role==='roughness'?'ROUGHNESS':'RELIEF');
        if (atlas.type==='moon') texture.anisotropy=4;
        this.planetaryLodGpuQueueLODGRP1.push({id:atlas.bodyId,role,texture});
      }
      this.planetaryLodStagedIdsLODGRP2.add(atlas.bodyId);
    }
    if (this.planetaryLodGpuQueueLODGRP1.length)
      this.wakePlanetaryLodFrameLODGRP1();
  }

  private commitPlanetaryLodGroupLODGRP1(): void {
    const staged=this.planetaryLodGpuReadyLODGRP1;
    const mats:Array<(typeof this.planetaryLodInstalledLODGRP1)[number]>=[];
    // Resolve all destination materials before applying any map, to prevent a
    // partial group activation when the scene or layer changed meanwhile.
    for (const id of this.planetaryLodGroupLODGRP1.memberIds) {
      const body=this.bodySnapshotById.get(id);
      const surface=body?.kind==='planet' ? this.bodyLodBindings.get(id)?.mesh
        : this.lunarSurfaceFocusSourcesLUNSURF1.get(id)?.mesh;
      if (!(surface?.material instanceof THREE.MeshStandardMaterial)) {
        this.planetaryLodGroupLODGRP1.fail();
        this.releasePlanetaryLodGpuLODGRP1();return;
      }
      const material=surface.material;
      const cloud=body?.kind==='planet' ? this.spinningBodies.get(id)?.children.find(child =>
        child !== surface && child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial && child.material.transparent) : null;
      const cloudMaterial=cloud instanceof THREE.Mesh && cloud.material instanceof THREE.MeshStandardMaterial
        ? cloud.material : null;
      mats.push({material,originalMap:material.map,originalRoughness:material.roughnessMap,
        originalBump:material.bumpMap,originalNormal:material.normalMap,
        originalEmissive:material.emissiveMap,originalNormalScale:material.normalScale.clone(),
        originalRoughnessValue:material.roughness,cloudMaterial,originalCloud:cloudMaterial?.map ?? null});
    }
    const ids=this.planetaryLodGroupLODGRP1.memberIds;
    if (ids.some(id => !staged.some(x => x.id===id && x.role==='albedo'))) {
      this.planetaryLodGroupLODGRP1.fail();this.releasePlanetaryLodGpuLODGRP1();return;
    }
    // Record originals BEFORE the first swap; any later failure can restore.
    this.planetaryLodInstalledLODGRP1=mats;
    for (let index=0;index<ids.length;index++) {
      const id=ids[index]!;
      const entry=mats[index]!;
      const map=(role:LodgrpAtlasRoleV1)=>staged.find(x=>x.id===id&&x.role===role)?.texture ?? null;
      const main=map('albedo');
      if (!main) {this.planetaryLodGroupLODGRP1.fail();this.releasePlanetaryLodGpuLODGRP1();return;}
      entry.material.map=main;
      if (map('roughness')) entry.material.roughnessMap=map('roughness');
      if (map('relief')) entry.material.bumpMap=map('relief');
      if (map('normal')) {
        entry.material.normalMap=map('normal');
        if (this.bodySnapshotById.get(id)?.kind==='moon') entry.material.normalScale.set(.9,.9);
        else configureSolidSurfaceNormalDetailVISSURF5c(entry.material,map('normal'),map('relief'));
      }
      if (map('emissive')) entry.material.emissiveMap=map('emissive');
      if (entry.cloudMaterial && map('cloud')) {
        entry.cloudMaterial.map=map('cloud');entry.cloudMaterial.needsUpdate=true;
      }
      if (this.bodySnapshotById.get(id)?.kind==='moon') entry.material.roughness=1;
      entry.material.needsUpdate=true;
    }
    this.planetaryLodInstalledLODGRP1=mats;
    this.planetaryLodGroupLODGRP1.activate();
    this.planetaryLodTimingsLODGRP2.activated(
      typeof performance!=='undefined'?performance.now():Date.now());
    this.debugPlanetaryLodLODGRP1(`atomic HIGH after ${Math.round(
      (typeof performance!=='undefined'?performance.now():Date.now())-
        this.planetaryLodPreparationStartLODGRP1)} ms`);
  }

  private releasePlanetaryLodGpuLODGRP1(): void {
    for (const entry of this.planetaryLodInstalledLODGRP1) {
      entry.material.map=entry.originalMap;
      entry.material.roughnessMap=entry.originalRoughness;
      entry.material.bumpMap=entry.originalBump;
      entry.material.normalMap=entry.originalNormal;
      entry.material.emissiveMap=entry.originalEmissive;
      entry.material.normalScale.copy(entry.originalNormalScale);
      entry.material.roughness=entry.originalRoughnessValue;
      entry.material.needsUpdate=true;
      if (entry.cloudMaterial) {
        entry.cloudMaterial.map=entry.originalCloud;
        entry.cloudMaterial.needsUpdate=true;
      }
    }
    this.planetaryLodInstalledLODGRP1=[];
    for (const entry of [...this.planetaryLodGpuQueueLODGRP1,
      ...this.planetaryLodGpuReadyLODGRP1]) entry.texture.dispose();
    this.planetaryLodGpuQueueLODGRP1=[];
    this.planetaryLodGpuReadyLODGRP1=[];
    this.planetaryLodStagedIdsLODGRP2.clear();
  }

  private cancelPlanetaryLodWorkerLODGRP1(force=false): void {
    // Reuse the module worker between successful groups; terminate only a
    // still-running obsolete job or on system disposal/reconstruction.
    if (lodgrpTerminateWorkerV2(this.planetaryLodBusyLODGRP1,force)) {
      this.planetaryLodWorkerLODGRP1?.terminate();
      this.planetaryLodWorkerLODGRP1=null;
    }
    this.planetaryLodBusyLODGRP1=false;
  }
  private resetPlanetaryLodGroupLODGRP1(clearCache:boolean): void {
    this.cancelPlanetaryLodWorkerLODGRP1(clearCache);
    this.releasePlanetaryLodGpuLODGRP1();
    if (clearCache) this.planetaryLodGroupLODGRP1.reset();
    else this.planetaryLodGroupLODGRP1.leave();
    this.planetaryLodEntryStateLODGRP1='OUT';
    this.planetaryLodLastCheckLODGRP1=-Infinity;
  }
  private wakePlanetaryLodFrameLODGRP1():void {
    if (this.planetaryLodRequestFrameLODGRP1 || this.disposed || !this.pageVisible) return;
    this.planetaryLodRequestFrameLODGRP1=true;
    requestAnimationFrame(()=>{
      this.planetaryLodRequestFrameLODGRP1=false;
      if (!this.disposed && this.pageVisible) this.renderFrame();
    });
  }
  private debugPlanetaryLodLODGRP1(message:string):void {
    if (!this.planetaryLodDebugLODGRP1) return;
    const samples=[...this.planetaryLodFrameSamplesLODGRP1].sort((a,b)=>a-b);
    const avg=samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:0;
    const percentile=(p:number)=>samples[Math.min(samples.length-1,
      Math.floor((samples.length-1)*p))]??0;
    console.info('[GENESIS LODGRP.2]',message,this.planetaryLodGroupLODGRP1.status,
      this.planetaryLodGroupLODGRP1.cacheStats,{
        fps:avg>0?Math.round(1000/avg):null,
        avgMs:Math.round(avg*10)/10,p95Ms:percentile(.95),p99Ms:percentile(.99),
        gpuTextures:this.renderer.info.memory.textures,
        gpuGeometries:this.renderer.info.memory.geometries,
        drawCalls:this.renderer.info.render.calls,
        phases:this.planetaryLodTimingsLODGRP2.snapshot(
          typeof performance!=='undefined'?performance.now():Date.now()),
      });
  }

  private updateBodyLod(): void {
    if (
      this.bodyLodBindings.size ===
        0 && this.lunarSurfaceFocusSourcesLUNSURF1.size === 0 &&
        this.minorBodyAtlasSources387x.size === 0
    ) {
      return;
    }

    this.scene.updateMatrixWorld(
      true,
    );
    this.camera.getWorldPosition(
      this.cameraWorldPosition,
    );
    this.updatePlanetaryLodGroupLODGRP1();
    const groupStatusLODGRP1 = this.planetaryLodGroupLODGRP1.status;
    const groupHoldsLodLODGRP1 = groupStatusLODGRP1.hostId !== null &&
      groupStatusLODGRP1.phase !== 'FAILED';
    // 38.9: the controller owns a stable membership Set. No new Set per frame.

    let closestPlanet: { id: string; projectedDiameter: number; binding: SystemSceneBodyLodBindingV1 } | null = null;

    for (
      const [bodyId, binding]
      of this.bodyLodBindings
    ) {
      if (
        !objectHierarchyVisible(
          binding.mesh,
        )
      ) {
        continue;
      }

      binding.mesh.getWorldPosition(
        this.lodWorldPosition,
      );

      const distance =
        Math.max(
          this.lodWorldPosition.distanceTo(
            this.cameraWorldPosition,
          ),
          binding.radiusScene * 1.05,
        );

      const effectiveRadius = binding.radiusScene * (
        binding.kind === 'moon' ? this.animatedBodies.get(bodyId)?.scale.x ?? 1 : 1
      );
      const projectedDiameter =
        systemSceneProjectedDiameterPixelsV1(
          effectiveRadius,
          distance,
          this.camera.fov,
          this.viewportHeightPixels,
        );

      const isGroupedLODGRP1 = groupHoldsLodLODGRP1 &&
        this.planetaryLodGroupLODGRP1.hasMember(bodyId);
      const nextLevel = isGroupedLODGRP1
        ? groupStatusLODGRP1.phase === 'HIGH' ? 'HIGH' :
          groupStatusLODGRP1.phase === 'BUDGET_LIMITED' ? 'MEDIUM' : binding.level
        : systemSceneBodyLodLevelV1(projectedDiameter,binding.level);

      if (binding.kind === 'planet' && binding.planetSystemIdentity !== undefined &&
          projectedDiameter >= 210 &&
          (closestPlanet === null || projectedDiameter > closestPlanet.projectedDiameter)) {
        // Do not spend GPU memory on a larger planet behind the camera.
        const projectedCenter = this.lodWorldPosition.project(this.camera);
        if (projectedCenter.z >= -1 && projectedCenter.z <= 1 &&
            Math.abs(projectedCenter.x) <= 1.3 && Math.abs(projectedCenter.y) <= 1.3) {
          closestPlanet = { id: bodyId, projectedDiameter, binding };
        }
      }

      if (
        nextLevel ===
          binding.level
      ) {
        continue;
      }

      binding.mesh.geometry =
        this.sphereGeometryPool.get(
          binding.kind,
          nextLevel,
        );
      binding.level =
        nextLevel;
    }

    // LUNSURF.1: a single lunar focus uses the same near-camera policy as
    // planets. Irregular moons participate without swapping their geometry.
    let closestMoonLUNSURF1: {id:string; projectedDiameter:number;
      mesh:THREE.Mesh; presentation:SystemSceneMoonPresentationV1} | null = null;
    for (const [id, source] of this.lunarSurfaceFocusSourcesLUNSURF1) {
      if (!objectHierarchyVisible(source.mesh)) continue;
      source.mesh.getWorldPosition(this.lodWorldPosition);
      const distance = Math.max(source.presentation.presentationRadiusScene * 1.05,
        this.lodWorldPosition.distanceTo(this.cameraWorldPosition));
      const projectedDiameter = systemSceneProjectedDiameterPixelsV1(
        source.presentation.presentationRadiusScene, distance,
        this.camera.fov, this.viewportHeightPixels);
      if (projectedDiameter < 210 ||
          (closestMoonLUNSURF1 !== null &&
            closestMoonLUNSURF1.projectedDiameter >= projectedDiameter)) continue;
      const center = this.lodWorldPosition.project(this.camera);
      if (center.z < -1 || center.z > 1 || Math.abs(center.x) > 1.3 ||
          Math.abs(center.y) > 1.3) continue;
      closestMoonLUNSURF1 = {id, projectedDiameter, ...source};
    }
    const moonPrevious = this.focusedLunarSurfaceLUNSURF1;
    const moonFocus = !groupHoldsLodLODGRP1 && closestMoonLUNSURF1 !== null &&
      shouldUseMoonDetailLUNSURF1(closestMoonLUNSURF1.projectedDiameter,
        closestMoonLUNSURF1.id,moonPrevious?.id ?? null,
        closestPlanet?.projectedDiameter ?? null)
      ? closestMoonLUNSURF1 : null;
    if (moonFocus?.id !== moonPrevious?.id) {
      this.releaseFocusedLunarSurfaceLUNSURF1();
      if (moonFocus !== null) this.installFocusedLunarSurfaceLUNSURF1(moonFocus);
    }

    // Avoid generating high definition for distant planets or every body of
    // a dense system. Hysteresis prevents changes at the zoom boundary.
    const previous = this.detailedPlanetTexture;
    const candidate = closestPlanet?.projectedDiameter !== undefined &&
      !groupHoldsLodLODGRP1 &&
      closestPlanet.projectedDiameter >= (previous?.id === closestPlanet.id ? 210 : 300)
      ? (moonFocus === null ? closestPlanet : null) : null;
    // VISCATM.1: the same focused gas giant gains a final 1024 atlas only
    // at very close zoom. Solid bodies and distant planets keep their budgets.
    const candidateBody = candidate === null ? null : this.bodySnapshotById.get(candidate.id);
    const detailWidth = candidateBody?.kind === 'planet' && candidateBody.giantAtmosphere !== null
      ? giantAtmosphereFocusWidthVISCATM1(candidate!.projectedDiameter,
          previous?.id === candidate!.id ? previous.detailWidth : null)
      : PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width;
    if (candidate?.id !== previous?.id ||
        (candidate !== null && previous !== null && previous.detailWidth !== detailWidth)) {
      this.releaseDetailedPlanetTexture();
      if (candidate !== null) this.installDetailedPlanetTexture(candidate.id, candidate.binding, detailWidth);
    }

    // VISCATM.1c: the fine unit sphere fixes faceted haze/shell silhouettes.
    // This is independent of atlas width and limited to the visible focused
    // giant; 40x28 baseline meshes remain unchanged for all other bodies.
    const focusedBodyVISCATM1c = closestPlanet === null
      ? null : this.bodySnapshotById.get(closestPlanet.id);
    const visibleGiant = focusedBodyVISCATM1c?.kind === 'planet' &&
      focusedBodyVISCATM1c.giantAtmosphere !== null;
    const groupGiant = groupHoldsLodLODGRP1 && groupStatusLODGRP1.phase === 'HIGH' &&
      this.planetaryLodGroupGiantLODGRP1(groupStatusLODGRP1.hostId!);
    const geometryFocus = visibleGiant && !groupGiant && giantAtmosphereFineShellRequiredVISCATM1c(
      closestPlanet!.projectedDiameter,
      this.focusedGiantAtmosphereVISCATM1c === closestPlanet!.id,
    ) ? closestPlanet!.id : groupGiant ? groupStatusLODGRP1.hostId : null;
    this.updateGiantAtmosphereFineGeometryVISCATM1c(geometryFocus);

    // 38.7x: the same microstructure atlas as the fiche for a single nearby
    // asteroid/comet/TNO/captured body. At distance the canonical light LOD
    // continues unchanged; no atlas is generated for unseen bodies.
    let closestMinor: {id: string; projectedDiameter: number} | null = null;
    for (const [id, source] of this.minorBodyAtlasSources387x) {
      if (!objectHierarchyVisible(source.group)) continue;
      source.group.getWorldPosition(this.lodWorldPosition);
      const distance = Math.max(source.radiusScene * 1.05,
        this.lodWorldPosition.distanceTo(this.cameraWorldPosition));
      const projectedDiameter = systemSceneProjectedDiameterPixelsV1(
        source.radiusScene, distance, this.camera.fov, this.viewportHeightPixels);
      if (!systemSceneMinorBodyNeedsAtlas387x(projectedDiameter,
            id === this.focusedMinorBodyAtlas387x?.id)) continue;
      const centre = this.lodWorldPosition.project(this.camera);
      if (centre.z < -1 || centre.z > 1 || Math.abs(centre.x) > 1.3 ||
          Math.abs(centre.y) > 1.3) continue;
      if (closestMinor === null || projectedDiameter > closestMinor.projectedDiameter) {
        closestMinor = {id, projectedDiameter};
      }
    }
    if (closestMinor?.id !== this.focusedMinorBodyAtlas387x?.id) {
      this.releaseFocusedMinorBodyAtlas387x();
      if (closestMinor !== null) this.installFocusedMinorBodyAtlas387x(closestMinor.id);
    }
  }

  private updateGiantAtmosphereFineGeometryVISCATM1c(id: string | null): void {
    const oldId = this.focusedGiantAtmosphereVISCATM1c;
    if (oldId !== null && oldId !== id) {
      const previous = this.bodyLodBindings.get(oldId);
      if (previous !== undefined) {
        previous.mesh.geometry = this.sphereGeometryPool.get(previous.kind, previous.level);
      }
      for (const shell of this.giantAtmosphereShellsVISCATM1c.get(oldId) ?? []) {
        shell.mesh.geometry = shell.originalGeometry;
        shell.mesh.scale.copy(shell.originalScale);
      }
      this.focusedGiantAtmosphereVISCATM1c = null;
    }
    if (id === null) return;
    const binding = this.bodyLodBindings.get(id);
    if (binding?.kind !== 'planet') return;
    if (this.focusedGiantAtmosphereVISCATM1c === id &&
        this.giantAtmosphereFineSphereVISCATM1c !== null &&
        binding.mesh.geometry === this.giantAtmosphereFineSphereVISCATM1c) {
      return; // Keep shader and geometry stable; avoid writes each frame.
    }
    if (this.giantAtmosphereFineSphereVISCATM1c === null) {
      const segments = GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C;
      this.giantAtmosphereFineSphereVISCATM1c = new THREE.SphereGeometry(
        1, segments.widthSegments, segments.heightSegments,
      );
    }
    // The base mesh already has planet radius in its scale. The overlay
    // spheres have their radius baked in their legacy geometry instead.
    binding.mesh.geometry = this.giantAtmosphereFineSphereVISCATM1c;
    for (const shell of this.giantAtmosphereShellsVISCATM1c.get(id) ?? []) {
      shell.mesh.geometry = this.giantAtmosphereFineSphereVISCATM1c;
      shell.mesh.scale.copy(shell.originalScale).multiplyScalar(shell.radius);
    }
    this.focusedGiantAtmosphereVISCATM1c = id;
  }

  private releaseFocusedMinorBodyAtlas387x(): void {
    const previous = this.focusedMinorBodyAtlas387x;
    if (previous === null) return;
    for (const binding of previous.materials) {
      binding.material.map = binding.originalMap;
      binding.material.needsUpdate = true;
    }
    if (previous.detailedGeometry !== null) {
      const detail = previous.detailedGeometry;
      detail.mesh.geometry = detail.originalGeometry;
      detail.mesh.scale.copy(detail.originalScale);
      detail.temporaryGeometry.dispose();
    }
    previous.texture.dispose();
    this.focusedMinorBodyAtlas387x = null;
  }

  private installFocusedMinorBodyAtlas387x(id: string): void {
    const source = this.minorBodyAtlasSources387x.get(id);
    if (!source) return;
    const uniqueMaterials = [...new Set(source.surfaces.map(surface => surface.material))]
      .filter((material): material is THREE.MeshStandardMaterial =>
        material instanceof THREE.MeshStandardMaterial);
    if (uniqueMaterials.length === 0) return;
    const materials = uniqueMaterials.map(material => ({material, originalMap: material.map}));
    // TNO/CAP small-diameter renderers use a low-poly orbital silhouette;
    // at close range reuse the *fiche* geometry (radius 1) scaled to the
    // physical scene radius, without altering its identity or composition.
    let detailedGeometry: {
      mesh: THREE.Mesh; originalGeometry: THREE.BufferGeometry;
      originalScale: THREE.Vector3; temporaryGeometry: THREE.BufferGeometry;
    } | null = null;
    if (source.radiusScene < 0.12 && source.surfaces.length === 1) {
      const body = source.body;
      const detailed = source.kind === 'TNO' && body.tnoPresentation != null
        ? createSystemSceneTnoRenderableV1(1, body.tnoPresentation)
        : source.kind === 'CAPTURED' && body.capturedPresentation != null
          ? createSystemSceneCapturedRenderableV1(1, body.capturedPresentation) : null;
      if (detailed !== null) {
        const surface = source.surfaces[0]!;
        detailedGeometry = {
          mesh: surface, originalGeometry: surface.geometry,
          originalScale: surface.scale.clone(), temporaryGeometry: detailed.surface.geometry,
        };
        surface.geometry = detailed.surface.geometry;
        surface.scale.multiplyScalar(source.radiusScene);
        // The temporary material is not used: the existing material retains
        // precisely the source's reflectance and is restored on release.
        const temporaryMaterial = detailed.surface.material;
        if (temporaryMaterial instanceof THREE.Material) temporaryMaterial.dispose();
      }
    }
    try {
      const atlas = attachScientificMinorBodyAtlasVis3d2e(
        source.surfaces, source.kind, source.seedUint32);
      this.focusedMinorBodyAtlas387x = {id, texture: atlas, materials, detailedGeometry};
    } catch (error) {
      if (detailedGeometry !== null) {
        detailedGeometry.mesh.geometry = detailedGeometry.originalGeometry;
        detailedGeometry.mesh.scale.copy(detailedGeometry.originalScale);
        detailedGeometry.temporaryGeometry.dispose();
      }
      throw error;
    }
  }

  /** 38.6c3: suppress unphysical ambient/star reflections from colony
   * structures on the dark hemisphere. Use the SAME top-three multi-star
   * terminator as the moon/planet; never touch the lights of native cities.
   * Self-luminous status lamps are MeshBasicMaterial and remain unaffected. */
  private installColonialNaturalShading386c3(
    visual: Vida38InfrastructureVisual386,
    light: SystemScenePlanetLightBindingV1,
  ): void {
    const installed=new Set<THREE.MeshStandardMaterial>();
    visual.group.traverse(object=>{
      if (!(object instanceof THREE.InstancedMesh) ||
          object.userData['colonialVisual386c']!==true ||
          !(object.material instanceof THREE.MeshStandardMaterial)) return;
      const mat=object.material;
      if(installed.has(mat)) return;
      installed.add(mat);
      installSystemSceneDayNightMaterialV1(mat,v2SmallBodyDayNightProfile(false),light);
      // The regular shader uses each building face normal. That is not the
      // moon horizon: a side wall can face a star BEHIND the moon.
      installVida38ColonialRadialOcclusion386c4(mat,light,visual.colonialBodyCenterView386c4);
    });
  }

  /** T7t: utiliza los pivotes ya empleados por los edificios de cada
   * colonia. NO recupera los anillos antiguos de COLVIS.2: hacerlo suprimiría
   * los emisores nocturnos de T7r en este mismo renderizador. */
  private addColonySiteMarkersT7t(
    pivot:THREE.Group,visual:Vida38InfrastructureVisual386,
    radius:number,kind:'planet'|'moon',
  ):void{
    const anchors=visual.colonialSiteAnchorsT7t??[];
    if(!anchors.length)return;
    const materials=new Map<number,THREE.SpriteMaterial>();
    for(const anchor of anchors){
      let material=materials.get(anchor.markerHex);
      if(!material){
        material=new THREE.SpriteMaterial({
          map:this.selectionRingTexture,color:anchor.markerHex,
          transparent:true,opacity:.96,toneMapped:false,
          depthTest:true,depthWrite:false,
        });
        materials.set(anchor.markerHex,material);
        this.frameDisposables.push(material);
      }
      const marker=new THREE.Sprite(material);
      marker.name='T7t confirmed colonial site marker (optional, no physical geometry)';
      // Los pivotes HIGH están en las coordenadas locales de spinPivot,
      // incluso si el LOD alto no se está dibujando actualmente.
      marker.position.copy(anchor.site.position).multiplyScalar(1.003);
      marker.visible=false;
      marker.renderOrder=93;
      // Un indicador informativo no debe interceptar la selección del cuerpo.
      marker.raycast=()=>{};
      pivot.add(marker);
      this.colonySiteMarkerBindingsT7t.push({
        marker,anchor:anchor.site,body:visual.group,kind,radius,
      });
    }
  }

  /** T7t: el anillo solo aparece en el hemisferio visible y cuando el globo
   * ya tiene tamaño en pantalla suficiente para distinguir asentamientos. */
  private updateColonySiteMarkersT7t():void{
    if(!this.colonySiteMarkerBindingsT7t.length)return;
    if(!this.layerVisibility.colonies){
      for(const {marker} of this.colonySiteMarkerBindingsT7t)marker.visible=false;
      return;
    }
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld(true);
    this.camera.getWorldPosition(this.colonySiteCameraT7t);
    for(const binding of this.colonySiteMarkerBindingsT7t){
      const {marker,anchor,body,kind,radius}=binding;
      const bodyLayer=kind==='planet'?this.layerVisibility.planets:this.layerVisibility.moons;
      if(!bodyLayer){marker.visible=false;continue;}
      body.getWorldPosition(this.colonySiteCenterT7t);
      anchor.getWorldPosition(this.colonySiteWorldT7t);
      this.colonySiteNormalT7t.subVectors(this.colonySiteWorldT7t,this.colonySiteCenterT7t).normalize();
      this.colonySiteToCameraT7t.subVectors(this.colonySiteCameraT7t,this.colonySiteWorldT7t);
      const distanceToSite=this.colonySiteToCameraT7t.length();
      const facing=distanceToSite>0
        ?this.colonySiteNormalT7t.dot(this.colonySiteToCameraT7t)/distanceToSite:-1;
      const bodyDistance=Math.max(radius*1.05,
        this.colonySiteCameraT7t.distanceTo(this.colonySiteCenterT7t));
      const bodyPixels=systemSceneProjectedDiameterPixelsV1(
        radius,bodyDistance,this.camera.fov,this.viewportHeightPixels);
      const presentation=systemSceneColonySiteMarkerPresentationT7t(
        true,bodyLayer,bodyPixels,facing);
      marker.visible=presentation.visible;
      if(!marker.visible)continue;
      const diameter=systemSceneColonySiteMarkerWorldDiameterT7t(
        presentation.diameterPixels,distanceToSite,this.camera.fov,
        this.viewportHeightPixels,radius);
      marker.scale.set(diameter,diameter,1);
    }
  }

  /** T7n: marca VERDE opcional del cuerpo anfitrión completo.
   * Sprite reutiliza el atlas de selección, sin instanciar círculos por colonia. */
  private addColonyBodyMarkerT7n(
    pivot:THREE.Group,radius:number,kind:'planet'|'moon',
  ):void{
    const diameter=systemSceneColonyBodyRingDiameterT7n(radius);
    if(!(diameter>0))return;
    const material=new THREE.SpriteMaterial({
      map:this.selectionRingTexture,color:0x33ff7a,transparent:true,opacity:.96,
      toneMapped:false,depthTest:false,depthWrite:false,
    });
    const marker=new THREE.Sprite(material);
    marker.name='T7n confirmed colonized body marker (optional green ring)';
    marker.scale.set(diameter,diameter,1);
    marker.renderOrder=95;
    marker.visible=false;
    pivot.add(marker);
    this.colonyBodyMarkerBindingsT7n.push({marker,kind});
    this.frameDisposables.push(material);
  }

  private updateColonialNightLighting386c3(): void {
    for(const {bodyId,visual} of this.infrastructureVisualBindings386) {
      const light=this.bodyLightBindings.get(bodyId);
      if(!light) continue;
      visual.updateColonialNightLighting386c3(
        light.lightDirectionsView,light.lightWeightsView,this.camera.matrixWorldInverse,
        this.camera,this.viewportHeightPixels);
    }
  }

  private updateInfrastructureLod386(): void {
    if (!this.infrastructureVisualBindings386.length) return;
    this.scene.updateMatrixWorld(true);
    this.camera.getWorldPosition(this.cameraWorldPosition);
    for (const {radius,visual} of this.infrastructureVisualBindings386) {
      visual.group.getWorldPosition(this.lodWorldPosition);
      const distance = Math.max(radius*1.05,
        this.lodWorldPosition.distanceTo(this.cameraWorldPosition));
      visual.updateProjectedDiameterPixels(systemSceneProjectedDiameterPixelsV1(
        radius,distance,this.camera.fov,this.viewportHeightPixels));
    }
  }

  private releaseFocusedLunarSurfaceLUNSURF1(): void {
    const current = this.focusedLunarSurfaceLUNSURF1;
    if (current === null) return;
    current.material.map = current.map;
    current.material.normalMap = current.normalMap;
    current.material.roughnessMap = current.roughnessMap;
    current.material.roughness = current.roughness;
    current.material.normalScale.copy(current.normalScale);
    current.material.needsUpdate = true;
    for (const texture of current.textures) texture.dispose();
    this.focusedLunarSurfaceLUNSURF1 = null;
  }

  private installFocusedLunarSurfaceLUNSURF1(source: {
    id: string;
    mesh: THREE.Mesh;
    presentation: SystemSceneMoonPresentationV1;
  }): void {
    if (!(source.mesh.material instanceof THREE.MeshPhysicalMaterial)) return;
    const material = source.mesh.material;
    // Only the visual D.3 projection is sampled at HD. No science or new
    // crater positions are generated: the original seed and body persist.
    const data = buildSystemSceneMoonTextureV1(source.presentation,
      {width:1024, height:512});
    if (data.normalRgba === null || data.roughnessRgba === null) return;
    const mk = (rgba:Uint8Array, name:string, color:boolean) => {
      const texture = createRgbaDataTexture(data.width,data.height,rgba,name);
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = 4;
      return texture;
    };
    const albedo = mk(data.albedoRgba,'GENESIS LUNSURF.1 focus albedo',true);
    const normal = mk(data.normalRgba,'GENESIS LUNSURF.1 focus normal',false);
    const roughness = mk(data.roughnessRgba,'GENESIS LUNSURF.1 focus roughness',false);
    this.focusedLunarSurfaceLUNSURF1 = {
      id:source.id,material,map:material.map,normalMap:material.normalMap,
      roughnessMap:material.roughnessMap,roughness:material.roughness,
      normalScale:material.normalScale.clone(),textures:[albedo,normal,roughness],
    };
    material.map = albedo;
    material.normalMap = normal;
    material.normalScale.set(0.9,0.9);
    material.roughnessMap = roughness;
    material.roughness = 1;
    material.needsUpdate = true;
  }

  private releaseDetailedPlanetTexture(): void {
    const previous = this.detailedPlanetTexture;
    if (previous === null) return;
    previous.material.map = previous.originalMap;
    previous.material.roughnessMap = previous.originalRoughness;
    previous.material.bumpMap = previous.originalBump;
    previous.material.normalMap = previous.originalNormal;
    previous.material.emissiveMap = previous.originalEmissive;
    previous.material.needsUpdate = true;
    if (previous.cloudMaterial !== null) {
      previous.cloudMaterial.map = previous.originalCloud;
      previous.cloudMaterial.needsUpdate = true;
    }
    for (const texture of previous.detailTextures) texture.dispose();
    this.detailedPlanetTexture = null;
  }

  private installDetailedPlanetTexture(
    id: string, binding: SystemSceneBodyLodBindingV1,
    detailWidth: number = PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width,
  ): void {
    const body = this.bodySnapshotById.get(id);
    if (body?.kind !== 'planet' || binding.planetSystemIdentity === undefined ||
        !(binding.mesh.material instanceof THREE.MeshStandardMaterial)) return;
    const material = binding.mesh.material;
    const originalMap = material.map;
    const originalRoughness = material.roughnessMap;
    const originalBump = material.bumpMap;
    const originalNormal = material.normalMap;
    const originalEmissive = material.emissiveMap;
    const spinPivot = this.spinningBodies.get(id);
    const cloudMesh = spinPivot?.children.find(child =>
      child !== binding.mesh && child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial && child.material.transparent,
    );
    const cloudMaterial = cloudMesh instanceof THREE.Mesh &&
      cloudMesh.material instanceof THREE.MeshStandardMaterial
      ? cloudMesh.material : null;
    const originalCloud = cloudMaterial?.map ?? null;

    // Reuse the already computed D.4d atlas. No fresh physical projection,
    // planetary generation or high-cost semantic-mask classification on zoom.
    const genericSeed = systemScenePlanetTextureSeed({
      systemIdentity: binding.planetSystemIdentity,
      planetId: id,
      surfaceStyle: planetTextureSurfaceStyle(body),
    });
    const canonicalGiantSeed = originalMap instanceof THREE.DataTexture
      ? originalMap.userData['genesisGiantAtmosphereSeedVISCATM1'] as number | undefined
      : undefined;
    const seed = body.giantAtmosphere === null
      ? genericSeed
      : canonicalGiantSeed ?? genericSeed;
    const detailTextures: THREE.DataTexture[] = [];
    const solidSource = originalMap instanceof THREE.DataTexture
      ? originalMap.userData['genesisSolidSurfaceSourceVISSURF1'] as SystemScenePlanetSurfaceTextureData | undefined
      : undefined;
    // Reuse the existing classified D.4d atlas; never rebuild its semantic masks.
    const solidDetailSeed = originalMap instanceof THREE.DataTexture
      ? originalMap.userData['genesisSolidSurfaceSeedVISSURF1'] as number | undefined
      : undefined;
    const detailedSolid = solidSource?.surfaceClassMask && body.giantAtmosphere === null
      ? composeSolidPlanetMaterialsVISSURF5d(
          buildCoherentSolidPlanetSurfaceVISSURF5(solidSource,
            SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem, solidDetailSeed ?? seed),
          solidDetailSeed ?? seed)
      : null;
    if (detailedSolid !== null) {
      calibrateSolidRoughnessForRendererVISSURF5c(detailedSolid.roughnessRgba, detailedSolid.classMask);
    }
    const refine = (old: THREE.Texture | null, kind: PlanetTextureRefinementKind): THREE.DataTexture | null => {
      if (!(old instanceof THREE.DataTexture)) return null;
      const image = old.image as { readonly width: number; readonly height: number; readonly data: Uint8Array };
      if (!(image.data instanceof Uint8Array) || image.width < 3 || image.height < 2) return null;
      const solidBytes = detailedSolid === null ? null
        : old === originalMap ? detailedSolid.rgba
          : old === originalRoughness ? detailedSolid.roughnessRgba
            : old === originalBump ? detailedSolid.reliefRgba : null;
      const width = solidBytes !== null
        ? SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem
        : body.giantAtmosphere !== null && (kind === 'GAS' ||
            (kind === 'CLOUD' && old === originalCloud))
          ? detailWidth
          : PLANET_TEXTURE_DETAIL_SIZES_V1.closeSystem.width;
      const isGiantCloudDetail = body.giantAtmosphere !== null &&
        (kind === 'GAS' || (kind === 'CLOUD' && old === originalCloud));
      const pixels = solidBytes ?? (isGiantCloudDetail
        ? refineGiantAtmosphereMultiresVISCATM1(
            image.data, image.width, image.height, width, seed,
            body.giantAtmosphere!, kind === 'GAS' ? 'CLOUD_TOPS' : 'UPPER_HAZE',
          )
        : refinePlanetRgbaTextureV1(image.data, image.width, image.height, width, seed, kind));
      const refined = createRgbaDataTexture(width, width / 2,
        pixels,
        `GENESIS ${isGiantCloudDetail ? 'VISCATM.1' : solidBytes === null ? 'VIS-3D.1' : 'VISSURF.2'} ${kind} (zoom)`);
      if (kind === 'DATA') refined.colorSpace = THREE.NoColorSpace;
      if (solidBytes !== null) {
        prepareSolidSurfaceDataTextureVISSURF5c(refined,
          old === originalMap ? 'COLOR' : old === originalRoughness ? 'ROUGHNESS' : 'RELIEF');
      }
      detailTextures.push(refined);
      return refined;
    };
    const main = refine(originalMap, body.giantAtmosphere === null ? 'COLOR' : 'GAS');
    if (main === null) return;
    const roughness = refine(originalRoughness, 'DATA');
    const bump = refine(originalBump, 'DATA');
    const normal = detailedSolid?.normalRgba
      ? createRgbaDataTexture(SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem,
          SOLID_PLANET_DETAIL_WIDTH_VISSURF2.closeSystem / 2, detailedSolid.normalRgba,
          'GENESIS VISSURF.5 coherent normals (zoom)')
      : null;
    if (normal !== null) {
      prepareSolidSurfaceDataTextureVISSURF5c(normal, 'NORMAL');
      detailTextures.push(normal);
    }
    const emissive = refine(originalEmissive, 'EMISSION');
    const cloud = refine(originalCloud, 'CLOUD');

    material.map = main;
    if (roughness !== null) material.roughnessMap = roughness;
    if (normal !== null) {
      configureSolidSurfaceNormalDetailVISSURF5c(material, normal, bump);
    } else if (bump !== null) {
      material.bumpMap = bump;
    }
    if (emissive !== null) material.emissiveMap = emissive;
    material.needsUpdate = true;
    if (cloudMaterial !== null && cloud !== null) {
      cloudMaterial.map = cloud;
      cloudMaterial.needsUpdate = true;
    }
    this.detailedPlanetTexture = {
      id, detailWidth, material, originalMap, originalRoughness, originalBump, originalNormal, originalEmissive,
      cloudMaterial, originalCloud, detailTextures,
    };
  }

  private updateArtificialSatelliteLighting():
    void {

    if (
      !this.layerVisibility.artificialSatellites ||
      this.artificialSatelliteBindings.length ===
        0
    ) {
      return;
    }

    this.scene.updateMatrixWorld(
      true,
    );
    this.camera.updateMatrixWorld(
      true,
    );
    this.camera.getWorldPosition(
      this.cameraWorldPosition,
    );

    for (
      const binding
      of this.artificialSatelliteBindings
    ) {
      const host = this.animatedBodies.get(
        binding.hostBodyId,
      );

      if (
        host ===
          undefined
      ) {
        continue;
      }

      host.getWorldPosition(
        this.artificialSatellitePlanetWorldPosition,
      );
      this.artificialSatelliteCameraDirection
        .subVectors(
          this.cameraWorldPosition,
          this.artificialSatellitePlanetWorldPosition,
        )
        .normalize();

      const ringStellarSourcesVISCIV6g: { direction: THREE.Vector3; weight: number }[] = [];
      let weightedNight =
        0;
      let totalWeight =
        0;

      for (
        const star
        of this.currentSnapshot?.stars ??
          []
      ) {
        if ((star.sourceLuminositySolar ?? 0) <= 0) {
          continue;
        }

        const starObject =
          this.animatedBodies.get(
            star.id,
          );

        if (
          starObject ===
            undefined
        ) {
          continue;
        }

        starObject.getWorldPosition(
          this.artificialSatelliteStarWorldPosition,
        );
        this.artificialSatelliteLightDirection
          .subVectors(
            this.artificialSatelliteStarWorldPosition,
            this.artificialSatellitePlanetWorldPosition,
          );
        const distanceSquared = Math.max(
          this.artificialSatelliteLightDirection.lengthSq(),
          1e-6,
        );
        this.artificialSatelliteLightDirection.normalize();
        const weight =
          Math.max(
            star.sourceLuminositySolar ?? 0,
            0.05,
          ) /
          distanceSquared;
        if (binding.ringVisualVISCIV6g) {
          ringStellarSourcesVISCIV6g.push({
            direction: this.artificialSatelliteLightDirection.clone(), weight,
          });
        }
        const viewDot =
          this.artificialSatelliteCameraDirection.dot(
            this.artificialSatelliteLightDirection,
          );
        const nightFactor = THREE.MathUtils.clamp(
          (-viewDot + 0.15) /
            1.15,
          0,
          1,
        );
        weightedNight +=
          nightFactor *
          weight;
        totalWeight +=
          weight;
      }

      const visibility =
        totalWeight <=
          0
          ? 0.34
          : 0.12 +
            0.88 *
            THREE.MathUtils.clamp(
              weightedNight /
                totalWeight,
              0,
              1,
            );

      const brightness =
        0.24 +
        0.76 * visibility;
      for (
        const materialBinding
        of binding.materials
      ) {
        const roleGain = materialBinding.role === 'panel'
          ? 0.78
          : materialBinding.role === 'accent'
            ? 1
            : 0.88;
        materialBinding.material.color.copy(
          materialBinding.baseColor,
        ).multiplyScalar(
          Math.max(
            0.22,
            brightness * roleGain,
          ),
        );
      }
      if (binding.orbitMaterial !== null) {
        binding.orbitMaterial.opacity =
          binding.baseLineOpacity01 *
          visibility;
      }
      if (binding.ringVisualVISCIV6g) {
        updateOrbitalRingNightLightsVISCIV6g(
          binding.ringVisualVISCIV6g, ringStellarSourcesVISCIV6g,
        );
      }
    }
  }

  /** Stable projection callback for the VISCORB blend (38.9). */
  private readonly projectLocalMotion389 = (
    contributions: readonly SystemSceneMotionContributionSnapshot[],
    day: number,
    scale: SystemSceneScaleSnapshot,
  ): THREE.Vector3 => this.positionFromContributions(contributions, day, scale);

  private renderFrame():
    void {

    if (
      this.disposed ||
      !this.pageVisible
    ) {
      return;
    }

    if (this.planetaryLodDebugLODGRP1) {
      const now=typeof performance!=='undefined'?performance.now():Date.now();
      if (this.planetaryLodLastFrameLODGRP1>0) {
        this.planetaryLodFrameSamplesLODGRP1.push(now-this.planetaryLodLastFrameLODGRP1);
        if (this.planetaryLodFrameSamplesLODGRP1.length>120)
          this.planetaryLodFrameSamplesLODGRP1.shift();
      }
      this.planetaryLodLastFrameLODGRP1=now;
    }
    this.viscorbLocalPresentation.update(
      this.lightingSimulationDay,
      typeof performance === 'undefined' ? 0 : performance.now(),
      this.projectLocalMotion389,
    );
    this.updateBodyLod();
    this.updateInfrastructureLod386();
    this.updateMinorBodyInstanceBatches();
    this.updateSelectionProxyBatch();
    if (this.viscorbLocalPresentation.hostId !== null) {
      for (const marker of this.orbitalRiskMarkers) {
        const object = this.animatedBodies.get(marker.targetBodyId);
        if (object) marker.sprite.position.copy(object.position);
      }
    }
    for (const blackHole of this.compactBlackHoleBillboards) {
      orientCompactBlackHoleToCamera(blackHole, this.camera);
    }
    this.updateBodyLightDirections();
    // Surface shadow uses the same up-to-date stellar directions/weights.
    for (const shadow of this.orbitalSurfaceShadowBindingsVISCIV6n) {
      shadow.update(this.camera, this.layerVisibility.artificialSatellites);
    }
    this.updateColonialNightLighting386c3();
    this.updateColonySiteMarkersT7t();
    this.updateArtificialSatelliteLighting();
    if (this.compactBlackHoleBodyOcclusion.length > 0) {
      // Camera and orbital motion can both reverse near/far order at any time.
      this.scene.updateMatrixWorld(true);
      this.camera.updateMatrixWorld(true);
      const blackHole = this.compactBlackHoleBillboards[0]!;
      for (const body of this.compactBlackHoleBodyOcclusion) {
        updateCompactBlackHoleBodyOcclusion(body, blackHole, this.camera);
      }
    }

    this
      .renderer
      .render(
        this.scene,
        this.camera,
      );
  }

  private assertAlive():
    void {

    if (
      this.disposed
    ) {
      throw new Error(
        'SystemScene runtime has already been disposed.',
      );
    }
  }
}

interface SystemSceneBodyLodBindingV1 {
  readonly mesh: THREE.Mesh;
  readonly kind: SystemSceneBodyLodKindV1;
  readonly radiusScene: number;
  level: SystemSceneBodyLodLevelV1;
  readonly planetSystemIdentity?: string;
}

export interface SystemScenePlanetTextureResourceV1 {
  readonly giantAtmosphereTexture:
    SystemSceneGiantAtmosphereTextureData | null;
  readonly textureData:
    ReturnType<typeof buildSystemScenePlanetTextureV1> | null;
  readonly semanticSurface:
    SystemScenePlanetSurfaceTextureData | null;
  readonly surfaceTexture:
    THREE.DataTexture;
  readonly emissiveTexture:
    THREE.DataTexture | null;
  readonly nightLightsTexture:
    THREE.DataTexture | null;
  readonly cloudTexture:
    THREE.DataTexture | null;
  readonly roughnessTexture:
    THREE.DataTexture | null;
  readonly reliefTexture:
    THREE.DataTexture | null;
  readonly normalTexture:
    THREE.DataTexture | null;
  readonly visualSeed:
    number;
  dispose(): void;
}

export interface SystemScenePlanetVisualSeedPackV1 {
  readonly planetTextureSeedUint32: number;
  readonly surfaceTextureSeedUint32: number;
  readonly giantAtmosphereTextureSeedUint32: number | null;
}

/** VIS-3D.2 — explicit equirectangular atlas dimensions for the detailed fiche.
 * SystemScene continues using its own adaptive numeric texture widths. */
export interface SystemScenePlanetTextureDimensionsV1 {
  readonly width: number;
  readonly height: number;
}

export interface PlanetAppearance {
  /** Read-only pointer to the *existing* canonical VISCIV.1c night atlas; 38.6a uses it
   * solely to align daytime structures. Never mutates or duplicates night lights. */
  readonly nightLightsTexture: THREE.DataTexture | null;
  readonly material:
    THREE.MeshStandardMaterial;

  readonly overlays:
    readonly THREE.Object3D[];

  readonly resources:
    readonly { dispose(): void }[];

  readonly lightBinding:
    SystemScenePlanetLightBindingV1;
}

export function createSystemScenePlanetAppearanceV1(
  planet:
    SystemSceneBodySnapshot & {
      readonly visualVegetationProfile?: SystemScenePlanetVegetationProfileV1 | null;
      readonly visualCivilizationTier?: Vida7CivilizationTier | null;
    },

  systemIdentity:
    string,

  textureCache:
    SystemSceneBoundedResourceCacheV1<SystemScenePlanetTextureResourceV1> | null,

  visualSeeds:
    SystemScenePlanetVisualSeedPackV1 | null =
      null,
  /** Optical fill for bodies around compact hosts, not a physical heating term. */
  compactVisualFill: boolean | number = false,
  /** A physical stellar photosphere, never the shader's illustrative glow. */
  photosphereTemperatureKelvin: number | null = null,
  /** VIS-3D.2: inspected fiche can request 1024 × 512; normal scenes retain LOD. */
  textureDimensions: number | SystemScenePlanetTextureDimensionsV1 =
    PLANET_TEXTURE_DETAIL_SIZES_V1.distant.width,
): PlanetAppearance {
  const textureWidth = typeof textureDimensions === 'number'
    ? textureDimensions
    : textureDimensions.width;
  if (typeof textureDimensions !== 'number' &&
      textureDimensions.height !== textureWidth / 2) {
    throw new RangeError('Planet preview atlas must be equirectangular (width = 2 × height).');
  }
  const compactFillStrength = typeof compactVisualFill === 'number'
    ? Math.max(0, Math.min(1, compactVisualFill))
    : compactVisualFill ? 0.20 : 0;
  const isCompactVisual = compactVisualFill !== false;

  const textureLease =
    textureCache === null
      ? (() => {
          const resource =
            createSystemScenePlanetTextureResourceV1(
              planet,
              systemIdentity,
              visualSeeds,
              textureWidth,
            );
          let disposed = false;
          return Object.freeze({
            resource,
            cached: false,
            dispose: () => {
              if (disposed) {
                return;
              }
              disposed = true;
              resource.dispose();
            },
          });
        })()
      : textureCache.acquire(
          systemScenePlanetTextureCacheKeyVISCIV1b(systemIdentity, planet.id, textureWidth,
            planet.visualCivilizationTier, planet.visualVegetationProfile) +
            (planet.giantAtmosphere === null ? '' : `|VISCATM.${GIANT_ATMOSPHERE_DETAIL_VERSION_VISCATM1}`),
          planet.giantAtmosphere === null
            ? (planet.visualCivilizationTier === null || planet.visualCivilizationTier === undefined
                ? 1280 * 1024
                : 3584 * 1024)
            : 512 * 1024,
          () => createSystemScenePlanetTextureResourceV1(
            planet,
            systemIdentity,
            visualSeeds,
            textureWidth,
          ),
        );

  const textureResource =
    textureLease.resource;
  const giantAtmosphereTexture =
    textureResource.giantAtmosphereTexture;
  const textureData =
    textureResource.textureData;
  const semanticSurface =
    textureResource.semanticSurface;
  const visualSeed =
    textureResource.visualSeed;

  const opticalSurface = planet.surfaceEnvironment;
  const composition = opticalSurface?.retainedGasComposition;
  const knownGases = composition !== undefined && composition.every(gas =>
    Object.values(AtmosphereGas).includes(gas.gas as AtmosphereGas));
  const opticalScience = opticalSurface?.solidSurfaceAvailable === true
    ? buildAtmosphereOpticalScienceV1({
        columnKind: 'SOLID_SURFACE',
        retainedGasComposition: composition === undefined || !knownGases
          ? null
          : composition.map(component => ({
          gas: component.gas as AtmosphereGas,
          moleFraction01: component.moleFraction01,
        })),
        retainedSurfacePressurePascal: opticalSurface.retainedSurfacePressurePascal,
        meanSurfaceTemperatureKelvin: opticalSurface.meanSurfaceTemperatureKelvin,
        surfaceGravityMetersPerSecondSquared:
          planet.opticalSurfaceGravityMetersPerSecondSquared ?? null,
        referenceBolometricFluxEarth:
          planet.opticalReferenceInsolationEarth ?? null,
        stellarEffectiveTemperatureKelvin: photosphereTemperatureKelvin,
      })
    : null;

  const atmosphereOptics =
    buildSystemSceneAtmosphereOpticsV1({
      opticalScience,
      baseColorHex:
        planet.colorHex,
      surfaceStyle:
        planetTextureSurfaceStyle(
          planet,
        ),
      surfaceEnvironment:
        planet.surfaceEnvironment ===
          null
          ? null
          : {
              solidSurfaceAvailable:
                planet.surfaceEnvironment
                  .solidSurfaceAvailable,
              retainedSurfacePressurePascal:
                planet.surfaceEnvironment
                  .retainedSurfacePressurePascal,
              retainedAtmosphericWaterVaporMoleFraction01:
                planet.surfaceEnvironment
                  .retainedAtmosphericWaterVaporMoleFraction01,
              presentationCloudCoverageFraction01:
                planet.surfaceEnvironment
                  .presentationCloudCoverageFraction01,
              surfaceIceCoverageFraction01:
                planet.surfaceEnvironment
                  .surfaceIceCoverageFraction01,
              retainedGasComposition:
                planet.surfaceEnvironment
                  .retainedGasComposition,
            },
      giantAtmosphere:
        planet.giantAtmosphere ===
          null
          ? null
          : {
              methaneMoleFraction01:
                planet.giantAtmosphere
                  .methaneMoleFraction01,
              waterVaporMoleFraction01:
                planet.giantAtmosphere
                  .waterVaporMoleFraction01,
              presentationMethaneBlueing01:
                planet.giantAtmosphere
                  .presentationMethaneBlueing01,
              presentationWarmChromophore01:
                planet.giantAtmosphere
                  .presentationWarmChromophore01,
              presentationPolarHaze01:
                planet.giantAtmosphere
                  .presentationPolarHaze01,
              presentationUpperHaze01:
                planet.giantAtmosphere
                  .presentationUpperHaze01,
            },
    });

  const lightBinding:
    SystemScenePlanetLightBindingV1 =
    Object.freeze({
      lightDirectionsView:
        [
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(1, 0, 0),
        ] as const,
      lightWeightsView:
        new THREE.Vector3(1, 0, 0),
      orbitalHomeDirectionsView: [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 0, 0),
      ] as const,
      orbitalHomeFlagsView: new THREE.Vector2(0, 0),
    });

  const surfaceTexture =
    textureResource.surfaceTexture;

  const resources: Array<{ dispose(): void }> = [
    textureLease,
  ];

  const materialOptions: THREE.MeshStandardMaterialParameters = {
    color:
      0xffffff,
    map:
      surfaceTexture,
  };

  if (
    planet.giantAtmosphere !==
      null
  ) {
    materialOptions.roughness =
      clampValue(
        0.68 +
          0.18 *
            planet.giantAtmosphere
              .presentationUpperHaze01,
        0.64,
        0.90,
      );
    materialOptions.metalness =
      0;
  } else if (
    planet.surfaceEnvironment
      ?.solidSurfaceAvailable ===
      true
  ) {
    // Native Three.js per-pixel roughness/bump: water is glossy, ice has
    // fine relief, rock and regolith scatter more broadly. The field is purely
    // presentational and inherits the original fixed coverage masks.
    materialOptions.roughness = 1;
    if (textureResource.roughnessTexture !== null) {
      materialOptions.roughnessMap = textureResource.roughnessTexture;
    }
    if (textureResource.normalTexture !== null) {
      materialOptions.normalMap = textureResource.normalTexture;
      materialOptions.normalScale = new THREE.Vector2(0.98, 0.98);
    } else if (textureResource.reliefTexture !== null) {
      materialOptions.bumpMap = textureResource.reliefTexture;
      materialOptions.bumpScale = planet.radiusScene * 0.014;
    }
    materialOptions.metalness = 0.015;
  } else {
    switch (
      planet.surfaceStyle
    ) {
      case 'icy':
        materialOptions.roughness =
          0.34;
        materialOptions.metalness =
          0.01;
        break;

      case 'oceanic':
        materialOptions.roughness =
          0.56;
        materialOptions.metalness =
          0.02;
        break;

      case 'gaseous':
        materialOptions.roughness =
          0.78;
        materialOptions.metalness =
          0.01;
        break;

      default:
        materialOptions.roughness =
          0.86;
        materialOptions.metalness =
          0.03;
        break;
    }
  }

  if (
    semanticSurface
      ?.emissiveRgba !==
      null &&
    semanticSurface
      ?.emissiveRgba !==
      undefined
  ) {
      const emissiveTexture =
      textureResource.emissiveTexture;

    if (emissiveTexture !== null) {
      materialOptions.emissive =
        0xffffff;
      materialOptions.emissiveIntensity =
        0.45 +
        (
          planet.surfaceEnvironment
            ?.volcanismIndex01 ??
          0
        ) *
          0.9;
      materialOptions.emissiveMap =
        emissiveTexture;
    }
  }

  if (isCompactVisual) {
    // A bounded albedo-following visual fill, not endogenous planet emission.
    // Stronger reference irradiation raises legibility while the actual
    // PointLight + day/night shader preserve a directional day side.
    materialOptions.emissive = new THREE.Color(0xb7dfff);
    materialOptions.emissiveMap = surfaceTexture;
    materialOptions.emissiveIntensity = 0.12 + 0.32 * compactFillStrength;
  }

  const material =
    new THREE.MeshStandardMaterial(
      materialOptions,
    );

  if (
    planet.giantAtmosphere !==
      null
  ) {
    installSystemSceneGlslMaterialV1(
      material,
      buildSystemSceneGlslMaterialProfileV1({
        kind:
          'DEEP_ENVELOPE',
        giantJetSharpness01:
          planet.giantAtmosphere
            .presentationJetSharpness01,
        giantTurbulence01:
          planet.giantAtmosphere
            .presentationTurbulence01,
        giantMethaneBlueing01:
          planet.giantAtmosphere
            .presentationMethaneBlueing01,
        giantWarmChromophore01:
          planet.giantAtmosphere
            .presentationWarmChromophore01,
        giantPolarHaze01:
          planet.giantAtmosphere
            .presentationPolarHaze01,
        giantUpperHaze01:
          planet.giantAtmosphere
            .presentationUpperHaze01,
      }),
    );
  } else if (
    planet.surfaceEnvironment
      ?.solidSurfaceAvailable ===
      true
  ) {
    installSystemSceneGlslMaterialV1(
      material,
      buildSystemSceneGlslMaterialProfileV1({
        kind:
          'SOLID_SURFACE',
        liquidCoverageFraction01:
          planet.surfaceEnvironment
            .surfaceLiquidWaterCoverageFraction01 ??
          0,
        iceCoverageFraction01:
          planet.surfaceEnvironment
            .surfaceIceCoverageFraction01 ??
          0,
        desertCoverageFraction01:
          planet.surfaceEnvironment
            .presentationDesertCoverageFraction01 ??
          0,
        volcanismIndex01:
          planet.surfaceEnvironment
            .volcanismIndex01 ??
          0,
      }),
    );
  }

  installSystemSceneDayNightMaterialV1(
    material,
    isCompactVisual
      ? {
          ...buildSystemSceneDayNightMaterialProfileV1(atmosphereOptics),
          // Preserve a contrasting night side while making the planet visible.
          nightFloor01: 0.07 + 0.12 * compactFillStrength,
        }
      : buildSystemSceneDayNightMaterialProfileV1(atmosphereOptics),
    lightBinding,
    textureResource.nightLightsTexture,
  );

  // Diagnostic mode is opt-in only, never persisted. The default scene is unchanged.
  const surfaceRenderModeVISSURF5c = planet.surfaceEnvironment?.solidSurfaceAvailable === true
    ? readPlanetSurfaceRenderModeVISSURF5c()
    : 'COMPOSITE';
  installSolidSurfaceDebugShaderVISSURF5c(material, surfaceRenderModeVISSURF5c);

  const overlays: THREE.Object3D[] = [];

  const cloudLayer = !showPlanetOpticalLayerVISSURF5c(surfaceRenderModeVISSURF5c, 'CLOUDS') ? null :
    cloudLayerMeshOrNull(
      planet,
      semanticSurface,
      giantAtmosphereTexture,
      textureResource.cloudTexture,
      visualSeed,
      atmosphereOptics,
      lightBinding,
    );

  if (
    cloudLayer !==
    null
  ) {
    overlays.push(
      cloudLayer.mesh,
    );

    resources.push(
      cloudLayer.geometry,
      cloudLayer.material,
    );
  }

  const atmosphere = !showPlanetOpticalLayerVISSURF5c(surfaceRenderModeVISSURF5c, 'ATMOSPHERE') ? null :
    atmosphereLayerMeshOrNull(
      planet,
      atmosphereOptics,
      lightBinding,
      planet.giantAtmosphere !== null && textureWidth >= 512,
    );

  if (
    atmosphere !==
    null
  ) {
    overlays.push(
      atmosphere.mesh,
    );

    resources.push(
      atmosphere.geometry,
      atmosphere.material,
    );
  }

  return Object.freeze({
    material,
    nightLightsTexture: textureResource.nightLightsTexture,
    overlays:
      Object.freeze(overlays),
    resources:
      Object.freeze(resources),
    lightBinding,
  });
}


function createSystemScenePlanetTextureResourceV1(
  planet:
    SystemSceneBodySnapshot & {
      readonly visualVegetationProfile?: SystemScenePlanetVegetationProfileV1 | null;
      readonly visualCivilizationTier?: Vida7CivilizationTier | null;
    },

  systemIdentity:
    string,

  visualSeeds:
    SystemScenePlanetVisualSeedPackV1 | null =
      null,
  textureWidth: number = PLANET_TEXTURE_DETAIL_SIZES_V1.distant.width,
): SystemScenePlanetTextureResourceV1 {

  const giantAtmosphereTexture =
    planet.giantAtmosphere ===
      null
      ? null
      : buildSystemSceneGiantAtmosphereTextureV1({
          systemIdentity,
          planetId: planet.id,
          atmosphere: planet.giantAtmosphere,
          visualSeedUint32:
            visualSeeds?.giantAtmosphereTextureSeedUint32 ??
            undefined,
        });

  const textureData =
    giantAtmosphereTexture ===
      null
      ? buildSystemScenePlanetTextureV1({
          systemIdentity,
          planetId: planet.id,
          surfaceStyle: planetTextureSurfaceStyle(planet),
          baseColorHex: planet.colorHex,
          visualSeedUint32:
            visualSeeds?.planetTextureSeedUint32,
        })
      : null;

  const semanticSurface =
    giantAtmosphereTexture !== null ||
    planet.surfaceEnvironment === null ||
    textureData === null
      ? null
      : buildSystemScenePlanetSurfaceTextureV1({
          systemIdentity,
          planetId: planet.id,
          baseTexture: textureData,
          surface: planet.surfaceEnvironment,
          vegetationProfile:
            planet.visualVegetationProfile ?? undefined,
          nightCivilizationTier:
            planet.visualCivilizationTier ?? null,
          visualSeedUint32:
            visualSeeds?.surfaceTextureSeedUint32,
        });

  const visualSeed =
    giantAtmosphereTexture?.seedUint32 ??
    textureData!.seedUint32;

  // VISSURF.2: generate subpixel geography in a shared UV domain, with
  // per-material coverage conserved and D.4d science/clouds unchanged.
  const detailedSolidSurface = semanticSurface?.surfaceClassMask && textureWidth > semanticSurface.width
    ? composeSolidPlanetMaterialsVISSURF5d(
        buildCoherentSolidPlanetSurfaceVISSURF5(semanticSurface, textureWidth,
          visualSeeds?.surfaceTextureSeedUint32 ??
            systemScenePlanetSurfaceTextureSeedV1(systemIdentity, planet.id)),
        visualSeeds?.surfaceTextureSeedUint32 ??
          systemScenePlanetSurfaceTextureSeedV1(systemIdentity, planet.id))
    : null;
  if (detailedSolidSurface !== null) {
    calibrateSolidRoughnessForRendererVISSURF5c(
      detailedSolidSurface.roughnessRgba, detailedSolidSurface.classMask);
  }
  // High resolution is a visual reconstruction of the frozen D.4d atlas.
  // The measured surface coverages and private biological records never change.
  const refine = (
    rgba: Uint8Array,
    width: number,
    height: number,
    kind: PlanetTextureRefinementKind,
  ): Uint8Array => textureWidth === width
    ? rgba
    : giantAtmosphereTexture !== null && kind === 'GAS'
      ? refineGiantAtmosphereMultiresVISCATM1(
          rgba, width, height, textureWidth, visualSeed,
          planet.giantAtmosphere!, 'CLOUD_TOPS',
        )
      : refinePlanetRgbaTextureV1(rgba, width, height, textureWidth, visualSeed, kind);
  const imageWidth = textureWidth;
  const imageHeight = textureWidth / 2;

  const surfaceTexture =
    giantAtmosphereTexture !== null
      ? createRgbaDataTexture(
          imageWidth,
          imageHeight,
          refine(giantAtmosphereTexture.albedoRgba, giantAtmosphereTexture.width, giantAtmosphereTexture.height, 'GAS'),
          `GENESIS cached deep-envelope cloud tops 25.11 v${giantAtmosphereTexture.version}`,
        )
      : createPlanetSurfaceTexture(
          {
            width: imageWidth,
            height: imageHeight,
            rgba: detailedSolidSurface?.rgba ?? refine((semanticSurface ?? textureData!).rgba,
              (semanticSurface ?? textureData!).width,
              (semanticSurface ?? textureData!).height, 'COLOR'),
          },
          semanticSurface === null
            ? `GENESIS cached procedural planet albedo 25.11 v${textureData!.version}`
            : `GENESIS cached physical surface 25.11 v${semanticSurface.version}`,
        );

  // VISCATM.1: a zoomed SystemScene planet must reuse the exact canonical
  // cloud-top identity used by its fiche, not the generic rocky-planet seed.
  if (giantAtmosphereTexture !== null) {
    surfaceTexture.userData['genesisGiantAtmosphereSeedVISCATM1'] = visualSeed;
  }
  if (semanticSurface?.surfaceClassMask) {
    surfaceTexture.userData['genesisSolidSurfaceSourceVISSURF1'] = semanticSurface;
    surfaceTexture.userData['genesisSolidSurfaceSeedVISSURF1'] =
      visualSeeds?.surfaceTextureSeedUint32 ??
        systemScenePlanetSurfaceTextureSeedV1(systemIdentity, planet.id);
  }

  const emissiveTexture =
    semanticSurface?.emissiveRgba === null ||
    semanticSurface?.emissiveRgba === undefined
      ? null
      : createRgbaDataTexture(
          imageWidth,
          imageHeight,
          refine(semanticSurface.emissiveRgba, semanticSurface.width, semanticSurface.height, 'EMISSION'),
          'GENESIS cached volcanism 25.11',
        );

  const canonicalNightLightsAtlas = planet.visualCivilizationTier &&
    semanticSurface?.nightLandMask &&
    planet.surfaceEnvironment?.solidSurfaceAvailable === true
    ? buildSystemScenePlanetNightLightsV1({
        landMask: semanticSurface.nightLandMask,
        maskWidth: semanticSurface.width,
        maskHeight: semanticSurface.height,
        width: PLANET_TEXTURE_DETAIL_SIZES_V1.scientificPreview.width,
        height: PLANET_TEXTURE_DETAIL_SIZES_V1.scientificPreview.height,
        seedUint32: visualSeeds?.surfaceTextureSeedUint32 ??
          systemScenePlanetSurfaceTextureSeedV1(systemIdentity, planet.id),
        tier: planet.visualCivilizationTier,
      })
    : null;

  const nightLightsTexture = canonicalNightLightsAtlas === null
    ? null
    : createRgbaDataTexture(
        canonicalNightLightsAtlas.width,
        canonicalNightLightsAtlas.height,
        // VISCIV.1c hotfix: the system scene must display the very same
        // deterministic city pattern as the planetary fiche. Keep the
        // canonical atlas instead of regenerating/downsampling another one.
        canonicalNightLightsAtlas.rgba,
        'GENESIS VISCIV.1c canonical civilization night lights',
      );

  // VISSURF.1: explicit cloud budget independent from new solid-surface detail.
  const cloudWidth = Math.min(textureWidth, PLANET_TEXTURE_DETAIL_SIZES_V1.scientificPreview.width);
  const refineCloud = (rgba: Uint8Array, width: number, height: number,
    kind: 'CLOUD' | 'WEATHER_CLOUD'): Uint8Array => cloudWidth === width
    ? rgba : giantAtmosphereTexture !== null && kind === 'CLOUD'
      ? refineGiantAtmosphereMultiresVISCATM1(
          rgba, width, height, cloudWidth, visualSeed,
          planet.giantAtmosphere!, 'UPPER_HAZE',
        )
      : refinePlanetRgbaTextureV1(rgba, width, height, cloudWidth, visualSeed, kind);
  const cloudTexture =
    semanticSurface?.cloudRgba !== null &&
    semanticSurface?.cloudRgba !== undefined
      ? createRgbaDataTexture(
          cloudWidth,
          cloudWidth / 2,
          refineCloud(semanticSurface.cloudRgba, semanticSurface.width, semanticSurface.height, 'WEATHER_CLOUD'),
          'GENESIS cached physical cloud projection 25.11',
        )
      : giantAtmosphereTexture?.upperHazeRgba !== null &&
        giantAtmosphereTexture?.upperHazeRgba !== undefined
        ? createRgbaDataTexture(
            cloudWidth,
            cloudWidth / 2,
            refineCloud(giantAtmosphereTexture.upperHazeRgba, giantAtmosphereTexture.width, giantAtmosphereTexture.height, 'CLOUD'),
            `GENESIS cached upper haze 25.11 v${giantAtmosphereTexture.version}`,
          )
        : null;

  const roughnessTexture = semanticSurface?.roughnessRgba
    ? createRgbaDataTexture(
        imageWidth, imageHeight,
        detailedSolidSurface?.roughnessRgba ??
          refine(semanticSurface.roughnessRgba, semanticSurface.width, semanticSurface.height, 'DATA'),
        'GENESIS D.4c visual surface roughness',
      )
    : null;
  const reliefTexture = semanticSurface?.reliefRgba
    ? createRgbaDataTexture(
        imageWidth, imageHeight,
        detailedSolidSurface?.reliefRgba ??
          refine(semanticSurface.reliefRgba, semanticSurface.width, semanticSurface.height, 'DATA'),
        'GENESIS D.4c visual microrelief',
      )
    : null;
  const normalTexture = detailedSolidSurface?.normalRgba
    ? createRgbaDataTexture(imageWidth, imageHeight, detailedSolidSurface.normalRgba,
        'GENESIS VISSURF.5 coherent surface normals')
    : null;
  // Distinct color/data color spaces and coherent filtering at grazing angles.
  // These settings apply only to solid surfaces; cloud textures are untouched.
  if (semanticSurface?.surfaceClassMask) {
    prepareSolidSurfaceDataTextureVISSURF5c(surfaceTexture, 'COLOR');
    prepareSolidSurfaceDataTextureVISSURF5c(roughnessTexture, 'ROUGHNESS');
    prepareSolidSurfaceDataTextureVISSURF5c(reliefTexture, 'RELIEF');
    prepareSolidSurfaceDataTextureVISSURF5c(normalTexture, 'NORMAL');
  } else {
    if (roughnessTexture !== null) roughnessTexture.colorSpace = THREE.NoColorSpace;
    if (reliefTexture !== null) reliefTexture.colorSpace = THREE.NoColorSpace;
    if (normalTexture !== null) normalTexture.colorSpace = THREE.NoColorSpace;
  }

  let disposed = false;
  return Object.freeze({
    giantAtmosphereTexture,
    textureData,
    semanticSurface,
    surfaceTexture,
    emissiveTexture,
    nightLightsTexture,
    cloudTexture,
    roughnessTexture,
    reliefTexture,
    normalTexture,
    visualSeed,
    dispose: () => {
      if (disposed) {
        return;
      }
      disposed = true;
      surfaceTexture.dispose();
      emissiveTexture?.dispose();
      nightLightsTexture?.dispose();
      cloudTexture?.dispose();
      roughnessTexture?.dispose();
      reliefTexture?.dispose();
      normalTexture?.dispose();
    },
  });
}

function planetTextureSurfaceStyle(
  planet:
    SystemSceneBodySnapshot,
): SystemScenePlanetTextureSurfaceStyle {

  switch (
    planet.surfaceStyle
  ) {
    case 'rocky':
    case 'oceanic':
    case 'icy':
    case 'gaseous':
    case 'volcanic':
      return planet.surfaceStyle;

    case 'emissive':
      throw new RangeError(
        `Planet ${planet.id} cannot use the stellar emissive surface style.`,
      );
  }
}

interface RgbaTextureData {
  readonly width:
    number;

  readonly height:
    number;

  readonly rgba:
    Uint8Array;
}

function createPlanetSurfaceTexture(
  textureData:
    RgbaTextureData,

  name:
    string,
): THREE.DataTexture {

  return createRgbaDataTexture(
    textureData.width,
    textureData.height,
    textureData.rgba,
    name,
  );
}

function createRgbaDataTexture(
  width:
    number,

  height:
    number,

  rgba:
    Uint8Array,

  name:
    string,
): THREE.DataTexture {

  const texture =
    new THREE.DataTexture(
      rgba,
      width,
      height,
      THREE.RGBAFormat,
      THREE.UnsignedByteType,
    );

  texture.name =
    name;
  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.wrapS =
    THREE.RepeatWrapping;
  texture.wrapT =
    THREE.ClampToEdgeWrapping;
  texture.magFilter =
    THREE.LinearFilter;
  texture.minFilter =
    THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps =
    true;
  texture.flipY =
    true;
  texture.needsUpdate =
    true;

  return texture;
}

function cloudLayerMeshOrNull(
  planet:
    SystemSceneBodySnapshot,

  semanticSurface:
    SystemScenePlanetSurfaceTextureData | null,

  giantAtmosphereTexture:
    SystemSceneGiantAtmosphereTextureData | null,

  cachedCloudTexture:
    THREE.DataTexture | null,

  seed:
    number,

  atmosphereOptics:
    SystemSceneAtmosphereOpticsV1,

  lightBinding:
    SystemScenePlanetLightBindingV1,
): {
  readonly mesh:
    THREE.Mesh;

  readonly geometry:
    THREE.SphereGeometry;

  readonly material:
    THREE.MeshStandardMaterial;
} | null {

  if (
    semanticSurface !==
      null &&
    planet.surfaceEnvironment
      ?.solidSurfaceAvailable ===
      true
  ) {
    if (
      semanticSurface.cloudRgba ===
      null
    ) {
      return null;
    }

    const texture =
      cachedCloudTexture;

    if (texture === null) {
      return null;
    }

    const segments =
      systemSceneSphereSegments(
        'planet',
      );

    const geometry =
      new THREE.SphereGeometry(
        planet.radiusScene *
          1.024,
        segments.widthSegments,
        segments.heightSegments,
      );

    const material =
      new THREE.MeshStandardMaterial({
        color:
          0xffffff,
        map:
          texture,
        transparent:
          true,
        opacity:
          0.91,
        // VIS3D.2f: preserve the feathered cirrus alpha edge. The former
        // cutout threshold made faint vapor look like a hard-edged decal.
        alphaTest:
          0,
        depthWrite:
          false,
        roughness:
          0.96,
        metalness:
          0,
      });

    installSystemSceneDayNightMaterialV1(
      material,
      buildSystemSceneDayNightMaterialProfileV1(
        atmosphereOptics,
      ),
      lightBinding,
    );

    const mesh =
      new THREE.Mesh(
        geometry,
        material,
      );

    mesh.rotation.y =
      ((seed >>> 9) & 0xff) /
      255 *
      Math.PI *
      2;

    return Object.freeze({
      mesh,
      geometry,
      material,
    });
  }

  if (
    giantAtmosphereTexture ===
      null ||
    giantAtmosphereTexture.upperHazeRgba ===
      null
  ) {
    return null;
  }

  const texture =
    cachedCloudTexture;

  if (texture === null) {
    return null;
  }

  const giantCloudWidth = (cachedCloudTexture?.image as {width?: number} | undefined)?.width ?? 256;
  const segments = giantCloudWidth >= 512
    ? GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C
    : systemSceneSphereSegments('planet');

  const geometry =
    new THREE.SphereGeometry(
      planet.radiusScene *
        1.018,
      segments.widthSegments,
      segments.heightSegments,
    );

  const material =
    new THREE.MeshStandardMaterial({
      color:
        0xffffff,
      map:
        texture,
      transparent:
        true,
      opacity:
        0.56, // VISCATM.1b: preserve cloud-top detail through upper haze
      // VISCATM.1c: preserve subpixel cloud-edge transparency instead of
      // hard alpha cutouts on individual triangles at the limb.
      alphaTest:
        0,
      depthWrite:
        false,
      roughness:
        0.98,
      metalness:
        0,
    });

  installSystemSceneDayNightMaterialV1(
    material,
    buildSystemSceneDayNightMaterialProfileV1(
      atmosphereOptics,
    ),
    lightBinding,
  );

  const mesh =
    new THREE.Mesh(
      geometry,
      material,
    );

  mesh.rotation.y =
    ((seed >>> 9) & 0xff) /
    255 *
    Math.PI *
    2;

  return Object.freeze({
    mesh,
    geometry,
    material,
  });
}

function atmosphereLayerMeshOrNull(
  planet:
    SystemSceneBodySnapshot,

  optics:
    SystemSceneAtmosphereOpticsV1,

  lightBinding:
    SystemScenePlanetLightBindingV1,

  highDetailGiantVISCATM1c = false,
): {
  readonly mesh:
    THREE.Mesh;

  readonly geometry:
    THREE.SphereGeometry;

  readonly material:
    THREE.ShaderMaterial;
} | null {

  const material =
    createSystemSceneAtmosphereShellMaterialV1(
      optics,
      lightBinding,
    );

  if (
    material ===
      null
  ) {
    return null;
  }

  const segments = highDetailGiantVISCATM1c && optics.deepEnvelope
    ? GIANT_ATMOSPHERE_FINE_SEGMENTS_VISCATM1C
    : systemSceneSphereSegments('planet');

  const geometry =
    new THREE.SphereGeometry(
      planet.radiusScene *
        optics.presentationShellScale,
      segments.widthSegments,
      segments.heightSegments,
    );

  const mesh =
    new THREE.Mesh(
      geometry,
      material,
    );

  mesh.name =
    `${planet.label} atmosphere 25.6`;
  mesh.renderOrder =
    4;

  return Object.freeze({
    mesh,
    geometry,
    material,
  });
}


function insertTopPlanetLightContribution(
  topFluxes:
    [number, number, number] | number[],

  topDirections:
    readonly [
      THREE.Vector3,
      THREE.Vector3,
      THREE.Vector3,
    ],

  flux:
    number,

  direction:
    THREE.Vector3,
): void {

  if (
    !Number.isFinite(flux) ||
    flux <= 0
  ) {
    return;
  }

  for (
    let index =
      0;
    index < 3;
    index += 1
  ) {
    if (
      flux <=
      topFluxes[index]!
    ) {
      continue;
    }

    for (
      let shift =
        2;
      shift > index;
      shift -= 1
    ) {
      topFluxes[shift] =
        topFluxes[
          shift - 1
        ]!;
      topDirections[shift].copy(
        topDirections[
          shift - 1
        ],
      );
    }

    topFluxes[index] =
      flux;
    topDirections[index].copy(
      direction,
    );
    return;
  }
}

function assignPlanetLightBindingView(
  binding:
    SystemScenePlanetLightBindingV1,

  topFluxes:
    readonly [number, number, number] | readonly number[],

  topDirections:
    readonly [
      THREE.Vector3,
      THREE.Vector3,
      THREE.Vector3,
    ],

  cameraMatrixWorldInverse:
    THREE.Matrix4,
): number {

  const compressed0 =
    Math.sqrt(
      Math.max(
        topFluxes[0] ?? 0,
        0,
      ),
    );
  const compressed1 =
    Math.sqrt(
      Math.max(
        topFluxes[1] ?? 0,
        0,
      ),
    );
  const compressed2 =
    Math.sqrt(
      Math.max(
        topFluxes[2] ?? 0,
        0,
      ),
    );

  const compressedSum =
    compressed0 +
    compressed1 +
    compressed2;

  if (
    compressedSum <=
    1e-9
  ) {
    return 0;
  }

  const weight0 =
    compressed0 /
    compressedSum;
  const weight1 =
    compressed1 /
    compressedSum;
  const weight2 =
    compressed2 /
    compressedSum;

  for (
    let index =
      0;
    index < 3;
    index += 1
  ) {
    binding.lightDirectionsView[index]
      .copy(
        topDirections[index],
      )
      .transformDirection(
        cameraMatrixWorldInverse,
      );
  }

  binding.lightWeightsView.set(
    weight0,
    weight1,
    weight2,
  );

  return compressedSum;
}

function stellarSpriteMaterial(
  texture:
    THREE.Texture,

  color:
    THREE.ColorRepresentation,

  opacity:
    number,
): THREE.SpriteMaterial {

  return new THREE.SpriteMaterial({
    map:
      texture,
    color,
    transparent:
      true,
    opacity,
    blending:
      THREE.AdditiveBlending,
    depthWrite:
      false,
    toneMapped:
      false,
  });
}

interface StellarOpticalProfile {
  readonly energy01:
    number;

  readonly coronaDiameterScale:
    number;

  readonly bloomDiameterScale:
    number;

  readonly aureoleDiameterScale:
    number;

  readonly glareDiameterScale:
    number;

  readonly coronaOpacity:
    number;

  readonly bloomOpacity:
    number;

  readonly aureoleOpacity:
    number;

  readonly glareOpacity:
    number;
}

function stellarOpticalProfile(
  star:
    SystemSceneBodySnapshot,
): StellarOpticalProfile {

  const rgb =
    parseDisplayHexColor(
      star.colorHex,
    );

  const luminance =
    (
      0.2126 *
        rgb.red +
      0.7152 *
        rgb.green +
      0.0722 *
        rgb.blue
    ) /
    255;

  const blueBias =
    clamp01(
      0.5 +
      (
        rgb.blue -
        rgb.red
      ) /
        510,
    );

  const opticalRadiusScene =
    star.opticalRadiusScene ??
    star.radiusScene;

  const sizeEnergy =
    clamp01(
      (
        opticalRadiusScene -
        0.16
      ) /
      (
        0.46 -
        0.16
      ),
    );

  const massEnergy =
    clamp01(
      (
        star.lightIntensity -
        1.2
      ) /
      (
        3.4 -
        1.2
      ),
    );

  const energy01 =
    clamp01(
      0.14 +
      0.24 *
        luminance +
      0.18 *
        blueBias +
      0.20 *
        sizeEnergy +
      0.24 *
        massEnergy,
    );

  return Object.freeze({
    energy01,
    coronaDiameterScale:
      2 *
      (
        4.9 +
        3.9 *
          energy01
      ),
    bloomDiameterScale:
      2 *
      (
        3.05 +
        2.05 *
          energy01
      ),
    aureoleDiameterScale:
      2 *
      (
        1.95 +
        1.05 *
          energy01
      ),
    glareDiameterScale:
      2 *
      (
        9.2 +
        8.6 *
          energy01
      ),
    coronaOpacity:
      0.16 +
      0.16 *
        energy01,
    bloomOpacity:
      0.30 +
      0.26 *
        energy01,
    aureoleOpacity:
      0.36 +
      0.28 *
        energy01,
    glareOpacity:
      0.58 +
      0.22 *
        energy01,
  });
}

function stellarDiffractionColor(
  stellarColorHex:
    string,

  energy01:
    number,
): THREE.Color {

  const stellar =
    new THREE.Color(
      stellarColorHex,
    );

  return stellar.lerp(
    new THREE.Color(
      0xffffff,
    ),
    0.34 +
      0.18 *
        energy01,
  );
}

function parseDisplayHexColor(
  colorHex:
    string,
): {
  readonly red:
    number;

  readonly green:
    number;

  readonly blue:
    number;
} {

  const normalized =
    colorHex.startsWith(
      '#',
    )
      ? colorHex.slice(
          1,
        )
      : colorHex;

  if (
    normalized.length !==
      6
  ) {
    return Object.freeze({
      red: 255,
      green: 255,
      blue: 255,
    });
  }

  const value =
    Number.parseInt(
      normalized,
      16,
    );

  if (
    !Number.isFinite(
      value,
    )
  ) {
    return Object.freeze({
      red: 255,
      green: 255,
      blue: 255,
    });
  }

  return Object.freeze({
    red:
      value >>
        16 &
      0xff,
    green:
      value >>
        8 &
      0xff,
    blue:
      value &
      0xff,
  });
}

function clampValue(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {

  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
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

function createRadialGlowTexture(
  kind:
    'broad' |
    'compact',
): THREE.CanvasTexture {

  const size =
    256;

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    size;
  canvas.height =
    size;

  const context =
    canvas.getContext(
      '2d',
    );

  if (
    context ===
    null
  ) {
    throw new Error(
      'Unable to create stellar glow texture.',
    );
  }

  const center =
    size /
    2;

  const gradient =
    context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      center,
    );

  if (
    kind ===
    'compact'
  ) {
    gradient.addColorStop(
      0,
      'rgba(255,255,255,0.96)',
    );
    gradient.addColorStop(
      0.12,
      'rgba(255,255,255,0.82)',
    );
    gradient.addColorStop(
      0.30,
      'rgba(255,255,255,0.34)',
    );
    gradient.addColorStop(
      0.58,
      'rgba(255,255,255,0.075)',
    );
    gradient.addColorStop(
      1,
      'rgba(255,255,255,0)',
    );
  } else {
    gradient.addColorStop(
      0,
      'rgba(255,255,255,0.70)',
    );
    gradient.addColorStop(
      0.16,
      'rgba(255,255,255,0.36)',
    );
    gradient.addColorStop(
      0.40,
      'rgba(255,255,255,0.12)',
    );
    gradient.addColorStop(
      0.72,
      'rgba(255,255,255,0.025)',
    );
    gradient.addColorStop(
      1,
      'rgba(255,255,255,0)',
    );
  }

  context.fillStyle =
    gradient;
  context.fillRect(
    0,
    0,
    size,
    size,
  );

  const texture =
    new THREE.CanvasTexture(
      canvas,
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.needsUpdate =
    true;

  return texture;
}

function createSelectionRingTexture():
  THREE.CanvasTexture {

  const size =
    256;

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    size;
  canvas.height =
    size;

  const context =
    canvas.getContext(
      '2d',
    );

  if (
    context ===
      null
  ) {
    throw new Error(
      'Unable to create system-scene selection texture.',
    );
  }

  const center =
    size /
    2;

  context.clearRect(
    0,
    0,
    size,
    size,
  );

  const glow =
    context.createRadialGradient(
      center,
      center,
      size *
        0.31,
      center,
      center,
      size *
        0.48,
    );

  glow.addColorStop(
    0,
    'rgba(255,255,255,0)',
  );
  glow.addColorStop(
    0.52,
    'rgba(255,255,255,0.04)',
  );
  glow.addColorStop(
    0.72,
    'rgba(255,255,255,0.72)',
  );
  glow.addColorStop(
    0.80,
    'rgba(255,255,255,0.98)',
  );
  glow.addColorStop(
    0.88,
    'rgba(255,255,255,0.28)',
  );
  glow.addColorStop(
    1,
    'rgba(255,255,255,0)',
  );

  context.fillStyle =
    glow;
  context.fillRect(
    0,
    0,
    size,
    size,
  );

  const texture =
    new THREE.CanvasTexture(
      canvas,
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.needsUpdate =
    true;

  return texture;
}

function createStellarGlareTexture():
  THREE.CanvasTexture {

  const size =
    512;

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    size;
  canvas.height =
    size;

  const context =
    canvas.getContext(
      '2d',
    );

  if (
    context ===
    null
  ) {
    throw new Error(
      'Unable to create stellar diffraction texture.',
    );
  }

  const center =
    size /
    2;

  const centralGlow =
    context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      54,
    );

  centralGlow.addColorStop(
    0,
    'rgba(255,255,255,0.95)',
  );
  centralGlow.addColorStop(
    0.18,
    'rgba(255,255,255,0.42)',
  );
  centralGlow.addColorStop(
    0.55,
    'rgba(255,255,255,0.08)',
  );
  centralGlow.addColorStop(
    1,
    'rgba(255,255,255,0)',
  );

  context.fillStyle =
    centralGlow;
  context.fillRect(
    center -
      54,
    center -
      54,
    108,
    108,
  );

  drawDiffractionBeam(
    context,
    center,
    0,
    158,
    5.4,
    0.20,
    14,
  );
  drawDiffractionBeam(
    context,
    center,
    Math.PI /
      2,
    226,
    5.8,
    0.22,
    15,
  );

  drawDiffractionBeam(
    context,
    center,
    0,
    172,
    1.15,
    0.92,
    4.5,
  );
  drawDiffractionBeam(
    context,
    center,
    Math.PI /
      2,
    232,
    1.15,
    0.96,
    4.5,
  );

  drawDiffractionBeam(
    context,
    center,
    Math.PI /
      4,
    105,
    0.95,
    0.48,
    3.2,
  );
  drawDiffractionBeam(
    context,
    center,
    -Math.PI /
      4,
    105,
    0.95,
    0.48,
    3.2,
  );

  drawDiffractionBeam(
    context,
    center,
    Math.PI /
      8,
    72,
    0.72,
    0.28,
    2.4,
  );
  drawDiffractionBeam(
    context,
    center,
    Math.PI /
      8 +
      Math.PI /
        2,
    72,
    0.72,
    0.28,
    2.4,
  );

  const texture =
    new THREE.CanvasTexture(
      canvas,
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.needsUpdate =
    true;

  return texture;
}

function drawDiffractionBeam(
  context:
    CanvasRenderingContext2D,

  center:
    number,

  angleRadians:
    number,

  halfLength:
    number,

  lineWidth:
    number,

  opacity:
    number,

  blurPixels:
    number,
): void {

  context.save();
  context.translate(
    center,
    center,
  );
  context.rotate(
    angleRadians,
  );

  const gradient =
    context.createLinearGradient(
      -halfLength,
      0,
      halfLength,
      0,
    );

  gradient.addColorStop(
    0,
    'rgba(255,255,255,0)',
  );
  gradient.addColorStop(
    0.34,
    `rgba(255,255,255,${opacity * 0.18})`,
  );
  gradient.addColorStop(
    0.485,
    `rgba(255,255,255,${opacity * 0.72})`,
  );
  gradient.addColorStop(
    0.5,
    `rgba(255,255,255,${opacity})`,
  );
  gradient.addColorStop(
    0.515,
    `rgba(255,255,255,${opacity * 0.72})`,
  );
  gradient.addColorStop(
    0.66,
    `rgba(255,255,255,${opacity * 0.18})`,
  );
  gradient.addColorStop(
    1,
    'rgba(255,255,255,0)',
  );

  context.strokeStyle =
    gradient;
  context.lineWidth =
    lineWidth;
  context.lineCap =
    'round';
  context.shadowColor =
    `rgba(255,255,255,${opacity * 0.72})`;
  context.shadowBlur =
    blurPixels;

  context.beginPath();
  context.moveTo(
    -halfLength,
    0,
  );
  context.lineTo(
    halfLength,
    0,
  );
  context.stroke();
  context.restore();
}

function rotateOrbitPoint(
  localX:
    number,

  localZ:
    number,

  rotationDegrees:
    number,

  inclinationDegrees:
    number,
): {
  readonly x:
    number;

  readonly y:
    number;

  readonly z:
    number;
} {

  const rotationRadians =
    rotationDegrees *
    Math.PI /
    180;

  const inclinationRadians =
    inclinationDegrees *
    Math.PI /
    180;

  const x1 =
    localX;

  const y1 =
    -localZ *
    Math.sin(
      inclinationRadians,
    );

  const z1 =
    localZ *
    Math.cos(
      inclinationRadians,
    );

  const cosRotation =
    Math.cos(
      rotationRadians,
    );

  const sinRotation =
    Math.sin(
      rotationRadians,
    );

  return Object.freeze({
    x:
      x1 *
        cosRotation -
      z1 *
        sinRotation,
    y:
      y1,
    z:
      x1 *
        sinRotation +
      z1 *
        cosRotation,
  });
}

function createBackdropStarField(
  root:
    THREE.Group,

  disposables:
    Array<{ dispose(): void }>,
): void {

  const positions =
    new Float32Array(
      700 * 3,
    );

  for (
    let index = 0;
    index <
      700;
    index += 1
  ) {
    const radius =
      78 +
      pseudoRandom(
        index,
        0,
      ) *
        54;

    const theta =
      pseudoRandom(
        index,
        1,
      ) *
      Math.PI *
      2;

    const phi =
      Math.acos(
        pseudoRandom(
          index,
          2,
        ) *
          2 -
          1,
      );

    const x =
      radius *
      Math.sin(
        phi,
      ) *
      Math.cos(
        theta,
      );

    const y =
      radius *
      Math.cos(
        phi,
      );

    const z =
      radius *
      Math.sin(
        phi,
      ) *
      Math.sin(
        theta,
      );

    positions[index * 3] =
      x;
    positions[index * 3 + 1] =
      y;
    positions[index * 3 + 2] =
      z;
  }

  const geometry =
    new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      positions,
      3,
    ),
  );

  const material =
    new THREE.PointsMaterial({
      color:
        0xaec9dc,
      size:
        0.55,
      sizeAttenuation:
        true,
      transparent:
        true,
      opacity:
        0.7,
      depthWrite:
        false,
    });

  const points =
    new THREE.Points(
      geometry,
      material,
    );

  points.name =
    'Backdrop stars';

  root.add(
    points,
  );

  disposables.push(
    geometry,
    material,
  );
}



function pseudoRandom(
  index:
    number,

  salt:
    number,
): number {

  const x =
    Math.sin(
      index * 12.9898 +
      salt * 78.233,
    ) *
    43758.5453123;

  return x -
    Math.floor(
      x,
    );
}

function objectHierarchyVisible(
  object:
    THREE.Object3D,
): boolean {

  let current:
    THREE.Object3D | null =
    object;

  while (
    current !==
    null
  ) {
    if (
      !current.visible
    ) {
      return false;
    }

    current =
      current.parent;
  }

  return true;
}

function countDescendants(
  root:
    THREE.Object3D,
): number {

  let count =
    0;

  root.traverse(
    object => {
      if (
        object !==
        root
      ) {
        count += 1;
      }
    },
  );

  return count;
}

function disposeResources(
  resources:
    Array<{ dispose(): void }>,
): void {

  while (
    resources.length >
    0
  ) {
    resources
      .pop()
      ?.dispose();
  }
}
