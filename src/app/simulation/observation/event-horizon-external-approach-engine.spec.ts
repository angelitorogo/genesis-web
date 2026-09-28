import {
  EventHorizonExternalApproachContract,
  EventHorizonExternalModel,
  EventHorizonExternalReferenceFrame,
} from '../../domain/observation/event-horizon-external-approach';

import {
  StellarBlackHole,
} from '../../domain/stellar/stellar-black-hole';

import {
  EventHorizonExternalApproachEngine as Engine,
} from './event-horizon-external-approach-engine';

describe('28.2a — external event-horizon numerical contract', () => {
  it('refuses the horizon, the interior and non-finite radii', () => {
    const rs = 100;

    for (
      const ratio
      of [
        Number.NaN,
        Number.POSITIVE_INFINITY,
        -1,
        0,
        0.999999,
        1,
      ]
    ) {
      expect(
        () =>
          Engine.evaluateFromSchwarzschildRadius(
            rs,
            ratio,
          ),
      ).toThrow(
        RangeError,
      );
    }

    expect(
      () =>
        Engine.evaluateFromSchwarzschildRadius(
          0,
          2,
        ),
    ).toThrow(
      RangeError,
    );
  });

  it('matches the Schwarzschild static-source reference exactly at 2 Rs', () => {
    const rs = 120;
    const sample =
      Engine.evaluateFromSchwarzschildRadius(
        rs,
        2,
      );

    const alpha =
      Math.sqrt(0.5);

    expect(sample.model).toBe(
      EventHorizonExternalModel
        .SCHWARZSCHILD_NON_ROTATING_REFERENCE,
    );

    expect(sample.referenceFrame).toBe(
      EventHorizonExternalReferenceFrame
        .DISTANT_OBSERVER_OF_STATIC_SOURCE,
    );

    expect(sample.coordinateRadiusKm)
      .toBeCloseTo(240, 12);

    expect(sample.altitudeAboveReferenceHorizonKm)
      .toBeCloseTo(120, 12);

    expect(sample.lapseFactor)
      .toBeCloseTo(alpha, 12);

    expect(sample.distantClockRateRatio)
      .toBeCloseTo(alpha, 12);

    expect(sample.receivedToEmittedFrequencyRatio)
      .toBeCloseTo(alpha, 12);

    expect(sample.gravitationalRedshiftZ)
      .toBeCloseTo(
        Math.SQRT2 - 1,
        12,
      );

    expect(sample.signalIntervalStretchFactor)
      .toBeCloseTo(
        Math.SQRT2,
        12,
      );
  });

  it('approaches the horizon monotonically without ever manufacturing an interior sample', () => {
    const rs =
      StellarBlackHole
        .schwarzschildRadiusFor(
          10,
        );

    const far =
      Engine.evaluateFromSchwarzschildRadius(
        rs,
        10,
      );

    const middle =
      Engine.evaluateFromSchwarzschildRadius(
        rs,
        2,
      );

    const near =
      Engine.evaluateFromSchwarzschildRadius(
        rs,
        EventHorizonExternalApproachContract
          .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO,
      );

    expect(
      far.lapseFactor,
    ).toBeGreaterThan(
      middle.lapseFactor,
    );

    expect(
      middle.lapseFactor,
    ).toBeGreaterThan(
      near.lapseFactor,
    );

    expect(
      far.gravitationalRedshiftZ,
    ).toBeLessThan(
      middle.gravitationalRedshiftZ,
    );

    expect(
      middle.gravitationalRedshiftZ,
    ).toBeLessThan(
      near.gravitationalRedshiftZ,
    );

    expect(
      far.signalIntervalStretchFactor,
    ).toBeLessThan(
      middle.signalIntervalStretchFactor,
    );

    expect(
      middle.signalIntervalStretchFactor,
    ).toBeLessThan(
      near.signalIntervalStretchFactor,
    );

    expect(
      far.hoveringProperAccelerationMetersPerSecondSquared,
    ).toBeLessThan(
      middle.hoveringProperAccelerationMetersPerSecondSquared,
    );

    expect(
      middle.hoveringProperAccelerationMetersPerSecondSquared,
    ).toBeLessThan(
      near.hoveringProperAccelerationMetersPerSecondSquared,
    );

    expect(
      near.radiusRatioToSchwarzschild,
    ).toBeGreaterThan(1);

    expect(
      near.altitudeAboveReferenceHorizonKm,
    ).toBeGreaterThan(0);
  });

  it('keeps dimensionless redshift/time factors mass-invariant at equal r/Rs while physical radius scales with mass', () => {
    const stellar =
      Engine.evaluateFromMassSolar(
        10,
        3,
      );

    const supermassive =
      Engine.evaluateFromMassSolar(
        1_000_000,
        3,
      );

    expect(
      stellar.lapseFactor,
    ).toBeCloseTo(
      supermassive.lapseFactor,
      14,
    );

    expect(
      stellar.gravitationalRedshiftZ,
    ).toBeCloseTo(
      supermassive.gravitationalRedshiftZ,
      14,
    );

    expect(
      stellar.signalIntervalStretchFactor,
    ).toBeCloseTo(
      supermassive.signalIntervalStretchFactor,
      14,
    );

    expect(
      supermassive.schwarzschildRadiusKm /
      stellar.schwarzschildRadiusKm,
    ).toBeCloseTo(
      100_000,
      8,
    );

    /*
     * At equal r/Rs the larger black hole requires less proper acceleration
     * to hover because all physical length scales are larger.
     */
    expect(
      supermassive
        .hoveringProperAccelerationMetersPerSecondSquared,
    ).toBeLessThan(
      stellar
        .hoveringProperAccelerationMetersPerSecondSquared,
    );
  });

  it('provides a finite, explicitly exterior presentation floor at 1.001 Rs', () => {
    const sample =
      Engine.evaluateFromMassSolar(
        1_000,
        EventHorizonExternalApproachContract
          .RECOMMENDED_MIN_PRESENTATION_RADIUS_RATIO,
      );

    expect(
      sample.radiusRatioToSchwarzschild,
    ).toBe(
      1.001,
    );

    expect(
      sample.lapseFactor,
    ).toBeCloseTo(
      Math.sqrt(
        1 -
        1 / 1.001,
      ),
      12,
    );

    expect(
      sample.signalIntervalStretchFactor,
    ).toBeGreaterThan(30);

    expect(
      sample.gravitationalRedshiftZ,
    ).toBeGreaterThan(29);

    expect(
      Number.isFinite(
        sample.hoveringProperAccelerationMetersPerSecondSquared,
      ),
    ).toBe(true);
  });

  it('keeps far-field observables close to the weak-field limit', () => {
    const sample =
      Engine.evaluateFromMassSolar(
        10,
        1_000_000,
      );

    expect(
      sample.lapseFactor,
    ).toBeCloseTo(
      1,
      5,
    );

    expect(
      sample.gravitationalRedshiftZ,
    ).toBeLessThan(
      1e-5,
    );

    expect(
      sample.signalIntervalStretchFactor,
    ).toBeCloseTo(
      1,
      5,
    );
  });
});
