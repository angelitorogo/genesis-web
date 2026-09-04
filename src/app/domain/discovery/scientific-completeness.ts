import {
  type ScientificEvidence,
} from './scientific-evidence';

/**
 * One scientific dimension required by an object-specific profile.
 *
 * Point 26.A.2 only defines the generic contract. Concrete dimensions and
 * thresholds for STELLAR_SYSTEM are intentionally deferred to 26.A.7.
 */
export class ScientificCompletenessRequirement {

  readonly dimensionCode:
    string;

  readonly weight:
    number;

  readonly minimumEvidenceCount:
    number;

  readonly minimumIndependentSources:
    number;

  readonly minimumQuality01:
    number;

  readonly maximumUncertainty01:
    number;

  constructor(
    input:
      ScientificCompletenessRequirementInput,
  ) {

    this.dimensionCode =
      requireCode(
        input.dimensionCode,
      );

    this.weight =
      requirePositiveFinite(
        input.weight,
        'weight',
      );

    this.minimumEvidenceCount =
      requirePositiveSafeInteger(
        input.minimumEvidenceCount,
        'minimumEvidenceCount',
      );

    this.minimumIndependentSources =
      requirePositiveSafeInteger(
        input.minimumIndependentSources,
        'minimumIndependentSources',
      );

    if (
      this.minimumIndependentSources >
      this.minimumEvidenceCount
    ) {
      throw new RangeError(
        'minimumIndependentSources cannot exceed minimumEvidenceCount.',
      );
    }

    this.minimumQuality01 =
      requireUnitInterval(
        input.minimumQuality01,
        'minimumQuality01',
      );

    this.maximumUncertainty01 =
      requireUnitInterval(
        input.maximumUncertainty01,
        'maximumUncertainty01',
      );

    Object.freeze(
      this,
    );
  }
}

export interface ScientificCompletenessRequirementInput {
  readonly dimensionCode:
    string;

  readonly weight:
    number;

  readonly minimumEvidenceCount:
    number;

  readonly minimumIndependentSources:
    number;

  readonly minimumQuality01:
    number;

  readonly maximumUncertainty01:
    number;
}

export interface ScientificCompletenessRequirementResult {
  readonly requirement:
    ScientificCompletenessRequirement;

  readonly qualifyingEvidenceCount:
    number;

  readonly independentSourceCount:
    number;

  readonly isSatisfied:
    boolean;
}

/**
 * Authoritative scientific completeness result.
 *
 * It intentionally exposes counts/weights instead of a persisted percentage.
 * Any 0-100 value shown by presentation must be derived from this result and
 * must never become a second source of truth.
 */
export class ScientificCompleteness {

  readonly requirements:
    readonly ScientificCompletenessRequirementResult[];

  readonly satisfiedRequirementCount:
    number;

  readonly totalRequirementCount:
    number;

  readonly satisfiedWeight:
    number;

  readonly totalWeight:
    number;

  readonly isComplete:
    boolean;

  constructor(
    requirements:
      readonly ScientificCompletenessRequirementResult[],
  ) {

    if (
      requirements.length ===
      0
    ) {
      throw new RangeError(
        'ScientificCompleteness requires at least one scientific requirement.',
      );
    }

    const codes =
      new Set<string>();

    for (
      const result
      of requirements
    ) {
      if (
        codes.has(
          result.requirement
            .dimensionCode,
        )
      ) {
        throw new RangeError(
          `Duplicate ScientificCompleteness dimension: ${result.requirement.dimensionCode}.`,
        );
      }

      codes.add(
        result.requirement
          .dimensionCode,
      );
    }

    this.requirements =
      Object.freeze([
        ...requirements,
      ]);

    this.satisfiedRequirementCount =
      requirements.filter(
        result =>
          result.isSatisfied,
      ).length;

    this.totalRequirementCount =
      requirements.length;

    this.satisfiedWeight =
      requirements.reduce(
        (
          sum,
          result,
        ) =>
          sum +
          (
            result.isSatisfied
              ? result.requirement.weight
              : 0
          ),
        0,
      );

    this.totalWeight =
      requirements.reduce(
        (
          sum,
          result,
        ) =>
          sum +
          result.requirement.weight,
        0,
      );

    this.isComplete =
      this.satisfiedRequirementCount ===
      this.totalRequirementCount;

    Object.freeze(
      this,
    );
  }
}

/**
 * Generic point-26.A.2 evaluator. Object-specific profiles only provide the
 * immutable requirement list; the evaluator never reads Ground Truth.
 */
export function evaluateScientificCompleteness(
  requirements:
    readonly ScientificCompletenessRequirement[],

  evidence:
    readonly ScientificEvidence[],
): ScientificCompleteness {

  if (
    requirements.length ===
    0
  ) {
    throw new RangeError(
      'At least one ScientificCompleteness requirement is required.',
    );
  }

  const evidenceIdentityCheck =
    new Set<string>();

  for (
    const item
    of evidence
  ) {
    if (
      evidenceIdentityCheck.has(
        item.identityKey,
      )
    ) {
      throw new RangeError(
        `Duplicate ScientificEvidence identity: ${item.identityKey}.`,
      );
    }

    evidenceIdentityCheck.add(
      item.identityKey,
    );
  }

  const duplicateCheck =
    new Set<string>();

  const results =
    requirements.map(
      requirement => {
        if (
          duplicateCheck.has(
            requirement.dimensionCode,
          )
        ) {
          throw new RangeError(
            `Duplicate ScientificCompleteness dimension: ${requirement.dimensionCode}.`,
          );
        }

        duplicateCheck.add(
          requirement.dimensionCode,
        );

        const qualifying =
          evidence.filter(
            item =>
              item.dimensionCode ===
                requirement.dimensionCode &&
              item.quality01 >=
                requirement.minimumQuality01 &&
              item.uncertainty01 <=
                requirement.maximumUncertainty01,
          );

        const independentSourceCount =
          new Set(
            qualifying.map(
              item =>
                item.independenceKey,
            ),
          ).size;

        return Object.freeze({
          requirement,

          qualifyingEvidenceCount:
            qualifying.length,

          independentSourceCount,

          isSatisfied:
            qualifying.length >=
              requirement.minimumEvidenceCount &&
            independentSourceCount >=
              requirement.minimumIndependentSources,
        });
      },
    );

  return new ScientificCompleteness(
    results,
  );
}

function requireCode(
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
      'dimensionCode must be a non-blank trimmed string.',
    );
  }

  return value;
}

function requirePositiveFinite(
  value:
    number,

  name:
    string,
): number {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <= 0
  ) {
    throw new RangeError(
      `${name} must be finite and greater than zero.`,
    );
  }

  return value;
}

function requirePositiveSafeInteger(
  value:
    number,

  name:
    string,
): number {

  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <= 0
  ) {
    throw new RangeError(
      `${name} must be a positive safe integer.`,
    );
  }

  return value;
}

function requireUnitInterval(
  value:
    number,

  name:
    string,
): number {

  if (
    !Number.isFinite(
      value,
    ) ||
    value < 0 ||
    value > 1
  ) {
    throw new RangeError(
      `${name} must be finite and inside [0, 1].`,
    );
  }

  return value;
}
