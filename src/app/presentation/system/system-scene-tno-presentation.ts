/** TNO-R1 — Read-only, deterministic shape/material projection.
 * All inputs are already modelled facts, not inferred surface observations.
 * Terrain is illustrative: inventories do not imply exposed surface ice.
 */
export interface SystemSceneTnoPresentationInputV1 {
  readonly proceduralId: string;
  readonly diameterKilometers: number;
  readonly iceFraction01: number;
  readonly rockFraction01: number;
  readonly geometricAlbedo01: number;
  readonly bulkDensityGramsPerCubicCentimeter: number;
}

export interface SystemSceneTnoPresentationV1 {
  readonly version: 1;
  readonly source: 'TNO_R1_PROCEDURAL';
  readonly sourceDiameterKilometers: number;
  readonly iceFraction01: number;
  readonly geometricAlbedo01: number;
  readonly variantUint32: number;
  readonly colorHex: string;
  readonly accentHex: string;
  readonly roughness01: number;
  readonly irregularity01: number;
  readonly frostPatchiness01: number;
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

export function buildSystemSceneTnoPresentationV1(input: SystemSceneTnoPresentationInputV1): SystemSceneTnoPresentationV1 {
  if (input.proceduralId.trim().length === 0) throw new RangeError('TNO identity required');
  if (!(input.diameterKilometers > 0) || !Number.isFinite(input.diameterKilometers)) throw new RangeError('TNO diameter invalid');
  if (!(input.bulkDensityGramsPerCubicCentimeter > 0) || !Number.isFinite(input.bulkDensityGramsPerCubicCentimeter)) throw new RangeError('TNO density invalid');
  for (const v of [input.iceFraction01, input.rockFraction01, input.geometricAlbedo01]) {
    if (!Number.isFinite(v) || v < 0 || v > 1) throw new RangeError('TNO fraction/albedo invalid');
  }
  if (Math.abs(input.iceFraction01 + input.rockFraction01 - 1) > 1e-6) throw new RangeError('TNO fractions inconsistent');
  let seed = 0x811c9dc5;
  for (const char of input.proceduralId + '|GENESIS|TNO-R1') {
    seed = Math.imul(seed ^ char.charCodeAt(0), 0x01000193) >>> 0;
  }
  const large = clamp((input.diameterKilometers - 90) / 650, 0, 1);
  const densityFactor = clamp((input.bulkDensityGramsPerCubicCentimeter - 0.7) / 1.7, 0, 1);
  const irregularity = clamp((0.21 - 0.17 * large) * (1 - 0.12 * densityFactor) +
    (unit(seed, 11) - 0.5) * 0.035, 0.025, 0.25);
  // Volatile/rock abundance controls palette opportunities only. A low albedo
  // cannot be overridden into a uniformly brilliant blue/white icy sphere.
  const ice = input.iceFraction01;
  const reflect = Math.sqrt(input.geometricAlbedo01);
  const tint = unit(seed, 13);
  const warm = 0.25 + 0.42 * (1 - ice) + 0.30 * tint;
  const level = 35 + reflect * 175;
  const r = level * (0.93 + 0.24 * warm);
  const g = level * (0.91 + 0.06 * ice);
  const b = level * (0.86 + 0.17 * ice - 0.06 * warm);
  const colorHex = hex(r, g, b);
  return Object.freeze({
    version: 1 as const, source: 'TNO_R1_PROCEDURAL' as const,
    sourceDiameterKilometers: input.diameterKilometers,
    iceFraction01: ice, geometricAlbedo01: input.geometricAlbedo01,
    variantUint32: seed, colorHex,
    accentHex: hex(r * 0.81, g * 0.92, b * 1.10),
    roughness01: clamp(0.96 - 0.12 * reflect - 0.045 * large, 0.77, 0.97),
    irregularity01: irregularity,
    frostPatchiness01: clamp(ice * (0.16 + 0.24 * reflect), 0, 0.4),
  });
}

export function tnoTerrainSeedUnitV1(seed: number, salt: number): number { return unit(seed >>> 0, salt); }
