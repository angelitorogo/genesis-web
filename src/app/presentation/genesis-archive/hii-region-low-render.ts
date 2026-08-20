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
  HiiRegionLowRenderModelBuilder,
} from './hii-region-low-render-model';

@Component({
  selector:
    'app-hii-region-low-render',

  standalone:
    true,

  template: `
    <div
      class="hii-low"
      data-testid="hii-region-low-render"
      [attr.data-knowledge-level]="descriptor().knowledgeLevel"
      [attr.data-hii-variant]="descriptor().variant ?? 'GENERIC'"
      [attr.data-render-profile]="descriptor().renderProfile ?? 'NONE'"
    >
      <canvas
        #canvas
        class="hii-low__canvas"
        role="img"
        [attr.aria-label]="descriptor().accessibleLabel"
      ></canvas>

      <div
        class="hii-low__optics"
        aria-hidden="true"
      ></div>
    </div>
  `,

  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .hii-low {
      position: relative;
      width: 100%;
      min-height: 15rem;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      background: #02040a;
    }

    .hii-low__canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .hii-low__optics {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 48%, transparent 50%, rgba(0, 0, 0, 0.30) 100%);
      box-shadow:
        inset 0 0 2.5rem rgba(0, 0, 0, 0.30);
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class HiiRegionLowRender
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
        0.96;

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
      HiiRegionLowRenderModelBuilder
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
      'uApparentExtent'
    ].value =
      model.apparentExtent;

    (
      uniforms[
        'uVolume'
      ].value as
        THREE.Vector4
    ).set(
      model.volumeDepth,
      model.turbulenceStrength,
      model.cavityStrength,
      model.pillarStrength,
    );

    (
      uniforms[
        'uDustAndPalette'
      ].value as
        THREE.Vector4
    ).set(
      model.dustLaneStrength,
      model.warmEmissionBias,
      model.cyanEmissionBias,
      model.greenEmissionBias,
    );

    (
      uniforms[
        'uKnowledge'
      ].value as
        THREE.Vector4
    ).set(
      model.detailFactor,
      model.signalGain,
      model.chromaGain,
      model.microDetailGain,
    );

    uniforms[
      'uStarVisibility'
    ].value =
      model.starVisibility;

    uniforms[
      'uSourceCount'
    ].value =
      model.dominantIonizingSourceCount;

    const source0 =
      model.ionizingSources[
        0
      ];

    const source1 =
      model.ionizingSources[
        1
      ];

    const source2 =
      model.ionizingSources[
        2
      ];

    (
      uniforms[
        'uSource0'
      ].value as
        THREE.Vector3
    ).set(
      source0?.x ??
        0,
      source0?.y ??
        0,
      source0?.strength ??
        0,
    );

    (
      uniforms[
        'uSource1'
      ].value as
        THREE.Vector3
    ).set(
      source1?.x ??
        0,
      source1?.y ??
        0,
      source1?.strength ??
        0,
    );

    (
      uniforms[
        'uSource2'
      ].value as
        THREE.Vector3
    ).set(
      source2?.x ??
        0,
      source2?.y ??
        0,
      source2?.strength ??
        0,
    );

    (
      uniforms[
        'uMorphologyA'
      ].value as
        THREE.Vector4
    ).set(
      model.morphologyIndex,
      model.shellStrength,
      model.asymmetryStrength,
      model.lobeStrength,
    );

    (
      uniforms[
        'uMorphologyB'
      ].value as
        THREE.Vector4
    ).set(
      model.filamentDirection,
      model.cavityRadius,
      model.edgeSharpness,
      model.morphologyNoiseScale,
    );

    (
      uniforms[
        'uPaletteFamily'
      ].value as
        THREE.Vector4
    ).set(
      model.paletteIndex,
      model.paletteAccent,
      model.coolCoreBias,
      model.warmEdgeBias,
    );

    (
      uniforms[
        'uPhysical'
      ].value as
        THREE.Vector4
    ).set(
      model.physicalScale,
      model.density,
      model.energy,
      model.concentration,
    );

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
    uApparentExtent: {
      value:
        1,
    },
    uVolume: {
      value:
        new THREE.Vector4(
          1,
          1,
          0.6,
          0.35,
        ),
    },
    uDustAndPalette: {
      value:
        new THREE.Vector4(
          0.3,
          0.5,
          0.5,
          0.5,
        ),
    },
    uKnowledge: {
      value:
        new THREE.Vector4(
          0.14,
          0.27,
          0.08,
          0,
        ),
    },
    uStarVisibility: {
      value:
        0.24,
    },
    uSourceCount: {
      value:
        1,
    },
    uSource0: {
      value:
        new THREE.Vector3(
          0,
          0,
          1,
        ),
    },
    uSource1: {
      value:
        new THREE.Vector3(
          0,
          0,
          0,
        ),
    },
    uSource2: {
      value:
        new THREE.Vector3(
          0,
          0,
          0,
        ),
    },
    uMorphologyA: {
      value:
        new THREE.Vector4(
          0,
          0.7,
          0.2,
          0.1,
        ),
    },
    uMorphologyB: {
      value:
        new THREE.Vector4(
          0.5,
          0.45,
          0.7,
          0.4,
        ),
    },
    uPaletteFamily: {
      value:
        new THREE.Vector4(
          0,
          0.3,
          0.8,
          0.7,
        ),
    },
    uPhysical: {
      value:
        new THREE.Vector4(
          0.5,
          0.5,
          0.5,
          0.5,
        ),
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
    uniform float uApparentExtent;
    uniform vec4 uVolume;
    uniform vec4 uDustAndPalette;
    uniform vec4 uKnowledge;
    uniform float uStarVisibility;
    uniform float uSourceCount;
    uniform vec3 uSource0;
    uniform vec3 uSource1;
    uniform vec3 uSource2;
    uniform vec4 uMorphologyA;
    uniform vec4 uMorphologyB;
    uniform vec4 uPaletteFamily;
    uniform vec4 uPhysical;

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
        floor(point);

      vec2 fractionalPart =
        fract(point);

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

    vec2 flowWarp(
      vec2 point,
      float scale,
      float strength
    ) {
      float nx =
        fbm(
          point *
          scale +
          uSeed *
          13.0
        );

      float ny =
        fbm(
          point.yx *
          (
            scale *
            0.93
          ) +
          vec2(
            11.2,
            -7.4
          ) +
          uSeed *
          17.0
        );

      return vec2(
        nx - 0.5,
        ny - 0.5
      ) *
      strength;
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
        floor(grid);

      vec2 local =
        fract(grid) -
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

    float sourceDistance(
      vec3 point,
      vec3 source
    ) {
      return length(
        point -
        vec3(
          source.xy,
          0.0
        )
      );
    }

    float sourceField(
      vec3 point
    ) {
      float field =
        0.0;

      float d0 =
        sourceDistance(
          point,
          uSource0
        );

      field +=
        uSource0.z *
        exp(
          -d0 *
          d0 *
          14.0
        );

      if (
        uSourceCount >
        1.5
      ) {
        float d1 =
          sourceDistance(
            point,
            uSource1
          );

        field +=
          uSource1.z *
          exp(
            -d1 *
            d1 *
            14.0
          );
      }

      if (
        uSourceCount >
        2.5
      ) {
        float d2 =
          sourceDistance(
            point,
            uSource2
          );

        field +=
          uSource2.z *
          exp(
            -d2 *
            d2 *
            14.0
          );
      }

      return field;
    }

    float cavityField(
      vec3 point
    ) {
      float cavity =
        0.0;

      float d0 =
        sourceDistance(
          point,
          uSource0
        );

      cavity =
        max(
          cavity,
          1.0 -
          smoothstep(
            0.10,
            0.34,
            d0
          )
        );

      if (
        uSourceCount >
        1.5
      ) {
        float d1 =
          sourceDistance(
            point,
            uSource1
          );

        cavity =
          max(
            cavity,
            1.0 -
            smoothstep(
              0.10,
              0.30,
              d1
            )
          );
      }

      if (
        uSourceCount >
        2.5
      ) {
        float d2 =
          sourceDistance(
            point,
            uSource2
          );

        cavity =
          max(
            cavity,
            1.0 -
            smoothstep(
              0.09,
              0.28,
              d2
            )
          );
      }

      return cavity;
    }

    float morphologyEnvelope(
      vec2 point,
      float lowFrequency
    ) {
      float type =
        floor(
          uMorphologyA.x +
          0.5
        );

      float shellStrength =
        uMorphologyA.y;

      float asymmetryStrength =
        uMorphologyA.z;

      float lobeStrength =
        uMorphologyA.w;

      float direction =
        uMorphologyB.x *
        6.28318530718;

      float cavityRadius =
        uMorphologyB.y;

      float edgeSharpness =
        uMorphologyB.z;

      float noiseScale =
        uMorphologyB.w;

      vec2 dir =
        vec2(
          cos(direction),
          sin(direction)
        );

      vec2 side =
        vec2(
          -dir.y,
          dir.x
        );

      vec2 primaryWarp =
        flowWarp(
          point +
          dir *
          0.18,
          2.0 +
          noiseScale *
          2.0,
          0.10 +
          asymmetryStrength *
          0.10
        );

      vec2 secondaryWarp =
        flowWarp(
          point.yx +
          side *
          0.14,
          4.2 +
          noiseScale *
          3.0,
          0.03 +
          noiseScale *
          0.06
        );

      vec2 warpedPoint =
        point +
        primaryWarp +
        secondaryWarp;

      float along =
        dot(
          warpedPoint,
          dir
        );

      float across =
        dot(
          warpedPoint,
          side
        );

      float warp =
        (
          lowFrequency -
          0.5
        ) *
        (
          0.20 +
          noiseScale *
          0.28
        );

      float localTexture =
        fbm(
          warpedPoint *
          (
            3.0 +
            noiseScale *
            2.6
          ) +
          uSeed *
          9.0
        );

      float rimBreakup =
        smoothstep(
          0.30,
          0.78,
          localTexture
        );

      float porousVoid =
        smoothstep(
          0.60,
          0.90,
          fbm(
            warpedPoint *
            (
              4.6 +
              noiseScale *
              3.4
            ) +
            uSeed *
            19.0
          )
        );

      float radial =
        length(
          warpedPoint /
          vec2(
            0.80 +
            asymmetryStrength *
            0.34,
            0.66 +
            lobeStrength *
            0.12
          )
        );

      float base =
        1.0 -
        smoothstep(
          0.42 +
          warp,
          1.00 +
          warp,
          radial
        );

      float bubbleRadius =
        0.34 +
        cavityRadius *
        0.30;

      float bubbleShell =
        exp(
          -pow(
            radial -
            bubbleRadius,
            2.0
          ) *
          (
            28.0 +
            edgeSharpness *
            32.0
          )
        );

      float bubbleInterior =
        1.0 -
        smoothstep(
          bubbleRadius *
          0.46,
          bubbleRadius *
          0.98,
          radial
        );

      float bubble =
        clamp(
          base *
          (
            0.16 +
            rimBreakup *
            0.12
          ) +
          bubbleShell *
          (
            0.70 +
            shellStrength *
            0.44
          ) +
          bubbleInterior *
          0.10,
          0.0,
          1.0
        );

      vec2 blisterCenter =
        warpedPoint +
        dir *
        (
          0.24 +
          asymmetryStrength *
          0.24
        ) -
        side *
        (
          uSeed.y -
          0.5
        ) *
        0.12;

      float blisterBody =
        1.0 -
        smoothstep(
          0.34 +
          warp,
          0.92 +
          warp,
          length(
            blisterCenter /
            vec2(
              0.90,
              0.64
            )
          )
        );

      float blisterOpening =
        smoothstep(
          -0.10,
          0.38,
          along +
          localTexture *
          0.08
        );

      float blisterFront =
        exp(
          -pow(
            along +
            0.20 +
            warp *
            0.36,
            2.0
          ) *
          20.0
        ) *
        exp(
          -pow(
            across *
            (
              1.0 +
              asymmetryStrength *
              0.8
            ),
            2.0
          ) *
          2.4
        );

      float blister =
        clamp(
          blisterBody *
          (
            1.0 -
            blisterOpening *
            0.80
          ) +
          blisterFront *
          (
            0.62 +
            rimBreakup *
            0.18
          ) -
          porousVoid *
          0.08,
          0.0,
          1.0
        );

      vec2 clumpOffsetA =
        vec2(
          -0.24 +
          (uSeed.x - 0.5) *
          0.14,
          0.12 +
          (uSeed.y - 0.5) *
          0.14
        );

      vec2 clumpOffsetB =
        vec2(
          0.22 +
          (uSeed.y - 0.5) *
          0.12,
          -0.14 +
          (uSeed.x - 0.5) *
          0.14
        );

      vec2 clumpOffsetC =
        vec2(
          0.04 +
          (uSeed.x - uSeed.y) *
          0.12,
          0.26 -
          (uSeed.x - 0.5) *
          0.10
        );

      vec2 clumpOffsetD =
        vec2(
          -0.06 +
          (uSeed.y - 0.5) *
          0.10,
          -0.24 +
          (uSeed.x - 0.5) *
          0.10
        );

      float clumpA =
        1.0 -
        smoothstep(
          0.14,
          0.46 +
          noiseScale *
          0.10,
          length(
            warpedPoint -
            clumpOffsetA
          )
        );

      float clumpB =
        1.0 -
        smoothstep(
          0.14,
          0.42 +
          noiseScale *
          0.12,
          length(
            warpedPoint -
            clumpOffsetB
          )
        );

      float clumpC =
        1.0 -
        smoothstep(
          0.12,
          0.38 +
          noiseScale *
          0.10,
          length(
            warpedPoint -
            clumpOffsetC
          )
        );

      float clumpD =
        1.0 -
        smoothstep(
          0.12,
          0.36 +
          noiseScale *
          0.08,
          length(
            warpedPoint -
            clumpOffsetD
          )
        );

      float clumpy =
        clamp(
          max(
            max(
              clumpA,
              clumpB
            ),
            max(
              clumpC,
              clumpD
            )
          ) *
          (
            0.64 +
            0.36 *
            rimBreakup
          ) -
          porousVoid *
          0.14,
          0.0,
          1.0
        );

      float compactRadius =
        length(
          warpedPoint /
          vec2(
            0.58 +
            asymmetryStrength *
            0.12,
            0.50 +
            edgeSharpness *
            0.06
          )
        );

      float compactCore =
        1.0 -
        smoothstep(
          0.24 +
          warp *
          0.20,
          0.58 +
          warp *
          0.24,
          compactRadius
        );

      float compactHalo =
        1.0 -
        smoothstep(
          0.44,
          0.88,
          compactRadius
        );

      float compact =
        clamp(
          compactCore *
          (
            0.82 +
            rimBreakup *
            0.18
          ) +
          compactHalo *
          0.22 -
          porousVoid *
          0.10,
          0.0,
          1.0
        );

      float pillarBody =
        1.0 -
        smoothstep(
          0.36 +
          warp,
          1.00 +
          warp,
          length(
            warpedPoint /
            vec2(
              0.96,
              0.70
            )
          )
        );

      float pillarA =
        exp(
          -pow(
            across +
            0.24 +
            sin(
              along *
              4.4 +
              uSeed.x *
              4.0
            ) *
            0.08,
            2.0
          ) *
          36.0
        );

      float pillarB =
        exp(
          -pow(
            across -
            0.02 +
            sin(
              along *
              5.0 +
              uSeed.y *
              5.0
            ) *
            0.07,
            2.0
          ) *
          44.0
        );

      float pillarC =
        exp(
          -pow(
            across -
            0.24 +
            sin(
              along *
              4.1 +
              (uSeed.x + uSeed.y) *
              4.2
            ) *
            0.08,
            2.0
          ) *
          34.0
        );

      float pillarReach =
        smoothstep(
          -0.56,
          0.12,
          along
        ) *
        (
          1.0 -
          smoothstep(
            0.10,
            0.82,
            along
          )
        );

      float pillars =
        clamp(
          pillarBody *
          (
            0.44 +
            (pillarA + pillarB + pillarC) *
            0.22 *
            pillarReach
          ) -
          porousVoid *
          0.08,
          0.0,
          1.0
        );

      float filamentCenterA =
        across +
        sin(
          along *
          4.2 +
          uSeed.x *
          5.0
        ) *
        (
          0.10 +
          noiseScale *
          0.08
        ) +
        warp *
        0.30;

      float filamentCenterB =
        across -
        0.18 +
        sin(
          along *
          5.0 +
          uSeed.y *
          4.8
        ) *
        0.08;

      float filamentWidth =
        0.11 +
        edgeSharpness *
        0.10;

      float filamentRibbonA =
        1.0 -
        smoothstep(
          filamentWidth,
          filamentWidth +
          0.24,
          abs(
            filamentCenterA
          )
        );

      float filamentRibbonB =
        1.0 -
        smoothstep(
          filamentWidth *
          0.9,
          filamentWidth +
          0.20,
          abs(
            filamentCenterB
          )
        );

      float filamentLength =
        1.0 -
        smoothstep(
          0.48,
          1.06,
          abs(along)
        );

      float filamentary =
        clamp(
          max(
            filamentRibbonA,
            filamentRibbonB *
            0.84
          ) *
          filamentLength *
          (
            0.58 +
            0.42 *
            rimBreakup
          ),
          0.0,
          1.0
        );

      float lobeOffset =
        0.24 +
        lobeStrength *
        0.26;

      float lobeRadius =
        0.40 +
        noiseScale *
        0.10;

      float twinA =
        1.0 -
        smoothstep(
          0.16,
          lobeRadius,
          length(
            vec2(
              along -
              lobeOffset,
              across *
              1.14
            )
          )
        );

      float twinB =
        1.0 -
        smoothstep(
          0.16,
          lobeRadius *
          0.96,
          length(
            vec2(
              along +
              lobeOffset,
              across *
              1.20
            )
          )
        );

      float bridge =
        exp(
          -along *
          along *
          16.0
        ) *
        exp(
          -across *
          across *
          6.0
        );

      float centralGap =
        exp(
          -along *
          along *
          44.0
        ) *
        exp(
          -across *
          across *
          4.0
        );

      float doubleLobe =
        clamp(
          max(
            twinA,
            twinB
          ) +
          bridge *
          0.16 -
          centralGap *
          0.40,
          0.0,
          1.0
        );

      float angle =
        atan(
          across,
          along
        );

      float missingArcCenter =
        (
          uSeed.x -
          0.5
        ) *
        4.6;

      float arcDistance =
        abs(
          atan(
            sin(
              angle -
              missingArcCenter
            ),
            cos(
              angle -
              missingArcCenter
            )
          )
        );

      float shellRadius =
        0.42 +
        cavityRadius *
        0.26;

      float shellBand =
        exp(
          -pow(
            radial -
            shellRadius,
            2.0
          ) *
          (
            24.0 +
            edgeSharpness *
            30.0
          )
        );

      float fragmentA =
        smoothstep(
          0.54,
          1.04,
          arcDistance
        );

      float fragmentB =
        smoothstep(
          0.20,
          0.74,
          rimBreakup
        );

      float brokenShell =
        clamp(
          shellBand *
          fragmentA *
          (
            0.52 +
            fragmentB *
            0.48
          ) +
          base *
          0.10 -
          porousVoid *
          0.10,
          0.0,
          1.0
        );

      if (
        type <
        0.5
      ) {
        return bubble;
      }

      if (
        type <
        1.5
      ) {
        return blister;
      }

      if (
        type <
        2.5
      ) {
        return clumpy;
      }

      if (
        type <
        3.5
      ) {
        return compact;
      }

      if (
        type <
        4.5
      ) {
        return pillars;
      }

      if (
        type <
        5.5
      ) {
        return filamentary;
      }

      if (
        type <
        6.5
      ) {
        return doubleLobe;
      }

      return brokenShell;
    }

    float morphologyDustMask(
      vec2 point
    ) {
      float type =
        floor(
          uMorphologyA.x +
          0.5
        );

      float direction =
        uMorphologyB.x *
        6.28318530718;

      float noiseScale =
        uMorphologyB.w;

      vec2 dir =
        vec2(
          cos(direction),
          sin(direction)
        );

      vec2 side =
        vec2(
          -dir.y,
          dir.x
        );

      vec2 warpedPoint =
        point +
        flowWarp(
          point,
          2.8 +
          noiseScale *
          2.4,
          0.08
        );

      float along =
        dot(
          warpedPoint,
          dir
        );

      float across =
        dot(
          warpedPoint,
          side
        );

      float mask =
        0.0;

      if (
        type >
        3.5 &&
        type <
        4.5
      ) {
        float pillarA =
          exp(
            -pow(
              across +
              0.24 +
              sin(
                along *
                4.6 +
                uSeed.x *
                4.0
              ) *
              0.08,
              2.0
            ) *
            34.0
          );

        float pillarB =
          exp(
            -pow(
              across -
              0.02 +
              sin(
                along *
                5.2 +
                uSeed.y *
                4.8
              ) *
              0.08,
              2.0
            ) *
            40.0
          );

        float pillarC =
          exp(
            -pow(
              across -
              0.24,
              2.0
            ) *
            30.0
          );

        mask =
          (
            pillarA +
            pillarB +
            pillarC
          ) *
          0.24 *
          smoothstep(
            -0.50,
            0.18,
            along
          ) *
          (
            1.0 -
            smoothstep(
              0.18,
              0.82,
              along
            )
          );
      }

      if (
        type >
        0.5 &&
        type <
        1.5
      ) {
        mask =
          max(
            mask,
            smoothstep(
              0.10,
              0.52,
              along
            ) *
            exp(
              -across *
              across *
              4.2
            ) *
            0.34
          );
      }

      if (
        type >
        6.5
      ) {
        float arc =
          exp(
            -pow(
              abs(
                length(warpedPoint) -
                (0.42 + uMorphologyB.y * 0.24)
              ),
              2.0
            ) *
            60.0
          );

        mask =
          max(
            mask,
            arc *
            smoothstep(
              0.58,
              0.84,
              fbm(
                warpedPoint *
                4.4 +
                uSeed *
                15.0
              )
            ) *
            0.22
          );
      }

      return clamp(
        mask,
        0.0,
        1.0
      );
    }

    vec3 emissionPalette(

      float excitation,
      float chemistry,
      float hotSpot
    ) {
      float warmBias =
        uDustAndPalette.y;

      float cyanBias =
        uDustAndPalette.z;

      float greenBias =
        uDustAndPalette.w;

      float paletteIndex =
        floor(
          uPaletteFamily.x +
          0.5
        );

      float accent =
        uPaletteFamily.y;

      float coolCoreBias =
        uPaletteFamily.z;

      float warmEdgeBias =
        uPaletteFamily.w;

      vec3 warmA =
        vec3(
          0.36,
          0.028,
          0.090
        );

      vec3 warmB =
        vec3(
          0.88,
          0.090,
          0.34
        );

      vec3 coolA =
        vec3(
          0.035,
          0.26,
          0.50
        );

      vec3 coolB =
        vec3(
          0.045,
          0.76,
          0.84
        );

      if (
        paletteIndex <
        0.5
      ) {
        warmA = vec3(
          0.34,
          0.03,
          0.10
        );
        warmB = vec3(
          0.90,
          0.18,
          0.42
        );
        coolA = vec3(
          0.08,
          0.28,
          0.46
        );
        coolB = vec3(
          0.24,
          0.86,
          0.94
        );
      } else if (
        paletteIndex <
        1.5
      ) {
        warmA = vec3(
          0.36,
          0.10,
          0.02
        );
        warmB = vec3(
          0.92,
          0.46,
          0.10
        );
        coolA = vec3(
          0.04,
          0.22,
          0.26
        );
        coolB = vec3(
          0.16,
          0.70,
          0.62
        );
      } else if (
        paletteIndex <
        2.5
      ) {
        warmA = vec3(
          0.22,
          0.06,
          0.26
        );
        warmB = vec3(
          0.64,
          0.22,
          0.72
        );
        coolA = vec3(
          0.04,
          0.16,
          0.42
        );
        coolB = vec3(
          0.26,
          0.56,
          0.94
        );
      } else if (
        paletteIndex <
        3.5
      ) {
        warmA = vec3(
          0.38,
          0.18,
          0.04
        );
        warmB = vec3(
          0.86,
          0.62,
          0.22
        );
        coolA = vec3(
          0.06,
          0.22,
          0.16
        );
        coolB = vec3(
          0.36,
          0.82,
          0.66
        );
      } else if (
        paletteIndex <
        4.5
      ) {
        warmA = vec3(
          0.42,
          0.02,
          0.06
        );
        warmB = vec3(
          0.88,
          0.16,
          0.24
        );
        coolA = vec3(
          0.18,
          0.10,
          0.32
        );
        coolB = vec3(
          0.72,
          0.44,
          0.86
        );
      } else {
        warmA = vec3(
          0.24,
          0.28,
          0.34
        );
        warmB = vec3(
          0.82,
          0.86,
          0.90
        );
        coolA = vec3(
          0.02,
          0.18,
          0.30
        );
        coolB = vec3(
          0.36,
          0.86,
          0.94
        );
      }

      vec3 green =
        mix(
          vec3(
            0.08,
            0.22,
            0.14
          ),
          vec3(
            0.26,
            0.66,
            0.28
          ),
          greenBias
        );

      vec3 cool =
        mix(
          coolA,
          coolB,
          clamp(
            excitation *
            (
              0.58 +
              coolCoreBias *
              0.28
            ) +
            chemistry *
            0.16,
            0.0,
            1.0
          )
        );

      cool =
        mix(
          cool,
          green,
          chemistry *
          greenBias *
          0.36
        );

      vec3 warm =
        mix(
          warmA,
          warmB,
          clamp(
            (
              1.0 -
              excitation
            ) *
            (
              0.28 +
              warmEdgeBias *
              0.42
            ) +
            chemistry *
            (
              0.30 +
              warmBias *
              0.16
            ),
            0.0,
            1.0
          )
        );

      vec3 color =
        mix(
          warm,
          cool,
          clamp(
            excitation *
            (
              0.50 +
              coolCoreBias *
              0.34
            ) +
            cyanBias *
            0.16,
            0.0,
            1.0
          )
        );

      vec3 accentColor =
        mix(
          vec3(
            0.92,
            0.92,
            1.0
          ),
          mix(
            coolB,
            warmB,
            0.42
          ),
          accent
        );

      return mix(
        color,
        accentColor,
        hotSpot *
        (
          0.22 +
          accent *
          0.26
        )
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

      vec2 point =
        rotate2d(
          uOrientation
        ) *
        screenPoint;

      point.y *=
        uStructureAspect;

      point /=
        max(
          uApparentExtent,
          0.001
        );

      vec2 seedOffset =
        (
          uSeed -
          0.5
        ) *
        17.0;

      float detail =
        uKnowledge.x;

      float signalGain =
        uKnowledge.y;

      float chromaGain =
        uKnowledge.z;

      float microDetailGain =
        uKnowledge.w;

      float volumeDepth =
        uVolume.x;

      float turbulenceStrength =
        uVolume.y;

      float cavityStrength =
        uVolume.z;

      float pillarStrength =
        uVolume.w;

      float dustStrength =
        uDustAndPalette.x;

      float shellStrength =
        uMorphologyA.y;

      float asymmetryStrength =
        uMorphologyA.z;

      float cavityRadius =
        uMorphologyB.y;

      float edgeSharpness =
        uMorphologyB.z;

      float morphologyNoiseScale =
        uMorphologyB.w;

      float lowFrequency =
        fbm(
          point *
          2.1 +
          seedOffset *
          0.21
        );

      float macroEnvelope =
        morphologyEnvelope(
          point,
          lowFrequency
        );

      vec3 accumulatedColor =
        vec3(
          0.0
        );

      float accumulatedOpacity =
        0.0;

      float projectedFilament =
        0.0;

      float projectedDust =
        0.0;

      for (
        int slice =
          0;
        slice <
          7;
        slice++
      ) {
        float sliceIndex =
          float(slice);

        float z =
          -0.90 +
          sliceIndex *
          0.30;

        vec3 volumePoint =
          vec3(
            point.x,
            point.y,
            z /
            max(
              volumeDepth,
              0.20
            )
          );

        vec3 noisePoint =
          volumePoint *
          (
            4.4 +
            turbulenceStrength *
            1.8
          ) +
          vec3(
            seedOffset,
            7.3
          );

        float coarse =
          noise3(
            noisePoint
          );

        float medium =
          noise3(
            noisePoint *
            2.0 +
            vec3(
              7.1,
              -12.3,
              5.9
            )
          );

        float fine =
          noise3(
            noisePoint *
            4.4 +
            vec3(
              -18.7,
              9.5,
              26.2
            )
          );

        float ridge =
          ridge3(
            noisePoint *
            2.8 +
            vec3(
              17.4,
              -6.2,
              10.1
            )
          );

        float sourceExcitation =
          sourceField(
            volumePoint
          );

        float cavity =
          cavityField(
            volumePoint
          );

        float volumeRadius =
          length(
            volumePoint /
            vec3(
              0.84 +
              asymmetryStrength *
              0.12,
              0.70,
              0.92
            )
          );

        float radialDepthEnvelope =
          1.0 -
          smoothstep(
            0.52 +
            (
              coarse -
              0.5
            ) *
            0.18,
            1.16 +
            (
              coarse -
              0.5
            ) *
            0.20,
            volumeRadius
          );

        /*
         * V2.2: morphology remains the primary silhouette authority, now with
         * additional flow warping and porosity so families separate more
         * clearly and the interior reads less like a uniform fog oval.
         */
        float volumeEnvelope =
          pow(
            clamp(
              macroEnvelope,
              0.0,
              1.0
            ),
            0.72 +
            edgeSharpness *
            0.34
          ) *
          (
            0.62 +
            radialDepthEnvelope *
            0.38
          );

        float cloudDensity =
          smoothstep(
            0.34,
            0.74,
            coarse *
            0.50 +
            medium *
            0.28 +
            ridge *
            0.14 +
            fine *
            0.08
          ) *
          volumeEnvelope;

        float morphologyType =
          floor(
            uMorphologyA.x +
            0.5
          );

        float porosity =
          smoothstep(
            0.58,
            0.88,
            noise3(
              noisePoint *
              (
                1.38 +
                morphologyNoiseScale *
                0.30
              ) +
              vec3(
                14.7,
                -22.8,
                9.4
              )
            )
          ) *
          volumeEnvelope;

        float knottyness =
          smoothstep(
            0.68,
            0.92,
            ridge3(
              noisePoint *
              3.6 +
              vec3(
                -12.2,
                8.4,
                16.1
              )
            )
          ) *
          volumeEnvelope;

        float shellMorphologyWeight =
          morphologyType <
            0.5 ||
          morphologyType >
            6.5
            ? 1.0
            : morphologyType >
                  5.5 &&
                morphologyType <
                  6.5
              ? 0.46
              : 0.18;

        float cavityInterior =
          cavity *
          cavityStrength *
          (
            0.22 +
            shellStrength *
            0.54 *
            shellMorphologyWeight
          );

        float shellFront =
          exp(
            -pow(
              cavity -
              (
                0.22 +
                cavityRadius *
                0.18
              ),
              2.0
            ) *
            (
              18.0 +
              edgeSharpness *
              14.0
            )
          );

        float ionizationFront =
          smoothstep(
            0.16,
            0.46,
            cavity
          ) *
          (
            1.0 -
            smoothstep(
              0.54,
              0.90,
              cavity
            )
          );

        cloudDensity *=
          1.0 -
          cavityInterior *
          0.60;

        float morphologyPorosityWeight =
          morphologyType >
            3.5 &&
          morphologyType <
            5.5
            ? 0.34
            : morphologyType >
                  5.5
              ? 0.28
              : 0.20;

        cloudDensity *=
          1.0 -
          porosity *
          (
            0.12 +
            detail *
            0.14 +
            morphologyPorosityWeight
          );

        cloudDensity +=
          knottyness *
          (
            0.03 +
            detail *
            0.05
          );

        cloudDensity +=
          ionizationFront *
          (
            0.08 +
            sourceExcitation *
            0.18
          ) *
          (
            0.34 +
            shellMorphologyWeight *
            0.66
          );

        cloudDensity +=
          shellFront *
          shellStrength *
          shellMorphologyWeight *
          (
            0.06 +
            sourceExcitation *
            0.10
          );

        float dustField =
          ridge3(
            vec3(
              volumePoint.x *
              (
                1.1 +
                morphologyNoiseScale *
                0.3
              ),
              volumePoint.y *
              (
                2.4 +
                pillarStrength *
                1.8
              ),
              volumePoint.z *
              0.82
            ) +
            vec3(
              -9.8,
              20.6,
              -13.4
            )
          );

        float pillar =
          pow(
            clamp(
              dustField,
              0.0,
              1.0
            ),
            5.0 +
            (1.0 -
            pillarStrength) *
            1.2
          ) *
          volumeEnvelope *
          pillarStrength;

        float dustLane =
          smoothstep(
            0.66,
            0.90,
            noise3(
              noisePoint *
              (
                1.24 +
                morphologyNoiseScale *
                0.22
              ) +
              vec3(
                29.1,
                -16.4,
                7.7
              )
            )
          ) *
          volumeEnvelope *
          dustStrength;

        float morphologyShadow =
          morphologyDustMask(
            point
          );

        float obscuration =
          clamp(
            pillar *
            0.52 +
            dustLane *
            0.34 +
            morphologyShadow *
            (
              0.34 +
              pillarStrength *
              0.28
            ),
            0.0,
            0.82
          );

        cloudDensity *=
          1.0 -
          obscuration;

        float filament =
          pow(
            clamp(
              ridge,
              0.0,
              1.0
            ),
            5.6
          ) *
          cloudDensity *
          (
            0.08 +
            detail *
            0.86
          );

        float microFilament =
          pow(
            clamp(
              1.0 -
              abs(
                2.0 *
                fine -
                1.0
              ),
              0.0,
              1.0
            ),
            7.2
          ) *
          cloudDensity *
          microDetailGain;

        float hotKnot =
          smoothstep(
            0.78,
            0.95,
            fine *
            0.56 +
            ridge *
            0.44
          ) *
          cloudDensity *
          microDetailGain;

        float excitation =
          clamp(
            sourceExcitation *
            0.62 +
            ionizationFront *
            0.46 +
            shellFront *
            shellStrength *
            0.20 +
            filament *
            0.14,
            0.0,
            1.0
          );

        float chemistry =
          clamp(
            medium *
            0.44 +
            coarse *
            0.24 +
            (
              1.0 -
              excitation
            ) *
            0.32,
            0.0,
            1.0
          );

        vec3 localColor =
          emissionPalette(
            excitation,
            chemistry,
            hotKnot
          );

        float chromaLuminance =
          dot(
            localColor,
            vec3(
              0.2126,
              0.7152,
              0.0722
            )
          );

        localColor =
          mix(
            vec3(
              chromaLuminance *
              0.76
            ),
            localColor,
            chromaGain
          );

        float physicalGain =
          0.72 +
          uPhysical.z *
          0.18 +
          uPhysical.y *
          0.08;

        float emissivity =
          cloudDensity *
          signalGain *
          physicalGain +
          filament *
          signalGain *
          0.22 +
          shellFront *
          shellStrength *
          0.16 +
          microFilament *
          (
            0.18 +
            microDetailGain *
            0.18
          ) +
          hotKnot *
          (
            0.12 +
            microDetailGain *
            0.16
          );

        float frontness =
          z *
          0.5 +
          0.5;

        localColor *=
          mix(
            0.82,
            1.08,
            frontness
          );

        accumulatedColor +=
          localColor *
          emissivity *
          (
            1.0 -
            accumulatedOpacity *
            0.52
          );

        float sliceOpacity =
          clamp(
            emissivity *
            0.26,
            0.0,
            0.34
          );

        accumulatedOpacity +=
          sliceOpacity *
          (
            1.0 -
            accumulatedOpacity
          );

        projectedFilament +=
          (
            filament +
            shellFront *
            shellStrength *
            0.50 +
            microFilament *
            0.76
          ) *
          0.142857;

        projectedDust +=
          obscuration *
          0.142857;
      }

      vec3 background =
        mix(
          vec3(
            0.0014,
            0.0028,
            0.0072
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
            64.0,
            0.979,
            0.105
          ) +
          starLayer(
            uv +
            vec2(
              0.017,
              -0.021
            ),
            106.0,
            0.989,
            0.075
          ) *
          0.62
        ) *
        uStarVisibility;

      vec3 backgroundStarColor =
        mix(
          vec3(
            0.72,
            0.84,
            1.0
          ),
          vec3(
            1.0,
            0.86,
            0.68
          ),
          hash21(
            floor(
              uv *
              323.0
            ) +
            uSeed *
            47.0
          ) *
          0.32
        );

      vec3 color =
        background +
        backgroundStarColor *
        backgroundStars;

      color +=
        accumulatedColor *
        (
          0.42 +
          uPhysical.x *
          0.10
        );

      color *=
        1.0 -
        clamp(
          projectedDust *
          (
            0.18 +
            detail *
            0.22
          ),
          0.0,
          0.42
        );

      vec3 rimColor =
        emissionPalette(
          0.78,
          0.42,
          0.38
        );

      color +=
        rimColor *
        projectedFilament *
        (
          0.08 +
          microDetailGain *
          0.18
        ) *
        signalGain;

      vec2 normalizedScreen =
        point;

      float sourceStar0 =
        exp(
          -dot(
            normalizedScreen -
            uSource0.xy,
            normalizedScreen -
            uSource0.xy
          ) *
          2600.0
        ) *
        uSource0.z;

      float sourceStar1 =
        0.0;

      float sourceStar2 =
        0.0;

      if (
        uSourceCount >
        1.5
      ) {
        sourceStar1 =
          exp(
            -dot(
              normalizedScreen -
              uSource1.xy,
              normalizedScreen -
              uSource1.xy
            ) *
            2600.0
          ) *
          uSource1.z;
      }

      if (
        uSourceCount >
        2.5
      ) {
        sourceStar2 =
          exp(
            -dot(
              normalizedScreen -
              uSource2.xy,
              normalizedScreen -
              uSource2.xy
            ) *
            2600.0
          ) *
          uSource2.z;
      }

      float sourceStars =
        (
          sourceStar0 +
          sourceStar1 +
          sourceStar2
        ) *
        uStarVisibility;

      color +=
        vec3(
          0.92,
          0.97,
          1.0
        ) *
        sourceStars *
        (
          0.22 +
          signalGain *
          0.30
        );

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

      color =
        color /
        (
          color +
          vec3(
            0.86
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
