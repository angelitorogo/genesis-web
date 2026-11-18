import type { SystemScenePlanetSurfaceTextureData } from './system-scene-planet-surface-texture';

/**
 * VISSURF.2 — multi-resolution, coverage-conserving illustrative geography.
 *
 * D.4d remains the scientific authority: no recalculation of physical/biotic
 * inventories, no edits to night-light masks, clouds or IndexedDB. The high
 * resolution class labels are a *separate* visual field. Its five non-generic
 * class quotas reproduce the source atlas to the nearest target texel. All
 * details are seeded in continuous UV space, so the same world produces the
 * same geography at 1024 and 2048 instead of unrelated per-texel noise.
 */
export interface SolidPlanetDetailAtlasesVISSURF2 {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
  readonly roughnessRgba: Uint8Array | null;
  readonly reliefRgba: Uint8Array | null;
  readonly classMask: Uint8Array;
}

export const SOLID_PLANET_DETAIL_WIDTH_VISSURF2 = Object.freeze({
  closeSystem: 1024,
  scientificPreview: 2048,
});

const CLASS_WATER = 1;
const CLASS_ICE = 2;
const CLASS_ROCK = 3;
const CLASS_DESERT = 4;
const CLASS_FLORA = 5;
const CLASS_VOLCANIC = 6;
const CLASS_PRIORITY = [CLASS_ICE, CLASS_WATER, CLASS_FLORA, CLASS_DESERT, CLASS_VOLCANIC] as const;
const SCORE_BINS = 65536;

export function buildMultiresolutionSolidPlanetSurfaceVISSURF2(
  source: Pick<SystemScenePlanetSurfaceTextureData,
    'width' | 'height' | 'rgba' | 'roughnessRgba' | 'reliefRgba' | 'surfaceClassMask'>,
  targetWidth: number,
  seedUint32: number,
): SolidPlanetDetailAtlasesVISSURF2 {
  const sw = source.width;
  const sh = source.height;
  const inputClasses = source.surfaceClassMask;
  if (!inputClasses || sw < 3 || sh < 2 || sw !== sh * 2 ||
      inputClasses.length !== sw * sh || source.rgba.length !== sw * sh * 4 ||
      !Number.isInteger(targetWidth) || targetWidth < sw || targetWidth > 2048 ||
      targetWidth % 2 !== 0 ||
      (source.roughnessRgba !== null && source.roughnessRgba?.length !== sw * sh * 4) ||
      (source.reliefRgba !== null && source.reliefRgba?.length !== sw * sh * 4)) {
    throw new RangeError('VISSURF.2: atlas o resolución inválidos.');
  }
  const tw = targetWidth;
  const th = tw / 2;
  const dstSpan = tw - 1;
  const srcSpan = sw - 1;
  const uniquePixels = dstSpan * th;
  const sourcePixels = srcSpan * sh;
  const sourceCounts = new Uint32Array(7);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < srcSpan; x++) {
      const code = inputClasses[y * sw + x]!;
      if (code >= CLASS_WATER && code <= CLASS_VOLCANIC) sourceCounts[code]!++;
      else sourceCounts[CLASS_ROCK]!++;
    }
  }

  // Continuous, longitude-periodic coordinates and material fields; these are
  // ephemeral and discarded once the texture is built. No planet-wide HD cache.
  const sampleX = new Float32Array(uniquePixels);
  const sampleY = new Float32Array(uniquePixels);
  const macroField = new Float32Array(uniquePixels);
  const detailField = new Float32Array(uniquePixels);
  const scores = CLASS_PRIORITY.map(() => new Float32Array(uniquePixels));
  const sourceCode = (index: number): number => {
    const code = inputClasses[index]!;
    return code >= CLASS_WATER && code <= CLASS_VOLCANIC ? code : CLASS_ROCK;
  };

  for (let y = 0; y < th; y++) {
    const v = (y + 0.5) / th;
    const polarFade = 1 - 0.70 * Math.pow(Math.abs(2 * v - 1), 2);
    for (let x = 0; x < dstSpan; x++) {
      const u = x / dstSpan;
      const index = y * dstSpan + x;
      const large = periodicNoiseVISSURF2(u, v, 23, 13, seedUint32 ^ 0x619b4fd1);
      const medium = periodicNoiseVISSURF2(u, v, 67, 41, seedUint32 ^ 0x1dc71ae3);
      const small = periodicNoiseVISSURF2(u, v, 199, 113, seedUint32 ^ 0x8c5a3217);
      const coast = periodicNoiseVISSURF2(u, v, 397, 229, seedUint32 ^ 0x751b8c49);
      const coastField = 0.52 * medium + 0.32 * small + 0.16 * coast;
      const warpX = polarFade * (2.55 * (large - 0.5) + 1.65 * (medium - 0.5) + 0.58 * (small - 0.5));
      const warpY = (1.75 * (large - 0.5) + 1.05 * (medium - 0.5) + 0.40 * (small - 0.5));
      const sx = positiveModVISSURF2(u * srcSpan + warpX, srcSpan);
      const sy = clampVISSURF2(v * sh - 0.5 + warpY, 0, sh - 1);
      sampleX[index] = sx;
      sampleY[index] = sy;
      macroField[index] = large;
      detailField[index] = 0.35 * medium + 0.37 * small + 0.28 * coast;
      const x0 = Math.floor(sx);
      const x1 = (x0 + 1) % srcSpan;
      const y0 = Math.floor(sy);
      const y1 = Math.min(sh - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;
      const c00 = sourceCode(y0 * sw + x0);
      const c10 = sourceCode(y0 * sw + x1);
      const c01 = sourceCode(y1 * sw + x0);
      const c11 = sourceCode(y1 * sw + x1);
      for (let kindIndex = 0; kindIndex < CLASS_PRIORITY.length; kindIndex++) {
        const kind = CLASS_PRIORITY[kindIndex]!;
        const occupancy = (c00 === kind ? w00 : 0) + (c10 === kind ? w10 : 0) +
          (c01 === kind ? w01 : 0) + (c11 === kind ? w11 : 0);
        // Coastlines, ice shelves and forest margins acquire sub-cell bays,
        // capes and islands. Fully interior cells remain interior. A tiny
        // deterministic tie-breaker makes exact-quota selection stable.
        const boundary = 4 * occupancy * (1 - occupancy);
        const detail = (coastField - 0.5) * (0.56 + 0.20 * (kind === CLASS_WATER ? 1 : 0));
        scores[kindIndex]![index] = clampVISSURF2(
          occupancy + detail * boundary + 0.002 * (small - 0.5) * occupancy,
          0, 1,
        );
      }
    }
  }

  const selected = new Uint8Array(uniquePixels);
  for (let j = 0; j < CLASS_PRIORITY.length; j++) {
    const kind = CLASS_PRIORITY[j]!;
    const quota = Math.round(sourceCounts[kind]! * uniquePixels / sourcePixels);
    selectExactAreaVISSURF2(scores[j]!, selected, kind, quota);
  }
  for (let i = 0; i < uniquePixels; i++) if (selected[i] === 0) selected[i] = CLASS_ROCK;

  const rgba = new Uint8Array(tw * th * 4);
  const roughnessRgba = source.roughnessRgba ? new Uint8Array(tw * th * 4) : null;
  const reliefRgba = source.reliefRgba ? new Uint8Array(tw * th * 4) : null;
  const classMask = new Uint8Array(tw * th);

  for (let y = 0; y < th; y++) {
    for (let x = 0; x < dstSpan; x++) {
      const index = y * dstSpan + x;
      const kind = selected[index]!;
      const sx = sampleX[index]!;
      const sy = sampleY[index]!;
      const x0 = Math.floor(sx);
      const x1 = (x0 + 1) % srcSpan;
      const y0 = Math.floor(sy);
      const y1 = Math.min(sh - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const indices = [y0 * sw + x0, y0 * sw + x1, y1 * sw + x0, y1 * sw + x1];
      const weights = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
      let sameWeight = 0;
      let nearLand = 0;
      for (let i = 0; i < 4; i++) {
        const k = sourceCode(indices[i]!);
        if (k === kind) sameWeight += weights[i]!;
        if (k !== CLASS_WATER) nearLand += weights[i]!;
      }
      const fine = detailField[index]! - 0.5;
      const broad = macroField[index]! - 0.5;
      const dest = (y * tw + x) * 4;
      classMask[y * tw + x] = kind;
      const scale = materialContrastVISSURF2(kind);
      for (let channel = 0; channel < 3; channel++) {
        const base = classSampleVISSURF2(source.rgba, indices, weights, inputClasses, kind, sameWeight, channel);
        let shade = scale * (0.58 * broad + 0.88 * fine);
        if (kind === CLASS_WATER) {
          // Shallow coastal shelves brighten, open oceans retain depth.
          shade = (channel === 2 ? 0.75 : 0.50) * shade +
            nearLand * (channel === 0 ? 5.5 : channel === 1 ? 10.0 : 5.0);
        } else if (kind === CLASS_FLORA) {
          shade *= channel === 1 ? 1.12 : 0.74;
        } else if (kind === CLASS_ICE) {
          shade *= channel === 2 ? 1.08 : 0.78;
        } else if (kind === CLASS_DESERT) {
          shade *= channel === 0 ? 1.08 : 0.78;
        }
        // Narrow optical anti-aliasing; no one-cell-wide bilinear material fog.
        rgba[dest + channel] = byteVISSURF2(base + shade);
      }
      rgba[dest + 3] = 255;
      if (roughnessRgba && source.roughnessRgba) {
        const base = classSampleVISSURF2(source.roughnessRgba, indices, weights, inputClasses, kind, sameWeight, 0);
        const materialOffset = kind === CLASS_WATER ? -6 : kind === CLASS_ICE ? 8 :
          kind === CLASS_FLORA ? 12 : kind === CLASS_DESERT ? 18 : 16;
        const value = byteVISSURF2(base + materialOffset + fine * (kind === CLASS_WATER ? 6 : 42));
        roughnessRgba[dest] = roughnessRgba[dest + 1] = roughnessRgba[dest + 2] = value;
        roughnessRgba[dest + 3] = 255;
      }
      if (reliefRgba && source.reliefRgba) {
        const base = classSampleVISSURF2(source.reliefRgba, indices, weights, inputClasses, kind, sameWeight, 0);
        const materialScale = kind === CLASS_WATER ? 2 : kind === CLASS_ICE ? 24 :
          kind === CLASS_FLORA ? 30 : kind === CLASS_DESERT ? 39 : 43;
        const value = byteVISSURF2(base + (fine * 0.80 + broad * 0.20) * materialScale);
        reliefRgba[dest] = reliefRgba[dest + 1] = reliefRgba[dest + 2] = value;
        reliefRgba[dest + 3] = 255;
      }
    }
    const first = y * tw * 4;
    const last = first + (tw - 1) * 4;
    rgba.set(rgba.subarray(first, first + 4), last);
    if (roughnessRgba) roughnessRgba.set(roughnessRgba.subarray(first, first + 4), last);
    if (reliefRgba) reliefRgba.set(reliefRgba.subarray(first, first + 4), last);
    classMask[y * tw + tw - 1] = classMask[y * tw]!;
  }
  return { width: tw, height: th, rgba, roughnessRgba, reliefRgba, classMask };
}

/** Exact target-area selection without sorting millions of pixels. Bounded
 * 16-bit histogram plus a deterministic boundary-bin pass; source is intact. */
function selectExactAreaVISSURF2(
  score: Float32Array, selected: Uint8Array, kind: number, requested: number,
): void {
  if (requested <= 0) return;
  const histogram = new Uint32Array(SCORE_BINS);
  let free = 0;
  for (let i = 0; i < score.length; i++) {
    if (selected[i] !== 0) continue;
    free++;
    histogram[Math.min(65535, Math.floor(score[i]! * 65535))]!++;
  }
  const required = Math.min(requested, free);
  if (required === 0) return;
  let accumulated = 0;
  let threshold = 0;
  for (let bin = SCORE_BINS - 1; bin >= 0; bin--) {
    if (accumulated + histogram[bin]! >= required) { threshold = bin; break; }
    accumulated += histogram[bin]!;
  }
  const requiredOnBoundary = required - accumulated;
  const totalOnBoundary = histogram[threshold]!;
  let boundaryAccum = 0;
  let assigned = 0;
  for (let i = 0; i < score.length; i++) {
    if (selected[i] !== 0) continue;
    const bin = Math.min(65535, Math.floor(score[i]! * 65535));
    if (bin > threshold) {
      selected[i] = kind;
      assigned++;
    } else if (bin === threshold) {
      boundaryAccum += requiredOnBoundary;
      if (boundaryAccum >= totalOnBoundary) {
        boundaryAccum -= totalOnBoundary;
        selected[i] = kind;
        assigned++;
      }
    }
  }
  if (assigned !== required) throw new Error('VISSURF.2: fallo de conservación del área semántica.');
}

function classSampleVISSURF2(
  buffer: Uint8Array,
  indices: readonly number[],
  weights: readonly number[],
  classes: Uint8Array,
  kind: number,
  matchingWeight: number,
  channel: number,
): number {
  let value = 0;
  if (matchingWeight > 0.0001) {
    for (let i = 0; i < 4; i++) {
      if (classes[indices[i]!] === kind) value += buffer[indices[i]! * 4 + channel]! * weights[i]!;
    }
    return value / matchingWeight;
  }
  for (let i = 0; i < 4; i++) value += buffer[indices[i]! * 4 + channel]! * weights[i]!;
  return value;
}

function materialContrastVISSURF2(kind: number): number {
  return kind === CLASS_WATER ? 12 : kind === CLASS_ICE ? 24 :
    kind === CLASS_FLORA ? 54 : kind === CLASS_DESERT ? 48 :
      kind === CLASS_VOLCANIC ? 44 : 50;
}

function periodicNoiseVISSURF2(
  u: number, v: number, frequencyX: number, frequencyY: number, seed: number,
): number {
  const px = u * frequencyX;
  const py = v * frequencyY;
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const sx = px - ix;
  const sy = py - iy;
  const tx = sx * sx * (3 - 2 * sx);
  const ty = sy * sy * (3 - 2 * sy);
  const x0 = ix % frequencyX;
  const x1 = (x0 + 1) % frequencyX;
  const n00 = hashNoiseVISSURF2(x0, iy, seed);
  const n10 = hashNoiseVISSURF2(x1, iy, seed);
  const n01 = hashNoiseVISSURF2(x0, iy + 1, seed);
  const n11 = hashNoiseVISSURF2(x1, iy + 1, seed);
  return (n00 + (n10 - n00) * tx) * (1 - ty) + (n01 + (n11 - n01) * tx) * ty;
}
function hashNoiseVISSURF2(x: number, y: number, seed: number): number {
  let value = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}
function positiveModVISSURF2(value: number, period: number): number {
  return ((value % period) + period) % period;
}
function clampVISSURF2(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}
function byteVISSURF2(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}
