import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationCertainty,
  ObservationCertaintyAssessment,
  ObservationCertaintyTransition,
} from '../../domain/observation/observation-certainty';

import {
  ObservationCertaintyCatalogV1,
} from './observation-certainty-catalog';

/**
 * Pure qualitative V1 certainty state machine.
 *
 * Point 8.5 intentionally does NOT:
 * - inspect an ObservationSession;
 * - inspect instrument type or level;
 * - inspect normalizedSensitivity/Precision/Reach;
 * - inspect unlock state;
 * - inspect global Discovery Points;
 * - inspect or mutate DiscoveryState;
 * - inspect Ground Truth;
 * - process signals or measurements;
 * - compute probability/confidence/evidence scores;
 * - use PRNG, hashing, UUIDs or time;
 * - persist certainty.
 */
export class ObservationCertaintyEngine {

  private constructor() {}

  static createCandidate(
    generationKey:
      UniverseGenerationKey,
  ): ObservationCertaintyAssessment {

    assertV1(
      generationKey,
    );

    return new ObservationCertaintyAssessment(
      ObservationCertaintyCatalogV1
        .initialCertainty,
    );
  }

  static evaluateTransition(
    generationKey:
      UniverseGenerationKey,

    previousCertainty:
      ObservationCertainty,

    newCertainty:
      ObservationCertainty,
  ): ObservationCertaintyTransition {

    assertV1(
      generationKey,
    );

    const distance =
      ObservationCertaintyCatalogV1
        .distanceInStages(
          previousCertainty,
          newCertainty,
        );

    if (
      distance <
      0
    ) {
      throw new RangeError(
        `Observation certainty cannot regress from ${previousCertainty.name} to ${newCertainty.name}.`,
      );
    }

    if (
      distance >
      1
    ) {
      throw new RangeError(
        `Observation certainty cannot skip stages from ${previousCertainty.name} to ${newCertainty.name}.`,
      );
    }

    return new ObservationCertaintyTransition(
      previousCertainty,
      newCertainty,
    );
  }

  static advance(
    generationKey:
      UniverseGenerationKey,

    currentAssessment:
      ObservationCertaintyAssessment,
  ): ObservationCertaintyAssessment {

    assertV1(
      generationKey,
    );

    const next =
      ObservationCertaintyCatalogV1
        .nextCertainty(
          currentAssessment
            .certainty,
        );

    if (
      next ===
      null
    ) {
      return currentAssessment;
    }

    this.evaluateTransition(
      generationKey,
      currentAssessment
        .certainty,
      next,
    );

    return new ObservationCertaintyAssessment(
      next,
    );
  }
}

function assertV1(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}
