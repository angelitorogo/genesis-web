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
  SupernovaRemnantRenderModelBuilder,
  type SupernovaRemnantPaletteFamily,
} from './supernova-remnant-render-model';

@Component({
  selector:
    'app-supernova-remnant-render',

  standalone:
    true,

  template: `
    <div
      class="supernova-remnant"
      data-testid="supernova-remnant-render"
      [attr.data-knowledge-level]="descriptor().knowledgeLevel"
      [attr.data-snr-variant]="descriptor().variant ?? 'GENERIC'"
    >
      <canvas
        #canvas
        class="supernova-remnant__canvas"
        role="img"
        [attr.aria-label]="descriptor().accessibleLabel"
      ></canvas>

      <div
        class="supernova-remnant__optics"
        aria-hidden="true"
      ></div>
    </div>
  `,

  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .supernova-remnant {
      position: relative;
      width: 100%;
      min-height: 15rem;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      background: #010207;
    }

    .supernova-remnant__canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .supernova-remnant__optics {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        radial-gradient(circle at 50% 50%, transparent 44%, rgba(0, 0, 0, 0.22) 100%);
      box-shadow:
        inset 0 0 2.8rem rgba(0, 0, 0, 0.42),
        inset 0 0 7rem rgba(0, 10, 26, 0.18);
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class SupernovaRemnantRender
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
          window.devicePixelRatio || 1,
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
      SupernovaRemnantRenderModelBuilder
        .build(
          descriptor,
        );

    const palette =
      paletteFor(
        model.paletteFamily,
      );

    const uniforms =
      this.material.uniforms;

    (
      uniforms['uResolution'].value as
        THREE.Vector2
    ).set(
      this.canvasRef.nativeElement.clientWidth || 640,
      this.canvasRef.nativeElement.clientHeight || 360,
    );

    (
      uniforms['uSeed'].value as
        THREE.Vector2
    ).set(
      model.structureSeedX,
      model.structureSeedY,
    );

    uniforms['uOrientation'].value =
      model.orientationRadians;

    uniforms['uScientificMorphology'].value =
      model.scientificMorphology === 'SHELL'
        ? 0
        : model.scientificMorphology === 'PLERION'
          ? 1
          : 2;

    (
      uniforms['uMorphology'].value as
        THREE.Vector4
    ).set(
      model.morphologyIndex,
      model.structureAspect,
      model.apparentExtent,
      model.shellRadius,
    );

    (
      uniforms['uShell'].value as
        THREE.Vector4
    ).set(
      model.shellThickness,
      model.shellSharpness,
      model.filamentStrength,
      model.clumpiness,
    );

    (
      uniforms['uShapeA'].value as
        THREE.Vector4
    ).set(
      model.fragmentation,
      model.interiorGlow,
      model.haloStrength,
      model.bilobedStrength,
    );

    (
      uniforms['uShapeB'].value as
        THREE.Vector4
    ).set(
      model.asymmetryStrength,
      model.jetStrength,
      model.centralEngineStrength,
      model.ringBreakup,
    );

    (
      uniforms['uOffsets'].value as
        THREE.Vector2
    ).set(
      model.coreOffsetX,
      model.coreOffsetY,
    );

    (
      uniforms['uKnowledge'].value as
        THREE.Vector4
    ).set(
      model.shellVisibility,
      model.filamentVisibility,
      model.interiorVisibility,
      model.haloVisibility,
    );

    (
      uniforms['uDetail'].value as
        THREE.Vector4
    ).set(
      model.chromaGain,
      model.detailFactor,
      model.starVisibility,
      model.shockContrast,
    );

    (
      uniforms['uPhysical'].value as
        THREE.Vector4
    ).set(
      model.physicalScale,
      model.physicalDensity,
      model.physicalEnergy,
      model.physicalConcentration,
    );

    uniforms['uColorVariance'].value =
      model.colorVariance;

    applyColor(
      uniforms['uBackground'].value as THREE.Color,
      palette.background,
    );

    applyColor(
      uniforms['uShellHot'].value as THREE.Color,
      palette.shellHot,
    );

    applyColor(
      uniforms['uShellCool'].value as THREE.Color,
      palette.shellCool,
    );

    applyColor(
      uniforms['uCore'].value as THREE.Color,
      palette.core,
    );

    applyColor(
      uniforms['uHalo'].value as THREE.Color,
      palette.halo,
    );

    this.renderOnce();
  }

  private resizeAndRender(): void {

    if (
      this.renderer === null ||
      this.material === null
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
      this.renderer === null ||
      this.scene === null ||
      this.camera === null
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

interface PaletteVectors {
  readonly background: string;
  readonly shellHot: string;
  readonly shellCool: string;
  readonly core: string;
  readonly halo: string;
}

function paletteFor(
  family:
    SupernovaRemnantPaletteFamily,
): PaletteVectors {

  switch (
    family
  ) {
    case 'CYAN_CRIMSON':
      return Object.freeze({
        background: '#02050B',
        shellHot: '#F04C74',
        shellCool: '#52D8F6',
        core: '#9FDBFF',
        halo: '#5C7CFF',
      });

    case 'TEAL_GOLD':
      return Object.freeze({
        background: '#02050A',
        shellHot: '#F2A95A',
        shellCool: '#5DE1D8',
        core: '#FFF0C0',
        halo: '#63C3C8',
      });

    case 'AMBER_BLUE':
      return Object.freeze({
        background: '#03050A',
        shellHot: '#FF8A4C',
        shellCool: '#4AB7FF',
        core: '#FFE7C6',
        halo: '#7B9BFF',
      });

    case 'MAGENTA_VIOLET':
      return Object.freeze({
        background: '#04030A',
        shellHot: '#F265C8',
        shellCool: '#8E7DFF',
        core: '#FFD6F4',
        halo: '#4C5BCB',
      });

    case 'EMERALD_GOLD':
      return Object.freeze({
        background: '#02050A',
        shellHot: '#FFC95D',
        shellCool: '#52D77E',
        core: '#FFF7D0',
        halo: '#77CBA2',
      });

    case 'FIRE_ICE':
      return Object.freeze({
        background: '#03040A',
        shellHot: '#FF6E3A',
        shellCool: '#B9F3FF',
        core: '#FDFDFF',
        halo: '#6E8CFF',
      });

    case 'SPECTRAL':
      return Object.freeze({
        background: '#03040B',
        shellHot: '#F37A56',
        shellCool: '#65D7FF',
        core: '#FFFFFF',
        halo: '#A65EFF',
      });
  }
}

function applyColor(
  color:
    THREE.Color,

  hex:
    string,
): void {

  color.set(
    hex,
  );
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
    uScientificMorphology: {
      value:
        0,
    },
    uMorphology: {
      value:
        new THREE.Vector4(
          0,
          1,
          0.90,
          0.50,
        ),
    },
    uShell: {
      value:
        new THREE.Vector4(
          0.06,
          0.72,
          0.56,
          0.48,
        ),
    },
    uShapeA: {
      value:
        new THREE.Vector4(
          0.52,
          0.36,
          0.34,
          0.08,
        ),
    },
    uShapeB: {
      value:
        new THREE.Vector4(
          0.20,
          0.06,
          0.10,
          0.46,
        ),
    },
    uOffsets: {
      value:
        new THREE.Vector2(
          0,
          0,
        ),
    },
    uKnowledge: {
      value:
        new THREE.Vector4(
          0.30,
          0.10,
          0.14,
          0.12,
        ),
    },
    uDetail: {
      value:
        new THREE.Vector4(
          0.32,
          0.18,
          0.24,
          0.72,
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
    uColorVariance: {
      value:
        0.7,
    },
    uBackground: {
      value:
        new THREE.Color(
          '#02050B',
        ),
    },
    uShellHot: {
      value:
        new THREE.Color(
          '#F04C74',
        ),
    },
    uShellCool: {
      value:
        new THREE.Color(
          '#52D8F6',
        ),
    },
    uCore: {
      value:
        new THREE.Color(
          '#9FDBFF',
        ),
    },
    uHalo: {
      value:
        new THREE.Color(
          '#5C7CFF',
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
    uniform float uScientificMorphology;
    uniform vec4 uMorphology;
    uniform vec4 uShell;
    uniform vec4 uShapeA;
    uniform vec4 uShapeB;
    uniform vec2 uOffsets;
    uniform vec4 uKnowledge;
    uniform vec4 uDetail;
    uniform vec4 uPhysical;
    uniform float uColorVariance;
    uniform vec3 uBackground;
    uniform vec3 uShellHot;
    uniform vec3 uShellCool;
    uniform vec3 uCore;
    uniform vec3 uHalo;

    varying vec2 vUv;

    mat2 rotate2d(float angle) {
      float s = sin(angle);
      float c = cos(angle);
      return mat2(c, -s, s, c);
    }

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);

      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);

      return mix(a, b, u.x) +
        (c - a) * u.y * (1.0 - u.x) +
        (d - b) * u.x * u.y;
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;

      for (int octave = 0; octave < 5; octave += 1) {
        value += amplitude * noise(p);
        p = p * 2.03 + vec2(17.13, 9.71);
        amplitude *= 0.55;
      }

      return value;
    }

    float starField(vec2 uv, float density) {
      vec2 grid = uv * (44.0 + density * 52.0);
      vec2 cell = floor(grid);
      vec2 local = fract(grid) - 0.5;
      float rnd = hash21(cell + uSeed * 31.7);
      float star = smoothstep(0.989 - density * 0.06, 0.9996, rnd);
      float dist = length(local);
      star *= exp(-dist * 18.0);
      float spike = max(0.0, 1.0 - abs(local.x) * 18.0) * max(0.0, 1.0 - abs(local.y) * 18.0);
      return star * (0.55 + 0.45 * spike);
    }

    vec3 spectralMix(float t) {
      vec3 base = mix(uShellCool, uShellHot, t);
      vec3 spectral = mix(base, uHalo, smoothstep(0.72, 1.0, t) * 0.35);
      spectral = mix(spectral, uCore, smoothstep(0.42, 0.78, 1.0 - t) * 0.18);
      return spectral;
    }

    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      centered.x *= uResolution.x / max(uResolution.y, 1.0);
      centered = rotate2d(uOrientation) * centered;
      centered.x /= max(uMorphology.y, 0.001);

      float r = length(centered) / max(uMorphology.z, 0.001);
      float angle = atan(centered.y, centered.x);
      float shellKnowledgeMask =
        uScientificMorphology < 0.5 ? 1.0 : 0.0;
      float shellThickness =
        max(0.001, uShell.x) *
        mix(
          1.0,
          mix(1.45, 1.0, uDetail.y),
          shellKnowledgeMask
        );
      float shellSharpness =
        mix(0.75, 2.4, uShell.y) *
        mix(
          1.0,
          mix(0.64, 1.0, uDetail.y),
          shellKnowledgeMask
        );
      float shellDominance = uScientificMorphology < 0.5 ? 1.0 : (uScientificMorphology < 1.5 ? 0.42 : 0.78);
      float plerionDominance = uScientificMorphology < 0.5 ? 0.12 : (uScientificMorphology < 1.5 ? 1.0 : 0.72);
      float compositeMix = uScientificMorphology > 1.5 ? 1.0 : 0.0;

      float largeScale = fbm(centered * (3.4 + uDetail.y * 2.8) + uSeed * 5.0);
      float fineScale = fbm(centered * (11.0 + uDetail.y * 14.0) + uSeed * 17.0 + 14.0);

      if (
        uScientificMorphology > 1.5
      ) {
        float family0 = 1.0 - step(0.25, abs(uMorphology.x - 0.0));
        float family1 = 1.0 - step(0.25, abs(uMorphology.x - 1.0));
        float family2 = 1.0 - step(0.25, abs(uMorphology.x - 2.0));
        float family3 = 1.0 - step(0.25, abs(uMorphology.x - 3.0));
        float family4 = 1.0 - step(0.25, abs(uMorphology.x - 4.0));
        float family5 = 1.0 - step(0.25, abs(uMorphology.x - 5.0));
        float family6 = 1.0 - step(0.25, abs(uMorphology.x - 6.0));
        float family7 = 1.0 - step(0.25, abs(uMorphology.x - 7.0));

        /* Outer blast-wave shell: irregular, broken and independently
         * structured from the central pulsar-wind nebula. */
        vec2 shellCoordinates =
          centered /
          max(uMorphology.z, 0.001);

        float shellR =
          length(shellCoordinates);

        float shellAngle =
          atan(
            shellCoordinates.y,
            shellCoordinates.x
          );

        float shellCoarse =
          fbm(
            shellCoordinates *
              (3.1 + uDetail.y * 2.2) +
            uSeed * 7.0
          );

        float shellFine =
          fbm(
            shellCoordinates *
              (13.0 + uDetail.y * 14.0) +
            vec2(uSeed.y, uSeed.x) * 31.0 +
            4.0
          );

        float shellAngular =
          sin(
            shellAngle *
              (
                2.0 +
                family1 * 1.0 +
                family4 * 2.0 +
                family5 * 1.0
              ) +
            shellCoarse * 4.2 +
            uSeed.x * 6.28318
          );

        float shellTarget =
          uMorphology.w *
          (
            1.0 +
            (shellCoarse - 0.5) *
              (
                0.20 +
                uShapeB.x * 0.16 +
                family4 * 0.12
              ) +
            shellAngular *
              (
                0.035 +
                family1 * 0.018 +
                family5 * 0.018
              )
          );

        float compositeShellThickness =
          max(0.012, uShell.x) *
          mix(
            1.42,
            1.0,
            uDetail.y
          );

        float outerShell =
          exp(
            -pow(
              abs(shellR - shellTarget) /
                compositeShellThickness,
              2.0
            ) *
            mix(
              0.86,
              2.05,
              uShell.y
            )
          );

        float shellBreakNoise =
          fbm(
            vec2(
              shellAngle * 1.65,
              shellR * 7.5
            ) +
            uSeed * 19.0
          );

        float shellBreakMask =
          smoothstep(
            mix(
              0.32,
              0.54,
              uShapeB.w
            ),
            0.86,
            shellBreakNoise +
              0.16 * shellFine
          );

        float breakoutBias =
          smoothstep(
            -0.25,
            0.78,
            cos(
              shellAngle -
              uSeed.y * 6.28318
            )
          );

        shellBreakMask *=
          1.0 -
          family4 *
            breakoutBias *
            0.58;

        outerShell *=
          mix(
            0.58,
            1.0,
            shellBreakMask
          ) *
          uKnowledge.x;

        float rimFilamentNoiseA =
          1.0 -
          abs(
            2.0 *
              fbm(
                shellCoordinates *
                  (18.0 + uDetail.y * 20.0) +
                uSeed * 43.0
              ) -
            1.0
          );

        float rimFilamentNoiseB =
          1.0 -
          abs(
            2.0 *
              fbm(
                rotate2d(0.73) *
                  shellCoordinates *
                  (14.0 + uDetail.y * 17.0) +
                vec2(uSeed.y, uSeed.x) * 51.0
              ) -
            1.0
          );

        float rimFilaments =
          outerShell *
          pow(
            clamp(
              rimFilamentNoiseA * 0.70 +
              rimFilamentNoiseB * 0.58 -
              0.56,
              0.0,
              1.0
            ),
            mix(
              1.6,
              1.0,
              uDetail.y
            )
          ) *
          uShell.z *
          uKnowledge.y *
          (
            0.72 +
            family3 * 0.58 +
            family6 * 0.48
          );

        float rimKnots =
          pow(
            clamp(
              shellCoarse * shellFine,
              0.0,
              1.0
            ),
            mix(
              5.8,
              9.0,
              uShell.w
            )
          ) *
          outerShell *
          uKnowledge.y *
          (
            0.22 +
            family6 * 1.35 +
            family3 * 0.38
          );

        /* Central PWN: compact, filled and turbulent, never a second shell. */
        vec2 pwnVector =
          centered -
          uOffsets;

        vec2 pwnCoordinates =
          pwnVector /
          max(uMorphology.z, 0.001);

        float pwnAspect =
          1.0 +
          family1 * 0.42 +
          family7 * 0.34 +
          uShapeA.w * 0.18;

        vec2 pwnShapeCoordinates =
          vec2(
            pwnCoordinates.x /
              pwnAspect,
            pwnCoordinates.y *
              (
                1.0 +
                family1 * 0.12
              )
          );

        float pwnR =
          length(
            pwnShapeCoordinates
          );

        float pwnAngle =
          atan(
            pwnShapeCoordinates.y,
            pwnShapeCoordinates.x
          );

        float pwnCoarse =
          fbm(
            pwnShapeCoordinates *
              (4.0 + uDetail.y * 3.0) +
            uSeed * 11.0 +
            3.0
          );

        float pwnFine =
          fbm(
            pwnShapeCoordinates *
              (12.0 + uDetail.y * 14.0) +
            vec2(uSeed.y, uSeed.x) * 37.0 +
            11.0
          );

        float pwnBaseRadius =
          uMorphology.w *
          (
            0.34 +
            family0 * 0.04 +
            family1 * 0.05 +
            family3 * 0.06 +
            family5 * 0.03 +
            family7 * 0.06
          );

        float pwnAngularDistortion =
          sin(
            pwnAngle *
              (
                2.0 +
                family1 * 2.0 +
                family3 * 3.0
              ) +
            pwnCoarse * 4.6 +
            uSeed.y * 6.28318
          );

        float pwnTarget =
          pwnBaseRadius *
          (
            1.0 +
            (pwnCoarse - 0.5) *
              (
                0.38 +
                uShapeB.x * 0.20
              ) +
            pwnAngularDistortion *
              (
                0.055 +
                family3 * 0.025
              )
          );

        float pwnSoftness =
          mix(
            0.070,
            0.034,
            uDetail.y
          );

        float pwnBody =
          1.0 -
          smoothstep(
            pwnTarget - pwnSoftness,
            pwnTarget + pwnSoftness,
            pwnR
          );

        float pwnFill =
          pwnBody *
          exp(
            -pow(
              pwnR /
                max(
                  pwnTarget * 1.18,
                  0.001
                ),
              1.72
            )
          ) *
          (
            0.58 +
            0.42 *
              mix(
                pwnCoarse,
                pwnFine,
                0.38 +
                0.34 * uDetail.y
              )
          ) *
          uShapeA.y *
          uKnowledge.z;

        vec2 bridgeCoordinates =
          rotate2d(
            0.48 +
            uSeed.x * 0.62
          ) *
          pwnCoordinates;

        float bridgeNoiseA =
          1.0 -
          abs(
            2.0 *
              fbm(
                bridgeCoordinates *
                  (15.0 + uDetail.y * 17.0) +
                uSeed * 59.0
              ) -
            1.0
          );

        float bridgeNoiseB =
          1.0 -
          abs(
            2.0 *
              fbm(
                rotate2d(1.11) *
                  bridgeCoordinates *
                  (11.0 + uDetail.y * 15.0) +
                vec2(uSeed.y, uSeed.x) * 67.0
              ) -
            1.0
          );

        float internalFilaments =
          pow(
            clamp(
              bridgeNoiseA * 0.68 +
              bridgeNoiseB * 0.60 -
              0.58,
              0.0,
              1.0
            ),
            mix(
              1.55,
              1.0,
              uDetail.y
            )
          ) *
          pwnBody *
          uShell.z *
          uKnowledge.y *
          (
            0.58 +
            family3 * 0.82 +
            family7 * 0.34
          );

        /* Emission linking the PWN to the shell is enhanced only for the
         * bridge family, preserving a clear two-zone composite morphology. */
        float bridgeAxis =
          exp(
            -pow(
              bridgeCoordinates.y /
                (
                  0.055 +
                  0.05 * uShapeB.x
                ),
              2.0
            )
          );

        float bridgeReach =
          smoothstep(
            0.16,
            0.44,
            abs(bridgeCoordinates.x)
          ) *
          (
            1.0 -
            smoothstep(
              0.44,
              0.76,
              abs(bridgeCoordinates.x)
            )
          );

        float filamentBridge =
          bridgeAxis *
          bridgeReach *
          (
            0.35 +
            0.65 * pwnFine
          ) *
          family3 *
          uKnowledge.y;

        float bipolarAxis =
          exp(
            -pow(
              pwnCoordinates.y /
                mix(
                  0.040,
                  0.022,
                  uDetail.y
                ),
              2.0
            )
          ) *
          exp(
            -pow(
              abs(pwnCoordinates.x) /
                (
                  0.34 +
                  0.16 * uShapeB.y
                ),
              1.55
            )
          );

        float bipolarJets =
          bipolarAxis *
          uShapeB.y *
          (
            family1 * 1.20 +
            family7 * 0.66 +
            family2 * 0.20
          ) *
          uKnowledge.y;

        float windTail =
          exp(
            -pow(
              pwnCoordinates.y /
                (
                  0.10 +
                  0.06 * uShapeB.x
                ),
              2.0
            )
          ) *
          smoothstep(
            -0.04,
            0.20,
            pwnCoordinates.x
          ) *
          (
            1.0 -
            smoothstep(
              0.22,
              0.78,
              pwnCoordinates.x
            )
          ) *
          family7 *
          (
            0.32 +
            0.68 * pwnFine
          ) *
          uKnowledge.z;

        float doubleArcA =
          exp(
            -pow(
              (
                pwnR -
                pwnBaseRadius * 0.54
              ) /
              mix(
                0.028,
                0.014,
                uDetail.y
              ),
              2.0
            )
          );

        float doubleArcB =
          exp(
            -pow(
              (
                pwnR -
                pwnBaseRadius * 0.82
              ) /
              mix(
                0.032,
                0.016,
                uDetail.y
              ),
              2.0
            )
          );

        float arcBreakup =
          smoothstep(
            0.42,
            0.78,
            fbm(
              vec2(
                pwnAngle * 1.4,
                pwnR * 9.0
              ) +
              uSeed * 23.0
            )
          );

        float innerArcs =
          (
            doubleArcA +
            doubleArcB * 0.66
          ) *
          arcBreakup *
          family5 *
          uKnowledge.y;

        float pulsarGlow =
          exp(
            -pwnR * pwnR *
              mix(
                130.0,
                250.0,
                uShapeB.z
              )
          ) *
          uShapeB.z *
          (
            0.16 +
            0.40 * uKnowledge.z
          );

        float pulsarPoint =
          exp(
            -pwnR * pwnR *
              mix(
                1800.0,
                3200.0,
                uShapeB.z
              )
          ) *
          (
            0.18 +
            0.52 * uShapeB.z
          );

        float shellHalo =
          exp(
            -pow(
              (
                shellR -
                (uMorphology.w + 0.10)
              ) /
              (
                0.15 +
                uShapeA.z * 0.10
              ),
              2.0
            )
          ) *
          uShapeA.z *
          uKnowledge.w;

        float innerHalo =
          exp(
            -pow(
              pwnR /
                max(
                  pwnBaseRadius * 1.72,
                  0.001
                ),
              2.0
            )
          ) *
          (
            1.0 -
            pwnBody * 0.48
          ) *
          uShapeA.z *
          uKnowledge.w;

        float shellPhase =
          clamp(
            0.5 +
            0.5 *
              sin(
                shellAngle * 2.0 +
                shellFine * 5.2 +
                shellCoarse * 2.8
              ),
            0.0,
            1.0
          );

        shellPhase =
          mix(
            0.5,
            shellPhase,
            uColorVariance * uDetail.x
          );

        float pwnPhase =
          clamp(
            0.5 +
            (pwnCoarse - 0.5) * 0.95 +
            (pwnFine - 0.5) * 0.38,
            0.0,
            1.0
          );

        vec3 outerColor =
          spectralMix(
            shellPhase
          );

        vec3 pwnColor =
          mix(
            uHalo,
            uShellCool,
            0.54 +
              0.22 * pwnPhase
          );

        pwnColor =
          mix(
            pwnColor,
            uCore,
            0.12 +
              0.20 *
                (1.0 - pwnPhase)
          );

        vec3 hotFilamentColor =
          mix(
            uShellHot,
            uCore,
            0.22
          );

        float starDensity =
          clamp(
            uDetail.z *
              (
                0.34 +
                0.62 * uPhysical.y
              ),
            0.0,
            1.0
          );

        float stars =
          starField(
            uv +
              uSeed * 0.17,
            starDensity
          );

        stars +=
          starField(
            uv * 0.67 +
              vec2(uSeed.y, uSeed.x) * 0.29 +
              5.1,
            clamp(
              starDensity * 0.44,
              0.0,
              1.0
            )
          ) *
          (
            0.38 +
            0.72 * uPhysical.z
          );

        stars *=
          1.0 -
          clamp(
            pwnBody * 0.28 +
            outerShell * 0.18,
            0.0,
            0.54
          );

        vec3 color =
          uBackground;

        color +=
          stars *
          vec3(
            0.82,
            0.88,
            1.0
          );

        color +=
          shellHalo *
          mix(
            uHalo,
            uShellCool,
            0.32
          ) *
          0.52;

        color +=
          outerShell *
          outerColor *
          (
            0.34 +
            1.18 * uDetail.w
          );

        color +=
          rimFilaments *
          mix(
            outerColor,
            hotFilamentColor,
            0.34
          ) *
          (
            0.30 +
            0.96 * uDetail.y
          );

        color +=
          rimKnots *
          hotFilamentColor *
          0.92;

        color +=
          innerHalo *
          mix(
            uHalo,
            uShellCool,
            0.42
          ) *
          0.50;

        color +=
          pwnFill *
          pwnColor *
          (
            0.42 +
            0.62 * uKnowledge.z
          );

        color +=
          internalFilaments *
          mix(
            uShellCool,
            uCore,
            0.28
          ) *
          (
            0.26 +
            0.84 * uDetail.y
          );

        color +=
          filamentBridge *
          mix(
            uShellHot,
            uShellCool,
            0.56
          ) *
          0.76;

        color +=
          innerArcs *
          mix(
            uShellCool,
            uCore,
            0.48
          ) *
          0.72;

        color +=
          bipolarJets *
          mix(
            uShellCool,
            uHalo,
            0.40
          ) *
          0.96;

        color +=
          windTail *
          mix(
            uHalo,
            uShellCool,
            0.62
          ) *
          0.82;

        color +=
          pulsarGlow *
          mix(
            uCore,
            uHalo,
            0.18
          ) *
          0.46;

        color +=
          pulsarPoint *
          uCore *
          0.72;

        color *=
          0.90 +
          0.30 * uPhysical.x;

        color +=
          0.014 *
          shellFine *
          uDetail.y;

        float compositeLuminance =
          dot(
            color,
            vec3(
              0.2126,
              0.7152,
              0.0722
            )
          );

        color =
          mix(
            vec3(compositeLuminance),
            color,
            mix(
              0.16,
              1.0,
              uDetail.x
            )
          );

        gl_FragColor =
          vec4(
            clamp(
              color,
              0.0,
              1.0
            ),
            1.0
          );

        return;
      }

      if (
        uScientificMorphology > 0.5 &&
        uScientificMorphology < 1.5
      ) {
        float family0 = 1.0 - step(0.25, abs(uMorphology.x - 0.0));
        float family1 = 1.0 - step(0.25, abs(uMorphology.x - 1.0));
        float family2 = 1.0 - step(0.25, abs(uMorphology.x - 2.0));
        float family3 = 1.0 - step(0.25, abs(uMorphology.x - 3.0));
        float family4 = 1.0 - step(0.25, abs(uMorphology.x - 4.0));
        float family5 = 1.0 - step(0.25, abs(uMorphology.x - 5.0));
        float family6 = 1.0 - step(0.25, abs(uMorphology.x - 6.0));
        float family7 = 1.0 - step(0.25, abs(uMorphology.x - 7.0));

        vec2 pulsarVector = centered - uOffsets;
        vec2 pulsarNormalized =
          pulsarVector /
          max(uMorphology.z, 0.001);

        float pulsarR =
          length(
            pulsarNormalized
          );

        float pulsarAngle =
          atan(
            pulsarNormalized.y,
            pulsarNormalized.x
          );

        float coarseWind =
          fbm(
            pulsarNormalized *
              (3.0 + uDetail.y * 2.4) +
            uSeed * 9.0
          );

        float turbulentWind =
          fbm(
            pulsarNormalized *
              (8.0 + uDetail.y * 11.0) +
            uSeed * 27.0 +
            8.0
          );

        float filamentNoise =
          1.0 -
          abs(
            2.0 *
              fbm(
                pulsarNormalized *
                  (15.0 + uDetail.y * 18.0) +
                uSeed * 41.0
              ) -
            1.0
          );

        float petalCount =
          4.0 +
          family1 * 2.0 +
          family7 * 1.0;

        float petalWave =
          0.5 +
          0.5 *
          sin(
            pulsarAngle *
              petalCount +
            coarseWind *
              (2.4 + family1 * 2.8) +
            uSeed.x *
              6.28318
          );

        float angularDistortion =
          sin(
            pulsarAngle *
              (2.0 + family0 * 3.0 + family7 * 4.0) +
            turbulentWind * 4.4 +
            uSeed.y * 6.28318
          );

        float targetWindRadius =
          uMorphology.w *
          (
            1.0 +
            (coarseWind - 0.5) *
              (
                0.30 +
                uShapeB.x * 0.26 +
                family0 * 0.10 +
                family7 * 0.14
              ) +
            angularDistortion *
              (
                0.060 +
                family0 * 0.030 +
                family7 * 0.075
              ) +
            (petalWave - 0.5) *
              family1 *
              (
                0.20 +
                uShapeA.w * 0.14
              )
          );

        float boundarySoftness =
          mix(
            0.105,
            0.045,
            uDetail.y
          ) +
          uShell.x * 0.18;

        float windBody =
          1.0 -
          smoothstep(
            targetWindRadius -
              boundarySoftness,
            targetWindRadius +
              boundarySoftness,
            pulsarR
          );

        float innerFalloff =
          exp(
            -pow(
              pulsarR /
                max(
                  targetWindRadius * 1.08,
                  0.001
                ),
              1.65
            ) *
            mix(
              0.85,
              1.70,
              1.0 - uShapeA.y
            )
          );

        float synchrotron =
          windBody *
          innerFalloff *
          (
            0.60 +
            0.40 *
            mix(
              coarseWind,
              turbulentWind,
              0.45 + 0.35 * uDetail.y
            )
          ) *
          uShapeA.y *
          uKnowledge.z;

        float internalFilamentBand =
          windBody *
          smoothstep(
            0.05,
            0.92,
            pulsarR /
              max(
                targetWindRadius,
                0.001
              )
          );

        vec2 filamentCoordinates =
          rotate2d(
            0.61 +
            uSeed.x * 0.47
          ) *
          pulsarNormalized;

        float crossFilamentNoise =
          1.0 -
          abs(
            2.0 *
              fbm(
                filamentCoordinates *
                  (
                    11.0 +
                    uDetail.y * 16.0
                  ) +
                vec2(
                  uSeed.y,
                  uSeed.x
                ) *
                  53.0 +
                9.0
              ) -
            1.0
          );

        float filamentWeb =
          clamp(
            filamentNoise * 0.72 +
            crossFilamentNoise * 0.58 -
            mix(
              0.78,
              0.60,
              uDetail.y
            ),
            0.0,
            1.0
          );

        float tendrils =
          pow(
            filamentWeb,
            mix(
              1.70,
              1.10,
              uDetail.y
            )
          ) *
          internalFilamentBand *
          mix(
            0.78,
            1.16,
            smoothstep(
              0.42,
              0.96,
              pulsarR /
                max(
                  targetWindRadius,
                  0.001
                )
            )
          ) *
          uShell.z *
          uKnowledge.y;

        tendrils *=
          0.70 +
          family0 * 0.72 +
          family4 * 0.34 +
          family7 * 0.62;

        float knotField =
          pow(
            clamp(
              coarseWind *
                turbulentWind,
              0.0,
              1.0
            ),
            mix(
              4.8,
              8.6,
              uShell.w
            )
          ) *
          windBody *
          uKnowledge.y *
          (
            0.20 +
            family0 * 0.52 +
            family4 * 1.10 +
            family7 * 0.48
          );

        vec2 wispCoordinates =
          vec2(
            pulsarNormalized.x,
            pulsarNormalized.y *
              (
                1.45 +
                family3 * 0.28
              )
          );

        float wispR =
          length(
            wispCoordinates
          );

        float wispBreakup =
          smoothstep(
            0.38,
            0.76,
            fbm(
              vec2(
                pulsarAngle * 1.35,
                wispR * 7.0
              ) +
              uSeed * 21.0
            )
          );

        float wispArcA =
          exp(
            -pow(
              (
                wispR -
                (
                  0.11 +
                  0.020 * uPhysical.w
                )
              ) /
              mix(
                0.030,
                0.014,
                uDetail.y
              ),
              2.0
            )
          );

        float wispArcB =
          exp(
            -pow(
              (
                wispR -
                (
                  0.19 +
                  0.025 * uPhysical.w
                )
              ) /
              mix(
                0.036,
                0.018,
                uDetail.y
              ),
              2.0
            )
          );

        float wisps =
          (
            wispArcA +
            wispArcB * 0.68
          ) *
          wispBreakup *
          windBody *
          uKnowledge.y *
          (
            family2 * 0.36 +
            family3 * 1.05
          );

        vec2 torusCoordinates =
          vec2(
            pulsarNormalized.x,
            pulsarNormalized.y *
              (
                2.10 +
                0.55 *
                  uShapeA.w
              )
          );

        float torusR =
          length(
            torusCoordinates
          );

        float torus =
          exp(
            -pow(
              (
                torusR -
                (
                  0.105 +
                  0.045 *
                    uPhysical.w
                )
              ) /
              (
                0.020 +
                0.018 *
                  (1.0 - uDetail.y)
              ),
              2.0
            )
          ) *
          (
            0.10 +
            family2 * 1.35 +
            family3 * 0.24
          ) *
          uKnowledge.y;

        float jetWidth =
          mix(
            0.052,
            0.020,
            uDetail.y
          );

        float bipolarJets =
          exp(
            -pow(
              abs(
                pulsarNormalized.y
              ) /
                jetWidth,
              2.0
            )
          ) *
          exp(
            -pow(
              abs(
                pulsarNormalized.x
              ) /
                (
                  0.28 +
                  uShapeB.y * 0.22
                ),
              1.45
            )
          ) *
          uShapeB.y *
          (
            0.12 +
            family2 * 1.45 +
            family6 * 0.45 +
            family7 * 0.32
          ) *
          uKnowledge.y;

        float coreGlow =
          exp(
            -pulsarR *
              pulsarR *
              mix(
                88.0,
                168.0,
                uShapeB.z
              )
          ) *
          uShapeB.z *
          (
            0.14 +
            0.42 *
              uKnowledge.z
          );

        float pulsarPoint =
          exp(
            -pulsarR *
              pulsarR *
              mix(
                1350.0,
                2500.0,
                uShapeB.z
              )
          ) *
          (
            0.20 +
            0.58 *
              uShapeB.z
          );

        float diffraction =
          (
            exp(
              -abs(
                pulsarNormalized.y
              ) *
              92.0
            ) *
            exp(
              -abs(
                pulsarNormalized.x
              ) *
              10.0
            ) +
            exp(
              -abs(
                pulsarNormalized.x
              ) *
              92.0
            ) *
            exp(
              -abs(
                pulsarNormalized.y
              ) *
              10.0
            )
          ) *
          pulsarPoint *
          (
            0.08 +
            0.34 * uDetail.y
          );

        float primaryHalo =
          exp(
            -pow(
              pulsarR /
              max(
                targetWindRadius *
                  (
                    1.28 +
                    uShapeA.z * 0.24
                  ),
                0.001
              ),
              2.15
            )
          ) *
          (
            1.0 -
            windBody * 0.46
          ) *
          uShapeA.z *
          uKnowledge.w;

        float secondaryHalo =
          exp(
            -pow(
              pulsarR /
              max(
                targetWindRadius * 1.82,
                0.001
              ),
              2.0
            )
          ) *
          (
            1.0 -
            windBody * 0.60
          ) *
          family5 *
          uShapeA.z *
          uKnowledge.w;

        float plumeAxis =
          exp(
            -pow(
              pulsarNormalized.y /
                (
                  0.12 +
                  0.08 * uShapeB.x
                ),
              2.0
            )
          );

        float plumeLength =
          smoothstep(
            -0.08,
            0.18,
            pulsarNormalized.x
          ) *
          (
            1.0 -
            smoothstep(
              0.18,
              0.72,
              pulsarNormalized.x
            )
          );

        float offsetPlume =
          plumeAxis *
          plumeLength *
          (
            0.20 +
            0.80 *
              turbulentWind
          ) *
          family6 *
          uKnowledge.z;

        float turbulentWeb =
          pow(
            filamentWeb,
            mix(
              1.45,
              0.92,
              uDetail.y
            )
          ) *
          (
            0.52 +
            0.48 *
              smoothstep(
                0.32,
                0.82,
                turbulentWind
              )
          ) *
          windBody *
          family7 *
          uKnowledge.y;

        float petalEmission =
          pow(
            petalWave,
            1.4
          ) *
          windBody *
          family1 *
          (
            0.22 +
            0.78 *
              uKnowledge.z
          );

        float radialColor =
          clamp(
            pulsarR /
              max(
                targetWindRadius,
                0.001
              ),
            0.0,
            1.0
          );

        float chromaNoise =
          clamp(
            0.5 +
            0.5 *
              sin(
                pulsarAngle * 2.0 +
                turbulentWind * 6.0 +
                coarseWind * 3.0
              ),
            0.0,
            1.0
          );

        chromaNoise =
          mix(
            0.5,
            chromaNoise,
            uColorVariance *
              uDetail.x
          );

        vec3 innerColor =
          mix(
            uCore,
            uShellCool,
            0.32 +
              0.46 *
                radialColor
          );

        innerColor =
          mix(
            innerColor,
            uHalo,
            0.16 *
              radialColor
          );

        vec3 filamentColor =
          mix(
            uShellHot,
            uShellCool,
            chromaNoise *
              (
                0.34 +
                0.46 *
                  family3
              )
          );

        vec3 wispColor =
          mix(
            uShellCool,
            uCore,
            0.52
          );

        float starDensity =
          clamp(
            uDetail.z *
              (
                0.36 +
                0.72 *
                  uPhysical.y
              ),
            0.0,
            1.0
          );

        float backgroundStars =
          starField(
            uv +
              uSeed * 0.17,
            starDensity
          );

        float brightBackgroundStars =
          starField(
            uv * 0.64 +
              vec2(
                uSeed.y,
                uSeed.x
              ) *
              0.31 +
              4.7,
            clamp(
              starDensity * 0.48,
              0.0,
              1.0
            )
          ) *
          (
            0.42 +
            0.94 *
              uPhysical.z
          );

        backgroundStars +=
          brightBackgroundStars;

        backgroundStars *=
          1.0 -
          windBody *
            (
              0.34 +
              0.34 *
                uKnowledge.z
            );

        vec3 color =
          uBackground;

        color +=
          backgroundStars *
          vec3(
            0.82,
            0.88,
            1.0
          );

        color +=
          primaryHalo *
          mix(
            uHalo,
            uShellCool,
            0.24
          ) *
          (
            0.18 +
            0.82 *
              uKnowledge.w
          );

        color +=
          secondaryHalo *
          mix(
            uHalo,
            uShellHot,
            0.18
          ) *
          0.78;

        color +=
          synchrotron *
          innerColor *
          (
            0.30 +
            0.66 *
              uKnowledge.z
          );

        color +=
          petalEmission *
          mix(
            uShellHot,
            uHalo,
            0.28
          ) *
          0.38;

        color +=
          wisps *
          wispColor *
          (
            0.18 +
            0.58 *
              uDetail.y
          );

        color +=
          tendrils *
          filamentColor *
          (
            0.30 +
            0.92 *
              uDetail.y
          );

        color +=
          knotField *
          mix(
            uShellHot,
            uCore,
            0.22
          ) *
          1.12;

        color +=
          turbulentWeb *
          mix(
            uShellHot,
            uHalo,
            0.36
          ) *
          0.46;

        color +=
          torus *
          mix(
            uShellCool,
            uCore,
            0.58
          ) *
          1.34;

        color +=
          bipolarJets *
          mix(
            uShellCool,
            uHalo,
            0.42
          ) *
          1.28;

        color +=
          offsetPlume *
          mix(
            uHalo,
            uShellCool,
            0.55
          ) *
          0.92;

        color +=
          coreGlow *
          mix(
            uCore,
            uHalo,
            0.16
          ) *
          0.48;

        color +=
          pulsarPoint *
          uCore *
          0.82;

        color +=
          diffraction *
          mix(
            uCore,
            uShellCool,
            0.32
          ) *
          0.38;

        color *=
          0.88 +
          0.34 *
            uPhysical.x;

        color +=
          0.018 *
          turbulentWind *
          uDetail.y;

        float plerionLuminance =
          dot(
            color,
            vec3(
              0.2126,
              0.7152,
              0.0722
            )
          );

        color =
          mix(
            vec3(
              plerionLuminance
            ),
            color,
            mix(
              0.18,
              1.0,
              uDetail.x
            )
          );

        gl_FragColor =
          vec4(
            clamp(
              color,
              0.0,
              1.0
            ),
            1.0
          );

        return;
      }

      float angleWave = sin(angle * (2.0 + floor(mod(uMorphology.x, 4.0))) + uSeed.x * 6.28318);
      float lobeTerm = angleWave * uShapeA.w * 0.16;
      float asymTerm = sin(angle + uSeed.y * 6.28318) * uShapeB.x * 0.10;
      float noiseTerm = (largeScale - 0.5) * 0.20 + (fineScale - 0.5) * 0.14 * uShapeB.w;
      float targetShell = uMorphology.w + lobeTerm + asymTerm + noiseTerm;
      float shellDistance = abs(r - targetShell);
      float shell = exp(-pow(shellDistance / shellThickness, 2.0) * shellSharpness) * shellDominance;

      float arcMask = smoothstep(0.08, 0.92, sin(angle * (4.0 + uShapeA.x * 6.0) + fineScale * 4.8 + uSeed.y * 6.28318) * 0.5 + 0.5);
      float brokenMask = mix(0.48, 1.0, smoothstep(0.18, 0.92, largeScale + arcMask * 0.28));
      shell *= mix(0.64, 1.0, brokenMask);

      float shellFilaments = pow(max(shell, 0.0), 0.65) * pow(max(fineScale, 0.0), mix(1.6, 4.6, uShell.z)) * uKnowledge.y;
      float knots = pow(max(largeScale, 0.0), mix(2.0, 4.2, uShell.w)) * shell * (0.5 + 0.5 * uShapeA.x);

      vec2 coreVector = centered - uOffsets;
      float coreR = length(coreVector);
      float interior = exp(-pow(r / (uMorphology.w * 1.08 + 0.12), 2.0) * mix(1.1, 2.2, 1.0 - uShapeA.y));
      interior *= uShapeA.y * uKnowledge.z;
      interior *= 0.75 + 0.25 * fbm(coreVector * (8.0 + uDetail.y * 9.0) + uSeed * 23.0);
      interior *= plerionDominance;

      float core = exp(-coreR * coreR * mix(26.0, 78.0, uShapeB.z));
      core *= mix(0.18, 1.0, plerionDominance);

      float jetAngle = angle - uOrientation;
      float jetConeA = exp(-pow((jetAngle - 0.0) / 0.26, 2.0));
      float jetConeB = exp(-pow((abs(jetAngle) - 3.14159) / 0.26, 2.0));
      float jetProfile = exp(-pow(coreR / (0.42 + uShapeB.y * 0.18), 1.65));
      float jets = (jetConeA + jetConeB) * jetProfile * uShapeB.y * (0.35 + 0.65 * plerionDominance);

      float halo = exp(-pow((r - (uMorphology.w + 0.12 + uShapeA.z * 0.12)) / (0.16 + uShapeA.z * 0.12), 2.0));
      halo *= uShapeA.z * uKnowledge.w;

      float shockWeb = pow(max(fbm(centered * (14.0 + uDetail.y * 16.0) + uSeed * 40.0), 0.0), 2.6);
      shockWeb *= (0.35 + 0.65 * compositeMix) * (0.2 + 0.8 * uKnowledge.y);
      shockWeb *= smoothstep(0.10, 0.96, shell + interior * 0.8);

      float chromaPhase = clamp(0.5 + 0.5 * sin(angle * 2.0 + fineScale * 6.0 + largeScale * 3.0), 0.0, 1.0);
      chromaPhase = mix(0.5, chromaPhase, uColorVariance * uDetail.x);

      vec3 shellColor = spectralMix(chromaPhase);
      vec3 innerColor = mix(uCore, spectralMix(1.0 - chromaPhase), 0.34 + 0.32 * compositeMix);
      vec3 haloColor = mix(uHalo, uShellCool, 0.35);

      vec3 color = uBackground;
      color += starField(uv + uSeed * 0.17, uDetail.z) * vec3(0.82, 0.86, 1.0);
      color += halo * haloColor * (0.22 + 0.95 * uPhysical.z);
      color += shell * shellColor * (0.26 + 1.55 * uKnowledge.x * uDetail.w);
      color += shellFilaments * mix(shellColor, uCore, 0.26) * (0.18 + 1.18 * uDetail.y);
      color += knots * mix(uShellHot, uCore, 0.18) * 0.60;
      color += interior * innerColor * (0.24 + 1.12 * plerionDominance);
      color += core * mix(uCore, uHalo, 0.12) * (0.16 + 1.30 * uShapeB.z);
      color += jets * mix(uShellCool, uHalo, 0.5) * 1.25;
      color += shockWeb * mix(shellColor, uHalo, 0.28) * 0.90;

      float dustVignette = smoothstep(1.25, 0.20, r) * 0.08;
      color += dustVignette * mix(uShellCool, uShellHot, 0.5);
      color *= 0.90 + 0.35 * uPhysical.x;
      float recoveredFineDetail =
        mix(
          1.0,
          uDetail.y,
          shellKnowledgeMask
        );
      color +=
        0.02 *
        fineScale *
        recoveredFineDetail;

      float luminance =
        dot(
          color,
          vec3(0.2126, 0.7152, 0.0722)
        );
      float recoveredChroma =
        mix(
          1.0,
          mix(0.18, 1.0, uDetail.x),
          shellKnowledgeMask
        );
      color =
        mix(
          vec3(luminance),
          color,
          recoveredChroma
        );

      gl_FragColor = vec4(
        clamp(color, 0.0, 1.0),
        1.0
      );
    }
  `;
