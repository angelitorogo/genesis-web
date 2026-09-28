import {
  EventHorizonExternalApproachContract,
} from '../../domain/observation/event-horizon-external-approach';

import {
  EventHorizonExternalApproachSimulationPhase,
} from '../../domain/observation/event-horizon-external-approach-simulation-state';

import {
  EventHorizonExternalApproachSimulationEngine as Engine,
} from './event-horizon-external-approach-simulation-engine';

describe('28.2b — interactive exterior-horizon state machine', () => {
  it('creates a deterministic IDLE simulation at the explicit far exterior boundary', () => {
    const state =
      Engine.createFromMassSolar(
        10,
      );

    expect(state.phase).toBe(
      EventHorizonExternalApproachSimulationPhase.IDLE,
    );

    expect(
      state.radiusRatioToSchwarzschild,
    ).toBe(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO,
    );

    expect(state.atMaximumExteriorRadius).toBe(true);
    expect(state.atMinimumExteriorRadius).toBe(false);
    expect(state.interactionCount).toBe(0);
  });

  it('starts, pauses and resumes without changing the exterior radius', () => {
    const idle =
      Engine.createFromSchwarzschildRadius(
        100,
      );

    const running =
      Engine.start(idle);

    expect(running.phase).toBe(
      EventHorizonExternalApproachSimulationPhase.RUNNING,
    );
    expect(running.radiusRatioToSchwarzschild)
      .toBe(idle.radiusRatioToSchwarzschild);

    const paused =
      Engine.pause(running);

    expect(paused.phase).toBe(
      EventHorizonExternalApproachSimulationPhase.PAUSED,
    );
    expect(paused.radiusRatioToSchwarzschild)
      .toBe(running.radiusRatioToSchwarzschild);

    const resumed =
      Engine.start(paused);

    expect(resumed.phase).toBe(
      EventHorizonExternalApproachSimulationPhase.RUNNING,
    );
    expect(resumed.radiusRatioToSchwarzschild)
      .toBe(paused.radiusRatioToSchwarzschild);

    expect(resumed.interactionCount).toBe(3);
  });

  it('moves logarithmically toward the horizon only while RUNNING', () => {
    const idle =
      Engine.createFromSchwarzschildRadius(
        100,
      );

    expect(
      Engine.approach(idle),
    ).toBe(idle);

    const running =
      Engine.start(idle);

    const one =
      Engine.approach(running);

    const two =
      Engine.approach(one);

    /*
     * Starting from 100 Rs:
     * exterior altitude above 1 Rs is 99;
     * one step halves it to 49.5 -> 50.5 Rs;
     * a second halves it to 24.75 -> 25.75 Rs.
     */
    expect(
      one.radiusRatioToSchwarzschild,
    ).toBeCloseTo(
      50.5,
      12,
    );

    expect(
      two.radiusRatioToSchwarzschild,
    ).toBeCloseTo(
      25.75,
      12,
    );

    expect(
      two.sample.gravitationalRedshiftZ,
    ).toBeGreaterThan(
      one.sample.gravitationalRedshiftZ,
    );

    expect(
      two.sample.distantClockRateRatio,
    ).toBeLessThan(
      one.sample.distantClockRateRatio,
    );
  });

  it('can retreat again without exceeding the far exterior boundary', () => {
    let state =
      Engine.start(
        Engine.createFromSchwarzschildRadius(
          100,
        ),
      );

    state =
      Engine.approach(state);

    const retreated =
      Engine.retreat(state);

    expect(
      retreated.radiusRatioToSchwarzschild,
    ).toBe(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO,
    );

    expect(
      Engine.retreat(retreated),
    ).toBe(retreated);
  });

  it('freezes movement while PAUSED', () => {
    let state =
      Engine.start(
        Engine.createFromSchwarzschildRadius(
          100,
        ),
      );

    state =
      Engine.approach(state);

    const paused =
      Engine.pause(state);

    expect(
      Engine.approach(paused),
    ).toBe(paused);

    expect(
      Engine.retreat(paused),
    ).toBe(paused);
  });

  it('cannot reach or cross the horizon even after thousands of approach commands', () => {
    let state =
      Engine.start(
        Engine.createFromSchwarzschildRadius(
          100,
        ),
      );

    for (
      let index = 0;
      index < 10_000;
      index += 1
    ) {
      state =
        Engine.approach(state);
    }

    expect(
      state.radiusRatioToSchwarzschild,
    ).toBe(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO,
    );

    expect(
      state.radiusRatioToSchwarzschild,
    ).toBeGreaterThan(
      EventHorizonExternalApproachContract
        .HORIZON_RADIUS_RATIO,
    );

    expect(
      state.sample.altitudeAboveReferenceHorizonKm,
    ).toBeGreaterThan(0);

    const pinned =
      Engine.approach(state);

    expect(pinned).toBe(state);
  });

  it('reset returns from any running near-horizon state to the original deterministic IDLE boundary', () => {
    const initial =
      Engine.createFromSchwarzschildRadius(
        250,
      );

    let state =
      Engine.start(initial);

    for (
      let index = 0;
      index < 20;
      index += 1
    ) {
      state =
        Engine.approach(state);
    }

    const reset =
      Engine.reset(state);

    expect(reset.phase).toBe(
      EventHorizonExternalApproachSimulationPhase.IDLE,
    );

    expect(
      reset.radiusRatioToSchwarzschild,
    ).toBe(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO,
    );

    expect(
      reset.schwarzschildRadiusKm,
    ).toBe(
      initial.schwarzschildRadiusKm,
    );

    expect(reset.interactionCount).toBe(0);
  });

  it('keeps start/pause boundary commands idempotent', () => {
    const running =
      Engine.start(
        Engine.createFromSchwarzschildRadius(
          100,
        ),
      );

    expect(
      Engine.start(running),
    ).toBe(running);

    const paused =
      Engine.pause(running);

    expect(
      Engine.pause(paused),
    ).toBe(paused);
  });
});
