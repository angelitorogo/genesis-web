/** VIDA.5b — fixed advanced ecological maturation and VIDA.7 future targets.
 * This file freezes parameters. It does NOT generate intelligent species or civilizations.
 */
import type { Vida4Group } from './procedural-ecology-vida4';
import type { Vida5AtmosphericFeedback } from './vida5-biogenic-atmosphere';
export const VIDA5B_MATURATION_REVISION = 'VIDA.5b/ecological-maturation/v1' as const;
export const VIDA7_FUTURE_INTELLIGENCE_RATE = 0.30 as const;
export const VIDA7_FUTURE_CIVILIZATION_RATE = 0.65 as const;
export const VIDA7_FUTURE_CIVILIZATION_LEVEL_RATES = Object.freeze({
  PRIMITIVE: 0.65, ADVANCED: 0.30, ULTRA_ADVANCED: 0.05,
} as const);

export interface Vida5bMaturedBiosphere {
  readonly revision: typeof VIDA5B_MATURATION_REVISION;
  readonly sourceCouplingRevision: 'VIDA.5a/ecology-atmosphere/v1';
  readonly sourceCouplingDigest: string;
  /** The initial VIDA.5a ecology and atmospheric scenario are not mutated. */
  readonly originalEffectiveGroups: readonly Vida4Group[];
  readonly effectiveGroups: readonly Vida4Group[];
  readonly maturationApplied: boolean;
  readonly maturationReason: 'ADVANCED_AEROBIC_SUCCESSION' | 'PRESERVED_PREVIOUS_RESULT';
  readonly nativeCivilizationPrerequisitesReady: boolean;
  readonly atmosphericFeedback: Vida5AtmosphericFeedback;
  /** Projections, never realized civilizations. */
  readonly futureIntelligenceProbability: typeof VIDA7_FUTURE_INTELLIGENCE_RATE;
  readonly futureCivilizationConditionalProbability: typeof VIDA7_FUTURE_CIVILIZATION_RATE;
  readonly digest: string;
}
