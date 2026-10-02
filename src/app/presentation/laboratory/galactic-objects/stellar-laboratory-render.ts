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

@Component({
  selector: 'app-stellar-laboratory-render',
  standalone: true,
  templateUrl: './stellar-laboratory-render.html',
  styleUrl: './stellar-laboratory-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StellarLaboratoryRender implements AfterViewInit, OnChanges, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('renderCanvas') private renderCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('renderHost') private renderHost?: ElementRef<HTMLElement>;

  @Input() colorHex = '#fff2cf';
  @Input() luminosityHint = 2.1;
  @Input() embedded = false;

  readonly renderUnavailable = signal(false);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private frameDisposables: THREE.Material[] = [];
  private textureDisposables: THREE.Texture[] = [];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initializeThree();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['colorHex'] || changes['luminosityHint']) && this.renderer !== null) {
      this.rebuildScene();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.disposeSceneObjects();
    this.renderer?.dispose();
    this.renderer = null;
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
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        context: context as WebGLRenderingContext,
        antialias: true,
        alpha: true,
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 0);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      this.camera.position.set(0, 0, 11.5);
      this.camera.lookAt(0, 0, 0);

      this.rebuildScene();
      this.resize();

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(host);
      }
    } catch {
      this.renderUnavailable.set(true);
      this.renderer?.dispose();
      this.renderer = null;
    }
  }

  private rebuildScene(): void {
    if (this.scene === null || this.camera === null || this.renderer === null) return;

    this.disposeSceneObjects();
    this.scene.clear();

    const optical = stellarOpticalProfile(this.colorHex, this.luminosityHint);
    const haloTexture = createRadialGlowTexture('broad');
    const bloomTexture = createRadialGlowTexture('compact');
    const glareTexture = createStellarGlareTexture();

    this.textureDisposables.push(haloTexture, bloomTexture, glareTexture);

    const group = new THREE.Group();

    const sphereGeometry = new THREE.SphereGeometry(1.52, 64, 48);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: this.colorHex,
      toneMapped: false,
    });
    const photosphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.frameDisposables.push(sphereMaterial);

    const coronaMaterial = stellarSpriteMaterial(
      haloTexture,
      this.colorHex,
      optical.coronaOpacity,
    );
    const corona = new THREE.Sprite(coronaMaterial);
    corona.scale.set(optical.coronaDiameterScale, optical.coronaDiameterScale, 1);

    const bloomMaterial = stellarSpriteMaterial(
      bloomTexture,
      this.colorHex,
      optical.bloomOpacity,
    );
    const bloom = new THREE.Sprite(bloomMaterial);
    bloom.scale.set(optical.bloomDiameterScale, optical.bloomDiameterScale, 1);

    const aureoleMaterial = stellarSpriteMaterial(
      bloomTexture,
      this.colorHex,
      optical.aureoleOpacity,
    );
    const aureole = new THREE.Sprite(aureoleMaterial);
    aureole.scale.set(optical.aureoleDiameterScale, optical.aureoleDiameterScale, 1);

    const glareMaterial = stellarSpriteMaterial(
      glareTexture,
      stellarDiffractionColor(this.colorHex, optical.energy01),
      optical.glareOpacity,
    );
    const glare = new THREE.Sprite(glareMaterial);
    glare.scale.set(optical.glareDiameterScale, optical.glareDiameterScale, 1);

    this.frameDisposables.push(coronaMaterial, bloomMaterial, aureoleMaterial, glareMaterial);

    group.add(corona, glare, bloom, aureole, photosphere);
    this.scene.add(group);

    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const host = this.renderHost?.nativeElement;
    if (host === undefined || this.renderer === null || this.camera === null) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene!, this.camera);
  }

  private disposeSceneObjects(): void {
    for (const material of this.frameDisposables) {
      material.dispose();
    }
    this.frameDisposables = [];

    for (const texture of this.textureDisposables) {
      texture.dispose();
    }
    this.textureDisposables = [];
  }
}

function stellarSpriteMaterial(
  texture: THREE.Texture,
  color: THREE.ColorRepresentation,
  opacity: number,
): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

function stellarOpticalProfile(
  colorHex: string,
  luminosityHint: number,
): {
  readonly energy01: number;
  readonly coronaDiameterScale: number;
  readonly bloomDiameterScale: number;
  readonly aureoleDiameterScale: number;
  readonly glareDiameterScale: number;
  readonly coronaOpacity: number;
  readonly bloomOpacity: number;
  readonly aureoleOpacity: number;
  readonly glareOpacity: number;
} {
  const rgb = parseDisplayHexColor(colorHex);
  const luminance = (0.2126 * rgb.red + 0.7152 * rgb.green + 0.0722 * rgb.blue) / 255;
  const blueBias = clamp01(0.5 + (rgb.blue - rgb.red) / 510);
  const massEnergy = clamp01((luminosityHint - 1.2) / (3.4 - 1.2));
  const energy01 = clamp01(0.14 + 0.24 * luminance + 0.18 * blueBias + 0.24 * massEnergy);

  return Object.freeze({
    energy01,
    coronaDiameterScale: 2 * (4.9 + 3.9 * energy01),
    bloomDiameterScale: 2 * (3.05 + 2.05 * energy01),
    aureoleDiameterScale: 2 * (1.95 + 1.05 * energy01),
    glareDiameterScale: 2 * (9.2 + 8.6 * energy01),
    coronaOpacity: 0.16 + 0.16 * energy01,
    bloomOpacity: 0.30 + 0.26 * energy01,
    aureoleOpacity: 0.36 + 0.28 * energy01,
    glareOpacity: 0.58 + 0.22 * energy01,
  });
}

function stellarDiffractionColor(
  stellarColorHex: string,
  energy01: number,
): THREE.Color {
  const stellar = new THREE.Color(stellarColorHex);
  return stellar.lerp(new THREE.Color(0xffffff), 0.34 + 0.18 * energy01);
}

function parseDisplayHexColor(
  colorHex: string,
): {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
} {
  const normalized = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
  if (normalized.length !== 6) {
    return Object.freeze({ red: 255, green: 255, blue: 255 });
  }

  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) {
    return Object.freeze({ red: 255, green: 255, blue: 255 });
  }

  return Object.freeze({
    red: (value >> 16) & 0xff,
    green: (value >> 8) & 0xff,
    blue: value & 0xff,
  });
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function createRadialGlowTexture(
  kind: 'broad' | 'compact',
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Unable to create stellar glow texture.');
  }

  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);

  if (kind === 'compact') {
    gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
    gradient.addColorStop(0.12, 'rgba(255,255,255,0.82)');
    gradient.addColorStop(0.30, 'rgba(255,255,255,0.34)');
    gradient.addColorStop(0.58, 'rgba(255,255,255,0.075)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
  } else {
    gradient.addColorStop(0, 'rgba(255,255,255,0.70)');
    gradient.addColorStop(0.16, 'rgba(255,255,255,0.36)');
    gradient.addColorStop(0.40, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(0.72, 'rgba(255,255,255,0.025)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createStellarGlareTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('Unable to create stellar diffraction texture.');
  }

  const center = size / 2;
  const centralGlow = context.createRadialGradient(center, center, 0, center, center, 54);
  centralGlow.addColorStop(0, 'rgba(255,255,255,0.95)');
  centralGlow.addColorStop(0.18, 'rgba(255,255,255,0.42)');
  centralGlow.addColorStop(0.55, 'rgba(255,255,255,0.08)');
  centralGlow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = centralGlow;
  context.fillRect(center - 54, center - 54, 108, 108);

  drawDiffractionBeam(context, center, 0, 158, 15, 0.14);
  drawDiffractionBeam(context, center, 45, 112, 11, 0.09);
  drawDiffractionBeam(context, center, 90, 158, 15, 0.14);
  drawDiffractionBeam(context, center, 135, 112, 11, 0.09);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function drawDiffractionBeam(
  context: CanvasRenderingContext2D,
  center: number,
  angleDegrees: number,
  halfLength: number,
  width: number,
  alpha: number,
): void {
  context.save();
  context.translate(center, center);
  context.rotate((angleDegrees * Math.PI) / 180);
  const gradient = context.createLinearGradient(-halfLength, 0, halfLength, 0);
  gradient.addColorStop(0, 'rgba(255,255,255,0)');
  gradient.addColorStop(0.18, `rgba(255,255,255,${alpha * 0.32})`);
  gradient.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
  gradient.addColorStop(0.82, `rgba(255,255,255,${alpha * 0.32})`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(-halfLength, -width / 2, halfLength * 2, width);
  context.restore();
}
