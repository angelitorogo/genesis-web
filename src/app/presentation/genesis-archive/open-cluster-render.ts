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
  OpenClusterRenderModelBuilder,
} from './open-cluster-render-model';

@Component({
  selector:
    'app-open-cluster-render',

  standalone:
    true,

  template: `
    <div
      class="open-cluster"
      data-testid="open-cluster-render"
      [attr.data-knowledge-level]="descriptor().knowledgeLevel"
      [attr.data-render-profile]="descriptor().renderProfile ?? 'NONE'"
    >
      <canvas
        #canvas
        class="open-cluster__canvas"
        role="img"
        [attr.aria-label]="descriptor().accessibleLabel"
      ></canvas>

      <div
        class="open-cluster__optics"
        aria-hidden="true"
      ></div>
    </div>
  `,

  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .open-cluster {
      position: relative;
      width: 100%;
      min-height: 15rem;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      background: #010207;
    }

    .open-cluster__canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .open-cluster__optics {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 49%, transparent 50%, rgba(0, 0, 0, 0.24) 100%);
      box-shadow:
        inset 0 0 2.0rem rgba(0, 0, 0, 0.34);
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OpenClusterRender
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
        this.canvasRef.nativeElement;

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

      this.renderer.setPixelRatio(
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
        1.02;

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

      this.resizeObserver.observe(
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
      OpenClusterRenderModelBuilder
        .build(
          descriptor,
        );

    const uniforms =
      this.material.uniforms;

    (
      uniforms['uSeed'].value as
        THREE.Vector2
    ).set(
      model.structureSeedX,
      model.structureSeedY,
    );

    uniforms['uOrientation'].value =
      model.orientationRadians;

    (
      uniforms['uMorphology'].value as
        THREE.Vector4
    ).set(
      model.morphologyIndex,
      model.structureAspect,
      model.apparentExtent,
      model.concentrationBias,
    );

    (
      uniforms['uStructure'].value as
        THREE.Vector4
    ).set(
      model.subclusterStrength,
      model.asymmetryStrength,
      model.elongationStrength,
      model.haloStrength,
    );

    (
      uniforms['uMembership'].value as
        THREE.Vector4
    ).set(
      model.chainStrength,
      model.memberRichness,
      model.brightMemberBias,
      model.binaryHint,
    );

    (
      uniforms['uPalette'].value as
        THREE.Vector4
    ).set(
      model.paletteIndex,
      model.hotStarBias,
      model.warmStarBias,
      model.colorVariance,
    );

    (
      uniforms['uKnowledge'].value as
        THREE.Vector4
    ).set(
      model.memberVisibility,
      model.faintMemberVisibility,
      model.chromaGain,
      model.detailFactor,
    );

    uniforms['uHaze'].value =
      model.hazeStrength *
      model.hazeVisibility;

    (
      uniforms['uPhysical'].value as
        THREE.Vector4
    ).set(
      model.physicalScale,
      model.physicalDensity,
      model.physicalEnergy,
      model.physicalConcentration,
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
      this.canvasRef.nativeElement;

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

    this.renderer.setSize(
      width,
      height,
      false,
    );

    (
      this.material
        .uniforms['uResolution'].value as
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
    uMorphology: {
      value:
        new THREE.Vector4(
          0,
          1,
          1,
          0.4,
        ),
    },
    uStructure: {
      value:
        new THREE.Vector4(
          0.3,
          0.2,
          0.2,
          0.5,
        ),
    },
    uMembership: {
      value:
        new THREE.Vector4(
          0.2,
          0.7,
          0.3,
          0.5,
        ),
    },
    uPalette: {
      value:
        new THREE.Vector4(
          0,
          0.8,
          0.08,
          0.4,
        ),
    },
    uKnowledge: {
      value:
        new THREE.Vector4(
          0.24,
          0.08,
          0.08,
          0.14,
        ),
    },
    uHaze: {
      value:
        0.02,
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
    uniform vec4 uMorphology;
    uniform vec4 uStructure;
    uniform vec4 uMembership;
    uniform vec4 uPalette;
    uniform vec4 uKnowledge;
    uniform float uHaze;
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
        hash21(point),
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
          valueNoise(point);

        point =
          transform *
          point *
          2.02 +
          vec2(
            9.4,
            -6.7
          );

        amplitude *=
          0.5;
      }

      return value;
    }

    vec2 clusterPoint(
      vec2 uv
    ) {
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
        uMorphology.y;

      point /=
        max(
          uMorphology.z,
          0.001
        );

      return point;
    }

    float gaussianBlob(
      vec2 point,
      vec2 center,
      vec2 radius
    ) {
      vec2 local =
        (
          point -
          center
        ) /
        max(
          radius,
          vec2(0.001)
        );

      return exp(
        -dot(
          local,
          local
        ) *
        2.15
      );
    }

    float clusterEnvelope(
      vec2 point
    ) {
      float type =
        floor(
          uMorphology.x +
          0.5
        );

      float concentration =
        uMorphology.w;

      float subclusters =
        uStructure.x;

      float asymmetry =
        uStructure.y;

      float elongation =
        uStructure.z;

      float halo =
        uStructure.w;

      float chain =
        uMembership.x;

      vec2 seedShift =
        (
          uSeed -
          0.5
        ) *
        0.18;

      float broad =
        gaussianBlob(
          point,
          seedShift *
          asymmetry,
          vec2(
            0.54 +
            halo *
            0.18 +
            elongation *
            0.12,
            0.46 +
            halo *
            0.16
          )
        );

      float compact =
        gaussianBlob(
          point,
          seedShift *
          0.42,
          vec2(
            0.22 +
            (1.0 - concentration) *
            0.12,
            0.20 +
            (1.0 - concentration) *
            0.10
          )
        );

      vec2 a =
        vec2(
          -0.25 +
          (uSeed.x - 0.5) *
          0.12,
          0.12 +
          (uSeed.y - 0.5) *
          0.12
        );

      vec2 b =
        vec2(
          0.22 +
          (uSeed.y - 0.5) *
          0.12,
          -0.14 +
          (uSeed.x - 0.5) *
          0.10
        );

      vec2 c =
        vec2(
          0.04 +
          (uSeed.x - uSeed.y) *
          0.12,
          0.26 -
          (uSeed.x - 0.5) *
          0.10
        );

      float multi =
        max(
          gaussianBlob(
            point,
            a,
            vec2(0.34)
          ),
          max(
            gaussianBlob(
              point,
              b,
              vec2(0.32)
            ),
            gaussianBlob(
              point,
              c,
              vec2(0.28)
            )
          )
        );

      float chainCenter =
        point.y -
        sin(
          point.x *
          4.2 +
          uSeed.x *
          5.0
        ) *
        (
          0.08 +
          chain *
          0.10
        );

      float chainBand =
        exp(
          -abs(
            chainCenter
          ) *
          (
            7.0 +
            chain *
            5.0
          )
        ) *
        exp(
          -abs(point.x) *
          1.25
        );

      float tail =
        broad *
        smoothstep(
          -0.48,
          0.44,
          point.x +
          point.y *
          0.26 +
          (uSeed.x - 0.5) *
          0.20
        );

      float haloProfile =
        max(
          compact *
          0.96,
          broad *
          (
            0.42 +
            halo *
            0.28
          )
        );

      if (
        type <
        0.5
      ) {
        return max(
          broad *
          0.72,
          compact *
          0.36
        );
      }

      if (
        type <
        1.5
      ) {
        return max(
          compact,
          broad *
          0.16
        );
      }

      if (
        type <
        2.5
      ) {
        vec2 stretched =
          vec2(
            point.x *
            (
              0.66 -
              elongation *
              0.12
            ),
            point.y *
            1.22
          );

        return max(
          gaussianBlob(
            stretched,
            seedShift *
            0.3,
            vec2(
              0.54,
              0.30
            )
          ),
          compact *
          0.22
        );
      }

      if (
        type <
        3.5
      ) {
        return max(
          broad *
          0.16 +
          compact *
          0.10,
          multi *
          (
            0.74 +
            subclusters *
            0.20
          )
        );
      }

      if (
        type <
        4.5
      ) {
        return max(
          compact *
          0.18,
          chainBand *
          (
            0.74 +
            chain *
            0.22
          )
        );
      }

      if (
        type <
        5.5
      ) {
        return max(
          tail,
          gaussianBlob(
            point,
            a *
            0.68,
            vec2(
              0.34,
              0.28
            )
          ) *
          0.72
        );
      }

      if (
        type <
        6.5
      ) {
        return haloProfile;
      }

      float twoCore =
        max(
          gaussianBlob(
            point,
            vec2(
              -0.24,
              0.05
            ) +
            seedShift *
            0.5,
            vec2(
              0.34,
              0.30
            )
          ),
          gaussianBlob(
            point,
            vec2(
              0.26,
              -0.06
            ) -
            seedShift *
            0.4,
            vec2(
              0.32,
              0.28
            )
          )
        );

      return max(
        twoCore,
        broad *
        0.14 +
        compact *
        0.14
      );
    }

    vec3 starColor(
      float temperature,
      float tintRandom
    ) {
      float palette =
        floor(
          uPalette.x +
          0.5
        );

      float hotBias =
        uPalette.y;

      float warmBias =
        uPalette.z;

      float variance =
        uPalette.w;

      vec3 deepBlue =
        vec3(
          0.26,
          0.54,
          1.0
        );

      vec3 blue =
        vec3(
          0.40,
          0.70,
          1.0
        );

      vec3 cyan =
        vec3(
          0.56,
          0.90,
          1.0
        );

      vec3 white =
        vec3(
          0.98,
          0.99,
          1.0
        );

      vec3 ivory =
        vec3(
          1.0,
          0.94,
          0.82
        );

      vec3 gold =
        vec3(
          1.0,
          0.74,
          0.38
        );

      vec3 orange =
        vec3(
          1.0,
          0.46,
          0.20
        );

      vec3 red =
        vec3(
          1.0,
          0.24,
          0.14
        );

      vec3 violet =
        vec3(
          0.70,
          0.66,
          1.0
        );

      if (
        palette >
        0.5 &&
        palette <
        1.5
      ) {
        deepBlue = vec3(
          0.20,
          0.62,
          1.0
        );
        blue = vec3(
          0.34,
          0.82,
          1.0
        );
        cyan = vec3(
          0.70,
          0.97,
          1.0
        );
        ivory = vec3(
          0.96,
          0.98,
          0.94
        );
      } else if (
        palette >
        1.5 &&
        palette <
        2.5
      ) {
        deepBlue = vec3(
          0.28,
          0.52,
          1.0
        );
        blue = vec3(
          0.42,
          0.70,
          1.0
        );
        gold = vec3(
          1.0,
          0.82,
          0.50
        );
        orange = vec3(
          1.0,
          0.52,
          0.24
        );
      } else if (
        palette >
        2.5 &&
        palette <
        3.5
      ) {
        deepBlue = vec3(
          0.22,
          0.48,
          1.0
        );
        blue = vec3(
          0.30,
          0.64,
          1.0
        );
        gold = vec3(
          1.0,
          0.68,
          0.30
        );
        orange = vec3(
          1.0,
          0.42,
          0.16
        );
        red = vec3(
          1.0,
          0.20,
          0.12
        );
      } else if (
        palette >
        3.5 &&
        palette <
        4.5
      ) {
        deepBlue = vec3(
          0.42,
          0.48,
          1.0
        );
        blue = vec3(
          0.48,
          0.62,
          1.0
        );
        cyan = violet;
        white = vec3(
          0.96,
          0.96,
          1.0
        );
      } else if (
        palette >
        4.5
      ) {
        deepBlue = vec3(
          0.34,
          0.54,
          0.94
        );
        blue = vec3(
          0.48,
          0.68,
          0.94
        );
        ivory = vec3(
          1.0,
          0.92,
          0.78
        );
        gold = vec3(
          1.0,
          0.72,
          0.40
        );
        orange = vec3(
          0.98,
          0.42,
          0.20
        );
        red = vec3(
          1.0,
          0.22,
          0.15
        );
      }

      float hotCut =
        clamp(
          0.34 +
          hotBias *
          0.46,
          0.52,
          0.78
        );

      float warmCut =
        clamp(
          0.965 -
          warmBias *
          0.22,
          0.82,
          0.95
        );

      float redCut =
        clamp(
          0.995 -
          warmBias *
          0.08 -
          variance *
          0.025,
          0.925,
          0.985
        );

      float hotCoreCut =
        hotCut *
        (
          0.40 +
          variance *
          0.06
        );

      vec3 neutral =
        mix(
          white,
          ivory,
          smoothstep(
            hotCut,
            warmCut,
            temperature
          ) *
          (
            0.10 +
            variance *
            0.26
          )
        );

      vec3 color =
        temperature <
          hotCoreCut
          ? mix(
              deepBlue,
              blue,
              tintRandom *
              0.56
            )
          : temperature <
              hotCut
            ? mix(
                cyan,
                white,
                tintRandom *
                0.74
              )
            : temperature >
                redCut
              ? mix(
                  orange,
                  red,
                  smoothstep(
                    redCut,
                    1.0,
                    temperature
                  ) *
                  (
                    0.70 +
                    tintRandom *
                    0.30
                  )
                )
              : temperature >
                  warmCut
                ? mix(
                    gold,
                    orange,
                    smoothstep(
                      warmCut,
                      redCut,
                      temperature
                    )
                  )
                : neutral;

      float spectralVariation =
        (
          tintRandom -
          0.5
        ) *
        variance *
        0.10;

      color +=
        vec3(
          -spectralVariation *
            0.20,
          spectralVariation *
            0.10,
          spectralVariation
        );

      color =
        max(
          color,
          vec3(0.0)
        );

      float luminance =
        dot(
          color,
          vec3(
            0.2126,
            0.7152,
            0.0722
          )
        );

      return mix(
        vec3(luminance),
        color,
        uKnowledge.z
      );
    }

    vec3 renderStarLayer(
      vec2 uv,
      float gridScale,
      float clusterProbability,
      float backgroundProbability,
      float baseSize,
      float brightness,
      float visibility,
      float layerSalt
    ) {
      float aspect =
        uResolution.x /
        max(
          uResolution.y,
          1.0
        );

      vec2 aspectVector =
        vec2(
          aspect,
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
            (
              71.0 +
              layerSalt *
              37.0
            )
          ) -
          0.5
        ) *
        0.78;

      vec2 starUv =
        (
          cell +
          offset +
          0.5
        ) /
        max(
          aspectVector *
          gridScale,
          vec2(0.001)
        );

      float envelope =
        clamp(
          clusterEnvelope(
            clusterPoint(
              starUv
            )
          ),
          0.0,
          1.0
        );

      float memberRichness =
        uMembership.y;

      float densityGain =
        0.88 +
        uPhysical.y *
        0.54;

      float clusterDensity =
        mix(
          pow(
            envelope,
            1.45
          ),
          envelope,
          0.30 +
          uMorphology.w *
          0.34
        );

      float probability =
        backgroundProbability +
        clusterProbability *
        clusterDensity *
        memberRichness *
        densityGain *
        visibility;

      probability =
        clamp(
          probability,
          0.0,
          0.54
        );

      float selector =
        hash21(
          cell +
          vec2(
            13.0 +
            layerSalt *
            23.0,
            41.0 +
            layerSalt *
            17.0
          ) +
          uSeed *
          157.0
        );

      float selected =
        step(
          1.0 -
          probability,
          selector
        );

      float luminosity =
        hash21(
          cell +
          vec2(
            101.0 +
            layerSalt *
            13.0,
            211.0
          ) +
          uSeed *
          271.0
        );

      float brightBias =
        uMembership.z;

      float bright =
        smoothstep(
          0.92 -
          brightBias *
          0.06,
          0.998,
          luminosity
        );

      float size =
        baseSize *
        mix(
          0.68,
          1.92,
          pow(
            luminosity,
            2.2
          )
        );

      vec2 starDelta =
        local -
        offset;

      float distanceToStar =
        length(
          starDelta
        );

      float core =
        1.0 -
        smoothstep(
          0.0,
          size,
          distanceToStar
        );

      float glow =
        exp(
          -distanceToStar *
          distanceToStar *
          (
            22.0 /
            max(
              size *
              size,
              0.0005
            )
          )
        ) *
        (
          0.18 +
          bright *
          0.46
        );

      float spikeX =
        exp(
          -abs(
            starDelta.y
          ) *
          115.0
        ) *
        exp(
          -abs(
            starDelta.x
          ) *
          8.0
        );

      float spikeY =
        exp(
          -abs(
            starDelta.x
          ) *
          115.0
        ) *
        exp(
          -abs(
            starDelta.y
          ) *
          8.0
        );

      float diagonalA =
        exp(
          -abs(
            starDelta.x +
            starDelta.y
          ) *
          62.0
        ) *
        exp(
          -abs(
            starDelta.x -
            starDelta.y
          ) *
          8.0
        );

      float diagonalB =
        exp(
          -abs(
            starDelta.x -
            starDelta.y
          ) *
          62.0
        ) *
        exp(
          -abs(
            starDelta.x +
            starDelta.y
          ) *
          8.0
        );

      float halo =
        exp(
          -distanceToStar *
          distanceToStar *
          (
            6.8 /
            max(
              size *
              size,
              0.0005
            )
          )
        ) *
        (
          0.10 +
          bright *
          0.34
        );

      float diffraction =
        (
          spikeX +
          spikeY +
          diagonalA *
          0.54 +
          diagonalB *
          0.54
        ) *
        bright *
        uKnowledge.w *
        0.38;

      float temperature =
        hash21(
          cell +
          vec2(
            307.0,
            173.0 +
            layerSalt *
            31.0
          ) +
          uSeed *
          331.0
        );

      float tint =
        hash21(
          cell +
          vec2(
            389.0 +
            layerSalt *
            7.0,
            443.0
          )
        );

      vec3 color =
        starColor(
          temperature,
          tint
        );

      float spectralHotBoost =
        1.0 -
        smoothstep(
          0.24,
          0.52,
          temperature
        );

      float spectralWarmBoost =
        smoothstep(
          0.88 -
          uPalette.z *
          0.12,
          0.99,
          temperature
        );

      float spectralBrightness =
        1.0 +
        spectralHotBoost *
        (
          0.10 +
          uPalette.y *
          0.10
        ) +
        spectralWarmBoost *
        (
          0.08 +
          uPalette.z *
          0.18
        );

      float physicalBrightness =
        0.82 +
        uPhysical.z *
        0.24;

      float starIntensity =
        selected *
        (
          core *
          (
            0.78 +
            luminosity *
            1.72
          ) +
          glow +
          halo +
          diffraction
        ) *
        brightness *
        physicalBrightness *
        spectralBrightness;

      return color *
        starIntensity;
    }

    vec3 renderFeaturedStarLayer(
      vec2 uv,
      float gridScale,
      float clusterProbability,
      float visibility,
      float layerSalt
    ) {
      float aspect =
        uResolution.x /
        max(
          uResolution.y,
          1.0
        );

      vec2 aspectVector =
        vec2(
          aspect,
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
            vec2(
              71.0 +
              layerSalt *
              41.0,
              113.0 +
              layerSalt *
              29.0
            ) +
            uSeed *
            233.0
          ) -
          0.5
        ) *
        0.68;

      vec2 starUv =
        (
          cell +
          offset +
          0.5
        ) /
        max(
          aspectVector *
          gridScale,
          vec2(0.001)
        );

      float envelope =
        clamp(
          clusterEnvelope(
            clusterPoint(
              starUv
            )
          ),
          0.0,
          1.0
        );

      float selector =
        hash21(
          cell +
          vec2(
            317.0 +
            layerSalt *
            13.0,
            509.0 +
            layerSalt *
            17.0
          ) +
          uSeed *
          419.0
        );

      float probability =
        clamp(
          clusterProbability *
          pow(
            envelope,
            1.18
          ) *
          (
            0.72 +
            uMembership.y *
            0.44
          ) *
          (
            0.74 +
            uMorphology.w *
            0.26
          ),
          0.0,
          0.12
        );

      float selected =
        step(
          1.0 -
          probability,
          selector
        );

      float luminosity =
        hash21(
          cell +
          vec2(
            601.0 +
            layerSalt *
            23.0,
            727.0
          ) +
          uSeed *
          557.0
        );

      float size =
        mix(
          0.046,
          0.088,
          pow(
            luminosity,
            1.35
          )
        );

      vec2 delta =
        local -
        offset;

      float radius =
        length(delta);

      float core =
        exp(
          -radius *
          radius *
          (
            5.2 /
            max(
              size *
              size,
              0.0006
            )
          )
        );

      float innerGlow =
        exp(
          -radius *
          radius *
          (
            1.15 /
            max(
              size *
              size,
              0.0008
            )
          )
        );

      float outerGlow =
        exp(
          -radius *
          radius *
          (
            0.22 /
            max(
              size *
              size,
              0.0010
            )
          )
        );

      float spikeX =
        exp(
          -abs(delta.y) *
          145.0
        ) *
        exp(
          -abs(delta.x) *
          6.2
        );

      float spikeY =
        exp(
          -abs(delta.x) *
          145.0
        ) *
        exp(
          -abs(delta.y) *
          6.2
        );

      float diagonalA =
        exp(
          -abs(
            delta.x +
            delta.y
          ) *
          92.0
        ) *
        exp(
          -abs(
            delta.x -
            delta.y
          ) *
          8.0
        );

      float diagonalB =
        exp(
          -abs(
            delta.x -
            delta.y
          ) *
          92.0
        ) *
        exp(
          -abs(
            delta.x +
            delta.y
          ) *
          8.0
        );

      float temperature =
        hash21(
          cell +
          vec2(
            809.0,
            911.0 +
            layerSalt *
            19.0
          ) +
          uSeed *
          613.0
        );

      float tint =
        hash21(
          cell +
          vec2(
            1013.0 +
            layerSalt *
            7.0,
            1129.0
          )
        );

      vec3 spectralColor =
        starColor(
          temperature,
          tint
        );

      vec3 whiteCore =
        mix(
          vec3(
            1.0,
            0.985,
            0.955
          ),
          vec3(
            0.94,
            0.98,
            1.0
          ),
          1.0 -
          smoothstep(
            0.42,
            0.76,
            temperature
          )
        );

      float knowledgeGain =
        mix(
          0.58,
          1.0,
          visibility
        );

      float sparkleGain =
        0.54 +
        uKnowledge.w *
        0.46;

      float starburst =
        (
          spikeX +
          spikeY +
          diagonalA *
          0.42 +
          diagonalB *
          0.42
        ) *
        sparkleGain;

      vec3 result =
        whiteCore *
        core *
        3.25 +
        spectralColor *
        innerGlow *
        1.35 +
        spectralColor *
        outerGlow *
        0.34 +
        mix(
          whiteCore,
          spectralColor,
          0.48
        ) *
        starburst *
        0.56;

      return result *
        selected *
        knowledgeGain *
        (
          0.82 +
          luminosity *
          0.58
        );
    }

    void main() {
      vec2 uv =
        vUv;

      vec2 point =
        clusterPoint(uv);

      float envelope =
        clamp(
          clusterEnvelope(point),
          0.0,
          1.0
        );

      float backgroundNoise =
        fbm(
          uv *
          3.2 +
          uSeed *
          11.0
        );

      vec3 background =
        mix(
          vec3(
            0.0008,
            0.0018,
            0.0052
          ),
          vec3(
            0.0048,
            0.0084,
            0.0170
          ),
          0.22 +
          backgroundNoise *
          0.32
        );

      float hazeNoise =
        fbm(
          point *
          5.2 +
          uSeed *
          17.0
        );

      float hazeStructure =
        pow(
          envelope,
          1.8
        ) *
        smoothstep(
          0.46,
          0.86,
          hazeNoise
        ) *
        uHaze;

      vec3 hazeColor =
        mix(
          vec3(
            0.030,
            0.038,
            0.060
          ),
          vec3(
            0.080,
            0.098,
            0.140
          ),
          uPalette.y *
          0.55
        );

      vec3 clusterSheen =
        mix(
          vec3(
            0.012,
            0.016,
            0.024
          ),
          vec3(
            0.028,
            0.032,
            0.045
          ),
          uPalette.z *
          0.45
        );

      vec3 color =
        background +
        hazeColor *
        hazeStructure *
        (
          0.04 +
          uKnowledge.z *
          0.14
        ) +
        clusterSheen *
        pow(
          envelope,
          1.55
        ) *
        (
          0.02 +
          uKnowledge.w *
          0.04
        );

      color +=
        renderStarLayer(
          uv,
          66.0,
          0.118,
          0.0014,
          0.126,
          1.42,
          uKnowledge.x,
          1.0
        );

      color +=
        renderStarLayer(
          uv +
          vec2(
            0.0017,
            -0.0021
          ),
          104.0,
          0.086,
          0.0011,
          0.094,
          1.08,
          mix(
            uKnowledge.x,
            uKnowledge.y,
            0.44
          ),
          2.0
        );

      color +=
        renderStarLayer(
          uv +
          vec2(
            -0.0023,
            0.0011
          ),
          154.0,
          0.060,
          0.0008,
          0.068,
          0.78,
          uKnowledge.y,
          3.0
        );

      color +=
        renderStarLayer(
          uv +
          vec2(
            0.0031,
            0.0027
          ),
          214.0,
          0.044,
          0.0004,
          0.050,
          0.56,
          uKnowledge.y *
          uKnowledge.w,
          4.0
        );

      /*
       * V1.3 optical refinement: rare, seed-fixed bright members receive a
       * telescope-like bloom plus restrained diffraction spikes. These are
       * stellar optics, not nebular emission or a new physical object layer.
       */
      color +=
        renderFeaturedStarLayer(
          uv,
          22.0,
          0.058,
          uKnowledge.x,
          5.0
        );

      color +=
        renderFeaturedStarLayer(
          uv +
          vec2(
            -0.0028,
            0.0019
          ),
          36.0,
          0.030,
          mix(
            uKnowledge.x,
            uKnowledge.y,
            0.35
          ),
          6.0
        );

      float localBrightness =
        1.0 +
        envelope *
        (
          0.04 +
          uPhysical.w *
          0.09
        );

      color *=
        localBrightness;

      float vignette =
        1.0 -
        smoothstep(
          0.30,
          0.86,
          length(
            vUv -
            0.5
          )
        ) *
        0.30;

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
          vec3(0.0)
        );

      color =
        color /
        (
          color +
          vec3(0.78)
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
