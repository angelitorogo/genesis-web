import type { SolidPlanetCoherentAtlasesVISSURF5 } from './system-scene-planet-coherent-geography-vissurf5';

/**
 * VISSURF.5d — Presentational, non-destructive material composition.
 *
 * Invoked only for focused solid-body HD atlases. It never reclassifies a
 * pixel, changes any source D.4d data, alters cloud or night-light assets, or
 * affects physical/biological coverages. Source terrain/canyon layout remains
 * that of VISSURF.5a/5b. No new periodic contour-ring height fields.
 *
 * The edits below deliberately act in *color space*: science retains the
 * existing integer class atlas, while adjacent compatible materials develop
 * narrow transitional pigments. Ocean and coastlines do not blend across
 * WATER/non-WATER boundaries.
 */
export function composeSolidPlanetMaterialsVISSURF5d(
  atlas: SolidPlanetCoherentAtlasesVISSURF5,
  seedUint32: number,
): SolidPlanetCoherentAtlasesVISSURF5 {
  const { width, height, classMask, rgba, normalRgba, roughnessRgba } = atlas;
  const longitudeSpan = width - 1;
  if (longitudeSpan < 8 || height < 8 ||
      classMask.length !== width * height ||
      rgba.length !== width * height * 4 ||
      normalRgba.length !== rgba.length ||
      (roughnessRgba !== null && roughnessRgba.length !== rgba.length)) {
    throw new RangeError('VISSURF.5d: invalid HD material atlas dimensions.');
  }
  const originalAlbedo = new Uint8Array(rgba);
  const originalRoughness = roughnessRgba ? new Uint8Array(roughnessRgba) : null;
  // Separate short shoreline distance from terrestrial *material* transition;
  // neither changes the classMask nor the ocean/land silhouette.
  const coastDistance = shoreDistanceVISSURF5d(classMask, width, height);
  const edgeRadius = Math.max(3, Math.min(9, Math.round(4.5 * longitudeSpan / 1023)));
  const samples = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1],
  ] as const;
  const materialSeed = seedUint32 ^ 0x5d8194e1;
  const ecologySeed = seedUint32 ^ 0x23bf79d3;
  const fineSeed = seedUint32 ^ 0x9c51a6e7;
  const marineSeed = seedUint32 ^ 0x7e86d128;

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < longitudeSpan; x++) {
      const index = y * width + x;
      const offset = index * 4;
      const kind = classMask[index]!;
      const u = x / longitudeSpan;
      let r = originalAlbedo[offset]!;
      let g = originalAlbedo[offset + 1]!;
      let b = originalAlbedo[offset + 2]!;
      const regional = periodicValueNoiseVISSURF5d(u, v, 13, 9, materialSeed);
      const meso = periodicValueNoiseVISSURF5d(
        u + 0.010 * (regional - 0.5), v, 41, 25, ecologySeed,
      );
      const small = periodicValueNoiseVISSURF5d(
        u, v + 0.004 * (meso - 0.5), 109, 69, fineSeed,
      );
      const relief = atlas.reliefRgba?.[offset] ?? 128;
      const elevation01 = clamp01VISSURF5d((relief - 106) / 105);
      const coastPx = coastDistance[index]! * (1023 / longitudeSpan);

      if (kind === 5) { // Vegetation: species pigments are *not* replaced.
        const protectedLowland = 1 - smoothstepVISSURF5d(0.24, 0.75, elevation01);
        const moisture = clamp01VISSURF5d(
          0.51 * regional + 0.32 * meso + 0.17 * protectedLowland +
          0.08 * Math.exp(-coastPx / 14),
        );
        const forest = smoothstepVISSURF5d(0.38, 0.77,
          0.55 * moisture + 0.29 * meso + 0.16 * small);
        const openings = smoothstepVISSURF5d(0.54, 0.84,
          0.63 * (1 - meso) + 0.24 * (1 - regional) + 0.13 * small);
        // Uniform channel multiplier preserves vegetation hue (purple, red,
        // turquoise, green, etc.) instead of imposing Earth-green forests.
        const shade = clamp(1.11 - 0.31 * forest + 0.14 * openings +
          0.08 * (small - 0.5), 0.77, 1.17);
        const drySoil = Math.min(0.10, 0.10 * openings *
          (0.55 + 0.45 * elevation01));
        r = lerp(r * shade, 145, drySoil);
        g = lerp(g * shade, 132, drySoil);
        b = lerp(b * shade, 114, drySoil);
      } else if (kind === 4) { // Desert: sediment basins vs. exposed badlands.
        const sediment = 0.53 * regional + 0.32 * meso + 0.15 * small;
        const outcrop = smoothstepVISSURF5d(0.47, 0.77,
          0.57 * elevation01 + 0.43 * (1 - sediment));
        const alluvium = (1 - outcrop) *
          (0.67 * (1 - elevation01) + 0.33 * regional);
        const tone = 20 * (sediment - 0.49) + 9 * outcrop - 8 * alluvium;
        r += tone;
        g += tone * 0.79;
        b += tone * 0.55;
      } else if (kind === 3 || kind === 6) { // Rocks / volcanic provinces.
        const erosion = 0.49 * regional + 0.36 * meso + 0.15 * small;
        const strata = (erosion - 0.5) * (kind === 6 ? 15 : 12);
        r += strata * 0.93;
        g += strata * 0.88;
        b += strata;
      } else if (kind === 2) { // Ice: subtle blue-white, not ring fractures.
        const glacial = (0.65 * regional + 0.35 * small - 0.5) * 9;
        r += glacial * 0.75;
        g += glacial * 0.90;
        b += glacial;
      } else if (kind === 1) {
        // VISSURF.5b already owns bathymetry. Add only low-amplitude,
        // broad optical variations; no fake peaks or bright water noise.
        const shelf = 1 - smoothstepVISSURF5d(1.5, 20, coastPx);
        const offshore = periodicValueNoiseVISSURF5d(u, v, 19, 11, marineSeed) - 0.5;
        r += shelf * 5 + offshore * 3;
        g += shelf * 10 + offshore * 4;
        b += shelf * 7 + offshore * 5;
        if (roughnessRgba) {
          // Three.js reads green for roughnessMap; this supplements (does not
          // replace) the calibrated water-only floor from VISSURF.5c.
          const o = offset;
          const old = roughnessRgba[o + 1]!;
          const adjusted = byteVISSURF5d(Math.max(old,
            113 + 13 * shelf + 7 * Math.abs(offshore)));
          roughnessRgba[o] = adjusted;
          roughnessRgba[o + 1] = adjusted;
          roughnessRgba[o + 2] = adjusted;
        }
      }

      // Only terrestrial compatible boundaries are pigment-blended, and only
      // within a small, bounded range. No global blur, no class changes and
      // no sea/land or sea/ice bleeding.
      if (kind === 2 || kind === 3 || kind === 4 || kind === 5 || kind === 6) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let weights = 0;
        let roughnessSum = 0;
        for (const [dx, dy] of samples) {
          const sx = ((x + dx * edgeRadius) % longitudeSpan + longitudeSpan) % longitudeSpan;
          const sy = Math.min(height - 1, Math.max(0, y + dy * edgeRadius));
          const neighbourIndex = sy * width + sx;
          const neighbourKind = classMask[neighbourIndex]!;
          if (!blendCompatibleVISSURF5d(kind, neighbourKind)) continue;
          const n = neighbourIndex * 4;
          const weight = dx !== 0 && dy !== 0 ? 0.72 : 1;
          sumR += originalAlbedo[n]! * weight;
          sumG += originalAlbedo[n + 1]! * weight;
          sumB += originalAlbedo[n + 2]! * weight;
          if (originalRoughness) roughnessSum += originalRoughness[n + 1]! * weight;
          weights += weight;
        }
        if (weights > 0) {
          const transition = Math.min(0.39, 0.115 * weights) *
            (0.83 + 0.17 * regional);
          r = lerp(r, sumR / weights, transition);
          g = lerp(g, sumG / weights, transition);
          b = lerp(b, sumB / weights, transition);
          if (roughnessRgba) {
            // A small roughness transition prevents a sharp material seam.
            const ownRoughness = originalRoughness![offset + 1]!;
            const nextRoughness = byteVISSURF5d(lerp(ownRoughness,
              roughnessSum / weights, transition * 0.38));
            roughnessRgba[offset] = nextRoughness;
            roughnessRgba[offset + 1] = nextRoughness;
            roughnessRgba[offset + 2] = nextRoughness;
          }
        }
      }

      // Slight middle-slope contrast recovery, not extra topography and not
      // additional normal energy at high-gradient/canyon discontinuities.
      if (kind !== 1) {
        const nx = (normalRgba[offset]! / 127.5) - 1;
        const ny = (normalRgba[offset + 1]! / 127.5) - 1;
        const nxy = Math.sqrt(nx * nx + ny * ny);
        const gain = 1 + (kind === 3 || kind === 6 ? 0.095 : 0.06) *
          smoothstepVISSURF5d(0.02, 0.15, nxy) *
          (1 - smoothstepVISSURF5d(0.38, 0.68, nxy));
        const gx = nx * gain;
        const gy = ny * gain;
        const invLen = 1 / Math.sqrt(1 + gx * gx + gy * gy);
        normalRgba[offset] = byteVISSURF5d(127.5 * (1 + gx * invLen));
        normalRgba[offset + 1] = byteVISSURF5d(127.5 * (1 + gy * invLen));
        normalRgba[offset + 2] = byteVISSURF5d(127.5 * (1 + invLen));
      }
      rgba[offset] = byteVISSURF5d(r);
      rgba[offset + 1] = byteVISSURF5d(g);
      rgba[offset + 2] = byteVISSURF5d(b);
    }
    // All maps carry an exact repeated meridian, identical to D.4d/5b.
    const first = y * width * 4;
    const last = (y * width + longitudeSpan) * 4;
    rgba.set(rgba.subarray(first, first + 4), last);
    normalRgba.set(normalRgba.subarray(first, first + 4), last);
    if (roughnessRgba) roughnessRgba.set(roughnessRgba.subarray(first, first + 4), last);
  }
  return atlas;
}

/** Water/ice must never bleed into land and land must never paint the sea. */
function blendCompatibleVISSURF5d(a: number, b: number): boolean {
  if (a === b || a === 1 || b === 1) return false;
  if (a === 2 || b === 2) return a === 3 || b === 3;
  return a >= 3 && a <= 6 && b >= 3 && b <= 6;
}

/** A local distance field of shoreline (spherical UV, periodic in longitude). */
function shoreDistanceVISSURF5d(mask: Uint8Array, width: number, height: number): Uint8Array {
  const stride = width - 1;
  const distance = new Uint8Array(width * height);
  const max = 48;
  distance.fill(max);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const north = Math.max(0, y - 1) * width;
    const south = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < stride; x++) {
      const water = mask[row + x] === 1;
      if ((mask[row + (x + stride - 1) % stride] === 1) !== water ||
          (mask[row + (x + 1) % stride] === 1) !== water ||
          (mask[north + x] === 1) !== water ||
          (mask[south + x] === 1) !== water) distance[row + x] = 0;
    }
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const up = Math.max(0, y - 1) * width;
    for (let x = 0; x < stride; x++) {
      const i = row + x;
      distance[i] = Math.min(distance[i]!,
        x > 0 ? distance[i - 1]! + 1 : max,
        y > 0 ? distance[up + x]! + 1 : max);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const row = y * width;
    const down = Math.min(height - 1, y + 1) * width;
    for (let x = stride - 1; x >= 0; x--) {
      const i = row + x;
      distance[i] = Math.min(distance[i]!,
        x + 1 < stride ? distance[i + 1]! + 1 : max,
        y + 1 < height ? distance[down + x]! + 1 : max);
    }
    // Wrap the shoreline distance around the actual periodic meridian.
    const seam = Math.min(distance[row]!, distance[row + stride - 1]! + 1);
    distance[row] = Math.min(distance[row]!, seam);
    distance[row + stride - 1] = Math.min(distance[row + stride - 1]!, seam + 1);
    distance[row + stride] = distance[row]!;
  }
  return distance;
}

function periodicValueNoiseVISSURF5d(
  u: number, v: number, frequencyX: number, frequencyY: number, seed: number,
): number {
  const px = u * frequencyX;
  const py = v * frequencyY;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % frequencyX) + frequencyX) % frequencyX;
  const x1 = (x0 + 1) % frequencyX;
  const a = hashVISSURF5d(x0, iy, seed);
  const b = hashVISSURF5d(x1, iy, seed);
  const c = hashVISSURF5d(x0, iy + 1, seed);
  const d = hashVISSURF5d(x1, iy + 1, seed);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
function hashVISSURF5d(x: number, y: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function smoothstepVISSURF5d(a: number, b: number, x: number): number {
  const t = clamp01VISSURF5d((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function clamp01VISSURF5d(x: number): number { return Math.max(0, Math.min(1, x)); }
function clamp(x: number, min: number, max: number): number { return Math.max(min, Math.min(max, x)); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function byteVISSURF5d(x: number): number { return Math.max(0, Math.min(255, Math.round(x))); }
