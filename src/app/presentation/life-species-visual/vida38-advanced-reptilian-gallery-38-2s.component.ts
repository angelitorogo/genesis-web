import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38AdvancedReptilianGallery38S, type Vida38AdvancedReptilianGallerySize38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { assertVida38AdvancedReptilianActualModel38S6, VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6 } from './vida38-advanced-reptilian-runtime-38-2s6';
import { deriveVida38AdvancedReptilianDesign38S8 } from './vida38-advanced-reptilian-diversity-38-2s8';
import { VIDA38_ADVANCED_REPTILIAN_THUMB_QUALITY_38S3, getVida38AdvancedReptilianThumbnails38S3, storeVida38AdvancedReptilianThumbnails38S3 } from './vida38-advanced-reptilian-thumbnails-38-2s3';

export type Vida38AdvancedReptilianView38S='FRONT'|'SIDE'|'BACK';

@Component({
  selector:'app-vida38-advanced-reptilian-gallery-38s',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host{display:block}.head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem;margin:.75rem 0}
    .controls{display:flex;gap:.35rem;flex-wrap:wrap}.ctrl{background:#122638;color:#d5ebf8;border:1px solid #356078;border-radius:8px;padding:.46rem .68rem;cursor:pointer}
    .ctrl[aria-pressed=true]{border-color:#6ee9cb;background:#14505a}
    h3{margin:0;color:#e5f7ff;font-size:1.05rem}.note{color:#a8c4d5;font-size:.80rem;line-height:1.55}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(157px,1fr));gap:.6rem}
    .card{display:block;text-align:left;border:1px solid #294b61;border-radius:11px;overflow:hidden;background:#101e2b;color:#e5f7ff;padding:0;cursor:pointer}
    .card[aria-pressed=true]{border-color:#6cecd1;box-shadow:inset 0 0 0 1px #6cecd1}.card:hover{border-color:#89dff0}
    .photo{height:180px;display:flex;align-items:center;justify-content:center;background:#0a1724;position:relative;overflow:hidden}
    .photo img{height:100%;width:100%;object-fit:contain}.tag{position:absolute;top:.4rem;left:.4rem;background:#091925bb;color:#9ad4e7;border-radius:4px;padding:.16rem .25rem;font-size:.68rem}
    .meta{padding:.55rem;display:grid;gap:.30rem}.meta strong{font-size:.85rem}.meta small{font-size:.69rem;color:#b4ceda}.accent{color:#6fe4cf!important}
    .footer{font-size:.76rem;color:#9db8c9;margin:.6rem 0}.error{color:#ffb1a4!important;font-size:.70rem}
  `],
  template:`
  <section data-testid="vida38-advanced-reptilian-gallery-38s" aria-label="Galería de reptilianos avanzados">
    <div class="head"><h3>Reptilianos · Avanzados</h3>
      <div class="controls" role="group" aria-label="Cantidad de ejemplares">
        <button type="button" class="ctrl" [attr.aria-pressed]="count===12" (click)="setCount(12)">12</button>
        <button type="button" class="ctrl" [attr.aria-pressed]="count===24" (click)="setCount(24)">24</button>
      </div>
      <div class="controls" role="group" aria-label="Ángulo de revisión">
        <button type="button" class="ctrl" [attr.aria-pressed]="view==='FRONT'" (click)="view='FRONT'">Frontal</button>
        <button type="button" class="ctrl" [attr.aria-pressed]="view==='SIDE'" (click)="view='SIDE'">Lateral</button>
        <button type="button" class="ctrl" [attr.aria-pressed]="view==='BACK'" (click)="view='BACK'">Posterior</button>
      </div>
    </div>
    <p class="note">24 identidades deterministas de civilizaciones reptilianas avanzadas. Predomina ropa actual/profesional, uniformes funcionales y equipos de exploración; algunos ejemplares incluyen astronautas, científicos, colonos y técnicos.</p>
    <div class="grid">
      @for(entry of visible;track entry.contract.speciesId){
        <button type="button" class="card" [attr.aria-pressed]="selectedSpeciesId===entry.contract.speciesId" (click)="open.emit(entry.contract)" [attr.aria-label]="'Abrir reptiliano avanzado '+entry.ordinal+' en visor 3D'">
          <div class="photo">
            <span class="tag">{{view==='FRONT'?'Frontal':view==='SIDE'?'Lateral':'Posterior'}}</span>
            @if(thumbs[entry.contract.speciesId]?.[view];as src){<img [src]="src" [alt]="'Reptiliano avanzado '+entry.ordinal+' en '+view" loading="lazy"/>}
            @else{<span class="note" [class.error]="failed[entry.contract.speciesId]">{{failed[entry.contract.speciesId]?(renderErrors[entry.contract.speciesId]||'Error al preparar vista'):'Preparando vista…'}}</span>}
          </div>
          <div class="meta">
            <strong>Ejemplar {{entry.ordinal}}</strong>
            <small>{{entry.plan.archetype}}</small>
            <small>{{entry.plan.culture}} · {{entry.plan.role}}</small>
            <small class="accent">{{s8Styles[entry.contract.speciesId]}}</small>
            <small>{{entry.plan.material}} · {{entry.plan.ornament}}</small>
            <small>{{entry.plan.accessory}} · {{entry.plan.secondAccessory}}</small>
            <small>{{complete(entry.contract.speciesId)?'3 vistas capturadas':'Vistas pendientes'}}</small>
          </div>
        </button>
      }
    </div>
    <p class="footer">38.2s · {{completed()}}/{{count}} ejemplares con vistas frontal, lateral y posterior capturadas. Datos sintéticos de laboratorio, CT-0.</p>
  </section>
  `,
})
export class Vida38AdvancedReptilianGallery38SComponent implements AfterViewInit, OnDestroy {
  @Input()selectedSpeciesId:string|null=null;
  @Output()readonly open=new EventEmitter<Vida38SpeciesVisualContract>();
  readonly all=buildVida38AdvancedReptilianGallery38S(24);
  count:Vida38AdvancedReptilianGallerySize38S=24;
  view:Vida38AdvancedReptilianView38S='FRONT';
  readonly s8Styles:Record<string,string>={};
  thumbs:Record<string,Partial<Record<Vida38AdvancedReptilianView38S,string>>>={};
  failed:Record<string,boolean>={};
  renderErrors:Record<string,string>={};
  private renderer:THREE.WebGLRenderer|null=null;
  private scene:THREE.Scene|null=null;
  private camera:THREE.PerspectiveCamera|null=null;
  private alive=false;private index=0;private raf=0;
  constructor(private readonly cdr:ChangeDetectorRef){
    // Al regresar a la galería, las miniaturas ya capturadas reaparecen
    // inmediatamente sin reconstruir las 24 mallas SDF.
    for(const entry of this.all){
      this.s8Styles[entry.contract.speciesId]=deriveVida38AdvancedReptilianDesign38S8(entry.plan).style;
      const cached=getVida38AdvancedReptilianThumbnails38S3(entry.contract);
      if(cached)this.thumbs[entry.contract.speciesId]=cached;
    }
  }
  get visible(){return this.all.slice(0,this.count);}
  setCount(count:Vida38AdvancedReptilianGallerySize38S):void{this.count=count;if(this.alive&&!this.raf)this.schedule();}
  complete(id:string):boolean{const v=this.thumbs[id];return !!v?.FRONT&&!!v?.SIDE&&!!v?.BACK;}
  completed():number{return this.visible.filter(it=>this.complete(it.contract.speciesId)).length;}
  ngAfterViewInit():void{
    this.alive=true;
    try{
      const canvas=document.createElement('canvas');
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(1);this.renderer.setSize(160,180,false);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;
      this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0a1724');
      this.scene.add(new THREE.HemisphereLight('#d2ebf7','#1b2936',1.35));
      const key=new THREE.DirectionalLight('#f5fbff',2.15);key.position.set(3,4,5);this.scene.add(key);
      const rim=new THREE.DirectionalLight('#6ccada',1.18);rim.position.set(-3,2,-4);this.scene.add(rim);
      this.camera=new THREE.PerspectiveCamera(35,160/180,.01,100);this.schedule();
    }catch{this.alive=false;this.release();}
  }
  ngOnDestroy():void{this.alive=false;if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}this.release();}
  private schedule():void{if(!this.alive||this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.captureNext();});}
  private captureNext():void{
    if(!this.alive||!this.renderer||!this.scene||!this.camera||this.index>=this.count)return;
    // Saltar en una sola pasada cualquier miniatura recuperada de la caché.
    while(this.index<this.count && this.complete(this.all[this.index]!.contract.speciesId))this.index++;
    if(this.index>=this.count){this.cdr.markForCheck();return;}
    const entry=this.all[this.index++]!;
    let model:ReturnType<typeof createVida38SpeciesPreviewModelV1>|null=null;
    try{
      model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:VIDA38_ADVANCED_REPTILIAN_THUMB_QUALITY_38S3});
      if(model.subject.userData['vida38AdvancedReptilianRuntime38S6']!==VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6){
        throw new Error('38.2s6: la escena de producción NO ejecutó el control post-render de ADVANCED. Ejecuta el integrador 38.2s6.');
      }
      assertVida38AdvancedReptilianActualModel38S6(model.subject);
      this.scene.add(model.root);model.root.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model.subject),focus=bounds.getCenter(new THREE.Vector3());
      const radius=Math.max(.5,bounds.getSize(new THREE.Vector3()).length()*.5);
      const dist=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.12;
      const dirs:ReadonlyArray<readonly [Vida38AdvancedReptilianView38S,THREE.Vector3]>=[
        ['FRONT',new THREE.Vector3(.03,.05,1)],['SIDE',new THREE.Vector3(1,.05,.04)],['BACK',new THREE.Vector3(-.04,.07,-1)],
      ];
      const images:Partial<Record<Vida38AdvancedReptilianView38S,string>>={};
      for(const [v,dir] of dirs){
        this.camera.position.copy(focus).add(dir.normalize().multiplyScalar(dist));
        this.camera.lookAt(focus);this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);
        images[v]=this.renderer.domElement.toDataURL('image/png');
      }
      this.thumbs[entry.contract.speciesId]=images;
      storeVida38AdvancedReptilianThumbnails38S3(entry.contract,images);
    }catch(error){
      this.failed[entry.contract.speciesId]=true;
      this.renderErrors[entry.contract.speciesId]=error instanceof Error?error.message:String(error);
      console.error('[GENESIS 38.2s7] Fallo verificando la miniatura:',this.renderErrors[entry.contract.speciesId]);
    }
    finally{if(model){this.scene.remove(model.root);model.dispose();}}
    this.cdr.markForCheck();if(this.index<this.count)this.schedule();
  }
  private release():void{this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer=null;this.scene=null;this.camera=null;}
}
