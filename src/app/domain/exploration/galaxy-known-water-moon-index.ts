import { type MoonLocator, type SystemLocator } from '../generation/procedural-locator';
import { MoonWaterRegime } from '../planetary/moon-water-regime';
import { type StellarSystemMultiplicityName } from '../stellar/stellar-system-multiplicity';

/**
 * Point-26.1c lunar public scientific criteria.
 *
 * These predicates are shared with 26.1b telemetry so the galaxy counters and
 * their navigable lunar catalogue cannot drift. The surface metric is a
 * potential index, NOT measured fractional surface coverage.
 */
export const GALAXY_KNOWN_WATER_MOON_MIN_SURFACE_LIQUID_POTENTIAL_01 = 0.40;

export type GalaxyKnownWaterMoonOrbitClass =
  | 'SINGLE_HOST'
  | 'S_TYPE'
  | 'P_TYPE';

export interface GalaxyKnownWaterMoon {
  readonly locator: MoonLocator;
  readonly designation: string;
  readonly hostPlanetDesignation: string;
  readonly hostLabel: 'A' | 'B' | 'C' | 'AB';
  readonly orbitClass: GalaxyKnownWaterMoonOrbitClass;
  readonly surfaceLiquidWaterPotentialIndex01: number;
  readonly subsurfaceOceanPotentialIndex01: number;
  readonly waterRegime: MoonWaterRegime;
  readonly surfaceLiquidPotentialAtLeast40Percent: boolean;
  readonly subsurfaceOceanEvidence: boolean;
}

export interface GalaxyKnownWaterMoonSystem {
  readonly locator: SystemLocator;
  readonly designation: string;
  readonly multiplicity: StellarSystemMultiplicityName;
  readonly moons: readonly GalaxyKnownWaterMoon[];
}

export interface GalaxyKnownWaterMoonIndex {
  readonly galaxyIndex: bigint;
  readonly systems: readonly GalaxyKnownWaterMoonSystem[];
  readonly totalUniqueMoons: bigint;
  readonly surfaceLiquidPotentialMoonCount: bigint;
  readonly subsurfaceOceanEvidenceMoonCount: bigint;
}

export function isGalaxyKnownWaterMoonSurfaceLiquidPotential(
  value: number,
): boolean {
  return Number.isFinite(value) &&
    value >= GALAXY_KNOWN_WATER_MOON_MIN_SURFACE_LIQUID_POTENTIAL_01;
}

export function hasGalaxyKnownWaterMoonSubsurfaceOceanEvidence(
  waterRegime: MoonWaterRegime,
): boolean {
  return waterRegime === MoonWaterRegime.SUBSURFACE_OCEAN ||
    waterRegime === MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN ||
    waterRegime === MoonWaterRegime.MIXED;
}
