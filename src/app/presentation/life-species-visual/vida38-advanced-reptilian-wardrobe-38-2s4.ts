/**
 * GENESIS 38.2s4 — indumentaria y utilería para REPTILIAN/ADVANCED.
 * No modifica el contrato, la anatomía ni la rama VERY_ADVANCED.
 * Las prendas son superficies cerradas tridimensionales y adaptables,
 * no máscaras de color sobre la piel ni cajas aisladas.
 */
import * as THREE from 'three';
import type { Vida38HumanoidAnatomy } from './vida38-humanoid-organic-field-38-2e';
import { vida38Hash38S, type Vida38AdvancedReptilianPlan38S } from './vida38-advanced-reptilian-plan-38-2s';

export const VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4 = 'VIDA.38.2s4/advanced-reptilian-wardrobe/v1' as const;
export const VIDA38_ADVANCED_REPTILIAN_WEAR_FAMILIES_38S4 = [
  'CIVIL_UNIFORM','TECH_WORKSUIT','SCIENTIFIC_ATTIRE','COLONIAL_EXPLORER',
  'SECURITY_MILITARY','ENVIRONMENTAL_SUIT','DIPLOMATIC_FORMAL','AEROSPACE_TECHNICIAN',
] as const;
export type Vida38AdvancedReptilianWearFamily38S4 = typeof VIDA38_ADVANCED_REPTILIAN_WEAR_FAMILIES_38S4[number];
export type Vida38AdvancedReptilianClothingMaterial38S4 =
  'FABRIC_CLEAN'|'FABRIC_WORK'|'SYNTHETIC_TECH'|'COMPOSITE_ARMOR_LIGHT'|'PRESSURE_SUIT'|'FORMAL_FINISH'|'UTILITY_MIX';
export type Vida38AdvancedReptilianClothingAccessory38S4 =
  'BACKPACK_LIGHT'|'ANALYTIC_VISOR'|'TECH_GOGGLES'|'DATA_TABLET'|'TOOL_KIT'|'FIELD_POUCH'|
  'COMMS_HEADSET'|'RESPIRATOR'|'PARTIAL_HELMET'|'BREATHING_MODULE'|'INSIGNIA'|'WRIST_COMPUTER'|
  'CHEST_HARNESS'|'MEDICAL_KIT'|'NONE';

export interface Vida38AdvancedReptilianWardrobePlan38S4 {
  readonly revision: typeof VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4;
  readonly family: Vida38AdvancedReptilianWearFamily38S4;
  readonly material: Vida38AdvancedReptilianClothingMaterial38S4;
  readonly outerHex: string;
  readonly innerHex: string;
  readonly trimHex: string;
  readonly equipmentHex: string;
  readonly length: number;
  readonly flare: number;
  readonly shoulderVolume: number;
  readonly layerCount: 1|2|3;
  readonly accessories: readonly Vida38AdvancedReptilianClothingAccessory38S4[];
  readonly signature: string;
}

type Palette={outer:string,inner:string,trim:string,equipment:string};
const PALETTES: Record<Vida38AdvancedReptilianPlan38S['culture'],Palette>={
  METRO_POLITIES:{outer:'#4b6476',inner:'#b1b4b0',trim:'#d4b88d',equipment:'#293b48'},
  DUNE_LEAGUE:{outer:'#a08b67',inner:'#c3b69a',trim:'#656d69',equipment:'#4e574e'},
  MARSH_COLLECTIVE:{outer:'#557d70',inner:'#a8bcb0',trim:'#c9d8b9',equipment:'#2e4c46'},
  ORBITAL_SYNDICATE:{outer:'#56697c',inner:'#d3d4d0',trim:'#dda05b',equipment:'#303d4d'},
  RIVER_COMMONWEALTH:{outer:'#487b8a',inner:'#a4c6cd',trim:'#9fc9cf',equipment:'#304d59'},
  BASILICA_ACADEMY:{outer:'#60566a',inner:'#c3b8b0',trim:'#bda886',equipment:'#393747'},
};
const MATERIALS: Record<Vida38AdvancedReptilianClothingMaterial38S4,readonly [number,number]>={
  FABRIC_CLEAN:[.88,.00],FABRIC_WORK:[.94,.00],SYNTHETIC_TECH:[.61,.04],
  COMPOSITE_ARMOR_LIGHT:[.48,.23],PRESSURE_SUIT:[.53,.08],FORMAL_FINISH:[.77,.04],UTILITY_MIX:[.73,.04],
};
const hash=(p:Vida38AdvancedReptilianPlan38S,key:string)=>vida38Hash38S(`${p.speciesId}|${p.culture}|${p.role}|38S4|${key}`);
const unit=(p:Vida38AdvancedReptilianPlan38S,key:string)=>hash(p,key)/4294967295;
const mix=(a:string,b:string,t:number)=>`#${new THREE.Color(a).lerp(new THREE.Color(b),t).getHexString()}`;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));

function chooseFamily(p:Vida38AdvancedReptilianPlan38S):Vida38AdvancedReptilianWearFamily38S4{
  if(p.outfit==='PRESSURE_SUIT'||p.role==='PILOT')return 'ENVIRONMENTAL_SUIT';
  if(p.outfit==='LAB_APPAREL'||p.role==='SCIENTIST'||p.role==='MEDIC')return 'SCIENTIFIC_ATTIRE';
  if(p.outfit==='UTILITY_OVERALLS'||p.role==='ENGINEER')return 'TECH_WORKSUIT';
  if(p.outfit==='SERVICE_UNIFORM'||p.outfit==='TACTICAL_WORKWEAR'||p.role==='SECURITY')return 'SECURITY_MILITARY';
  if(p.outfit==='EXPLORER_GEAR'||p.role==='EXPLORER'||p.role==='COLONIST')return 'COLONIAL_EXPLORER';
  if(p.outfit==='EXECUTIVE_ATTIRE'||p.outfit==='CEREMONIAL_ATTIRE'||p.role==='DIPLOMAT')return 'DIPLOMATIC_FORMAL';
  if(p.outfit==='FIELD_JACKET'&&(p.archetype==='ASTRONAUT_PILOT'||p.culture==='ORBITAL_SYNDICATE'))return 'AEROSPACE_TECHNICIAN';
  if(p.outfit==='FIELD_JACKET')return hash(p,'JACKET')%3===0?'AEROSPACE_TECHNICIAN':'COLONIAL_EXPLORER';
  return 'CIVIL_UNIFORM';
}
const materialFor=(f:Vida38AdvancedReptilianWearFamily38S4):Vida38AdvancedReptilianClothingMaterial38S4=>{
  switch(f){
    case 'CIVIL_UNIFORM':return 'FABRIC_CLEAN';
    case 'TECH_WORKSUIT':return 'FABRIC_WORK';
    case 'SCIENTIFIC_ATTIRE':return 'SYNTHETIC_TECH';
    case 'COLONIAL_EXPLORER':return 'UTILITY_MIX';
    case 'SECURITY_MILITARY':return 'COMPOSITE_ARMOR_LIGHT';
    case 'ENVIRONMENTAL_SUIT':return 'PRESSURE_SUIT';
    case 'DIPLOMATIC_FORMAL':return 'FORMAL_FINISH';
    case 'AEROSPACE_TECHNICIAN':return 'SYNTHETIC_TECH';
  }
};
function deriveAccessories(p:Vida38AdvancedReptilianPlan38S,f:Vida38AdvancedReptilianWearFamily38S4):readonly Vida38AdvancedReptilianClothingAccessory38S4[]{
  const all:Vida38AdvancedReptilianClothingAccessory38S4[]=[];
  const role=PREFERRED_ACCESSORIES[f];
  all.push(role[0]!);
  const other=role[1+(hash(p,'ACCESSORY')%(role.length-1))]!;
  if(!all.includes(other))all.push(other);
  const original:Record<Vida38AdvancedReptilianPlan38S['accessory'],Vida38AdvancedReptilianClothingAccessory38S4>={
    NONE:'NONE',DATA_TABLET:'DATA_TABLET',TOOL_BELT:'TOOL_KIT',FIELD_PACK:'BACKPACK_LIGHT',
    UTILITY_BADGE:'INSIGNIA',COMMS_HEADSET:'COMMS_HEADSET',HELMET:'PARTIAL_HELMET',
    ID_SASH:'INSIGNIA',WRIST_TERMINAL:'WRIST_COMPUTER',SAMPLE_CASE:'FIELD_POUCH',
    MED_KIT:'MEDICAL_KIT',DOCUMENT_FOLDER:'DATA_TABLET',
  };
  const third=original[p.accessory];
  if(third!=='NONE'&&!all.includes(third)&&hash(p,'ACCESSORY3')%3!==0)all.push(third);
  return Object.freeze(all.slice(0,3));
}
const PREFERRED_ACCESSORIES:Record<Vida38AdvancedReptilianWearFamily38S4,readonly Vida38AdvancedReptilianClothingAccessory38S4[]>={
  CIVIL_UNIFORM:['INSIGNIA','DATA_TABLET','WRIST_COMPUTER','COMMS_HEADSET'],
  TECH_WORKSUIT:['TOOL_KIT','FIELD_POUCH','WRIST_COMPUTER','CHEST_HARNESS'],
  SCIENTIFIC_ATTIRE:['DATA_TABLET','ANALYTIC_VISOR','MEDICAL_KIT','WRIST_COMPUTER'],
  COLONIAL_EXPLORER:['BACKPACK_LIGHT','CHEST_HARNESS','FIELD_POUCH','RESPIRATOR'],
  SECURITY_MILITARY:['CHEST_HARNESS','COMMS_HEADSET','WRIST_COMPUTER','PARTIAL_HELMET'],
  ENVIRONMENTAL_SUIT:['BREATHING_MODULE','PARTIAL_HELMET','COMMS_HEADSET','RESPIRATOR'],
  DIPLOMATIC_FORMAL:['INSIGNIA','WRIST_COMPUTER','DATA_TABLET','COMMS_HEADSET'],
  AEROSPACE_TECHNICIAN:['COMMS_HEADSET','CHEST_HARNESS','WRIST_COMPUTER','TECH_GOGGLES'],
};
export function deriveVida38AdvancedReptilianWardrobe38S4(p:Vida38AdvancedReptilianPlan38S):Vida38AdvancedReptilianWardrobePlan38S4{
  const family=chooseFamily(p),palette=PALETTES[p.culture];
  const material=materialFor(family);
  const chroma=unit(p,'COLOR');
  const outerHex=mix(palette.outer,palette.inner,clamp(chroma*.20,0,.18));
  const innerHex=mix(palette.inner,palette.outer,unit(p,'INNER')*.25);
  const trimHex=mix(palette.trim,palette.inner,unit(p,'TRIM')*.15);
  const equipmentHex=palette.equipment;
  const length=(family==='SCIENTIFIC_ATTIRE'||family==='DIPLOMATIC_FORMAL'?.42:
    family==='COLONIAL_EXPLORER'?.24:family==='ENVIRONMENTAL_SUIT'?.06:.12)+unit(p,'LENGTH')*.18;
  const flare=(family==='DIPLOMATIC_FORMAL'?.16:family==='SCIENTIFIC_ATTIRE'?.12:
    family==='COLONIAL_EXPLORER'?.11:family==='ENVIRONMENTAL_SUIT'?.02:.06)+unit(p,'FLARE')*.09;
  const shoulderVolume=(family==='SECURITY_MILITARY'?.22:family==='ENVIRONMENTAL_SUIT'?.16:
    family==='DIPLOMATIC_FORMAL'?.13:.08)+unit(p,'SHOULDERS')*.08;
  const layerCount:1|2|3=family==='ENVIRONMENTAL_SUIT'?2:family==='DIPLOMATIC_FORMAL'?3:family==='SCIENTIFIC_ATTIRE'?3:2;
  const accessories=deriveAccessories(p,family);
  const signature=[family,material,outerHex,innerHex,trimHex,length.toFixed(4),flare.toFixed(4),
    shoulderVolume.toFixed(4),layerCount,...accessories].join('|');
  return Object.freeze({revision:VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4,family,material,outerHex,innerHex,
    trimHex,equipmentHex,length,flare,shoulderVolume,layerCount,accessories,signature});
}

function cloth(hex:string,kind:Vida38AdvancedReptilianClothingMaterial38S4):THREE.MeshPhysicalMaterial{
  const [rough,metal]=MATERIALS[kind];
  return new THREE.MeshPhysicalMaterial({color:hex,roughness:rough,metalness:metal,clearcoat:kind==='PRESSURE_SUIT'?.16:.015,
    clearcoatRoughness:.65,side:THREE.DoubleSide});
}
function tube(points:THREE.Vector3[],radius:number,color:string,kind:Vida38AdvancedReptilianClothingMaterial38S4='UTILITY_MIX'):THREE.Mesh{
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(12,points.length*7),radius,7,false),cloth(color,kind));
}
function shell(upper:number,lower:number,topX:number,bottomX:number,topZ:number,bottomZ:number,
  color:string,kind:Vida38AdvancedReptilianClothingMaterial38S4,seed:number,
  options:{frontGap?:number;backGap?:number;flutes?:number;waistY?:number;waistScale?:number;shoulder?:number}={}):THREE.Mesh{
  const rings=18,segments=44,vs:number[]=[],indices:number[]=[];
  const frontGap=options.frontGap??0,backGap=options.backGap??0;
  const gap=frontGap>0?frontGap:backGap>0?backGap:0;
  const thetaStart=frontGap>0?gap:backGap>0?Math.PI+gap:0;
  const thetaEnd=frontGap>0?Math.PI*2-gap:backGap>0?Math.PI*3-gap:Math.PI*2;
  for(let j=0;j<=rings;j++){
    const v=j/rings,y=upper+(lower-upper)*v;
    const flareV=Math.pow(v,1.42),
      rx=topX+(bottomX-topX)*flareV,
      rz=topZ+(bottomZ-topZ)*flareV;
    const waistBlend=options.waistY!==undefined?clamp(1-Math.abs(y-options.waistY)/.48,0,1):0;
    const narrow=1-(options.waistScale??0)*waistBlend;
    for(let i=0;i<=segments;i++){
      const t=thetaStart+(thetaEnd-thetaStart)*i/segments;
      const wave=(Math.sin(t*(options.flutes??8)+seed*.00017)+.4*Math.sin(t*13+seed*.00011))*.010*v;
      const shoulders=(options.shoulder??0)*Math.pow(1-v,2)*Math.pow(Math.abs(Math.sin(t)),3);
      const localX=(rx+shoulders+wave)*narrow*Math.sin(t);
      const localZ=(rz+wave*.65)*narrow*Math.cos(t);
      const hemWave=Math.sin(t*(options.flutes??8)+seed*.00013)*.014*flareV;
      vs.push(localX,y+(j===rings?hemWave:0),localZ);
      if(j&&i){const k=j*(segments+1)+i;indices.push(k,k-1,k-segments-2,k,k-segments-2,k-segments-1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex(indices);g.computeVertexNormals();
  return new THREE.Mesh(g,cloth(color,kind));
}
function fitted(body:THREE.Mesh,predicate:(x:number,y:number,z:number)=>boolean,
  color:string,kind:Vida38AdvancedReptilianClothingMaterial38S4,offset=.025):THREE.Mesh|null{
  const g=body.geometry as THREE.BufferGeometry,ps=g.getAttribute('position'),ns=g.getAttribute('normal'),idx=g.getIndex();
  if(!ps||!ns||!idx)return null;
  const verts:number[]=[],normals:number[]=[];
  for(let i=0;i<idx.count;i+=3){
    const tri=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
    const x=tri.reduce((s,k)=>s+ps.getX(k),0)/3,y=tri.reduce((s,k)=>s+ps.getY(k),0)/3,
      z=tri.reduce((s,k)=>s+ps.getZ(k),0)/3;
    if(!predicate(x,y,z))continue;
    for(const k of tri){
      const nx=ns.getX(k),ny=ns.getY(k),nz=ns.getZ(k),len=Math.hypot(nx,ny,nz)||1;
      verts.push(ps.getX(k)+nx/len*offset,ps.getY(k)+ny/len*offset,ps.getZ(k)+nz/len*offset);
      normals.push(nx/len,ny/len,nz/len);
    }
  }
  if(verts.length<18)return null;
  const output=new THREE.BufferGeometry();output.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
  output.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  return new THREE.Mesh(output,cloth(color,kind));
}
function roundedCase(w:number,h:number,depth:number,color:string,kind:Vida38AdvancedReptilianClothingMaterial38S4):THREE.Mesh{
  const s=new THREE.Shape(),r=Math.min(w,h)*.17;
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
  s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.004,bevelSize:.005,bevelSegments:2,steps:1,curveSegments:5});
  g.computeVertexNormals();return new THREE.Mesh(g,cloth(color,kind));
}
function meshItem(out:THREE.Object3D[],object:THREE.Object3D,label:string):void{
  object.name=`VIDA38_S4_${label}`;object.userData['vida38AdvancedReptilianWardrobe38S4']=VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4;
  object.userData['vida38AdvancedReptilianPart38S2']=label;
  if(object instanceof THREE.Mesh)object.castShadow=true;
  out.push(object);
}

export function buildVida38AdvancedReptilianGarments38S4(body:THREE.Mesh,a:Vida38HumanoidAnatomy,
  p:Vida38AdvancedReptilianPlan38S):THREE.Object3D[]{
  const w=deriveVida38AdvancedReptilianWardrobe38S4(p),out:THREE.Object3D[]=[];
  const seed=hash(p,'SHAPE'),shoulderY=a.legLength+a.torsoLength*.91,
    waistY=a.legLength+.09,hipY=a.legLength-.05,front=.255;
  const add=(mesh:THREE.Object3D,part:string)=>meshItem(out,mesh,part);
  const mainIsSuit=w.family==='ENVIRONMENTAL_SUIT'||w.family==='TECH_WORKSUIT'||w.family==='AEROSPACE_TECHNICIAN';
  const formal=w.family==='DIPLOMATIC_FORMAL';
  const long=w.family==='SCIENTIFIC_ATTIRE'||formal;
  const outerHeight=mainIsSuit?waistY-.02:long?hipY-w.length*.44:hipY-w.length*.27;
  const inner=fitted(body,(x,y,z)=>y>waistY-.14&&y<shoulderY+.03&&Math.abs(x)<a.shoulderWidth*1.40&&z>-.48,
    w.innerHex,w.material,.019);
  if(inner)add(inner,'INNER_UNIFORM_360');
  const pants=fitted(body,(x,y,z)=>y>.15&&y<waistY+.02&&Math.abs(x)<.54&&z>-.32,
    w.family==='ENVIRONMENTAL_SUIT'?w.outerHex:w.equipmentHex,w.material,.023);
  if(pants)add(pants,'TROUSERS_360');
  const armSleeves=fitted(body,(x,y,z)=>y>waistY-.26&&y<shoulderY+.04&&Math.abs(x)>a.shoulderWidth*.78&&Math.abs(x)<a.shoulderWidth+.72&&z>-.38,
    w.outerHex,w.material,.026);
  if(armSleeves)add(armSleeves,'SLEEVES_360');
  const collarY=shoulderY-.045;
  // Base externa de chaqueta / uniforme / peto: cilindro suave anatómico con forma de hombros y cintura.
  add(shell(collarY,outerHeight,.34+w.shoulderVolume*.30,
    mainIsSuit?.32:long?.40+w.flare:.34+w.flare*.70,
    .26,mainIsSuit?.24:long?.34:.28,w.outerHex,w.material,seed,
    {frontGap:w.family==='SCIENTIFIC_ATTIRE'?.24:w.family==='COLONIAL_EXPLORER'?.29:formal?.08:.0,
      flutes:formal?11:7,waistY,waistScale:mainIsSuit?.13:.06,shoulder:w.shoulderVolume}),
    long?'COAT_360':mainIsSuit?'WORKSUIT_360':'JACKET_360');
  if(long||w.family==='COLONIAL_EXPLORER'){
    // Falda/chaqueta 360 de sección distinta, con salida posterior para la cola.
    add(shell(waistY+.07,hipY-w.length,.30,.37+w.flare,.25,.30+w.flare*.38,
      formal?w.innerHex:w.outerHex,w.material,seed+23,{backGap:.20,flutes:formal?12:8}),
    'TAIL_AWARE_COAT_SKIRT');
  }
  if(w.family==='SECURITY_MILITARY'||w.family==='ENVIRONMENTAL_SUIT'||w.family==='AEROSPACE_TECHNICIAN'){
    const plate=roundedCase(.31,.25,.018,w.equipmentHex,'COMPOSITE_ARMOR_LIGHT');
    plate.position.set(0,shoulderY-.24,front+.025);add(plate,'TACTICAL_CHEST_PANEL');
  }
  // Solapas pronunciadas como volumen y no una banda pintada.
  if(w.family==='SCIENTIFIC_ATTIRE'||w.family==='DIPLOMATIC_FORMAL'||w.family==='CIVIL_UNIFORM'){
    for(const side of [-1,1] as const){
      const lapel=tube([new THREE.Vector3(side*.07,shoulderY-.07,front+.052),
        new THREE.Vector3(side*.17,shoulderY-.26,front+.067),
        new THREE.Vector3(side*.125,waistY+.05,front+.065)],.013,w.trimHex,'FORMAL_FINISH');
      add(lapel,'TAILORED_LAPEL');
    }
  }
  // Cintura con cierre, tirantes y/o bolsillos de superficie orgánica redondeada.
  const belt=new THREE.Mesh(new THREE.TorusGeometry(.33,.021,8,50),cloth(w.equipmentHex,'UTILITY_MIX'));
  belt.rotation.x=Math.PI/2;belt.scale.y=.82;belt.position.y=waistY+.025;add(belt,'FUNCTIONAL_BELT');
  const buckle=roundedCase(.09,.055,.012,w.trimHex,'COMPOSITE_ARMOR_LIGHT');
  buckle.position.set(0,waistY+.025,.285);add(buckle,'BELT_BUCKLE');
  if(w.family==='TECH_WORKSUIT'||w.family==='COLONIAL_EXPLORER'||w.family==='SECURITY_MILITARY'){
    for(const side of [-1,1] as const){
      const pouch=roundedCase(.10,.15,.035,w.equipmentHex,'FABRIC_WORK');
      pouch.position.set(side*.30,waistY-.09,.16);pouch.rotation.y=side*.45;add(pouch,'UTILITY_POUCH');
    }
  }
  // Arnés dorsal y pectoral real, salvo civil/diplomático.
  if(w.family==='COLONIAL_EXPLORER'||w.family==='TECH_WORKSUIT'||w.family==='SECURITY_MILITARY'||
    w.family==='AEROSPACE_TECHNICIAN'||w.family==='ENVIRONMENTAL_SUIT'){
    for(const side of [-1,1] as const){
      add(tube([new THREE.Vector3(side*.19,shoulderY-.04,.23),
        new THREE.Vector3(side*.13,shoulderY-.32,.31),new THREE.Vector3(side*.22,waistY+.04,.24)],
        .012,w.equipmentHex),'FRONT_HARNESS');
      add(tube([new THREE.Vector3(side*.19,shoulderY-.04,-.20),
        new THREE.Vector3(side*.16,shoulderY-.32,-.29),new THREE.Vector3(side*.20,waistY+.03,-.24)],
        .012,w.equipmentHex),'DORSAL_HARNESS');
    }
  }
  // Botas técnicas y guantes son parte de la silueta, pero conservan las garras reptilianas.
  if(w.family!=='DIPLOMATIC_FORMAL'||hash(p,'DIPLOMATIC_BOOT')%3===0){
    const boots=fitted(body,(x,y,z)=>y>.025&&y<.34&&Math.abs(x)<.56&&z>-.27,
      w.equipmentHex,'UTILITY_MIX',.033);
    if(boots)add(boots,'TECH_BOOTS_360');
  }
  if(mainIsSuit||w.family==='SECURITY_MILITARY'){
    const cuffs=fitted(body,(x,y,z)=>y>waistY-.24&&y<waistY+.04&&Math.abs(x)>a.shoulderWidth+.04&&z>-.35,
      w.equipmentHex,'COMPOSITE_ARMOR_LIGHT',.034);
    if(cuffs)add(cuffs,'GLOVES_AND_GAUNTLETS');
  }
  if(w.family==='ENVIRONMENTAL_SUIT'){
    // Junta flexible de casco; casco semitransparente que deja leer ojos/hocico.
    const collar=new THREE.Mesh(new THREE.TorusGeometry(a.headWidth*.85,.027,9,42),cloth(w.equipmentHex,'PRESSURE_SUIT'));
    collar.rotation.x=Math.PI/2;collar.position.y=shoulderY+.045;add(collar,'PRESSURE_NECK_SEAL');
    const hood=new THREE.Mesh(new THREE.SphereGeometry(a.headWidth*.97,32,20,0,Math.PI*2,0,Math.PI*.68),
      new THREE.MeshPhysicalMaterial({color:'#b2d1d7',roughness:.10,metalness:0,transparent:true,opacity:.18,
        depthWrite:false,side:THREE.DoubleSide,clearcoat:.8}));
    const eyeY=a.legLength+a.torsoLength*1.18;
    hood.position.set(0,eyeY-.04,.035);hood.scale.set(1.18,1.19,1.12);add(hood,'PRESSURE_HELMET');
    for(const side of [-1,1] as const){
      add(tube([new THREE.Vector3(side*.19,shoulderY-.22,-.26),
        new THREE.Vector3(side*.22,shoulderY-.12,-.33),new THREE.Vector3(side*.21,shoulderY+.02,-.21)],
        .016,w.equipmentHex),'ENVIRONMENT_HOSE');
    }
  }
  // Insignia y ribetes discretos en prendas no presurizadas.
  if(w.family==='DIPLOMATIC_FORMAL'||w.family==='CIVIL_UNIFORM'||w.family==='SCIENTIFIC_ATTIRE'){
    const pin=roundedCase(.045,.065,.010,w.trimHex,'COMPOSITE_ARMOR_LIGHT');
    pin.position.set(-.19,shoulderY-.23,front+.06);add(pin,'CULTURAL_BADGE');
  }
  return out;
}

export function buildVida38AdvancedReptilianAccessories38S4(a:Vida38HumanoidAnatomy,
  p:Vida38AdvancedReptilianPlan38S):THREE.Object3D[]{
  const w=deriveVida38AdvancedReptilianWardrobe38S4(p),out:THREE.Object3D[]=[];
  const shoulderY=a.legLength+a.torsoLength*.91,waistY=a.legLength+.09,
    headY=a.legLength+a.torsoLength*1.18;
  const add=(o:THREE.Object3D,label:string)=>meshItem(out,o,`ACCESSORY_${label}`);
  for(const [index,item] of w.accessories.entries()){
    const side:indexSide=index%2===0?-1:1;
    switch(item){
      case 'BACKPACK_LIGHT':case 'BREATHING_MODULE':{
        const pack=roundedCase(item==='BREATHING_MODULE'?.28:.25,item==='BREATHING_MODULE'?.33:.31,.095,
          w.equipmentHex,'COMPOSITE_ARMOR_LIGHT');
        pack.position.set(0,shoulderY-.31,-.32);pack.rotation.y=Math.PI;add(pack,item);
        break;
      }
      case 'DATA_TABLET':case 'MEDICAL_KIT':case 'TOOL_KIT':case 'FIELD_POUCH':{
        const large=item==='DATA_TABLET';
        const device=roundedCase(large?.17:.16,large?.23:.15,large?.017:.05,w.equipmentHex,'UTILITY_MIX');
        device.position.set(side*(a.shoulderWidth+.20),large?waistY+.20:waistY-.09,.17);
        device.rotation.z=side*.18;add(device,item);
        if(large){const screen=roundedCase(.13,.19,.004,'#829da3','SYNTHETIC_TECH');
          screen.position.set(device.position.x,device.position.y,device.position.z+.025);add(screen,'TABLET_SCREEN');}
        break;
      }
      case 'COMMS_HEADSET':case 'TECH_GOGGLES':case 'ANALYTIC_VISOR':case 'PARTIAL_HELMET':{
        const g=new THREE.Mesh(new THREE.TorusGeometry(item==='PARTIAL_HELMET'?a.headWidth*.71:.050,.013,7,32),
          cloth(w.equipmentHex,'COMPOSITE_ARMOR_LIGHT'));
        g.position.set(item==='PARTIAL_HELMET'?0:side*a.headWidth*.81,
          item==='PARTIAL_HELMET'?headY+a.headHeight*.66:headY+.02,.11);
        if(item==='PARTIAL_HELMET')g.rotation.x=Math.PI/2;add(g,item);
        break;
      }
      case 'CHEST_HARNESS':{
        add(tube([new THREE.Vector3(side*.22,shoulderY-.03,.24),
          new THREE.Vector3(-side*.17,waistY+.06,.27)],.016,w.trimHex),'CHEST_HARNESS');
        break;
      }
      case 'RESPIRATOR':{
        const respirator=roundedCase(.11,.075,.032,w.equipmentHex,'COMPOSITE_ARMOR_LIGHT');
        respirator.position.set(0,headY-.15,.28);add(respirator,'RESPIRATOR');
        break;
      }
      case 'WRIST_COMPUTER':{
        const band=new THREE.Mesh(new THREE.TorusGeometry(.070,.015,8,30),cloth(w.equipmentHex,'SYNTHETIC_TECH'));
        band.position.set(side*(a.shoulderWidth+.27),waistY+.13,.10);band.rotation.x=Math.PI/2;add(band,item);
        break;
      }
      case 'INSIGNIA':{
        const pin=roundedCase(.057,.074,.009,w.trimHex,'FORMAL_FINISH');
        pin.position.set(side*.19,shoulderY-.21,.33);add(pin,item);break;
      }
      case 'NONE':break;
    }
  }
  return out;
}

type indexSide=-1|1;
