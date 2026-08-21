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
  type AgnNucleusRenderModel,
} from './agn-nucleus-render-model';

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
  uniform float uSeed;
  uniform float uOrientation;
  uniform float uInclination;
  uniform float uShadowRadius;
  uniform float uDiskInnerRadius;
  uniform float uDiskOuterRadius;
  uniform float uDiskThickness;
  uniform float uAccretionBrightness;
  uniform float uPhotonRingStrength;
  uniform float uLensingStrength;
  uniform float uDopplerAsymmetry;
  uniform float uTurbulence;
  uniform float uClumpiness;
  uniform float uWarp;
  uniform float uCoronaStrength;
  uniform float uDustOpacity;
  uniform float uTemperatureBias;
  uniform float uBackgroundStarDensity;
  uniform vec3 uInnerDiskColor;
  uniform vec3 uMidDiskColor;
  uniform vec3 uOuterDiskColor;
  uniform vec3 uPhotonRingColor;
  uniform vec3 uCoronaColor;

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
    mat2 drift = mat2(1.72, 1.14, -1.14, 1.72);

    for (int octave = 0; octave < 5; octave += 1) {
      value += amplitude * noise2(p);
      p = drift * p + vec2(7.31, 11.17);
      amplitude *= 0.50;
    }

    return value;
  }

  float gaussianBand(
    float value,
    float center,
    float width
  ) {
    float safeWidth = max(width, 0.0001);
    float d = (value - center) / safeWidth;
    return exp(-d * d);
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
    vec2 jitter = (hash22(cell + salt) - 0.5) * 0.68;
    float present = step(
      1.0 - probability,
      hash21(cell + salt * 2.41)
    );
    float distanceToStar = length(local - jitter);
    float point = 1.0 - smoothstep(
      radius * 0.26,
      radius,
      distanceToStar
    );
    float halo = 1.0 - smoothstep(
      radius,
      radius * 3.0,
      distanceToStar
    );

    return present * (point + halo * 0.13);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= uAspect;

    vec2 disk = rotation(uOrientation) * p;

    float inclinationAxis = mix(
      0.96,
      0.13,
      smoothstep(0.0, 1.0, uInclination)
    );

    float coarse = fbm(
      disk * 2.8 +
      vec2(uSeed * 0.013, -uSeed * 0.009)
    );

    float fine = fbm(
      disk * 10.5 +
      vec2(-uSeed * 0.019, uSeed * 0.014)
    );

    float warpEnvelope = 1.0 - smoothstep(
      uDiskInnerRadius,
      uDiskOuterRadius,
      abs(disk.x)
    );

    float warpedY =
      disk.y +
      sin(
        disk.x * 8.0 +
        coarse * 4.0 +
        uSeed * 0.021
      ) *
      uWarp *
      0.18 *
      warpEnvelope;

    vec2 projectedDisk = vec2(
      disk.x,
      warpedY / max(inclinationAxis, 0.08)
    );

    float diskRadius = length(projectedDisk);
    float screenRadius = length(p);

    float radialWindow =
      smoothstep(
        uDiskInnerRadius * 0.92,
        uDiskInnerRadius * 1.06,
        diskRadius
      ) *
      (1.0 - smoothstep(
        uDiskOuterRadius * 0.82,
        uDiskOuterRadius,
        diskRadius
      ));

    float thicknessMask = exp(
      -pow(
        abs(warpedY) /
        max(
          uDiskThickness +
          (1.0 - inclinationAxis) * 0.024,
          0.008
        ),
        1.34
      )
    );

    float faceOnMix = smoothstep(
      0.36,
      0.90,
      inclinationAxis
    );

    float diskBody = radialWindow * mix(
      thicknessMask,
      0.72 + 0.28 * thicknessMask,
      faceOnMix
    );

    float normalizedDiskRadius = clamp(
      (diskRadius - uDiskInnerRadius) /
      max(
        uDiskOuterRadius - uDiskInnerRadius,
        0.001
      ),
      0.0,
      1.0
    );

    float spiralTurbulence = fbm(
      projectedDisk *
      mix(7.0, 16.0, uTurbulence) +
      vec2(
        coarse * 3.2,
        fine * 2.1
      )
    );

    float clumpField = fbm(
      projectedDisk * 23.0 +
      vec2(31.0, -17.0) +
      uSeed * 0.027
    );

    float clumpModulation = mix(
      1.0,
      smoothstep(
        0.28,
        0.78,
        clumpField
      ) * 1.35 + 0.18,
      uClumpiness
    );

    float turbulentModulation = mix(
      0.84,
      1.18,
      spiralTurbulence
    );

    float dustField = smoothstep(
      0.38,
      0.73,
      fbm(
        projectedDisk * 13.0 +
        vec2(-5.0, 19.0)
      )
    );

    float dustAttenuation = clamp(
      1.0 -
      uDustOpacity *
      dustField *
      smoothstep(0.20, 0.92, normalizedDiskRadius),
      0.22,
      1.0
    );

    float dopplerSide = tanh(
      disk.x /
      max(uDiskOuterRadius * 0.42, 0.04)
    );

    float dopplerBoost = clamp(
      1.0 +
      dopplerSide *
      uDopplerAsymmetry *
      0.78,
      0.32,
      1.72
    );

    float diskEmission =
      diskBody *
      turbulentModulation *
      clumpModulation *
      dustAttenuation *
      dopplerBoost *
      uAccretionBrightness;

    float innerWeight = pow(
      1.0 - normalizedDiskRadius,
      2.15
    );

    float middleWeight =
      4.0 *
      normalizedDiskRadius *
      (1.0 - normalizedDiskRadius);

    float outerWeight = pow(
      normalizedDiskRadius,
      1.36
    );

    vec3 diskColor =
      uInnerDiskColor * innerWeight +
      uMidDiskColor * middleWeight * 0.82 +
      uOuterDiskColor * outerWeight * 0.72;

    float photonRing = gaussianBand(
      screenRadius,
      uShadowRadius * 1.075,
      uShadowRadius * 0.055
    ) *
    uPhotonRingStrength;

    float innerLensingRing = gaussianBand(
      screenRadius,
      uShadowRadius * 1.46,
      uShadowRadius * 0.16
    );

    float angle = atan(p.y, p.x) - uOrientation;
    float lensArcPreference = pow(
      abs(sin(angle)),
      mix(1.4, 3.4, uInclination)
    );

    float lensingArc =
      innerLensingRing *
      mix(
        0.42,
        1.0,
        lensArcPreference
      ) *
      uLensingStrength;

    float farSideArc = gaussianBand(
      screenRadius,
      uShadowRadius * 1.78,
      uShadowRadius * 0.24
    ) *
    lensArcPreference *
    uLensingStrength *
    (0.34 + 0.42 * uInclination);

    float corona = exp(
      -pow(
        screenRadius /
        max(uShadowRadius * 2.75, 0.04),
        1.55
      )
    ) *
    uCoronaStrength;

    float shadow = 1.0 - smoothstep(
      uShadowRadius * 0.94,
      uShadowRadius * 1.02,
      screenRadius
    );

    float shadowRim = gaussianBand(
      screenRadius,
      uShadowRadius * 1.01,
      uShadowRadius * 0.032
    );

    vec3 color = vec3(0.0015, 0.0018, 0.0026);

    float stars = sparseStar(
      p + vec2(4.0, -7.0),
      22.0,
      uBackgroundStarDensity,
      0.055,
      61.0
    );

    float brightStars = sparseStar(
      p + vec2(-9.0, 3.0),
      14.0,
      uBackgroundStarDensity * 0.28,
      0.070,
      97.0
    );

    color += vec3(0.60, 0.66, 0.78) * stars * 0.34;
    color += vec3(0.92, 0.84, 0.68) * brightStars * 0.26;

    color +=
      diskColor *
      diskEmission *
      1.45;

    color +=
      uCoronaColor *
      corona *
      0.32;

    color +=
      uPhotonRingColor *
      photonRing *
      2.35;

    color +=
      mix(
        uMidDiskColor,
        uPhotonRingColor,
        0.58
      ) *
      lensingArc *
      1.25;

    color +=
      mix(
        uOuterDiskColor,
        uPhotonRingColor,
        0.36
      ) *
      farSideArc *
      0.72;

    color +=
      uPhotonRingColor *
      shadowRim *
      uPhotonRingStrength *
      0.58;

    color *= 1.0 - shadow * 0.995;

    float innerVoid = 1.0 - smoothstep(
      uShadowRadius * 0.72,
      uShadowRadius * 0.94,
      screenRadius
    );

    color *= 1.0 - innerVoid;

    float vignette = 1.0 - smoothstep(
      0.70,
      1.48,
      length(
        p /
        vec2(max(uAspect, 1.0), 1.0)
      )
    );

    color *= mix(
      0.48,
      1.0,
      vignette
    );

    float exposure = mix(
      1.18,
      1.42,
      uTemperatureBias
    );

    color = 1.0 - exp(-color * exposure);
    color = pow(color, vec3(0.88));

    gl_FragColor = vec4(color, 1.0);
  }
`;

@Component({
  selector:
    'app-agn-nucleus-render',

  standalone:
    true,

  templateUrl:
    './agn-nucleus-render.html',

  styleUrl:
    './agn-nucleus-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class AgnNucleusRender
  implements
    AfterViewInit,
    OnChanges,
    OnDestroy {

  @Input({
    required:
      true,
  })
  model!:
    AgnNucleusRenderModel;

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
      0x020306,
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
    uniforms['uInclination'].value =
      model.inclination;
    uniforms['uShadowRadius'].value =
      model.shadowRadius;
    uniforms['uDiskInnerRadius'].value =
      model.diskInnerRadius;
    uniforms['uDiskOuterRadius'].value =
      model.diskOuterRadius;
    uniforms['uDiskThickness'].value =
      model.diskThickness;
    uniforms['uAccretionBrightness'].value =
      model.accretionBrightness;
    uniforms['uPhotonRingStrength'].value =
      model.photonRingStrength;
    uniforms['uLensingStrength'].value =
      model.lensingStrength;
    uniforms['uDopplerAsymmetry'].value =
      model.dopplerAsymmetry;
    uniforms['uTurbulence'].value =
      model.turbulence;
    uniforms['uClumpiness'].value =
      model.clumpiness;
    uniforms['uWarp'].value =
      model.warp;
    uniforms['uCoronaStrength'].value =
      model.coronaStrength;
    uniforms['uDustOpacity'].value =
      model.dustOpacity;
    uniforms['uTemperatureBias'].value =
      model.temperatureBias;
    uniforms['uBackgroundStarDensity'].value =
      model.backgroundStarDensity;

    uniforms['uInnerDiskColor'].value.setRGB(
      ...model.palette.innerDisk,
    );
    uniforms['uMidDiskColor'].value.setRGB(
      ...model.palette.midDisk,
    );
    uniforms['uOuterDiskColor'].value.setRGB(
      ...model.palette.outerDisk,
    );
    uniforms['uPhotonRingColor'].value.setRGB(
      ...model.palette.photonRing,
    );
    uniforms['uCoronaColor'].value.setRGB(
      ...model.palette.corona,
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
    uSeed:
      { value: 0 },
    uOrientation:
      { value: 0 },
    uInclination:
      { value: 0.6 },
    uShadowRadius:
      { value: 0.11 },
    uDiskInnerRadius:
      { value: 0.16 },
    uDiskOuterRadius:
      { value: 0.70 },
    uDiskThickness:
      { value: 0.05 },
    uAccretionBrightness:
      { value: 0.78 },
    uPhotonRingStrength:
      { value: 0.72 },
    uLensingStrength:
      { value: 0.68 },
    uDopplerAsymmetry:
      { value: 0.34 },
    uTurbulence:
      { value: 0.36 },
    uClumpiness:
      { value: 0.20 },
    uWarp:
      { value: 0.04 },
    uCoronaStrength:
      { value: 0.28 },
    uDustOpacity:
      { value: 0.08 },
    uTemperatureBias:
      { value: 0.72 },
    uBackgroundStarDensity:
      { value: 0.02 },
    uInnerDiskColor:
      { value: new THREE.Color(1, 0.95, 0.78) },
    uMidDiskColor:
      { value: new THREE.Color(1, 0.56, 0.12) },
    uOuterDiskColor:
      { value: new THREE.Color(0.62, 0.11, 0.025) },
    uPhotonRingColor:
      { value: new THREE.Color(1, 0.80, 0.42) },
    uCoronaColor:
      { value: new THREE.Color(1, 0.72, 0.28) },
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
