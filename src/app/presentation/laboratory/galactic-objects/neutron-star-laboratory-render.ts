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
import { type NeutronStarLaboratoryRenderModel } from './neutron-star-laboratory-render-model';

@Component({
  selector: 'app-neutron-star-laboratory-render',
  standalone: true,
  templateUrl: './neutron-star-laboratory-render.html',
  styleUrl: './neutron-star-laboratory-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NeutronStarLaboratoryRender implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('renderCanvas') private renderCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('renderHost') private renderHost?: ElementRef<HTMLElement>;

  @Input({ required: true }) model!: NeutronStarLaboratoryRenderModel;

  readonly renderUnavailable = signal(false);
  readonly paused = signal(false);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private spinGroup: THREE.Group | null = null;
  private magneticGroup: THREE.Group | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private animationFrame: number | null = null;
  private lastFrameMs = 0;
  private surfaceShaderMaterials: THREE.ShaderMaterial[] = [];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initializeThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['model'] && this.renderer !== null) {
      this.rebuildScene();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animationFrame);
    }
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
    if (canvas === undefined || host === undefined) return;

    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      context = canvas.getContext('webgl2', { alpha: true, antialias: true }) ??
        canvas.getContext('webgl', { alpha: true, antialias: true });
    } catch {
      context = null;
    }
    if (context === null) {
      this.renderUnavailable.set(true);
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, context: context as WebGLRenderingContext, antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x02050b, 1);
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      this.camera.position.set(0, 0.55, 6.6);
      this.camera.lookAt(0, 0, 0);
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
    if (this.scene === null || this.model === undefined) return;
    this.disposeSceneObjects();
    this.scene.clear();
    this.scene.add(new THREE.AmbientLight(0x8fb8d8, this.model.type === 'NEUTRON_STAR' ? 0.5 : 1.0));
    if (this.camera !== null) {
      this.camera.position.set(
        0,
        this.model.type === 'NEUTRON_STAR'
          ? 0.15
          : this.model.type === 'PULSAR'
            ? 0.22
            : this.model.type === 'MILLISECOND_PULSAR'
              ? 0.18
              : this.model.type === 'MAGNETAR'
                ? 0.30
                : 0.55,
        this.model.type === 'NEUTRON_STAR'
          ? 5.25
          : this.model.type === 'PULSAR'
            ? 5.65
            : this.model.type === 'MILLISECOND_PULSAR'
              ? 5.10
              : this.model.type === 'MAGNETAR'
                ? 5.55
                : 6.6,
      );
      this.camera.lookAt(0, 0, 0);
    }

    const key = new THREE.PointLight(
      this.model.accentColor,
      this.model.type === 'NEUTRON_STAR'
        ? 4.5
        : this.model.type === 'PULSAR'
          ? 5.4
          : this.model.type === 'MILLISECOND_PULSAR'
            ? 6.2
            : this.model.type === 'MAGNETAR'
              ? 8.2
              : 10,
      20,
      1.6,
    );
    key.position.set(3.2, 2.2, 4.1);
    this.scene.add(key);
    const fill = new THREE.PointLight(this.model.glowColor, 4.5, 16, 1.9);
    fill.position.set(-3.4, -1.5, 2.1);
    this.scene.add(fill);

    const spinGroup = new THREE.Group();
    spinGroup.rotation.z = THREE.MathUtils.degToRad(9);
    this.scene.add(spinGroup);
    this.spinGroup = spinGroup;

    if (this.model.type === 'NEUTRON_STAR') {
      this.addDetailedNeutronStar(spinGroup);
    } else if (this.model.type === 'PULSAR') {
      this.addDetailedPulsar(spinGroup);
    } else if (this.model.type === 'MILLISECOND_PULSAR') {
      this.addDetailedMillisecondPulsar(spinGroup);
    } else if (this.model.type === 'MAGNETAR') {
      this.addDetailedMagnetar(spinGroup);
    } else {
      const star = new THREE.Mesh(
        new THREE.SphereGeometry(0.78, 64, 48),
        new THREE.MeshPhysicalMaterial({
          color: this.model.surfaceColor,
          emissive: this.model.glowColor,
          emissiveIntensity: 0.36,
          roughness: 0.5,
          metalness: 0.05,
          clearcoat: 0.32,
          clearcoatRoughness: 0.42,
        }),
      );
      spinGroup.add(star);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.90, 48, 32),
        new THREE.MeshBasicMaterial({
          color: this.model.glowColor,
          transparent: true,
          opacity: this.model.type === 'MAGNETAR' ? 0.105 : 0.065,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      spinGroup.add(glow);

      const rotationAxis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 2.6, 10),
        new THREE.MeshBasicMaterial({ color: 0x7fa0b7, transparent: true, opacity: 0.36 }),
      );
      spinGroup.add(rotationAxis);
    }

    const magneticGroup = new THREE.Group();
    magneticGroup.rotation.z = THREE.MathUtils.degToRad(this.model.magneticInclinationDegrees ?? 0);
    spinGroup.add(magneticGroup);
    this.magneticGroup = magneticGroup;

    this.addPolarCaps(magneticGroup);
    if (this.model.type === 'PULSAR' || this.model.type === 'MILLISECOND_PULSAR') {
      this.addPulsarDipoleField(magneticGroup);
      this.addRealisticPulsarBeams(magneticGroup);
    } else if (this.model.type === 'MAGNETAR') {
      this.addMagnetarField(magneticGroup);
      this.addMagnetarReconnectionArcs(magneticGroup);
    } else {
      if (this.model.showMagneticField) this.addMagneticField(magneticGroup);
      if (this.model.showBeams) this.addPulsarBeams(magneticGroup);
    }

    const stars = this.createBackgroundStars();
    this.scene.add(stars);
  }

  private addDetailedNeutronStar(group: THREE.Group): void {
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed * 0.731 },
        uBase: { value: new THREE.Color(this.model.surfaceColor) },
        uDeep: { value: new THREE.Color(this.model.deepSurfaceColor) },
        uHot: { value: new THREE.Color(this.model.hotSurfaceColor) },
        uNoiseScale: { value: this.model.surfaceNoiseScale },
        uDetailScale: { value: this.model.surfaceDetailScale },
        uFineScale: { value: this.model.surfaceFineScale },
        uHotThreshold: { value: this.model.surfaceHotThreshold },
        uHotIntensity: { value: this.model.surfaceHotIntensity },
        uContrast: { value: this.model.surfaceContrast },
        uBrightness: { value: this.model.surfaceBrightness },
        uFresnelStrength: { value: this.model.surfaceFresnelStrength },
        uActivityRate: { value: this.model.activityRate },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPositionW = worldPosition.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vObjectPosition = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uBase;
        uniform vec3 uDeep;
        uniform vec3 uHot;
        uniform float uNoiseScale;
        uniform float uDetailScale;
        uniform float uFineScale;
        uniform float uHotThreshold;
        uniform float uHotIntensity;
        uniform float uContrast;
        uniform float uBrightness;
        uniform float uFresnelStrength;
        uniform float uActivityRate;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash31(i + vec3(0.0,0.0,0.0));
          float n100 = hash31(i + vec3(1.0,0.0,0.0));
          float n010 = hash31(i + vec3(0.0,1.0,0.0));
          float n110 = hash31(i + vec3(1.0,1.0,0.0));
          float n001 = hash31(i + vec3(0.0,0.0,1.0));
          float n101 = hash31(i + vec3(1.0,0.0,1.0));
          float n011 = hash31(i + vec3(0.0,1.0,1.0));
          float n111 = hash31(i + vec3(1.0,1.0,1.0));
          return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                     mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
        }

        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.56;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise3(p);
            p = p * 2.03 + vec3(3.17, 1.91, 2.71);
            amplitude *= 0.48;
          }
          return value;
        }

        void main() {
          vec3 n = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.25);
          vec3 p = normalize(vObjectPosition);
          float t = uTime * 0.028 * uActivityRate;
          float broad = fbm(p * uNoiseScale + vec3(t, -t * 0.55, uSeed));
          float medium = fbm(p * uDetailScale + vec3(-t * 0.7, t * 0.35, uSeed * 1.7));
          float fine = fbm(p * uFineScale + vec3(t * 0.45, uSeed, -t * 0.8));
          float cellular = smoothstep(0.46, 0.80, medium + 0.22 * fine);
          float hotField = medium + 0.30 * broad + 0.12 * fine;
          float hotVeins = pow(smoothstep(uHotThreshold, min(0.98, uHotThreshold + 0.22), hotField), 1.65);
          float micro = smoothstep(0.67, 0.93, fine);
          float baseMix = clamp(0.20 + broad * 0.82, 0.0, 1.0);
          baseMix = clamp((baseMix - 0.5) * uContrast + 0.5, 0.0, 1.0);
          vec3 color = mix(uDeep, uBase, baseMix);
          float hotMix = clamp(hotVeins * uHotIntensity + micro * 0.12 * uHotIntensity, 0.0, 0.92);
          color = mix(color, uHot, hotMix);
          color += uBase * cellular * 0.12;
          color += uHot * fresnel * uFresnelStrength;
          float intensity = uBrightness * (0.90 + hotVeins * (0.56 + uHotIntensity * 0.40) + micro * 0.12 + fresnel * 0.46);
          gl_FragColor = vec4(color * intensity, 1.0);
        }
      `,
      depthWrite: true,
    });
    this.surfaceShaderMaterials.push(material);

    const star = new THREE.Mesh(new THREE.SphereGeometry(1.08, 112, 80), material);
    group.add(star);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(1.13, 72, 48),
      new THREE.MeshBasicMaterial({
        color: this.model.hotSurfaceColor,
        transparent: true,
        opacity: Math.min(0.16, 0.055 + this.model.surfaceFresnelStrength * 0.08),
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(innerGlow);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(this.model.coronaRadius, 72, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color(this.model.glowColor) },
          uOpacity: { value: this.model.coronaOpacity },
          uSeed: { value: seed * 1.113 },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vPositionW = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uGlow;
          uniform float uOpacity;
          uniform float uSeed;
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPositionW);
            float rim = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 2.7);
            float azimuth = atan(vNormalW.y, vNormalW.x);
            float irregular = 0.74 + 0.26 * sin(azimuth * 5.0 + uSeed * 6.28318) * sin(vNormalW.z * 7.0 + uSeed);
            float alpha = rim * uOpacity * irregular;
            gl_FragColor = vec4(uGlow * (1.15 + rim * 0.85), alpha);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(corona);

    this.addNeutronStarWisps(group, seed);
  }

  private addDetailedPulsar(group: THREE.Group): void {
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed * 0.917 },
        uBase: { value: new THREE.Color(this.model.surfaceColor) },
        uDeep: { value: new THREE.Color(this.model.deepSurfaceColor) },
        uHot: { value: new THREE.Color(this.model.hotSurfaceColor) },
        uNoiseScale: { value: this.model.surfaceNoiseScale },
        uDetailScale: { value: this.model.surfaceDetailScale },
        uFineScale: { value: this.model.surfaceFineScale },
        uHotThreshold: { value: this.model.surfaceHotThreshold },
        uHotIntensity: { value: this.model.surfaceHotIntensity },
        uContrast: { value: this.model.surfaceContrast },
        uBrightness: { value: this.model.surfaceBrightness },
        uFresnelStrength: { value: this.model.surfaceFresnelStrength },
        uActivityRate: { value: this.model.activityRate },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPositionW = worldPosition.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vObjectPosition = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uBase;
        uniform vec3 uDeep;
        uniform vec3 uHot;
        uniform float uNoiseScale;
        uniform float uDetailScale;
        uniform float uFineScale;
        uniform float uHotThreshold;
        uniform float uHotIntensity;
        uniform float uContrast;
        uniform float uBrightness;
        uniform float uFresnelStrength;
        uniform float uActivityRate;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash31(i + vec3(0.0,0.0,0.0));
          float n100 = hash31(i + vec3(1.0,0.0,0.0));
          float n010 = hash31(i + vec3(0.0,1.0,0.0));
          float n110 = hash31(i + vec3(1.0,1.0,0.0));
          float n001 = hash31(i + vec3(0.0,0.0,1.0));
          float n101 = hash31(i + vec3(1.0,0.0,1.0));
          float n011 = hash31(i + vec3(0.0,1.0,1.0));
          float n111 = hash31(i + vec3(1.0,1.0,1.0));
          return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                     mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
        }
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.56;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise3(p);
            p = p * 2.03 + vec3(3.17, 1.91, 2.71);
            amplitude *= 0.48;
          }
          return value;
        }
        void main() {
          vec3 n = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.4);
          vec3 p = normalize(vObjectPosition);
          float t = uTime * 0.034 * uActivityRate;
          float broad = fbm(p * uNoiseScale + vec3(t, -t * 0.48, uSeed));
          float medium = fbm(p * uDetailScale + vec3(-t * 0.72, t * 0.31, uSeed * 1.61));
          float fine = fbm(p * uFineScale + vec3(t * 0.38, uSeed, -t * 0.74));
          float hotField = medium + 0.28 * broad + 0.14 * fine;
          float hotVeins = pow(smoothstep(uHotThreshold, min(0.98, uHotThreshold + 0.21), hotField), 1.72);
          float micro = smoothstep(0.70, 0.94, fine);
          float baseMix = clamp(0.18 + broad * 0.84, 0.0, 1.0);
          baseMix = clamp((baseMix - 0.5) * uContrast + 0.5, 0.0, 1.0);
          vec3 color = mix(uDeep, uBase, baseMix);
          color = mix(color, uHot, clamp(hotVeins * uHotIntensity + micro * 0.10, 0.0, 0.88));
          color += uHot * fresnel * uFresnelStrength;
          float intensity = uBrightness * (0.88 + hotVeins * (0.50 + 0.42 * uHotIntensity) + micro * 0.10 + fresnel * 0.42);
          gl_FragColor = vec4(color * intensity, 1.0);
        }
      `,
      depthWrite: true,
    });
    this.surfaceShaderMaterials.push(material);

    const star = new THREE.Mesh(new THREE.SphereGeometry(0.91, 112, 80), material);
    group.add(star);

    const limb = new THREE.Mesh(
      new THREE.SphereGeometry(0.955, 72, 48),
      new THREE.MeshBasicMaterial({
        color: this.model.hotSurfaceColor,
        transparent: true,
        opacity: Math.min(0.13, 0.045 + this.model.surfaceFresnelStrength * 0.075),
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(limb);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(this.model.coronaRadius, 72, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color(this.model.glowColor) },
          uOpacity: { value: this.model.coronaOpacity },
          uSeed: { value: seed * 1.331 },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vPositionW = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uGlow;
          uniform float uOpacity;
          uniform float uSeed;
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPositionW);
            float rim = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 3.0);
            float azimuth = atan(vNormalW.z, vNormalW.x);
            float irregular = 0.72 + 0.28 * sin(azimuth * 6.0 + uSeed * 5.7) * sin(vNormalW.y * 8.0 + uSeed);
            gl_FragColor = vec4(uGlow * (1.08 + rim * 0.92), rim * uOpacity * irregular);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(corona);
  }


  private addDetailedMillisecondPulsar(group: THREE.Group): void {
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed * 1.173 },
        uBase: { value: new THREE.Color(this.model.surfaceColor) },
        uDeep: { value: new THREE.Color(this.model.deepSurfaceColor) },
        uHot: { value: new THREE.Color(this.model.hotSurfaceColor) },
        uNoiseScale: { value: this.model.surfaceNoiseScale },
        uDetailScale: { value: this.model.surfaceDetailScale },
        uFineScale: { value: this.model.surfaceFineScale },
        uHotThreshold: { value: this.model.surfaceHotThreshold },
        uHotIntensity: { value: this.model.surfaceHotIntensity },
        uContrast: { value: this.model.surfaceContrast },
        uBrightness: { value: this.model.surfaceBrightness },
        uFresnelStrength: { value: this.model.surfaceFresnelStrength },
        uActivityRate: { value: this.model.activityRate },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPositionW = worldPosition.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vObjectPosition = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uBase;
        uniform vec3 uDeep;
        uniform vec3 uHot;
        uniform float uNoiseScale;
        uniform float uDetailScale;
        uniform float uFineScale;
        uniform float uHotThreshold;
        uniform float uHotIntensity;
        uniform float uContrast;
        uniform float uBrightness;
        uniform float uFresnelStrength;
        uniform float uActivityRate;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash31(i + vec3(0.0,0.0,0.0));
          float n100 = hash31(i + vec3(1.0,0.0,0.0));
          float n010 = hash31(i + vec3(0.0,1.0,0.0));
          float n110 = hash31(i + vec3(1.0,1.0,0.0));
          float n001 = hash31(i + vec3(0.0,0.0,1.0));
          float n101 = hash31(i + vec3(1.0,0.0,1.0));
          float n011 = hash31(i + vec3(0.0,1.0,1.0));
          float n111 = hash31(i + vec3(1.0,1.0,1.0));
          return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                     mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
        }
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.58;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise3(p);
            p = p * 2.18 + vec3(3.21, 1.77, 2.93);
            amplitude *= 0.46;
          }
          return value;
        }
        void main() {
          vec3 n = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.8);
          vec3 p = normalize(vObjectPosition);
          float t = uTime * 0.050 * uActivityRate;
          float broad = fbm(p * uNoiseScale + vec3(t * 1.2, -t * 0.62, uSeed));
          float medium = fbm(p * uDetailScale + vec3(-t * 0.86, t * 0.48, uSeed * 1.93));
          float fine = fbm(p * uFineScale + vec3(t * 0.70, uSeed * 1.3, -t));
          float streaks = smoothstep(0.55, 0.92, medium + fine * 0.20);
          float hotField = medium + 0.18 * broad + 0.25 * fine;
          float hotVeins = pow(smoothstep(uHotThreshold, min(0.985, uHotThreshold + 0.16), hotField), 1.95);
          float micro = smoothstep(0.76, 0.97, fine);
          float baseMix = clamp(0.16 + broad * 0.88, 0.0, 1.0);
          baseMix = clamp((baseMix - 0.5) * uContrast + 0.5, 0.0, 1.0);
          vec3 color = mix(uDeep, uBase, baseMix);
          color += uBase * streaks * 0.10;
          color = mix(color, uHot, clamp(hotVeins * uHotIntensity + micro * 0.14 * uHotIntensity, 0.0, 0.95));
          color += uHot * fresnel * uFresnelStrength * 1.15;
          float intensity = uBrightness * (0.94 + hotVeins * (0.58 + 0.36 * uHotIntensity) + micro * 0.16 + fresnel * 0.54);
          gl_FragColor = vec4(color * intensity, 1.0);
        }
      `,
      depthWrite: true,
    });
    this.surfaceShaderMaterials.push(material);

    const star = new THREE.Mesh(new THREE.SphereGeometry(0.74, 112, 80), material);
    group.add(star);

    const limb = new THREE.Mesh(
      new THREE.SphereGeometry(0.79, 72, 48),
      new THREE.MeshBasicMaterial({
        color: this.model.hotSurfaceColor,
        transparent: true,
        opacity: Math.min(0.16, 0.05 + this.model.surfaceFresnelStrength * 0.09),
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(limb);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(this.model.coronaRadius, 72, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color(this.model.glowColor) },
          uOpacity: { value: this.model.coronaOpacity },
          uSeed: { value: seed * 1.619 },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vPositionW = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uGlow;
          uniform float uOpacity;
          uniform float uSeed;
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPositionW);
            float rim = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 3.2);
            float azimuth = atan(vNormalW.y, vNormalW.x);
            float irregular = 0.70 + 0.30 * sin(azimuth * 8.0 + uSeed * 6.3) * sin(vNormalW.z * 10.0 + uSeed * 1.7);
            gl_FragColor = vec4(uGlow * (1.18 + rim), rim * uOpacity * irregular);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(corona);

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.08, 18, 120),
      new THREE.MeshBasicMaterial({
        color: this.model.glowColor,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    torus.rotation.x = Math.PI / 2;
    group.add(torus);
  }


  private addDetailedMagnetar(group: THREE.Group): void {
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSeed: { value: seed * 1.427 },
        uBase: { value: new THREE.Color(this.model.surfaceColor) },
        uDeep: { value: new THREE.Color(this.model.deepSurfaceColor) },
        uHot: { value: new THREE.Color(this.model.hotSurfaceColor) },
        uNoiseScale: { value: this.model.surfaceNoiseScale },
        uDetailScale: { value: this.model.surfaceDetailScale },
        uFineScale: { value: this.model.surfaceFineScale },
        uHotThreshold: { value: this.model.surfaceHotThreshold },
        uHotIntensity: { value: this.model.surfaceHotIntensity },
        uContrast: { value: this.model.surfaceContrast },
        uBrightness: { value: this.model.surfaceBrightness },
        uFresnelStrength: { value: this.model.surfaceFresnelStrength },
        uActivityRate: { value: this.model.activityRate },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPositionW = worldPosition.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vObjectPosition = position;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform float uSeed;
        uniform vec3 uBase;
        uniform vec3 uDeep;
        uniform vec3 uHot;
        uniform float uNoiseScale;
        uniform float uDetailScale;
        uniform float uFineScale;
        uniform float uHotThreshold;
        uniform float uHotIntensity;
        uniform float uContrast;
        uniform float uBrightness;
        uniform float uFresnelStrength;
        uniform float uActivityRate;
        varying vec3 vNormalW;
        varying vec3 vPositionW;
        varying vec3 vObjectPosition;

        float hash31(vec3 p) {
          p = fract(p * 0.1031);
          p += dot(p, p.yzx + 33.33);
          return fract((p.x + p.y) * p.z);
        }
        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float n000 = hash31(i + vec3(0.0,0.0,0.0));
          float n100 = hash31(i + vec3(1.0,0.0,0.0));
          float n010 = hash31(i + vec3(0.0,1.0,0.0));
          float n110 = hash31(i + vec3(1.0,1.0,0.0));
          float n001 = hash31(i + vec3(0.0,0.0,1.0));
          float n101 = hash31(i + vec3(1.0,0.0,1.0));
          float n011 = hash31(i + vec3(0.0,1.0,1.0));
          float n111 = hash31(i + vec3(1.0,1.0,1.0));
          return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
                     mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
        }
        float fbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.60;
          for (int i = 0; i < 6; i++) {
            value += amplitude * noise3(p);
            p = p * 2.12 + vec3(3.27, 1.67, 2.83);
            amplitude *= 0.47;
          }
          return value;
        }
        void main() {
          vec3 n = normalize(vNormalW);
          vec3 viewDir = normalize(cameraPosition - vPositionW);
          float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.6);
          vec3 p = normalize(vObjectPosition);
          float t = uTime * 0.040 * uActivityRate;
          float broad = fbm(p * uNoiseScale + vec3(t * 0.8, -t * 0.42, uSeed));
          float medium = fbm(p * uDetailScale + vec3(-t * 0.70, t * 0.34, uSeed * 1.77));
          float fine = fbm(p * uFineScale + vec3(t * 0.55, uSeed * 1.2, -t * 0.92));
          float fractures = smoothstep(0.62, 0.94, medium + fine * 0.28);
          float hotField = medium + 0.36 * broad + 0.18 * fine;
          float hotVeins = pow(smoothstep(uHotThreshold, min(0.985, uHotThreshold + 0.18), hotField), 1.85);
          float micro = smoothstep(0.74, 0.97, fine);
          float baseMix = clamp(0.17 + broad * 0.86, 0.0, 1.0);
          baseMix = clamp((baseMix - 0.5) * uContrast + 0.5, 0.0, 1.0);
          vec3 color = mix(uDeep, uBase, baseMix);
          color += uBase * fractures * 0.10;
          color = mix(color, uHot, clamp(hotVeins * uHotIntensity + micro * 0.16 * uHotIntensity, 0.0, 0.93));
          color += uHot * fresnel * uFresnelStrength * 1.05;
          float intensity = uBrightness * (0.92 + hotVeins * (0.56 + 0.40 * uHotIntensity) + micro * 0.12 + fresnel * 0.52 + fractures * 0.08);
          gl_FragColor = vec4(color * intensity, 1.0);
        }
      `,
      depthWrite: true,
    });
    this.surfaceShaderMaterials.push(material);

    const star = new THREE.Mesh(new THREE.SphereGeometry(0.86, 112, 80), material);
    group.add(star);

    const limb = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 72, 48),
      new THREE.MeshBasicMaterial({
        color: this.model.hotSurfaceColor,
        transparent: true,
        opacity: Math.min(0.18, 0.06 + this.model.surfaceFresnelStrength * 0.09),
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(limb);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(this.model.coronaRadius, 72, 48),
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color(this.model.glowColor) },
          uOpacity: { value: this.model.coronaOpacity },
          uSeed: { value: seed * 1.517 },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vPositionW = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uGlow;
          uniform float uOpacity;
          uniform float uSeed;
          varying vec3 vNormalW;
          varying vec3 vPositionW;
          void main() {
            vec3 viewDir = normalize(cameraPosition - vPositionW);
            float rim = pow(1.0 - abs(dot(normalize(vNormalW), viewDir)), 2.9);
            float azimuth = atan(vNormalW.y, vNormalW.x);
            float irregular = 0.68 + 0.32 * sin(azimuth * 7.0 + uSeed * 6.1) * sin(vNormalW.z * 9.0 + uSeed * 1.3);
            gl_FragColor = vec4(uGlow * (1.20 + rim * 1.05), rim * uOpacity * irregular);
          }
        `,
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(corona);

    this.addNeutronStarWisps(group, seed + 19);
    this.addMagnetarStormShell(group, seed);
  }

  private addMagnetarStormShell(group: THREE.Group, seed: number): void {
    const geometry = new THREE.TorusKnotGeometry(1.34, 0.035, 240, 18, 2, 3);
    const material = new THREE.MeshBasicMaterial({
      color: this.model.glowColor,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = seed * 0.31;
    mesh.rotation.z = seed * 0.19;
    mesh.scale.setScalar(0.92 + pseudo(seed * 13) * 0.14);
    group.add(mesh);
  }

  private addPulsarDipoleField(group: THREE.Group): void {
    if (!this.model.showMagneticField) return;
    const starRadius = this.model.type === 'MILLISECOND_PULSAR' ? 0.74 : 0.91;
    const count = Math.max(4, this.model.fieldLineCount);
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    for (let i = 0; i < count; i += 1) {
      const family = i % (this.model.type === 'MILLISECOND_PULSAR' ? 4 : 3);
      const r0 = this.model.fieldExtent * (0.73 + family * 0.12);
      const thetaMin = Math.asin(Math.min(0.985, Math.sqrt(starRadius / r0)));
      const phi = (i / count) * Math.PI * 2 + pseudo(seed * 19 + i * 13) * 0.18;
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 100; step += 1) {
        const theta = thetaMin + (Math.PI - 2 * thetaMin) * (step / 100);
        const r = r0 * Math.sin(theta) * Math.sin(theta);
        const transverse = r * Math.sin(theta);
        points.push(new THREE.Vector3(
          transverse * Math.cos(phi),
          r * Math.cos(theta),
          transverse * Math.sin(phi),
        ));
      }
      const material = new THREE.LineBasicMaterial({
        color: i % 4 === 0 ? this.model.accentColor : this.model.glowColor,
        transparent: true,
        opacity: 0.105 + 0.055 * (family / 2),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
  }

  private addRealisticPulsarBeams(group: THREE.Group): void {
    if (!this.model.showBeams) return;
    const halfAngle = THREE.MathUtils.degToRad(this.model.beamHalfOpeningAngleDegrees ?? 10);
    const isMillisecond = this.model.type === 'MILLISECOND_PULSAR';
    const length = isMillisecond ? 4.05 : 3.45;
    const outerRadius = Math.tan(halfAngle) * length;
    for (const direction of [-1, 1]) {
      const beamGroup = new THREE.Group();
      beamGroup.position.y = direction * 0.88;
      if (direction < 0) beamGroup.rotation.z = Math.PI;

      const outer = this.createPulsarBeamCone(length, outerRadius, this.model.glowColor, isMillisecond ? 0.095 : 0.115, isMillisecond ? 2.25 : 1.9);
      outer.position.y = length / 2;
      beamGroup.add(outer);

      const coreRadius = Math.max(isMillisecond ? 0.035 : 0.055, outerRadius * (isMillisecond ? 0.22 : 0.34));
      const core = this.createPulsarBeamCone(length * (isMillisecond ? 1.18 : 1.08), coreRadius, this.model.accentColor, isMillisecond ? 0.30 : 0.21, isMillisecond ? 3.4 : 2.8);
      core.position.y = (length * (isMillisecond ? 1.18 : 1.08)) / 2;
      beamGroup.add(core);

      const axialGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(isMillisecond ? 0.010 : 0.014, isMillisecond ? 0.040 : 0.055, length * 0.96, 20, 1, true),
        new THREE.MeshBasicMaterial({
          color: this.model.hotSurfaceColor,
          transparent: true,
          opacity: isMillisecond ? 0.30 : 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      axialGlow.position.y = length * 0.48;
      beamGroup.add(axialGlow);
      group.add(beamGroup);
    }
  }

  private createPulsarBeamCone(
    length: number,
    radius: number,
    color: number,
    opacity: number,
    edgePower: number,
  ): THREE.Mesh {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uLength: { value: length },
        uRadius: { value: radius },
        uEdgePower: { value: edgePower },
      },
      vertexShader: `
        varying vec3 vLocalPosition;
        void main() {
          vLocalPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uLength;
        uniform float uRadius;
        uniform float uEdgePower;
        varying vec3 vLocalPosition;
        void main() {
          float axial = clamp((vLocalPosition.y + uLength * 0.5) / uLength, 0.0, 1.0);
          float localRadius = max(0.0001, uRadius * axial);
          float radial = length(vLocalPosition.xz) / localRadius;
          float edge = pow(max(0.0, 1.0 - radial), uEdgePower);
          float rootFade = smoothstep(0.0, 0.10, axial);
          float tipFade = 1.0 - smoothstep(0.72, 1.0, axial);
          float alpha = uOpacity * edge * rootFade * (0.42 + 0.58 * tipFade);
          gl_FragColor = vec4(uColor * (1.15 + edge * 0.75), alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(new THREE.CylinderGeometry(radius, 0, length, 56, 1, true), material);
  }

  private addNeutronStarWisps(group: THREE.Group, seed: number): void {
    const count = this.model.wispCount;
    for (let i = 0; i < count; i += 1) {
      const phase = pseudo(seed * 17 + i * 9) * Math.PI * 2;
      const tilt = (pseudo(seed * 31 + i * 7) - 0.5) * 1.25;
      const radiusX = (1.32 + pseudo(seed * 13 + i * 5) * 0.76) * this.model.wispSpread;
      const radiusY = (0.58 + pseudo(seed * 23 + i * 11) * 0.44) * (0.84 + this.model.wispSpread * 0.16);
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 64; step += 1) {
        const a = (step / 64) * Math.PI * 2;
        const ripple = 1.0 + 0.035 * Math.sin(a * 5.0 + phase * 1.7);
        const point = new THREE.Vector3(
          Math.cos(a + phase) * radiusX * ripple,
          Math.sin(a + phase) * radiusY,
          0.16 * Math.sin(a * 2.0 + phase),
        );
        point.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
        point.applyAxisAngle(new THREE.Vector3(0, 1, 0), phase * 0.35);
        points.push(point);
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? this.model.accentColor : this.model.glowColor,
        transparent: true,
        opacity: this.model.wispOpacity * (0.65 + pseudo(seed * 41 + i) * 0.70),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Line(geometry, material));
    }
  }

  private addPolarCaps(group: THREE.Group): void {
    if (!this.model.showBeams && this.model.type !== 'MAGNETAR') return;
    for (const direction of [-1, 1]) {
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.125, 24, 16),
        new THREE.MeshBasicMaterial({
          color: this.model.accentColor,
          transparent: true,
          opacity: this.model.type === 'MAGNETAR' ? 0.74 : 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      cap.position.y = direction * (this.model.type === 'PULSAR' ? 0.885 : this.model.type === 'MILLISECOND_PULSAR' ? 0.73 : 0.735);
      cap.scale.set(
        this.model.type === 'PULSAR' ? 0.72 : this.model.type === 'MILLISECOND_PULSAR' ? 0.54 : 1.0,
        this.model.type === 'PULSAR' ? 0.32 : this.model.type === 'MILLISECOND_PULSAR' ? 0.24 : 0.48,
        this.model.type === 'PULSAR' ? 0.72 : this.model.type === 'MILLISECOND_PULSAR' ? 0.54 : 1.0,
      );
      group.add(cap);
    }
  }

  private addPulsarBeams(group: THREE.Group): void {
    const halfAngle = THREE.MathUtils.degToRad(this.model.beamHalfOpeningAngleDegrees ?? 10);
    const length = this.model.type === 'MILLISECOND_PULSAR' ? 3.5 : 3.1;
    const radius = Math.tan(halfAngle) * length;
    for (const direction of [-1, 1]) {
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(radius, length, 42, 1, true),
        new THREE.MeshBasicMaterial({
          color: this.model.accentColor,
          transparent: true,
          opacity: this.model.type === 'MILLISECOND_PULSAR' ? 0.20 : 0.16,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      beam.position.y = direction * (0.82 + length / 2);
      if (direction < 0) beam.rotation.z = Math.PI;
      group.add(beam);
    }
  }


  private addMagnetarField(group: THREE.Group): void {
    const count = Math.max(8, this.model.fieldLineCount);
    for (let i = 0; i < count; i += 1) {
      const phase = (i / count) * Math.PI * 2;
      const extent = this.model.fieldExtent * (0.78 + 0.26 * ((i % 4) / 3));
      const wobble = 0.08 + 0.05 * pseudo(i * 17 + this.model.sampleLabel.charCodeAt(0));
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 120; step += 1) {
        const theta = (step / 120) * Math.PI * 2;
        const x = Math.cos(theta) * extent * (1.0 + wobble * Math.sin(theta * 3.0 + phase));
        const y = Math.sin(theta) * (extent * 0.46 + wobble * 0.5 * Math.cos(theta * 2.0));
        const z = Math.sin(theta * 2.0 + phase) * 0.20 + Math.cos(theta * 3.0) * 0.09;
        const point = new THREE.Vector3(x, y, z)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), phase * 0.52)
          .applyAxisAngle(new THREE.Vector3(1, 0, 0), (phase - Math.PI) * 0.14);
        points.push(point);
      }
      const material = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? this.model.accentColor : this.model.glowColor,
        transparent: true,
        opacity: 0.22 + 0.06 * ((i % 4) / 3),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
  }

  private addMagnetarReconnectionArcs(group: THREE.Group): void {
    const count = Math.max(4, Math.round(this.model.wispCount * 0.7));
    const seed = Math.max(1, this.model.sampleLabel.charCodeAt(0) - 64);
    for (let i = 0; i < count; i += 1) {
      const phase = pseudo(seed * 23 + i * 11) * Math.PI * 2;
      const height = 0.55 + pseudo(seed * 31 + i * 7) * 1.05;
      const span = 0.45 + pseudo(seed * 41 + i * 5) * 0.95;
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 30; step += 1) {
        const t = step / 30;
        const x = (t - 0.5) * span;
        const y = Math.sin(t * Math.PI) * height;
        const z = Math.sin(t * Math.PI * 2 + phase) * 0.08;
        const point = new THREE.Vector3(x, y, z)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), phase)
          .applyAxisAngle(new THREE.Vector3(1, 0, 0), (pseudo(seed * 59 + i) - 0.5) * 1.15);
        points.push(point);
      }
      const material = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? this.model.hotSurfaceColor : this.model.accentColor,
        transparent: true,
        opacity: 0.20 + pseudo(seed * 71 + i) * 0.10,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
  }

  private addMagneticField(group: THREE.Group): void {
    const material = new THREE.LineBasicMaterial({
      color: this.model.type === 'MAGNETAR' ? 0xb4a5ff : 0x77d8ff,
      transparent: true,
      opacity: this.model.type === 'MAGNETAR' ? 0.56 : 0.25,
      blending: THREE.AdditiveBlending,
    });
    const count = Math.max(1, this.model.fieldLineCount);
    for (let i = 0; i < count; i += 1) {
      const phase = (i / count) * Math.PI;
      const extent = this.model.fieldExtent * (0.76 + 0.24 * ((i % 3) / 2));
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 90; step += 1) {
        const theta = (step / 90) * Math.PI * 2;
        const x = Math.cos(theta) * extent;
        const y = Math.sin(theta) * (extent * 0.54);
        const z = Math.sin(theta) * 0.16 * Math.sin(phase * 2) + Math.cos(theta) * 0.13;
        points.push(new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), phase));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material.clone()));
    }
  }

  private createBackgroundStars(): THREE.Points {
    const positions: number[] = [];
    for (let i = 0; i < 220; i += 1) {
      const a = pseudo(i * 3 + 1) * Math.PI * 2;
      const u = pseudo(i * 3 + 2) * 2 - 1;
      const r = 8 + pseudo(i * 3 + 3) * 9;
      const s = Math.sqrt(1 - u * u);
      positions.push(r * s * Math.cos(a), r * u, r * s * Math.sin(a));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: 0xb8d7e7, size: 0.028, transparent: true, opacity: 0.62 }),
    );
  }

  private animate = (timeMs: number): void => {
    if (this.renderer === null || this.scene === null || this.camera === null) return;
    const delta = this.lastFrameMs === 0 ? 0 : Math.min(0.05, (timeMs - this.lastFrameMs) / 1000);
    this.lastFrameMs = timeMs;
    if (!this.paused() && this.spinGroup !== null) {
      this.spinGroup.rotation.y += delta * Math.PI * 2 / Math.max(1, this.model.visualRotationSeconds);
      for (const material of this.surfaceShaderMaterials) {
        material.uniforms['uTime'].value += delta;
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resize(): void {
    const host = this.renderHost?.nativeElement;
    if (host === undefined || this.renderer === null || this.camera === null) return;
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
      if (Array.isArray(material)) material.forEach(item => item.dispose());
      else material?.dispose();
    });
    this.surfaceShaderMaterials = [];
    this.spinGroup = null;
    this.magneticGroup = null;
  }
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}
