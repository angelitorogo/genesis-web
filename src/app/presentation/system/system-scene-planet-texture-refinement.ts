/**
 * VIS-3D.1 — bounded, deterministic presentation-only texture refinement.
 * Retains the original D.4d semantic atlas and physical coverages: no life,
 * geometry, coastline classification, orbital data or persisted science changes.
 * The continuous source atlas is sampled periodically in longitude with a
 * bounded low-frequency warp, then receives subtle fine mineral/cloud detail.
 */
export type PlanetTextureRefinementKind = 'COLOR' | 'GAS' | 'DATA' | 'CLOUD' | 'WEATHER_CLOUD' | 'EMISSION';

export function refinePlanetRgbaTextureV1(
  source: Uint8Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  seedUint32: number,
  kind: PlanetTextureRefinementKind,
): Uint8Array {
  if (!Number.isInteger(sourceWidth) || sourceWidth < 3 ||
      !Number.isInteger(sourceHeight) || sourceHeight < 2 ||
      source.length !== sourceWidth * sourceHeight * 4) {
    throw new RangeError('Invalid source planet texture.');
  }
  if (!Number.isInteger(targetWidth) || targetWidth < sourceWidth ||
      targetWidth > 2048 || targetWidth % 2 !== 0) {
    throw new RangeError('Target width must be an even, bounded equirectangular resolution.');
  }
  // Both grids include a repeated seam column; height follows that ratio.
  const targetHeight = targetWidth / 2;
  const scaleY = targetHeight / sourceHeight;
  if (targetHeight > 1024) throw new RangeError('Planet detail exceeds the supported budget.');
  if (targetWidth === sourceWidth && targetHeight === sourceHeight) return new Uint8Array(source);
  const result = new Uint8Array(targetWidth * targetHeight * 4);
  const sourceSpan = sourceWidth - 1;
  const targetSpan = targetWidth - 1;
  const color = kind === 'COLOR' || kind === 'GAS';
  const weatherCloud = kind === 'WEATHER_CLOUD';
  const warpStrength = kind === 'COLOR' ? 0.27 : kind === 'GAS' ? 0.13 : weatherCloud ? 0.42 : 0;
  const mineralStrength = kind === 'COLOR' ? 6.2 : kind === 'GAS' ? 2.8 : 0;
  const phase = (seedUint32 >>> 8) / 0x1000000 * 6.283185307179586;
  const phase2 = (seedUint32 & 65535) / 65535 * 6.283185307179586;

  for (let y = 0; y < targetHeight; y++) {
    const latitude = (y + 0.5) / targetHeight;
    for (let x = 0; x < targetSpan; x++) {
      const lon = x / targetSpan * 6.283185307179586;
      // Periodic coherent warp softens low-resolution tile boundaries without
      // modifying the original measured/assigned surface fractions.
      const warpX = warpStrength * (
        Math.sin(3 * lon + 13 * latitude + phase) * 0.65 +
        Math.sin(11 * lon - 7 * latitude + phase2) * 0.35
      );
      const warpY = warpStrength * (
        Math.sin(5 * lon - 9 * latitude + phase2) * 0.65 +
        Math.sin(9 * lon + 5 * latitude + phase) * 0.35
      );
      const sx = ((x / targetSpan * sourceSpan + warpX) % sourceSpan + sourceSpan) % sourceSpan;
      const sy = Math.max(0, Math.min(sourceHeight - 1, (y + 0.5) / scaleY - 0.5 + warpY));
      const x0 = Math.floor(sx);
      const y0 = Math.floor(sy);
      const x1 = (x0 + 1) % sourceSpan;
      const y1 = Math.min(sourceHeight - 1, y0 + 1);
      const fx = sx - x0;
      const fy = sy - y0;
      const a = (y0 * sourceWidth + x0) * 4;
      const b = (y0 * sourceWidth + x1) * 4;
      const c = (y1 * sourceWidth + x0) * 4;
      const d = (y1 * sourceWidth + x1) * 4;
      const dest = (y * targetWidth + x) * 4;
      // Reconstructed fine-scale albedo is purely illustrative. Its amplitude
      // is bounded so oceans, deserts, ice and gaseous bands keep their identity.
      const fine = color ? mineralStrength * (
        0.62 * Math.sin(61 * lon + 39 * latitude + phase) *
          Math.sin(27 * lon - 43 * latitude + phase2) +
        0.38 * Math.sin(97 * lon + 59 * latitude - phase2) *
          Math.sin(53 * lon - 31 * latitude + phase)
      ) : 0;
      for (let channel = 0; channel < 4; channel++) {
        const top = source[a + channel]! * (1 - fx) + source[b + channel]! * fx;
        const bottom = source[c + channel]! * (1 - fx) + source[d + channel]! * fx;
        const noise = channel < 3 ? fine : 0;
        let value = top * (1 - fy) + bottom * fy + noise;
        if (weatherCloud && channel === 3 && value > 0) {
          // VIS3D.2f: organic cirrus breakup from periodic, coherent noise.
          // The three scales avoid visibly repeating striped/sine artifacts.
          // Zero source alpha is still zero: there are no invented clouds.
          const broad = periodicCloudNoise01(
            x / targetSpan, latitude, 17, 9, seedUint32 ^ 0x84d34b71,
          );
          const billow = periodicCloudNoise01(
            x / targetSpan, latitude, 47, 27, seedUint32 ^ 0x2b85fa19,
          );
          const wisps = periodicCloudNoise01(
            x / targetSpan, latitude, 101, 53, seedUint32 ^ 0x51c79e3d,
          );
          const cloudStructure = 0.38 * broad + 0.41 * billow + 0.21 * wisps;
          const densityFactor = Math.max(0.20, Math.min(1.08,
            0.16 + 1.55 * cloudStructure,
          ));
          value *= densityFactor;
        }
        result[dest + channel] = Math.max(0, Math.min(255, Math.round(value)));
      }
    }
    // Explicitly duplicate the longitude seam exactly, including alpha.
    const left = y * targetWidth * 4;
    result.set(result.subarray(left, left + 4), (y * targetWidth + targetWidth - 1) * 4);
  }
  return result;
}

/** Equirectangular atlases with one duplicated longitude-seam column. */
export const PLANET_TEXTURE_DETAIL_SIZES_V1 = Object.freeze({
  distant: Object.freeze({ width: 256, height: 128 }),
  closeSystem: Object.freeze({ width: 512, height: 256 }),
  scientificPreview: Object.freeze({ width: 1024, height: 512 }),
});

/** Seamless longitude noise for preview-only cloud microstructure. */
function periodicCloudNoise01(
  u: number,
  v: number,
  frequencyX: number,
  frequencyY: number,
  seed: number,
): number {
  const x = u * frequencyX;
  const y = v * frequencyY;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const dx = x - ix;
  const dy = y - iy;
  const fx = dx * dx * (3 - 2 * dx);
  const fy = dy * dy * (3 - 2 * dy);
  const x0 = ((ix % frequencyX) + frequencyX) % frequencyX;
  const x1 = (x0 + 1) % frequencyX;
  const p00 = cloudHash01(x0, iy, seed);
  const p10 = cloudHash01(x1, iy, seed);
  const p01 = cloudHash01(x0, iy + 1, seed);
  const p11 = cloudHash01(x1, iy + 1, seed);
  const top = p00 + (p10 - p00) * fx;
  const bottom = p01 + (p11 - p01) * fx;
  return top + (bottom - top) * fy;
}

function cloudHash01(x: number, y: number, seed: number): number {
  let value = seed ^ Math.imul(x, 0x9e3779b1) ^ Math.imul(y, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}
