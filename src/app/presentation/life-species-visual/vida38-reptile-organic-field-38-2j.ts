/** GENESIS 38.2j — campo SDF de reptiles cuadrúpedos y extracción de malla. */
import type { Vida38ReptileMorphologyV1 } from './vida38-reptile-morphology-38-2j';

export const VIDA38_REPTILE_MESH_REVISION='VIDA.38.2j.b/reptile-organic-field/jaw-defined-v2' as const;
export type Vida38ReptileQuality='LOW'|'MEDIUM'|'HIGH';
type V3=readonly [number,number,number];
export interface Vida38ReptileRawMeshV1{
  readonly revision:typeof VIDA38_REPTILE_MESH_REVISION;
  readonly morphology:Vida38ReptileMorphologyV1;
  readonly quality:Vida38ReptileQuality;
  readonly positions:Float32Array;
  readonly normals:Float32Array;
  readonly uvs:Float32Array;
  readonly indices:Uint32Array;
  readonly bounds:Readonly<{min:V3;max:V3}>;
}
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const length=(x:number,y:number,z:number)=>Math.hypot(x,y,z);
function smoothMin(a:number,b:number,k:number):number{
  if(k<=0)return Math.min(a,b);
  const h=clamp(.5+.5*(b-a)/k,0,1);
  return b*(1-h)+a*h-k*h*(1-h);
}
function smoothMax(a:number,b:number,k:number):number{return -smoothMin(-a,-b,k);}
function ellipsoid(x:number,y:number,z:number,cx:number,cy:number,cz:number,rx:number,ry:number,rz:number):number{
  const xx=x-cx,yy=y-cy,zz=z-cz;
  const k0=length(xx/rx,yy/ry,zz/rz),k1=length(xx/(rx*rx),yy/(ry*ry),zz/(rz*rz));
  return k1>1e-9?k0*(k0-1)/k1:-Math.min(rx,ry,rz);
}
function taper(x:number,y:number,z:number,ax:number,ay:number,az:number,bx:number,by:number,bz:number,ra:number,rb:number):number{
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  const t=clamp(((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/Math.max(1e-8,dx*dx+dy*dy+dz*dz),0,1);
  return length(x-ax-dx*t,y-ay-dy*t,z-az-dz*t)-(ra+(rb-ra)*t);
}
export interface Vida38ReptileLandmarks38J{
  readonly bodyY:number;
  readonly shoulderZ:number;
  readonly hipZ:number;
  readonly headY:number;
  readonly headZ:number;
  readonly headRadius:number;
  readonly muzzleTipZ:number;
  readonly muzzleY:number;
  readonly footSpread:number;
  readonly tailRootZ:number;
  readonly tailTipZ:number;
}
const landmarkCache=new WeakMap<Vida38ReptileMorphologyV1,Vida38ReptileLandmarks38J>();
export function deriveVida38ReptileLandmarks38J(m:Vida38ReptileMorphologyV1):Vida38ReptileLandmarks38J{
  const cached=landmarkCache.get(m);if(cached)return cached;
  const bodyY=.18+.43*m.legLength+.27*m.bodyDepth;
  const shoulderZ=.43*m.bodyLength,hipZ=-.43*m.bodyLength;
  const headZ=.59*m.bodyLength+.38*m.neckLength+.20*m.headSize;
  const headY=bodyY+.035*m.bodyDepth+.08*m.neckLength;
  const headRadius=.27*m.headSize;
  const muzzleTipZ=headZ+.14*m.headSize+.34*m.headSize*m.snoutLength;
  const muzzleY=headY-.12*m.headSize;
  const footSpread=.35*m.torsoWidth+.18*m.legSplay;
  const tailRootZ=-.61*m.bodyLength;
  const tailTipZ=tailRootZ-.88*m.tailLength;
  const landmarks=Object.freeze({bodyY,shoulderZ,hipZ,headY,headZ,headRadius,muzzleTipZ,muzzleY,footSpread,tailRootZ,tailTipZ});
  landmarkCache.set(m,landmarks);return landmarks;
}
/** Campo negativo dentro del organismo. La malla corporal es una única superficie. */
export function evaluateVida38ReptileField38J(m:Vida38ReptileMorphologyV1,x:number,y:number,z:number):number{
  const a=deriveVida38ReptileLandmarks38J(m);
  let d=ellipsoid(x,y,z,0,a.bodyY,0,.39*m.torsoWidth,.29*m.bodyDepth,.67*m.bodyLength);
  d=smoothMin(d,ellipsoid(x,y,z,0,a.bodyY+.025*m.backArch,a.shoulderZ*.76,
    .34*m.torsoWidth,.31*m.bodyDepth*m.chestDepth,.36*m.bodyLength),.16);
  d=smoothMin(d,ellipsoid(x,y,z,0,a.bodyY-.065*m.abdomenFullness,a.hipZ*.75,
    .365*m.torsoWidth*m.abdomenFullness,.27*m.bodyDepth*m.abdomenFullness,.34*m.bodyLength),.17);
  // Cresta dorsal solo en variantes coherentes; no es una hilera de objetos flotantes.
  if(m.crestHeight>0){
    const dorsalY=a.bodyY+.27*m.bodyDepth;
    const fin=Math.max(0,1-Math.abs(z)/Math.max(.20,.64*m.bodyLength));
    const yFin=dorsalY+m.crestHeight*fin*(.67+.33*Math.cos(z*11));
    d=smoothMin(d,taper(x,y,z,0,dorsalY,.41*m.bodyLength,0,yFin,-.43*m.bodyLength,
      .050*m.torsoWidth,.012),.045);
  }
  // Cuello horizontal y anatomía cráneo-mandibular reptiliana.
  const neckStartZ=a.shoulderZ*.9;
  const neckRadius=.17*m.neckThickness;
  d=smoothMin(d,taper(x,y,z,0,a.bodyY+.025,neckStartZ,
    0,a.headY-.075*m.headSize,a.headZ-.13*m.headSize,neckRadius,neckRadius*.70),.16);
  d=smoothMin(d,ellipsoid(x,y,z,0,a.headY,a.headZ,
    a.headRadius*m.skullWidth,.88*a.headRadius,a.headRadius*m.skullDepth),.12);
  const snoutStart=a.headZ+.08*m.headSize;
  const upperY=a.muzzleY+.028*m.headSize;
  const lowerY=a.muzzleY-.11*m.jawMass*m.headSize-.38*m.jawGap*m.headSize;
  // Mandíbula superior proyectada: corta en geco, larga en cocodriliano/varano.
  d=smoothMin(d,taper(x,y,z,0,upperY,snoutStart,0,upperY-.015*m.headSize,a.muzzleTipZ,
    .16*m.snoutWidth*m.headSize,.09*m.headSize*m.snoutWidth),.095);
  d=smoothMin(d,ellipsoid(x,y,z,0,upperY-.018*m.headSize,a.muzzleTipZ-.055*m.headSize,
    .12*m.snoutWidth*m.headSize,.095*m.headSize,.115*m.headSize),.045);
  // Labio/mandíbula inferior con hendidura contenida, diseñada para que los
  // dientes opcionales queden en el borde y no como colmillos flotantes.
  d=smoothMin(d,taper(x,y,z,0,lowerY,snoutStart-.065*m.headSize,
    0,lowerY-.008,a.muzzleTipZ-.050*m.headSize,
    .135*m.snoutWidth*m.headSize,.075*m.headSize*m.jawMass),.038);
  d=smoothMin(d,ellipsoid(x,y,z,0,a.headY-.12*m.headSize,a.headZ+.03*m.headSize,
    .20*m.skullWidth*m.headSize,.125*m.jawMass*m.headSize,.24*m.headSize),.095);
  // Masas escapulares/pélvicas, patas abiertas y dedos finos con garras.
  for(const side of [-1,1] as const){
    for(let front=0;front<2;front++){
      const fore=front===0;
      const rootZ=fore?a.shoulderZ:a.hipZ;
      const muscle=fore?m.frontMuscle:m.rearMuscle;
      const rootX=side*.30*m.torsoWidth;
      const elbowX=side*(.33*m.torsoWidth+.12*m.legSplay);
      const padX=side*a.footSpread;
      const elbowY=.13+.29*m.legLength;
      const elbowZ=rootZ+(fore?-.12:.18)*m.legLength;
      const padZ=rootZ+(fore?.095:-.12)*m.legLength;
      const thigh=.115*m.legLength*muscle;
      d=smoothMin(d,ellipsoid(x,y,z,rootX,a.bodyY-.15*m.bodyDepth,rootZ,
        thigh*1.58,.26*m.legLength,.21*m.bodyLength),.15);
      d=smoothMin(d,taper(x,y,z,rootX,a.bodyY-.15*m.bodyDepth,rootZ,
        elbowX,elbowY,elbowZ,thigh*1.34,thigh*.77),.098);
      d=smoothMin(d,taper(x,y,z,elbowX,elbowY,elbowZ,padX,.093,padZ,
        thigh*.78,thigh*.43),.056);
      d=smoothMin(d,ellipsoid(x,y,z,padX,.080,padZ+.025,
        .082*m.footWidth,.064,.12*m.toeLength*m.footWidth),.042);
      for(let toe=0;toe<m.digitCount;toe++){
        const offset=toe-(m.digitCount-1)/2;
        const tipX=padX+offset*.081*m.footWidth;
        const tipZ=padZ+.15*m.toeLength+(toe%2)*.016;
        d=smoothMin(d,taper(x,y,z,padX+offset*.018,.071,padZ+.055,
          tipX,.051,tipZ,.031*m.footWidth,.011*m.footWidth),.028);
        d=smoothMin(d,taper(x,y,z,tipX,.050,tipZ,
          tipX+offset*.018,.030,tipZ+.045*m.clawLength,.014*m.footWidth,.004),.010);
      }
    }
    // Pliegues/orbitas. El detalle ocular óptico se sitúa como submalla legítima.
    const ex=side*.77*a.headRadius*m.skullWidth*m.eyeLateralness;
    const ey=a.headY+.065*m.headSize;
    const ez=a.headZ+.12*m.headSize;
    d=smoothMax(d,-ellipsoid(x,y,z,ex,ey,ez,.047*m.eyeSize,.052*m.eyeSize,.060*m.eyeSize),.018);
    if(m.hornHeight>0){
      d=smoothMin(d,taper(x,y,z,side*.48*a.headRadius,a.headY+.13*m.headSize,a.headZ-.055,
        side*.63*a.headRadius,a.headY+.13*m.headSize+m.hornHeight,a.headZ-.13,
        .064*m.headSize,.007),.045);
    }
  }
  // Cola muscular continua: proporción dominante en varanos y formas alargadas.
  for(let i=0;i<6;i++){
    const t0=i/6,t1=(i+1)/6;
    const p0=a.tailRootZ-(a.tailRootZ-a.tailTipZ)*t0;
    const p1=a.tailRootZ-(a.tailRootZ-a.tailTipZ)*t1;
    const y0=a.bodyY-.045+m.tailCurve*.25*t0-.13*t0*t0;
    const y1=a.bodyY-.045+m.tailCurve*.25*t1-.13*t1*t1;
    const x0=.045*m.tailCurve*t0*t0,x1=.045*m.tailCurve*t1*t1;
    const r0=.18*m.tailThickness*Math.pow(1-t0,.79)+.005;
    const r1=.18*m.tailThickness*Math.pow(1-t1,.79)+.005;
    d=smoothMin(d,taper(x,y,z,x0,y0,p0,x1,y1,p1,r0,r1),.055);
  }
  // Placas de armadura incorporadas en el dorso de la misma superficie.
  if(m.dorsalArmor>.40){
    const f=clamp(1-Math.abs(z)/(.70*m.bodyLength),0,1);
    const ridge=.038*m.dorsalArmor*f*(.60+.40*Math.cos(z*14));
    d=smoothMin(d,ellipsoid(x,y,z,0,a.bodyY+.27*m.bodyDepth+ridge,0,
      .20*m.torsoWidth,.042+.045*m.dorsalArmor,.55*m.bodyLength),.055);
  }
  return d;
}

/** Tamaño de grillado acotado: HIGH está reservado a la ficha individual. */
export const VIDA38_REPTILE_GRID:Readonly<Record<Vida38ReptileQuality,readonly [number,number,number]>>=Object.freeze({
  LOW:[40,36,82],MEDIUM:[54,48,112],HIGH:[70,62,152],
});

const TETS = [
  [0,5,1,6],[0,1,2,6],[0,2,3,6],
  [0,3,7,6],[0,7,4,6],[0,4,5,6],
] as const;

/** Marching tetrahedra indexado; un único volumen anatómico, sin uniones artificiales. */
export function buildVida38ReptileRawMesh38J(morphology: Vida38ReptileMorphologyV1, quality: Vida38ReptileQuality = 'MEDIUM'): Vida38ReptileRawMeshV1 {
  const [nx,ny,nz] = VIDA38_REPTILE_GRID[quality];
  const a=deriveVida38ReptileLandmarks38J(morphology);
  const spreadX=Math.max(1.30,morphology.torsoWidth*.82,
    a.footSpread+.33,a.headRadius*morphology.skullWidth*1.8)+.36;
  const xmin=-spreadX,xmax=spreadX,ymin=-.18;
  const ymax=Math.max(a.bodyY+.76*morphology.bodyDepth,
    a.headY+a.headRadius*1.8+morphology.hornHeight)+.36;
  const zmin=Math.min(a.tailTipZ-.36,-1.1);
  const zmax=Math.max(a.muzzleTipZ+.32,a.headZ+a.headRadius*1.5)+.24;
  const dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1),dz=(zmax-zmin)/(nz-1);
  const id = (i:number,j:number,k:number) => (k*ny+j)*nx+i;
  const field = new Float32Array(nx*ny*nz);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++)
    field[id(i,j,k)] = evaluateVida38ReptileField38J(morphology,xmin+i*dx,ymin+j*dy,zmin+k*dz);

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
    const gx=evaluateVida38ReptileField38J(morphology,x+eps,y,z)-evaluateVida38ReptileField38J(morphology,x-eps,y,z);
    const gy=evaluateVida38ReptileField38J(morphology,x,y+eps,z)-evaluateVida38ReptileField38J(morphology,x,y-eps,z);
    const gz=evaluateVida38ReptileField38J(morphology,x,y,z+eps)-evaluateVida38ReptileField38J(morphology,x,y,z-eps);
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
  if (faces.length===0) throw new Error('VIDA.38.2h: malla mamífera vacía');
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
    revision: VIDA38_REPTILE_MESH_REVISION,
    morphology,
    quality,
    positions: Float32Array.from(finalPositions),
    normals: Float32Array.from(finalNormals),
    uvs: Float32Array.from(finalUvs),
    indices: Uint32Array.from(finalFaces),
    bounds: {min:[xmin,ymin,zmin],max:[xmax,ymax,zmax]},
  };
}

export function auditVida38ReptileRawMesh38J(mesh: Vida38ReptileRawMeshV1): Readonly<{
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

