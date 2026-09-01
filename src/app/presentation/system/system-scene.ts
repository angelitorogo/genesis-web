import {
  isPlatformBrowser,
} from '@angular/common';

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

import {
  type MinorBodyKindValue,
} from '../../domain/planetary/minor-body-kind';

import {
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
  SystemOrbitalMotionEngine,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  SystemSimulationClock,
} from './system-simulation-clock';

import {
  SystemSceneCameraController,
} from './system-scene-camera-controller';

import {
  SystemSceneProjectionSpace,
  systemSceneProjectAuVector,
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
}

type SystemSceneSelectableBodySnapshot =
  | SystemSceneBodySnapshot
  | SystemSceneMoonSnapshot
  | SystemSceneMinorBodySnapshot;

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
  ): SystemSceneRenderInfo;

  resetView?():
    void;

  setLayerVisibility?(
    visibility:
      SystemSceneLayerVisibility,
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
          ) =>
            createThreeSystemSceneRuntime(
              canvas,
              onSelectionChange,
            ),
    },
  );

/**
 * Point-24.7 Angular host for the stellar-system Three.js scene.
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

  private readonly onWindowResize =
    () => {
      this.resizeRuntime();
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

  private readonly planetsVisibleSignal =
    signal(
      true,
    );

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

  readonly planetsVisible =
    this.planetsVisibleSignal.asReadonly();

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

  readonly selection =
    this
      .selectionSignal
      .asReadonly();

  readonly renderState =
    this
      .renderStateSignal
      .asReadonly();

  readonly renderInfo =
    this
      .renderInfoSignal
      .asReadonly();

  planetCount():
    number {
    return this.snapshot.planets.length;
  }

  habitableZoneCount():
    number {
    return this.snapshot.layers.habitableZoneAvailable
      ? 1
      : 0;
  }

  orbitalRiskTargetCount():
    number {
    return this.snapshot.layers.orbitalRiskTargetCount;
  }

  orbitalRiskRelevantTargetCount():
    number {
    return this.snapshot.orbitalRiskTargets.length;
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

  togglePlanets():
    void {

    if (
      this.snapshot.planets.length ===
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

    if (
      this.snapshot.orbitalRiskTargets.length ===
        0
    ) {
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
                .bodySelectionChange
                .emit(
                  selection,
                );
            },
          );

      this.installResizeHandling();
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

    if (
      changes[
        'snapshot'
      ] !==
        undefined &&
      this.runtime !==
        null
    ) {
      this.renderSnapshot();
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
  }

  private applyLayerVisibility():
    void {

    this.runtime
      ?.setLayerVisibility?.({
        planets:
          this.planetsVisibleSignal() &&
          this.snapshot.planets.length >
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
          this.asteroidCount() >
            0,
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
      });
  }

  private toggleMinorBodyLayer(
    layer:
      SystemSceneMinorBodyLayerKey,
  ): void {

    if (
      this.minorBodyCountForLayer(
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

    try {
      if (
        this.snapshot.planets.length ===
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

      if (
        this.snapshot.orbitalRiskTargets.length ===
          0
      ) {
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

      const info =
        this
          .runtime
          .render(
            this.snapshot,
          );

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
): SystemSceneRuntime {

  return new ThreeSystemSceneRuntime(
    canvas,
    onSelectionChange,
  );
}

class ThreeSystemSceneRuntime
  implements SystemSceneRuntime {

  private readonly renderer:
    THREE.WebGLRenderer;

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

  private readonly animatedBodies =
    new Map<string, THREE.Group>();

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

  private habitableZoneGroup:
    THREE.Group | null =
    null;

  private habitableZoneSnapshot:
    SystemSceneHabitableZoneSnapshot | null =
    null;

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

  private readonly asteroidLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly cometLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly transNeptunianObjectLayerObjects:
    THREE.Object3D[] =
    [];

  private readonly capturedObjectLayerObjects:
    THREE.Object3D[] =
    [];

  private minorBodyOrbitLayerKeys =
    new Map<string, SystemSceneMinorBodyLayerKey>();

  private layerVisibility:
    SystemSceneLayerVisibility =
    Object.freeze({
      planets: true,
      moons: false,
      habitableZone: false,
      orbitalRisk: false,
      asteroids: false,
      comets: false,
      transNeptunianObjects: false,
      capturedObjects: false,
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

  private readonly cameraController:
    SystemSceneCameraController;

  private currentSnapshot:
    SystemSceneSnapshot | null =
    null;

  private simulationClock:
    SystemSimulationClock | null =
    null;

  private motionById =
    new Map<string, SystemSceneOrbitalMotionSnapshot>();

  private readonly onAnimationFrame =
    (
      realTimestampMilliseconds:
        number,
    ): void => {

      if (
        this.currentSnapshot ===
          null ||
        this.simulationClock ===
          null
      ) {
        return;
      }

      const simulationState =
        this.simulationClock.read(
          realTimestampMilliseconds,
        );

      this.applySimulationDay(
        simulationState.simulationDay,
      );

      this.renderFrame();
    };

  private disposed =
    false;

  constructor(
    private readonly canvas:
      HTMLCanvasElement,

    private readonly onSelectionChange:
      SystemSceneSelectionChangeHandler,
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
  ): SystemSceneRenderInfo {

    this.assertAlive();

    this.scene.name =
      `GENESIS System ${snapshot.proceduralIdentity}`;

    this
      .renderer
      .setAnimationLoop(
        null,
      );

    this.clearFrameObjects();
    this.currentSnapshot =
      snapshot;
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
    );

    if (
      snapshot.habitableZone !==
        null
    ) {
      this.addHabitableZone(
        snapshot.habitableZone,
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

    for (
      const planet
      of snapshot.planets
    ) {
      this.addPlanet(
        planet,
      );
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

    if (
      snapshot.motions.length >
      0
    ) {
      this
        .renderer
        .setAnimationLoop(
          this.onAnimationFrame,
        );
    }

    return Object.freeze({
      renderer:
        'WEBGL2' as const,

      physicalBodyCount:
        snapshot.stars.length +
        snapshot.planets.length +
        snapshot.moons.length +
        snapshot.minorBodies.length,

      sceneObjectCount:
        countDescendants(
          this.scene,
        ),
    });
  }

  setLayerVisibility(
    visibility:
      SystemSceneLayerVisibility,
  ): void {

    this.assertAlive();
    this.layerVisibility =
      Object.freeze({
        ...visibility,
      });
    this.applyLayerVisibilityToObjects();
    this.renderFrame();
  }

  private applyLayerVisibilityToObjects():
    void {
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

    this.disposed =
      true;

    this.currentSnapshot =
      null;
    this.simulationClock =
      null;
    this.motionById.clear();

    this.clearFrameObjects();
    this.cameraController.dispose();
    disposeResources(
      this.persistentDisposables,
    );

    this
      .renderer
      .setAnimationLoop(
        null,
      );

    this
      .renderer
      .dispose();

    this
      .renderer
      .forceContextLoss();
  }

  resetView():
    void {

    this.assertAlive();
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

    const radiativeGeometry =
      new THREE.RingGeometry(
        habitableZone.radiativeInnerRadiusScene,
        habitableZone.radiativeOuterRadiusScene,
        192,
      );

    const radiativeMaterial =
      new THREE.MeshBasicMaterial({
        color:
          0x4c9fb2,
        transparent:
          true,
        opacity:
          0.14,
        side:
          THREE.DoubleSide,
        depthWrite:
          false,
        depthTest:
          false,
        blending:
          THREE.AdditiveBlending,
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

    this.addHabitableZoneBoundary(
      group,
      habitableZone.radiativeInnerRadiusScene,
      0x5eb6c8,
      0.58,
    );

    this.addHabitableZoneBoundary(
      group,
      habitableZone.radiativeOuterRadiusScene,
      0x5eb6c8,
      0.58,
    );

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

    this.habitableZoneGroup =
      group;
    this.habitableZoneSnapshot =
      habitableZone;

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

    const material =
      new THREE.LineBasicMaterial({
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

    line.renderOrder =
      74;

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
      const orbitSamples =
        orbit.kind ===
          'minor-body'
          ? SystemOrbitalMotionEngine
              .sampleClosedOrbitPath(
                motion,
                ORBIT_SEGMENT_COUNT,
              )
          : Array.from(
              {
                length:
                  ORBIT_SEGMENT_COUNT,
              },
              (
                _,
                index,
              ) =>
                SystemOrbitalMotionEngine
                  .positionAtSimulationDay(
                    motion,
                    motion.periodDays *
                      index /
                      ORBIT_SEGMENT_COUNT,
                  ),
            );

      this.orbitLocalSamplesAu.set(
        orbit.id,
        Object.freeze(
          orbitSamples.map(
            sample =>
              Object.freeze({
                x:
                  sample.xAu,
                y:
                  sample.yAu,
                z:
                  sample.zAu,
              }),
          ),
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

    const material =
      new THREE.LineBasicMaterial({
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
            linearScenePerAu;
          yScene =
            sample.y *
            orbit.motionScale *
            linearScenePerAu;
          zScene =
            sample.z *
            orbit.motionScale *
            linearScenePerAu;
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

          const postProjectionScale =
            projectionSpace ===
              SystemSceneProjectionSpace.GLOBAL
              ? 1
              : orbit.motionScale;

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

    const sphereGeometry =
      new THREE.SphereGeometry(
        star.radiusScene,
        48,
        32,
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

    photosphere.name =
      `${star.label} photosphere`;

    const optics =
      stellarOpticalProfile(
        star,
      );

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
      star.radiusScene *
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
      star.radiusScene *
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
      star.radiusScene *
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
      star.radiusScene *
        optics.glareDiameterScale,
      star.radiusScene *
        optics.glareDiameterScale,
      1,
    );
    glare.name =
      `${star.label} diffraction glare`;

    const light =
      new THREE.PointLight(
        star.colorHex,
        star.lightIntensity *
          7.5,
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
      sphereGeometry,
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

    const sphereGeometry =
      new THREE.SphereGeometry(
        planet.radiusScene,
        40,
        28,
      );

    const appearance =
      createPlanetAppearance(
        planet,
      );

    const sphere =
      new THREE.Mesh(
        sphereGeometry,
        appearance.material,
      );

    sphere.rotation.y =
      appearance.rotationYRadians;

    sphere.rotation.z =
      appearance.rotationZRadians;

    group.add(
      sphere,
    );

    for (
      const overlay
      of appearance.overlays
    ) {
      overlay.rotation.y =
        appearance.rotationYRadians;

      overlay.rotation.z =
        appearance.rotationZRadians;

      group.add(
        overlay,
      );
    }

    this.frameDisposables.push(
      sphereGeometry,
      appearance.material,
      ...appearance.resources,
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

    const geometry =
      new THREE.SphereGeometry(
        moon.radiusScene,
        20,
        14,
      );

    const material =
      new THREE.MeshStandardMaterial({
        color:
          moon.colorHex,
        roughness:
          0.82,
        metalness:
          0.01,
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
        emissive:
          body.minorBodyKind.name ===
            'COMET'
            ? new THREE.Color(
                body.colorHex,
              )
            : new THREE.Color(
                0x000000,
              ),
        emissiveIntensity:
          body.minorBodyKind.name ===
            'COMET'
            ? 0.22
            : 0,
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
        body.radiusScene,
      );

    const geometry =
      new THREE.SphereGeometry(
        pickRadius,
        14,
        10,
      );

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

    const proxy =
      new THREE.Mesh(
        geometry,
        material,
      );

    proxy.name =
      `${body.title} selection proxy`;
    proxy.userData[
      'systemSceneBodyId'
    ] =
      body.id;

    group.add(
      proxy,
    );

    this.selectableObjects.push(
      proxy,
    );
    this.bodySnapshotById.set(
      body.id,
      body,
    );
    this.frameDisposables.push(
      geometry,
      material,
    );
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

    const bodyId =
      intersection
        ?.object
        .userData[
          'systemSceneBodyId'
        ];

    this.selectBody(
      typeof bodyId ===
        'string'
        ? bodyId
        : null,
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

    const diameter =
      body.kind ===
        'star'
        ? Math.max(
            body.radiusScene *
              4.5,
            0.46,
          )
        : Math.max(
            body.radiusScene *
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

    for (
      const body
      of [
        ...snapshot.stars,
        ...snapshot.planets,
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
        this.positionFromContributions(
          body.motionContributions,
          simulationDay,
          sceneScale,
        );

      object.position.set(
        position.x,
        position.y,
        position.z,
      );
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

    if (
      this.habitableZoneGroup !==
        null &&
      this.habitableZoneSnapshot !==
        null
    ) {
      const habitableZoneAnchor =
        this.positionFromContributions(
          this.habitableZoneSnapshot
            .anchorMotionContributions,
          simulationDay,
          sceneScale,
        );

      this.habitableZoneGroup.position.copy(
        habitableZoneAnchor,
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
  }

  private positionFromContributions(
    contributions:
      readonly SystemSceneMotionContributionSnapshot[],

    simulationDay:
      number,

    sceneScale:
      SystemSceneScaleSnapshot,
  ): THREE.Vector3 {

    let globalXAu = 0;
    let globalYAu = 0;
    let globalZAu = 0;
    let sceneX = 0;
    let sceneY = 0;
    let sceneZ = 0;

    for (
      const contribution
      of contributions
    ) {
      const motion =
        this.motionById.get(
          contribution.motionId,
        );

      if (
        motion ===
        undefined
      ) {
        continue;
      }

      const presentationTimeScale =
        contribution.presentationTimeScale ??
        1;

      const position =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            motion,
            simulationDay *
              presentationTimeScale,
          );

      const linearScenePerAu =
        contribution.linearScenePerAu ??
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
        sceneX +=
          position.xAu *
          contribution.scale *
          linearScenePerAu;
        sceneY +=
          position.yAu *
          contribution.scale *
          linearScenePerAu;
        sceneZ +=
          position.zAu *
          contribution.scale *
          linearScenePerAu;
        continue;
      }

      const projectionSpace =
        contribution.projectionSpace ??
        SystemSceneProjectionSpace.GLOBAL;

      if (
        projectionSpace ===
        SystemSceneProjectionSpace.GLOBAL
      ) {
        globalXAu +=
          position.xAu *
          contribution.scale;
        globalYAu +=
          position.yAu *
          contribution.scale;
        globalZAu +=
          position.zAu *
          contribution.scale;
        continue;
      }

      const projected =
        systemSceneProjectAuVectorInSpace(
          {
            x:
              position.xAu,
            y:
              position.yAu,
            z:
              position.zAu,
          },
          sceneScale,
          projectionSpace,
        );

      sceneX +=
        projected.x *
        contribution.scale;
      sceneY +=
        projected.y *
        contribution.scale;
      sceneZ +=
        projected.z *
        contribution.scale;
    }

    const globalProjected =
      systemSceneProjectAuVector(
        {
          x:
            globalXAu,
          y:
            globalYAu,
          z:
            globalZAu,
        },
        sceneScale,
      );

    return new THREE.Vector3(
      sceneX +
        globalProjected.x,
      sceneY +
        globalProjected.y,
      sceneZ +
        globalProjected.z,
    );
  }

  private clearFrameObjects():
    void {

    if (
      this.selectionMarker !==
        null
    ) {
      this.selectionMarker.removeFromParent();
      this.selectionMarker.material.dispose();
    }

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
    this.selectableObjects.length =
      0;
    this.planetLayerObjects.length =
      0;
    this.moonLayerObjects.length =
      0;
    this.habitableZoneLayerObjects.length =
      0;
    this.orbitalRiskLayerObjects.length =
      0;
    this.habitableZoneGroup =
      null;
    this.habitableZoneSnapshot =
      null;
    this.orbitalRiskOrbitOverlays.length =
      0;
    this.orbitalRiskMarkers.length =
      0;
    this.asteroidLayerObjects.length =
      0;
    this.cometLayerObjects.length =
      0;
    this.transNeptunianObjectLayerObjects.length =
      0;
    this.capturedObjectLayerObjects.length =
      0;
    this.minorBodyOrbitLayerKeys.clear();
    this.bodySnapshotById.clear();
    this.animatedBodies.clear();
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

  private renderFrame():
    void {

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

interface PlanetAppearance {
  readonly material:
    THREE.MeshStandardMaterial;

  readonly overlays:
    readonly THREE.Object3D[];

  readonly resources:
    readonly { dispose(): void }[];

  readonly rotationYRadians:
    number;

  readonly rotationZRadians:
    number;
}

function createPlanetAppearance(
  planet:
    SystemSceneBodySnapshot,
): PlanetAppearance {

  const visualSeed =
    hashStringToUint32(
      `${planet.id}|${planet.title}|${planet.colorHex}|${planet.radiusScene.toFixed(4)}|${planet.position.x.toFixed(4)}|${planet.position.y.toFixed(4)}|${planet.position.z.toFixed(4)}`,
    );

  const random =
    createDeterministicPrng(
      visualSeed,
    );

  const baseColor =
    new THREE.Color(
      planet.colorHex,
    );

  const surfaceTexture =
    createPlanetSurfaceTexture(
      planet,
      baseColor,
      visualSeed,
    );

  const resources: Array<{ dispose(): void }> = [
    surfaceTexture,
  ];

  const materialOptions: THREE.MeshStandardMaterialParameters = {
    color:
      0xffffff,
    map:
      surfaceTexture,
  };

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

    case 'volcanic': {
      const emissiveTexture =
        createVolcanicEmissiveTexture(
          baseColor,
          visualSeed,
        );

      materialOptions.roughness =
        0.92;
      materialOptions.metalness =
        0.01;
      materialOptions.emissive =
        0xff6d2d;
      materialOptions.emissiveIntensity =
        0.9;
      materialOptions.emissiveMap =
        emissiveTexture;
      resources.push(
        emissiveTexture,
      );
      break;
    }

    default:
      materialOptions.roughness =
        0.86;
      materialOptions.metalness =
        0.03;
      break;
  }

  const material =
    new THREE.MeshStandardMaterial(
      materialOptions,
    );

  const overlays: THREE.Object3D[] = [];

  const cloudLayer =
    cloudLayerMeshOrNull(
      planet,
      baseColor,
      visualSeed,
    );

  if (
    cloudLayer !==
    null
  ) {
    overlays.push(
      cloudLayer.mesh,
    );

    resources.push(
      cloudLayer.texture,
      cloudLayer.geometry,
      cloudLayer.material,
    );
  }

  const atmosphere =
    atmosphereMeshOrNull(
      planet,
      baseColor,
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
    overlays:
      Object.freeze(overlays),
    resources:
      Object.freeze(resources),
    rotationYRadians:
      random() *
      Math.PI *
      2,
    rotationZRadians:
      (random() - 0.5) *
      0.2,
  });
}

function createPlanetSurfaceTexture(
  planet:
    SystemSceneBodySnapshot,

  baseColor:
    THREE.Color,

  seed:
    number,
): THREE.CanvasTexture {

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    512;
  canvas.height =
    256;

  const context =
    canvas.getContext(
      '2d',
    );

  if (
    context ===
      null
  ) {
    throw new Error(
      'Unable to create procedural planet texture.',
    );
  }

  const random =
    createDeterministicPrng(
      seed,
    );

  const palette =
    proceduralPlanetPalette(
      planet.surfaceStyle,
      baseColor,
    );

  fillPlanetBackground(
    context,
    canvas.width,
    canvas.height,
    palette.top,
    palette.bottom,
  );

  switch (
    planet.surfaceStyle
  ) {
    case 'gaseous':
      drawGaseousBands(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
      );
      drawAtmosphericStorms(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
      );
      break;

    case 'oceanic':
      drawSurfacePatches(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
        26,
        0.24,
      );
      drawOceanCurrents(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
      );
      drawPolarCaps(
        context,
        canvas.width,
        canvas.height,
        palette.highlight,
        0.26,
      );
      break;

    case 'icy':
      drawSurfacePatches(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
        30,
        0.22,
      );
      drawFractureNetwork(
        context,
        canvas.width,
        canvas.height,
        random,
        palette.shadow,
        18,
        0.14,
      );
      drawPolarCaps(
        context,
        canvas.width,
        canvas.height,
        palette.highlight,
        0.38,
      );
      break;

    case 'volcanic':
      drawSurfacePatches(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
        24,
        0.16,
      );
      drawVolcanicMagmaHints(
        context,
        canvas.width,
        canvas.height,
        random,
      );
      break;

    case 'rocky':
    default:
      drawSurfacePatches(
        context,
        canvas.width,
        canvas.height,
        random,
        palette,
        28,
        0.20,
      );

      if (
        baseColor.r >
        baseColor.b +
          0.08
      ) {
        drawDuneBands(
          context,
          canvas.width,
          canvas.height,
          random,
          palette,
        );
      } else {
        drawCraterHints(
          context,
          canvas.width,
          canvas.height,
          random,
          palette,
        );
      }
      break;
  }

  overlayPlanetVignette(
    context,
    canvas.width,
    canvas.height,
  );

  const texture =
    new THREE.CanvasTexture(
      canvas,
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.needsUpdate =
    true;
  texture.wrapS =
    THREE.RepeatWrapping;
  texture.wrapT =
    THREE.ClampToEdgeWrapping;

  return texture;
}

function createVolcanicEmissiveTexture(
  baseColor:
    THREE.Color,

  seed:
    number,
): THREE.CanvasTexture {

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    512;
  canvas.height =
    256;

  const context =
    canvas.getContext(
      '2d',
    );

  if (
    context ===
      null
  ) {
    throw new Error(
      'Unable to create volcanic emissive texture.',
    );
  }

  context.fillStyle =
    'black';
  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const random =
    createDeterministicPrng(
      seed ^
      0x9e3779b9,
    );

  const lava =
    baseColor.clone()
      .lerp(
        new THREE.Color(
          '#FFB066',
        ),
        0.48,
      );

  drawFractureNetwork(
    context,
    canvas.width,
    canvas.height,
    random,
    lava,
    24,
    0.64,
  );
  drawEmissiveHotspots(
    context,
    canvas.width,
    canvas.height,
    random,
    lava,
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

function cloudLayerMeshOrNull(
  planet:
    SystemSceneBodySnapshot,

  baseColor:
    THREE.Color,

  seed:
    number,
): {
  readonly mesh:
    THREE.Mesh;

  readonly geometry:
    THREE.SphereGeometry;

  readonly material:
    THREE.MeshStandardMaterial;

  readonly texture:
    THREE.CanvasTexture;
} | null {

  if (
    planet.surfaceStyle !==
      'oceanic' &&
    planet.surfaceStyle !==
      'gaseous' &&
    planet.surfaceStyle !==
      'icy'
  ) {
    return null;
  }

  const canvas =
    document.createElement(
      'canvas',
    );

  canvas.width =
    512;
  canvas.height =
    256;

  const context =
    canvas.getContext(
      '2d',
    );

  if (
    context ===
      null
  ) {
    throw new Error(
      'Unable to create procedural cloud layer texture.',
    );
  }

  const random =
    createDeterministicPrng(
      seed ^
      0x85ebca6b,
    );

  context.clearRect(
    0,
    0,
    canvas.width,
    canvas.height,
  );

  drawCloudWisps(
    context,
    canvas.width,
    canvas.height,
    random,
    planet.surfaceStyle ===
      'gaseous'
      ? 34
      : 22,
    planet.surfaceStyle ===
      'gaseous'
      ? 0.15
      : 0.24,
  );

  if (
    planet.surfaceStyle ===
    'gaseous'
  ) {
    drawCloudBandVeils(
      context,
      canvas.width,
      canvas.height,
      random,
    );
  }

  const texture =
    new THREE.CanvasTexture(
      canvas,
    );

  texture.colorSpace =
    THREE.SRGBColorSpace;
  texture.needsUpdate =
    true;

  const geometry =
    new THREE.SphereGeometry(
      planet.radiusScene *
        1.024,
      32,
      22,
    );

  const material =
    new THREE.MeshStandardMaterial({
      color:
        baseColor.clone()
          .lerp(
            new THREE.Color(
              0xffffff,
            ),
            0.86,
          ),
      map:
        texture,
      transparent:
        true,
      opacity:
        planet.surfaceStyle ===
          'gaseous'
          ? 0.42
          : 0.6,
      depthWrite:
        false,
      roughness:
        0.92,
      metalness:
        0,
    });

  return Object.freeze({
    mesh:
      new THREE.Mesh(
        geometry,
        material,
      ),
    geometry,
    material,
    texture,
  });
}

function atmosphereMeshOrNull(
  planet:
    SystemSceneBodySnapshot,

  baseColor:
    THREE.Color,
): {
  readonly mesh:
    THREE.Mesh;

  readonly geometry:
    THREE.SphereGeometry;

  readonly material:
    THREE.MeshBasicMaterial;
} | null {

  if (
    planet.surfaceStyle ===
      'rocky' ||
    planet.surfaceStyle ===
      'volcanic'
  ) {
    return null;
  }

  const geometry =
    new THREE.SphereGeometry(
      planet.radiusScene *
        (planet.surfaceStyle ===
          'gaseous'
          ? 1.11
          : 1.07),
      24,
      16,
    );

  const material =
    new THREE.MeshBasicMaterial({
      color:
        baseColor.clone()
          .lerp(
            new THREE.Color(
              0xffffff,
            ),
            0.52,
          ),
      transparent:
        true,
      opacity:
        planet.surfaceStyle ===
          'gaseous'
          ? 0.16
          : planet.surfaceStyle ===
              'oceanic'
            ? 0.11
            : 0.085,
      blending:
        THREE.AdditiveBlending,
      depthWrite:
        false,
      toneMapped:
        false,
    });

  return Object.freeze({
    mesh:
      new THREE.Mesh(
        geometry,
        material,
      ),
    geometry,
    material,
  });
}

interface ProceduralPlanetPalette {
  readonly top:
    THREE.Color;

  readonly bottom:
    THREE.Color;

  readonly mid:
    THREE.Color;

  readonly highlight:
    THREE.Color;

  readonly shadow:
    THREE.Color;
}

function proceduralPlanetPalette(
  surfaceStyle:
    SystemSceneBodySnapshot['surfaceStyle'],

  baseColor:
    THREE.Color,
): ProceduralPlanetPalette {

  switch (
    surfaceStyle
  ) {
    case 'oceanic':
      return Object.freeze({
        top:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#0E2244',
              ),
              0.42,
            ),
        bottom:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#184D8A',
              ),
              0.36,
            ),
        mid:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#3DA6C3',
              ),
              0.22,
            ),
        highlight:
          new THREE.Color(
            '#E7F7FF',
          ),
        shadow:
          new THREE.Color(
            '#10243E',
          ),
      });

    case 'icy':
      return Object.freeze({
        top:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#F4FBFF',
              ),
              0.45,
            ),
        bottom:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#A9D5F0',
              ),
              0.34,
            ),
        mid:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#D7ECF7',
              ),
              0.28,
            ),
        highlight:
          new THREE.Color(
            '#FFFFFF',
          ),
        shadow:
          new THREE.Color(
            '#78A2BE',
          ),
      });

    case 'gaseous':
      return Object.freeze({
        top:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#F1DCC4',
              ),
              0.2,
            ),
        bottom:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#425E7D',
              ),
              baseColor.b >
                baseColor.r
                ? 0.2
                : 0.06,
            ),
        mid:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#FFF6DC',
              ),
              0.14,
            ),
        highlight:
          new THREE.Color(
            '#FFF7E4',
          ),
        shadow:
          baseColor.clone()
            .multiplyScalar(
              0.58,
            ),
      });

    case 'volcanic':
      return Object.freeze({
        top:
          new THREE.Color(
            '#38241B',
          ),
        bottom:
          new THREE.Color(
            '#160F0E',
          ),
        mid:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#6A3424',
              ),
              0.28,
            ),
        highlight:
          new THREE.Color(
            '#FF9D52',
          ),
        shadow:
          new THREE.Color(
            '#0A0808',
          ),
      });

    case 'rocky':
    default:
      return Object.freeze({
        top:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#C2B59A',
              ),
              0.16,
            ),
        bottom:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#584E45',
              ),
              0.26,
            ),
        mid:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#8F847A',
              ),
              0.18,
            ),
        highlight:
          baseColor.clone()
            .lerp(
              new THREE.Color(
                '#E2D2BD',
              ),
              0.22,
            ),
        shadow:
          new THREE.Color(
            '#524941',
          ),
      });
  }
}

function fillPlanetBackground(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  top:
    THREE.Color,

  bottom:
    THREE.Color,
): void {

  const gradient =
    context.createLinearGradient(
      0,
      0,
      0,
      height,
    );

  gradient.addColorStop(
    0,
    rgbaString(
      top,
      1,
    ),
  );
  gradient.addColorStop(
    0.5,
    rgbaString(
      top.clone().lerp(
        bottom,
        0.48,
      ),
      1,
    ),
  );
  gradient.addColorStop(
    1,
    rgbaString(
      bottom,
      1,
    ),
  );

  context.fillStyle =
    gradient;
  context.fillRect(
    0,
    0,
    width,
    height,
  );
}

function drawSurfacePatches(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  palette:
    ProceduralPlanetPalette,

  patchCount:
    number,

  opacity:
    number,
): void {

  for (
    let index = 0;
    index <
      patchCount;
    index += 1
  ) {
    const x =
      random() *
      width;
    const y =
      random() *
      height;
    const patchWidth =
      width *
      (0.06 +
        random() *
          0.16);
    const patchHeight =
      height *
      (0.04 +
        random() *
          0.14);

    const color =
      (index % 3 === 0
        ? palette.highlight
        : index % 3 === 1
          ? palette.mid
          : palette.shadow)
          .clone()
          .lerp(
            palette.top,
            0.16,
          );

    context.fillStyle =
      rgbaString(
        color,
        opacity *
          (0.7 +
            random() *
              0.6),
      );

    context.beginPath();
    context.ellipse(
      x,
      y,
      patchWidth,
      patchHeight,
      random() *
        Math.PI,
      0,
      Math.PI *
        2,
    );
    context.fill();
  }
}

function drawGaseousBands(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  palette:
    ProceduralPlanetPalette,
): void {

  let offsetY =
    0;

  while (
    offsetY <
    height
  ) {
    const bandHeight =
      height *
      (0.03 +
        random() *
          0.10);

    const bandColor =
      (random() >
      0.55
        ? palette.mid
        : random() >
            0.5
          ? palette.highlight
          : palette.shadow)
        .clone();

    context.fillStyle =
      rgbaString(
        bandColor,
        0.20 +
          random() *
            0.28,
      );
    context.fillRect(
      0,
      offsetY,
      width,
      bandHeight,
    );

    offsetY +=
      bandHeight *
      (0.9 +
        random() *
          0.35);
  }
}

function drawAtmosphericStorms(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  palette:
    ProceduralPlanetPalette,
): void {

  for (
    let index = 0;
    index <
      6;
    index += 1
  ) {
    const x =
      width *
      (0.12 +
        random() *
          0.76);
    const y =
      height *
      (0.18 +
        random() *
          0.64);
    const ellipseWidth =
      width *
      (0.03 +
        random() *
          0.08);
    const ellipseHeight =
      height *
      (0.015 +
        random() *
          0.05);

    context.fillStyle =
      rgbaString(
        palette.highlight.clone().lerp(
          palette.mid,
          0.46,
        ),
        0.16 +
          random() *
            0.18,
      );
    context.beginPath();
    context.ellipse(
      x,
      y,
      ellipseWidth,
      ellipseHeight,
      random() *
        Math.PI,
      0,
      Math.PI *
        2,
    );
    context.fill();
  }
}

function drawOceanCurrents(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  palette:
    ProceduralPlanetPalette,
): void {

  for (
    let index = 0;
    index <
      11;
    index += 1
  ) {
    const y =
      height *
      (0.08 +
        random() *
          0.84);
    const amplitude =
      height *
      (0.012 +
        random() *
          0.03);
    const wavelength =
      width *
      (0.12 +
        random() *
          0.18);

    context.strokeStyle =
      rgbaString(
        palette.mid,
        0.16 +
          random() *
            0.1,
      );
    context.lineWidth =
      2 +
      random() *
        3;
    context.beginPath();

    for (
      let x = 0;
      x <= width;
      x += 12
    ) {
      const waveY =
        y +
        Math.sin(
          x /
          wavelength *
          Math.PI *
          2 +
          random() *
            Math.PI,
        ) *
        amplitude;

      if (
        x === 0
      ) {
        context.moveTo(
          x,
          waveY,
        );
      } else {
        context.lineTo(
          x,
          waveY,
        );
      }
    }

    context.stroke();
  }
}

function drawPolarCaps(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  color:
    THREE.Color,

  opacity:
    number,
): void {

  context.fillStyle =
    rgbaString(
      color,
      opacity,
    );
  context.fillRect(
    0,
    0,
    width,
    height *
      0.08,
  );
  context.fillRect(
    0,
    height *
      0.92,
    width,
    height *
      0.08,
  );
}

function drawVolcanicMagmaHints(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,
): void {

  for (
    let index = 0;
    index <
      12;
    index += 1
  ) {
    context.fillStyle =
      `rgba(255,128,64,${0.08 + random() * 0.12})`;
    context.beginPath();
    context.ellipse(
      random() *
        width,
      random() *
        height,
      width *
        (0.01 +
          random() *
            0.02),
      height *
        (0.01 +
          random() *
            0.03),
      random() *
        Math.PI,
      0,
      Math.PI *
        2,
    );
    context.fill();
  }
}

function drawDuneBands(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  palette:
    ProceduralPlanetPalette,
): void {

  for (
    let index = 0;
    index <
      9;
    index += 1
  ) {
    const y =
      height *
      (0.08 +
        random() *
          0.84);

    context.strokeStyle =
      rgbaString(
        palette.highlight,
        0.12 +
          random() *
            0.14,
      );
    context.lineWidth =
      3 +
      random() *
        5;
    context.beginPath();

    for (
      let x = 0;
      x <= width;
      x += 14
    ) {
      const waveY =
        y +
        Math.sin(
          x /
            width *
            Math.PI *
            4 +
          random() *
            Math.PI,
        ) *
        (4 +
          random() *
            6);

      if (
        x === 0
      ) {
        context.moveTo(
          x,
          waveY,
        );
      } else {
        context.lineTo(
          x,
          waveY,
        );
      }
    }

    context.stroke();
  }
}

function drawCraterHints(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  palette:
    ProceduralPlanetPalette,
): void {

  for (
    let index = 0;
    index <
      18;
    index += 1
  ) {
    const radius =
      width *
      (0.008 +
        random() *
          0.03);
    const x =
      random() *
      width;
    const y =
      random() *
      height;

    context.strokeStyle =
      rgbaString(
        palette.shadow,
        0.18,
      );
    context.lineWidth =
      1.2;
    context.beginPath();
    context.arc(
      x,
      y,
      radius,
      0,
      Math.PI *
        2,
    );
    context.stroke();

    context.fillStyle =
      rgbaString(
        palette.highlight,
        0.04,
      );
    context.beginPath();
    context.arc(
      x -
        radius *
          0.16,
      y -
        radius *
          0.16,
      radius *
        0.84,
      0,
      Math.PI *
        2,
    );
    context.fill();
  }
}

function drawFractureNetwork(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  color:
    THREE.Color,

  lineCount:
    number,

  opacity:
    number,
): void {

  context.strokeStyle =
    rgbaString(
      color,
      opacity,
    );
  context.lineCap =
    'round';

  for (
    let index = 0;
    index <
      lineCount;
    index += 1
  ) {
    let x =
      random() *
      width;
    let y =
      random() *
      height;

    context.lineWidth =
      0.8 +
      random() *
        2.2;
    context.beginPath();
    context.moveTo(
      x,
      y,
    );

    const segmentCount =
      4 +
      Math.floor(
        random() *
        6,
      );

    for (
      let segment = 0;
      segment <
        segmentCount;
      segment += 1
    ) {
      x +=
        (random() - 0.5) *
        width *
        0.14;
      y +=
        (random() - 0.5) *
        height *
        0.18;
      context.lineTo(
        x,
        y,
      );
    }

    context.stroke();
  }
}

function drawEmissiveHotspots(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  color:
    THREE.Color,
): void {

  for (
    let index = 0;
    index <
      18;
    index += 1
  ) {
    const x =
      random() *
      width;
    const y =
      random() *
      height;
    const radius =
      width *
      (0.006 +
        random() *
          0.024);

    const gradient =
      context.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius,
      );

    gradient.addColorStop(
      0,
      rgbaString(
        color,
        0.9,
      ),
    );
    gradient.addColorStop(
      1,
      rgbaString(
        color,
        0,
      ),
    );

    context.fillStyle =
      gradient;
    context.beginPath();
    context.arc(
      x,
      y,
      radius,
      0,
      Math.PI *
        2,
    );
    context.fill();
  }
}

function drawCloudWisps(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,

  count:
    number,

  opacity:
    number,
): void {

  for (
    let index = 0;
    index <
      count;
    index += 1
  ) {
    context.fillStyle =
      `rgba(255,255,255,${opacity * (0.6 + random() * 0.8)})`;
    context.beginPath();
    context.ellipse(
      random() *
        width,
      random() *
        height,
      width *
        (0.03 +
          random() *
            0.09),
      height *
        (0.012 +
          random() *
            0.04),
      random() *
        Math.PI,
      0,
      Math.PI *
        2,
    );
    context.fill();
  }
}

function drawCloudBandVeils(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,

  random:
    () => number,
): void {

  for (
    let index = 0;
    index <
      8;
    index += 1
  ) {
    const y =
      height *
      (0.06 +
        random() *
          0.88);

    context.fillStyle =
      `rgba(255,255,255,${0.04 + random() * 0.06})`;
    context.fillRect(
      0,
      y,
      width,
      4 +
        random() *
          8,
    );
  }
}

function overlayPlanetVignette(
  context:
    CanvasRenderingContext2D,

  width:
    number,

  height:
    number,
): void {

  const gradient =
    context.createLinearGradient(
      0,
      0,
      width,
      height,
    );

  gradient.addColorStop(
    0,
    'rgba(255,255,255,0.06)',
  );
  gradient.addColorStop(
    0.45,
    'rgba(255,255,255,0)',
  );
  gradient.addColorStop(
    1,
    'rgba(0,0,0,0.12)',
  );

  context.fillStyle =
    gradient;
  context.fillRect(
    0,
    0,
    width,
    height,
  );
}

function rgbaString(
  color:
    THREE.Color,

  opacity:
    number,
): string {

  return `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${opacity})`;
}

function hashStringToUint32(
  value:
    string,
): number {

  let hash =
    0x811c9dc5;

  for (
    let index = 0;
    index <
      value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(
      index,
    );
    hash = Math.imul(
      hash,
      0x01000193,
    );
  }

  return hash >>>
    0;
}

function createDeterministicPrng(
  seed:
    number,
): () => number {

  let state =
    seed >>>
    0;

  return () => {
    state +=
      0x6d2b79f5;

    let value =
      Math.imul(
        state ^
          state >>>
            15,
        1 |
          state,
      );

    value ^=
      value +
      Math.imul(
        value ^
          value >>>
            7,
        61 |
          value,
      );

    return ((
      value ^
      value >>>
        14
    ) >>>
      0) /
      4294967296;
  };
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

  const sizeEnergy =
    clamp01(
      (
        star.radiusScene -
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
