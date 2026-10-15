import { type CapturedExtrasolarObjectCompositionRegime } from '../../domain/planetary/captured-extrasolar-object-composition-regime';

/** CAP-R1 — Read-only, deterministic surface/material projection for captured objects.
 * Inputs are already modeled current-time physical properties. The renderer must
 * not infer any special color or texture from extrasolar origin or capture path.
 */
export interface SystemSceneCapturedPresentationInputV1 {
  readonly proceduralId: string;
  readonly diameterKilometers: number;
  readonly volatileFraction01: number;
  readonly refractoryFraction01: number;
  readonly geometricAlbedo01: number;
  readonly bulkDensityGramsPerCubicCentimeter: number;
  readonly porosityIndex01: number;
  readonly compositionRegime: CapturedExtrasolarObjectCompositionRegime | 'MIXED';
}

export interface SystemSceneCapturedPresentationV1 {
  readonly version: 1;
  readonly source: 'CAP_R1_PROCEDURAL';
  readonly sourceDiameterKilometers: number;
  readonly volatileFraction01: number;
  readonly geometricAlbedo01: number;
  readonly variantUint32: number;
  readonly colorHex: string;
  readonly accentHex: string;
  readonly roughness01: number;
  readonly irregularity01: number;
  readonly frostPatchiness01: number;
  readonly basinStrength01: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const unit = (s: number, n: number) => {
  let x = (s ^ Math.imul(n, 0x9e3779b9)) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 0x100000000;
};
const hex = (r: number, g: number, b: number) => '#' + [r,g,b]
  .map(x => Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('').toUpperCase();

export function buildSystemSceneCapturedPresentationV1(
  input: SystemSceneCapturedPresentationInputV1,
): SystemSceneCapturedPresentationV1 {
  if (input.proceduralId.trim().length === 0) throw new RangeError('Captured identity required');
  if (!(input.diameterKilometers > 0) || !Number.isFinite(input.diameterKilometers)) {
    throw new RangeError('Captured diameter invalid');
  }
  if (!(input.bulkDensityGramsPerCubicCentimeter > 0) || !Number.isFinite(input.bulkDensityGramsPerCubicCentimeter)) {
    throw new RangeError('Captured density invalid');
  }
  for (const v of [
    input.volatileFraction01,
    input.refractoryFraction01,
    input.geometricAlbedo01,
    input.porosityIndex01,
  ]) {
    if (!Number.isFinite(v) || v < 0 || v > 1) throw new RangeError('Captured fraction/albedo invalid');
  }
  if (Math.abs(input.volatileFraction01 + input.refractoryFraction01 - 1) > 1e-6) {
    throw new RangeError('Captured fractions inconsistent');
  }
  let seed = 0x811c9dc5;
  for (const char of input.proceduralId + '|GENESIS|CAP-R1') {
    seed = Math.imul(seed ^ char.charCodeAt(0), 0x01000193) >>> 0;
  }

  // CAP-R1b: size must dominate seed-level scatter across orders of magnitude.
  // A logarithmic size response distinguishes sub-km bodies from tens-of-km
  // bodies while preserving deterministic diversity within each size class.
  const sizeFactor = clamp(Math.log1p(input.diameterKilometers) / Math.log1p(180), 0, 1);
  const densityFactor = clamp((input.bulkDensityGramsPerCubicCentimeter - 0.8) / 2.5, 0, 1);
  const porous = input.porosityIndex01;
  const volatile = input.volatileFraction01;
  const reflect = Math.sqrt(input.geometricAlbedo01);
  const irregularity = clamp(
    (0.28 - 0.15 * sizeFactor) * (0.90 + 0.22 * porous) * (1 - 0.10 * densityFactor)
      + (unit(seed, 11) - 0.5) * 0.042,
    0.03, 0.34,
  );

  const regimeShift =
    input.compositionRegime === 'ROCK_DOMINATED'
      ? -0.10
      : input.compositionRegime === 'VOLATILE_RICH'
        ? 0.08
        : 0;
  const neutral = 0.30 + 0.44 * volatile + regimeShift + 0.18 * unit(seed, 12);
  const level = 28 + reflect * 190;
  const r = level * (0.92 + 0.18 * neutral + 0.06 * (1 - volatile));
  const g = level * (0.90 + 0.10 * neutral + 0.04 * volatile);
  const b = level * (0.86 + 0.22 * volatile - 0.06 * (1 - neutral));
  const colorHex = hex(r, g, b);
  return Object.freeze({
    version: 1 as const,
    source: 'CAP_R1_PROCEDURAL' as const,
    sourceDiameterKilometers: input.diameterKilometers,
    volatileFraction01: volatile,
    geometricAlbedo01: input.geometricAlbedo01,
    variantUint32: seed,
    colorHex,
    accentHex: hex(r * (0.80 + 0.05 * volatile), g * (0.90 + 0.05 * volatile), b * 1.08),
    roughness01: clamp(0.97 - 0.18 * reflect + 0.05 * porous, 0.76, 0.99),
    irregularity01: irregularity,
    frostPatchiness01: clamp(volatile * (0.08 + 0.22 * reflect), 0, 0.32),
    basinStrength01: clamp(0.16 + 0.48 * irregularity + 0.12 * porous, 0.16, 0.72),
  });
}

export function capturedTerrainSeedUnitV1(seed: number, salt: number): number {
  return unit(seed >>> 0, salt);
}
