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

import * as THREE from 'three';

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
  GalacticMapParticleLayoutGenerator,
} from './galactic-map-particle-layout';

import {
  createGalacticMapSectorOverlay,
  type GalacticMapSectorOverlay,
} from './galactic-map-sector-overlay';

const CLICK_MAX_MOVEMENT_PX =
  6;

export interface GalacticMapSceneRenderInfo {
  readonly particleCount:
    number;
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

  selectAt(
    clientX:
      number,

    clientY:
      number,
  ): GalacticMapVisualSelection | null;

  clearSelection():
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

      factory: () =>
        createThreeGalacticMapSceneRuntime,
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
 * Point-10.5 Angular host for the Three.js scene.
 *
 * It preserves the approved point-10.2 camera/selection behavior. The
 * secondary mouse button now spins the complete rendered galaxy around its own
 * local axis without moving the camera. Point-10.3 sector coverage and point-10.4 persistent markers. Point 10.5 adds six
 * independently switchable thematic layers without changing persistence or
 * turning GPU samples into physical targets.
 */
@Component({
  selector:
    'app-galactic-map-scene',

  standalone:
    true,

  imports: [
    GalacticMapLayerControls,
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

    const selection =
      this.runtime.selectAt(
        event.clientX,
        event.clientY,
      );

    this
      .selectionSignal
      .set(
        selection,
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
        .renderStateSignal
        .set(
          'error',
        );
    }
  }
}

function createThreeGalacticMapSceneRuntime(
  canvas:
    HTMLCanvasElement,
): GalacticMapSceneRuntime {

  return new ThreeGalacticMapSceneRuntime(
    canvas,
  );
}

class ThreeGalacticMapSceneRuntime
  implements GalacticMapSceneRuntime {

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

  private pixelRatio =
    1;

  constructor(
    canvas:
      HTMLCanvasElement,
  ) {
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
      this.points !==
      null
    ) {
      this
        .points
        .material
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

    this.renderFrame();
    this.emitCameraState();
  }

  render(
    model:
      GalacticMapModel,
  ): GalacticMapSceneRenderInfo {

    this.disposePoints();
    this.clearSelection();

    const layout =
      GalacticMapParticleLayoutGenerator
        .generate(
          model,
        );

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

    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        layout.positions,
        3,
      ),
    );

    geometry.setAttribute(
      'customColor',
      new THREE.BufferAttribute(
        layout.colors,
        3,
      ),
    );

    geometry.setAttribute(
      'aSize',
      new THREE.BufferAttribute(
        layout.sizes,
        1,
      ),
    );

    geometry.setAttribute(
      'aOpacity',
      new THREE.BufferAttribute(
        layout.opacities,
        1,
      ),
    );

    geometry.computeBoundingSphere();

    const material =
      createGalaxyPointMaterial(
        this.pixelRatio,
      );

    const points =
      new THREE.Points(
        geometry,
        material,
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

    galaxyGroup.add(
      points,
    );

    this.scene.add(
      galaxyGroup,
    );

    this.galaxyGroup =
      galaxyGroup;

    this.points =
      points;

    this.applyLayerVisibility();
    this.renderFrame();
    this.emitGalaxySpinState();

    return Object.freeze({
      particleCount:
        layout.count,
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

    this.galaxySpinRadiansValue =
      0;

    this.applyCurrentGalaxyVisualRotation();
    this.emitGalaxySpinState();

    this
      .cameraController
      .resetView();

    this.renderFrame();
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

    this.showSelectionMarker(
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

  dispose():
    void {

    this.cameraStateListener =
      null;

    this.galaxySpinStateListener =
      null;

    this.clearSelection();
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

      this
        .points
        .material
        .dispose();
    }

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
): THREE.ShaderMaterial {

  return new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: {
        value:
          pixelRatio,
      },
    },

    vertexShader: `
      attribute vec3 customColor;
      attribute float aSize;
      attribute float aOpacity;

      varying vec3 vColor;
      varying float vOpacity;

      uniform float uPixelRatio;

      void main() {
        vColor = customColor;
        vOpacity = aOpacity;

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

        float alpha = vOpacity * (
          0.38 * glow +
          0.62 * core
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
