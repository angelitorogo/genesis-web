import * as THREE from 'three';
import {
  type SystemSceneCapturedPresentationV1,
  capturedTerrainSeedUnitV1 as rand,
} from './system-scene-captured-presentation';

/** CAP-R1 — canonical captured-body surface shared by SystemScene and fiches. */
export function createSystemSceneCapturedRenderableV1(
  radiusScene: number,
  p: SystemSceneCapturedPresentationV1,
) {
  if (!Number.isFinite(radiusScene) || radiusScene <= 0 || p.version !== 1) {
    throw new RangeError('Invalid captured renderer input');
  }
  const near = radiusScene >= 0.12;
  const geo = new THREE.SphereGeometry(radiusScene, near ? 88 : 36, near ? 56 : 24);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const base = new THREE.Color(p.colorHex);
  const accent = new THREE.Color(p.accentHex);
  const mixed = new THREE.Color();
  const seed = p.variantUint32;
  const basins = Array.from({ length: 18 }, (_, i) => {
    const a = rand(seed, 100 + i * 9) * Math.PI * 2;
    const z = 2 * rand(seed, 101 + i * 9) - 1;
    const h = Math.sqrt(1 - z * z);
    return {
      x: Math.cos(a) * h,
      y: Math.sin(a) * h,
      z,
      radius: (i < 4 ? 0.14 : 0.04) + rand(seed, 102 + i * 9) * (i < 4 ? 0.18 : 0.08),
      depth: (i < 4 ? 0.018 : 0.006) * p.basinStrength01 + rand(seed, 103 + i * 9) * 0.006,
    };
  });

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const d = Math.max(1e-9, Math.hypot(x, y, z));
    const nx = x / d, ny = y / d, nz = z / d;
    const largeNoise =
      Math.sin(nx * 5.7 + rand(seed, 1) * 6.28) * Math.cos(ny * 4.9 + rand(seed, 2) * 6.28) +
      0.45 * Math.sin(nz * 9.5 + ny * 5.1 + rand(seed, 3) * 6.28);
    const ridgeNoise =
      Math.sin(nx * 21 + ny * 13 + rand(seed, 4) * 6.28) *
      Math.cos(nz * 25 - nx * 7 + rand(seed, 5) * 6.28);
    let radial = 1 + p.irregularity01 * (0.62 * largeNoise + 0.22 * ridgeNoise);
    let floor = 0, rim = 0;
    for (const c of basins) {
      const dot = Math.max(-1, Math.min(1, nx * c.x + ny * c.y + nz * c.z));
      const t = Math.sqrt(Math.max(0, 2 - 2 * dot)) / c.radius;
      if (t > 1.55) continue;
      const inside = t < 1 ? (1 - t * t) ** 2 : 0;
      const edge = Math.exp(-(((t - 1) / 0.17) ** 2));
      radial -= c.depth * inside;
      radial += c.depth * 0.12 * edge;
      floor = Math.max(floor, inside);
      rim = Math.max(rim, edge);
    }
    radial = Math.max(0.68, Math.min(1.34, radial));
    pos.setXYZ(i, nx * radiusScene * radial, ny * radiusScene * radial, nz * radiusScene * radial);
    const province = 0.5 + 0.5 * Math.sin(nx * 7 + ny * 6 + nz * 4 + rand(seed, 6) * 6.28)
      * Math.cos(nz * 6 + nx * 2 - rand(seed, 7) * 6.28);
    const frost = Math.max(0, province - 0.58) * p.frostPatchiness01;
    const tone = Math.max(0.44, Math.min(1.18,
      0.84 + 0.22 * province + 0.08 * ridgeNoise - 0.24 * floor + 0.06 * rim));
    mixed.copy(base).lerp(accent, Math.min(0.58, 0.14 + frost));
    colors[3 * i] = Math.min(1, mixed.r * tone);
    colors[3 * i + 1] = Math.min(1, mixed.g * tone);
    colors[3 * i + 2] = Math.min(1, mixed.b * tone);
  }
  pos.needsUpdate = true;
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  geo.name = 'GENESIS CAP-R1 cratered deterministic surface';
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: p.roughness01,
    metalness: 0,
    flatShading: false,
  });
  mat.name = 'GENESIS CAP-R1 rocky-volatile regolith';
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'GENESIS CAP-R1 captured body';
  const root = new THREE.Group();
  root.name = 'GENESIS CAP-R1 procedural';
  root.add(mesh);
  return Object.freeze({ object: root, resources: Object.freeze([geo, mat]), surface: mesh });
}
