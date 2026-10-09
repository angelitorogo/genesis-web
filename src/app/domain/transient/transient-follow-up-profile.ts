/**
 * 29.10: read-only temporal/classification projection. Neither an observation
 * nor a model milestone is a new persisted event or a wall-clock timestamp.
 */
export const TransientFollowUpFamily = Object.freeze({
  SUPERNOVA: 'SUPERNOVA', NOVA: 'NOVA', KILONOVA: 'KILONOVA',
  COMPACT_MERGER: 'COMPACT_MERGER', GRAVITATIONAL_WAVE: 'GRAVITATIONAL_WAVE',
  TIDAL_DISRUPTION: 'TIDAL_DISRUPTION', GAMMA_RAY_BURST: 'GAMMA_RAY_BURST',
  FAST_RADIO_BURST: 'FAST_RADIO_BURST', STELLAR_FLARE: 'STELLAR_FLARE',
  UNKNOWN: 'UNKNOWN',
} as const);
export type TransientFollowUpFamily = typeof TransientFollowUpFamily[keyof typeof TransientFollowUpFamily];

export const TransientFollowUpOrigin = Object.freeze({
  CANONICAL_FUTURE: 'CANONICAL_FUTURE',
  INTRINSIC_EXPLICIT: 'INTRINSIC_EXPLICIT',
  PROGENITOR_ONLY: 'PROGENITOR_ONLY',
  STATISTICAL_ONLY: 'STATISTICAL_ONLY',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  OBSERVATIONAL_CANDIDATE: 'OBSERVATIONAL_CANDIDATE',
} as const);
export type TransientFollowUpOrigin = typeof TransientFollowUpOrigin[keyof typeof TransientFollowUpOrigin];

export const TransientTemporalPhase = Object.freeze({
  ONSET: 'ONSET', RISE: 'RISE', PEAK: 'PEAK',
  TRANSITION: 'TRANSITION', DECLINE: 'DECLINE', END: 'END',
  REFERENCE: 'REFERENCE',
} as const);
export type TransientTemporalPhase = typeof TransientTemporalPhase[keyof typeof TransientTemporalPhase];

export const TransientObservationSignature = Object.freeze({
  OPTICAL_BRIGHTENING: 'OPTICAL_BRIGHTENING',
  SUPERNOVA_SPECTRUM: 'SUPERNOVA_SPECTRUM',
  NOVA_SPECTRUM: 'NOVA_SPECTRUM',
  RED_BLUE_KILONOVA: 'RED_BLUE_KILONOVA',
  GW_CHIRP: 'GW_CHIRP',
  GAMMA_PROMPT: 'GAMMA_PROMPT',
  RADIO_MILLISECOND_PULSE: 'RADIO_MILLISECOND_PULSE',
  TIDAL_SPECTRAL_SIGNATURE: 'TIDAL_SPECTRAL_SIGNATURE',
  STELLAR_MAGNETIC_FLARE: 'STELLAR_MAGNETIC_FLARE',
} as const);
export type TransientObservationSignature = typeof TransientObservationSignature[keyof typeof TransientObservationSignature];

/** Seconds from the SOURCE's modeled event origin; never an observed epoch. */
export interface TransientModelMilestone {
  readonly id: string;
  readonly timeAfterOnsetSeconds: number;
  readonly label: string;
  readonly phase: TransientTemporalPhase;
}

/** Seconds from an explicitly defined OBSERVER reference. Not source-frame time. */
export interface TransientExplicitObservation {
  readonly id: string;
  readonly timeAfterObserverReferenceSeconds: number;
  readonly label: string;
  readonly signature: TransientObservationSignature;
}

export interface TransientFollowUpInput {
  readonly id: string;
  readonly family: TransientFollowUpFamily;
  readonly origin: TransientFollowUpOrigin;
  readonly modelMilestones: readonly TransientModelMilestone[];
  readonly observations: readonly TransientExplicitObservation[];
  /** Only provided by a real canonical FUTURE merger, never an observation. */
  readonly forecastDelayYears: number | null;
}

export const TransientFollowUpClassification = Object.freeze({
  CANONICAL_FUTURE: 'CANONICAL_FUTURE',
  INTRINSIC_ONLY: 'INTRINSIC_ONLY',
  INTRINSIC_WITH_OBSERVATIONS: 'INTRINSIC_WITH_OBSERVATIONS',
  PROGENITOR_ONLY: 'PROGENITOR_ONLY',
  STATISTICAL_ONLY: 'STATISTICAL_ONLY',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  OBSERVATION_COMPATIBLE: 'OBSERVATION_COMPATIBLE',
  OBSERVATION_AMBIGUOUS: 'OBSERVATION_AMBIGUOUS',
} as const);
export type TransientFollowUpClassification = typeof TransientFollowUpClassification[keyof typeof TransientFollowUpClassification];

export interface TransientFollowUpAssessment {
  readonly id: string;
  readonly family: TransientFollowUpFamily;
  readonly classification: TransientFollowUpClassification;
  readonly modelMilestones: readonly TransientModelMilestone[];
  readonly observations: readonly TransientExplicitObservation[];
  /** Candidate channels only. Never confirmed progenitors or new Ground Truth. */
  readonly compatibleFamilies: readonly TransientFollowUpFamily[];
  readonly forecastDelayYears: number | null;
  readonly observedEpoch: null;
  readonly luminosityDistanceParsec: null;
  readonly observerToSourceTimeConversion: null;
  readonly inventedEventCount: 0;
}
