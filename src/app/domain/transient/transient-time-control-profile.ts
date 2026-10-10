/**
 * 29.12 — Explicit temporal update contract. All timestamps below are relative
 * SIMULATION coordinates, never a JavaScript Date, UTC epoch or observed event.
 * Wall-clock sampling is opt-in and supplied by a caller; the simulation layer
 * must not inspect the OS clock or schedule timers.
 */
import type {
  TransientFollowUpAssessment,
  TransientModelMilestone,
  TransientFollowUpClassification,
} from './transient-follow-up-profile';

export type TransientUpdateClock =
  | { readonly mode: 'SIMULATED'; readonly simulationSeconds: number }
  | {
      readonly mode: 'EXPLICIT_WALL_SAMPLE';
      readonly expresslyAuthorized: true;
      readonly anchorSimulationSeconds: number;
      readonly anchorEpochMilliseconds: number;
      readonly sampledEpochMilliseconds: number;
      readonly simulationSecondsPerWallSecond: number;
    };

/** A schedule is a scientific projection, not a new Ground Truth event. */
export interface TransientScheduledProjection {
  readonly id: string;
  readonly assessment: TransientFollowUpAssessment;
  /** Absolute coordinate of modeled source onset; only for intrinsic events. */
  readonly sourceOnsetSimulationSeconds: number | null;
  /** Explicit due time for a canonical FUTURE prediction, never its detection. */
  readonly dueSimulationSeconds: number | null;
}

export type TransientProjectedState =
  | 'MODEL_NOT_STARTED' | 'MODEL_IN_PROGRESS' | 'MODEL_END_REFERENCE'
  | 'FUTURE_PENDING' | 'FUTURE_DUE_UNCONFIRMED'
  | 'NO_INDIVIDUAL_EVENT' | 'OBSERVATION_ONLY_UNALIGNED';

export interface TransientTemporalProjection {
  readonly id: string;
  readonly family: TransientFollowUpAssessment['family'];
  readonly classification: TransientFollowUpClassification;
  readonly state: TransientProjectedState;
  readonly simulationSeconds: number;
  readonly sourceAgeSeconds: number | null;
  readonly activeMilestone: TransientModelMilestone | null;
  readonly crossedMilestoneIds: readonly string[];
  /** The original observer evidence stays in its own reference frame. */
  readonly observationCount: number;
  readonly observationTimesReinterpreted: 0;
  readonly observedEpoch: null;
  readonly inventedEventCount: 0;
}

export interface TransientTemporalSnapshot {
  readonly clockMode: TransientUpdateClock['mode'];
  readonly simulationSeconds: number;
  readonly entries: readonly TransientTemporalProjection[];
  readonly persistedEvents: 0;
  readonly mutatedBodies: 0;
  readonly newObservations: 0;
}
