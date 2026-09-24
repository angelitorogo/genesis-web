import { type BodyLocator, type SystemLocator } from '../generation/procedural-locator';
import { type PlanetType } from '../planetary/planet-type';
import { type StellarSystemMultiplicityName } from '../stellar/stellar-system-multiplicity';

/**
 * Point-26.1c public scientific criterion. This threshold is intentionally
 * shared with 26.1b so the galaxy counter and its navigable index cannot drift.
 */
export const GALAXY_KNOWN_WATER_WORLD_MIN_SURFACE_LIQUID_WATER_FRACTION_01 = 0.20;

export type GalaxyKnownWaterWorldOrbitClass =
  | 'SINGLE_HOST'
  | 'S_TYPE'
  | 'P_TYPE';

export interface GalaxyKnownWaterWorld {
  readonly locator: BodyLocator;
  readonly designation: string;
  readonly planetType: PlanetType;
  readonly surfaceLiquidWaterCoverageFraction01: number;
  readonly hostLabel: 'A' | 'B' | 'C' | 'AB';
  readonly orbitClass: GalaxyKnownWaterWorldOrbitClass;
}

export interface GalaxyKnownWaterWorldSystem {
  readonly locator: SystemLocator;
  readonly designation: string;
  readonly multiplicity: StellarSystemMultiplicityName;
  readonly worlds: readonly GalaxyKnownWaterWorld[];
}

export interface GalaxyKnownWaterWorldIndex {
  readonly galaxyIndex: bigint;
  readonly systems: readonly GalaxyKnownWaterWorldSystem[];
  readonly totalWorlds: bigint;
}

export function isGalaxyKnownWaterWorldCoverage(
  value: number | null,
): value is number {
  return value !== null &&
    Number.isFinite(value) &&
    value >= GALAXY_KNOWN_WATER_WORLD_MIN_SURFACE_LIQUID_WATER_FRACTION_01;
}
