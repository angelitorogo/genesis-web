/**
 * VIS-3D.1 — bounded, deterministic presentation-only texture refinement.
 * Retains the original D.4d semantic atlas and physical coverages: no life,
 * geometry, coastline classification, orbital data or persisted science changes.
 * The continuous source atlas is sampled periodically in longitude with a
 * bounded low-frequency warp, then receives subtle fine mineral/cloud detail.
 */
export type PlanetTextureRefinementKind = 'COLOR' | 'GAS' | 'DATA' | 'CLOUD' | 'EMISSION';

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
  const warpStrength = kind === 'COLOR' ? 0.27 : kind === 'GAS' ? 0.13 : 0;
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
        // Alpha remains interpolated; no new clouds/lava/territories are created.
        result[dest + channel] = Math.max(0, Math.min(255,
          Math.round(top * (1 - fy) + bottom * fy + noise)));
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
