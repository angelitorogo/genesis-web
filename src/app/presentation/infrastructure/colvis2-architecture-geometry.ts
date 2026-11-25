/** COLVIS.2 — Shared, sculpted GPU geometry for verified VIDA.8 colonies.
 * A mesh describes a speculative *visual reconstruction*, never a new facility.
 * Each prefab has a canonical Y-up, ground-contact origin and ~unit footprint;
 * HIGH/MEDIUM views and the laboratory reuse these same BufferGeometries.
 */
import * as THREE from 'three';
import type { Vida38ColonyPartShape386c } from './vida38-colonial-complex-38-6c';

export type Colvis2SculptedShape = Exclude<Vida38ColonyPartShape386c,
  'BOX'|'CYLINDER'|'DOME'|'MAST'|'HEX'|'TAPER'|'RING'>;

/** Merging within a single sculpted unit avoids a draw call for every rib or scute.
 * Geometry is created only when a confirmed colony visual is constructed. */
function sculpture(build: (add:(geo:THREE.BufferGeometry,x:number,y:number,z:number,
  sx?:number,sy?:number,sz?:number,rz?:number,rx?:number)=>void)=>void):THREE.BufferGeometry {
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],colors:number[]=[];
  let section=0;
  const add=(geo:THREE.BufferGeometry,x:number,y:number,z:number,sx=1,sy=1,sz=1,rz=0,rx=0):void=>{
    const g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
    const transform=new THREE.Matrix4().makeTranslation(x,y,z);
    const rotationZ=new THREE.Matrix4().makeRotationZ(rz);
    const rotationX=new THREE.Matrix4().makeRotationX(rx);
    const scale=new THREE.Matrix4().makeScale(sx,sy,sz);
    g.applyMatrix4(transform.multiply(rotationZ).multiply(rotationX).multiply(scale));
    const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');
    // Facade, shell and reinforcing ribs have distinct subtle reflectance.
    // This is part of the geometry, not a shared tint pretending to be culture.
    const neutral=[.88,.74,1,.82,.95,.68,.91][section++%7]!;
    for(let i=0;i<p.count;i++){
      positions.push(p.getX(i),p.getY(i),p.getZ(i));
      normals.push(n?n.getX(i):0,n?n.getY(i):1,n?n.getZ(i):0);
      uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
      colors.push(neutral,neutral,neutral);
    }
    g.dispose();
  };
  build(add);
  const merged=new THREE.BufferGeometry();
  merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  merged.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  merged.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  merged.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  merged.computeBoundingBox();merged.computeBoundingSphere();
  return merged;
}

export function colvis2SculptedGeometry(shape:Colvis2SculptedShape):THREE.BufferGeometry {
  return sculpture(add=>{
    const box=(w:number,h:number,d:number,x:number,y:number,z:number,rz=0)=>
      add(new THREE.BoxGeometry(1,1,1),x,y,z,w,h,d,rz);
    const cyl=(top:number,bottom:number,h:number,x:number,y:number,z:number,segments=16)=>
      add(new THREE.CylinderGeometry(top,bottom,h,segments,1),x,y,z);
    const globe=(x:number,y:number,z:number,sx:number,sy:number,sz:number,seg=20)=>
      add(new THREE.SphereGeometry(1,seg,Math.max(10,Math.round(seg*.60))),x,y,z,sx,sy,sz);
    const torus=(x:number,y:number,z:number,r:number,tube:number,rx=0)=>
      add(new THREE.TorusGeometry(r,tube,8,32),x,y,z,1,1,1,0,rx);
    const leg=(x:number,y:number,z:number,rz:number)=>
      add(new THREE.CylinderGeometry(.022,.035,.55,9),x,y,z,1,1,1,rz);
    const pipe=(points:THREE.Vector3[],radius:number)=>{
      const curve=new THREE.CatmullRomCurve3(points);
      add(new THREE.TubeGeometry(curve,Math.max(12,points.length*7),radius,8,false),0,0,0);
    };
    if(shape==='HUMAN_HAB'){
      // Rounded sectional habitat: collar, panoramic glazing, external ribs.
      cyl(.32,.37,.55,0,.37,0,24);globe(0,.66,0,.32,.19,.32,24);
      for(const y of [.16,.35,.53]) torus(0,y,0,.35,.026,Math.PI/2);
      for(let j=0;j<8;j++){const a=j*Math.PI/4;box(.055,.20,.065,Math.cos(a)*.32,.39,Math.sin(a)*.32);}
      cyl(.43,.43,.085,0,.052,0,24);
    }else if(shape==='HUMAN_HANGAR'){
      // Arched hangar, projecting door frame, exterior service fins.
      box(.91,.29,.76,0,.17,0);
      add(new THREE.CylinderGeometry(.37,.37,.87,24,1,false,0,Math.PI),0,.32,0,1,1,1,0,Math.PI/2);
      box(.56,.42,.045,0,.32,.39);
      for(const x of [-.38,.38]){box(.065,.57,.83,x,.29,0);box(.085,.15,.18,x,.54,.29);}
      for(let j=0;j<6;j++)box(.04,.06,.70,-.32+j*.128,.63,0);
    }else if(shape==='HUMAN_ARCOLOGY'){
      // Layered arcology with rounded podium, stacked narrower glass decks.
      cyl(.39,.45,.14,0,.075,0,24);
      for(let i=0;i<4;i++){
        const r=.32-i*.045,y=.18+i*.205;
        cyl(r,r+.035,.19,0,y+.07,0,24);
        torus(0,y+.155,0,r+.038,.022,Math.PI/2);
        for(let j=0;j<12;j++){
          const a=j*Math.PI/6;
          box(.032,.13,.025,Math.cos(a)*r,y+.06,Math.sin(a)*r);
        }
      }
      cyl(.07,.17,.12,0,.93,0,16);
    }else if(shape==='HUMAN_BRIDGE'){
      box(.16,.12,1,0,.38,0);box(.22,.025,1,0,.49,0);
      for(const z of [-.42,-.18,.18,.42]){
        box(.035,.19,.03,-.10,.39,z);box(.035,.19,.03,.10,.39,z);
      }
      box(.06,.07,1,-.13,.55,0);box(.06,.07,1,.13,.55,0);
    }else if(shape==='REPTILE_KEEP'){
      // Heavy scute-covered stepped keep with protective projecting cornices.
      cyl(.32,.46,.25,0,.13,0,10);cyl(.26,.36,.25,0,.37,0,10);
      cyl(.18,.30,.26,0,.60,0,10);
      for(let k=0;k<3;k++){
        const r=.46-k*.095,y=.22+k*.25;
        cyl(r,r,.045,0,y,0,10);
        for(let j=0;j<10;j++){
          const a=j*Math.PI/5;
          box(.12,.095,.085,Math.cos(a)*r,y+.025,Math.sin(a)*r,a);
        }
      }
      cyl(.07,.16,.24,0,.80,0,10);
    }else if(shape==='REPTILE_SHELL'){
      // Overlapping low protective plates over a subterranean access.
      cyl(.39,.43,.16,0,.09,0,12);globe(0,.19,0,.43,.22,.43,24);
      for(let j=0;j<8;j++){
        const a=2*Math.PI*j/8;
        box(.27,.085,.32,Math.cos(a)*.26,.27,Math.sin(a)*.26,Math.sin(a)*.30);
      }
      box(.21,.15,.16,0,.15,.40);
    }else if(shape==='REPTILE_CITADEL'){
      // Reinforced concentric terraces and vertical crest walls.
      for(let i=0;i<4;i++){
        const r=.48-i*.075;
        cyl(r*.78,r,.19,0,.10+i*.20,0,9);
        cyl(r+.025,r+.025,.045,0,.18+i*.20,0,9);
        for(let j=0;j<9;j++){
          const a=j*Math.PI*2/9;
          box(.045,.14,.09,Math.cos(a)*(r+.01),.22+i*.20,Math.sin(a)*(r+.01),a);
        }
      }
      for(const x of [-.22,0,.22]){
        add(new THREE.ConeGeometry(.07,.22,8),x,.92,0);
      }
    }else if(shape==='REPTILE_SPINE'){
      cyl(.075,.22,.76,0,.40,0,10);
      for(let j=0;j<6;j++){
        const y=.14+j*.125;
        for(const x of [-1,1]){
          add(new THREE.ConeGeometry(.055,.22,8),x*(.19-j*.012),y,0,1,1,1,x*.90,0);
        }
      }
      add(new THREE.ConeGeometry(.085,.26,10),0,.91,0);
    }else if(shape==='REPTILE_CAUSEWAY'){
      box(.28,.11,1,0,.16,0);
      for(const x of [-.21,.21])for(let j=0;j<5;j++){
        box(.085,.22,.16,x,.25,-.43+j*.215);
      }
    }else if(shape==='INSECT_POD'){
      // Chitin capsule with smooth convex surfaces and ribbed exoskeleton.
      globe(0,.48,0,.36,.43,.32,28);
      cyl(.40,.37,.075,0,.09,0,20);
      for(let j=0;j<7;j++){
        const phi=Math.PI*2*j/7;
        pipe([
          new THREE.Vector3(Math.cos(phi)*.25,.18,Math.sin(phi)*.23),
          new THREE.Vector3(Math.cos(phi)*.365,.44,Math.sin(phi)*.32),
          new THREE.Vector3(Math.cos(phi)*.22,.74,Math.sin(phi)*.20),
        ],.019);
      }
      for(let j=0;j<4;j++){
        const a=j*Math.PI/2;
        leg(Math.cos(a)*.38,.20,Math.sin(a)*.38,.25*Math.cos(a));
      }
    }else if(shape==='INSECT_HIVE'){
      const points=[new THREE.Vector2(.37,0),new THREE.Vector2(.40,.16),new THREE.Vector2(.34,.35),
        new THREE.Vector2(.41,.55),new THREE.Vector2(.27,.75),new THREE.Vector2(.13,.87),new THREE.Vector2(0,.92)];
      add(new THREE.LatheGeometry(points,32),0,0,0);
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4;
        pipe([new THREE.Vector3(Math.cos(a)*.36,.12,Math.sin(a)*.36),
          new THREE.Vector3(Math.cos(a)*.38,.44,Math.sin(a)*.38),
          new THREE.Vector3(Math.cos(a)*.20,.72,Math.sin(a)*.20)],.025);
      }
    }else if(shape==='INSECT_SPIRE'){
      // Asymmetric cellular tower: segmented organic chambers and tendon ribs.
      cyl(.10,.22,.83,0,.42,0,16);
      for(let j=0;j<4;j++){
        const y=.20+j*.20,r=.28-j*.025;
        globe(.06*Math.sin(j*2.5),y,0,r,.14,r*.84,24);
        for(let k=0;k<6;k++){
          const a=k*Math.PI/3;
          pipe([new THREE.Vector3(Math.cos(a)*r,.08,Math.sin(a)*r),
            new THREE.Vector3(Math.cos(a)*(r+.04),y,Math.sin(a)*(r+.04)),
            new THREE.Vector3(Math.cos(a)*.13,.98,Math.sin(a)*.13)],.015);
        }
      }
      globe(0,.96,0,.14,.09,.14,18);
    }else if(shape==='INSECT_CELL'){
      globe(0,.48,0,.36,.33,.30,24);
      for(let j=0;j<5;j++){
        const a=j*2*Math.PI/5;
        const x=Math.cos(a)*.30,z=Math.sin(a)*.28;
        globe(x,.27+j%2*.10,z,.19,.23,.19,20);
        pipe([new THREE.Vector3(0,.52,0),new THREE.Vector3(x*.6,.48,z*.6),new THREE.Vector3(x,.37,z)],.025);
      }
      for(let j=0;j<8;j++){
        const a=j*Math.PI/4;
        leg(Math.cos(a)*.40,.18,Math.sin(a)*.38,Math.sin(a)*.2);
      }
    }else if(shape==='INSECT_TUNNEL'){
      // Tunnel links facing local Z; no humanoid road or angular beams.
      pipe([new THREE.Vector3(0,.18,-.50),new THREE.Vector3(.05,.31,-.2),
        new THREE.Vector3(-.05,.31,.2),new THREE.Vector3(0,.18,.50)],.115);
      for(let j=0;j<5;j++){
        const z=-.44+j*.22;
        torus(0,.27,z,.12,.016,0);
      }
    }
  });
}

export const COLVIS2_SCULPTED_SHAPES:readonly Colvis2SculptedShape[]=Object.freeze([
  'HUMAN_HAB','HUMAN_HANGAR','HUMAN_ARCOLOGY','HUMAN_BRIDGE',
  'REPTILE_KEEP','REPTILE_SHELL','REPTILE_CITADEL','REPTILE_SPINE','REPTILE_CAUSEWAY',
  'INSECT_POD','INSECT_HIVE','INSECT_SPIRE','INSECT_CELL','INSECT_TUNNEL',
]);
