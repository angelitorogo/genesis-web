import {
  isPlatformBrowser,
} from '@angular/common';

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
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
  createSystemScenePlanetAppearanceV1,
} from '../system/system-scene';

import {
  createSystemSceneRingRenderableV1,
} from '../system/system-scene-ring-renderable';

import {
  systemSceneBodyAxialTiltRadians,
  systemSceneBodyDisplaySpinRadians,
} from '../system/system-scene-body-render-state';

import {
  systemSceneMoonDisplaySpinRadiansV2,
} from '../system/system-scene-moon-spin-presentation';

import {
  systemSceneBodyLodSegmentsV1,
} from '../system/system-scene-lod';

import {
  SystemOrbitalMotionEngine,
  type SystemOrbitalMotionDefinition,
} from '../../simulation/orbital/system-orbital-motion-engine';

import {
  type ScientificAsteroidPreviewVisual,
  type ScientificBodyPreviewModel,
  ScientificBodyPreviewKind,
  type ScientificCometActivityPreviewVisual,
  type ScientificCometPreviewVisual,
  type ScientificMoonPreviewVisual,
  type ScientificPlanetPreviewVisual,
  type ScientificTransNeptunianPreviewVisual,
  SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE,
} from '../scientific/scientific-body-preview';

import {
  createSystemSceneMoonRenderableV1,
} from '../system/system-scene-moon-renderable';

import {
  type SystemSceneMoonPresentationV1,
} from '../system/system-scene-moon-presentation';

import {
  type SystemSceneAsteroidPresentationV1,
} from '../system/system-scene-asteroid-presentation';

import {
  type SystemSceneCometActivityPresentationV1,
  type SystemSceneCometPresentationV1,
} from '../system/system-scene-comet-presentation';

import {
  type SystemScenePlanetRingPresentationV1,
} from '../system/system-scene-planet-special-presentation';

import {
  createSystemSceneAsteroidRenderableV1,
} from '../system/system-scene-asteroid-geometry';

import {
  applySystemSceneCometActivityVisualV1,
  createSystemSceneCometRenderableV1,
} from '../system/system-scene-comet-renderable';

export type ScientificBodyPreviewRenderState =
  | 'initializing'
  | 'ready'
  | 'unavailable'
  | 'error';

const MAX_DEVICE_PIXEL_RATIO =
  2;

const MIN_CAMERA_DISTANCE =
  2.35;

const MAX_CAMERA_DISTANCE =
  18;

const LOCAL_OUTERMOST_ORBIT_RADIUS =
  4.35;

const LOCAL_OUTERMOST_ORBIT_CYCLE_SECONDS =
  90;

const LOCAL_ORBIT_SEGMENT_COUNT =
  160;

const ISOLATED_NON_BODY_AUTOROTATE_CYCLE_SECONDS =
  48;

const MINOR_BODY_INSPECTION_FILL_INTENSITY =
  0.90;

export function scientificBodyPreviewMoonSelectionHaloV1(
  selectedMoonOrdinal:
    number | null,

  moonOrdinal:
    number,
): boolean {
  return selectedMoonOrdinal !==
      null &&
    selectedMoonOrdinal ===
      moonOrdinal;
}

export interface ScientificBodyPreviewAnimationStepInputV1 {
  readonly autoAnimate:
    boolean;

  readonly pointerActive:
    boolean;

  readonly elapsedRealSeconds:
    number;

  readonly hasLocalOrbits:
    boolean;

  readonly hasBodySpin:
    boolean;

  readonly orbitalDaysPerRealSecond:
    number;

  readonly spinDaysPerRealSecond:
    number;
}

export interface ScientificBodyPreviewAnimationStepV1 {
  readonly orbitalDayDelta:
    number;

  readonly spinDayDelta:
    number;

  readonly rootYawDeltaRadians:
    number;
}

/**
 * Presentation-only frame clock. Pointer interaction affects only the camera/root
 * orientation; it never pauses scientific orbit or body-spin progression.
 */
export function scientificBodyPreviewAnimationStepV1(
  input:
    ScientificBodyPreviewAnimationStepInputV1,
): ScientificBodyPreviewAnimationStepV1 {

  if (
    !Number.isFinite(
      input.elapsedRealSeconds,
    ) ||
    input.elapsedRealSeconds <
      0 ||
    !Number.isFinite(
      input.orbitalDaysPerRealSecond,
    ) ||
    input.orbitalDaysPerRealSecond <
      0 ||
    !Number.isFinite(
      input.spinDaysPerRealSecond,
    ) ||
    input.spinDaysPerRealSecond <
      0
  ) {
    throw new RangeError(
      'Scientific preview animation rates must be finite and non-negative.',
    );
  }

  if (
    !input.autoAnimate
  ) {
    return Object.freeze({
      orbitalDayDelta:
        0,
      spinDayDelta:
        0,
      rootYawDeltaRadians:
        0,
    });
  }

  return Object.freeze({
    orbitalDayDelta:
      input.hasLocalOrbits
        ? input.elapsedRealSeconds *
          input.orbitalDaysPerRealSecond
        : 0,
    spinDayDelta:
      input.hasBodySpin
        ? input.elapsedRealSeconds *
          input.spinDaysPerRealSecond
        : 0,
    rootYawDeltaRadians:
      !input.hasLocalOrbits &&
      !input.hasBodySpin &&
      !input.pointerActive
        ? input.elapsedRealSeconds *
          Math.PI *
          2 /
          ISOLATED_NON_BODY_AUTOROTATE_CYCLE_SECONDS
        : 0,
  });
}

export function scientificCometPreviewCameraDistanceV1(
  activity:
    ScientificCometActivityPreviewVisual,
): number {

  const longestTail =
    Math.max(
      activity.hasDustTail
        ? activity.presentationDustTailLengthScene
        : 0,
      activity.hasIonTail
        ? activity.presentationIonTailLengthScene
        : 0,
    );

  return clamp(
    3.05 +
      Math.min(
        longestTail,
        5,
      ) *
        0.18,
    3.05,
    4.95,
  );
}

interface LocalScientificMoonBinding {
  readonly moon:
    ScientificMoonPreviewVisual;

  readonly motion:
    SystemOrbitalMotionDefinition;

  readonly axialPivot:
    THREE.Group;

  readonly spinPivot:
    THREE.Group;
}

interface LocalScientificSpinBinding {
  readonly kind:
    'planet' | 'moon';

  readonly spin:
    ScientificMoonPreviewVisual['spin'] | ScientificPlanetPreviewVisual['spin'];

  readonly spinPivot:
    THREE.Group;
}

@Component({
  selector:
    'app-scientific-body-preview',

  standalone:
    true,

  templateUrl:
    './scientific-body-preview.html',

  styleUrl:
    './scientific-body-preview.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ScientificBodyPreview
  implements AfterViewInit, OnChanges, OnDestroy {

  @Input({ required: true })
  model!:
    ScientificBodyPreviewModel;

  @ViewChild(
    'canvas',
    {
      static:
        true,
    },
  )
  private readonly canvasRef!:
    ElementRef<HTMLCanvasElement>;

  readonly renderState =
    signal<ScientificBodyPreviewRenderState>(
      'initializing',
    );

  readonly contextEnabled =
    signal(false);

  readonly autoRotate =
    signal(true);

  private readonly platformId =
    inject(
      PLATFORM_ID,
    );

  private renderer:
    THREE.WebGLRenderer | null =
      null;

  private scene:
    THREE.Scene | null =
      null;

  private camera:
    THREE.PerspectiveCamera | null =
      null;

  private root:
    THREE.Group | null =
      null;

  private animationFrameId:
    number | null =
      null;

  private resizeObserver:
    ResizeObserver | null =
      null;

  private resources:
    { dispose(): void }[] =
      [];

  private localMoonBindings:
    LocalScientificMoonBinding[] =
      [];

  private localSpinBindings:
    LocalScientificSpinBinding[] =
      [];

  private localSimulationDay =
    0;

  private localSpinSimulationDay =
    0;

  private localDaysPerRealSecond =
    0;

  private lastAnimationTimestampMs:
    number | null =
      null;

  private cameraDistance =
    4;

  private pointerId:
    number | null =
      null;

  private pointerX =
    0;

  private pointerY =
    0;

  private readonly visibilityHandler =
    () => {
      if (
        document.visibilityState ===
          'hidden'
      ) {
        this.stopAnimation();
        return;
      }

      this.startAnimation();
    };

  ngAfterViewInit():
    void {

    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      this.renderState
        .set(
          'unavailable',
        );
      return;
    }

    try {
      const canvas =
        this.canvasRef
          .nativeElement;

      const context =
        canvas.getContext(
          'webgl2',
          {
            antialias:
              true,
            alpha:
              true,
            powerPreference:
              'high-performance',
          },
        );

      if (
        context ===
          null
      ) {
        this.renderState
          .set(
            'unavailable',
          );
        return;
      }

      this.renderer =
        new THREE.WebGLRenderer({
          canvas,
          context,
          antialias:
            true,
          alpha:
            true,
        });

      this.renderer
        .setClearColor(
          0x000000,
          0,
        );

      this.renderer
        .outputColorSpace =
        THREE.SRGBColorSpace;

      this.scene =
        new THREE.Scene();

      this.camera =
        new THREE.PerspectiveCamera(
          38,
          1,
          0.01,
          80,
        );

      this.addLighting();
      this.configureMotionPreference();
      this.rebuildScene();
      this.resize();

      this.resizeObserver =
        new ResizeObserver(
          () =>
            this.resize(),
        );

      this.resizeObserver
        .observe(
          canvas,
        );

      document
        .addEventListener(
          'visibilitychange',
          this.visibilityHandler,
        );

      this.renderState
        .set(
          'ready',
        );

      this.startAnimation();
    } catch {
      this.renderState
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
      changes['model'] !==
        undefined &&
      this.renderer !==
        null
    ) {
      this.contextEnabled
        .set(false);
      this.rebuildScene();
    }
  }

  ngOnDestroy():
    void {

    this.stopAnimation();

    if (
      isPlatformBrowser(
        this.platformId,
      )
    ) {
      document
        .removeEventListener(
          'visibilitychange',
          this.visibilityHandler,
        );
    }

    this.resizeObserver
      ?.disconnect();

    this.disposeSceneResources();

    this.renderer
      ?.dispose();

    this.renderer =
      null;
    this.scene =
      null;
    this.camera =
      null;
    this.root =
      null;
  }

  contextAvailable():
    boolean {

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.PLANET
    ) {
      return this.model.moons.length >
        0;
    }

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.MOON
    ) {
      return this.model.hostPlanet !==
        null;
    }

    return false;
  }

  contextActionLabel():
    string {

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.PLANET
    ) {
      return this.contextEnabled()
        ? 'MOSTRAR SOLO PLANETA'
        : 'MOSTRAR LUNAS';
    }

    return this.contextEnabled()
      ? 'MOSTRAR SOLO LUNA'
      : 'MOSTRAR SISTEMA LOCAL';
  }

  toggleContext():
    void {

    if (
      !this.contextAvailable()
    ) {
      return;
    }

    this.contextEnabled
      .update(
        value =>
          !value,
      );

    this.rebuildScene();
  }

  toggleAutoRotate():
    void {

    this.autoRotate
      .update(
        value =>
          !value,
      );
  }

  resetView():
    void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    this.root
      .rotation
      .set(
        -0.14,
        0.42,
        0,
      );

    this.fitCurrentModelCamera();
  }

  onPointerDown(
    event:
      PointerEvent,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    this.pointerId =
      event.pointerId;
    this.pointerX =
      event.clientX;
    this.pointerY =
      event.clientY;

    this.canvasRef
      .nativeElement
      .setPointerCapture(
        event.pointerId,
      );
  }

  onPointerMove(
    event:
      PointerEvent,
  ): void {

    if (
      this.pointerId !==
        event.pointerId ||
      this.root ===
        null
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      this.pointerX;
    const deltaY =
      event.clientY -
      this.pointerY;

    this.pointerX =
      event.clientX;
    this.pointerY =
      event.clientY;

    this.root.rotation.y +=
      deltaX *
      0.008;

    this.root.rotation.x =
      clamp(
        this.root.rotation.x +
          deltaY *
            0.006,
        -1.15,
        1.15,
      );
  }

  onPointerUp(
    event:
      PointerEvent,
  ): void {

    if (
      this.pointerId !==
        event.pointerId
    ) {
      return;
    }

    this.pointerId =
      null;

    if (
      this.canvasRef
        .nativeElement
        .hasPointerCapture(
          event.pointerId,
        )
    ) {
      this.canvasRef
        .nativeElement
        .releasePointerCapture(
          event.pointerId,
        );
    }
  }

  onWheel(
    event:
      WheelEvent,
  ): void {

    event.preventDefault();

    const direction =
      Math.sign(
        event.deltaY,
      );

    this.cameraDistance =
      clamp(
        this.cameraDistance *
          (
            direction >
              0
              ? 1.10
              : 0.91
          ),
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE,
      );

    this.applyCameraDistance();
  }

  onKeyDown(
    event:
      KeyboardEvent,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    switch (
      event.key
    ) {
      case 'ArrowLeft':
        this.root.rotation.y -=
          0.10;
        break;

      case 'ArrowRight':
        this.root.rotation.y +=
          0.10;
        break;

      case 'ArrowUp':
        this.root.rotation.x =
          clamp(
            this.root.rotation.x -
              0.08,
            -1.15,
            1.15,
          );
        break;

      case 'ArrowDown':
        this.root.rotation.x =
          clamp(
            this.root.rotation.x +
              0.08,
            -1.15,
            1.15,
          );
        break;

      case '+':
      case '=':
        this.cameraDistance =
          clamp(
            this.cameraDistance *
              0.91,
            MIN_CAMERA_DISTANCE,
            MAX_CAMERA_DISTANCE,
          );
        this.applyCameraDistance();
        break;

      case '-':
      case '_':
        this.cameraDistance =
          clamp(
            this.cameraDistance *
              1.10,
            MIN_CAMERA_DISTANCE,
            MAX_CAMERA_DISTANCE,
          );
        this.applyCameraDistance();
        break;

      case 'Home':
        this.resetView();
        break;

      default:
        return;
    }

    event.preventDefault();
  }

  private configureMotionPreference():
    void {

    const reduced =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      );

    if (
      reduced.matches
    ) {
      this.autoRotate
        .set(false);
    }
  }

  private addLighting():
    void {

    if (
      this.scene ===
        null
    ) {
      return;
    }

    const ambient =
      new THREE.HemisphereLight(
        0xbcd9f3,
        0x111318,
        1.10,
      );

    const key =
      new THREE.DirectionalLight(
        0xffffff,
        2.15,
      );
    key.position
      .set(
        4.5,
        3.0,
        5.0,
      );

    const rim =
      new THREE.DirectionalLight(
        0x78cfff,
        0.75,
      );
    rim.position
      .set(
        -4.0,
        1.0,
        -3.0,
      );

    this.scene
      .add(
        ambient,
        key,
        rim,
      );
  }

  private rebuildScene():
    void {

    if (
      this.scene ===
        null
    ) {
      return;
    }

    this.disposeSceneResources();

    if (
      this.root !==
        null
    ) {
      this.scene
        .remove(
          this.root,
        );
    }

    const root =
      new THREE.Group();
    root.name =
      'GENESIS scientific body preview';
    root.rotation
      .set(
        -0.14,
        0.42,
        0,
      );

    this.root =
      root;
    this.scene
      .add(
        root,
      );

    this.localSimulationDay =
      this.model.kind ===
          ScientificBodyPreviewKind.PLANET ||
        this.model.kind ===
          ScientificBodyPreviewKind.MOON
        ? this.model.epochSimulationDay
        : 0;

    this.localSpinSimulationDay =
      this.localSimulationDay;

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.PLANET
    ) {
      if (
        this.contextEnabled() &&
        this.model.moons.length >
          0
      ) {
        this.buildPlanetaryContext(
          this.model.primary,
          this.model.moons,
          null,
        );
      } else {
        this.addPlanet(
          this.model.primary,
          1,
          new THREE.Vector3(),
        );
      }
    } else if (
      this.model.kind ===
        ScientificBodyPreviewKind.MOON
    ) {
      if (
        this.contextEnabled() &&
        this.model.hostPlanet !==
          null
      ) {
        this.buildPlanetaryContext(
          this.model.hostPlanet,
          this.model.moons,
          this.model.primary.moonOrdinal,
        );
      } else {
        this.addMoon(
          this.model.primary,
          1,
          new THREE.Vector3(),
          false,
        );
      }
    } else if (
      this.model.kind ===
        ScientificBodyPreviewKind.ASTEROID
    ) {
      this.addMinorBodyInspectionFill();
      this.addAsteroid(
        this.model.primary,
      );
    } else if (
      this.model.kind ===
        ScientificBodyPreviewKind.COMET
    ) {
      this.addMinorBodyInspectionFill();
      this.addComet(
        this.model.primary,
        this.model.activity,
      );
    } else {
      this.addMinorBodyInspectionFill();
      this.addTransNeptunianObject(
        this.model.primary,
      );
    }

    this.fitCurrentModelCamera();
  }

  private buildPlanetaryContext(
    planet:
      ScientificPlanetPreviewVisual,

    moons:
      readonly ScientificMoonPreviewVisual[],

    selectedMoonOrdinal:
      number | null,
  ): void {

    if (
      moons.length ===
        0
    ) {
      this.addPlanet(
        planet,
        1,
        new THREE.Vector3(),
      );
      return;
    }

    const maximumApoapsisPlanetRadii =
      Math.max(
        ...moons.map(
          moon =>
            moon.orbit.apoapsisPlanetRadii,
        ),
      );

    const localScenePerPlanetRadius =
      LOCAL_OUTERMOST_ORBIT_RADIUS /
      Math.max(
        maximumApoapsisPlanetRadii,
        1e-6,
      );

    const minimumPeriapsisScene =
      Math.min(
        ...moons.map(
          moon =>
            moon.orbit.periapsisPlanetRadii *
            localScenePerPlanetRadius,
        ),
      );

    const ringExtentPlanetRadii =
      planet.ring?.outerRadiusPlanetRadii ??
      1;

    const maximumReadablePlanetRadius =
      minimumPeriapsisScene /
      Math.max(
        ringExtentPlanetRadii +
          0.75,
        1.75,
      );

    const planetRadius =
      clamp(
        maximumReadablePlanetRadius,
        0.18,
        0.78,
      );

    this.addPlanet(
      planet,
      planetRadius,
      new THREE.Vector3(),
    );

    const maximumMoonRadiusEarth =
      Math.max(
        ...moons.map(
          moon =>
            moon.radiusEarth,
        ),
        1e-6,
      );

    const maximumDisplayedMoonRadius =
      clamp(
        planetRadius *
          0.26,
        0.065,
        0.18,
      );

    this.localDaysPerRealSecond =
      Math.max(
        ...moons.map(
          moon =>
            moon.orbit.orbitalPeriodDays,
        ),
      ) /
      LOCAL_OUTERMOST_ORBIT_CYCLE_SECONDS;

    for (
      const moon
      of moons
    ) {
      const motion =
        localScientificMoonMotion(
          moon,
          localScenePerPlanetRadius,
        );

      this.addOrbitGuide(
        motion,
      );

      const initialPosition =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            motion,
            this.localSimulationDay,
          );

      const moonRadius =
        Math.max(
          0.028,
          maximumDisplayedMoonRadius *
          moon.radiusEarth /
          maximumMoonRadiusEarth,
        );

      const runtime =
        this.addMoon(
          moon,
          moonRadius,
          new THREE.Vector3(
            initialPosition.xAu,
            initialPosition.yAu,
            initialPosition.zAu,
          ),
          scientificBodyPreviewMoonSelectionHaloV1(
            selectedMoonOrdinal,
            moon.moonOrdinal,
          ),
        );

      if (
        runtime !==
          null
      ) {
        this.localMoonBindings
          .push({
            moon,
            motion,
            axialPivot:
              runtime.axialPivot,
            spinPivot:
              runtime.spinPivot,
          });
      }
    }
  }

  private addPlanet(
    planet:
      ScientificPlanetPreviewVisual,

    radius:
      number,

    position:
      THREE.Vector3,
  ): void {

    if (this.root === null) {
      return;
    }

    const body = Object.freeze({
      id: planet.planetId,
      kind: 'planet' as const,
      label: planet.title,
      title: planet.title,
      colorHex: planet.baseColorHex,
      radiusScene: radius,
      position: Object.freeze({ x: 0, y: 0, z: 0 }),
      orbitId: null,
      motionContributions: Object.freeze([]),
      surfaceStyle: planet.surfaceStyle,
      lightIntensity: 0,
      sourceLuminositySolar: null,
      spin: planet.spin,
      surfaceEnvironment: planet.surface,
      giantAtmosphere: planet.giantAtmosphere,
      specialPresentation: null,
    });

    const appearance =
      createSystemScenePlanetAppearanceV1(
        body,
        'SCIENTIFIC-PREVIEW',
        null,
        {
          planetTextureSeedUint32: planet.albedoVisualVariantUint32,
          surfaceTextureSeedUint32: planet.surfaceVisualVariantUint32,
          giantAtmosphereTextureSeedUint32: planet.giantAtmosphereVisualVariantUint32,
        },
      );

    const segments =
      systemSceneBodyLodSegmentsV1(
        'planet',
        'HIGH',
      );
    const geometry =
      new THREE.SphereGeometry(
        1,
        segments.widthSegments,
        segments.heightSegments,
      );

    const axialPivot = new THREE.Group();
    axialPivot.position.copy(position);
    axialPivot.rotation.z =
      systemSceneBodyAxialTiltRadians(
        body.spin,
      );

    const spinPivot = new THREE.Group();
    spinPivot.rotation.y =
      this.displaySpinRadians(
        'planet',
        planet.spin,
      );

    const sphere = new THREE.Mesh(
      geometry,
      appearance.material,
    );
    sphere.scale.setScalar(radius);
    spinPivot.add(sphere);

    for (const overlay of appearance.overlays) {
      spinPivot.add(overlay);
    }

    if (
      Math.abs(planet.equatorialScale - 1) > 1e-9 ||
      Math.abs(planet.polarScale - 1) > 1e-9
    ) {
      spinPivot.scale.set(
        planet.equatorialScale,
        planet.polarScale,
        planet.equatorialScale,
      );
    }

    axialPivot.add(spinPivot);

    this.localSpinBindings
      .push({
        kind:
          'planet',
        spin:
          planet.spin,
        spinPivot,
      });

    const ringPresentation =
      planet.ring === null
        ? null
        : scientificRingPresentation(planet.ring);

    const rings =
      ringPresentation === null
        ? null
        : createSystemSceneRingRenderableV1(
            radius,
            ringPresentation,
          );
    if (rings !== null) {
      axialPivot.add(rings.group);
    }

    this.root.add(axialPivot);
    this.resources.push(
      geometry,
      appearance.material,
      ...appearance.resources,
      ...(rings?.resources ?? []),
    );
  }

  private addMoon(
    moon:
      ScientificMoonPreviewVisual,

    radius:
      number,

    position:
      THREE.Vector3,

    selectedInContext:
      boolean,
  ): Readonly<{
    axialPivot:
      THREE.Group;
    spinPivot:
      THREE.Group;
  }> | null {

    if (
      this.root ===
        null
    ) {
      return null;
    }

    const renderable =
      createSystemSceneMoonRenderableV1(
        moonPresentation(moon),
      );

    const presentationRadius =
      Math.max(
        moon.presentationRadiusScene,
        1e-6,
      );

    renderable.root.scale
      .setScalar(
        radius /
          presentationRadius,
      );

    const axialPivot =
      new THREE.Group();
    axialPivot.position
      .copy(
        position,
      );
    axialPivot.rotation.z =
      systemSceneBodyAxialTiltRadians(
        moon.spin,
      );

    const spinPivot =
      new THREE.Group();
    spinPivot.rotation.y =
      this.displaySpinRadians(
        'moon',
        moon.spin,
      );
    spinPivot.add(
      renderable.root,
    );
    axialPivot.add(
      spinPivot,
    );

    if (
      selectedInContext
    ) {
      const haloGeometry =
        new THREE.TorusGeometry(
          radius *
            1.34,
          Math.max(
            0.008,
            radius *
              0.032,
          ),
          8,
          48,
        );

      const haloMaterial =
        new THREE.MeshBasicMaterial({
          color:
            0x73d7ff,
          transparent:
            true,
          opacity:
            0.78,
          depthWrite:
            false,
          toneMapped:
            false,
        });

      const halo =
        new THREE.Mesh(
          haloGeometry,
          haloMaterial,
        );
      halo.name =
        'GENESIS selected moon scientific context halo';

      axialPivot.add(
        halo,
      );

      this.resources.push(
        haloGeometry,
        haloMaterial,
      );
    }

    this.root.add(
      axialPivot,
    );

    this.resources
      .push(
        ...renderable.resources,
      );

    this.localSpinBindings
      .push({
        kind:
          'moon',
        spin:
          moon.spin,
        spinPivot,
      });

    return Object.freeze({
      axialPivot,
      spinPivot,
    });
  }

  private addOrbitGuide(
    motion:
      SystemOrbitalMotionDefinition,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    const points:
      THREE.Vector3[] =
      [];

    for (
      let index = 0;
      index <
        LOCAL_ORBIT_SEGMENT_COUNT;
      index +=
        1
    ) {
      const sample =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            motion,
            motion.periodDays *
            index /
            LOCAL_ORBIT_SEGMENT_COUNT,
          );

      points.push(
        new THREE.Vector3(
          sample.xAu,
          sample.yAu,
          sample.zAu,
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
          0x6d8396,
        transparent:
          true,
        opacity:
          0.36,
      });

    this.root.add(
      new THREE.LineLoop(
        geometry,
        material,
      ),
    );

    this.resources
      .push(
        geometry,
        material,
      );
  }

  private addAsteroid(
    asteroid:
      ScientificAsteroidPreviewVisual,
  ): void {

    if (this.root === null) {
      return;
    }

    const renderable =
      createSystemSceneAsteroidRenderableV1(
        1,
        asteroidPresentation(asteroid),
      );

    this.root.add(renderable.object);
    this.resources.push(...renderable.resources);
  }

  private addComet(
    comet:
      ScientificCometPreviewVisual,

    activity:
      ScientificCometActivityPreviewVisual,
  ): void {

    if (this.root === null) {
      return;
    }

    const renderable =
      createSystemSceneCometRenderableV1(
        SCIENTIFIC_COMET_PREVIEW_RADIUS_SCENE,
        cometPresentation(comet),
      );

    applySystemSceneCometActivityVisualV1(
      renderable.binding,
      cometActivityPresentation(activity),
      new THREE.Vector3(1, 0.08, 0),
    );

    this.root.add(renderable.object);
    this.resources.push(...renderable.resources);
  }

  private addTransNeptunianObject(
    object:
      ScientificTransNeptunianPreviewVisual,
  ): void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    const geometry =
      new THREE.IcosahedronGeometry(
        1,
        1,
      );

    const material =
      new THREE.MeshStandardMaterial({
        color:
          object.colorHex,
        roughness:
          0.92,
        metalness:
          0.02,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material,
      );
    mesh.name =
      `GENESIS scientific TNO ${object.title}`;
    mesh.scale.setScalar(
      0.90,
    );

    this.root.add(
      mesh,
    );
    this.resources.push(
      geometry,
      material,
    );
  }

  private addMinorBodyInspectionFill():
    void {

    if (
      this.root ===
        null
    ) {
      return;
    }

    const fill =
      new THREE.AmbientLight(
        0xffffff,
        MINOR_BODY_INSPECTION_FILL_INTENSITY,
      );
    fill.name =
      'GENESIS scientific minor-body inspection fill';

    this.root.add(
      fill,
    );
  }

  private updateLocalOrbitalDynamics():
    void {

    for (
      const binding
      of this.localMoonBindings
    ) {
      const position =
        SystemOrbitalMotionEngine
          .positionAtSimulationDay(
            binding.motion,
            this.localSimulationDay,
          );

      binding.axialPivot.position
        .set(
          position.xAu,
          position.yAu,
          position.zAu,
        );
    }
  }

  private updateLocalSpinDynamics():
    void {

    for (
      const binding
      of this.localSpinBindings
    ) {
      binding.spinPivot.rotation.y =
        this.displaySpinRadians(
          binding.kind,
          binding.spin,
        );
    }
  }

  private displaySpinRadians(
    kind:
      'planet' | 'moon',

    spin:
      ScientificMoonPreviewVisual['spin'] | ScientificPlanetPreviewVisual['spin'],
  ): number {

    if (
      this.model.kind !==
          ScientificBodyPreviewKind.PLANET &&
      this.model.kind !==
          ScientificBodyPreviewKind.MOON
    ) {
      return 0;
    }

    const timing =
      {
        epochSimulationDay:
          this.model.epochSimulationDay,
        playbackDaysPerRealSecond:
          this.model.spinPlaybackDaysPerRealSecond,
      };

    return kind ===
        'moon'
      ? systemSceneMoonDisplaySpinRadiansV2(
          spin,
          this.localSpinSimulationDay,
          timing,
        )
      : systemSceneBodyDisplaySpinRadians(
          spin,
          this.localSpinSimulationDay,
          timing,
        );
  }

  private fitCurrentModelCamera():
    void {

    if (
      this.model.kind ===
        ScientificBodyPreviewKind.COMET
    ) {
      this.fitCameraToCometNucleus(
        this.model.activity,
      );
      return;
    }

    this.fitCameraToRoot();
  }

  private fitCameraToCometNucleus(
    activity:
      ScientificCometActivityPreviewVisual,
  ): void {

    if (
      this.root ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    // Keep the physical nucleus at the optical centre. Tails remain visible in
    // the positive-X field instead of dragging the camera target towards their
    // much larger bounding box.
    this.root.position.set(
      0,
      0,
      0,
    );

    this.cameraDistance =
      scientificCometPreviewCameraDistanceV1(
        activity,
      );

    this.applyCameraDistance();
  }

  private fitCameraToRoot():
    void {

    if (
      this.root ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    this.root
      .updateMatrixWorld(
        true,
      );

    const bounds =
      new THREE.Box3()
        .setFromObject(
          this.root,
        );

    if (
      bounds.isEmpty()
    ) {
      this.cameraDistance =
        4;
      this.applyCameraDistance();
      return;
    }

    const center =
      bounds
        .getCenter(
          new THREE.Vector3(),
        );

    this.root.position
      .sub(
        center,
      );

    this.root
      .updateMatrixWorld(
        true,
      );

    const centeredBounds =
      new THREE.Box3()
        .setFromObject(
          this.root,
        );

    const sphere =
      centeredBounds
        .getBoundingSphere(
          new THREE.Sphere(),
        );

    const radius =
      Math.max(
        0.72,
        sphere.radius,
      );

    const halfFov =
      THREE.MathUtils
        .degToRad(
          this.camera.fov *
          0.5,
        );

    this.cameraDistance =
      clamp(
        radius /
          Math.tan(
            halfFov,
          ) *
          1.22,
        MIN_CAMERA_DISTANCE,
        MAX_CAMERA_DISTANCE,
      );

    this.applyCameraDistance();
  }

  private applyCameraDistance():
    void {

    if (
      this.camera ===
        null
    ) {
      return;
    }

    this.camera.position
      .set(
        0,
        this.cameraDistance *
          0.08,
        this.cameraDistance,
      );

    this.camera
      .lookAt(
        0,
        0,
        0,
      );
  }

  private resize():
    void {

    if (
      this.renderer ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    const canvas =
      this.canvasRef
        .nativeElement;

    const width =
      Math.max(
        1,
        canvas.clientWidth,
      );

    const height =
      Math.max(
        1,
        canvas.clientHeight,
      );

    this.renderer
      .setPixelRatio(
        Math.min(
          window.devicePixelRatio ||
            1,
          MAX_DEVICE_PIXEL_RATIO,
        ),
      );

    this.renderer
      .setSize(
        width,
        height,
        false,
      );

    this.camera.aspect =
      width /
      height;

    this.camera
      .updateProjectionMatrix();
  }

  private startAnimation():
    void {

    if (
      this.animationFrameId !==
        null ||
      this.renderer ===
        null ||
      this.scene ===
        null ||
      this.camera ===
        null ||
      document.visibilityState ===
        'hidden'
    ) {
      return;
    }

    this.lastAnimationTimestampMs =
      null;

    const frame =
      (
        timestampMs:
          number,
      ) => {
        if (
          this.renderer ===
            null ||
          this.scene ===
            null ||
          this.camera ===
            null
        ) {
          this.animationFrameId =
            null;
          return;
        }

        const previousTimestampMs =
          this.lastAnimationTimestampMs;

        this.lastAnimationTimestampMs =
          timestampMs;

        const elapsedRealSeconds =
          previousTimestampMs ===
            null
            ? 0
            : clamp(
                (
                  timestampMs -
                  previousTimestampMs
                ) /
                  1000,
                0,
                0.1,
              );

        const isPlanetaryPreview =
          this.model.kind ===
              ScientificBodyPreviewKind.PLANET ||
            this.model.kind ===
              ScientificBodyPreviewKind.MOON;

        let spinPlaybackDaysPerRealSecond =
          0;

        if (
          this.model.kind ===
              ScientificBodyPreviewKind.PLANET ||
          this.model.kind ===
              ScientificBodyPreviewKind.MOON
        ) {
          spinPlaybackDaysPerRealSecond =
            this.model.spinPlaybackDaysPerRealSecond;
        }

        const step =
          scientificBodyPreviewAnimationStepV1({
            autoAnimate:
              this.autoRotate(),
            pointerActive:
              this.pointerId !==
                null,
            elapsedRealSeconds,
            hasLocalOrbits:
              this.localMoonBindings.length >
                0 &&
              this.localDaysPerRealSecond >
                0,
            hasBodySpin:
              isPlanetaryPreview &&
              this.localSpinBindings.length >
                0,
            orbitalDaysPerRealSecond:
              this.localDaysPerRealSecond,
            spinDaysPerRealSecond:
              spinPlaybackDaysPerRealSecond,
          });

        if (
          step.orbitalDayDelta >
            0
        ) {
          this.localSimulationDay +=
            step.orbitalDayDelta;
          this.updateLocalOrbitalDynamics();
        }

        if (
          step.spinDayDelta >
            0
        ) {
          this.localSpinSimulationDay +=
            step.spinDayDelta;
          this.updateLocalSpinDynamics();
        }

        if (
          this.root !==
            null &&
          step.rootYawDeltaRadians !==
            0
        ) {
          this.root.rotation.y +=
            step.rootYawDeltaRadians;
        }

        this.renderer
          .render(
            this.scene,
            this.camera,
          );

        this.animationFrameId =
          window.requestAnimationFrame(
            frame,
          );
      };

    this.animationFrameId =
      window.requestAnimationFrame(
        frame,
      );
  }

  private stopAnimation():
    void {

    if (
      this.animationFrameId ===
        null ||
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      return;
    }

    window.cancelAnimationFrame(
      this.animationFrameId,
    );

    this.animationFrameId =
      null;
    this.lastAnimationTimestampMs =
      null;
  }

  private disposeSceneResources():
    void {

    for (
      const resource of
      this.resources
    ) {
      resource.dispose();
    }

    this.resources =
      [];
    this.localMoonBindings =
      [];
    this.localSpinBindings =
      [];
    this.localDaysPerRealSecond =
      0;
  }
}


function moonPresentation(
  moon: ScientificMoonPreviewVisual,
): SystemSceneMoonPresentationV1 {
  return Object.freeze({
    version: 1 as const,
    sourceMoonIdentity: moon.title,
    sourceHostPlanetType: 'SCIENTIFIC_PREVIEW',
    sourceRadiusEarth: moon.radiusEarth,
    sourceMassEarth: 0,
    sourceMeanDensityGramsPerCubicCentimeter: 0,
    sourceSurfaceGravityEarth: 0,
    sourceAtmosphereRetentionIndex01: 0,
    sourceAtmosphereRegime: 'NONE',
    sourceWaterInventoryIndex01: 0,
    sourceInferredIceRichnessIndex01: 0,
    sourceSubsurfaceOceanPotentialIndex01: 0,
    sourceSurfaceLiquidWaterPotentialIndex01: 0,
    sourceWaterRegime: 'NONE',
    sourceEstimatedSurfaceTemperatureKelvin: 0,
    sourceGeologicalActivityIndex01: 0,
    sourceTidalHeatingIndex01: 0,
    sourceGeologyRegime: 'INERT',
    sourceOverallHabitabilityIndex01: 0,
    sourceIsPotentiallyHabitable: false,
    sourceGiantHostSpecialization: false,
    sourceGiantCompositionRegime: 'NOT_APPLICABLE',
    sourceIsLargeGiantMoon: false,
    sourceIsTidallyActiveGiantMoon: false,
    sourceIsOceanBearingGiantMoonCandidate: false,
    shapeClass: moon.shapeClass,
    surfaceStyle: moon.surfaceStyle,
    presentationRadiusScene: moon.presentationRadiusScene,
    presentationIrregularity01: moon.presentationIrregularity01,
    presentationLiquidCoverage01: moon.presentationLiquidCoverage01,
    presentationIceCoverage01: moon.presentationIceCoverage01,
    presentationVolcanicCoverage01: moon.presentationVolcanicCoverage01,
    presentationCloudCoverage01: moon.presentationCloudCoverage01,
    presentationAtmospherePresent: moon.presentationAtmospherePresent,
    presentationAtmosphereStrength01: moon.presentationAtmosphereStrength01,
    presentationAtmosphereShellScale: moon.presentationAtmosphereShellScale,
    presentationBaseColorHex: moon.presentationBaseColorHex,
    presentationAccentColorHex: moon.presentationAccentColorHex,
    presentationAtmosphereColorHex: moon.presentationAtmosphereColorHex,
    presentationSeedUint32: moon.visualVariantUint32,
  });
}

function scientificRingPresentation(
  ring: import('../scientific/scientific-body-preview').ScientificPlanetRingPreviewVisual,
): SystemScenePlanetRingPresentationV1 {
  return Object.freeze({
    source: 'GIANT_RING_PRESENTATION_PROXY_25_9' as const,
    presenceAuthoritative: false as const,
    sourceMoonCount: 0,
    sourceSatelliteCapacityIndex01: 0,
    sourceMoonRichnessIndex01: 0,
    sourceMoonArchitectureRegime: 'SCIENTIFIC_PREVIEW',
    sourceIceBearingFractionOfSolids01: ring.iceFraction01,
    sourceReferenceBondAlbedo01: 0,
    innerRadiusPlanetRadii: ring.innerRadiusPlanetRadii,
    outerRadiusPlanetRadii: ring.outerRadiusPlanetRadii,
    opticalDepth01: ring.opticalDepth01,
    iceFraction01: ring.iceFraction01,
    dustFraction01: ring.dustFraction01,
    bandCount: ring.bandCount,
    gapCount: ring.gapCount,
    presentationSeedUint32: ring.visualVariantUint32,
    presentationBaseColorHex: ring.presentationBaseColorHex,
    presentationAccentColorHex: ring.presentationAccentColorHex,
  });
}

function asteroidPresentation(
  asteroid: ScientificAsteroidPreviewVisual,
): SystemSceneAsteroidPresentationV1 {
  return Object.freeze({
    ...asteroid,
    shapeSeedUint32: asteroid.visualVariantUint32,
    source: 'PHASE_22_4_ASTEROID_TAXONOMY' as const,
    proceduralId: 'SCIENTIFIC-PREVIEW',
    sourceDiameterKilometers: 1,
    carbonaceousFraction01: 0.25,
    silicateFraction01: 0.25,
    metalFraction01: 0.25,
    iceFraction01: 0.25,
    porosityIndex01: 0,
    bulkDensityGramsPerCubicCentimeter: 1,
    geometricAlbedo01: 0.1,
    binaryMassRatio01: null,
    binarySeparationPrimaryRadii: null,
  });
}

function cometPresentation(
  comet: ScientificCometPreviewVisual,
): SystemSceneCometPresentationV1 {
  return Object.freeze({
    ...comet,
    shapeSeedUint32: comet.visualVariantUint32,
    source: 'PHASE_22_6_COMET_ACTIVITY' as const,
    proceduralId: 'SCIENTIFIC-PREVIEW',
    sourceDiameterKilometers: 1,
    iceFraction01: 0.5,
    dustFraction01: 0.5,
    porosityIndex01: 0.5,
    bulkDensityGramsPerCubicCentimeter: 0.6,
    geometricAlbedo01: 0.04,
    volatileRichnessIndex01: 0.5,
    periodRegime: 'SHORT_PERIOD' as const,
    referenceLuminositySolar: 1,
    semiMajorAxisAu: 1,
    eccentricity: 0,
    periapsisAu: 1,
    apoapsisAu: 1,
    orbitalPeriodYears: 1,
    epochMeanAnomalyDegrees: 0,
    presentationTimeScale: 1,
  });
}

function cometActivityPresentation(
  activity: ScientificCometActivityPreviewVisual,
): SystemSceneCometActivityPresentationV1 {
  return Object.freeze({
    ...activity,
    sourceDistanceAu: 1,
    solarEquivalentDistanceAu: 1,
    incidentFluxEarth: 1,
    equilibriumTemperatureKelvin: 278.33,
    waterIceActivitySupportIndex01: 0,
    supervolatileActivitySupportIndex01: 0,
    activityIndex01: 0,
    presentationDustTailLengthRadii: 0,
    presentationDustTailWidthRadii: 0,
    presentationIonTailLengthRadii: 0,
    presentationIonTailWidthRadii: 0,
  });
}

function localScientificMoonMotion(
  moon:
    ScientificMoonPreviewVisual,

  localScenePerPlanetRadius:
    number,
): SystemOrbitalMotionDefinition {

  return Object.freeze({
    id:
      `scientific-local-moon-${moon.moonOrdinal}`,
    semiMajorAxisAu:
      moon.orbit.semiMajorAxisPlanetRadii *
      localScenePerPlanetRadius,
    eccentricity:
      moon.orbit.eccentricity,
    periodDays:
      moon.orbit.orbitalPeriodDays,
    rotationDegrees:
      moon.orbit.rotationDegrees,
    inclinationDegrees:
      moon.orbit.inclinationDegrees,
    epochMeanAnomalyDegrees:
      moon.orbit.epochMeanAnomalyDegrees,
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
