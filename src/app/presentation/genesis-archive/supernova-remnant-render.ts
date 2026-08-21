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
