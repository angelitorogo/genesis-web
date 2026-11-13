import * as THREE from 'three';
import type {
  Vida38CivilizedInsectoidPlan38Q,
  Vida38CivilizedInsectoidQuality38Q,
} from './vida38-civilized-insectoid-preview-38-2q';
import {
  createVida38InsectoidFlyEye38Q1E,
  deriveVida38InsectoidFlyEyeSpec38Q1E,
} from './vida38-civilized-insectoid-compound-eye-38-2q1e';
import {
  VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D,
  deriveVida38InsectoidDarkEyePlan38Q1D,
} from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';
import {
  deriveVida38InsectoidEyeAnchor38Q1B,
} from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';

export const VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F =
  'VIDA.38.2q1f2/ocular-balanced-placement/v3' as const;

export const VIDA38_INSECTOID_EYE_FAMILIES_38Q1F = [
  'ROUNDED_COMPOUND',
  'OVAL_COMPOUND',
  'ANGULAR_COMPOUND',
  'LATERAL_COMPOUND',
  'PSEUDO_ARACHNOID',
  'REDUCED_COMPOUND_OCELLI',
] as const;

export type Vida38InsectoidEyeFamily38Q1F = typeof VIDA38_INSECTOID_EYE_FAMILIES_38Q1F[number];

export interface Vida38InsectoidOcularPlan38Q1F {
  readonly revision: typeof VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F;
  readonly family: Vida38InsectoidEyeFamily38Q1F;
  readonly lateralScale: Readonly<{ x: number; y: number; z: number }>;
  readonly lateralInset: number;
  readonly lateralLift: number;
  readonly lateralRotationY: number;
  readonly lateralRotationZ: number;
  readonly frontalAnchorFactor: number;
  readonly surfaceEmbedDepth: number;
  readonly specialEyeCount: number;
  readonly specialEyeScale: number;
  readonly dominantOcelli: boolean;
  readonly signature: string;
}

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  return h >>> 0;
}
function unit(seed: string): number { return hash32(seed) / 0xffffffff; }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp(v: number, a: number, b: number): number { return Math.max(a, Math.min(b, v)); }

function chooseFamily(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidEyeFamily38Q1F {
  const seed = `${plan.speciesId}|${plan.signature}|Q1F-EYE-FAMILY`;
  switch (plan.archetype) {
    case 'DRAGONFLY_EXPLORER': return 'LATERAL_COMPOUND';
    case 'BEETLE_BASTION': return 'ANGULAR_COMPOUND';
    case 'MOTH_ORACLE': return 'REDUCED_COMPOUND_OCELLI';
    case 'MANTID_SENTINEL': return 'PSEUDO_ARACHNOID';
    case 'CICADA_ARCHIVIST': return unit(`${seed}|cicada`) > .54 ? 'OVAL_COMPOUND' : 'REDUCED_COMPOUND_OCELLI';
    case 'WASP_DIPLOMAT': return unit(`${seed}|wasp`) > .48 ? 'OVAL_COMPOUND' : 'ANGULAR_COMPOUND';
    case 'ANT_ENGINEER': return unit(`${seed}|ant`) > .45 ? 'OVAL_COMPOUND' : 'ROUNDED_COMPOUND';
    case 'STICK_SCHOLAR': return unit(`${seed}|stick`) > .42 ? 'LATERAL_COMPOUND' : 'ROUNDED_COMPOUND';
    default:
      return VIDA38_INSECTOID_EYE_FAMILIES_38Q1F[hash32(seed) % VIDA38_INSECTOID_EYE_FAMILIES_38Q1F.length]!;
  }
}

export function deriveVida38InsectoidOcularPlan38Q1F(plan: Vida38CivilizedInsectoidPlan38Q): Vida38InsectoidOcularPlan38Q1F {
  const seed = `${plan.speciesId}|${plan.signature}|Q1F-EYES`;
  const family = chooseFamily(plan);
  let lateralScale = { x: .88, y: .93, z: .86 };
  let lateralInset = .004;
  let lateralLift = 0;
  let lateralRotationY = .20;
  let lateralRotationZ = 0;
  let frontalAnchorFactor = .88;
  let surfaceEmbedDepth = .020;
  let specialEyeCount = 0;
  let specialEyeScale = .032;
  let dominantOcelli = false;
  switch (family) {
    case 'ROUNDED_COMPOUND':
      lateralScale = { x: .88, y: .94, z: .88 };
      lateralInset = .004;
      frontalAnchorFactor = .87;
      lateralRotationY = .18;
      break;
    case 'OVAL_COMPOUND':
      lateralScale = { x: .85, y: 1.12, z: .84 };
      lateralInset = .005;
      frontalAnchorFactor = .87;
      lateralLift = .006;
      lateralRotationY = .14;
      break;
    case 'ANGULAR_COMPOUND':
      lateralScale = { x: .96, y: .90, z: .83 };
      lateralInset = .004;
      frontalAnchorFactor = .90;
      lateralRotationY = .28;
      lateralRotationZ = .11;
      break;
    case 'LATERAL_COMPOUND':
      lateralScale = { x: 1.15, y: .88, z: .80 };
      lateralInset = .003;
      lateralRotationY = .10;
      frontalAnchorFactor = .93;
      break;
    case 'PSEUDO_ARACHNOID':
      lateralScale = { x: .84, y: .87, z: .85 };
      lateralInset = .005;
      frontalAnchorFactor = .88;
      lateralLift = .010;
      lateralRotationY = .05;
      specialEyeCount = 6;
      specialEyeScale = .020;
      dominantOcelli = true;
      break;
    case 'REDUCED_COMPOUND_OCELLI':
      lateralScale = { x: .79, y: .83, z: .81 };
      lateralInset = .005;
      frontalAnchorFactor = .89;
      lateralLift = .004;
      lateralRotationY = .04;
      specialEyeCount = 4;
      specialEyeScale = .025;
      dominantOcelli = true;
      break;
  }
  // Perturbación determinista leve intra-familia.
  const sx = lateralScale.x * lerp(.975, 1.025, unit(`${seed}|sx`));
  const sy = lateralScale.y * lerp(.975, 1.025, unit(`${seed}|sy`));
  const sz = lateralScale.z * lerp(.975, 1.025, unit(`${seed}|sz`));
  lateralInset += lerp(-.0015, .0015, unit(`${seed}|inset`));
  lateralLift += lerp(-.004, .004, unit(`${seed}|lift`));
  lateralRotationY += lerp(-.05, .05, unit(`${seed}|ry`));
  lateralRotationZ += lerp(-.07, .07, unit(`${seed}|rz`));
  const signature = [family, sx.toFixed(4), sy.toFixed(4), sz.toFixed(4), lateralInset.toFixed(4),
    lateralLift.toFixed(4), lateralRotationY.toFixed(4), lateralRotationZ.toFixed(4),
    frontalAnchorFactor.toFixed(4), surfaceEmbedDepth.toFixed(4),
    specialEyeCount, specialEyeScale.toFixed(4), dominantOcelli].join('|');
  return {
    revision: VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F,
    family,
    lateralScale: { x: sx, y: sy, z: sz },
    lateralInset,
    lateralLift,
    lateralRotationY,
    lateralRotationZ,
    frontalAnchorFactor,
    surfaceEmbedDepth,
    specialEyeCount,
    specialEyeScale,
    dominantOcelli,
    signature,
  };
}

function mutateGeometryForFamily(geometry: THREE.BufferGeometry, family: Vida38InsectoidEyeFamily38Q1F): void {
  const position = geometry.getAttribute('position');
  if (!(position instanceof THREE.BufferAttribute)) return;
  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i);
    let y = position.getY(i);
    let z = position.getZ(i);
    switch (family) {
      case 'ROUNDED_COMPOUND': {
        z *= .98;
        break;
      }
      case 'OVAL_COMPOUND': {
        y *= 1.08;
        z *= .98;
        break;
      }
      case 'ANGULAR_COMPOUND': {
        x = Math.sign(x) * Math.pow(Math.abs(x), .88);
        y = Math.sign(y) * Math.pow(Math.abs(y), .91);
        z = Math.sign(z) * Math.pow(Math.abs(z), 1.12) * .98;
        break;
      }
      case 'LATERAL_COMPOUND': {
        x *= 1.12;
        y *= .96;
        z *= .94;
        break;
      }
      case 'PSEUDO_ARACHNOID': {
        x *= .98;
        y *= .98;
        z *= 1.00;
        break;
      }
      case 'REDUCED_COMPOUND_OCELLI': {
        x *= .98;
        y *= .97;
        z *= 1.00;
        break;
      }
    }
    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

/** Encuentra la superficie frontal REAL de la cabeza ya esculpida. La órbita se
 * coloca sobre el cráneo y no detrás de la geometría facial.
 * Se calcula en coordenadas locales del sujeto antes de normalizar el visor.
 */
export function findVida38InsectoidFrontalCraniumPoint38Q1F(
  head: THREE.Mesh | undefined,
  x: number,
  y: number,
  fallbackZ: number,
): THREE.Vector3 {
  if (!head) return new THREE.Vector3(x, y, fallbackZ);
  head.updateWorldMatrix(true, false);
  const localOrigin = new THREE.Vector3(x, y, 2.0);
  const worldOrigin = head.localToWorld(localOrigin);
  const direction = new THREE.Vector3(0, 0, -1).transformDirection(head.matrixWorld);
  const raycaster = new THREE.Raycaster(worldOrigin, direction, 0, 4);
  const hits = raycaster.intersectObject(head, false);
  if (hits.length > 0) return head.worldToLocal(hits[0]!.point.clone());
  return new THREE.Vector3(x, y, fallbackZ);
}

export function createVida38InsectoidDiversePrimaryEye38Q1F(
  plan: Vida38CivilizedInsectoidPlan38Q,
  side: -1 | 1,
  quality: Vida38CivilizedInsectoidQuality38Q,
  head?: THREE.Mesh,
): THREE.Mesh {
  const ocular = deriveVida38InsectoidOcularPlan38Q1F(plan);
  const eye = createVida38InsectoidFlyEye38Q1E(plan, side, quality);
  mutateGeometryForFamily(eye.geometry as THREE.BufferGeometry, ocular.family);
  eye.scale.multiply(new THREE.Vector3(ocular.lateralScale.x, ocular.lateralScale.y, ocular.lateralScale.z));
  // 38.2q1f2: calibración intermedia. Conserva el contacto con el cráneo
  // de q1f1, pero limita el tamaño y recupera la separación orbital lateral.
  // La superficie del cráneo sigue calculándose mediante raycasting.
  const anatomical = deriveVida38InsectoidEyeAnchor38Q1B(plan, side);
  const desiredX = side * (Math.abs(anatomical.position.x) * ocular.frontalAnchorFactor - ocular.lateralInset * plan.headScale);
  const desiredY = anatomical.position.y + ocular.lateralLift * plan.headScale;
  const fallbackZ = anatomical.position.z + .13 * plan.headScale;
  const surface = findVida38InsectoidFrontalCraniumPoint38Q1F(head, desiredX, desiredY, fallbackZ);
  eye.position.set(desiredX, desiredY, surface.z - ocular.surfaceEmbedDepth * plan.headScale);
  eye.rotation.y = side * ocular.lateralRotationY;
  eye.rotation.z = side * ocular.lateralRotationZ;
  eye.userData['vida38InsectoidEyeFamily38Q1F'] = ocular.family;
  eye.userData['vida38InsectoidEyeSurfaceZ38Q1F1'] = surface.z;
  eye.userData['vida38InsectoidEyeProtrusion38Q1F1'] = eye.position.z + eye.scale.z - surface.z;
  eye.userData['vida38InsectoidOcularDiversityRevision38Q1F'] = ocular.revision;
  eye.userData['vida38InsectoidOcularPlan38Q1F'] = ocular.signature;
  return eye;
}

function specialEyeMaterial(plan: Vida38CivilizedInsectoidPlan38Q): THREE.MeshPhysicalMaterial {
  const dark = deriveVida38InsectoidDarkEyePlan38Q1D(plan);
  const base = new THREE.Color(dark.baseHex).lerp(new THREE.Color('#2b3135'), .12);
  return new THREE.MeshPhysicalMaterial({
    color: base,
    roughness: .24 + dark.roughness * .22,
    metalness: .02,
    clearcoat: .24 + dark.clearcoat * .22,
    clearcoatRoughness: .18,
    emissive: '#000000',
    emissiveIntensity: 0,
  });
}

function createSpecialEyeMesh(
  plan: Vida38CivilizedInsectoidPlan38Q,
  radius: number,
  family: Vida38InsectoidEyeFamily38Q1F,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 18, 12);
  const mesh = new THREE.Mesh(geometry, specialEyeMaterial(plan));
  mesh.name = 'VIDA38_Q1F_SPECIAL_EYE';
  mesh.userData['civInsectoidPart38Q'] = 'SPECIAL_EYE';
  mesh.userData['vida38InsectoidEyeFamily38Q1F'] = family;
  mesh.userData['vida38InsectoidOcularDiversityRevision38Q1F'] =
    VIDA38_INSECTOID_OCULAR_DIVERSITY_REVISION_38Q1F;
  mesh.userData['vida38InsectoidDarkEyeHex38Q1D'] = deriveVida38InsectoidDarkEyePlan38Q1D(plan).baseHex;
  mesh.castShadow = true;
  return mesh;
}

function frontalCenter(plan: Vida38CivilizedInsectoidPlan38Q): THREE.Vector3 {
  const left = deriveVida38InsectoidEyeAnchor38Q1B(plan, -1).position;
  const right = deriveVida38InsectoidEyeAnchor38Q1B(plan, 1).position;
  const center = left.clone().add(right).multiplyScalar(.5);
  center.z += .085 * plan.headScale;
  center.y += .065 * plan.headScale;
  return center;
}

export function buildVida38InsectoidSpecialEyes38Q1F(
  plan: Vida38CivilizedInsectoidPlan38Q,
  head?: THREE.Mesh,
): THREE.Object3D[] {
  const ocular = deriveVida38InsectoidOcularPlan38Q1F(plan);
  if (ocular.specialEyeCount <= 0) return [];
  const out: THREE.Object3D[] = [];
  const center = frontalCenter(plan);
  const specialRadius = ocular.specialEyeScale * plan.headScale;
  if (ocular.family === 'PSEUDO_ARACHNOID') {
    const offsets = [
      [-.060, .034], [.060, .034],
      [-.035, 0], [.035, 0],
      [-.070, -.040], [.070, -.040],
    ] as const;
    for (let i = 0; i < ocular.specialEyeCount; i++) {
      const mesh = createSpecialEyeMesh(plan, specialRadius * (i < 2 ? 1.05 : .88), ocular.family);
      const off = offsets[i] ?? [0, 0];
      const x = center.x + off[0] * plan.headScale;
      const y = center.y + off[1] * plan.headScale;
      const surface = findVida38InsectoidFrontalCraniumPoint38Q1F(head, x, y, center.z + .08 * plan.headScale);
      mesh.position.set(x, y, surface.z - .24 * (specialRadius * (i < 2 ? 1.05 : .88)) * .76);
      mesh.scale.set(1.15, 1.00, .76);
      out.push(mesh);
    }
  } else if (ocular.family === 'REDUCED_COMPOUND_OCELLI') {
    const offsets = [
      [0, .045],
      [-.045, -.004], [.045, -.004],
      [0, -.050],
    ] as const;
    for (let i = 0; i < ocular.specialEyeCount; i++) {
      const mesh = createSpecialEyeMesh(plan, specialRadius * (i === 0 ? 1.12 : .95), ocular.family);
      const off = offsets[i] ?? [0, 0];
      const x = center.x + off[0] * plan.headScale;
      const y = center.y + off[1] * plan.headScale;
      const surface = findVida38InsectoidFrontalCraniumPoint38Q1F(head, x, y, center.z + .08 * plan.headScale);
      mesh.position.set(x, y, surface.z - .20 * specialRadius * .82);
      mesh.scale.set(i === 0 ? 1.16 : 1.00, 1.00, .82);
      out.push(mesh);
    }
  }
  return out;
}

export function collectVida38InsectoidOcularSignature38Q1F(plan: Vida38CivilizedInsectoidPlan38Q,
  quality: Vida38CivilizedInsectoidQuality38Q): string {
  const ocular = deriveVida38InsectoidOcularPlan38Q1F(plan);
  const base = deriveVida38InsectoidDarkEyePlan38Q1D(plan);
  const fly = deriveVida38InsectoidFlyEyeSpec38Q1E(plan, quality);
  return [ocular.signature, base.baseHex, fly.detail, fly.facets].join('|');
}

export function isVida38InsectoidEyeHexDark38Q1F(hex: string): boolean {
  const canonical = new THREE.Color(hex).getStyle();
  return VIDA38_INSECTOID_DARK_EYE_PALETTE_38Q1D
    .some(item => new THREE.Color(item).getStyle() === canonical);
}
