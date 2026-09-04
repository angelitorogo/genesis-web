import {
  type CataloguedToConfirmedScientificProfile,
} from './catalogued-to-confirmed-scientific-profile';

import {
  type DetectedToDiscoveredScientificProfile,
} from './detected-to-discovered-scientific-profile';

import {
  type ScientificCompletenessRequirement,
} from './scientific-completeness';

import {
  type VisitedToCataloguedScientificProfile,
} from './visited-to-catalogued-scientific-profile';

export interface ScientificObjectProgressionProfileInput {
  readonly profileCode:
    string;

  readonly discoveryProfile:
    DetectedToDiscoveredScientificProfile;

  readonly cataloguingProfile:
    VisitedToCataloguedScientificProfile;

  readonly confirmationProfile:
    CataloguedToConfirmedScientificProfile;
}

/**
 * Coherent object-specific scientific progression profile introduced by
 * point 26.A.7.
 *
 * The transition engines remain generic. This class only groups the three
 * scientific threshold sets that one concrete object type supplies to them:
 *
 * - DETECTED -> DISCOVERED;
 * - VISITED -> CATALOGUED;
 * - CATALOGUED -> CONFIRMED.
 *
 * It also prevents profile drift: the CATALOGUED baseline embedded in the
 * confirmation profile must be exactly the same requirement set used by the
 * cataloguing profile. Future PLANET, MOON, MINOR_BODY and GALACTIC_OBJECT
 * profiles can therefore reuse the same progression engines without copying
 * lifecycle logic.
 */
export class ScientificObjectProgressionProfile {

  readonly profileCode:
    string;

  readonly discoveryProfile:
    DetectedToDiscoveredScientificProfile;

  readonly cataloguingProfile:
    VisitedToCataloguedScientificProfile;

  readonly confirmationProfile:
    CataloguedToConfirmedScientificProfile;

  constructor(
    input:
      ScientificObjectProgressionProfileInput,
  ) {

    this.profileCode =
      requireProfileCode(
        input.profileCode,
      );

    if (
      input.cataloguingProfile.profileCode !==
      this.profileCode
    ) {
      throw new RangeError(
        'ScientificObjectProgressionProfile cataloguing profileCode must match the object profileCode.',
      );
    }

    if (
      input.confirmationProfile.profileCode !==
      this.profileCode
    ) {
      throw new RangeError(
        'ScientificObjectProgressionProfile confirmation profileCode must match the object profileCode.',
      );
    }

    assertEquivalentRequirementSets(
      input.cataloguingProfile.requirements,
      input.confirmationProfile
        .cataloguedBaselineRequirements,
    );

    this.discoveryProfile =
      input.discoveryProfile;

    this.cataloguingProfile =
      input.cataloguingProfile;

    this.confirmationProfile =
      input.confirmationProfile;

    Object.freeze(
      this,
    );
  }
}

function assertEquivalentRequirementSets(
  cataloguing:
    readonly ScientificCompletenessRequirement[],

  confirmationBaseline:
    readonly ScientificCompletenessRequirement[],
): void {

  if (
    cataloguing.length !==
    confirmationBaseline.length
  ) {
    throw new RangeError(
      'ScientificObjectProgressionProfile confirmation baseline must contain exactly the cataloguing requirements.',
    );
  }

  const confirmationByDimension =
    new Map(
      confirmationBaseline.map(
        requirement => [
          requirement.dimensionCode,
          requirement,
        ] as const,
      ),
    );

  for (
    const requirement
    of cataloguing
  ) {
    const baseline =
      confirmationByDimension.get(
        requirement.dimensionCode,
      );

    if (
      baseline ===
        undefined ||
      !sameRequirement(
        requirement,
        baseline,
      )
    ) {
      throw new RangeError(
        `ScientificObjectProgressionProfile confirmation baseline must exactly match cataloguing dimension ${requirement.dimensionCode}.`,
      );
    }
  }
}

function sameRequirement(
  left:
    ScientificCompletenessRequirement,

  right:
    ScientificCompletenessRequirement,
): boolean {

  return (
    left.dimensionCode ===
      right.dimensionCode &&
    left.weight ===
      right.weight &&
    left.minimumEvidenceCount ===
      right.minimumEvidenceCount &&
    left.minimumIndependentSources ===
      right.minimumIndependentSources &&
    left.minimumQuality01 ===
      right.minimumQuality01 &&
    left.maximumUncertainty01 ===
      right.maximumUncertainty01
  );
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
