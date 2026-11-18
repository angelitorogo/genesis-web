import type { SystemScenePlanetSurfaceTextureData } from './system-scene-planet-surface-texture';

/**
 * VISSURF.1 — high-frequency, material-aware surface reconstruction.
 *
 * The authoritative surface/biome atlas remains D.4d (256x128): it fixes
 * ocean/ice coverage, vegetation locations, city masks and scientific identity.
 * This routine only increases visual sampling of those EXISTING classes.
 * Longitude-periodic coherent warping refines coasts, while bilinear
 * filtering across source material boundaries prevents nearest-class block
 * artifacts. Only a one-source-texel coastal transition mixes materials;
 * material-specific fine grain remains coherent inside each region.
 * Neither clouds, atmosphere nor artificial night emission are touched.
 */
export interface SolidPlanetDetailAtlasesVISSURF1 {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8Array;
  readonly roughnessRgba: Uint8Array | null;
  readonly reliefRgba: Uint8Array | null;
  /** Output class map only for visual regression tests; never persisted. */
  readonly classMask: Uint8Array;
}

export const SOLID_PLANET_DETAIL_WIDTH_VISSURF1 = Object.freeze({
  closeSystem: 1024,
  scientificPreview: 2048,
});

export function refineSolidPlanetSurfaceVISSURF1(
  source: Pick<SystemScenePlanetSurfaceTextureData,
    'width' | 'height' | 'rgba' | 'roughnessRgba' | 'reliefRgba' | 'surfaceClassMask'>,
  targetWidth: number,
  seedUint32: number,
): SolidPlanetDetailAtlasesVISSURF1 {
  const { width: sw, height: sh, surfaceClassMask: classes } = source;
  if (!classes || classes.length !== sw * sh ||
      sw < 3 || sh < 2 || source.rgba.length !== sw * sh * 4 ||
      !Number.isInteger(targetWidth) || targetWidth < sw ||
      targetWidth > 2048 || targetWidth % 2 !== 0 ||
      (source.roughnessRgba !== null && source.roughnessRgba?.length !== sw * sh * 4) ||
      (source.reliefRgba !== null && source.reliefRgba?.length !== sw * sh * 4)) {
    throw new RangeError('VISSURF.1: invalid semantic atlas or resolution.');
  }
  const tw = targetWidth;
  const th = tw / 2;
  const srcSpan = sw - 1;
  const dstSpan = tw - 1;
  const rgba = new Uint8Array(tw * th * 4);
  const roughnessRgba = source.roughnessRgba ? new Uint8Array(tw * th * 4) : null;
  const reliefRgba = source.reliefRgba ? new Uint8Array(tw * th * 4) : null;
  const classMask = new Uint8Array(tw * th);
  const seedA = seedUint32 ^ 0x4b82a19d;
  const seedB = seedUint32 ^ 0x6c3e52af;
  const seedC = seedUint32 ^ 0x8d17f4c3;

  for (let y = 0; y < th; y++) {
    const v = (y + 0.5) / th;
    for (let x = 0; x < dstSpan; x++) {
      const u = x / dstSpan;
      const macroNoise = periodicValueNoiseVISSURF1(u * 29, v * 17, 29, seedA);
      const mediumNoise = periodicValueNoiseVISSURF1(u * 83, v * 47, 83, seedB);
      const fineNoise = periodicValueNoiseVISSURF1(u * 397, v * 217, 397, seedC);
      const sx = positiveModVISSURF1(u * srcSpan + (macroNoise - 0.5) * 1.25 +
        (mediumNoise - 0.5) * 0.47, srcSpan);
      const sy = clampVISSURF1((v * sh - 0.5) + (mediumNoise - 0.5) * 0.67 +
        (macroNoise - 0.5) * 0.24, 0, sh - 1);
      const x0 = Math.floor(sx);
      const x1 = (x0 + 1) % srcSpan;
      const y0 = Math.floor(sy);
      const y1 = Math.min(sh - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const i00 = y0 * sw + x0;
      const i10 = y0 * sw + x1;
      const i01 = y1 * sw + x0;
      const i11 = y1 * sw + x1;
      const nearestX = fx >= 0.5 ? x1 : x0;
      const nearestY = fy >= 0.5 ? y1 : y0;
      const nearest = nearestY * sw + nearestX;
      const kind = classes[nearest]!;
      const di = y * tw + x;
      const dest = di * 4;
      classMask[di] = kind;
      // VISSURF.1a: nearest-class *color* sampling produced giant square
      // blocks on the planet even at 2048x1024. Interpolate ALL four texels
      // across a narrow (one source texel) shoreline; classification itself
      // still comes from the canonical source and is never persisted here.
      const w00 = (1 - fx) * (1 - fy);
      const w10 = fx * (1 - fy);
      const w01 = (1 - fx) * fy;
      const w11 = fx * fy;
      const micro = (mediumNoise - 0.5) * 0.42 + (fineNoise - 0.5) * 0.58;
      const coarse = macroNoise - 0.5;
      const amplitude =
        w00 * materialColorAmplitudeVISSURF1(classes[i00]!) +
        w10 * materialColorAmplitudeVISSURF1(classes[i10]!) +
        w01 * materialColorAmplitudeVISSURF1(classes[i01]!) +
        w11 * materialColorAmplitudeVISSURF1(classes[i11]!);
      const waterWeight = w00 * (classes[i00] === 1 ? 1 : 0) +
        w10 * (classes[i10] === 1 ? 1 : 0) +
        w01 * (classes[i01] === 1 ? 1 : 0) +
        w11 * (classes[i11] === 1 ? 1 : 0);
      const vegetationWeight = w00 * (classes[i00] === 5 ? 1 : 0) +
        w10 * (classes[i10] === 5 ? 1 : 0) +
        w01 * (classes[i01] === 5 ? 1 : 0) +
        w11 * (classes[i11] === 5 ? 1 : 0);
      const colorVariation = amplitude * (micro * 1.6 + coarse * 0.38);
      for (let channel = 0; channel < 3; channel++) {
        const src = source.rgba;
        const base = w00 * src[i00 * 4 + channel]! + w10 * src[i10 * 4 + channel]! +
          w01 * src[i01 * 4 + channel]! + w11 * src[i11 * 4 + channel]!;
        // The material-dependent modulation is interpolated as well, so
        // procedural detail cannot reintroduce a hard coastline edge.
        const tint = colorVariation * (channel === 2 ? 1 - waterWeight * 1.28
          : channel === 0 ? 1 - vegetationWeight * 0.33 : 1);
        rgba[dest + channel] = byteVISSURF1(base + tint);
      }
      rgba[dest + 3] = 255;
      if (roughnessRgba && source.roughnessRgba) {
        const src = source.roughnessRgba;
        const base = w00 * src[i00 * 4]! + w10 * src[i10 * 4]! +
          w01 * src[i01 * 4]! + w11 * src[i11 * 4]!;
        const value = byteVISSURF1(base + micro * (
          w00 * materialRoughnessAmplitudeVISSURF1(classes[i00]!) +
          w10 * materialRoughnessAmplitudeVISSURF1(classes[i10]!) +
          w01 * materialRoughnessAmplitudeVISSURF1(classes[i01]!) +
          w11 * materialRoughnessAmplitudeVISSURF1(classes[i11]!)
        ));
        roughnessRgba[dest] = roughnessRgba[dest + 1] = roughnessRgba[dest + 2] = value;
        roughnessRgba[dest + 3] = 255;
      }
      if (reliefRgba && source.reliefRgba) {
        const src = source.reliefRgba;
        const base = w00 * src[i00 * 4]! + w10 * src[i10 * 4]! +
          w01 * src[i01 * 4]! + w11 * src[i11 * 4]!;
        const value = byteVISSURF1(base + micro * (
          w00 * materialReliefAmplitudeVISSURF1(classes[i00]!) +
          w10 * materialReliefAmplitudeVISSURF1(classes[i10]!) +
          w01 * materialReliefAmplitudeVISSURF1(classes[i01]!) +
          w11 * materialReliefAmplitudeVISSURF1(classes[i11]!)
        ));
        reliefRgba[dest] = reliefRgba[dest + 1] = reliefRgba[dest + 2] = value;
        reliefRgba[dest + 3] = 255;
      }
    }
    // A single exact duplicated longitude column, including data maps.
    const first = y * tw * 4;
    const last = first + (tw - 1) * 4;
    rgba.set(rgba.subarray(first, first + 4), last);
    if (roughnessRgba) roughnessRgba.set(roughnessRgba.subarray(first, first + 4), last);
    if (reliefRgba) reliefRgba.set(reliefRgba.subarray(first, first + 4), last);
    classMask[y * tw + tw - 1] = classMask[y * tw]!;
  }
  return { width: tw, height: th, rgba, roughnessRgba, reliefRgba, classMask };
}

function materialColorAmplitudeVISSURF1(kind: number): number {
  return kind === 1 ? 4.2 : kind === 2 ? 15.5
    : kind === 4 ? 20 : kind === 5 ? 18 : kind === 6 ? 16 : 14;
}
function materialRoughnessAmplitudeVISSURF1(kind: number): number {
  return kind === 1 ? 5 : kind === 2 ? 19 : 26;
}
function materialReliefAmplitudeVISSURF1(kind: number): number {
  return kind === 1 ? 1.2 : kind === 2 ? 26 : 34;
}

function periodicValueNoiseVISSURF1(x: number, y: number, periodX: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const dx = x - ix;
  const dy = y - iy;
  const tx = dx * dx * (3 - 2 * dx);
  const ty = dy * dy * (3 - 2 * dy);
  const x0 = positiveModVISSURF1(ix, periodX);
  const x1 = positiveModVISSURF1(ix + 1, periodX);
  const a = hash2VISSURF1(x0, iy, seed);
  const b = hash2VISSURF1(x1, iy, seed);
  const c = hash2VISSURF1(x0, iy + 1, seed);
  const d = hash2VISSURF1(x1, iy + 1, seed);
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}

function hash2VISSURF1(x: number, y: number, seed: number): number {
  let h = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
function positiveModVISSURF1(x: number, period: number): number {
  return ((x % period) + period) % period;
}
function clampVISSURF1(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function byteVISSURF1(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}
