import {
  EventHorizonExternalApproachContract,
} from '../../domain/observation/event-horizon-external-approach';

import {
  EventHorizonExternalApproachSimulationPhase,
  EventHorizonExternalApproachSimulationState,
} from '../../domain/observation/event-horizon-external-approach-simulation-state';

import {
  EventHorizonExternalApproachEngine,
} from './event-horizon-external-approach-engine';

/**
 * 28.2b — Pure state machine for the future interactive simulation.
 *
 * Movement is logarithmic in the exterior altitude x = r/Rs - 1:
 *
 *   approach: x' = x * 0.5
 *   retreat:  x' = x * 2
 *
 * and is clamped to the explicit 28.2a presentation domain. This gives useful
 * resolution close to the horizon while making r <= Rs unreachable by
 * construction.
 *
 * No timers, animation frames, persistence, UI state or renderer concerns live
 * here. Those belong to later 28.2c/28.2d integration.
 */
export class EventHorizonExternalApproachSimulationEngine {
  static readonly APPROACH_ALTITUDE_FACTOR =
    0.5;

  static readonly RETREAT_ALTITUDE_FACTOR =
    2;

  private constructor() {}

  static createFromSchwarzschildRadius(
    schwarzschildRadiusKm: number,
  ): EventHorizonExternalApproachSimulationState {
    return this.build(
      EventHorizonExternalApproachSimulationPhase.IDLE,
      schwarzschildRadiusKm,
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO,
      0,
    );
  }

  static createFromMassSolar(
    massSolar: number,
  ): EventHorizonExternalApproachSimulationState {
    const sample =
      EventHorizonExternalApproachEngine
        .evaluateFromMassSolar(
          massSolar,
          EventHorizonExternalApproachContract
            .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO,
        );

    return new EventHorizonExternalApproachSimulationState(
      EventHorizonExternalApproachSimulationPhase.IDLE,
      sample.schwarzschildRadiusKm,
      sample.radiusRatioToSchwarzschild,
      sample,
      0,
    );
  }

  /**
   * Starts an IDLE simulation and resumes a PAUSED one.
   * Calling start on an already-running state is deterministic and idempotent.
   */
  static start(
    state:
      EventHorizonExternalApproachSimulationState,
  ): EventHorizonExternalApproachSimulationState {
    if (state.isRunning) {
      return state;
    }

    return this.build(
      EventHorizonExternalApproachSimulationPhase.RUNNING,
      state.schwarzschildRadiusKm,
      state.radiusRatioToSchwarzschild,
      state.interactionCount + 1,
    );
  }

  /**
   * Pausing freezes the current exterior sample; it does not change radius.
   */
  static pause(
    state:
      EventHorizonExternalApproachSimulationState,
  ): EventHorizonExternalApproachSimulationState {
    if (!state.isRunning) {
      return state;
    }

    return this.build(
      EventHorizonExternalApproachSimulationPhase.PAUSED,
      state.schwarzschildRadiusKm,
      state.radiusRatioToSchwarzschild,
      state.interactionCount + 1,
    );
  }

  /**
   * Approaches the horizon only while RUNNING.
   *
   * The clamp is to 1.001 Rs, never to 1.0 Rs, so repeated interaction cannot
   * reach or cross the physical horizon.
   */
  static approach(
    state:
      EventHorizonExternalApproachSimulationState,
  ): EventHorizonExternalApproachSimulationState {
    if (
      !state.isRunning ||
      state.atMinimumExteriorRadius
    ) {
      return state;
    }

    const min =
      EventHorizonExternalApproachContract
        .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO;

    const currentExteriorAltitude =
      state.radiusRatioToSchwarzschild -
      EventHorizonExternalApproachContract
        .HORIZON_RADIUS_RATIO;

    const next =
      Math.max(
        min,
        EventHorizonExternalApproachContract
          .HORIZON_RADIUS_RATIO +
          currentExteriorAltitude *
            this.APPROACH_ALTITUDE_FACTOR,
      );

    return this.build(
      EventHorizonExternalApproachSimulationPhase.RUNNING,
      state.schwarzschildRadiusKm,
      next,
      state.interactionCount + 1,
    );
  }

  /**
   * Retreats from the horizon only while RUNNING and never exceeds the
   * presentation maximum.
   */
  static retreat(
    state:
      EventHorizonExternalApproachSimulationState,
  ): EventHorizonExternalApproachSimulationState {
    if (
      !state.isRunning ||
      state.atMaximumExteriorRadius
    ) {
      return state;
    }

    const max =
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO;

    const currentExteriorAltitude =
      state.radiusRatioToSchwarzschild -
      EventHorizonExternalApproachContract
        .HORIZON_RADIUS_RATIO;

    const next =
      Math.min(
        max,
        EventHorizonExternalApproachContract
          .HORIZON_RADIUS_RATIO +
          currentExteriorAltitude *
            this.RETREAT_ALTITUDE_FACTOR,
      );

    return this.build(
      EventHorizonExternalApproachSimulationPhase.RUNNING,
      state.schwarzschildRadiusKm,
      next,
      state.interactionCount + 1,
    );
  }

  /**
   * Reset always returns to the same idle/far exterior reference and clears
   * the interaction counter.
   */
  static reset(
    state:
      EventHorizonExternalApproachSimulationState,
  ): EventHorizonExternalApproachSimulationState {
    return this.createFromSchwarzschildRadius(
      state.schwarzschildRadiusKm,
    );
  }

  private static build(
    phase:
      EventHorizonExternalApproachSimulationPhase,

    schwarzschildRadiusKm:
      number,

    radiusRatioToSchwarzschild:
      number,

    interactionCount:
      number,
  ): EventHorizonExternalApproachSimulationState {
    const sample =
      EventHorizonExternalApproachEngine
        .evaluateFromSchwarzschildRadius(
          schwarzschildRadiusKm,
          radiusRatioToSchwarzschild,
        );

    return new EventHorizonExternalApproachSimulationState(
      phase,
      schwarzschildRadiusKm,
      radiusRatioToSchwarzschild,
      sample,
      interactionCount,
    );
  }
}
