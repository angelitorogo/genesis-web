/** GENESIS 38.2g.d — fibras cefálicas y dentición plausibles, solo reconstrucción. */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  evaluateVida38HumanoidField,
  deriveVida38HumanoidFaceLandmarks38GC,
  type Vida38HumanoidAnatomy,
  type Vida38HumanoidQuality,
} from './vida38-humanoid-organic-field-38-2e';
import { deriveVida38HumanoidHairColor38GD } from './vida38-humanoid-face-38-2gd';

const tau = Math.PI * 2;
function rand(seed: number, channel: number): number {
  let x = (seed ^ Math.imul(channel + 0x67, 0x9e3779b9)) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
  return (x >>> 0) / 0xffffffff;
}
function clamp(x: number, min: number, max: number) { return Math.min(max, Math.max(min, x)); }

/**
 * Raycast acotado sobre el campo ANATÓMICO: la raíz de cada fibra se sitúa en
 * la superficie real del SDF, no sobre una esfera imaginaria flotante.
 */
function scalpSurface(a: Vida38HumanoidAnatomy, origin: THREE.Vector3, direction: THREE.Vector3, startRadius: number): THREE.Vector3 | null {
  let inside = 0;
  let outside = Math.max(startRadius * 2.35, 0.48);
  const query = (distance: number) => evaluateVida38HumanoidField(a,
    origin.x + direction.x * distance, origin.y + direction.y * distance, origin.z + direction.z * distance);
  if (query(inside) >= 0) return null;
  if (query(outside) < 0) return null;
  for (let i = 0; i < 11; i++) {
    const middle = (inside + outside) * 0.5;
    if (query(middle) < 0) inside = middle;
    else outside = middle;
  }
  return origin.clone().addScaledVector(direction, (inside + outside) / 2 + 0.0015);
}

function buildHairGeometry(a: Vida38HumanoidAnatomy, quality: Vida38HumanoidQuality): THREE.BufferGeometry | null {
  const f = a.face;
  if (f.hairDensity <= 0 && f.eyebrowHair <= 0) return null;
  const headY = a.legLength + (1.22 + (a.neckLength - 1) * 0.14) * a.torsoLength;
  const lean = a.postureLean * Math.max(0, headY - a.legLength);
  const origin = new THREE.Vector3(0, headY, -0.025 + lean);
  const positions: number[] = [];
  const vertexColors: number[] = [];
  const indices: number[] = [];
  const baseHair = quality === 'HIGH' ? 580 : quality === 'MEDIUM' ? 350 : 135;
  const strandCount = f.hairStyle === 'BALD' ? 0 : Math.round(baseHair * f.hairDensity);
  const baseColor = new THREE.Color('#e5e5e5'); // Se multiplica por el color real del material.
  const pushStrand = (root: THREE.Vector3, normal: THREE.Vector3, length: number, width: number, seed: number, flow: THREE.Vector3) => {
    const steps = quality === 'LOW' ? 3 : 5;
    const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 0.75, 1)).normalize();
    if (tangent.lengthSq() < 0.4) tangent.set(1, 0, 0);
    const previous = positions.length / 3;
    const phase = rand(seed, 32) * tau;
    const variation = 0.82 + rand(seed, 17) * 0.32;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const position = root.clone()
        .addScaledVector(normal, length * (0.19 * t + 0.08 * t * t))
        .addScaledVector(flow, length * t * t * 0.88)
        .addScaledVector(tangent, Math.sin(t * Math.PI * 1.3 + phase) * length * 0.035 * t);
      const thin = width * (1 - 0.84 * t);
      for (const side of [-1, 1]) {
        const vertex = position.clone().addScaledVector(tangent, side * thin);
        positions.push(vertex.x, vertex.y, vertex.z);
        const shade = variation * (0.79 + t * 0.19);
        vertexColors.push(baseColor.r * shade, baseColor.g * shade, baseColor.b * shade);
      }
      if (k > 0) {
        const o = previous + (k - 1) * 2, n = o + 2;
        indices.push(o, o + 1, n, o + 1, n + 1, n);
      }
    }
  };
  for (let i = 0; i < strandCount; i++) {
    const theta = Math.acos(1 - rand(f.seed, i * 13 + 5) * 0.81); // capuchón craneal
    const phi = rand(f.seed, i * 17 + 19) * tau;
    const nx = Math.sin(theta) * Math.cos(phi);
    const ny = Math.cos(theta);
    const nz = Math.sin(theta) * Math.sin(phi);
    if (f.hairStyle === 'DORSAL_CREST' && (Math.abs(nx) > 0.38 || nz > 0.35)) continue;
    if (f.hairStyle === 'LATERAL' && (Math.abs(nx) < 0.38 || ny > 0.91)) continue;
    if (theta > 0.76 && nz > 0.12) continue; // frente libre, sin pelo tapando ojos
    const direction = new THREE.Vector3(nx, ny * 0.89, nz * 0.96).normalize();
    const root = scalpSurface(a, origin, direction, Math.max(a.headWidth, a.headHeight * a.torsoLength));
    if (!root) continue;
    const rootDirection = direction.clone();
    const preferred = f.hairStyle === 'DORSAL_CREST' ? new THREE.Vector3(0, 0.45, -0.89) :
      f.hairStyle === 'LATERAL' ? new THREE.Vector3(Math.sign(nx) * 0.47, -0.45, -0.55) :
      new THREE.Vector3(f.hairFlow * 0.28, -0.36, -0.87);
    const flow = preferred.addScaledVector(rootDirection, 0.20).normalize();
    const length = f.hairLength * (0.54 + 0.74 * rand(f.seed, i * 5 + 43));
    pushStrand(root, rootDirection, length, quality === 'LOW' ? 0.0032 : 0.0026, f.seed + i, flow);
  }
  // Cejas pilosas independientes del desarrollo óseo: algunas especies tienen
  // arcos prominentes sin pelo; otras cejas pilosas con arco casi inexistente.
  const face = deriveVida38HumanoidFaceLandmarks38GC(a);
  if (f.eyebrowHair > 0) for (const side of [-1, 1]) {
    const count = Math.round((quality === 'LOW' ? 13 : 27) * f.eyebrowHair);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const x = side * (a.eyeSpacing + (t - 0.5) * a.eyeRadius * 1.8 * f.eyebrowLength);
      const y = face.eyeY + a.eyeRadius * (1.42 + f.eyebrowSlant * (t - 0.5));
      const z = face.socketZ + 0.10 + lean;
      // Superficie frontal a partir de la propia función SDF (por búsqueda).
      let near = z - 0.25, far = z;
      for (let k = 0; k < 12; k++) {
        const mid = (near + far) / 2;
        if (evaluateVida38HumanoidField(a, x, y, mid) < 0) near = mid;
        else far = mid;
      }
      const rz = (near + far) / 2;
      if (evaluateVida38HumanoidField(a, x, y, rz - 0.005) > 0) continue;
      const root = new THREE.Vector3(x, y, rz + 0.002);
      pushStrand(root, new THREE.Vector3(0, 0.24, 0.97), 0.02 + 0.015 * rand(f.seed, i + 900),
        0.0022, f.seed + 5000 + i * 2 + side, new THREE.Vector3(side * 0.91, 0.16 + f.eyebrowSlant * side, -0.06).normalize());
    }
  }
  if (!positions.length) return null;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createVida38HumanoidHairV1(
  a: Vida38HumanoidAnatomy,
  contract: Vida38SpeciesVisualContract,
  quality: Vida38HumanoidQuality,
): THREE.Object3D[] {
  const geometry = buildHairGeometry(a, quality);
  if (!geometry) return [];
  const material = new THREE.MeshPhysicalMaterial({
    color: deriveVida38HumanoidHairColor38GD(contract), vertexColors: true,
    roughness: 0.87, metalness: 0, clearcoat: 0,
    side: THREE.DoubleSide, depthWrite: true, transparent: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'VIDA38_2GD_CEPHALIC_FIBERS';
  mesh.frustumCulled = true;
  mesh.userData['faceRevision'] = a.face.revision;
  mesh.userData['hypothetical'] = true;
  mesh.userData['hairStyle'] = a.face.hairStyle;
  return [mesh];
}

/**
 * Dientes = piezas anatómicamente diferenciadas y alojadas en la abertura.
 * No se genera dentición visible cuando la boca está cerrada.
 */
export function createVida38HumanoidTeethV1(a: Vida38HumanoidAnatomy, contract: Vida38SpeciesVisualContract): THREE.Object3D[] {
  const f = a.face;
  if (!f.teethVisible || f.dentition === 'REDUCED') return [];
  const count = f.dentition === 'CANINES' ? 8 : f.dentition === 'MIXED' ? 8 : 6;
  const height = Math.min(0.013, f.mouthOpen * 0.56);
  const geometry = new THREE.CapsuleGeometry(0.0052 * f.toothScale, height * 0.34, 4, 8);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#d9d0bb').lerp(new THREE.Color(contract.pigmentation.secondaryColorHex), 0.07),
    roughness: 0.52, metalness: 0, clearcoat: 0,
  });
  const teeth = new THREE.InstancedMesh(geometry, material, count);
  const temp = new THREE.Object3D();
  const mouthY = a.legLength + (1.022 + (a.neckLength - 1) * 0.14) * a.torsoLength;
  const lean = a.postureLean * (mouthY - a.legLength);
  const width = a.jawWidth * 0.43 * a.mouthWidth;
  for (let i = 0; i < count; i++) {
    const t = (i - (count - 1) / 2) / ((count - 1) / 2);
    const canine = f.dentition === 'CANINES' && (i === 1 || i === count - 2);
    const outer = Math.abs(t);
    temp.position.set(t * width * 0.89, mouthY + f.mouthCurve * t * t + height * 0.16,
      0.244 * a.jawProjection + 0.013 + lean - outer * 0.006);
    temp.rotation.set(0, t * 0.08, t * -0.04);
    const scale = canine ? Math.min(1.3, 1.1 * f.toothScale) : (f.dentition === 'FLAT' ? 0.68 : 0.86);
    temp.scale.set(0.95, scale, 0.9);
    temp.updateMatrix();
    teeth.setMatrixAt(i, temp.matrix);
  }
  teeth.instanceMatrix.needsUpdate = true;
  teeth.name = 'VIDA38_2GD_ECOLOGICAL_DENTITION';
  teeth.userData['dentition'] = f.dentition;
  teeth.userData['hypothetical'] = true;
  return [teeth];
}
