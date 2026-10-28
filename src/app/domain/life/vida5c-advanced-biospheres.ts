/** VIDA.5c — biologically favored, physically gated surface ecosystem.
 * Revisioned private Ground Truth; VIDA.3b and VIDA.4a remain historic, immutable.
 * No native species intelligence or civilizations are generated in this stage.
 */
import type { Vida4Group } from './procedural-ecology-vida4';
import type { Vida5AtmosphericFeedback } from './vida5-biogenic-atmosphere';
export const VIDA5C_REVISION = 'VIDA.5c/advanced-biosphere/v1' as const;
export const VIDA5C_ROLL_NAMESPACE = 'VIDA.5c/advanced-biosphere/v1' as const;
export const VIDA5C_FAVORED_MICROBIAL_PROBABILITY = 0.98 as const;
export const VIDA5C_FAVORED_FULL_ECOSYSTEM_PROBABILITY = 0.98 as const;
/** Supersedes the previous 30%/65% projection specifically for future VIDA.7. */
export const VIDA7_FUTURE_INTELLIGENCE_RATE_V5C = 0.65 as const;
export const VIDA7_FUTURE_CIVILIZATION_RATE_V5C = 0.60 as const;
export const VIDA7_FUTURE_TECHNOLOGY_DISTRIBUTION_V5C = Object.freeze({
 PRIMITIVE: 0.60, ADVANCED: 0.30, ULTRA_ADVANCED: 0.10,
} as const);
export interface Vida5cAdvancedBiosphere {
  readonly revision: typeof VIDA5C_REVISION;
  readonly identity: { readonly universeSeed:string; readonly generatorVersionCode:number; readonly galaxyIndex:string };
  readonly bodyStorageKey:string;
  readonly originalMicrobialDigest:string;
  readonly originalEcologyDigest:string;
  readonly originalMaturationDigest:string;
  readonly originalMicrobialLifePresent:boolean;
  readonly effectiveMicrobialLifePresent:boolean;
  readonly newlyEstablishedMicrobialLife:boolean;
  readonly originalEffectiveGroups:readonly Vida4Group[];
  readonly effectiveGroups:readonly Vida4Group[];
  readonly promotedFromPhysicalEvidence:boolean;
  readonly advancedAtmosphereSuitable:boolean;
  readonly atmosphericFeedback:Vida5AtmosphericFeedback;
  readonly nativeCivilizationPrerequisitesReady:boolean;
  /** Selection probabilities for VIDA.7, not generated civilizations. */
  readonly futureIntelligenceProbability:typeof VIDA7_FUTURE_INTELLIGENCE_RATE_V5C;
  readonly futureCivilizationConditionalProbability:typeof VIDA7_FUTURE_CIVILIZATION_RATE_V5C;
  readonly digest:string;
}
