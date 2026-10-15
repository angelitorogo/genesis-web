/**
 * COM-R1 comet nucleus, visual-only deterministic surface relief.
 * Uses only the persisted renderer variant; no random draws or physical changes.
 * Angles, pits and deposits are illustrative morphology, not observed features.
 */
export interface CometNucleusFeatureV1 {
  readonly direction: readonly [number, number, number];
  readonly chordRadius: number;
  readonly floorDepth: number;
  readonly rimHeight: number;
}

export interface CometNucleusTerrainV1 {
  readonly seed: number;
  readonly irregularity01: number;
  readonly basins: readonly CometNucleusFeatureV1[];
  readonly pits: readonly CometNucleusFeatureV1[];
}

export interface CometNucleusTerrainSampleV1 {
  readonly radialOffset: number;
  readonly hollow01: number;
  readonly rim01: number;
  readonly smoothDust01: number;
  readonly granularNoise: number;
}

const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function cometNucleusSeedUnitV1(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 0x100000000;
}

function direction(seed: number, salt: number): readonly [number, number, number] {
  const z = 2 * cometNucleusSeedUnitV1(seed, salt) - 1;
  const a = TAU * cometNucleusSeedUnitV1(seed, salt + 1);
  const r = Math.sqrt(Math.max(0, 1 - z * z));
  return [r * Math.cos(a), r * Math.sin(a), z];
}

/** Feature layout is seeded once per nucleus, never once per vertex. */
export function buildCometNucleusTerrainV1(
  seed: number, irregularity01: number,
): CometNucleusTerrainV1 {
  const s = seed >>> 0;
  const irregularity = clamp(irregularity01, 0, 1);
  const basins: CometNucleusFeatureV1[] = [];
  const pits: CometNucleusFeatureV1[] = [];
  for (let i = 0; i < 5; i++) {
    const salt = 1000 + i * 17;
    const radius = 0.25 + cometNucleusSeedUnitV1(s, salt + 3) * 0.27;
    const depth = (0.035 + 0.037 * irregularity) *
      (0.7 + 0.5 * cometNucleusSeedUnitV1(s, salt + 4));
    basins.push(Object.freeze({
      direction: direction(s, salt), chordRadius: radius,
      floorDepth: depth, rimHeight: depth * 0.14,
    }));
  }
  for (let i = 0; i < 27; i++) {
    const salt = 2000 + i * 13;
    const radius = 0.045 + Math.pow(cometNucleusSeedUnitV1(s, salt + 3), 1.1) * 0.16;
    const depth = (0.015 + 0.022 * cometNucleusSeedUnitV1(s, salt + 4)) *
      (0.70 + 0.40 * irregularity);
    pits.push(Object.freeze({
      direction: direction(s, salt), chordRadius: radius,
      floorDepth: depth, rimHeight: depth * 0.11,
    }));
  }
  return Object.freeze({ seed: s, irregularity01: irregularity,
    basins: Object.freeze(basins), pits: Object.freeze(pits) });
}

/** Smooth, continuous spherical relief (not per-triangle random displacement). */
export function sampleCometNucleusTerrainV1(
  nx: number, ny: number, nz: number, terrain: CometNucleusTerrainV1,
): CometNucleusTerrainSampleV1 {
  let radialOffset = 0;
  let hollow01 = 0;
  let rim01 = 0;

  for (const feature of terrain.basins) {
    const dot = clamp(nx * feature.direction[0] + ny * feature.direction[1] + nz * feature.direction[2], -1, 1);
    const chord = Math.sqrt(Math.max(0, 2 - 2 * dot));
    const t = chord / feature.chordRadius;
    if (t > 1.55) continue;
    const floor = t < 1 ? (1 - t * t) ** 2 : 0;
    const edge = Math.exp(-(((t - 1) / 0.15) ** 2));
    radialOffset += -feature.floorDepth * floor + feature.rimHeight * edge;
    hollow01 = Math.max(hollow01, floor);
    rim01 = Math.max(rim01, edge);
  }
  for (const feature of terrain.pits) {
    const dot = clamp(nx * feature.direction[0] + ny * feature.direction[1] + nz * feature.direction[2], -1, 1);
    const chord = Math.sqrt(Math.max(0, 2 - 2 * dot));
    const t = chord / feature.chordRadius;
    if (t > 1.55) continue;
    const floor = t < 1 ? (1 - t * t) ** 2 : 0;
    const edge = Math.exp(-(((t - 1) / 0.18) ** 2));
    radialOffset += -feature.floorDepth * floor + feature.rimHeight * edge;
    hollow01 = Math.max(hollow01, floor * 0.85);
    rim01 = Math.max(rim01, edge * 0.75);
  }

  // Broad dust provinces and a fine grain use coherent seed-phase functions.
  const fine = cometNucleusMaterialNoiseV1(nx * 5.2, ny * 5.2, nz * 5.2, terrain.seed, 41);
  const micro = cometNucleusMaterialNoiseV1(nx * 13.0, ny * 13.0, nz * 13.0, terrain.seed, 67);
  const regional = cometNucleusMaterialNoiseV1(nx * 1.6, ny * 1.6, nz * 1.6, terrain.seed, 89);
  const granularNoise = fine * 0.62 + micro * 0.38;
  radialOffset += (fine * 0.007 + micro * 0.0025) *
    (0.70 + 0.50 * terrain.irregularity01);
  return {
    radialOffset: clamp(radialOffset, -0.16, 0.06),
    hollow01, rim01,
    smoothDust01: clamp(0.5 + regional * 0.55 - hollow01 * 0.20, 0, 1),
    granularNoise,
  };
}

/** Reusable deterministic color provinces, independent of geometry LOD. */
export function cometNucleusMaterialNoiseV1(
  x: number, y: number, z: number, seed: number, salt: number,
): number {
  const a = cometNucleusSeedUnitV1(seed, salt + 1) * TAU;
  const b = cometNucleusSeedUnitV1(seed, salt + 2) * TAU;
  const c = cometNucleusSeedUnitV1(seed, salt + 3) * TAU;
  return clamp((
    Math.sin(x * 3.79 + y * 1.33 - z * 2.53 + a) +
    Math.sin(-x * 2.27 + y * 3.71 + z * 1.73 + b) +
    Math.cos(x * 1.91 - y * 2.35 + z * 4.51 + c)
  ) / 3, -1, 1);
}
