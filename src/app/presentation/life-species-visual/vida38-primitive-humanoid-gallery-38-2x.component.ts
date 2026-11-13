import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter,
  Input, OnDestroy, Output } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38PrimitiveHumanoidGallery38X,
  type Vida38PrimitiveHumanoidGallerySize38X } from './vida38-primitive-humanoid-fixtures-38-2x';
import { inspectVida38PrimitiveHumanoid38X,
  VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X } from './vida38-primitive-humanoid-preview-38-2x';
import { getVida38PrimitiveHumanoidThumbnails38X,storeVida38PrimitiveHumanoidThumbnails38X,
  type Vida38PrimitiveHumanoidView38X
} from './vida38-primitive-humanoid-thumbnails-38-2x';

@Component({
  selector:'app-vida38-primitive-humanoid-gallery-38x',standalone:true,
  changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host{display:block}.head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.7rem;margin:.65rem 0}
    h3{font-size:1.07rem;color:#e1f5ff;margin:0}.controls{display:flex;gap:.38rem;flex-wrap:wrap}
    button.ctrl{border:1px solid #315c74;background:#122534;color:#cde9f8;border-radius:8px;padding:.48rem .70rem;cursor:pointer}
    button.ctrl[aria-pressed=true]{background:#14505a;border-color:#5cdec6}
    .note{font-size:.80rem;color:#a7c7d4;line-height:1.5;margin:.5rem 0 .7rem}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:.62rem}
    .card{display:block;overflow:hidden;border-radius:10px;border:1px solid #2a4960;background:#111e2c;color:#e1f4fd;cursor:pointer;padding:0;text-align:left}
    .card[aria-pressed=true]{border-color:#5de5d0;box-shadow:inset 0 0 0 1px #5de5d0}
    .card:hover{border-color:#79d4ef}.photo{height:180px;position:relative;background:#091724;display:flex;align-items:center;justify-content:center}
    .photo img{width:100%;height:100%;object-fit:contain}.angle{position:absolute;top:.4rem;left:.4rem;color:#9ddef0;font-size:.69rem}
    .data{padding:.54rem;display:grid;gap:.28rem}.data strong{font-size:.83rem}.data small{font-size:.69rem;color:#b3cfdf}
    .wear{color:#71e5d1!important}.error{color:#ffb3a5!important;font-size:.72rem;overflow-wrap:anywhere}
    .footer{font-size:.76rem;color:#9ebecd;margin:.75rem 0}
  `],
  template:`
    <section data-testid="vida38-primitive-humanoid-gallery-38x" aria-label="Galería humanoide primitiva">
      <div class="head"><h3>Humanoides · Primitivos</h3>
        <div class="controls" role="group" aria-label="Número de ejemplares">
          <button class="ctrl" type="button" [attr.aria-pressed]="count===12" (click)="setCount(12)">12</button>
          <button class="ctrl" type="button" [attr.aria-pressed]="count===24" (click)="setCount(24)">24</button>
        </div>
        <div class="controls" role="group" aria-label="Vistas">
          <button class="ctrl" type="button" [attr.aria-pressed]="view==='FRONT'" (click)="view='FRONT'">Frontal</button>
          <button class="ctrl" type="button" [attr.aria-pressed]="view==='SIDE'" (click)="view='SIDE'">Lateral</button>
          <button class="ctrl" type="button" [attr.aria-pressed]="view==='BACK'" (click)="view='BACK'">Posterior</button>
        </div>
      </div>
      <p class="note">24 muestras deterministas de civilización tribal, artesanal, agrícola y ceremonial. El laboratorio usa la misma fábrica de modelos que las fichas. Los modelos de prueba no se guardan en el universo.</p>
      <div class="grid">
        @for(entry of visible;track entry.contract.speciesId){
          <button type="button" class="card" [attr.aria-pressed]="selectedSpeciesId===entry.contract.speciesId" (click)="open.emit(entry.contract)" [attr.aria-label]="'Abrir humanoide primitivo '+entry.serial">
            <div class="photo"><span class="angle">{{view==='FRONT'?'Frontal':view==='SIDE'?'Lateral':'Posterior'}}</span>
              @if(thumbs[entry.contract.speciesId]?.[view];as src){<img [src]="src" loading="lazy" [alt]="'Humanoide primitivo '+entry.serial+' '+view"/>}
              @else{<span class="note" [class.error]="errors[entry.contract.speciesId]">{{errors[entry.contract.speciesId]||'Preparando vista 3D…'}}</span>}
            </div>
            <div class="data">
              <strong>Ejemplar {{entry.serial}}</strong>
              <small>{{entry.plan.silhouette}} · {{entry.plan.ornament}}</small>
              <small>{{entry.plan.culture}} · {{entry.plan.role}}</small>
              <small class="wear">{{entry.plan.wear}}</small>
              <small>SDF orgánico · {{entry.plan.silhouette}}</small>
              <small>{{entry.plan.accessories.join(' · ')}}</small>
              <small>{{complete(entry.contract.speciesId)?'3 vistas capturadas':'Vistas pendientes'}}</small>
            </div>
          </button>
        }
      </div>
      <p class="footer">38.2x · {{completed()}}/{{count}} especímenes capturados. Miniaturas LOW en caché temporal, frontal/lateral/posterior; visor 3D independiente.</p>
    </section>
  `,
})
export class Vida38PrimitiveHumanoidGallery38XComponent implements AfterViewInit,OnDestroy{
  @Input()selectedSpeciesId:string|null=null;
  @Output()readonly open=new EventEmitter<Vida38SpeciesVisualContract>();
  readonly all=buildVida38PrimitiveHumanoidGallery38X(24);
  count:Vida38PrimitiveHumanoidGallerySize38X=24;
  view:Vida38PrimitiveHumanoidView38X='FRONT';
  thumbs:Record<string,Partial<Record<Vida38PrimitiveHumanoidView38X,string>>>={};
  errors:Record<string,string>={};
  private renderer:THREE.WebGLRenderer|null=null;
  private scene:THREE.Scene|null=null;
  private camera:THREE.PerspectiveCamera|null=null;
  private alive=false;private index=0;private raf=0;
  constructor(private readonly cdr:ChangeDetectorRef){
    for(const entry of this.all){
      const cached=getVida38PrimitiveHumanoidThumbnails38X(entry.contract);
      if(cached)this.thumbs[entry.contract.speciesId]=cached;
    }
  }
  get visible(){return this.all.slice(0,this.count);}
  setCount(count:Vida38PrimitiveHumanoidGallerySize38X):void{this.count=count;if(this.alive&&!this.raf)this.schedule();}
  complete(id:string):boolean{const v=this.thumbs[id];return !!v?.FRONT&&!!v?.SIDE&&!!v?.BACK;}
  completed():number{return this.visible.filter(it=>this.complete(it.contract.speciesId)).length;}
  ngAfterViewInit():void{
    this.alive=true;
    try{
      const canvas=document.createElement('canvas');
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      this.renderer.setSize(160,180,false);this.renderer.setPixelRatio(1);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.19;
      this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0a1724');
      this.scene.add(new THREE.HemisphereLight('#d6f1f3','#203447',1.42));
      const key=new THREE.DirectionalLight('#fff8ec',2.1);key.position.set(3,4,5);this.scene.add(key);
      const rim=new THREE.DirectionalLight('#69d6ed',1.20);rim.position.set(-3,2,-4);this.scene.add(rim);
      this.camera=new THREE.PerspectiveCamera(35,160/180,.01,100);this.schedule();
    }catch(error){this.errors['renderer']=String(error);this.alive=false;this.release();}
  }
  ngOnDestroy():void{this.alive=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.release();}
  private schedule(){if(!this.alive||this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.captureNext();});}
  private captureNext():void{
    if(!this.alive||!this.scene||!this.renderer||!this.camera||this.index>=this.count)return;
    while(this.index<this.count&&this.complete(this.all[this.index]!.contract.speciesId))this.index++;
    if(this.index>=this.count){this.cdr.markForCheck();return;}
    const entry=this.all[this.index++]!;
    let model:ReturnType<typeof createVida38SpeciesPreviewModelV1>|null=null;
    try{
      model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      if(model.subject.userData['vida38PrimitiveHumanoidRenderer38X']!==VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X)
        throw new Error('38.2x: el modelo no utiliza el renderer primitivo');
      const actual=inspectVida38PrimitiveHumanoid38X(model.subject);
      if(actual.garments<2)
        throw new Error(`38.2x: vestuario no integrado (${JSON.stringify(actual)})`);
      this.scene.add(model.root);model.root.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model.subject);
      const focus=bounds.getCenter(new THREE.Vector3());
      const radius=Math.max(.48,bounds.getSize(new THREE.Vector3()).length()*.5);
      const distance=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.15;
      const dirs:ReadonlyArray<readonly [Vida38PrimitiveHumanoidView38X,THREE.Vector3]>=[
        ['FRONT',new THREE.Vector3(.03,.055,1)],['SIDE',new THREE.Vector3(1,.05,.035)],
        ['BACK',new THREE.Vector3(-.03,.06,-1)],
      ];
      const images:Partial<Record<Vida38PrimitiveHumanoidView38X,string>>={};
      for(const [view,dir] of dirs){
        this.camera.position.copy(focus).add(dir.normalize().multiplyScalar(distance));
        this.camera.lookAt(focus);this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene,this.camera);
        images[view]=this.renderer.domElement.toDataURL('image/png');
      }
      this.thumbs[entry.contract.speciesId]=images;
      storeVida38PrimitiveHumanoidThumbnails38X(entry.contract,images);
    }catch(error){
      this.errors[entry.contract.speciesId]=error instanceof Error?error.message:String(error);
      console.error('[GENESIS 38.2x] Miniatura humanoide primitiva:',this.errors[entry.contract.speciesId]);
    }finally{if(model){this.scene.remove(model.root);model.dispose();}}
    this.cdr.markForCheck();if(this.index<this.count)this.schedule();
  }
  private release():void{
    this.renderer?.dispose();this.renderer?.forceContextLoss();
    this.renderer=null;this.camera=null;this.scene=null;
  }
}
