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
import { type SupernovaEventProfile } from '../../../../domain/transient/supernova-event-profile';
import { YoungSupernovaRenderModelBuilder } from './young-supernova-render-model';

@Component({
  selector: 'app-young-supernova-render',
  standalone: true,
  template: `
    <div class="young-supernova" data-testid="young-supernova-render">
      <canvas
        #canvas
        class="young-supernova__canvas"
        role="img"
        [attr.aria-label]="accessibleLabel()"
      ></canvas>
      <div class="young-supernova__optics" aria-hidden="true"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    .young-supernova {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 31rem;
      overflow: hidden;
      background: #02040a;
    }

    .young-supernova__canvas {
      display: block;
      width: 100%;
      height: 100%;
    }

    .young-supernova__optics {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(circle at 50% 50%, transparent 54%, rgba(0, 0, 0, 0.2) 100%);
      box-shadow: inset 0 0 3rem rgba(0, 0, 0, 0.34);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YoungSupernovaRender implements AfterViewInit, OnDestroy {
  readonly profile = input.required<SupernovaEventProfile>();
  readonly elapsedDays = input.required<number>();
  readonly accessibleLabel = input<string>('Supernova joven procedural');

  @ViewChild('canvas', { static: true })
  private canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private geometry: THREE.PlaneGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      const profile = this.profile();
      const elapsedDays = this.elapsedDays();
      this.applyModel(profile, elapsedDays);
    });
  }

  ngAfterViewInit(): void {
    if (!supportsWebGl()) {
      return;
    }

    try {
      const canvas = this.canvasRef.nativeElement;
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: false,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.geometry = new THREE.PlaneGeometry(2, 2);
      this.material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        depthTest: false,
        depthWrite: false,
        uniforms: createUniforms(),
      });
      this.scene.add(new THREE.Mesh(this.geometry, this.material));

      this.resizeObserver = new ResizeObserver(() => this.resizeAndRender());
      this.resizeObserver.observe(canvas);
      this.applyModel(this.profile(), this.elapsedDays());
      this.resizeAndRender();
    } catch {
      this.disposeWebGl();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.disposeWebGl();
  }

  private applyModel(profile: SupernovaEventProfile, elapsedDays: number): void {
    if (this.material === null) {
      return;
    }

    const model = YoungSupernovaRenderModelBuilder.build(profile, elapsedDays);
    const uniforms = this.material.uniforms;

    uniforms['uType'].value = model.typeIndex;
    uniforms['uAge'].value = model.age01;
    uniforms['uPhotosphere'].value = model.photosphere01;
    uniforms['uReveal'].value = model.remnantReveal01;
    uniforms['uRadius'].value = model.radius;
    uniforms['uAspect'].value = model.aspect;
    uniforms['uShellThickness'].value = model.shellThickness;
    uniforms['uBreakup'].value = model.breakup;
    uniforms['uFilamentStrength'].value = model.filamentStrength;
    uniforms['uClumpiness'].value = model.clumpiness;
    uniforms['uAsymmetry'].value = model.asymmetry;
    uniforms['uInteriorStrength'].value = model.interiorStrength;
    uniforms['uReverseShockStrength'].value = model.reverseShockStrength;
    uniforms['uDirectionalStrength'].value = model.directionalStrength;
    uniforms['uCompactSourceStrength'].value = model.compactSourceStrength;
    uniforms['uCompactKind'].value = model.compactKind;
    (uniforms['uSeed'].value as THREE.Vector2).set(model.seedX, model.seedY);

    applyColor(uniforms['uBackground'].value as THREE.Color, model.backgroundColor);
    applyColor(uniforms['uHot'].value as THREE.Color, model.hotColor);
    applyColor(uniforms['uCool'].value as THREE.Color, model.coolColor);
    applyColor(uniforms['uInterior'].value as THREE.Color, model.interiorColor);
    applyColor(uniforms['uHalo'].value as THREE.Color, model.haloColor);

    this.renderOnce();
  }

  private resizeAndRender(): void {
    if (this.renderer === null || this.material === null) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    this.renderer.setSize(width, height, false);
    (this.material.uniforms['uResolution'].value as THREE.Vector2).set(width, height);
    this.renderOnce();
  }

  private renderOnce(): void {
    if (this.renderer === null || this.scene === null || this.camera === null) {
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }

  private disposeWebGl(): void {
    this.geometry?.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
    this.geometry = null;
    this.material = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}

function applyColor(color: THREE.Color, hex: string): void {
  color.set(hex);
}

function createUniforms(): Record<string, THREE.IUniform> {
  return {
    uResolution: { value: new THREE.Vector2(720, 500) },
    uSeed: { value: new THREE.Vector2(0.2, 0.7) },
    uType: { value: 0 },
    uAge: { value: 0 },
    uPhotosphere: { value: 0 },
    uReveal: { value: 0 },
    uRadius: { value: 0.1 },
    uAspect: { value: 1 },
    uShellThickness: { value: 0.05 },
    uBreakup: { value: 0.2 },
    uFilamentStrength: { value: 0.7 },
    uClumpiness: { value: 0.5 },
    uAsymmetry: { value: 0.15 },
    uInteriorStrength: { value: 0.4 },
    uReverseShockStrength: { value: 0.3 },
    uDirectionalStrength: { value: 0.1 },
    uCompactSourceStrength: { value: 0 },
    uCompactKind: { value: 0 },
    uBackground: { value: new THREE.Color('#02040A') },
    uHot: { value: new THREE.Color('#FFD9B0') },
    uCool: { value: new THREE.Color('#E884D7') },
    uInterior: { value: new THREE.Color('#A48A82') },
    uHalo: { value: new THREE.Color('#A76E91') },
  };
}

function supportsWebGl(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return typeof WebGLRenderingContext !== 'undefined' || typeof WebGL2RenderingContext !== 'undefined';
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec2 uResolution;
  uniform vec2 uSeed;
  uniform float uType;
  uniform float uAge;
  uniform float uPhotosphere;
  uniform float uReveal;
  uniform float uRadius;
  uniform float uAspect;
  uniform float uShellThickness;
  uniform float uBreakup;
  uniform float uFilamentStrength;
  uniform float uClumpiness;
  uniform float uAsymmetry;
  uniform float uInteriorStrength;
  uniform float uReverseShockStrength;
  uniform float uDirectionalStrength;
  uniform float uCompactSourceStrength;
  uniform float uCompactKind;
  uniform vec3 uBackground;
  uniform vec3 uHot;
  uniform vec3 uCool;
  uniform vec3 uInterior;
  uniform vec3 uHalo;

  varying vec2 vUv;

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
    for (int octave = 0; octave < 6; octave += 1) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(17.13, 9.71);
      amplitude *= 0.55;
    }
    return value;
  }

  float ridgedFbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.55;
    for (int octave = 0; octave < 6; octave += 1) {
      float n = noise(p);
      value += amplitude * (1.0 - abs(2.0 * n - 1.0));
      p = p * 2.11 + vec2(11.7, 19.3);
      amplitude *= 0.52;
    }
    return value;
  }

  vec2 domainWarp(vec2 p, float scale, float strength, vec2 offset) {
    vec2 q = vec2(
      fbm(p * scale + offset),
      fbm((p + vec2(5.2, -3.7)) * scale + offset + 11.0)
    );
    vec2 r = vec2(
      fbm((p + q * 1.7) * (scale * 1.9) + offset + 23.0),
      fbm((p - q * 1.3) * (scale * 1.8) + offset + 37.0)
    );
    return (q - 0.5) * strength + (r - 0.5) * strength * 0.7;
  }

  float starField(vec2 uv) {
    vec2 grid = uv * 62.0;
    vec2 cell = floor(grid);
    vec2 local = fract(grid) - 0.5;
    float rnd = hash21(cell + uSeed * 41.0);
    float star = smoothstep(0.994, 0.9997, rnd);
    return star * exp(-length(local) * 22.0);
  }

  vec3 colorRamp(float t) {
    vec3 base = mix(uCool, uHot, smoothstep(0.18, 0.90, t));
    return mix(base, vec3(1.0), smoothstep(0.83, 1.0, t) * 0.22);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv - 0.5;
    p.x *= uResolution.x / max(uResolution.y, 1.0);

    vec2 shapeP = p;
    shapeP.x /= max(uAspect, 0.001);

    float r = length(shapeP);
    float angle = atan(shapeP.y, shapeP.x);
    float directional = cos(angle - (0.8 + uSeed.y * 3.2));
    float directionalBias = directional * directional * sign(directional);

    float macroWarpStrength = 0.030 + uBreakup * 0.070 + uDirectionalStrength * 0.045;
    float shellWarpStrength = 0.020 + uFilamentStrength * 0.055 + uClumpiness * 0.030;
    float gasWarpStrength = 0.028 + uClumpiness * 0.075 + uInteriorStrength * 0.035;

    vec2 macroWarp = domainWarp(shapeP, 2.2, macroWarpStrength, uSeed * 13.0);
    vec2 shellWarp = domainWarp(shapeP + macroWarp * 0.9, 5.8, shellWarpStrength, uSeed.yx * 19.0 + 7.0);
    vec2 gasWarp = domainWarp(shapeP + macroWarp * 1.2, 4.4, gasWarpStrength, uSeed * 31.0 + 17.0);

    vec2 shellP = shapeP + macroWarp + shellWarp;
    vec2 gasP = shapeP + macroWarp * 0.9 + gasWarp;
    vec2 detailP = shapeP + macroWarp * 0.55 + shellWarp * 0.85 + gasWarp * 0.45;

    float shellR = length(shellP);
    float gasR = length(gasP);

    float coarse = fbm(shellP * 3.5 + uSeed * 7.0);
    float medium = fbm(detailP * 9.5 + vec2(uSeed.y, uSeed.x) * 19.0 + 3.0);
    float fine = fbm(detailP * 24.0 + uSeed * 47.0 + 17.0);
    float micro = fbm(detailP * 47.0 + vec2(uSeed.y, uSeed.x) * 61.0 + 29.0);
    float ridges = ridgedFbm(shellP * 17.0 + vec2(uSeed.y, uSeed.x) * 29.0);
    float shards = ridgedFbm(detailP * 33.0 + vec2(-uSeed.x, uSeed.y) * 43.0 + 11.0);

    float familyWave = sin(angle * (3.0 + uType * 0.7) + coarse * 3.0 + uSeed.x * 6.28318);
    float secondaryWave = cos(angle * (4.5 + uType * 0.9) - uSeed.y * 4.1 + medium * 1.2);
    float tertiaryWave = sin(angle * (6.7 + uType * 0.7) + fine * 1.5);

    float radialDistortion =
      (coarse - 0.5) * uBreakup * 0.22 +
      (medium - 0.5) * uBreakup * 0.11 +
      familyWave * uBreakup * 0.024 +
      secondaryWave * uBreakup * 0.014 +
      tertiaryWave * uBreakup * 0.009 +
      directional * uAsymmetry * 0.032;

    radialDistortion += directionalBias * uDirectionalStrength * 0.038;

    float shellTarget = uRadius * (1.0 + radialDistortion);
    float shellDistance = abs(shellR - shellTarget);

    float localThickness = uShellThickness * mix(0.82, 1.34, coarse * 0.55 + fine * 0.45);
    float broadShock = exp(-pow(shellDistance / max(0.008, localThickness * 2.05), 2.0));
    float sharpShell = exp(-pow(shellDistance / max(0.005, localThickness * 0.60), 2.0));

    float breakNoise = fbm(shellP * 7.0 + macroWarp * 18.0 + uSeed * 23.0);
    float gapNoise = ridgedFbm(shellP * 11.0 - gasWarp * 24.0 + uSeed * 31.0);
    float tearNoise = fbm(detailP * 15.0 + shellWarp * 21.0 + vec2(uSeed.y, uSeed.x) * 59.0);
    float curlNoise = ridgedFbm(gasP * 8.0 + macroWarp * 17.0 + 13.0);

    float breakMask = smoothstep(
      0.28 + uBreakup * 0.18,
      0.87,
      breakNoise * 0.58 + gapNoise * 0.28 + fine * 0.16
    );
    float continuityMask = smoothstep(
      0.24 + uBreakup * 0.08,
      0.92,
      gapNoise * 0.48 + tearNoise * 0.34 + curlNoise * 0.24 + micro * 0.14
    );
    continuityMask = mix(0.16, 1.0, continuityMask);
    float sectorBias = mix(1.0, 1.0 + directionalBias * 0.16, clamp(uDirectionalStrength * 0.95, 0.0, 1.0));
    float erosionBias = mix(1.0, 1.0 - smoothstep(0.18, 1.0, directional) * 0.16, clamp(uDirectionalStrength * 0.55, 0.0, 1.0));
    breakMask *= continuityMask * erosionBias;

    float filamentField = pow(
      clamp(ridges * 0.78 + fine * 0.36 + micro * 0.18 - 0.54, 0.0, 1.0),
      1.10
    );
    float microFilaments = pow(
      clamp(shards * 0.68 + micro * 0.28 + curlNoise * 0.16 - 0.56, 0.0, 1.0),
      1.42
    );
    float filaments = sharpShell * (filamentField * 0.74 + microFilaments * 0.62) * uFilamentStrength * breakMask * sectorBias;

    float knotField = pow(
      clamp(medium * fine + curlNoise * 0.12 + micro * 0.06, 0.0, 1.0),
      mix(8.2, 4.8, uClumpiness)
    );
    float knots = sharpShell * knotField * uClumpiness * breakMask * mix(0.82, 1.12, coarse);

    float inside = 1.0 - smoothstep(shellTarget * 0.86, shellTarget * 1.01, gasR);
    float coreFade = 1.0 - smoothstep(shellTarget * 0.05, shellTarget * 0.84, gasR);
    float interiorNoise = fbm(gasP * 6.0 + uSeed * 13.0 + 7.0);
    float interiorRidges = ridgedFbm(detailP * 12.5 + vec2(uSeed.y, uSeed.x) * 31.0 + 5.0);
    float interiorMicro = fbm(gasP * 21.0 + vec2(uSeed.x, -uSeed.y) * 23.0 + 9.0);
    float interiorClumps = pow(clamp(interiorNoise * interiorRidges + interiorMicro * 0.08, 0.0, 1.0), mix(6.2, 3.7, uClumpiness));
    float interiorThreads = pow(clamp(interiorRidges * 0.76 + interiorMicro * 0.27 + curlNoise * 0.12 - 0.46, 0.0, 1.0), 1.72);
    float interior = inside * coreFade * (
      0.10 +
      interiorNoise * 0.18 +
      interiorClumps * 0.58 * uClumpiness +
      interiorThreads * 0.32 * uFilamentStrength
    ) * uInteriorStrength;

    float reverseTarget = uRadius * mix(0.44, 0.63, uType / 3.0);
    float reverseDistance = abs(gasR - reverseTarget);
    float reverseShock = exp(-pow(reverseDistance / max(0.012, uShellThickness * 1.10), 2.0));
    reverseShock *= (0.35 + ridgedFbm(detailP * 14.0 + uSeed * 37.0) * 0.95) * uReverseShockStrength;
    reverseShock *= mix(0.90, 1.08, continuityMask);

    float diffuseShell = exp(-pow(shellDistance / max(0.014, localThickness * 3.3), 2.0));
    float shellDust = pow(clamp(coarse * 0.7 + medium * 0.3 - 0.22, 0.0, 1.0), 1.7) * diffuseShell * uInteriorStrength * 0.26;

    float photosphereRadius = uRadius * mix(0.62, 0.34, uReveal);
    float photosphere = exp(-pow(r / max(0.025, photosphereRadius), 2.0));
    photosphere *= mix(0.14, 1.0, uPhotosphere);

    float centralHalo = 0.0;
    float centralSource = 0.0;
    if (uCompactKind < 1.5 && uCompactKind > 0.5) {
      centralHalo = exp(-pow(r / 0.045, 2.0)) * uCompactSourceStrength * 0.28;
      centralSource = exp(-pow(r / 0.0125, 2.0)) * uCompactSourceStrength;
    }

    vec3 color = uBackground;
    float stars = starField(uv);
    float starMask = mix(0.16, 1.0, smoothstep(uRadius * 0.82, uRadius * 1.12, r));
    color += vec3(0.55, 0.72, 0.95) * stars * starMask;

    float halo = broadShock * (0.14 + uReveal * 0.26) * (0.90 + sectorBias * 0.10);
    color += uHalo * halo;

    vec3 shellColor = colorRamp(clamp(0.20 + fine * 0.40 + ridges * 0.28 + knots * 0.30, 0.0, 1.0));
    vec3 filamentColor = mix(uCool, uHot, clamp(fine * 0.62 + micro * 0.27 + curlNoise * 0.10 + 0.1, 0.0, 1.0));
    vec3 knotColor = mix(uHot, vec3(1.0), 0.34);

    color += shellColor * diffuseShell * breakMask * (0.10 + uReveal * 0.18);
    color += shellColor * broadShock * breakMask * (0.14 + uReveal * 0.26);
    color += shellColor * sharpShell * breakMask * (0.12 + uReveal * 0.22);
    color += filamentColor * filaments * (0.56 + uReveal * 0.46);
    color += knotColor * knots * (0.22 + uReveal * 0.38);

    color += uInterior * interior * (0.40 + uReveal * 0.36);
    color += mix(uInterior, uCool, 0.46) * reverseShock * (0.16 + uReveal * 0.42);
    color += mix(uHalo, uInterior, 0.6) * shellDust;

    vec3 photosphereColor = mix(uHot, vec3(0.92, 0.97, 1.0), 0.62);
    color += photosphereColor * photosphere * (0.24 + uPhotosphere * 0.66);
    color += mix(uCool, vec3(0.95, 0.98, 1.0), 0.55) * centralHalo;
    color += vec3(0.95, 0.98, 1.0) * centralSource * 1.08;

    float vignette = smoothstep(1.18, 0.36, length(p));
    color *= 0.70 + 0.30 * vignette;
    color = 1.0 - exp(-color * 1.12);

    gl_FragColor = vec4(color, 1.0);
  }
`;