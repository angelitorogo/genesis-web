import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import { BlackHoleLaboratoryRenderModel } from './black-hole-laboratory-render-model';

@Component({
  selector: 'app-black-hole-laboratory-render',
  standalone: true,
  templateUrl: './black-hole-laboratory-render.html',
  styleUrl: './black-hole-laboratory-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlackHoleLaboratoryRender implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('renderCanvas') private renderCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('renderHost') private renderHost?: ElementRef<HTMLElement>;

  @Input({ required: true }) model!: BlackHoleLaboratoryRenderModel;

  readonly renderUnavailable = signal(false);
  readonly paused = signal(false);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private diskGroup: THREE.Group | null = null;
  private shaderMaterials: THREE.ShaderMaterial[] = [];
  private animationFrame: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastFrameMs = 0;

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) this.initializeThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model'] && this.renderer) this.rebuildScene();
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.disposeSceneObjects();
    this.renderer?.dispose();
    this.renderer = null;
  }

  togglePaused(): void {
    this.paused.update(value => !value);
  }

  private initializeThree(): void {
    const canvas = this.renderCanvas?.nativeElement;
    const host = this.renderHost?.nativeElement;
    if (!canvas || !host) return;

    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      context =
        canvas.getContext('webgl2', { alpha: true, antialias: true }) ??
        canvas.getContext('webgl', { alpha: true, antialias: true });
    } catch {
      context = null;
    }

    if (!context) {
      this.renderUnavailable.set(true);
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        context: context as WebGLRenderingContext,
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x010204, 1);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      this.rebuildScene();
      this.resize();

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(host);
      }

      this.animate(0);
    } catch {
      this.renderUnavailable.set(true);
      this.renderer?.dispose();
      this.renderer = null;
    }
  }

  private rebuildScene(): void {
    if (!this.scene || !this.camera || !this.model) return;

    this.disposeSceneObjects();
    this.scene.clear();

    this.camera.position.set(0, 0.22, 6.45);
    this.camera.lookAt(0, 0.04, 0);
    this.scene.add(new THREE.AmbientLight(0x557090, 0.18));

    const canonicalGroup = new THREE.Group();
    canonicalGroup.rotation.z = THREE.MathUtils.degToRad(6);

    const inclinedDiskGroup = new THREE.Group();
    inclinedDiskGroup.rotation.x = THREE.MathUtils.degToRad(90 - this.model.inclinationDegrees);
    inclinedDiskGroup.rotation.z = THREE.MathUtils.degToRad(6);

    this.scene.add(inclinedDiskGroup);
    this.scene.add(canonicalGroup);
    this.diskGroup = inclinedDiskGroup;

    // Invariant geometry: the sphere, upper lensed disk and lateral bands
    // stay canonical across all black-hole families. Only the main accretion
    // disk keeps the family-dependent inclination.
    this.addAccretionDisk(inclinedDiskGroup);
    this.addShadow(canonicalGroup);
    this.addPhotonRing(canonicalGroup);
    this.addLensedDiskImages(canonicalGroup);
    this.addUpperShadowHemisphere(canonicalGroup);
    this.addContourWrap(canonicalGroup);
    this.scene.add(this.createBackgroundStars());
  }

  private addShadow(group: THREE.Group): void {
    // Element 5: the black-hole body itself.
    // Important layering for the 3D read:
    // - back disk and upper lensed image must stay behind the hole,
    // - the near-side/front disk must pass in front of the hole.
    // To achieve that, the shadow must live in the transparent queue with
    // full opacity, and render between the rear layers (<= 3) and the front
    // disk/rim (5 and 6).
    const shadow = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 96, 64),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 1,
        blending: THREE.NormalBlending,
        depthTest: false,
        depthWrite: false,
      }),
    );
    shadow.renderOrder = 4;
    group.add(shadow);
  }

  private addUpperShadowHemisphere(group: THREE.Group): void {
    // Immutable visual invariant: the camera-facing upper half of the real
    // sphere must always win over the upper lensed disk and lateral joins.
    // The lower/front accretion disk remains visible because the shader
    // discards the lower half in view space.
    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying float vRelativeViewY;
        void main() {
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          vec4 viewCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vRelativeViewY = viewPosition.y - viewCenter.y;
          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying float vRelativeViewY;
        void main() {
          if (vRelativeViewY < 0.0) discard;
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });

    const upperHemisphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 96, 64),
      material,
    );
    upperHemisphere.renderOrder = 20;
    group.add(upperHemisphere);
  }

  private addAccretionDisk(group: THREE.Group): void {
    const backMaterial = this.createDiskFlowMaterial({
      brightness: this.model.diskBrightness,
      opacity: 0.86,
      innerCut: 0.20,
      outerCut: 1.0,
      bandScale: 52.0,
      flowRate: 1.0,
      frontMask: false,
      innerGlowBoost: 3.10,
    });

    const frontMaterial = this.createDiskFlowMaterial({
      brightness: this.model.diskBrightness * 1.06,
      opacity: 0.96,
      innerCut: 0.18,
      outerCut: 1.0,
      bandScale: 54.0,
      flowRate: 1.0,
      frontMask: true,
      innerGlowBoost: 3.85,
    });

    const foregroundRimMaterial = this.createDiskFlowMaterial({
      brightness: this.model.diskBrightness * 1.12,
      opacity: 0.42,
      innerCut: 0.0,
      outerCut: 1.0,
      bandScale: 70.0,
      flowRate: 0.86,
      frontMask: true,
      innerGlowBoost: 4.35,
    });

    frontMaterial.depthTest = false;
    foregroundRimMaterial.depthTest = false;

    const diskBack = new THREE.Mesh(new THREE.RingGeometry(0.80, 3.55, 224, 1), backMaterial);
    const diskFront = new THREE.Mesh(new THREE.RingGeometry(0.80, 3.55, 224, 1), frontMaterial);
    const foregroundRim = new THREE.Mesh(new THREE.RingGeometry(0.78, 1.18, 224, 1), foregroundRimMaterial);
    const verticalScale = Math.max(0.05, this.model.diskThickness * 1.65);
    diskBack.scale.y = verticalScale;
    diskFront.scale.y = verticalScale;
    foregroundRim.scale.y = Math.max(0.09, verticalScale * 0.78);
    diskBack.position.z = -0.035;
    diskFront.position.z = 0.040;
    foregroundRim.position.z = 0.048;
    diskBack.renderOrder = 1;
    diskFront.renderOrder = 5;
    foregroundRim.renderOrder = 6;
    group.add(diskBack);
    group.add(diskFront);
    group.add(foregroundRim);
  }

  private addPhotonRing(group: THREE.Group): void {
    const photonRing = new THREE.Mesh(
      new THREE.RingGeometry(0.93, 1.03, 224, 1),
      this.createDiskFlowMaterial({
        brightness: this.model.diskBrightness * 1.18,
        opacity: 0.42 + 0.16 * this.model.lensingStrength,
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 72.0,
        flowRate: 1.25,
        frontMask: false,
        innerGlowBoost: 1.38,
      }),
    );
    photonRing.scale.y = 0.22;
    photonRing.position.z = 0.010;
    photonRing.renderOrder = 2;
    group.add(photonRing);
  }


  private addContourWrap(group: THREE.Group): void {
    // New full-contour lensed wrap: unlike the top band, this is allowed to
    // stay visible around the whole shadow silhouette, including the lower
    // half, so the upper lensed disk reads as surrounding the entire hole.
    const contourWrap = new THREE.Mesh(
      new THREE.RingGeometry(0.84, 0.96, 256, 1),
      this.createDiskFlowMaterial({
        brightness: this.model.diskBrightness * 1.42,
        opacity: 0.60 + 0.20 * this.model.lensingStrength,
        innerCut: 0.0,
        outerCut: 1.0,
        bandScale: 68.0,
        flowRate: 1.08,
        frontMask: false,
        innerGlowBoost: 1.18,
      }),
    );
    contourWrap.scale.y = 0.95;
    contourWrap.position.z = 0.018;
    // Render just before the upper shadow cap: this keeps the wrap visible
    // around the contour and lower half, but prevents it from painting over
    // the top black silhouette.
    contourWrap.renderOrder = 19.2;
    group.add(contourWrap);
  }

  private upperLensedBandThicknessScale(): number {
    // Keep the lower edge glued to the black-hole contour, but trim a little
    // from the upper side so the lensed top disk reads slightly thinner.
    return 0.60;
  }

  private addLensedDiskImages(group: THREE.Group): void {
    // Element 2: upper lensed image of the accretion disk.
    const upperBandThicknessScale = this.upperLensedBandThicknessScale();
    const topBandHalo = this.createLensedDiskBand({
      yOffset: 0.30,
      zOffset: 0.018,
      bend: 1.03,
      leftWidth: 1.14,
      rightWidth: 1.24,
      height: 1.10,
      thickness: 0.16,
      brightness: this.model.diskBrightness * 0.80,
      opacity: 0.20,
      flowRate: 0.98,
      invertFlow: false,
      thicknessScale: upperBandThicknessScale,
    });
    const topBand = this.createLensedDiskBand({
      yOffset: 0.28,
      zOffset: 0.028,
      bend: 0.99,
      leftWidth: 1.04,
      rightWidth: 1.14,
      height: 1.04,
      thickness: 0.14,
      brightness: this.model.diskBrightness * 0.98,
      opacity: 0.64,
      flowRate: 1.02,
      invertFlow: false,
      thicknessScale: upperBandThicknessScale,
    });

    // Elements 3 and 4: independent left/right joins. Keeping them separate
    // lets us give them substantially more vertical amplitude without altering
    // the upper disk silhouette.
    const leftJoinHalo = this.createLensedJoinBand(-1, true);
    const leftJoin = this.createLensedJoinBand(-1, false);
    const rightJoinHalo = this.createLensedJoinBand(1, true);
    const rightJoin = this.createLensedJoinBand(1, false);

    // Keep the upper lensed image always visible hugging the upper contour
    // of the black-hole body. It should render after the sphere so it cannot
    // disappear behind it, but still before the near-side/front disk.
    topBandHalo.renderOrder = 8.1;
    topBand.renderOrder = 8.2;
    // Render the lateral join bands after the sphere as well, so they can
    // meet the upper lensed band cleanly at the contour with no visible gap.
    // Their own fragment mask already forbids drawing inside the silhouette.
    leftJoinHalo.renderOrder = 8.05;
    leftJoin.renderOrder = 8.15;
    rightJoinHalo.renderOrder = 8.05;
    rightJoin.renderOrder = 8.15;

    group.add(topBandHalo);
    group.add(leftJoinHalo);
    group.add(rightJoinHalo);
    group.add(topBand);
    group.add(leftJoin);
    group.add(rightJoin);
  }

  private createDiskFlowMaterial(config: {
    brightness: number;
    opacity: number;
    innerCut: number;
    outerCut: number;
    bandScale: number;
    flowRate: number;
    frontMask: boolean;
    innerGlowBoost: number;
  }): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uOuter: { value: new THREE.Color(this.model.diskColorOuter) },
        uBrightness: { value: config.brightness },
        uOpacity: { value: config.opacity },
        uInnerCut: { value: config.innerCut },
        uOuterCut: { value: config.outerCut },
        uBandScale: { value: config.bandScale },
        uFlowRate: { value: config.flowRate },
        uFrontMask: { value: config.frontMask ? 1.0 : 0.0 },
        uInnerGlowBoost: { value: config.innerGlowBoost },
        uTurbulenceScale: { value: this.model.turbulenceScale },
        uTurbulenceStrength: { value: this.model.turbulenceStrength },
        uSpin: { value: this.model.spinDimensionless },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform vec3 uOuter;
        uniform float uBrightness;
        uniform float uOpacity;
        uniform float uInnerCut;
        uniform float uOuterCut;
        uniform float uBandScale;
        uniform float uFlowRate;
        uniform float uTurbulenceScale;
        uniform float uTurbulenceStrength;
        uniform float uSpin;
        uniform float uFrontMask;
        uniform float uInnerGlowBoost;
        varying vec2 vUv;
        varying vec3 vPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p) * 2.0;
          if (r < uInnerCut || r > uOuterCut) discard;

          float angle = atan(p.y, p.x);
          float timePhase = uTime * uFlowRate * (0.22 + uSpin * 0.22);
          float flow = noise(vec2(angle * 4.6 + timePhase * 1.3, r * uTurbulenceScale - uTime * 0.16 * uFlowRate));
          float bands = 0.5 + 0.5 * sin(r * uBandScale + angle * 10.0 + flow * 5.0 - timePhase * 2.8);
          float streaks = 0.5 + 0.5 * sin(angle * 18.0 - timePhase * 4.6 + r * 20.0);
          float shear = 0.5 + 0.5 * sin(angle * 2.6 - timePhase * 1.8 + r * 14.0);
          float heat = pow(clamp(1.0 - smoothstep(uInnerCut, uOuterCut, r), 0.0, 1.0), 0.46);
          vec3 color = mix(uOuter, uMid, smoothstep(0.06, 0.76, heat));
          color = mix(color, uInner, pow(heat, 1.95) * (0.78 + 0.22 * streaks));
          color = mix(color, uOuter, (1.0 - heat) * 0.18 * (0.55 + 0.45 * bands));

          float approaching = 0.70 + 0.60 * (0.5 + 0.5 * cos(angle - 0.52));
          float textureBoost = 0.88
            + (flow - 0.5) * uTurbulenceStrength * 1.45
            + (bands - 0.5) * 0.34
            + (streaks - 0.5) * 0.18
            + (shear - 0.5) * 0.12;
          float alpha = smoothstep(uInnerCut, min(uInnerCut + 0.05, uOuterCut), r)
            * (1.0 - smoothstep(max(uOuterCut - 0.08, uInnerCut), uOuterCut, r));
          alpha *= 0.90 + (bands - 0.5) * 0.16;
          if (uFrontMask > 0.5) {
            float frontBand = 1.0 - smoothstep(-0.22, 0.02, p.y);
            frontBand *= smoothstep(0.12, 0.28, r);
            alpha *= frontBand;
          }

          // Broad, progressive inner-disk radiance: from roughly the middle
          // of the disk inward, luminosity climbs steeply toward the shadow.
          float innerGlowEnd = mix(uInnerCut, uOuterCut, 0.58);
          float innerGlow = 1.0 - smoothstep(uInnerCut + 0.015, innerGlowEnd, r);
          innerGlow = pow(clamp(innerGlow, 0.0, 1.0), 1.12);
          float innerRadianceBoost = 1.0 + innerGlow * uInnerGlowBoost;

          float hotCoreMix = innerGlow * 0.58 * clamp(uInnerGlowBoost / 3.0, 0.0, 1.0);
          vec3 hotCore = mix(uInner, vec3(1.0), 0.38);
          color = mix(color, hotCore, hotCoreMix);

          gl_FragColor = vec4(color * uBrightness * textureBoost * approaching * innerRadianceBoost, alpha * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shaderMaterials.push(material);
    return material;
  }

  private createLensedDiskBand(config: {
    yOffset: number;
    zOffset: number;
    bend: number;
    leftWidth: number;
    rightWidth: number;
    height: number;
    thickness: number;
    brightness: number;
    opacity: number;
    flowRate: number;
    invertFlow: boolean;
    thicknessScale: number;
  }): THREE.Mesh {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uOuter: { value: new THREE.Color(this.model.diskColorOuter) },
        uBrightness: { value: config.brightness },
        uOpacity: { value: config.opacity },
        uYOffset: { value: config.yOffset },
        uZOffset: { value: config.zOffset },
        uLeftWidth: { value: config.leftWidth },
        uRightWidth: { value: config.rightWidth },
        uHeight: { value: config.height },
        uThickness: { value: config.thickness },
        uBend: { value: config.bend },
        uFlowRate: { value: config.flowRate },
        uInvertFlow: { value: config.invertFlow ? 1.0 : 0.0 },
        uThicknessScale: { value: config.thicknessScale },
        uSpin: { value: this.model.spinDimensionless },
        uTurbulenceScale: { value: this.model.turbulenceScale },
        uTurbulenceStrength: { value: this.model.turbulenceStrength },
      },
      vertexShader: `
        uniform float uYOffset;
        uniform float uZOffset;
        uniform float uLeftWidth;
        uniform float uRightWidth;
        uniform float uHeight;
        uniform float uThickness;
        varying vec2 vUv;
        varying vec2 vLocal;
        void main() {
          vUv = uv;
          float x = mix(-uLeftWidth, uRightWidth, uv.x);
          float y = (uYOffset - 0.26) + uv.y * uHeight;
          vLocal = vec2(x, y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, uZOffset, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform vec3 uOuter;
        uniform float uBrightness;
        uniform float uOpacity;
        uniform float uBend;
        uniform float uFlowRate;
        uniform float uInvertFlow;
        uniform float uThicknessScale;
        uniform float uLeftWidth;
        uniform float uRightWidth;
        uniform float uHeight;
        uniform float uSpin;
        uniform float uTurbulenceScale;
        uniform float uTurbulenceStrength;
        uniform float uInclinationFactor;
        uniform float uRotationAngle;
        uniform float uTailReachBoost;
        uniform float uTailDrop;
        varying vec2 vUv;
        varying vec2 vLocal;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          float x = vLocal.x;
          float y = vLocal.y;
          float ax = abs(x);

          float shadowRadius = 0.82;
          float contourY = sqrt(max(0.0, shadowRadius * shadowRadius - x * x));
          float insideShadowBlend = 1.0 - smoothstep(shadowRadius - 0.12, shadowRadius + 0.12, ax);

          float maxHalfWidth = max(uLeftWidth, uRightWidth);
          float sideT = clamp((ax - shadowRadius) / (maxHalfWidth - shadowRadius), 0.0, 1.0);
          float sideEase = sideT * sideT * (3.0 - 2.0 * sideT);
          float sideLower = mix(0.18, 0.12, sideEase);

          // Force the upper lensed disk to ride just above the sphere contour.
          // This keeps it visible for every inclination while preventing it
          // from ever intruding inside the black-hole silhouette.
          float contourClearance = mix(0.018, 0.024, insideShadowBlend);
          float lowerEnvelope = mix(sideLower, contourY + contourClearance, insideShadowBlend);

          float centerNorm = clamp(ax / shadowRadius, 0.0, 1.0);
          float dome = pow(1.0 - centerNorm * centerNorm, 0.78);
          float centralThickness = 0.16 + 0.05 * dome;
          float sideThickness = mix(0.19, 0.10, sideEase);
          float thickness = mix(sideThickness, centralThickness, insideShadowBlend);
          thickness *= 0.95 + 0.05 * uBend;
          thickness *= uThicknessScale;
          thickness = max(thickness, mix(0.10, 0.14, insideShadowBlend) * uThicknessScale);

          float upperEnvelope = lowerEnvelope + thickness;

          float lowerMask = smoothstep(lowerEnvelope - 0.014, lowerEnvelope + 0.024, y);
          float upperMask = 1.0 - smoothstep(upperEnvelope - 0.028, upperEnvelope + 0.012, y);
          float sideMask = 1.0 - smoothstep(maxHalfWidth - 0.20, maxHalfWidth, ax);
          float silhouette = (x * x + y * y) / (shadowRadius * shadowRadius);
          float outsideShadow = smoothstep(1.020, 1.060, silhouette);
          float contourGuard = mix(
            smoothstep(contourY + contourClearance - 0.004, contourY + contourClearance + 0.024, y),
            1.0,
            smoothstep(shadowRadius - 0.02, shadowRadius + 0.08, ax)
          );
          float mask = lowerMask * upperMask * sideMask * outsideShadow * contourGuard;
          if (mask <= 0.001) discard;

          float bandHeight = max(upperEnvelope - lowerEnvelope, 0.001);
          float bandCoord = clamp((y - lowerEnvelope) / bandHeight, 0.0, 1.0);
          float direction = mix(1.0, -1.0, uInvertFlow);
          float timePhase = uTime * uFlowRate * direction * (0.22 + uSpin * 0.22);
          float angle = atan(y - 0.18, x);
          float flow = noise(vec2(angle * 4.6 + timePhase * 1.25, bandCoord * uTurbulenceScale * 2.1));
          float bands = 0.5 + 0.5 * sin(angle * 15.0 - timePhase * 3.0 + bandCoord * 12.0 + flow * 4.4);
          float streaks = 0.5 + 0.5 * sin(angle * 27.0 + bandCoord * 20.0 - timePhase * 4.2);
          float shear = 0.5 + 0.5 * sin(angle * 4.2 - timePhase * 1.5 + bandCoord * 13.0);
          float heat = clamp(1.0 - bandCoord * 0.88 + (bands - 0.5) * 0.16, 0.0, 1.0);

          vec3 color = mix(uOuter, uMid, smoothstep(0.05, 0.80, heat));
          color = mix(color, uInner, pow(heat, 1.85) * (0.76 + 0.24 * streaks));
          color = mix(color, uOuter, (1.0 - heat) * 0.16 + (0.5 - bands) * 0.05);

          float textureBoost = 0.93
            + (flow - 0.5) * uTurbulenceStrength * 0.88
            + (bands - 0.5) * 0.24
            + (streaks - 0.5) * 0.14
            + (shear - 0.5) * 0.08;
          float edgeFade = smoothstep(0.02, 0.13, vUv.x) * (1.0 - smoothstep(0.88, 0.995, vUv.x));
          float shoulderBlendIn = smoothstep(0.68, 0.86, ax);
          float shoulderBlendOut = 1.0 - smoothstep(maxHalfWidth - 0.26, maxHalfWidth, ax);
          float shoulderWindow = shoulderBlendIn * shoulderBlendOut;
          float shoulderVerticalIn = smoothstep(0.16, 0.40, bandCoord);
          float shoulderVerticalOut = 1.0 - smoothstep(0.82, 1.0, bandCoord);
          float shoulderVerticalWindow = shoulderVerticalIn * shoulderVerticalOut;
          float lateralIntegrationFade = 1.0 - shoulderWindow * shoulderVerticalWindow * 0.80;
          float innerGlow = smoothstep(lowerEnvelope, lowerEnvelope + 0.040, y) * (1.0 - smoothstep(lowerEnvelope + 0.060, lowerEnvelope + 0.16, y));
          float nearShadowBoost = 1.0 + innerGlow * 1.05;
          color = mix(color, uInner, innerGlow * 0.28);
          float alpha = mask * edgeFade * lateralIntegrationFade * (0.84 + innerGlow * 0.16);
          gl_FragColor = vec4(color * uBrightness * textureBoost * nearShadowBoost, alpha * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shaderMaterials.push(material);
    return new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 96, 96), material);
  }

  private createLensedJoinBand(side: -1 | 1, halo: boolean): THREE.Mesh {
    const inclinationFactor = THREE.MathUtils.clamp((this.model.inclinationDegrees - 22) / (72 - 22), 0, 1);
    // Canonical join-band geometry for every black-hole family.
    // The previous implementation gated the fully tuned band deformation
    // behind STELLAR_MASS_BLACK_HOLE, leaving IMBH/SMBH on an older geometry.
    // Keep family-dependent colour/physics in the model, but make the visual
    // join-band construction identical across stellar, intermediate and SMBH.
    const tailReachBoost = side > 0 ? 0.46 : 0.18;
    const tailDrop = side > 0 ? 0.12 : 0.06;
    const bandSpaceMaskBlend = 1.0;
    const leftTailDropExtra = this.model.sampleLabel === 'D' ? 0.02 : 0.11;
    const leftRotationOffset = THREE.MathUtils.lerp(0.052, 0.020, inclinationFactor);
    const rightTailLift = this.model.sampleLabel === 'D' ? 0.06 : 0.15;
    const rightRotationOffset = THREE.MathUtils.lerp(0.052, 0.020, inclinationFactor);
    const leftTerminalFadeStrength = this.model.sampleLabel === 'D' ? 0.20 : 0.38;
    const leftEntryFadeStrength = this.model.sampleLabel === 'D' ? 0.20 : 0.34;
    const rightEntryFadeStrength = this.model.sampleLabel === 'D' ? 0.16 : 0.24;
    const rightTerminalFadeStrength = this.model.sampleLabel === 'D' ? 0.48 : 0.76;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uInner: { value: new THREE.Color(this.model.diskColorInner) },
        uMid: { value: new THREE.Color(this.model.diskColorMid) },
        uOuter: { value: new THREE.Color(this.model.diskColorOuter) },
        uBrightness: { value: this.model.diskBrightness * (halo ? 0.80 : 1.00) },
        uOpacity: { value: halo ? 0.22 : 0.70 },
        uSide: { value: side },
        uSpin: { value: this.model.spinDimensionless },
        uTurbulenceScale: { value: this.model.turbulenceScale },
        uTurbulenceStrength: { value: this.model.turbulenceStrength },
        uInclinationFactor: { value: inclinationFactor },
        uRotationAngle: { value: THREE.MathUtils.lerp(-0.20, -0.12, inclinationFactor) },
        uTailReachBoost: { value: tailReachBoost },
        uTailDrop: { value: tailDrop },
        uBandSpaceMaskBlend: { value: bandSpaceMaskBlend },
        uLeftTailDropExtra: { value: leftTailDropExtra },
        uLeftRotationOffset: { value: leftRotationOffset },
        uRightTailLift: { value: rightTailLift },
        uRightRotationOffset: { value: rightRotationOffset },
        uLeftTerminalFadeStrength: { value: leftTerminalFadeStrength },
        uLeftEntryFadeStrength: { value: leftEntryFadeStrength },
        uRightEntryFadeStrength: { value: rightEntryFadeStrength },
        uRightTerminalFadeStrength: { value: rightTerminalFadeStrength },
      },
      vertexShader: `
        uniform float uSide;
        uniform float uInclinationFactor;
        uniform float uRotationAngle;
        uniform float uTailReachBoost;
        uniform float uTailDrop;
        uniform float uLeftTailDropExtra;
        uniform float uLeftRotationOffset;
        uniform float uRightTailLift;
        uniform float uRightRotationOffset;
        varying vec2 vUv;
        varying vec2 vBandLocal;
        varying vec2 vTransformedLocal;
        void main() {
          vUv = uv;
          float t = uv.x;
          float tailT = smoothstep(0.56, 1.0, t);
          float tailEase = tailT * tailT;
          float outerReach = mix(2.18, 2.24, uInclinationFactor);
          float verticalReach = mix(0.84, 0.88, uInclinationFactor);

          float bandX = uSide * mix(0.50, outerReach, t);
          float bandY = 0.01 + uv.y * verticalReach;
          vBandLocal = vec2(bandX, bandY);

          float leftSide = step(uSide, 0.0);
          float rightSide = step(0.0, uSide);
          float baseX = bandX + uSide * tailT * uTailReachBoost;
          float baseY = bandY - tailT * uTailDrop;
          baseY -= leftSide * tailEase * uLeftTailDropExtra;
          baseY += rightSide * tailEase * uRightTailLift;

          float pivotX = uSide * 0.74;
          float pivotY = 0.62;
          float rotationAngle = uRotationAngle + rightSide * uRightRotationOffset + leftSide * uLeftRotationOffset;
          float s = sin(rotationAngle);
          float c = cos(rotationAngle);
          float dx = baseX - pivotX;
          float dy = baseY - pivotY;
          float x = pivotX + dx * c - dy * s;
          float y = pivotY + dx * s + dy * c;
          vTransformedLocal = vec2(x, y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, 0.024, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uInner;
        uniform vec3 uMid;
        uniform vec3 uOuter;
        uniform float uBrightness;
        uniform float uOpacity;
        uniform float uSide;
        uniform float uSpin;
        uniform float uTurbulenceScale;
        uniform float uTurbulenceStrength;
        uniform float uInclinationFactor;
        uniform float uRotationAngle;
        uniform float uTailReachBoost;
        uniform float uTailDrop;
        uniform float uBandSpaceMaskBlend;
        uniform float uLeftTerminalFadeStrength;
        uniform float uRightTerminalFadeStrength;
        uniform float uLeftEntryFadeStrength;
        uniform float uRightEntryFadeStrength;
        varying vec2 vUv;
        varying vec2 vBandLocal;
        varying vec2 vTransformedLocal;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        void main() {
          float transformedX = vTransformedLocal.x;
          float transformedY = vTransformedLocal.y;
          float maskX = mix(transformedX, vBandLocal.x, uBandSpaceMaskBlend);
          float maskY = mix(transformedY, vBandLocal.y, uBandSpaceMaskBlend);
          float ax = abs(maskX);
          float shadowRadius = 0.82;
          float outerReach = mix(2.18, 2.24, uInclinationFactor) + (1.0 - uBandSpaceMaskBlend) * uTailReachBoost;
          float t = clamp((ax - 0.50) / max(outerReach - 0.50, 0.001), 0.0, 1.0);
          float ease = t * t * (3.0 - 2.0 * t);

          float lower = mix(0.15, mix(0.024, 0.012, uInclinationFactor), pow(ease, 0.94));
          float upper = mix(0.74, mix(0.16, 0.10, uInclinationFactor), pow(ease, mix(0.84, 0.78, uInclinationFactor)));

          float lowerMask = smoothstep(lower - 0.014, lower + 0.022, maskY);
          float upperMask = 1.0 - smoothstep(upper - 0.024, upper + 0.012, maskY);
          float sideMask = smoothstep(0.46, 0.58, ax) * (1.0 - smoothstep(outerReach - 0.14, outerReach + 0.05, ax));
          float silhouette = (transformedX * transformedX + transformedY * transformedY) / (shadowRadius * shadowRadius);
          float outsideShadow = smoothstep(1.020, 1.060, silhouette);
          float mask = lowerMask * upperMask * sideMask * outsideShadow;
          if (mask <= 0.001) discard;

          float bandCoord = clamp((maskY - lower) / max(upper - lower, 0.001), 0.0, 1.0);
          float timePhase = uTime * (0.22 + uSpin * 0.22) * uSide;
          float flow = noise(vec2(t * 5.0 + timePhase * 1.25, bandCoord * uTurbulenceScale * 2.0));
          float bands = 0.5 + 0.5 * sin(t * 26.0 - timePhase * 3.1 + bandCoord * 12.0 + flow * 4.2);
          float streaks = 0.5 + 0.5 * sin(t * 42.0 + bandCoord * 19.0 - timePhase * 4.4);
          float heat = clamp(1.0 - bandCoord * (0.86 - (1.0 - uInclinationFactor) * 0.06) + (bands - 0.5) * 0.16, 0.0, 1.0);

          vec3 color = mix(uOuter, uMid, smoothstep(0.05, 0.80, heat));
          color = mix(color, uInner, pow(heat, 1.84) * (0.76 + 0.24 * streaks));
          float textureBoost = 0.94
            + (flow - 0.5) * uTurbulenceStrength * 0.88
            + (bands - 0.5) * 0.22
            + (streaks - 0.5) * 0.14;
          float edgeFade = 1.0 - smoothstep(0.86, 1.0, vUv.x);
          float summitHorizontal = 1.0 - smoothstep(0.56, 0.86, ax);
          float summitVerticalIn = smoothstep(0.24, 0.54, bandCoord);
          float summitVerticalOut = 1.0 - smoothstep(0.90, 1.0, bandCoord);
          float summitWindow = summitHorizontal * summitVerticalIn * summitVerticalOut;
          float bandIntegrationFade = 1.0 - summitWindow * 0.80;
          float rightSide = step(0.0, uSide);
          float leftSide = 1.0 - rightSide;
          float entryWindow = smoothstep(0.56, 0.90, vUv.x) * (1.0 - smoothstep(0.42, 0.78, bandCoord));
          float leftEntryFade = 1.0 - leftSide * entryWindow * uLeftEntryFadeStrength;
          float rightEntryFade = 1.0 - rightSide * entryWindow * uRightEntryFadeStrength;
          float rightTerminalFade = 1.0 - smoothstep(0.60, 0.92, vUv.x) * uRightTerminalFadeStrength;
          float leftTerminalFade = 1.0 - smoothstep(0.74, 0.98, vUv.x) * uLeftTerminalFadeStrength;
          float terminalFade = mix(leftTerminalFade, rightTerminalFade, rightSide);
          float contourGlow = (1.0 - smoothstep(0.04, 0.34, bandCoord)) * (1.0 - smoothstep(0.56, 1.06, ax));
          float contourBoost = 1.0 + contourGlow * 0.96;
          color = mix(color, uInner, contourGlow * 0.24);
          gl_FragColor = vec4(color * uBrightness * textureBoost * contourBoost, mask * edgeFade * bandIntegrationFade * leftEntryFade * rightEntryFade * terminalFade * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shaderMaterials.push(material);
    return new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0, 96, 48), material);
  }

  private createBackgroundStars(): THREE.Points {
    const positions: number[] = [];
    for (let i = 0; i < 260; i += 1) {
      const a = pseudo(i * 3 + 1) * Math.PI * 2;
      const u = pseudo(i * 3 + 2) * 2 - 1;
      const r = 8 + pseudo(i * 3 + 3) * 10;
      const s = Math.sqrt(1 - u * u);
      positions.push(r * s * Math.cos(a), r * u, r * s * Math.sin(a));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xbdd8ef, size: 0.026, transparent: true, opacity: 0.66 }),
    );
  }

  private animate = (timeMs: number): void => {
    if (!this.renderer || !this.scene || !this.camera) return;

    const delta = this.lastFrameMs === 0 ? 0 : Math.min(0.05, (timeMs - this.lastFrameMs) / 1000);
    this.lastFrameMs = timeMs;

    if (!this.paused()) {
      for (const material of this.shaderMaterials) {
        const timeUniform = material.uniforms['uTime'];
        if (timeUniform !== undefined) timeUniform.value += delta;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resize(): void {
    const host = this.renderHost?.nativeElement;
    if (!host || !this.renderer || !this.camera) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(320, Math.min(660, Math.round(width * 0.56)));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private disposeSceneObjects(): void {
    this.scene?.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry && typeof mesh.geometry.dispose === 'function') mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach(value => value.dispose());
      else material?.dispose();
    });
    this.shaderMaterials = [];
    this.diskGroup = null;
  }
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
