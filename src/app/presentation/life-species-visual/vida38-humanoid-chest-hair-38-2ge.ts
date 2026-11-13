/** GENESIS 38.2g.e — pilosidad torácica hipotética determinista.
 * Fibras geométricas opacas, un único draw call y raíces sobre la superficie SDF.
 * La pilosidad no altera VIDA ni se presenta como evidencia instrumental.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  evaluateVida38HumanoidField, type Vida38HumanoidAnatomy, type Vida38HumanoidQuality,
} from './vida38-humanoid-organic-field-38-2e';
import { deriveVida38HumanoidHairColor38GD } from './vida38-humanoid-face-38-2gd';

function rand(seed: number, salt: number): number {
  let n = seed ^ Math.imul(salt + 19, 0x9e3779b9);
  n ^= n >>> 16; n = Math.imul(n, 0x7feb352d); n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b); n ^= n >>> 16;
  return (n >>> 0) / 0xffffffff;
}

/** Encuentra la piel anterior; si no existe un torso aquí, no crea fibras. */
function frontSkin(a: Vida38HumanoidAnatomy, x: number, y: number): number | null {
  const insideZ = -0.04;
  const outsideZ = 0.72;
  if (evaluateVida38HumanoidField(a, x, y, insideZ) >= 0 ||
      evaluateVida38HumanoidField(a, x, y, outsideZ) <= 0) return null;
  let inside = insideZ, outside = outsideZ;
  for (let i = 0; i < 12; i++) {
    const mid = (inside + outside) * 0.5;
    if (evaluateVida38HumanoidField(a, x, y, mid) < 0) inside = mid;
    else outside = mid;
  }
  return (inside + outside) * 0.5;
}

export function createVida38HumanoidChestHair38GE(
  a: Vida38HumanoidAnatomy,
  contract: Vida38SpeciesVisualContract,
  quality: Vida38HumanoidQuality,
): THREE.Object3D[] {
  const profile = a.torso;
  if (profile.chestHairDensity === 0 || profile.chestHairPattern === 'BARE') return [];
  const maximum = quality === 'HIGH' ? 480 : quality === 'MEDIUM' ? 260 : 90;
  const desired = Math.round(maximum * profile.chestHairDensity);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const p = a.legLength;
  const baseColor = new THREE.Color(deriveVida38HumanoidHairColor38GD(contract));
  const width = quality === 'HIGH' ? 0.00175 : quality === 'MEDIUM' ? 0.0021 : 0.003;
  let placed = 0;
  for (let i = 0; i < desired * 3 && placed < desired; i++) {
    const vx = rand(profile.seed, i * 11 + 1) * 2 - 1;
    const vy = rand(profile.seed, i * 13 + 5);
    if (profile.chestHairPattern === 'CENTER' && Math.abs(vx) > 0.46) continue;
    if (profile.chestHairPattern === 'PECTORAL' && Math.abs(vx) < 0.25) continue;
    const side = vx < 0 ? -1 : 1;
    const x = vx * a.shoulderWidth * profile.chestScale * 0.77;
    // El vello crece desde la zona pectoral, sin invadir clavículas o cuello.
    const y = p + 0.29 + vy * 0.33;
    const skinZ = frontSkin(a, x, y);
    if (skinZ === null) continue;
    const strandLength = profile.chestHairLength * (0.58 + 0.74 * rand(profile.seed, i * 17 + 8));
    const displacementX = side * (0.004 + strandLength * 0.16) + (rand(profile.seed, i * 19 + 4) - 0.5) * 0.012;
    // Puntas distribuidas siguiendo el contorno real del torso.
    const tipX = x + displacementX;
    const tipY = y - strandLength * (0.6 + 0.25 * rand(profile.seed, i * 23 + 7));
    const tipSkinZ = frontSkin(a, tipX, tipY);
    if (tipSkinZ === null) continue;
    const tone = 0.68 + rand(profile.seed, i * 29 + 9) * 0.34;
    const rootIndex = positions.length / 3;
    const strandWidth = width * (0.7 + rand(profile.seed, i * 31 + 6) * 0.6);
    const steps = quality === 'LOW' ? 2 : 3;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const px = x + (tipX - x) * t;
      const py = y + (tipY - y) * t;
      const pz = skinZ + (tipSkinZ - skinZ) * t + 0.0035 + 0.012*t*t;
      const half = strandWidth * (1 - 0.88*t);
      for (const v of [-1, 1]) {
        positions.push(px + v*half, py, pz);
        colors.push(tone, tone * 0.98, tone * 0.95);
      }
      if (k > 0) {
        const previous = rootIndex + 2 * (k-1), next = previous + 2;
        indices.push(previous, previous+1, next, previous+1, next+1, next);
      }
    }
    placed++;
  }
  if (placed < 2) return [];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  const material = new THREE.MeshPhysicalMaterial({
    color: baseColor,
    vertexColors: true, roughness: 0.94, metalness: 0,
    clearcoat: 0, sheen: 0.09, sheenRoughness: 0.95,
    side: THREE.DoubleSide, transparent: false, depthWrite: true,
  });
  const hair = new THREE.Mesh(geometry, material);
  hair.name = 'VIDA38_2GE_CHEST_FIBERS';
  hair.userData['torsoRevision'] = profile.revision;
  hair.userData['torsoFingerprint'] = profile.fingerprint;
  hair.userData['chestHairPattern'] = profile.chestHairPattern;
  hair.userData['hairStrands'] = placed;
  hair.userData['reconstructionHypothesis'] = true;
  hair.frustumCulled = true;
  return [hair];
}
