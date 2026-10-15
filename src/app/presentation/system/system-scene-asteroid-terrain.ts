/**
 * A.1–A.4 asteroid terrain: visual-only, stateless and repeatable.
 * No physical body property, orbital epoch, PRNG or persisted data is modified.
 * All directions are unit vectors; radial offsets are fractions of body radius.
 */
import type { SystemSceneAsteroidPresentationV1 } from './system-scene-asteroid-presentation';

export interface AsteroidTerrainFeatureV1 {
  readonly direction: readonly [number, number, number];
  readonly angularRadius: number;
  readonly depth: number;
  readonly rim: number;
  readonly ejecta: number;
}

export interface AsteroidFractureV1 {
  readonly center: readonly [number, number, number];
  readonly tangent: readonly [number, number, number];
  readonly perpendicular: readonly [number, number, number];
  readonly halfLength: number;
  readonly width: number;
  readonly depth: number;
}

export interface AsteroidTerrainV1 {
  readonly sizeRoundness01: number;
  readonly craters: readonly AsteroidTerrainFeatureV1[];
  readonly fractures: readonly AsteroidFractureV1[];
}

const TWO_PI = Math.PI * 2;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

export function asteroidVisualSeedUnitV1(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt, 0x9e3779b9)) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 0x100000000;
}

function direction(seed: number, salt: number): readonly [number, number, number] {
  const z = 2 * asteroidVisualSeedUnitV1(seed, salt) - 1;
  const azimuth = TWO_PI * asteroidVisualSeedUnitV1(seed, salt + 1);
  const radial = Math.sqrt(Math.max(0, 1 - z * z));
  return [radial * Math.cos(azimuth), radial * Math.sin(azimuth), z];
}

function normalizedCross(a: readonly number[], b: readonly number[]): readonly [number, number, number] {
  const x = a[1]! * b[2]! - a[2]! * b[1]!;
  const y = a[2]! * b[0]! - a[0]! * b[2]!;
  const z = a[0]! * b[1]! - a[1]! * b[0]!;
  const size = Math.max(1e-9, Math.hypot(x, y, z));
  return [x / size, y / size, z / size];
}

/** Transition between small angular/rubble forms and gravitationally rounded large objects.
 * The transition is deliberately smooth, not a strict hydrostatic-equilibrium claim. */
export function asteroidSizeRoundnessV1(diameterKilometers: number): number {
  if (!Number.isFinite(diameterKilometers) || diameterKilometers <= 0) return 0;
  const t = clamp((Math.log10(diameterKilometers) - Math.log10(12)) /
    (Math.log10(520) - Math.log10(12)), 0, 1);
  return t * t * (3 - 2 * t);
}

export function buildAsteroidTerrainV1(p: SystemSceneAsteroidPresentationV1, salt: number): AsteroidTerrainV1 {
  const seed = p.shapeSeedUint32 ^ Math.imul(salt + 1, 0x45d9f3b);
  const sizeRoundness01 = asteroidSizeRoundnessV1(p.sourceDiameterKilometers);
  const craterCount = 21 + Math.round(12 * asteroidVisualSeedUnitV1(seed, 200));
  const craters: AsteroidTerrainFeatureV1[] = [];
  for (let i = 0; i < craterCount; i++) {
    const s = 1000 + i * 19;
    const isBasin = i < 3;
    const radius = isBasin
      ? 0.27 + 0.17 * asteroidVisualSeedUnitV1(seed, s + 2)
      : 0.075 + 0.19 * Math.pow(asteroidVisualSeedUnitV1(seed, s + 2), 1.7);
    const depth = radius * (isBasin ? 0.080 : 0.11) *
      (0.56 + 0.65 * asteroidVisualSeedUnitV1(seed, s + 3));
    craters.push(Object.freeze({
      direction: direction(seed, s),
      angularRadius: radius,
      depth,
      rim: depth * (0.17 + 0.14 * asteroidVisualSeedUnitV1(seed, s + 4)),
      ejecta: asteroidVisualSeedUnitV1(seed, s + 5),
    }));
  }
  const fractureCount = p.structureRegime === 'FRACTURED' ? 7 :
    p.structureRegime === 'RUBBLE_PILE' ? 4 : 2;
  const fractures: AsteroidFractureV1[] = [];
  for (let i = 0; i < fractureCount; i++) {
    const s = 4000 + i * 17;
    const center = direction(seed, s);
    const pole: readonly [number, number, number] = Math.abs(center[2]) > 0.85 ? [0, 1, 0] : [0, 0, 1];
    const t0 = normalizedCross(center, pole);
    const t1 = normalizedCross(center, t0);
    const a = TWO_PI * asteroidVisualSeedUnitV1(seed, s + 3);
    const tangent: readonly [number, number, number] = [
      Math.cos(a) * t0[0] + Math.sin(a) * t1[0],
      Math.cos(a) * t0[1] + Math.sin(a) * t1[1],
      Math.cos(a) * t0[2] + Math.sin(a) * t1[2],
    ];
    fractures.push(Object.freeze({
      center, tangent, perpendicular: normalizedCross(center, tangent),
      halfLength: 0.24 + 0.38 * asteroidVisualSeedUnitV1(seed, s + 4),
      width: 0.022 + 0.025 * asteroidVisualSeedUnitV1(seed, s + 5),
      depth: 0.007 + 0.012 * asteroidVisualSeedUnitV1(seed, s + 6),
    }));
  }
  return Object.freeze({
    sizeRoundness01,
    craters: Object.freeze(craters),
    fractures: Object.freeze(fractures),
  });
}

export interface AsteroidTerrainSampleV1 {
  readonly radialOffset: number;
  readonly impactEjecta01: number;
  readonly craterFloor01: number;
  readonly fracture01: number;
}

/** Angular crater cross section: depressed floor, raised rim, subdued ejecta apron. */
export function sampleAsteroidTerrainV1(
  nx: number, ny: number, nz: number,
  terrain: AsteroidTerrainV1,
): AsteroidTerrainSampleV1 {
  let radialOffset = 0;
  let impactEjecta01 = 0;
  let craterFloor01 = 0;
  let fracture01 = 0;
  for (const crater of terrain.craters) {
    const dot = clamp(nx * crater.direction[0] + ny * crater.direction[1] + nz * crater.direction[2], -1, 1);
    // chord length approximates angular distance closely for these small features.
    const d = Math.sqrt(Math.max(0, 2 - 2 * dot));
    const t = d / crater.angularRadius;
    if (t >= 1.7) continue;
    const floor = t < 1 ? (1 - t * t) ** 2 : 0;
    const rim = Math.exp(-(((t - 1) / 0.15) ** 2));
    radialOffset += -crater.depth * floor + crater.rim * rim;
    craterFloor01 = Math.max(craterFloor01, floor);
    const ejecta = Math.exp(-(((t - 1.13) / 0.37) ** 2)) * (0.42 + crater.ejecta * 0.58);
    impactEjecta01 = Math.max(impactEjecta01, ejecta);
  }
  for (const fracture of terrain.fractures) {
    const c = nx * fracture.center[0] + ny * fracture.center[1] + nz * fracture.center[2];
    const along = Math.atan2(
      nx * fracture.tangent[0] + ny * fracture.tangent[1] + nz * fracture.tangent[2], c,
    );
    if (Math.abs(along) > fracture.halfLength * 1.18 || c <= 0) continue;
    const across = Math.asin(clamp(
      nx * fracture.perpendicular[0] + ny * fracture.perpendicular[1] + nz * fracture.perpendicular[2], -1, 1,
    ));
    const line = Math.exp(-((across / fracture.width) ** 2) * 1.8);
    const taper = clamp((fracture.halfLength - Math.abs(along)) / 0.09, 0, 1);
    const value = line * taper;
    radialOffset -= fracture.depth * value;
    fracture01 = Math.max(fracture01, value);
  }
  return { radialOffset: clamp(radialOffset, -0.065, 0.025), impactEjecta01, craterFloor01, fracture01 };
}

/** Continuous, bounded mineral noise; fully deterministic from exact asteroid identity. */
export function asteroidMineralNoiseV1(nx: number, ny: number, nz: number, seed: number, salt: number): number {
  const phase = (s: number) => asteroidVisualSeedUnitV1(seed, salt + s) * TWO_PI;
  const a = Math.sin(nx * 4.12 + ny * 3.41 - nz * 1.97 + phase(2));
  const b = Math.cos(nx * 8.33 - ny * 5.71 + nz * 3.15 + phase(3));
  const c = Math.sin(nx * 17.61 + ny * 12.8 + nz * 9.12 + phase(4));
  const d = Math.cos(nx * 39.18 - ny * 24.72 + nz * 30.1 + phase(5));
  return clamp(a * 0.43 + b * 0.30 + c * 0.18 + d * 0.09, -1, 1);
}
