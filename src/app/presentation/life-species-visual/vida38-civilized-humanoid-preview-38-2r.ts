/** GENESIS 38.2r: renderer orgánico humanoide civilizado VERY_ADVANCED.
 * Base SDF 38.2e/g.e + moda cultural independiente. No modifica VIDA ni los humanoides naturales.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { buildVida38HumanoidRawMesh, deriveVida38HumanoidAnatomy, type Vida38HumanoidQuality,
  type Vida38HumanoidAnatomy, type Vida38HumanoidRawMesh } from './vida38-humanoid-organic-field-38-2e';
import { createVida38HumanoidSkinV1, createVida38HumanoidOcularDetailsV1 } from './vida38-humanoid-organic-material-38-2e';
import { createVida38HumanoidHairV1, createVida38HumanoidTeethV1 } from './vida38-humanoid-hair-dentition-38-2gd';
import { deriveVida38CivilHumanoidPlan38R, type Vida38CivilHumanoidPlan38R,
  VIDA38_CIV_HUMANOID_REVISION_38R } from './vida38-civilized-humanoid-plan-38-2r';
import { deriveVida38CivilHumanoidOralPlan38R1A, sculptVida38CivilHumanoidOralRaw38R1A } from './vida38-civilized-humanoid-oral-shape-38-2r1a';
import { createVida38CivilHumanoidOralMeshes38R1A } from './vida38-civilized-humanoid-oral-mesh-38-2r1a';

export { isVida38VeryAdvancedHumanoid38R } from './vida38-civilized-humanoid-plan-38-2r';

const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
function smooth(a:number,b:number,x:number):number {const t=clamp((x-a)/Math.max(1e-6,b-a),0,1);return t*t*(3-2*t);}

function attach(parent:THREE.Group,created:THREE.Object3D[],mesh:THREE.Object3D,name:string,part:string):void{
  mesh.name=name;mesh.userData['civHumPart38R']=part;
  parent.add(mesh);created.push(mesh);
}
function fabric(hex:string,kind:Vida38CivilHumanoidPlan38R['material'],opacity=1):THREE.MeshPhysicalMaterial{
  const metal=kind==='MATTE_ALLOY'?.55:kind==='BIOCERAMIC'?.26:kind==='PEARL_MEMBRANE'?.08:.015;
  const rough=kind==='MATTE_ALLOY'?.45:kind==='CEREMONIAL_FIBER'?.83:kind==='FLEXWEAVE'?.72:kind==='LUMEN_SILK'?.38:.57;
  return new THREE.MeshPhysicalMaterial({color:hex,metalness:metal,roughness:rough,side:THREE.DoubleSide,
    transparent:opacity<1,opacity,clearcoat:kind==='PEARL_MEMBRANE'?.24:.07,clearcoatRoughness:.46,
    sheen:(kind==='CEREMONIAL_FIBER'||kind==='LUMEN_SILK') ? .35 : .04,sheenRoughness:.66});
}
function thinCurve(points:THREE.Vector3[],radius:number,hex:string):THREE.Mesh{
  const curve=new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(12,points.length*6),radius,6,false),
    new THREE.MeshPhysicalMaterial({color:hex,roughness:.37,metalness:.35,emissive:hex,emissiveIntensity:.13}));
}
function loftSegment(points:THREE.Vector3[],radii:number[],hex:string):THREE.Mesh{
  const geometry=new THREE.BufferGeometry();const vertices:number[]=[],idx:number[]=[];
  const n=10;
  for(let j=0;j<points.length;j++){
    const tangent=new THREE.Vector3().subVectors(points[Math.min(points.length-1,j+1)]!,points[Math.max(0,j-1)]!).normalize();
    const across=new THREE.Vector3(0,0,1).cross(tangent).normalize();
    if(across.lengthSq()<.01)across.set(1,0,0);
    const up=new THREE.Vector3().crossVectors(tangent,across).normalize();
    for(let i=0;i<=n;i++){
      const t=i/n*Math.PI*2;const p=points[j]!.clone().addScaledVector(across,Math.cos(t)*radii[j]!).addScaledVector(up,Math.sin(t)*radii[j]!);
      vertices.push(p.x,p.y,p.z);
      if(j>0&&i>0){const k=j*(n+1)+i;idx.push(k,k-1,k-n-2,k,k-n-2,k-n-1);}
    }
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(idx);geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,fabric(hex,'MATTE_ALLOY'));
}

/** Modulación progresiva solo en extremidades y cintura; cráneo y ojos permanecen alineados al SDF aprobado. */
function morphOrganicRaw(raw:Vida38HumanoidRawMesh,a:Vida38HumanoidAnatomy,p:Vida38CivilHumanoidPlan38R):Vida38HumanoidRawMesh{
  const positions=new Float32Array(raw.positions);
  const chest=a.legLength+.64*a.torsoLength;
  for(let i=0;i<positions.length;i+=3){
    const x=positions[i]!,y=positions[i+1]!,z=positions[i+2]!;
    const torso=smooth(a.legLength-.05,a.legLength+.18,y)*(1-smooth(a.legLength+.91*a.torsoLength,a.legLength+1.10*a.torsoLength,y));
    const shoulder=Math.exp(-Math.pow((y-chest)/(.24*a.torsoLength),2));
    const leg=smooth(.12,.38,y)*(1-smooth(a.legLength-.05,a.legLength+.18,y));
    const width=1+(p.bodyWidth-1)*torso+(p.shoulderScale-1)*shoulder*.80;
    positions[i]=x*(width+leg*(p.legScale-1)*.19);
    positions[i+1]=y+(p.legScale-1)*(.12*Math.sin(Math.PI*clamp(y/Math.max(.2,a.legLength),0,1)))*leg;
    positions[i+2]=z*(1+(p.bodyWidth-1)*torso*.35);
    // Mantener el cráneo y los globos oculares en coordenadas compatibles.
  }
  return {...raw,positions};
}

/** Material ajustado a la malla continua: evita monos compuestos por cajas. */
function fittedOverlay(body:THREE.Mesh,choose:(x:number,y:number,z:number)=>boolean,offset:number,hex:string,
  kind:Vida38CivilHumanoidPlan38R['material']):THREE.Mesh|null{
  const g=body.geometry as THREE.BufferGeometry;
  const pos=g.getAttribute('position') as THREE.BufferAttribute;
  const normals=g.getAttribute('normal') as THREE.BufferAttribute;
  const index=g.getIndex();if(!index||!normals)return null;
  const positions:number[]=[],nrm:number[]=[],uv:number[]=[];
  const sourceUv=g.getAttribute('uv') as THREE.BufferAttribute|null;
  for(let k=0;k<index.count;k+=3){
    const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)];
    const cx=(pos.getX(ids[0]!)+pos.getX(ids[1]!)+pos.getX(ids[2]!))/3;
    const cy=(pos.getY(ids[0]!)+pos.getY(ids[1]!)+pos.getY(ids[2]!))/3;
    const cz=(pos.getZ(ids[0]!)+pos.getZ(ids[1]!)+pos.getZ(ids[2]!))/3;
    if(!choose(cx,cy,cz))continue;
    for(const id of ids){
      const nx=normals.getX(id!),ny=normals.getY(id!),nz=normals.getZ(id!);
      positions.push(pos.getX(id!)+nx*offset,pos.getY(id!)+ny*offset,pos.getZ(id!)+nz*offset);
      nrm.push(nx,ny,nz);uv.push(sourceUv?.getX(id!)??0,sourceUv?.getY(id!)??0);
    }
  }
  if(positions.length===0)return null;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const mesh=new THREE.Mesh(geo,fabric(hex,kind));mesh.castShadow=true;return mesh;
}

interface DraperyOpts {from:number;to:number;waistRadius:number;hemRadius:number;backOnly?:boolean;frontOpen?:boolean;pleats?:number;layer?:number;}
/** Paño continuo con perfiles verticales; el frente abierto queda libre sin tapas rectangulares. */
function createDrapery(a:Vida38HumanoidAnatomy,p:Vida38CivilHumanoidPlan38R,o:DraperyOpts,hex:string):THREE.Mesh{
  const rows=30,cols=o.backOnly?32:48,idx:number[]=[],vertices:number[]=[],uv:number[]=[];
  const start=o.backOnly?Math.PI*.57:0;
  const sweep=o.backOnly?Math.PI*.86:(o.frontOpen?Math.PI*2-.28:Math.PI*2);
  const offsetAngle=o.frontOpen?.14:0;
  const layers=o.layer??0;
  for(let row=0;row<=rows;row++){
    const t=row/rows;
    const y=o.from+(o.to-o.from)*t;
    const lowerBlend=smooth(.08,.94,t);
    const waist=(1-lowerBlend)*o.waistRadius+lowerBlend*o.hemRadius;
    const flare=(.045+o.hemRadius-o.waistRadius)*t*t;
    for(let col=0;col<=cols;col++){
      const u=col/cols;const phi=start+offsetAngle+u*sweep;
      const wave=(.012+.017*t)*(1+layers*.12)*Math.sin(phi*(o.pleats??12)+(t*.7+layers)*Math.PI*2)*t;
      const r=waist+flare*.12+wave;
      const x=Math.sin(phi)*r;
      const z=Math.cos(phi)*(r*.63+(.02+layers*.015))-(o.backOnly ? .10 : 0);
      const drop=.022*t*t*Math.cos(phi*2+.7*layers);
      vertices.push(x,y-drop,z);uv.push(u,t);
      if(row>0&&col>0){const q=row*(cols+1)+col;idx.push(q,q-1,q-cols-2,q,q-cols-2,q-cols-1);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,fabric(hex,p.material,o.backOnly&&p.culture==='PELAGIC_CONCORD'?.91:1));
  mesh.userData['draperyTopology38R']='CONTINUOUS';mesh.userData['draperyRows38R']=rows;
  mesh.userData['draperyFamily38R']=p.garment;
  mesh.userData['draperyBackOnly38R']=!!o.backOnly;
  mesh.castShadow=true;return mesh;
}
function addGarment(subject:THREE.Group,created:THREE.Object3D[],a:Vida38HumanoidAnatomy,p:Vida38CivilHumanoidPlan38R,body:THREE.Mesh):void{
  const neckY=a.legLength+a.torsoLength*.96;
  const waistY=a.legLength+.18*a.torsoLength;
  const hipY=a.legLength-.12;
  const primary=p.primaryHex,secondary=p.secondaryHex;
  const long=['CEREMONIAL_TUNIC','NOBLE_MANTLE','TECHNO_HABIT','DIPLOMATIC_DRAPE','ROYAL_REGALIA'].includes(p.garment);
  const technical=['TECH_SUIT','ANATOMIC_ARMOR','COLONIAL_GEAR','ELITE_UNIFORM'].includes(p.garment);
  const hemY=long?Math.max(.27,waistY-(.63+.35*p.garmentLength)):Math.max(.80,waistY-(.13+.21*p.garmentLength));
  const flare=p.garment==='ROYAL_REGALIA'?.49:p.garment==='NOBLE_MANTLE'?.43:p.garment==='DIPLOMATIC_DRAPE'?.39:p.garment==='TECHNO_HABIT'?.27:p.garment==='CEREMONIAL_TUNIC'?.31:p.garment==='SCIENTIFIC_COAT'?.20:.12;
  const add=(mesh:THREE.Mesh,name:string,part:string)=>attach(subject,created,mesh,name,part);
  if(technical){
    const cover=fittedOverlay(body,(x,y)=>y<neckY-.04&&y>.14 && (Math.abs(x)<.91||y>waistY),.008,primary,p.material);
    if(cover)add(cover,'VIDA38_R_CONTINUOUS_TECHNICAL_SUIT','TECH_GARMENT');
  }else{
    const bodice=fittedOverlay(body,(x,y)=>y>waistY-.055&&y<neckY-.015&&Math.abs(x)<a.shoulderWidth*1.32,.012,primary,p.material);
    if(bodice)add(bodice,'VIDA38_R_FITTED_BODICE','FITTED_CLOTH');
    if(['SCIENTIFIC_COAT','DIPLOMATIC_DRAPE'].includes(p.garment)){
      add(createDrapery(a,p,{from:neckY-.14,to:Math.max(.67,waistY-.57),waistRadius:.38,hemRadius:.48,frontOpen:true,pleats:10},secondary),
        'VIDA38_R_OPEN_COAT','OPEN_COAT');
    } else if (long || p.garment==='SCIENTIFIC_COAT') {
      add(createDrapery(a,p,{from:waistY+.06,to:hemY,waistRadius:.31*p.bodyWidth,hemRadius:.30*p.bodyWidth+flare,pleats:14},primary),
        'VIDA38_R_ORGANIC_TUNIC_SKIRT','SOFT_GARMENT');
    }
  }
  if(['NOBLE_MANTLE','ROYAL_REGALIA','TECHNO_HABIT','DIPLOMATIC_DRAPE'].includes(p.garment)){
    add(createDrapery(a,p,{from:neckY-.12,to:hemY-.04,waistRadius:.39*p.shoulderScale,hemRadius:.44+flare*.75,backOnly:true,pleats:12},secondary),
      'VIDA38_R_DRAPED_BACK_MANTLE','BACK_MANTLE');
  }
  if(p.garment==='COLONIAL_GEAR'||p.garment==='ELITE_UNIFORM'){
    add(createDrapery(a,p,{from:waistY+.02,to:Math.max(.73,hipY-.18),waistRadius:.31,hemRadius:.36+flare,frontOpen:true,pleats:6},secondary),
      'VIDA38_R_FUNCTIONAL_COAT_TAIL','FUNCTIONAL_PANEL');
  }
  if(p.garment==='ANATOMIC_ARMOR'||p.garment==='ELITE_UNIFORM'){
    const plate=fittedOverlay(body,(x,y,z)=>y>waistY+.12&&y<neckY-.15&&Math.abs(x)<a.shoulderWidth*1.04&&z>.01,.026,secondary,'BIOCERAMIC');
    if(plate)add(plate,'VIDA38_R_SCULPTED_CHESTPLATE','ARMOR_PLATE');
    for(const side of [-1,1] as const){
      const shell=new THREE.Mesh(new THREE.SphereGeometry(.19,18,12),fabric(secondary,'BIOCERAMIC'));
      shell.position.set(side*a.shoulderWidth*.94,neckY-.18,.015);shell.scale.set(.98,.51,1.05);
      add(shell,'VIDA38_R_HUMERAL_ARMOR','ARMOR_PLATE');
    }
  }
  if(p.garment==='SCIENTIFIC_COAT'||p.garment==='DIPLOMATIC_DRAPE'){
    for(const side of [-1,1] as const){
      add(thinCurve([new THREE.Vector3(side*.085,neckY-.09,.23),new THREE.Vector3(side*.16,waistY+.26,.26),new THREE.Vector3(side*.11,Math.max(.8,hemY),.28)],.011,p.accentHex),
        'VIDA38_R_LAPEL_TRIM','TRIM');
    }
  }
  // Remates corporales suaves: cintura, botas y puños; no cajas flotantes.
  const belt=new THREE.Mesh(new THREE.TorusGeometry(.30*p.bodyWidth,.018,8,52),fabric(secondary,'BIOCERAMIC'));
  belt.position.y=waistY;belt.scale.y=1;belt.rotation.x=Math.PI/2;add(belt,'VIDA38_R_WAIST_BAND','WAIST');
  for(const side of [-1,1] as const){
    const footX=side*(a.hipWidth*.61*a.hipSpacing+.018);
    const boot=fittedOverlay(body,(x,y)=>y<.26 && Math.abs(x-footX)<.20,.014,primary,'FLEXWEAVE');
    if(boot)add(boot,'VIDA38_R_FITTED_TECH_BOOT','BOOTS');
  }
  const accent= p.ornament==='MINIMAL' ? .007 : .011;
  if(p.garment==='TECH_SUIT'||p.garment==='ELITE_UNIFORM'||p.garment==='ANATOMIC_ARMOR'){
    for(const side of [-1,1] as const){
      add(thinCurve([new THREE.Vector3(side*.18,neckY-.13,.25),new THREE.Vector3(side*.22,waistY+.29,.29),new THREE.Vector3(side*.12,waistY+.08,.29)],accent,p.accentHex),
        'VIDA38_R_CULTURAL_LUMEN_SEAM','TRIM');
    }
  }else{
    add(thinCurve([new THREE.Vector3(0,neckY-.13,.31),new THREE.Vector3(0,waistY+.24,.33),new THREE.Vector3(0,waistY+.08,.31)],accent,p.accentHex),
      'VIDA38_R_CEREMONIAL_FRONT_SEAM','TRIM');
  }
  if(p.layerCount>=2&&long&&p.garment!=='SCIENTIFIC_COAT'){
    add(createDrapery(a,p,{from:waistY-.04,to:Math.max(.36,hemY+.15),waistRadius:.34,hemRadius:.34+flare*.66,pleats:10,frontOpen:p.layerCount===3,layer:1},secondary),
      'VIDA38_R_SECONDARY_ORGANIC_LAYER','SOFT_LAYER');
  }
  subject.userData['vida38CivilHumanoidGarment38R']=p.garment;
  subject.userData['vida38CivilHumanoidGarmentLength38R']=hemY;
}

function addAccessories(subject:THREE.Group,created:THREE.Object3D[],a:Vida38HumanoidAnatomy,p:Vida38CivilHumanoidPlan38R):void{
  const head=a.legLength+(1.22+(a.neckLength-1)*.14)*a.torsoLength;
  const eyeY=a.legLength+(1.18+(a.neckLength-1)*.14)*a.torsoLength;
  const add=(o:THREE.Object3D,name:string)=>attach(subject,created,o,name,'ACCESSORY');
  const addOne=(item:Vida38CivilHumanoidPlan38R['accessory'],side:-1|1)=>{
    if(item==='NONE')return;
    if(item==='VISOR'){
      const visor=new THREE.Mesh(new THREE.SphereGeometry(.205,22,12,0,Math.PI),fabric(p.accentHex,'PEARL_MEMBRANE',.67));
      visor.position.set(0,eyeY,.255);visor.scale.set(1.38,.26,.25);
      add(visor,'VIDA38_R_RECESSED_HOLO_VISOR');
    }else if(item==='MONOCLE'){
      const lens=new THREE.Mesh(new THREE.TorusGeometry(.059,.008,8,30),fabric(p.accentHex,'MATTE_ALLOY'));
      lens.position.set(side*a.eyeSpacing,eyeY,.29);add(lens,'VIDA38_R_HOLO_MONOCLE');
    }else if(item==='CROWN'||item==='DIADEM'){
      const circlet=new THREE.Mesh(new THREE.TorusGeometry(a.headWidth*.70,.012,8,48),fabric(p.accentHex,'BIOCERAMIC'));
      circlet.rotation.x=Math.PI/2;circlet.position.y=head+a.headHeight*.68;
      add(circlet,item==='CROWN'?'VIDA38_R_TECH_CROWN':'VIDA38_R_CULTURAL_DIADEM');
      if(item==='CROWN')for(let i=-2;i<=2;i++){
        const gem=new THREE.Mesh(new THREE.IcosahedronGeometry(.020,1),fabric(p.accentHex,'BIOCERAMIC'));
        gem.position.set(i*a.headWidth*.25,head+a.headHeight*.72+(.018+(.035*(2-Math.abs(i)))),.07);
        add(gem,'VIDA38_R_CROWN_INLAY');
      }
    }else if(item==='DATA_STAFF'||item==='SCEPTER'){
      const x=side*(a.shoulderWidth+.18),top=eyeY+(item==='SCEPTER'?.04:-.14);
      const staff=loftSegment([new THREE.Vector3(x,.13,.16),new THREE.Vector3(x-.02*side,1.08,.16),new THREE.Vector3(x-.02*side,top,.16)],
        [.010,.012,.018],p.secondaryHex);
      add(staff,item==='SCEPTER'?'VIDA38_R_HIERARCHICAL_SCEPTER':'VIDA38_R_DATA_STAFF');
      const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(item==='SCEPTER'?.064:.044,1),fabric(p.accentHex,'BIOCERAMIC'));
      orb.position.set(x-.02*side,top,.16);add(orb,'VIDA38_R_STAFF_EMITTER');
    }else if(item==='WRIST_MODULE'){
      const module=new THREE.Mesh(new THREE.TorusGeometry(.080,.015,8,28),fabric(p.accentHex,'MATTE_ALLOY'));
      module.rotation.x=Math.PI/2;module.position.set(side*(a.shoulderWidth+.24),a.legLength+.14,.08);
      add(module,'VIDA38_R_WRIST_TERMINAL');
    }else if(item==='HOLO_ORB'){
      const sphere=new THREE.Mesh(new THREE.SphereGeometry(.072,16,12),fabric(p.accentHex,'PEARL_MEMBRANE',.74));
      sphere.position.set(side*(a.shoulderWidth+.23),a.legLength+.10,.26);
      add(sphere,'VIDA38_R_PORTABLE_HOLO_ORB');
    }
  };
  addOne(p.accessory,-1);
  if(p.secondAccessory!==p.accessory)addOne(p.secondAccessory,1);
}

export function createVida38CivilizedHumanoidPreview38R(subject:THREE.Group,contract:Vida38SpeciesVisualContract,
  quality:Vida38HumanoidQuality='HIGH'):THREE.Object3D[]{
  const plan=deriveVida38CivilHumanoidPlan38R(contract);
  const anatomy=deriveVida38HumanoidAnatomy(contract);
  const raw=buildVida38HumanoidRawMesh(anatomy,quality);
  const shaped=morphOrganicRaw(raw,anatomy,plan);
  const oralPlan=deriveVida38CivilHumanoidOralPlan38R1A(anatomy,plan);
  const oralRaw=sculptVida38CivilHumanoidOralRaw38R1A(shaped,oralPlan);
  const body=createVida38HumanoidSkinV1(oralRaw,contract);
  (body.geometry as THREE.BufferGeometry).computeVertexNormals();
  const created:THREE.Object3D[]=[];
  attach(subject,created,body,'VIDA38_R_CONTINUOUS_HUMANOID_BODY','CONTINUOUS_BODY');
  for(const object of [
    ...createVida38HumanoidOcularDetailsV1(anatomy,contract),
    ...createVida38HumanoidHairV1(anatomy,contract,quality),
    ...createVida38HumanoidTeethV1(anatomy,contract),
  ]) attach(subject,created,object,object.name||'VIDA38_R_CRANIOFACIAL_DETAIL','FACE_DETAIL');
  for(const mesh of createVida38CivilHumanoidOralMeshes38R1A(anatomy,oralPlan,contract)) {
    attach(subject,created,mesh,mesh.name,'MOUTH');
  }
  subject.userData['vida38CivilHumanoidOralPlan38R1A']=oralPlan.signature;
  addGarment(subject,created,anatomy,plan,body);
  addAccessories(subject,created,anatomy,plan);
  subject.userData['civilizedRenderer38R']='HUMANOID';
  subject.userData['vida38CivilHumanoidRevision38R']=VIDA38_CIV_HUMANOID_REVISION_38R;
  subject.userData['vida38CivilHumanoidPlan38R']=plan;
  subject.userData['vida38CivilHumanoidSignature38R']=plan.signature;
  subject.userData['vida38CivilHumanoidHypothesis38R']=true;
  return created;
}
