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
  DarkNebulaRenderModelBuilder,
} from './dark-nebula-render-model';

@Component({
  selector:
    'app-dark-nebula-render',

  standalone:
    true,

  templateUrl:
    './dark-nebula-render.html',

  styleUrl:
    './dark-nebula-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DarkNebulaRender
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
        0.94;

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
      DarkNebulaRenderModelBuilder
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
        'uDarkIdentity'
      ].value as
        THREE.Vector4
    ).set(
      model.opacityBias,
      model.fragmentation,
      model.backgroundWarmth,
      model.backgroundBlueBias,
    );

    uniforms[
      'uEdgeIllumination'
    ].value =
      model.edgeIllumination;

    uniforms[
      'uDetail'
    ].value =
      model.detailFactor;

    uniforms[
      'uStarVisibility'
    ].value =
      model.starVisibility;

    uniforms[
      'uDarkReveal'
    ].value =
      model.darkReveal;

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

    uDarkIdentity: {
      value:
        new THREE.Vector4(
          0.9,
          0.5,
          0.5,
          0.5,
        ),
    },

    uEdgeIllumination: {
      value:
        0.2,
    },

    uDetail: {
      value:
        0.18,
    },

    uStarVisibility: {
      value:
        0.46,
    },

    uDarkReveal: {
      value:
        1,
    },

    uPhysicalScale: {
      value:
        0.5,
    },

    uDensity: {
      value:
        0.7,
    },

    uEnergy: {
      value:
        0.2,
    },

    uConcentration: {
      value:
        0.1,
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

    uniform vec4 uDarkIdentity;
    uniform float uEdgeIllumination;

    uniform float uDetail;
    uniform float uStarVisibility;
    uniform float uDarkReveal;

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
       * FROZEN MACROSTRUCTURE
       * ---------------------
       * Same field as the already-validated generic nebula renderer.
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
          mix(
            0.44,
            0.34,
            uDarkIdentity.y
          ),
          mix(
            0.70,
            0.60,
            uDarkIdentity.y
          ),
          bodyField
        ) *
        envelope;

      float revealedFine =
        (
          fineField -
          0.5
        ) *
        uDetail *
        0.48;

      float denseRidges =
        pow(
          clamp(
            ridgeField,
            0.0,
            1.0
          ),
          2.6
        ) *
        envelope *
        (
          0.25 +
          uDetail *
          0.75
        );

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
          0.66,
          0.86,
          cavityField
        ) *
        envelope *
        uDetail;

      float dustDensity =
        clamp(
          body *
          (
            0.88 +
            revealedFine
          ) +
          denseRidges *
          0.34,
          0.0,
          1.0
        );

      dustDensity *=
        1.0 -
        cavities *
        mix(
          0.24,
          0.58,
          uDarkIdentity.y
        );

      /*
       * Fragmentation creates globules, pillars and broken lanes without
       * changing the underlying object's macro footprint.
       */
      float fragmentField =
        fbm(
          warpedPoint *
          3.34 +
          vec2(
            -16.7,
            19.2
          )
        );

      float fragmentationMask =
        smoothstep(
          mix(
            0.84,
            0.66,
            uDarkIdentity.y
          ),
          0.94,
          fragmentField
        ) *
        envelope;

      dustDensity *=
        1.0 -
        fragmentationMask *
        uDarkIdentity.y *
        0.54;

      float laneField =
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

      float darkLane =
        smoothstep(
          0.68,
          0.91,
          laneField
        ) *
        envelope *
        (
          0.30 +
          uDetail *
          0.70
        );

      dustDensity =
        clamp(
          dustDensity +
          darkLane *
          0.24,
          0.0,
          1.0
        );

      /*
       * STAR-RICH BACKGROUND
       * --------------------
       * A dark nebula is visible primarily because it obscures what is behind
       * it. Generate a richer stellar background than the emission/reflection
       * renderers and let the cloud remove it.
       */
      vec3 coolBackground =
        mix(
          vec3(
            0.002,
            0.003,
            0.008
          ),
          vec3(
            0.009,
            0.013,
            0.024
          ),
          uDarkIdentity.w
        );

      vec3 warmBackground =
        mix(
          vec3(
            0.010,
            0.004,
            0.004
          ),
          vec3(
            0.024,
            0.011,
            0.007
          ),
          uDarkIdentity.z
        );

      float backgroundDustColour =
        fbm(
          (
            uv -
            0.5
          ) *
          3.1 +
          seedOffset *
          0.16
        );

      vec3 background =
        mix(
          coolBackground,
          warmBackground,
          uDarkIdentity.z *
          0.58 *
          backgroundDustColour
        );

      float distantStars =
        starLayer(
          uv,
          62.0,
          0.966,
          0.112
        );

      float denseStars =
        starLayer(
          uv +
          vec2(
            0.011,
            -0.017
          ),
          98.0,
          0.978,
          0.082
        );

      float tinyStars =
        starLayer(
          uv +
          vec2(
            -0.019,
            0.026
          ),
          144.0,
          0.987,
          0.064
        );

      float starColourMix =
        hash21(
          floor(
            uv *
            337.0
          ) +
          uSeed *
          43.0
        );

      vec3 blueStar =
        mix(
          vec3(
            0.68,
            0.76,
            0.92
          ),
          vec3(
            0.86,
            0.91,
            1.0
          ),
          uDarkIdentity.w
        );

      vec3 amberStar =
        mix(
          vec3(
            0.96,
            0.69,
            0.44
          ),
          vec3(
            1.0,
            0.90,
            0.76
          ),
          uDarkIdentity.z
        );

      vec3 starColor =
        mix(
          blueStar,
          amberStar,
          starColourMix *
          (
            0.32 +
            uDarkIdentity.z *
            0.44
          )
        );

      float backgroundStars =
        (
          distantStars +
          denseStars *
          0.72 +
          tinyStars *
          0.42
        ) *
        uStarVisibility;

      vec3 color =
        background;

      color +=
        starColor *
        backgroundStars *
        (
          0.82 +
          uDetail *
          0.30
        );

      /*
       * EXTINCTION
       * ----------
       * DARK contributes no positive emission term. It only removes light and
       * reveals the cloud through the missing background.
       */
      float opticalDepth =
        dustDensity *
        (
          uDarkIdentity.x +
          uDensity *
          0.30 +
          uPhysicalScale *
          0.08
        ) *
        uDarkReveal;

      float transmission =
        exp(
          -opticalDepth *
          6.4
        );

      /*
       * Very dense regions approach black but retain tiny variations so the
       * silhouette is not a flat cut-out.
       */
      float internalTexture =
        fbm(
          warpedPoint *
          5.2 +
          vec2(
            23.1,
            -31.7
          )
        );

      vec3 cloudBlackBase =
        mix(
          vec3(
            0.0008,
            0.0010,
            0.0013
          ),
          vec3(
            0.0060,
            0.0046,
            0.0040
          ),
          uDarkIdentity.z *
          0.42
        );

      vec3 cloudBlackTexture =
        mix(
          vec3(
            0.0030,
            0.0032,
            0.0036
          ),
          vec3(
            0.0100,
            0.0072,
            0.0056
          ),
          uDarkIdentity.z *
          0.54
        );

      vec3 cloudBlack =
        mix(
          cloudBlackBase,
          cloudBlackTexture,
          internalTexture *
          (
            0.12 +
            uDetail *
            0.18
          )
        );

      color =
        mix(
          color,
          cloudBlack,
          clamp(
            (
              1.0 -
              transmission
            ) *
            uDarkReveal,
            0.0,
            0.997
          )
        );

      /*
       * The cloud is identified by extinction, not by a luminous outline.
       * Only a very faint neutral/brown edge response is allowed where
       * external background radiation grazes lower-opacity dust.
       */
      float edge =
        smoothstep(
          0.08,
          0.26,
          dustDensity
        ) *
        (
          1.0 -
          smoothstep(
            0.28,
            0.58,
            dustDensity
          )
        );

      vec3 rimNeutral =
        mix(
          vec3(
            0.018,
            0.020,
            0.023
          ),
          vec3(
            0.038,
            0.025,
            0.018
          ),
          uDarkIdentity.z
        );

      color +=
        rimNeutral *
        edge *
        uEdgeIllumination *
        0.12 *
        (
          0.35 +
          uDetail *
          0.65
        ) *
        uDarkReveal;

      /*
       * CONFIRMED reveals fine opaque tendrils and globules at the exact same
       * seed-fixed locations.
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
          13.4 +
          vec2(
            -39.6,
            28.3
          )
        );

      float microDust =
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
          6.2
        ) *
        envelope *
        dustDensity *
        confirmedReveal *
        uDarkReveal;

      color *=
        1.0 -
        microDust *
        0.46;

      float confirmedOpaqueKnots =
        smoothstep(
          0.70,
          0.93,
          fbm(
            warpedPoint *
            9.6 +
            vec2(
              41.3,
              -18.8
            )
          )
        ) *
        dustDensity *
        confirmedReveal *
        uDarkReveal;

      color *=
        1.0 -
        confirmedOpaqueKnots *
        0.22;

      /*
       * Tiny foreground stars are intentionally sparse. Most stars are behind
       * the cloud, which is what makes the extinction visually legible.
       */
      float foregroundStars =
        starLayer(
          uv +
          vec2(
            0.037,
            -0.029
          ),
          74.0,
          0.997,
          0.078
        ) *
        (
          0.34 +
          uDetail *
          0.66
        );

      color +=
        vec3(
          0.78,
          0.88,
          1.0
        ) *
        foregroundStars *
        0.42;

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
        0.36;

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
            0.88
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
