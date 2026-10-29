import * as THREE from 'three';

/** VIS3D.2e: detail budget for a single inspected small body, never SystemScene. */
export const SCIENTIFIC_BODY_TEXTURE_VIS3D2E = Object.freeze({
  width: 1024,
  height: 512,
} as const);

export type ScientificMinorBodySurfaceKindVis3d2e =
  | 'ASTEROID'
  | 'COMET'
  | 'TNO'
  | 'CAPTURED';

export interface ScientificMinorBodyAtlasVis3d2e {
  readonly width: 1024;
  readonly height: 512;
  readonly rgba: Uint8Array;
}

/**
 * Near-neutral albedo microstructure, sampled in 3D direction space.
 *
 * The canonical visual composition, craters, silhouette and color continue to
 * come from each existing vertex-colored renderer. This atlas only resolves
 * sub-vertex regolith variation in the close-up scientific preview. It never
 * claims to reveal physical/observed minerals, surface ice or volatile deposits.
 * The seam is sampled at exactly the same direction at x=0 and x=width-1.
 */
export function buildScientificMinorBodyAtlasVis3d2e(
  kind: ScientificMinorBodySurfaceKindVis3d2e,
  seedUint32: number,
): ScientificMinorBodyAtlasVis3d2e {
  if (!Number.isInteger(seedUint32) || seedUint32 < 0 || seedUint32 > 0xffffffff) {
    throw new RangeError('VIS3D.2e inspection seed must be an unsigned 32-bit integer.');
  }
  const { width, height } = SCIENTIFIC_BODY_TEXTURE_VIS3D2E;
  const rgba = new Uint8Array(width * height * 4);
  const salt = kind === 'ASTEROID' ? 0x7b25d1a9 : kind === 'COMET' ? 0x21d035f3 :
    kind === 'TNO' ? 0x31c9784a : 0x5eb2a1f3;
  const seed = (seedUint32 ^ salt) >>> 0;
  const phaseA = phase(seed, 11);
  const phaseB = phase(seed, 19);
  const phaseC = phase(seed, 31);
  const phaseD = phase(seed, 47);

  for (let y = 0; y < height; y += 1) {
    const latitude = (0.5 - y / (height - 1)) * Math.PI;
    const horizontal = Math.cos(latitude);
    const ny = Math.sin(latitude);
    for (let x = 0; x < width; x += 1) {
      const longitude = ((x === width - 1 ? 0 : x) / (width - 1)) * 2 * Math.PI;
      const nx = Math.cos(longitude) * horizontal;
      const nz = Math.sin(longitude) * horizontal;

      // Directional 3D noise avoids equirectangular stripes and seam artifacts.
      const low = Math.sin(nx * 10.7 + ny * 8.3 - nz * 9.1 + phaseA) *
        Math.cos(nz * 13.1 + nx * 7.7 - ny * 5.9 + phaseB);
      const medium = Math.sin(nx * 42.1 - ny * 33.3 + nz * 36.7 + phaseC) *
        Math.cos(ny * 39.2 + nz * 34.4 - nx * 28.3 + phaseD);
      const fine = Math.sin(nx * 157.3 + ny * 111.7 - nz * 143.9 + phaseB) *
        Math.cos(nz * 169.1 + nx * 121.3 + ny * 137.3 + phaseA);
      const tone = Math.max(0.79, Math.min(1.08,
        0.955 + 0.047 * low + 0.037 * medium + 0.027 * fine,
      ));
      const color = Math.round(255 * Math.min(1, tone));
      const index = (y * width + x) * 4;
      rgba[index] = color;
      rgba[index + 1] = color;
      rgba[index + 2] = color;
      rgba[index + 3] = 255;
    }
  }
  return Object.freeze({ width, height, rgba });
}

/** Texture is owned/disposed by the scientific preview alongside its geometry. */
export function attachScientificMinorBodyAtlasVis3d2e(
  surfaces: readonly THREE.Mesh[],
  kind: ScientificMinorBodySurfaceKindVis3d2e,
  seedUint32: number,
): THREE.DataTexture {
  if (surfaces.length === 0) {
    throw new RangeError('VIS3D.2e requires at least one inspected surface mesh.');
  }
  const atlas = buildScientificMinorBodyAtlasVis3d2e(kind, seedUint32);
  const texture = new THREE.DataTexture(atlas.rgba, atlas.width, atlas.height, THREE.RGBAFormat);
  texture.name = `GENESIS VIS3D.2e ${kind} inspection 1024x512`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.flipY = true;
  texture.needsUpdate = true;
  for (const mesh of surfaces) {
    if (!(mesh.material instanceof THREE.MeshStandardMaterial)) {
      texture.dispose();
      throw new TypeError('VIS3D.2e requires a MeshStandardMaterial surface.');
    }
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  }
  return texture;
}

function phase(seed: number, salt: number): number {
  let n = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 0x100000000 * Math.PI * 2;
}
