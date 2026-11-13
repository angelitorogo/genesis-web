/** GENESIS 38.2k — SDF insectoide: una sola superficie del cuerpo y sus apoyos. */
import type { Vida38InsectMorphology38K } from './vida38-insect-morphology-38-2k';
export const VIDA38_INSECT_MESH_REVISION='VIDA.38.2k/insect-organic-field/v1' as const;
export type Vida38InsectQuality='LOW'|'MEDIUM'|'HIGH';
type V3=readonly [number,number,number];
export interface Vida38InsectRawMesh38K {
  readonly revision:typeof VIDA38_INSECT_MESH_REVISION;
  readonly morphology:Vida38InsectMorphology38K;
  readonly quality:Vida38InsectQuality;
  readonly positions:Float32Array;
  readonly normals:Float32Array;
  readonly uvs:Float32Array;
  readonly indices:Uint32Array;
  readonly bounds:Readonly<{min:V3;max:V3}>;
}
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const length=(x:number,y:number,z:number)=>Math.sqrt(x*x+y*y+z*z);
function smoothMin(a:number,b:number,k:number):number{
  if(k<=0)return Math.min(a,b);
  const h=clamp(.5+.5*(b-a)/k,0,1);return b*(1-h)+a*h-k*h*(1-h);
}
function ellipse(x:number,y:number,z:number,cx:number,cy:number,cz:number,rx:number,ry:number,rz:number):number{
  const xx=x-cx, yy=y-cy, zz=z-cz;
  const r0=length(xx/rx,yy/ry,zz/rz),r1=length(xx/(rx*rx),yy/(ry*ry),zz/(rz*rz));
  return r1>1e-9?r0*(r0-1)/r1:-Math.min(rx,ry,rz);
}
function taper(x:number,y:number,z:number,ax:number,ay:number,az:number,bx:number,by:number,bz:number,ra:number,rb:number):number {
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  const t=clamp(((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/Math.max(1e-10,dx*dx+dy*dy+dz*dz),0,1);
  return length(x-ax-dx*t,y-ay-dy*t,z-az-dz*t)-(ra+(rb-ra)*t);
}
export interface Vida38InsectLandmarks38K {
  readonly bodyY:number;
  readonly headY:number;
  readonly headZ:number;
  readonly headRadius:number;
  readonly thoraxZ:number;
  readonly abdomenZ:number;
  readonly abdomenRearZ:number;
  readonly shoulderX:number;
  readonly wingY:number;
}
export function deriveVida38InsectLandmarks38K(m:Vida38InsectMorphology38K):Vida38InsectLandmarks38K {
  const bodyY=.23+.14*m.bodyElevation;
  const headZ=.53+.115*m.headSize+(m.archetype==='MANTIS'?.24:m.archetype==='STICK'?.29:0);
  return Object.freeze({bodyY,headY:bodyY+.085*m.headSize+m.headOffsetY,headZ,
    headRadius:.215*m.headSize,thoraxZ:.12,abdomenZ:-.34,
    abdomenRearZ:-.34-.57*m.abdomenLength,shoulderX:.155*m.thoraxSize,
    wingY:bodyY+.16*m.thoraxSize});
}

/** SDF negativo dentro. Cabeza, tórax, abdomen y patas nacen del mismo campo. */
export function evaluateVida38InsectField38K(m:Vida38InsectMorphology38K,x:number,y:number,z:number):number{
  const a=deriveVida38InsectLandmarks38K(m);
  const abWidth=.25*m.abdomenWidth;
  const abHeight=.20*m.abdomenHeight;
  const abdCenter=a.abdomenZ-.15*(m.abdomenLength-1);
  const abdomenRadiusZ=.47*m.abdomenLength;
  // Escleritos abdominales: incisuras amplias, no ruido microscópico del SDF.
  const ring = Math.sin((z-abdCenter)*Math.PI*m.segmentation/(abdomenRadiusZ*2));
  const segmentRelief = Math.abs(z-abdCenter)<abdomenRadiusZ*.94
    ? (m.archetype==='LARVIFORM'?.024:.010)*(1-Math.abs(ring)) : 0;
  let d=ellipse(x,y,z,0,a.bodyY-.015,abdCenter,
    abWidth*(1-.11*m.abdomenTaper),abHeight,abdomenRadiusZ)+segmentRelief;
  d=smoothMin(d,ellipse(x,y,z,0,a.bodyY+.016,a.thoraxZ,
    .235*m.thoraxSize,.19*m.thoraxSize,.265*m.thoraxSize),.105);
  // Pecíolo: estrecho en hormigas/avispas, voluminoso en escarabajos.
  const waist=.13*m.waistWidth;
  d=smoothMin(d,taper(x,y,z,0,a.bodyY,-.23,0,a.bodyY,.07,waist,waist*.83),.088);
  const headY=a.headY,headZ=a.headZ;
  d=smoothMin(d,taper(x,y,z,0,a.bodyY+.06,.26,0,headY-.06*m.headSize,headZ-.13*m.headSize,
    .115*m.thoraxSize,.105*m.headSize),.09);
  d=smoothMin(d,ellipse(x,y,z,0,headY,headZ,
    a.headRadius*m.headAspect,a.headRadius*.89,a.headRadius*1.05),.080);
  // Rostro funcional: más triangular y marcado en mantis / avispa.
  d=smoothMin(d,ellipse(x,y,z,0,headY-.083*m.headSize,headZ+.16*m.headSize,
    .12*m.headSize,.10*m.headSize,.16*m.headSize),.055);
  // Escudos dorsales integrados en la superficie, no placas flotantes.
  if(m.armored>.52){
    const shield=ellipse(x,y,z,0,a.bodyY+.10*m.abdomenHeight,abdCenter,
      abWidth*.93,abHeight*.86,abdomenRadiusZ*.93);
    d=smoothMin(d,shield,.035);
  }
  // Pata articulada: coxa + fémur muscular + tibia + tarso con tres garras.
  // El SDF suaviza solo la unión de tejidos; los cambios de ángulo se conservan.
  for(const side of [-1,1])for(let i=0;i<m.legPairs;i++){
    const t=m.legPairs===1?.5:i/(m.legPairs-1);
    const z0=.29-t*(m.legPairs>3?.91:.57);
    const isFront=i===0, isBack=i===m.legPairs-1;
    const reach=m.legReach*(isBack&&m.legSpecialization==='JUMPER'?1.28:1);
    const x0=side*(.16*m.thoraxSize*(1-t)+abWidth*.80*t);
    const y0=a.bodyY-.05;
    const raptorial=m.legSpecialization==='RAPTORIAL'&&isFront;
    const jumping=m.legSpecialization==='JUMPER'&&isBack;
    const zK=z0+(raptorial?.26:jumping?-.36:isFront?.10:isBack?-.12:0)*reach;
    const kneeX=side*(Math.abs(x0)+(raptorial?.27:jumping?.36:.21)*reach);
    const kneeY=y0+(raptorial?.24:jumping?.31:-.09);
    const footX=side*(Math.abs(x0)+(raptorial?.20:jumping?.52:.44)*reach);
    const footZ=z0+(raptorial?.38:jumping?-.25:isFront?.20:isBack?-.22:0)*reach;
    const footY=raptorial?a.bodyY-.26:m.archetype==='LARVIFORM'?-.22:
      m.archetype==='COCKROACH'?-.43:-.63;
    let thickness=(m.legSpecialization==='DIGGER'&&isFront?1.52:1)*m.legThickness;
    if(m.legSpecialization==='RAPTORIAL'&&isFront)thickness*=1.26;
    const r=(m.archetype==='STICK'?.061:.084)*thickness*(jumping?1.28:1);
    d=smoothMin(d,ellipse(x,y,z,x0,y0,z0,r*1.22,.12*thickness,.12*thickness),.07);
    d=smoothMin(d,taper(x,y,z,x0,y0,z0,kneeX,kneeY,zK,r,r*.76),.060);
    // Fémures posteriores robustos en saltadores y patas anteriores raptoras.
    if(jumping){
      d=smoothMin(d,ellipse(x,y,z,(x0+kneeX)*.5,(y0+kneeY)*.5,(z0+zK)*.5,
        .12*thickness,.12*thickness,.23*thickness),.06);
    }
    d=smoothMin(d,taper(x,y,z,kneeX,kneeY,zK,footX,footY+.10,footZ,r*.62,r*.29),.048);
    d=smoothMin(d,taper(x,y,z,footX,footY+.10,footZ,
      footX+side*.035,footY,footZ+.085,.031*thickness,.021*thickness),.035);
    // Espolones cortos que terminan en el suelo sin ser varillas rectas.
    for(let digit=0;digit<2;digit++){
      d=smoothMin(d,taper(x,y,z,footX+side*.03,footY+.017,footZ+.055,
        footX+side*(digit===0?.09:-.015),footY+.01,footZ+.14+digit*.012,
        .024*thickness,.009*thickness),.019);
    }
    if(raptorial){
      const midx=side*(Math.abs(x0)+.26*reach);
      d=smoothMin(d,taper(x,y,z,midx,kneeY,zK,
        midx+side*.06,kneeY-.10,zK+.20,.033,.009),.018);
    }
  }
  return d;
}

export const VIDA38_INSECT_GRID:Readonly<Record<Vida38InsectQuality,readonly [number,number,number]>>=Object.freeze({
  LOW:[46,44,78],MEDIUM:[62,58,110],HIGH:[78,70,130],
});

const TETS = [
  [0,5,1,6],[0,1,2,6],[0,2,3,6],
  [0,3,7,6],[0,7,4,6],[0,4,5,6],
] as const;

/** Marching tetrahedra indexado; un único volumen anatómico, sin uniones artificiales. */
export function buildVida38InsectRawMesh38K(morphology: Vida38InsectMorphology38K, quality: Vida38InsectQuality = 'MEDIUM'): Vida38InsectRawMesh38K {
  const [nx,ny,nz] = VIDA38_INSECT_GRID[quality];
  const a=deriveVida38InsectLandmarks38K(morphology);
  const spreadX=Math.max(.90,.26*morphology.abdomenWidth+.72*morphology.legReach,
    .34*morphology.thoraxSize+.7*morphology.legReach,.40*morphology.headSize)+.24;
  const xmin=-spreadX,xmax=spreadX;
  const ymin=-.87;
  const ymax=Math.max(.95,a.headY+.5*morphology.headSize,a.wingY+.22)+.23;
  const zmin=Math.min(-.70-.90*morphology.abdomenLength,-.82-.72*morphology.legReach);
  const zmax=Math.max(a.headZ+.40*morphology.headSize,.96)+.22;
  const dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1),dz=(zmax-zmin)/(nz-1);
  const id = (i:number,j:number,k:number) => (k*ny+j)*nx+i;
  const field = new Float32Array(nx*ny*nz);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++)
    field[id(i,j,k)] = evaluateVida38InsectField38K(morphology,xmin+i*dx,ymin+j*dy,zmin+k*dz);

  const verts: number[]=[]; const uvs: number[]=[]; const normals: number[]=[]; const faces: number[]=[];
  const edgeCache = new Map<string,number>();
  const vpoint = (gridIndex:number):V3 => {
    const i=gridIndex%nx, j=Math.floor(gridIndex/nx)%ny, k=Math.floor(gridIndex/(nx*ny));
    return [xmin+i*dx,ymin+j*dy,zmin+k*dz];
  };
  const edge = (ia:number,ib:number):number => {
    const key=ia<ib?`${ia}:${ib}`:`${ib}:${ia}`;
    const cached=edgeCache.get(key); if(cached!==undefined)return cached;
    const fa=field[ia]!,fb=field[ib]!;
    const t=clamp(Math.abs(fa-fb)>1e-12?fa/(fa-fb):0.5,0.001,0.999);
    const a=vpoint(ia),b=vpoint(ib);
    const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;
    const vi=verts.length/3;
    verts.push(x,y,z);
    const eps=Math.min(dx,dy,dz)*0.48;
    const gx=evaluateVida38InsectField38K(morphology,x+eps,y,z)-evaluateVida38InsectField38K(morphology,x-eps,y,z);
    const gy=evaluateVida38InsectField38K(morphology,x,y+eps,z)-evaluateVida38InsectField38K(morphology,x,y-eps,z);
    const gz=evaluateVida38InsectField38K(morphology,x,y,z+eps)-evaluateVida38InsectField38K(morphology,x,y,z-eps);
    const gl=length(gx,gy,gz)||1;
    normals.push(gx/gl,gy/gl,gz/gl);
    uvs.push((Math.atan2(x,z)+Math.PI)/(2*Math.PI),clamp((y-ymin)/(ymax-ymin),0,1));
    edgeCache.set(key,vi);
    return vi;
  };
  const addTri=(a:number,b:number,c:number) => {
    if(a===b||a===c||b===c)return;
    const ia=a*3,ib=b*3,ic=c*3;
    const ux=verts[ib]!-verts[ia]!, uy=verts[ib+1]!-verts[ia+1]!, uz=verts[ib+2]!-verts[ia+2]!;
    const vx=verts[ic]!-verts[ia]!, vy=verts[ic+1]!-verts[ia+1]!, vz=verts[ic+2]!-verts[ia+2]!;
    const cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
    if(cx*cx+cy*cy+cz*cz<1e-24)return;
    const dot=cx*normals[ia]!+cy*normals[ia+1]!+cz*normals[ia+2]!;
    if(dot>=0)faces.push(a,b,c);else faces.push(a,c,b);
  };

  for(let k=0;k<nz-1;k++) for(let j=0;j<ny-1;j++) for(let i=0;i<nx-1;i++) {
    const v=[id(i,j,k),id(i+1,j,k),id(i+1,j+1,k),id(i,j+1,k),
      id(i,j,k+1),id(i+1,j,k+1),id(i+1,j+1,k+1),id(i,j+1,k+1)];
    let lower=0,upper=0;for(const ii of v){if(field[ii]!<0)lower++;else upper++;}
    if(lower===0||upper===0)continue;
    for(const tet of TETS) {
      const inside:number[]=[],outside:number[]=[];
      for(const local of tet) (field[v[local]!]!<0?inside:outside).push(v[local]!);
      if(inside.length===0||inside.length===4)continue;
      if(inside.length===1) {
        const a=inside[0]!;
        addTri(edge(a,outside[0]!),edge(a,outside[1]!),edge(a,outside[2]!));
      }else if(inside.length===3){
        const a=outside[0]!;
        addTri(edge(a,inside[0]!),edge(a,inside[2]!),edge(a,inside[1]!));
      }else{
        const a=inside[0]!,b=inside[1]!,c=outside[0]!,d=outside[1]!;
        const ac=edge(a,c),ad=edge(a,d),bc=edge(b,c),bd=edge(b,d);
        addTri(ac,ad,bc); addTri(ad,bd,bc);
      }
    }
  }
  if (faces.length===0) throw new Error('VIDA.38.2k: malla insectoide vacía');
  // El grid de baja resolución puede generar islas de tamaño subvoxel (dedos,
  // orificios craneales). Se conserva la componente física principal y se
  // eliminan fragmentos aislados, sin introducir superficies abiertas.
  const parent=new Int32Array(verts.length/3);for(let i=0;i<parent.length;i++)parent[i]=i;
  const find=(i:number):number=>{let r=i;while(parent[r]!==r){parent[r]=parent[parent[r]!]!;r=parent[r]!;}return r;};
  for(let i=0;i<faces.length;i+=3){parent[find(faces[i]!)]=find(faces[i+1]!);parent[find(faces[i+1]!)]=find(faces[i+2]!);}
  const counts=new Map<number,number>();
  for(let i=0;i<faces.length;i+=3){const r=find(faces[i]!);counts.set(r,(counts.get(r)||0)+1);}
  let biggest=-1,biggestCount=0;
  for(const [r,count] of counts){if(count>biggestCount){biggest=r;biggestCount=count;}}
  const selectedFaces:number[]=[];
  for(let i=0;i<faces.length;i+=3){if(find(faces[i]!)===biggest)selectedFaces.push(faces[i]!,faces[i+1]!,faces[i+2]!);}
  const mapping=new Int32Array(verts.length/3).fill(-1);
  const finalPositions:number[]=[],finalNormals:number[]=[],finalUvs:number[]=[],finalFaces:number[]=[];
  for(const original of selectedFaces){
    let mapped=mapping[original]!;
    if(mapped<0){
      mapped=finalPositions.length/3;mapping[original]=mapped;
      finalPositions.push(verts[original*3]!,verts[original*3+1]!,verts[original*3+2]!);
      finalNormals.push(normals[original*3]!,normals[original*3+1]!,normals[original*3+2]!);
      finalUvs.push(uvs[original*2]!,uvs[original*2+1]!);
    }
    finalFaces.push(mapped);
  }
  // Orientar todos los triángulos de forma coherente antes de entregarlos a
  // Three.js: una inconsistencia dejaría parches negros / transparentes con
  // FrontSide aunque la topología fuera estanca.
  const triangleCount=finalFaces.length/3;
  const neighbors: Array<Array<readonly [number,number]>>=Array.from({length:triangleCount},()=>[]);
  const owners=new Map<string,readonly [number,boolean]>();
  for(let face=0;face<triangleCount;face++){
    const a=finalFaces[face*3]!,b=finalFaces[face*3+1]!,c=finalFaces[face*3+2]!;
    for(const [u,v] of [[a,b],[b,c],[c,a]]){
      const key=u<v?`${u}:${v}`:`${v}:${u}`;
      const forward=u<v;
      const owner=owners.get(key);
      if(owner){
        const parity=owner[1]===forward?1:0;
        neighbors[face]!.push([owner[0],parity]);
        neighbors[owner[0]]!.push([face,parity]);
      }else owners.set(key,[face,forward]);
    }
  }
  const flips=new Int8Array(triangleCount).fill(-1);
  const queue:number[]=[];
  for(let origin=0;origin<triangleCount;origin++){
    if(flips[origin]!==-1)continue;
    flips[origin]=0;queue.length=0;queue.push(origin);
    for(let qi=0;qi<queue.length;qi++){
      const current=queue[qi]!;
      for(const [other,parity] of neighbors[current]!){
        if(flips[other]!==-1)continue;
        flips[other]=flips[current]! ^ parity;
        queue.push(other);
      }
    }
  }
  for(let face=0;face<triangleCount;face++)if(flips[face]===1){
    const at=face*3+1,b=at+1;
    [finalFaces[at],finalFaces[b]]=[finalFaces[b]!,finalFaces[at]!];
  }
  // Volumen orientado para determinar si hay que invertir toda la superficie.
  let signedVolume6=0;
  for(let face=0;face<triangleCount;face++){
    const a=finalFaces[face*3]!*3,b=finalFaces[face*3+1]!*3,c=finalFaces[face*3+2]!*3;
    signedVolume6 += finalPositions[a]!*(finalPositions[b+1]!*finalPositions[c+2]!-finalPositions[b+2]!*finalPositions[c+1]!)+
      finalPositions[a+1]!*(finalPositions[b+2]!*finalPositions[c]!-finalPositions[b]!*finalPositions[c+2]!)+
      finalPositions[a+2]!*(finalPositions[b]!*finalPositions[c+1]!-finalPositions[b+1]!*finalPositions[c]!);
  }
  if(signedVolume6<0)for(let face=0;face<triangleCount;face++){
    const at=face*3+1,b=at+1;
    [finalFaces[at],finalFaces[b]]=[finalFaces[b]!,finalFaces[at]!];
  }
  return {
    revision: VIDA38_INSECT_MESH_REVISION,
    morphology,
    quality,
    positions: Float32Array.from(finalPositions),
    normals: Float32Array.from(finalNormals),
    uvs: Float32Array.from(finalUvs),
    indices: Uint32Array.from(finalFaces),
    bounds: {min:[xmin,ymin,zmin],max:[xmax,ymax,zmax]},
  };
}

export function auditVida38InsectRawMesh38K(mesh: Vida38InsectRawMesh38K): Readonly<{
  vertexCount:number;triangleCount:number;invalid:number;boundaryEdges:number;nonManifoldEdges:number;inconsistentEdges:number;components:number;
}> {
  const n=mesh.positions.length/3;
  let invalid=0;
  const edges=new Map<string,number>();
  const winding=new Map<string,number>();
  const groups=new Int32Array(n);for(let i=0;i<n;i++)groups[i]=i;
  const root=(start:number):number=>{let cur=start;while(groups[cur]!==cur){groups[cur]=groups[groups[cur]!]!;cur=groups[cur]!;}return cur;};
  const merge=(a:number,b:number)=>{const r=root(a),s=root(b);if(r!==s)groups[r]=s;};
  for(let i=0;i<mesh.positions.length;i++)if(!Number.isFinite(mesh.positions[i]!))invalid++;
  for(let i=0;i<mesh.normals.length;i++)if(!Number.isFinite(mesh.normals[i]!))invalid++;
  for(let i=0;i<mesh.indices.length;i+=3) {
    const a=mesh.indices[i]!,b=mesh.indices[i+1]!,c=mesh.indices[i+2]!;
    if(a>=n||b>=n||c>=n||a===b||b===c||c===a){invalid++;continue;}
    merge(a,b);merge(b,c);
    for(const [u,v] of [[a,b],[b,c],[c,a]]){
      const key=u<v?`${u}:${v}`:`${v}:${u}`;edges.set(key,(edges.get(key)||0)+1);winding.set(key,(winding.get(key)||0)+(u<v?1:-1));
    }
  }
  let boundaryEdges=0,nonManifoldEdges=0,inconsistentEdges=0;
  for(const [key,count] of edges){if(count===1)boundaryEdges++;else if(count!==2)nonManifoldEdges++;else if(winding.get(key)!==0)inconsistentEdges++;}
  const components=new Set<number>();for(let i=0;i<n;i++)components.add(root(i));
  return {vertexCount:n,triangleCount:mesh.indices.length/3,invalid,boundaryEdges,nonManifoldEdges,inconsistentEdges,components:components.size};
}

