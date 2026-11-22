import type { SystemSceneMoonPresentationV1 } from './system-scene-moon-presentation';

/**
 * LUNSURF.2 — hypothesis-aware optical facies, NEVER evidence of observed water.
 * Neither the source potential index nor the visual presentation coverage is
 * a confirmed liquid-water observation. Confirmed water would require a future
 * explicit evidence contract; this module deliberately does not fabricate it.
 *
 * Only colour and roughness are adjusted. Height, crater positions, scientific
 * masks, water/ice coverage, seed and render meshes remain unchanged.
 */
export type MoonHydricVisualStateLUNSURF2 =
  | 'NONE'
  | 'POTENTIAL_ALTERED_MINERAL'
  | 'POTENTIAL_COLD_DEPOSITS'
  | 'SUPPORTED_LIQUID_SCENARIO';

export interface MoonHydricInterpretationLUNSURF2 {
  readonly state: MoonHydricVisualStateLUNSURF2;
  /** A visual modulation parameter, NOT a fractional water coverage. */
  readonly intensity01: number;
}

export interface MoonHydricSampleLUNSURF2 {
  /** This is an RGB *mineral material* tint, never an ocean colour. */
  readonly pigment: { readonly r: number; readonly g: number; readonly b: number };
  readonly blend01: number;
  readonly brightnessDelta: number;
  readonly roughnessDelta: number;
}

interface UnitDirection { readonly x: number; readonly y: number; readonly z: number }
interface LunarTerrain {
  readonly terrain01: number;
  readonly crater01: number;
  readonly scarp01: number;
  readonly renewed01: number;
  readonly province01: number;
}

/** Interpretation is derived solely from the existing, immutable projection. */
export function interpretMoonHydricVisualLUNSURF2(
  moon: SystemSceneMoonPresentationV1,
): MoonHydricInterpretationLUNSURF2 {
  // The pre-existing D.3 surface-water presentation remains authoritative:
  // this scenario is pressure/temperature-supported but NOT an observation.
  if (moon.presentationLiquidCoverage01 > 0) {
    return { state: 'SUPPORTED_LIQUID_SCENARIO', intensity01: 0 };
  }
  const potential = moon.sourceSurfaceLiquidWaterPotentialIndex01;
  const inventory = moon.sourceWaterInventoryIndex01;
  const temperature = moon.sourceEstimatedSurfaceTemperatureKelvin;
  // Do not turn tiny potential/inventory values into a visible wet surface.
  if (potential < 0.62 || inventory < 0.30 || temperature > 365) {
    return { state: 'NONE', intensity01: 0 };
  }
  const weight = clamp01(((potential - 0.62) / 0.38) * 0.72 + 0.28 * inventory);
  if (temperature <= 273.15 && moon.sourceInferredIceRichnessIndex01 >= 0.32) {
    const thermal = clamp01((273.15 - temperature) / 65);
    return { state: 'POTENTIAL_COLD_DEPOSITS',
      intensity01: weight * (0.25 + 0.75 * thermal) };
  }
  // Unresolved pressure at 311.3 K, for instance, may indicate weathered
  // silicates/volatile-bearing regolith but NEVER stable surface liquid.
  return { state: 'POTENTIAL_ALTERED_MINERAL',
    intensity01: weight * (temperature > 338 ? 0.45 : 1) };
}

/**
 * Cartesian correlated material fields (no longitude seam or ring centres).
 * Existing topography supplies basins/scarps; this function does not add
 * impact craters, oceans, ice thickness, scientific results or geometry.
 */
export function sampleMoonHydricFaciesLUNSURF2(
  direction: UnitDirection,
  moon: SystemSceneMoonPresentationV1,
  terrain: LunarTerrain,
  interpretation: MoonHydricInterpretationLUNSURF2,
): MoonHydricSampleLUNSURF2 | null {
  if (interpretation.state === 'NONE' ||
      interpretation.state === 'SUPPORTED_LIQUID_SCENARIO' ||
      interpretation.intensity01 <= 0) return null;
  const seed = moon.presentationSeedUint32;
  const broad = noise3(direction.x * 5.8 + 11.3,
    direction.y * 5.8 - 3.2, direction.z * 5.8 + 2.6, seed ^ 0x72a018f3);
  const regional = noise3(direction.x * 13.6 - 7.9,
    direction.y * 13.6 + 8.1, direction.z * 13.6, seed ^ 0x1ecf6b52);
  const grain = noise3(direction.x * 40.8,
    direction.y * 40.8 - 4.8, direction.z * 40.8 + 8.2, seed ^ 0x5b8ad3e1);
  const basins = clamp01(0.52 + (0.52 - terrain.terrain01) * 1.25 +
    Math.max(0, terrain.crater01) * 0.56);
  const field = 0.48 * broad + 0.28 * regional + 0.15 * basins +
    0.09 * terrain.province01;
  const coverageField = smoothstep(0.46, 0.69, field);
  const sediment = 0.66 + 0.34 * (0.44 * grain + 0.56 * basins);
  const intensity = interpretation.intensity01;
  if (interpretation.state === 'POTENTIAL_COLD_DEPOSITS') {
    // Mean temperature is below freezing, yet this is not *confirmed* ice.
    // Prefer basins and higher latitudes, not a global white paint layer.
    const polar = smoothstep(0.30, 0.92, Math.abs(direction.y));
    const deposit = clamp01(coverageField * (0.60 + 0.40 * polar) *
      (0.55 + 0.45 * basins) * intensity);
    return {
      pigment: { r: 194, g: 199, b: 198 },
      blend01: Math.min(0.41, deposit * 0.39),
      brightnessDelta: deposit * 0.032,
      roughnessDelta: -deposit * 0.044,
    };
  }
  // For warm candidate moons (e.g. Tripher i IV: 311.3 K, no B pressure),
  // NO snow, no frost, no open water: only plausible mineral alterations.
  const alteration = coverageField * sediment * intensity *
    (0.70 + 0.30 * terrain.renewed01);
  const weathered = clamp01(alteration);
  return {
    pigment: {
      r: 189 + 17 * grain,
      g: 169 + 15 * grain,
      b: 147 + 12 * grain,
    },
    blend01: Math.min(0.56, weathered * 0.56),
    brightnessDelta: weathered * (0.030 - 0.030 * terrain.scarp01),
    roughnessDelta: weathered * (0.025 + 0.016 * terrain.scarp01),
  };
}

function noise3(x: number, y: number, z: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const a = lerp(hash(ix, iy, iz, seed), hash(ix + 1, iy, iz, seed), fx);
  const b = lerp(hash(ix, iy + 1, iz, seed), hash(ix + 1, iy + 1, iz, seed), fx);
  const c = lerp(hash(ix, iy, iz + 1, seed), hash(ix + 1, iy, iz + 1, seed), fx);
  const d = lerp(hash(ix, iy + 1, iz + 1, seed), hash(ix + 1, iy + 1, iz + 1, seed), fx);
  return lerp(lerp(a, b, fy), lerp(c, d, fy), fz);
}
function hash(x: number, y: number, z: number, seed: number): number {
  let n = (seed ^ Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^
    Math.imul(z, 0x9e3779b9)) >>> 0;
  n ^= n >>> 16; n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15; n = Math.imul(n, 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967295;
}
function fade(t: number): number { return t * t * (3 - 2 * t); }
function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }
function smoothstep(low: number, high: number, x: number): number {
  const t = clamp01((x - low) / (high - low));
  return t * t * (3 - 2 * t);
}
