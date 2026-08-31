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
  type SystemSceneBodySnapshot,
  type SystemSceneMotionContributionSnapshot,
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

  dispose():
    void;
}

export type SystemSceneRuntimeFactory =
  (
    canvas:
      HTMLCanvasElement,
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
          ) =>
            createThreeSystemSceneRuntime(
              canvas,
            ),
    },
  );

/**
 * Point-24.3 Angular host for the stellar-system Three.js scene.
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

  readonly renderState =
    this
      .renderStateSignal
      .asReadonly();

  readonly renderInfo =
    this
      .renderInfoSignal
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
      const info =
        this
          .runtime
          .render(
            this.snapshot,
          );

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

function createThreeSystemSceneRuntime(
  canvas:
    HTMLCanvasElement,
): SystemSceneRuntime {

  return new ThreeSystemSceneRuntime(
    canvas,
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
    canvas:
      HTMLCanvasElement,
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

    this.persistentDisposables.push(
      this.starHaloTexture,
      this.starBloomTexture,
      this.starGlareTexture,
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

    this.configureCamera(
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

    this.configureCamera(
      snapshot.scale
        .targetOuterRadiusScene,
    );

    for (
      const orbit
      of snapshot.orbits
    ) {
      this.addOrbit(
        orbit,
        snapshot.scale
          .orbitScaleScenePerAu,
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
        snapshot.planets.length,

      sceneObjectCount:
        countDescendants(
          this.scene,
        ),
    });
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

  private configureCamera(
    outerRadiusScene:
      number,
  ):
    void {

    const distance =
      Math.max(
        7.4,
        outerRadiusScene *
          2.25,
      );

    this
      .camera
      .position
      .set(
        distance * 0.18,
        distance * 0.34,
        distance,
      );

    this
      .camera
      .lookAt(
        0,
        0,
        0,
      );
  }

  private addOrbit(
    orbit:
      SystemSceneOrbitSnapshot,

    orbitScaleScenePerAu:
      number,
  ):
    void {

    const points: THREE.Vector3[] = [];

    const motion =
      orbit.motionId ===
        null
        ? null
        : this.motionById.get(
            orbit.motionId,
          ) ??
          null;

    for (
      let index = 0;
      index <
        ORBIT_SEGMENT_COUNT;
      index += 1
    ) {
      if (
        motion !==
        null
      ) {
        const sample =
          SystemOrbitalMotionEngine
            .positionAtSimulationDay(
              motion,
              motion.periodDays *
                index /
                ORBIT_SEGMENT_COUNT,
            );

        points.push(
          new THREE.Vector3(
            sample.xAu *
              orbit.motionScale *
              orbitScaleScenePerAu,
            sample.yAu *
              orbit.motionScale *
              orbitScaleScenePerAu,
            sample.zAu *
              orbit.motionScale *
              orbitScaleScenePerAu,
          ),
        );

        continue;
      }

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

      points.push(
        new THREE.Vector3(
          position.x,
          position.y,
          position.z,
        ),
      );
    }

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(
          points,
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

    this.animatedOrbits.set(
      orbit.id,
      line,
    );

    this
      .presentationRoot
      .add(
        line,
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

    this
      .presentationRoot
      .add(
        group,
      );
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
      snapshot.scale
        .orbitScaleScenePerAu;

    for (
      const body
      of [
        ...snapshot.stars,
        ...snapshot.planets,
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
  }

  private positionFromContributions(
    contributions:
      readonly SystemSceneMotionContributionSnapshot[],

    simulationDay:
      number,

    sceneScale:
      number,
  ): THREE.Vector3 {

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
        this.motionById.get(
          contribution.motionId,
        );

      if (
        motion ===
        undefined
      ) {
        continue;
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

    return new THREE.Vector3(
      xAu *
        sceneScale,
      yAu *
        sceneScale,
      zAu *
        sceneScale,
    );
  }

  private clearFrameObjects():
    void {

    disposeResources(
      this.frameDisposables,
    );

    this.animatedBodies.clear();
    this.animatedOrbits.clear();

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
