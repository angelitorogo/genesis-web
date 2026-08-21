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
  type QuasarNucleusRenderModel,
} from './quasar-nucleus-render-model';

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
  uniform float uDustTorusOpacity;
  uniform float uJetStrength;
  uniform float uJetLength;
  uniform float uJetOpening;
  uniform float uJetCollimation;
  uniform float uCounterJetRatio;
  uniform float uJetKnotStrength;
  uniform float uJetPrecession;
  uniform float uWindStrength;
  uniform float uWindOpening;
  uniform float uScatteringHaloStrength;
  uniform float uBackgroundStarDensity;
  uniform vec3 uInnerDiskColor;
  uniform vec3 uMidDiskColor;
  uniform vec3 uOuterDiskColor;
  uniform vec3 uPhotonRingColor;
  uniform vec3 uCoronaColor;
  uniform vec3 uJetCoreColor;
  uniform vec3 uJetSheathColor;
  uniform vec3 uWindColor;

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
    p += dot(
      p,
      p + 45.32 + uSeed * 0.001
    );
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
      mix(
        hash21(i),
        hash21(i + vec2(1.0, 0.0)),
        u.x
      ),
      mix(
        hash21(i + vec2(0.0, 1.0)),
        hash21(i + vec2(1.0, 1.0)),
        u.x
      ),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 drift =
      mat2(1.72, 1.14, -1.14, 1.72);

    for (
      int octave = 0;
      octave < 5;
      octave += 1
    ) {
      value +=
        amplitude *
        noise2(p);
      p =
        drift * p +
        vec2(7.31, 11.17);
      amplitude *= 0.50;
    }

    return value;
  }

  float gaussianBand(
    float value,
    float center,
    float width
  ) {
    float safeWidth =
      max(width, 0.0001);
    float d =
      (value - center) /
      safeWidth;
    return exp(-d * d);
  }

  float sparseStar(
    vec2 p,
    float scale,
    float probability,
    float radius,
    float salt
  ) {
    vec2 grid =
      p * scale;
    vec2 cell =
      floor(grid);
    vec2 local =
      fract(grid) - 0.5;
    vec2 jitter =
      (
        hash22(
          cell + salt
        ) -
        0.5
      ) *
      0.68;

    float present =
      step(
        1.0 - probability,
        hash21(
          cell +
          salt * 2.41
        )
      );

    float distanceToStar =
      length(
        local - jitter
      );

    float point =
      1.0 -
      smoothstep(
        radius * 0.26,
        radius,
        distanceToStar
      );

    float halo =
      1.0 -
      smoothstep(
        radius,
        radius * 3.2,
        distanceToStar
      );

    return present *
      (
        point +
        halo * 0.13
      );
  }

  void main() {
    vec2 p =
      (vUv - 0.5) *
      2.0;

    p.x *=
      uAspect;

    vec2 local =
      rotation(
        uOrientation
      ) *
      p;

    float inclinationAxis =
      mix(
        0.98,
        0.12,
        smoothstep(
          0.0,
          1.0,
          uInclination
        )
      );

    float coarse =
      fbm(
        local * 2.7 +
        vec2(
          uSeed * 0.013,
          -uSeed * 0.009
        )
      );

    float fine =
      fbm(
        local * 12.0 +
        vec2(
          -uSeed * 0.019,
          uSeed * 0.014
        )
      );

    float screenRadius =
      length(p);

    float warpEnvelope =
      1.0 -
      smoothstep(
        uDiskInnerRadius,
        uDiskOuterRadius,
        abs(local.x)
      );

    float warpedY =
      local.y +
      sin(
        local.x * 8.4 +
        coarse * 4.4 +
        uSeed * 0.021
      ) *
      uWarp *
      0.16 *
      warpEnvelope;

    vec2 projectedDisk =
      vec2(
        local.x,
        warpedY /
        max(
          inclinationAxis,
          0.075
        )
      );

    float diskRadius =
      length(
        projectedDisk
      );

    float radialWindow =
      smoothstep(
        uDiskInnerRadius * 0.91,
        uDiskInnerRadius * 1.05,
        diskRadius
      ) *
      (
        1.0 -
        smoothstep(
          uDiskOuterRadius * 0.82,
          uDiskOuterRadius,
          diskRadius
        )
      );

    float thicknessMask =
      exp(
        -pow(
          abs(warpedY) /
          max(
            uDiskThickness +
            (
              1.0 -
              inclinationAxis
            ) *
            0.022,
            0.008
          ),
          1.30
        )
      );

    float faceOnMix =
      smoothstep(
        0.34,
        0.90,
        inclinationAxis
      );

    float diskBody =
      radialWindow *
      mix(
        thicknessMask,
        0.72 +
        0.28 *
        thicknessMask,
        faceOnMix
      );

    float normalizedDiskRadius =
      clamp(
        (
          diskRadius -
          uDiskInnerRadius
        ) /
        max(
          uDiskOuterRadius -
          uDiskInnerRadius,
          0.001
        ),
        0.0,
        1.0
      );

    float turbulentField =
      fbm(
        projectedDisk *
        mix(
          8.0,
          19.0,
          uTurbulence
        ) +
        vec2(
          coarse * 3.6,
          fine * 2.4
        )
      );

    float clumpField =
      fbm(
        projectedDisk * 25.0 +
        vec2(
          31.0,
          -17.0
        ) +
        uSeed * 0.027
      );

    float clumpModulation =
      mix(
        1.0,
        smoothstep(
          0.26,
          0.80,
          clumpField
        ) *
        1.42 +
        0.16,
        uClumpiness
      );

    float turbulentModulation =
      mix(
        0.80,
        1.24,
        turbulentField
      );

    float dopplerScale =
      max(
        uDiskOuterRadius *
        0.40,
        0.04
      );

    float dopplerSide =
      local.x /
      sqrt(
        local.x *
        local.x +
        dopplerScale *
        dopplerScale
      );

    float dopplerBoost =
      clamp(
        1.0 +
        dopplerSide *
        uDopplerAsymmetry *
        0.88,
        0.24,
        1.88
      );

    float innerWeight =
      pow(
        1.0 -
        normalizedDiskRadius,
        2.30
      );

    float middleWeight =
      4.0 *
      normalizedDiskRadius *
      (
        1.0 -
        normalizedDiskRadius
      );

    float outerWeight =
      pow(
        normalizedDiskRadius,
        1.30
      );

    vec3 diskColor =
      uInnerDiskColor *
        innerWeight +
      uMidDiskColor *
        middleWeight *
        0.84 +
      uOuterDiskColor *
        outerWeight *
        0.70;

    float diskEmission =
      diskBody *
      turbulentModulation *
      clumpModulation *
      dopplerBoost *
      uAccretionBrightness;

    /*
     * Obscuring molecular/dust torus.
     *
     * It belongs to the quasar environment, not to the event horizon.
     * Its opacity is strongest for edge-on views and at intermediate radii.
     */
    float torusRadius =
      length(
        vec2(
          local.x,
          local.y /
          max(
            mix(
              0.24,
              0.52,
              inclinationAxis
            ),
            0.12
          )
        )
      );

    float torusBand =
      gaussianBand(
        torusRadius,
        uDiskOuterRadius * 0.72,
        uDiskOuterRadius * 0.20
      );

    float torusClumps =
      smoothstep(
        0.28,
        0.74,
        fbm(
          local * 12.0 +
          vec2(
            17.0,
            -29.0
          )
        )
      );

    float torus =
      torusBand *
      mix(
        0.56,
        1.18,
        torusClumps
      ) *
      uDustTorusOpacity;

    float edgeOnObscuration =
      smoothstep(
        0.42,
        0.92,
        uInclination
      );

    float diskAttenuation =
      clamp(
        1.0 -
        torus *
        edgeOnObscuration *
        0.78,
        0.16,
        1.0
      );

    diskEmission *=
      diskAttenuation;

    /*
     * Relativistic jet axis is perpendicular to the accretion plane.
     * The subtle sinusoid introduces deterministic precession/curvature.
     */
    float axial =
      abs(
        local.y
      );

    float precessionCurve =
      sin(
        local.y *
        7.0 +
        uSeed * 0.031 +
        coarse * 1.5
      ) *
      uJetPrecession *
      (
        0.12 +
        axial * 0.10
      );

    float jetTransverse =
      abs(
        local.x -
        precessionCurve
      );

    float jetWidth =
      uJetOpening +
      axial *
      mix(
        0.105,
        0.022,
        uJetCollimation
      );

    float jetEnvelope =
      smoothstep(
        uShadowRadius * 0.50,
        uShadowRadius * 1.65,
        axial
      ) *
      (
        1.0 -
        smoothstep(
          uJetLength * 0.82,
          uJetLength,
          axial
        )
      );

    float jetCore =
      exp(
        -pow(
          jetTransverse /
          max(
            jetWidth * 0.34,
            0.006
          ),
          2.0
        )
      ) *
      jetEnvelope;

    float jetSheath =
      exp(
        -pow(
          jetTransverse /
          max(
            jetWidth,
            0.010
          ),
          1.55
        )
      ) *
      jetEnvelope;

    float preferredPositive =
      step(
        0.5,
        fract(
          uSeed * 17.371
        )
      );

    float positiveWeight =
      mix(
        uCounterJetRatio,
        1.0,
        preferredPositive
      );

    float negativeWeight =
      mix(
        1.0,
        uCounterJetRatio,
        preferredPositive
      );

    float directionalJetWeight =
      mix(
        negativeWeight,
        positiveWeight,
        step(
          0.0,
          local.y
        )
      );

    float knotPhase =
      fract(
        axial *
        mix(
          6.0,
          13.0,
          uJetKnotStrength
        ) +
        fine * 0.72 +
        uSeed * 0.043
      );

    float knotBand =
      exp(
        -pow(
          (
            knotPhase -
            0.50
          ) /
          mix(
            0.22,
            0.10,
            uJetKnotStrength
          ),
          2.0
        )
      );

    float knotNoise =
      smoothstep(
        0.34,
        0.74,
        fbm(
          vec2(
            local.x * 26.0,
            local.y * 8.0
          ) +
          uSeed * 0.017
        )
      );

    float knots =
      jetSheath *
      knotBand *
      mix(
        0.58,
        1.20,
        knotNoise
      ) *
      uJetKnotStrength;

    float jet =
      (
        jetCore *
        1.28 +
        jetSheath *
        0.56 +
        knots *
        0.94
      ) *
      uJetStrength *
      directionalJetWeight;

    /*
     * Wide-angle disk wind / ionization cone.  This is deliberately broader
     * than the relativistic jet and can dominate radio-quiet quasar families.
     */
    float coneSlope =
      jetTransverse /
      max(
        axial,
        0.035
      );

    float windHalfWidth =
      mix(
        0.24,
        0.88,
        uWindOpening
      );

    float coneMask =
      1.0 -
      smoothstep(
        windHalfWidth * 0.72,
        windHalfWidth,
        coneSlope
      );

    float windAxialEnvelope =
      smoothstep(
        uShadowRadius * 1.10,
        uShadowRadius * 2.2,
        axial
      ) *
      (
        1.0 -
        smoothstep(
          0.58,
          1.34,
          axial
        )
      );

    float windTurbulence =
      mix(
        0.48,
        1.22,
        fbm(
          local * 5.5 +
          vec2(
            coarse * 2.6,
            fine * 1.8
          )
        )
      );

    float wind =
      coneMask *
      windAxialEnvelope *
      windTurbulence *
      uWindStrength;

    /*
     * Hot corona, photon ring and gravitationally-lensed arcs.
     */
    float corona =
      exp(
        -pow(
          screenRadius /
          max(
            uShadowRadius * 4.5,
            0.055
          ),
          1.34
        )
      ) *
      uCoronaStrength;

    float photonRing =
      gaussianBand(
        screenRadius,
        uShadowRadius * 1.075,
        uShadowRadius * 0.052
      ) *
      uPhotonRingStrength;

    float innerLensingRing =
      gaussianBand(
        screenRadius,
        uShadowRadius * 1.47,
        uShadowRadius * 0.16
      );

    float angle =
      atan(
        p.y,
        p.x
      ) -
      uOrientation;

    float lensArcPreference =
      pow(
        abs(
          sin(angle)
        ),
        mix(
          1.2,
          3.2,
          uInclination
        )
      );

    float lensingArc =
      innerLensingRing *
      mix(
        0.48,
        1.0,
        lensArcPreference
      ) *
      uLensingStrength;

    float farSideArc =
      gaussianBand(
        screenRadius,
        uShadowRadius * 1.82,
        uShadowRadius * 0.24
      ) *
      lensArcPreference *
      uLensingStrength *
      (
        0.38 +
        0.44 *
        uInclination
      );

    float scatteringHalo =
      exp(
        -pow(
          screenRadius /
          max(
            uDiskOuterRadius * 1.34,
            0.16
          ),
          1.22
        )
      ) *
      mix(
        0.54,
        1.18,
        coarse
      ) *
      uScatteringHaloStrength;

    float shadow =
      1.0 -
      smoothstep(
        uShadowRadius * 0.94,
        uShadowRadius * 1.02,
        screenRadius
      );

    float shadowRim =
      gaussianBand(
        screenRadius,
        uShadowRadius * 1.01,
        uShadowRadius * 0.030
      );

    vec3 color =
      vec3(
        0.0012,
        0.0015,
        0.0030
      );

    float stars =
      sparseStar(
        p +
        vec2(
          4.0,
          -7.0
        ),
        23.0,
        uBackgroundStarDensity,
        0.052,
        61.0
      );

    float brightStars =
      sparseStar(
        p +
        vec2(
          -9.0,
          3.0
        ),
        15.0,
        uBackgroundStarDensity *
        0.24,
        0.068,
        97.0
      );

    color +=
      vec3(
        0.52,
        0.62,
        0.82
      ) *
      stars *
      0.28;

    color +=
      vec3(
        0.92,
        0.86,
        0.72
      ) *
      brightStars *
      0.22;

    color +=
      diskColor *
      diskEmission *
      1.62;

    color +=
      uCoronaColor *
      corona *
      0.52;

    color +=
      uPhotonRingColor *
      photonRing *
      2.65;

    color +=
      mix(
        uMidDiskColor,
        uPhotonRingColor,
        0.62
      ) *
      lensingArc *
      1.34;

    color +=
      mix(
        uOuterDiskColor,
        uPhotonRingColor,
        0.42
      ) *
      farSideArc *
      0.82;

    color +=
      uWindColor *
      wind *
      0.50;

    color +=
      uWindColor *
      scatteringHalo *
      0.16;

    color +=
      uJetSheathColor *
      jetSheath *
      uJetStrength *
      directionalJetWeight *
      0.64;

    color +=
      uJetCoreColor *
      jetCore *
      uJetStrength *
      directionalJetWeight *
      1.34;

    color +=
      mix(
        uJetCoreColor,
        uJetSheathColor,
        0.44
      ) *
      knots *
      uJetStrength *
      directionalJetWeight *
      1.18;

    /*
     * The event-horizon shadow remains physically dark.  Quasar glare can
     * surround it, but it never fills the central void with emissive matter.
     */
    color +=
      uPhotonRingColor *
      shadowRim *
      uPhotonRingStrength *
      0.68;

    color *=
      1.0 -
      shadow *
      0.998;

    float innerVoid =
      1.0 -
      smoothstep(
        uShadowRadius * 0.70,
        uShadowRadius * 0.94,
        screenRadius
      );

    color *=
      1.0 -
      innerVoid;

    /*
     * Dust torus appears in absorption against the central glow.
     */
    float torusAbsorption =
      torus *
      edgeOnObscuration *
      0.34;

    color *=
      1.0 -
      clamp(
        torusAbsorption,
        0.0,
        0.58
      );

    float vignette =
      1.0 -
      smoothstep(
        0.74,
        1.55,
        length(
          p /
          vec2(
            max(
              uAspect,
              1.0
            ),
            1.0
          )
        )
      );

    color *=
      mix(
        0.44,
        1.0,
        vignette
      );

    /*
     * Quasars are intentionally allowed more dynamic range than ordinary AGN,
     * while tone mapping keeps the disk texture and jet knots visible.
     */
    float exposure =
      1.52 +
      uAccretionBrightness *
      0.34 +
      uCoronaStrength *
      0.10;

    color =
      1.0 -
      exp(
        -color *
        exposure
      );

    color =
      pow(
        color,
        vec3(0.84)
      );

    gl_FragColor =
      vec4(
        color,
        1.0
      );
  }
`;

@Component({
  selector:
    'app-quasar-nucleus-render',

  standalone:
    true,

  templateUrl:
    './quasar-nucleus-render.html',

  styleUrl:
    './quasar-nucleus-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class QuasarNucleusRender
  implements
    AfterViewInit,
    OnChanges,
    OnDestroy {

  @Input({
    required:
      true,
  })
  model!:
    QuasarNucleusRenderModel;

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
      0x010208,
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

    material
      .uniforms[
        'uAspect'
      ]
      .value =
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
    uniforms['uDustTorusOpacity'].value =
      model.dustTorusOpacity;
    uniforms['uJetStrength'].value =
      model.jetStrength;
    uniforms['uJetLength'].value =
      model.jetLength;
    uniforms['uJetOpening'].value =
      model.jetOpening;
    uniforms['uJetCollimation'].value =
      model.jetCollimation;
    uniforms['uCounterJetRatio'].value =
      model.counterJetRatio;
    uniforms['uJetKnotStrength'].value =
      model.jetKnotStrength;
    uniforms['uJetPrecession'].value =
      model.jetPrecession;
    uniforms['uWindStrength'].value =
      model.windStrength;
    uniforms['uWindOpening'].value =
      model.windOpening;
    uniforms['uScatteringHaloStrength'].value =
      model.scatteringHaloStrength;
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
    uniforms['uJetCoreColor'].value.setRGB(
      ...model.palette.jetCore,
    );
    uniforms['uJetSheathColor'].value.setRGB(
      ...model.palette.jetSheath,
    );
    uniforms['uWindColor'].value.setRGB(
      ...model.palette.wind,
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
      { value: 0.48 },
    uShadowRadius:
      { value: 0.076 },
    uDiskInnerRadius:
      { value: 0.10 },
    uDiskOuterRadius:
      { value: 0.64 },
    uDiskThickness:
      { value: 0.05 },
    uAccretionBrightness:
      { value: 1.16 },
    uPhotonRingStrength:
      { value: 0.92 },
    uLensingStrength:
      { value: 0.88 },
    uDopplerAsymmetry:
      { value: 0.54 },
    uTurbulence:
      { value: 0.50 },
    uClumpiness:
      { value: 0.22 },
    uWarp:
      { value: 0.06 },
    uCoronaStrength:
      { value: 1.02 },
    uDustTorusOpacity:
      { value: 0.18 },
    uJetStrength:
      { value: 0.76 },
    uJetLength:
      { value: 0.94 },
    uJetOpening:
      { value: 0.036 },
    uJetCollimation:
      { value: 0.86 },
    uCounterJetRatio:
      { value: 0.58 },
    uJetKnotStrength:
      { value: 0.40 },
    uJetPrecession:
      { value: 0.04 },
    uWindStrength:
      { value: 0.48 },
    uWindOpening:
      { value: 0.40 },
    uScatteringHaloStrength:
      { value: 0.82 },
    uBackgroundStarDensity:
      { value: 0.012 },
    uInnerDiskColor:
      {
        value:
          new THREE.Color(
            0.94,
            0.98,
            1.00,
          ),
      },
    uMidDiskColor:
      {
        value:
          new THREE.Color(
            0.58,
            0.80,
            1.00,
          ),
      },
    uOuterDiskColor:
      {
        value:
          new THREE.Color(
            0.18,
            0.32,
            0.92,
          ),
      },
    uPhotonRingColor:
      {
        value:
          new THREE.Color(
            0.86,
            0.96,
            1.00,
          ),
      },
    uCoronaColor:
      {
        value:
          new THREE.Color(
            0.62,
            0.82,
            1.00,
          ),
      },
    uJetCoreColor:
      {
        value:
          new THREE.Color(
            0.82,
            0.96,
            1.00,
          ),
      },
    uJetSheathColor:
      {
        value:
          new THREE.Color(
            0.16,
            0.48,
            1.00,
          ),
      },
    uWindColor:
      {
        value:
          new THREE.Color(
            0.36,
            0.66,
            1.00,
          ),
      },
  };
}

function seedFloat(
  seed:
    string,
): number {
  const normalized =
    seed.slice(
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
