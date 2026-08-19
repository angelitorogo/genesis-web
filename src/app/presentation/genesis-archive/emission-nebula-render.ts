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
  EmissionNebulaRenderModelBuilder,
} from './emission-nebula-render-model';

@Component({
  selector:
    'app-emission-nebula-render',

  standalone:
    true,

  templateUrl:
    './emission-nebula-render.html',

  styleUrl:
    './emission-nebula-render.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class EmissionNebulaRender
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
        1.12;

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
      EmissionNebulaRenderModelBuilder
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
        'uPaletteSignature'
      ].value as
        THREE.Vector4
    ).set(
      model.paletteWarmShift,
      model.paletteCoolShift,
      model.paletteMagentaShift,
      model.paletteWarmCoolBalance,
    );

    uniforms[
      'uDetail'
    ].value =
      model.detailFactor;

    uniforms[
      'uStarVisibility'
    ].value =
      model.starVisibility;

    uniforms[
      'uEmissionReveal'
    ].value =
      model.emissionReveal;

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
      'uIonization'
    ].value =
      model.ionization;

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

    uPaletteSignature: {
      value:
        new THREE.Vector4(
          0.5,
          0.5,
          0.5,
          0.5,
        ),
    },

    uDetail: {
      value:
        0.18,
    },

    uStarVisibility: {
      value:
        0.34,
    },

    uEmissionReveal: {
      value:
        0,
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

    uIonization: {
      value:
        0.5,
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
    uniform vec4 uPaletteSignature;

    uniform float uDetail;
    uniform float uStarVisibility;
    uniform float uEmissionReveal;

    uniform float uPhysicalScale;
    uniform float uDensity;
    uniform float uEnergy;
    uniform float uIonization;

    varying vec2 vUv;

    const float PI =
      3.141592653589793;

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
      float first =
        hash21(
          point
        );

      float second =
        hash21(
          point +
          vec2(
            17.17,
            43.43
          )
        );

      return vec2(
        first,
        second
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
       * STRUCTURAL FIELD
       * ----------------
       * These coordinates depend only on renderSeed-derived uniforms.
       * DiscoveryState never moves this field.
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

      /*
       * Knowledge reveals fine structure but never changes the macro field.
       */
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

      float gasDensity =
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

      gasDensity *=
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

      gasDensity *=
        1.0 -
        dustLane *
        0.56;

      /*
       * Background and stars are generated from the same seed in every phase.
       * Knowledge changes visibility only.
       */
      vec3 background =
        mix(
          vec3(
            0.003,
            0.005,
            0.012
          ),
          vec3(
            0.009,
            0.014,
            0.026
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
          gasDensity *
          0.28 +
          dustLane *
          0.78,
          0.0,
          0.92
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

      vec3 starColor =
        mix(
          vec3(
            0.76,
            0.84,
            1.0
          ),
          vec3(
            1.0,
            0.93,
            0.82
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
       * CHROMATIC FIELD
       * ---------------
       * All colour territories depend on the SAME structural coordinates and
       * seed at every knowledge level. SIGNAL / IDENTIFIED see a muted
       * projection of those exact territories; once EMISSION is authorized
       * they gain physically suggestive H-alpha / high-excitation colour.
       *
       * No DiscoveryState-dependent coordinate enters these fields.
       */
      float excitation =
        fbm(
          warpedPoint *
          1.78 +
          vec2(
            21.2,
            -13.6
          )
        );

      float chromaticFieldA =
        fbm(
          warpedPoint *
          1.16 +
          vec2(
            -18.4,
            6.7
          )
        );

      float chromaticFieldB =
        fbm(
          warpedPoint *
          1.94 +
          vec2(
            7.9,
            18.6
          )
        );

      float chromaticFieldC =
        fbm(
          warpedPoint *
          2.73 +
          vec2(
            -3.2,
            -21.4
          )
        );

      float warmDominance =
        mix(
          0.78,
          1.24,
          uPaletteSignature.w
        );

      float coolDominance =
        mix(
          1.24,
          0.78,
          uPaletteSignature.w
        );

      float warmTerritory =
        clamp(
          smoothstep(
            0.34,
            0.78,
            chromaticFieldA *
            0.72 +
            macroField *
            0.28
          ) *
          warmDominance,
          0.0,
          1.0
        );

      float cyanTerritory =
        clamp(
          smoothstep(
            0.42,
            0.82,
            chromaticFieldB *
            0.68 +
            excitation *
            0.32
          ) *
          coolDominance,
          0.0,
          1.0
        );

      float magentaTerritory =
        clamp(
          smoothstep(
            0.46,
            0.84,
            chromaticFieldC *
            0.62 +
            ridgeField *
            0.38
          ) *
          mix(
            0.82,
            1.18,
            uPaletteSignature.z
          ),
          0.0,
          1.0
        );

      /*
       * Muted observation colours use the same territories. This preserves
       * the object's chromatic geography before the emission subtype itself
       * is scientifically authorized.
       */
      vec3 mutedBlue =
        mix(
          vec3(
            0.10,
            0.16,
            0.30
          ),
          vec3(
            0.08,
            0.24,
            0.26
          ),
          uPaletteSignature.y
        );

      vec3 mutedViolet =
        mix(
          vec3(
            0.20,
            0.13,
            0.31
          ),
          vec3(
            0.30,
            0.13,
            0.24
          ),
          uPaletteSignature.z
        );

      vec3 mutedRose =
        mix(
          vec3(
            0.27,
            0.12,
            0.22
          ),
          vec3(
            0.32,
            0.16,
            0.13
          ),
          uPaletteSignature.x
        );

      vec3 genericGas =
        mix(
          mutedBlue,
          mutedViolet,
          cyanTerritory *
          0.52 +
          magentaTerritory *
          0.26
        );

      genericGas =
        mix(
          genericGas,
          mutedRose,
          warmTerritory *
          0.26
        );

      /*
       * Emission palette:
       * - H-alpha-like crimson / red dominates warm ionized gas;
       * - magenta marks transition / mixed excitation zones;
       * - cyan / turquoise marks high-excitation structures;
       * - a restrained warm highlight appears around energetic dense zones.
       */
      /*
       * Palette identity is seed-derived. Every emission nebula therefore
       * keeps the same family language while choosing its own balance between
       * ruby/scarlet, violet/rose and azure/turquoise.
       */
      vec3 lowCrimson =
        mix(
          vec3(
            0.40,
            0.006,
            0.055
          ),
          vec3(
            0.56,
            0.026,
            0.016
          ),
          uPaletteSignature.x
        );

      vec3 highCrimson =
        mix(
          vec3(
            0.91,
            0.018,
            0.13
          ),
          vec3(
            1.0,
            0.075,
            0.025
          ),
          uPaletteSignature.x
        );

      vec3 deepCrimson =
        mix(
          lowCrimson,
          highCrimson,
          uIonization
        );

      vec3 lowMagenta =
        mix(
          vec3(
            0.42,
            0.018,
            0.34
          ),
          vec3(
            0.58,
            0.018,
            0.20
          ),
          uPaletteSignature.z
        );

      vec3 highMagenta =
        mix(
          vec3(
            0.84,
            0.045,
            0.58
          ),
          vec3(
            1.0,
            0.075,
            0.35
          ),
          uPaletteSignature.z
        );

      vec3 hotMagenta =
        mix(
          lowMagenta,
          highMagenta,
          uIonization
        );

      vec3 lowCool =
        mix(
          vec3(
            0.028,
            0.20,
            0.50
          ),
          vec3(
            0.008,
            0.34,
            0.34
          ),
          uPaletteSignature.y
        );

      vec3 highCool =
        mix(
          vec3(
            0.085,
            0.46,
            0.94
          ),
          vec3(
            0.018,
            0.82,
            0.72
          ),
          uPaletteSignature.y
        );

      vec3 turquoise =
        mix(
          lowCool,
          highCool,
          uEnergy
        );

      vec3 ionizedBlue =
        mix(
          mix(
            vec3(
              0.045,
              0.12,
              0.42
            ),
            vec3(
              0.025,
              0.24,
              0.37
            ),
            uPaletteSignature.y
          ),
          mix(
            vec3(
              0.11,
              0.44,
              0.91
            ),
            vec3(
              0.025,
              0.70,
              0.68
            ),
            uPaletteSignature.y
          ),
          uEnergy
        );

      vec3 warmHighlight =
        mix(
          mix(
            vec3(
              0.58,
              0.12,
              0.05
            ),
            vec3(
              0.67,
              0.20,
              0.035
            ),
            uPaletteSignature.x
          ),
          mix(
            vec3(
              0.91,
              0.36,
              0.15
            ),
            vec3(
              1.0,
              0.56,
              0.12
            ),
            uPaletteSignature.x
          ),
          uEnergy
        );

      vec3 warmEmission =
        mix(
          deepCrimson,
          hotMagenta,
          magentaTerritory *
          0.72
        );

      vec3 highExcitation =
        mix(
          ionizedBlue,
          turquoise,
          cyanTerritory
        );

      float excitationMix =
        clamp(
          cyanTerritory *
          0.54 +
          excitation *
          0.22 +
          uEnergy *
          0.14 +
          uIonization *
          0.10,
          0.0,
          1.0
        );

      vec3 emissionGas =
        mix(
          warmEmission,
          highExcitation,
          excitationMix
        );

      /*
       * Warm knots never replace the red/cyan identity. They are sparse
       * highlights tied to already-existing dense, energetic zones.
       */
      float warmKnotMask =
        smoothstep(
          0.70,
          0.91,
          chromaticFieldC *
          0.58 +
          gasDensity *
          0.42
        ) *
        warmTerritory *
        (
          0.35 +
          uEnergy *
          0.65
        );

      emissionGas =
        mix(
          emissionGas,
          warmHighlight,
          warmKnotMask *
          0.22
        );

      vec3 gasColor =
        mix(
          genericGas,
          emissionGas,
          uEmissionReveal
        );

      float physicalBrightness =
        0.66 +
        uDensity *
        0.32 +
        uEnergy *
        0.36 +
        uPhysicalScale *
        0.14;

      float knowledgeBrightness =
        0.43 +
        uDetail *
        0.57;

      float emissionBrightness =
        gasDensity *
        physicalBrightness *
        knowledgeBrightness *
        mix(
          0.38,
          1.04,
          uEmissionReveal
        );

      /*
       * Fine structure is always generated in the same place. Knowledge only
       * changes its visibility. CATALOGUED exposes part of it; CONFIRMED
       * exposes the complete microstructure.
       */
      float microField =
        fbm(
          warpedPoint *
          8.65 +
          vec2(
            31.7,
            -24.6
          )
        );

      float microRidge =
        1.0 -
        abs(
          2.0 *
          microField -
          1.0
        );

      float microReveal =
        smoothstep(
          0.56,
          1.0,
          uDetail
        );

      /*
       * CATALOGUED (detail 0.72) deliberately remains below this gate.
       * CONFIRMED (detail 1.0) reveals a second, already-existing layer of
       * microstructure at the exact same spatial coordinates.
       */
      float confirmedReveal =
        smoothstep(
          0.82,
          0.98,
          uDetail
        );

      float ultraField =
        fbm(
          warpedPoint *
          14.6 +
          vec2(
            -37.4,
            29.1
          )
        );

      float ultraRidge =
        1.0 -
        abs(
          2.0 *
          ultraField -
          1.0
        );

      float ultraFilaments =
        pow(
          clamp(
            ultraRidge,
            0.0,
            1.0
          ),
          7.2
        ) *
        gasDensity *
        envelope *
        confirmedReveal;

      float microFilaments =
        pow(
          clamp(
            microRidge,
            0.0,
            1.0
          ),
          5.2
        ) *
        gasDensity *
        envelope *
        microReveal;

      float filamentBrightness =
        filaments *
        (
          0.15 +
          uDetail *
          0.42
        ) *
        mix(
          0.40,
          1.06,
          uEmissionReveal
        );

      vec3 color =
        background;

      /*
       * Layering the same density field at different response curves creates
       * depth without moving any structure between phases.
       */
      float deepGas =
        pow(
          max(
            gasDensity,
            0.0
          ),
          0.78
        );

      float brightGas =
        pow(
          max(
            gasDensity,
            0.0
          ),
          2.15
        );

      color +=
        gasColor *
        deepGas *
        emissionBrightness *
        0.38;

      color +=
        gasColor *
        brightGas *
        emissionBrightness *
        0.64;

      color +=
        mix(
          highExcitation,
          warmEmission,
          0.42
        ) *
        filamentBrightness;

      color +=
        mix(
          hotMagenta,
          turquoise,
          cyanTerritory
        ) *
        microFilaments *
        mix(
          0.06,
          0.42,
          uEmissionReveal
        );

      color +=
        mix(
          deepCrimson,
          turquoise,
          cyanTerritory *
          0.72
        ) *
        ultraFilaments *
        uEmissionReveal *
        0.58;

      /*
       * Dark dust remains subtractive. Higher knowledge reveals narrower
       * extinction lanes already present in the structural field.
       */
      float fineDust =
        smoothstep(
          0.77,
          0.93,
          1.0 -
          abs(
            2.0 *
            chromaticFieldC -
            1.0
          )
        ) *
        envelope *
        microReveal;

      float confirmedDust =
        smoothstep(
          0.80,
          0.95,
          1.0 -
          abs(
            2.0 *
            ultraField -
            1.0
          )
        ) *
        gasDensity *
        envelope *
        confirmedReveal;

      color *=
        1.0 -
        clamp(
          dustLane *
          (
            0.30 +
            uDetail *
            0.38
          ) +
          fineDust *
          0.22 +
          confirmedDust *
          0.16,
          0.0,
          0.80
        );

      color +=
        starColor *
        stars *
        (
          0.75 +
          uDetail *
          0.47
        );

      /*
       * Embedded massive stars keep exactly the same positions. Their glow
       * becomes more visible as the observation improves.
       */
      float embeddedStars =
        starLayer(
          uv +
          uSeed *
          0.007,
          72.0,
          0.989,
          0.135
        ) *
        envelope *
        gasDensity *
        (
          0.20 +
          uDetail *
          0.80
        );

      float stellarHaloField =
        smoothstep(
          0.74,
          0.94,
          chromaticFieldB *
          0.47 +
          chromaticFieldC *
          0.21 +
          gasDensity *
          0.32
        ) *
        envelope *
        (
          0.20 +
          uDetail *
          0.80
        );

      vec3 embeddedStarColor =
        mix(
          vec3(
            0.70,
            0.88,
            1.0
          ),
          vec3(
            1.0,
            0.88,
            0.68
          ),
          warmTerritory *
          0.36
        );

      color +=
        embeddedStarColor *
        embeddedStars *
        (
          0.84 +
          uEnergy *
          0.62
        );

      float confirmedEmbeddedStars =
        starLayer(
          uv +
          vec2(
            -0.017,
            0.026
          ) +
          uSeed *
          0.011,
          118.0,
          0.994,
          0.072
        ) *
        envelope *
        gasDensity *
        confirmedReveal;

      color +=
        mix(
          vec3(
            0.64,
            0.82,
            1.0
          ),
          vec3(
            1.0,
            0.74,
            0.58
          ),
          warmTerritory *
          0.44
        ) *
        confirmedEmbeddedStars *
        (
          0.48 +
          uEnergy *
          0.42
        );

      color +=
        mix(
          turquoise,
          hotMagenta,
          magentaTerritory
        ) *
        stellarHaloField *
        uEmissionReveal *
        (
          0.025 +
          uEnergy *
          0.085
        );

      /*
       * Large-scale glow follows the gas itself; it is not a separate blob.
       */
      float nebularGlow =
        pow(
          max(
            gasDensity,
            0.0
          ),
          2.05
        ) *
        mix(
          0.09,
          0.45,
          uEmissionReveal
        ) *
        (
          0.42 +
          uDetail *
          0.58
        );

      color +=
        emissionGas *
        nebularGlow;

      /*
       * Controlled local colour separation adds richness without producing
       * rainbow noise. The territories are broad and structurally coherent.
       */
      color +=
        deepCrimson *
        warmTerritory *
        gasDensity *
        uEmissionReveal *
        0.20;

      color +=
        turquoise *
        cyanTerritory *
        gasDensity *
        uEmissionReveal *
        0.17;

      color +=
        hotMagenta *
        magentaTerritory *
        filaments *
        uEmissionReveal *
        0.14;

      /*
       * Preserve luminance while restoring chromatic separation after all
       * volumetric layers have been accumulated. This prevents bright gas
       * from collapsing into pale white/pink without altering its structure.
       */
      float emissionLuminance =
        dot(
          color,
          vec3(
            0.2126,
            0.7152,
            0.0722
          )
        );

      float paletteSaturation =
        mix(
          0.90,
          1.16,
          (
            uPaletteSignature.x +
            uPaletteSignature.y +
            uPaletteSignature.z
          ) /
          3.0
        );

      float saturationBoost =
        1.0 +
        uEmissionReveal *
        (
          0.22 *
          paletteSaturation +
          confirmedReveal *
          0.10
        );

      color =
        max(
          vec3(
            emissionLuminance
          ) +
          (
            color -
            vec3(
              emissionLuminance
            )
          ) *
          saturationBoost,
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
        0.44;

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
       * Lightweight display transform. The renderer is static scientific
       * visualization, so no temporal exposure/adaptation can alter frames.
       */
      color =
        color /
        (
          color +
          vec3(
            0.72
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
