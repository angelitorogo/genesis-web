import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

export interface ScientificConfirmationRequirementInput {
  /**
   * Minimum requirement that represented scientifically sufficient knowledge
   * for the same dimension at CATALOGUED.
   */
  readonly cataloguedBaseline:
    ScientificCompletenessRequirement;

  /**
   * Stronger requirement that must be satisfied before CONFIRMED.
   */
  readonly confirmationRequirement:
    ScientificCompletenessRequirement;
}

/**
 * One point-26.A.6 confirmation rule for a scientific dimension.
 *
 * Confirmation is not merely "complete again". Compared with the catalogued
 * baseline, the confirmation requirement must:
 *
 * - refer to the same scientific dimension;
 * - require additional evidence and/or more independent sources;
 * - never weaken minimum evidence/source/quality thresholds;
 * - require a strictly lower maximum uncertainty.
 *
 * This makes reduced uncertainty and additional/independent evidence explicit
 * profile invariants rather than UI conventions.
 */
export class ScientificConfirmationRequirement {

  readonly cataloguedBaseline:
    ScientificCompletenessRequirement;

  readonly confirmationRequirement:
    ScientificCompletenessRequirement;

  constructor(
    input:
      ScientificConfirmationRequirementInput,
  ) {

    const baseline =
      input.cataloguedBaseline;

    const confirmation =
      input.confirmationRequirement;

    if (
      baseline.dimensionCode !==
      confirmation.dimensionCode
    ) {
      throw new RangeError(
        'Point 26.A.6 confirmation must strengthen the same scientific dimension as its catalogued baseline.',
      );
    }

    if (
      confirmation.minimumEvidenceCount <
        baseline.minimumEvidenceCount ||
      confirmation.minimumIndependentSources <
        baseline.minimumIndependentSources ||
      confirmation.minimumQuality01 <
        baseline.minimumQuality01
    ) {
      throw new RangeError(
        `Point 26.A.6 confirmation cannot weaken the CATALOGUED thresholds for ${baseline.dimensionCode}.`,
      );
    }

    const strengthensProvenance =
      confirmation.minimumEvidenceCount >
        baseline.minimumEvidenceCount ||
      confirmation.minimumIndependentSources >
        baseline.minimumIndependentSources;

    if (
      !strengthensProvenance
    ) {
      throw new RangeError(
        `Point 26.A.6 confirmation for ${baseline.dimensionCode} must require additional evidence or additional independent sources.`,
      );
    }

    if (
      confirmation.maximumUncertainty01 >=
      baseline.maximumUncertainty01
    ) {
      throw new RangeError(
        `Point 26.A.6 confirmation for ${baseline.dimensionCode} must require strictly lower uncertainty than CATALOGUED.`,
      );
    }

    this.cataloguedBaseline =
      baseline;

    this.confirmationRequirement =
      confirmation;

    Object.freeze(
      this,
    );
  }
}

export interface CataloguedToConfirmedScientificProfileInput {
  /**
   * Stable scientific profile identifier for one concrete object kind.
   * Point 26.A.7 will introduce the first real STELLAR_SYSTEM profile.
   */
  readonly profileCode:
    string;

  readonly requirements:
    readonly ScientificConfirmationRequirement[];
}

/**
 * Generic point-26.A.6 confirmation profile.
 *
 * The profile contains only observed-knowledge thresholds. It contains no
 * Ground Truth values, visual percentage, PD price or PD reward.
 */
export class CataloguedToConfirmedScientificProfile {

  readonly profileCode:
    string;

  readonly requirements:
    readonly ScientificConfirmationRequirement[];

  readonly cataloguedBaselineRequirements:
    readonly ScientificCompletenessRequirement[];

  readonly confirmationRequirements:
    readonly ScientificCompletenessRequirement[];

  constructor(
    input:
      CataloguedToConfirmedScientificProfileInput,
  ) {

    this.profileCode =
      requireProfileCode(
        input.profileCode,
      );

    if (
      input.requirements.length ===
      0
    ) {
      throw new RangeError(
        'Point 26.A.6 confirmation profiles require at least one scientific confirmation requirement.',
      );
    }

    const dimensionCodes =
      new Set<string>();

    for (
      const requirement
      of input.requirements
    ) {
      const dimensionCode =
        requirement
          .confirmationRequirement
          .dimensionCode;

      if (
        dimensionCodes.has(
          dimensionCode,
        )
      ) {
        throw new RangeError(
          `Duplicate point-26.A.6 confirmation dimension: ${dimensionCode}.`,
        );
      }

      dimensionCodes.add(
        dimensionCode,
      );
    }

    this.requirements =
      Object.freeze([
        ...input.requirements,
      ]);

    this.cataloguedBaselineRequirements =
      Object.freeze(
        this.requirements.map(
          requirement =>
            requirement.cataloguedBaseline,
        ),
      );

    this.confirmationRequirements =
      Object.freeze(
        this.requirements.map(
          requirement =>
            requirement.confirmationRequirement,
        ),
      );

    Object.freeze(
      this,
    );
  }
}

function requireProfileCode(
  value:
    string,
): string {

  if (
    typeof value !==
      'string' ||
    value.trim().length ===
      0 ||
    value !==
      value.trim()
  ) {
    throw new RangeError(
      'profileCode must be a non-blank trimmed string.',
    );
  }

  return value;
}
