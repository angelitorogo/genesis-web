/**
 * GENESIS 38.2k — reconstrucción 3D exclusiva de insectos confirmados.
 * El SDF produce un cuerpo continuo; ojos compuestos, antenas y alas son
 * elementos ópticos/articulados, no una colección de esferas como torso.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38InsectMorphology38K,type Vida38InsectMorphology38K } from './vida38-insect-morphology-38-2k';
import {
  buildVida38InsectRawMesh38K,deriveVida38InsectLandmarks38K,
  type Vida38InsectQuality,type Vida38InsectRawMesh38K,
} from './vida38-insect-organic-field-38-2k';
import { createVida38InsectSkin38K } from './vida38-insect-materials-38-2k';

const rawCache=new Map<string,Vida38InsectRawMesh38K>();
function unit(seed:number,salt:number):number{
  let x=(seed^Math.imul(salt+91,0x9e3779b9))>>>0;
  x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;
  return(x>>>0)/4294967295;
}
export function getVida38InsectRawMeshCached38K(m:Vida38InsectMorphology38K,quality:Vida38InsectQuality):Vida38InsectRawMesh38K{
  const key=`${m.fingerprint}|${quality}`;
  const existing=rawCache.get(key);
  if(existing){rawCache.delete(key);rawCache.set(key,existing);return existing;}
  const raw=buildVida38InsectRawMesh38K(m,quality);
  rawCache.set(key,raw);
  while(rawCache.size>3){const first=rawCache.keys().next().value;if(typeof first==='string')rawCache.delete(first);else break;}
  return raw;
}
function pbr(color:THREE.ColorRepresentation,roughness=.54,clearcoat=.16):THREE.MeshPhysicalMaterial{
  return new THREE.MeshPhysicalMaterial({color,metalness:0,roughness,clearcoat,clearcoatRoughness:.53,side:THREE.FrontSide});
}
function add(parent:THREE.Group,created:THREE.Object3D[],object:THREE.Object3D,name:string):void{
  object.name=name;object.userData['reconstructionHypothesis']=true;
  parent.add(object);created.push(object);
}

/** Puntas/cercos orgánicos curvos: radios variables, sin varillas cilíndricas rígidas. */
function taperedCurve(points:readonly THREE.Vector3[],baseRadius:number,segments=16):THREE.BufferGeometry{
  const spline=new THREE.CatmullRomCurve3([...points]);
  const tangent=new THREE.Vector3(),v=new THREE.Vector3(),b=new THREE.Vector3();
  const positions:number[]=[],indices:number[]=[],uvs:number[]=[];
  const rings=segments+1,sides=7;
  for(let i=0;i<rings;i++){
    const t=i/segments;const center=spline.getPoint(t);
    tangent.copy(spline.getTangent(t)).normalize();
    v.set(0,1,0);if(Math.abs(tangent.dot(v))>.92)v.set(1,0,0);
    v.addScaledVector(tangent,-tangent.dot(v)).normalize();b.crossVectors(tangent,v).normalize();
    const radius=baseRadius*Math.pow(1-t,.72)+baseRadius*.025;
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2;
      const point=center.clone().addScaledVector(v,Math.cos(a)*radius).addScaledVector(b,Math.sin(a)*radius);
      positions.push(point.x,point.y,point.z);uvs.push(j/sides,t);
      if(i>0&&j>0){const k=i*(sides+1)+j;indices.push(k,k-1,k-sides-2,k,k-sides-2,k-sides-1);}
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();return g;
}

function makeWingGeometry(m:Vida38InsectMorphology38K,side:number,pair:number):THREE.BufferGeometry{
  const a=deriveVida38InsectLandmarks38K(m);
  const span=(m.wingStyle==='LONG'?1.24:m.wingStyle==='ELYTRA'?.76:1)*m.wingSpan;
  const chord=(m.wingStyle==='LONG'?.25:m.wingStyle==='ELYTRA'?.59:.43)*m.wingChord;
  const z0=.18-pair*.21;
  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  const ns=28,nc=10;
  for(let i=0;i<=ns;i++){
    const t=i/ns;
    const width=Math.pow(Math.max(0,Math.sin(Math.PI*(.05+.93*t))),.70)*(1-.15*t)*chord;
    for(let j=0;j<=nc;j++){
      const s=j/nc*2-1;
      const x=side*(.14+t*span);
      const y=a.wingY+.09*Math.sin(Math.PI*t)+.025*(1-s*s)-.07*t*t;
      const z=z0+ m.wingSweep*span*t +s*width*.50;
      positions.push(x,y,z);uvs.push(t,j/nc);
      if(i>0&&j>0){const k=i*(nc+1)+j;indices.push(k,k-1,k-nc-2,k,k-nc-2,k-nc-1);}
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function addWings(parent:THREE.Group,objects:THREE.Object3D[],m:Vida38InsectMorphology38K,c:Vida38SpeciesVisualContract):void{
  if(m.wingPairs===0)return;
  const primary=new THREE.Color(c.pigmentation.primaryColorHex);
  const secondary=new THREE.Color(c.pigmentation.secondaryColorHex);
  for(const side of [-1,1])for(let pair=0;pair<m.wingPairs;pair++){
    const armored=m.wingStyle==='ELYTRA'&&pair===0;
    const wingMaterial=new THREE.MeshPhysicalMaterial({
      color:armored?primary.clone().lerp(secondary,.38):secondary.clone().lerp(new THREE.Color('#b7c8d2'),.35),
      metalness:0,roughness:armored?.55:.53,clearcoat:armored?.24:.10,
      side:THREE.DoubleSide,transparent:!armored,opacity:armored?1:.73,
      depthWrite:armored,depthTest:true,
    });
    const wing=new THREE.Mesh(makeWingGeometry(m,side,pair),wingMaterial);
    wing.castShadow=armored;wing.receiveShadow=armored;
    add(parent,objects,wing,`VIDA38_2K_WING_${side}_${pair}_${m.wingStyle}`);
    // Nervaduras que parten de la misma inserción torácica. No se simulan con
    // una esfera plana ni se pintan en coordenadas de pantalla.
    if(armored)continue;
    const segments:number[]=[];
    const a=deriveVida38InsectLandmarks38K(m);
    const span=(m.wingStyle==='LONG'?1.24:1)*m.wingSpan;
    const chord=(m.wingStyle==='LONG'?.25:.43)*m.wingChord;
    const z0=.18-pair*.21;
    for(let n=0;n<6;n++){
      const t=(n+1)/7;
      const width=Math.pow(Math.max(0,Math.sin(Math.PI*(.05+.93*t))),.70)*(1-.15*t)*chord;
      const x=side*(.14+span*t),y=a.wingY+.09*Math.sin(Math.PI*t)+.031-.07*t*t;
      const center=z0+m.wingSweep*span*t;
      segments.push(side*.14,a.wingY+.025,z0,x,y,center+width*(n%2===0?.45:-.45));
    }
    const veinGeometry=new THREE.BufferGeometry();
    veinGeometry.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));
    const veinMaterial=new THREE.LineBasicMaterial({color:primary.clone().lerp(secondary,.60),transparent:true,opacity:.51,depthWrite:false});
    const veins=new THREE.LineSegments(veinGeometry,veinMaterial);
    add(parent,objects,veins,`VIDA38_2K_WING_VEINS_${side}_${pair}`);
  }
}
function addEyes(parent:THREE.Group,objects:THREE.Object3D[],m:Vida38InsectMorphology38K,c:Vida38SpeciesVisualContract):void{
  const a=deriveVida38InsectLandmarks38K(m);
  const tint=new THREE.Color('#111d23').lerp(new THREE.Color(c.pigmentation.secondaryColorHex),.28);
  for(const side of [-1,1]){
    const radius=.063*m.eyeScale;
    const cx=side*a.headRadius*.78*m.headAspect,cy=a.headY+.033*m.headSize,cz=a.headZ+.082*m.headSize;
    const geometry=new THREE.IcosahedronGeometry(radius,m.eyeType==='COMPOUND_LARGE'?3:2);
    const eye=new THREE.Mesh(geometry,pbr(tint,.22,.23));
    eye.position.set(cx,cy,cz);eye.scale.set(1.02,1.05,.88);
    add(parent,objects,eye,`VIDA38_2K_COMPOUND_EYE_${side}`);
    if(m.eyeType==='COMPOUND_LARGE'){
      const gleam=new THREE.Mesh(new THREE.SphereGeometry(radius*.20,12,8),pbr('#8ca3ab',.20,.30));
      gleam.position.set(cx+side*radius*.18,cy+radius*.18,cz+radius*.84);
      add(parent,objects,gleam,`VIDA38_2K_EYE_GLINT_${side}`);
    }
  }
  for(let i=0;i<m.extraOcelli;i++){
    const x=(i-(m.extraOcelli-1)/2)*.058;
    const spot=new THREE.Mesh(new THREE.SphereGeometry(.019,12,8),pbr(tint,.30));
    spot.position.set(x,a.headY+a.headRadius*.79,a.headZ+.078*m.headSize);
    add(parent,objects,spot,`VIDA38_2K_OCELLUS_${i}`);
  }
}
function addAntennae(parent:THREE.Group,objects:THREE.Object3D[],m:Vida38InsectMorphology38K,c:Vida38SpeciesVisualContract):void{
  const a=deriveVida38InsectLandmarks38K(m);
  const base=new THREE.Color(c.pigmentation.primaryColorHex).lerp(new THREE.Color('#2b2725'),.32);
  const antennaMat=pbr(base,.68,.06);
  for(const side of [-1,1]){
    const len=m.antennaLength;
    const start=new THREE.Vector3(side*.09*m.headSize,a.headY+a.headRadius*.55,a.headZ+.13*m.headSize);
    const tip=start.clone().add(new THREE.Vector3(side*(.13+len*.58),.10+len*.46,len*.25));
    const mid=start.clone().lerp(tip,.48).add(new THREE.Vector3(side*.06,len*.12,.02));
    const stem=new THREE.Mesh(taperedCurve([start,mid,tip],.021*m.headSize,18),antennaMat);
    add(parent,objects,stem,`VIDA38_2K_ANTENNA_${side}_${m.antennaStyle}`);
    if(m.antennaStyle==='CLUBBED'){
      const bulb=new THREE.Mesh(new THREE.SphereGeometry(.042*m.headSize,14,10),pbr(base,.62));
      bulb.position.copy(tip);bulb.scale.set(1,.8,1.30);
      add(parent,objects,bulb,`VIDA38_2K_ANTENNA_CLUB_${side}`);
    }else if(m.antennaStyle==='FEATHERED'){
      for(let k=1;k<=6;k++){
        const u=k/7,center=start.clone().lerp(tip,u);
        const sprig=new THREE.Mesh(taperedCurve([center,center.clone().add(new THREE.Vector3(side*.035,.05,.06)),center.clone().add(new THREE.Vector3(side*(.065+.045*u),.08,.11))],.006*m.headSize,8),antennaMat);
        add(parent,objects,sprig,`VIDA38_2K_ANTENNA_FILAMENT_${side}_${k}`);
      }
    }
  }
}
function addMouth(parent:THREE.Group,objects:THREE.Object3D[],m:Vida38InsectMorphology38K,c:Vida38SpeciesVisualContract):void{
  const a=deriveVida38InsectLandmarks38K(m);
  const mat=pbr(new THREE.Color(c.pigmentation.primaryColorHex).lerp(new THREE.Color('#191c1b'),.27),.62);
  if(m.mouthType==='DISCREET')return;
  if(m.mouthType==='PROBOSCIS'){
    const mouth=new THREE.Mesh(taperedCurve([
      new THREE.Vector3(0,a.headY-.10*m.headSize,a.headZ+.20*m.headSize),
      new THREE.Vector3(0,a.headY-.21*m.headSize,a.headZ+.33*m.headSize),
      new THREE.Vector3(.06,a.headY-.29*m.headSize,a.headZ+.37*m.headSize),
    ],.032*m.mouthScale,16),mat);
    add(parent,objects,mouth,'VIDA38_2K_PROBOSCIS');return;
  }
  for(const side of [-1,1]){
    const mscale=m.mouthScale*(m.mouthType==='RAPTORIAL'?1.20:1);
    const root=new THREE.Vector3(side*.085*m.headSize,a.headY-.13*m.headSize,a.headZ+.18*m.headSize);
    const tip=root.clone().add(new THREE.Vector3(-side*.070*mscale,-.065*mscale,.16*mscale));
    const mid=root.clone().lerp(tip,.48).add(new THREE.Vector3(side*.07*mscale,-.023,0));
    const mandible=new THREE.Mesh(taperedCurve([root,mid,tip],.038*m.headSize*mscale,15),mat);
    add(parent,objects,mandible,`VIDA38_2K_MANDIBLE_${side}`);
  }
}
function addBristles(parent:THREE.Group,objects:THREE.Object3D[],raw:Vida38InsectRawMesh38K,c:Vida38SpeciesVisualContract):void{
  const m=raw.morphology;
  if(m.bristleDensity<.07)return;
  const cap=raw.quality==='HIGH'?360:raw.quality==='MEDIUM'?140:48;
  const count=Math.floor(cap*m.bristleDensity);
  if(count<1)return;
  const geometry=new THREE.ConeGeometry(.011,.068,5,1);
  const material=pbr(new THREE.Color(c.pigmentation.primaryColorHex).lerp(new THREE.Color(c.pigmentation.secondaryColorHex),.30),.86,.02);
  const bristles=new THREE.InstancedMesh(geometry,material,count);
  bristles.frustumCulled=false;
  const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),normal=new THREE.Vector3();
  const vertex=(v:number,ax:number)=>raw.positions[v*3+ax]!;
  const nv=(v:number,ax:number)=>raw.normals[v*3+ax]!;
  const triCount=raw.indices.length/3;
  for(let i=0;i<count;i++){
    const tri=Math.min(triCount-1,Math.floor(unit(m.identitySeed,i*11+1)*triCount));
    const va=raw.indices[tri*3]!,vb=raw.indices[tri*3+1]!,vc=raw.indices[tri*3+2]!;
    const r=Math.sqrt(unit(m.identitySeed,i*11+2)),s=unit(m.identitySeed,i*11+3);
    const weights=[1-r,r*(1-s),r*s];
    const v=[va,vb,vc];
    const p=new THREE.Vector3(),n=new THREE.Vector3();
    for(let j=0;j<3;j++){
      p.x+=vertex(v[j]!,0)*weights[j]!;p.y+=vertex(v[j]!,1)*weights[j]!;p.z+=vertex(v[j]!,2)*weights[j]!;
      n.x+=nv(v[j]!,0)*weights[j]!;n.y+=nv(v[j]!,1)*weights[j]!;n.z+=nv(v[j]!,2)*weights[j]!;
    }
    normal.copy(n).normalize();
    dummy.position.copy(p).addScaledVector(normal,.023);
    dummy.quaternion.setFromUnitVectors(up,normal);
    const scale=.40+.56*unit(m.identitySeed,i*11+4);
    dummy.scale.set(scale,scale,scale);dummy.updateMatrix();bristles.setMatrixAt(i,dummy.matrix);
  }
  bristles.instanceMatrix.needsUpdate=true;
  add(parent,objects,bristles,'VIDA38_2K_CHITIN_BRISTLES');
}

export function createVida38InsectPreview38K(
  parent:THREE.Group,contract:Vida38SpeciesVisualContract,quality:Vida38InsectQuality='HIGH',
):THREE.Object3D[]{
  const m=deriveVida38InsectMorphology38K(contract);
  const raw=getVida38InsectRawMeshCached38K(m,quality);
  const objects:THREE.Object3D[]=[];
  const body=createVida38InsectSkin38K(raw,contract);
  add(parent,objects,body,body.name);
  addEyes(parent,objects,m,contract);
  addMouth(parent,objects,m,contract);
  addAntennae(parent,objects,m,contract);
  addWings(parent,objects,m,contract);
  addBristles(parent,objects,raw,contract);
  parent.userData['insectMorphologyFingerprint']=m.fingerprint;
  parent.userData['insectArchetype']=m.archetype;
  parent.userData['insectLegPairs']=m.legPairs;
  parent.userData['insectWingPairs']=m.wingPairs;
  parent.userData['insectScientificLengthMeters']=contract.bodyLengthMeters;
  parent.userData['insectRepresentation']='ARTISTIC_HYPOTHESIS';
  return objects;
}
