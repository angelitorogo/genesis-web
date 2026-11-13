/**
 * GENESIS 38.2h — campo anatómico mamífero especializado, sin Three.js/DOM.
 * Esqueleto cuadrúpedo genuino; no rotación del SDF humanoide.
 * Cuerpo, cabeza, cuello, patas, dedos, orejas, cola y órganos hipotéticos
 * son una única superficie implícita cerrada.
 */
import type { Vida38MammalMorphologyV1 } from './vida38-mammal-morphology-38-2h';

export const VIDA38_MAMMAL_MESH_REVISION='VIDA.38.2h/mammal-organic-field/v1' as const;
export type Vida38MammalQuality='LOW'|'MEDIUM'|'HIGH';
type V3=readonly [number,number,number];
export interface Vida38MammalRawMeshV1 {
  readonly revision:typeof VIDA38_MAMMAL_MESH_REVISION;
  readonly morphology:Vida38MammalMorphologyV1;
  readonly quality:Vida38MammalQuality;
  readonly positions:Float32Array;
  readonly normals:Float32Array;
  readonly uvs:Float32Array;
  readonly indices:Uint32Array;
  readonly bounds:Readonly<{min:V3;max:V3}>;
}
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const length=(x:number,y:number,z:number)=>Math.sqrt(x*x+y*y+z*z);
function smoothMin(a:number,b:number,k:number):number {
  if(k<=0)return Math.min(a,b);
  const h=clamp(.5+.5*(b-a)/k,0,1);
  return b*(1-h)+a*h-k*h*(1-h);
}
function smoothMax(a:number,b:number,k:number):number{return -smoothMin(-a,-b,k);}
function ellipse(x:number,y:number,z:number,cx:number,cy:number,cz:number,rx:number,ry:number,rz:number):number {
  const xx=x-cx, yy=y-cy, zz=z-cz;
  const k0=length(xx/rx,yy/ry,zz/rz);
  const k1=length(xx/(rx*rx),yy/(ry*ry),zz/(rz*rz));
  return k1>1e-9?k0*(k0-1)/k1:-Math.min(rx,ry,rz);
}
function taper(x:number,y:number,z:number,ax:number,ay:number,az:number,bx:number,by:number,bz:number,ra:number,rb:number):number {
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  const t=clamp(((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/Math.max(1e-8,dx*dx+dy*dy+dz*dz),0,1);
  const r=ra+(rb-ra)*t;
  return length(x-ax-dx*t,y-ay-dy*t,z-az-dz*t)-r;
}
export interface Vida38MammalLandmarksV1 {
  readonly bodyY:number;
  readonly headX:number;
  readonly headY:number;
  readonly headZ:number;
  readonly headRadius:number;
  readonly shoulderZ:number;
  readonly hipZ:number;
  readonly feetX:number;
  readonly muzzleZ:number;
}
export function deriveVida38MammalLandmarksV1(m:Vida38MammalMorphologyV1):Vida38MammalLandmarksV1 {
  const bodyY=.28+.65*m.legHeight+.38*m.bodyHeight;
  const shoulderZ=m.bodyLength*.53;
  const hipZ=-m.bodyLength*.53;
  const headZ=m.bodyLength*.70 +m.neckLength*.53+.26*m.headScale;
  const headY=bodyY+m.bodyHeight*.13+m.neckLength*(m.archetype==='CERVID'?.53:m.archetype==='LEAPER'?.19:.24);
  const headRadius=.29*m.headScale;
  return Object.freeze({bodyY,headX:0,headY,headZ,headRadius,shoulderZ,hipZ,
    feetX:.32*m.torsoWidth, muzzleZ:headZ+headRadius*.66+.31*m.headScale*m.muzzleLength});
}

/** Campo continuo, negativo dentro del organismo. Unidades visuales no VIDA. */
export function evaluateVida38MammalFieldV1(m:Vida38MammalMorphologyV1,x:number,y:number,z:number):number {
  const a=deriveVida38MammalLandmarksV1(m);
  const bodyY=a.bodyY;
  const frontZ=a.shoulderZ, rearZ=a.hipZ;
  const bodyZ=m.bodyLength*.02;
  let d=ellipse(x,y,z,0,bodyY,bodyZ,
    .43*m.torsoWidth,.38*m.bodyHeight,.76*m.bodyLength);
  const c=ellipse(x,y,z,0,bodyY+.02*m.shoulderRise,frontZ,
    .435*m.chestWidth,.39*m.bodyHeight*m.shoulderRise,.37*m.bodyLength);
  d=smoothMin(d,c,.22);
  d=smoothMin(d,ellipse(x,y,z,0,bodyY-.07,rearZ,
    .40*m.abdomenWidth,.34*m.bodyHeight*m.hipRise,.33*m.bodyLength),.20);
  // Dorso, prominencia escapular y musculatura glútea.
  d=smoothMin(d,ellipse(x,y,z,0,bodyY+.21*m.bodyHeight,frontZ*.85,
    .34*m.chestWidth,.22*m.bodyHeight,.27*m.bodyLength),.19);
  d=smoothMin(d,ellipse(x,y,z,0,bodyY+.15*m.bodyHeight,rearZ*.88,
    .35*m.abdomenWidth,.18*m.bodyHeight,.25*m.bodyLength),.17);
  // 38.2h: relieves anatómicos específicos — no solo proporciones escaladas.
  if(m.archetype==='BOVID'||m.archetype==='URSID'){
    d=smoothMin(d,ellipse(x,y,z,0,bodyY+.29*m.bodyHeight,frontZ*.90,
      .34*m.chestWidth,.24*m.bodyHeight,.29*m.bodyLength),.15);
  }
  if(m.archetype==='HIPPOPOTAMOID'){
    d=smoothMin(d,ellipse(x,y,z,0,bodyY-.23*m.bodyHeight,bodyZ-.06,
      .43*m.abdomenWidth,.25*m.bodyHeight,.51*m.bodyLength),.19);
  }
  if(m.archetype==='FELID'){
    d=smoothMin(d,ellipse(x,y,z,0,bodyY-.04,rearZ*.83,
      .34*m.abdomenWidth,.29*m.bodyHeight,.29*m.bodyLength),.13);
  }
  // Cuello oblicuo funcional y continuidad con el cráneo.
  const neckY=bodyY+m.bodyHeight*.14;
  d=smoothMin(d,taper(x,y,z,0,neckY,frontZ*.95,0,a.headY-.08*m.headScale,
    a.headZ-.18*m.headScale,.20*m.neckWidth,.15*m.neckWidth),.20);
  d=smoothMin(d,ellipse(x,y,z,0,a.headY,a.headZ,
    a.headRadius*m.skullWidth,a.headRadius*.93,a.headRadius*m.skullLength),.12);
  const jawY=a.headY-.15*m.headScale;
  d=smoothMin(d,ellipse(x,y,z,0,jawY,a.headZ+.10*m.headScale,
    .19*m.headScale*m.muzzleWidth,.13*m.headScale*m.jawDepth,.27*m.headScale*m.skullLength),.09);
  // Hocico y mandíbula: mayor diferencia caniforme/bóvida/proboscídea.
  const noseZ=a.muzzleZ;
  d=smoothMin(d,taper(x,y,z,0,a.headY-.095*m.headScale,a.headZ+.11*m.headScale,
    0,a.headY-.17*m.headScale,noseZ,
    .20*m.headScale*m.muzzleWidth,.13*m.headScale*m.muzzleWidth),.13);
  d=smoothMin(d,ellipse(x,y,z,0,a.headY-.155*m.headScale,noseZ,
    .134*m.headScale*m.muzzleWidth,.108*m.headScale,.13*m.headScale),.055);
  d=smoothMin(d,ellipse(x,y,z,0,a.headY-.24*m.headScale,noseZ-.11*m.headScale,
    .13*m.headScale*m.muzzleWidth,.08*m.headScale*m.jawDepth,.18*m.headScale),.048);
  // Patas: anclaje muscular en hombro/pelvis, codos/carpos/tarso y dedos.
  const support=m.support;
  const rearThigh = m.rearLegThickness * m.muscle;
  const frontThigh = m.frontLegThickness * m.muscle;
  for(const side of [-1,1]) {
    const sx=side*.35*m.torsoWidth;
    for(let index=0;index<2;index++) {
      const front=index===0;
      const legZ=front?frontZ:rearZ;
      const thickness=front?frontThigh:rearThigh;
      const upperY=bodyY-(front?.065:-.055)*m.bodyHeight;
      const kneeY=.23+.43*m.legHeight +(!front?m.hindLegBias:.0);
      const kneeZ=legZ+(front?-.08:.16)*m.legHeight;
      const ankleZ=legZ+(front?.10:-.12)*m.legHeight;
      const distal= support==='UNGULIGRADE'?.080:.11;
      const footY=.095;
      d=smoothMin(d,ellipse(x,y,z,sx*.91,upperY,legZ,
        .18*thickness,.23*m.bodyHeight,.23*m.bodyLength),.14);
      d=smoothMin(d,taper(x,y,z,sx,upperY,legZ,sx*1.025,kneeY,kneeZ,
        .145*thickness,.105*thickness),.105);
      // Pantorrilla/repliegue posterior del jarrete o antebrazo anterior.
      const ankleX=sx*1.04;
      d=smoothMin(d,taper(x,y,z,sx*1.025,kneeY,kneeZ,ankleX,footY+.11,ankleZ,
        .102*thickness,distal*thickness),.072);
      d=smoothMin(d,ellipse(x,y,z,ankleX,.105,ankleZ+.055,
        .11*thickness,.095, support==='PLANTIGRADE'?.22:.16),.057);
      // Segmentos digitales integrados en el mismo campo (sin cilindros sueltos).
      const count=m.digitCount;
      for(let t=0;t<count;t++){
        const offset=t-(count-1)/2;
        const toeX=ankleX+offset*(support==='UNGULIGRADE'?.075:.055);
        const toeZ=ankleZ+.135+(t%2)*.012;
        d=smoothMin(d,taper(x,y,z,ankleX+offset*.025,.088,ankleZ+.11,
          toeX,.078,toeZ+.09,
          .045*thickness,.027*thickness),.028);
      }
    }
    // Orejas de familia variable: roedor redondeado, cánido triangular,
    // herbívoro lateral, proboscídeo muy ancho, saltador alargado.
    const earX=side*a.headRadius*.82*m.skullWidth;
    const earY=a.headY+.14*m.headScale;
    const earZ=a.headZ-.13*m.headScale;
    const rounded=['RODENT','URSID','MUSTELID','HIPPOPOTAMOID','PRIMATOID'].includes(m.archetype);
    const lateral=['BOVID','CERVID','PROBOSCIDEAN'].includes(m.archetype);
    if(rounded){
      const roundedSize=m.archetype==='HIPPOPOTAMOID'?.61:1;
      d=smoothMin(d,ellipse(x,y,z,earX*1.12,earY+.055*m.earSize,earZ,
        .10*m.headScale*m.earSize*roundedSize,.11*m.headScale*m.earSize*roundedSize,
        .044*m.headScale),.065);
    }else if(lateral){
      const earReach=m.archetype==='PROBOSCIDEAN'?.38:.24;
      d=smoothMin(d,taper(x,y,z,earX*.81,earY,earZ,earX+side*earReach*m.earSize,earY+.035*m.earSize,earZ-.07,
        .09*m.headScale,.045*m.headScale),.074);
      d=smoothMin(d,ellipse(x,y,z,earX+side*earReach*m.earSize*.63,earY+.02*m.earSize,earZ-.065,
        .18*m.headScale*m.earSize,(m.archetype==='PROBOSCIDEAN'?.18:.09)*m.earSize,
        .055*m.headScale),.07);
    }else{
      const lengthFactor=m.archetype==='LEAPER'?1.52:m.archetype==='CANID'?1.0:.78;
      d=smoothMin(d,taper(x,y,z,earX*.85,earY-.025*m.headScale,earZ,
        earX*1.20,earY+.22*m.earSize*lengthFactor,earZ-.05*m.earAspect,
        .095*m.headScale,.016*m.headScale),.066);
      d=smoothMin(d,ellipse(x,y,z,earX*1.18,earY+.105*m.earSize*lengthFactor,earZ-.045,
        .060*m.headScale*m.earSize,.115*m.earSize*lengthFactor,.043*m.headScale),.052);
    }
    // Cuernos, defensas, estructuras reconstruidas SOLO en arquetipos compatibles.
    if(m.hornSize>0){
      d=smoothMin(d,taper(x,y,z,side*a.headRadius*.62,a.headY+.19*m.headScale,a.headZ-.05*m.headScale,
        side*a.headRadius*.82,a.headY+.19*m.headScale+m.hornSize,a.headZ-.14*m.headScale,
        .075*m.headScale,.008),.048);
    }
    if(m.tuskSize>0){
      d=smoothMin(d,taper(x,y,z,side*.15*m.headScale,a.headY-.22*m.headScale,noseZ-.08*m.headScale,
        side*.24*m.headScale,a.headY-.04*m.headScale,noseZ+.15*m.headScale+m.tuskSize,
        .061*m.headScale,.008),.045);
    }
  }
  if(m.trunkLength>0){
    const baseY=a.headY-.15*m.headScale;
    const front=noseZ-.01*m.headScale;
    d=smoothMin(d,taper(x,y,z,0,baseY,front,0,baseY-.32*m.trunkLength,front+.20*m.trunkLength,
      .118*m.headScale,.086*m.headScale),.085);
    d=smoothMin(d,taper(x,y,z,0,baseY-.32*m.trunkLength,front+.20*m.trunkLength,
      .07*m.trunkLength,baseY-m.trunkLength,front+.16*m.trunkLength,
      .087*m.headScale,.036*m.headScale),.055);
  }
  // Cola segmentada orgánica desde pelvis, ausente en algunas especies.
  if(m.tailLength>.08){
    const root=-.68*m.bodyLength,tailY=bodyY+.05*m.bodyHeight;
    const tailLen=m.tailLength;
    for(let i=0;i<5;i++){
      const t0=i/5,t1=(i+1)/5;
      const z0=root-tailLen*t0,z1=root-tailLen*t1;
      const y0=tailY+(.18*m.tailCurve*t0-.24*t0*t0),y1=tailY+(.18*m.tailCurve*t1-.24*t1*t1);
      const r0=.12*m.tailWidth*Math.pow(1-t0,.70)+.006;
      const r1=.12*m.tailWidth*Math.pow(1-t1,.70)+.006;
      d=smoothMin(d,taper(x,y,z,0,y0,z0,0,y1,z1,r0,r1),.042);
    }
  }
  // Órbitas excavadas en la propia superficie facial; dientes/ojos visibles
  // se añaden exclusivamente como estructuras separables justificadas.
  for(const side of [-1,1]) {
    const ex=side*a.headRadius*.71*m.eyeSeparation;
    const ey=a.headY+.095*m.headScale;
    const ez=a.headZ+.105*m.headScale;
    d=smoothMax(d,-ellipse(x,y,z,ex,ey,ez,.064*m.eyeRadius,.051*m.eyeRadius,.072*m.eyeRadius),.018);
  }
  // Microasimetría anatómica, no ruido granular destructivo.
  return d;
}

/** Tamaño de grillado acotado: HIGH está reservado a la ficha individual. */
export const VIDA38_MAMMAL_GRID:Readonly<Record<Vida38MammalQuality,readonly [number,number,number]>>=Object.freeze({
  LOW:[42,40,74],MEDIUM:[56,52,102],HIGH:[74,68,136],
});

const TETS = [
  [0,5,1,6],[0,1,2,6],[0,2,3,6],
  [0,3,7,6],[0,7,4,6],[0,4,5,6],
] as const;

/** Marching tetrahedra indexado; un único volumen anatómico, sin uniones artificiales. */
export function buildVida38MammalRawMeshV1(morphology: Vida38MammalMorphologyV1, quality: Vida38MammalQuality = 'MEDIUM'): Vida38MammalRawMeshV1 {
  const [nx,ny,nz] = VIDA38_MAMMAL_GRID[quality];
  const a=deriveVida38MammalLandmarksV1(morphology);
  const spreadX = Math.max(.90, morphology.chestWidth*.69, morphology.abdomenWidth*.70,
    a.headRadius * morphology.skullWidth * 1.8,
    a.headRadius * morphology.skullWidth + .48*morphology.earSize) + .32;
  const ymin=-.26;
  const ymax=Math.max(a.headY+a.headRadius*1.8, a.bodyY+.70*morphology.bodyHeight,
    a.headY+.25*morphology.headScale+.36*morphology.earSize,
    a.headY+.30*morphology.headScale+morphology.hornSize)+.23;
  const xmin=-spreadX,xmax=spreadX;
  const zmin=Math.min(-morphology.bodyLength*1.04-morphology.tailLength-.35,-1.3);
  const zmax=Math.max(a.muzzleZ+.5, a.headZ+.65*morphology.headScale,
    a.muzzleZ+morphology.tuskSize+.35)+.28;
  const dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1),dz=(zmax-zmin)/(nz-1);
  const id = (i:number,j:number,k:number) => (k*ny+j)*nx+i;
  const field = new Float32Array(nx*ny*nz);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++)
    field[id(i,j,k)] = evaluateVida38MammalFieldV1(morphology,xmin+i*dx,ymin+j*dy,zmin+k*dz);

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
    const gx=evaluateVida38MammalFieldV1(morphology,x+eps,y,z)-evaluateVida38MammalFieldV1(morphology,x-eps,y,z);
    const gy=evaluateVida38MammalFieldV1(morphology,x,y+eps,z)-evaluateVida38MammalFieldV1(morphology,x,y-eps,z);
    const gz=evaluateVida38MammalFieldV1(morphology,x,y,z+eps)-evaluateVida38MammalFieldV1(morphology,x,y,z-eps);
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
    revision: VIDA38_MAMMAL_MESH_REVISION,
    morphology,
    quality,
    positions: Float32Array.from(finalPositions),
    normals: Float32Array.from(finalNormals),
    uvs: Float32Array.from(finalUvs),
    indices: Uint32Array.from(finalFaces),
    bounds: {min:[xmin,ymin,zmin],max:[xmax,ymax,zmax]},
  };
}

export function auditVida38MammalRawMeshV1(mesh: Vida38MammalRawMeshV1): Readonly<{
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

