/**
 * 28.2a — Scientific contract for an approach that remains strictly OUTSIDE
 * a Schwarzschild event-horizon reference.
 *
 * GENESIS deliberately uses the already-established non-spinning
 * Schwarzschild radius as a reference scale. This contract does NOT infer
 * spin, charge, ergosphere structure, an interior metric, or observables from
 * inside the horizon.
 *
 * The numerical engine evaluates signals emitted by an idealized source held
 * at fixed Schwarzschild radius and received by a distant observer. Holding a
 * source static arbitrarily close to the horizon requires diverging proper
 * acceleration; that quantity is exposed explicitly so later presentation
 * code does not mistake the reference frame for free fall.
 */
export enum EventHorizonExternalReferenceFrame {
  DISTANT_OBSERVER_OF_STATIC_SOURCE =
    'DISTANT_OBSERVER_OF_STATIC_SOURCE',
}

export enum EventHorizonExternalModel {
  SCHWARZSCHILD_NON_ROTATING_REFERENCE =
    'SCHWARZSCHILD_NON_ROTATING_REFERENCE',
}

export class EventHorizonExternalApproachContract {
  /** The numerical model itself requires only r / Rs > 1. */
  static readonly HORIZON_RADIUS_RATIO = 1;

  /**
   * Recommended presentation floor for 28.2b/28.2d.
   *
   * This is a UI/numerical-safety boundary, not a second physical horizon.
   * The scientific engine still rejects only r <= Rs.
   */
  static readonly RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO = 1.001;

  /** A convenient default outer scale for the later interactive approach. */
  static readonly RECOMMENDED_MAX_PRESENTATION_RADIUS_RATIO = 100;

  static readonly model =
    EventHorizonExternalModel.SCHWARZSCHILD_NON_ROTATING_REFERENCE;

  static readonly referenceFrame =
    EventHorizonExternalReferenceFrame.DISTANT_OBSERVER_OF_STATIC_SOURCE;

  static assertExternalRadiusRatio(
    radiusRatioToSchwarzschild: number,
  ): void {
    if (
      !Number.isFinite(radiusRatioToSchwarzschild) ||
      radiusRatioToSchwarzschild <=
        EventHorizonExternalApproachContract.HORIZON_RADIUS_RATIO
    ) {
      throw new RangeError(
        '28.2a requires a finite radius ratio r/Rs strictly greater than 1; the horizon and interior are outside this simulation domain.',
      );
    }
  }

  private constructor() {}
}

/**
 * One immutable, exterior-only Schwarzschild reference sample.
 *
 * `lapseFactor` α = sqrt(1 - Rs/r).
 * For the idealized static emitter used here:
 * - distant clock-rate ratio = α
 * - received/emitted photon-frequency ratio = α
 * - gravitational redshift z = 1/α - 1
 * - received signal-interval stretch = 1/α
 *
 * No field describes, predicts, or renders the black-hole interior.
 */
export class EventHorizonExternalApproachSample {
  constructor(
    readonly model:
      EventHorizonExternalModel,

    readonly referenceFrame:
      EventHorizonExternalReferenceFrame,

    readonly schwarzschildRadiusKm: number,

    readonly radiusRatioToSchwarzschild: number,

    readonly coordinateRadiusKm: number,

    readonly altitudeAboveReferenceHorizonKm: number,

    readonly lapseFactor: number,

    readonly distantClockRateRatio: number,

    readonly receivedToEmittedFrequencyRatio: number,

    readonly gravitationalRedshiftZ: number,

    readonly signalIntervalStretchFactor: number,

    readonly hoveringProperAccelerationMetersPerSecondSquared: number,
  ) {
    if (
      model !==
        EventHorizonExternalModel.SCHWARZSCHILD_NON_ROTATING_REFERENCE ||
      referenceFrame !==
        EventHorizonExternalReferenceFrame.DISTANT_OBSERVER_OF_STATIC_SOURCE
    ) {
      throw new RangeError(
        '28.2a supports only the explicit Schwarzschild exterior/static-source reference contract.',
      );
    }

    if (
      !Number.isFinite(schwarzschildRadiusKm) ||
      schwarzschildRadiusKm <= 0
    ) {
      throw new RangeError(
        'Schwarzschild reference radius must be finite and positive.',
      );
    }

    EventHorizonExternalApproachContract
      .assertExternalRadiusRatio(
        radiusRatioToSchwarzschild,
      );

    const finitePositive = [
      coordinateRadiusKm,
      altitudeAboveReferenceHorizonKm,
      lapseFactor,
      distantClockRateRatio,
      receivedToEmittedFrequencyRatio,
      signalIntervalStretchFactor,
      hoveringProperAccelerationMetersPerSecondSquared,
    ];

    if (
      finitePositive.some(
        value =>
          !Number.isFinite(value) ||
          value <= 0,
      ) ||
      !Number.isFinite(gravitationalRedshiftZ) ||
      gravitationalRedshiftZ < 0 ||
      lapseFactor >= 1 ||
      distantClockRateRatio >= 1 ||
      receivedToEmittedFrequencyRatio >= 1 ||
      signalIntervalStretchFactor <= 1
    ) {
      throw new RangeError(
        '28.2a exterior observables must remain finite and physically bounded for r > Rs.',
      );
    }

    Object.freeze(this);
  }
}
