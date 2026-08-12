import {
  ObservationInstrumentType,
} from './observation-instrument';

import {
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from './observation-instrument-capability';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

/**
 * V1 uncertainty profile for one observational instrument maturity level.
 *
 * quantizationFraction is dimensionless and expresses the fraction of a
 * caller-supplied referenceScale used as the deterministic quantization
 * bucket width.
 *
 * It is deliberately NOT:
 * - a probability;
 * - a confidence value;
 * - a physical unit;
 * - normalizedPrecision from point 8.3.
 */
export class MeasurementUncertaintyProfile {

  constructor(
    readonly level:
      ObservationInstrumentLevel,

    readonly quantizationFraction:
      number,
  ) {
    if (
      !ObservationInstrumentLevel
        .values
        .includes(
          level,
        )
    ) {
      throw new RangeError(
        'level must be a canonical ObservationInstrumentLevel.',
      );
    }

    if (
      !Number.isFinite(
        quantizationFraction,
      ) ||
      quantizationFraction <=
        0.0 ||
      quantizationFraction >
        1.0
    ) {
      throw new RangeError(
        'quantizationFraction must be finite and in range (0, 1].',
      );
    }
  }
}

/**
 * Observable scalar estimate represented as a deterministic half-open interval:
 *
 * [lowerBoundInclusive, upperBoundExclusive)
 *
 * The exact Ground Truth scalar and the reference scale used to quantize it
 * are intentionally absent from this model.
 */
export class UncertainScalarEstimate {

  constructor(
    readonly lowerBoundInclusive:
      number,

    readonly upperBoundExclusive:
      number,
  ) {
    if (
      !Number.isFinite(
        lowerBoundInclusive,
      ) ||
      !Number.isFinite(
        upperBoundExclusive,
      )
    ) {
      throw new RangeError(
        'Uncertain scalar bounds must be finite.',
      );
    }

    if (
      upperBoundExclusive <=
      lowerBoundInclusive
    ) {
      throw new RangeError(
        'upperBoundExclusive must be greater than lowerBoundInclusive.',
      );
    }
  }

  get intervalWidth():
    number {

    return this
      .upperBoundExclusive -
      this
        .lowerBoundInclusive;
  }

  get midpointEstimate():
    number {

    return this
      .lowerBoundInclusive +
      this
        .intervalWidth /
        2.0;
  }

  get uncertaintyHalfWidth():
    number {

    return this
      .intervalWidth /
      2.0;
  }

  contains(
    value:
      number,
  ): boolean {

    return (
      Number.isFinite(
        value,
      ) &&
      value >=
        this
          .lowerBoundInclusive &&
      value <
        this
          .upperBoundExclusive
    );
  }
}

/**
 * Point-8.6 scalar measurement projected from Ground Truth into observed
 * knowledge.
 *
 * The exact source value never leaves the uncertainty engine. This result
 * contains only:
 * - the already-prepared leveled observation session;
 * - an observable half-open interval;
 * - the uncertainty profile that produced that interval.
 *
 * Observation certainty from 8.5 remains a separate concept.
 */
export class UncertainScalarMeasurement {

  constructor(
    readonly observationSession:
      LeveledInstrumentObservationSession,

    readonly estimate:
      UncertainScalarEstimate,

    readonly uncertaintyProfile:
      MeasurementUncertaintyProfile,
  ) {
    if (
      observationSession
        .level !==
      uncertaintyProfile
        .level
    ) {
      throw new RangeError(
        'observationSession.level must match uncertaintyProfile.level.',
      );
    }
  }

  get level():
    ObservationInstrumentLevel {

    return this
      .observationSession
      .level;
  }

  get instrumentType():
    ObservationInstrumentType {

    return this
      .observationSession
      .instrumentType;
  }

  get targetLocator():
    ProceduralLocator {

    return this
      .observationSession
      .targetLocator;
  }

  get lowerBoundInclusive():
    number {

    return this
      .estimate
      .lowerBoundInclusive;
  }

  get upperBoundExclusive():
    number {

    return this
      .estimate
      .upperBoundExclusive;
  }

  get midpointEstimate():
    number {

    return this
      .estimate
      .midpointEstimate;
  }

  get uncertaintyHalfWidth():
    number {

    return this
      .estimate
      .uncertaintyHalfWidth;
  }
}
