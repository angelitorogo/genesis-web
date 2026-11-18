import type { SystemScenePlanetSurfaceTextureData } from './system-scene-planet-surface-texture';
import {
  buildMultiresolutionSolidPlanetSurfaceVISSURF2,
  type SolidPlanetDetailAtlasesVISSURF2,
} from './system-scene-planet-surface-detail-vissurf2';

/**
 * VISSURF.5 — integración natural de relieve y materiales.
 *
 * Parte del atlas científico y del refinamiento multirresolución VISSURF.2.
 * No altera la clasificación física/biológica, la semilla, las nubes ni la
 * persistencia. Integra macrorelieve legible como VISSURF.3 y transiciones
 * selectivas como VISSURF.4, sin el suavizado cromático general que borraba
 * geología. Los atlas de clase y las cuotas científicas son los de VISSURF.2.
 */
export interface SolidPlanetCoherentAtlasesVISSURF5 extends SolidPlanetDetailAtlasesVISSURF2 {
  readonly normalRgba: Uint8Array;
}

const WATER = 1;
const ICE = 2;
const ROCK = 3;
const DESERT = 4;
const FLORA = 5;
const VOLCANIC = 6;
const MAX_DISTANCE = 96;

export function buildCoherentSolidPlanetSurfaceVISSURF5(
  source: Pick<SystemScenePlanetSurfaceTextureData,
    'width' | 'height' | 'rgba' | 'roughnessRgba' | 'reliefRgba' | 'surfaceClassMask'>,
  targetWidth: number,
  seedUint32: number,
): SolidPlanetCoherentAtlasesVISSURF5 {
  if (!source.surfaceClassMask) throw new RangeError('Solid planets require a surface class mask.');
  if (targetWidth > 2048) throw new RangeError('Planet detail exceeds the supported budget.');

  const surface = buildMultiresolutionSolidPlanetSurfaceVISSURF2(source, targetWidth, seedUint32);
  const { width, height, rgba, roughnessRgba, reliefRgba, classMask } = surface;
  const uniqueWidth = width - 1;
  const coastDistance = signedDistanceVISSURF5(classMask, width, height, (a, b) => (a === WATER) !== (b === WATER));
  const materialEdgeDistance = signedDistanceVISSURF5(classMask, width, height, (a, b) => a !== b);
  const normalRgba = new Uint8Array(rgba.length);
  // Read-only pre-detail albedo: boundary blending never reads pixels already
  // written earlier in the scan, avoiding directional streaks and blur.
  const originalAlbedo = new Uint8Array(rgba);
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

      const macro = periodicFieldVISSURF5(u, v, 5, 3, seedMacro);
      const regional = periodicFieldVISSURF5(u + 0.013 * (macro - 0.5), v, 17, 11, seedRegional);
      const structural = periodicFieldVISSURF5(u - 0.008 * (regional - 0.5), v + 0.005 * (macro - 0.5), 43, 27, seedMicro);
      const biome = periodicFieldVISSURF5(u, v, 31, 19, seedBiome);
      const oceanic = periodicFieldVISSURF5(u, v, 23, 13, seedOcean);
      const blendNoise = periodicFieldVISSURF5(u, v, 61, 37, seedBlend);

      const coastPx = coastDistance[index]!;
      const materialPx = materialEdgeDistance[index]!;
      const coastBlend = smoothstepVISSURF5(1, 14, coastPx);
      const nearCoast = 1 - coastBlend;
      const inland = smoothstepVISSURF5(5, 24, coastPx);
      // Narrow, type-sensitive optical transitions only. VISSURF.4 applied
      // another global blur after this and made rock formations look painted.
      const materialInterior = smoothstepVISSURF5(0, kind === DESERT ? 7 : kind === FLORA ? 6 : 4, materialPx);
      const edgeSoftness = 1 - materialInterior;

      // VISSURF.5a: mountain chains grow out of BROAD stress provinces.
      // The previous abs(noise - constant) isolines created closed rings,
      // dark wells and parallel "engraved" contour bands under normal mapping.
      // Regional stress is instead a positive, domain-warped blend of octaves:
      // broad, asymmetric highlands and valleys with no fixed-value contours.
      const regionalStress = 0.57 * regional + 0.27 * macro + 0.16 * structural;
      const orogeny = smoothstepVISSURF5(0.34, 0.69, regionalStress);
      const foldModulation = 0.72 + 0.28 * (0.55 * structural + 0.45 * biome);
      const mountainSpine = Math.pow(orogeny, 1.16) *
        foldModulation * inland * polarMute;
      const foothills = Math.pow(clamp01VISSURF5(mountainSpine), 0.60) *
        (0.50 + 0.50 * macro) * (0.57 + 0.43 * coastBlend);
      const plateau = smoothstepVISSURF5(0.32, 0.72, 0.55 * macro + 0.45 * regional) * inland;
      const valley = smoothstepVISSURF5(0.38, 0.68,
        0.54 * (1 - regional) + 0.28 * (1 - structural) + 0.18 * (1 - macro)) *
        (0.58 + 0.42 * (1 - orogeny));
      const basin = clamp01VISSURF5(0.58 - regional) * clamp01VISSURF5(0.62 - macro);

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
          // Continental shelf is anchored to the untouched water/land mask.
          // The inner basin receives subtle broad currents, not grainy waves.
          const shelf = 1 - smoothstepVISSURF5(0, 34, coastPx);
          const shallow = shelf * shelf * (3 - 2 * shelf);
          const deep = 1 - shallow;
          const currents = 0.68 * (oceanic - 0.5) + 0.32 * (macro - 0.5);
          const shelfMicro = 0.24 * (structural - 0.5) * shallow;
          // VISSURF.5b: preserve the shallow/deep chromatic gradient while
          // desaturating overly uniform open water. No high-frequency grain.
          const oceanDepthTone = 4 * (oceanic - 0.5) * (0.35 + 0.65 * deep);
          r += 12 * shallow - 13 * deep + currents * 5 + shelfMicro * 5 - oceanDepthTone * 0.7;
          g += 27 * shallow - 8 * deep + currents * 8 + shelfMicro * 6 + oceanDepthTone * 0.4;
          b += 20 * shallow + 4 * deep + currents * 10 + shelfMicro * 7 + oceanDepthTone;
          elevation = 96 + 10 * shallow + currents * 1.7;
          // The old 61/255 roughness made MeshStandardMaterial produce a
          // conspicuous white point highlight. 0.43-0.53 retains controlled
          // reflections without changing clouds or stellar light sources.
          roughness = 111 + 19 * shallow + 9 * Math.abs(currents);
          break;
        }
        case ICE: {
          // Irregular stress fractures rather than closed equal-value rings.
          const crevasse = smoothstepVISSURF5(0.14, 0.43,
            Math.abs(0.64 * (regional - structural) + 0.36 * (macro - biome))) *
            (0.32 + 0.68 * mountainSpine);
          const glacialFlow = 0.58 * mountainSpine + 0.42 * foothills;
          const frost = 7 + 14 * (biome - 0.5);
          r += 10 * glacialFlow - 14 * crevasse + frost * 0.55;
          g += 12 * glacialFlow - 10 * crevasse + frost * 0.65;
          b += 16 * glacialFlow - 5 * crevasse + frost;
          elevation = 142 + 29 * glacialFlow + 8 * foothills - 13 * crevasse;
          roughness = 106 + 28 * glacialFlow + 12 * Math.abs(biome - 0.5);
          break;
        }
        case FLORA: {
          const canopy = clamp01VISSURF5(0.42 * biome + 0.36 * macro + 0.22 * (1 - latitudeAbs));
          const moistValley = valley * (0.62 + 0.38 * climaticEquator);
          const scrub = clamp01VISSURF5(0.58 - canopy) * (0.55 + 0.45 * plateau);
          const forest = clamp01VISSURF5(canopy + moistValley * 0.34 - foothills * 0.13);
          // Broad, asymmetric forest provinces: no equal-value isolines or
          // repeated stripes. Canopy density responds to valleys and slopes.
          const forestProvince = smoothstepVISSURF5(0.27, 0.67,
            0.42 * biome + 0.33 * regional + 0.25 * macro);
          const forestDensity = clamp01VISSURF5(0.54 * forest +
            0.46 * forestProvince + 0.18 * moistValley - 0.12 * mountainSpine);
          const clearings = clamp01VISSURF5((1 - forestProvince) *
            (0.40 + 0.38 * plateau + 0.22 * scrub));
          // Species pigments remain authoritative: all channels are scaled
          // together. Limited bare-soil inclusions break up uniform color.
          const forestAlbedo = 1.18 - 0.49 * forestDensity +
            0.10 * clearings + 0.035 * (structural - 0.5);
          const exposedSoil = Math.min(0.13, 0.13 * clearings *
            (0.55 + 0.45 * foothills));
          r = mixVISSURF5(originalR * forestAlbedo, 134, exposedSoil) + 3 * moistValley;
          g = mixVISSURF5(originalG * forestAlbedo, 123, exposedSoil) + 3 * moistValley;
          b = mixVISSURF5(originalB * forestAlbedo, 100, exposedSoil) + 3 * moistValley;
          elevation = 123 + 33 * foothills + 11 * plateau - 14 * valley;
          roughness = 164 + 20 * forestDensity + 12 * foothills + 7 * scrub;
          break;
        }
        case DESERT: {
          const dunes = 0.55 * (structural - 0.5) + 0.45 * (blendNoise - 0.5);
          const badlands = 0.60 * foothills + 0.40 * plateau;
          const alluvial = 0.55 * valley + 0.45 * nearCoast;
          // Sedimentary plains, mineral outcrops and gentle basins share the
          // same broad geology. This stays inside the existing DESERT mask.
          const sediments = 0.48 * (regional - 0.5) +
            0.34 * (macro - 0.5) + 0.18 * (biome - 0.5);
          const bedrock = 0.58 * badlands + 0.42 * plateau;
          const dust = 0.55 * alluvial + 0.45 * (1 - coastBlend);
          r += 10 * dunes + 15 * bedrock + 16 * sediments - 4 * dust;
          g += 8 * dunes + 10 * bedrock + 12 * sediments - 2 * dust;
          b += 5 * dunes + 7 * bedrock + 8 * sediments + 2 * dust;
          elevation = 130 + 30 * badlands + 14 * plateau - 12 * valley;
          roughness = 176 + 16 * bedrock + 9 * Math.abs(dunes) + 4 * dust;
          break;
        }
        case VOLCANIC: {
          const lavaDomes = 0.64 * mountainSpine + 0.36 * plateau;
          const ashField = 0.54 * (structural - 0.5) + 0.46 * (macro - 0.5);
          r += 10 * lavaDomes + 10 * ashField;
          g += 7 * lavaDomes + 7 * ashField;
          b += 5 * lavaDomes + 5 * ashField;
          elevation = 134 + 47 * lavaDomes + 13 * plateau - 10 * valley;
          roughness = 183 + 18 * lavaDomes + 12 * Math.abs(ashField);
          break;
        }
        case ROCK:
        default: {
          const massif = 0.62 * mountainSpine + 0.38 * foothills;
          const strata = 0.56 * (macro - 0.5) + 0.44 * (structural - 0.5);
          const weathered = basin * 0.45 + valley * 0.35;
          r += 13 * strata + 19 * massif - 5 * weathered;
          g += 10 * strata + 17 * massif - 4 * weathered;
          b += 8 * strata + 15 * massif - 3 * weathered;
          elevation = 128 + 64 * massif + 16 * plateau - 17 * valley;
          roughness = 175 + 17 * massif + 10 * plateau;
          break;
        }
      }

      // Appearance-only softening near material boundaries keeps classes intact
      // while avoiding cut-out colored patches.
      if (edgeSoftness > 0.02) {
        // Do not blend terrestrial pigments into the sea or vice versa:
        // preserve the crisp coastline established in VISSURF.2/5a.
        const neighbour = averagedNeighborColorVISSURF5(
          originalAlbedo, classMask, width, height, x, y, kind,
        );
        const classStrength = kind === DESERT ? 0.26 : kind === FLORA ? 0.20 : 0.15;
        const softness = edgeSoftness * (classStrength + 0.08 * blendNoise);
        r = mixVISSURF5(r, neighbour[0], softness);
        g = mixVISSURF5(g, neighbour[1], softness);
        b = mixVISSURF5(b, neighbour[2], softness);
      }

      // Keep mountains present but less blocky by integrating with foothills.
      // Preserve the restored macrorelief; integrate the edge, not the entire
      // planet. Limits appearance-only slopes without changing geometry.
      const terrainIntegration = 0.32 * foothills + 0.18 * plateau - 0.08 * valley;
      elevation += 12 * terrainIntegration;
      roughness += 7 * terrainIntegration - 3 * edgeSoftness;

      rgba[offset] = byteVISSURF5(r);
      rgba[offset + 1] = byteVISSURF5(g);
      rgba[offset + 2] = byteVISSURF5(b);
      heightField[index] = byteVISSURF5(elevation);
      if (reliefRgba) {
        const level = heightField[index]!;
        reliefRgba[offset] = reliefRgba[offset + 1] = reliefRgba[offset + 2] = level;
      }
      if (roughnessRgba) {
        const value = byteVISSURF5(roughness);
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

  // A very light, class-aware HEIGHT pass removes pixel-scale cliffs. Do not
  // blur albedo globally: doing so erased VISSURF.3 mountain definition.
  smoothScalarFieldVISSURF5(heightField, classMask, width, height, 0.07);
  if (reliefRgba) fillScalarTextureVISSURF5(reliefRgba, heightField, width, height);

  // Equal angular-normal strength at 1024 and 2048; otherwise close-up
  // appears flat merely because neighboring texels are closer together.
  // A modest material-aware normal gain restores slope readability without
  // increasing the physical height field or reinstating isoline contours.
  const normalScale = 0.058 * width / 1024;
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
        const sx = (heightField[right]! - heightField[left]!) * normalScale * 0.10;
        const sy = (heightField[down + x]! - heightField[up + x]!) * normalScale * 0.10;
        const inv = 1 / Math.sqrt(1 + sx * sx + sy * sy);
        normalRgba[dest] = byteVISSURF5(127.5 * (1 - sx * inv));
        normalRgba[dest + 1] = byteVISSURF5(127.5 * (1 - sy * inv));
        normalRgba[dest + 2] = byteVISSURF5(127.5 * (1 + inv));
      } else {
        const own = heightField[i]!;
        // At water/ice/material boundaries, avoid fake vertical "walls".
        const west = classMask[left] === classMask[i] ? heightField[left]! : own;
        const east = classMask[right] === classMask[i] ? heightField[right]! : own;
        const north = classMask[up + x] === classMask[i] ? heightField[up + x]! : own;
        const south = classMask[down + x] === classMask[i] ? heightField[down + x]! : own;
        // Add legibility to moderate slopes; never amplify high-contrast
        // walls that would resurrect the concentric artifacts of VISSURF.5.
        const rawDx = east - west;
        const rawDy = south - north;
        const slopeGate = clamp01VISSURF5(1 -
          Math.max(Math.abs(rawDx), Math.abs(rawDy)) / 8);
        const extraDetail = classMask[i] === ROCK ? 0.20 :
          classMask[i] === VOLCANIC ? 0.16 :
            classMask[i] === DESERT ? 0.13 :
              classMask[i] === FLORA ? 0.09 : 0.05;
        const materialGain = 1 + extraDetail * slopeGate;
        const dx = rawDx * normalScale * materialGain;
        const dy = rawDy * normalScale * materialGain;
        const inv = 1 / Math.sqrt(1 + dx * dx + dy * dy);
        normalRgba[dest] = byteVISSURF5(127.5 * (1 - dx * inv));
        normalRgba[dest + 1] = byteVISSURF5(127.5 * (1 - dy * inv));
        normalRgba[dest + 2] = byteVISSURF5(127.5 * (1 + inv));
      }
      normalRgba[dest + 3] = 255;
    }
    normalRgba.set(normalRgba.subarray(row * 4, row * 4 + 4), (row + uniqueWidth) * 4);
  }

  return { ...surface, rgba, roughnessRgba, reliefRgba, classMask, normalRgba };
}

function signedDistanceVISSURF5(
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

function averagedNeighborColorVISSURF5(
  rgba: Uint8Array, mask: Uint8Array, width: number, height: number,
  x: number, y: number, kind: number,
): [number, number, number] {
  const stride = width - 1;
  let r = 0; let g = 0; let b = 0; let count = 0;
  for (let yy = Math.max(0, y - 1); yy <= Math.min(height - 1, y + 1); yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      const wrappedX = ((xx % stride) + stride) % stride;
      const index = yy * width + wrappedX;
      // Shorelines never mix sea and land color. Mineral/flora borders can
      // borrow nearby albedo while the class mask itself stays unchanged.
      if ((kind === WATER) !== (mask[index] === WATER)) continue;
      const i = index * 4;
      r += rgba[i]!; g += rgba[i + 1]!; b += rgba[i + 2]!; count++;
    }
  }
  const self = (y * width + x) * 4;
  return count > 0 ? [r / count, g / count, b / count] :
    [rgba[self]!, rgba[self + 1]!, rgba[self + 2]!];
}

function smoothScalarFieldVISSURF5(field: Uint8Array, mask: Uint8Array, width: number, height: number, strength: number): void {
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
      field[idx] = byteVISSURF5(mixVISSURF5(copy[idx]!, acc / w, strength));
    }
    field[y * width + stride] = field[y * width]!;
  }
}

function fillScalarTextureVISSURF5(texture: Uint8Array, field: Uint8Array, width: number, height: number): void {
  for (let i = 0; i < width * height; i++) {
    const value = field[i]!;
    const o = i * 4;
    texture[o] = texture[o + 1] = texture[o + 2] = value;
    texture[o + 3] = 255;
  }
}

function periodicFieldVISSURF5(u: number, v: number, freqX: number, freqY: number, seed: number): number {
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
  const a = hashFieldVISSURF5(x0, iy, seed);
  const b = hashFieldVISSURF5(x1, iy, seed);
  const c = hashFieldVISSURF5(x0, iy + 1, seed);
  const d = hashFieldVISSURF5(x1, iy + 1, seed);
  return ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty);
}

function hashFieldVISSURF5(x: number, y: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function smoothstepVISSURF5(a: number, b: number, x: number): number {
  const t = clamp01VISSURF5((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
function mixVISSURF5(a: number, b: number, t: number): number { return a * (1 - t) + b * t; }
function clamp01VISSURF5(v: number): number { return Math.max(0, Math.min(1, v)); }
function byteVISSURF5(v: number): number { return Math.max(0, Math.min(255, Math.round(v))); }
