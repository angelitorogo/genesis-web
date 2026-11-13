/**
 * GENESIS 38.2o.d5: mallado de campo combinado.
 * La anatomía procede del motor SDF humanoide 38.2e-38.2g.e. Solo esta especie
 * añade una extensión caudal SDF en el mismo dominio antes del marching tetrahedra.
 * NO se modifica el motor humanoide compartido ni los demás taxones.
 */
import {
  evaluateVida38HumanoidField,
  VIDA38_HUMANOID_GRID,
  VIDA38_HUMANOID_ORGANIC_REVISION,
  type Vida38HumanoidAnatomy,
  type Vida38HumanoidRawMesh,
  type Vida38HumanoidQuality,
} from './vida38-humanoid-organic-field-38-2e';

type V3 = readonly [number, number, number];
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function length(x: number, y: number, z: number): number { return Math.hypot(x, y, z); }
const TETS = [[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]] as const;
function smoothUnion(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
function sdTaperedLimb(
  x:number,y:number,z:number,
  ax:number,ay:number,az:number,
  bx:number,by:number,bz:number,
  r0:number,r1:number,
):number {
  const vx=bx-ax,vy=by-ay,vz=bz-az;
  const denom=vx*vx+vy*vy+vz*vz;
  const t=clamp(((x-ax)*vx+(y-ay)*vy+(z-az)*vz)/Math.max(1e-8,denom),0,1);
  const radius=r0+(r1-r0)*t;
  return length(x-ax-vx*t,y-ay-vy*t,z-az-vz*t)-radius;
}
function evaluateCivilReptilianField38OD5(a:Vida38HumanoidAnatomy, tailLength:number, x:number,y:number,z:number):number {
  const base=evaluateVida38HumanoidField(a,x,y,z);
  const p=a.legLength;
  if(Math.abs(x)>0.35 || y>p+0.23 || y<p-0.63 || z>0.23) return base;
  const rear=clamp(tailLength,0.55,1.05);
  const p0:[number,number,number,number]=[0,p-0.075,-0.12,0.17];
  const p1:[number,number,number,number]=[0,p-0.12,-0.30,0.145];
  const p2:[number,number,number,number]=[0,p-0.21,-0.59,0.097];
  const p3:[number,number,number,number]=[0,p-0.32,-0.92-(rear-0.7)*0.18,0.048];
  const p4:[number,number,number,number]=[0,p-0.38,-1.18-(rear-0.7)*0.37,0.009];
  const points=[p0,p1,p2,p3,p4];
  let tail=100;
  for(let i=0;i<points.length-1;i++) {
    const b=points[i]!,c=points[i+1]!;
    const d=sdTaperedLimb(x,y,z,b[0],b[1],b[2],c[0],c[1],c[2],b[3],c[3]);
    tail=i===0?d:smoothUnion(tail,d,0.035);
  }
  return smoothUnion(base,tail,0.145);
}

export function buildVida38CivilReptilianSdfMesh38OD5(anatomy: Vida38HumanoidAnatomy, quality: Vida38HumanoidQuality = 'MEDIUM', tailLength = 0.85): Vida38HumanoidRawMesh {
  const [nx,ny,originalNz] = VIDA38_HUMANOID_GRID[quality];
  const nz = Math.ceil((originalNz - 1) * ((0.77 + 1.56) / (0.77 + 0.72))) + 1;
  const ymax=Math.max(2.95,
    anatomy.legLength + (1.22 + anatomy.headHeight * 1.35 + (anatomy.neckLength-1)*0.14) * anatomy.torsoLength + 0.10);
  const [xmin,xmax,ymin,zmin,zmax] = [-1.10,1.10,-0.15,-1.56,0.77];
  const dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1),dz=(zmax-zmin)/(nz-1);
  const id = (i:number,j:number,k:number) => (k*ny+j)*nx+i;
  const field = new Float32Array(nx*ny*nz);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++)
    field[id(i,j,k)] = evaluateCivilReptilianField38OD5(anatomy, tailLength,xmin+i*dx,ymin+j*dy,zmin+k*dz);

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
    const gx=evaluateCivilReptilianField38OD5(anatomy, tailLength,x+eps,y,z)-evaluateCivilReptilianField38OD5(anatomy, tailLength,x-eps,y,z);
    const gy=evaluateCivilReptilianField38OD5(anatomy, tailLength,x,y+eps,z)-evaluateCivilReptilianField38OD5(anatomy, tailLength,x,y-eps,z);
    const gz=evaluateCivilReptilianField38OD5(anatomy, tailLength,x,y,z+eps)-evaluateCivilReptilianField38OD5(anatomy, tailLength,x,y,z-eps);
    const gl=length(gx,gy,gz)||1;
    normals.push(gx/gl,gy/gl,gz/gl);
    uvs.push((Math.atan2(x,z)+Math.PI)/(2*Math.PI),clamp(y/2.8,0,1));
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
  if (faces.length===0) throw new Error('Vida38 38.2e: no se generó superficie anatómica');
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
    revision: VIDA38_HUMANOID_ORGANIC_REVISION,
    anatomy,
    quality,
    positions: Float32Array.from(finalPositions),
    normals: Float32Array.from(finalNormals),
    uvs: Float32Array.from(finalUvs),
    indices: Uint32Array.from(finalFaces),
    bounds: {min:[xmin,ymin,zmin],max:[xmax,ymax,zmax]},
  };
}

