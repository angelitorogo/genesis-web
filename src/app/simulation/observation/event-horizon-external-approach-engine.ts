import {
  EventHorizonExternalApproachContract,
  EventHorizonExternalApproachSample,
} from '../../domain/observation/event-horizon-external-approach';

import {
  StellarBlackHole,
} from '../../domain/stellar/stellar-black-hole';

/**
 * 28.2a — Pure numerical Schwarzschild-exterior reference engine.
 *
 * This engine has no persistence, no gameplay progression, no renderer, and no
 * hidden target generation. It consumes an ALREADY KNOWN Schwarzschild
 * reference radius (or a mass only to derive that existing reference scale)
 * and evaluates only r > Rs.
 *
 * It intentionally does not model:
 * - r <= Rs;
 * - a Kerr/rotating horizon;
 * - free-fall trajectories or post-crossing experience;
 * - luminosity, lensing images, accretion emission, or signal detectability;
 * - any "inside" state.
 */
export class EventHorizonExternalApproachEngine {
  private constructor() {}

  static evaluateFromMassSolar(
    massSolar: number,
    radiusRatioToSchwarzschild: number,
  ): EventHorizonExternalApproachSample {
    const schwarzschildRadiusKm =
      StellarBlackHole.schwarzschildRadiusFor(
        massSolar,
      );

    return this.evaluateFromSchwarzschildRadius(
      schwarzschildRadiusKm,
      radiusRatioToSchwarzschild,
    );
  }

  static evaluateFromSchwarzschildRadius(
    schwarzschildRadiusKm: number,
    radiusRatioToSchwarzschild: number,
  ): EventHorizonExternalApproachSample {
    if (
      !Number.isFinite(schwarzschildRadiusKm) ||
      schwarzschildRadiusKm <= 0
    ) {
      throw new RangeError(
        '28.2a requires a finite positive Schwarzschild reference radius.',
      );
    }

    EventHorizonExternalApproachContract
      .assertExternalRadiusRatio(
        radiusRatioToSchwarzschild,
      );

    const inverseRadiusRatio =
      1 /
      radiusRatioToSchwarzschild;

    const lapseFactor =
      Math.sqrt(
        1 -
        inverseRadiusRatio,
      );

    const coordinateRadiusKm =
      schwarzschildRadiusKm *
      radiusRatioToSchwarzschild;

    const altitudeAboveReferenceHorizonKm =
      coordinateRadiusKm -
      schwarzschildRadiusKm;

    const signalIntervalStretchFactor =
      1 /
      lapseFactor;

    const gravitationalRedshiftZ =
      signalIntervalStretchFactor -
      1;

    /*
     * Proper acceleration required to remain static at Schwarzschild r:
     *
     * a = GM / (r² sqrt(1 - Rs/r))
     *
     * using GM = c² Rs / 2.
     *
     * This is NOT free-fall acceleration. Its divergence as r -> Rs+ is an
     * important guardrail for later UI wording.
     */
    const schwarzschildRadiusMeters =
      schwarzschildRadiusKm *
      1_000;

    const coordinateRadiusMeters =
      coordinateRadiusKm *
      1_000;

    const hoveringProperAccelerationMetersPerSecondSquared =
      (
        StellarBlackHole.LIGHT_SPEED_M_PER_S ** 2 *
        schwarzschildRadiusMeters
      ) /
      (
        2 *
        coordinateRadiusMeters ** 2 *
        lapseFactor
      );

    return new EventHorizonExternalApproachSample(
      EventHorizonExternalApproachContract.model,
      EventHorizonExternalApproachContract.referenceFrame,
      schwarzschildRadiusKm,
      radiusRatioToSchwarzschild,
      coordinateRadiusKm,
      altitudeAboveReferenceHorizonKm,
      lapseFactor,
      lapseFactor,
      lapseFactor,
      gravitationalRedshiftZ,
      signalIntervalStretchFactor,
      hoveringProperAccelerationMetersPerSecondSquared,
    );
  }
}
