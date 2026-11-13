import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38ReptilianGallery38OE5, type Vida38ReptilianGalleryEntry38OE5, type Vida38ReptilianGallerySize38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { auditVida38WardrobeRendered38OE8B, deriveVida38WardrobeCoherencePlan38OE8B, type Vida38WardrobeCoherencePlan38OE8B } from './vida38-reptilian-wardrobe-coherence-38-2oe8b';
import { auditVida38CulturalDiversity38OE9, type Vida38CulturalDiversityAudit38OE9 } from './vida38-reptilian-cultural-diversity-38-2oe9';

export type Vida38GalleryView38OE9 = 'FRONT' | 'SIDE' | 'BACK';

/**
 * Galería optativa integrada en el laboratorio 38.2. En e9 genera y conserva
 * tres capturas deterministas por ejemplar para validar frente/perfil/espalda.
 */
@Component({
  selector:'app-vida38-reptilian-gallery-38-2oe5', standalone:true,
  changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host{display:block}
    .gallery{border:1px solid rgba(89,198,239,.3);padding:.9rem;border-radius:14px;background:#0a1421;margin:.9rem 0}
    .head{display:flex;justify-content:space-between;flex-wrap:wrap;align-items:center;gap:.7rem;margin-bottom:.75rem}
    h4{margin:0;font-size:1.05rem;color:#d4eeff}
    .hint{font-size:.82rem;color:#a7bccc;margin:.25rem 0 .65rem}
    .toolbar{display:flex;flex-wrap:wrap;gap:.75rem;align-items:center}
    .switch{display:flex;gap:.4rem}
    .switch button,.views button{border:1px solid #37647b;background:#112638;color:#d8f5ff;border-radius:8px;padding:.4rem .7rem;cursor:pointer}
    .switch button[aria-pressed=true],.views button[aria-pressed=true]{background:#155c68;border-color:#65dbcf}
    .views{display:flex;gap:.4rem;align-items:center}
    .views label{font-size:.78rem;color:#93b4c7;margin-right:.2rem}
    .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:.7rem}
    .tile{padding:0;overflow:hidden;text-align:left;border:1px solid #24465a;border-radius:12px;background:#101d2b;color:#e5f5ff;cursor:pointer}
    .tile:hover,.tile:focus-visible{border-color:#69dcd2;outline:2px solid transparent}
    .tile[aria-pressed=true]{border-color:#72f3cd;box-shadow:0 0 0 1px #72f3cd inset}
    .photo{height:182px;display:flex;align-items:center;justify-content:center;background:#08111a;overflow:hidden;position:relative}
    .photo img{height:100%;width:100%;object-fit:contain}
    .view-tag{position:absolute;left:.45rem;top:.45rem;padding:.18rem .35rem;border-radius:5px;background:rgba(8,24,38,.75);color:#97dbff;font-size:.68rem;border:1px solid rgba(103,197,237,.25)}
    .pending{font-size:.78rem;color:#a8bccb;text-align:center;padding:.5rem}
    .data{display:grid;gap:.25rem;padding:.55rem .6rem}
    .data strong{font-size:.85rem}.data small{font-size:.72rem;color:#acc8d7}
    .chips{display:flex;flex-wrap:wrap;gap:.24rem;margin-top:.15rem}
    .chips span{font-size:.66rem;border:1px solid #284b60;border-radius:999px;padding:.14rem .36rem;color:#b9ddf0;background:#0f1f2d}
    .swatches{display:flex;gap:.3rem;margin-top:.2rem}.swatches i{height:9px;width:24px;border-radius:3px;border:1px solid #315466}
    .wardrobe{color:#8be6d9!important;font-weight:650}.engine{color:#b7d9f0!important}
    .audit-ok{color:#81dcbc!important}.audit-fail{color:#ffbb92!important}.audit-note{color:#b1c4d1!important}
    .summary{display:flex;flex-wrap:wrap;gap:.35rem;margin:.55rem 0 .8rem}
    .summary span{font-size:.72rem;color:#d1edf9;border:1px solid #244a62;background:#0e1d2a;padding:.2rem .45rem;border-radius:999px}
    .footer{margin:.7rem 0 0;color:#9bb6c8;font-size:.78rem}
  `],
  template:`
    <section class="gallery" data-testid="vida38-reptilian-gallery-38oe5" aria-label="Galería comparativa de reptilianos civilizados">
      <div class="head">
        <div>
          <h4>38.2o.e9 · Diversidad cultural y validación visual</h4>
          <p class="hint">Muestras reproducibles del renderer real · validación de frente, perfil y espalda · cobertura cultural y material sin persistencia.</p>
        </div>
        <div class="toolbar">
          <div class="switch" role="group" aria-label="Número de ejemplares">
            <button type="button" (click)="setCount(12)" [attr.aria-pressed]="count===12">12 especies</button>
            <button type="button" (click)="setCount(24)" [attr.aria-pressed]="count===24">24 especies</button>
          </div>
          <div class="views" role="group" aria-label="Vista de validación">
            <label>Vista:</label>
            <button type="button" (click)="setView('FRONT')" [attr.aria-pressed]="viewMode==='FRONT'">Frontal</button>
            <button type="button" (click)="setView('SIDE')" [attr.aria-pressed]="viewMode==='SIDE'">Lateral</button>
            <button type="button" (click)="setView('BACK')" [attr.aria-pressed]="viewMode==='BACK'">Posterior</button>
          </div>
        </div>
      </div>
      <div class="summary">
        <span>Culturas: {{diversityAudit.uniqueCultures}}</span>
        <span>Familias: {{diversityAudit.uniqueFamilies}}</span>
        <span>Longitudes: {{diversityAudit.uniqueLengths}}</span>
        <span>Siluetas: {{diversityAudit.uniqueSilhouettes}}</span>
        <span>Materiales: {{diversityAudit.uniqueMaterials}}</span>
        <span>Adornos: {{diversityAudit.uniqueAdornments}}</span>
      </div>
      <div class="tiles">
        @for (entry of visible; track entry.contract.speciesId) {
          <button type="button" class="tile" (click)="open.emit(entry.contract)" [attr.aria-pressed]="selectedSpeciesId===entry.contract.speciesId"
            [attr.aria-label]="'Abrir reptiliano ' + entry.ordinal + ' en el visor 3D'">
            <div class="photo">
              <span class="view-tag">{{viewLabel(viewMode)}}</span>
              @if (thumbs[entry.contract.speciesId]?.[viewMode]) {
                <img [src]="thumbs[entry.contract.speciesId]?.[viewMode]" [alt]="viewLabel(viewMode) + ' del ' + entry.contract.speciesName" loading="lazy"/>
              } @else {
                <span class="pending">{{renderError || failed[entry.contract.speciesId] ? 'Vista no disponible' : 'Preparando ' + viewLabel(viewMode).toLowerCase() + '…'}}</span>
              }
            </div>
            <div class="data">
              <strong>Ejemplar {{entry.ordinal}}</strong>
              <small>{{entry.profile}}</small>
              <small>{{entry.garmentLine}} · {{entry.culture}}</small>
              <small class="wardrobe">Ropa: {{familyLabel(wardrobeFor(entry).family)}}</small>
              <small class="engine">Motor: {{engineLabel(wardrobeFor(entry).engine)}}</small>
              <div class="chips">
                <span>{{entry.diversityPlan38OE9.length}}</span>
                <span>{{entry.diversityPlan38OE9.silhouette}}</span>
                <span>{{entry.diversityPlan38OE9.material}}</span>
                <span>{{entry.diversityPlan38OE9.adornment}}</span>
              </div>
              @if (wardrobeAudit[entry.contract.speciesId]; as audit) {
                <small [class.audit-ok]="audit.status==='MATCH'" [class.audit-fail]="audit.status==='MISMATCH'">{{audit.status==='MATCH' ? 'Motor comprobado' : 'Revisar motor: ' + audit.actualFamily + ' · ' + audit.actualEngine}}</small>
                @if (audit.softSilhouette) {
                  <small class="audit-note">Silueta blanda: {{audit.softSilhouette}} · caída: {{audit.hemRatio}}×</small>
                }
              }
              <small>{{entry.eyewear}} · {{entry.handheld}} · {{entry.diversityPlan38OE9.accessoryBias}}</small>
              <small class="audit-note">Vistas completas: {{allViewsRendered(entry.contract.speciesId) ? 'sí' : 'pendiente'}}</small>
              <div class="swatches" aria-label="Pigmentación">
                <i [style.backgroundColor]="entry.contract.pigmentation.primaryColorHex"></i>
                <i [style.backgroundColor]="entry.contract.pigmentation.secondaryColorHex"></i>
              </div>
            </div>
          </button>
        }
      </div>
      <p class="footer">Validación e9: {{auditedCount()}}/{{count}} ejemplares con motor coherente y {{completedViews()}}/{{count}} con las tres vistas capturadas. Las métricas de diversidad proceden de los 24 ejemplares reproducibles del laboratorio.</p>
    </section>
  `,
})
export class Vida38ReptilianGallery38OE5Component implements AfterViewInit,OnDestroy {
  @Input() selectedSpeciesId:string|null=null;
  @Output() readonly open=new EventEmitter<Vida38SpeciesVisualContract>();
  readonly all=buildVida38ReptilianGallery38OE5(24);
  readonly wardrobePlans: Record<string,Vida38WardrobeCoherencePlan38OE8B> = Object.fromEntries(
    this.all.map(entry => [entry.contract.speciesId, deriveVida38WardrobeCoherencePlan38OE8B(entry.contract)]),
  );
  readonly diversityAudit: Vida38CulturalDiversityAudit38OE9 = auditVida38CulturalDiversity38OE9(this.all.map(entry => entry.contract));
  wardrobeAudit: Record<string,ReturnType<typeof auditVida38WardrobeRendered38OE8B> & {softSilhouette?:string;hemRatio?:number}>={};
  count:Vida38ReptilianGallerySize38OE5=24;
  viewMode: Vida38GalleryView38OE9 = 'FRONT';
  thumbs:Record<string,Partial<Record<Vida38GalleryView38OE9,string>>>={};
  failed:Record<string,boolean>={};
  renderError=false;
  private renderer:THREE.WebGLRenderer|null=null;
  private scene:THREE.Scene|null=null;
  private camera:THREE.PerspectiveCamera|null=null;
  private raf=0;
  private nextIndex=0;
  private alive=false;
  constructor(private readonly cdr:ChangeDetectorRef) {}
  get visible():readonly Vida38ReptilianGalleryEntry38OE5[]{return this.all.slice(0,this.count);}
  auditedCount():number{return this.visible.filter(entry=>this.wardrobeAudit[entry.contract.speciesId]?.status==='MATCH').length;}
  completedViews(): number { return this.visible.filter(entry => this.allViewsRendered(entry.contract.speciesId)).length; }
  wardrobeFor(entry:Vida38ReptilianGalleryEntry38OE5):Vida38WardrobeCoherencePlan38OE8B {
    return this.wardrobePlans[entry.contract.speciesId]!;
  }
  familyLabel(family:string):string {
    const names:Record<string,string>={TECH_SUIT:'Traje integral',CEREMONIAL_ROBES:'Túnica ceremonial',SEGMENTED_ARMOR:'Armadura segmentada',
      NOBLE_REGALIA:'Manto noble',COLONIAL_RIG:'Equipo colonial',PELAGIC_DRAPE:'Velo pelágico'};
    return names[family] ?? family;
  }
  engineLabel(engine:string):string {
    const names:Record<string,string>={TECH_SUIT_38OD5:'d5 · traje',ORGANIC_SOFT_38OE7C:'e7c · tejido orgánico',
      TECHNICAL_ARMOR_38OE8A:'e8a · armadura',LEGACY_38OD:'d · vestimenta anterior'};
    return names[engine] ?? engine;
  }
  viewLabel(view: Vida38GalleryView38OE9): string {
    return view === 'FRONT' ? 'Frontal' : view === 'SIDE' ? 'Lateral' : 'Posterior';
  }
  allViewsRendered(speciesId: string): boolean {
    const views = this.thumbs[speciesId];
    return !!views?.FRONT && !!views?.SIDE && !!views?.BACK;
  }
  setCount(count:Vida38ReptilianGallerySize38OE5):void {
    this.count=count;
    if(this.alive && !this.renderError && this.raf===0)this.schedule();
  }
  setView(view: Vida38GalleryView38OE9): void {
    this.viewMode = view;
    this.cdr.markForCheck();
  }
  ngAfterViewInit():void {
    this.alive=true;
    try {
      const canvas=document.createElement('canvas');
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(164,182,false);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=1.2;
      this.scene=new THREE.Scene();
      this.scene.background=new THREE.Color('#0a1421');
      this.scene.add(new THREE.HemisphereLight(0xc9e7ff,0x21313e,1.3));
      const key=new THREE.DirectionalLight(0xf8f5e9,2.4);key.position.set(3,4,5);this.scene.add(key);
      const rim=new THREE.DirectionalLight(0x6ac8ff,1.3);rim.position.set(-3,1,-4);this.scene.add(rim);
      this.camera=new THREE.PerspectiveCamera(35,164/182,0.01,100);
      this.schedule();
    }catch{
      this.renderError=true;
      this.cleanupRenderer();
      this.cdr.markForCheck();
    }
  }
  ngOnDestroy():void {
    this.alive=false;
    if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}
    this.cleanupRenderer();
  }
  private schedule():void {
    if(this.raf!==0||!this.alive)return;
    this.raf=requestAnimationFrame(()=>{this.raf=0;this.captureNext();});
  }
  private captureNext():void {
    if(!this.alive||!this.scene||!this.camera||!this.renderer)return;
    if(this.nextIndex>=this.count)return;
    const entry=this.all[this.nextIndex]!;
    this.nextIndex++;
    let model:ReturnType<typeof createVida38SpeciesPreviewModelV1>|null=null;
    try{
      model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      const auditResult = auditVida38WardrobeRendered38OE8B(this.wardrobeFor(entry), model.subject.userData);
      let softSilhouette: string | undefined;
      let hemRatio: number | undefined;
      if (auditResult.actualEngine === 'ORGANIC_SOFT_38OE7C') {
        model.subject.traverse(object => {
          if (softSilhouette) return;
          const stats = object.userData['garmentStats38OE7C'] as Record<string,unknown> | undefined;
          if (!stats || typeof stats['silhouette'] !== 'string') return;
          softSilhouette = stats['silhouette'];
          const hem = Number(stats['hemWidth']);
          const waist = Number(stats['necklineWidth']);
          if (Number.isFinite(hem) && Number.isFinite(waist) && waist > 0) hemRatio = Math.round(100 * hem / waist) / 100;
        });
      }
      this.wardrobeAudit[entry.contract.speciesId] = { ...auditResult, softSilhouette, hemRatio };
      this.scene.add(model.root);
      model.root.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model.subject);
      const focus=bounds.getCenter(new THREE.Vector3());
      const radius=Math.max(0.5,bounds.getSize(new THREE.Vector3()).length()*0.5);
      const distance=radius/Math.sin(THREE.MathUtils.degToRad(35/2))*1.16;
      const views: Vida38GalleryView38OE9[] = ['FRONT','SIDE','BACK'];
      for (const view of views) {
        this.camera.position.copy(this.cameraPosition(focus, distance, view));
        this.camera.lookAt(focus);
        this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene,this.camera);
        const record = this.thumbs[entry.contract.speciesId] ?? {};
        record[view] = this.renderer.domElement.toDataURL('image/png');
        this.thumbs[entry.contract.speciesId] = record;
      }
    }catch{
      this.failed[entry.contract.speciesId]=true;
    }finally{
      if(model){this.scene.remove(model.root);model.dispose();}
    }
    this.cdr.markForCheck();
    if(this.nextIndex<this.count)this.schedule();
  }
  private cameraPosition(focus: THREE.Vector3, distance: number, view: Vida38GalleryView38OE9): THREE.Vector3 {
    const dir = view === 'FRONT'
      ? new THREE.Vector3(0.04, 0.08, 1)
      : view === 'SIDE'
        ? new THREE.Vector3(1, 0.05, 0.04)
        : new THREE.Vector3(-0.04, 0.08, -1);
    return focus.clone().add(dir.normalize().multiplyScalar(distance));
  }
  private cleanupRenderer():void {
    this.renderer?.dispose();
    this.renderer?.forceContextLoss();
    this.renderer=null;this.camera=null;this.scene=null;
  }
}
