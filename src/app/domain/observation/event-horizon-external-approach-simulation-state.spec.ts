import {
  EventHorizonExternalApproachContract,
  EventHorizonExternalApproachSample,
  EventHorizonExternalModel,
  EventHorizonExternalReferenceFrame,
} from './event-horizon-external-approach';

import {
  EventHorizonExternalApproachSimulationPhase,
  EventHorizonExternalApproachSimulationState,
} from './event-horizon-external-approach-simulation-state';

function exteriorSampleAt(
  radiusRatio:
    number,
): EventHorizonExternalApproachSample {
  const schwarzschildRadiusKm =
    100;

  const lapseFactor =
    Math.sqrt(
      1 -
      1 /
      radiusRatio,
    );

  return new EventHorizonExternalApproachSample(
    EventHorizonExternalModel
      .SCHWARZSCHILD_NON_ROTATING_REFERENCE,

    EventHorizonExternalReferenceFrame
      .DISTANT_OBSERVER_OF_STATIC_SOURCE,

    schwarzschildRadiusKm,

    radiusRatio,

    schwarzschildRadiusKm *
      radiusRatio,

    schwarzschildRadiusKm *
      (
        radiusRatio -
        1
      ),

    lapseFactor,

    lapseFactor,

    lapseFactor,

    1 /
      lapseFactor -
      1,

    1 /
      lapseFactor,

    1,
  );
}

describe('28.2b — interactive exterior state guardrails', () => {
  it('rejects a state below the explicit exterior presentation floor', () => {
    const ratio =
      1.0005;

    const sample =
      exteriorSampleAt(
        ratio,
      );

    expect(
      () =>
        new EventHorizonExternalApproachSimulationState(
          EventHorizonExternalApproachSimulationPhase.RUNNING,
          100,
          ratio,
          sample,
          0,
        ),
    ).toThrow(
      RangeError,
    );
  });

  it('accepts the exact 1.001 Rs presentation floor as exterior', () => {
    const ratio =
      EventHorizonExternalApproachContract
        .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO;

    const sample =
      exteriorSampleAt(
        ratio,
      );

    const state =
      new EventHorizonExternalApproachSimulationState(
        EventHorizonExternalApproachSimulationPhase.RUNNING,
        100,
        ratio,
        sample,
        0,
      );

    expect(
      state.atMinimumExteriorRadius,
    ).toBe(
      true,
    );

    expect(
      state
        .sample
        .radiusRatioToSchwarzschild,
    ).toBeGreaterThan(
      1,
    );
  });
});
