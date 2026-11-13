/**
 * GENESIS · 38.2q1e — ojos compuestos insectoides tipo díptero.
 *
 * Un único draw-call por ojo: fondo negro y mosaico icosaédrico dual de
 * omatidios casi hexagonales, con bordes definidos por separación geométrica.
 * No utiliza texturas, ruido aleatorio global ni modelos reptilianos/humanos.
 */
import * as THREE from 'three';
import type {
  Vida38CivilizedInsectoidPlan38Q,
  Vida38CivilizedInsectoidQuality38Q,
} from './vida38-civilized-insectoid-preview-38-2q';
import { deriveVida38InsectoidDarkEyePlan38Q1D } from './vida38-civilized-insectoid-ocular-coxal-38-2q1d';
import { deriveVida38InsectoidEyeAnchor38Q1B } from './vida38-civilized-insectoid-organic-anatomy-38-2q1b';

export const VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E =
  'VIDA.38.2q1e/dipteran-compound-eye/v1' as const;

export interface Vida38InsectoidFlyEyeSpec38Q1E {
  readonly revision: typeof VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E;
  readonly baseHex: string;
  readonly facetHex: string;
  readonly facets: number;
  readonly detail: number;
  readonly groove: number;
  readonly relief: number;
  readonly roughness: number;
  readonly clearcoat: number;
  readonly signature: string;
}

function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function sphereVertexCount(detail: number): number {
  // Subdivisión triangular de icosaedro: V = 10·(d+1)² + 2.
  return 10 * (detail + 1) * (detail + 1) + 2;
}

export function deriveVida38InsectoidFlyEyeSpec38Q1E(
  plan: Vida38CivilizedInsectoidPlan38Q, quality: Vida38CivilizedInsectoidQuality38Q,
): Vida38InsectoidFlyEyeSpec38Q1E {
  const eye = deriveVida38InsectoidDarkEyePlan38Q1D(plan);
  const seed = `${plan.speciesId}|${plan.signature}|Q1E-FLY`;
  const detail = quality === 'LOW' ? 4 : quality === 'MEDIUM' ? 8 : 14;
  // Esencial: el facetado debe ser legible en LOW sin generar cientos de meshes.
  const groove = .105 + (hash32(`${seed}|groove`) % 5) * .012;
  const relief = .0038 + (hash32(`${seed}|relief`) % 6) * .00050;
  const roughness = .31 + (hash32(`${seed}|roughness`) % 12) * .008;
  const clearcoat = .20 + (hash32(`${seed}|clearcoat`) % 13) * .008;
  return {
    revision: VIDA38_INSECTOID_FLY_EYE_REVISION_38Q1E,
    baseHex: eye.baseHex,
    facetHex: eye.facetHex,
    facets: sphereVertexCount(detail), detail, groove, relief, roughness, clearcoat,
    signature: [eye.baseHex, eye.facetHex, detail, groove.toFixed(4), relief.toFixed(5),
      roughness.toFixed(4), clearcoat.toFixed(4)].join('|'),
  };
}

type Ommatidium38Q1E = { direction: THREE.Vector3; adjacent: THREE.Vector3[] };
function vertexKey(v: THREE.Vector3): string {
  return `${v.x.toFixed(6)},${v.y.toFixed(6)},${v.z.toFixed(6)}`;
}

/** Convierte un icosaedro triangulado en celdas poligonales de su malla dual.
 * En casi todos los vértices hay seis caras vecinas → omatidios hexagonales;
 * las doce singularidades naturales del icosaedro quedan pentagonales.
 */
function dualCells(detail: number): Ommatidium38Q1E[] {
  const original = new THREE.IcosahedronGeometry(1, detail);
  try {
    const attr = original.getAttribute('position') as THREE.BufferAttribute;
    const cells = new Map<string, Ommatidium38Q1E>();
    for (let i = 0; i + 2 < attr.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(attr, i).normalize();
      const b = new THREE.Vector3().fromBufferAttribute(attr, i + 1).normalize();
      const c = new THREE.Vector3().fromBufferAttribute(attr, i + 2).normalize();
      const center = a.clone().add(b).add(c).normalize();
      for (const v of [a, b, c]) {
        const key = vertexKey(v);
        let cell = cells.get(key);
        if (!cell) {
          cell = { direction: v, adjacent: [] };
          cells.set(key, cell);
        }
        cell.adjacent.push(center);
      }
    }
    return [...cells.values()];
  } finally {
    original.dispose();
  }
}

/** Malla de base y microfacetas en un solo BufferGeometry. Cada omatidio tiene
 * una leve cúpula central y bordes oscuros separados del vecino; no se dibujan
 * canicas independientes, ni se crean materiales por omatidio.
 */
export function buildVida38InsectoidOmmatidiaGeometry38Q1E(spec: Vida38InsectoidFlyEyeSpec38Q1E,
  salt: string): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const base = new THREE.Color(spec.baseHex);
  const facet = new THREE.Color(spec.facetHex);
  const borderColor = base.clone().multiplyScalar(.75);
  const fillColor = base.clone().multiplyScalar(.73);

  function triangle(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3,
    ca: THREE.Color, cb: THREE.Color, cc: THREE.Color): void {
    // Todas las caras hacia fuera; evita que desaparezcan al rotar la cámara.
    const outward = b.clone().sub(a).cross(c.clone().sub(a)).dot(a.clone().add(b).add(c));
    const second = outward >= 0 ? b : c;
    const third = outward >= 0 ? c : b;
    const secondColor = outward >= 0 ? cb : cc;
    const thirdColor = outward >= 0 ? cc : cb;
    for (const [p, col] of [[a, ca], [second, secondColor], [third, thirdColor]] as const) {
      positions.push(p.x, p.y, p.z);
      colors.push(col.r, col.g, col.b);
    }
  }

  // Capa continua oscura bajo las microseparaciones entre celdas.
  const backing = new THREE.IcosahedronGeometry(.998, spec.detail <= 2 ? 2 : 3);
  try {
    const attr = backing.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i + 2 < attr.count; i += 3) {
      triangle(new THREE.Vector3().fromBufferAttribute(attr, i),
        new THREE.Vector3().fromBufferAttribute(attr, i + 1),
        new THREE.Vector3().fromBufferAttribute(attr, i + 2), fillColor, fillColor, fillColor);
    }
  } finally { backing.dispose(); }

  const cells = dualCells(spec.detail);
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i]!;
    if (cell.adjacent.length < 3) continue;
    const center = cell.direction;
    const tangent = new THREE.Vector3(0, 1, 0).cross(center);
    if (tangent.lengthSq() < .0001) tangent.set(1, 0, 0).cross(center);
    tangent.normalize();
    const tangent2 = center.clone().cross(tangent).normalize();
    const directions = cell.adjacent.slice().sort((a, b) =>
      Math.atan2(a.dot(tangent2), a.dot(tangent)) - Math.atan2(b.dot(tangent2), b.dot(tangent)));
    const speck = hash32(`${salt}|ommatidium|${i}`) / 0xffffffff;
    const color = base.clone().lerp(facet, .17 + .60 * speck);
    const rimColor = borderColor.clone().lerp(color, .48);
    const apex = center.clone().multiplyScalar(1 + spec.relief);
    for (let j = 0; j < directions.length; j++) {
      const da = directions[j]!, db = directions[(j + 1) % directions.length]!;
      const ra = center.clone().lerp(da, 1 - spec.groove).normalize().multiplyScalar(1.001);
      const rb = center.clone().lerp(db, 1 - spec.groove).normalize().multiplyScalar(1.001);
      triangle(apex, ra, rb, color, rimColor, rimColor);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.userData['vida38OmmatidiumCount38Q1E'] = cells.length;
  geometry.userData['vida38OmmatidiumShape38Q1E'] = 'ICOSAHEDRAL_DUAL_HEX_PENT';
  return geometry;
}

/** Ojo de mosca oscuro, envolvente y parcialmente encastrado en el cráneo.
 * Se mantiene un único objeto COMPOUND_EYE para los tests y contratos previos.
 */
export function createVida38InsectoidFlyEye38Q1E(plan: Vida38CivilizedInsectoidPlan38Q,
  side: -1 | 1, quality: Vida38CivilizedInsectoidQuality38Q): THREE.Mesh {
  const spec = deriveVida38InsectoidFlyEyeSpec38Q1E(plan, quality);
  const geometry = buildVida38InsectoidOmmatidiaGeometry38Q1E(spec,
    `${plan.speciesId}|${plan.signature}|${side}`);
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: spec.roughness,
    metalness: .015,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: .36,
    emissive: '#000000',
    emissiveIntensity: 0,
    side: THREE.FrontSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const anchor = deriveVida38InsectoidEyeAnchor38Q1B(plan, side);
  const factor = .145 * plan.headScale;
  mesh.scale.set(factor * anchor.scale.x * 1.07,
    factor * anchor.scale.y * 1.16, factor * anchor.scale.z * .84);
  mesh.position.copy(anchor.position);
  mesh.position.x -= side * .014 * plan.headScale;
  mesh.rotation.y = side * .25;
  mesh.castShadow = true;
  mesh.name = 'VIDA38_Q1E_FLY_COMPOUND_EYE';
  mesh.userData['vida38InsectoidDarkEyeHex38Q1D'] = spec.baseHex;
  mesh.userData['vida38InsectoidDarkEyePlan38Q1D'] =
    deriveVida38InsectoidDarkEyePlan38Q1D(plan).signature;
  mesh.userData['vida38InsectoidFlyEyeRevision38Q1E'] = spec.revision;
  mesh.userData['vida38InsectoidFlyEyeSpec38Q1E'] = spec.signature;
  mesh.userData['vida38InsectoidFlyEyeOmmatidia38Q1E'] = spec.facets;
  return mesh;
}
