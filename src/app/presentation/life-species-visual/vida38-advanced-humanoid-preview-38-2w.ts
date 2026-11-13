/** 38.2w — base orgánica SDF 38.2r reutilizada; vestuario profesional independiente. */
import * as THREE from 'three';
import type {Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {deriveVida38HumanoidAnatomy,type Vida38HumanoidAnatomy,type Vida38HumanoidQuality} from './vida38-humanoid-organic-field-38-2e';
import {createVida38CivilizedHumanoidPreview38R} from './vida38-civilized-humanoid-preview-38-2r';
import {deriveVida38AdvancedHumanoidPlan38W,isVida38AdvancedHumanoid38W,type Vida38AdvancedHumanoidPlan38W} from './vida38-advanced-humanoid-plan-38-2w';
export {isVida38AdvancedHumanoid38W} from './vida38-advanced-humanoid-plan-38-2w';
export const VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W='VIDA.38.2w/advanced-humanoid-renderer/v3-fitted-diversity' as const;
const fabric=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.83,metalness:.025,side:THREE.DoubleSide});
const tech=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.42,metalness:.17});
const localHashW=(s:string)=>{let h=2166136261>>>0;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;return h>>>0;};
function add(target:THREE.Group,out:THREE.Object3D[],obj:THREE.Object3D,label:string,kind:'GARMENT'|'EQUIPMENT'|'SUPPORT'){
 obj.name=`VIDA38_W_${label}`;obj.userData['vida38AdvancedHumanoidRenderer38W']=VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W;
 obj.userData['vida38AdvancedHumanoidPart38W']=kind;if(obj instanceof THREE.Mesh)obj.castShadow=true;target.add(obj);out.push(obj);
}
function textile(hi:number,lo:number,rx:number,rz:number,start:number,end:number,hex:string,seed:number,flare=.05):THREE.Mesh{
 const rows=10,cols=24,p:number[]=[],ix:number[]=[];
 for(let j=0;j<=rows;j++){const t=j/rows;const y=hi+(lo-hi)*t;
 for(let i=0;i<=cols;i++){const u=i/cols,a=start+(end-start)*u;const hem=(j===rows?.020*Math.sin((u*5+seed)*5):0);
 const drape=1+flare*t*t;const wrinkle=.007*Math.sin(10*u+4*t+seed)*t;
 p.push(Math.sin(a)*rx*drape+wrinkle,y+hem,Math.cos(a)*rz*drape);if(i&&j){const k=j*(cols+1)+i;ix.push(k,k-1,k-cols-2,k,k-cols-2,k-cols-1);}}
 }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return new THREE.Mesh(g,fabric(hex));
}
function tube(points:THREE.Vector3[],hex:string,r=.013):THREE.Mesh{return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,r,7,false),fabric(hex));}
/** Prenda ajustada por vértices a la malla SDF 38.2r, no por radios supuestos. */
function fittedSdfWear(body:THREE.Mesh,choose:(x:number,y:number,z:number)=>boolean,hex:string,offset=.014):THREE.Mesh|null{
 const g=body.geometry as THREE.BufferGeometry,position=g.getAttribute('position'),normal=g.getAttribute('normal'),index=g.getIndex();
 if(!index||!position||!normal)return null;
 const coords:number[]=[],normals:number[]=[],sourceUv=g.getAttribute('uv'),uv:number[]=[];
 for(let k=0;k<index.count;k+=3){
   const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)];
   const x=(position.getX(ids[0]!)+position.getX(ids[1]!)+position.getX(ids[2]!))/3;
   const y=(position.getY(ids[0]!)+position.getY(ids[1]!)+position.getY(ids[2]!))/3;
   const z=(position.getZ(ids[0]!)+position.getZ(ids[1]!)+position.getZ(ids[2]!))/3;
   if(!choose(x,y,z))continue;
   for(const id of ids){const nx=normal.getX(id!),ny=normal.getY(id!),nz=normal.getZ(id!);
     coords.push(position.getX(id!)+nx*offset,position.getY(id!)+ny*offset,position.getZ(id!)+nz*offset);
     normals.push(nx,ny,nz);uv.push(sourceUv?.getX(id!)??0,sourceUv?.getY(id!)??0);
   }
 }
 if(!coords.length)return null;
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
 geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 const mesh=new THREE.Mesh(geometry,fabric(hex));mesh.castShadow=true;return mesh;
}
/** El arnés y los accesorios se crean siempre junto con su punto de sujeción. */
function clothes(subject:THREE.Group,body:THREE.Mesh,a:Vida38HumanoidAnatomy,p:Vida38AdvancedHumanoidPlan38W):THREE.Object3D[]{
 const out:THREE.Object3D[]=[];const waist=a.legLength+.06,shoulder=a.legLength+a.torsoLength*.86,chest=(waist+shoulder)*.5;
 const rx=Math.max(.24,Math.min(.40,a.shoulderWidth*.83+.12))*p.garmentScale;
 const rz=rx*.66;const [c,d,trim]=[p.primary,p.secondary,p.accent];const seed=p.signature.length%11;
 const variant=localHashW(p.signature+'|variant');
 const profile=(['LEAN','UTILITY','ARMOURED','FORMAL'] as const)[variant%4]!;
 const longHem=(variant%2)===0;
 const asymSide=((variant>>2)%2?1:-1) as -1|1;
 const panel=(name:string,hi:number,lo:number,start:number,end:number,hex=c,flare=.055,wrx=rx,wrz=rz)=>add(subject,out,textile(hi,lo,wrx,wrz,start,end,hex,seed,flare),name,'GARMENT');
 const line=(name:string,points:THREE.Vector3[],hex=trim,r=.012)=>add(subject,out,tube(points,hex,r),name,'SUPPORT');
 const unit=(name:string,shape:THREE.BufferGeometry,x:number,y:number,z:number,hex=d,metal=false)=>{const mesh=new THREE.Mesh(shape,metal?tech(hex):fabric(hex));mesh.position.set(x,y,z);add(subject,out,mesh,name,'EQUIPMENT');};
 const overlay=(label:string,predicate:(x:number,y:number,z:number)=>boolean,hex=c,offset=.014)=>{
   const mesh=fittedSdfWear(body,predicate,hex,offset);if(mesh)add(subject,out,mesh,label,'GARMENT');
 };
 const fittedFront=(name:string,hi:number,lo:number,hex=c,offset=.016,xm=1.30)=>overlay(name,(x,y,z)=>y<hi&&y>lo&&Math.abs(x)<a.shoulderWidth*xm&&z>-.02,hex,offset);
 const fittedBack=(name:string,hi:number,lo:number,hex=c,offset=.016,xm=1.28)=>overlay(name,(x,y,z)=>y<hi&&y>lo&&Math.abs(x)<a.shoulderWidth*xm&&z<.10,hex,offset);
 const fittedRib=(name:string,side:-1|1,hi:number,lo:number,hex=c,offset=.015)=>overlay(name,(x,y,z)=>y<hi&&y>lo&&(side*x)>(a.shoulderWidth*.34)&&(side*x)<(a.shoulderWidth*1.25)&&Math.abs(z)<rz*.95,hex,offset);
 const fittedShell=(label:string,hi:number,lo:number,hex=c,long=false)=>{fittedFront(`${label}_FRONT`,hi,lo,hex,.017);fittedBack(`${label}_BACK`,hi,lo,hex,.017);fittedRib(`${label}_LEFT`,-1,hi,lo,hex,.015);fittedRib(`${label}_RIGHT`,1,hi,lo,hex,.015);if(long){panel(`${label}_TAIL_BACK`,waist+.01,waist-.22,2.76,3.52,hex,.018,rx*.52,rz*.88);panel(`${label}_TAIL_FRONT`,waist+.00,waist-.18,-.34,.34,hex,.014,rx*.36,rz*.84);}};
 const jacket=(long=false)=>{fittedShell('JACKET',shoulder,waist-(long?.14:0),c,longHem||long);line('JACKET_SEAM',[new THREE.Vector3(0,shoulder,rz+.025),new THREE.Vector3(0,chest,rz+.04),new THREE.Vector3(0,waist,rz+.02)],trim,.008);};
 const epaulettes=()=>{for(const side of [-1,1] as const){unit(`EPAULETTE_${side}`,new THREE.BoxGeometry(.16,.05,.12),side*(a.shoulderWidth+.03),shoulder+.005,.03,trim,true);}};
 const forearmGuards=()=>{for(const side of [-1,1] as const){unit(`FOREARM_GUARD_${side}`,new THREE.CylinderGeometry(.055,.06,.18,8),side*(a.shoulderWidth*.82),waist+.38,.10,d,true);}};
 const kneeGuards=()=>{for(const side of [-1,1] as const){unit(`KNEE_GUARD_${side}`,new THREE.BoxGeometry(.10,.07,.08),side*.10,.27,.10,d,true);}};
 const scarf=()=>{panel('NECK_SCARF_FRONT',shoulder-.02,chest+.05,-.78,.78,trim,.018,rx*.82,rz*.85);panel('NECK_SCARF_BACK',shoulder-.02,chest+.10,1.95,4.33,trim,.014,rx*.78,rz*.82);};
 const chestRig=()=>{fittedFront('CHEST_RIG_FRONT',shoulder-.08,chest-.16,d,.012,.95);line('CHEST_RIG_STRAP_L',[new THREE.Vector3(-rx*.52,shoulder-.02,.12),new THREE.Vector3(-rx*.26,chest,.18),new THREE.Vector3(-rx*.16,waist+.04,.12)],trim,.010);line('CHEST_RIG_STRAP_R',[new THREE.Vector3(rx*.52,shoulder-.02,.12),new THREE.Vector3(rx*.26,chest,.18),new THREE.Vector3(rx*.16,waist+.04,.12)],trim,.010);};
 const tabard=()=>{panel('TABARD_FRONT',shoulder-.03,waist-.10,-.44,.44,trim,.018,rx*.58,rz*.92);panel('TABARD_BACK',shoulder-.03,waist-.08,2.70,3.58,trim,.016,rx*.54,rz*.84);};
 const formalSash=()=>{line('FORMAL_SASH_SUPPORT',[new THREE.Vector3(-rx*.10,shoulder-.02,.18),new THREE.Vector3(0,chest,.20),new THREE.Vector3(rx*.14,waist-.03,.16)],trim,.010);panel('FORMAL_SASH_FRONT',shoulder-.04,waist-.03,-.22,.24,trim,.01,rx*.48,rz*1.02);};
 const collarBand=()=>line('COLLAR_BAND',[new THREE.Vector3(-rx*.34,shoulder-.03,.18),new THREE.Vector3(0,shoulder-.05,rz*.78),new THREE.Vector3(rx*.34,shoulder-.03,.18)],trim,.015);
 const shoulderRadio=(side:1|-1)=>{unit(`SHOULDER_RADIO_${side}`,new THREE.BoxGeometry(.08,.12,.06),side*(a.shoulderWidth+.03),shoulder-.14,.09,d,true);line(`SHOULDER_RADIO_STRAP_${side}`,[new THREE.Vector3(side*(a.shoulderWidth*.72),shoulder-.05,.14),new THREE.Vector3(side*(a.shoulderWidth+.03),shoulder-.14,.09)],trim,.009);};
 const armPatch=(side:1|-1)=>unit(`ARM_PATCH_${side}`,new THREE.BoxGeometry(.08,.06,.01),side*(a.shoulderWidth*.84),shoulder-.19,.16,trim,true);
 const canteen=(side:1|-1)=>{unit(`CANTEEN_${side}`,new THREE.SphereGeometry(.07,10,8),side*(rx+.09),waist-.06,.10,d,true);line(`CANTEEN_CLIP_${side}`,[new THREE.Vector3(side*(rx*.65),waist+.03,.16),new THREE.Vector3(side*(rx+.09),waist-.01,.11)],trim,.008);};
 const lanyard=()=>{line('LANYARD_STRAP',[new THREE.Vector3(-rx*.20,shoulder-.02,.16),new THREE.Vector3(0,chest+.02,rz+.06),new THREE.Vector3(rx*.18,waist+.10,.16)],trim,.009);unit('LANYARD_CARD',new THREE.BoxGeometry(.08,.11,.01),rx*.18,waist+.08,.17,trim,true);};
 const trousers=()=>{
   overlay('FITTED_TROUSERS_SDF',(x,y)=>y>.14&&y<waist-.02);
   overlay('FITTED_BOOTS_SDF',(x,y)=>y<=.29,d,.018);
 };
 const belt=()=>line('BELT',[new THREE.Vector3(-rx,waist,.06),new THREE.Vector3(-rx*.65,waist,rz),new THREE.Vector3(0,waist,rz+.035),new THREE.Vector3(rx*.65,waist,rz),new THREE.Vector3(rx,waist,.06)],d,.025);
 const straps=(double=false)=>{line('CHEST_HARNESS_A',[new THREE.Vector3(-rx*.75,shoulder,.12),new THREE.Vector3(0,chest,rz+.07),new THREE.Vector3(rx*.63,waist,.12)],d,.023);
 if(double)line('CHEST_HARNESS_B',[new THREE.Vector3(rx*.75,shoulder,.12),new THREE.Vector3(0,chest,rz+.08),new THREE.Vector3(-rx*.63,waist,.12)],trim,.019);};
 const padding=()=>{for(const side of [-1,1] as const){unit(`SHOULDER_PAD_${side}`,new THREE.SphereGeometry(.115,12,10),side*(a.shoulderWidth+.035),shoulder-.035,.015,d,true);}};
 const cultureDress=()=>{
   switch(p.culture){
     case 'BASILICA_TECHNOCRACY': epaulettes(); collarBand(); break;
     case 'STAR_KINGDOM': formalSash(); break;
     case 'DUNE_MANDATE': scarf(); break;
     case 'PELAGIC_CONCORD': line('PELAGIC_PIPING',[new THREE.Vector3(-rx*.48,shoulder-.10,rz*.85),new THREE.Vector3(0,chest,rz*.92),new THREE.Vector3(rx*.48,waist+.04,rz*.80)],trim,.009); break;
     case 'FRONTIER_HEGEMONY': chestRig(); forearmGuards(); break;
     case 'OBSIDIAN_CLAN': tabard(); line('OBSIDIAN_STERNUM_LINE',[new THREE.Vector3(0,shoulder-.05,rz*.85),new THREE.Vector3(0,waist-.02,rz*.72)],trim,.010); break;
   }
 };
 const accessoryBias=()=>{
   if(p.accessoryBias==='HEAVY'){ forearmGuards(); kneeGuards(); }
   else if(p.accessoryBias==='STANDARD'){ unit('HIP_CANISTER',new THREE.CylinderGeometry(.038,.038,.15,8),rx+.05,waist-.06,.12,d,true); }
 };
 trousers();
 overlay('ADVANCED_BASE_TORSO_SDF',(x,y)=>y>waist-.02&&y<shoulder-.015&&Math.abs(x)<a.shoulderWidth*1.55,c,.014);
 switch(p.wear){
 case 'CIVIL_JACKET':jacket();belt();if(profile==='FORMAL') formalSash(); if(p.overlay==='VEST') fittedShell('OVER_VEST',shoulder-.10,waist-.04,d,false); break;
 case 'INDUSTRIAL_COVERALL':fittedShell('WORK_OVERALL',shoulder,waist-.10,c,false);straps();belt();chestRig();armPatch(asymSide); if(profile!=='LEAN') unit('UTILITY_APRON',new THREE.BoxGeometry(.18,.22,.03),0,waist-.12,.17,d);break;
 case 'RESEARCH_COAT':jacket(true);fittedFront('SCIENCE_INNER_FRONT',shoulder-.10,waist-.03,d,.013,.88);belt();lanyard(); if(p.overlay==='TABARD') tabard(); break;
 case 'FRONTIER_EXPLORER':jacket();straps();belt();if(p.overlay==='SCARF') scarf(); unit('FIELD_BACKPACK',new THREE.BoxGeometry(.31,.45,.15),0,chest,-rz-.11,d);unit('MAP_CASE',new THREE.BoxGeometry(.12,.22,.06),-(rx+.06),waist-.02,.14,trim,true);canteen(1); if(profile!=='LEAN') shoulderRadio(asymSide);break;
 case 'SECURITY_UNIFORM':jacket();padding();fittedFront('SECURITY_CHEST',shoulder-.12,chest-.14,d,.015,1.06);belt();chestRig();armPatch(-1);unit('BATON_CASE',new THREE.BoxGeometry(.08,.24,.05),rx*.70,waist-.15,.08,d,true);break;
 case 'ENVIRONMENT_SUIT':fittedShell('PRESSURE_TORSO',shoulder,waist-.08,c,false);padding();straps();belt();epaulettes();unit('BREATHING_BACKPACK',new THREE.BoxGeometry(.33,.43,.18),0,chest,-rz-.13,d);line('OXYGEN_HOSE',[new THREE.Vector3(0,chest,-rz-.03),new THREE.Vector3(rx*.14,chest,.06),new THREE.Vector3(rx*.12,waist+.10,.18)],trim,.012);break;
 case 'FLIGHT_SUIT':fittedShell('FLIGHT_SUIT',shoulder,waist-.12,c,false);straps(true);belt();chestRig();unit('THIGH_CASE',new THREE.BoxGeometry(.09,.20,.06),rx*.62,waist-.20,.10,d,true);shoulderRadio(-1);break;
 case 'DIPLOMATIC_FORMAL':jacket(true);fittedFront('FORMAL_FRONT_PANEL',shoulder-.08,waist-.04,d,.010,.88);belt();formalSash(); epaulettes(); lanyard(); break;
 }
 cultureDress();
 accessoryBias();
 switch(p.role){
   case 'ENGINEER': case 'TECHNICIAN': shoulderRadio(asymSide); armPatch(asymSide === 1 ? -1 : 1); unit('TOOL_HIP_CANISTER',new THREE.CylinderGeometry(.04,.04,.16,8),-asymSide*(rx+.06),waist-.06,.11,d,true); break;
   case 'SCIENTIST': case 'MEDIC': lanyard(); unit('AUX_CASE',new THREE.BoxGeometry(.11,.16,.06),rx*.72,waist-.05,.10,d,true); break;
   case 'EXPLORER': case 'SURVEYOR': case 'COLONIST': canteen(-1); shoulderRadio(asymSide); break;
   case 'SECURITY': unit('CHEST_CAMERA',new THREE.BoxGeometry(.05,.05,.04),-rx*.22,chest+.06,rz+.05,trim,true); break;
   case 'PILOT': case 'ASTRONAUT': shoulderRadio(1); break;
   case 'DIPLOMAT': case 'ADMINISTRATOR': lanyard(); break;
 }
 switch(p.overlay){
   case 'EPAULETTE': epaulettes(); break;
   case 'SASH': formalSash(); break;
   case 'SCARF': scarf(); break;
   case 'CHEST_RIG': chestRig(); break;
   case 'TABARD': tabard(); break;
   case 'VEST': fittedShell('OVER_VEST',shoulder-.10,waist-.04,d,false); break;
 }
 for(const [i,equipment] of p.equipment.entries()){
 const side=i%2?1:-1;
 switch(equipment){
 case 'FIELD_PACK':case 'BREATHING_MODULE':break; // bolsa dorsal principal ya presente en el atuendo
 case 'BELT_POUCH':case 'TOOL_CASE':case 'MED_KIT':unit(`POUCH_${equipment}_${i}`,new THREE.BoxGeometry(.17,.17,.11),side*(rx+.065),waist-.10,rz*.30,d);line(`POUCH_TIE_${i}`,[new THREE.Vector3(side*rx*.60,waist,.15),new THREE.Vector3(side*(rx+.02),waist-.02,.18),new THREE.Vector3(side*(rx+.06),waist-.08,rz*.30)],trim,.010);break;
 case 'ANALYSER':case 'DATA_TABLET':unit(`HAND_DEVICE_${equipment}_${i}`,new THREE.BoxGeometry(.15,.21,.025),side*(a.shoulderWidth+.16),waist+.01,.16,d,true);line(`HAND_DEVICE_STRAP_${i}`,[new THREE.Vector3(side*(a.shoulderWidth+.10),waist+.08,.12),new THREE.Vector3(side*(a.shoulderWidth+.16),waist+.04,.16)],trim,.009);unit(`CHEST_DOCK_${equipment}_${i}`,new THREE.BoxGeometry(.09,.10,.04),side*.12,chest+.03,rz+.03,trim,true);break;
 case 'BADGE':unit('ROLE_BADGE',new THREE.BoxGeometry(.09,.055,.012),rx*.40,shoulder-.13,rz+.035,trim,true);break;
 case 'VISOR':unit('EYE_VISOR',new THREE.BoxGeometry(a.headWidth*.88,.065,.055),0,shoulder+.34,a.headWidth*.69,trim,true);unit('VISOR_SIDE_MODULE_L',new THREE.BoxGeometry(.04,.04,.06),-a.headWidth*.47,shoulder+.34,a.headWidth*.63,d,true);unit('VISOR_SIDE_MODULE_R',new THREE.BoxGeometry(.04,.04,.06),a.headWidth*.47,shoulder+.34,a.headWidth*.63,d,true);break;
 case 'COMMUNICATOR':unit('COMMUNICATOR',new THREE.BoxGeometry(.06,.11,.04),side*(rx+.01),shoulder-.18,rz*.40,d,true);line(`COMMUNICATOR_CLIP_${i}`,[new THREE.Vector3(side*(rx*.76),shoulder-.10,.18),new THREE.Vector3(side*(rx+.01),shoulder-.18,rz*.40)],trim,.008);break;
 case 'FLIGHT_HARNESS':straps(true);break;
 }
 }
 return out;
}
/** Construye el cuerpo orgánico de 38.2r sin alterar el contrato original. */
export function createVida38AdvancedHumanoidPreview38W(subject:THREE.Group,contract:Vida38SpeciesVisualContract,quality:Vida38HumanoidQuality='HIGH'):THREE.Object3D[]{
 if(!isVida38AdvancedHumanoid38W(contract))throw new Error('38.2w: solo HUMANOID/ADVANCED');
 const copy:Vida38SpeciesVisualContract={...contract,intelligence:{...(contract.intelligence??{}),civilizationTier:'VERY_ADVANCED',civilizationLevel:'VERY_ADVANCED'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>};
 const created=createVida38CivilizedHumanoidPreview38R(subject,copy,quality);
 // La anatomía y la caracterización facial 38.2r permanecen intactas. El vestuario 38.2r,
 // identificado como tal, se retira sin suponer nombres de huesos o del cuerpo.
 const anatomyPieces=new Set(['CONTINUOUS_BODY','FACE_DETAIL','MOUTH']);
 for(let i=created.length-1;i>=0;i--){
   const object=created[i]!;
   if(anatomyPieces.has(String(object.userData['civHumPart38R']??'')))continue;
   subject.remove(object);created.splice(i,1);
   object.traverse(x=>{if(x instanceof THREE.Mesh){x.geometry.dispose();for(const m of Array.isArray(x.material)?x.material:[x.material])m.dispose();}});
 }
 const body=created.find((o):o is THREE.Mesh=>o instanceof THREE.Mesh&&o.userData['civHumPart38R']==='CONTINUOUS_BODY');
 if(!body)throw new Error('38.2w: falta el cuerpo SDF 38.2r');
 const anatomy=deriveVida38HumanoidAnatomy(contract),plan=deriveVida38AdvancedHumanoidPlan38W(contract);
 for(const object of clothes(subject,body,anatomy,plan))created.push(object);
 for(const key of ['vida38CivilizedHumanoidPlan38R','civilizedHumanoidRevision38R','civilizedHumanoidRenderer38R','vida38CivilHumanoidPlan38R','vida38CivilHumanoidSignature38R','vida38CivilHumanoidRevision38R','civilizedRenderer38R','vida38CivilHumanoidGarment38R','vida38CivilHumanoidGarmentLength38R'])delete subject.userData[key];
 subject.userData['vida38AdvancedHumanoidRenderer38W']=VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W;
 subject.userData['vida38AdvancedHumanoidPlan38W']=plan;subject.userData['vida38AdvancedHumanoidTier38W']='ADVANCED';
 subject.userData['vida38AdvancedHumanoidSdfReused38W']=true;
 return created;
}
export function inspectVida38AdvancedHumanoid38W(s:THREE.Group){let garments=0,equipment=0; s.traverse(o=>{if(o.userData['vida38AdvancedHumanoidPart38W']==='GARMENT')garments++;if(o.userData['vida38AdvancedHumanoidPart38W']==='EQUIPMENT')equipment++;});return{garments,equipment};}
