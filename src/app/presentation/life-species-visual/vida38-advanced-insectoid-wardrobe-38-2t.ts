/** GENESIS 38.2t — vestimenta profesional de volumen propio y huecos anatómicos.
 * Se aplica SOLO sobre la anatomía insectoide de la nueva rama ADVANCED.
 */
import * as THREE from 'three';
import type { Vida38CivilizedInsectoidPlan38Q } from './vida38-civilized-insectoid-preview-38-2q';
import { torsoRadiusVida38Q2 } from './vida38-civilized-insectoid-wardrobe-38-2q2';
import type { Vida38AdvancedInsectPlan38T } from './vida38-advanced-insectoid-plan-38-2t';

export const VIDA38_ADV_INSECT_WARDROBE_REVISION_38T = 'VIDA.38.2t/industrial-scientific-insectoid-wardrobe/v1' as const;
type Quality = 'LOW'|'MEDIUM'|'HIGH';
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const mat=(hex:string,metalness=.025,roughness=.80)=>new THREE.MeshPhysicalMaterial({
  color:hex,metalness,roughness,clearcoat:metalness>.20?.18:.04,side:THREE.DoubleSide,
});
function add(target:THREE.Object3D[],piece:THREE.Object3D,label:string):void {
  piece.name=`VIDA38_T_${label}`;
  piece.userData['vida38AdvancedInsectWardrobe38T']=VIDA38_ADV_INSECT_WARDROBE_REVISION_38T;
  piece.userData['vida38AdvancedInsectPart38T']=label;
  if(piece instanceof THREE.Mesh)piece.castShadow=true;
  target.push(piece);
}
function caseMesh(w:number,h:number,d:number,hex:string):THREE.Mesh {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d,1,1,1),mat(hex,.08,.60));
  return m;
}
function tubing(points:readonly THREE.Vector3[],r:number,hex:string):THREE.Mesh {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...points]),
    Math.max(10,points.length*6),r,6,false),mat(hex,.11,.57));
}
function panel(q:Vida38CivilizedInsectoidPlan38Q,wear:Vida38AdvancedInsectPlan38T,
  quality:Quality, opts:{top:number;bottom:number;start?:number;end?:number;gapFront?:boolean;
    armHoles?:boolean;wingHoles?:boolean;flare?:number;offset?:number;backSlit?:boolean;flutes?:number},
  hex:string):THREE.Mesh {
  const seg=quality==='LOW'?30:quality==='MEDIUM'?44:60;
  const rows=quality==='LOW'?15:quality==='MEDIUM'?22:32;
  const positions:number[]=[],indices:number[]=[];
  const thetaStart=opts.start??0,thetaEnd=opts.end??Math.PI*2;
  const pitch=(thetaEnd-thetaStart)/seg;
  function blocked(y:number,angle:number):boolean {
    const circular=(a:number,b:number)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
    if(opts.gapFront&&circular(angle,0)<.11)return true;
    if(opts.backSlit&&circular(angle,Math.PI)<.17&&y<1.19)return true;
    if(opts.wingHoles&&q.wingPairs>0&&y>1.60&&circular(angle,Math.PI)<.65)return true;
    if(opts.armHoles){
      const levels=q.armPairs;
      for(let i=0;i<levels;i++){
        const fraction=levels===1?.30:i/Math.max(1,levels-1);
        const armY=1.72-fraction*.38;
        if(Math.abs(y-armY)<.15 && (circular(angle,Math.PI/2)<.27||circular(angle,3*Math.PI/2)<.27))return true;
      }
    }
    return false;
  }
  for(let j=0;j<=rows;j++){
    const t=j/rows,y=opts.top+(opts.bottom-opts.top)*t;
    const base=Math.max(.17,torsoRadiusVida38Q2(q,clamp(y,.92,1.92)));
    const radius=base+(opts.offset??.065)+(opts.flare??0)*t*t;
    for(let i=0;i<=seg;i++){
      const theta=thetaStart+pitch*i;
      const flutter=.011*Math.sin(theta*(opts.flutes??7)+t*7+wear.shapeVariant)*t*t;
      const x=Math.sin(theta)*(radius+flutter)*(1+.035*Math.sin(t*Math.PI));
      const z=Math.cos(theta)*(radius+flutter)*.87-.035;
      positions.push(x,y+.006*Math.sin(theta*7+t*2)*t,z);
      if(i>0&&j>0){
        const centerY=opts.top+(opts.bottom-opts.top)*(j-.5)/rows;
        const centerTheta=thetaStart+pitch*(i-.5);
        if(blocked(centerY,centerTheta))continue;
        const k=j*(seg+1)+i;
        indices.push(k,k-1,k-seg-2,k,k-seg-2,k-seg-1);
      }
    }
  }
  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geom.setIndex(indices);geom.computeVertexNormals();
  return new THREE.Mesh(geom,mat(hex));
}
function coloredBadge(out:THREE.Object3D[],w:Vida38AdvancedInsectPlan38T,x:number,y:number,z:number):void{
  const badge=caseMesh(.075,.065,.018,w.accentHex);badge.position.set(x,y,z);add(out,badge,'CULTURAL_BADGE');
}
function backpack(out:THREE.Object3D[],w:Vida38AdvancedInsectPlan38T,heavy=false):void{
  // Bajo las raíces de alas; deja libres el dorso superior y el aguijón.
  const y=w.wingPairs>0?1.13:1.42;
  const pack=caseMesh(heavy?.31:.28,heavy?.37:.29,heavy?.17:.13,w.utilityHex);
  pack.position.set(0,y,-.35);add(out,pack,heavy?'LIFE_SUPPORT_PACK':'FIELD_PACK');
  for(const side of [-1,1] as const){
    add(out,tubing([new THREE.Vector3(side*.11,y+.14,-.39),
      new THREE.Vector3(side*.22,1.37,-.22),new THREE.Vector3(side*.17,1.60,-.18)],.014,w.accentHex),'PACK_SUPPORT_STRAP');
  }
}
function neckAndHelmet(out:THREE.Object3D[],model:THREE.Group,w:Vida38AdvancedInsectPlan38T,
  flight:boolean):void{
  model.updateMatrixWorld(true);
  // Volumen facial REAL: incluye cráneo, ojos y mandíbulas; no mide antenas por
  // separado porque atraviesan puertos superiores flexibles.
  const bounds=new THREE.Box3();
  for(const obj of model.children){
    const part=String(obj.userData['civInsectoidPart38Q']??'');
    if(['HEAD','FACE_PLATE','EYE','MANDIBLE','OCELLUS'].includes(part))bounds.expandByObject(obj);
  }
  if(bounds.isEmpty())bounds.set(new THREE.Vector3(-.3,1.96,-.3),new THREE.Vector3(.3,2.48,.34));
  const center=bounds.getCenter(new THREE.Vector3());
  const half=bounds.getSize(new THREE.Vector3()).multiplyScalar(.5);
  const radiusX=Math.max(.32,half.x+.09),radiusY=Math.max(.30,half.y+.085),radiusZ=Math.max(.34,half.z+.11);
  const shell=new THREE.Mesh(new THREE.SphereGeometry(1,30,22,0,Math.PI*2,0,flight?Math.PI*.75:Math.PI),
    new THREE.MeshPhysicalMaterial({color:flight?'#9dc7d1':'#c3dfe2',metalness:.07,roughness:.10,
      transparent:true,opacity:flight?.29:.18,depthWrite:false,side:THREE.DoubleSide,clearcoat:.75}));
  shell.position.copy(center);shell.scale.set(radiusX,radiusY,radiusZ);
  add(out,shell,flight?'PILOT_PROTECTIVE_VISOR':'EVA_CRANIAL_ENVELOPE');
  // Juntas flexibles en las bases de las antenas, conservando los apéndices
  // sensoriales originales y evitando tratarlos como una pieza del casco.
  for(const antenna of model.children){
    if(antenna.userData['civInsectoidPart38Q']!=='ANTENNA'||!(antenna instanceof THREE.Mesh))continue;
    const points=antenna.geometry.getAttribute('position');
    if(!points||points.count<6)continue;
    const base=new THREE.Vector3();
    const sample=Math.min(11,points.count);
    for(let i=0;i<sample;i++)base.add(new THREE.Vector3(points.getX(i),points.getY(i),points.getZ(i)));
    base.multiplyScalar(1/sample);
    const gasket=new THREE.Mesh(new THREE.TorusGeometry(.044,.012,7,22),mat(w.utilityHex,.09,.70));
    gasket.position.copy(base);gasket.rotation.x=Math.PI/2;
    add(out,gasket,'ANTENNA_FLEXIBLE_SEAL');
  }
  const collar=new THREE.Mesh(new THREE.TorusGeometry(radiusX*.83,.031,8,42),mat(w.utilityHex,.17,.58));
  collar.position.set(center.x,bounds.min.y-.018,center.z);collar.rotation.x=Math.PI/2;
  collar.scale.y=radiusZ/radiusX;add(out,collar,'ANATOMICAL_NECK_SEAL');
  for(const side of [-1,1] as const){
    const ear=caseMesh(.045,.125,.065,w.utilityHex);
    ear.position.set(center.x+side*radiusX*.93,center.y,center.z);
    add(out,ear,'HELMET_SIDE_CONNECTOR');
  }
}

/** Geometría útil para LOW de galería y HIGH de visor, sin alterar piel ni ojos. */
export function buildVida38AdvancedInsectWardrobe38T(
  model:THREE.Group,q:Vida38CivilizedInsectoidPlan38Q,w:Vida38AdvancedInsectPlan38T,
  quality:Quality,
):THREE.Object3D[]{
  const out:THREE.Object3D[]=[];
  const sec=w.wear==='SECURITY_UNIFORM',eva=w.wear==='ENVIRONMENTAL_EVA';
  const scientist=w.wear==='SCIENTIFIC_COAT',civil=w.wear==='CIVIL_UNIFORM';
  const formal=w.wear==='DIPLOMATIC_FORMAL',field=w.wear==='COLONIAL_EXPLORER';
  const flight=w.wear==='AEROSPACE_FLIGHT',industrial=w.wear==='INDUSTRIAL_OVERALLS';
  const top=1.90,mid=1.14;
  const bottom=scientist?.79:formal?.82:field?.98:industrial?.95:1.075;
  const baseHex=eva?w.innerHex:flight?w.utilityHex:w.outerHex;
  // Capa base adaptativa, con huecos reales para 2/4 brazos y anclajes de alas.
  add(out,panel(q,w,quality,{top,bottom:mid,armHoles:true,wingHoles:true,offset:.050,flutes:7},baseHex),'CLOTHING_BASE_360');
  if(scientist||formal||field){
    const coatBottom=bottom-(w.garmentLength-.74)*.13;
    const culturalFlare=w.culture==='STAR_KINGDOM'?.065:w.culture==='PELAGIC_CONCORD'?.05:
      w.culture==='OBSIDIAN_CLAN'?-.035:0;
    const option={top:1.88,bottom:coatBottom,armHoles:true,wingHoles:true,backSlit:true,
      flare:(scientist?.13:formal?.20:.16)+culturalFlare,offset:.088,flutes:w.culture==='PELAGIC_CONCORD'?11:8};
    add(out,panel(q,w,quality,{...option,start:-1.34,end:-.13},w.outerHex),
      scientist?'LAB_COAT_LEFT':formal?'FORMAL_COAT_LEFT':'EXPEDITION_PONCHO_LEFT');
    add(out,panel(q,w,quality,{...option,start:.13,end:1.34},w.outerHex),
      scientist?'LAB_COAT_RIGHT':formal?'FORMAL_COAT_RIGHT':'EXPEDITION_PONCHO_RIGHT');
    // Espalda recortada a dos piezas para alas y aguijón.
    add(out,panel(q,w,quality,{...option,start:1.80,end:4.49},
      formal?w.innerHex:w.outerHex),'TAIL_AND_WING_AWARE_BACK');
    for(const side of [-1,1] as const){
      add(out,tubing([new THREE.Vector3(side*.09,1.80,.38),
        new THREE.Vector3(side*.16,1.56,.39),new THREE.Vector3(side*.12,1.14,.34)],.016,w.accentHex),'TAILORED_LAPEL');
    }
  }else if(sec||eva||industrial||flight){
    add(out,panel(q,w,quality,{top:1.88,bottom:industrial?.95:eva?.99:1.08,
      armHoles:true,wingHoles:true,offset:eva?.13:sec?.11:.078,
      flare:eva?.025:sec?.06:industrial?.04:.018},
      sec?w.utilityHex:industrial?w.outerHex:eva?w.innerHex:w.outerHex),'STRUCTURED_PROFESSIONAL_VEST');
    const shield=caseMesh(sec?.36:eva?.29:.26,sec?.31:eva?.36:.28,.055,sec?w.outerHex:w.utilityHex);
    shield.position.set(0,1.47,.37);add(out,shield,sec?'SECURITY_CHEST_PLATE':eva?'PRESSURE_CONTROL_MODULE':'FLIGHT_TECH_PANEL');
  }else if(civil){
    add(out,panel(q,w,quality,{top:1.86,bottom:1.07,armHoles:true,wingHoles:true,
      offset:.075,flare:.05,gapFront:true},w.outerHex),'CIVIL_SHORT_JACKET');
    coloredBadge(out,w,-.14,1.62,.38);
  }
  // Cinturón no continuo en los laterales si hay inserción de patas o abdomen robusto.
  const buckle=caseMesh(.10,.065,.035,w.accentHex);buckle.position.set(0,1.06,.31);add(out,buckle,'WAIST_BUCKLE');
  for(const side of [-1,1] as const){
    const pocket=caseMesh(industrial?.16:.11,industrial?.16:.13,.07,w.utilityHex);
    pocket.position.set(side*.30,1.08,.16);pocket.rotation.y=side*.44;
    add(out,pocket,industrial?'CARGO_WORK_POUCH':'CIVIC_WAIST_POUCH');
    if(sec||eva||flight||industrial){
      // Hombro alto: hueco funcional bajo el collar para el brazo principal.
      const shoulder=caseMesh(.15,.09,.18,sec?w.outerHex:w.utilityHex);
      shoulder.position.set(side*(.33+w.shoulderVolume*.4),1.86,-.015);
      shoulder.rotation.z=side*.22;add(out,shoulder,'FUNCTIONAL_SHOULDER_PAD');
    }
    if(sec||eva||field||industrial){
      const greave=new THREE.Mesh(new THREE.CylinderGeometry(.089,.085,.30,14,1,true),mat(w.utilityHex,.10,.61));
      greave.position.set(side*.30,.40,-.045);greave.rotation.z=side*.11;
      add(out,greave,'INDUSTRIAL_LEG_PROTECTION');
    }
    if(industrial||flight||field||eva){
      add(out,tubing([new THREE.Vector3(side*.14,1.77,.32),new THREE.Vector3(side*.19,1.40,.34),
        new THREE.Vector3(side*.23,1.10,.29)],.017,w.utilityHex),'WORKING_HARNESS');
    }
  }
  if(formal||scientist||civil)coloredBadge(out,w,.15,1.63,.38);
  // Cada cultura tiene una gramática de formas, además de su paleta.
  switch(w.culture){
    case 'BASILICA_TECHNOCRACY':{
      const collar=caseMesh(.32,.12,.078,w.utilityHex);collar.position.set(0,1.91,.17);
      add(out,collar,'BASILICA_INSTITUTIONAL_HIGH_COLLAR');break;
    }
    case 'STAR_KINGDOM':{
      for(const side of [-1,1] as const){
        const rank=caseMesh(.085,.025,.026,w.accentHex);rank.position.set(side*.23,1.83,.31);
        add(out,rank,'STAR_KINGDOM_HIERARCHY');
      }break;
    }
    case 'DUNE_MANDATE':{
      for(const side of [-1,1] as const){
        const survival=caseMesh(.17,.12,.080,w.utilityHex);survival.position.set(side*.31,1.02,.15);
        add(out,survival,'DUNE_PROVISION_PACK');
      }break;
    }
    case 'PELAGIC_CONCORD':{
      add(out,tubing([new THREE.Vector3(-.28,1.83,.18),new THREE.Vector3(0,1.92,.30),
        new THREE.Vector3(.28,1.83,.18)],.018,w.accentHex),'PELAGIC_CURVED_COLLAR');break;
    }
    case 'FRONTIER_HEGEMONY':{
      for(const side of [-1,1] as const){
        const shoulder=caseMesh(.17,.13,.15,w.utilityHex);shoulder.position.set(side*.37,1.89,-.03);
        add(out,shoulder,'FRONTIER_HEAVY_SHOULDER');
      }break;
    }
    case 'OBSIDIAN_CLAN':{
      const clasp=caseMesh(.10,.10,.023,w.accentHex);clasp.position.set(0,1.79,.36);
      add(out,clasp,'OBSIDIAN_COMPACT_CLASP');break;
    }
  }
  if(sec||field||eva||flight)backpack(out,w,eva);
  if(eva||flight)neckAndHelmet(out,model,w,flight);
  // Utillaje de profesión, colocado en cabeza, antebrazo, costado o espalda.
  for(const [index,accessory] of w.accessories.entries()){
    const side=index%2===0?1:-1;
    switch(accessory){
      case 'INSIGNIA':coloredBadge(out,w,side*.17,1.68,.38);break;
      case 'SAMPLE_CASE':case 'MEDICAL_KIT':case 'TABLET':case 'TOOL_KIT':case 'TACTICAL_POUCH':{
        const tool=caseMesh(accessory==='TABLET'?.19:.15,accessory==='TABLET'?.24:.16,.046,
          accessory==='MEDICAL_KIT'?w.innerHex:w.utilityHex);
        tool.position.set(side*.44,accessory==='TABLET'?1.27:1.11,.20);
        tool.rotation.y=side*.35;add(out,tool,`ACCESSORY_${accessory}`);
        break;
      }
      case 'VISOR':{
        const visor=tubing([new THREE.Vector3(-.30,2.22,.28),new THREE.Vector3(0,2.23,.37),
          new THREE.Vector3(.30,2.22,.28)],.018,w.accentHex);
        add(out,visor,'ACCESSORY_ANALYTIC_VISOR');break;
      }
      case 'FIELD_PACK':case 'BREATHING_MODULE':
        if(!out.some(o=>o.name.includes('PACK')))backpack(out,w,accessory==='BREATHING_MODULE');break;
      case 'HELMET':{
        if(!out.some(o=>o.name.includes('CRANIAL_ENVELOPE')||o.name.includes('PROTECTIVE_VISOR')))
          neckAndHelmet(out,model,w,flight);break;
      }
      case 'SHOULDER_RADIO':{
        const radio=caseMesh(.085,.16,.07,w.utilityHex);
        radio.position.set(side*.38,1.76,.17);add(out,radio,'ACCESSORY_COMMS_RADIO');
        const aerial=tubing([new THREE.Vector3(side*.38,1.84,.17),new THREE.Vector3(side*.40,2.01,.19)],.008,w.accentHex);
        add(out,aerial,'ACCESSORY_COMMS_ANTENNA');break;
      }
      case 'CHEST_HARNESS':{
        add(out,tubing([new THREE.Vector3(-.23,1.79,.34),new THREE.Vector3(.14,1.12,.32)],.020,w.accentHex),
          'ACCESSORY_CROSS_HARNESS');break;
      }
    }
  }
  return out;
}
