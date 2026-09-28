import {
  EventHorizonExternalApproachContract,
  EventHorizonExternalApproachSample,
  EventHorizonExternalModel,
  EventHorizonExternalReferenceFrame,
} from './event-horizon-external-approach';

describe('28.2a — external horizon domain guardrails', () => {
  it('publishes an explicit exterior-only presentation domain', () => {
    expect(
      EventHorizonExternalApproachContract
        .HORIZON_RADIUS_RATIO,
    ).toBe(1);

    expect(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO,
    ).toBeGreaterThan(1);

    expect(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO,
    ).toBeGreaterThan(
      EventHorizonExternalApproachContract
        .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO,
    );
  });

  it('rejects an internally inconsistent or non-exterior sample', () => {
    expect(
      () =>
        new EventHorizonExternalApproachSample(
          EventHorizonExternalModel
            .SCHWARZSCHILD_NON_ROTATING_REFERENCE,
          EventHorizonExternalReferenceFrame
            .DISTANT_OBSERVER_OF_STATIC_SOURCE,
          100,
          1,
          100,
          0,
          0,
          0,
          0,
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
        ),
    ).toThrow(
      RangeError,
    );
  });
});
