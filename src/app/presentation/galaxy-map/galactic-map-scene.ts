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
  type GalacticMapModel,
} from './galactic-map-model';

import {
  GalacticMapParticleLayoutGenerator,
} from './galactic-map-particle-layout';

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

/**
 * Point-10.1 Angular host for the Three.js scene.
 *
 * Camera interaction, selection and controls are deliberately absent until
 * point 10.2. This component owns renderer lifecycle, resize and one static
 * deterministic point-cloud render.
 */
@Component({
  selector:
    'app-galactic-map-scene',

  standalone:
    true,

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

  readonly renderState =
    this
      .renderStateSignal
      .asReadonly();

  readonly particleCount =
    this
      .particleCountSignal
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

    this
      .runtime
      ?.dispose();

    this.runtime =
      null;
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
      const info =
        this
          .runtime
          .render(
            this.model,
          );

      this
        .particleCountSignal
        .set(
          info.particleCount,
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

  private galaxyGroup:
    THREE.Group | null =
    null;

  private points:
    THREE.Points<
      THREE.BufferGeometry,
      THREE.ShaderMaterial
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
        -2.72,
        2.18,
      );

    this
      .camera
      .lookAt(
        0,
        0,
        0,
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

    this.renderFrame();
  }

  render(
    model:
      GalacticMapModel,
  ): GalacticMapSceneRenderInfo {

    this.disposePoints();

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

    galaxyGroup.rotation.x =
      staticPresentationTiltRadians(
        model,
      );

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

    this.renderFrame();

    return Object.freeze({
      particleCount:
        layout.count,
    });
  }

  dispose():
    void {

    this.disposePoints();

    this
      .renderer
      .dispose();
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
      this.points ===
      null
    ) {
      return;
    }

    if (
      this.galaxyGroup !==
      null
    ) {
      this.scene.remove(
        this.galaxyGroup,
      );

      this.galaxyGroup.clear();
    } else {
      this.scene.remove(
        this.points,
      );
    }

    this
      .points
      .geometry
      .dispose();

    this
      .points
      .material
      .dispose();

    this.points =
      null;

    this.galaxyGroup =
      null;
  }
}

/**
 * Static point-10.1 disk presentation tilt.
 *
 * Rotating around Z would only spin the projected disk. A 20-degree X-axis tilt
 * changes depth instead: with the current camera the upper half recedes and
 * the lower half comes forward. This is renderer presentation only; it does
 * not modify GalaxyVisualStructure or any Ground Truth coordinates.
 */
/**
 * Point-10.1 framing multiplier.
 *
 * The active-galaxy view is an inspection view rather than a physically
 * comparative scale chart. DWARF receives a closer static framing for its
 * low-surface-brightness stellar body, while IRREGULAR receives a smaller
 * 20-percent framing increase so its asymmetric silhouette and embedded
 * regions are easier to inspect. Ground Truth coordinates remain unchanged.
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

export function staticPresentationTiltRadians(
  model:
    GalacticMapModel,
): number {

  if (
    model.galaxyType ===
      GalaxyType.BARRED_SPIRAL ||
    model.galaxyType ===
      GalaxyType.SPIRAL
  ) {
    return THREE.MathUtils.degToRad(
      -20,
    );
  }

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
