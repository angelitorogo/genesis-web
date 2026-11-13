/**
 * GENESIS 38.2s7 — firma geométrica de indumentaria ADVANCED.
 * Estas piezas grandes son visibles en el modelo final, no sólo un descriptor.
 * Se construyen en las coordenadas locales de la anatomía SDF antes de normalizar.
 * No contiene rutas para VERY_ADVANCED ni modifica el renderer 38.2o.
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import type { Vida38AdvancedReptilianPlan38S } from './vida38-advanced-reptilian-plan-38-2s';
import { deriveVida38AdvancedReptilianWardrobe38S4,
  VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4,
  type Vida38AdvancedReptilianWearFamily38S4 } from './vida38-advanced-reptilian-wardrobe-38-2s4';

export const VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7 = 'VIDA.38.2s7/visible-advanced-outfits/v1' as const;

function makeMaterial(hex:string,roughness=.77,metalness=.02):THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({color:hex,roughness,metalness,clearcoat:.08,side:THREE.DoubleSide});
}
function add(out:THREE.Object3D[],mesh:THREE.Mesh,label:string):void {
  mesh.name=`VIDA38_S7_${label}`;
  mesh.userData['vida38AdvancedReptilianWear38S7']=VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7;
  mesh.userData['vida38AdvancedReptilianWardrobe38S4']=VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4;
  mesh.userData['vida38AdvancedReptilianPart38S2']=label;
  mesh.castShadow=true;
  out.push(mesh);
}
function sphere(pos:[number,number,number],sc:[number,number,number],color:string,rough=.8):THREE.Mesh {
  const m=new THREE.Mesh(new THREE.SphereGeometry(1,22,14),makeMaterial(color,rough));
  m.scale.set(...sc);m.position.set(...pos);return m;
}
function band(y:number,rx:number,rz:number,t:number,hex:string):THREE.Mesh {
  const m=new THREE.Mesh(new THREE.TorusGeometry(rx,t,8,38),makeMaterial(hex,.56,.10));
  m.rotation.x=Math.PI/2;m.scale.y=rz/rx;m.position.y=y;return m;
}
function patch(x:number,y:number,z:number,w:number,h:number,hex:string):THREE.Mesh {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.016),makeMaterial(hex,.53,.07));
  m.position.set(x,y,z);return m;
}
function sleeve(x:number,y:number,side:-1|1,len:number,r:number,hex:string):THREE.Mesh {
  const m=new THREE.Mesh(new THREE.CapsuleGeometry(r,len,7,12),makeMaterial(hex,.78));
  m.position.set(x,y,.02);m.rotation.z=side*.11;return m;
}
function pack(y:number,wide:number,high:number,hex:string):THREE.Mesh {
  const m=new THREE.Mesh(new THREE.BoxGeometry(wide,high,.17),makeMaterial(hex,.66,.04));
  m.position.set(0,y,-.36);return m;
}
function curvedTorso(topY:number,bottomY:number,topRadius:number,bottomRadius:number,depth:number,hex:string):THREE.Mesh {
  const height=topY-bottomY;
  const m=new THREE.Mesh(new THREE.CylinderGeometry(topRadius,bottomRadius,height,36,7,true),makeMaterial(hex,.73));
  m.position.y=(topY+bottomY)/2;
  m.scale.z=depth;
  return m;
}
function line(points:THREE.Vector3[],r:number,hex:string):THREE.Mesh{
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,r,7,false),makeMaterial(hex,.48,.13));
  return m;
}

export function buildVida38AdvancedReptilianVisibleWear38S7(
  a:Vida38HumanoidAnatomy,p:Vida38AdvancedReptilianPlan38S,
):THREE.Object3D[] {
  const w=deriveVida38AdvancedReptilianWardrobe38S4(p);
  const out:THREE.Object3D[]=[];
  const shoulder=a.legLength+a.torsoLength*.86;
  const waist=a.legLength+.065;
  const chest=(shoulder+waist)/2;
  const c=w.outerHex,inner=w.innerHex,trim=w.trimHex,equipment=w.equipmentHex;
  const astronaut=w.family==='ENVIRONMENTAL_SUIT';
  const scientist=w.family==='SCIENTIFIC_ATTIRE';
  const professional=w.family==='DIPLOMATIC_FORMAL'||w.family==='CIVIL_UNIFORM';
  const tactical=w.family==='SECURITY_MILITARY';
  const explorer=w.family==='COLONIAL_EXPLORER';
  const work=w.family==='TECH_WORKSUIT'||w.family==='AEROSPACE_TECHNICIAN';
  const hem=scientist?waist-.27:professional?waist-.10:waist-.03;
  // Cobertura exterior opaca; no vuelve a ser una máscara de la piel.
  add(out,curvedTorso(shoulder,hem,.355+(tactical?.036:0),.285+(scientist?.090:0),.88,c),'SILHOUETTE_JACKET_360');
  // Un segundo panel frontal muy visible, distinto según familia.
  if(scientist||professional||explorer){
    for(const side of [-1,1] as const){
      const panel=patch(side*.15,chest+.02,.354,.23,(shoulder-hem)*.74,scientist?inner:c);
      panel.rotation.y=side*.12;
      add(out,panel,scientist?'SCIENTIST_COAT_FRONT':'TAILORED_JACKET_FRONT');
    }
  }else{
    add(out,patch(0,chest,.352,.30,.40,astronaut?inner:equipment),
      astronaut?'PRESSURIZED_FRONT':'TECHNICAL_CHEST_PANEL');
  }
  // Mangas y puños; tienen volumen propio, no son transparencias de piel.
  for(const side of [-1,1] as const){
    const x=side*(a.shoulderWidth+.10);
    add(out,sleeve(x,chest+.075,side,.44,astronaut?.105:scientist?.073:.086,c),'JACKET_SLEEVE');
    const cuff=band(waist+.27,.082,.070,.018,equipment);
    cuff.position.x=x+side*.05;
    add(out,cuff,'GAUNTLET_OR_CUFF');
    // Piezas de pierna de pantalón y bota, simétricas y fácilmente visibles.
    const pant=sphere([side*(a.hipWidth*.68),a.legLength*.52,.01],
      [a.legThickness*.105,.39,.112],astronaut?c:equipment);
    add(out,pant,'TROUSER_LEG_360');
    const boot=sphere([side*(a.hipWidth*.70),.115,.075],[.122,.19,.17],equipment);
    add(out,boot,astronaut?'SPACE_BOOT':'PROFESSIONAL_BOOT');
  }
  // Cinturón continuo, cierre y aspecto funcional de sociedad industrial.
  add(out,band(waist,.30,.25,.025,equipment),'BELT_360');
  add(out,patch(0,waist,.27,.090,.075,trim),'BELT_CLASP');
  if(work||explorer||tactical||astronaut){
    for(const side of [-1,1] as const){
      const pouch=sphere([side*.31,waist-.055,.13],[.10,.13,.075],equipment);
      add(out,pouch,'ACCESSORY_FIELD_POUCH');
    }
  }
  if(scientist){
    add(out,patch(-.18,chest+.05,.364,.073,.086,trim),'ACCESSORY_SCIENCE_INSIGNIA');
    add(out,patch(.19,waist-.03,.363,.13,.17,equipment),'ACCESSORY_SAMPLE_CASE');
  }
  if(tactical){
    for(const side of [-1,1] as const)
      add(out,sphere([side*(a.shoulderWidth+.10),shoulder-.09,.04],[.17,.095,.19],equipment),'SHOULDER_PROTECTOR');
    add(out,patch(-.17,chest+.13,.359,.08,.09,trim),'ACCESSORY_UNIT_PATCH');
  }
  if(professional){
    add(out,line([new THREE.Vector3(-.14,shoulder-.02,.316),new THREE.Vector3(-.04,chest+.04,.336),new THREE.Vector3(0,waist+.03,.332)],.012,trim),'COAT_LAPEL');
    add(out,patch(.18,chest+.20,.364,.065,.082,trim),'ACCESSORY_FORMAL_BADGE');
  }
  if(explorer||astronaut||w.family==='AEROSPACE_TECHNICIAN'){
    add(out,pack(chest,.34,.42,equipment),'ACCESSORY_BACKPACK_SUPPORT');
    for(const side of [-1,1] as const)
      add(out,line([new THREE.Vector3(side*.19,shoulder-.06,.32),new THREE.Vector3(side*.16,chest,.35),
        new THREE.Vector3(side*.18,waist+.03,.27)],.015,trim),'HARNESS_WEBBING');
  }
  if(astronaut){
    add(out,band(shoulder+.065,a.headWidth*.95,a.headWidth*.85,.031,equipment),'PRESSURE_SEAL');
    const hood=new THREE.Mesh(new THREE.SphereGeometry(a.headWidth*1.12,28,18),new THREE.MeshPhysicalMaterial({
      color:'#bfdde7',transparent:true,opacity:.21,roughness:.12,metalness:0,depthWrite:false,side:THREE.DoubleSide}));
    hood.scale.set(1.17,1.31,1.13);
    hood.position.set(0,a.legLength+a.torsoLength*1.18,.02);
    add(out,hood,'ACCESSORY_SPACE_HELMET');
    add(out,pack(chest-.04,.32,.38,equipment),'ACCESSORY_BREATHING_MODULE');
  }
  if(w.family==='AEROSPACE_TECHNICIAN')
    add(out,patch(0,chest+.15,.364,.18,.10,trim),'ACCESSORY_PILOT_PANEL');
  for(const item of out){
    item.userData['vida38AdvancedReptilianWearFamily38S7']=w.family;
    item.userData['vida38AdvancedReptilianWearRole38S7']=p.role;
  }
  return out;
}
