/** GENESIS 38.2l: botánica procedural THREE.js con geometría de ramas y hojas reales. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {deriveVida38PlantMorphology38L,type Vida38PlantMorphology38L,type Vida38PlantLeafShape38L} from './vida38-plant-morphology-38-2l';
import {buildVida38PlantArchitecture38L,type Vida38PlantArchitecture38L,type PlantPoint38L} from './vida38-plant-architecture-38-2l';
export type Vida38PlantQuality38L='LOW'|'MEDIUM'|'HIGH';
const vec=(p:PlantPoint38L)=>new THREE.Vector3(p[0],p[1],p[2]);
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));

/** Tubos ramificados curvados, cónicos y con variación cortical estable por vértice. */
export function createVida38PlantStemsGeometry38L(a:Vida38PlantArchitecture38L,m:Vida38PlantMorphology38L,quality:Vida38PlantQuality38L):THREE.BufferGeometry {
  const pos:number[]=[],normColors:number[]=[],tri:number[]=[];
  const sides=quality==='LOW'?5:quality==='MEDIUM'?7:10;
  const bark=m.form==='HERB'?new THREE.Color('#66846a'):new THREE.Color('#6d5848');
  for(let bi=0;bi<a.stems.length;bi++){
    const stem=a.stems[bi]!;
    const base=pos.length/3, pts=stem.points;
    for(let i=0;i<pts.length;i++){
      const tangent=vec(pts[Math.min(pts.length-1,i+1)]!).sub(vec(pts[Math.max(0,i-1)]!)).normalize();
      const reference=Math.abs(tangent.y)<.91?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0);
      const xAxis=new THREE.Vector3().crossVectors(tangent,reference).normalize();
      const zAxis=new THREE.Vector3().crossVectors(tangent,xAxis).normalize();
      const t=i/(pts.length-1);
      const taper=(1-t)*.79+.18;
      const radius=Math.max(.0023,stem.radius*taper);
      const origin=vec(pts[i]!);
      for(let j=0;j<=sides;j++){
        const angle=2*Math.PI*j/sides;
        // Relieve de corteza de frecuencia BAJA anclado a la geometría (sin shimmer).
        const groove=1+.047*Math.sin(angle*5+bi*.71)+.023*Math.sin(t*10.1+angle*3);
        const point=origin.clone().addScaledVector(xAxis,Math.cos(angle)*radius*groove).addScaledVector(zAxis,Math.sin(angle)*radius*groove);
        pos.push(point.x,point.y,point.z);
        const shade=clamp(.84+.12*Math.sin(angle*3.3+bi*.67+t*4.1)+.06*Math.sin(t*13.7+bi),.65,1);
        const cc=bark.clone().multiplyScalar(shade);
        normColors.push(cc.r,cc.g,cc.b);
      }
      if(i>0)for(let j=0;j<sides;j++){
        const p=base+(i-1)*(sides+1)+j,q=base+i*(sides+1)+j;
        tri.push(p,q,p+1,q,q+1,p+1);
      }
    }
    // Los extremos se cierran. Las bifurcaciones se solapan dentro del tallo padre.
    const first=pos.length/3;
    const start=pts[0]!,end=pts[pts.length-1]!;
    pos.push(start[0],start[1],start[2],end[0],end[1],end[2]);
    const col=bark.clone().multiplyScalar(.86);
    normColors.push(col.r,col.g,col.b,col.r,col.g,col.b);
    for(let j=0;j<sides;j++){
      tri.push(first,base+j+1,base+j);
      const last=base+(pts.length-1)*(sides+1);
      tri.push(first+1,last+j,last+j+1);
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(normColors,3));
  geo.setIndex(tri);geo.computeVertexNormals();geo.computeBoundingSphere();
  return geo;
}

/** Una hoja tiene una silueta de limbo y nervio central, no forma esférica. */
export function createVida38PlantLeafGeometry38L(shape:Vida38PlantLeafShape38L,quality:Vida38PlantQuality38L):THREE.BufferGeometry {
  const rows=quality==='LOW'?8:quality==='MEDIUM'?12:18,cols=quality==='LOW'?4:6;
  const pos:number[]=[],uv:number[]=[],idx:number[]=[];
  for(let r=0;r<=rows;r++){
    const t=r/rows;
    const sine=Math.sin(Math.PI*Math.pow(t,shape==='ROUND'?.82:1));
    let w=shape==='NEEDLE'?.16:shape==='STRAP'?.37:shape==='SUCCULENT'?.85:shape==='ROUND'?1.25:shape==='LOBED'?1.08:1;
    const exponent=shape==='LANCEOLATE'?.75:shape==='OVATE'?.56:shape==='ROUND'?.46:shape==='NEEDLE'?.36:.80;
    w*=Math.pow(Math.max(0,sine),exponent);
    if(shape==='LOBED')w*=.81+.19*Math.cos(t*Math.PI*8);
    for(let c=0;c<=cols;c++){
      const s=c/cols*2-1;
      const ripple=Math.sin(t*Math.PI*2.4+s*3.1)*.013;
      pos.push(s*w*.48,t, .065*(1-s*s)*Math.sin(Math.PI*t)+.065*s*s*Math.sin(Math.PI*t*.85)+ripple);
      uv.push(c/cols,t);
      if(r&&c){const p=(r-1)*(cols+1)+c-1,q=p+cols+1;idx.push(p,q,p+1,q,q+1,p+1);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);
  geo.computeVertexNormals();return geo;
}

/** Flor sin esfera: verticilo de pétalos curvos unidos a una pequeña base. */
function createFlowerGeometry():THREE.BufferGeometry {
  const xyz:number[]=[],idx:number[]=[];
  const petals=6;
  for(let p=0;p<petals;p++){
    const phi=p/petals*Math.PI*2;
    const radial=(r:number,h:number,delta:number):[number,number,number]=>[
      Math.cos(phi+delta)*r,h,Math.sin(phi+delta)*r,
    ];
    const inner=radial(.035,.045,0),left=radial(.20,.23,-.23),tip=radial(.48,.19,0),right=radial(.20,.23,.23),outer=radial(.12,.07,0);
    const b=xyz.length/3;
    for(const point of [inner,left,tip,right,outer])xyz.push(...point);
    idx.push(b,b+1,b+4,b+1,b+2,b+4,b+4,b+2,b+3,b+4,b+3,b);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}

function addInstancedLeaves38L(parent:THREE.Group,contract:Vida38SpeciesVisualContract,m:Vida38PlantMorphology38L,
 a:Vida38PlantArchitecture38L,quality:Vida38PlantQuality38L):THREE.InstancedMesh {
  const divisor=quality==='LOW'?4:quality==='MEDIUM'?2:1;
  const leaves=a.leaves.filter((_,i)=>i%divisor===0);
  const geometry=createVida38PlantLeafGeometry38L(m.leafShape,quality);
  const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.76,metalness:0,clearcoat:.06,clearcoatRoughness:.68,
    side:THREE.DoubleSide,transparent:false,depthWrite:true});
  const mesh=new THREE.InstancedMesh(geometry,material,leaves.length);
  mesh.name='VIDA38_2L_PLANT_LEAVES';mesh.castShadow=true;mesh.receiveShadow=true;
  const primary=new THREE.Color(contract.pigmentation.primaryColorHex);
  const accent=new THREE.Color(contract.pigmentation.secondaryColorHex);
  const rot=new THREE.Quaternion(),mat=new THREE.Matrix4();
  const yAxis=new THREE.Vector3(0,1,0);
  for(let i=0;i<leaves.length;i++){
    const l=leaves[i]!;
    rot.setFromUnitVectors(yAxis,vec(l.direction).normalize());
    rot.multiply(new THREE.Quaternion().setFromAxisAngle(yAxis,l.twist));
    const length=l.size*(m.form==='HERB'?1.1:1);
    mat.compose(vec(l.position),rot,new THREE.Vector3(length*m.leafWidth,length,
      length*m.leafWidth));
    mesh.setMatrixAt(i,mat);
    const shade=.79+(.28*Math.abs(Math.sin(i*13.47+m.seed*.00003)));
    // Color VIDA, no hojas necesariamente verdes. Tono secundario aplicado por región.
    const cc=primary.clone().lerp(accent,.07+.27*Math.abs(Math.sin(i*2.43)));
    cc.multiplyScalar(shade);mesh.setColorAt(i,cc);
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  parent.add(mesh);return mesh;
}

function addPlantReproduction38L(parent:THREE.Group,contract:Vida38SpeciesVisualContract,m:Vida38PlantMorphology38L,
 a:Vida38PlantArchitecture38L,quality:Vida38PlantQuality38L):THREE.InstancedMesh | null {
  if(m.flowering==='NONE'||!a.flowers.length)return null;
  const flowers=quality==='LOW'?a.flowers.filter((_,i)=>i%3===0):quality==='MEDIUM'?a.flowers.filter((_,i)=>i%2===0):a.flowers;
  if(!flowers.length)return null;
  // Cápsulas terminales y flores son hipótesis artísticas (VIDA no certifica floración).
  const geometry=m.flowering==='CAPSULES' ? new THREE.CapsuleGeometry(.21,.38,4,9):createFlowerGeometry();
  const mat=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.67,metalness:0,side:THREE.DoubleSide});
  const group=new THREE.InstancedMesh(geometry,mat,flowers.length);
  group.name='VIDA38_2L_PLANT_REPRODUCTIVE_ORGANS';group.castShadow=true;
  const accent=new THREE.Color(contract.pigmentation.secondaryColorHex);
  const base=new THREE.Color(contract.pigmentation.primaryColorHex);
  const yAxis=new THREE.Vector3(0,1,0);
  for(let i=0;i<flowers.length;i++){
    const f=flowers[i]!;const rot=new THREE.Quaternion().setFromUnitVectors(yAxis,vec(f.direction));
    const localSize=m.leafLength*(m.flowering==='SPIKES'?.61:.40);
    const matrix=new THREE.Matrix4().compose(vec(f.position),rot,new THREE.Vector3(localSize,localSize,localSize));
    group.setMatrixAt(i,matrix);group.setColorAt(i,accent.clone().lerp(base,.15+i%4*.08));
  }
  group.instanceMatrix.needsUpdate=true;if(group.instanceColor)group.instanceColor.needsUpdate=true;
  parent.add(group);return group;
}

/** Contrato de integración: no modifica especies, persistencia ni generación VIDA. */
export function createVida38PlantPreview38L(parent:THREE.Group,contract:Vida38SpeciesVisualContract,
 quality:Vida38PlantQuality38L='HIGH'):THREE.Object3D[] {
  const m=deriveVida38PlantMorphology38L(contract);
  const a=buildVida38PlantArchitecture38L(m);
  const stems=new THREE.Mesh(createVida38PlantStemsGeometry38L(a,m,quality),
    new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:m.form==='HERB'?.75:.94,metalness:0,
      side:THREE.DoubleSide,depthWrite:true,transparent:false}));
  stems.name='VIDA38_2L_PLANT_BRANCH_ARCHITECTURE';stems.castShadow=true;stems.receiveShadow=true;
  parent.add(stems);
  const leaves=addInstancedLeaves38L(parent,contract,m,a,quality);
  const organs=addPlantReproduction38L(parent,contract,m,a,quality);
  parent.userData['plantMorphologyFingerprint']=m.fingerprint;
  parent.userData['plantGrowthForm']=m.form;
  parent.userData['plantArchetype']=m.archetype;
  parent.userData['plantScientificHeightMeters']=m.sourceHeightMeters;
  parent.userData['plantReconstructionStatus']='ARTISTIC_HYPOTHESIS_NOT_OBSERVED';
  return organs?[stems,leaves,organs]:[stems,leaves];
}
