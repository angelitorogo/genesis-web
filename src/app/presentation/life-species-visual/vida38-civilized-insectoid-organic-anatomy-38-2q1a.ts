/**
 * GENESIS · 38.2q1a — cabeza quitinosa, alas con nervaduras y aguijones orgánicos.
 * Geometría procedural determinista (sin texturas externas, aleatoriedad global ni persistencia).
 * Se limita a la reconstrucción artística de insectoides civilizados muy avanzados.
 */
import * as THREE from 'three';
import type {
  Vida38CivilizedInsectoidPlan38Q,
  Vida38CivilizedInsectoidQuality38Q,
} from './vida38-civilized-insectoid-preview-38-2q';

export const VIDA38_INSECTOID_ORGANIC_REVISION_38Q1A = 'VIDA.38.2q1a/cephalic-wing-stinger/v1' as const;

export type Vida38InsectoidWingKind38Q1A = 'VENATED_LANCE' | 'DOUBLE_VENATED' | 'MOTH_SAIL' | 'ELYTRAL_COVER' | 'VESTIGIAL';
export type Vida38InsectoidStingerKind38Q1A = 'NONE' | 'ROBUST' | 'LANCET' | 'SEGMENTED' | 'CEREMONIAL';
export type Vida38InsectoidHeadKind38Q1A = 'MANTID' | 'HYMENOPTERAN' | 'COLEOPTERAN' | 'CICADAN' | 'LEPIDOPTERAN' | 'ODONATAN' | 'PHASMATODEAN';
export interface Vida38InsectoidAnatomicalStyle38Q1A {
  readonly head: Vida38InsectoidHeadKind38Q1A;
  readonly wing: Vida38InsectoidWingKind38Q1A;
  readonly stinger: Vida38InsectoidStingerKind38Q1A;
  readonly cranialRidges: number;
  readonly scuteContrast: number;
  readonly signature: string;
}
export interface Vida38InsectoidOrganicMesh38Q1A {
  readonly mesh: THREE.Mesh;
  readonly name: string;
  readonly part: 'HEAD' | 'FACE_PLATE' | 'HEAD_RIDGE' | 'ANTENNAL_SOCKET' | 'WING' | 'WING_VEIN' | 'WING_ROOT' | 'STINGER' | 'STINGER_SHEATH' | 'STINGER_GUARD';
}
interface HeadProportions38Q1A {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly lowerTaper: number;
  readonly cheek: number;
  readonly brow: number;
  readonly clypeus: number;
}
const HEAD_CENTER = new THREE.Vector3(0, 2.145, 0.01);
function h32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const gauss = (x: number, center: number, sigma: number): number => Math.exp(-Math.pow((x - center) / sigma, 2));

export function deriveVida38InsectoidAnatomicalStyle38Q1A(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidAnatomicalStyle38Q1A {
  const head: Record<Vida38CivilizedInsectoidPlan38Q['archetype'], Vida38InsectoidHeadKind38Q1A> = {
    MANTID_SENTINEL: 'MANTID', BEETLE_BASTION: 'COLEOPTERAN', WASP_DIPLOMAT: 'HYMENOPTERAN',
    ANT_ENGINEER: 'HYMENOPTERAN', MOTH_ORACLE: 'LEPIDOPTERAN', DRAGONFLY_EXPLORER: 'ODONATAN',
    CICADA_ARCHIVIST: 'CICADAN', STICK_SCHOLAR: 'PHASMATODEAN',
  };
  const wings: Record<Vida38CivilizedInsectoidPlan38Q['archetype'], Vida38InsectoidWingKind38Q1A> = {
    MANTID_SENTINEL: 'VESTIGIAL', BEETLE_BASTION: 'ELYTRAL_COVER', WASP_DIPLOMAT: 'VENATED_LANCE',
    ANT_ENGINEER: 'VESTIGIAL', MOTH_ORACLE: 'MOTH_SAIL', DRAGONFLY_EXPLORER: 'DOUBLE_VENATED',
    CICADA_ARCHIVIST: 'VENATED_LANCE', STICK_SCHOLAR: 'VESTIGIAL',
  };
  const stinger: Vida38InsectoidStingerKind38Q1A = plan.stinger === 'NONE' ? 'NONE'
    : plan.role === 'TECHNO_PRIEST' || plan.role === 'NOBLE' ? 'CEREMONIAL'
      : plan.stinger === 'LANCET' ? (h32(`${plan.signature}|stinger-type`) % 3 === 0 ? 'SEGMENTED' : 'LANCET')
        : 'ROBUST';
  const cranialRidges = 2 + h32(`${plan.signature}|cephalic-ridges`) % 4;
  const scuteContrast = 0.26 + (h32(`${plan.signature}|cephalic-scutes`) % 16) / 100;
  return {
    head: head[plan.archetype], wing: wings[plan.archetype], stinger, cranialRidges, scuteContrast,
    signature: `${head[plan.archetype]}|${wings[plan.archetype]}|${stinger}|${cranialRidges}|${scuteContrast.toFixed(3)}`,
  };
}

function proportions(kind: Vida38InsectoidHeadKind38Q1A): HeadProportions38Q1A {
  switch (kind) {
    case 'MANTID': return { width: 1.24, height: .80, depth: .82, lowerTaper: .34, cheek: .10, brow: .16, clypeus: .11 };
    case 'HYMENOPTERAN': return { width: 1.08, height: 1.02, depth: .98, lowerTaper: .17, cheek: .12, brow: .14, clypeus: .15 };
    case 'COLEOPTERAN': return { width: 1.14, height: 1.10, depth: 1.08, lowerTaper: -.02, cheek: .18, brow: .19, clypeus: .17 };
    case 'CICADAN': return { width: 1.28, height: .88, depth: .89, lowerTaper: .08, cheek: .08, brow: .09, clypeus: .11 };
    case 'LEPIDOPTERAN': return { width: 1.07, height: 1.10, depth: .95, lowerTaper: .22, cheek: .08, brow: .08, clypeus: .10 };
    case 'ODONATAN': return { width: 1.20, height: .85, depth: .86, lowerTaper: .18, cheek: .06, brow: .13, clypeus: .07 };
    case 'PHASMATODEAN': return { width: .82, height: 1.24, depth: .87, lowerTaper: .27, cheek: .10, brow: .12, clypeus: .18 };
  }
}

/** Distancia normalizada a dos órbitas: reduce el relieve para empotrar ojos compuestos. */
function sculptHeadPoint(p: THREE.Vector3, plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1A): THREE.Vector3 {
  const profile = proportions(style.head);
  const x = p.x, y = p.y, z = p.z;
  const upper = .5 + .5 * y;
  const lower = Math.max(0, -y);
  const narrowed = 1 - profile.lowerTaper * Math.pow(lower, 1.28);
  const cheek = 1 + profile.cheek * gauss(y, -.35, .30) * Math.pow(Math.max(0, z), 2);
  const crown = .025 * Math.sin(Math.atan2(z, x) * style.cranialRidges) * gauss(y, .84, .20);
  const sideBrow = profile.brow * gauss(Math.abs(x), .67, .23) * gauss(y, .14, .31) * Math.max(0, z);
  const cl = profile.clypeus * gauss(x, 0, .47) * gauss(y, -.47, .35) * Math.pow(Math.max(0, z), 2);
  const neck = .05 * gauss(y, -.89, .13);
  const lateral = (.323 * 1.14 * plan.headScale * profile.width) * (1 + .08 * upper) * narrowed * cheek;
  const vertical = (.323 * .83 * plan.headScale * profile.height);
  const depth = (.323 * .87 * plan.headScale * profile.depth);
  const orbit = .070 * gauss(Math.abs(x), .68, .18) * gauss(y, -.08, .28) * Math.max(0, z);
  const faceGroove = .020 * gauss(Math.abs(x), .46, .050) * gauss(y, -.42, .38) * Math.max(0, z);
  const longitudinal = .018 * Math.sin(Math.atan2(x, z) * style.cranialRidges * 2.0) * gauss(y, .65, .30);
  return new THREE.Vector3(
    x * lateral * (1 + sideBrow * .26 + crown),
    HEAD_CENTER.y + y * vertical - neck * plan.headScale,
    HEAD_CENTER.z + z * depth * (1 + sideBrow * .34 + cl + longitudinal) - orbit - faceGroove,
  );
}

function buildSculptedHead(plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1A, quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1A {
  const around = quality === 'LOW' ? 40 : quality === 'MEDIUM' ? 56 : 72;
  const rows = quality === 'LOW' ? 26 : quality === 'MEDIUM' ? 36 : 46;
  const geometry = new THREE.SphereGeometry(1, around, rows);
  const position = geometry.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const base = new THREE.Color(plan.shellHex);
  const light = new THREE.Color(plan.shellSecondaryHex);
  const deep = base.clone().multiplyScalar(.56);
  const scratchScale = h32(`${plan.signature}|scute-scratches`) % 5;
  for (let i = 0; i < position.count; i++) {
    const p = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
    const surface = sculptHeadPoint(p, plan, style);
    position.setXYZ(i, surface.x, surface.y, surface.z);
    const longitude = Math.atan2(p.x, p.z);
    const plateLine = Math.abs(Math.sin(longitude * style.cranialRidges + .28 * Math.sin(6 * p.y)));
    const ringLine = Math.abs(Math.sin((p.y + .87) * (7.5 + scratchScale)));
    const scute = .17 * plateLine + .11 * ringLine;
    const grain = (h32(`${plan.speciesId}|chitin|${i}`) % 1001) / 1000;
    const micro = .070 * Math.sin(29 * p.x + 19 * p.y) * Math.cos(17 * p.z + 11 * p.y);
    const faceRegion = Math.max(0, p.z) * gauss(p.y, -.45, .34);
    const c = base.clone().lerp(light, clamp01(.17 + style.scuteContrast * (1 - plateLine) + scute + micro + grain * .06));
    if (plateLine < .055 || (ringLine < .035 && p.y > -.4)) c.lerp(deep, .23);
    if (faceRegion > .36) c.lerp(light, .13);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true, metalness: .09, roughness: .56, clearcoat: .16, clearcoatRoughness: .46,
    side: THREE.FrontSide,
  });
  const head = new THREE.Mesh(geometry, material);
  head.userData['insectoidHeadKind38Q1A'] = style.head;
  head.userData['insectoidHeadFacets38Q1A'] = position.count;
  head.castShadow = true;
  return { mesh: head, name: 'VIDA38_Q1A_SCULPTED_CRANIUM', part: 'HEAD' };
}

/** Placa clipeal conformada sobre la envolvente frontal, con margen curvado. */
function clypealShield(plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1A,
  quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1A {
  const cols = quality === 'LOW' ? 12 : 18;
  const rows = quality === 'LOW' ? 8 : 12;
  const vertices: number[] = [], colors: number[] = [], faces: number[] = [];
  const base = new THREE.Color(plan.shellHex).lerp(new THREE.Color(plan.shellSecondaryHex), .36);
  const edge = new THREE.Color(plan.shellHex).multiplyScalar(.58);
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    const yp = -.63 + .34 * v;
    for (let i = 0; i <= cols; i++) {
      const u = i / cols * 2 - 1;
      const width = .46 * (1 - .22 * Math.pow(Math.abs(yp),1.7));
      const xp = u * width;
      const zp = Math.sqrt(Math.max(.015, 1 - xp * xp - yp * yp));
      const point = sculptHeadPoint(new THREE.Vector3(xp,yp,zp),plan,style);
      point.z += .007 + .005 * Math.sin(Math.PI * v) * (1-u*u);
      vertices.push(point.x,point.y,point.z);
      const border = Math.min(i,cols-i,j,rows-j);
      const col = base.clone().lerp(edge,border<=1?.65:.12);
      colors.push(col.r,col.g,col.b);
      if(j>0&&i>0){
        const a=j*(cols+1)+i,b=a-1,c=a-cols-1,d=c-1;
        faces.push(a,b,c,b,d,c);
      }
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(faces);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.61,metalness:.07,side:THREE.DoubleSide}));
  return {mesh,name:'VIDA38_Q1A_CURVED_CLYPEAL_SHIELD',part:'FACE_PLATE'};
}

export function deriveVida38InsectoidAuxiliaryEyeAnchors38Q1A(plan: Vida38CivilizedInsectoidPlan38Q): THREE.Vector3[] {
  const kind=deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  let positions:readonly [number,number,number][];
  if(plan.extraEyes===2)positions=[[-.31,.52,.79],[.31,.52,.79]];
  else if(plan.extraEyes===3)positions=[[0,.72,.75],[-.36,.42,.84],[.36,.42,.84]];
  else if(plan.extraEyes===4)positions=[[-.31,.67,.70],[.31,.67,.70],[-.40,.32,.84],[.40,.32,.84]];
  else positions=[];
  return positions.map(([x,y,z]) => {
    const p=sculptHeadPoint(new THREE.Vector3(x,y,z).normalize(),plan,kind);
    p.z+=.012;
    return p;
  });
}

export function deriveVida38InsectoidAntennaRoot38Q1A(plan: Vida38CivilizedInsectoidPlan38Q,side:-1|1): THREE.Vector3 {
  const style=deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  return sculptHeadPoint(new THREE.Vector3(side*.35,.95,.10).normalize(),plan,style);
}

export function deriveVida38InsectoidMandibleRoot38Q1A(plan: Vida38CivilizedInsectoidPlan38Q,side:-1|1):THREE.Vector3 {
  const style=deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  const p=sculptHeadPoint(new THREE.Vector3(side*.42,-.73,.53).normalize(),plan,style);
  p.z+=.018;
  return p;
}

/** Posición de la base ocular, adaptada al perfil craneal y no independiente de la cabeza. */
export function deriveVida38InsectoidEyeAnchor38Q1A(plan: Vida38CivilizedInsectoidPlan38Q,
  side: -1 | 1): { position: THREE.Vector3; scale: THREE.Vector3 } {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  const cfg = proportions(style.head);
  const scale = plan.headScale;
  const position = new THREE.Vector3(
    side * (.265 * cfg.width * scale),
    2.145 + (.008 * cfg.height * scale),
    .125 * cfg.depth * scale,
  );
  return { position, scale: new THREE.Vector3(.74 * cfg.width, .92 * cfg.height, .54 * cfg.depth) };
}

function tube(points: readonly THREE.Vector3[], radius: number, color: string, opacity = 1): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map(point => point.clone()));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, points.length * 4), radius, 5, false),
    new THREE.MeshPhysicalMaterial({color,roughness:.56,metalness:.08,transparent:opacity<1,opacity,side:THREE.DoubleSide}));
  return mesh;
}

function lineFromHead(plan: Vida38CivilizedInsectoidPlan38Q, style: Vida38InsectoidAnatomicalStyle38Q1A,
  source: readonly [number, number, number][], offset = .007): THREE.Vector3[] {
  return source.map(([x, y, z]) => {
    const p = new THREE.Vector3(x, y, z).normalize();
    const v = sculptHeadPoint(p, plan, style);
    v.z += offset;
    return v;
  });
}

/** Cabeza esculpida, clípeo, crestas y suturas: todas adaptadas al perfil elegido. */
export function buildVida38InsectoidHead38Q1A(plan: Vida38CivilizedInsectoidPlan38Q,
  quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1A[] {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  const result: Vida38InsectoidOrganicMesh38Q1A[] = [buildSculptedHead(plan, style, quality),clypealShield(plan,style,quality)];
  const ridgeColor = new THREE.Color(plan.shellHex).lerp(new THREE.Color(plan.shellSecondaryHex), .46).getStyle();
  // Suturas frontales, temporales y genales: curvas pegadas a la cabeza, no discos flotantes.
  for (const side of [-1, 1] as const) {
    const brow = lineFromHead(plan, style, [
      [side * .38, .27, .88], [side * .57, .30, .78], [side * .76, .22, .58],
      [side * .87, .09, .40],
    ], .009);
    const ridge = tube(brow, .008 * plan.headScale, ridgeColor);
    result.push({ mesh: ridge, name: 'VIDA38_Q1A_SUPRAOCULAR_RIDGE', part: 'HEAD_RIDGE' });
    const cheek = lineFromHead(plan, style, [
      [side * .78, -.19, .59], [side * .70, -.41, .57],
      [side * .50, -.63, .58], [side * .28, -.73, .61],
    ], .008);
    result.push({ mesh: tube(cheek, .005 * plan.headScale, ridgeColor), name: 'VIDA38_Q1A_GENAL_SUTURE', part: 'HEAD_RIDGE' });
    const antennal = sculptHeadPoint(new THREE.Vector3(side * .38, .92, .10).normalize(), plan, style);
    const socket = new THREE.Mesh(new THREE.TorusGeometry(.040 * plan.headScale, .008 * plan.headScale, 6, 16),
      new THREE.MeshPhysicalMaterial({ color: plan.shellSecondaryHex, roughness: .46, metalness: .14 }));
    socket.position.set(antennaLateralX(side, plan, style), antennal.y + .012, antennal.z + .005);
    socket.rotation.x = Math.PI * .5;
    result.push({mesh:socket,name:'VIDA38_Q1A_ANTENNAL_SOCKET',part:'ANTENNAL_SOCKET'});
  }
  const centerSeam = lineFromHead(plan, style, [[0,.84,.54],[0,.55,.85],[0,.20,.99],[0,-.16,.98]], .009);
  result.push({mesh:tube(centerSeam,.0048*plan.headScale,ridgeColor),name:'VIDA38_Q1A_FRONTAL_SUTURE',part:'HEAD_RIDGE'});
  return result;
}
function antennaLateralX(side: -1|1, plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1A): number {
  return side * .13 * plan.headScale * proportions(style.head).width;
}

interface WingGeometryStyle38Q1A {
  readonly spread: number;
  readonly length: number;
  readonly chord: number;
  readonly raise: number;
  readonly backwards: number;
  readonly scallop: number;
  readonly material: 'MEMBRANE' | 'ELYTRON';
}
function wingGeometryStyle(kind: Vida38InsectoidWingKind38Q1A, pair: number): WingGeometryStyle38Q1A {
  const scale = pair === 0 ? 1 : .79;
  switch (kind) {
    case 'MOTH_SAIL': return {spread:.88*scale,length:.91*scale,chord:.34*scale,raise:.14,backwards:.74*scale,scallop:.085,material:'MEMBRANE'};
    case 'DOUBLE_VENATED': return {spread:1.03*scale,length:1.04*scale,chord:.21*scale,raise:.13,backwards:.81*scale,scallop:.012,material:'MEMBRANE'};
    case 'VENATED_LANCE': return {spread:.84*scale,length:.83*scale,chord:.21*scale,raise:.07,backwards:.75*scale,scallop:.030,material:'MEMBRANE'};
    case 'ELYTRAL_COVER': return {spread:.66*scale,length:.70*scale,chord:.25*scale,raise:.03,backwards:.53*scale,scallop:.008,material:'ELYTRON'};
    case 'VESTIGIAL': return {spread:.45*scale,length:.50*scale,chord:.14*scale,raise:-.10,backwards:.45*scale,scallop:.010,material:'MEMBRANE'};
  }
}

function wingPoint(side: -1|1, pair: number, t: number, across: number,
  cfg: WingGeometryStyle38Q1A): THREE.Vector3 {
  const rootY = 1.82 - pair * .14;
  const sin = Math.max(0, Math.sin(Math.PI * t));
  const flutter = 1 + cfg.scallop * Math.sin((t * 6.0 + .10) * Math.PI);
  const chordWidth = cfg.chord * Math.pow(sin, .74) * flutter;
  const x = side * (.20 + cfg.spread * t);
  const y = rootY + cfg.raise * t - .16 * cfg.length * t * t + across * chordWidth;
  const z = -.335 - cfg.backwards * t - .035 * cfg.length * t * t + across * (.045 + .025 * t)
    + .09 * Math.pow(sin,2) * (1 - across * across) + .027 * Math.sin(t*Math.PI*1.5) * across;
  return new THREE.Vector3(x,y,z);
}

function wingMaterial(kind: WingGeometryStyle38Q1A['material']): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff', vertexColors: true, metalness: kind === 'ELYTRON' ? .20 : .03,
    roughness: kind === 'ELYTRON' ? .42 : .55,
    clearcoat: kind === 'ELYTRON' ? .44 : .12,
    side: THREE.DoubleSide,
    transparent: kind === 'MEMBRANE', opacity: kind === 'MEMBRANE' ? .74 : 1,
    depthWrite: kind === 'ELYTRON',
  });
}

function createWingSurface(plan: Vida38CivilizedInsectoidPlan38Q, style: Vida38InsectoidAnatomicalStyle38Q1A,
  side: -1|1, pair: number, quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1A {
  const cfg = wingGeometryStyle(style.wing,pair);
  const rows = quality === 'LOW' ? 22 : quality === 'MEDIUM' ? 30 : 42;
  const cols = quality === 'LOW' ? 8 : quality === 'MEDIUM' ? 12 : 16;
  const positions: number[] = [],colors:number[]=[],uvs:number[]=[],faces:number[]=[];
  const base = new THREE.Color(cfg.material==='ELYTRON'?plan.shellHex:plan.shellSecondaryHex);
  const secondary = new THREE.Color(plan.neonHex);
  for(let j=0;j<=rows;j++){
    const t=j/rows;
    for(let i=0;i<=cols;i++){
      const s=i/cols*2-1;
      const p=wingPoint(side,pair,t,s,cfg);
      positions.push(p.x,p.y,p.z);uvs.push(t,(s+1)*.5);
      const veinFactor=Math.exp(-Math.abs(s-.18*Math.sin(t*8))/.16);
      const pigment=.12+.16*(1-Math.abs(s))+.19*veinFactor + .10*Math.sin((t*7+s*2.3)*Math.PI);
      const c=base.clone().lerp(secondary,clamp01(pigment*(style.wing==='MOTH_SAIL'?.68:1)));
      colors.push(c.r,c.g,c.b);
      if(j>0&&i>0){const a=j*(cols+1)+i,b=a-1,cidx=a-cols-1,d=cidx-1;
        faces.push(a,b,cidx,b,d,cidx);}
    }
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(positions.length),3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(faces);geo.computeVertexNormals();geo.computeBoundingBox();
  const mesh=new THREE.Mesh(geo,wingMaterial(cfg.material));
  mesh.userData['insectoidWingKind38Q1A']=style.wing;
  mesh.userData['insectoidWingSegments38Q1A']=rows*cols*2;
  mesh.userData['insectoidWingPair38Q1A']=pair;
  mesh.castShadow=cfg.material==='ELYTRON';
  mesh.renderOrder=1;
  return {mesh,name:'VIDA38_Q1A_VENATED_WING',part:'WING'};
}

export function buildVida38InsectoidWings38Q1A(plan: Vida38CivilizedInsectoidPlan38Q,
  quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1A[] {
  if(plan.wingPairs===0||!plan.wings)return [];
  const style=deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  const result:Vida38InsectoidOrganicMesh38Q1A[]=[];
  const veinColor=new THREE.Color(plan.shellHex).lerp(new THREE.Color(plan.shellSecondaryHex),.56).getStyle();
  const maxVeins=quality==='LOW'?3:quality==='MEDIUM'?4:5;
  for(const side of [-1,1] as const){
    for(let pair=0;pair<plan.wingPairs;pair++){
      const cfg=wingGeometryStyle(style.wing,pair);
      result.push(createWingSurface(plan,style,side,pair,quality));
      const root=wingPoint(side,pair,0,0,cfg);
      const shoulder=new THREE.Vector3(side*.12,1.80-pair*.14,-.27);
      result.push({mesh:tube([shoulder,shoulder.clone().lerp(root,.5),wingPoint(side,pair,.11,.1,cfg)],.020,plan.shellHex),name:'VIDA38_Q1A_WING_HINGE',part:'WING_ROOT'});
      // Nervadura costal y borde curvo: la membrana tiene estructura de ala, no un triángulo.
      const borderPoints=Array.from({length:13},(_,k)=>wingPoint(side,pair,k/12,-.94,cfg));
      const outerPoints=Array.from({length:13},(_,k)=>wingPoint(side,pair,k/12,.94,cfg));
      result.push({mesh:tube(borderPoints,style.wing==='ELYTRAL_COVER'?.008:.005,veinColor,.92),name:'VIDA38_Q1A_WING_LEADING_EDGE',part:'WING_VEIN'});
      result.push({mesh:tube(outerPoints,.0036,veinColor,.82),name:'VIDA38_Q1A_WING_TRAILING_EDGE',part:'WING_VEIN'});
      const shaft=Array.from({length:12},(_,k)=>wingPoint(side,pair,k/11,-.18,cfg));
      result.push({mesh:tube(shaft,.006,veinColor,.90),name:'VIDA38_Q1A_WING_CENTRAL_VEIN',part:'WING_VEIN'});
      for(let k=0;k<maxVeins;k++){
        const start=.20+k*.13;
        const end=Math.min(.98,start+.22);
        const spread=(k%2===0?.82:-.79);
        const branch=[
          wingPoint(side,pair,start,-.18,cfg),
          wingPoint(side,pair,(start+end)*.5,spread*.55,cfg),
          wingPoint(side,pair,end,spread,cfg),
        ];
        result.push({mesh:tube(branch,.0029,veinColor,.86),name:'VIDA38_Q1A_WING_BRANCH_VEIN',part:'WING_VEIN'});
      }
    }
  }
  return result;
}

function organicLoft(points:readonly THREE.Vector3[],radii:readonly number[],sides=12):THREE.BufferGeometry {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>p.clone()));
  const rows=Math.max(18,points.length*8);
  const p:number[]=[],ids:number[]=[],uv:number[]=[];
  for(let j=0;j<=rows;j++){
    const t=j/rows;
    const center=curve.getPoint(t),tan=curve.getTangent(t).normalize();
    const up=new THREE.Vector3(0,1,0);
    if(Math.abs(tan.dot(up))>.85)up.set(0,0,1);
    up.addScaledVector(tan,-tan.dot(up)).normalize();
    const right=new THREE.Vector3().crossVectors(tan,up).normalize();
    const d=t*(radii.length-1),i=Math.min(radii.length-2,Math.floor(d));
    const r=radii[i]!+(radii[i+1]!-radii[i]!)*(d-i);
    for(let k=0;k<=sides;k++){
      const angle=2*Math.PI*k/sides;
      const v=center.clone().addScaledVector(up,Math.cos(angle)*r).addScaledVector(right,Math.sin(angle)*r);
      p.push(v.x,v.y,v.z);uv.push(k/sides,t);
      if(j>0&&k>0){const idx=j*(sides+1)+k;ids.push(idx,idx-sides-1,idx-1,idx-1,idx-sides-1,idx-sides-2);}
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(ids);geometry.computeVertexNormals();geometry.computeBoundingBox();
  return geometry;
}

/** Aguijón enlazado al último segmento abdominal, con bulbo, vaina y lanceta. */
export function buildVida38InsectoidStinger38Q1A(plan:Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidOrganicMesh38Q1A[] {
  const style=deriveVida38InsectoidAnatomicalStyle38Q1A(plan);
  if(style.stinger==='NONE')return [];
  const result:Vida38InsectoidOrganicMesh38Q1A[]=[];
  const start=new THREE.Vector3(0,1.055,-.205*plan.abdomenScale-.025);
  const length=style.stinger==='ROBUST'?.32:style.stinger==='CEREMONIAL'?.38:.49;
  const bulge=new THREE.Vector3(0,1.020,start.z-.085);
  const middle=new THREE.Vector3(0,.995,start.z-.17);
  const end=new THREE.Vector3(0,.94,start.z-length);
  const shellMaterial=new THREE.MeshPhysicalMaterial({color:plan.shellHex,roughness:.43,metalness:.10,clearcoat:.20});
  const guardMaterial=new THREE.MeshPhysicalMaterial({color:plan.shellSecondaryHex,roughness:.48,metalness:.16});
  const tipMaterial=new THREE.MeshPhysicalMaterial({color:style.stinger==='CEREMONIAL'?plan.neonHex:plan.armorHex,roughness:.39,metalness:style.stinger==='CEREMONIAL'?.55:.21});
  const base=new THREE.Mesh(organicLoft([
    start, start.clone().lerp(bulge,.4),bulge,middle,
  ],[.095,.105,.082,.060],14),shellMaterial);
  result.push({mesh:base,name:'VIDA38_Q1A_INTEGRATED_STINGER_BULB',part:'STINGER_SHEATH'});
  const segments=style.stinger==='SEGMENTED'?3:2;
  const path=[middle, middle.clone().lerp(end,.33),middle.clone().lerp(end,.67),end];
  const tip=new THREE.Mesh(organicLoft(path,[.062,.051,.025,.002],12),tipMaterial);
  result.push({mesh:tip,name:'VIDA38_Q1A_ORGANIC_LANCET',part:'STINGER'});
  for(let k=0;k<segments;k++){
    const t=.14+k*.30;
    const along=middle.clone().lerp(end,t);
    const guard=new THREE.Mesh(new THREE.TorusGeometry(.050*(1-t*.55),.007,5,12),guardMaterial.clone());
    guard.position.copy(along);guard.rotation.x=.16;
    result.push({mesh:guard,name:'VIDA38_Q1A_STINGER_ARTICULATION',part:'STINGER_GUARD'});
  }
  if(style.stinger==='CEREMONIAL'){
    const filament=tube([
      middle.clone().add(new THREE.Vector3(0,.051,0)),
      middle.clone().lerp(end,.58).add(new THREE.Vector3(0,.033,0)),
      end.clone().add(new THREE.Vector3(0,.001,.02)),
    ],.004,plan.neonHex);
    result.push({mesh:filament,name:'VIDA38_Q1A_STINGER_GLOW_INLAY',part:'STINGER_GUARD'});
  }
  return result;
}
