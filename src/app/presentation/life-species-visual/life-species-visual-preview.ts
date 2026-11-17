import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1, describeVida38SpeciesPreviewV1, type Vida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { etiquetaVidaEs } from '../scientific/vida9-etiquetas-es';
import { deriveVida38FungalMorphology38M, VIDA38_FUNGAL_LABELS_38M } from './vida38-fungi-morphology-38-2m';
import { deriveVida38MicrobialMorphology38N, VIDA38_MICROBIAL_LABELS_38N } from './vida38-microbial-morphology-38-2n';
import { computeVida38SpeciesCameraFramingV1, type Vida38SpeciesCameraFramingV1 } from './vida38-species-camera-framing-38-2ha';
import { computeVida38SpeciesPanDelta38P } from './vida38-species-pan-38-2p';
import { Vida38ReptilianGallery38OE5Component } from './vida38-reptilian-gallery-38-2oe5.component';

@Component({
  selector: 'app-life-species-visual-preview',
  standalone: true,
  imports: [Vida38ReptilianGallery38OE5Component],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host{display:block}
    .panel{padding:1rem;border:1px solid rgba(106,215,255,.18);border-radius:14px;background:linear-gradient(180deg,rgba(10,16,24,.94),rgba(7,11,18,.88));box-shadow:inset 0 1px 0 rgba(140,226,255,.06)}
    .header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.75rem;align-items:flex-start;margin-bottom:.85rem}
    .title{margin:0;font-size:1.1rem}.info{margin:.3rem 0 0;color:var(--genesis-color-text-muted,#b4c1cd);line-height:1.55}
    .toolbar{display:flex;gap:.5rem;flex-wrap:wrap}
    .btn{border:1px solid rgba(114,219,247,.45);background:rgba(18,35,52,.78);color:#d8f3ff;border-radius:10px;padding:.45rem .75rem;font:inherit;cursor:pointer}
    .btn:hover{background:rgba(22,44,64,.92)}
    .btn[aria-pressed="true"]{border-color:rgba(111,241,206,.85);background:rgba(13,71,76,.86)}
    .viewport{position:relative;min-height:24rem;border-radius:14px;overflow:hidden;border:1px solid rgba(106,215,255,.12);background:radial-gradient(circle at 50% 26%, rgba(62,91,116,.38), rgba(7,12,18,.9) 46%, #04070b 100%)}
    canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
    .control-hint{position:absolute;right:.65rem;top:.65rem;max-width:calc(100% - 1.3rem);pointer-events:none;background:rgba(4,10,18,.79);color:#d0eaf5;border:1px solid rgba(130,223,241,.2);border-radius:9px;padding:.35rem .55rem;font-size:.77rem;line-height:1.4}
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
          <h3 class="title">{{simpleSpeciesFiche ? 'Representación 3D' : 'Reconstrucción visual 38.2'}}</h3>
          @if (!simpleSpeciesFiche) {
            <p class="info">Modelo 3D procedural derivado del contrato 38.1; la anatomía que el contrato no especifica es una hipótesis artística, no una imagen observada.</p>
          }
        </div>
        <div class="toolbar">
          <button class="btn" type="button" (click)="toggleAnimation()">{{paused ? 'Reanudar animación' : 'Pausar animación'}}</button>
          <button class="btn" type="button" (click)="toggleMoveMode()" [attr.aria-pressed]="moveMode">{{moveMode ? 'Modo mover: activo' : 'Modo mover'}}</button>
          <button class="btn" type="button" (click)="resetView()">Restablecer vista</button>
          @if (showReptilianGalleryToggle) {
            <button class="btn" type="button" (click)="toggleReptilianGallery()" [attr.aria-pressed]="galleryOpen">{{galleryOpen ? 'Cerrar galería reptiliana' : 'Galería comparativa reptiliana'}}</button>
          }
          @if (comparisonContract !== null) {
            <button class="btn" type="button" (click)="restoreRealSpecimen()">Volver al ejemplar original</button>
          }
        </div>
      </div>
      <div class="viewport" #viewport>
        <canvas #canvas aria-label="Vista procedural 3D de la especie. Arrastre izquierdo para girar; derecho, central o Control más izquierdo para mover; rueda para zoom."></canvas>
        <div class="control-hint">Izquierdo: girar · Derecho/Ctrl+izquierdo: mover · Rueda: zoom</div>
        @if (descriptor !== null) {
          <div class="overlay">
            <span class="pill">{{descriptor.family === 'PLANT_FORM' ? plantGrowthLabel() : descriptor.family === 'FUNGAL_CLUSTER' ? fungalGrowthLabel() : descriptor.family === 'MICROBIAL_COLONY' ? microbialGrowthLabel() : etiqueta(descriptor.family)}} · {{etiqueta(descriptor.habitatCue)}} · {{descriptor.family === 'PLANT_FORM' ? 'Reconstrucción botánica' : (simpleSpeciesFiche ? etiqueta(descriptor.bodyScaleClass) : descriptor.bodyScaleClass)}}</span>
            <div class="legend">
              <strong>{{activeContract?.speciesName}}</strong>
              @if (comparisonContract !== null) {
                <p>MUESTRA DE LABORATORIO · No pertenece al universo generado</p>
              }
              @if (!simpleSpeciesFiche) {
                <p>
                  Muestra base 38.2: morfología, tamaño, locomoción, pigmentación y adaptaciones.
                  @if (descriptor.specialistIntelligenceDeferred) {
                    <span> La variedad morfológica específica de civilizaciones se ampliará en 38.3.</span>
                  }
                </p>
              }
              <div class="swatches" style="margin-top:.65rem">
                <span class="swatch" [style.backgroundColor]="descriptor.primaryColorHex" aria-label="Pigmento principal"></span>
                <span class="swatch" [style.backgroundColor]="descriptor.secondaryColorHex" aria-label="Pigmento secundario"></span>
              </div>
            </div>
          </div>
        }
      </div>
      @if (galleryOpen) {
        <app-vida38-reptilian-gallery-38-2oe5 [selectedSpeciesId]="comparisonContract?.speciesId ?? null" (open)="openGallerySpecimen($event)"></app-vida38-reptilian-gallery-38-2oe5>
      }
      @if (descriptor !== null && !simpleSpeciesFiche) {
        <div class="meta">
          <div class="meta-card"><span>Familia de render</span><strong>{{descriptor.family === 'PLANT_FORM' ? plantGrowthLabel() : descriptor.family === 'FUNGAL_CLUSTER' ? fungalGrowthLabel() : descriptor.family === 'MICROBIAL_COLONY' ? microbialGrowthLabel() : etiqueta(descriptor.family)}}</strong></div>
          @if (descriptor.family === 'PLANT_FORM') {
            <div class="meta-card"><span>Talla registrada en VIDA</span><strong>{{activeContract?.bodyLengthMeters}} m</strong></div>
          }
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
  /** Omite los mensajes internos solo en las fichas biológicas del juego. */
  @Input() simpleSpeciesFiche = false;
  // La galería comparativa es exclusiva de Laboratorio. Las fichas de
  // especies del juego no exponen ningún acceso a muestras sintéticas.
  @Input() showReptilianGalleryToggle = false;
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

  microbialGrowthLabel(): string {
    const current = this.activeContract;
    if (!current || current.morphology.group !== 'MICROORGANISMS') return 'Microorganismos';
    return VIDA38_MICROBIAL_LABELS_38N[deriveVida38MicrobialMorphology38N(current).form];
  }

  fungalGrowthLabel(): string {
    const current = this.activeContract;
    if (!current || current.morphology.group !== 'FUNGI') return 'Hongos';
    return VIDA38_FUNGAL_LABELS_38M[deriveVida38FungalMorphology38M(current).form];
  }

  plantGrowthLabel(): string {
    const size = this.activeContract?.bodyLengthMeters ?? 0;
    return size <= 1 ? 'Planta herbácea' : size <= 2 ? 'Arbusto' : 'Árbol';
  }

  comparisonContract: Vida38SpeciesVisualContract | null = null;
  galleryOpen = false;
  get activeContract(): Vida38SpeciesVisualContract | null { return this.comparisonContract ?? this.contract; }
  descriptor = this.activeContract ? describeVida38SpeciesPreviewV1(this.activeContract) : null;
  paused = false;
  moveMode = false;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private model: Vida38SpeciesPreviewModelV1 | null = null;
  private frameHandle = 0;
  private startedAt = 0;
  // El arrastre siempre se asocia a un único puntero y a una operación.
  private dragState: {
    pointerId: number;
    mode: 'ROTATE' | 'PAN';
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    startPan: THREE.Vector3;
  } | null = null;
  private panOffset = new THREE.Vector3();
  private interactionCleanup: (() => void) | null = null;
  private yaw = -0.42;
  private pitch = 0.18;
  private distance = 4.4;
  private cameraFraming: Vida38SpeciesCameraFramingV1 | null = null;
  private subjectBounds: THREE.Box3 | null = null;

  ngAfterViewInit(): void {
    this.setupRenderer();
    this.rebuild();
    this.installInteractions();
    this.animate = this.animate.bind(this);
    this.frameHandle = requestAnimationFrame(this.animate);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contract']) {
      this.comparisonContract = null;
      this.descriptor = this.activeContract ? describeVida38SpeciesPreviewV1(this.activeContract) : null;
      this.rebuild();
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameHandle);
    this.interactionCleanup?.();
    this.interactionCleanup = null;
    this.disposeModel();
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  toggleAnimation(): void { this.paused = !this.paused; }

  toggleReptilianGallery(): void { this.galleryOpen = !this.galleryOpen; }

  openGallerySpecimen(specimen: Vida38SpeciesVisualContract): void {
    this.comparisonContract = specimen;
    this.descriptor = describeVida38SpeciesPreviewV1(specimen);
    this.rebuild();
    this.viewportRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  restoreRealSpecimen(): void {
    this.comparisonContract = null;
    this.descriptor = this.contract ? describeVida38SpeciesPreviewV1(this.contract) : null;
    this.rebuild();
  }

  toggleMoveMode(): void {
    this.moveMode = !this.moveMode;
    this.dragState = null;
  }

  resetView(): void {
    this.dragState = null;
    this.panOffset.set(0, 0, 0);
    this.yaw = -0.42;
    this.pitch = 0.18;
    this.recalculateFraming(false);
    this.distance = this.cameraFraming?.distance ?? this.descriptor?.focusDistance ?? 4.4;
    this.applyCameraTransform();
  }

  private recalculateFraming(preserveZoom: boolean): void {
    if (this.camera === null || this.subjectBounds === null) return;
    const oldDistance = this.cameraFraming?.distance ?? this.distance;
    const zoomFactor = oldDistance > 0 ? this.distance / oldDistance : 1;
    this.cameraFraming = computeVida38SpeciesCameraFramingV1({
      bounds: this.subjectBounds,
      verticalFovDegrees: this.camera.fov,
      aspect: this.camera.aspect,
      yaw: this.yaw,
      pitch: this.pitch,
    });
    if (preserveZoom) {
      this.distance = THREE.MathUtils.clamp(
        this.cameraFraming.distance * zoomFactor,
        this.cameraFraming.minDistance,
        this.cameraFraming.maxDistance,
      );
    }
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
    if (this.activeContract === null) return;
    this.model = createVida38SpeciesPreviewModelV1(this.activeContract, { humanoidQuality: window.innerWidth < 760 ? 'MEDIUM' : 'HIGH' });
    this.scene.add(this.model.root);
    // Solo la especie: ni suelo, ni pedestal, ni rocas del decorado.
    this.model.root.updateMatrixWorld(true);
    this.subjectBounds = new THREE.Box3().setFromObject(this.model.subject);
    this.resizeRenderer();
    this.resetView();
  }

  private disposeModel(): void {
    if (this.model !== null && this.scene !== null) {
      this.scene.remove(this.model.root);
      this.model.dispose();
    }
    this.model = null;
    this.subjectBounds = null;
    this.cameraFraming = null;
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
      // Al cambiar el ancho de la ventana, conservar el zoom del usuario.
      this.recalculateFraming(true);
      this.applyCameraTransform();
    }
  }

  private applyCameraTransform(): void {
    if (this.camera === null) return;
    const target = (this.cameraFraming?.focus ?? new THREE.Vector3(0, this.descriptor?.verticalOffset ?? 0.45, 0)).clone().add(this.panOffset);
    this.camera.position.set(
      target.x + Math.cos(this.pitch) * Math.sin(this.yaw) * this.distance,
      target.y + Math.sin(this.pitch) * this.distance,
      target.z + Math.cos(this.pitch) * Math.cos(this.yaw) * this.distance,
    );
    this.camera.lookAt(target);
  }

  private installInteractions(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    // Reinstalación segura: no acumular listeners al reconstruir el visor.
    this.interactionCleanup?.();

    const down = (event: PointerEvent): void => {
      if (![0, 1, 2].includes(event.button) || this.dragState !== null) return;
      const pan = this.moveMode || event.button === 1 || event.button === 2 || event.ctrlKey || event.shiftKey;
      event.preventDefault();
      this.dragState = {
        pointerId: event.pointerId,
        mode: pan ? 'PAN' : 'ROTATE',
        x: event.clientX,
        y: event.clientY,
        yaw: this.yaw,
        pitch: this.pitch,
        startPan: this.panOffset.clone(),
      };
      canvas.style.cursor = 'grabbing';
      canvas.setPointerCapture?.(event.pointerId);
    };
    const move = (event: PointerEvent): void => {
      const drag = this.dragState;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (drag.mode === 'ROTATE') {
        this.yaw = drag.yaw - dx * 0.008;
        this.pitch = THREE.MathUtils.clamp(drag.pitch - dy * 0.006, -0.65, 0.85);
      } else if (this.camera !== null) {
        const delta = computeVida38SpeciesPanDelta38P({
          deltaPixelsX: dx, deltaPixelsY: dy,
          viewportHeightPixels: Math.max(1, this.viewportRef?.nativeElement.clientHeight ?? canvas.clientHeight),
          verticalFovDegrees: this.camera.fov,
          yaw: this.yaw,
          pitch: this.pitch,
          distance: this.distance,
        });
        this.panOffset.copy(drag.startPan).add(new THREE.Vector3(delta.x, delta.y, delta.z));
      }
      this.applyCameraTransform();
    };
    const release = (event: PointerEvent): void => {
      if (this.dragState?.pointerId !== event.pointerId) return;
      this.dragState = null;
      canvas.style.cursor = 'grab';
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    const wheel = (event: WheelEvent): void => {
      event.preventDefault();
      const min = this.cameraFraming?.minDistance ?? 2.1;
      const max = this.cameraFraming?.maxDistance ?? 8.2;
      this.distance = THREE.MathUtils.clamp(
        this.distance + Math.sign(event.deltaY) * Math.max(0.08, this.distance * 0.075), min, max,
      );
      this.applyCameraTransform();
    };
    const suppressContextMenu = (event: MouseEvent): void => event.preventDefault();
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture', release);
    canvas.addEventListener('contextmenu', suppressContextMenu);
    canvas.addEventListener('wheel', wheel, { passive: false });
    this.interactionCleanup = () => {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', release);
      canvas.removeEventListener('pointercancel', release);
      canvas.removeEventListener('lostpointercapture', release);
      canvas.removeEventListener('contextmenu', suppressContextMenu);
      canvas.removeEventListener('wheel', wheel);
      this.dragState = null;
    };
  }
}
