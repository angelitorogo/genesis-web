/** VIDA.5a — biologically effective ecology coupled to the atmosphere (not observed life). */
import type { Vida4Group } from './procedural-ecology-vida4';
import type { Vida5AtmosphericFeedback } from './vida5-biogenic-atmosphere';

export const VIDA5A_COUPLING_REVISION = 'VIDA.5a/ecology-atmosphere/v1' as const;

/** Environmental conditional rates, NOT two separate opportunities for microbial life.
 * Applies only to a planet with an already existing surface microbial biosphere.
 * Expected surface complex fraction at a 20.9% stabilizable share:
 * 0.165*0.80+0.835*0.20 = 29.9% (no census-wide quota). */
export const VIDA5A_COMPLEX_RATE_ATMOSPHERE_READY = 0.80 as const;
export const VIDA5A_COMPLEX_RATE_ATMOSPHERE_UNRESOLVED = 0.20 as const;
/** Successive inclusive stages 3 to 8, conditioned on complexity and atmosphere. */
export const VIDA5A_SURFACE_LEVEL_THRESHOLDS = Object.freeze([
  0.045, 0.09, 0.13, 0.18, 0.24, 0.32,
] as const);

export type Vida5aCouplingStatus = 'NOT_SURFACE_BIOSPHERE' |
  'NO_COMPLEX_EVOLUTION' | 'ATMOSPHERE_LIMITED' |
  'STABLE_BIOSPHERE' | 'STABLE_ADVANCED_BIOSPHERE';

export interface Vida5aCoupledBiosphere {
  readonly revision: typeof VIDA5A_COUPLING_REVISION;
  readonly originalEcologyDigest: string;
  readonly originalEcologyGroups: readonly Vida4Group[];
  /** Physical atmospheric preflight, without changing the original PRE-33 scenario. */
  readonly photosyntheticAtmospherePlausible: boolean;
  readonly calibratedComplexSelected: boolean;
  /** Closed geochemical sinks for modest reactive volatiles; not a new PRE-33 inventory. */
  readonly reactiveGasBurialFraction01: number;
  readonly conditionalComplexProbability: number;
  readonly effectiveGroups: readonly Vida4Group[];
  readonly nativeCivilizationPrerequisitesReady: boolean;
  readonly status: Vida5aCouplingStatus;
  readonly atmosphericFeedback: Vida5AtmosphericFeedback;
  readonly digest: string;
}
