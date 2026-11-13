import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38InsectoidGallery38Q, type Vida38InsectoidGallerySize38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { deriveVida38InsectoidWardrobeStyle38Q2 } from './vida38-civilized-insectoid-wardrobe-38-2q2';
export type Vida38InsectoidView38Q='FRONT'|'SIDE'|'BACK';
@Component({
  selector:'app-vida38-civilized-insectoid-gallery-38q',standalone:true,changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host{display:block}
    .head{display:flex;justify-content:space-between;flex-wrap:wrap;gap:.6rem;align-items:center;margin:.6rem 0}
    .controls{display:flex;gap:.4rem;flex-wrap:wrap}
    button.ctrl{background:#122638;border:1px solid #37647b;color:#cee9f7;border-radius:8px;padding:.45rem .7rem;cursor:pointer}
    button.ctrl[aria-pressed=true]{border-color:#5ae1c5;background:#14505a}
    h3{font-size:1.05rem;color:#d3ecf8;margin:0}
    .note{font-size:.8rem;color:#a7c1ce;margin:.6rem 0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(157px,1fr));gap:.6rem}
    .card{display:block;text-align:left;border:1px solid #274759;background:#101d2b;border-radius:10px;padding:0;color:#e6f6ff;cursor:pointer;overflow:hidden}
    .card[aria-pressed=true]{border-color:#69edc7;box-shadow:0 0 0 1px #69edc7 inset}
    .card:hover,.card:focus-visible{border-color:#7de5e0}
    .photo{height:180px;background:#07131c;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
    .photo img{width:100%;height:100%;object-fit:contain}
    .view{position:absolute;top:.35rem;left:.35rem;color:#94c8dc;background:#0b1d2ae6;padding:.1rem .28rem;border-radius:4px;font-size:.68rem}
    .data{padding:.5rem;display:grid;gap:.25rem}
    .data strong{font-size:.83rem}.data small{font-size:.68rem;color:#a7cedd}
    .meta{color:#78e9d5!important}
    .footer{margin:.7rem 0;font-size:.75rem;color:#93b3c1}
  `],
  template:`
    <section data-testid="vida38-civil-insectoid-gallery-38q" aria-label="Galería insectoide muy avanzada">
      <div class="head">
        <h3>Insectoides · Muy avanzados</h3>
        <div class="controls" role="group" aria-label="Cantidad de especies">
          <button class="ctrl" type="button" [attr.aria-pressed]="count===12" (click)="setCount(12)">12</button>
          <button class="ctrl" type="button" [attr.aria-pressed]="count===24" (click)="setCount(24)">24</button>
        </div>
        <div class="controls" role="group" aria-label="Vistas de comprobación">
          <button class="ctrl" type="button" [attr.aria-pressed]="view==='FRONT'" (click)="view='FRONT'">Frontal</button>
          <button class="ctrl" type="button" [attr.aria-pressed]="view==='SIDE'" (click)="view='SIDE'">Lateral</button>
          <button class="ctrl" type="button" [attr.aria-pressed]="view==='BACK'" (click)="view='BACK'">Posterior</button>
        </div>
      </div>
      <p class="note">Insectoides de prueba: cuerpos erguidos, ojos compuestos, brazos manipuladores adicionales, alas plegadas cuando corresponde, aguijones, ocelos adicionales, prendas con espacio para cada articulación y accesorios tecnológicos deterministas. No se guardan en el universo.</p>
      <div class="grid">
        @for (entry of visible; track entry.contract.speciesId) {
          <button type="button" class="card" [attr.aria-pressed]="selectedSpeciesId===entry.contract.speciesId" (click)="open.emit(entry.contract)" [attr.aria-label]="'Abrir insectoide ' + entry.serial">
            <div class="photo">
              <span class="view">{{view==='FRONT'?'Frontal':view==='SIDE'?'Lateral':'Posterior'}}</span>
              @if (thumbs[entry.contract.speciesId]?.[view]; as src) {
                <img [src]="src" [alt]="'Insectoide ' + entry.serial + ' en vista ' + view" loading="lazy"/>
              } @else {<span class="note">{{failed[entry.contract.speciesId]?'Vista no disponible':'Preparando 3D…'}}</span>}
            </div>
            <div class="data">
              <strong>Ejemplar {{entry.serial}}</strong>
              <small>{{entry.plan.archetype}}</small>
              <small>{{entry.plan.culture}} · {{entry.plan.role}}</small>
              <small class="meta">{{wardrobeLabel(entry.plan.wardrobe)}}</small>
              <small>{{wardrobeDetail(entry.plan)}}</small>
              <small>{{entry.plan.materialKind}} · {{entry.plan.ornament}}</small>
              <small>{{entry.plan.armCount}} brazos · {{entry.plan.accessory}}</small>
              <small>{{traitLabel(entry)}}</small>
              <small>{{complete(entry.contract.speciesId)?'3 vistas capturadas':'Pendiente de vistas'}}</small>
            </div>
          </button>
        }
      </div>
      <p class="footer">38.2q · {{completed()}}/{{count}} especímenes comprobados en frontal, lateral y posterior. Mismo renderer que las fichas del juego; las muestras del laboratorio son sintéticas y reproducibles.</p>
    </section>
  `,
})
export class Vida38CivilizedInsectoidGallery38QComponent implements AfterViewInit,OnDestroy {
  @Input() selectedSpeciesId:string|null=null;
  @Output() readonly open=new EventEmitter<Vida38SpeciesVisualContract>();
  readonly all=buildVida38InsectoidGallery38Q(24);
  readonly styles=Object.fromEntries(this.all.map(entry=>[
    entry.contract.speciesId, deriveVida38InsectoidWardrobeStyle38Q2(entry.plan),
  ]));
  wardrobeLabel(family:string):string{
    const names:Record<string,string>={
      EXO_SUIT:'Traje tecnológico ceñido',
      SEGMENTED_BIO_ARMOR:'Bioarmadura segmentada',
      SCIENTIFIC_HARNESS:'Bata científica abierta',
      ROYAL_MANTLE:'Manto noble dorsal',
      CEREMONIAL_VESTMENTS:'Vestidura ceremonial',
      EXPLORER_KIT:'Poncho de exploración',
    };
    return names[family]??family;
  }
  wardrobeDetail(plan:(typeof this.all)[number]['plan']):string{
    const entry=this.styles[plan.speciesId];
    return entry?`${entry.textile} · largo ${entry.length.toFixed(2)} · caída ${entry.flare.toFixed(2)}`:'';
  }
  count:Vida38InsectoidGallerySize38Q=24;
  view:Vida38InsectoidView38Q='FRONT';
  thumbs:Record<string,Partial<Record<Vida38InsectoidView38Q,string>>>={};
  failed:Record<string,boolean>={};
  private renderer:THREE.WebGLRenderer|null=null;
  private scene:THREE.Scene|null=null;
  private camera:THREE.PerspectiveCamera|null=null;
  private alive=false;
  private index=0;
  private raf=0;
  constructor(private readonly cdr:ChangeDetectorRef){}
  get visible(){return this.all.slice(0,this.count);}
  setCount(count:Vida38InsectoidGallerySize38Q){this.count=count;if(this.alive&&!this.raf)this.schedule();}
  traitLabel(entry:(typeof this.all)[number]):string{
    const traits:string[]=[];
    if(entry.plan.wingPairs>0)traits.push(`${entry.plan.wingPairs} par${entry.plan.wingPairs>1?'es':''} de alas`);
    if(entry.plan.extraEyes>0)traits.push(`${entry.plan.extraEyes} ojos extra`);
    if(entry.plan.stinger!=='NONE')traits.push(entry.plan.stinger==='LANCET'?'aguijón largo':'aguijón corto');
    return traits.length?traits.join(' · '):'rasgos insectoides sobrios';
  }
  complete(id:string){const a=this.thumbs[id];return !!a?.FRONT&&!!a?.SIDE&&!!a?.BACK;}
  completed(){return this.visible.filter(e=>this.complete(e.contract.speciesId)).length;}
  ngAfterViewInit():void{
    this.alive=true;
    try{
      const canvas=document.createElement('canvas');
      this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
      this.renderer.setSize(160,180,false);this.renderer.setPixelRatio(1);
      this.renderer.outputColorSpace=THREE.SRGBColorSpace;
      this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=1.22;
      this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#0b1825');
      this.scene.add(new THREE.HemisphereLight('#c6eaff','#23313f',1.45));
      const key=new THREE.DirectionalLight('#f6fff5',2.3);key.position.set(3,4,4);this.scene.add(key);
      const rim=new THREE.DirectionalLight('#61c8ff',1.30);rim.position.set(-3,1,-4);this.scene.add(rim);
      this.camera=new THREE.PerspectiveCamera(35,160/180,.01,100);
      this.schedule();
    }catch{this.alive=false;this.release();}
  }
  ngOnDestroy(){this.alive=false;if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.release();}
  private schedule(){if(!this.alive||this.raf)return;this.raf=requestAnimationFrame(()=>{this.raf=0;this.captureNext();});}
  private captureNext(){
    if(!this.alive||!this.renderer||!this.scene||!this.camera||this.index>=this.count)return;
    const entry=this.all[this.index++]!;
    let model:ReturnType<typeof createVida38SpeciesPreviewModelV1>|null=null;
    try{
      model=createVida38SpeciesPreviewModelV1(entry.contract,{humanoidQuality:'LOW'});
      this.scene.add(model.root);model.root.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(model.subject),focus=box.getCenter(new THREE.Vector3());
      const radius=Math.max(.45,box.getSize(new THREE.Vector3()).length()*.5);
      const distance=radius/Math.sin(THREE.MathUtils.degToRad(35*.5))*1.18;
      const dirs:ReadonlyArray<readonly [Vida38InsectoidView38Q,THREE.Vector3]>=[
        ['FRONT',new THREE.Vector3(.04,.07,1)],['SIDE',new THREE.Vector3(1,.055,.04)],['BACK',new THREE.Vector3(-.04,.07,-1)],
      ];
      const images:Partial<Record<Vida38InsectoidView38Q,string>>={};
      for(const [view,dir] of dirs){
        this.camera.position.copy(focus).add(dir.normalize().multiplyScalar(distance));
        this.camera.lookAt(focus);this.camera.updateProjectionMatrix();
        this.renderer.render(this.scene,this.camera);images[view]=this.renderer.domElement.toDataURL('image/png');
      }
      this.thumbs[entry.contract.speciesId]=images;
    }catch{this.failed[entry.contract.speciesId]=true;}
    finally{if(model){this.scene.remove(model.root);model.dispose();}}
    this.cdr.markForCheck();if(this.index<this.count)this.schedule();
  }
  private release(){this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer=null;this.scene=null;this.camera=null;}
}
