import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

/**
 * Scientific dimensions that must be resolved before a DETECTED target may
 * become DISCOVERED under point 26.A.3.
 *
 * The dimension names are generic on purpose. Concrete object profiles (the
 * first one will be STELLAR_SYSTEM in point 26.A.7) provide the numerical
 * quality/uncertainty thresholds without duplicating progression logic.
 */
export const DetectedToDiscoveredScientificDimension =
  Object.freeze({
    NATURE:
      'NATURE',

    IDENTITY:
      'IDENTITY',

    BASIC_ARCHITECTURE:
      'BASIC_ARCHITECTURE',
  } as const);

export type DetectedToDiscoveredScientificDimensionCode =
  typeof DetectedToDiscoveredScientificDimension[
    keyof typeof DetectedToDiscoveredScientificDimension
  ];

export interface DetectedToDiscoveredScientificProfileInput {
  readonly nature:
    ScientificCompletenessRequirement;

  readonly identity:
    ScientificCompletenessRequirement;

  readonly basicArchitecture:
    ScientificCompletenessRequirement;
}

/**
 * Generic point-26.A.3 discovery threshold.
 *
 * A profile must explicitly resolve all three concepts named by the roadmap:
 * nature, identity and basic architecture. The profile contains no Ground
 * Truth and no Discovery Points. It only delegates scientific sufficiency to
 * the point-26.A.2 ScientificCompleteness requirements.
 */
export class DetectedToDiscoveredScientificProfile {

  readonly requirements:
    readonly ScientificCompletenessRequirement[];

  constructor(
    input:
      DetectedToDiscoveredScientificProfileInput,
  ) {

    assertRequirementDimension(
      input.nature,
      DetectedToDiscoveredScientificDimension
        .NATURE,
      'nature',
    );

    assertRequirementDimension(
      input.identity,
      DetectedToDiscoveredScientificDimension
        .IDENTITY,
      'identity',
    );

    assertRequirementDimension(
      input.basicArchitecture,
      DetectedToDiscoveredScientificDimension
        .BASIC_ARCHITECTURE,
      'basicArchitecture',
    );

    this.requirements =
      Object.freeze([
        input.nature,
        input.identity,
        input.basicArchitecture,
      ]);

    Object.freeze(
      this,
    );
  }
}

function assertRequirementDimension(
  requirement:
    ScientificCompletenessRequirement,

  expected:
    DetectedToDiscoveredScientificDimensionCode,

  propertyName:
    string,
): void {

  if (
    requirement.dimensionCode !==
    expected
  ) {
    throw new RangeError(
      `${propertyName} must use ScientificCompleteness dimension ${expected}, got ${requirement.dimensionCode}.`,
    );
  }
}
