import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';

/**
 * LUNSURF.1 — presentation-only small-scale terrain, sampled in Cartesian
 * coordinates. This refines the D.3 moon atlas without changing any scientific
 * coverage, crater catalogue, geometry, or procedural identity.
 *
 * Generated for the focused fiche only; distant SystemScene moons retain their
 * original atlas and texture budget. All fields are deterministic in the seed.
 */
export interface MoonFineSurfaceDetailLUNSURF1 {
  /** Zero-centered, gently correlated mineral/ice pigment relief. */
  readonly pigment: number;
  /** Zero-centered height-map detail, deliberately much smaller than craters. */
  readonly displacement: number;
  /** Locally heterogeneous roughness. */
  readonly grain: number;
}

interface Direction { readonly x: number; readonly y: number; readonly z: number }

export function sampleMoonFineSurfaceLUNSURF1(
  direction: Direction,
  moon: SystemSceneMoonPresentationV1,
): MoonFineSurfaceDetailLUNSURF1 {
  const seed = moon.presentationSeedUint32;
  // Domain distortion is continuous across poles/longitude, avoiding painted
  // latitude bands and the concentric terrain artefacts rejected in VISSURF.5a.
  const warp = (noise3(direction.x * 11.4 + 6.1,
    direction.y * 11.4 - 8.3, direction.z * 11.4 + 4.7,
    seed ^ 0xa12fc603) - 0.5) * 0.014;
  const x = direction.x + warp * (0.31 + direction.z);
  const y = direction.y + warp * (0.24 - direction.x);
  const z = direction.z + warp * (0.35 + direction.y);
  const province = noise3(x * 27.0, y * 27.0, z * 27.0, seed ^ 0xd1f22e71) - 0.5;
  const regolith = noise3(x * 74.0 + 13.8, y * 74.0, z * 74.0, seed ^ 0x613b1d4e) - 0.5;
  const grit = noise3(x * 148.0, y * 148.0 + 9.2, z * 148.0, seed ^ 0x987a542d) - 0.5;
  const mixed = province * 0.46 + regolith * 0.37 + grit * 0.17;
  // Icy fields are smoother, but preserve visually distinguishable fractures.
  const ice = moon.surfaceStyle === 'ICY';
  return {
    pigment: mixed * (ice ? 0.72 : 1),
    displacement: (province * 0.15 + regolith * 0.58 + grit * 0.27) *
      (ice ? 0.035 : 0.054),
    grain: regolith * 0.62 + grit * 0.38,
  };
}

/** Hysteretic focus contract shared by the lunar LOD and its regressions. */
export function shouldUseMoonDetailLUNSURF1(
  projectedDiameter: number,
  candidateId: string,
  previouslyFocusedId: string | null,
  closestPlanetDiameter: number | null,
): boolean {
  return Number.isFinite(projectedDiameter) &&
    projectedDiameter >= (candidateId === previouslyFocusedId ? 210 : 300) &&
    (closestPlanetDiameter === null || projectedDiameter > closestPlanetDiameter);
}

/**
 * Produce texture-space tangent normals from exactly the height atlas rendered
 * by the moon, not an unrelated random map. Both seam columns are identical.
 * The roughness atlas is prepared separately and never reuses crater heights.
 */
export function buildMoonTangentNormalMapLUNSURF1(
  reliefRgba: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  if (width < 4 || height < 4 || reliefRgba.length !== width * height * 4) {
    throw new RangeError('Invalid lunar relief dimensions for normal map.');
  }
  const result = new Uint8Array(reliefRgba.length);
  const strength = 7.8;
  for (let y = 0; y < height; y += 1) {
    const ny = Math.max(0, y - 1);
    const py = Math.min(height - 1, y + 1);
    const latitude = (0.5 - y / (height - 1)) * Math.PI;
    const latitudeScale = 1 / Math.max(0.36, Math.abs(Math.cos(latitude)));
    for (let x = 0; x < width - 1; x += 1) {
      const index = 4 * (y * width + x);
      // Column width-1 is a repeated seam texel, not another real neighbor.
      const nx = x === 0 ? width - 2 : x - 1;
      const px = x === width - 2 ? 0 : x + 1;
      const dx = (reliefRgba[4 * (y * width + px)]! -
        reliefRgba[4 * (y * width + nx)]!) / 255;
      const dy = (reliefRgba[4 * (py * width + x)]! -
        reliefRgba[4 * (ny * width + x)]!) / 255;
      // Neutral pole normals prevent equirectangular singularities.
      const tangentX = y === 0 || y === height - 1 ? 0 : -dx * strength * latitudeScale;
      const tangentY = y === 0 || y === height - 1 ? 0 : dy * strength;
      const norm = 1 / Math.hypot(tangentX, tangentY, 1);
      result[index] = Math.round(127.5 * (1 + tangentX * norm));
      result[index + 1] = Math.round(127.5 * (1 + tangentY * norm));
      result[index + 2] = Math.round(127.5 * (1 + norm));
      result[index + 3] = 255;
    }
    // Preserve the exact seam, even after quantisation.
    const first = 4 * y * width;
    const last = first + 4 * (width - 1);
    result.set(result.subarray(first, first + 4), last);
  }
  return result;
}

/** Optical-only roughness: barren regolith is matte, clean ice somewhat more
 * reflective, resolved surface water substantially smoother. */
export function moonMaterialRoughnessLUNSURF1(
  moon: SystemSceneMoonPresentationV1,
  terrain: { readonly iceMask01: number; readonly liquidMask01: number; readonly renewed01: number },
  grain: number,
): number {
  const style = moon.surfaceStyle;
  let r = style === 'ICY' ? 0.82 : style === 'MIXED' ? 0.87 :
    style === 'OCEANIC' ? 0.83 : style === 'VOLCANIC' ? 0.96 : 0.94;
  r -= 0.11 * terrain.renewed01;
  if (moon.presentationIceCoverage01 > 0.05) {
    r -= 0.09 * moon.presentationIceCoverage01 * terrain.iceMask01;
  }
  if (moon.presentationLiquidCoverage01 > 0.03) {
    const liquid = Math.min(1, terrain.liquidMask01 * moon.presentationLiquidCoverage01);
    r = r * (1 - liquid) + 0.27 * liquid;
  }
  return Math.max(0.23, Math.min(0.98, r + grain * 0.055));
}

function noise3(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const a = mixf(hash(ix, iy, iz, seed), hash(ix + 1, iy, iz, seed), fx);
  const b = mixf(hash(ix, iy + 1, iz, seed), hash(ix + 1, iy + 1, iz, seed), fx);
  const c = mixf(hash(ix, iy, iz + 1, seed), hash(ix + 1, iy, iz + 1, seed), fx);
  const d = mixf(hash(ix, iy + 1, iz + 1, seed), hash(ix + 1, iy + 1, iz + 1, seed), fx);
  return mixf(mixf(a, b, fy), mixf(c, d, fy), fz);
}
function hash(x: number, y: number, z: number, seed: number): number {
  let n = (seed ^ Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^
    Math.imul(z, 0x9e3779b9)) >>> 0;
  n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967295;
}
function fade(n: number): number { return n * n * (3 - 2 * n); }
function mixf(a: number, b: number, t: number): number { return a + (b - a) * t; }
