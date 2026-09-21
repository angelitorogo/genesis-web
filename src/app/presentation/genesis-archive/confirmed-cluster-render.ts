import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import {
  ArchiveGalacticObjectKnowledgeLevel,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';
import {
  buildConfirmedClusterField,
  type ConfirmedClusterField,
  type ConfirmedClusterKind,
} from './confirmed-cluster-field';
import { GlobularClusterRender } from './globular-cluster-render';
import { OpenClusterRender } from './open-cluster-render';

@Component({
  selector: 'app-confirmed-cluster-render',
  standalone: true,
  imports: [GlobularClusterRender, OpenClusterRender],
  templateUrl: './confirmed-cluster-render.html',
  styleUrl: './confirmed-cluster-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmedClusterRender implements AfterViewInit, OnDestroy {
  readonly descriptor = input.required<ArchiveGalacticObjectRenderDescriptor>();
  readonly clusterKind = input.required<ConfirmedClusterKind>();
  readonly fallback = signal(false);
  readonly autoRotate = signal(false);

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewport') private viewportRef?: ElementRef<HTMLDivElement>;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private points: THREE.Points | null = null;
  private backgroundStars: THREE.Points | null = null;
  private coreSprite: THREE.Sprite | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.ShaderMaterial | null = null;
  private observer: ResizeObserver | null = null;
  private intersection: IntersectionObserver | null = null;
  private animationFrame = 0;
  private visible = true;
  private destroyed = false;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private yaw = 0;
  private pitch = 0;
  private zoom = 1;
  private field: ConfirmedClusterField | null = null;
  private readonly visibilityChanged = () => this.refreshAnimationLoop();

  constructor() {
    effect(() => {
      const descriptor = this.descriptor();
      const kind = this.clusterKind();
      if (descriptor.knowledgeLevel !== ArchiveGalacticObjectKnowledgeLevel.CONFIRMED) {
        this.fallback.set(true);
        this.dispose3d();
        return;
      }
      if (this.renderer !== null) {
        this.replaceField(descriptor, kind);
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.fallback()) {
      return;
    }
    try {
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) {
        throw new Error('Confirmed cluster canvas is unavailable.');
      }
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x02060d, 1);
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 40);
      this.replaceField(this.descriptor(), this.clusterKind());
      if (typeof ResizeObserver !== 'undefined' && this.viewportRef) {
        this.observer = new ResizeObserver(() => this.resize());
        this.observer.observe(this.viewportRef.nativeElement);
      }
      if (typeof IntersectionObserver !== 'undefined' && this.viewportRef) {
        this.intersection = new IntersectionObserver((entries) => {
          this.visible = entries[0]?.isIntersecting ?? false;
          this.refreshAnimationLoop();
        });
        this.intersection.observe(this.viewportRef.nativeElement);
      }
      document.addEventListener('visibilitychange', this.visibilityChanged);
      this.resetView();
      this.resize();
      this.renderScene();
      this.refreshAnimationLoop();
    } catch {
      this.dispose3d();
      queueMicrotask(() => {
        if (!this.destroyed) {
          this.fallback.set(true);
        }
      });
    }
  }

  private replaceField(
    descriptor: ArchiveGalacticObjectRenderDescriptor,
    kind: ConfirmedClusterKind,
  ): void {
    if (!this.scene) {
      return;
    }
    const field = buildConfirmedClusterField(descriptor, kind);
    this.field = field;

    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.points = null;
    }
    if (this.backgroundStars) {
      this.scene.remove(this.backgroundStars);
      this.backgroundStars.geometry.dispose();
      (this.backgroundStars.material as THREE.Material).dispose();
      this.backgroundStars = null;
    }
    if (this.coreSprite) {
      this.scene.remove(this.coreSprite);
      (this.coreSprite.material as THREE.Material).dispose();
      this.coreSprite = null;
    }
    this.geometry?.dispose();
    this.material?.dispose();

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(field.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(field.colors, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(field.sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      vertexColors: true,
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) },
        uDepthSizeFactor: { value: field.kind === 'GLOBULAR' ? 0.0 : 0.010 },
      },
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        uniform float uPixelRatio;
        uniform float uDepthSizeFactor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float depthScale = clamp(1.0 + (-mvPosition.z) * uDepthSizeFactor, 0.96, 1.08);
          gl_PointSize = aSize * uPixelRatio * depthScale;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 centred = gl_PointCoord - vec2(0.5);
          float radius = length(centred);
          if (radius > 0.5) discard;
          float core = smoothstep(0.33, 0.0, radius);
          float halo = smoothstep(0.50, 0.0, radius);
          float alpha = halo * (0.22 + core * 0.78);
          vec3 colour = mix(vColor * 0.88, vColor, core);
          gl_FragColor = vec4(colour, alpha);
        }
      `,
    });

    this.geometry = geometry;
    this.material = material;
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    this.backgroundStars = buildBackgroundStars(`${descriptor.seed}/${kind}/BACKGROUND`);
    this.scene.add(this.backgroundStars);

    this.coreSprite = buildCoreSprite(field);
    if (this.coreSprite) {
      this.scene.add(this.coreSprite);
    }

    this.zoom = field.initialZoom;
    this.yaw = 0;
    this.pitch = 0;
    this.resize();
    this.renderScene();
  }

  adjustZoom(multiplier: number): void {
    this.zoom = clamp(this.zoom * multiplier, 0.72, 6.0);
    this.resize();
    this.renderScene();
  }

  resetView(): void {
    this.yaw = 0;
    this.pitch = 0;
    this.zoom = this.field?.initialZoom ?? 1;
    this.resize();
    this.renderScene();
  }

  toggleAnimation(): void {
    this.autoRotate.update((value) => !value);
    this.refreshAnimationLoop();
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.canvasRef?.nativeElement.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.yaw += deltaX * 0.008;
    this.pitch = clamp(this.pitch + deltaY * 0.006, -1.15, 1.15);
    this.renderScene();
  }

  onPointerUp(): void {
    this.dragging = false;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.adjustZoom(event.deltaY > 0 ? 1 / 1.10 : 1.10);
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case '+':
      case '=':
        this.adjustZoom(1.10);
        event.preventDefault();
        return;
      case '-':
      case '_':
        this.adjustZoom(1 / 1.10);
        event.preventDefault();
        return;
      case 'ArrowLeft':
        this.yaw -= 0.08;
        this.renderScene();
        event.preventDefault();
        return;
      case 'ArrowRight':
        this.yaw += 0.08;
        this.renderScene();
        event.preventDefault();
        return;
      case 'ArrowUp':
        this.pitch = clamp(this.pitch - 0.06, -1.15, 1.15);
        this.renderScene();
        event.preventDefault();
        return;
      case 'ArrowDown':
        this.pitch = clamp(this.pitch + 0.06, -1.15, 1.15);
        this.renderScene();
        event.preventDefault();
        return;
      case 'Home':
        this.resetView();
        event.preventDefault();
        return;
    }
  }

  onContextLost(event: Event): void {
    event.preventDefault();
    this.dispose3d();
    this.fallback.set(true);
  }

  private resize(): void {
    if (!this.renderer || !this.camera || !this.viewportRef || !this.field) {
      return;
    }
    const viewport = this.viewportRef.nativeElement;
    const width = Math.max(1, viewport.clientWidth || 1);
    const height = Math.max(1, viewport.clientHeight || 1);
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    const baseHalfWidth = this.field.xExtent * 1.10;
    const baseHalfHeight = this.field.yExtent * 1.10;
    const desiredHalfWidth = Math.max(baseHalfWidth, baseHalfHeight * aspect);
    const desiredHalfHeight = Math.max(baseHalfHeight, baseHalfWidth / aspect);
    const zoom = this.zoom;
    this.camera.left = -desiredHalfWidth / zoom;
    this.camera.right = desiredHalfWidth / zoom;
    this.camera.top = desiredHalfHeight / zoom;
    this.camera.bottom = -desiredHalfHeight / zoom;
    this.camera.updateProjectionMatrix();
  }

  private refreshAnimationLoop(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.visible) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      }
      return;
    }
    if (!this.autoRotate()) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = 0;
      }
      return;
    }
    if (!this.animationFrame) {
      this.animationFrame = requestAnimationFrame(() => this.tick());
    }
  }

  private tick(): void {
    this.animationFrame = 0;
    if (!this.autoRotate() || !this.visible) {
      return;
    }
    this.yaw += 0.0026;
    this.renderScene();
    this.animationFrame = requestAnimationFrame(() => this.tick());
  }

  private renderScene(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.field) {
      return;
    }
    const radius = 8 + this.field.zExtent * 2.6;
    const cosinePitch = Math.cos(this.pitch);
    this.camera.position.set(
      radius * Math.sin(this.yaw) * cosinePitch,
      radius * Math.sin(this.pitch),
      radius * Math.cos(this.yaw) * cosinePitch,
    );
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.dispose3d();
  }

  private dispose3d(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.observer?.disconnect();
    this.intersection?.disconnect();
    this.observer = null;
    this.intersection = null;
    if (this.points && this.scene) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
    }
    if (this.backgroundStars && this.scene) {
      this.scene.remove(this.backgroundStars);
      this.backgroundStars.geometry.dispose();
      (this.backgroundStars.material as THREE.Material).dispose();
    }
    if (this.coreSprite && this.scene) {
      this.scene.remove(this.coreSprite);
      (this.coreSprite.material as THREE.Material).dispose();
    }
    this.points = null;
    this.backgroundStars = null;
    this.coreSprite = null;
    this.geometry = null;
    this.material = null;
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }
}

function buildBackgroundStars(seed: string): THREE.Points {
  const random = seededRandom(seed);
  const count = 700;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 18;
    positions[index * 3 + 1] = (random() - 0.5) * 10;
    positions[index * 3 + 2] = -3.0 - random() * 5.5;
    const white = 0.64 + random() * 0.30;
    const warm = random() < 0.16 ? 0.08 : 0;
    const cool = random() < 0.20 ? 0.10 : 0;
    colors[index * 3] = Math.min(1, white + warm);
    colors[index * 3 + 1] = white;
    colors[index * 3 + 2] = Math.min(1, white + cool);
    sizes[index] = 0.25 + Math.pow(random(), 1.6) * 0.95;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    vertexColors: true,
    uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * uPixelRatio;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 centred = gl_PointCoord - vec2(0.5);
        float radius = length(centred);
        if (radius > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, radius) * 0.85;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
  });

  return new THREE.Points(geometry, material);
}

function buildCoreSprite(field: ConfirmedClusterField): THREE.Sprite | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }
  const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 244, 230, 0.72)');
  gradient.addColorStop(0.28, 'rgba(255, 232, 198, 0.26)');
  gradient.addColorStop(0.56, 'rgba(220, 232, 255, 0.06)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    opacity: field.kind === 'GLOBULAR' ? 0.38 : 0.12,
  });
  const sprite = new THREE.Sprite(material);
  const size = field.kind === 'GLOBULAR'
    ? Math.max(field.xExtent, field.yExtent) * 0.84
    : Math.max(field.xExtent, field.yExtent) * 0.22;
  sprite.scale.set(size, size, 1);
  sprite.position.set(0, 0, -0.04);
  return sprite;
}

function seededRandom(seed: string): () => number {
  const hash = hashWords(seed);
  let a = hash[0] || 0x9e3779b9;
  let b = hash[1] || 0x243f6a88;
  let c = hash[2] || 0xb7e15162;
  let d = hash[3] || 0x8aed2a6b;
  return () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return (t >>> 0) / 0x100000000;
  };
}

function hashWords(seed: string): Uint32Array {
  const output = new Uint32Array(4);
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x243f6a88;
  let h4 = 0xb7e15162;
  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ code, 2246822519);
    h3 = Math.imul(h3 ^ code, 3266489917);
    h4 = Math.imul(h4 ^ code, 668265263);
  }
  output[0] = h1 >>> 0;
  output[1] = h2 >>> 0;
  output[2] = h3 >>> 0;
  output[3] = h4 >>> 0;
  return output;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
