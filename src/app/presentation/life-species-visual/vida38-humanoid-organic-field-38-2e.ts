/**
 * GENESIS 38.2e — anatomía humanoide procedimental con campo implícito.
 * Unidades locales: altura aproximada 2,74; la escala métrica real procede
 * exclusivamente de VIDA.38.1 y se conserva sin modificar el dato certificado.
 *
 * Archivo deliberadamente sin dependencias de Three ni del DOM: es posible
 * comprobar determinismo, conexión topológica y seguridad numérica en Node.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { deriveVida38HumanoidFace38GD, type Vida38HumanoidFaceProfile38GD } from './vida38-humanoid-face-38-2gd';
import { deriveVida38HumanoidTorso38GE, type Vida38HumanoidTorsoProfile38GE } from './vida38-humanoid-torso-38-2ge';
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
  /** 38.2g.d — reconstrucción craneofacial hipotética versionada. */
  readonly face: Vida38HumanoidFaceProfile38GD;
  /** 38.2g.e: constitución, vello torácico y separación anatómica de los brazos. */
  readonly torso: Vida38HumanoidTorsoProfile38GE;
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
  /** 38.2g: variaciones faciales hipotéticas, estables y no cromáticas. */
  readonly cheekFullness: number;
  readonly chinShape: number;
  readonly mouthWidth: number;
  readonly nasalBridge: number;
  readonly orbitalRidge: number;
  readonly stanceBias: number;
  readonly shoulderTilt: number;
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

/** 38.2g.c — coordenadas craneales compartidas entre SDF y globo ocular. */
export interface Vida38HumanoidFaceLandmarks38GC {
  readonly eyeY: number;
  readonly eyeCenterZ: number;
  readonly globeRadius: number;
  readonly socketZ: number;
  readonly lipY: number;
  readonly jawY: number;
}
export function deriveVida38HumanoidFaceLandmarks38GC(a: Vida38HumanoidAnatomy): Vida38HumanoidFaceLandmarks38GC {
  const eyeY = a.legLength + (1.18 + (a.neckLength - 1) * 0.14) * a.torsoLength;
  const socketZ = 0.248 + a.faceProjection * 0.12;
  // El globo se aloja DETRÁS del reborde orbital, no delante de la piel.
  // 38.2g lo colocaba ~0.07 u más adelante: producía ojos de muñeco.
  const globeRadius = a.eyeRadius * 0.80;
  const eyeCenterZ = socketZ - a.eyeRadius * 1.04;
  return Object.freeze({
    eyeY,
    eyeCenterZ,
    globeRadius,
    socketZ,
    lipY: a.legLength + (1.021 + (a.neckLength - 1) * 0.14) * a.torsoLength,
    jawY: a.legLength + (1.055 + (a.neckLength - 1) * 0.14) * a.torsoLength,
  });
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
    face: deriveVida38HumanoidFace38GD(contract),
    torso: deriveVida38HumanoidTorso38GE(contract, morphology),
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
    cheekFullness: r(201, 0.78, 1.24),
    chinShape: r(202, 0.78, 1.30),
    mouthWidth: clamp(r(203, 0.76, 1.19) * morphology.jawWidth, 0.72, 1.24),
    nasalBridge: r(204, 0.76, 1.31),
    orbitalRidge: r(205, 0.8, 1.22),
    stanceBias: r(206, -0.07, 0.07),
    shoulderTilt: r(207, -0.019, 0.019),
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
  const f = a.face;
  const t = a.torso;
  // 38.2f: deformar el CAMPO en su dominio, antes de Marching Tetrahedra.
  // No se escalan objetos separados, se modifica una única isosuperficie.
  const lean = a.postureLean * Math.max(0, y - p);
  z -= lean;
  if (y > p) y = p + (y - p) / a.torsoLength;
  const neckOffset = (a.neckLength - 1) * 0.14;
  const headY = y - neckOffset;
  const kneeY = p * clamp(0.56 - (a.thighRatio - 1) * 0.13 + (a.calfRatio - 1) * 0.08, 0.53, 0.59);
  // 38.2g.e: pecho, cintura y abdomen responden a un arquetipo corporal
  // estable: cuerpos filiformes, esbeltos, atléticos, compactos y pesados.
  // El volumen sigue siendo una única superficie SDF, no mallas escaladas.
  const chestRadius = a.shoulderWidth * 1.06 * t.chestScale;
  const waistRadius = a.abdomenWidth * 0.89 * t.waistScale;
  let d = ellipsoid(x,y,z,0,p+0.44,0,chestRadius,0.43,a.torsoDepth*(0.94+0.06*t.chestScale));
  d = smin(d,ellipsoid(x,y,z,0,p+0.14,0,waistRadius,0.29*t.abdomenScale,a.torsoDepth*0.86*t.abdomenScale),0.13);
  d = smin(d,ellipsoid(x,y,z,0,p-0.04,-0.012,a.hipWidth*1.06*(0.94+0.06*t.waistScale),0.21,a.torsoDepth*0.95),0.12);
  d = smin(d,limb(x,y,z,0,p+0.73,-0.01,0,p+0.98+neckOffset,0,0.115*a.neckThickness,0.085*a.neckThickness),0.10);
  // 38.2g.c: músculos trapecio y clavículas CONTINUOS, no mallas anexas.
  for (const side of [-1, 1]) {
    const clx = side * a.shoulderWidth * 0.72;
    d = smin(d,limb(x,y,z,0,p+0.87,-0.09,clx,p+0.72+side*a.shoulderTilt,-0.015,
      0.079*a.neckThickness,0.104*a.musculature),0.093);
    d = smin(d,limb(x,y,z,side*a.shoulderWidth*0.16,p+0.79,a.torsoDepth*0.80,
      side*a.shoulderWidth*0.89,p+0.68,a.torsoDepth*0.64,
      0.033*a.musculature,0.039*a.musculature),0.052);
  }

  // Cráneo, mandíbula y estructuras del rostro integrados antes de extraer malla.
  d = smin(d,ellipsoid(x,headY,z,0,p+1.22,-0.025,a.headWidth*f.facialWidth,a.headHeight*f.skullCrown,a.headWidth*0.90*a.headDepth),0.13);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.055,0.075*a.jawProjection,a.jawWidth*f.jawBreadth,0.142*a.headScale*f.faceLength,a.headWidth*0.82*a.headDepth),0.12);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.19,a.faceProjection,a.headWidth*0.86*f.facialWidth,0.19*a.headScale*f.faceLength,0.105*a.jawProjection),0.09);
  // Puente nasal, pirámide de la nariz y mentón fundidos en la piel.
  // La variación se aplica a la ISOSUPERFICIE, no como objetos superpuestos.
  d = smin(d,ellipsoid(x,headY,z,0,p+1.172+0.06*a.cranialShape,0.218+a.faceProjection*0.13,
    0.043*a.nasalBridge*f.noseWidth,0.118*a.headScale*f.nasalBridge,0.065*a.morphology.faceProjection),0.069);
  // Cresta nasal transicional con amplitud dependiente del perfil 38.2f.
  d = smin(d,limb(x,headY,z,0,p+1.232,0.215+a.faceProjection*0.08,
    0,p+1.104,0.270+a.faceProjection*0.12,
    0.024*a.nasalBridge*f.noseWidth,0.041*a.nasalBridge*f.noseWidth),0.035);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.095,0.278+a.faceProjection*0.12,
    0.057*a.nasalBridge*f.noseWidth,0.040*a.headScale,0.055*a.nasalBridge),0.037);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.00,0.161*a.jawProjection,
    a.jawWidth*0.62*a.chinShape*f.jawBreadth,0.055*a.chinShape,0.095*a.jawProjection*f.chinProjection),0.052);
  // Labios sutiles, con volumen inferior más pequeño: la hendidura será tallada al final.
  d = smin(d,ellipsoid(x,headY,z,0,p+1.039,0.246*a.jawProjection,
    a.jawWidth*0.49*a.mouthWidth,0.022*f.lipFullness,0.035*f.lipFullness),0.018);
  d = smin(d,ellipsoid(x,headY,z,0,p+1.010,0.240*a.jawProjection,
    a.jawWidth*0.47*a.mouthWidth,0.017*f.lipFullness,0.029*f.lipFullness),0.014);
  // Ligero volumen pectoral integrado y continuidad dorsal en el tronco.
  for (const side of [-1,1]) {
    d = smin(d,ellipsoid(x,y,z,side*a.shoulderWidth*0.37*t.chestScale,p+0.55,a.torsoDepth*0.62,
      a.shoulderWidth*0.40*t.chestScale,0.175*a.musculature*t.pectoralDefinition,
      0.098*a.chestWidth*t.pectoralDefinition),0.075);
  }
  for (const side of [-1,1]) {
    const sx = side * a.eyeSpacing;
    // Volumen malar y surco nasolabial; evita la cara lisa de muñeco.
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth*0.55,p+1.106,0.153+a.faceProjection*0.10,
      0.105*a.cheekFullness*f.cheekVolume,0.067*a.cheekFullness*f.cheekVolume,0.062*a.cheekFullness*f.cheekVolume),0.054);
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth*0.76,p+1.19,-0.025,0.065*a.headScale,0.12*a.headScale,0.055*a.headDepth),0.07);
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth*0.70,p+1.075,-0.028,0.047*a.headScale,0.067*a.headScale,0.049),0.037);
    d = smin(d,ellipsoid(x,headY,z,side*a.eyeSpacing*1.38,p+1.10,0.14,0.079,0.087,0.077),0.043);
    // 38.2g.d: arcos supraciliares pueden estar AUSENTES. Cuando existen,
    // el grosor y el desarrollo forman parte del campo SDF, no una ceja pegada.
    if (f.browRidge > 0.045) {
      const xBrow = sx*f.eyebrowSeparation;
      const ridgeY = p + 1.245 + side * f.eyebrowSlant * 0.016;
      d = smin(d,ellipsoid(x,headY,z,xBrow,ridgeY,0.222,
        0.085*a.headScale*f.eyebrowLength,0.024*f.browRidge,0.030 + 0.013*f.browRidge),0.025);
    }
    d = smin(d,ellipsoid(x,headY,z,side*a.headWidth,p+1.13,-0.035,0.041*a.headScale,0.085*a.headScale,0.034),0.034);

    // 38.2g.e — conexión anatómica SOLO en el hombro. Antes el volumen
    // de bíceps en y=p+0.43 se fundía con el torso hasta casi el codo.
    // Codo, antebrazo y mano se desplazan lateralmente dejando axila abierta.
    const shoulderX = side*(a.shoulderWidth*1.03*t.chestScale);
    const shoulderY = p+0.70+side*a.shoulderTilt;
    const pose = side*a.asymmetry;
    const elbowX = shoulderX+side*(t.elbowOutset+0.008*pose);
    const wristX = shoulderX+side*(t.wristOutset+0.012*pose);
    const elbowY = p+0.31-(a.upperArmRatio-1)*0.075;
    const wristY = p+0.64-a.armReach-(a.forearmRatio-1)*0.04;
    const elbowZ = -0.070-0.2*pose;
    const wristZ = 0.13+0.2*pose;
    const deltoidRadius = 0.113*a.musculature*a.armThickness*t.shoulderCapScale;
    d = smin(d,ellipsoid(x,y,z,shoulderX*0.985,shoulderY-0.016,-0.018,
      deltoidRadius*1.13,0.143*t.shoulderCapScale,0.120),0.090);
    d = smin(d,limb(x,y,z,shoulderX*0.95,shoulderY,-0.018,elbowX,elbowY,elbowZ,
      0.100*a.musculature*a.armThickness,0.072*a.musculature*a.armThickness),0.068);
    d = smin(d,limb(x,y,z,elbowX,elbowY+0.012,elbowZ,wristX,wristY,wristZ,
      0.073*a.musculature*a.armThickness,0.046*a.armThickness),0.054);
    // Bíceps lateral: no puede cerrar la abertura axilar por debajo de p+0.53.
    const bicepsX = (shoulderX+elbowX)*0.5+side*t.armpitClearance*0.12;
    d = smin(d,ellipsoid(x,y,z,bicepsX,p+0.49,elbowZ-0.017,
      0.082*a.armThickness,0.140*a.musculature,0.079*a.armThickness),0.043);
    // Masa muscular del antebrazo libre de fusiones con la pared abdominal.
    const forearmX = (elbowX+wristX)*0.5;
    const forearmY = (elbowY+wristY)*0.5;
    d = smin(d,ellipsoid(x,y,z,forearmX,forearmY,elbowZ*0.46+wristZ*0.54,
      0.061*a.armThickness,0.142,0.059*a.armThickness),0.041);

    // Palma expandida transversalmente, y dedo por dedo con separación real.
    // La unión con la muñeca es SDF. Las falanges se bifurcan a partir del
    // borde inferior de la palma y permanecen legibles incluso en LOD MEDIUM.
    const handY = wristY-0.113*a.handSize;
    const palmX = wristX+side*0.014;
    const palmZ = wristZ+0.016;
    const palmWidth = 0.082*a.handSize*t.palmWidth;
    d = smin(d,ellipsoid(x,y,z,palmX,handY,palmZ,
      palmWidth,0.114*a.handSize,0.052*a.handSize),0.051);
    d = smin(d,ellipsoid(x,y,z,palmX,handY-0.044,palmZ+0.021,
      palmWidth*0.91,0.078*a.handSize,0.044*a.handSize),0.033);
    const fingers = a.fingerCount;
    // Raíces próximas en palma, puntas en abanico: deja huecos legibles en HIGH.
    const rootSpacing = 0.031*a.handSize*t.fingerSpread;
    const tipSpacing = 0.056*a.handSize*t.fingerSpread;
    const centerIndex = (fingers-1)*0.5;
    for(let i=0; i<fingers; i++) {
      const lateral = i-centerIndex;
      const fx = palmX+lateral*rootSpacing;
      const startY = handY-0.093*a.handSize;
      const tipY = handY-(0.234+(1-Math.abs(lateral/Math.max(1,centerIndex)))*0.033)*a.fingerLength*t.digitLength;
      const tipX = palmX+lateral*tipSpacing;
      const fz = palmZ+0.016+0.006*(1-Math.abs(lateral/Math.max(1,centerIndex)));
      const radius = 0.0165*a.fingerThickness;
      // Falange proximal y distal: taper continuo, sin muñones de cilindros.
      const midY = startY+(tipY-startY)*0.55;
      d = smin(d,limb(x,y,z,fx,startY,fz,fx+(tipX-fx)*0.5,midY,fz+0.014,
        radius*1.20,radius),0.009);
      d = smin(d,limb(x,y,z,fx+(tipX-fx)*0.5,midY,fz+0.014,tipX,tipY,fz+0.021,
        radius,radius*0.71),0.007);
    }
    // Pulgar oponible claramente apartado del abanico de dedos.
    d = smin(d,limb(x,y,z,palmX-side*palmWidth*0.72,handY+0.023,palmZ+0.025,
      palmX-side*(palmWidth+0.058*a.handSize),handY-0.083,palmZ+0.097,
      0.024*a.fingerThickness,0.013*a.fingerThickness),0.022);

    const hipX = side*a.hipWidth*0.61*a.hipSpacing;
    const kneeX = hipX+side*0.008;
    const ankleX = hipX+side*0.018;
    const footZ = a.stanceBias*side;
    const kneeZ = 0.07 + footZ*0.45;
    d = smin(d,ellipsoid(x,y,z,hipX,p-0.055,-0.04,0.14*a.musculature*a.legThickness,0.17,0.13),0.12);
    d = smin(d,limb(x,y,z,hipX,p-0.10,0,kneeX,kneeY,kneeZ,
      0.132*a.musculature*a.legThickness,0.089*a.musculature*a.legThickness),0.095);
    d = smin(d,limb(x,y,z,kneeX,kneeY+0.012,kneeZ,ankleX,0.15,0.02+footZ,
      a.calfVolume*1.5,a.calfVolume*0.70),0.085);
    // Grupos musculares: cuadriceps, gemelos, tendón de Aquiles y talón.
    d = smin(d,ellipsoid(x,y,z,hipX,kneeY+(p-kneeY)*0.49,0.084+footZ*0.2,
      0.113*a.legThickness,0.215*a.musculature,0.099*a.legThickness),0.075);
    d = smin(d,ellipsoid(x,y,z,ankleX,kneeY*0.55,-0.045+footZ*0.6,
      0.101*a.legThickness,0.18*a.musculature,0.100*a.legThickness),0.075);
    d = smin(d,limb(x,y,z,ankleX,0.17,-0.044+footZ,ankleX,0.38,-0.044+footZ,
      0.047*a.legThickness,0.053*a.legThickness),0.06);
    d = smin(d,ellipsoid(x,y,z,ankleX,0.15,0.024+footZ,0.060,0.11,0.064),0.065);
    d = smin(d,ellipsoid(x,y,z,ankleX,0.072,0.11+footZ,0.103*a.footWidth,0.084,a.footLength*0.69),0.080);
    // Arco plantar, región metatarsiana y talón: volúmenes SDF suavizados.
    d = smin(d,ellipsoid(x,y,z,ankleX,0.070,-0.055+footZ,
      0.065*a.footWidth,0.056,0.094),0.055);
    d = smin(d,ellipsoid(x,y,z,ankleX,0.082,0.18+footZ,
      0.112*a.footWidth,0.054,0.117*a.footLength/0.26),0.050);
    for(let i=0;i<4;i++) {
      const tx = ankleX+(i-1.5)*0.042;
      d = smin(d,limb(x,y,z,tx,0.055,0.22+footZ,tx,0.055,0.32+footZ-(i%2)*0.012,0.026,0.018),0.032);
    }
  }
  // Labios / órbitas y oídos integrados por sustracción; no mallas pegadas.
  for(const side of [-1,1]) {
    const socketZ = 0.248+a.faceProjection*0.12;
    // Órbita real en la cara, excavada antes de recuperar párpados integrados.
    // La profundidad admite el globo 38.2g.c hundido y excluye ojos flotantes.
    d = smax(d,-ellipsoid(x,headY,z,side*a.eyeSpacing,p+1.18+side*f.eyeTilt*0.014,socketZ-0.030,
      a.eyeRadius*1.26,a.eyeRadius*1.07*f.eyeOpenness,0.052),0.020);
    // Párpado superior más pesado, curvatura continua sobre la córnea.
    d = smin(d,ellipsoid(x,headY,z,side*a.eyeSpacing,p+1.18+a.eyeRadius*0.71*f.eyeOpenness+side*f.eyeTilt*0.014,socketZ-0.008,
      a.eyeRadius*1.25,a.eyeRadius*0.29*f.eyelidTension,0.032),0.019);
    // Línea palpebral inferior menos prominente.
    d = smin(d,ellipsoid(x,headY,z,side*a.eyeSpacing,p+1.18-a.eyeRadius*0.77*f.eyeOpenness+side*f.eyeTilt*0.014,socketZ-0.019,
      a.eyeRadius*1.19,a.eyeRadius*0.19*f.eyelidTension,0.026),0.019);
    d = smax(d,-ellipsoid(x,headY,z,side*a.eyeSpacing*0.68,p+1.09,0.29+a.faceProjection*0.12,
      0.014,0.014,0.029),0.008); // fosa nasal
    d = smax(d,-ellipsoid(x,headY,z,side*a.headWidth*1.09,p+1.13,0.004,0.012,0.044,0.031),0.006);
  }
  // Comisuras y surco peribucal esculpidos en la misma isosuperficie.
  // Menor profundidad + transición suave: no aparece la gran abertura negra.
  // La curvatura de la boca cambia por especie: los extremos ascienden
  // suavemente en expresiones relajadas y descienden en las más severas.
  const mouthLateral = clamp(x / Math.max(0.04,a.jawWidth*0.48*a.mouthWidth),-1,1);
  const mouthY = p + 1.022 + f.mouthCurve*mouthLateral*mouthLateral;
  d = smax(d,-ellipsoid(x,headY,z,0,mouthY,0.244*a.jawProjection,
    a.jawWidth*0.48*a.mouthWidth,f.mouthOpen,0.024),0.008);
  for (const side of [-1, 1]) {
    d = smin(d,ellipsoid(x,headY,z,side*a.jawWidth*0.43*a.mouthWidth,
      p+1.026+f.mouthCurve,0.220*a.jawProjection,0.027,0.020*f.lipFullness,0.019),0.021);
  }
  // No aleatorizar la superficie con ruido de alta amplitud: el relieve biológico
  // fino pertenece a los materiales y no debe erosionar la anatomía principal.
  return d;
}

export const VIDA38_HUMANOID_GRID: Readonly<Record<Vida38HumanoidQuality, readonly [number,number,number]>> = Object.freeze({
  LOW: [38, 72, 30], MEDIUM: [60, 112, 46], HIGH: [84, 142, 64],
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
  const [xmin,xmax,ymin,zmin,zmax] = [-1.10,1.10,-0.15,-0.72,0.77];
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
