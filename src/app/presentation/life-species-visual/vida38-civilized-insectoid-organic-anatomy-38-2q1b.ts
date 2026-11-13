/**
 * GENESIS · 38.2q1b — integración torácica de alas, abdomen terminal y refinamiento anatómico.
 * Mantiene la base cefálica 38.2q1a y refuerza anclajes, aguijón y patas insectoides.
 */
import * as THREE from 'three';
import type {
  Vida38CivilizedInsectoidPlan38Q,
  Vida38CivilizedInsectoidQuality38Q,
} from './vida38-civilized-insectoid-preview-38-2q';

export const VIDA38_INSECTOID_ORGANIC_REVISION_38Q1B = 'VIDA.38.2q1b/thorax-wing-tail-legs/v1' as const;

export type Vida38InsectoidWingKind38Q1B = 'VENATED_LANCE' | 'DOUBLE_VENATED' | 'MOTH_SAIL' | 'ELYTRAL_COVER' | 'VESTIGIAL';
export type Vida38InsectoidStingerKind38Q1B = 'NONE' | 'ROBUST' | 'LANCET' | 'SEGMENTED' | 'CEREMONIAL';
export type Vida38InsectoidHeadKind38Q1B = 'MANTID' | 'HYMENOPTERAN' | 'COLEOPTERAN' | 'CICADAN' | 'LEPIDOPTERAN' | 'ODONATAN' | 'PHASMATODEAN';
export interface Vida38InsectoidAnatomicalStyle38Q1B {
  readonly head: Vida38InsectoidHeadKind38Q1B;
  readonly wing: Vida38InsectoidWingKind38Q1B;
  readonly stinger: Vida38InsectoidStingerKind38Q1B;
  readonly cranialRidges: number;
  readonly scuteContrast: number;
  readonly signature: string;
}
export interface Vida38InsectoidOrganicMesh38Q1B {
  readonly mesh: THREE.Mesh;
  readonly name: string;
  readonly part: 'HEAD' | 'FACE_PLATE' | 'HEAD_RIDGE' | 'ANTENNAL_SOCKET' | 'WING' | 'WING_VEIN' | 'WING_ROOT' | 'STINGER' | 'STINGER_SHEATH' | 'STINGER_GUARD';
}
interface HeadProportions38Q1B {
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

export function deriveVida38InsectoidAnatomicalStyle38Q1B(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidAnatomicalStyle38Q1B {
  const head: Record<Vida38CivilizedInsectoidPlan38Q['archetype'], Vida38InsectoidHeadKind38Q1B> = {
    MANTID_SENTINEL: 'MANTID', BEETLE_BASTION: 'COLEOPTERAN', WASP_DIPLOMAT: 'HYMENOPTERAN',
    ANT_ENGINEER: 'HYMENOPTERAN', MOTH_ORACLE: 'LEPIDOPTERAN', DRAGONFLY_EXPLORER: 'ODONATAN',
    CICADA_ARCHIVIST: 'CICADAN', STICK_SCHOLAR: 'PHASMATODEAN',
  };
  const wings: Record<Vida38CivilizedInsectoidPlan38Q['archetype'], Vida38InsectoidWingKind38Q1B> = {
    MANTID_SENTINEL: 'VESTIGIAL', BEETLE_BASTION: 'ELYTRAL_COVER', WASP_DIPLOMAT: 'VENATED_LANCE',
    ANT_ENGINEER: 'VESTIGIAL', MOTH_ORACLE: 'MOTH_SAIL', DRAGONFLY_EXPLORER: 'DOUBLE_VENATED',
    CICADA_ARCHIVIST: 'VENATED_LANCE', STICK_SCHOLAR: 'VESTIGIAL',
  };
  const stinger: Vida38InsectoidStingerKind38Q1B = plan.stinger === 'NONE' ? 'NONE'
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

function proportions(kind: Vida38InsectoidHeadKind38Q1B): HeadProportions38Q1B {
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

function sculptHeadPoint(p: THREE.Vector3, plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1B): THREE.Vector3 {
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
  style: Vida38InsectoidAnatomicalStyle38Q1B, quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1B {
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
  head.userData['insectoidHeadKind38Q1B'] = style.head;
  head.userData['insectoidHeadFacets38Q1B'] = position.count;
  head.castShadow = true;
  return { mesh: head, name: 'VIDA38_Q1B_SCULPTED_CRANIUM', part: 'HEAD' };
}

function clypealShield(plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1B,
  quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1B {
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
      const width = .46 * (1 - .22 * Math.pow(Math.abs(yp), 1.7));
      const xp = u * width;
      const zp = Math.sqrt(Math.max(.015, 1 - xp * xp - yp * yp));
      const point = sculptHeadPoint(new THREE.Vector3(xp, yp, zp), plan, style);
      point.z += .007 + .005 * Math.sin(Math.PI * v) * (1 - u * u);
      vertices.push(point.x, point.y, point.z);
      const border = Math.min(i, cols - i, j, rows - j);
      const col = base.clone().lerp(edge, border <= 1 ? .65 : .12);
      colors.push(col.r, col.g, col.b);
      if (j > 0 && i > 0) {
        const a = j * (cols + 1) + i, b = a - 1, c = a - cols - 1, d = c - 1;
        faces.push(a, b, c, b, d, c);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(faces); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .61, metalness: .07, side: THREE.DoubleSide }));
  return { mesh, name: 'VIDA38_Q1B_CURVED_CLYPEAL_SHIELD', part: 'FACE_PLATE' };
}

export function deriveVida38InsectoidAuxiliaryEyeAnchors38Q1B(plan: Vida38CivilizedInsectoidPlan38Q): THREE.Vector3[] {
  const kind = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  let positions: readonly [number, number, number][];
  if (plan.extraEyes === 2) positions = [[-.31, .52, .79], [.31, .52, .79]];
  else if (plan.extraEyes === 3) positions = [[0, .72, .75], [-.36, .42, .84], [.36, .42, .84]];
  else if (plan.extraEyes === 4) positions = [[-.31, .67, .70], [.31, .67, .70], [-.40, .32, .84], [.40, .32, .84]];
  else positions = [];
  return positions.map(([x, y, z]) => {
    const p = sculptHeadPoint(new THREE.Vector3(x, y, z).normalize(), plan, kind);
    p.z += .012;
    return p;
  });
}

export function deriveVida38InsectoidAntennaRoot38Q1B(plan: Vida38CivilizedInsectoidPlan38Q, side: -1 | 1): THREE.Vector3 {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  return sculptHeadPoint(new THREE.Vector3(side * .35, .95, .10).normalize(), plan, style);
}

export function deriveVida38InsectoidMandibleRoot38Q1B(plan: Vida38CivilizedInsectoidPlan38Q, side: -1 | 1): THREE.Vector3 {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  const p = sculptHeadPoint(new THREE.Vector3(side * .42, -.73, .53).normalize(), plan, style);
  p.z += .018;
  return p;
}

export function deriveVida38InsectoidEyeAnchor38Q1B(plan: Vida38CivilizedInsectoidPlan38Q,
  side: -1 | 1): { position: THREE.Vector3; scale: THREE.Vector3 } {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
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
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(8, points.length * 4), radius, 5, false),
    new THREE.MeshPhysicalMaterial({ color, roughness: .56, metalness: .08, transparent: opacity < 1, opacity, side: THREE.DoubleSide }),
  );
}

function lineFromHead(plan: Vida38CivilizedInsectoidPlan38Q, style: Vida38InsectoidAnatomicalStyle38Q1B,
  source: readonly [number, number, number][], offset = .007): THREE.Vector3[] {
  return source.map(([x, y, z]) => {
    const p = new THREE.Vector3(x, y, z).normalize();
    const v = sculptHeadPoint(p, plan, style);
    v.z += offset;
    return v;
  });
}

export function buildVida38InsectoidHead38Q1B(plan: Vida38CivilizedInsectoidPlan38Q,
  quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1B[] {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  const result: Vida38InsectoidOrganicMesh38Q1B[] = [buildSculptedHead(plan, style, quality), clypealShield(plan, style, quality)];
  const ridgeColor = new THREE.Color(plan.shellHex).lerp(new THREE.Color(plan.shellSecondaryHex), .46).getStyle();
  for (const side of [-1, 1] as const) {
    const brow = lineFromHead(plan, style, [
      [side * .38, .27, .88], [side * .57, .30, .78], [side * .76, .22, .58],
      [side * .87, .09, .40],
    ], .009);
    result.push({ mesh: tube(brow, .008 * plan.headScale, ridgeColor), name: 'VIDA38_Q1B_SUPRAOCULAR_RIDGE', part: 'HEAD_RIDGE' });
    const cheek = lineFromHead(plan, style, [
      [side * .78, -.19, .59], [side * .70, -.41, .57], [side * .50, -.63, .58], [side * .28, -.73, .61],
    ], .008);
    result.push({ mesh: tube(cheek, .005 * plan.headScale, ridgeColor), name: 'VIDA38_Q1B_GENAL_SUTURE', part: 'HEAD_RIDGE' });
    const antennal = sculptHeadPoint(new THREE.Vector3(side * .38, .92, .10).normalize(), plan, style);
    const socket = new THREE.Mesh(new THREE.TorusGeometry(.040 * plan.headScale, .008 * plan.headScale, 6, 16),
      new THREE.MeshPhysicalMaterial({ color: plan.shellSecondaryHex, roughness: .46, metalness: .14 }));
    socket.position.set(antennaLateralX(side, plan, style), antennal.y + .012, antennal.z + .005);
    socket.rotation.x = Math.PI * .5;
    result.push({ mesh: socket, name: 'VIDA38_Q1B_ANTENNAL_SOCKET', part: 'ANTENNAL_SOCKET' });
  }
  const centerSeam = lineFromHead(plan, style, [[0, .84, .54], [0, .55, .85], [0, .20, .99], [0, -.16, .98]], .009);
  result.push({ mesh: tube(centerSeam, .0048 * plan.headScale, ridgeColor), name: 'VIDA38_Q1B_FRONTAL_SUTURE', part: 'HEAD_RIDGE' });
  return result;
}
function antennaLateralX(side: -1 | 1, plan: Vida38CivilizedInsectoidPlan38Q,
  style: Vida38InsectoidAnatomicalStyle38Q1B): number {
  return side * .13 * plan.headScale * proportions(style.head).width;
}

interface WingGeometryStyle38Q1B {
  readonly spread: number;
  readonly length: number;
  readonly chord: number;
  readonly rise: number;
  readonly sweep: number;
  readonly scallop: number;
  readonly membraneLift: number;
  readonly material: 'MEMBRANE' | 'ELYTRON';
}
function wingGeometryStyle(kind: Vida38InsectoidWingKind38Q1B, pair: number): WingGeometryStyle38Q1B {
  const scale = pair === 0 ? 1 : .80;
  switch (kind) {
    case 'MOTH_SAIL': return { spread: .78 * scale, length: .92 * scale, chord: .37 * scale, rise: .18, sweep: .68 * scale, scallop: .085, membraneLift: .06, material: 'MEMBRANE' };
    case 'DOUBLE_VENATED': return { spread: .94 * scale, length: 1.02 * scale, chord: .22 * scale, rise: .17, sweep: .80 * scale, scallop: .018, membraneLift: .05, material: 'MEMBRANE' };
    case 'VENATED_LANCE': return { spread: .76 * scale, length: .80 * scale, chord: .22 * scale, rise: .10, sweep: .70 * scale, scallop: .032, membraneLift: .04, material: 'MEMBRANE' };
    case 'ELYTRAL_COVER': return { spread: .60 * scale, length: .70 * scale, chord: .27 * scale, rise: .04, sweep: .51 * scale, scallop: .010, membraneLift: .03, material: 'ELYTRON' };
    case 'VESTIGIAL': return { spread: .38 * scale, length: .46 * scale, chord: .12 * scale, rise: -.06, sweep: .39 * scale, scallop: .010, membraneLift: .02, material: 'MEMBRANE' };
  }
}

export function deriveVida38InsectoidWingRootAnchor38Q1B(plan: Vida38CivilizedInsectoidPlan38Q,
  side: -1 | 1, pair: number): { root: THREE.Vector3; dorsal: THREE.Vector3; cover: number } {
  const thoraxWidth = .19 + .07 * plan.thoraxScale;
  const dorsalLift = 1.70 + .11 * plan.thoraxScale - pair * .11;
  const sidePush = thoraxWidth * (side === -1 ? -1 : 1);
  const root = new THREE.Vector3(sidePush * .90, dorsalLift, -.10 - pair * .03);
  const dorsal = new THREE.Vector3(sidePush * .74, dorsalLift + .04, -.06 - pair * .03);
  return { root, dorsal, cover: .045 + pair * .004 };
}

function wingPoint(anchor: THREE.Vector3, side: -1 | 1, t: number, across: number,
  cfg: WingGeometryStyle38Q1B): THREE.Vector3 {
  const sin = Math.max(0, Math.sin(Math.PI * t));
  const flutter = 1 + cfg.scallop * Math.sin((t * 6.0 + .10) * Math.PI);
  const chordWidth = cfg.chord * Math.pow(sin, .74) * flutter;
  const x = anchor.x + side * (.03 + cfg.spread * t + across * chordWidth * .35);
  const y = anchor.y + cfg.rise * t - .16 * cfg.length * t * t + across * chordWidth * .82;
  const z = anchor.z - cfg.sweep * t - .030 * cfg.length * t * t
    + across * (.030 + .017 * t) + cfg.membraneLift * Math.pow(sin, 2) * (1 - across * across)
    + .014 * Math.sin(t * Math.PI * 1.6) * across;
  return new THREE.Vector3(x, y, z);
}

function wingMaterial(kind: WingGeometryStyle38Q1B['material']): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff', vertexColors: true, metalness: kind === 'ELYTRON' ? .20 : .03,
    roughness: kind === 'ELYTRON' ? .42 : .55,
    clearcoat: kind === 'ELYTRON' ? .44 : .12,
    side: THREE.DoubleSide,
    transparent: kind === 'MEMBRANE', opacity: kind === 'MEMBRANE' ? .78 : 1,
    depthWrite: kind === 'ELYTRON',
  });
}

function createWingSurface(plan: Vida38CivilizedInsectoidPlan38Q, style: Vida38InsectoidAnatomicalStyle38Q1B,
  side: -1 | 1, pair: number, quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1B {
  const cfg = wingGeometryStyle(style.wing, pair);
  const anchor = deriveVida38InsectoidWingRootAnchor38Q1B(plan, side, pair).root;
  const rows = quality === 'LOW' ? 22 : quality === 'MEDIUM' ? 30 : 42;
  const cols = quality === 'LOW' ? 8 : quality === 'MEDIUM' ? 12 : 16;
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], faces: number[] = [];
  const base = new THREE.Color(cfg.material === 'ELYTRON' ? plan.shellHex : plan.shellSecondaryHex);
  const secondary = new THREE.Color(plan.neonHex);
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= cols; i++) {
      const s = i / cols * 2 - 1;
      const p = wingPoint(anchor, side, t, s, cfg);
      positions.push(p.x, p.y, p.z); uvs.push(t, (s + 1) * .5);
      const veinFactor = Math.exp(-Math.abs(s - .18 * Math.sin(t * 8)) / .16);
      const pigment = .12 + .16 * (1 - Math.abs(s)) + .19 * veinFactor + .10 * Math.sin((t * 7 + s * 2.3) * Math.PI);
      const c = base.clone().lerp(secondary, clamp01(pigment * (style.wing === 'MOTH_SAIL' ? .68 : 1)));
      colors.push(c.r, c.g, c.b);
      if (j > 0 && i > 0) {
        const a = j * (cols + 1) + i, b = a - 1, cidx = a - cols - 1, d = cidx - 1;
        faces.push(a, b, cidx, b, d, cidx);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(positions.length), 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(faces); geo.computeVertexNormals(); geo.computeBoundingBox();
  const mesh = new THREE.Mesh(geo, wingMaterial(cfg.material));
  mesh.userData['insectoidWingKind38Q1B'] = style.wing;
  mesh.userData['insectoidWingSegments38Q1B'] = rows * cols * 2;
  mesh.userData['insectoidWingPair38Q1B'] = pair;
  mesh.castShadow = cfg.material === 'ELYTRON';
  mesh.renderOrder = 1;
  return { mesh, name: 'VIDA38_Q1B_INTEGRATED_WING', part: 'WING' };
}

function buildWingRootPlate(plan: Vida38CivilizedInsectoidPlan38Q, side: -1 | 1, pair: number): THREE.Mesh {
  const anchor = deriveVida38InsectoidWingRootAnchor38Q1B(plan, side, pair);
  const geometry = new THREE.SphereGeometry(anchor.cover, 12, 9, 0, Math.PI * 1.2, 0, Math.PI * .9);
  geometry.translate(anchor.root.x, anchor.root.y, anchor.root.z + .012);
  geometry.scale(1.12, .72, .92);
  const material = new THREE.MeshPhysicalMaterial({ color: plan.shellHex, roughness: .48, metalness: .12, clearcoat: .18 });
  return new THREE.Mesh(geometry, material);
}

export function buildVida38InsectoidWings38Q1B(plan: Vida38CivilizedInsectoidPlan38Q,
  quality: Vida38CivilizedInsectoidQuality38Q): Vida38InsectoidOrganicMesh38Q1B[] {
  if (plan.wingPairs === 0 || !plan.wings) return [];
  const style = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  const result: Vida38InsectoidOrganicMesh38Q1B[] = [];
  const veinColor = new THREE.Color(plan.shellHex).lerp(new THREE.Color(plan.shellSecondaryHex), .56).getStyle();
  const maxVeins = quality === 'LOW' ? 3 : quality === 'MEDIUM' ? 4 : 5;
  for (const side of [-1, 1] as const) {
    for (let pair = 0; pair < plan.wingPairs; pair++) {
      const cfg = wingGeometryStyle(style.wing, pair);
      const anchor = deriveVida38InsectoidWingRootAnchor38Q1B(plan, side, pair);
      result.push(createWingSurface(plan, style, side, pair, quality));
      result.push({ mesh: buildWingRootPlate(plan, side, pair), name: 'VIDA38_Q1B_WING_ROOT_PLATE', part: 'WING_ROOT' });
      result.push({ mesh: tube([
        anchor.dorsal.clone().add(new THREE.Vector3(side * -.012, .010, .030)),
        anchor.root.clone().add(new THREE.Vector3(0, .010, .020)),
        wingPoint(anchor.root, side, .08, .08, cfg),
      ], .018, plan.shellHex), name: 'VIDA38_Q1B_WING_HINGE', part: 'WING_ROOT' });
      const borderPoints = Array.from({ length: 13 }, (_, k) => wingPoint(anchor.root, side, k / 12, -.94, cfg));
      const outerPoints = Array.from({ length: 13 }, (_, k) => wingPoint(anchor.root, side, k / 12, .94, cfg));
      result.push({ mesh: tube(borderPoints, style.wing === 'ELYTRAL_COVER' ? .008 : .005, veinColor, .92), name: 'VIDA38_Q1B_WING_LEADING_EDGE', part: 'WING_VEIN' });
      result.push({ mesh: tube(outerPoints, .0036, veinColor, .82), name: 'VIDA38_Q1B_WING_TRAILING_EDGE', part: 'WING_VEIN' });
      const shaft = Array.from({ length: 12 }, (_, k) => wingPoint(anchor.root, side, k / 11, -.12, cfg));
      result.push({ mesh: tube(shaft, .006, veinColor, .90), name: 'VIDA38_Q1B_WING_CENTRAL_VEIN', part: 'WING_VEIN' });
      for (let k = 0; k < maxVeins; k++) {
        const start = .20 + k * .13;
        const end = Math.min(.98, start + .22);
        const spread = (k % 2 === 0 ? .82 : -.79);
        const branch = [
          wingPoint(anchor.root, side, start, -.12, cfg),
          wingPoint(anchor.root, side, (start + end) * .5, spread * .55, cfg),
          wingPoint(anchor.root, side, end, spread, cfg),
        ];
        result.push({ mesh: tube(branch, .0029, veinColor, .86), name: 'VIDA38_Q1B_WING_BRANCH_VEIN', part: 'WING_VEIN' });
      }
    }
  }
  return result;
}

/**
 * 38.2q1c: tubo orgánico con marcos transportados en paralelo y caras EXTERIORES.
 * El loft anterior invertía el winding y cambiaba bruscamente de eje cuando
 * la tangente se acercaba a Y, haciendo desaparecer el aguijón al girar.
 */
function organicLoft(points: readonly THREE.Vector3[], radii: readonly number[], sides = 12): THREE.BufferGeometry {
  if (points.length < 2 || radii.length < 2) throw new Error('38.2q1c: el loft necesita al menos dos perfiles');
  const curve = new THREE.CatmullRomCurve3(points.map(point => point.clone()), false, 'centripetal');
  const rows = Math.max(24, points.length * 10);
  const frames = curve.computeFrenetFrames(rows, false);
  const coords: number[] = [], triangles: number[] = [], uv: number[] = [];
  const ringSize = sides + 1;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const center = curve.getPointAt(t);
    const normal = frames.normals[j]!;
    const binormal = frames.binormals[j]!;
    const fraction = t * (radii.length - 1);
    const segment = Math.min(radii.length - 2, Math.floor(fraction));
    const radius = Math.max(.001, THREE.MathUtils.lerp(radii[segment]!, radii[segment + 1]!, fraction - segment));
    for (let k = 0; k <= sides; k++) {
      const theta = 2 * Math.PI * k / sides;
      const point = center.clone()
        .addScaledVector(normal, Math.cos(theta) * radius)
        .addScaledVector(binormal, Math.sin(theta) * radius);
      coords.push(point.x, point.y, point.z);
      uv.push(k / sides, t);
      if (j === 0 || k === 0) continue;
      const a = (j - 1) * ringSize + k - 1;
      const b = a + 1;
      const c = j * ringSize + k - 1;
      const d = c + 1;
      // +ángulo × +trayectoria = normal radial EXTERIOR.
      triangles.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

/** Reproduce la cara posterior exacta del núcleo 38.2q1b a la altura abdominal. */
function coreRearZ38Q1C(plan: Vida38CivilizedInsectoidPlan38Q, y: number): number {
  const t = clamp01((y - .91) / 1.03);
  const waist = .14 + .05 * Math.sin(t * Math.PI);
  const thorax = .25 * plan.thoraxScale * Math.exp(-Math.pow((t - .71) / .23, 2));
  const abdomen = .22 * plan.abdomenScale * Math.exp(-Math.pow((t - .30) / .24, 2));
  const radius = waist + thorax + abdomen - .095;
  const depth = .79 + .09 * Math.cos(Math.PI * t);
  const ring = .008 * Math.cos(t * 18 * Math.PI + plan.armorDensity * 3);
  return -(radius * depth + ring * .55) - .040 * (1 - t) - .01;
}

/** Radio lateral a cada altura, calculado a partir de la misma ecuación que el tórax. */
export function deriveVida38InsectoidTorsoSideRadius38Q1C(plan: Vida38CivilizedInsectoidPlan38Q, y: number): number {
  const t = clamp01((y - .91) / 1.03);
  const waist = .14 + .05 * Math.sin(t * Math.PI);
  const thorax = .25 * plan.thoraxScale * Math.exp(-Math.pow((t - .71) / .23, 2));
  const abdomen = .22 * plan.abdomenScale * Math.exp(-Math.pow((t - .30) / .24, 2));
  const radius = waist + thorax + abdomen - .095;
  const ring = .008 * Math.cos(t * 18 * Math.PI + plan.armorDensity * 3);
  const thoraxBand = Math.exp(-Math.pow((t - .70) / .11, 2));
  const abdomenBand = Math.exp(-Math.pow((t - .30) / .12, 2));
  const segmentWave = .020 * Math.sin((t * 7.4 + .08) * Math.PI);
  const rib = 1 + .035 * Math.cos(2 * Math.PI + plan.armLengthScale);
  const shoulder = 1 + .18 * thoraxBand;
  const abdominal = 1 + .11 * abdomenBand * .35;
  const notch = 1 - .10 * Math.exp(-Math.pow((t - .52) / .18, 2));
  return Math.max(.08, (radius + ring + segmentWave * .5) * rib * shoulder * abdominal * notch);
}

/** Anclaje biológico: primera sección del brazo DENTRO del volumen torácico. */
export function deriveVida38InsectoidShoulderFrame38Q1C(
  plan: Vida38CivilizedInsectoidPlan38Q, index: number, side: -1 | 1,
): { inside: THREE.Vector3; surface: THREE.Vector3; outside: THREE.Vector3; y: number; torsoRadius: number } {
  const fraction = plan.armPairs === 1 ? .3 : index / Math.max(1, plan.armPairs - 1);
  const y = 1.72 - fraction * .38;
  const z = .03 - fraction * .045;
  const torsoRadius = deriveVida38InsectoidTorsoSideRadius38Q1C(plan, y);
  const inside = new THREE.Vector3(side * Math.max(.055, torsoRadius - .095), y, z);
  const surface = new THREE.Vector3(side * torsoRadius, y, z);
  const outside = new THREE.Vector3(side * (torsoRadius + .035), y - .012, z + .016);
  return { inside, surface, outside, y, torsoRadius };
}

export function deriveVida38InsectoidStingerBase38Q1B(plan: Vida38CivilizedInsectoidPlan38Q): THREE.Vector3 {
  const y = 1.08;
  // 5 cm en el interior del abdomen: no hay anillo visible al comenzar.
  return new THREE.Vector3(0, y, coreRearZ38Q1C(plan, y) + .055);
}

export function buildVida38InsectoidStinger38Q1B(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidOrganicMesh38Q1B[] {
  const style = deriveVida38InsectoidAnatomicalStyle38Q1B(plan);
  if (style.stinger === 'NONE') return [];
  const base = deriveVida38InsectoidStingerBase38Q1B(plan);
  const length = style.stinger === 'ROBUST' ? .29 : style.stinger === 'CEREMONIAL' ? .36 : .43;
  const rootColor = new THREE.Color(plan.shellHex);
  const tipColor = new THREE.Color(plan.shellSecondaryHex).lerp(new THREE.Color(plan.armorHex), .30);
  const result: Vida38InsectoidOrganicMesh38Q1B[] = [];

  // La pieza principal es UN ÚNICO volumen. Base enterrada en el abdomen,
  // expansión muscular, transición suave y punta continua sin collar circular.
  const mainPath = [
    base.clone().add(new THREE.Vector3(0, .011, .018)),
    base.clone().add(new THREE.Vector3(0, .000, -.018)),
    base.clone().add(new THREE.Vector3(0, -.012, -length * .20)),
    base.clone().add(new THREE.Vector3(0, -.023, -length * .41)),
    base.clone().add(new THREE.Vector3(0, -.028, -length * .64)),
    base.clone().add(new THREE.Vector3(0, -.027, -length * .83)),
    base.clone().add(new THREE.Vector3(0, -.025, -length)),
  ];
  const radius = style.stinger === 'ROBUST'
    ? [.112, .114, .096, .076, .053, .028, .0015]
    : style.stinger === 'SEGMENTED'
      ? [.110, .113, .091, .067, .040, .019, .0015]
      : [.110, .110, .083, .056, .031, .013, .0015];
  const shaftGeo = organicLoft(mainPath, radius, 18);
  const shaftPos = shaftGeo.getAttribute('position') as THREE.BufferAttribute;
  const shaftColors: number[] = [];
  for (let k = 0; k < shaftPos.count; k++) {
    const section = Math.floor(k / 19);
    const t = section / Math.max(1, (shaftPos.count / 19) - 1);
    const collar = Math.sin(t * Math.PI * (style.stinger === 'SEGMENTED' ? 9 : 4));
    const blend = Math.min(.65, .12 + .43 * t + (style.stinger === 'SEGMENTED' ? .11 * Math.max(0, collar) : 0));
    const color = rootColor.clone().lerp(tipColor, blend);
    shaftColors.push(color.r, color.g, color.b);
  }
  shaftGeo.setAttribute('color', new THREE.Float32BufferAttribute(shaftColors, 3));
  const shaftMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: .48, metalness: .08, clearcoat: .12,
    side: THREE.FrontSide, depthWrite: true,
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.name = 'VIDA38_Q1C_SINGLE_PIECE_STINGER';
  shaft.userData['vida38StingerContinuity38Q1C'] = true;
  shaft.userData['vida38StingerBaseEmbedded38Q1C'] = .055;
  result.push({ mesh: shaft, name: shaft.name, part: 'STINGER' });

  // Costillas quitinosas longitudinales hundidas en el volumen; sirven como
  // refuerzo visible, nunca como anillos ni cilindros abiertos de enchufe.
  for (const side of [-1, 1] as const) {
    const rootRidge = new THREE.Mesh(organicLoft([
      base.clone().add(new THREE.Vector3(side * .078, .034, -.045)),
      base.clone().add(new THREE.Vector3(side * .066, .029, -.112)),
      base.clone().add(new THREE.Vector3(side * .040, .020, -.186)),
      base.clone().add(new THREE.Vector3(side * .009, .010, -.268)),
    ], [.010, .014, .009, .001], 8), new THREE.MeshPhysicalMaterial({
      color: plan.shellHex, roughness: .53, metalness: .07, side: THREE.FrontSide,
    }));
    result.push({ mesh: rootRidge, name: 'VIDA38_Q1C_TERMINAL_CARINA', part: 'STINGER_GUARD' });
    const cover = new THREE.Mesh(organicLoft([
      base.clone().add(new THREE.Vector3(side * .085, -.035, -.034)),
      base.clone().add(new THREE.Vector3(side * .074, -.029, -.088)),
      base.clone().add(new THREE.Vector3(side * .052, -.021, -.151)),
      base.clone().add(new THREE.Vector3(side * .018, -.009, -.214)),
    ], [.010, .014, .009, .001], 8), new THREE.MeshPhysicalMaterial({
      color: plan.shellSecondaryHex, roughness: .57, metalness: .06, side: THREE.FrontSide,
    }));
    result.push({ mesh: cover, name: 'VIDA38_Q1C_INTEGRATED_ABDOMINAL_FLAP', part: 'STINGER_SHEATH' });
  }
  return result;
}
