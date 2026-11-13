/** 38.2x: ropa tribal independiente sobre el cuerpo humanoide orgánico SDF de 38.2r. */
import * as THREE from 'three';
import type {Vida38SpeciesVisualContract} from './vida38-species-visual-contract';
import {deriveVida38HumanoidAnatomy,type Vida38HumanoidAnatomy,type Vida38HumanoidQuality} from './vida38-humanoid-organic-field-38-2e';
import {createVida38CivilizedHumanoidPreview38R} from './vida38-civilized-humanoid-preview-38-2r';
import {deriveVida38PrimitiveHumanoidPlan38X,isVida38PrimitiveHumanoid38X,type Vida38PrimitiveHumanoidPlan38X} from './vida38-primitive-humanoid-plan-38-2x';
export {isVida38PrimitiveHumanoid38X} from './vida38-primitive-humanoid-plan-38-2x';
export const VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X='VIDA.38.2x/primitive-humanoid-renderer/v1' as const;
type Kind='GARMENT'|'ACCESSORY'|'SUPPORT';
const hide=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.93,metalness:0,side:THREE.DoubleSide});
const bone=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.74,metalness:.01,side:THREE.DoubleSide});
function part(group:THREE.Group,out:THREE.Object3D[],object:THREE.Object3D,name:string,kind:Kind):void{
 object.name=`VIDA38_X_${name}`;object.userData['vida38PrimitiveHumanoidRenderer38X']=VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X;
 object.userData['vida38PrimitiveHumanoidPart38X']=kind;
 if(object instanceof THREE.Mesh){object.castShadow=true;object.receiveShadow=true;}
 group.add(object);out.push(object);
}
function line(path:THREE.Vector3[],hex:string,r=.009):THREE.Mesh{
 return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),24,r,7,false),hide(hex));
}
/** Duplica solamente los triángulos de la malla SDF que forman una prenda; sin cilindros torácicos. */
function fittedSdf(body:THREE.Mesh,selected:(x:number,y:number,z:number)=>boolean,hex:string,offset=.019):THREE.Mesh|null{
 const g=body.geometry as THREE.BufferGeometry,pos=g.getAttribute('position'),norm=g.getAttribute('normal'),indices=g.getIndex();
 if(!pos||!norm||!indices)return null;
 const coords:number[]=[];
 for(let k=0;k<indices.count;k+=3){
  const ids=[indices.getX(k),indices.getX(k+1),indices.getX(k+2)];
  const x=ids.reduce((v,id)=>v+pos.getX(id),0)/3,y=ids.reduce((v,id)=>v+pos.getY(id),0)/3,z=ids.reduce((v,id)=>v+pos.getZ(id),0)/3;
  if(!selected(x,y,z))continue;
  for(const id of ids)coords.push(pos.getX(id)+norm.getX(id)*offset,pos.getY(id)+norm.getY(id)*offset,pos.getZ(id)+norm.getZ(id)*offset);
 }
 if(!coords.length)return null;
 const meshG=new THREE.BufferGeometry();meshG.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));meshG.computeVertexNormals();
 return new THREE.Mesh(meshG,hide(hex));
}
/** Paneles sueltos solo bajo cintura/hombros; caída asimétrica, no tubo entero. */
function drape(hi:number,lo:number,rx:number,rz:number,start:number,end:number,hex:string,seed:number,flare=.08):THREE.Mesh{
 const rows=12,cols=16,verts:number[]=[],tris:number[]=[];
 for(let j=0;j<=rows;j++){
  const t=j/rows;
  for(let i=0;i<=cols;i++){
   const u=i/cols,a=start+(end-start)*u,ruffle=Math.sin(u*20+seed)*.007*t;
   const hem=(j===rows?.026*Math.sin(15*u+seed)+.01*Math.sin(29*u+seed):0);
   verts.push(Math.sin(a)*(rx*(1+flare*t)+ruffle),hi+(lo-hi)*t+hem,Math.cos(a)*(rz*(1+flare*t)+ruffle));
   if(i&&j){const k=j*(cols+1)+i;tris.push(k,k-cols-2,k-1,k,k-cols-1,k-cols-2);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(tris);g.computeVertexNormals();return new THREE.Mesh(g,hide(hex));
}
function clothes(subject:THREE.Group,body:THREE.Mesh,a:Vida38HumanoidAnatomy,p:Vida38PrimitiveHumanoidPlan38X):THREE.Object3D[]{
 const out:THREE.Object3D[]=[];const waist=a.legLength+.06,shoulder=a.legLength+a.torsoLength*.86,chest=(waist+shoulder)/2;
 const rx=Math.max(.22,Math.min(.39,a.shoulderWidth*.80+.12)),rz=rx*.70;
 const front=rz+.055,seed=p.signature.length%9;
 const wearPatch=(name:string,select:(x:number,y:number,z:number)=>boolean,hex=p.primary,offset=.022)=>{const mesh=fittedSdf(body,select,hex,offset);if(mesh)part(subject,out,mesh,name,'GARMENT');};
 const rope=(name:string,points:THREE.Vector3[],hex=p.secondary,r=.012,kind:Kind='SUPPORT')=>part(subject,out,line(points,hex,r),name,kind);
 const mesh=(name:string,geometry:THREE.BufferGeometry,x:number,y:number,z:number,hex=p.secondary,kind:Kind='ACCESSORY')=>{
  const object=new THREE.Mesh(geometry,bone(hex));object.position.set(x,y,z);part(subject,out,object,name,kind);
 };
 const panel=(name:string,hi:number,lo:number,start:number,end:number,color=p.primary,flare=.08)=>part(subject,out,drape(hi,lo,rx,rz,start,end,color,seed,flare),name,'GARMENT');
 const waistTie=()=>rope('WAIST_CORD',[new THREE.Vector3(-rx,waist,.04),new THREE.Vector3(-rx*.62,waist,front),new THREE.Vector3(0,waist,front+.018),new THREE.Vector3(rx*.62,waist,front),new THREE.Vector3(rx,waist,.04)],p.secondary,.022,'GARMENT');
 const loin=(long=false)=>{waistTie();panel('LOINCLOTH_FRONT',waist+.015,waist-(long?p.hemLength+.12:p.hemLength),-.55,.55,p.secondary,.08);panel('LOINCLOTH_BACK',waist+.015,waist-p.hemLength*.85,Math.PI-.60,Math.PI+.60,p.primary,.07);};
 const shoulderMantle=(ceremonial=false)=>{
  wearPatch('SHOULDER_COVER_LEFT',(x,y,z)=>y>chest+.01&&y<shoulder+.09&&x<-.045&&Math.abs(x)<a.shoulderWidth*1.34,p.primary,.025);
  wearPatch('SHOULDER_COVER_RIGHT',(x,y,z)=>y>chest+.01&&y<shoulder+.09&&x>.045&&Math.abs(x)<a.shoulderWidth*1.34,ceremonial?p.secondary:p.primary,.025);
  panel('MANTLE_BACK_LEFT',shoulder-.01,ceremonial?waist+.06:chest-.03,2.15,2.86,p.primary,.065);
  panel('MANTLE_BACK_RIGHT',shoulder-.01,ceremonial?waist+.06:chest-.03,3.42,4.13,p.secondary,.065);
  rope('MANTLE_CLOSURE',[new THREE.Vector3(-rx*.44,shoulder-.025,.18),new THREE.Vector3(0,shoulder-.07,front),new THREE.Vector3(rx*.44,shoulder-.025,.18)],p.accent,.012);
 };
 const chestStraps=(warrior=false)=>{
  rope('CHEST_STRAP_A',[new THREE.Vector3(-rx*.58,shoulder,.11),new THREE.Vector3(-rx*.18,chest,front),new THREE.Vector3(rx*.53,waist,.13)],p.primary,.023,'GARMENT');
  if(warrior)rope('CHEST_STRAP_B',[new THREE.Vector3(rx*.58,shoulder,.11),new THREE.Vector3(rx*.18,chest,front),new THREE.Vector3(-rx*.53,waist,.13)],p.secondary,.020,'GARMENT');
 };
 const wovenSkirt=()=>{loin(true);panel('SKIRT_FLANK_LEFT',waist,waist-p.hemLength,-1.40,-.64,p.primary,.11);panel('SKIRT_FLANK_RIGHT',waist,waist-p.hemLength,.64,1.40,p.secondary,.11);};
 const necklace=(large=false)=>{
  rope('NECKLACE_CORD',[new THREE.Vector3(-.12,shoulder+.05,.10),new THREE.Vector3(-.10,shoulder-.06,front*.78),new THREE.Vector3(0,shoulder-(large?.22:.14),front+.015),new THREE.Vector3(.10,shoulder-.06,front*.78),new THREE.Vector3(.12,shoulder+.05,.10)],p.secondary,.009);
  mesh('NECKLACE_PENDANT',new THREE.ConeGeometry(large?.043:.027,large?.095:.065,7),0,shoulder-(large?.25:.17),front+.02,p.accent);
 };
 const sidePouch=(side:-1|1,label:string)=>{
  mesh(label,new THREE.SphereGeometry(1,12,10),side*(rx+.035),waist-.11,.12,p.primary);
  const object=out[out.length-1] as THREE.Mesh;object.scale.set(.10,.13,.064);
  rope(`${label}_SUPPORT`,[new THREE.Vector3(side*rx*.67,waist+.03,.16),new THREE.Vector3(side*(rx+.025),waist-.08,.16)],p.secondary,.010);
 };
 const armBands=()=>{for(const side of [-1,1] as const){
   rope(`WRIST_BINDING_${side}`,[new THREE.Vector3(side*(a.shoulderWidth+.15),waist+.38,.06),new THREE.Vector3(side*(a.shoulderWidth+.17),waist+.37,.14),new THREE.Vector3(side*(a.shoulderWidth+.19),waist+.38,.04)],p.secondary,.012);
 }};
 switch(p.wear){
  case 'FIBER_LOINCLOTH':loin();break;
  case 'HIDE_TUNIC':wearPatch('TUNIC_FRONT_SDF',(x,y,z)=>y<shoulder-.03&&y>waist-.10&&Math.abs(x)<a.shoulderWidth*1.30&&z>-.03,p.primary,.025);
   wearPatch('TUNIC_BACK_SDF',(x,y,z)=>y<shoulder-.03&&y>waist-.08&&Math.abs(x)<a.shoulderWidth*1.30&&z<.06,p.primary,.025);
   panel('TUNIC_HEM_FRONT',waist+.03,waist-.16,-.50,.50,p.secondary,.04);panel('TUNIC_HEM_BACK',waist+.03,waist-.14,Math.PI-.5,Math.PI+.5,p.primary,.04);waistTie();break;
  case 'SHOULDER_HIDE':shoulderMantle();loin();break;
  case 'HUNTER_STRAPS':loin();chestStraps();break;
  case 'WOVEN_SKIRT':wovenSkirt();break;
  case 'WARRIOR_LEATHERS':loin();chestStraps(true);wearPatch('WARRIOR_CHEST_SDF',(x,y,z)=>y<shoulder-.11&&y>chest-.06&&Math.abs(x)<a.shoulderWidth*.95&&z>0,p.primary,.033);armBands();break;
  case 'SHAMAN_REGALIA':shoulderMantle(true);wovenSkirt();necklace(true);break;
  case 'CHIEF_MANTLE':shoulderMantle(true);wovenSkirt();chestStraps();necklace(true);break;
 }
 if(p.ornament==='MODERATE'&&p.wear!=='WARRIOR_LEATHERS')necklace();
 const accessories=new Set(p.accessories);
 if(accessories.has('BEAD_NECKLACE')&&!out.some(obj=>obj.name==='VIDA38_X_NECKLACE_CORD'))necklace();
 if(accessories.has('BONE_TALISMAN')&&!out.some(obj=>obj.name==='VIDA38_X_NECKLACE_CORD'))necklace(true);
 if(accessories.has('CHIEF_MEDALLION')){rope('MEDALLION_STRAP',[new THREE.Vector3(-.09,shoulder,.10),new THREE.Vector3(0,chest+.04,front+.02),new THREE.Vector3(.09,shoulder,.10)],p.accent,.014);mesh('MEDALLION',new THREE.CylinderGeometry(.07,.07,.025,12),0,chest+.04,front+.02,p.accent);}
 if(accessories.has('HIDE_POUCH'))sidePouch(-1,'HIDE_POUCH');
 if(accessories.has('WATER_GOURD'))sidePouch(1,'WATER_GOURD');
 if(accessories.has('FIBER_BASKET'))sidePouch(1,'FIBER_BASKET');
 if(accessories.has('STONE_TOOL')||accessories.has('KNIFE_SHEATH')){const name=accessories.has('STONE_TOOL')?'STONE_TOOL':'KNIFE_SHEATH';mesh(name,new THREE.CylinderGeometry(.018,.035,.24,7),rx+.015,waist-.12,.18,p.accent);rope(`${name}_LOOP`,[new THREE.Vector3(rx*.65,waist+.01,.17),new THREE.Vector3(rx+.015,waist-.08,.18)],p.secondary,.01);}
 if(accessories.has('RITUAL_STAFF')){mesh('RITUAL_STAFF',new THREE.CylinderGeometry(.017,.025,.57,8),rx+.16,chest,.07,p.accent);rope('RITUAL_STAFF_TIE',[new THREE.Vector3(rx*.55,shoulder-.03,.17),new THREE.Vector3(rx+.15,chest+.10,.07)],p.secondary,.012);}
 if(accessories.has('ARM_BINDINGS')&&p.wear!=='WARRIOR_LEATHERS')armBands();
 return out;
}
export function createVida38PrimitiveHumanoidPreview38X(subject:THREE.Group,contract:Vida38SpeciesVisualContract,quality:Vida38HumanoidQuality='HIGH'):THREE.Object3D[]{
 if(!isVida38PrimitiveHumanoid38X(contract))throw new Error('38.2x: solo HUMANOID/PRIMITIVE');
 // Se utiliza el renderer 38.2r exclusivamente como proveedor de anatomía; se eliminan las prendas muy avanzadas.
 const copy:Vida38SpeciesVisualContract={...contract,intelligence:{...(contract.intelligence??{}),civilizationTier:'VERY_ADVANCED',civilizationLevel:'VERY_ADVANCED'} as NonNullable<Vida38SpeciesVisualContract['intelligence']>};
 const created=createVida38CivilizedHumanoidPreview38R(subject,copy,quality);
 const anatomyParts=new Set(['CONTINUOUS_BODY','FACE_DETAIL','MOUTH']);
 for(let i=created.length-1;i>=0;i--){const obj=created[i]!;
  if(anatomyParts.has(String(obj.userData['civHumPart38R']??'')))continue;
  subject.remove(obj);created.splice(i,1);
  obj.traverse(item=>{if(item instanceof THREE.Mesh){item.geometry.dispose();for(const m of Array.isArray(item.material)?item.material:[item.material])m.dispose();}});
 }
 const body=created.find((obj):obj is THREE.Mesh=>obj instanceof THREE.Mesh&&obj.userData['civHumPart38R']==='CONTINUOUS_BODY');
 if(!body)throw new Error('38.2x: falta cuerpo SDF 38.2r');
 const anatomy=deriveVida38HumanoidAnatomy(contract),plan=deriveVida38PrimitiveHumanoidPlan38X(contract);
 for(const item of clothes(subject,body,anatomy,plan))created.push(item);
 for(const key of ['vida38CivilizedHumanoidPlan38R','civilizedHumanoidRevision38R','civilizedHumanoidRenderer38R','vida38CivilHumanoidPlan38R','vida38CivilHumanoidSignature38R','vida38CivilHumanoidRevision38R','civilizedRenderer38R'])delete subject.userData[key];
 subject.userData['vida38PrimitiveHumanoidRenderer38X']=VIDA38_PRIMITIVE_HUMANOID_RENDERER_REVISION_38X;
 subject.userData['vida38PrimitiveHumanoidPlan38X']=plan;subject.userData['vida38PrimitiveHumanoidSdfReused38X']=true;
 subject.userData['vida38PrimitiveHumanoidTier38X']='PRIMITIVE';
 return created;
}
export function inspectVida38PrimitiveHumanoid38X(subject:THREE.Group):{garments:number;accessories:number;supports:number}{let garments=0,accessories=0,supports=0;
 subject.traverse(o=>{const part=o.userData['vida38PrimitiveHumanoidPart38X'];if(part==='GARMENT')garments++;if(part==='ACCESSORY')accessories++;if(part==='SUPPORT')supports++;});return{garments,accessories,supports};}
