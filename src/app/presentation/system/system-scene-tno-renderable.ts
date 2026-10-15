import * as THREE from 'three';
import { type SystemSceneTnoPresentationV1, tnoTerrainSeedUnitV1 as rand } from './system-scene-tno-presentation';

/** One canonical TNO surface for SystemScene, individual and compact fiches. */
export function createSystemSceneTnoRenderableV1(radiusScene: number, p: SystemSceneTnoPresentationV1) {
  if (!Number.isFinite(radiusScene) || radiusScene <= 0 || p.version !== 1) throw new RangeError('Invalid TNO renderer input');
  const near = radiusScene >= 0.12;
  const geo = new THREE.SphereGeometry(radiusScene, near ? 96 : 40, near ? 64 : 28);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(p.colorHex);
  const accent = new THREE.Color(p.accentHex);
  const mixed = new THREE.Color();
  const seed = p.variantUint32;
  const craters = Array.from({ length: near ? 39 : 39 }, (_, i) => {
    const a = rand(seed, 100 + i * 9) * Math.PI * 2;
    const z = 2 * rand(seed, 101 + i * 9) - 1;
    const h = Math.sqrt(1-z*z);
    return { x: Math.cos(a)*h, y: Math.sin(a)*h, z,
      radius: (i < 6 ? 0.16 : 0.035) + rand(seed, 102+i*9)*(i < 6 ? 0.28 : 0.12),
      depth: (i < 6 ? 0.014 : 0.005) + rand(seed, 103+i*9)*(i < 6 ? 0.026 : 0.010),
    };
  });
  for (let i=0;i<pos.count;i++) {
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    const d=Math.max(1e-9,Math.hypot(x,y,z)), nx=x/d, ny=y/d, nz=z/d;
    const largeNoise = Math.sin(nx*6.1+rand(seed,1)*6.28)*Math.cos(ny*5.2+rand(seed,2)*6.28)
      +0.5*Math.sin(nz*10.5+ny*4.2+rand(seed,3)*6.28);
    const fineNoise = Math.sin(nx*31+ny*19+rand(seed,4)*6.28)*Math.cos(nz*33-nx*8+rand(seed,5)*6.28);
    let radial = 1 + p.irregularity01*(0.55*largeNoise + 0.15*fineNoise);
    let floor=0, rim=0;
    for (const c of craters) {
      const dot=Math.max(-1,Math.min(1,nx*c.x+ny*c.y+nz*c.z));
      const t=Math.sqrt(Math.max(0,2-2*dot))/c.radius;
      if(t>1.4) continue;
      const inside=t<1 ? (1-t*t)**2 : 0;
      const edge=Math.exp(-(((t-1)/0.16)**2));
      radial-=c.depth*inside;
      radial+=c.depth*0.16*edge;
      floor=Math.max(floor,inside);
      rim=Math.max(rim,edge);
    }
    radial = Math.max(0.73,Math.min(1.30,radial));
    pos.setXYZ(i,nx*radiusScene*radial,ny*radiusScene*radial,nz*radiusScene*radial);
    const province=0.5+0.5*Math.sin(nx*8+ny*7+nz*5+rand(seed,6)*6.28)
      *Math.cos(nz*7+nx*3-rand(seed,7)*6.28);
    const frost= Math.max(0, province-0.55)*p.frostPatchiness01;
    const tone=Math.max(0.47,Math.min(1.20,0.86+0.24*province + 0.10*fineNoise-0.23*floor+0.07*rim));
    mixed.copy(base).lerp(accent,Math.min(0.60,0.18+frost));
    colors[3*i]=Math.min(1,mixed.r*tone);
    colors[3*i+1]=Math.min(1,mixed.g*tone);
    colors[3*i+2]=Math.min(1,mixed.b*tone);
  }
  pos.needsUpdate=true;
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.name='GENESIS TNO-R1 cratered deterministic surface';
  const mat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:p.roughness01,metalness:0,flatShading:false});
  mat.name='GENESIS TNO-R1 ice-rock regolith';
  const mesh=new THREE.Mesh(geo,mat);
  mesh.name='GENESIS TNO-R1 nucleus';
  const root=new THREE.Group(); root.name='GENESIS TNO-R1 procedural'; root.add(mesh);
  return Object.freeze({object:root,resources:Object.freeze([geo,mat]),surface:mesh});
}
