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
  GlobularClusterRenderModelBuilder,
} from './globular-cluster-render-model';

@Component({
  selector:
    'app-globular-cluster-render',

  standalone:
    true,

  template: `
    <div
      class="globular-cluster"
      data-testid="globular-cluster-render"
      [attr.data-knowledge-level]="descriptor().knowledgeLevel"
      [attr.data-render-profile]="descriptor().renderProfile ?? 'NONE'"
    >
      <canvas
        #canvas
        class="globular-cluster__canvas"
        role="img"
        [attr.aria-label]="descriptor().accessibleLabel"
      ></canvas>

      <div
        class="globular-cluster__optics"
        aria-hidden="true"
      ></div>
    </div>
  `,

  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .globular-cluster {
      position: relative;
      width: 100%;
      min-height: 15rem;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      background: #010207;
    }

    .globular-cluster__canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .globular-cluster__optics {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 49%, transparent 48%, rgba(0, 0, 0, 0.22) 100%);
      box-shadow:
        inset 0 0 2rem rgba(0, 0, 0, 0.32);
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class GlobularClusterRender
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
      GlobularClusterRenderModelBuilder
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
      model.centralConcentration,
    );

    (
      uniforms['uStructure'].value as
        THREE.Vector4
    ).set(
      model.coreRadius,
      model.halfLightRadius,
      model.tidalExtent,
      model.haloFalloff,
    );

    (
      uniforms['uShape'].value as
        THREE.Vector4
    ).set(
      model.ellipticity,
      model.asymmetryStrength,
      model.tidalStretch,
      model.granularCoreStrength,
    );

    (
      uniforms['uPopulation'].value as
        THREE.Vector4
    ).set(
      model.memberRichness,
      model.brightGiantBias,
      model.blueHorizontalBranchBias,
      model.colorVariance,
    );

    (
      uniforms['uPalette'].value as
        THREE.Vector4
    ).set(
      model.paletteIndex,
      model.brightGiantBias,
      model.blueHorizontalBranchBias,
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

    (
      uniforms['uObservation'].value as
        THREE.Vector4
    ).set(
      model.unresolvedGlowVisibility,
      model.opticalGain,
      model.physicalScale,
      model.physicalDensity,
    );

    (
      uniforms['uPhysical'].value as
        THREE.Vector4
    ).set(
      model.physicalEnergy,
      model.physicalConcentration,
      model.physicalScale,
      model.physicalDensity,
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
          0.86,
          0.72,
        ),
    },
    uStructure: {
      value:
        new THREE.Vector4(
          0.16,
          0.38,
          0.92,
          2.1,
        ),
    },
    uShape: {
      value:
        new THREE.Vector4(
          0.06,
          0.06,
          0.05,
          0.5,
        ),
    },
    uPopulation: {
      value:
        new THREE.Vector4(
          0.86,
          0.48,
          0.18,
          0.52,
        ),
    },
    uPalette: {
      value:
        new THREE.Vector4(
          0,
          0.48,
          0.18,
          0.52,
        ),
    },
    uKnowledge: {
      value:
        new THREE.Vector4(
          0.22,
          0.06,
          0.08,
          0.14,
        ),
    },
    uObservation: {
      value:
        new THREE.Vector4(
          0.42,
          0.36,
          0.5,
          0.76,
        ),
    },
    uPhysical: {
      value:
        new THREE.Vector4(
          0.34,
          0.82,
          0.5,
          0.76,
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
    uniform vec4 uShape;
    uniform vec4 uPopulation;
    uniform vec4 uPalette;
    uniform vec4 uKnowledge;
    uniform vec4 uObservation;
    uniform vec4 uPhysical;

    varying vec2 vUv;

    mat2 rotate2d(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat2(c, -s, s, c);
    }

    float hash21(vec2 point) {
      point = fract(
        point *
        vec2(123.34, 456.21)
      );

      point += dot(
        point,
        point +
        45.32 +
        uSeed.x * 9.17 +
        uSeed.y * 13.71
      );

      return fract(
        point.x *
        point.y
      );
    }

    vec2 hash22(vec2 point) {
      return vec2(
        hash21(point),
        hash21(
          point +
          vec2(17.17, 43.43)
        )
      );
    }

    float valueNoise(vec2 point) {
      vec2 integerPart = floor(point);
      vec2 fractionalPart = fract(point);

      fractionalPart =
        fractionalPart *
        fractionalPart *
        (
          3.0 -
          2.0 *
          fractionalPart
        );

      float a = hash21(integerPart);
      float b = hash21(integerPart + vec2(1.0, 0.0));
      float c = hash21(integerPart + vec2(0.0, 1.0));
      float d = hash21(integerPart + vec2(1.0, 1.0));

      return mix(
        mix(a, b, fractionalPart.x),
        mix(c, d, fractionalPart.x),
        fractionalPart.y
      );
    }

    float fbm(vec2 point) {
      float value = 0.0;
      float amplitude = 0.52;
      mat2 transform = mat2(
        0.84,
        -0.54,
        0.54,
        0.84
      );

      for (
        int octave = 0;
        octave < 5;
        octave++
      ) {
        value +=
          amplitude *
          valueNoise(point);

        point =
          transform *
          point *
          2.02 +
          vec2(9.4, -6.7);

        amplitude *= 0.5;
      }

      return value;
    }

    vec2 clusterPoint(vec2 uv) {
      float aspect =
        uResolution.x /
        max(uResolution.y, 1.0);

      vec2 point =
        uv -
        0.5;

      point.x *= aspect;

      point =
        rotate2d(uOrientation) *
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

    float angularDifference(
      float a,
      float b
    ) {
      return abs(
        atan(
          sin(a - b),
          cos(a - b)
        )
      );
    }

    float globularDensity(vec2 point) {
      float type =
        floor(
          uMorphology.x +
          0.5
        );

      float concentration =
        uMorphology.w;

      float coreRadius =
        uStructure.x;

      float halfLightRadius =
        uStructure.y;

      float tidalExtent =
        uStructure.z;

      float haloFalloff =
        uStructure.w;

      float ellipticity =
        uShape.x;

      float asymmetry =
        uShape.y;

      float tidalStretch =
        uShape.z;

      vec2 shifted =
        point -
        (
          uSeed -
          0.5
        ) *
        asymmetry *
        0.16;

      vec2 ellipticalPoint =
        vec2(
          shifted.x *
          (
            1.0 -
            ellipticity *
            0.46
          ),
          shifted.y *
          (
            1.0 +
            ellipticity *
            0.32
          )
        );

      float radius =
        length(
          ellipticalPoint
        );

      float core =
        1.0 /
        (
          1.0 +
          pow(
            radius /
            max(coreRadius, 0.035),
            2.0 +
            concentration *
            1.2
          )
        );

      float body =
        1.0 /
        (
          1.0 +
          pow(
            radius /
            max(halfLightRadius, 0.12),
            2.0 +
            haloFalloff *
            0.46
          )
        );

      float tidalCut =
        1.0 -
        smoothstep(
          tidalExtent *
          0.72,
          tidalExtent,
          radius
        );

      float granular =
        mix(
          0.88,
          1.16,
          fbm(
            ellipticalPoint *
            6.2 +
            uSeed *
            17.0
          )
        );

      float density =
        clamp(
          (
            core *
            (
              0.34 +
              concentration *
              0.72
            ) +
            body *
            0.82
          ) *
          tidalCut *
          granular,
          0.0,
          1.0
        );

      if (
        type > 0.5 &&
        type < 1.5
      ) {
        density =
          clamp(
            density +
            pow(core, 1.8) *
            0.48,
            0.0,
            1.0
          );
      }

      if (
        type > 1.5 &&
        type < 2.5
      ) {
        density =
          clamp(
            density +
            body *
            smoothstep(
              coreRadius * 1.3,
              tidalExtent * 0.92,
              radius
            ) *
            0.18,
            0.0,
            1.0
          );
      }

      if (
        type > 3.5 &&
        type < 4.5
      ) {
        float direction =
          uSeed.x *
          6.28318530718;

        vec2 dir =
          vec2(
            cos(direction),
            sin(direction)
          );

        float along =
          dot(point, dir);

        float across =
          dot(
            point,
            vec2(-dir.y, dir.x)
          );

        float tail =
          exp(
            -abs(across) *
            (
              11.0 -
              tidalStretch *
              3.0
            )
          ) *
          exp(
            -abs(along) *
            1.7
          ) *
          smoothstep(
            halfLightRadius * 0.7,
            tidalExtent * 1.25,
            abs(along)
          );

        density =
          clamp(
            density +
            tail *
            tidalStretch *
            0.34,
            0.0,
            1.0
          );
      }

      if (
        type > 4.5 &&
        type < 5.5
      ) {
        float angle =
          atan(
            point.y,
            point.x
          );

        float preferred =
          uSeed.y *
          6.28318530718;

        float lopsided =
          1.0 +
          cos(
            angularDifference(
              angle,
              preferred
            )
          ) *
          asymmetry *
          0.24;

        density *=
          lopsided;
      }

      if (
        type > 5.5 &&
        type < 6.5
      ) {
        density *=
          mix(
            0.86,
            1.22,
            fbm(
              point *
              13.0 +
              uSeed *
              29.0
            )
          );
      }

      if (
        type > 6.5
      ) {
        density =
          clamp(
            density +
            body *
            smoothstep(
              coreRadius,
              tidalExtent * 0.90,
              radius
            ) *
            0.14,
            0.0,
            1.0
          );
      }

      return clamp(
        density,
        0.0,
        1.0
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

      float giantBias =
        uPalette.y;

      float blueBias =
        uPalette.z;

      float variance =
        uPalette.w;

      vec3 deepBlue =
        vec3(0.20, 0.42, 1.0);

      vec3 blue =
        vec3(0.32, 0.62, 1.0);

      vec3 cyan =
        vec3(0.52, 0.86, 1.0);

      vec3 white =
        vec3(0.98, 0.99, 1.0);

      vec3 ivory =
        vec3(1.0, 0.93, 0.76);

      vec3 gold =
        vec3(1.0, 0.70, 0.28);

      vec3 orange =
        vec3(1.0, 0.39, 0.13);

      vec3 red =
        vec3(1.0, 0.15, 0.08);

      vec3 neutralTint =
        vec3(1.0, 0.94, 0.82);

      if (
        palette <
        0.5
      ) {
        ivory = vec3(1.0, 0.88, 0.62);
        gold = vec3(1.0, 0.62, 0.20);
        orange = vec3(1.0, 0.34, 0.10);
        red = vec3(0.96, 0.13, 0.06);
        neutralTint = vec3(1.0, 0.84, 0.58);
      } else if (
        palette <
        1.5
      ) {
        ivory = vec3(1.0, 0.96, 0.84);
        gold = vec3(1.0, 0.78, 0.40);
        orange = vec3(1.0, 0.50, 0.20);
        neutralTint = vec3(1.0, 0.94, 0.82);
      } else if (
        palette <
        2.5
      ) {
        deepBlue = vec3(0.28, 0.50, 1.0);
        blue = vec3(0.42, 0.68, 1.0);
        cyan = vec3(0.68, 0.90, 1.0);
        ivory = vec3(1.0, 0.96, 0.86);
        gold = vec3(1.0, 0.76, 0.38);
        neutralTint = vec3(0.90, 0.94, 1.0);
      } else if (
        palette <
        3.5
      ) {
        ivory = vec3(1.0, 0.86, 0.66);
        gold = vec3(1.0, 0.56, 0.18);
        orange = vec3(1.0, 0.28, 0.08);
        red = vec3(1.0, 0.10, 0.045);
        neutralTint = vec3(1.0, 0.76, 0.56);
      } else if (
        palette <
        4.5
      ) {
        deepBlue = vec3(0.14, 0.34, 1.0);
        blue = vec3(0.22, 0.55, 1.0);
        cyan = vec3(0.46, 0.86, 1.0);
        white = vec3(0.94, 0.985, 1.0);
        ivory = vec3(1.0, 0.92, 0.76);
        gold = vec3(1.0, 0.70, 0.32);
        neutralTint = vec3(0.76, 0.86, 1.0);
      } else {
        deepBlue = vec3(0.20, 0.42, 0.98);
        blue = vec3(0.32, 0.62, 1.0);
        cyan = vec3(0.58, 0.88, 1.0);
        white = vec3(0.94, 0.975, 1.0);
        ivory = vec3(0.98, 0.93, 0.82);
        gold = vec3(0.92, 0.72, 0.42);
        neutralTint = vec3(0.84, 0.91, 1.0);
      }

      float blueCut =
        clamp(
          0.10 +
          blueBias *
          0.30,
          0.12,
          0.42
        );

      float giantCut =
        clamp(
          0.90 -
          giantBias *
          0.16,
          0.74,
          0.88
        );

      float redCut =
        clamp(
          0.985 -
          giantBias *
          0.10,
          0.86,
          0.96
        );

      vec3 neutral =
        mix(
          white,
          neutralTint,
          0.18 +
          variance *
          0.34 +
          tintRandom *
          0.16
        );

      vec3 color;

      if (
        temperature <
          blueCut *
          0.44
      ) {
        color =
          mix(
            deepBlue,
            blue,
            tintRandom *
            0.72
          );
      } else if (
        temperature <
          blueCut
      ) {
        color =
          mix(
            blue,
            cyan,
            smoothstep(
              blueCut *
              0.44,
              blueCut,
              temperature
            )
          );
      } else if (
        temperature >
          redCut
      ) {
        color =
          mix(
            orange,
            red,
            smoothstep(
              redCut,
              1.0,
              temperature
            )
          );
      } else if (
        temperature >
          giantCut
      ) {
        color =
          mix(
            gold,
            orange,
            smoothstep(
              giantCut,
              redCut,
              temperature
            )
          );
      } else {
        color =
          neutral;
      }

      float spectralVariation =
        (
          tintRandom -
          0.5
        ) *
        variance *
        0.12;

      color +=
        vec3(
          -spectralVariation * 0.12,
          spectralVariation * 0.05,
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
      float densityExponent,
      float layerSalt
    ) {
      float aspect =
        uResolution.x /
        max(uResolution.y, 1.0);

      vec2 aspectVector =
        vec2(aspect, 1.0);

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
        0.80;

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

      float density =
        globularDensity(
          clusterPoint(
            starUv
          )
        );

      float probability =
        backgroundProbability +
        clusterProbability *
        pow(
          density,
          densityExponent
        ) *
        uPopulation.x *
        (
          0.84 +
          uObservation.w *
          0.48
        ) *
        visibility;

      probability =
        clamp(
          probability,
          0.0,
          0.76
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

      float giantSizeBoost =
        smoothstep(
          0.90 -
          uPopulation.y *
          0.16,
          0.985,
          temperature
        );

      float blueSizeBoost =
        1.0 -
        smoothstep(
          0.10 +
          uPopulation.z *
          0.10,
          0.30 +
          uPopulation.z *
          0.16,
          temperature
        );

      float sizeScatter =
        mix(
          0.82,
          1.28,
          hash21(
            cell +
            vec2(
              487.0 +
              layerSalt *
              11.0,
              521.0
            ) +
            uSeed *
            347.0
          )
        );

      float size =
        baseSize *
        mix(
          0.58,
          2.02,
          pow(
            luminosity,
            2.05
          )
        ) *
        sizeScatter *
        (
          1.0 +
          giantSizeBoost *
          0.62 +
          blueSizeBoost *
          0.20
        );

      vec2 delta =
        local -
        offset;

      float radius =
        length(delta);

      float core =
        1.0 -
        smoothstep(
          0.0,
          size,
          radius
        );

      float glow =
        exp(
          -radius *
          radius *
          (
            18.0 /
            max(
              size *
              size,
              0.0005
            )
          )
        );

      vec3 color =
        starColor(
          temperature,
          tint
        );

      float giantBoost =
        smoothstep(
          0.92 -
          uPopulation.y *
          0.08,
          0.995,
          temperature
        );

      float blueBoost =
        1.0 -
        smoothstep(
          0.06 +
          uPopulation.z *
          0.10,
          0.28 +
          uPopulation.z *
          0.12,
          temperature
        );

      float starIntensity =
        selected *
        (
          core *
          (
            0.76 +
            luminosity *
            1.54
          ) +
          glow *
          (
            0.14 +
            luminosity *
            0.32
          )
        ) *
        brightness *
        (
          0.86 +
          uPhysical.y *
          0.18
        ) *
        (
          1.0 +
          giantBoost *
          0.48 +
          blueBoost *
          0.28
        );

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
        max(uResolution.y, 1.0);

      vec2 aspectVector =
        vec2(aspect, 1.0);

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

      float density =
        globularDensity(
          clusterPoint(starUv)
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
          pow(density, 0.82) *
          (
            0.72 +
            uPopulation.x *
            0.42
          ),
          0.0,
          0.16
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

      float featuredGiant =
        smoothstep(
          0.88 -
          uPopulation.y *
          0.14,
          0.98,
          temperature
        );

      float featuredBlue =
        1.0 -
        smoothstep(
          0.12 +
          uPopulation.z *
          0.08,
          0.32 +
          uPopulation.z *
          0.14,
          temperature
        );

      float size =
        mix(
          0.036,
          0.086,
          pow(
            luminosity,
            1.25
          )
        ) *
        (
          1.0 +
          featuredGiant *
          0.68 +
          featuredBlue *
          0.24
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
            1.10 /
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

      vec3 spectralColor =
        starColor(
          temperature,
          tint
        );

      vec3 whiteCore =
        mix(
          vec3(1.0, 0.975, 0.93),
          vec3(0.94, 0.98, 1.0),
          1.0 -
          smoothstep(
            0.38,
            0.72,
            temperature
          )
        );

      float starburst =
        (
          spikeX +
          spikeY +
          diagonalA *
          0.38 +
          diagonalB *
          0.38
        ) *
        uObservation.y *
        (
          0.42 +
          uKnowledge.w *
          0.46
        );

      vec3 result =
        whiteCore *
        core *
        2.72 +
        spectralColor *
        innerGlow *
        1.58 +
        spectralColor *
        outerGlow *
        0.46 +
        mix(
          whiteCore,
          spectralColor,
          0.50
        ) *
        starburst *
        0.54;

      return result *
        selected *
        mix(
          0.58,
          1.0,
          visibility
        ) *
        (
          0.80 +
          luminosity *
          0.54
        );
    }

    void main() {
      vec2 uv = vUv;
      vec2 point = clusterPoint(uv);

      float density =
        globularDensity(point);

      float radius =
        length(point);

      float backgroundNoise =
        fbm(
          uv *
          3.2 +
          uSeed *
          11.0
        );

      vec3 background =
        mix(
          vec3(0.0006, 0.0014, 0.0042),
          vec3(0.0036, 0.0064, 0.0130),
          0.18 +
          backgroundNoise *
          0.28
        );

      float paletteIndex =
        floor(
          uPalette.x +
          0.5
        );

      vec3 populationGlow =
        vec3(0.82, 0.66, 0.42);

      if (
        paletteIndex <
        0.5
      ) {
        populationGlow =
          vec3(0.96, 0.54, 0.22);
      } else if (
        paletteIndex <
        1.5
      ) {
        populationGlow =
          vec3(0.94, 0.76, 0.52);
      } else if (
        paletteIndex <
        2.5
      ) {
        populationGlow =
          vec3(0.70, 0.76, 0.88);
      } else if (
        paletteIndex <
        3.5
      ) {
        populationGlow =
          vec3(0.98, 0.38, 0.16);
      } else if (
        paletteIndex <
        4.5
      ) {
        populationGlow =
          vec3(0.46, 0.66, 0.98);
      } else {
        populationGlow =
          vec3(0.58, 0.72, 0.92);
      }

      populationGlow =
        mix(
          populationGlow,
          vec3(0.92, 0.88, 0.80),
          0.18
        );

      float unresolvedCore =
        pow(
          density,
          1.34 +
          uMorphology.w *
          0.46
        ) *
        uObservation.x;

      float coreGranularity =
        mix(
          0.88,
          1.14,
          fbm(
            point *
            (
              18.0 +
              uShape.w *
              10.0
            ) +
            uSeed *
            37.0
          )
        );

      vec3 color =
        background +
        populationGlow *
        unresolvedCore *
        coreGranularity *
        (
          0.028 +
          uMorphology.w *
          0.025 +
          uPhysical.y *
          0.020
        );

      color += renderStarLayer(
        uv,
        62.0,
        0.42,
        0.0007,
        0.118,
        1.30,
        uKnowledge.x,
        0.56,
        1.0
      );

      color += renderStarLayer(
        uv + vec2(0.0013, -0.0019),
        92.0,
        0.34,
        0.00045,
        0.088,
        1.04,
        mix(
          uKnowledge.x,
          uKnowledge.y,
          0.26
        ),
        0.70,
        2.0
      );

      color += renderStarLayer(
        uv + vec2(-0.0018, 0.0011),
        132.0,
        0.28,
        0.00030,
        0.065,
        0.82,
        mix(
          uKnowledge.x,
          uKnowledge.y,
          0.54
        ),
        0.82,
        3.0
      );

      color += renderStarLayer(
        uv + vec2(0.0026, 0.0016),
        184.0,
        0.22,
        0.00018,
        0.050,
        0.66,
        uKnowledge.y,
        0.94,
        4.0
      );

      color += renderStarLayer(
        uv + vec2(-0.0022, -0.0025),
        252.0,
        0.17,
        0.00010,
        0.038,
        0.50,
        uKnowledge.y,
        1.04,
        5.0
      );

      color += renderStarLayer(
        uv + vec2(0.0010, 0.0031),
        326.0,
        0.12,
        0.00005,
        0.029,
        0.38,
        uKnowledge.y *
        uKnowledge.w,
        1.14,
        6.0
      );

      color += renderFeaturedStarLayer(
        uv,
        24.0,
        0.078,
        uKnowledge.x,
        7.0
      );

      color += renderFeaturedStarLayer(
        uv + vec2(-0.0024, 0.0018),
        38.0,
        0.044,
        mix(
          uKnowledge.x,
          uKnowledge.y,
          0.42
        ),
        8.0
      );

      float centerLift =
        1.0 +
        pow(
          density,
          1.25
        ) *
        (
          0.06 +
          uPhysical.y *
          0.10
        );

      color *= centerLift;

      float vignette =
        1.0 -
        smoothstep(
          0.34,
          0.88,
          length(
            vUv -
            0.5
          )
        ) *
        0.28;

      color *= vignette;

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

      color += grain;
      color = max(color, vec3(0.0));
      color = color / (color + vec3(0.76));
      color = pow(color, vec3(1.0 / 2.2));

      gl_FragColor =
        vec4(color, 1.0);
    }
  `;
