import { TransientTemporalPhase } from '../../domain/transient/transient-follow-up-profile';
import type {
  TransientScheduledProjection, TransientTemporalProjection,
  TransientTemporalSnapshot, TransientUpdateClock, TransientProjectedState,
} from '../../domain/transient/transient-time-control-profile';

const intrinsic = new Set(['INTRINSIC_ONLY', 'INTRINSIC_WITH_OBSERVATIONS']);
const observational = new Set(['OBSERVATION_COMPATIBLE', 'OBSERVATION_AMBIGUOUS']);

function nonnegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and nonnegative.`);
}
function positiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be finite and positive.`);
}

/**
 * Pure reducer: no Date.now, new Date, performance.now, timers, random source,
 * persistence, DOM, or mutable cached state. All clock data are input.
 */
export class TransientTimeControlEngine {
  private constructor() {}

  static timeAt(clock: TransientUpdateClock): number {
    if (clock.mode === 'SIMULATED') {
      nonnegativeFinite(clock.simulationSeconds, 'Simulation time');
      return clock.simulationSeconds;
    }
    if (clock.mode !== 'EXPLICIT_WALL_SAMPLE' || clock.expresslyAuthorized !== true) {
      throw new RangeError('Wall clock requires express authorization.');
    }
    nonnegativeFinite(clock.anchorSimulationSeconds, 'Wall anchor simulation time');
    nonnegativeFinite(clock.anchorEpochMilliseconds, 'Explicit wall anchor');
    nonnegativeFinite(clock.sampledEpochMilliseconds, 'Explicit wall sample');
    positiveFinite(clock.simulationSecondsPerWallSecond, 'Wall clock scale');
    if (clock.sampledEpochMilliseconds < clock.anchorEpochMilliseconds) {
      throw new RangeError('Wall clock sample cannot predate the explicit anchor.');
    }
    const value = clock.anchorSimulationSeconds +
      (clock.sampledEpochMilliseconds - clock.anchorEpochMilliseconds) / 1000 *
        clock.simulationSecondsPerWallSecond;
    nonnegativeFinite(value, 'Resolved simulation time');
    return value;
  }

  /** Advances by a declared simulation delta, regardless of elapsed browser time. */
  static advanceSimulation(clock: Extract<TransientUpdateClock, { mode: 'SIMULATED' }>, seconds: number): Extract<TransientUpdateClock, { mode: 'SIMULATED' }> {
    nonnegativeFinite(seconds, 'Simulation step');
    const simulationSeconds = this.timeAt(clock) + seconds;
    nonnegativeFinite(simulationSeconds, 'Advanced simulation time');
    return Object.freeze({ mode: 'SIMULATED' as const, simulationSeconds });
  }

  /** Explicit seek enables deterministic rewind/replay without writing history. */
  static seekSimulation(seconds: number): Extract<TransientUpdateClock, { mode: 'SIMULATED' }> {
    nonnegativeFinite(seconds, 'Simulation seek');
    return Object.freeze({ mode: 'SIMULATED' as const, simulationSeconds: seconds });
  }

  static update(clock: TransientUpdateClock, projections: readonly TransientScheduledProjection[]): TransientTemporalSnapshot {
    const simulationSeconds = this.timeAt(clock);
    if (!Array.isArray(projections)) throw new RangeError('Explicit event projection array required.');
    const seen = new Set<string>();
    const entries: TransientTemporalProjection[] = [];
    for (const projection of projections) {
      this.validateProjection(projection);
      if (seen.has(projection.id)) throw new RangeError('Duplicate temporal projection id.');
      seen.add(projection.id);
      entries.push(this.evaluate(projection, simulationSeconds));
    }
    // Neither incoming order nor repeated polling changes result ordering.
    entries.sort((a, b) => a.id.localeCompare(b.id));
    return Object.freeze({
      clockMode: clock.mode, simulationSeconds,
      entries: Object.freeze(entries),
      persistedEvents: 0 as const, mutatedBodies: 0 as const, newObservations: 0 as const,
    });
  }

  private static validateProjection(item: TransientScheduledProjection): void {
    if (!item || !item.id?.trim() || !item.assessment || !item.assessment.id?.trim()) {
      throw new RangeError('An explicit projection with a real source id is required.');
    }
    const cls = item.assessment.classification;
    if (intrinsic.has(cls)) {
      if (item.sourceOnsetSimulationSeconds === null || item.dueSimulationSeconds !== null) {
        throw new RangeError('Intrinsic events require a source onset, never a future due prediction.');
      }
      nonnegativeFinite(item.sourceOnsetSimulationSeconds, 'Source onset');
      if (!item.assessment.modelMilestones.length) throw new RangeError('Intrinsic event has no modeled phases.');
    } else if (cls === 'CANONICAL_FUTURE') {
      if (item.sourceOnsetSimulationSeconds !== null || item.dueSimulationSeconds === null) {
        throw new RangeError('A future event requires an explicit due coordinate, never completed onset.');
      }
      nonnegativeFinite(item.dueSimulationSeconds, 'Future due coordinate');
    } else if (item.sourceOnsetSimulationSeconds !== null || item.dueSimulationSeconds !== null) {
      throw new RangeError('Observation, statistics and progenitor-only records cannot acquire an event time.');
    }
    const unique = new Set<string>();
    for (const phase of item.assessment.modelMilestones) {
      if (!phase.id?.trim() || !Number.isFinite(phase.timeAfterOnsetSeconds) || phase.timeAfterOnsetSeconds < 0) {
        throw new RangeError('Invalid modeled temporal milestone.');
      }
      if (unique.has(phase.id)) throw new RangeError('Duplicate modeled temporal milestone.');
      unique.add(phase.id);
    }
  }

  private static evaluate(item: TransientScheduledProjection, now: number): TransientTemporalProjection {
    const assessment = item.assessment;
    let state: TransientProjectedState;
    let sourceAgeSeconds: number | null = null;
    let activeMilestone: TransientTemporalProjection['activeMilestone'] = null;
    let crossedMilestoneIds: string[] = [];

    if (intrinsic.has(assessment.classification)) {
      const elapsed = now - item.sourceOnsetSimulationSeconds!;
      if (elapsed < 0) {
        state = 'MODEL_NOT_STARTED';
      } else {
        sourceAgeSeconds = elapsed;
        const sorted = [...assessment.modelMilestones].sort((a, b) =>
          a.timeAfterOnsetSeconds - b.timeAfterOnsetSeconds || a.id.localeCompare(b.id));
        for (const phase of sorted) {
          if (phase.timeAfterOnsetSeconds > elapsed) break;
          crossedMilestoneIds.push(phase.id);
          activeMilestone = phase;
        }
        state = activeMilestone?.phase === TransientTemporalPhase.END
          ? 'MODEL_END_REFERENCE' : 'MODEL_IN_PROGRESS';
      }
    } else if (assessment.classification === 'CANONICAL_FUTURE') {
      state = now < item.dueSimulationSeconds! ? 'FUTURE_PENDING' : 'FUTURE_DUE_UNCONFIRMED';
    } else if (observational.has(assessment.classification)) {
      state = 'OBSERVATION_ONLY_UNALIGNED';
    } else {
      state = 'NO_INDIVIDUAL_EVENT';
    }
    return Object.freeze({
      id: item.id, family: assessment.family,
      classification: assessment.classification, state,
      simulationSeconds: now, sourceAgeSeconds, activeMilestone,
      crossedMilestoneIds: Object.freeze(crossedMilestoneIds),
      observationCount: assessment.observations.length,
      observationTimesReinterpreted: 0 as const, observedEpoch: null,
      inventedEventCount: 0 as const,
    });
  }
}
