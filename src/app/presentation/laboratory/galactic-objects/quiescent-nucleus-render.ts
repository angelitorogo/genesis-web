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
  type QuiescentNucleusRenderModel,
} from './quiescent-nucleus-render-model';

import {
  BlackHoleLaboratoryRender,
} from './black-hole-laboratory-render';

import {
  type BlackHoleLaboratoryRenderModel,
} from './black-hole-laboratory-render-model';

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uAspect;
  uniform float uTime;
  uniform float uSeed;
  uniform float uOrientation;
  uniform float uAxisRatio;
  uniform float uCoreRadius;
  uniform float uEnvelopeRadius;
  uniform float uCuspExponent;
  uniform float uCentralIntensity;
  uniform float uStellarDensity;
  uniform float uGranularity;
  uniform float uDustOpacity;
  uniform float uDustWidth;
  uniform float uDustAngle;
  uniform float uDustWarp;
  uniform float uSecondaryDustLane;
  uniform float uAsymmetry;
  uniform vec3 uCoreColor;
  uniform vec3 uOldStarColor;
  uniform vec3 uRedGiantColor;
  uniform vec3 uEnvelopeColor;

  const float PI = 3.141592653589793;

  mat2 rotation(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
  }

  float hash21(vec2 p) {
    p = fract(
      p * vec2(123.34, 456.21)
    );
    p += dot(p, p + 45.32 + uSeed * 0.001);
    return fract(p.x * p.y);
  }

  vec2 hash22(vec2 p) {
    float n = hash21(p);
    return vec2(
      n,
      hash21(p + n + 17.17)
    );
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 drift = mat2(1.68, 1.21, -1.21, 1.68);

    for (int octave = 0; octave < 5; octave += 1) {
      value += amplitude * noise2(p);
      p = drift * p + vec2(9.31, 3.17);
      amplitude *= 0.50;
    }

    return value;
  }

  float sparseStar(
    vec2 p,
    float scale,
    float probability,
    float radius,
    float salt
  ) {
    vec2 grid = p * scale;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    vec2 jitter = (hash22(cell + salt) - 0.5) * 0.62;
    float present = step(
      1.0 - probability,
      hash21(cell + salt * 2.71)
    );
    float distanceToStar = length(local - jitter);
    float point = 1.0 - smoothstep(
      radius * 0.28,
      radius,
      distanceToStar
    );
    float halo = 1.0 - smoothstep(
      radius,
      radius * 3.4,
      distanceToStar
    );

    return present * (point + halo * 0.17);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= uAspect;

    vec2 nucleus = rotation(uOrientation) * p;

    vec2 slowDrift = vec2(
      cos(uTime * 0.031 + uSeed * 0.017),
      sin(uTime * 0.027 - uSeed * 0.013)
    );

    float coarse = fbm(
      nucleus * 2.4 +
      vec2(uSeed * 0.013, -uSeed * 0.009) +
      slowDrift * 0.055
    );

    float fine = fbm(
      nucleus * 8.5 +
      vec2(-uSeed * 0.017, uSeed * 0.011) -
      slowDrift * 0.085
    );

    vec2 asymmetricOffset = vec2(
      (coarse - 0.5) * uAsymmetry * 0.13,
      (fine - 0.5) * uAsymmetry * 0.10
    );

    vec2 q = nucleus + asymmetricOffset;
    float ellipticalRadius = length(
      vec2(
        q.x,
        q.y / max(uAxisRatio, 0.12)
      )
    );

    float outerEnvelope = exp(
      -pow(
        ellipticalRadius /
        max(uEnvelopeRadius, 0.05),
        1.52
      )
    );

    float nuclearCusp = exp(
      -pow(
        ellipticalRadius /
        max(uCoreRadius, 0.02),
        max(uCuspExponent, 0.5)
      )
    );

    float oldPopulationTexture = mix(
      0.76,
      1.24,
      fine
    );

    float granularTexture = mix(
      0.72,
      1.38,
      fbm(q * 19.0 + uSeed * 0.021)
    );

    float stellarBody =
      outerEnvelope *
      oldPopulationTexture *
      mix(
        1.0,
        granularTexture,
        uGranularity
      );

    vec2 dustP =
      rotation(uDustAngle + uTime * 0.060) *
      nucleus;

    float dustNoise =
      fbm(
        vec2(
          dustP.x * 5.2,
          dustP.x * 1.7 + uSeed * 0.019
        )
      ) -
      0.5;

    float warpedDustY =
      dustP.y +
      dustNoise *
      uDustWarp;

    float dustLane = exp(
      -pow(
        abs(warpedDustY) /
        max(uDustWidth, 0.008),
        1.62
      )
    );

    dustLane *= 1.0 - smoothstep(
      uEnvelopeRadius * 0.18,
      uEnvelopeRadius * 1.06,
      ellipticalRadius
    );

    vec2 secondDustP =
      rotation(uDustAngle + 1.03 - uTime * 0.036) *
      nucleus;

    float secondaryLane = exp(
      -pow(
        abs(
          secondDustP.y +
          (noise2(secondDustP * 4.0 + 8.2) - 0.5) *
          uDustWarp *
          0.72
        ) /
        max(uDustWidth * 0.72, 0.008),
        1.8
      )
    ) *
    uSecondaryDustLane;

    secondaryLane *= 1.0 - smoothstep(
      uEnvelopeRadius * 0.16,
      uEnvelopeRadius * 0.88,
      ellipticalRadius
    );

    float attenuation = clamp(
      1.0 -
      uDustOpacity *
      (dustLane + secondaryLane * 0.78),
      0.24,
      1.0
    );

    float bodyMask = 1.0 - smoothstep(
      uEnvelopeRadius * 0.18,
      uEnvelopeRadius * 1.36,
      ellipticalRadius
    );

    float starsFine = sparseStar(
      q,
      54.0,
      0.085 + 0.105 * uStellarDensity,
      0.105,
      11.0
    );

    float starsMid = sparseStar(
      q,
      31.0,
      0.055 + 0.085 * uStellarDensity,
      0.095,
      37.0
    );

    float redGiants = sparseStar(
      q,
      22.0,
      0.022 + 0.030 * uStellarDensity,
      0.078,
      71.0
    );

    float stellarWeight =
      bodyMask *
      attenuation;

    vec3 color = vec3(0.0025, 0.0028, 0.0036);

    color +=
      uEnvelopeColor *
      stellarBody *
      0.82 *
      attenuation;

    color +=
      uCoreColor *
      nuclearCusp *
      uCentralIntensity *
      1.18 *
      attenuation;

    // Dense old-stellar nuclear glow and dusty orbital structure surrounding
    // the SMBH. This remains diffuse and low-energy: it adds the sense of a
    // real galactic nucleus without introducing an AGN-like luminous core.
    float nuclearGlow = exp(
      -pow(
        ellipticalRadius /
        max(uEnvelopeRadius * 0.58, 0.04),
        1.20
      )
    );

    float polarAngle = atan(q.y, q.x);
    float dustySwirlNoise = fbm(
      vec2(
        (polarAngle - uTime * 0.090) * 1.35 +
          ellipticalRadius * 5.8,
        ellipticalRadius * 4.2 +
          uSeed * 0.007 +
          sin(uTime * 0.019) * 0.16
      )
    );

    float dustySwirl =
      nuclearGlow *
      smoothstep(0.30, 0.82, dustySwirlNoise) *
      (1.0 - nuclearCusp * 0.34);

    float orbitalPhase =
      polarAngle * 3.0 -
      uTime * 0.32 +
      ellipticalRadius * 12.0;

    float orbitalTexture =
      0.50 +
      0.50 *
      sin(
        orbitalPhase +
        fbm(
          q * 5.2 +
          vec2(
            uTime * 0.042,
            -uTime * 0.030
          )
        ) *
        2.1
      );

    float orbitalMask =
      nuclearGlow *
      (1.0 - nuclearCusp * 0.72) *
      smoothstep(
        uCoreRadius * 0.72,
        uCoreRadius * 2.9,
        ellipticalRadius
      );

    // Concentric gaseous or dusty circles around the SMBH: make their motion
    // visibly orbit around the center without turning the nucleus into an AGN.
    float gasRingMask =
      smoothstep(
        uCoreRadius * 0.82,
        uCoreRadius * 1.90,
        ellipticalRadius
      ) *
      (1.0 - smoothstep(
        uEnvelopeRadius * 0.60,
        uEnvelopeRadius * 1.12,
        ellipticalRadius
      )) *
      (1.0 - nuclearCusp * 0.80);

    float normalizedRingRadius =
      clamp(
        ellipticalRadius /
        max(uEnvelopeRadius, 0.001),
        0.0,
        1.0
      );

    float differentialRotation =
      mix(
        0.95,
        2.20,
        1.0 - normalizedRingRadius
      );

    float gasRingPhase =
      polarAngle * 4.1 -
      uTime * 0.92 * differentialRotation +
      ellipticalRadius * 30.0;

    float gasRingBands =
      0.50 +
      0.50 *
      sin(
        gasRingPhase +
        fbm(
          q * 7.8 +
          vec2(
            uTime * 0.072,
            -uTime * 0.046
          )
        ) *
        2.6
      );

    float gasRingArcs = smoothstep(
      0.38,
      0.76,
      gasRingBands
    );

    float gasRingRipple =
      0.50 +
      0.50 *
      sin(
        ellipticalRadius * 58.0 -
        uTime * 0.72 +
        polarAngle * 1.6
      );

    float movingGasSector =
      0.50 +
      0.50 *
      sin(
        polarAngle * 2.6 -
        uTime * 1.12 * differentialRotation +
        ellipticalRadius * 7.4 +
        uSeed * 0.013
      );

    float gasRingTexture =
      gasRingArcs *
      mix(0.70, 1.28, gasRingRipple) *
      mix(0.74, 1.34, movingGasSector);

    color +=
      mix(
        uEnvelopeColor,
        uOldStarColor,
        0.34
      ) *
      dustySwirl *
      0.48 *
      attenuation;

    color +=
      mix(
        uEnvelopeColor,
        uOldStarColor,
        0.52
      ) *
      orbitalMask *
      orbitalTexture *
      0.28 *
      attenuation;

    color +=
      mix(
        uEnvelopeColor,
        uOldStarColor,
        0.58
      ) *
      gasRingMask *
      gasRingTexture *
      0.42 *
      attenuation;

    float nuclearStars = sparseStar(
      q + vec2(2.7, -1.4),
      72.0,
      0.115 + 0.125 * uStellarDensity,
      0.082,
      149.0
    );

    color +=
      mix(
        uOldStarColor,
        uCoreColor,
        0.26
      ) *
      nuclearStars *
      nuclearGlow *
      attenuation *
      0.92;

    float stellarShimmer =
      0.965 +
      0.035 *
      sin(
        uTime * 1.35 +
        ellipticalRadius * 17.0 +
        uSeed * 0.031
      );

    color +=
      uOldStarColor *
      starsFine *
      stellarWeight *
      0.86 *
      stellarShimmer;

    color +=
      mix(
        uOldStarColor,
        uCoreColor,
        0.32
      ) *
      starsMid *
      stellarWeight *
      0.68 *
      (1.0 + (stellarShimmer - 1.0) * 0.72);

    color +=
      uRedGiantColor *
      redGiants *
      stellarWeight *
      0.78 *
      (1.0 + (stellarShimmer - 1.0) * 0.46);

    float outerField = sparseStar(
      p + vec2(7.0, -3.0),
      18.0,
      0.018,
      0.055,
      113.0
    );

    color +=
      mix(
        uOldStarColor,
        vec3(0.74, 0.72, 0.67),
        0.52
      ) *
      outerField *
      0.28;

    // Wide nuclear bulge: gives the quiescent nucleus a dense old-stellar
    // environment instead of leaving most of the frame black.
    float broadBulge = exp(
      -pow(
        ellipticalRadius /
        max(uEnvelopeRadius * 1.42, 0.10),
        1.12
      )
    );

    float bulgeTexture = mix(
      0.58,
      1.36,
      fbm(
        q * 3.6 +
        vec2(uSeed * 0.004, -uSeed * 0.006) +
        slowDrift * 0.12
      )
    );

    color +=
      mix(
        uEnvelopeColor,
        uOldStarColor,
        0.42
      ) *
      broadBulge *
      bulgeTexture *
      0.34;

    // Dust filaments with a weak orbital twist around the SMBH.
    float theta = atan(q.y, q.x);
    float swirlCoord =
      (theta - uTime * 0.100) * 1.55 -
      ellipticalRadius * 8.6;
    float swirlNoise = fbm(
      vec2(
        swirlCoord * 0.46 + uSeed * 0.003,
        ellipticalRadius * 5.5 - uSeed * 0.004
      )
    );

    float dustFilaments =
      broadBulge *
      smoothstep(0.48, 0.78, swirlNoise) *
      (1.0 - nuclearCusp * 0.36);

    color +=
      mix(
        uEnvelopeColor,
        uRedGiantColor,
        0.26
      ) *
      dustFilaments *
      0.38;

    // Extra old stars near and through the bulge, but not a blue young-star
    // population: keep the nucleus recognisably quiescent.
    float denseNuclearStars = sparseStar(
      q + vec2(3.7, -2.1),
      88.0,
      0.12 + 0.16 * uStellarDensity,
      0.072,
      181.0
    );

    float intermediateStars = sparseStar(
      q + vec2(-4.1, 1.8),
      46.0,
      0.08 + 0.11 * uStellarDensity,
      0.070,
      223.0
    );

    color +=
      mix(uOldStarColor, uCoreColor, 0.18) *
      denseNuclearStars *
      broadBulge *
      0.86;

    color +=
      uOldStarColor *
      intermediateStars *
      broadBulge *
      0.52;

    float edgeVignette = 1.0 - smoothstep(
      0.64,
      1.40,
      length(p / vec2(max(uAspect, 1.0), 1.0))
    );

    color *= mix(
      0.72,
      1.0,
      edgeVignette
    );

    color = 1.0 - exp(-color * 1.92);
    color = pow(color, vec3(0.90));

    gl_FragColor = vec4(color, 1.0);
  }
`;

@Component({
  selector:
    'app-quiescent-nucleus-render',

  standalone:
    true,

  imports: [
    BlackHoleLaboratoryRender,
  ],

  templateUrl:
    './quiescent-nucleus-render.html',

  styleUrl:
    './quiescent-nucleus-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class QuiescentNucleusRender
  implements
    AfterViewInit,
    OnChanges,
    OnDestroy {

  @Input({
    required:
      true,
  })
  model!:
    QuiescentNucleusRenderModel;

  @Input()
  blackHoleCoreModel:
    BlackHoleLaboratoryRenderModel | null =
    null;

  @ViewChild(
    'renderHost',
    {
      static:
        true,
    },
  )
  private renderHostRef!:
    ElementRef<HTMLElement>;

  @ViewChild(
    'renderCanvas',
    {
      static:
        true,
    },
  )
  private renderCanvasRef!:
    ElementRef<HTMLCanvasElement>;

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
    THREE.OrthographicCamera | null =
    null;

  private material:
    THREE.ShaderMaterial | null =
    null;

  private geometry:
    THREE.PlaneGeometry | null =
    null;

  private resizeObserver:
    ResizeObserver | null =
    null;

  private listeningToWindowResize =
    false;

  private animationFrameId:
    number | null =
    null;

  private animationStartMs:
    number | null =
    null;

  private readonly animateFrame =
    (
      timestamp:
        number,
    ) => {
      const material =
        this.material;

      if (
        material ===
          null
      ) {
        this.animationFrameId =
          null;
        return;
      }

      if (
        this.animationStartMs ===
          null
      ) {
        this.animationStartMs =
          timestamp;
      }

      material.uniforms['uTime'].value =
        quiescentNucleusAnimationTime(
          this.animationStartMs,
          timestamp,
        );

      this.render();

      this.animationFrameId =
        window.requestAnimationFrame(
          this.animateFrame,
        );
    };

  private readonly renderUnavailableSignal =
    signal(
      false,
    );

  readonly renderUnavailable =
    this
      .renderUnavailableSignal
      .asReadonly();

  private readonly onWindowResize =
    () => {
      this.resize();
    };

  ngAfterViewInit(): void {
    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      this
        .renderUnavailableSignal
        .set(
          true,
        );
      return;
    }

    try {
      this.initializeRenderer();
      this.observeSize();
      this.resize();
      this.applyModel();
      this.startAnimation();
    } catch {
      this.disposeThree();
      this
        .renderUnavailableSignal
        .set(
          true,
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
      !changes['model']
        .firstChange
    ) {
      this.applyModel();
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();

    this
      .resizeObserver
      ?.disconnect();

    if (
      this.listeningToWindowResize
    ) {
      window.removeEventListener(
        'resize',
        this.onWindowResize,
      );
    }

    this.disposeThree();
  }

  private initializeRenderer(): void {
    const canvas =
      this
        .renderCanvasRef
        .nativeElement;

    const renderer =
      new THREE.WebGLRenderer({
        canvas,
        antialias:
          true,
        alpha:
          false,
        powerPreference:
          'high-performance',
      });

    renderer.setClearColor(
      0x03050a,
      1,
    );

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    const scene =
      new THREE.Scene();

    const camera =
      new THREE.OrthographicCamera(
        -1,
        1,
        1,
        -1,
        0,
        1,
      );

    const geometry =
      new THREE.PlaneGeometry(
        2,
        2,
      );

    const material =
      new THREE.ShaderMaterial({
        vertexShader:
          VERTEX_SHADER,
        fragmentShader:
          FRAGMENT_SHADER,
        depthTest:
          false,
        depthWrite:
          false,
        uniforms:
          createInitialUniforms(),
      });

    scene.add(
      new THREE.Mesh(
        geometry,
        material,
      ),
    );

    this.renderer =
      renderer;
    this.scene =
      scene;
    this.camera =
      camera;
    this.material =
      material;
  }

  private startAnimation(): void {
    if (
      !isPlatformBrowser(
        this.platformId,
      ) ||
      this.animationFrameId !==
        null
    ) {
      return;
    }

    this.animationStartMs =
      null;

    this.animationFrameId =
      window.requestAnimationFrame(
        this.animateFrame,
      );
  }

  private stopAnimation(): void {
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
    this.animationStartMs =
      null;
  }

  private observeSize(): void {
    if (
      typeof ResizeObserver !==
        'undefined'
    ) {
      this.resizeObserver =
        new ResizeObserver(
          () => {
            this.resize();
          },
        );

      this
        .resizeObserver
        .observe(
          this
            .renderHostRef
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

  private resize(): void {
    const renderer =
      this.renderer;
    const material =
      this.material;

    if (
      renderer ===
        null ||
      material ===
        null
    ) {
      return;
    }

    const host =
      this
        .renderHostRef
        .nativeElement;

    const width =
      Math.max(
        1,
        host.clientWidth,
      );

    const height =
      Math.max(
        1,
        host.clientHeight,
      );

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        2,
      ),
    );

    renderer.setSize(
      width,
      height,
      false,
    );

    material.uniforms['uAspect'].value =
      width /
      height;

    this.render();
  }

  private applyModel(): void {
    const material =
      this.material;

    if (
      material ===
        null ||
      this.model ===
        undefined
    ) {
      return;
    }

    const model =
      this.model;

    const uniforms =
      material.uniforms;

    uniforms['uSeed'].value =
      seedFloat(
        model.seed,
      );
    uniforms['uOrientation'].value =
      model.orientationRadians;
    uniforms['uAxisRatio'].value =
      model.axisRatio;
    uniforms['uCoreRadius'].value =
      model.coreRadius;
    uniforms['uEnvelopeRadius'].value =
      model.envelopeRadius;
    uniforms['uCuspExponent'].value =
      model.cuspExponent;
    uniforms['uCentralIntensity'].value =
      model.centralIntensity;
    uniforms['uStellarDensity'].value =
      model.stellarDensity;
    uniforms['uGranularity'].value =
      model.granularity;
    uniforms['uDustOpacity'].value =
      model.dustOpacity;
    uniforms['uDustWidth'].value =
      model.dustWidth;
    uniforms['uDustAngle'].value =
      model.dustAngleRadians;
    uniforms['uDustWarp'].value =
      model.dustWarp;
    uniforms['uSecondaryDustLane'].value =
      model.secondaryDustLane;
    uniforms['uAsymmetry'].value =
      model.asymmetry;

    uniforms['uCoreColor'].value.setRGB(
      ...model.palette.core,
    );
    uniforms['uOldStarColor'].value.setRGB(
      ...model.palette.oldStars,
    );
    uniforms['uRedGiantColor'].value.setRGB(
      ...model.palette.redGiants,
    );
    uniforms['uEnvelopeColor'].value.setRGB(
      ...model.palette.envelope,
    );

    this.render();
  }

  private render(): void {
    if (
      this.renderer ===
        null ||
      this.scene ===
        null ||
      this.camera ===
        null
    ) {
      return;
    }

    this.renderer.render(
      this.scene,
      this.camera,
    );
  }

  private disposeThree(): void {
    this.geometry
      ?.dispose();
    this.material
      ?.dispose();
    this.renderer
      ?.dispose();

    this.geometry =
      null;
    this.material =
      null;
    this.renderer =
      null;
    this.scene =
      null;
    this.camera =
      null;
  }
}

function createInitialUniforms():
  Record<string, THREE.IUniform> {
  return {
    uAspect:
      { value: 1 },
    uTime:
      { value: 0 },
    uSeed:
      { value: 0 },
    uOrientation:
      { value: 0 },
    uAxisRatio:
      { value: 0.9 },
    uCoreRadius:
      { value: 0.08 },
    uEnvelopeRadius:
      { value: 0.68 },
    uCuspExponent:
      { value: 2 },
    uCentralIntensity:
      { value: 0.72 },
    uStellarDensity:
      { value: 0.8 },
    uGranularity:
      { value: 0.6 },
    uDustOpacity:
      { value: 0.12 },
    uDustWidth:
      { value: 0.05 },
    uDustAngle:
      { value: 0 },
    uDustWarp:
      { value: 0.08 },
    uSecondaryDustLane:
      { value: 0 },
    uAsymmetry:
      { value: 0.06 },
    uCoreColor:
      { value: new THREE.Color(1, 0.9, 0.7) },
    uOldStarColor:
      { value: new THREE.Color(0.92, 0.62, 0.34) },
    uRedGiantColor:
      { value: new THREE.Color(0.82, 0.34, 0.20) },
    uEnvelopeColor:
      { value: new THREE.Color(0.38, 0.18, 0.09) },
  };
}

function seedFloat(
  seed:
    string,
): number {
  const normalized =
    seed
      .slice(
        0,
        8,
      );

  const parsed =
    Number.parseInt(
      normalized,
      16,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed /
      65536
    : 0;
}


export function quiescentNucleusAnimationTime(
  startMs:
    number,
  frameMs:
    number,
): number {
  return Math.max(
    0,
    frameMs -
      startMs,
  ) /
    1000;
}


export function quiescentNucleusVisibleMotionPhase(
  elapsedSeconds:
    number,
): Readonly<{
  dustRadians:
    number;
  orbitalRadians:
    number;
}> {
  const time =
    Math.max(
      0,
      elapsedSeconds,
    );

  return Object.freeze({
    dustRadians:
      time * 0.060,
    orbitalRadians:
      time * 0.22,
  });
}
