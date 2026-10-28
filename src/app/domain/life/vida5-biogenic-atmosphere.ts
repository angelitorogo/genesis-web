/** VIDA.5 — snapshot of the post-biological atmospheric scenario; never replace PRE-33 physical source. */
import type { Vida4Group } from './procedural-ecology-vida4';
/**
 * Domain-owned atmospheric gas fraction, structurally compatible with
 * PlanetScientificGasSource from the planetary simulation layer.
 * The domain must never import a type from simulation.
 */
export interface Vida5AtmosphericGasSource {
  readonly gas: string;
  readonly moleFraction01: number;
}

export const VIDA5_ATMOSPHERE_REVISION = 'VIDA.5/biogenic-atmosphere/v1' as const;
export type Vida5AtmosphereStatus =
  | 'NO_PHOTOSYNTHETIC_VEGETATION'
  | 'APPLIED'
  | 'UNRESOLVED_PHYSICAL_BUDGET';

export interface Vida5AtmosphericFeedback {
  readonly revision: typeof VIDA5_ATMOSPHERE_REVISION;
  readonly status: Vida5AtmosphereStatus;
  /** Provenance; never interpret as direct detection of life. */
  readonly ecologyDigest: string;
  readonly sourcePressurePascal: number | null;
  readonly pressurePascal: number | null;
  readonly sourceOxygenFraction01: number | null;
  readonly oxygenFraction01: number | null;
  readonly oxygenPartialPressurePascal: number | null;
  readonly aerobicAdvanced: boolean;
  /** VIDA.5 effective hierarchy; never overwrite VIDA.4a's potential snapshot. */
  readonly effectiveGroups: readonly Vida4Group[];
  readonly stablePhotosyntheticVegetation: boolean;
  readonly advancedAerobicFaunaSupported: boolean;
  readonly nativeCivilizationAtmosphereReady: boolean;
  readonly gasComposition: readonly Vida5AtmosphericGasSource[];
  readonly meanMolarMassGramsPerMole: number | null;
  readonly referenceDensityKilogramsPerCubicMeter: number | null;
  readonly greenhouseTrappingFraction01: number | null;
  readonly climateDeltaKelvin: number;
  readonly meanSurfaceTemperatureKelvin: number | null;
  /** Nonzero atmospheric mass adjustment requires a modeled reservoir/exchange scenario. */
  readonly pressureBalanceFactor: number | null;
  readonly digest: string;
}
