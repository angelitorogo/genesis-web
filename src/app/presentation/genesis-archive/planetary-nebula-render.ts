import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';

import * as THREE from 'three';

import {
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  PlanetaryNebulaRenderModelBuilder,
} from './planetary-nebula-render-model';

@Component({
  selector:
    'app-planetary-nebula-render',

  standalone:
    true,

  templateUrl:
    './planetary-nebula-render.html',

  styleUrl:
    './planetary-nebula-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PlanetaryNebulaRender
  implements
    AfterViewInit,
    OnDestroy {

  readonly descriptor =
    input.required<ArchiveGalacticObjectRenderDescriptor>();

  @ViewChild(
    'canvas',
    {
      static:
        true,
    },
  )
  private canvasRef!:
    ElementRef<HTMLCanvasElement>;

  private renderer:
    THREE.WebGLRenderer | null =
    null;

  private scene:
    THREE.Scene | null =
    null;

  private camera:
    THREE.OrthographicCamera | null =
    null;

  private geometry:
    THREE.PlaneGeometry | null =
    null;

  private material:
    THREE.ShaderMaterial | null =
    null;

  private resizeObserver:
    ResizeObserver | null =
    null;

  private latestDescriptor:
    ArchiveGalacticObjectRenderDescriptor | null =
    null;

  constructor() {
    effect(
      () => {
        const descriptor =
          this.descriptor();

        this.latestDescriptor =
          descriptor;

        this.applyDescriptor(
          descriptor,
        );
      },
    );
  }

  ngAfterViewInit(): void {

    if (
      !supportsWebGl()
    ) {
      return;
    }

    try {
      const canvas =
        this.canvasRef
          .nativeElement;

      this.renderer =
        new THREE.WebGLRenderer({
          canvas,
          alpha:
            false,
          antialias:
            false,
          powerPreference:
            'high-performance',
        });

      this.renderer
        .setPixelRatio(
          Math.min(
            window.devicePixelRatio ||
              1,
            1.5,
          ),
        );

      this.renderer.outputColorSpace =
        THREE.SRGBColorSpace;

      this.renderer.toneMapping =
        THREE.ACESFilmicToneMapping;

      this.renderer.toneMappingExposure =
        1.00;

      this.scene =
        new THREE.Scene();

      this.camera =
        new THREE.OrthographicCamera(
          -1,
          1,
          1,
          -1,
          0,
          1,
        );

      this.geometry =
        new THREE.PlaneGeometry(
          2,
          2,
        );

      this.material =
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
            createUniforms(),
        });

      this.scene.add(
        new THREE.Mesh(
          this.geometry,
          this.material,
        ),
      );

      this.resizeObserver =
        new ResizeObserver(
          () =>
            this.resizeAndRender(),
        );

      this.resizeObserver
        .observe(
          canvas,
        );

      if (
        this.latestDescriptor !==
          null
      ) {
        this.applyDescriptor(
          this.latestDescriptor,
        );
      }

      this.resizeAndRender();
    } catch {
      this.disposeWebGl();
    }
  }

  ngOnDestroy(): void {

    this.resizeObserver
      ?.disconnect();

    this.resizeObserver =
      null;

    this.disposeWebGl();
  }

  private applyDescriptor(
    descriptor:
      ArchiveGalacticObjectRenderDescriptor,
  ): void {

    if (
      this.material ===
        null
    ) {
      return;
    }

    const model =
      PlanetaryNebulaRenderModelBuilder
        .build(
          descriptor,
        );

    const uniforms =
      this.material
        .uniforms;

    (
      uniforms[
        'uSeed'
      ].value as
        THREE.Vector2
    ).set(
      model.structureSeedX,
      model.structureSeedY,
    );

    uniforms[
      'uOrientation'
    ].value =
      model.orientationRadians;

    uniforms[
      'uStructureAspect'
    ].value =
      model.structureAspect;

    uniforms[
      'uMacroScale'
    ].value =
      model.macroScale;

    uniforms[
      'uApparentExtent'
    ].value =
      model.apparentExtent;

    (
      uniforms[
        'uShell'
      ].value as
        THREE.Vector4
    ).set(
      model.shellRadius,
      model.shellThickness,
      model.ellipticity,
      model.bipolarity,
    );

    (
      uniforms[
        'uLobes'
      ].value as
        THREE.Vector4
    ).set(
      model.lobeCount,
      model.lobeStrength,
      model.shellPhase,
      model.outerHaloStrength,
    );

    (
      uniforms[
        'uPalette'
      ].value as
        THREE.Vector4
    ).set(
      model.innerCoolShift,
      model.middleMagentaShift,
      model.outerWarmShift,
      model.paletteBalance,
    );

    (
      uniforms[
        'uVolumeIdentity'
      ].value as
        THREE.Vector4
    ).set(
      model.inclinationRadians,
      model.depthStretch,
      model.expansionAsymmetry,
      model.turbulenceStrength,
    );

    uniforms[
      'uCentralStarHeat'
    ].value =
      model.centralStarHeat;

    uniforms[
      'uDetail'
    ].value =
      model.detailFactor;

    uniforms[
      'uStarVisibility'
    ].value =
      model.starVisibility;

    uniforms[
      'uPlanetaryReveal'
    ].value =
      model.planetaryReveal;

    uniforms[
      'uPhysicalScale'
    ].value =
      model.physicalScale;

    uniforms[
      'uDensity'
    ].value =
      model.density;

    uniforms[
      'uEnergy'
    ].value =
      model.energy;

    uniforms[
      'uConcentration'
    ].value =
      model.concentration;

    this.renderOnce();
  }

  private resizeAndRender(): void {

    if (
      this.renderer ===
        null ||
      this.material ===
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
        Math.round(
          canvas.clientWidth,
        ),
      );

    const height =
      Math.max(
        1,
        Math.round(
          canvas.clientHeight,
        ),
      );

    this.renderer
      .setSize(
        width,
        height,
        false,
      );

    (
      this.material
        .uniforms[
          'uResolution'
        ].value as
          THREE.Vector2
    ).set(
      width,
      height,
    );

    this.renderOnce();
  }

  private renderOnce(): void {

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

  private disposeWebGl(): void {

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

    this.scene =
      null;

    this.camera =
      null;

    this.renderer =
      null;
  }
}

function createUniforms():
  Record<
    string,
    THREE.IUniform
  > {

  return {
    uResolution: {
      value:
        new THREE.Vector2(
          640,
          360,
        ),
    },

    uSeed: {
      value:
        new THREE.Vector2(
          0.5,
          0.5,
        ),
    },

    uOrientation: {
      value:
        0,
    },

    uStructureAspect: {
      value:
        1,
    },

    uMacroScale: {
      value:
        1,
    },

    uApparentExtent: {
      value:
        1,
    },

    uShell: {
      value:
        new THREE.Vector4(
          0.43,
          0.075,
          0.9,
          0.4,
        ),
    },

    uLobes: {
      value:
        new THREE.Vector4(
          3,
          0.2,
          0,
          0.4,
        ),
    },

    uPalette: {
      value:
        new THREE.Vector4(
          0.5,
          0.5,
          0.5,
          0.5,
        ),
    },

    uVolumeIdentity: {
      value:
        new THREE.Vector4(
          0,
          1,
          0,
          1,
        ),
    },

    uCentralStarHeat: {
      value:
        0.9,
    },

    uDetail: {
      value:
        0.18,
    },

    uStarVisibility: {
      value:
        0.4,
    },

    uPlanetaryReveal: {
      value:
        1,
    },

    uPhysicalScale: {
      value:
        0.5,
    },

    uDensity: {
      value:
        0.5,
    },

    uEnergy: {
      value:
        0.7,
    },

    uConcentration: {
      value:
        0.6,
    },
  };
}

function supportsWebGl(): boolean {

  if (
    typeof window ===
      'undefined'
  ) {
    return false;
  }

  return (
    typeof WebGLRenderingContext !==
      'undefined' ||
    typeof WebGL2RenderingContext !==
      'undefined'
  );
}

const VERTEX_SHADER =
  /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;

      gl_Position = vec4(
        position.xy,
        0.0,
        1.0
      );
    }
  `;

const FRAGMENT_SHADER =
  /* glsl */ `
    precision highp float;

    uniform vec2 uResolution;
    uniform vec2 uSeed;

    uniform float uOrientation;
    uniform float uStructureAspect;
    uniform float uMacroScale;
    uniform float uApparentExtent;

    uniform vec4 uShell;
    uniform vec4 uLobes;
    uniform vec4 uPalette;
    uniform vec4 uVolumeIdentity;
    uniform float uCentralStarHeat;

    uniform float uDetail;
    uniform float uStarVisibility;
    uniform float uPlanetaryReveal;

    uniform float uPhysicalScale;
    uniform float uDensity;
    uniform float uEnergy;
    uniform float uConcentration;

    varying vec2 vUv;

    const float PI =
      3.141592653589793;

    mat2 rotate2d(
      float angle
    ) {
      float sine =
        sin(
          angle
        );

      float cosine =
        cos(
          angle
        );

      return mat2(
        cosine,
        -sine,
        sine,
        cosine
      );
    }

    vec3 rotateX(
      vec3 point,
      float angle
    ) {
      float sine =
        sin(
          angle
        );

      float cosine =
        cos(
          angle
        );

      return vec3(
        point.x,
        point.y *
          cosine -
          point.z *
          sine,
        point.y *
          sine +
          point.z *
          cosine
      );
    }

    float hash21(
      vec2 point
    ) {
      point =
        fract(
          point *
          vec2(
            123.34,
            456.21
          )
        );

      point +=
        dot(
          point,
          point +
          45.32 +
          uSeed.x *
          9.17 +
          uSeed.y *
          13.71
        );

      return fract(
        point.x *
        point.y
      );
    }

    vec2 hash22(
      vec2 point
    ) {
      return vec2(
        hash21(
          point
        ),
        hash21(
          point +
          vec2(
            17.17,
            43.43
          )
        )
      );
    }

    float valueNoise(
      vec2 point
    ) {
      vec2 integerPart =
        floor(
          point
        );

      vec2 fractionalPart =
        fract(
          point
        );

      fractionalPart =
        fractionalPart *
        fractionalPart *
        (
          3.0 -
          2.0 *
          fractionalPart
        );

      float a =
        hash21(
          integerPart
        );

      float b =
        hash21(
          integerPart +
          vec2(
            1.0,
            0.0
          )
        );

      float c =
        hash21(
          integerPart +
          vec2(
            0.0,
            1.0
          )
        );

      float d =
        hash21(
          integerPart +
          vec2(
            1.0,
            1.0
          )
        );

      return mix(
        mix(
          a,
          b,
          fractionalPart.x
        ),
        mix(
          c,
          d,
          fractionalPart.x
        ),
        fractionalPart.y
      );
    }

    float fbm(
      vec2 point
    ) {
      float value =
        0.0;

      float amplitude =
        0.52;

      mat2 transform =
        mat2(
          0.84,
          -0.54,
          0.54,
          0.84
        );

      for (
        int octave =
          0;
        octave <
          5;
        octave++
      ) {
        value +=
          amplitude *
          valueNoise(
            point
          );

        point =
          transform *
          point *
          2.03 +
          vec2(
            11.7,
            -7.3
          );

        amplitude *=
          0.5;
      }

      return value;
    }

    float noise3(
      vec3 point
    ) {
      float xy =
        fbm(
          point.xy +
          point.z *
          vec2(
            0.73,
            -0.41
          )
        );

      float yz =
        fbm(
          point.yz +
          point.x *
          vec2(
            -0.37,
            0.61
          )
        );

      float zx =
        fbm(
          point.zx +
          point.y *
          vec2(
            0.49,
            0.29
          )
        );

      return (
        xy +
        yz +
        zx
      ) /
        3.0;
    }

    float ridge3(
      vec3 point
    ) {
      return 1.0 -
        abs(
          2.0 *
          noise3(
            point
          ) -
          1.0
        );
    }

    float starLayer(
      vec2 uv,
      float gridScale,
      float threshold,
      float size
    ) {
      vec2 aspectVector =
        vec2(
          max(
            uResolution.x /
            max(
              uResolution.y,
              1.0
            ),
            1.0
          ),
          1.0
        );

      vec2 grid =
        uv *
        aspectVector *
        gridScale;

      vec2 cell =
        floor(
          grid
        );

      vec2 local =
        fract(
          grid
        ) -
        0.5;

      vec2 offset =
        (
          hash22(
            cell +
            uSeed *
            101.0
          ) -
          0.5
        ) *
        0.72;

      float selection =
        smoothstep(
          threshold,
          1.0,
          hash21(
            cell +
            uSeed *
            233.0
          )
        );

      float distanceToStar =
        length(
          local -
          offset
        );

      return (
        1.0 -
        smoothstep(
          0.0,
          size,
          distanceToStar
        )
      ) *
      selection;
    }

    float shellProfile(
      float radius,
      float target,
      float width
    ) {
      float normalized =
        (
          radius -
          target
        ) /
        max(
          width,
          0.001
        );

      return exp(
        -normalized *
        normalized *
        1.55
      );
    }

    vec3 physicalPalette(
      float excitation,
      float chemistry,
      float hotSpot
    ) {
      vec3 deepBlue =
        mix(
          vec3(
            0.012,
            0.08,
            0.34
          ),
          vec3(
            0.018,
            0.30,
            0.64
          ),
          uPalette.x
        );

      vec3 cyan =
        mix(
          vec3(
            0.020,
            0.34,
            0.50
          ),
          vec3(
            0.030,
            0.76,
            0.68
          ),
          uPalette.x
        );

      vec3 green =
        mix(
          vec3(
            0.08,
            0.34,
            0.18
          ),
          vec3(
            0.32,
            0.68,
            0.18
          ),
          uPalette.w
        );

      vec3 magenta =
        mix(
          vec3(
            0.32,
            0.025,
            0.26
          ),
          vec3(
            0.72,
            0.055,
            0.36
          ),
          uPalette.y
        );

      vec3 warm =
        mix(
          vec3(
            0.40,
            0.025,
            0.016
          ),
          vec3(
            0.84,
            0.24,
            0.026
          ),
          uPalette.z
        );

      vec3 cool =
        mix(
          deepBlue,
          cyan,
          smoothstep(
            0.10,
            0.76,
            excitation
          )
        );

      vec3 lowExcitation =
        mix(
          magenta,
          warm,
          smoothstep(
            0.34,
            0.90,
            chemistry
          )
        );

      vec3 mixed =
        mix(
          cool,
          lowExcitation,
          smoothstep(
            0.44,
            0.86,
            chemistry *
            (
              0.72 +
              uPalette.y *
              0.34
            )
          )
        );

      mixed =
        mix(
          mixed,
          green,
          smoothstep(
            0.62,
            0.96,
            chemistry *
            (
              1.0 -
              uPalette.y *
              0.44
            )
          ) *
          0.34
        );

      return mix(
        mixed,
        vec3(
          0.82,
          0.91,
          1.0
        ),
        hotSpot *
        0.40
      );
    }

    vec3 observationPalette(
      vec3 physicalColor,
      float knowledge
    ) {
      float luminance =
        dot(
          physicalColor,
          vec3(
            0.2126,
            0.7152,
            0.0722
          )
        );

      /*
       * SIGNAL/IDENTIFIED already show the same gas volume but with poor
       * chromatic discrimination. The transition is observational, not a
       * replacement of geometry.
       */
      vec3 lowKnowledgeTint =
        vec3(
          luminance *
            0.72,
          luminance *
            0.76,
          luminance *
            0.88
        );

      float chromaReveal =
        smoothstep(
          0.46,
          0.78,
          knowledge
        );

      return mix(
        lowKnowledgeTint,
        physicalColor,
        chromaReveal
      );
    }

    void main() {
      vec2 uv =
        vUv;

      float aspect =
        uResolution.x /
        max(
          uResolution.y,
          1.0
        );

      vec2 screenPoint =
        uv -
        0.5;

      screenPoint.x *=
        aspect;

      vec2 centreOffset =
        (
          uSeed -
          0.5
        ) *
        vec2(
          0.032,
          0.024
        );

      vec2 centredPoint =
        screenPoint -
        centreOffset;

      vec2 rotatedPoint =
        rotate2d(
          uOrientation
        ) *
        centredPoint;

      rotatedPoint.y *=
        uStructureAspect;

      vec2 seedOffset =
        (
          uSeed -
          0.5
        ) *
        14.0;

      float knowledge =
        uDetail;

      float cataloguedReveal =
        smoothstep(
          0.56,
          0.76,
          knowledge
        );

      float confirmedReveal =
        smoothstep(
          0.88,
          0.995,
          knowledge
        );

      /*
       * ------------------------------------------------------------------
       * SAME 3D VOLUME AT ALL FOUR KNOWLEDGE LEVELS
       * ------------------------------------------------------------------
       * No generic-nebula replacement exists here. SIGNAL, IDENTIFIED,
       * CATALOGUED and CONFIRMED all integrate the same seed-fixed ejected
       * volume. Knowledge only controls recoverable contrast, chroma and
       * spatial frequencies.
       */
      float extent =
        uApparentExtent *
        uMacroScale *
        0.80;

      vec2 projectedPoint =
        rotatedPoint /
        max(
          extent,
          0.001
        );

      float shellRadius =
        uShell.x;

      float shellThickness =
        uShell.y;

      float ellipticity =
        uShell.z;

      float bipolarity =
        smoothstep(
          0.34,
          0.90,
          uShell.w
        );

      float lobeCount =
        uLobes.x;

      float lobeStrength =
        uLobes.y;

      float shellPhase =
        uLobes.z;

      float depthStretch =
        uVolumeIdentity.y;

      float asymmetry =
        uVolumeIdentity.z;

      float turbulenceStrength =
        uVolumeIdentity.w;

      vec3 detailedColor =
        vec3(
          0.0
        );

      vec3 coarseColor =
        vec3(
          0.0
        );

      float detailedOpacity =
        0.0;

      float coarseOpacity =
        0.0;

      float projectedFilaments =
        0.0;

      float projectedKnots =
        0.0;

      float projectedFineDust =
        0.0;

      float projectedDensity =
        0.0;

      for (
        int slice =
          0;
        slice <
          9;
        slice++
      ) {
        float sliceIndex =
          float(
            slice
          );

        float z =
          -0.96 +
          sliceIndex *
          0.24;

        float epochOffset =
          (
            sliceIndex -
            4.0
          ) *
          0.010;

        vec3 volumePoint =
          vec3(
            projectedPoint.x /
              max(
                ellipticity,
                0.20
              ),
            projectedPoint.y *
              ellipticity,
            z /
              max(
                depthStretch,
                0.25
              )
          );

        volumePoint =
          rotateX(
            volumePoint,
            uVolumeIdentity.x
          );

        float sideBias =
          1.0 +
          asymmetry *
          (
            volumePoint.y *
            0.76 +
            volumePoint.z *
            0.40
          );

        vec3 coarseNoisePoint =
          volumePoint *
          (
            4.2 +
            turbulenceStrength *
            1.45
          ) +
          vec3(
            seedOffset,
            shellPhase
          );

        float coarseNoise =
          noise3(
            coarseNoisePoint
          );

        float mediumNoise =
          noise3(
            coarseNoisePoint *
            1.96 +
            vec3(
              7.4,
              -11.3,
              5.8
            )
          );

        float fineNoise =
          noise3(
            coarseNoisePoint *
            4.8 +
            vec3(
              -19.6,
              13.1,
              27.4
            )
          );

        float microNoise =
          noise3(
            coarseNoisePoint *
            9.6 +
            vec3(
              31.7,
              -26.4,
              18.9
            )
          );

        float ridge =
          ridge3(
            coarseNoisePoint *
            2.8 +
            vec3(
              17.1,
              -5.2,
              9.6
            )
          );

        float microRidge =
          ridge3(
            coarseNoisePoint *
            7.8 +
            vec3(
              -24.8,
              39.2,
              -11.4
            )
          );

        float radius3 =
          length(
            volumePoint
          );

        float polar =
          atan(
            volumePoint.z,
            volumePoint.x
          );

        float axialDirection =
          abs(
            volumePoint.y
          ) /
          max(
            length(
              volumePoint.xz
            ) +
            abs(
              volumePoint.y
            ),
            0.001
          );

        float lobePattern =
          cos(
            polar *
            lobeCount +
            shellPhase
          );

        float turbulentRadius =
          shellRadius *
          sideBias *
          (
            1.0 +
            (
              coarseNoise -
              0.5
            ) *
            (
              0.20 +
              turbulenceStrength *
              0.09
            ) +
            lobePattern *
            lobeStrength *
            0.052
          ) +
          epochOffset;

        float polarExpansion =
          smoothstep(
            0.40,
            0.86,
            axialDirection
          );

        turbulentRadius *=
          1.0 +
          bipolarity *
          polarExpansion *
          (
            0.42 +
            uShell.w *
            0.38
          );

        float localThickness =
          shellThickness *
          (
            0.70 +
            mediumNoise *
            1.05
          );

        float mainShell =
          shellProfile(
            radius3,
            turbulentRadius,
            localThickness
          );

        /*
         * Broad coarse volume is the same geometry seen by SIGNAL/IDENTIFIED.
         */
        float coarseContinuity =
          mix(
            0.34,
            1.0,
            smoothstep(
              0.20,
              0.78,
              coarseNoise
            )
          );

        float coarseDensity =
          mainShell *
          coarseContinuity;

        /*
         * The resolved field breaks the same shell into arcs, holes and
         * overlapping ejection epochs.
         */
        float detailedContinuity =
          mix(
            0.12,
            1.0,
            smoothstep(
              0.25,
              0.80,
              mediumNoise *
                0.68 +
              coarseNoise *
                0.32
            )
          );

        float innerEpoch =
          shellProfile(
            radius3,
            turbulentRadius *
              (
                0.61 +
                uPalette.w *
                0.075
              ),
            localThickness *
              0.74
          ) *
          (
            0.18 +
            mediumNoise *
            0.48
          );

        float outerEpoch =
          shellProfile(
            radius3,
            turbulentRadius *
              (
                1.30 +
                uPalette.z *
                0.095
              ),
            localThickness *
              1.28
          ) *
          (
            0.10 +
            coarseNoise *
            0.38
          );

        float filament =
          pow(
            clamp(
              ridge,
              0.0,
              1.0
            ),
            6.4
          ) *
          mainShell *
          detailedContinuity;

        float knot =
          smoothstep(
            0.76,
            0.94,
            fineNoise *
              0.66 +
            ridge *
              0.34
          ) *
          mainShell *
          detailedContinuity;

        float microFilament =
          pow(
            clamp(
              microRidge,
              0.0,
              1.0
            ),
            10.0
          ) *
          mainShell *
          detailedContinuity *
          confirmedReveal;

        float fineDust =
          smoothstep(
            0.78,
            0.95,
            microNoise
          ) *
          mainShell *
          confirmedReveal;

        /*
         * Bipolar objects get two preferential expanding lobes and a genuine
         * waist. This is density modulation inside the same 3D volume.
         */
        float lobeBoost =
          mix(
            1.0,
            0.52 +
              polarExpansion *
              1.12,
            bipolarity
          );

        float waist =
          exp(
            -pow(
              volumePoint.y /
              max(
                shellThickness *
                  0.58,
                0.015
              ),
              2.0
            )
          ) *
          exp(
            -pow(
              length(
                volumePoint.xz
              ) /
              max(
                shellRadius *
                  0.92,
                0.05
              ),
              2.0
            )
          ) *
          bipolarity;

        coarseDensity *=
          lobeBoost *
          (
            1.0 -
            waist *
            0.40
          );

        float detailedDensity =
          (
            mainShell *
              detailedContinuity *
              0.60 +
            innerEpoch *
              0.22 +
            outerEpoch *
              0.18 +
            filament *
              0.34 +
            knot *
              0.22 +
            microFilament *
              0.38
          ) *
          lobeBoost *
          (
            1.0 -
            waist *
            0.72
          );

        detailedDensity =
          clamp(
            detailedDensity,
            0.0,
            1.65
          );

        coarseDensity =
          clamp(
            coarseDensity,
            0.0,
            1.25
          );

        float excitation =
          clamp(
            1.0 -
            radius3 /
            max(
              turbulentRadius *
                1.50,
              0.001
            ),
            0.0,
            1.0
          );

        excitation =
          clamp(
            excitation *
              (
                0.66 +
                uEnergy *
                0.50
              ) +
            filament *
              0.18 +
            microFilament *
              0.20,
            0.0,
            1.0
          );

        float chemistry =
          clamp(
            mediumNoise *
              0.42 +
            fineNoise *
              0.26 +
            coarseNoise *
              0.14 +
            (
              1.0 -
              excitation
            ) *
              0.24 +
            uPalette.y *
              0.14,
            0.0,
            1.0
          );

        float hotSpot =
          clamp(
            knot *
              0.64 +
            microFilament *
              0.78 +
            excitation *
              uConcentration *
              0.16,
            0.0,
            1.0
          );

        vec3 physicalColor =
          physicalPalette(
            excitation,
            chemistry,
            hotSpot
          );

        vec3 observedColor =
          observationPalette(
            physicalColor,
            knowledge
          );

        float frontness =
          z *
          0.5 +
          0.5;

        observedColor *=
          mix(
            0.80,
            1.12,
            frontness
          );

        float coarseEmissivity =
          coarseDensity *
          (
            0.24 +
            uEnergy *
              0.22
          );

        float detailedEmissivity =
          detailedDensity *
          (
            0.30 +
            uEnergy *
              0.34 +
            uConcentration *
              0.16
          );

        vec3 coarseObservedColor =
          observationPalette(
            physicalPalette(
              excitation *
                0.72,
              chemistry *
                0.54,
              0.0
            ),
            knowledge
          );

        coarseColor +=
          coarseObservedColor *
          coarseEmissivity *
          (
            1.0 -
            coarseOpacity *
              0.46
          );

        coarseOpacity +=
          clamp(
            coarseEmissivity *
              0.22,
            0.0,
            0.30
          ) *
          (
            1.0 -
            coarseOpacity
          );

        detailedColor +=
          observedColor *
          detailedEmissivity *
          (
            1.0 -
            detailedOpacity *
              0.54
          );

        detailedOpacity +=
          clamp(
            detailedEmissivity *
              0.31,
            0.0,
            0.44
          ) *
          (
            1.0 -
            detailedOpacity
          );

        projectedDensity +=
          detailedDensity /
          9.0;

        projectedFilaments +=
          (
            filament *
              (
                0.34 +
                cataloguedReveal *
                  0.66
              ) +
            microFilament *
              confirmedReveal
          ) /
          9.0;

        projectedKnots +=
          knot /
          9.0;

        projectedFineDust +=
          fineDust /
          9.0;
      }

      /*
       * ------------------------------------------------------------------
       * KNOWLEDGE PROJECTION
       * ------------------------------------------------------------------
       * SIGNAL uses the same volume's low-frequency component.
       * IDENTIFIED adds contrast.
       * CATALOGUED resolves colour + major filaments.
       * CONFIRMED resolves microfilaments, knots, faint halo and dust gaps.
       */
      float resolvedMix =
        smoothstep(
          0.28,
          0.78,
          knowledge
        );

      vec3 volumeColor =
        mix(
          coarseColor,
          detailedColor,
          resolvedMix
        );

      float volumeOpacity =
        mix(
          coarseOpacity,
          detailedOpacity,
          resolvedMix
        );

      float earlyVisibility =
        mix(
          0.34,
          0.70,
          smoothstep(
            0.16,
            0.46,
            knowledge
          )
        );

      float lateVisibility =
        mix(
          earlyVisibility,
          1.0,
          cataloguedReveal
        );

      volumeColor *=
        lateVisibility;

      /*
       * Background star field.
       */
      vec3 background =
        mix(
          vec3(
            0.0014,
            0.0028,
            0.0070
          ),
          vec3(
            0.0060,
            0.0100,
            0.0200
          ),
          1.0 -
          clamp(
            length(
              screenPoint
            ),
            0.0,
            1.0
          )
        );

      float backgroundStars =
        (
          starLayer(
            uv,
            63.0,
            0.978,
            0.105
          ) +
          starLayer(
            uv +
            vec2(
              0.016,
              -0.023
            ),
            103.0,
            0.988,
            0.076
          ) *
          0.64
        ) *
        uStarVisibility;

      vec3 starFieldColor =
        mix(
          vec3(
            0.72,
            0.82,
            0.98
          ),
          vec3(
            1.0,
            0.86,
            0.68
          ),
          hash21(
            floor(
              uv *
              319.0
            ) +
            uSeed *
              47.0
          ) *
          0.34
        );

      vec3 color =
        background +
        starFieldColor *
          backgroundStars;

      /*
       * Thin gas softly veils stars behind it but never behaves like an opaque
       * painted surface.
       */
      color *=
        1.0 -
        clamp(
          volumeOpacity *
            0.16 *
            uPlanetaryReveal,
          0.0,
          0.18
        );

      color +=
        volumeColor *
        uPlanetaryReveal *
        (
          0.32 +
          uPhysicalScale *
            0.07
        );

      /*
       * CATALOGUED gains obvious major filaments. CONFIRMED then adds a second
       * spatial-frequency tier and brighter local knots so the two stages are
       * visually distinguishable without changing macro geometry.
       */
      vec3 majorFilamentColor =
        observationPalette(
          physicalPalette(
            0.72,
            0.44 +
              uPalette.z *
                0.24,
            0.56
          ),
          knowledge
        );

      color +=
        majorFilamentColor *
        projectedFilaments *
        uPlanetaryReveal *
        (
          cataloguedReveal *
            0.20 +
          confirmedReveal *
            0.24
        );

      vec3 knotColor =
        physicalPalette(
          0.88,
          0.62,
          1.0
        );

      color +=
        knotColor *
        projectedKnots *
        uPlanetaryReveal *
        (
          cataloguedReveal *
            0.10 +
          confirmedReveal *
            0.36
        );

      /*
       * Confirmed-only dust gaps carve fine dark channels into the emissive
       * gas. This increases local contrast instead of globally brightening the
       * whole object.
       */
      color *=
        1.0 -
        clamp(
          projectedFineDust *
            confirmedReveal *
            0.24,
          0.0,
          0.22
        );

      /*
       * Very faint extended halo, significantly more recoverable only at
       * CONFIRMED.
       */
      vec2 haloPoint =
        rotatedPoint /
        max(
          uApparentExtent *
            uMacroScale,
          0.001
        );

      float haloRadius =
        length(
          haloPoint
        );

      float haloNoise =
        fbm(
          haloPoint *
            3.4 +
          seedOffset *
            0.22
        );

      float extendedHalo =
        exp(
          -pow(
            haloRadius /
            (
              0.70 +
              uLobes.w *
                0.18
            ),
            2.4
          )
        ) *
        smoothstep(
          0.22,
          0.78,
          haloNoise
        );

      vec3 haloColor =
        observationPalette(
          physicalPalette(
            0.18,
            0.72,
            0.0
          ),
          knowledge
        );

      color +=
        haloColor *
        extendedHalo *
        uPlanetaryReveal *
        (
          0.004 +
          cataloguedReveal *
            0.008 +
          confirmedReveal *
            0.030
        );

      /*
       * Central white dwarf is in the same place at all stages, but early
       * observations barely isolate it from the surrounding glow.
       */
      float centralDistance =
        length(
          screenPoint -
          centreOffset
        );

      float centralCore =
        1.0 -
        smoothstep(
          0.0,
          0.0035,
          centralDistance
        );

      float centralHalo =
        exp(
          -centralDistance *
          centralDistance *
          3300.0
        );

      vec3 centralStarColor =
        mix(
          vec3(
            0.70,
            0.84,
            1.0
          ),
          vec3(
            0.985,
            0.997,
            1.0
          ),
          uCentralStarHeat
        );

      float centralIsolation =
        mix(
          0.16,
          1.0,
          smoothstep(
            0.32,
            0.82,
            knowledge
          )
        );

      color +=
        observationPalette(
          centralStarColor,
          knowledge
        ) *
        centralHalo *
        uPlanetaryReveal *
        (
          0.045 +
          uEnergy *
            0.085
        ) *
        centralIsolation;

      color +=
        vec3(
          1.0,
          0.995,
          0.985
        ) *
        centralCore *
        uPlanetaryReveal *
        (
          0.14 +
          centralIsolation *
            0.58
        );

      /*
       * CONFIRMED local dynamic range: small high-excitation structures are
       * allowed to peak without raising the entire card exposure.
       */
      float localHighlight =
        clamp(
          projectedFilaments *
            0.72 +
          projectedKnots *
            1.10,
          0.0,
          1.0
        );

      color +=
        vec3(
          0.58,
          0.74,
          0.92
        ) *
        pow(
          localHighlight,
          2.2
        ) *
        confirmedReveal *
        uPlanetaryReveal *
        0.18;

      /*
       * Knowledge-dependent chroma. SIGNAL is nearly monochromatic,
       * IDENTIFIED remains restrained, CATALOGUED reveals physical colour,
       * CONFIRMED adds only a modest extra saturation.
       */
      float luminance =
        dot(
          color,
          vec3(
            0.2126,
            0.7152,
            0.0722
          )
        );

      float saturation =
        mix(
          0.34,
          1.0,
          smoothstep(
            0.36,
            0.78,
            knowledge
          )
        ) +
        confirmedReveal *
          0.035;

      color =
        max(
          vec3(
            luminance
          ) +
          (
            color -
            vec3(
              luminance
            )
          ) *
          saturation,
          vec3(
            0.0
          )
        );

      /*
       * SIGNAL/IDENTIFIED are slightly compressed observationally, not
       * spatially replaced. This behaves like poorer dynamic range rather than
       * a different object.
       */
      float observationCompression =
        mix(
          0.72,
          1.0,
          smoothstep(
            0.30,
            0.76,
            knowledge
          )
        );

      color *=
        observationCompression;

      float vignette =
        1.0 -
        smoothstep(
          0.30,
          0.84,
          length(
            vUv -
            0.5
          )
        ) *
        0.32;

      color *=
        vignette;

      float grain =
        (
          hash21(
            gl_FragCoord.xy +
            uSeed *
              997.0
          ) -
          0.5
        ) /
        255.0;

      color +=
        grain;

      color =
        max(
          color,
          vec3(
            0.0
          )
        );

      /*
       * Preserve bright knots and faint halo in the same frame.
       */
      color =
        color /
        (
          color +
          vec3(
            0.78
          )
        );

      color =
        pow(
          color,
          vec3(
            1.0 /
            2.2
          )
        );

      gl_FragColor =
        vec4(
          color,
          1.0
        );
    }
  `;
