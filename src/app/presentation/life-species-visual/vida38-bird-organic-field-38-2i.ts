/**
 * GENESIS 38.2i.a — anatomía aviar refinada y más diversa.
 * Anatomía específica de aves (no cuadrúpedo girado), continua y determinista.
 * La superficie principal es una única malla orgánica; las plumas visibles
 * adicionales constituyen apéndices queratínicos, no articulaciones esféricas.
 */
import type { Vida38BirdMorphologyV1 } from './vida38-bird-morphology-38-2i';

export const VIDA38_BIRD_MESH_REVISION='VIDA.38.2i.a.2b/bird-organic-field/v3' as const;
export type Vida38BirdQuality='LOW'|'MEDIUM'|'HIGH';
type V3=readonly [number,number,number];
export interface Vida38BirdRawMeshV1 {
  readonly revision:typeof VIDA38_BIRD_MESH_REVISION;
  readonly morphology:Vida38BirdMorphologyV1;
  readonly quality:Vida38BirdQuality;
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
function ellipsoid(x:number,y:number,z:number,cx:number,cy:number,cz:number,rx:number,ry:number,rz:number):number {
  const xx=x-cx,yy=y-cy,zz=z-cz;
  const k0=length(xx/rx,yy/ry,zz/rz), k1=length(xx/(rx*rx),yy/(ry*ry),zz/(rz*rz));
  return k1>1e-9?k0*(k0-1)/k1:-Math.min(rx,ry,rz);
}
function taper(x:number,y:number,z:number,ax:number,ay:number,az:number,bx:number,by:number,bz:number,ra:number,rb:number):number {
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  const t=clamp(((x-ax)*dx+(y-ay)*dy+(z-az)*dz)/Math.max(1e-9,dx*dx+dy*dy+dz*dz),0,1);
  return length(x-ax-dx*t,y-ay-dy*t,z-az-dz*t)-(ra+(rb-ra)*t);
}
export interface Vida38BirdLandmarksV1 {
  readonly bodyY:number;
  readonly bodyFrontZ:number;
  readonly headY:number;
  readonly headZ:number;
  readonly headRadius:number;
  readonly billTipZ:number;
  readonly billTipY:number;
  readonly wingRootX:number;
  readonly wingRootY:number;
  readonly wingRootZ:number;
  readonly wingElbowX:number;
  readonly wingElbowZ:number;
  readonly wingTipX:number;
  readonly wingTipZ:number;
  readonly wingTipY:number;
  readonly footX:number;
  readonly shoulderZ:number;
}
/** Puntos del esqueleto aviar: la articulación visible es el corvejón,
 * no una rodilla humana invertida. El fémur permanece cerca del torso. */
export interface Vida38BirdLegLandmarks38IA {
  readonly hip:V3;
  readonly knee:V3;
  readonly hock:V3;
  readonly ankle:V3;
  readonly frontToes:readonly V3[];
  readonly hallux:V3;
}
const legCache=new WeakMap<Vida38BirdMorphologyV1,readonly [Vida38BirdLegLandmarks38IA,Vida38BirdLegLandmarks38IA]>();
export function deriveVida38BirdLegLandmarks38IA(m:Vida38BirdMorphologyV1,side:-1|1):Vida38BirdLegLandmarks38IA {
  const cached=legCache.get(m);if(cached)return cached[side<0?0:1];
  const first=makeVida38BirdLegLandmarks38IA(m,-1);
  const second=makeVida38BirdLegLandmarks38IA(m,1);
  legCache.set(m,[first,second]);return side<0?first:second;
}
function makeVida38BirdLegLandmarks38IA(m:Vida38BirdMorphologyV1,side:-1|1):Vida38BirdLegLandmarks38IA {
  const a=deriveVida38BirdLandmarks38I(m);
  const x=side*a.footX;
  const hipY=a.bodyY-.20*m.bodyDepth;
  const hipZ=-.12*m.bodyLength;
  const leg=m.legLength;
  const kneeY=hipY-.16*leg;
  const kneeZ=hipZ+.08*leg;
  const hockY=Math.min(kneeY-.10*leg,.14+.28*leg*m.tarsusLength);
  const hockZ=hipZ-.09*leg*m.hockFlexion;
  const ankleZ=hipZ+.085*leg;
  const ankleX=x*1.06;
  const spread=.108*m.toeSplay*m.toeLength;
  const toeLength=.22*m.toeLength;
  const frontToes:V3[]=[
    [ankleX-spread,.050,ankleZ+toeLength*.85],
    [ankleX,.050,ankleZ+toeLength*1.12],
    [ankleX+spread,.050,ankleZ+toeLength*.85],
  ];
  const hallux:V3=[ankleX-side*.032,.052,ankleZ-.18*m.halluxLength*m.toeLength];
  // Tipar explícitamente cada punto como V3 evita que TypeScript infiera number[].
  // No altera las coordenadas ni la geometría aprobada de 38.2i.a.
  const hip:V3=[x,hipY,hipZ];
  const knee:V3=[x*1.04,kneeY,kneeZ];
  const hock:V3=[x*1.08,hockY,hockZ];
  const ankle:V3=[ankleX,.115,ankleZ];
  return Object.freeze({hip,knee,hock,ankle,frontToes,hallux});
}

const landmarkCache=new WeakMap<Vida38BirdMorphologyV1,Vida38BirdLandmarksV1>();
export function deriveVida38BirdLandmarks38I(m:Vida38BirdMorphologyV1):Vida38BirdLandmarksV1 {
  const cached=landmarkCache.get(m);if(cached)return cached;
  const bodyY=.49+m.legLength*.50;
  const bodyFrontZ=.27*m.bodyLength;
  const neckOffset=(m.archetype==='WADER'?.66:m.archetype==='CURSORIAL'?.56:.47)*m.neckLength;
  const headY=bodyY+.16*m.bodyDepth+neckOffset;
  const headZ=.31*m.bodyLength+.16*m.neckLength;
  const headRadius=.245*m.headSize;
  const longBill=m.billKind==='LONG'||m.billKind==='SPEAR';
  // 38.2i.a.2b: la punta debe quedar fuera del cráneo incluso con un pico
  // muy corto y una cabeza muy grande. El parche anterior solo añadió masa
  // premaxilar sin asegurar esa proyección, por eso algunos rostros desaparecían.
  const cranialFrontZ=headZ+headRadius*1.12;
  const proceduralTipZ=headZ+.19*m.headSize+(longBill?.40:.30)*m.billLength;
  const visibleBillExtension=Math.max(.145*m.headSize,.12*m.billLength);
  const billTipZ=Math.max(proceduralTipZ,cranialFrontZ+visibleBillExtension);
  const billTipY=headY-.07*m.headSize-m.billCurve*(m.billKind==='HOOKED'?.28:.16);
  const wingRootX=.26*m.bodyWidth;
  const wingRootY=bodyY+.11*m.bodyDepth;
  const wingRootZ=.13*m.bodyLength;
  const wingElbowX=wingRootX+.24*m.wingSpan*(.45+m.wingSpread*.55);
  const wingElbowZ=wingRootZ-.22*m.bodyLength*m.wingSweep;
  const wingTipX=wingRootX+.47*m.wingSpan*(.48+m.wingSpread*.70);
  const wingTipZ=wingRootZ-.53*m.bodyLength*m.wingSweep-.12*m.wingSpan;
  const wingTipY=wingRootY+.06*m.wingSpread-.10+m.wingLift;
  const landmarks=Object.freeze({bodyY,bodyFrontZ,headY,headZ,headRadius,billTipZ,billTipY,
    wingRootX,wingRootY,wingRootZ,wingElbowX,wingElbowZ,wingTipX,wingTipZ,wingTipY,
    footX:.19*m.bodyWidth,shoulderZ:wingRootZ});
  landmarkCache.set(m,landmarks);return landmarks;
}
export function evaluateVida38BirdField38I(m:Vida38BirdMorphologyV1,x:number,y:number,z:number):number {
  const a=deriveVida38BirdLandmarks38I(m);
  let d=ellipsoid(x,y,z,0,a.bodyY,0,.32*m.bodyWidth,.35*m.bodyDepth,.54*m.bodyLength);
  // Quilla, masa pectoral y cintura escapular específicas de un ave.
  d=smoothMin(d,ellipsoid(x,y,z,0,a.bodyY-.065,.17*m.bodyLength,
    .29*m.bodyWidth,.32*m.bodyDepth*m.breastVolume,.32*m.bodyLength),.16);
  d=smoothMin(d,ellipsoid(x,y,z,0,a.bodyY+.12*m.bodyDepth,-.21*m.bodyLength,
    .28*m.bodyWidth,.25*m.bodyDepth,.30*m.bodyLength),.14);
  const nStart:[number,number,number]=[0,a.bodyY+.15*m.bodyDepth,.27*m.bodyLength];
  const nMid:[number,number,number]=[0,a.bodyY+.21*m.bodyDepth+.31*m.neckLength,
    .30*m.bodyLength+.07*m.neckLength];
  const nEnd:[number,number,number]=[0,a.headY-.11*m.headSize,a.headZ-.10*m.headSize];
  const neckRoot=.135*m.neckThickness;
  d=smoothMin(d,taper(x,y,z,...nStart,...nMid,neckRoot,neckRoot*.79),.16);
  d=smoothMin(d,taper(x,y,z,...nMid,...nEnd,neckRoot*.81,.112*m.neckThickness),.13);
  d=smoothMin(d,ellipsoid(x,y,z,0,a.headY,a.headZ,
    a.headRadius*m.skullAspect,a.headRadius*.95,a.headRadius*1.12),.13);
  // Pico especializado; el campo es continuo con la región frontonasal.
  // 38.2i.a.1b: estabilización craneofacial. Aun cuando una semilla genere
  // un pico corto o un cráneo redondeado, debe mantenerse una cara legible.
  const billBase=a.headZ+a.headRadius*.70;
  const billBaseY=a.headY-.087*m.headSize;
  const billRx=Math.max(.108*m.billWidth,.066*m.headSize);
  const billTipY=a.billTipY;
  const longBeak=m.billKind==='LONG'||m.billKind==='SPEAR'||m.billKind==='CURVED';
  const faceProjection=Math.max(.135*m.headSize,.11*m.billLength);
  const faceWidth=Math.max(.12*m.billWidth,.19*m.headSize);
  const faceHeight=Math.max(.11*m.billDepth,.15*m.headSize);
  // Base premaxilar/morro: asegura lectura frontal de la cara incluso en
  // especies de pico corto o plumaje denso.
  d=smoothMin(d,ellipsoid(x,y,z,0,billBaseY-.006,billBase+faceProjection*.56,
    faceWidth,faceHeight,faceProjection),.072);
  if(m.billKind==='BROAD'){
    // El pico ancho no debe quedar dentro del cráneo aunque la semilla
    // produzca un billLength mínimo. El extremo coincide con billTipZ.
    const exposed=Math.max(.12,a.billTipZ-billBase);
    d=smoothMin(d,ellipsoid(x,y,z,0,billBaseY-.03,billBase+exposed*.54,
      billRx*1.80,.082*m.billDepth,exposed*.49),.063);
  }else{
    // Dos tramos anatómicos para pico largo, curvado y de rapaz.
    const midZ=billBase+(a.billTipZ-billBase)*.54;
    const midY=billBaseY+(billTipY-billBaseY)*.48+
      (m.billKind==='CURVED'?.075*m.billLength:m.billKind==='HOOKED'?.035:0);
    // Grosor mínimo de la punta: evita que un pico fino sea eliminado por
    // el grillado SDF de detalle LOW/MEDIUM y desaparezca visualmente.
    const baseTipRadius=Math.max(.027*m.headSize,
      m.billKind==='SPEAR'?.019*m.billWidth:m.billKind==='CONICAL'?.025*m.billWidth:.027*m.billWidth);
    d=smoothMin(d,taper(x,y,z,0,billBaseY,billBase,0,midY,midZ,
      billRx,billRx*(m.billKind==='SPEAR'?.42:.58)),.073);
    d=smoothMin(d,taper(x,y,z,0,midY,midZ,0,billTipY,a.billTipZ,
      billRx*(m.billKind==='SPEAR'?.42:.58),baseTipRadius),.033);
    if(m.billKind==='HOOKED'){
      d=smoothMin(d,taper(x,y,z,0,billTipY+.025,a.billTipZ-.027,
        0,billTipY-.11*m.billCurve,a.billTipZ+.035,.035*m.billWidth,.007),.022);
    }
    if(m.billKind==='CHISEL'){
      d=smoothMin(d,ellipsoid(x,y,z,0,billBaseY,billBase+.12*m.billLength,
        .135*m.billWidth,.085*m.billDepth,.165*m.billLength),.063);
    }
  }
  // Mandíbula/mentón inferior: evita que la cara colapse en una esfera lisa y
  // hace visible la boca aunque el pico sea corto.
  d=smoothMin(d,ellipsoid(x,y,z,0,a.headY-.16*m.headSize,billBase-.01,
    .105*m.billWidth,.061*m.billDepth,.12*m.billLength),.06);
  d=smoothMin(d,taper(x,y,z,0,billBaseY-.022,billBase-.012,0,billTipY-.018,a.billTipZ-.022,
    .056*Math.max(m.billWidth,m.headSize*.55),.012),.028);
  // Mejillas/máscara facial suave para separar ojos y pico del cráneo.
  d=smoothMin(d,ellipsoid(x,y,z,0,a.headY-.012*m.headSize,a.headZ+.06*m.headSize,
    .38*a.headRadius,.20*a.headRadius,.24*a.headRadius),.055);
  // Alas plegadas o parcialmente extendidas desde el tórax, integradas con la
  // cintura escapular. Las rémiges detalladas se modelan separadamente como plumas.
  for(const side of [-1,1] as const){
    const rootX=side*a.wingRootX;
    const elbowX=side*a.wingElbowX;
    const tipX=side*a.wingTipX;
    const wr=a.wingRootY,rz=a.wingRootZ;
    const upperY=wr+.05+m.wingLift*.24;
    d=smoothMin(d,ellipsoid(x,y,z,side*.285*m.bodyWidth,wr,rz-.09*m.bodyLength,
      .17*m.bodyWidth,.16*m.wingBreadth,.27*m.bodyLength),.16);
    d=smoothMin(d,taper(x,y,z,rootX,wr,rz,elbowX,upperY,a.wingElbowZ,
      .18*m.wingBreadth,.13*m.wingBreadth),.13);
    d=smoothMin(d,taper(x,y,z,elbowX,upperY,a.wingElbowZ,tipX,a.wingTipY,a.wingTipZ,
      .14*m.wingBreadth,.044*m.wingBreadth),.11);
    const midX=(elbowX+tipX)*.5,midZ=(a.wingElbowZ+a.wingTipZ)*.5;
    d=smoothMin(d,ellipsoid(x,y,z,midX,(upperY+a.wingTipY)*.5,midZ,
      .14*m.wingBreadth,.076*m.wingBreadth,.19*m.wingSpan),.09);
    // Muslo integrado en la pelvis, rodilla alta, corvejón posterior, y
    // tarsometatarso hacia los dedos: no tiene cinemática humanoide.
    const leg=deriveVida38BirdLegLandmarks38IA(m,side);
    const [hipX,hipY,hipZ]=leg.hip;
    const [kneeX,kneeY,kneeZ]=leg.knee;
    const [hockX,hockY,hockZ]=leg.hock;
    const [ankleX,ankleY,ankleZ]=leg.ankle;
    const thick=.105*m.legThickness*(m.archetype==='CURSORIAL'?1.12:1);
    d=smoothMin(d,ellipsoid(x,y,z,hipX,hipY,hipZ,
      thick*1.42,.22*m.legLength,.18*m.bodyLength),.15);
    d=smoothMin(d,taper(x,y,z,hipX,hipY,hipZ,kneeX,kneeY,kneeZ,
      thick*1.19,thick*.86),.11);
    d=smoothMin(d,taper(x,y,z,kneeX,kneeY,kneeZ,hockX,hockY,hockZ,
      thick*.81,thick*.50),.07);
    d=smoothMin(d,taper(x,y,z,hockX,hockY,hockZ,ankleX,ankleY,ankleZ,
      thick*.50,thick*.42),.050);
    d=smoothMin(d,ellipsoid(x,y,z,ankleX,.091,ankleZ+.012,
      .071*m.legThickness*m.footPadWidth,.050,.084*m.toeLength*m.footPadWidth),.048);
    for(let toe=0;toe<4;toe++){
      const back=toe===3;
      const tip=back?leg.hallux:leg.frontToes[toe]!;
      const t=back?m.halluxLength:m.toeLength;
      const startX=ankleX+(back?-side*.020:(toe-1)*.021*m.toeSplay);
      const midX=startX+(tip[0]-startX)*.51;
      const midZ=ankleZ+(tip[2]-ankleZ)*.49;
      const baseRadius=(back?.037:.044)*m.legThickness*m.footPadWidth;
      d=smoothMin(d,taper(x,y,z,startX,.089,ankleZ+.015,midX,.066,midZ,
        baseRadius,baseRadius*.80),.033);
      d=smoothMin(d,taper(x,y,z,midX,.066,midZ,tip[0],tip[1],tip[2],
        baseRadius*.80,baseRadius*.46),.021);
      // Uñas/garritas queratínicas ligeramente curvadas, nacen del dedo.
      const dx=tip[0]-midX,dz=tip[2]-midZ;
      const distance=Math.max(1e-5,Math.hypot(dx,dz));
      d=smoothMin(d,taper(x,y,z,tip[0],.052,tip[2],
        tip[0]+dx/distance*.065*m.clawLength*t,
        .028,tip[2]+dz/distance*.065*m.clawLength*t,
        baseRadius*.42,.008),.013);
    }
  }
  // Plumas caudales básicas parten de la pelvis y se solapan orgánicamente.
  const tailRootZ=-.45*m.bodyLength;
  const tailTipZ=tailRootZ-(.60+.19*m.tailOrnament)*m.tailLength;
  d=smoothMin(d,taper(x,y,z,0,a.bodyY+.015,tailRootZ,
    0,a.bodyY-.11,tailTipZ,.14*m.bodyWidth,.022*m.bodyWidth),.11);
  // Cresta queratínica opcional, nacida del propio cráneo.
  if(m.crestHeight>0){
    d=smoothMin(d,taper(x,y,z,0,a.headY+a.headRadius*.72,a.headZ-.06,
      0,a.headY+a.headRadius*.72+m.crestHeight,a.headZ-.10,.08*m.headSize,.008),.065);
  }
  // Depresión orbitaria suave; se modera para no borrar la cara en especies
  // con cráneo voluminoso o pico corto. Las córneas transparentes son submallas legítimas.
  for(const side of [-1,1]){
    const ex=side*.81*a.headRadius*m.eyeLateralness;
    const ey=a.headY+.026*m.headSize;
    const ez=a.headZ+.13*m.headSize;
    d=smoothMax(d,-ellipsoid(x,y,z,ex,ey,ez,.041*m.eyeSize,.046*m.eyeSize,.049*m.eyeSize),.016);
  }
  return d;
}


/**
 * 38.2i.a.2b: la cara debe quedar libre de plumaje de contorno que pueda
 * ocultar los ojos, la comisura y la raíz del pico. Solo restringe el plumón
 * accesorio, no altera la cobertura VIDA ni las rémiges de alas y cola.
 */
export function isVida38BirdProtectedFace38IA2(
  m:Vida38BirdMorphologyV1,x:number,y:number,z:number,
):boolean {
  const a=deriveVida38BirdLandmarks38I(m);
  const rx=a.headRadius*m.skullAspect;
  return y>a.headY-a.headRadius*.89 && y<a.headY+a.headRadius*.88 &&
    z>a.headZ-a.headRadius*.12 &&
    Math.abs(x)<Math.max(rx*1.30,.23*m.headSize);
}

export interface Vida38BirdEyeSurface38IA2 {
  readonly surface:V3;
  readonly outward:V3;
  readonly radius:number;
  readonly center:V3;
  readonly irisCenter:V3;
  readonly surfaceResidual:number;
}
/**
 * Anclaje ocular real al isovalor 0 del SDF. Antes el ojo se insertaba en unas
 * coordenadas globales fijas; en cráneos anchos o redondeados podía quedar
 * oculto o verse como una mota. Esta búsqueda es determinista y se ejecuta
 * solo al construir la vista, nunca por frame.
 */
export function deriveVida38BirdEyeSurface38IA2(
  m:Vida38BirdMorphologyV1,side:-1|1,
):Vida38BirdEyeSurface38IA2 {
  const a=deriveVida38BirdLandmarks38I(m);
  const dirx=side*.74/Math.max(.70,m.skullAspect);
  const diry=.07;
  const dirz=.77;
  const norm=length(dirx,diry,dirz);
  const ox=dirx/norm,oy=diry/norm,oz=dirz/norm;
  const cy=a.headY+.035*m.headSize;
  const radius=Math.max(.037*m.eyeSize,.13*a.headRadius);
  const sdf=(t:number)=>evaluateVida38BirdField38I(m,ox*t,cy+oy*t,a.headZ+oz*t);
  // IMPORTANTE: la cara tiene cavidades y mejillas SDF; el rayo puede
  // salir por una cavidad y VOLVER a entrar en la mejilla. La primera
  // intersección es incorrecta y puede enterrar el ojo, como se detectó en
  // varias semillas. Encontrar la ÚLTIMA salida antes del exterior real.
  const far=Math.max(.75,a.headRadius*4.3);
  const step=far/72;
  let lower=-1,upper=-1;
  for(let i=0;i<72;i++){
    const t=i*step;
    if(sdf(t)<=0){lower=t;upper=t+step;}
  }
  if(lower<0 || !(sdf(upper)>0))
    throw new Error('VIDA.38.2i.a.2b: superficie ocular exterior no resuelta');
  for(let i=0;i<24;i++){
    const mid=(lower+upper)*.5;
    if(sdf(mid)<0)lower=mid;else upper=mid;
  }
  const t=(lower+upper)*.5;
  const sx=ox*t,sy=cy+oy*t,sz=a.headZ+oz*t;
  // El globo se asienta en la órbita dejando una cúpula exterior visible.
  // En una superficie cóncava el isovalor puede crecer lentamente: desplazar
  // unas décimas de radio hacia fuera solo si el iris sigue casi enterrado.
  const inset=radius*.12;
  const irisOffset=radius*.84;
  const minimumIrisClearance=Math.min(.008,radius*.22);
  let shift=0;
  for(let i=0;i<12 && sdf(t-inset+irisOffset+shift)<minimumIrisClearance;i++)
    shift+=radius*.12;
  const center:V3=[sx+ox*(shift-inset),sy+oy*(shift-inset),sz+oz*(shift-inset)];
  const irisCenter:V3=[center[0]+ox*irisOffset,center[1]+oy*irisOffset,center[2]+oz*irisOffset];
  return Object.freeze({
    surface:[sx,sy,sz] as V3,
    outward:[ox,oy,oz] as V3,
    radius,
    center,
    irisCenter,
    surfaceResidual:sdf(t),
  });
}

/** Tamaño de grillado acotado: HIGH está reservado a la ficha individual. */
export const VIDA38_BIRD_GRID:Readonly<Record<Vida38BirdQuality,readonly [number,number,number]>>=Object.freeze({
  LOW:[48,56,66],MEDIUM:[64,74,88],HIGH:[84,94,116],
});

const TETS = [
  [0,5,1,6],[0,1,2,6],[0,2,3,6],
  [0,3,7,6],[0,7,4,6],[0,4,5,6],
] as const;

/** Marching tetrahedra indexado; un único volumen anatómico, sin uniones artificiales. */
export function buildVida38BirdRawMeshV1(morphology: Vida38BirdMorphologyV1, quality: Vida38BirdQuality = 'MEDIUM'): Vida38BirdRawMeshV1 {
  const [nx,ny,nz] = VIDA38_BIRD_GRID[quality];
  const a=deriveVida38BirdLandmarks38I(morphology);
  const spreadX=Math.max(.78,morphology.bodyWidth*.85,a.wingTipX+.23,
    morphology.wingSpan*.80)+.34;
  const ymin=-.22;
  const ymax=Math.max(a.headY+a.headRadius*1.65+morphology.crestHeight,
    a.wingTipY+.31*morphology.wingBreadth,a.wingRootY+.30,
    a.bodyY+.6*morphology.bodyDepth)+.24;
  const xmin=-spreadX,xmax=spreadX;
  const zmin=Math.min(-.90*morphology.bodyLength-(.72+.23*morphology.tailOrnament)*morphology.tailLength-.25,
    a.wingTipZ-.30);
  const zmax=Math.max(a.billTipZ+.28,.70*morphology.bodyLength)+.28;
  const dx=(xmax-xmin)/(nx-1),dy=(ymax-ymin)/(ny-1),dz=(zmax-zmin)/(nz-1);
  const id = (i:number,j:number,k:number) => (k*ny+j)*nx+i;
  const field = new Float32Array(nx*ny*nz);
  for(let k=0;k<nz;k++) for(let j=0;j<ny;j++) for(let i=0;i<nx;i++)
    field[id(i,j,k)] = evaluateVida38BirdField38I(morphology,xmin+i*dx,ymin+j*dy,zmin+k*dz);

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
    const gx=evaluateVida38BirdField38I(morphology,x+eps,y,z)-evaluateVida38BirdField38I(morphology,x-eps,y,z);
    const gy=evaluateVida38BirdField38I(morphology,x,y+eps,z)-evaluateVida38BirdField38I(morphology,x,y-eps,z);
    const gz=evaluateVida38BirdField38I(morphology,x,y,z+eps)-evaluateVida38BirdField38I(morphology,x,y,z-eps);
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
  if (faces.length===0) throw new Error('VIDA.38.2i: malla aviar vacía');
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
    revision: VIDA38_BIRD_MESH_REVISION,
    morphology,
    quality,
    positions: Float32Array.from(finalPositions),
    normals: Float32Array.from(finalNormals),
    uvs: Float32Array.from(finalUvs),
    indices: Uint32Array.from(finalFaces),
    bounds: {min:[xmin,ymin,zmin],max:[xmax,ymax,zmax]},
  };
}

export function auditVida38BirdRawMeshV1(mesh: Vida38BirdRawMeshV1): Readonly<{
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

