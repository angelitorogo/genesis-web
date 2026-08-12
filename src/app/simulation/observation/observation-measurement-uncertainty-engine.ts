import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  UncertainScalarEstimate,
  UncertainScalarMeasurement,
} from '../../domain/observation/observation-measurement-uncertainty';

import {
  ObservationMeasurementUncertaintyCatalogV1,
} from './observation-measurement-uncertainty-catalog';

/**
 * Pure deterministic V1 scalar-measurement uncertainty projection.
 *
 * Ground Truth enters only as the private exactValue input. It never appears
 * in the returned observed model.
 *
 * V1 uses deterministic quantization rather than random noise:
 *
 * bucketWidth = referenceScale * quantizationFraction
 * bucketIndex = floor(exactValue / bucketWidth)
 * interval = [bucketIndex * bucketWidth, lower + bucketWidth)
 *
 * Point 8.6 deliberately uses:
 * - 0 PRNG draws;
 * - 0 seed derivation/hashing;
 * - 0 Gaussian or Poisson noise;
 * - 0 SNR/evidence score;
 * - 0 ObservationCertainty transitions;
 * - 0 DiscoveryState changes;
 * - 0 Discovery Point changes;
 * - 0 persistence.
 */
export class ObservationMeasurementUncertaintyEngine {

  private constructor() {}

  static estimateScalar(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    exactValue:
      number,

    referenceScale:
      number,
  ): UncertainScalarMeasurement {

    if (
      !sameGenerationKey(
        generationKey,
        observationSession
          .generationKey,
      )
    ) {
      throw new RangeError(
        'generationKey must match observationSession.generationKey.',
      );
    }

    if (
      !Number.isFinite(
        exactValue,
      )
    ) {
      throw new RangeError(
        'exactValue must be finite.',
      );
    }

    if (
      !Number.isFinite(
        referenceScale,
      ) ||
      referenceScale <=
        0.0
    ) {
      throw new RangeError(
        'referenceScale must be finite and greater than zero.',
      );
    }

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.estimateScalarV1(
        observationSession,
        exactValue,
        referenceScale,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static estimateScalarV1(
    observationSession:
      LeveledInstrumentObservationSession,

    exactValue:
      number,

    referenceScale:
      number,
  ): UncertainScalarMeasurement {

    const profile =
      ObservationMeasurementUncertaintyCatalogV1
        .profile(
          observationSession
            .level,
        );

    const bucketWidth =
      referenceScale *
      profile
        .quantizationFraction;

    if (
      !Number.isFinite(
        bucketWidth,
      ) ||
      bucketWidth <=
        0.0
    ) {
      throw new RangeError(
        'Derived measurement bucket width must be finite and greater than zero.',
      );
    }

    const bucketIndex =
      Math.floor(
        exactValue /
        bucketWidth,
      );

    const lowerBoundInclusive =
      bucketIndex *
      bucketWidth;

    const upperBoundExclusive =
      lowerBoundInclusive +
      bucketWidth;

    const estimate =
      new UncertainScalarEstimate(
        lowerBoundInclusive,
        upperBoundExclusive,
      );

    if (
      !estimate.contains(
        exactValue,
      )
    ) {
      throw new RangeError(
        'Derived uncertainty interval must contain the exact input value.',
      );
    }

    return new UncertainScalarMeasurement(
      observationSession,
      estimate,
      profile,
    );
  }
}

/**
 * Kotlin UniverseGenerationKey is a data class. Web classes use reference
 * identity by default, so point 8.6 performs a conservative structural
 * comparison without changing the frozen generation-key model.
 */
function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  if (
    left ===
    right
  ) {
    return true;
  }

  if (
    left
      .generatorVersion
      .code !==
    right
      .generatorVersion
      .code
  ) {
    return false;
  }

  return sameStructuredValue(
    left.universeSeed,
    right.universeSeed,
  );
}

function sameStructuredValue(
  left:
    unknown,

  right:
    unknown,
): boolean {

  if (
    Object.is(
      left,
      right,
    )
  ) {
    return true;
  }

  if (
    typeof left !==
      typeof right ||
    left ===
      null ||
    right ===
      null
  ) {
    return false;
  }

  if (
    typeof left !==
      'object'
  ) {
    return false;
  }

  const leftText =
    String(
      left,
    );

  const rightText =
    String(
      right,
    );

  if (
    leftText !==
      '[object Object]' &&
    rightText !==
      '[object Object]' &&
    leftText ===
      rightText
  ) {
    return true;
  }

  if (
    left instanceof
      Uint8Array &&
    right instanceof
      Uint8Array
  ) {
    return (
      left.length ===
        right.length &&
      left.every(
        (
          value,
          index,
        ) =>
          value ===
          right[
            index
          ],
      )
    );
  }

  if (
    Array.isArray(
      left,
    ) &&
    Array.isArray(
      right,
    )
  ) {
    return (
      left.length ===
        right.length &&
      left.every(
        (
          value,
          index,
        ) =>
          sameStructuredValue(
            value,
            right[
              index
            ],
          ),
      )
    );
  }

  const leftObject =
    left as
      object;

  const rightObject =
    right as
      object;

  const leftKeys =
    Reflect.ownKeys(
      leftObject,
    );

  const rightKeys =
    Reflect.ownKeys(
      rightObject,
    );

  if (
    leftKeys.length ===
      0 ||
    leftKeys.length !==
      rightKeys.length
  ) {
    return false;
  }

  for (
    const key
    of leftKeys
  ) {
    if (
      !rightKeys.includes(
        key,
      )
    ) {
      return false;
    }

    const leftValue =
      (
        leftObject as
          Record<
            PropertyKey,
            unknown
          >
      )[
        key
      ];

    const rightValue =
      (
        rightObject as
          Record<
            PropertyKey,
            unknown
          >
      )[
        key
      ];

    if (
      !sameStructuredValue(
        leftValue,
        rightValue,
      )
    ) {
      return false;
    }
  }

  return true;
}
