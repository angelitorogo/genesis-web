/** GENESIS 38.2u1 — anatomía original SDF 38.2o + indumentaria primitiva exclusiva.
 * No se reconstruyen cabeza, ojos, hocico, manos, articulaciones ni cola.
 * No se modifica el renderer de reptilianos ADVANCED / VERY_ADVANCED.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38HumanoidAnatomy, type Vida38HumanoidAnatomy, type Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';
import { createVida38CivilizedReptilianPreview38O } from './vida38-civilized-reptilian-preview-38-2o';
import { adaptVida38PrimitiveWearToRealSdf38U7, VIDA38_PRIMITIVE_SURFACE_REVISION_38U7 } from './vida38-primitive-reptilian-surface-fit-38-2u7';
import { deriveVida38PrimitiveReptilianPlan38U, isVida38PrimitiveReptilian38U,
  VIDA38_PRIMITIVE_REPTILIAN_REVISION_38U, type Vida38PrimitiveReptilianPlan38U } from './vida38-primitive-reptilian-plan-38-2u';

export { isVida38PrimitiveReptilian38U } from './vida38-primitive-reptilian-plan-38-2u';
export const VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U =
  'VIDA.38.2u8/original-reptilian-sdf-primitive-wardrobe/v8-anchored-pendants' as const;

function organicAnatomyContract(contract: Vida38SpeciesVisualContract): Vida38SpeciesVisualContract {
  return {...contract, morphology:{...contract.morphology,group:'HUMANOIDS',bodyPlan:'BIPED',covering:'SCALES',appendagePairs:2},locomotion:'WALKING'};
}
function isLegacyClothing(obj:THREE.Object3D):boolean {
  return obj.name==='VIDA38_2OD_REPTILIAN_GARMENT' ||
    obj.userData['garmentPart38OE6']!==undefined || obj.userData['garmentFamily38OE6']!==undefined ||
    obj.name.startsWith('VIDA38_2OE7_') || obj.name.startsWith('VIDA38_2OE8_');
}
function removeLegacyClothing(subject:THREE.Group,created:THREE.Object3D[]):void {
  const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
  for(let i=created.length-1;i>=0;i--){
    const part=created[i]!;
    if(!isLegacyClothing(part))continue;
    subject.remove(part);created.splice(i,1);
    part.traverse(obj=>{if(obj instanceof THREE.Mesh){geometry.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m);}});
  }
  geometry.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
}
const cloth=(hex:string)=>new THREE.MeshPhysicalMaterial({color:hex,roughness:.94,metalness:0,side:THREE.DoubleSide});
const bone=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.76,metalness:0});
function add(out:THREE.Object3D[],mesh:THREE.Mesh,label:string,part:'GARMENT'|'ACCESSORY'):void{
  mesh.name=`VIDA38_U_${label}`;
  mesh.userData['vida38PrimitiveReptilianRenderer38U']=VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U;
  mesh.userData['vida38PrimitiveReptilianPart38U']=part;
  mesh.castShadow=true;out.push(mesh);
}
function ring(rx:number,rz:number,y:number,hex:string,thick=.018):THREE.Mesh {
  const mesh=new THREE.Mesh(new THREE.TorusGeometry(rx,thick,7,32),cloth(hex));
  mesh.rotation.x=Math.PI/2;mesh.scale.y=rz/rx;mesh.position.y=y;return mesh;
}
function rope(points:readonly THREE.Vector3[],hex:string,r=.012):THREE.Mesh {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...points]),20,r,6,false),cloth(hex));
}
function drapePanel(opts:{
  cx:number; top:number; bottom:number; radiusX:number; radiusZ:number; start:number; end:number;
  hex:string; variant:number; frontBias?:number; ragged?:number; offsetZ?:number;
}):THREE.Mesh {
  const cols=18, rows=12, vertices:number[]=[] , uv:number[]=[] , indices:number[]=[];
  const frontBias=opts.frontBias??0, ragged=opts.ragged??0.03, offsetZ=opts.offsetZ??0;
  for(let j=0;j<=rows;j++){
    const t=j/rows;
    const y=opts.top+(opts.bottom-opts.top)*t;
    for(let i=0;i<=cols;i++){
      const u=i/cols; const a=opts.start+(opts.end-opts.start)*u;
      const bottomNoise=j===rows ? ragged*Math.sin((u*5.3+opts.variant)*2.1)+ragged*.55*Math.sin((u*9.1+opts.variant)*1.3) : 0;
      const flare=1+t*0.20;
      const x=opts.cx+Math.sin(a)*opts.radiusX*flare;
      const z=Math.cos(a)*opts.radiusZ*(1+t*0.10)+offsetZ+frontBias*t;
      vertices.push(x,y+bottomNoise,z);
      uv.push(u,t);
      if(i>0&&j>0){const k=j*(cols+1)+i;indices.push(k,k-cols-2,k-1,k,k-cols-1,k-cols-2);}
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(indices); g.computeVertexNormals();
  return new THREE.Mesh(g,cloth(opts.hex));
}
function openArmCuff(rx:number,rz:number,height:number,hex:string,thick=.014,gapFraction=.26):THREE.Mesh{
  const rows=5, cols=18, vertices:number[]=[], uv:number[]=[], indices:number[]=[];
  const start=-Math.PI*0.12, end=Math.PI*2*(1-gapFraction)-Math.PI*0.12;
  const innerScaleX=Math.max((rx-thick*1.25)/Math.max(rx,0.0001),0.45);
  const innerScaleZ=Math.max((rz-thick*1.25)/Math.max(rz,0.0001),0.45);
  for(let j=0;j<=rows;j++){
    const v=j/rows; const y=(-0.5+v)*height;
    for(let i=0;i<=cols;i++){
      const u=i/cols; const a=start+(end-start)*u;
      vertices.push(Math.sin(a)*rx,y,Math.cos(a)*rz); uv.push(u,v);
      if(i>0&&j>0){const k=j*(cols+1)+i;indices.push(k,k-cols-2,k-1,k,k-cols-1,k-cols-2);}
    }
  }
  for(let j=0;j<=rows;j++){
    const v=j/rows; const y=(-0.5+v)*height;
    for(let i=0;i<=cols;i++){
      const u=i/cols; const a=end-(end-start)*u;
      vertices.push(Math.sin(a)*rx*innerScaleX,y,Math.cos(a)*rz*innerScaleZ); uv.push(u,v);
      if(i>0&&j>0){const offset=(rows+1)*(cols+1); const k=offset+j*(cols+1)+i; indices.push(k,k-cols-1,k-1,k,k-cols-2,k-cols-1);}
    }
  }
  const outerCount=(rows+1)*(cols+1);
  for(let j=0;j<rows;j++){
    const a0=j*(cols+1), a1=(j+1)*(cols+1), b0=outerCount+j*(cols+1), b1=outerCount+(j+1)*(cols+1);
    indices.push(a0,b0,a1,a1,b0,b1);
    const aEnd=j*(cols+1)+cols, aEnd1=(j+1)*(cols+1)+cols, bEnd=outerCount+j*(cols+1)+cols, bEnd1=outerCount+(j+1)*(cols+1)+cols;
    indices.push(aEnd,aEnd1,bEnd,bEnd,bEnd1,aEnd1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(indices); g.computeVertexNormals();
  return new THREE.Mesh(g,bone(hex));
}
function armProfile(a:Vida38HumanoidAnatomy,p:Vida38PrimitiveReptilianPlan38U,upper:boolean):{
  readonly rx:number; readonly rz:number; readonly x:number; readonly y:number; readonly z:number; readonly tilt:number; readonly height:number;
}{
  const shoulder=a.legLength+a.torsoLength*.86;
  const chest=(a.legLength+.065+shoulder)/2;
  const robust=p.silhouette==='ROBUST';
  const tall=p.silhouette==='TALL';
  const lithe=p.silhouette==='LITHE';
  const baseScale=robust?1.22:tall?0.98:1.06;
  const rx=(upper?0.073:0.060)*baseScale + a.shoulderWidth*(upper?0.050:0.040);
  const rz=rx*(robust?0.96:lithe?0.82:0.88);
  const x=upper
    ? (a.shoulderWidth + rx*(robust?0.46:0.36))
    : (a.shoulderWidth + rx*(robust?0.70:0.60));
  const y=upper
    ? (chest + (shoulder-chest)*(robust?0.60:0.54))
    : (chest - (chest-(a.legLength+.065))*0.10 + (robust?0.00:0.01));
  const z=(upper?0.010:0.020) + (robust?0.010:0.004);
  const tilt=upper ? (robust?0.18:0.14) : (robust?0.12:0.09);
  const height=(upper?0.11:0.10) * (robust?1.10:tall?0.94:1.00);
  return {rx,rz,x,y,z,tilt,height};
}
function pendant(x:number,y:number,z:number,hex:string,size=.03):THREE.Mesh{
  const mesh=new THREE.Mesh(new THREE.ConeGeometry(size,size*2.2,6),bone(hex));
  mesh.position.set(x,y,z); mesh.rotation.x=Math.PI; return mesh;
}
function hangingPendantSupport(
  out:THREE.Object3D[], label:string, from:THREE.Vector3, to:THREE.Vector3,
  cordHex:string, charmHex:string, size=.038, cordRadius=.006,
):void{
  const mid=from.clone().lerp(to,.52); mid.z=Math.max(from.z,to.z)+.02;
  const cord=rope([from,mid,to],cordHex,cordRadius);
  add(out,cord,`${label}_CORD`,'ACCESSORY');
  const charm=pendant(to.x,to.y,to.z,charmHex,size);
  add(out,charm,label,'ACCESSORY');
}
/** Paño de piel con ondas geométricas reales y lados distintos. No cubre la cola. */
function skinFlap(cx:number,top:number,width:number,length:number,back:boolean,hex:string,variant:number):THREE.Mesh {
  const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  const col=12,row=8;
  for(let j=0;j<=row;j++){
    const t=j/row;
    for(let i=0;i<=col;i++){
      const s=i/col-.5;
      const scallop=.025*Math.sin(i*1.94+variant*1.7);
      const end=length*(1+.10*Math.sin(s*6+variant))+(j===row?scallop:0);
      const x=cx+s*width*(1+.22*t);
      const y=top-end*t+.009*Math.sin(s*13+t*9+variant)*t;
      const z=(back?-.255:.282)+(back?-.06:.045)*t+.014*Math.sin(s*12+t*4)*t;
      vertices.push(x,y,z);uv.push(i/col,j/row);
      if(i&&j){const k=j*(col+1)+i;indices.push(k,k-col-2,k-1,k,k-col-1,k-col-2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  return new THREE.Mesh(g,cloth(hex));
}
/** Vestuario 38.2u3: familias de silueta realmente distintas, nunca un uniforme común.
 * Todas las cotas proceden del contrato anatómico ya usado por 38.2o.
 * Esta función solo añade elementos; no modifica ninguna malla corporal.
 */
function primitiveWear(a:Vida38HumanoidAnatomy,p:Vida38PrimitiveReptilianPlan38U):THREE.Object3D[]{
  const out:THREE.Object3D[]=[];
  const waist=a.legLength+.065;
  const shoulder=a.legLength+a.torsoLength*.86;
  const chest=(waist+shoulder)/2;
  const base=p.outerHex,inner=p.innerHex,trim=p.accentHex;
  const seed=p.signature.length+p.speciesId.length;
  const h=(label:string)=>{let v=2166136261;for(const c of p.speciesId+'|'+label){v=Math.imul(v^c.charCodeAt(0),16777619)>>>0;}return v;};
  const place=(mesh:THREE.Mesh,label:string,kind:'GARMENT'|'ACCESSORY')=>add(out,mesh,label,kind);
  const waistBelt=(thickness=.027)=>place(ring(.285,.255,waist,base,thickness),'HANDMADE_LEATHER_BELT','GARMENT');
  const flap=(label:string,top:number,bottom:number,from:number,to:number,colorHex:string,rx=.26,rz=.19,z=.03,ragged=.025)=>
    place(drapePanel({cx:0,top,bottom,radiusX:rx,radiusZ:rz,start:from,end:to,
      hex:colorHex,variant:h(label)%17,frontBias:.015,ragged,offsetZ:z}),label,'GARMENT');
  const strap=(label:string,points:THREE.Vector3[],hex=base,r=.019)=>place(rope(points,hex,r),label,'GARMENT');
  const collar=(label:string,rx:number,rz:number,level:number,hex=trim,thick=.025)=>place(ring(rx,rz,level,hex,thick),label,'ACCESSORY');
  const armRing=(label:string,side:number,upper:boolean,hex=trim,thick=.020)=>{
    const profile=armProfile(a,p,upper);
    const cuff=openArmCuff(profile.rx,profile.rz,profile.height,hex,thick, upper ? 0.28 : 0.32);
    cuff.rotation.y = side<0 ? Math.PI : 0;
    cuff.rotation.z = side*profile.tilt;
    cuff.position.set(side*profile.x, profile.y, profile.z);
    place(cuff,label,'ACCESSORY');
  };
  const chestOrnament=(label:string,x:number,y:number,z:number,size=.047)=>
    hangingPendantSupport(out,label,new THREE.Vector3(x*.45,Math.min(y+.13,shoulder-.02),Math.max(.16,z-.06)),new THREE.Vector3(x,y,z),inner,trim,size,.0055);
  const necklacePendant=(label:string,row:number,x:number,drop:number,size=.036)=>{
    const anchorY=shoulder-.06-row*.055;
    hangingPendantSupport(out,label,new THREE.Vector3(x*.55,anchorY,.18),new THREE.Vector3(x,anchorY-drop,.24+row*.015),inner,trim,size,.0055);
  };
  const strapPendant=(label:string,x:number,y:number,size=.040)=>{
    hangingPendantSupport(out,label,new THREE.Vector3(x*.55,Math.min(y+.12,shoulder-.01),.22),new THREE.Vector3(x,y,.28),base,trim,size,.0065);
  };
  const beltPendant=(label:string,x:number,y:number,size=.032)=>{
    hangingPendantSupport(out,label,new THREE.Vector3(x,waist,.24),new THREE.Vector3(x,y,.28),inner,trim,size,.0055);
  };
  const staffPendant=(label:string,side:number,size=.038)=>{
    const from=new THREE.Vector3(side*.28,chest+.17,.07);
    const to=new THREE.Vector3(side*.19,chest+.05,.17);
    hangingPendantSupport(out,label,from,to,inner,trim,size,.0055);
  };
  const beltDanglers=(count:number)=>{
    for(let i=0;i<count;i++){
      const x=(i-(count-1)/2)*.11;
      strap(`BELT_HANGING_CORD_${i}`,[new THREE.Vector3(x,waist,.25),new THREE.Vector3(x+.015,waist-.10,.26),new THREE.Vector3(x,waist-.20-(i%2)*.065,.28)],inner,.011);
      beltPendant(`BELT_BONE_CHARM_${i}`,x,waist-.23-(i%2)*.065,.028);
    }
  };
  const satchel=(side:number,large=false)=>{
    const bag=new THREE.Mesh(new THREE.SphereGeometry(1,18,12),cloth(base));
    bag.scale.set(large?.17:.13,large?.20:.15,.095);
    bag.position.set(side*.35,waist-.13,.16);
    place(bag,`ACCESSORY_SIDE_POUCH_${side}`,'ACCESSORY');
    strap(`POUCH_LACING_${side}`,[new THREE.Vector3(side*.30,waist+.01,.20),new THREE.Vector3(side*.35,waist-.12,.25)],inner,.012);
  };
  const chestCross=(double=false)=>{
    strap('CHEST_LEATHER_DIAGONAL',[new THREE.Vector3(-.24,shoulder,.19),new THREE.Vector3(.02,chest,.32),new THREE.Vector3(.23,waist,.20)],base,.026);
    if(double)strap('CHEST_LEATHER_SECOND',[new THREE.Vector3(.24,shoulder,.19),new THREE.Vector3(-.02,chest,.32),new THREE.Vector3(-.23,waist,.20)],inner,.023);
  };
  const shoulderCape=(long:boolean,ornate:boolean)=>{
    const low=long?waist+.04:chest-.13;
    flap('LEFT_SHOULDER_HIDE',shoulder-.035,low,-1.65,-.28,base,.38,.28,-.015,.038);
    flap('RIGHT_SHOULDER_HIDE',shoulder-.035,low,.28,1.65,inner,.38,.28,-.015,.038);
    // Abertura dorsal central, para no invadir cola ni brazos.
    flap('UPPER_BACK_HIDE',shoulder-.05,long?chest-.12:shoulder-.24,2.20,4.08,base,.32,.28,-.02,.028);
    strap('CAPE_BONE_CLOSURE',[new THREE.Vector3(-.22,shoulder,.24),new THREE.Vector3(0,shoulder-.075,.34),new THREE.Vector3(.22,shoulder,.24)],trim,.023);
    if(ornate){collar('WIDE_RITUAL_COLLAR',.32,.27,shoulder-.045,trim,.046);beltDanglers(4);}
  };
  const broadNecklace=(rows:number)=>{
    for(let i=0;i<rows;i++){
      collar(`WIDE_NECKLACE_ROW_${i}`,.18+i*.026,.13+i*.02,shoulder-.07-i*.055,i%2===0?trim:inner,.014);
      for(const side of [-1,0,1]) necklacePendant(`NECKLACE_TALON_${i}_${side}`,i,side*(.07+i*.015),.075+i*.01,.028+i*.006);
    }
  };
  const headCrown=(height:number)=>{
    const forehead=a.legLength+a.torsoLength*1.28;
    collar('PRIMITIVE_HEAD_CIRCLET',a.headWidth*.70,a.headWidth*.69,forehead,base,.019);
    for(let i=0;i<5;i++){
      const spike=new THREE.Mesh(new THREE.ConeGeometry(.025+(i===2?.012:0),height*(.68+(i%3)*.17),7),bone(i%2?trim:inner));
      spike.position.set((i-2)*.075,forehead+height*.40,.04);
      spike.rotation.z=(i-2)*.15;
      place(spike,`ACCESSORY_HEAD_ORNAMENT_${i}`,'ACCESSORY');
    }
  };
  const upperArmBands=(double:boolean)=>{
    for(const side of [-1,1]){
      armRing(`BICEPS_RING_${side}`,side,true,trim,.025);
      if(double){armRing(`FOREARM_RING_${side}`,side,false,inner,.023);
        const lower=armProfile(a,p,false);
        const cuff=openArmCuff(lower.rx*1.12,lower.rz*1.10,lower.height*1.16,base,.020,0.36);
        cuff.material = cloth(base);
        cuff.rotation.y = side<0 ? Math.PI : 0;
        cuff.rotation.z = side*(lower.tilt*1.22);
        cuff.position.set(side*(lower.x+lower.rx*.08),lower.y,lower.z+.004);
        place(cuff,`LEATHER_CUFF_${side}`,'ACCESSORY');}
    }
  };

  // Ninguna de estas ocho familias hereda indiscriminadamente faldón, manto o correajes.
  switch(p.wear){
    case 'LOINCLOTH_WRAP':
      waistBelt(.020);
      flap('MINIMAL_LOINCLOTH_FRONT',waist,waist-.29,-.52,.52,inner,.23,.19,.095);
      flap('MINIMAL_LOINCLOTH_BACK',waist,waist-.22,2.60,3.68,base,.22,.17,-.06);
      break;
    case 'HIDE_TUNIC':
      flap('TUNIC_CHEST_WRAPPING',shoulder-.03,waist-.14,-1.35,1.32,base,.325,.25,.060,.020);
      flap('TUNIC_BACK_WRAPPING',shoulder-.03,waist-.12,1.92,4.32,inner,.315,.25,-.045,.022);
      strap('TUNIC_CORD_BELT',[new THREE.Vector3(-.29,waist,.20),new THREE.Vector3(0,waist-.035,.31),new THREE.Vector3(.29,waist,.20)],trim,.016);
      break;
    case 'SHOULDER_MANTLE':
      shoulderCape(true,false);
      flap('MANTLE_UNDER_LOIN',waist,waist-.25,-.55,.55,inner,.24,.20,.08);
      break;
    case 'HUNTER_STRAPS':
      waistBelt();chestCross(false);
      flap('HUNTER_SHORT_FRONT',waist,waist-.26,-.48,.48,inner,.24,.18,.09);
      satchel(1,true);upperArmBands(false);
      break;
    case 'TRIBAL_SKIRT':
      waistBelt(.038);
      flap('SKIRT_FRONT_LAYER',waist,waist-.42,-.91,.91,inner,.30,.22,.055,.050);
      flap('SKIRT_RIGHT_LAYER',waist,waist-.35,.88,2.15,base,.30,.22,.030,.047);
      flap('SKIRT_LEFT_LAYER',waist,waist-.38,-2.10,-.84,base,.30,.22,.025,.046);
      flap('SKIRT_BACK_LAYER',waist,waist-.25,2.50,3.77,inner,.29,.20,-.035,.03);
      beltDanglers(3);
      break;
    case 'WARRIOR_LEATHERS':
      waistBelt(.045);chestCross(true);
      flap('WARRIOR_CHEST_PLATE',shoulder-.16,chest-.13,-.68,.68,base,.315,.235,.095,.018);
      flap('WARRIOR_WAIST_ARMOUR',waist,waist-.30,-.65,.65,inner,.29,.20,.10,.03);
      upperArmBands(true);beltDanglers(2);
      break;
    case 'SHAMAN_REGALIA':
      shoulderCape(false,true);broadNecklace(3);headCrown(.29);
      flap('SHAMAN_RITUAL_PANEL',waist,waist-.38,-.72,.72,inner,.28,.19,.095,.045);
      upperArmBands(true);
      break;
    case 'CHIEF_REGALIA':
      shoulderCape(true,true);broadNecklace(2);headCrown(.19);
      flap('CHIEF_FRONT_CEREMONIAL',waist,waist-.40,-.85,.85,inner,.29,.21,.09,.035);
      flap('CHIEF_SIDE_TRIM',waist,waist-.29,.90,1.90,trim,.27,.19,.02);
      upperArmBands(true);satchel(-1,true);
      break;
  }

  // Detalles profesionales de tamaño perceptible. Siempre se fijan en cintura, pecho o cabeza,
  // sin alterar los vértices SDF originales.
  for(const [i,accessory] of p.accessories.entries()){
    const side=i%2===0?1:-1;
    switch(accessory){
      case 'BONE_NECKLACE':case 'BEAD_NECKLACE':
        if(p.wear!=='SHAMAN_REGALIA'&&p.wear!=='CHIEF_REGALIA')broadNecklace(1);
        break;
      case 'HIDE_POUCH':case 'SATCHEL':satchel(side,accessory==='SATCHEL');break;
      case 'TOTEM':{
        const staff=new THREE.Mesh(new THREE.CylinderGeometry(.020,.030,.62,9),bone(base));
        staff.position.set(side*.30,chest+.08,-.02);staff.rotation.z=side*.58;staff.rotation.x=.10;
        place(staff,'ACCESSORY_VISIBLE_TOTEM_STAFF','ACCESSORY');
        staffPendant('ACCESSORY_TOTEM_CARVING',side,.040);
        break;
      }
      case 'FEATHER_BAND':if(p.wear!=='SHAMAN_REGALIA'&&p.wear!=='CHIEF_REGALIA')headCrown(.20);break;
      case 'BONE_DAGGER':{
        const dagger=new THREE.Mesh(new THREE.ConeGeometry(.035,.31,7),bone(trim));
        dagger.position.set(side*.38,waist-.09,.23);dagger.rotation.z=side*.33;
        place(dagger,'ACCESSORY_BONE_KNIFE','ACCESSORY');break;
      }
      case 'WATER_GOURD':{
        const gourd=new THREE.Mesh(new THREE.SphereGeometry(.115,14,12),cloth(inner));
        gourd.position.set(side*.36,waist-.16,.14);gourd.scale.y=1.35;
        place(gourd,'ACCESSORY_WATER_GOURD','ACCESSORY');break;
      }
      case 'WRIST_BINDINGS':case 'SHIN_BINDINGS':
        if(p.wear!=='WARRIOR_LEATHERS'&&p.wear!=='SHAMAN_REGALIA'&&p.wear!=='CHIEF_REGALIA')upperArmBands(false);
        break;
    }
  }
  // Un detalle asimétrico adicional según ejemplar, sin convertir a todos en élites ornamentadas.
  if((h('bone-charm')%3===0)&&p.wear!=='LOINCLOTH_WRAP'){
    if(['HUNTER_STRAPS','WARRIOR_LEATHERS'].includes(p.wear)) {
      strapPendant('EXTRA_TRIBAL_PENDANT',.075,shoulder-.24,.046);
    } else if(['HIDE_TUNIC','SHAMAN_REGALIA','CHIEF_REGALIA','SHOULDER_MANTLE'].includes(p.wear)) {
      necklacePendant('EXTRA_TRIBAL_PENDANT',0,.085,.13,.046);
    }
  }
  return out;
}

export function createVida38PrimitiveReptilianPreview38U(
  subject:THREE.Group,contract:Vida38SpeciesVisualContract,quality:Vida38HumanoidQuality='HIGH',
):THREE.Object3D[]{
  if(!isVida38PrimitiveReptilian38U(contract))throw new Error('38.2u1: exclusivo REPTILIAN/PRIMITIVE');
  const created=createVida38CivilizedReptilianPreview38O(subject,contract,quality);
  removeLegacyClothing(subject,created);
  const body=created.find((obj):obj is THREE.Mesh=>obj instanceof THREE.Mesh&&obj.name==='VIDA38_2OD_REPTILIAN_BODY');
  if(!body)throw new Error('38.2u1: falta cuerpo orgánico reptiliano SDF de 38.2o');
  const anatomy=deriveVida38HumanoidAnatomy(organicAnatomyContract(contract));
  const plan=deriveVida38PrimitiveReptilianPlan38U(contract);
  const apparel=primitiveWear(anatomy,plan);
  const fitted=adaptVida38PrimitiveWearToRealSdf38U7(body,apparel,anatomy,plan);
  subject.userData['vida38PrimitiveSurfaceFit38U7']={revision:VIDA38_PRIMITIVE_SURFACE_REVISION_38U7,...fitted};
  for(const part of apparel){subject.add(part);created.push(part);}
  subject.userData['vida38PrimitiveReptilianRenderer38U']=VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U;
  subject.userData['vida38PrimitiveReptilianRevision38U']=VIDA38_PRIMITIVE_REPTILIAN_REVISION_38U;
  subject.userData['vida38PrimitiveReptilianPlan38U']=plan;
  subject.userData['vida38PrimitiveReptilianSignature38U']=plan.signature;
  subject.userData['vida38PrimitiveReptilianCivilizationTier38U']='PRIMITIVE';
  subject.userData['vida38PrimitiveReptilianOriginalSdf38U']=true;
  return created;
}
export function inspectVida38PrimitiveReptilianModel38U(subject:THREE.Group):{
  readonly garmentCount:number;readonly anatomyCount:number;readonly accessoryCount:number;
}{
  let garmentCount=0,accessoryCount=0,anatomyCount=0;
  subject.traverse(obj=>{
    if(obj.userData['vida38PrimitiveReptilianPart38U']==='GARMENT') garmentCount++;
    if(obj.userData['vida38PrimitiveReptilianPart38U']==='ACCESSORY') accessoryCount++;
    if(obj.name==='VIDA38_2OD_REPTILIAN_BODY') anatomyCount++;
  });
  return {garmentCount,anatomyCount,accessoryCount};
}

/** 38.2u4 — Contrato visual por familia, no un umbral universal de prendas.
 * El nivel de desnudez es intencionado; el cuerpo SDF y la prenda distintiva sí son obligatorios.
 */
export function validateVida38PrimitiveReptilianModel38U(
  subject: THREE.Group, wear: Vida38PrimitiveReptilianPlan38U['wear'],
): { readonly valid: boolean; readonly problems: readonly string[] } {
  const problems: string[] = [];
  if (subject.userData['vida38PrimitiveReptilianRenderer38U'] !== VIDA38_PRIMITIVE_REPTILIAN_RENDERER_REVISION_38U)
    problems.push('renderer primitivo ausente');
  if (subject.userData['vida38PrimitiveReptilianOriginalSdf38U'] !== true ||
      !subject.getObjectByName('VIDA38_2OD_REPTILIAN_BODY'))
    problems.push('anatomía orgánica SDF ausente');
  const required: Record<Vida38PrimitiveReptilianPlan38U['wear'], readonly string[]> = {
    LOINCLOTH_WRAP: ['MINIMAL_LOINCLOTH_FRONT', 'MINIMAL_LOINCLOTH_BACK'],
    HIDE_TUNIC: ['TUNIC_CHEST_WRAPPING', 'TUNIC_BACK_WRAPPING'],
    SHOULDER_MANTLE: ['LEFT_SHOULDER_HIDE', 'RIGHT_SHOULDER_HIDE'],
    HUNTER_STRAPS: ['CHEST_LEATHER_DIAGONAL', 'HUNTER_SHORT_FRONT'],
    TRIBAL_SKIRT: ['SKIRT_FRONT_LAYER', 'SKIRT_RIGHT_LAYER', 'SKIRT_LEFT_LAYER'],
    WARRIOR_LEATHERS: ['WARRIOR_CHEST_PLATE', 'WARRIOR_WAIST_ARMOUR'],
    SHAMAN_REGALIA: ['SHAMAN_RITUAL_PANEL', 'PRIMITIVE_HEAD_CIRCLET'],
    CHIEF_REGALIA: ['CHIEF_FRONT_CEREMONIAL', 'PRIMITIVE_HEAD_CIRCLET'],
  };
  for (const name of required[wear]) {
    const obj = subject.getObjectByName(`VIDA38_U_${name}`);
    if (!obj) problems.push(`pieza ${name} ausente`);
  }
  return { valid: problems.length === 0, problems };
}
