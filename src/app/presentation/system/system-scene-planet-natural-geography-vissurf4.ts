import type { SystemScenePlanetSurfaceTextureData } from './system-scene-planet-surface-texture';
import {
  buildMultiresolutionSolidPlanetSurfaceVISSURF2,
  type SolidPlanetDetailAtlasesVISSURF2,
} from './system-scene-planet-surface-detail-vissurf2';

/**
 * VISSURF.4 — integración natural de relieve y materiales.
 *
 * Parte del atlas científico y del refinamiento multirresolución VISSURF.2.
 * No altera la clasificación física/biológica, la semilla, las nubes ni la
 * persistencia. Solo mejora la lectura visual: montañas menos abruptas,
 * mesetas y valles integrados, materiales menos recortados, vegetación con
 * variación espacial más creíble y océanos/costas con mejor profundidad.
 */
export interface SolidPlanetNaturalAtlasesVISSURF4 extends SolidPlanetDetailAtlasesVISSURF2 {
  readonly normalRgba: Uint8Array;
}

const WATER = 1;
const ICE = 2;
const ROCK = 3;
const DESERT = 4;
const FLORA = 5;
const VOLCANIC = 6;
const MAX_DISTANCE = 96;

export function buildNaturalSolidPlanetSurfaceVISSURF4(
  source: Pick<SystemScenePlanetSurfaceTextureData,
    'width' | 'height' | 'rgba' | 'roughnessRgba' | 'reliefRgba' | 'surfaceClassMask'>,
  targetWidth: number,
  seedUint32: number,
): SolidPlanetNaturalAtlasesVISSURF4 {
  if (!source.surfaceClassMask) throw new RangeError('Solid planets require a surface class mask.');
  if (targetWidth > 2048) throw new RangeError('Planet detail exceeds the supported budget.');

  const surface = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, targetWidth, seedUint32);
  const { width, height, rgba, roughnessRgba, reliefRgba, classMask } = surface;
  const uniqueWidth = width - 1;
  const coastDistance = signedDistanceVISSURF4(classMask, width, height, (a, b) => (a === WATER) !== (b === WATER));
  const materialEdgeDistance = signedDistanceVISSURF4(classMask, width, height, (a, b) => a !== b);
  const normalRgba = new Uint8Array(rgba.length);
  const heightField = new Uint8Array(width * height);

  const seedMacro = seedUint32 ^ 0x6f918e37;
  const seedRegional = seedUint32 ^ 0x19a0c5d1;
  const seedMicro = seedUint32 ^ 0xa37f4c59;
  const seedBiome = seedUint32 ^ 0x43dd21b7;
  const seedOcean = seedUint32 ^ 0x8e5af20d;
  const seedBlend = seedUint32 ^ 0x1675b44b;

  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const latitudeAbs = Math.abs(v * 2 - 1);
    const climaticEquator = 1 - latitudeAbs;
    const polarMute = Math.max(0.40, 1 - 0.52 * latitudeAbs * latitudeAbs);
    for (let x = 0; x < uniqueWidth; x++) {
      const index = y * width + x;
      const offset = index * 4;
      const kind = classMask[index]!;
      const u = x / uniqueWidth;

      const macro = periodicFieldVISSURF4(u, v, 5, 3, seedMacro);
      const regional = periodicFieldVISSURF4(u + 0.013 * (macro - 0.5), v, 17, 11, seedRegional);
      const structural = periodicFieldVISSURF4(u - 0.008 * (regional - 0.5), v + 0.005 * (macro - 0.5), 43, 27, seedMicro);
      const biome = periodicFieldVISSURF4(u, v, 31, 19, seedBiome);
      const oceanic = periodicFieldVISSURF4(u, v, 23, 13, seedOcean);
      const blendNoise = periodicFieldVISSURF4(u, v, 61, 37, seedBlend);

      const coastPx = coastDistance[index]!;
      const materialPx = materialEdgeDistance[index]!;
      const coastBlend = smoothstepVISSURF4(1, 14, coastPx);
      const nearCoast = 1 - coastBlend;
      const inland = smoothstepVISSURF4(5, 24, coastPx);
      const materialInterior = smoothstepVISSURF4(1, 9, materialPx);
      const edgeSoftness = 1 - materialInterior;

      // Broad geology: backbone for mountains/plateaus with gentle foothills.
      const ridgeAxis = Math.pow(clamp01VISSURF4(1 - Math.abs(regional - 0.5) / 0.18), 1.55);
      const folded = Math.pow(clamp01VISSURF4(1 - Math.abs(structural - 0.5) / 0.22), 1.9);
      const mountainSpine = ridgeAxis * (0.58 + 0.42 * folded) * inland * polarMute;
      const foothills = Math.pow(mountainSpine, 0.78) * (0.50 + 0.50 * macro) * (0.50 + 0.50 * coastBlend);
      const plateau = clamp01VISSURF4(0.52 * macro + 0.48 * regional - 0.43) * inland;
      const valley = clamp01VISSURF4(1 - Math.abs(structural - 0.22) / 0.10) * (0.58 + 0.42 * (1 - ridgeAxis));
      const basin = clamp01VISSURF4(0.58 - regional) * clamp01VISSURF4(0.62 - macro);

      const originalR = rgba[offset]!;
      const originalG = rgba[offset + 1]!;
      const originalB = rgba[offset + 2]!;
      let r = originalR;
      let g = originalG;
      let b = originalB;
      let elevation = reliefRgba ? reliefRgba[offset]! : 128;
      let roughness = roughnessRgba ? roughnessRgba[offset + 1]! : 160;

      switch (kind) {
        case WATER: {
          const shelf = 1 - smoothstepVISSURF4(0, 22, coastPx);
          const shallow = Math.pow(shelf, 1.25);
          const deep = 1 - shallow;
          const currents = 0.55 * (oceanic - 0.5) + 0.45 * (biome - 0.5);
          const glitterMute = 1 - 0.35 * nearCoast;
          r += 10 * shallow - 14 * deep + currents * 4;
          g += 20 * shallow - 12 * deep + currents * 6;
          b += 18 * shallow + 6 * deep + currents * 10;
          elevation = 94 + 9 * shallow + currents * 2;
          roughness = 44 + 15 * shallow + 9 * Math.abs(currents) * glitterMute;
          break;
        }
        case ICE: {
          const crevasse = Math.pow(clamp01VISSURF4(1 - Math.abs(structural - 0.5) / 0.12), 2.3);
          const glacialFlow = 0.58 * mountainSpine + 0.42 * foothills;
          const frost = 7 + 14 * (biome - 0.5);
          r += 10 * glacialFlow - 14 * crevasse + frost * 0.55;
          g += 12 * glacialFlow - 10 * crevasse + frost * 0.65;
          b += 16 * glacialFlow - 5 * crevasse + frost;
          elevation = 142 + 22 * glacialFlow + 7 * foothills - 16 * crevasse;
          roughness = 106 + 28 * glacialFlow + 12 * Math.abs(biome - 0.5);
          break;
        }
        case FLORA: {
          const canopy = clamp01VISSURF4(0.50 * biome + 0.30 * macro + 0.20 * (1 - latitudeAbs));
          const moistValley = valley * (0.62 + 0.38 * climaticEquator);
          const scrub = clamp01VISSURF4(0.58 - canopy) * (0.55 + 0.45 * plateau);
          const forest = clamp01VISSURF4(canopy + moistValley * 0.35 - foothills * 0.08);
          const greening = 26 * (forest - 0.42);
          r += -0.45 * greening + 7 * scrub + 9 * foothills;
          g += greening + 9 * moistValley + 5 * foothills;
          b += -0.18 * greening + 7 * moistValley + 7 * foothills;
          elevation = 123 + 24 * foothills + 8 * plateau - 11 * valley;
          roughness = 165 + 16 * forest + 12 * foothills + 8 * scrub;
          break;
        }
        case DESERT: {
          const dunes = 0.55 * (structural - 0.5) + 0.45 * (blendNoise - 0.5);
          const badlands = 0.60 * foothills + 0.40 * plateau;
          const alluvial = 0.55 * valley + 0.45 * nearCoast;
          r += 13 * dunes + 13 * badlands - 5 * alluvial;
          g += 9 * dunes + 8 * badlands - 4 * alluvial;
          b += 5 * dunes + 5 * badlands - 2 * alluvial;
          elevation = 130 + 22 * badlands + 12 * plateau - 8 * valley;
          roughness = 179 + 14 * badlands + 10 * Math.abs(dunes);
          break;
        }
        case VOLCANIC: {
          const lavaDomes = 0.64 * mountainSpine + 0.36 * plateau;
          const ashField = 0.54 * (structural - 0.5) + 0.46 * (macro - 0.5);
          r += 10 * lavaDomes + 10 * ashField;
          g += 7 * lavaDomes + 7 * ashField;
          b += 5 * lavaDomes + 5 * ashField;
          elevation = 134 + 30 * lavaDomes + 10 * plateau - 7 * valley;
          roughness = 183 + 18 * lavaDomes + 12 * Math.abs(ashField);
          break;
        }
        case ROCK:
        default: {
          const massif = 0.58 * mountainSpine + 0.42 * foothills;
          const strata = 0.56 * (macro - 0.5) + 0.44 * (structural - 0.5);
          const weathered = basin * 0.45 + valley * 0.35;
          r += 10 * strata + 15 * massif - 4 * weathered;
          g += 8 * strata + 12 * massif - 3 * weathered;
          b += 6 * strata + 10 * massif - 2 * weathered;
          elevation = 129 + 32 * massif + 12 * plateau - 14 * valley;
          roughness = 175 + 17 * massif + 10 * plateau;
          break;
        }
      }

      // Appearance-only softening near material boundaries keeps classes intact
      // while avoiding cut-out colored patches.
      if (edgeSoftness > 0.02) {
        const neighbour = averagedNeighborColorVISSURF4(rgba, width, height, x, y);
        const softness = edgeSoftness * (0.22 + 0.18 * blendNoise);
        r = mixVISSURF4(r, neighbour[0], softness);
        g = mixVISSURF4(g, neighbour[1], softness);
        b = mixVISSURF4(b, neighbour[2], softness);
      }

      // Keep mountains present but less blocky by integrating with foothills.
      const terrainIntegration = 0.18 * foothills + 0.12 * plateau - 0.08 * valley;
      elevation += 10 * terrainIntegration;
      roughness += 5 * terrainIntegration - 6 * edgeSoftness;

      rgba[offset] = byteVISSURF4(r);
      rgba[offset + 1] = byteVISSURF4(g);
      rgba[offset + 2] = byteVISSURF4(b);
      heightField[index] = byteVISSURF4(elevation);
      if (reliefRgba) {
        const level = heightField[index]!;
        reliefRgba[offset] = reliefRgba[offset + 1] = reliefRgba[offset + 2] = level;
      }
      if (roughnessRgba) {
        const value = byteVISSURF4(roughness);
        roughnessRgba[offset] = roughnessRgba[offset + 1] = roughnessRgba[offset + 2] = value;
      }
    }
    const first = y * width;
    const last = first + uniqueWidth;
    rgba.set(rgba.subarray(first * 4, first * 4 + 4), last * 4);
    heightField[last] = heightField[first]!;
    if (reliefRgba) reliefRgba.set(reliefRgba.subarray(first * 4, first * 4 + 4), last * 4);
    if (roughnessRgba) roughnessRgba.set(roughnessRgba.subarray(first * 4, first * 4 + 4), last * 4);
  }

  // Edge-aware smoothing for heightfield and colors to integrate major ridges.
  smoothVisualFieldVISSURF4(rgba, classMask, width, height, 0.18);
  smoothScalarFieldVISSURF4(heightField, classMask, width, height, 0.16);
  if (reliefRgba) fillScalarTextureVISSURF4(reliefRgba, heightField, width, height);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    const up = Math.max(0, y - 1) * width;
    const down = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < uniqueWidth; x++) {
      const i = row + x;
      const dest = i * 4;
      const left = row + ((x + uniqueWidth - 1) % uniqueWidth);
      const right = row + ((x + 1) % uniqueWidth);
      if (classMask[i] === WATER) {
        const sx = (heightField[right]! - heightField[left]!) * 0.010;
        const sy = (heightField[down + x]! - heightField[up + x]!) * 0.010;
        const inv = 1 / Math.sqrt(1 + sx * sx + sy * sy);
        normalRgba[dest] = byteVISSURF4(127.5 * (1 - sx * inv));
        normalRgba[dest + 1] = byteVISSURF4(127.5 * (1 - sy * inv));
        normalRgba[dest + 2] = byteVISSURF4(127.5 * (1 + inv));
      } else {
        const dx = (heightField[right]! - heightField[left]!) * 0.028;
        const dy = (heightField[down + x]! - heightField[up + x]!) * 0.028;
        const inv = 1 / Math.sqrt(1 + dx * dx + dy * dy);
        normalRgba[dest] = byteVISSURF4(127.5 * (1 - dx * inv));
        normalRgba[dest + 1] = byteVISSURF4(127.5 * (1 - dy * inv));
        normalRgba[dest + 2] = byteVISSURF4(127.5 * (1 + inv));
      }
      normalRgba[dest + 3] = 255;
    }
    normalRgba.set(normalRgba.subarray(row * 4, row * 4 + 4), (row + uniqueWidth) * 4);
  }

  return { ...surface, rgba, roughnessRgba, reliefRgba, classMask, normalRgba };
}

function signedDistanceVISSURF4(
  mask: Uint8Array,
  width: number,
  height: number,
  boundary: (a: number, b: number) => boolean,
): Uint8Array {
  const stride = width - 1;
  const dist = new Uint8Array(width * height);
  dist.fill(MAX_DISTANCE);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < stride; x++) {
      const current = mask[row + x]!;
      const left = mask[row + ((x + stride - 1) % stride)]!;
      const right = mask[row + ((x + 1) % stride)]!;
      const north = mask[Math.max(0, y - 1) * width + x]!;
      const south = mask[Math.min(height - 1, y + 1) * width + x]!;
      if (boundary(current, left) || boundary(current, right) || boundary(current, north) || boundary(current, south)) {
        dist[row + x] = 0;
      }
    }
  }
  for (let y = 0; y < height; y++) {
    const row = y * width;
    const up = Math.max(0, y - 1) * width;
    for (let x = 0; x < stride; x++) {
      const i = row + x;
      dist[i] = Math.min(dist[i]!, x > 0 ? dist[i - 1]! + 1 : MAX_DISTANCE, y > 0 ? dist[up + x]! + 1 : MAX_DISTANCE);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    const row = y * width;
    const down = Math.min(height - 1, y + 1) * width;
    for (let x = stride - 1; x >= 0; x--) {
      const i = row + x;
      dist[i] = Math.min(dist[i]!, x + 1 < stride ? dist[i + 1]! + 1 : MAX_DISTANCE, y + 1 < height ? dist[down + x]! + 1 : MAX_DISTANCE);
    }
  }
  for (let y = 0; y < height; y++) dist[y * width + stride] = dist[y * width]!;
  return dist;
}

function averagedNeighborColorVISSURF4(rgba: Uint8Array, width: number, height: number, x: number, y: number): [number, number, number] {
  const stride = width - 1;
  let r = 0; let g = 0; let b = 0; let count = 0;
  for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      const wrappedX = ((xx % stride) + stride) % stride;
      const i = (yy * width + wrappedX) * 4;
      r += rgba[i]!; g += rgba[i + 1]!; b += rgba[i + 2]!; count++;
    }
  }
  return [r / count, g / count, b / count];
}

function smoothVisualFieldVISSURF4(rgba: Uint8Array, mask: Uint8Array, width: number, height: number, strength: number): void {
  const stride = width - 1;
  const copy = new Uint8Array(rgba);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < stride; x++) {
      const idx = y * width + x;
      const kind = mask[idx]!;
      let r = 0; let g = 0; let b = 0; let w = 0;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
        for (let xx = x - 1; xx <= x + 1; xx++) {
          const wrappedX = ((xx % stride) + stride) % stride;
          const n = yy * width + wrappedX;
          const same = mask[n] === kind;
          const weight = same ? 1 : 0.45;
          const o = n * 4;
          r += copy[o]! * weight;
          g += copy[o + 1]! * weight;
          b += copy[o + 2]! * weight;
          w += weight;
        }
      }
      const o = idx * 4;
      rgba[o] = byteVISSURF4(mixVISSURF4(copy[o]!, r / w, strength));
      rgba[o + 1] = byteVISSURF4(mixVISSURF4(copy[o + 1]!, g / w, strength));
      rgba[o + 2] = byteVISSURF4(mixVISSURF4(copy[o + 2]!, b / w, strength));
    }
    rgba.set(rgba.subarray(y * width * 4, y * width * 4 + 4), (y * width + stride) * 4);
  }
}

function smoothScalarFieldVISSURF4(field: Uint8Array, mask: Uint8Array, width: number, height: number, strength: number): void {
  const stride = width - 1;
  const copy = new Uint8Array(field);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < stride; x++) {
      const idx = y * width + x;
      const kind = mask[idx]!;
      let acc = 0; let w = 0;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
        for (let xx = x - 1; xx <= x + 1; xx++) {
          const wrappedX = ((xx % stride) + stride) % stride;
          const n = yy * width + wrappedX;
          const weight = mask[n] === kind ? 1 : 0.40;
          acc += copy[n]! * weight;
          w += weight;
        }
      }
      field[idx] = byteVISSURF4(mixVISSURF4(copy[idx]!, acc / w, strength));
    }
    field[y * width + stride] = field[y * width]!;
  }
}

function fillScalarTextureVISSURF4(texture: Uint8Array, field: Uint8Array, width: number, height: number): void {
  for (let i = 0; i < width * height; i++) {
    const value = field[i]!;
    const o = i * 4;
    texture[o] = texture[o + 1] = texture[o + 2] = value;
    texture[o + 3] = 255;
  }
}

function periodicFieldVISSURF4(u: number, v: number, freqX: number, freqY: number, seed: number): number {
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
  const a = hashFieldVISSURF4(x0, iy, seed);
  const b = hashFieldVISSURF4(x1, iy, seed);
  const c = hashFieldVISSURF4(x0, iy + 1, seed);
  const d = hashFieldVISSURF4(x1, iy + 1, seed);
  return ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty);
}

function hashFieldVISSURF4(x: number, y: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function smoothstepVISSURF4(a: number, b: number, x: number): number {
  const t = clamp01VISSURF4((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function mixVISSURF4(a: number, b: number, t: number): number { return a * (1 - t) + b * t; }
function clamp01VISSURF4(v: number): number { return Math.max(0, Math.min(1, v)); }
function byteVISSURF4(v: number): number { return Math.max(0, Math.min(255, Math.round(v))); }
