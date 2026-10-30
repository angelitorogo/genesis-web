import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1, type Vida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { etiquetaVidaEs } from '../scientific/vida9-etiquetas-es';

@Component({
  selector: 'app-life-species-visual-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host{display:block}
    .panel{padding:1rem;border:1px solid rgba(106,215,255,.18);border-radius:14px;background:linear-gradient(180deg,rgba(10,16,24,.94),rgba(7,11,18,.88));box-shadow:inset 0 1px 0 rgba(140,226,255,.06)}
    .header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.75rem;align-items:flex-start;margin-bottom:.85rem}
    .title{margin:0;font-size:1.1rem}.info{margin:.3rem 0 0;color:var(--genesis-color-text-muted,#b4c1cd);line-height:1.55}
    .toolbar{display:flex;gap:.5rem;flex-wrap:wrap}
    .btn{border:1px solid rgba(114,219,247,.45);background:rgba(18,35,52,.78);color:#d8f3ff;border-radius:10px;padding:.45rem .75rem;font:inherit;cursor:pointer}
    .btn:hover{background:rgba(22,44,64,.92)}
    .viewport{position:relative;min-height:24rem;border-radius:14px;overflow:hidden;border:1px solid rgba(106,215,255,.12);background:radial-gradient(circle at 50% 26%, rgba(62,91,116,.38), rgba(7,12,18,.9) 46%, #04070b 100%)}
    canvas{display:block;width:100%;height:100%}
    .overlay{position:absolute;left:1rem;bottom:1rem;display:grid;gap:.45rem;max-width:min(100%,26rem)}
    .pill{display:inline-flex;align-items:center;gap:.45rem;width:max-content;max-width:100%;padding:.35rem .55rem;border-radius:999px;border:1px solid rgba(113,221,255,.28);background:rgba(4,10,18,.72);color:#d8f6ff;font-size:.78rem;letter-spacing:.03em;white-space:nowrap}
    .legend{padding:.7rem .85rem;border-radius:12px;border:1px solid rgba(106,215,255,.14);background:rgba(5,10,17,.74);color:#d8eaf6}
    .legend strong{display:block;margin-bottom:.35rem}.legend p{margin:0;color:var(--genesis-color-text-muted,#b4c1cd);line-height:1.5;font-size:.9rem}
    .swatches{display:flex;gap:.5rem;align-items:center}.swatch{display:inline-block;width:1.2rem;height:1.2rem;border-radius:4px;border:1px solid rgba(194,215,228,.55)}
    .meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:.65rem;margin-top:.85rem}.meta-card{padding:.65rem;border:1px solid rgba(106,215,255,.12);border-radius:10px}.meta-card span{display:block;color:#9eb2c3;font-size:.75rem;margin-bottom:.25rem}
  `],
  template: `
    <section class="panel" data-testid="vida38-preview-panel">
      <div class="header">
        <div>
          <h3 class="title">Reconstrucción visual 38.2</h3>
          <p class="info">Modelo 3D procedural derivado del contrato 38.1; la anatomía que el contrato no especifica es una hipótesis artística, no una imagen observada.</p>
        </div>
        <div class="toolbar">
          <button class="btn" type="button" (click)="toggleAnimation()">{{paused ? 'Reanudar animación' : 'Pausar animación'}}</button>
          <button class="btn" type="button" (click)="resetView()">Restablecer vista</button>
        </div>
      </div>
      <div class="viewport" #viewport>
        <canvas #canvas aria-label="Vista procedural 3D de la especie"></canvas>
        @if (descriptor !== null) {
          <div class="overlay">
            <span class="pill">{{etiqueta(descriptor.family)}} · {{etiqueta(descriptor.habitatCue)}} · {{descriptor.bodyScaleClass}}</span>
            <div class="legend">
              <strong>{{contract?.speciesName}}</strong>
              <p>
                Muestra base 38.2: morfología, tamaño, locomoción, pigmentación y adaptaciones.
                @if (descriptor.specialistIntelligenceDeferred) {
                  <span> La variedad morfológica específica de civilizaciones se ampliará en 38.3.</span>
                }
              </p>
              <div class="swatches" style="margin-top:.65rem">
                <span class="swatch" [style.backgroundColor]="descriptor.primaryColorHex" aria-label="Pigmento principal"></span>
                <span class="swatch" [style.backgroundColor]="descriptor.secondaryColorHex" aria-label="Pigmento secundario"></span>
              </div>
            </div>
          </div>
        }
      </div>
      @if (descriptor !== null) {
        <div class="meta">
          <div class="meta-card"><span>Familia de render</span><strong>{{etiqueta(descriptor.family)}}</strong></div>
          <div class="meta-card"><span>Locomoción</span><strong>{{etiqueta(descriptor.locomotion)}}</strong></div>
          <div class="meta-card"><span>Pares de apéndices</span><strong>{{descriptor.appendagePairs}}</strong></div>
          <div class="meta-card"><span>Adaptaciones usadas</span><strong>{{descriptor.adaptationTags.length}}</strong></div>
        </div>
      }
    </section>
  `,
})
export class LifeSpeciesVisualPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) contract: Vida38SpeciesVisualContract | null = null;
  @ViewChild('canvas', { static: true }) private readonly canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewport', { static: true }) private readonly viewportRef?: ElementRef<HTMLDivElement>;

  readonly etiqueta = (code: string) => {
    const lookup: Record<string, string> = {
      MICROBIAL_COLONY: 'Colonia microbiana',
      FUNGAL_CLUSTER: 'Agregado fúngico',
      PLANT_FORM: 'Forma vegetal',
      INSECT_BODY: 'Cuerpo artrópodo',
      QUADRUPED_BODY: 'Cuerpo cuadrúpedo',
      AVIAN_BODY: 'Cuerpo alado',
      BIPED_BODY: 'Cuerpo bípedo',
      ROCK: 'Refugio rocoso',
      SOIL: 'Suelo superficial',
      WET: 'Margen húmedo',
      CANOPY: 'Dosel vegetal',
      AIR: 'Aire superficial',
      SUBSURFACE_WATER: 'Microhábitat protegido',
      MICRO: 'Escala micro',
      SMALL: 'Escala pequeña',
      MEDIUM: 'Escala media',
      LARGE: 'Escala grande',
    };
    return lookup[code] ?? etiquetaVidaEs(code);
  };

  descriptor = this.contract ? describeVida38SpeciesPreviewV1(this.contract) : null;
  paused = false;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private model: Vida38SpeciesPreviewModelV1 | null = null;
  private frameHandle = 0;
  private startedAt = 0;
  private dragState: { active: boolean; x: number; y: number; yaw: number; pitch: number } = { active: false, x: 0, y: 0, yaw: 0, pitch: 0 };
  private yaw = -0.42;
  private pitch = 0.18;
  private distance = 4.4;

  ngAfterViewInit(): void {
    this.setupRenderer();
    this.rebuild();
    this.installInteractions();
    this.animate = this.animate.bind(this);
    this.frameHandle = requestAnimationFrame(this.animate);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract']) {
      this.descriptor = this.contract ? describeVida38SpeciesPreviewV1(this.contract) : null;
      this.rebuild();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameHandle);
    this.disposeModel();
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  toggleAnimation(): void { this.paused = !this.paused; }

  resetView(): void {
    this.yaw = -0.42;
    this.pitch = 0.18;
    this.distance = this.descriptor?.focusDistance ?? 4.4;
    this.applyCameraTransform();
  }

  private setupRenderer(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || this.renderer !== null) return;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05070b, 0.065);
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const ambient = new THREE.HemisphereLight(0xe4edf6, 0x1c1e22, 0.72);
    const key = new THREE.DirectionalLight(0xfff7ef, 2.0);
    key.position.set(2.7, 3.1, 4.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 15;
    key.shadow.bias = -0.00015;
    const fill = new THREE.DirectionalLight(0xa1bed2, 0.68);
    fill.position.set(-3.5, 1.4, 2.3);
    const rim = new THREE.DirectionalLight(0xffdeb9, 0.82);
    rim.position.set(-1.6, 1.6, -3.8);
    this.scene.add(ambient, key, fill, rim);
    this.applyCameraTransform();
  }

  private rebuild(): void {
    if (this.scene === null) return;
    this.disposeModel();
    if (this.contract === null) return;
    this.model = createVida38SpeciesPreviewModelV1(this.contract, { humanoidQuality: window.innerWidth < 760 ? 'MEDIUM' : 'HIGH' });
    this.scene.add(this.model.root);
    this.distance = this.model.descriptor.focusDistance;
    this.applyCameraTransform();
  }

  private disposeModel(): void {
    if (this.model !== null && this.scene !== null) {
      this.scene.remove(this.model.root);
      this.model.dispose();
    }
    this.model = null;
  }

  private animate(timestamp: number): void {
    this.frameHandle = requestAnimationFrame(this.animate);
    if (this.scene === null || this.camera === null || this.renderer === null) return;
    if (this.startedAt === 0) this.startedAt = timestamp;
    const elapsed = (timestamp - this.startedAt) / 1000;
    this.resizeRenderer();
    if (!this.paused && this.model !== null) {
      this.model.animation(elapsed);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private resizeRenderer(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport || !this.renderer || !this.camera) return;
    const width = Math.max(320, viewport.clientWidth);
    const height = Math.max(384, viewport.clientHeight);
    const current = this.renderer.getSize(new THREE.Vector2());
    if (current.x !== width || current.y !== height) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  private applyCameraTransform(): void {
    if (this.camera === null) return;
    this.camera.position.set(
      Math.cos(this.pitch) * Math.sin(this.yaw) * this.distance,
      Math.sin(this.pitch) * this.distance + (this.descriptor?.verticalOffset ?? 0.45),
      Math.cos(this.pitch) * Math.cos(this.yaw) * this.distance,
    );
    this.camera.lookAt(0, this.descriptor?.verticalOffset ?? 0.45, 0);
  }

  private installInteractions(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    canvas.addEventListener('pointerdown', event => {
      this.dragState = { active: true, x: event.clientX, y: event.clientY, yaw: this.yaw, pitch: this.pitch };
      canvas.setPointerCapture?.(event.pointerId);
    });
    canvas.addEventListener('pointermove', event => {
      if (!this.dragState.active) return;
      const dx = event.clientX - this.dragState.x;
      const dy = event.clientY - this.dragState.y;
      this.yaw = this.dragState.yaw - dx * 0.008;
      this.pitch = THREE.MathUtils.clamp(this.dragState.pitch - dy * 0.006, -0.65, 0.85);
      this.applyCameraTransform();
    });
    const release = () => { this.dragState.active = false; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', event => {
      event.preventDefault();
      this.distance = THREE.MathUtils.clamp(this.distance + Math.sign(event.deltaY) * 0.24, 2.1, 8.2);
      this.applyCameraTransform();
    }, { passive: false });
  }
}
