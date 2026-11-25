/** COLVIS.2 laboratory: SYNTHETIC visual reconstruction only; never reads
 * knowledge, VIDA.9, saved galaxies or private colonial data. One WebGL canvas.
 */
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as THREE from 'three';
import { VIDA38_INFRASTRUCTURE_REVISION_386, type Vida38InfrastructurePlan386 } from '../infrastructure/vida38-infrastructure-plan-38-6';
import { colvis2LayoutFromVerifiedPlan, type Colvis2Layout } from '../infrastructure/colvis2-colonial-architecture';
import { createVida38InfrastructureSurfaceVisual386, type Vida38InfrastructureVisual386 } from '../infrastructure/vida38-infrastructure-render-38-6';

const populations = {
  OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000],
} as const;
type Population = keyof typeof populations;
type Tier = 'ADVANCED'|'VERY_ADVANCED';
type Lineage = 'HUMANOID'|'REPTILIAN'|'INSECTOID';
type World = 'PLANET'|'MOON';
type Habitat = 'SEALED_SURFACE'|'SUBSURFACE_VAULT'|'ENVIRONMENTAL_SHIELD';
type Purpose = 'RESEARCH'|'EXTRACTION'|'HABITATION'|'BIOSPHERE_CONSERVATION';
interface Preset { readonly lineage:Lineage;readonly tier:Tier;readonly kind:World;readonly label:string; }
const presets:readonly Preset[] = Object.freeze(
  (['HUMANOID','REPTILIAN','INSECTOID'] as const).flatMap(lineage =>
    (['ADVANCED','VERY_ADVANCED'] as const).flatMap(tier =>
      (['PLANET','MOON'] as const).map(kind => Object.freeze({lineage,tier,kind,
        label:`${lineage==='HUMANOID'?'Humanoide':lineage==='REPTILIAN'?'Reptiliana':'Insectoide'} · ${tier==='ADVANCED'?'Avanzada':'Muy avanzada'} · ${kind==='PLANET'?'Planeta':'Luna'}`})))));
function hash32(s:string):number {let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;}

@Component({
  selector:'genesis-colvis1-laboratory', standalone:true, imports:[CommonModule,RouterLink],
  template:`
  <main class="colvis-lab">
    <header><div><p class="eyebrow">LABORATORIO TÉCNICO · COLVIS.2</p>
      <h1>Arquitectura colonial extraterrestre COLVIS.2</h1>
      <p>12 escenarios sintéticos (6 familias × planeta/luna). No son descubrimientos ni posiciones observadas.</p>
    </div><a routerLink="/">← Volver a Home</a></header>
    <div class="presets">
      <button type="button" *ngFor="let p of presets;index as i" [class.active]="i===selectedIndex"
        (click)="select(i)">{{p.label}}</button>
    </div>
    <div class="controls">
      <label>Población
        <select [value]="band" (change)="setBand($any($event.target).value)">
          <option value="OUTPOST">Base pequeña (12–150)</option><option value="SETTLEMENT">Asentamiento (151–5.000)</option>
          <option value="CITY">Ciudad (5.001–120.000)</option><option value="NETWORK">Red (120.001–1.500.000)</option>
        </select></label>
      <label>Hábitat
        <select [value]="habitat" (change)="setHabitat($any($event.target).value)">
          <option value="SEALED_SURFACE">Superficie sellada</option><option value="SUBSURFACE_VAULT">Complejo subterráneo</option>
          <option value="ENVIRONMENTAL_SHIELD">Protección ambiental</option>
        </select></label>
      <label>Función
        <select [value]="purpose" (change)="setPurpose($any($event.target).value)">
          <option value="RESEARCH">Investigación</option><option value="EXTRACTION">Extracción</option>
          <option value="HABITATION">Habitación</option><option value="BIOSPHERE_CONSERVATION">Conservación biológica</option>
        </select></label>
    </div>
    <div class="view-actions">
      <button type="button" (click)="silhouette=!silhouette">{{silhouette?'Ver materiales':'Comparar silueta monocroma'}}</button>
      <button type="button" (click)="distance=10.0;yaw=.5;pitch=.43">Restablecer cámara</button>
      <label>Semilla visual <input type="number" [value]="seedVariant" min="0" max="9999"
        (change)="changeVariant(+$any($event.target).value)" /></label>
    </div>
    <div class="viewport" #viewport aria-label="Vista 3D de una colonia sintética"></div>
    <div class="details" *ngIf="layout as l">
      <strong>{{presets[selectedIndex]?.label}}</strong>
      <span>{{l.high.length}} piezas de reconstrucción HD</span>
      <span>Radio representativo: {{l.footprintRadiusKm}} km</span>
      <span>Altura máxima de diseño: {{l.maximumHeightKm}} km</span>
      <span>Familia: {{l.family}}</span>
      <span>Gramática: {{l.architecturalLanguage}}</span>
      <span>Triángulos del LOD cercano: {{triangles}}</span>
      <span>Mallas (instanciadas): {{meshes}}</span>
      <span>Huella: reconstrucción orientativa, nunca observación</span>
    </div>
    <p class="note">Escala ampliada exclusivamente en este laboratorio para inspeccionar detalles. GENESIS usa
      las dimensiones físicas al mostrar colonias en planetas y lunas. Arrastra para girar; rueda para zoom.
      La geometría es una reconstrucción hipotética de instalaciones, no un registro científico nuevo.</p>
  </main>
  `,
  styles:[`
  :host{display:block;background:#070d17;color:#d6e9ff;min-height:100vh}
  .colvis-lab{margin:0 auto;max-width:1450px;padding:24px;font-family:system-ui,sans-serif}
  header{display:flex;gap:24px;align-items:start;justify-content:space-between;flex-wrap:wrap}
  h1{font-size:25px;margin:6px 0 8px}p{color:#aec9dd;line-height:1.5}
  .eyebrow{letter-spacing:1.6px;color:#73b9e6;font-size:11px}
  a{color:#bddeff;text-decoration:none;padding:9px 13px;border:1px solid #38627d;border-radius:7px}
  .presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:8px;margin:22px 0}
  button,select{color:#d4eeff;background:#0e1e2a;border:1px solid #39617b;border-radius:6px;padding:10px;cursor:pointer}
  button.active{border-color:#83d8ff;background:#153e51}
  .controls{display:flex;flex-wrap:wrap;gap:14px;margin:18px 0}.controls label{display:grid;gap:6px;color:#9dc6da;font-size:12px}
  .view-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 12px}
  .view-actions label{font-size:12px;color:#aacbdc}.view-actions input{width:92px;padding:8px;background:#0c1a28;color:#e0f0ff;border:1px solid #39617b;border-radius:5px}
  .viewport{border:1px solid #29475f;border-radius:10px;height:min(70vh,680px);min-height:350px;overflow:hidden}
  .details{display:flex;gap:18px;flex-wrap:wrap;border:1px solid #28425c;border-radius:8px;padding:12px;margin-top:12px}
  .note{font-size:12px;margin-top:18px}
  `]
})
export class Colvis1Laboratory implements AfterViewInit, OnDestroy {
  private readonly browser=isPlatformBrowser(inject(PLATFORM_ID));
  @ViewChild('viewport',{static:true}) private viewport!:ElementRef<HTMLDivElement>;
  readonly presets=presets;
  selectedIndex=0;
  band:Population='CITY';habitat:Habitat='SEALED_SURFACE';purpose:Purpose='RESEARCH';
  layout:Colvis2Layout|null=null;
  silhouette=false;seedVariant=0;meshes=0;triangles=0;
  private readonly silhouetteShader=new THREE.MeshBasicMaterial({color:'#d5e5e7'});
  changeVariant(value:number):void{this.seedVariant=Math.max(0,Math.min(9999,Math.floor(value||0)));this.select(this.selectedIndex);}
  private scene:THREE.Scene|null=null;private camera:THREE.PerspectiveCamera|null=null;
  private renderer:THREE.WebGLRenderer|null=null;private visual:Vida38InfrastructureVisual386|null=null;
  private ground:THREE.Mesh|null=null;private labSite:THREE.Group|null=null;private frame:number|null=null;
  yaw=.5;pitch=.43;distance=10.0;
  private dragging=false;private lastX=0;private lastY=0;
  private onDown=(event:PointerEvent):void=>{this.dragging=true;this.lastX=event.clientX;this.lastY=event.clientY;};
  private onMove=(event:PointerEvent):void=>{if(!this.dragging)return;this.yaw+=(event.clientX-this.lastX)*.007;
    this.pitch=Math.max(.10,Math.min(1.3,this.pitch+(event.clientY-this.lastY)*.007));this.lastX=event.clientX;this.lastY=event.clientY;};
  private onUp=():void=>{this.dragging=false;};
  private onWheel=(event:WheelEvent):void=>{event.preventDefault();this.distance=Math.max(2.8,Math.min(34,this.distance*(event.deltaY>0?1.1:.9)));};
  ngAfterViewInit():void {
    if(!this.browser)return;
    try{
      this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#060c14');
      this.camera=new THREE.PerspectiveCamera(52,1,.04,150);
      this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
      this.viewport.nativeElement.appendChild(this.renderer.domElement);
      this.renderer.domElement.style.width='100%';this.renderer.domElement.style.height='100%';
      const ambient=new THREE.AmbientLight('#b5d4ea',2);this.scene.add(ambient);
      const sun=new THREE.DirectionalLight('#ffe2bb',3.1);sun.position.set(8,18,11);this.scene.add(sun);
      const fill=new THREE.DirectionalLight('#8bbaff',1.0);fill.position.set(-10,5,-8);this.scene.add(fill);
      const disk=new THREE.Mesh(new THREE.CircleGeometry(5,64),new THREE.MeshStandardMaterial({color:'#182734',roughness:.92,metalness:.20}));
      disk.rotation.x=-Math.PI/2;disk.position.y=-.02;this.ground=disk;this.scene.add(disk);
      const canvas=this.renderer.domElement;
      canvas.addEventListener('pointerdown',this.onDown);window.addEventListener('pointermove',this.onMove);
      window.addEventListener('pointerup',this.onUp);canvas.addEventListener('wheel',this.onWheel,{passive:false});
      this.select(0);this.animate();
    }catch{this.viewport.nativeElement.textContent='WebGL no disponible en este navegador.';}
  }
  select(index:number):void {
    this.selectedIndex=index;
    if(!this.scene || !this.renderer)return;
    if(this.labSite){this.labSite.removeFromParent();this.labSite=null;}
    if(this.visual){this.visual.group.removeFromParent();this.visual.resources.forEach(r=>r.dispose());this.visual=null;}
    const preset=this.presets[index];if(!preset)return;
    const seed=hash32([preset.lineage,preset.tier,preset.kind,this.band,this.habitat,this.purpose,this.seedVariant].join('|'));
    const info=Object.freeze({founderTier:preset.tier,destinationKind:preset.kind,
      populationRange:populations[this.band] as readonly [number,number],function:this.purpose,
      founderSpeciesId:'SYNTHETIC',founderSourceBodyStorageKey:'SYNTHETIC'});
    const plan:Vida38InfrastructurePlan386={revision:VIDA38_INFRASTRUCTURE_REVISION_386,
      id:'COLVIS.2-SYNTHETIC-ONLY',provenance:'VIDA8_COLONIAL_SETTLEMENT',
      locationStatus:'RECONSTRUCTED_NOT_OBSERVED',bodyStorageKey:'SYNTHETIC',seedUint32:seed,
      latitudeRadians:.3,longitudeRadians:.2,form:'COLONIAL_HABITAT',scale:this.band,tier:'COLONIAL',
      lineage:preset.lineage,habitat:this.habitat,purpose:this.purpose,
      habitatTechnology:this.habitat,colonyArchitectureCOLVIS1:info};
    this.layout=colvis2LayoutFromVerifiedPlan(plan);
    const rEarth=preset.kind==='PLANET'?1:.12;
    const visual=createVida38InfrastructureSurfaceVisual386([plan],1,null,null,true,rEarth);
    this.visual=visual;
    visual.setColonialInspectionActiveCOLVIS2(true); // The locator is never a physical building.
    const high=visual.group.children[1] as THREE.Group;
    const site=high.children[0] as THREE.Group | undefined;
    if(site&&this.layout){
      site.removeFromParent();site.position.set(0,0,0);site.quaternion.identity();
      const scale=(rEarth*6371*this.layout.unitExtent)/Math.min(this.layout.footprintRadiusKm,rEarth*6371*.0075);
      site.scale.setScalar(scale);this.scene.add(site);this.labSite=site;
      let meshes=0,triangles=0;
      site.traverse(object=>{if(object instanceof THREE.Mesh){
        meshes++;const geometry=object.geometry as THREE.BufferGeometry;
        const count=geometry.index?.count??geometry.getAttribute('position')?.count??0;
        triangles+=Math.floor(count/3)*(object instanceof THREE.InstancedMesh?object.count:1);
      }});
      this.meshes=meshes;this.triangles=triangles;
    }
  }
  setBand(value:string):void {if(value in populations){this.band=value as Population;this.select(this.selectedIndex);}}
  setHabitat(value:string):void {if(['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'].includes(value)){
    this.habitat=value as Habitat;this.select(this.selectedIndex);}}
  setPurpose(value:string):void {if(['RESEARCH','EXTRACTION','HABITATION','BIOSPHERE_CONSERVATION'].includes(value)){
    this.purpose=value as Purpose;this.select(this.selectedIndex);}}
  private animate=():void=>{
    if(!this.browser || !this.renderer || !this.scene || !this.camera)return;
    const w=this.viewport.nativeElement.clientWidth||800,h=this.viewport.nativeElement.clientHeight||500;
    if(this.renderer.domElement.width!==Math.round(w*this.renderer.getPixelRatio()) ||
      this.renderer.domElement.height!==Math.round(h*this.renderer.getPixelRatio())){
      this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    }
    const c=Math.cos(this.pitch),s=Math.sin(this.pitch);
    this.camera.position.set(this.distance*c*Math.sin(this.yaw),this.distance*s,this.distance*c*Math.cos(this.yaw));
    this.camera.lookAt(0,.25,0);
    this.scene.overrideMaterial=this.silhouette?this.silhouetteShader:null;
    if(this.ground)this.ground.visible=!this.silhouette;
    this.visual?.updateProjectedDiameterPixels(690);
    this.renderer.render(this.scene,this.camera);
    this.frame=window.requestAnimationFrame(this.animate);
  };
  ngOnDestroy():void {
    if(this.frame!==null&&this.browser)window.cancelAnimationFrame(this.frame);
    if(this.renderer){this.renderer.domElement.removeEventListener('pointerdown',this.onDown);
      this.renderer.domElement.removeEventListener('wheel',this.onWheel);}
    if(this.browser){window.removeEventListener('pointermove',this.onMove);window.removeEventListener('pointerup',this.onUp);}
    this.labSite?.removeFromParent();this.visual?.resources.forEach(r=>r.dispose());
    this.silhouetteShader.dispose();this.ground?.geometry.dispose();(this.ground?.material as THREE.Material|undefined)?.dispose();
    this.renderer?.dispose();this.renderer?.domElement.remove();
  }
}
