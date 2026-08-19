import {
  isPlatformBrowser,
} from '@angular/common';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import * as THREE from 'three';

import {
  ProceduralWorkerClient,
} from '../runtime/procedural-worker/procedural-worker.client';

import {
  type ProceduralWorkerRuntime,
} from '../runtime/procedural-worker/procedural-worker.protocol';

import {
  type GalacticMapWorkerParticleBatch,
  type GalacticMapWorkerParticleWindow,
} from '../runtime/procedural-worker/galactic-map-particle-worker-session';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  GalacticMapCameraController,
  type GalacticMapCameraState,
  type GalacticMapVisualSelection,
} from './galactic-map-camera-controller';

import {
  createGalacticMapDiscoveryMarkerOverlay,
  type GalacticMapDiscoveryMarkerOverlay,
} from './galactic-map-discovery-marker-overlay';

import {
  GalacticMapDiscoveryMarkerKind,
  type GalacticMapDiscoveryMarker,
} from './galactic-map-discovery-markers';

import {
  createGalacticMapEnvironmentalOverlay,
  type GalacticMapEnvironmentalOverlay,
} from './galactic-map-environmental-overlay';

import {
  GalacticMapLayerControls,
  type GalacticMapLayerVisibilityChange,
} from './galactic-map-layer-controls';

import {
  INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
  type GalacticMapLayerVisibility,
  withGalacticMapLayerVisibility,
} from './galactic-map-layer-state';

import {
  type GalacticMapModel,
} from './galactic-map-model';

import {
  galacticMapRelativeRegionLabel,
  resolveGalacticMapRelativePosition,
  type GalacticMapRelativePosition,
  type GalacticMapRelativeRegion,
} from './galactic-map-relative-position';

import {
  createGalacticMapParticleRenderInput,
} from './galactic-map-particle-render-input';

import {
  galacticMapParticleSectorIndexConfig,
} from './galactic-map-particle-sector-index-config';

import {
  createGalacticMapSectorOverlay,
  sectorCellSize,
  sectorLocalPosition,
  type GalacticMapSectorOverlay,
} from './galactic-map-sector-overlay';

import {
  resolveGalacticMapSectorSelection,
  type GalacticMapSectorSelection,
} from './galactic-map-sector-selection';

import {
  GalacticMapLodLevel,
  resolveGalacticMapVisibleSectorWindow,
  type GalacticMapVisibleSectorWindow,
} from './galactic-map-visible-sector-lod';

const CLICK_MAX_MOVEMENT_PX =
  6;

let galacticMapParticleSessionSequence =
  0;

export interface GalacticMapSceneRenderInfo {
  readonly particleCount:
    number;
}

export interface GalacticMapLodState {
  readonly sourceParticleCount:
    number;

  readonly materializedParticleCount:
    number;

  readonly visibleSectorCount:
    number;

  readonly activeSectorCount:
    number;

  readonly lodLevel:
    GalacticMapLodLevel;

  readonly particleRetentionRatio:
    number;

  readonly cacheEntryCount:
    number;
}

export interface GalacticMapPointVisibilityProfile {
  readonly pointScale:
    number;

  readonly opacityScale:
    number;

  readonly outerVisibilityScale:
    number;
}

/**
 * Render-only visibility compensation for the active LOD.
 *
 * OVERVIEW keeps almost all deterministic samples, but their projected size
 * and deliberately low per-particle opacity make a complete galaxy look
 * artificially sparse at the default camera distance. This profile restores
 * apparent surface brightness without creating physical stars, changing
 * deterministic positions or increasing the Web Worker particle budget.
 *
 * The outer-disk factor is strongest in OVERVIEW so spiral arms remain
 * legible without overexposing the already bright galactic core. DETAIL keeps
 * the original 1:1 presentation.
 */
export function galacticMapPointVisibilityProfile(
  lodLevel:
    GalacticMapLodLevel,
): GalacticMapPointVisibilityProfile {

  switch (
    lodLevel
  ) {
    case GalacticMapLodLevel.OVERVIEW:
      return Object.freeze({
        pointScale:
          1.18,
        opacityScale:
          1.38,
        outerVisibilityScale:
          1.28,
      });

    case GalacticMapLodLevel.BALANCED:
      return Object.freeze({
        pointScale:
          1.08,
        opacityScale:
          1.16,
        outerVisibilityScale:
          1.14,
      });

    case GalacticMapLodLevel.DETAIL:
      return Object.freeze({
        pointScale:
          1,
        opacityScale:
          1,
        outerVisibilityScale:
          1,
      });
  }

  throw new RangeError(
    `Unsupported galactic map LOD level: ${String(lodLevel)}.`,
  );
}


/**
 * Renderer-only particle residency contract.
 *
 * The visible/prefetch sector window remains useful for diagnostics, explored
 * coverage and future physical/procedural requests, but it is no longer used
 * to evict samples from the visual galaxy cloud. Camera orbit, pan and zoom
 * must never make already-visible stellar render samples disappear merely
 * because the Z=0 sector projection becomes smaller.
 *
 * Only the LOD retention tier changes the GPU sample set. This keeps a stable
 * visual galaxy across camera movement while preserving the Web Worker,
 * deterministic layout and 10.8/10.9 LOD policy.
 */
export function galacticMapRendererParticleResidencyWindow(
  window:
    GalacticMapVisibleSectorWindow,

  coverage:
    NonNullable<
      GalacticMapModel[
        'explorationCoverage'
      ]
    >,
): GalacticMapWorkerParticleWindow {

  const grid =
    coverage.grid;

  const side =
    grid.maxCoordinate -
    grid.minCoordinate +
    1;

  return Object.freeze({
    active:
      Object.freeze({
        minX:
          grid.minCoordinate,
        maxX:
          grid.maxCoordinate,
        minY:
          grid.minCoordinate,
        maxY:
          grid.maxCoordinate,
      }),
    activeSectorCount:
      side *
      side,
    lodLevel:
      window.lodLevel,
    signature:
      `RENDER_FULL:${window.lodLevel}`,
  });
}

export const GalacticMapWorkerStatus =
  Object.freeze({
    IDLE:
      'IDLE',

    INITIALIZING:
      'INITIALIZING',

    READY:
      'READY',

    UPDATING:
      'UPDATING',

    ERROR:
      'ERROR',
  } as const);

export type GalacticMapWorkerStatus =
  typeof GalacticMapWorkerStatus[
    keyof typeof GalacticMapWorkerStatus
  ];

export interface GalacticMapWorkerState {
  readonly status:
    GalacticMapWorkerStatus;

  readonly runtime:
    ProceduralWorkerRuntime | null;

  readonly requestRevision:
    number;

  readonly appliedRevision:
    number;

  readonly pending:
    boolean;
}

export interface GalacticMapSceneRuntime {
  resize(
    width:
      number,

    height:
      number,

    devicePixelRatio:
      number,
  ): void;

  render(
    model:
      GalacticMapModel,
  ): GalacticMapSceneRenderInfo;

  cameraState():
    GalacticMapCameraState;

  galaxySpinRadians():
    number;

  setCameraStateListener(
    listener:
      ((state: GalacticMapCameraState) => void) | null,
  ): void;

  setGalaxySpinStateListener(
    listener:
      ((radians: number) => void) | null,
  ): void;

  setLodStateListener(
    listener:
      ((state: GalacticMapLodState) => void) | null,
  ): void;

  setWorkerStateListener?(
    listener:
      ((state: GalacticMapWorkerState) => void) | null,
  ): void;

  setRotationEnabled(
    enabled:
      boolean,
  ): void;

  setLayerVisibility(
    visibility:
      GalacticMapLayerVisibility,
  ): void;

  resetView():
    void;

  selectDiscoveryMarkerAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapDiscoveryMarker | null;

  selectAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapVisualSelection | null;

  selectSectorAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapSectorSelection | null;

  clearSelection():
    void;

  clearSectorSelection():
    void;

  dispose():
    void;
}

export type GalacticMapSceneRuntimeFactory =
  (
    canvas:
      HTMLCanvasElement,
  ) => GalacticMapSceneRuntime;

export const GALACTIC_MAP_SCENE_RUNTIME_FACTORY =
  new InjectionToken<GalacticMapSceneRuntimeFactory>(
    'GALACTIC_MAP_SCENE_RUNTIME_FACTORY',
    {
      providedIn:
        'root',

      factory: () => {
        const workerClient =
          inject(
            ProceduralWorkerClient,
          );

        return (
          canvas:
            HTMLCanvasElement,
        ) =>
          createThreeGalacticMapSceneRuntime(
            canvas,
            workerClient,
          );
      },
    },
  );

type SceneRenderState =
  | 'initializing'
  | 'ready'
  | 'unavailable'
  | 'error';

interface PointerGesture {
  readonly pointerId:
    number;

  readonly startX:
    number;

  readonly startY:
    number;

  moved:
    boolean;
}

/**
 * Point-10.9 Angular host for the Three.js scene.
 *
 * It preserves the approved 10.2-10.8 interaction, observation and visible-
 * sector LOD contracts. Heavy renderer-only particle generation, spatial
 * indexing and compact-buffer materialization now run in the procedural Web
 * Worker. The main thread keeps Three.js, camera and controls responsive, drops
 * stale worker responses by monotonic revision and never generates physical
 * sector content or hidden Ground Truth through this optimization layer.
 */
@Component({
  selector:
    'app-galactic-map-scene',

  standalone:
    true,

  imports: [
    GalacticMapLayerControls,
    RouterLink,
  ],

  templateUrl:
    './galactic-map-scene.html',

  styleUrl:
    './galactic-map-scene.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GalacticMapScene
  implements
    AfterViewInit,
    OnChanges,
    OnDestroy {

  @Input({
    required:
      true,
  })
  model!:
    GalacticMapModel;

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
      GALACTIC_MAP_SCENE_RUNTIME_FACTORY,
    );

  private runtime:
    GalacticMapSceneRuntime | null =
    null;

  private resizeObserver:
    ResizeObserver | null =
    null;

  private listeningToWindowResize =
    false;

  private pointerGesture:
    PointerGesture | null =
    null;

  private readonly activePointerIds =
    new Set<number>();

  private multiPointerGesture =
    false;

  private readonly onWindowResize =
    () => {
      this.resizeRuntime();
    };

  private readonly renderStateSignal =
    signal<SceneRenderState>(
      'initializing',
    );

  private readonly particleCountSignal =
    signal<number>(
      0,
    );

  private readonly cameraStateSignal =
    signal<GalacticMapCameraState | null>(
      null,
    );

  private readonly galaxySpinRadiansSignal =
    signal<number>(
      0,
    );

  private readonly selectionSignal =
    signal<GalacticMapVisualSelection | null>(
      null,
    );

  private readonly markerSelectionSignal =
    signal<GalacticMapDiscoveryMarker | null>(
      null,
    );

  private readonly sectorSelectionSignal =
    signal<GalacticMapSectorSelection | null>(
      null,
    );

  private readonly lodStateSignal =
    signal<GalacticMapLodState | null>(
      null,
    );

  private readonly workerStateSignal =
    signal<GalacticMapWorkerState>(
      Object.freeze({
        status:
          GalacticMapWorkerStatus.IDLE,
        runtime:
          null,
        requestRevision:
          0,
        appliedRevision:
          0,
        pending:
          false,
      }),
    );

  private readonly layerVisibilitySignal =
    signal<GalacticMapLayerVisibility>(
      INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
    );

  readonly renderState =
    this
      .renderStateSignal
      .asReadonly();

  readonly particleCount =
    this
      .particleCountSignal
      .asReadonly();

  readonly cameraState =
    this
      .cameraStateSignal
      .asReadonly();

  readonly galaxySpinRadians =
    this
      .galaxySpinRadiansSignal
      .asReadonly();

  readonly selection =
    this
      .selectionSignal
      .asReadonly();

  readonly markerSelection =
    this
      .markerSelectionSignal
      .asReadonly();

  readonly sectorSelection =
    this
      .sectorSelectionSignal
      .asReadonly();

  readonly lodState =
    this
      .lodStateSignal
      .asReadonly();

  readonly workerState =
    this
      .workerStateSignal
      .asReadonly();

  readonly layerVisibility =
    this
      .layerVisibilitySignal
      .asReadonly();

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
          );

      this.runtime.setCameraStateListener(
        (
          state,
        ) => {
          this
            .cameraStateSignal
            .set(
              state,
            );
        },
      );

      this.runtime.setGalaxySpinStateListener(
        (
          radians,
        ) => {
          this
            .galaxySpinRadiansSignal
            .set(
              radians,
            );
        },
      );

      this.runtime.setLodStateListener(
        (
          state,
        ) => {
          this
            .lodStateSignal
            .set(
              state,
            );

          this
            .particleCountSignal
            .set(
              state.materializedParticleCount,
            );
        },
      );

      this.runtime.setWorkerStateListener?.(
        (
          state,
        ) => {
          this
            .workerStateSignal
            .set(
              state,
            );
        },
      );

      this
        .cameraStateSignal
        .set(
          this.runtime.cameraState(),
        );

      this
        .galaxySpinRadiansSignal
        .set(
          this.runtime.galaxySpinRadians(),
        );

      this.runtime.setLayerVisibility(
        this.layerVisibilitySignal(),
      );

      this.installResizeHandling();
      this.resizeRuntime();
      this.renderModel();
    } catch {
      this
        .renderStateSignal
        .set(
          'error',
        );
    }
  }

  ngOnChanges(
    changes:
      SimpleChanges,
  ): void {

    if (
      changes[
        'model'
      ] !==
        undefined &&
      this.runtime !==
        null
    ) {
      this.renderModel();
    }
  }

  ngOnDestroy():
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

    this.pointerGesture =
      null;

    this.activePointerIds.clear();
    this.multiPointerGesture =
      false;

    this
      .runtime
      ?.setCameraStateListener(
        null,
      );

    this
      .runtime
      ?.setGalaxySpinStateListener(
        null,
      );

    this
      .runtime
      ?.setLodStateListener(
        null,
      );

    this
      .runtime
      ?.setWorkerStateListener?.(
        null,
      );

    this
      .runtime
      ?.dispose();

    this.runtime =
      null;
  }

  toggleRotation():
    void {

    if (
      this.runtime ===
      null
    ) {
      return;
    }

    const enabled =
      !this
        .runtime
        .cameraState()
        .rotationEnabled;

    this.runtime.setRotationEnabled(
      enabled,
    );

    this
      .cameraStateSignal
      .set(
        this.runtime.cameraState(),
      );
  }

  onLayerVisibilityChange(
    change:
      GalacticMapLayerVisibilityChange,
  ): void {

    const nextVisibility =
      withGalacticMapLayerVisibility(
        this.layerVisibilitySignal(),
        change.layerId,
        change.visible,
      );

    this
      .layerVisibilitySignal
      .set(
        nextVisibility,
      );

    this
      .runtime
      ?.setLayerVisibility(
        nextVisibility,
      );

    const selectedMarker =
      this.markerSelectionSignal();

    if (
      selectedMarker !==
        null &&
      !markerVisibleInLayers(
        selectedMarker.resultKind,
        nextVisibility,
      )
    ) {
      this
        .markerSelectionSignal
        .set(
          null,
        );
    }
  }

  resetView():
    void {

    if (
      this.runtime ===
      null
    ) {
      return;
    }

    this.runtime.resetView();

    this
      .selectionSignal
      .set(
        null,
      );

    this
      .markerSelectionSignal
      .set(
        null,
      );

    this
      .sectorSelectionSignal
      .set(
        null,
      );

    this
      .runtime
      .clearSectorSelection();

    this
      .cameraStateSignal
      .set(
        this.runtime.cameraState(),
      );

    this
      .galaxySpinRadiansSignal
      .set(
        this.runtime.galaxySpinRadians(),
      );
  }

  onCanvasPointerDown(
    event:
      PointerEvent,
  ): void {

    this.activePointerIds.add(
      event.pointerId,
    );

    if (
      this.activePointerIds.size >
      1
    ) {
      this.multiPointerGesture =
        true;

      this.pointerGesture =
        null;

      return;
    }

    if (
      event.pointerType ===
        'mouse' &&
      event.button !==
        0
    ) {
      this.pointerGesture =
        null;

      return;
    }

    this.pointerGesture =
      {
        pointerId:
          event.pointerId,

        startX:
          event.clientX,

        startY:
          event.clientY,

        moved:
          false,
      };
  }

  onCanvasPointerMove(
    event:
      PointerEvent,
  ): void {

    const gesture =
      this.pointerGesture;

    if (
      gesture ===
        null ||
      gesture.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      gesture.startX;

    const deltaY =
      event.clientY -
      gesture.startY;

    if (
      deltaX *
        deltaX +
      deltaY *
        deltaY >
      CLICK_MAX_MOVEMENT_PX *
        CLICK_MAX_MOVEMENT_PX
    ) {
      gesture.moved =
        true;
    }
  }

  onCanvasPointerUp(
    event:
      PointerEvent,
  ): void {

    const gesture =
      this.pointerGesture;

    const multiPointerGesture =
      this.multiPointerGesture;

    this.activePointerIds.delete(
      event.pointerId,
    );

    if (
      this.activePointerIds.size ===
      0
    ) {
      this.multiPointerGesture =
        false;
    }

    this.pointerGesture =
      null;

    if (
      multiPointerGesture ||
      gesture ===
        null ||
      gesture.pointerId !==
        event.pointerId ||
      gesture.moved ||
      this.runtime ===
        null
    ) {
      return;
    }

    const markerSelection =
      this
        .runtime
        .selectDiscoveryMarkerAt(
          event.clientX,
          event.clientY,
        );

    if (
      markerSelection !==
        null
    ) {
      this.runtime.clearSelection();
      this.runtime.clearSectorSelection();

      this
        .selectionSignal
        .set(
          null,
        );

      this
        .sectorSelectionSignal
        .set(
          null,
        );

      this
        .markerSelectionSignal
        .set(
          markerSelection,
        );

      return;
    }

    this.runtime.clearSelection();

    const sectorSelection =
      this.runtime.selectSectorAt(
        event.clientX,
        event.clientY,
      );

    this
      .selectionSignal
      .set(
        null,
      );

    this
      .markerSelectionSignal
      .set(
        null,
      );

    this
      .sectorSelectionSignal
      .set(
        sectorSelection,
      );
  }

  onCanvasPointerCancel(
    event:
      PointerEvent,
  ): void {

    this.activePointerIds.delete(
      event.pointerId,
    );

    if (
      this.activePointerIds.size ===
      0
    ) {
      this.multiPointerGesture =
        false;
    }

    this.pointerGesture =
      null;
  }

  onCanvasContextMenu(
    event:
      MouseEvent,
  ): void {

    event.preventDefault();
  }

  markerArchiveLink(
    marker:
      GalacticMapDiscoveryMarker,
  ): string[] {

    const routeKind =
      marker.kind ===
        GalacticMapDiscoveryMarkerKind
          .SYSTEM
        ? 'system'
        : 'galactic-object';

    return [
      '/archive',
      routeKind,
      marker
        .locator
        .galaxyIndex
        .toString(
          10,
        ),
      marker
        .locator
        .sectorKey
        .toString(
          10,
        ),
      marker
        .locator
        .galacticObjectIndex
        .toString(
          10,
        ),
    ];
  }

  markerArchiveQueryParams(): {
    readonly seed:
      string;

    readonly version:
      string;
  } {

    return {
      seed:
        this
          .model
          .generationKey
          .universeSeed
          .serialize(),

      version:
        this
          .model
          .generationKey
          .generatorVersion
          .code
          .toString(
            10,
          ),
    };
  }

  sectorExplorationQueryParams(
    selection:
      GalacticMapSectorSelection,
  ): {
    readonly sectorX:
      string;

    readonly sectorY:
      string;

    readonly scan:
      string;
  } {

    return {
      sectorX:
        selection
          .coordinates
          .x
          .toString(),

      sectorY:
        selection
          .coordinates
          .y
          .toString(),

      scan:
        '1',
    };
  }

  sectorStatusLabel(
    selection:
      GalacticMapSectorSelection,
  ): string {

    return selection.explored
      ? 'Explorado'
      : 'No explorado';
  }

  markerFamilyLabel(
    marker:
      GalacticMapDiscoveryMarker,
  ): string {

    switch (
      marker.resultKind
    ) {
      case ExplorationResultKind.SYSTEM:
        return 'Sistema';

      case ExplorationResultKind.NEBULA:
        return 'Nebulosa';

      case ExplorationResultKind.STAR_CLUSTER:
        return 'Cúmulo estelar';

      case ExplorationResultKind.EXTREME_OBJECT:
        return 'Objeto extremo';
    }

    throw new RangeError(
      `Unsupported marker result kind: ${String(marker.resultKind)}.`,
    );
  }

  markerIdentity(
    marker:
      GalacticMapDiscoveryMarker,
  ): string {

    const prefix =
      marker.kind ===
        GalacticMapDiscoveryMarkerKind
          .SYSTEM
        ? 'SYS'
        : 'OBJ';

    return `${prefix}-${marker.locator.galacticObjectIndex.toString(10)}`;
  }

  markerRelativePosition(
    marker:
      GalacticMapDiscoveryMarker,
  ): GalacticMapRelativePosition | null {

    const coverage =
      this.model
        .explorationCoverage;

    const environmentalLayers =
      this.model
        .environmentalLayers;

    if (
      coverage ===
        null ||
      environmentalLayers ===
        null
    ) {
      return null;
    }

    return resolveGalacticMapRelativePosition(
      marker,
      coverage.grid,
      environmentalLayers.regionRadii,
    );
  }

  relativeRegionLabel(
    region:
      GalacticMapRelativeRegion,
  ): string {

    return galacticMapRelativeRegionLabel(
      region,
    );
  }

  formatSignedKilolightYears(
    lightYears:
      number,
  ): string {

    const value =
      lightYears /
      1000;

    if (
      Math.abs(
        value,
      ) <
        0.0005
    ) {
      return '0.00';
    }

    return `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
  }

  formatKilolightYears(
    lightYears:
      number,
  ): string {

    return (
      lightYears /
      1000
    ).toFixed(
      2,
    );
  }

  markerStateLabel(
    state:
      DiscoveryStateValue,
  ): string {

    const canonical =
      DiscoveryState
        .fromCode(
          state.code,
        );

    if (
      canonical ===
        DiscoveryState.DETECTED
    ) {
      return 'Detectado';
    }

    if (
      canonical ===
        DiscoveryState.DISCOVERED
    ) {
      return 'Descubierto';
    }

    if (
      canonical ===
        DiscoveryState.VISITED
    ) {
      return 'Visitado';
    }

    if (
      canonical ===
        DiscoveryState.CATALOGUED
    ) {
      return 'Catalogado';
    }

    if (
      canonical ===
        DiscoveryState.CONFIRMED
    ) {
      return 'Confirmado';
    }

    return 'Desconocido';
  }

  private installResizeHandling():
    void {

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
          this
            .sceneHostRef
            .nativeElement,
        );

      return;
    }

    window.addEventListener(
      'resize',
      this.onWindowResize,
    );

    this.listeningToWindowResize =
      true;
  }

  private resizeRuntime():
    void {

    if (
      this.runtime ===
      null
    ) {
      return;
    }

    const bounds =
      this
        .sceneHostRef
        .nativeElement
        .getBoundingClientRect();

    this
      .runtime
      .resize(
        Math.max(
          1,
          Math.round(
            bounds.width,
          ),
        ),
        Math.max(
          1,
          Math.round(
            bounds.height,
          ),
        ),
        Math.max(
          1,
          window
            .devicePixelRatio ||
            1,
        ),
      );
  }

  private renderModel():
    void {

    if (
      this.runtime ===
      null
    ) {
      return;
    }

    try {
      this
        .selectionSignal
        .set(
          null,
        );

      this
        .markerSelectionSignal
        .set(
          null,
        );

      this
        .sectorSelectionSignal
        .set(
          null,
        );

      const info =
        this
          .runtime
          .render(
            this.model,
          );

      this.runtime.setLayerVisibility(
        this.layerVisibilitySignal(),
      );

      this
        .particleCountSignal
        .set(
          info.particleCount,
        );

      this
        .cameraStateSignal
        .set(
          this.runtime.cameraState(),
        );

      this
        .galaxySpinRadiansSignal
        .set(
          this.runtime.galaxySpinRadians(),
        );

      this
        .renderStateSignal
        .set(
          'ready',
        );
    } catch {
      this
        .particleCountSignal
        .set(
          0,
        );

      this
        .selectionSignal
        .set(
          null,
        );

      this
        .markerSelectionSignal
        .set(
          null,
        );

      this
        .sectorSelectionSignal
        .set(
          null,
        );

      this
        .lodStateSignal
        .set(
          null,
        );

      this
        .workerStateSignal
        .set(
          Object.freeze({
            status:
              GalacticMapWorkerStatus.ERROR,
            runtime:
              null,
            requestRevision:
              0,
            appliedRevision:
              0,
            pending:
              false,
          }),
        );

      this
        .renderStateSignal
        .set(
          'error',
        );
    }
  }
}

function markerVisibleInLayers(
  resultKind:
    GalacticMapDiscoveryMarker['resultKind'],

  visibility:
    GalacticMapLayerVisibility,
): boolean {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.SYSTEM:
      return visibility.systems;

    case ExplorationResultKind.NEBULA:
      return visibility.nebulae;

    case ExplorationResultKind.STAR_CLUSTER:
      return visibility.starClusters;

    case ExplorationResultKind.EXTREME_OBJECT:
      return visibility.extremeObjects;
  }

  throw new RangeError(
    `Unsupported marker result kind: ${String(resultKind)}.`,
  );
}

function createThreeGalacticMapSceneRuntime(
  canvas:
    HTMLCanvasElement,

  workerClient:
    ProceduralWorkerClient,
): GalacticMapSceneRuntime {

  return new ThreeGalacticMapSceneRuntime(
    canvas,
    workerClient,
  );
}

class ThreeGalacticMapSceneRuntime
  implements GalacticMapSceneRuntime {

  private readonly canvas:
    HTMLCanvasElement;

  private readonly workerClient:
    ProceduralWorkerClient;

  private readonly renderer:
    THREE.WebGLRenderer;

  private readonly scene =
    new THREE.Scene();

  private readonly camera =
    new THREE.PerspectiveCamera(
      40,
      1,
      0.1,
      20,
    );

  private readonly cameraController:
    GalacticMapCameraController;

  private cameraStateListener:
    ((state: GalacticMapCameraState) => void) | null =
    null;

  private galaxySpinStateListener:
    ((radians: number) => void) | null =
    null;

  private lodStateListener:
    ((state: GalacticMapLodState) => void) | null =
    null;

  private workerStateListener:
    ((state: GalacticMapWorkerState) => void) | null =
    null;

  private workerStateValue:
    GalacticMapWorkerState =
    Object.freeze({
      status:
        GalacticMapWorkerStatus.IDLE,
      runtime:
        null,
      requestRevision:
        0,
      appliedRevision:
        0,
      pending:
        false,
    });

  private lodStateValue:
    GalacticMapLodState =
    Object.freeze({
      sourceParticleCount:
        0,
      materializedParticleCount:
        0,
      visibleSectorCount:
        0,
      activeSectorCount:
        0,
      lodLevel:
        GalacticMapLodLevel.OVERVIEW,
      particleRetentionRatio:
        0.88,
      cacheEntryCount:
        0,
    });

  private galaxySpinRadiansValue =
    0;

  private staticGalaxyTiltRadians =
    0;

  private galaxyGroup:
    THREE.Group | null =
    null;

  private points:
    THREE.Points<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
    > | null =
    null;

  private pointMaterial:
    THREE.ShaderMaterial | null =
    null;

  private particleSessionId:
    string | null =
    null;

  private particleSessionReady =
    false;

  private particleRequestRevision =
    0;

  private particleAppliedRevision =
    0;

  private pendingWindowSignature:
    string | null =
    null;

  private deferredWindow:
    GalacticMapVisibleSectorWindow | null =
    null;

  private disposed =
    false;

  private activeSourceIndices:
    Uint32Array =
    new Uint32Array();

  private activeWindowSignature:
    string | null =
    null;

  private activeCoverage:
    GalacticMapModel['explorationCoverage'] =
    null;

  private activeHaloOuterRadiusNormalized =
    0;

  private sectorOverlay:
    GalacticMapSectorOverlay | null =
    null;

  private discoveryMarkerOverlay:
    GalacticMapDiscoveryMarkerOverlay | null =
    null;

  private environmentalOverlay:
    GalacticMapEnvironmentalOverlay | null =
    null;

  private layerVisibility:
    GalacticMapLayerVisibility =
    INITIAL_GALACTIC_MAP_LAYER_VISIBILITY;

  private selectionMarker:
    THREE.Mesh<
      THREE.SphereGeometry,
      THREE.MeshBasicMaterial
    > | null =
    null;

  private sectorSelectionMarker:
    THREE.LineLoop<
      THREE.BufferGeometry,
      THREE.LineBasicMaterial
    > | null =
    null;

  private pixelRatio =
    1;

  constructor(
    canvas:
      HTMLCanvasElement,

    workerClient:
      ProceduralWorkerClient,
  ) {
    this.canvas =
      canvas;

    this.workerClient =
      workerClient;

    this.renderer =
      new THREE.WebGLRenderer({
        canvas,
        antialias:
          true,
        alpha:
          true,
        powerPreference:
          'high-performance',
      });

    this
      .renderer
      .setClearColor(
        0x000000,
        0,
      );

    this.renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    this.renderer.toneMapping =
      THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure =
      0.92;

    this
      .camera
      .position
      .set(
        0,
        -3.18,
        1.42,
      );

    this
      .camera
      .lookAt(
        0,
        0,
        0,
      );

    this.cameraController =
      new GalacticMapCameraController(
        this.camera,
        canvas,
        () => {
          this.updateVisibleSectorMaterialization();
          this.renderFrame();
          this.emitCameraState();
        },
        (
          stepRadians,
        ) => {
          this.rotateGalaxyVisual(
            stepRadians,
          );
        },
      );
  }

  resize(
    width:
      number,

    height:
      number,

    devicePixelRatio:
      number,
  ): void {

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

    this.pixelRatio =
      Math.min(
        2,
        Math.max(
          1,
          devicePixelRatio,
        ),
      );

    this
      .renderer
      .setPixelRatio(
        this.pixelRatio,
      );

    this
      .renderer
      .setSize(
        safeWidth,
        safeHeight,
        false,
      );

    this.camera.aspect =
      safeWidth /
      safeHeight;

    const aspect =
      safeWidth /
      safeHeight;

    this.camera.fov =
      aspect <
        0.90
        ? 50
        : aspect <
            1.20
          ? 45
          : 40;

    this
      .camera
      .updateProjectionMatrix();

    if (
      this.pointMaterial !==
      null
    ) {
      this
        .pointMaterial
        .uniforms[
          'uPixelRatio'
        ]
        .value =
        this.pixelRatio;
    }

    this
      .discoveryMarkerOverlay
      ?.setPixelRatio(
        this.pixelRatio,
      );

    this.updateVisibleSectorMaterialization();
    this.renderFrame();
    this.emitCameraState();
  }

  render(
    model:
      GalacticMapModel,
  ): GalacticMapSceneRenderInfo {

    this.disposePoints();
    this.clearSelection();
    this.clearSectorSelection();

    const visual =
      model.visualStructure;

    if (
      visual ===
      null
    ) {
      throw new RangeError(
        'The Three.js scene requires detailed visual structure.',
      );
    }

    this.disposed =
      false;

    this.pointMaterial =
      createGalaxyPointMaterial(
        this.pixelRatio,
        this.lodStateValue
          .lodLevel,
      );

    const galaxyGroup =
      new THREE.Group();

    const normalization =
      1.52 *
      staticPresentationScaleMultiplier(
        model,
      ) /
      visual
        .regions
        .haloOuterRadiusNormalized;

    galaxyGroup.scale.setScalar(
      normalization,
    );

    this.staticGalaxyTiltRadians =
      staticPresentationTiltRadians(
        model,
      );

    this.galaxySpinRadiansValue =
      0;

    applyGalaxyVisualRotation(
      galaxyGroup,
      this.staticGalaxyTiltRadians,
      this.galaxySpinRadiansValue,
    );

    const explorationCoverage =
      model.explorationCoverage;

    this.activeCoverage =
      explorationCoverage;

    this.activeHaloOuterRadiusNormalized =
      visual
        .regions
        .haloOuterRadiusNormalized;

    if (
      explorationCoverage !==
      null
    ) {
      const sectorOverlay =
        createGalacticMapSectorOverlay(
          explorationCoverage,
          visual
            .regions
            .haloOuterRadiusNormalized,
        );

      galaxyGroup.add(
        sectorOverlay.object3d,
      );

      this.sectorOverlay =
        sectorOverlay;
    }

    const environmentalLayers =
      model.environmentalLayers;

    if (
      environmentalLayers !==
      null
    ) {
      const environmentalOverlay =
        createGalacticMapEnvironmentalOverlay(
          environmentalLayers,
        );

      galaxyGroup.add(
        environmentalOverlay.object3d,
      );

      this.environmentalOverlay =
        environmentalOverlay;
    }

    const discoveryMarkers =
      model.discoveryMarkers;

    if (
      discoveryMarkers !==
      null
    ) {
      if (
        explorationCoverage ===
        null
      ) {
        throw new RangeError(
          'Persistent discovery markers require exploration coverage.',
        );
      }

      const discoveryMarkerOverlay =
        createGalacticMapDiscoveryMarkerOverlay(
          discoveryMarkers,
          explorationCoverage,
          visual
            .regions
            .haloOuterRadiusNormalized,
          this.pixelRatio,
        );

      galaxyGroup.add(
        discoveryMarkerOverlay.object3d,
      );

      this.discoveryMarkerOverlay =
        discoveryMarkerOverlay;
    }

    this.scene.add(
      galaxyGroup,
    );

    this.galaxyGroup =
      galaxyGroup;

    this.applyLayerVisibility();
    this.renderFrame();
    this.emitGalaxySpinState();
    this.emitLodState();

    this.startParticleWorkerSession(
      model,
    );

    return Object.freeze({
      particleCount:
        this.lodStateValue
          .materializedParticleCount,
    });
  }

  cameraState():
    GalacticMapCameraState {

    return this
      .cameraController
      .cameraState();
  }

  galaxySpinRadians():
    number {

    return this.galaxySpinRadiansValue;
  }

  setCameraStateListener(
    listener:
      ((state: GalacticMapCameraState) => void) | null,
  ): void {

    this.cameraStateListener =
      listener;

    this.emitCameraState();
  }

  setGalaxySpinStateListener(
    listener:
      ((radians: number) => void) | null,
  ): void {

    this.galaxySpinStateListener =
      listener;

    this.emitGalaxySpinState();
  }

  setLodStateListener(
    listener:
      ((state: GalacticMapLodState) => void) | null,
  ): void {

    this.lodStateListener =
      listener;

    this.emitLodState();
  }

  setWorkerStateListener(
    listener:
      ((state: GalacticMapWorkerState) => void) | null,
  ): void {

    this.workerStateListener =
      listener;

    this.emitWorkerState();
  }

  setRotationEnabled(
    enabled:
      boolean,
  ): void {

    this
      .cameraController
      .setRotationEnabled(
        enabled,
      );
  }

  setLayerVisibility(
    visibility:
      GalacticMapLayerVisibility,
  ): void {

    this.layerVisibility =
      Object.freeze({
        ...visibility,
      });

    this.applyLayerVisibility();
    this.renderFrame();
  }

  resetView():
    void {

    this.clearSelection();
    this.clearSectorSelection();

    this.galaxySpinRadiansValue =
      0;

    this.applyCurrentGalaxyVisualRotation();
    this.emitGalaxySpinState();

    this
      .cameraController
      .resetView();

    this.renderFrame();
  }

  selectDiscoveryMarkerAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapDiscoveryMarker | null {

    if (
      this.discoveryMarkerOverlay ===
        null
    ) {
      return null;
    }

    return this
      .discoveryMarkerOverlay
      .pickMarker(
        this.camera,
        this.canvas,
        clientX,
        clientY,
      );
  }

  selectAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapVisualSelection | null {

    if (
      this.points ===
      null
    ) {
      this.clearSelection();
      return null;
    }

    const selection =
      this
        .cameraController
        .selectPoint(
          this.points,
          clientX,
          clientY,
        );

    if (
      selection ===
      null
    ) {
      this.clearSelection();
      return null;
    }

    const sourceSampleIndex =
      this.activeSourceIndices[
        selection.sampleIndex
      ];

    const canonicalSelection =
      Object.freeze({
        ...selection,
        sampleIndex:
          sourceSampleIndex ===
            undefined
            ? selection.sampleIndex
            : sourceSampleIndex,
      });

    this.showSelectionMarker(
      canonicalSelection,
    );

    return canonicalSelection;
  }

  selectSectorAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapSectorSelection | null {

    const coverage =
      this.activeCoverage;

    const galaxyGroup =
      this.galaxyGroup;

    if (
      coverage ===
        null ||
      galaxyGroup ===
        null ||
      this.activeHaloOuterRadiusNormalized <=
        0
    ) {
      this.clearSectorSelection();
      return null;
    }

    const rect =
      this.canvas
        .getBoundingClientRect();

    if (
      rect.width <=
        0 ||
      rect.height <=
        0 ||
      clientX <
        rect.left ||
      clientX >
        rect.right ||
      clientY <
        rect.top ||
      clientY >
        rect.bottom
    ) {
      this.clearSectorSelection();
      return null;
    }

    const pointer =
      new THREE.Vector2(
        (
          (
            clientX -
            rect.left
          ) /
          rect.width
        ) *
          2 -
          1,
        -(
          (
            clientY -
            rect.top
          ) /
          rect.height
        ) *
          2 +
          1,
      );

    const raycaster =
      new THREE.Raycaster();

    raycaster.setFromCamera(
      pointer,
      this.camera,
    );

    galaxyGroup.updateMatrixWorld(
      true,
    );

    const inverseGalaxyMatrix =
      galaxyGroup
        .matrixWorld
        .clone()
        .invert();

    const localRay =
      raycaster
        .ray
        .clone()
        .applyMatrix4(
          inverseGalaxyMatrix,
        );

    const localIntersection =
      new THREE.Vector3();

    const intersection =
      localRay.intersectPlane(
        new THREE.Plane(
          new THREE.Vector3(
            0,
            0,
            1,
          ),
          0,
        ),
        localIntersection,
      );

    if (
      intersection ===
        null
    ) {
      this.clearSectorSelection();
      return null;
    }

    const selection =
      resolveGalacticMapSectorSelection(
        coverage,
        this.activeHaloOuterRadiusNormalized,
        localIntersection.x,
        localIntersection.y,
      );

    if (
      selection ===
        null
    ) {
      this.clearSectorSelection();
      return null;
    }

    this.showSectorSelectionMarker(
      selection,
    );

    return selection;
  }

  clearSelection():
    void {

    if (
      this.selectionMarker ===
      null
    ) {
      return;
    }

    this.selectionMarker.removeFromParent();

    this
      .selectionMarker
      .geometry
      .dispose();

    this
      .selectionMarker
      .material
      .dispose();

    this.selectionMarker =
      null;

    this.renderFrame();
  }

  clearSectorSelection():
    void {

    if (
      this.sectorSelectionMarker ===
      null
    ) {
      return;
    }

    this
      .sectorSelectionMarker
      .removeFromParent();

    this
      .sectorSelectionMarker
      .geometry
      .dispose();

    this
      .sectorSelectionMarker
      .material
      .dispose();

    this.sectorSelectionMarker =
      null;

    this.renderFrame();
  }

  dispose():
    void {

    this.cameraStateListener =
      null;

    this.galaxySpinStateListener =
      null;

    this.lodStateListener =
      null;

    this.workerStateListener =
      null;

    this.disposed =
      true;

    this.clearSelection();
    this.clearSectorSelection();
    this.disposePoints();

    this
      .cameraController
      .dispose();

    this
      .renderer
      .dispose();
  }

  private applyLayerVisibility():
    void {

    this
      .discoveryMarkerOverlay
      ?.setLayerVisibility(
        this.layerVisibility,
      );

    this
      .environmentalOverlay
      ?.setRegionsVisible(
        this.layerVisibility.regions,
      );

    this
      .environmentalOverlay
      ?.setHabitabilityVisible(
        this.layerVisibility.habitableZone,
      );
  }

  private emitCameraState():
    void {

    this.cameraStateListener?.(
      this.cameraState(),
    );
  }

  private emitGalaxySpinState():
    void {

    this.galaxySpinStateListener?.(
      this.galaxySpinRadiansValue,
    );
  }

  private emitLodState():
    void {

    this.lodStateListener?.(
      this.lodStateValue,
    );
  }

  private emitWorkerState():
    void {

    this.workerStateListener?.(
      this.workerStateValue,
    );
  }

  private rotateGalaxyVisual(
    stepRadians:
      number,
  ): void {

    if (
      this.galaxyGroup ===
        null
    ) {
      return;
    }

    this.galaxySpinRadiansValue =
      normalizeSignedRadians(
        this.galaxySpinRadiansValue +
        stepRadians,
      );

    this.applyCurrentGalaxyVisualRotation();
    this.updateVisibleSectorMaterialization();
    this.renderFrame();
    this.emitGalaxySpinState();
  }

  private applyCurrentGalaxyVisualRotation():
    void {

    if (
      this.galaxyGroup ===
        null
    ) {
      return;
    }

    applyGalaxyVisualRotation(
      this.galaxyGroup,
      this.staticGalaxyTiltRadians,
      this.galaxySpinRadiansValue,
    );
  }

  private startParticleWorkerSession(
    model:
      GalacticMapModel,
  ): void {

    const sessionId =
      `galactic-map-particles-${++galacticMapParticleSessionSequence}`;

    this.particleSessionId =
      sessionId;

    this.particleSessionReady =
      false;

    this.particleRequestRevision =
      1;

    this.particleAppliedRevision =
      0;

    this.activeWindowSignature =
      null;

    this.pendingWindowSignature =
      null;

    this.deferredWindow =
      null;

    const coverage =
      this.activeCoverage;

    const initialWindow =
      coverage ===
        null
        ? null
        : this.resolveCurrentVisibleWindow();

    const initialWorkerWindow =
      initialWindow ===
          null ||
        coverage ===
          null
        ? null
        : galacticMapRendererParticleResidencyWindow(
            initialWindow,
            coverage,
          );

    this.pendingWindowSignature =
      initialWorkerWindow?.signature ??
      '__FULL__';

    this.setWorkerState(
      GalacticMapWorkerStatus.INITIALIZING,
      null,
      true,
      this.particleRequestRevision,
      this.particleAppliedRevision,
    );

    const indexConfig =
      coverage ===
        null
        ? null
        : galacticMapParticleSectorIndexConfig(
            coverage,
            this.activeHaloOuterRadiusNormalized,
          );

    const revision =
      this.particleRequestRevision;

    void this.workerClient
      .execute(
        'galactic-map-particle-session',
        {
          sessionId,
          renderInput:
            createGalacticMapParticleRenderInput(
              model,
            ),
          indexConfig,
          window:
            initialWorkerWindow,
        },
      )
      .then(
        (
          result,
        ) => {
          if (
            !this.workerResponseStillCurrent(
              sessionId,
              revision,
            )
          ) {
            return;
          }

          this.particleSessionReady =
            coverage !==
              null;

          this.applyWorkerParticleBatch(
            result.batch,
            initialWindow,
            initialWorkerWindow?.signature ??
              '__FULL__',
          );

          this.particleAppliedRevision =
            revision;

          this.pendingWindowSignature =
            null;

          this.setWorkerState(
            GalacticMapWorkerStatus.READY,
            result.runtime,
            false,
            this.particleRequestRevision,
            this.particleAppliedRevision,
          );

          const deferred =
            this.deferredWindow;

          this.deferredWindow =
            null;

          if (
            deferred !==
              null &&
            this.particleSessionReady &&
            this.activeCoverage !==
              null
          ) {
            const deferredSignature =
              galacticMapRendererParticleResidencyWindow(
                deferred,
                this.activeCoverage,
              )
                .signature;

            if (
              deferredSignature !==
                this.activeWindowSignature
            ) {
              this.requestParticleWindow(
                deferred,
              );
            } else {
              this.refreshVisibleWindowDiagnostics(
                deferred,
              );
            }
          }
        },
      )
      .catch(
        (
          error: unknown,
        ) => {
          if (
            this.workerResponseStillCurrent(
              sessionId,
              revision,
            )
          ) {
            this.handleParticleWorkerFailure(
              error,
            );
          }
        },
      );
  }

  private updateVisibleSectorMaterialization(
    force =
      false,
  ): boolean {

    if (
      this.activeCoverage ===
        null ||
      this.galaxyGroup ===
        null ||
      this.activeHaloOuterRadiusNormalized <=
        0 ||
      this.particleSessionId ===
        null
    ) {
      return false;
    }

    const window =
      this.resolveCurrentVisibleWindow();

    const residencyWindow =
      galacticMapRendererParticleResidencyWindow(
        window,
        this.activeCoverage,
      );

    if (
      !force &&
      residencyWindow.signature ===
        this.activeWindowSignature
    ) {
      this.refreshVisibleWindowDiagnostics(
        window,
      );

      return false;
    }

    if (
      !force &&
      residencyWindow.signature ===
        this.pendingWindowSignature
    ) {
      this.deferredWindow =
        window;

      this.refreshVisibleWindowDiagnostics(
        window,
      );

      return false;
    }

    if (
      !this.particleSessionReady
    ) {
      this.deferredWindow =
        window;

      this.refreshVisibleWindowDiagnostics(
        window,
      );

      return true;
    }

    this.requestParticleWindow(
      window,
    );

    return true;
  }

  private resolveCurrentVisibleWindow():
    GalacticMapVisibleSectorWindow {

    if (
      this.activeCoverage ===
        null ||
      this.galaxyGroup ===
        null ||
      this.activeHaloOuterRadiusNormalized <=
        0
    ) {
      throw new Error(
        'Cannot resolve a visible sector window without active galactic coverage.',
      );
    }

    return resolveGalacticMapVisibleSectorWindow(
      this.camera,
      this.galaxyGroup,
      this.activeCoverage,
      this.activeHaloOuterRadiusNormalized,
      this.cameraState().distance,
    );
  }

  private requestParticleWindow(
    window:
      GalacticMapVisibleSectorWindow,
  ): void {

    const sessionId =
      this.particleSessionId;

    if (
      sessionId ===
        null
    ) {
      return;
    }

    const coverage =
      this.activeCoverage;

    if (
      coverage ===
        null
    ) {
      return;
    }

    const residencyWindow =
      galacticMapRendererParticleResidencyWindow(
        window,
        coverage,
      );

    const revision =
      ++this.particleRequestRevision;

    this.pendingWindowSignature =
      residencyWindow.signature;

    this.setWorkerState(
      GalacticMapWorkerStatus.UPDATING,
      this.workerStateValue.runtime,
      true,
      revision,
      this.particleAppliedRevision,
    );

    void this.workerClient
      .execute(
        'galactic-map-particle-window',
        {
          sessionId,
          window:
            residencyWindow,
        },
      )
      .then(
        (
          result,
        ) => {
          if (
            !this.workerResponseStillCurrent(
              sessionId,
              revision,
            )
          ) {
            return;
          }

          const latestWindow =
            this.resolveCurrentVisibleWindow();

          this.applyWorkerParticleBatch(
            result.batch,
            latestWindow,
            residencyWindow.signature,
          );

          this.particleAppliedRevision =
            revision;

          this.pendingWindowSignature =
            null;

          this.setWorkerState(
            GalacticMapWorkerStatus.READY,
            result.runtime,
            false,
            revision,
            revision,
          );
        },
      )
      .catch(
        (
          error: unknown,
        ) => {
          if (
            this.workerResponseStillCurrent(
              sessionId,
              revision,
            )
          ) {
            this.handleParticleWorkerFailure(
              error,
            );
          }
        },
      );
  }

  private applyWorkerParticleBatch(
    batch:
      GalacticMapWorkerParticleBatch,

    window:
      GalacticMapVisibleSectorWindow | null,

    residencySignature:
      string,
  ): void {

    this.replaceMaterializedPoints(
      batch,
    );

    this.activeWindowSignature =
      residencySignature;

    this.lodStateValue =
      Object.freeze({
        sourceParticleCount:
          batch.sourceCount,
        materializedParticleCount:
          batch.count,
        visibleSectorCount:
          window?.visibleSectorCount ??
          0,
        activeSectorCount:
          window?.activeSectorCount ??
          0,
        lodLevel:
          window?.lodLevel ??
          GalacticMapLodLevel.DETAIL,
        particleRetentionRatio:
          window?.particleRetentionRatio ??
          1,
        cacheEntryCount:
          batch.cacheEntryCount,
      });

    this.applyPointVisibilityProfile(
      this.lodStateValue
        .lodLevel,
    );

    this.emitLodState();
    this.renderFrame();
  }

  private refreshVisibleWindowDiagnostics(
    window:
      GalacticMapVisibleSectorWindow,
  ): void {

    this.lodStateValue =
      Object.freeze({
        ...this.lodStateValue,
        visibleSectorCount:
          window.visibleSectorCount,
        activeSectorCount:
          window.activeSectorCount,
        lodLevel:
          window.lodLevel,
        particleRetentionRatio:
          window.particleRetentionRatio,
      });

    this.applyPointVisibilityProfile(
      window.lodLevel,
    );

    this.emitLodState();
  }

  private applyPointVisibilityProfile(
    lodLevel:
      GalacticMapLodLevel,
  ): void {

    if (
      this.pointMaterial ===
        null
    ) {
      return;
    }

    const profile =
      galacticMapPointVisibilityProfile(
        lodLevel,
      );

    this
      .pointMaterial
      .uniforms[
        'uPointScale'
      ]
      .value =
      profile
        .pointScale;

    this
      .pointMaterial
      .uniforms[
        'uOpacityScale'
      ]
      .value =
      profile
        .opacityScale;

    this
      .pointMaterial
      .uniforms[
        'uOuterVisibilityScale'
      ]
      .value =
      profile
        .outerVisibilityScale;
  }

  private workerResponseStillCurrent(
    sessionId:
      string,

    revision:
      number,
  ): boolean {

    return !this.disposed &&
      this.particleSessionId ===
        sessionId &&
      this.particleRequestRevision ===
        revision;
  }

  private handleParticleWorkerFailure(
    _error:
      unknown,
  ): void {

    this.pendingWindowSignature =
      null;

    this.deferredWindow =
      null;

    this.setWorkerState(
      GalacticMapWorkerStatus.ERROR,
      this.workerStateValue.runtime,
      false,
      this.particleRequestRevision,
      this.particleAppliedRevision,
    );
  }

  private setWorkerState(
    status:
      GalacticMapWorkerStatus,

    runtime:
      ProceduralWorkerRuntime | null,

    pending:
      boolean,

    requestRevision:
      number,

    appliedRevision:
      number,
  ): void {

    this.workerStateValue =
      Object.freeze({
        status,
        runtime,
        requestRevision,
        appliedRevision,
        pending,
      });

    this.emitWorkerState();
  }

  private releaseActiveParticleSession():
    void {

    const sessionId =
      this.particleSessionId;

    this.particleSessionId =
      null;

    this.particleSessionReady =
      false;

    this.pendingWindowSignature =
      null;

    this.deferredWindow =
      null;

    if (
      sessionId ===
        null
    ) {
      return;
    }

    void this.workerClient
      .execute(
        'galactic-map-particle-release',
        {
          sessionId,
        },
      )
      .catch(
        () => {
          // Releasing renderer-only cache state is best-effort.
        },
      );
  }

  private replaceMaterializedPoints(
    materialized:
      GalacticMapWorkerParticleBatch,
  ): void {

    if (
      this.galaxyGroup ===
        null ||
      this.pointMaterial ===
        null
    ) {
      return;
    }

    if (
      this.points !==
        null
    ) {
      this.points.removeFromParent();
      this.points.geometry.dispose();
      this.points =
        null;
    }

    this.activeSourceIndices =
      materialized.sourceIndices;

    if (
      materialized.count ===
        0
    ) {
      return;
    }

    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        materialized.positions,
        3,
      ),
    );

    geometry.setAttribute(
      'customColor',
      new THREE.BufferAttribute(
        materialized.colors,
        3,
      ),
    );

    geometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(
        materialized.sizes,
        1,
      ),
    );

    geometry.setAttribute(
      'aOpacity',
      new THREE.BufferAttribute(
        materialized.opacities,
        1,
      ),
    );

    geometry.computeBoundingSphere();

    const points =
      new THREE.Points(
        geometry,
        this.pointMaterial,
      );

    points.name =
      'galactic-map-active-particle-batch';

    this.galaxyGroup.add(
      points,
    );

    this.points =
      points;
  }

  private showSelectionMarker(
    selection:
      GalacticMapVisualSelection,
  ): void {

    this.clearSelection();

    const geometry =
      new THREE.SphereGeometry(
        0.036,
        12,
        8,
      );

    const material =
      new THREE.MeshBasicMaterial({
        color:
          0x6ad7ff,
        transparent:
          true,
        opacity:
          0.92,
        wireframe:
          true,
        depthTest:
          false,
        depthWrite:
          false,
        toneMapped:
          false,
      });

    const marker =
      new THREE.Mesh(
        geometry,
        material,
      );

    marker.position.set(
      selection.renderX,
      selection.renderY,
      selection.renderZ,
    );

    marker.renderOrder =
      1000;

    if (
      this.galaxyGroup !==
        null
    ) {
      this
        .galaxyGroup
        .updateWorldMatrix(
          true,
          false,
        );

      this
        .galaxyGroup
        .worldToLocal(
          marker.position,
        );

      this.galaxyGroup.add(
        marker,
      );
    } else {
      this.scene.add(
        marker,
      );
    }

    this.selectionMarker =
      marker;

    this.renderFrame();
  }

  private showSectorSelectionMarker(
    selection:
      GalacticMapSectorSelection,
  ): void {

    this.clearSectorSelection();

    const coverage =
      this.activeCoverage;

    const galaxyGroup =
      this.galaxyGroup;

    if (
      coverage ===
        null ||
      galaxyGroup ===
        null ||
      this.activeHaloOuterRadiusNormalized <=
        0
    ) {
      return;
    }

    const cell =
      sectorCellSize(
        coverage,
        this.activeHaloOuterRadiusNormalized,
      );

    const half =
      cell *
      0.43;

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints([
          new THREE.Vector3(
            -half,
            -half,
            0.018,
          ),
          new THREE.Vector3(
            half,
            -half,
            0.018,
          ),
          new THREE.Vector3(
            half,
            half,
            0.018,
          ),
          new THREE.Vector3(
            -half,
            half,
            0.018,
          ),
        ]);

    const material =
      new THREE.LineBasicMaterial({
        color:
          selection.explored
            ? 0x9db3c7
            : 0x6ad7ff,
        transparent:
          true,
        opacity:
          0.98,
        depthTest:
          false,
        depthWrite:
          false,
        toneMapped:
          false,
      });

    const marker =
      new THREE.LineLoop(
        geometry,
        material,
      );

    const position =
      sectorLocalPosition(
        coverage,
        selection.coordinates,
        this.activeHaloOuterRadiusNormalized,
      );

    marker.position.set(
      position.x,
      position.y,
      0,
    );

    marker.renderOrder =
      1100;

    galaxyGroup.add(
      marker,
    );

    this.sectorSelectionMarker =
      marker;

    this.renderFrame();
  }

  private renderFrame():
    void {

    this
      .renderer
      .render(
        this.scene,
        this.camera,
      );
  }

  private disposePoints():
    void {

    this.releaseActiveParticleSession();

    if (
      this.galaxyGroup !==
      null
    ) {
      this.scene.remove(
        this.galaxyGroup,
      );

      this.galaxyGroup.clear();
    } else if (
      this.points !==
      null
    ) {
      this.scene.remove(
        this.points,
      );
    }

    if (
      this.points !==
      null
    ) {
      this
        .points
        .geometry
        .dispose();
    }

    this
      .pointMaterial
      ?.dispose();

    this
      .sectorOverlay
      ?.dispose();

    this
      .discoveryMarkerOverlay
      ?.dispose();

    this
      .environmentalOverlay
      ?.dispose();

    this.points =
      null;

    this.pointMaterial =
      null;

    this.activeSourceIndices =
      new Uint32Array();

    this.activeWindowSignature =
      null;

    this.activeCoverage =
      null;

    this.activeHaloOuterRadiusNormalized =
      0;

    this.particleRequestRevision =
      0;

    this.particleAppliedRevision =
      0;

    this.lodStateValue =
      Object.freeze({
        sourceParticleCount:
          0,
        materializedParticleCount:
          0,
        visibleSectorCount:
          0,
        activeSectorCount:
          0,
        lodLevel:
          GalacticMapLodLevel.OVERVIEW,
        particleRetentionRatio:
          0.88,
        cacheEntryCount:
          0,
      });

    this.workerStateValue =
      Object.freeze({
        status:
          GalacticMapWorkerStatus.IDLE,
        runtime:
          null,
        requestRevision:
          0,
        appliedRevision:
          0,
        pending:
          false,
      });

    this.sectorOverlay =
      null;

    this.discoveryMarkerOverlay =
      null;

    this.environmentalOverlay =
      null;

    this.galaxyGroup =
      null;

    this.galaxySpinRadiansValue =
      0;

    this.staticGalaxyTiltRadians =
      0;

    this.emitLodState();
    this.emitWorkerState();
  }

}

export function applyGalaxyVisualRotation(
  group:
    THREE.Object3D,

  staticTiltRadians:
    number,

  galaxySpinRadians:
    number,
): void {

  const staticTilt =
    new THREE.Quaternion()
      .setFromAxisAngle(
        new THREE.Vector3(
          1,
          0,
          0,
        ),
        staticTiltRadians,
      );

  const localSpin =
    new THREE.Quaternion()
      .setFromAxisAngle(
        new THREE.Vector3(
          0,
          0,
          1,
        ),
        galaxySpinRadians,
      );

  group.quaternion
    .copy(
      staticTilt,
    )
    .multiply(
      localSpin,
    );
}

function normalizeSignedRadians(
  radians:
    number,
): number {

  return THREE.MathUtils.euclideanModulo(
    radians +
      Math.PI,
    Math.PI *
      2,
  ) -
  Math.PI;
}

/**
 * Point-10.1 framing multiplier frozen by the visual-approval pass.
 *
 * Point 10.2 camera interaction and the secondary-button visual galaxy spin do
 * not change these morphology-specific framing values.
 */
export function staticPresentationScaleMultiplier(
  model:
    GalacticMapModel,
): number {

  if (
    model.galaxyType ===
    GalaxyType.DWARF
  ) {
    return 1.34;
  }

  if (
    model.galaxyType ===
    GalaxyType.IRREGULAR
  ) {
    return 1.20;
  }

  return 1;
}

/**
 * Static point-10.1 disk presentation tilt, frozen at 20 degrees.
 *
 * OrbitControls move the camera around this already-approved renderer
 * presentation. Secondary-button spin composes a local visual Z rotation after
 * this tilt; Ground Truth visual structure remains untouched.
 */
export function staticPresentationTiltRadians(
  _model:
    GalacticMapModel,
): number {

  // Point-10.2 presentation contract: every galactic morphology starts from
  // the same visual plane. The shared camera position defines the initial
  // inclination; morphology must not add a second, hidden presentation tilt.
  return 0;
}

function createGalaxyPointMaterial(
  pixelRatio:
    number,

  lodLevel:
    GalacticMapLodLevel,
): THREE.ShaderMaterial {

  const visibility =
    galacticMapPointVisibilityProfile(
      lodLevel,
    );

  return new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: {
        value:
          pixelRatio,
      },

      uPointScale: {
        value:
          visibility
            .pointScale,
      },

      uOpacityScale: {
        value:
          visibility
            .opacityScale,
      },

      uOuterVisibilityScale: {
        value:
          visibility
            .outerVisibilityScale,
      },
    },

    vertexShader: `
      attribute vec3 customColor;
      attribute float aSize;
      attribute float aOpacity;

      varying vec3 vColor;
      varying float vOpacity;

      uniform float uPixelRatio;
      uniform float uPointScale;
      uniform float uOpacityScale;
      uniform float uOuterVisibilityScale;

      void main() {
        vColor = customColor;

        float radialVisibility = mix(
          1.0,
          uOuterVisibilityScale,
          smoothstep(
            0.18,
            0.92,
            length(position.xy)
          )
        );

        vOpacity = min(
          1.0,
          aOpacity *
          uOpacityScale *
          radialVisibility
        );

        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float distanceScale = clamp(
          3.0 / max(0.75, -mvPosition.z),
          0.58,
          1.42
        );

        gl_PointSize =
          aSize *
          uPixelRatio *
          0.92 *
          uPointScale *
          distanceScale;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,

    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;

      void main() {
        vec2 centered = gl_PointCoord - vec2(0.5);
        float distanceFromCenter = length(centered);

        if (distanceFromCenter > 0.5) {
          discard;
        }

        float glow = 1.0 - smoothstep(
          0.10,
          0.50,
          distanceFromCenter
        );

        float core = 1.0 - smoothstep(
          0.00,
          0.13,
          distanceFromCenter
        );

        float alpha = min(
          1.0,
          vOpacity * (
            0.38 * glow +
            0.62 * core
          )
        );

        gl_FragColor = vec4(vColor, alpha);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,

    transparent:
      true,

    depthTest:
      true,

    depthWrite:
      false,

    blending:
      THREE.AdditiveBlending,

    toneMapped:
      true,
  });
}
