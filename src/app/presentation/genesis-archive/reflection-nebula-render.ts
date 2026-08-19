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
  ReflectionNebulaRenderModelBuilder,
} from './reflection-nebula-render-model';

@Component({
  selector:
    'app-reflection-nebula-render',

  standalone:
    true,

  templateUrl:
    './reflection-nebula-render.html',

  styleUrl:
    './reflection-nebula-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ReflectionNebulaRender
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
        1.08;

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
      ReflectionNebulaRenderModelBuilder
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
        'uReflectionIdentity'
      ].value as
        THREE.Vector4
    ).set(
      model.illuminatorBlueMix,
      model.illuminatorWarmMix,
      model.illuminatorVioletMix,
      model.illuminatorBalance,
    );

    uniforms[
      'uDustScatteringStrength'
    ].value =
      model.dustScatteringStrength;

    uniforms[
      'uDetail'
    ].value =
      model.detailFactor;

    uniforms[
      'uStarVisibility'
    ].value =
      model.starVisibility;

    uniforms[
      'uReflectionReveal'
    ].value =
      model.reflectionReveal;

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

    uReflectionIdentity: {
      value:
        new THREE.Vector4(
          0.5,
          0.5,
          0.5,
          0.5,
        ),
    },

    uDustScatteringStrength: {
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

    uReflectionReveal: {
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
        0.5,
    },

    uConcentration: {
      value:
        0.45,
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

    uniform vec4 uReflectionIdentity;
    uniform float uDustScatteringStrength;

    uniform float uDetail;
    uniform float uStarVisibility;
    uniform float uReflectionReveal;

    uniform float uPhysicalScale;
    uniform float uDensity;
    uniform float uEnergy;
    uniform float uConcentration;

    varying vec2 vUv;

    mat2 rotate2d(
      float angle
    ) {
      float sine =
        sin(angle);

      float cosine =
        cos(angle);

      return mat2(
        cosine,
        -sine,
        sine,
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

    float starLayer(
      vec2 uv,
      float gridScale,
      float threshold,
      float size
    ) {
      vec2 aspect =
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
        aspect *
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

      float pointStar =
        (
          1.0 -
          smoothstep(
            0.0,
            size,
            distanceToStar
          )
        ) *
        selection;

      float diffraction =
        (
          1.0 -
          smoothstep(
            0.0,
            size *
            0.22,
            abs(
              local.x -
              offset.x
            )
          )
        ) *
        (
          1.0 -
          smoothstep(
            0.0,
            size *
            2.8,
            abs(
              local.y -
              offset.y
            )
          )
        ) *
        selection *
        0.18;

      return max(
        pointStar,
        diffraction
      );
    }

    vec2 sourcePosition(
      float index
    ) {
      vec2 randomPoint =
        hash22(
          uSeed *
          (
            73.0 +
            index *
            41.0
          ) +
          vec2(
            19.0 +
            index *
            7.0,
            -13.0 +
            index *
            11.0
          )
        );

      return vec2(
        0.5,
        0.5
      ) +
      (
        randomPoint -
        0.5
      ) *
      vec2(
        0.52,
        0.40
      );
    }

    float sourceDistance(
      vec2 uv,
      vec2 source
    ) {
      vec2 delta =
        uv -
        source;

      delta.x *=
        uResolution.x /
        max(
          uResolution.y,
          1.0
        );

      return length(
        delta
      );
    }

    float sourceHalo(
      float distanceToSource,
      float scale
    ) {
      return exp(
        -distanceToSource *
        distanceToSource *
        scale
      );
    }

    float sourceCore(
      float distanceToSource,
      float radius
    ) {
      return 1.0 -
        smoothstep(
          0.0,
          radius,
          distanceToSource
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

      vec2 point =
        uv -
        0.5;

      point.x *=
        aspect;

      point =
        rotate2d(
          uOrientation
        ) *
        point;

      point.y *=
        uStructureAspect;

      vec2 seedOffset =
        (
          uSeed -
          0.5
        ) *
        14.0;

      /*
       * FROZEN NEBULAR MACROSTRUCTURE
       * -----------------------------
       * Keep this equivalent to the emission renderer so SIGNAL / IDENTIFIED
       * and later REFLECTION observations remain the same physical object.
       */
      vec2 structuralPoint =
        point *
        (
          2.05 /
          (
            uMacroScale *
            uApparentExtent
          )
        );

      float warpA =
        fbm(
          structuralPoint *
          1.18 +
          seedOffset
        );

      float warpB =
        fbm(
          structuralPoint *
          1.18 +
          seedOffset +
          vec2(
            5.27,
            -8.91
          )
        );

      vec2 warpedPoint =
        structuralPoint +
        (
          vec2(
            warpA,
            warpB
          ) -
          0.5
        ) *
        0.78;

      float macroField =
        fbm(
          warpedPoint *
          0.94 +
          vec2(
            2.4,
            -1.7
          )
        );

      float secondaryField =
        fbm(
          warpedPoint *
          1.62 +
          vec2(
            -6.8,
            4.1
          )
        );

      float ridgeField =
        1.0 -
        abs(
          2.0 *
          fbm(
            warpedPoint *
            2.12 +
            vec2(
              9.6,
              3.4
            )
          ) -
          1.0
        );

      float fineField =
        fbm(
          warpedPoint *
          4.35 +
          vec2(
            -11.2,
            7.8
          )
        );

      float radialDistance =
        length(
          point /
          (
            vec2(
              0.79,
              0.52
            ) *
            uApparentExtent
          )
        );

      float irregularEdge =
        (
          secondaryField -
          0.5
        ) *
        0.28;

      float envelope =
        1.0 -
        smoothstep(
          0.46 +
          irregularEdge,
          1.05 +
          irregularEdge,
          radialDistance
        );

      float bodyField =
        macroField *
        0.72 +
        ridgeField *
        0.28;

      float body =
        smoothstep(
          0.39,
          0.67,
          bodyField
        ) *
        envelope;

      float revealedFine =
        (
          fineField -
          0.5
        ) *
        uDetail *
        0.52;

      float filaments =
        pow(
          clamp(
            ridgeField,
            0.0,
            1.0
          ),
          2.8
        ) *
        envelope *
        uDetail;

      float cavityField =
        fbm(
          warpedPoint *
          2.5 +
          vec2(
            14.3,
            -4.7
          )
        );

      float cavities =
        smoothstep(
          0.64,
          0.84,
          cavityField
        ) *
        envelope *
        uDetail;

      float dustDensity =
        clamp(
          body *
          (
            0.82 +
            revealedFine
          ) +
          filaments *
          0.30,
          0.0,
          1.0
        );

      dustDensity *=
        1.0 -
        cavities *
        0.62;

      float dustField =
        1.0 -
        abs(
          2.0 *
          fbm(
            warpedPoint *
            3.08 +
            vec2(
              -2.7,
              17.4
            )
          ) -
          1.0
        );

      float dustLane =
        smoothstep(
          0.72,
          0.92,
          dustField
        ) *
        envelope *
        (
          0.24 +
          uDetail *
          0.76
        ) *
        (
          0.35 +
          uDensity *
          0.42
        );

      /*
       * Deep-space background and fixed stellar field.
       */
      vec3 background =
        mix(
          vec3(
            0.002,
            0.004,
            0.010
          ),
          vec3(
            0.008,
            0.013,
            0.025
          ),
          1.0 -
          radialDistance
        );

      float distantStars =
        starLayer(
          uv,
          58.0,
          0.982,
          0.115
        );

      float fineStars =
        starLayer(
          uv +
          vec2(
            0.013,
            -0.021
          ),
          93.0,
          0.991,
          0.09
        );

      float extinction =
        clamp(
          dustDensity *
          0.20 +
          dustLane *
          0.82,
          0.0,
          0.94
        );

      float stars =
        (
          distantStars +
          fineStars *
          0.62
        ) *
        uStarVisibility *
        (
          1.0 -
          extinction
        );

      vec3 backgroundStarColor =
        mix(
          vec3(
            0.72,
            0.83,
            1.0
          ),
          vec3(
            1.0,
            0.91,
            0.77
          ),
          hash21(
            floor(
              uv *
              317.0
            ) +
            uSeed *
            41.0
          )
        );

      /*
       * ILLUMINATING STARS
       * ------------------
       * Their positions and colours are stable for one renderSeed. The dust
       * does not emit: every bright reflection term below is multiplied by
       * illumination arriving from these stellar sources.
       */
      vec2 source0 =
        sourcePosition(
          0.0
        );

      vec2 source1 =
        sourcePosition(
          1.0
        );

      vec2 source2 =
        sourcePosition(
          2.0
        );

      float d0 =
        sourceDistance(
          uv,
          source0
        );

      float d1 =
        sourceDistance(
          uv,
          source1
        );

      float d2 =
        sourceDistance(
          uv,
          source2
        );

      vec3 blueWhite =
        mix(
          vec3(
            0.42,
            0.67,
            1.0
          ),
          vec3(
            0.79,
            0.91,
            1.0
          ),
          uReflectionIdentity.x
        );

      vec3 warmWhite =
        mix(
          vec3(
            1.0,
            0.62,
            0.30
          ),
          vec3(
            1.0,
            0.91,
            0.72
          ),
          uReflectionIdentity.y
        );

      vec3 violetWhite =
        mix(
          vec3(
            0.56,
            0.48,
            1.0
          ),
          vec3(
            0.71,
            0.82,
            1.0
          ),
          uReflectionIdentity.z
        );

      /*
       * Every sample has a dominant source but may carry secondary warm or
       * violet stars. That is what creates local colour diversity.
       */
      float source0Strength =
        mix(
          0.78,
          1.24,
          uReflectionIdentity.w
        );

      float source1Strength =
        mix(
          1.16,
          0.64,
          uReflectionIdentity.w
        );

      float source2Strength =
        0.58 +
        uReflectionIdentity.z *
        0.52;

      float light0 =
        sourceHalo(
          d0,
          9.0
        ) *
        source0Strength;

      float light1 =
        sourceHalo(
          d1,
          10.5
        ) *
        source1Strength;

      float light2 =
        sourceHalo(
          d2,
          12.0
        ) *
        source2Strength;

      float totalLight =
        light0 +
        light1 +
        light2;

      vec3 localStarlight =
        (
          blueWhite *
          light0 +
          warmWhite *
          light1 +
          violetWhite *
          light2
        ) /
        max(
          totalLight,
          0.001
        );

      /*
       * Shorter wavelengths scatter more efficiently in dust. Keep that blue
       * preference while preserving a visible contribution from the actual
       * illuminating star colour.
       */
      vec3 blueScatteringBias =
        vec3(
          0.67,
          0.88,
          1.18
        );

      vec3 scatteredColour =
        localStarlight *
        mix(
          vec3(
            1.0
          ),
          blueScatteringBias,
          0.48 +
          uReflectionIdentity.x *
          0.24
        );

      float illumination =
        clamp(
          totalLight *
          0.84,
          0.0,
          1.45
        );

      float knowledgeVisibility =
        0.42 +
        uDetail *
        0.58;

      float dustAlbedo =
        uDustScatteringStrength *
        (
          0.82 +
          uPhysicalScale *
          0.10
        );

      float reflectedLight =
        dustDensity *
        illumination *
        dustAlbedo *
        knowledgeVisibility *
        uReflectionReveal;

      /*
       * Reflection nebulosity is preferentially brighter on the star-facing
       * edges of already-existing ridges, creating illuminated dust fronts.
       */
      float illuminatedRidges =
        filaments *
        illumination *
        (
          0.16 +
          uDetail *
          0.44
        ) *
        uReflectionReveal;

      float softDust =
        pow(
          max(
            dustDensity,
            0.0
          ),
          0.72
        );

      float brightDust =
        pow(
          max(
            dustDensity,
            0.0
          ),
          1.78
        );

      vec3 color =
        background;

      /*
       * Before subtype authorization this branch is effectively dark; generic
       * SIGNAL / IDENTIFIED are handled by the frozen generic nebula renderer.
       */
      color +=
        scatteredColour *
        softDust *
        reflectedLight *
        0.36;

      color +=
        scatteredColour *
        brightDust *
        reflectedLight *
        0.68;

      color +=
        mix(
          scatteredColour,
          blueWhite,
          0.28
        ) *
        illuminatedRidges *
        0.34;

      /*
       * Dust lanes remove both background starlight and reflected light.
       */
      color *=
        1.0 -
        clamp(
          dustLane *
          (
            0.42 +
            uDetail *
            0.26
          ),
          0.0,
          0.78
        );

      color +=
        backgroundStarColor *
        stars *
        (
          0.78 +
          uDetail *
          0.38
        );

      /*
       * The three nearby stars remain literal light sources in the image.
       * Their cores are white-hot but their halos retain source colour.
       */
      float core0 =
        sourceCore(
          d0,
          0.007
        );

      float core1 =
        sourceCore(
          d1,
          0.006
        );

      float core2 =
        sourceCore(
          d2,
          0.005
        );

      float halo0 =
        sourceHalo(
          d0,
          180.0
        );

      float halo1 =
        sourceHalo(
          d1,
          210.0
        );

      float halo2 =
        sourceHalo(
          d2,
          230.0
        );

      float illuminatorVisibility =
        0.42 +
        uDetail *
        0.58;

      color +=
        blueWhite *
        halo0 *
        0.42 *
        illuminatorVisibility;

      color +=
        warmWhite *
        halo1 *
        0.34 *
        illuminatorVisibility;

      color +=
        violetWhite *
        halo2 *
        0.30 *
        illuminatorVisibility;

      color +=
        vec3(
          1.0,
          0.98,
          0.95
        ) *
        (
          core0 *
          1.20 +
          core1 *
          1.04 +
          core2 *
          0.94
        ) *
        illuminatorVisibility;

      /*
       * CONFIRMED reveals fine wisps around the same illuminated regions.
       */
      float confirmedReveal =
        smoothstep(
          0.82,
          0.98,
          uDetail
        );

      float microField =
        fbm(
          warpedPoint *
          11.8 +
          vec2(
            33.2,
            -27.4
          )
        );

      float microRidge =
        pow(
          clamp(
            1.0 -
            abs(
              2.0 *
              microField -
              1.0
            ),
            0.0,
            1.0
          ),
          6.4
        );

      color +=
        scatteredColour *
        microRidge *
        dustDensity *
        illumination *
        confirmedReveal *
        uReflectionReveal *
        0.24;

      float confirmedDust =
        smoothstep(
          0.80,
          0.95,
          1.0 -
          abs(
            2.0 *
            fbm(
              warpedPoint *
              13.7 +
              vec2(
                -29.1,
                36.2
              )
            ) -
            1.0
          )
        ) *
        dustDensity *
        envelope *
        confirmedReveal;

      color *=
        1.0 -
        confirmedDust *
        0.14;

      /*
       * Preserve saturated source-derived colours instead of washing reflected
       * dust to white.
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
        1.0 +
        uReflectionReveal *
        (
          0.16 +
          uReflectionIdentity.w *
          0.08
        );

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

      float vignette =
        1.0 -
        smoothstep(
          0.28,
          0.82,
          length(
            vUv -
            0.5
          )
        ) *
        0.42;

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

      color =
        color /
        (
          color +
          vec3(
            0.74
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
