import type { SystemScenePlanetSurfaceTextureData } from './system-scene-planet-surface-texture';
import {
  buildMultiresolutionSolidPlanetSurfaceVISSURF2,
  type SolidPlanetDetailAtlasesVISSURF2,
} from './system-scene-planet-surface-detail-vissurf2';

/**
 * VISSURF.3 — visual geology, biomes and material normals at the requested LOD.
 *
 * D.4d and VISSURF.2 alone decide the classified pixel areas; this routine
 * NEVER changes the class mask, scientific quantities, clouds or night lights.
 * Continuous spherical UV noise controls fault corridors / ridges / valleys,
 * material-specific albedo, bathymetry, microrelief, roughness and normal maps.
 * The original seed and original atlas are the only inputs. Nothing is stored.
 */
export interface SolidPlanetStructuredAtlasesVISSURF3 extends SolidPlanetDetailAtlasesVISSURF2 {
  /** Tangent-space normals derived from the same multiscale height field. */
  readonly normalRgba: Uint8Array;
}

const WATER = 1;
const ICE = 2;
const ROCK = 3;
const DESERT = 4;
const FLORA = 5;
const VOLCANIC = 6;
const MAX_COAST_DISTANCE = 80;

export function buildStructuredSolidPlanetSurfaceVISSURF3(
  source: Pick<SystemScenePlanetSurfaceTextureData,
    'width' | 'height' | 'rgba' | 'roughnessRgba' | 'reliefRgba' | 'surfaceClassMask'>,
  targetWidth: number,
  seedUint32: number,
): SolidPlanetStructuredAtlasesVISSURF3 {
  const surface = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, targetWidth, seedUint32);
  const { width, height, rgba, roughnessRgba, reliefRgba, classMask } = surface;
  const uniqueWidth = width - 1;
  const coastDistance = signedCoastDistanceVISSURF3(classMask, width, height);
  const normalRgba = new Uint8Array(rgba.length);
  const heightField = new Uint8Array(width * height);
  const scaleFrom1024 = 1024 / uniqueWidth;
  const seedPlate = seedUint32 ^ 0xd25d6131;
  const seedFolds = seedUint32 ^ 0x763aa109;
  const seedLocal = seedUint32 ^ 0x36e1bd37;
  const seedGrain = seedUint32 ^ 0x9b4c704f;

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const polarFactor = Math.max(0.38, 1 - 0.56 * Math.pow(Math.abs(v * 2 - 1), 2));
    for (let x = 0; x < uniqueWidth; x++) {
      const index = y * width + x;
      const offset = index * 4;
      const kind = classMask[index]!;
      const u = x / uniqueWidth;
      // Long, warped fault corridors and river-like valleys, not independent
      // pixel noise. Every octave is periodic in longitude and seed-stable.
      const plate = periodicFieldVISSURF3(u, v, 11, 7, seedPlate);
      const folds = periodicFieldVISSURF3(u + 0.009 * (plate - 0.5), v, 47, 29, seedFolds);
      const local = periodicFieldVISSURF3(u, v + 0.003 * (folds - 0.5), 127, 71, seedLocal);
      const grain = periodicFieldVISSURF3(u, v, 389, 209, seedGrain);
      const faultCorridor = Math.pow(clamp01VISSURF3(1 - Math.abs(plate - 0.51) / 0.155), 1.45);
      const foldedRidge = Math.pow(1 - Math.abs(folds * 2 - 1), 2.4);
      const ridges = faultCorridor * (0.39 + foldedRidge * 0.61) * polarFactor;
      const valley = clamp01VISSURF3(1 - Math.abs(folds - 0.28) / 0.105) * (1 - 0.5 * faultCorridor);
      const distance = coastDistance[index]! * scaleFrom1024;
      const coastBlend = clamp01VISSURF3(distance / 12);
      const shelf = 1 - clamp01VISSURF3(distance / 30);
      const grainSigned = grain * 2 - 1;
      // Broad erosion/strata variations only: periodic high-frequency sine
      // bands produced artificial contour-line / moire patterns at globe zoom.
      const band = 0.64 * (folds - 0.5) + 0.36 * (local - 0.5);
      let elevation = reliefRgba ? reliefRgba[offset]! : 128;
      let roughness = roughnessRgba ? roughnessRgba[offset + 1]! : 160;
      let rAdd = 0;
      let gAdd = 0;
      let bAdd = 0;

      switch (kind) {
        case WATER: {
          // Coastal shallows, continental shelf and deeper basins: no
          // high-frequency noisy oceans and no artificial underwater peaks.
          const depth = 1 - shelf;
          rAdd = 8 * shelf - 12 * depth;
          gAdd = 23 * shelf - 12 * depth + grainSigned * 2;
          bAdd = 17 * shelf - 5 * depth + grainSigned * 2;
          elevation = 96 + 8 * shelf + 1.7 * grainSigned;
          roughness = 47 + 13 * local + 6 * grain;
          break;
        }
        case ICE: {
          const glacialBands = Math.abs(band) * (0.5 + 0.5 * local);
          const fractures = Math.pow(1 - Math.abs(folds * 2 - 1), 6);
          const tone = 16 * glacialBands - 26 * fractures + 9 * grainSigned;
          rAdd = tone * 0.83;
          gAdd = tone;
          bAdd = tone * 1.18;
          elevation = 146 + 33 * glacialBands - 20 * fractures + 10 * grainSigned;
          roughness = 105 + 44 * glacialBands + 14 * grain;
          break;
        }
        case FLORA: {
          // Forest islands/districts, valleys and sparser alpine vegetation.
          // Apply changes relative to the original species-derived color;
          // do not force flora into a fixed Earth-green palette.
          const canopy = clamp01VISSURF3(0.44 * local + 0.56 * grain + 0.17 * (plate - 0.5));
          const highland = ridges * coastBlend;
          const shade = 37 * (canopy - 0.52) - 12 * valley;
          rAdd = shade * 0.72 + 11 * highland;
          gAdd = shade * 0.92 + 15 * highland;
          bAdd = shade * 0.60 + 15 * highland;
          elevation = 126 + 37 * highland + 11 * (local - 0.5) - 13 * valley;
          roughness = 172 + 24 * canopy + 15 * highland;
          break;
        }
        case DESERT: {
          const dunes = 0.60 * (folds - 0.5) + 0.40 * (grain - 0.5);
          const massif = ridges * coastBlend;
          const strata = 14 * band + 12 * (local - 0.5) + 6 * dunes;
          rAdd = strata + 19 * massif;
          gAdd = strata * 0.73 + 14 * massif;
          bAdd = strata * 0.42 + 9 * massif;
          elevation = 132 + 38 * massif + 11 * dunes + 11 * (local - 0.5) - 8 * valley;
          roughness = 184 + 26 * massif + 15 * grain;
          break;
        }
        case VOLCANIC: {
          const lavaRidges = ridges * coastBlend;
          const ash = 11 * band + 18 * (local - 0.5);
          rAdd = ash + 10 * lavaRidges;
          gAdd = ash * 0.83 + 7 * lavaRidges;
          bAdd = ash * 0.65 + 6 * lavaRidges;
          elevation = 139 + 63 * lavaRidges + 15 * (grain - 0.5) - 8 * valley;
          roughness = 188 + 37 * lavaRidges + 15 * grain;
          break;
        }
        case ROCK:
        default: {
          const massif = ridges * coastBlend;
          const strata = 14 * band + 18 * (local - 0.5) - 7 * valley;
          const exposed = 32 * massif;
          rAdd = strata * 0.75 + exposed * 0.88;
          gAdd = strata * 0.87 + exposed * 0.93;
          bAdd = strata + exposed;
          elevation = 132 + 70 * massif - 17 * valley + 12 * grainSigned;
          roughness = 178 + 41 * massif + 13 * grain;
          break;
        }
      }

      rgba[offset] = byteVISSURF3(rgba[offset]! + rAdd);
      rgba[offset + 1] = byteVISSURF3(rgba[offset + 1]! + gAdd);
      rgba[offset + 2] = byteVISSURF3(rgba[offset + 2]! + bAdd);
      heightField[index] = byteVISSURF3(elevation);
      if (reliefRgba) {
        const level = heightField[index]!;
        reliefRgba[offset] = reliefRgba[offset + 1] = reliefRgba[offset + 2] = level;
      }
      if (roughnessRgba) {
        const value = byteVISSURF3(roughness);
        roughnessRgba[offset] = roughnessRgba[offset + 1] = roughnessRgba[offset + 2] = value;
      }
    }
    // Repeat the exact first meridian so the equirectangular seam is invisible.
    const first = y * width;
    const last = first + uniqueWidth;
    rgba.set(rgba.subarray(first * 4, first * 4 + 4), last * 4);
    heightField[last] = heightField[first]!;
    if (reliefRgba) reliefRgba.set(reliefRgba.subarray(first * 4, first * 4 + 4), last * 4);
    if (roughnessRgba) roughnessRgba.set(roughnessRgba.subarray(first * 4, first * 4 + 4), last * 4);
  }

  // Build normal map in tangent space using the actual structured height field,
  // not the original 256px atlas. This map affects lighting ONLY, not geometry.
  for (let y = 0; y < height; y++) {
    const up = Math.max(0, y - 1) * width;
    const down = Math.min(height - 1, y + 1) * width;
    const row = y * width;
    for (let x = 0; x < uniqueWidth; x++) {
      const i = row + x;
      const dest = i * 4;
      if (classMask[i] === WATER) {
        normalRgba[dest] = 128;
        normalRgba[dest + 1] = 128;
        normalRgba[dest + 2] = 255;
      } else {
        const left = row + (x + uniqueWidth - 1) % uniqueWidth;
        const right = row + (x + 1) % uniqueWidth;
        const dx = (heightField[right]! - heightField[left]!) * 0.042;
        const dy = (heightField[down + x]! - heightField[up + x]!) * 0.042;
        const invLength = 1 / Math.sqrt(1 + dx * dx + dy * dy);
        normalRgba[dest] = byteVISSURF3(127.5 * (1 - dx * invLength));
        normalRgba[dest + 1] = byteVISSURF3(127.5 * (1 - dy * invLength));
        normalRgba[dest + 2] = byteVISSURF3(127.5 * (1 + invLength));
      }
      normalRgba[dest + 3] = 255;
    }
    normalRgba.set(normalRgba.subarray(row * 4, row * 4 + 4), (row + uniqueWidth) * 4);
  }
  return { ...surface, normalRgba };
}

/** Short-range distance from each material pixel to water/non-water boundary,
 * using 2 sweeps. The signed *class* is obtained from the immutable mask. */
function signedCoastDistanceVISSURF3(mask: Uint8Array, width: number, height: number): Uint8Array {
  const stride = width - 1;
  const dist = new Uint8Array(width * height);
  dist.fill(MAX_COAST_DISTANCE);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < stride; x++) {
      const water = mask[row + x] === WATER;
      const left = row + (x + stride - 1) % stride;
      const right = row + (x + 1) % stride;
      const north = Math.max(0, y - 1) * width + x;
      const south = Math.min(height - 1, y + 1) * width + x;
      if ((mask[left] === WATER) !== water || (mask[right] === WATER) !== water ||
          (mask[north] === WATER) !== water || (mask[south] === WATER) !== water) dist[row + x] = 0;
    }
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const up = Math.max(0, y - 1) * width;
    for (let x = 0; x < stride; x++) {
      const i = row + x;
      dist[i] = Math.min(dist[i]!, x > 0 ? dist[i - 1]! + 1 : MAX_COAST_DISTANCE,
        y > 0 ? dist[up + x]! + 1 : MAX_COAST_DISTANCE);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const row = y * width;
    const down = Math.min(height - 1, y + 1) * width;
    for (let x = stride - 1; x >= 0; x--) {
      const i = row + x;
      dist[i] = Math.min(dist[i]!, x + 1 < stride ? dist[i + 1]! + 1 : MAX_COAST_DISTANCE,
        y + 1 < height ? dist[down + x]! + 1 : MAX_COAST_DISTANCE);
    }
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    dist[row + stride] = dist[row]!;
  }
  return dist;
}

function periodicFieldVISSURF3(u: number, v: number, freqX: number, freqY: number, seed: number): number {
  const px = u * freqX;
  const py = v * freqY;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const sx = px - ix;
  const sy = py - iy;
  const tx = sx * sx * (3 - 2 * sx);
  const ty = sy * sy * (3 - 2 * sy);
  const x0 = ((ix % freqX) + freqX) % freqX;
  const x1 = (x0 + 1) % freqX;
  const a = hashFieldVISSURF3(x0, iy, seed);
  const b = hashFieldVISSURF3(x1, iy, seed);
  const c = hashFieldVISSURF3(x0, iy + 1, seed);
  const d = hashFieldVISSURF3(x1, iy + 1, seed);
  return ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty);
}
function hashFieldVISSURF3(x: number, y: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function clamp01VISSURF3(value: number): number { return Math.max(0, Math.min(1, value)); }
function byteVISSURF3(value: number): number { return Math.max(0, Math.min(255, Math.round(value))); }
