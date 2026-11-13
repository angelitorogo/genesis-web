import { AfterViewInit,ChangeDetectionStrategy,ChangeDetectorRef,Component,EventEmitter,Input,OnDestroy,Output } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38HumanoidGallery38R,type Vida38HumanoidGallerySize38R } from './vida38-civilized-humanoid-fixtures-38-2r';
export type Vida38HumanoidView38R='FRONT'|'SIDE'|'BACK';
@Component({
  selector:'app-vida38-civilized-humanoid-gallery-38r',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,
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
    .meta{padding:.55rem;display:grid;gap:.30rem}.meta strong{font-size:.85rem}.meta small{font-size:.69rem;color:#b4ceda}.garment{color:#6fe4cf!important}
    .footer{font-size:.76rem;color:#9db8c9;margin:.6rem 0}
  `],
  template:`
  <section data-testid="vida38-civil-humanoid-gallery-38r" aria-label="Galería de humanoides muy avanzados">
    <div class="head"><h3>Humanoides · Muy avanzados</h3>
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
    <p class="note">24 identidades ficticias deterministas, 10 arquetipos y 10 familias de vestuario. Las vistas utilizan el mismo renderer que el juego; no modifican ni descubren ninguna civilización del universo.</p>
    <div class="grid">
      @for(entry of visible;track entry.contract.speciesId){
        <button type="button" class="card" [attr.aria-pressed]="selectedSpeciesId===entry.contract.speciesId" (click)="open.emit(entry.contract)" [attr.aria-label]="'Abrir humanoide '+entry.ordinal+' en visor 3D'">
          <div class="photo">
            <span class="tag">{{view==='FRONT'?'Frontal':view==='SIDE'?'Lateral':'Posterior'}}</span>
            @if(thumbs[entry.contract.speciesId]?.[view];as src){<img [src]="src" [alt]="'Humanoide '+entry.ordinal+' en '+view" loading="lazy"/>}
            @else{<span class="note">{{failed[entry.contract.speciesId]?'No disponible':'Preparando vista…'}}</span>}
          </div>
          <div class="meta">
            <strong>Ejemplar {{entry.ordinal}}</strong>
            <small>{{entry.plan.archetype}}</small>
            <small>{{entry.plan.culture}} · {{entry.plan.role}}</small>
            <small class="garment">{{entry.plan.garment}}</small>
            <small>{{entry.plan.material}} · {{entry.plan.ornament}}</small>
            <small>{{entry.plan.accessory}} · {{entry.plan.secondAccessory}}</small>
            <small>{{complete(entry.contract.speciesId)?'3 vistas capturadas':'Vistas pendientes'}}</small>
          </div>
        </button>
      }
    </div>
    <p class="footer">38.2r · {{completed()}}/{{count}} ejemplares con vistas frontal, lateral y posterior capturadas. Datos sintéticos, CT-0.</p>
  </section>
  `,
})
export class Vida38CivilizedHumanoidGallery38RComponent implements AfterViewInit,OnDestroy {
  @Input()selectedSpeciesId:string|null=null;
  @Output()readonly open=new EventEmitter<Vida38SpeciesVisualContract>();
  readonly all=buildVida38HumanoidGallery38R(24);
  count:Vida38HumanoidGallerySize38R=24;
  view:Vida38HumanoidView38R='FRONT';
  thumbs:Record<string,Partial<Record<Vida38HumanoidView38R,string>>>={};
  failed:Record<string,boolean>={};
  private renderer:THREE.WebGLRenderer|null=null;
  private scene:THREE.Scene|null=null;
  private camera:THREE.PerspectiveCamera|null=null;
  private alive=false;private index=0;private raf=0;
  constructor(private readonly cdr:ChangeDetectorRef){}
  get visible(){return this.all.slice(0,this.count);}
  setCount(count:Vida38HumanoidGallerySize38R):void{this.count=count;if(this.alive&&!this.raf)this.schedule();}
  complete(id:string):boolean{const v=this.thumbs[id];return !!v?.FRONT&&!!v?.SIDE&&!!v?.BACK;}
  completed():number{return this.visible.filter(it=>this.complete(it.contract.speciesId)).length;}
  ngAfterViewInit():void{
    this.alive=true;
    try{
      const canvas=document.createElement('canvas');
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      this.renderer.setPixelRatio(1);this.renderer.setSize(160,180,false);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.20;
      this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0a1724');
      this.scene.add(new THREE.HemisphereLight('#cde9f7','#1a2836',1.40));
      const key=new THREE.DirectionalLight('#f5fbff',2.2);key.position.set(3,4,5);this.scene.add(key);
      const rim=new THREE.DirectionalLight('#6ccada',1.2);rim.position.set(-3,2,-4);this.scene.add(rim);
      this.camera=new THREE.PerspectiveCamera(35,160/180,.01,100);this.schedule();
    }catch{this.alive=false;this.release();}
  }
  ngOnDestroy():void{this.alive=false;if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}this.release();}
  private schedule():void{if(!this.alive||this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.captureNext();});}
  private captureNext():void{
    if(!this.alive||!this.renderer||!this.scene||!this.camera||this.index>=this.count)return;
    const entry=this.all[this.index++]!;
    let model:ReturnType<typeof createVida38SpeciesPreviewModelV1>|null=null;
    try{
      model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      this.scene.add(model.root);model.root.updateMatrixWorld(true);
      const bounds=new THREE.Box3().setFromObject(model.subject),focus=bounds.getCenter(new THREE.Vector3());
      const radius=Math.max(.5,bounds.getSize(new THREE.Vector3()).length()*.5);
      const dist=radius/Math.sin(THREE.MathUtils.degToRad(17.5))*1.13;
      const dirs:ReadonlyArray<readonly [Vida38HumanoidView38R,THREE.Vector3]>=[
        ['FRONT',new THREE.Vector3(.03,.06,1)],['SIDE',new THREE.Vector3(1,.05,.04)],['BACK',new THREE.Vector3(-.04,.07,-1)],
      ];
      const images:Partial<Record<Vida38HumanoidView38R,string>>={};
      for(const [v,dir] of dirs){this.camera.position.copy(focus).add(dir.normalize().multiplyScalar(dist));
        this.camera.lookAt(focus);this.camera.updateProjectionMatrix();this.renderer.render(this.scene,this.camera);
        images[v]=this.renderer.domElement.toDataURL('image/png');}
      this.thumbs[entry.contract.speciesId]=images;
    }catch{this.failed[entry.contract.speciesId]=true;}
    finally{if(model){this.scene.remove(model.root);model.dispose();}}
    this.cdr.markForCheck();if(this.index<this.count)this.schedule();
  }
  private release():void{this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer=null;this.scene=null;this.camera=null;}
}
