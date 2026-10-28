/** VIDA.4 — private, deterministic, cumulative ecosystem contract. */
import type { Vida3BodyIdentity, Vida3MicrobialSnapshot } from './procedural-microbial-vida3';

export const VIDA4_MODEL_REVISION = 'VIDA.4/ecology/v2-advanced-calibration' as const;
export const VIDA4_COMPLEX_LIFE_RATE = 0.30 as const;
// Deliberately unchanged from V1: the existing 30% decision and level-roll
// identity must remain stable. VIDA.4a changes thresholds, not random draws.
export const VIDA4_ROLL_NAMESPACE = 'VIDA.4/ecology/v1' as const;
/** Conditional cumulative-level thresholds for the COMPLEX + SURFACE_OPEN subset.
 * A full ecosystem requires an evolution roll >= 0.67; no fixed per-galaxy quota.
 * Earlier stages remain present in every more advanced biosphere. */
export const VIDA4A_ADVANCED_THRESHOLDS = Object.freeze([
  0.08, 0.22, 0.34, 0.46, 0.56, 0.67,
] as const);
/** Future VIDA.7 targets only. VIDA.4a DOES NOT generate intelligence/civilizations. */
export const VIDA4A_FUTURE_INTELLIGENCE_RATE_TARGET = 0.20 as const;
export const VIDA4A_FUTURE_CIVILIZATION_RATE_TARGET = 0.60 as const;
export const VIDA4_GROUPS = Object.freeze([
  'MICROORGANISMS', 'FUNGI', 'PLANTS_TREES', 'INSECTS',
  'REPTILES', 'BIRDS', 'MAMMALS', 'HUMANOIDS',
] as const);
export type Vida4Group = typeof VIDA4_GROUPS[number];
export type Vida4CapReason = 'NO_LIFE' | 'MICROBIAL_ONLY_HABITAT' |
  'NO_OPEN_SURFACE' | 'OPEN_SURFACE' | 'COMPLEX_ROLL_NOT_SELECTED';

export interface Vida4EcologySnapshot {
  readonly revision: typeof VIDA4_MODEL_REVISION;
  readonly identity: Vida3BodyIdentity;
  readonly bodyStorageKey: string;
  readonly microbialRevision: Vida3MicrobialSnapshot['revision'];
  readonly microbialDigest: string;
  readonly biosphereId: string | null;
  readonly habitat: Vida3MicrobialSnapshot['habitat'];
  readonly lifePresent: boolean;
  /** A 30% independent deterministic roll, even where a habitat limits expression. */
  readonly complexRollSelected: boolean;
  readonly complexLifePresent: boolean;
  readonly maximumGroup: Vida4Group | null;
  /** Always an exact prefix of VIDA4_GROUPS. */
  readonly groups: readonly Vida4Group[];
  readonly capReason: Vida4CapReason;
  /** Future VIDA.7 prerequisite; VIDA.4 never creates civilizations. */
  /** VIDA.5 must reconcile oxygenic vegetation with atmospheric O2 before animal/civilization display. */
  readonly atmosphericFeedbackPending: boolean;
  readonly nativeCivilizationEcosystemReady: boolean;
  readonly nativeCivilizationPresent: false;
  readonly digest: string;
}
