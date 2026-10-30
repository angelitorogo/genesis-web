/**
 * GENESIS 38.2e — anatomía humanoide procedimental con campo implícito.
 * Unidades locales: altura aproximada 2,74; la escala métrica real procede
 * exclusivamente de VIDA.38.1 y se conserva sin modificar el dato certificado.
 *
 * Archivo deliberadamente sin dependencias de Three ni del DOM: es posible
 * comprobar determinismo, conexión topológica y seguridad numérica en Node.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38HumanoidMorphologyV1,
  type Vida38HumanoidMorphologyProfileV1,
} from './vida38-humanoid-morphology-38-2f';

export const VIDA38_HUMANOID_ORGANIC_REVISION = 'VIDA.38.2e/humanoid-implicit-mesh/v1' as const;
export type Vida38HumanoidQuality = 'LOW' | 'MEDIUM' | 'HIGH';

type V3 = readonly [number, number, number];
type R3 = readonly [number, number, number];

export interface Vida38HumanoidAnatomy {
  readonly revision: typeof VIDA38_HUMANOID_ORGANIC_REVISION;
  /** 38.2f: perfil versionado independiente de pigmentación, aplicado en SDF. */
  readonly morphology: Vida38HumanoidMorphologyProfileV1;
  readonly visualSeed: number;
  readonly speciesId: string;
  readonly lengthMeters: number;
  /** Parámetros de reconstrucción hipotéticos, NO datos biológicos observados. */
  readonly shoulderWidth: number;
  readonly hipWidth: number;
  readonly torsoDepth: number;
  readonly abdomenWidth: number;
  readonly musculature: number;
  readonly headWidth: number;
  readonly headHeight: number;
  readonly headDepth: number;
  readonly cranialShape: number;
  readonly headScale: number;
  readonly neckLength: number;
  readonly neckThickness: number;
  readonly jawWidth: number;
  readonly jawProjection: number;
  readonly faceProjection: number;
  readonly eyeSpacing: number;
  readonly eyeRadius: number;
  readonly browDepth: number;
  readonly torsoLength: number;
  readonly chestWidth: number;
  readonly waistWidth: number;
  readonly pelvisWidth: number;
  readonly muscularity: number;
  readonly bodyMass: number;
  readonly postureLean: number;
  readonly armReach: number;
  readonly upperArmRatio: number;
  readonly forearmRatio: number;
  readonly armThickness: number;
  readonly handSize: number;
  readonly fingerLength: number;
  readonly fingerThickness: number;
  readonly legLength: number;
  readonly thighRatio: number;
  readonly calfRatio: number;
  readonly legThickness: number;
  readonly hipSpacing: number;
  readonly calfVolume: number;
  readonly footLength: number;
  readonly footWidth: number;
  readonly fingerCount: number;
  readonly asymmetry: number;
}

export interface Vida38HumanoidRawMesh {
  readonly revision: typeof VIDA38_HUMANOID_ORGANIC_REVISION;
  readonly anatomy: Vida38HumanoidAnatomy;
  readonly quality: Vida38HumanoidQuality;
  readonly positions: Float32Array;
  readonly normals: Float32Array;
  readonly uvs: Float32Array;
  readonly indices: Uint32Array;
  readonly bounds: { readonly min: V3; readonly max: V3 };
}

function fnv(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}
function unit(seed: number, salt: number): number {
  let x = seed ^ Math.imul(salt + 31, 0x9e3779b9);
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 0xffffffff;
}
const interpolate = (seed: number, salt: number, lo: number, hi: number) => lo + unit(seed, salt) * (hi - lo);
const clamp = (value: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, value));
const length = (x: number, y: number, z: number) => Math.sqrt(x*x + y*y + z*z);

export function deriveVida38HumanoidAnatomy(contract: Vida38SpeciesVisualContract): Vida38HumanoidAnatomy {
  const morphology = deriveVida38HumanoidMorphologyV1(contract);
  // Semilla geométrica independiente de primary/secondary pigment y patrón.
  const seed = morphology.anatomySeed;
  const r = (salt: number, lo: number, hi: number) => interpolate(seed, salt, lo, hi);
  const robust = morphology.bodyMass - 1;
  const cranial = morphology.headScale - 1;
  const musculature = morphology.muscularity;
  return Object.freeze({
    revision: VIDA38_HUMANOID_ORGANIC_REVISION,
    morphology,
    visualSeed: seed,
    speciesId: contract.speciesId,
    lengthMeters: contract.bodyLengthMeters,
    shoulderWidth: clamp(0.37 * morphology.shoulderWidth * morphology.chestWidth, 0.28, 0.50),
    hipWidth: clamp(0.26 * morphology.pelvisWidth, 0.215, 0.34),
    torsoDepth: clamp(0.225 * morphology.chestDepth * (0.92 + morphology.bodyMass * 0.08), 0.18, 0.29),
    abdomenWidth: clamp(0.245 * morphology.waistWidth * morphology.abdomenVolume, 0.19, 0.32),
    musculature: clamp(musculature, 0.76, 1.27),
    muscularity: morphology.muscularity,
    headWidth: clamp(0.245 * morphology.headScale * morphology.skullWidth, 0.19, 0.34),
    headHeight: clamp(0.285 * morphology.headScale * morphology.skullHeight, 0.215, 0.4),
    headDepth: clamp(morphology.skullDepth, 0.85, 1.20),
    cranialShape: morphology.cranialShape,
    headScale: morphology.headScale,
    neckLength: morphology.neckLength,
    neckThickness: morphology.neckThickness,
    jawWidth: clamp(0.175 * morphology.jawWidth * morphology.headScale, 0.135, 0.235),
    jawProjection: morphology.jawProjection,
    faceProjection: clamp(0.10 * morphology.faceProjection, 0.07, 0.135),
    eyeSpacing: clamp(0.102 * morphology.eyeSpacing * morphology.headScale, 0.074, 0.145),
    eyeRadius: clamp(0.043 * morphology.eyeSize * (0.94 + 0.06 * morphology.headScale), 0.033, 0.055),
    browDepth: clamp(0.085 * morphology.browProminence * (1 + 0.12 * cranial), 0.065, 0.12),
    torsoLength: morphology.torsoLength,
    chestWidth: morphology.chestWidth,
    waistWidth: morphology.waistWidth,
    pelvisWidth: morphology.pelvisWidth,
    bodyMass: morphology.bodyMass,
    postureLean: morphology.postureLean,
    armReach: clamp(0.62 * morphology.armLength, 0.51, 0.74),
    upperArmRatio: morphology.upperArmRatio,
    forearmRatio: morphology.forearmRatio,
    armThickness: morphology.armThickness,
    handSize: morphology.handSize,
    fingerLength: morphology.fingerLength,
    fingerThickness: morphology.fingerThickness,
    legLength: clamp(1.10 * morphology.legLength, 0.98, 1.23),
    thighRatio: morphology.thighRatio,
    calfRatio: morphology.calfRatio,
    legThickness: morphology.legThickness,
    hipSpacing: morphology.hipSpacing,
    calfVolume: clamp(0.070 * morphology.legThickness, 0.05, 0.09),
    footLength: clamp(0.26 * morphology.footLength, 0.20, 0.32),
    footWidth: morphology.footWidth,
    // Cantidad de dedos desconocida: hipótesis, nunca modifica VIDA ni su ficha.
    fingerCount: 3 + Math.floor(unit(seed, 14) * 3),
    asymmetry: r(15, -0.012, 0.012),
  });
}

function ellipsoid(px: number, py: number, pz: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): number {
  const x = px - cx, y = py - cy, z = pz - cz;
  const k0 = length(x / rx, y / ry, z / rz);
  const k1 = length(x / (rx*rx), y / (ry*ry), z / (rz*rz));
  return k1 > 1e-8 ? k0*(k0-1)/k1 : -Math.min(rx, ry, rz);
}

function limb(px: number, py: number, pz: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, ra: number, rb: number): number {
  const dx = bx-ax, dy=by-ay, dz=bz-az;
  const t = clamp(((px-ax)*dx+(py-ay)*dy+(pz-az)*dz)/(dx*dx+dy*dy+dz*dz),0,1);
  const radius = ra + (rb-ra)*t;
  return length(px-ax-dx*t,py-ay-dy*t,pz-az-dz*t)-radius;
}
function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a-b), 0) / k;
  return Math.min(a,b) - h*h*k*0.25;
}
function smax(a: number, b: number, k: number): number { return -smin(-a,-b,k); }

/** Campo de DISTANCIA FIRMADA: superficie = 0; interior < 0. */
export function evaluateVida38HumanoidField(a: Vida38HumanoidAnatomy, x: number, y: number, z: number): number {
  // Para que todas las partes se fusionen en UNA superficie cerrada, las
  // transiciones hueso/músculo/piel proceden de un único campo escalar.
  const p = a.legLength;
  // 38.2f: deformar el CAMPO en su dominio, antes de Marching Tetrahedra.
  // No se escalan objetos separados, se modifica una única isosuperficie.
  const lean = a.postureLean * Math.max(0, y - p);
  z -= lean;
  if (y > p) y = p + (y - p) / a.torsoLength;
  const neckOffset = (a.neckLength - 1) * 0.14;
  const headY = y - neckOffset;
  const kneeY = p * clamp(0.56 - (a.thighRatio - 1) * 0.13 + (a.calfRatio - 1) * 0.08, 0.53, 0.59);
  let d = ellipsoid(x,y,z,0,p+0.43,0,a.shoulderWidth*1.07,0.45,a.torsoDepth);
  d = smin(d,ellipsoid(x,y,z,0,p+0.16,0,a.abdomenWidth*0.94,0.305*a.morphology.abdomenVolume,a.torsoDepth*0.83),0.16);
  d = smin(d,ellipsoid(x,y,z,0,p-0.04,-0.012,a.hipWidth*1.08,0.21,a.torsoDepth*0.95),0.13);
  d = smin(d,limb(x,y,z,0,p+0.73,-0.01,0,p+0.98+neckOffset,0,0.115*a.neckThickness,0.085*a.neckThickness),0.10);
  // Cráneo, mandíbula y estructuras del rostro integrados antes de extraer malla.
  d = smin(d,ellipsoid(x,headY,z,0,p+1.22,-0.025,a.headWidth,a.headHeight,a.headWidth*0.90*a.headDepth),0.13);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.055,0.075*a.jawProjection,a.jawWidth,0.142*a.headScale,a.headWidth*0.82*a.headDepth),0.12);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.19,a.faceProjection,a.headWidth*0.86,0.19*a.headScale,0.105*a.jawProjection),0.09);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.155+0.06*a.cranialShape,0.22+a.faceProjection*0.12,0.05,0.128*a.headScale,0.079*a.morphology.faceProjection),0.07);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.095,0.27+a.faceProjection*0.12,0.065,0.042*a.headScale,0.052),0.032);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.00,0.151*a.jawProjection,a.jawWidth*0.63,0.058,0.095*a.jawProjection),0.05);
  // Ligero volumen pectoral integrado y continuidad dorsal en el tronco.
  for (const side of [-1,1]) {
    d = smin(d,ellipsoid(x,y,z,side*a.shoulderWidth*0.40,p+0.55,a.torsoDepth*0.62,
      a.shoulderWidth*0.40,0.18*a.musculature,0.103*a.chestWidth),0.082);
  }
  for (const side of [-1,1]) {
    const sx = side * a.eyeSpacing;
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth*0.76,p+1.19,-0.025,0.065*a.headScale,0.12*a.headScale,0.055*a.headDepth),0.07);
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth*0.70,p+1.075,-0.028,0.047*a.headScale,0.067*a.headScale,0.049),0.037);
    d = smin(d,ellipsoid(x,headY,z,side*a.eyeSpacing*1.38,p+1.10,0.14,0.079,0.087,0.077),0.043);
    d = smin(d,ellipsoid(x,headY,z,sx,p+1.25,0.212,0.086*a.headScale,0.036*a.morphology.browProminence,0.052),0.033);
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth,p+1.13,-0.035,0.041*a.headScale,0.085*a.headScale,0.034),0.034);

    const shoulderX = side*a.shoulderWidth;
    const elbowX = side*(a.shoulderWidth+0.095);
    const wristX = side*(a.shoulderWidth+0.12);
    const elbowY = p+0.25-(a.upperArmRatio-1)*0.08;
    const wristY = p+0.64-a.armReach-(a.forearmRatio-1)*0.04;
    d = smin(d,ellipsoid(x,y,z,shoulderX*0.85,p+0.64,0,0.15*a.musculature*a.armThickness,0.17,0.135),0.145);
    d = smin(d,limb(x,y,z,shoulderX*0.91,p+0.64,0,elbowX,elbowY,0.015,
      0.114*a.musculature*a.armThickness,0.073*a.musculature*a.armThickness),0.09);
    d = smin(d,limb(x,y,z,elbowX,elbowY+0.02,0.015,wristX,wristY,0.026,
      0.077*a.musculature*a.armThickness,0.048*a.armThickness),0.07);
    const handY = p+0.55-a.armReach;
    d = smin(d,ellipsoid(x,y,z,wristX+side*0.015,handY,0.043,0.069*a.handSize,0.13*a.handSize,0.065*a.handSize),0.07);
    const fingers = a.fingerCount;
    for(let i=0; i<fingers; i++) {
      const fx = wristX+side*(0.01+(i-(fingers-1)*0.5)*0.024);
      const fz = 0.047+(i-(fingers-1)*0.5)*0.018;
      d = smin(d,limb(x,y,z,fx,handY-0.068*a.handSize,fz,fx+side*(i-(fingers-1)/2)*0.012,handY-(0.19+(i%2)*0.013)*a.fingerLength,fz+0.023,0.026*a.fingerThickness,0.017*a.fingerThickness),0.022);
    }
    // Pulgar o apéndice prensil: hipótesis visual en especies bípedas.
    d = smin(d,limb(x,y,z,wristX-side*0.05,handY+0.01,0.10,wristX-side*0.095,handY-0.075,0.15,0.031,0.02),0.032);

    const hipX = side*a.hipWidth*0.61*a.hipSpacing;
    const kneeX = hipX+side*0.008;
    const ankleX = hipX+side*0.018;
    d = smin(d,ellipsoid(x,y,z,hipX,p-0.055,-0.04,0.14*a.musculature*a.legThickness,0.17,0.13),0.12);
    d = smin(d,limb(x,y,z,hipX,p-0.10,0,kneeX,kneeY,0.07,
      0.132*a.musculature*a.legThickness,0.089*a.musculature*a.legThickness),0.095);
    d = smin(d,limb(x,y,z,kneeX,kneeY+0.012,0.065,ankleX,0.15,0.02,
      a.calfVolume*1.5,a.calfVolume*0.70),0.085);
    d = smin(d,ellipsoid(x,y,z,ankleX,0.15,0.024,0.060,0.11,0.064),0.065);
    d = smin(d,ellipsoid(x,y,z,ankleX,0.072,0.11,0.103*a.footWidth,0.084,a.footLength*0.69),0.080);
    for(let i=0;i<4;i++) {
      const tx = ankleX+(i-1.5)*0.042;
      d = smin(d,limb(x,y,z,tx,0.055,0.22,tx,0.055,0.32-(i%2)*0.012,0.026,0.018),0.032);
    }
  }
  // Labios / órbitas y oídos integrados por sustracción; no mallas pegadas.
  for(const side of [-1,1]) {
    d = smax(d,-ellipsoid(x,headY,z,side*a.eyeSpacing,p+1.18,0.248+a.faceProjection*0.12,
      a.eyeRadius*1.10,a.eyeRadius*0.81,0.075),0.016);
    d = smax(d,-ellipsoid(x,headY,z,side*a.eyeSpacing*0.68,p+1.09,0.29+a.faceProjection*0.12,
      0.014,0.014,0.029),0.008); // fosa nasal
    d = smax(d,-ellipsoid(x,headY,z,side*a.headWidth*1.09,p+1.13,0.004,0.012,0.044,0.031),0.006);
  }
  d = smax(d,-ellipsoid(x,headY,z,0,p+1.00,0.247,
    a.jawWidth*0.67,0.014,0.035),0.008); // surco bucal
  // No aleatorizar la superficie con ruido de alta amplitud: el relieve biológico
  // fino pertenece a los materiales y no debe erosionar la anatomía principal.
  return d;
}

export const VIDA38_HUMANOID_GRID: Readonly<Record<Vida38HumanoidQuality, readonly [number,number,number]>> = Object.freeze({
  LOW: [36, 70, 29], MEDIUM: [52, 103, 42], HIGH: [68, 134, 55],
});

const TETS = [
  [0,5,1,6],[0,1,2,6],[0,2,3,6],
  [0,3,7,6],[0,7,4,6],[0,4,5,6],
] as const;

/** Marching tetrahedra indexado; un único volumen anatómico, sin uniones artificiales. */
export function buildVida38HumanoidRawMesh(anatomy: Vida38HumanoidAnatomy, quality: Vida38HumanoidQuality = 'MEDIUM'): Vida38HumanoidRawMesh {
  const [nx,ny,nz] = VIDA38_HUMANOID_GRID[quality];
  const ymax=Math.max(2.95,
    anatomy.legLength + (1.22 + anatomy.headHeight * 1.35 + (anatomy.neckLength-1)*0.14) * anatomy.torsoLength + 0.10);
  const [xmin,xmax,ymin,zmin,zmax] = [-0.96,0.96,-0.15,-0.72,0.77];
  const dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1),dz=(zmax-zmin)/(nz-1);
  const id = (i:number,j:number,k:number) => (k*ny+j)*nx+i;
  const field = new Float32Array(nx*ny*nz);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++)
    field[id(i,j,k)] = evaluateVida38HumanoidField(anatomy,xmin+i*dx,ymin+j*dy,zmin+k*dz);

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
    const gx=evaluateVida38HumanoidField(anatomy,x+eps,y,z)-evaluateVida38HumanoidField(anatomy,x-eps,y,z);
    const gy=evaluateVida38HumanoidField(anatomy,x,y+eps,z)-evaluateVida38HumanoidField(anatomy,x,y-eps,z);
    const gz=evaluateVida38HumanoidField(anatomy,x,y,z+eps)-evaluateVida38HumanoidField(anatomy,x,y,z-eps);
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

export function auditVida38HumanoidRawMesh(mesh: Vida38HumanoidRawMesh): Readonly<{
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

/** Geometría real: el factor métrico deriva del tamaño VIDA, no de la cámara. */
export function measureVida38HumanoidMeshV1(mesh: Vida38HumanoidRawMesh): Readonly<{
  heightUnits: number;
  widthUnits: number;
  depthUnits: number;
  metersPerUnit: number;
  actualHeightMeters: number;
  widthToHeight: number;
  headToBodyRatio: number;
  armToBodyRatio: number;
  legToBodyRatio: number;
  shoulderToHipRatio: number;
}> {
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for(let i=0;i<mesh.positions.length;i+=3){
    const x=mesh.positions[i]!,y=mesh.positions[i+1]!,z=mesh.positions[i+2]!;
    minX=Math.min(minX,x);minY=Math.min(minY,y);minZ=Math.min(minZ,z);
    maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);maxZ=Math.max(maxZ,z);
  }
  const height=Math.max(1e-8,maxY-minY);
  const a=mesh.anatomy;
  const headRegion=(1.22+a.headHeight+(a.neckLength-1)*0.14)*a.torsoLength;
  return Object.freeze({
    heightUnits: height, widthUnits: maxX-minX, depthUnits: maxZ-minZ,
    metersPerUnit: a.lengthMeters/height,
    actualHeightMeters: a.lengthMeters,
    widthToHeight: (maxX-minX)/height,
    headToBodyRatio: (a.headHeight*2*a.torsoLength)/height,
    armToBodyRatio: (a.armReach*a.torsoLength)/height,
    legToBodyRatio: a.legLength/height,
    shoulderToHipRatio: a.shoulderWidth/Math.max(1e-8,a.hipWidth),
  });
}
