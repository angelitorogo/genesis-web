/** Atuendos textiles y orgánicos de bajo desarrollo, sin geometría corporal nueva. */
import * as THREE from 'three';
import type { Vida38CivilizedInsectoidPlan38Q } from './vida38-civilized-insectoid-preview-38-2q';
import { torsoRadiusVida38Q2 } from './vida38-civilized-insectoid-wardrobe-38-2q2';
import type { Vida38PrimitiveInsectPlan38V } from './vida38-primitive-insectoid-plan-38-2v';
export const VIDA38_PRIMITIVE_INSECT_WARDROBE_REVISION_38V='VIDA.38.2v/insectoid-primitive-wear/v2-wrap-fit' as const;
type Quality='LOW'|'MEDIUM'|'HIGH';
const material=(hex:string)=>new THREE.MeshStandardMaterial({color:hex,roughness:.93,metalness:0,side:THREE.DoubleSide});
function part(out:THREE.Object3D[],obj:THREE.Object3D,label:string,category:'GARMENT'|'ACCESSORY'|'SUPPORT'='GARMENT'){
  obj.name=`VIDA38_V_${label}`;obj.userData['vida38PrimitiveInsectWardrobe38V']=VIDA38_PRIMITIVE_INSECT_WARDROBE_REVISION_38V;
  obj.userData['vida38PrimitiveInsectPart38V']=category;
  if(obj instanceof THREE.Mesh)obj.castShadow=true;
  out.push(obj);
}
function cord(points:readonly THREE.Vector3[],hex:string,r=.010):THREE.Mesh{
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([...points]),16,r,6,false),material(hex));
}
/** Cilindro abierto por zonas: laterales despejados para brazos secundarios; dorso alto despejado para alas. */
function hidePanel(q:Vida38CivilizedInsectoidPlan38Q,top:number,bottom:number,from:number,to:number,
  hex:string,phase:number,quality:Quality,flare=.035):THREE.Mesh{
  const columns=quality==='LOW'?12:quality==='MEDIUM'?20:28,rows=quality==='LOW'?8:14;
  const pos:number[]=[],ind:number[]=[];
  for(let j=0;j<=rows;j++){
    const t=j/rows,y=top+(bottom-top)*t;
    for(let i=0;i<=columns;i++){
      const u=i/columns,theta=from+(to-from)*u;
      const radius=Math.max(.18,torsoRadiusVida38Q2(q,Math.max(.92,Math.min(1.92,y))))+.070+flare*t*t;
      const irregular=.008*Math.sin(u*15+t*7+phase)*t;
      const x=Math.sin(theta)*(radius+irregular);
      const z=Math.cos(theta)*(radius+irregular)*.88-.025;
      const edge=j===rows ? .014*Math.sin(u*23+phase)+.009*Math.cos(u*11+phase):0;
      pos.push(x,y+edge,z);
      if(i>0&&j>0){const k=j*(columns+1)+i;ind.push(k,k-1,k-columns-2,k,k-columns-2,k-columns-1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(ind);g.computeVertexNormals();
  return new THREE.Mesh(g,material(hex));
}
function bead(out:THREE.Object3D[],label:string,x:number,y:number,z:number,size:number,hex:string){
  const obj=new THREE.Mesh(new THREE.SphereGeometry(size,8,6),material(hex));obj.position.set(x,y,z);
  part(out,obj,label,'ACCESSORY');
}
function hang(out:THREE.Object3D[],label:string,from:THREE.Vector3,to:THREE.Vector3,hex:string,trim:string){
  const mid=from.clone().lerp(to,.5);mid.z=Math.max(from.z,to.z)+.026;
  part(out,cord([from,mid,to],hex,.009),`${label}_CORD`,'SUPPORT');
  const charm=new THREE.Mesh(new THREE.OctahedronGeometry(.041,0),material(trim));charm.position.copy(to);
  part(out,charm,label,'ACCESSORY');
}
export function buildVida38PrimitiveInsectWear38V(q:Vida38CivilizedInsectoidPlan38Q,p:Vida38PrimitiveInsectPlan38V,quality:Quality):THREE.Object3D[]{
  const out:THREE.Object3D[]=[];
  const top=1.84,waist=1.13,chest=1.52;
  const base=p.materialHex,trim=p.trimHex,fiber=p.fiberHex;
  const panel=(label:string,hi:number,lo:number,from:number,to:number,hex=base,flare=.035)=>
    part(out,hidePanel(q,hi,lo,from,to,hex,p.shape,quality,flare),label);
  const tie=(label:string,points:THREE.Vector3[],hex=fiber,r=.012)=>part(out,cord(points,hex,r),label,'SUPPORT');
  const belt=()=>tie('WAIST_TIE',[new THREE.Vector3(-.29,waist,.24),new THREE.Vector3(0,waist-.025,.36),new THREE.Vector3(.29,waist,.24)],base,.024);
  const front=()=>panel('FRONT_FIBER_LOINCLOTH',waist+.03,waist-.35,-.63,.63,fiber,.06);
  const back=()=>panel('BACK_HIDE_LOINCLOTH',waist+.03,waist-.22,Math.PI-.60,Math.PI+.60,base,.07);
  const sideWraps=(label:string,hi:number,lo:number,hexLeft=base,hexRight=fiber,flare=.05)=>{
    panel(`${label}_LEFT`,hi,lo,-1.65,-.52,hexLeft,flare);
    panel(`${label}_RIGHT`,hi,lo,.52,1.65,hexRight,flare);
  };
  const halfBack=(label:string,hi:number,lo:number,hex=base,flare=.05)=>
    panel(label,hi,lo,Math.PI-.92,Math.PI+.92,hex,flare);
  const brace=(double=false)=>{
    tie('HUNTER_TORSO_CORD',[new THREE.Vector3(-.24,top,.15),new THREE.Vector3(.03,chest,.34),new THREE.Vector3(.23,waist,.23)],base,.023);
    if(double)tie('WARRIOR_CROSS_CORD',[new THREE.Vector3(.24,top,.15),new THREE.Vector3(-.03,chest,.34),new THREE.Vector3(-.23,waist,.23)],trim,.022);
  };
  const mantle=(formal=false)=>{
    panel('LEFT_SHOULDER_HIDE',1.86,formal?1.17:1.40,-1.18,-.22,base,.07);
    panel('RIGHT_SHOULDER_HIDE',1.86,formal?1.17:1.40,.22,1.18,fiber,.07);
    halfBack('BACK_SHOULDER_DRAPE',1.80,formal?1.30:1.48,base,.04);
    // Hueco central para alas y brazos articulados; cobertura dorsal parcial para que no quede solo por delante.
    tie('MANTLE_NECK_TIE',[new THREE.Vector3(-.20,1.84,.18),new THREE.Vector3(0,1.79,.30),new THREE.Vector3(.20,1.84,.18)],trim,.018);
  };
  const pouch=(side:number)=>{
    const satchel=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),material(base));
    satchel.scale.set(.115,.15,.075);satchel.position.set(side*.34,waist-.13,.12);
    part(out,satchel,`FIELD_POUCH_${side}`,'ACCESSORY');
    tie(`FIELD_POUCH_TIE_${side}`,[new THREE.Vector3(side*.22,waist+.05,.22),new THREE.Vector3(side*.30,waist-.00,.18),new THREE.Vector3(side*.34,waist-.11,.16)],trim,.012);
    tie(`FIELD_POUCH_BELT_${side}`,[new THREE.Vector3(side*.24,waist+.01,.22),new THREE.Vector3(side*.08,waist+.01,.30),new THREE.Vector3(side*-.08,waist+.01,.30),new THREE.Vector3(side*-.24,waist+.01,.22)],base,.008);
  };
  const ritual=(rows:number)=>{
    for(let j=0;j<rows;j++){
      const y=1.86-j*.065;
      tie(`NECKLACE_CORD_${j}`,[new THREE.Vector3(-.22,y,.16),new THREE.Vector3(0,y-.045,.33),new THREE.Vector3(.22,y,.16)],fiber,.010);
      for(let n=-1;n<=1;n++){
        hang(out,`NECK_BEAD_${j}_${n}`,new THREE.Vector3(n*.075,y-.040,.33),
          new THREE.Vector3(n*.077,y-.10,.34),fiber,trim);
      }
    }
  };
  switch(p.wear){
    case 'MINIMAL_FIBER_WRAP': belt();front();back();break;
    case 'WOVEN_BARK_TUNIC':
      panel('BARK_TUNIC_CHEST',1.84,1.05,-.84,.84,base,.06);
      panel('BARK_TUNIC_BACK',1.80,1.08,Math.PI-.69,Math.PI+.69,fiber,.055);
      belt();break;
    case 'HIDE_SHOULDER_CLOAK':mantle();front();back();sideWraps('CLOAK_FLANK',waist+.02,waist-.18,base,fiber,.035);break;
    case 'FORAGER_HARNESS':belt();front();back();brace();sideWraps('FORAGER_FLANK',waist+.01,waist-.17,fiber,base,.03);pouch(1);break;
    case 'CHITIN_WARRIOR_PANELS':belt();brace(true);panel('WARRIOR_CHEST_SHIELD',1.74,1.40,-.62,.62,base,.025);
      halfBack('WARRIOR_BACK_SHIELD',1.72,1.42,trim,.022);
      panel('WARRIOR_HIP_GUARD',waist+.02,waist-.24,-.75,.75,trim,.03);halfBack('WARRIOR_BACK_HIP_GUARD',waist+.02,waist-.20,base,.028);break;
    case 'CEREMONIAL_BEADS':mantle();ritual(2);front();back();sideWraps('CEREMONIAL_FLANK',waist+.02,waist-.20,base,fiber,.032);break;
    case 'TRIBAL_SKIRT':belt();panel('FRONT_TRIBAL_SKIRT',waist+.03,waist-.42,-1.12,1.12,base,.10);
      panel('BACK_TRIBAL_SKIRT',waist+.03,waist-.32,Math.PI-1.05,Math.PI+1.05,fiber,.1);break;
    case 'ELDER_MANTLE':mantle(true);ritual(1);front();back();sideWraps('ELDER_FLANK',waist+.02,waist-.22,base,base,.028);break;
  }
  // Sin accesorios tecnológicos. Ningún amuleto aparece sin un cordón geométrico.
  for(const [index,accessory] of p.accessories.entries()){
    const side=index%2===0?1:-1;
    switch(accessory){
      case 'BEAD_COLLAR':if(p.wear!=='CEREMONIAL_BEADS'&&p.wear!=='ELDER_MANTLE')ritual(1);break;
      case 'BONE_TALISMAN':case 'CLAY_CHARM':case 'SHELL_DECORATION':
        hang(out,`TALISMAN_${accessory}`,new THREE.Vector3(side*.14,1.84,.16),
          new THREE.Vector3(side*.09,1.65,.35),fiber,trim);break;
      case 'BRAIDED_CUFF':case 'FIBER_BINDINGS':
        // Atadura abierta y lateral, no aros rígidos: conserva libres los pares adicionales.
        for(const s of [-1,1] as const){
          tie(`ARM_FIBER_LACING_${s}`,[new THREE.Vector3(s*.35,1.56,.08),
            new THREE.Vector3(s*.42,1.49,.17),new THREE.Vector3(s*.43,1.44,.04)],fiber,.013);
        }break;
      case 'HIDE_SATCHEL':case 'SEED_POUCH':pouch(side);break;
      case 'STONE_TOOL':{
        const tool=new THREE.Mesh(new THREE.ConeGeometry(.036,.18,7),material(trim));
        tool.position.set(side*.31,waist-.11,.15);part(out,tool,`STONE_TOOL_${side}`,'ACCESSORY');
        tie(`STONE_TOOL_STRAP_${side}`,[new THREE.Vector3(side*.24,waist,.20),new THREE.Vector3(side*.32,waist-.06,.19)],fiber,.01);
        break;
      }
      case 'RITUAL_STAFF':{
        const staff=new THREE.Mesh(new THREE.CylinderGeometry(.019,.025,.48,8),material(base));
        staff.position.set(side*.33,1.28,-.05);staff.rotation.z=side*.22;
        part(out,staff,'RITUAL_STAFF','ACCESSORY');
        tie('RITUAL_STAFF_BINDING',[new THREE.Vector3(side*.18,1.53,-.17),new THREE.Vector3(side*.31,1.32,-.06)],fiber,.012);
        break;
      }
    }
  }
  // Material visualmente primitivo: sin cascos, visores ni mochilas técnicas.
  // No cubrir laterales torácicos de inserción de brazos; ninguna prenda modifica la anatomía 38.2q.
  return out;
}
