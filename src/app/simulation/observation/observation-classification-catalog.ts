import {
  ObservationClassification,
  ObservationSubjectKind,
} from '../../domain/observation/observation-classification';

const SUPPORTED_SUBJECT_KINDS:
  readonly ObservationSubjectKind[] =
  Object.freeze([
    ObservationSubjectKind
      .OBJECT,

    ObservationSubjectKind
      .TRANSIENT,
  ]);

const SUPPORTED_CLASSIFICATIONS:
  readonly ObservationClassification[] =
  Object.freeze([
    ObservationClassification
      .Unclassified,
  ]);

validateV1ClassificationCatalog();

/**
 * Frozen V1 observational-classification catalog.
 *
 * Point 8.9 deliberately defines:
 * - exactly two subject kinds: OBJECT and TRANSIENT;
 * - exactly one classification: Unclassified.
 *
 * No physical astronomical taxonomy exists yet.
 */
export class ObservationClassificationCatalogV1 {

  private constructor() {}

  static readonly supportedSubjectKinds =
    SUPPORTED_SUBJECT_KINDS;

  static readonly supportedClassifications =
    SUPPORTED_CLASSIFICATIONS;

  static readonly initialClassification =
    ObservationClassification
      .Unclassified;
}

function validateV1ClassificationCatalog():
  void {

  if (
    SUPPORTED_SUBJECT_KINDS.length !==
      2
  ) {
    throw new Error(
      'V1 observation classification must support exactly two subject kinds.',
    );
  }

  if (
    SUPPORTED_SUBJECT_KINDS[
      0
    ] !==
      ObservationSubjectKind
        .OBJECT ||
    SUPPORTED_SUBJECT_KINDS[
      1
    ] !==
      ObservationSubjectKind
        .TRANSIENT
  ) {
    throw new Error(
      'V1 observation subject kinds must be exactly OBJECT then TRANSIENT.',
    );
  }

  if (
    SUPPORTED_CLASSIFICATIONS.length !==
      1 ||
    SUPPORTED_CLASSIFICATIONS[
      0
    ] !==
      ObservationClassification
        .Unclassified
  ) {
    throw new Error(
      'V1 observation classification must contain only Unclassified.',
    );
  }
}
