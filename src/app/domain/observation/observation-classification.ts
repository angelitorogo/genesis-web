import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * The two kinds of observational subjects supported by point 8.9.
 *
 * OBJECT:
 * - backed by an existing ProceduralLocator.
 *
 * TRANSIENT:
 * - an observed candidate that deliberately has no ProceduralLocator yet.
 */
export enum ObservationSubjectKind {
  OBJECT =
    'OBJECT',

  TRANSIENT =
    'TRANSIENT',
}

/**
 * Stable V1 identity component for an unlocated transient candidate.
 *
 * Its complete identity is:
 *
 * UniverseGenerationKey + ObservationTransientCandidateId.
 */
export class ObservationTransientCandidateId {

  constructor(
    readonly index:
      bigint,
  ) {
    if (
      typeof index !==
        'bigint' ||
      index <
        0n ||
      index >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `index must be a non-negative signed Long: ${String(index)}.`,
      );
    }
  }
}

/**
 * Observational subject backed by one of the existing procedural locators.
 *
 * Point 8.9 does not resolve the locator against Ground Truth and does not
 * infer a physical taxonomy from the locator class.
 */
export class LocatedObservationObject {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly targetLocator:
      ProceduralLocator,
  ) {}

  get kind():
    ObservationSubjectKind {

    return ObservationSubjectKind
      .OBJECT;
  }
}

/**
 * Observational transient candidate that intentionally has no ProceduralLocator.
 *
 * Point 8.9 also gives it no:
 * - coordinates;
 * - timestamps;
 * - measurements;
 * - physical taxonomy.
 */
export class ObservationTransientCandidate {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly candidateId:
      ObservationTransientCandidateId,
  ) {}

  get kind():
    ObservationSubjectKind {

    return ObservationSubjectKind
      .TRANSIENT;
  }
}

/**
 * Closed Web adaptation of Android's sealed ObservationSubject interface.
 */
export type ObservationSubject =
  LocatedObservationObject |
  ObservationTransientCandidate;

/**
 * Point-8.9 V1 scientific classification.
 *
 * V1 deliberately exposes exactly one explicit classification:
 * Unclassified.
 *
 * It is not represented by null and it is not represented by a string.
 * No physical astronomical taxonomy is introduced at this point.
 */
export class ObservationClassification {

  static readonly Unclassified =
    Object.freeze(
      new ObservationClassification(),
    );

  private constructor() {}
}

/**
 * Classification projection for one observational subject.
 *
 * Observation classification is deliberately independent from:
 * - DiscoveryState;
 * - ObservationCertainty;
 * - measurement uncertainty;
 * - scientific completeness.
 */
export class ObservationClassificationAssessment {

  constructor(
    readonly subject:
      ObservationSubject,

    readonly classification:
      ObservationClassification,
  ) {
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

    if (
      classification !==
      ObservationClassification
        .Unclassified
    ) {
      throw new RangeError(
        'classification must be a canonical point-8.9 ObservationClassification.',
      );
    }
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .subject
      .generationKey;
  }

  get subjectKind():
    ObservationSubjectKind {

    return this
      .subject
      .kind;
  }

  get isUnclassified():
    boolean {

    return this
      .classification ===
      ObservationClassification
        .Unclassified;
  }
}
