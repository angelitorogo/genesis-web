/** 38.6a · Bounded, non-emissive daytime structures placed at existing VISCIV
 * night-light hotspots. All meshes are attached to the same spin pivot as
 * the parent scientific planet; no new lights, satellites or domain state.
 */
import * as THREE from 'three';
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import {
  buildVida38DayUrbanPlan386a, type Vida38DayUrbanCluster386a,
  type Vida38DayUrbanPlan386a,
} from './vida38-day-urban-38-6a';

export interface Vida38DayUrbanVisual386a {
  readonly medium: THREE.Group;
  readonly high: THREE.Group;
  readonly resources: readonly {dispose():void}[];
  readonly plan: Vida38DayUrbanPlan386a | null;
}

const UP = new THREE.Vector3(0,1,0);
function fraction(seed:number,salt:number):number {
  let n=(seed^Math.imul(salt+1,0x9e3779b1))>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d)>>>0;
  n=Math.imul(n^(n>>>15),0x846ca68b)>>>0;
  return ((n^(n>>>16))>>>0)/4294967296;
}
function direction(lat:number,lon:number):THREE.Vector3 {
  return new THREE.Vector3(Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon));
}
/** Three sphere UV parity: atlas row 0 is north (flipY=true), texture x=0
 * maps to phi=0. This is intentionally the same spherical frame as 38.6.
 */
function centerOf(cluster:Vida38DayUrbanCluster386a):THREE.Vector3 {
  return direction(cluster.latitudeRadians,cluster.longitudeRadians);
}
function matrixAtSurface(normal:THREE.Vector3,radius:number,offsetX:number,offsetZ:number,
  width:number,height:number,rotation:number):THREE.Matrix4 {
  const orientation=new THREE.Quaternion().setFromUnitVectors(UP,normal);
  const spin=new THREE.Quaternion().setFromAxisAngle(UP,rotation);
  const planar=new THREE.Vector3(offsetX,0,offsetZ).applyQuaternion(orientation);
  const up=normal.clone().multiplyScalar(radius).add(planar).normalize();
  const pos=up.clone().multiplyScalar(radius*1.0008+height/2);
  const q=new THREE.Quaternion().setFromUnitVectors(UP,up).multiply(spin);
  return new THREE.Matrix4().compose(pos,q,new THREE.Vector3(width,height,width));
}

/** The raster is read directly from the canonical light texture already
 * created by SystemScene; it is never mutated or regenerated. */
export function createVida38DayUrbanSurface386a(
  plans:readonly Vida38InfrastructurePlan386[],
  radius:number,
  canonicalNightLights:THREE.DataTexture|null|undefined,
):Vida38DayUrbanVisual386a {
  const medium=new THREE.Group(); medium.name='VIDA.38.6a day secondary settlements MEDIUM';
  const high=new THREE.Group(); high.name='VIDA.38.6a day secondary settlements HIGH';
  const resources:{dispose():void}[]=[];
  const image=canonicalNightLights?.image as {data?:unknown;width?:unknown;height?:unknown}|undefined;
  const plan=Number.isFinite(radius) && radius>0 && image?.data instanceof Uint8Array &&
    typeof image.width==='number' && typeof image.height==='number'
    ? buildVida38DayUrbanPlan386a(plans,{rgba:image.data,width:image.width,height:image.height})
    : null;
  if(!plan || plan.clusters.length===0) {
    return Object.freeze({medium,high,resources:Object.freeze(resources),plan});
  }
  const base=radius*.0048;
  const blockGeometry=new THREE.BoxGeometry(1,1,1);
  const domeGeometry=new THREE.CylinderGeometry(.52,.66,1,9);
  const mediumMaterial=new THREE.MeshStandardMaterial({color:'#87959e',roughness:.82,metalness:.13});
  const highMaterial=new THREE.MeshStandardMaterial({color:'#a1a9aa',roughness:.73,metalness:.22});
  const towerMaterial=new THREE.MeshStandardMaterial({color:'#8b9aa4',roughness:.62,metalness:.34});
  const roadMaterial=new THREE.MeshStandardMaterial({color:'#777f88',roughness:.88,metalness:.08});
  resources.push(blockGeometry,domeGeometry,mediumMaterial,highMaterial,towerMaterial,roadMaterial);

  const mediumMatrices:THREE.Matrix4[]=[];
  const highMatrices:THREE.Matrix4[]=[];
  const towerMatrices:THREE.Matrix4[]=[];
  for(const city of plan.clusters){
    const normal=centerOf(city);
    const size=base*(city.kind==='CORE'?1.33:city.kind==='SECONDARY'?1.03:.72);
    const yaw=fraction(city.seedUint32,37)*Math.PI*2;
    mediumMatrices.push(matrixAtSurface(normal,radius,0,0,size*2.7,size*.30,yaw));
    const count=plan.tier==='VERY_ADVANCED'
      ? city.kind==='CORE'?11:city.kind==='SECONDARY'?7:4
      : city.kind==='CORE'?8:city.kind==='SECONDARY'?5:3;
    // Each building is individually projected to the curved surface. One
    // shared InstancedMesh covers hundreds of distinct non-emissive buildings.
    for(let j=0;j<count;j++){
      const ring=j===0?0:Math.ceil(j/5);
      const angle=yaw+2*Math.PI*fraction(city.seedUint32,j+101);
      const distance=ring*size*1.22*(.68+.6*fraction(city.seedUint32,j+27));
      const x=Math.cos(angle)*distance,z=Math.sin(angle)*distance;
      const tall=plan.tier==='VERY_ADVANCED' && (j===0||j%3===0);
      const buildingHeight=size*(tall?(1.9+2.0*fraction(city.seedUint32,j+88)):
        (.43+1.28*fraction(city.seedUint32,j+57)));
      const width=size*(.47+.50*fraction(city.seedUint32,j+65));
      (tall?towerMatrices:highMatrices).push(matrixAtSurface(normal,radius,x,z,width,buildingHeight,yaw));
    }
  }
  function addInstances(target:THREE.Group,geo:THREE.BufferGeometry,mat:THREE.Material,
    matrices:readonly THREE.Matrix4[]):void {
    if(!matrices.length)return;
    const mesh=new THREE.InstancedMesh(geo,mat,matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));
    mesh.instanceMatrix.needsUpdate=true;
    mesh.frustumCulled=false; // Sphere depth provides the actual planet occlusion.
    mesh.receiveShadow=true;
    target.add(mesh);
    // InstancedMesh.dispose() releases the per-instance GPU buffer as well as
    // its renderer-side bookkeeping. Geometries/materials are disposed below.
    resources.push(mesh);
  }
  addInstances(medium,blockGeometry,mediumMaterial,mediumMatrices);
  addInstances(high,blockGeometry,highMaterial,highMatrices);
  addInstances(high,domeGeometry,towerMaterial,towerMatrices);

  if(plan.tier==='VERY_ADVANCED' && plan.links.length){
    const roadGeometry=new THREE.BoxGeometry(1,1,1);
    resources.push(roadGeometry);
    const roadMatrices:THREE.Matrix4[]=[];
    for(const link of plan.links){
      const a=centerOf(plan.clusters[link.from]!);
      const b=centerOf(plan.clusters[link.to]!);
      const steps=Math.min(12,Math.max(2,Math.ceil(a.angleTo(b)/.018)));
      for(let i=0;i<steps;i++){
        const n0=a.clone().lerp(b,i/steps).normalize();
        const n1=a.clone().lerp(b,(i+1)/steps).normalize();
        const p0=n0.multiplyScalar(radius*1.0011);
        const p1=n1.multiplyScalar(radius*1.0011);
        const dir=p1.clone().sub(p0);
        const middle=p0.add(p1).multiplyScalar(.5);
        const orientation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),dir.clone().normalize());
        roadMatrices.push(new THREE.Matrix4().compose(middle,orientation,
          new THREE.Vector3(base*.14,base*.10,dir.length())));
      }
    }
    addInstances(high,roadGeometry,roadMaterial,roadMatrices);
  }
  return Object.freeze({medium,high,resources:Object.freeze(resources),plan});
}
