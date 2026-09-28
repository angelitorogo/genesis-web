import {
  EventHorizonExternalApproachContract,
  EventHorizonExternalApproachSample,
} from './event-horizon-external-approach';

export enum EventHorizonExternalApproachSimulationPhase {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
}

/**
 * 28.2b — Immutable interactive state for the exterior-only horizon approach.
 *
 * The state carries the already-known Schwarzschild reference scale plus one
 * 28.2a sample. It never stores an interior coordinate and never permits a
 * presentation radius below the explicit exterior floor.
 */
export class EventHorizonExternalApproachSimulationState {
  constructor(
    readonly phase:
      EventHorizonExternalApproachSimulationPhase,

    readonly schwarzschildRadiusKm:
      number,

    readonly radiusRatioToSchwarzschild:
      number,

    readonly sample:
      EventHorizonExternalApproachSample,

    readonly interactionCount:
      number,
  ) {
    if (
      !Number.isFinite(schwarzschildRadiusKm) ||
      schwarzschildRadiusKm <= 0
    ) {
      throw new RangeError(
        '28.2b requires a finite positive Schwarzschild reference radius.',
      );
    }

    if (
      !Number.isFinite(radiusRatioToSchwarzschild) ||
      radiusRatioToSchwarzschild <
        EventHorizonExternalApproachContract
          .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO ||
      radiusRatioToSchwarzschild >
        EventHorizonExternalApproachContract
          .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO
    ) {
      throw new RangeError(
        '28.2b interactive state must remain inside the explicit exterior presentation domain.',
      );
    }

    if (
      sample.schwarzschildRadiusKm !==
        schwarzschildRadiusKm ||
      sample.radiusRatioToSchwarzschild !==
        radiusRatioToSchwarzschild
    ) {
      throw new RangeError(
        '28.2b state/sample reference scales must be identical.',
      );
    }

    if (
      !Number.isInteger(interactionCount) ||
      interactionCount < 0
    ) {
      throw new RangeError(
        '28.2b interaction count must be a non-negative integer.',
      );
    }

    Object.freeze(this);
  }

  get isRunning(): boolean {
    return this.phase ===
      EventHorizonExternalApproachSimulationPhase.RUNNING;
  }

  get isPaused(): boolean {
    return this.phase ===
      EventHorizonExternalApproachSimulationPhase.PAUSED;
  }

  get isIdle(): boolean {
    return this.phase ===
      EventHorizonExternalApproachSimulationPhase.IDLE;
  }

  get atMinimumExteriorRadius(): boolean {
    return this.radiusRatioToSchwarzschild ===
      EventHorizonExternalApproachContract
        .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO;
  }

  get atMaximumExteriorRadius(): boolean {
    return this.radiusRatioToSchwarzschild ===
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO;
  }
}
