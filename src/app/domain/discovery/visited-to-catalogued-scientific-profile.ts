import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

export interface VisitedToCataloguedScientificProfileInput {
  /**
   * Stable scientific profile identifier for one concrete object kind.
   *
   * Point 26.A.5 keeps the progression engine generic. Point 26.A.7 will
   * introduce the first concrete value, STELLAR_SYSTEM, without duplicating
   * the VISITED -> CATALOGUED policy.
   */
  readonly profileCode:
    string;

  /**
   * Minimum scientific requirements that must all be satisfied before the
   * object can be catalogued.
   */
  readonly requirements:
    readonly ScientificCompletenessRequirement[];
}

/**
 * Generic point-26.A.5 cataloguing profile.
 *
 * The profile contains only observed-knowledge thresholds. It intentionally
 * contains no Ground Truth values, no visual percentage and no Discovery Point
 * cost. Concrete object types provide immutable requirements through this
 * contract; the shared progression logic remains object-agnostic.
 */
export class VisitedToCataloguedScientificProfile {

  readonly profileCode:
    string;

  readonly requirements:
    readonly ScientificCompletenessRequirement[];

  constructor(
    input:
      VisitedToCataloguedScientificProfileInput,
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
        'Point 26.A.5 cataloguing profiles require at least one scientific requirement.',
      );
    }

    const dimensionCodes =
      new Set<string>();

    for (
      const requirement
      of input.requirements
    ) {
      if (
        dimensionCodes.has(
          requirement.dimensionCode,
        )
      ) {
        throw new RangeError(
          `Duplicate point-26.A.5 cataloguing dimension: ${requirement.dimensionCode}.`,
        );
      }

      dimensionCodes.add(
        requirement.dimensionCode,
      );
    }

    this.requirements =
      Object.freeze([
        ...input.requirements,
      ]);

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
