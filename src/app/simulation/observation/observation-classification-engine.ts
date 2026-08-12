import {
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  LocatedObservationObject,
  ObservationClassificationAssessment,
  type ObservationSubject,
  ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from '../../domain/observation/observation-classification';

import {
  ObservationClassificationCatalogV1,
} from './observation-classification-catalog';

/**
 * Pure V1 observational-classification bootstrap engine.
 *
 * Point 8.9 allows observed subjects to exist without a concrete scientific
 * classification.
 *
 * It deliberately does NOT:
 * - infer classification from ProceduralLocator class;
 * - resolve Ground Truth;
 * - create a TransientLocator;
 * - change DiscoveryTargetType;
 * - change DiscoveryState;
 * - change ObservationCertainty;
 * - change measurement uncertainty;
 * - change scientific completeness;
 * - execute/refactor point-8.7 actions;
 * - create coordinates, timestamps, measurements or history;
 * - persist transient candidates;
 * - use PRNG, Random, SHA, SeedDeriver, UUID or Clock.
 */
export class ObservationClassificationEngine {

  private constructor() {}

  static createUnclassified(
    subject:
      ObservationSubject,
  ): ObservationClassificationAssessment {

    if (
      subject
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this
        .createUnclassifiedV1(
          subject,
        );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${subject.generationKey.generatorVersion.code}.`,
    );
  }

  static createUnclassifiedObject(
    generationKey:
      UniverseGenerationKey,

    targetLocator:
      ProceduralLocator,
  ): ObservationClassificationAssessment {

    return this
      .createUnclassified(
        new LocatedObservationObject(
          generationKey,
          targetLocator,
        ),
      );
  }

  static createUnclassifiedTransient(
    generationKey:
      UniverseGenerationKey,

    candidateId:
      ObservationTransientCandidateId,
  ): ObservationClassificationAssessment {

    return this
      .createUnclassified(
        new ObservationTransientCandidate(
          generationKey,
          candidateId,
        ),
      );
  }

  private static createUnclassifiedV1(
    subject:
      ObservationSubject,
  ): ObservationClassificationAssessment {

    if (
      !(subject instanceof
        LocatedObservationObject) &&
      !(subject instanceof
        ObservationTransientCandidate)
    ) {
      throw new RangeError(
        'subject must be a canonical point-8.9 ObservationSubject.',
      );
    }

    return new ObservationClassificationAssessment(
      subject,
      ObservationClassificationCatalogV1
        .initialClassification,
    );
  }
}
