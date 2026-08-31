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
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

const MAX_DEVICE_PIXEL_RATIO =
  2;

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
 * Point-24.1 Angular host for the stellar-system Three.js scene.
 *
 * The component owns browser lifecycle, canvas sizing and renderer disposal.
 * It receives a presentation snapshot and never computes authoritative stellar
 * or planetary physics. Point 24.1 intentionally renders no physical stars,
 * planets or orbits: those visual projections start in 24.2.
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
  ): void {

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
      0.96;

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

    this
      .camera
      .position
      .set(
        0,
        0,
        8,
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

    this.renderFrame();

    return Object.freeze({
      renderer:
        'WEBGL2' as const,

      physicalBodyCount:
        0,

      sceneObjectCount:
        this
          .scene
          .children
          .length,
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
