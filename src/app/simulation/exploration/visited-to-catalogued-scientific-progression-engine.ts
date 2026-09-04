import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryStateTransitionContractV1,
} from '../../domain/discovery/discovery-state-transition-contract';

import {
  ScientificCompleteness,
  evaluateScientificCompleteness,
} from '../../domain/discovery/scientific-completeness';

import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  type VisitedToCataloguedScientificProfile,
} from '../../domain/discovery/visited-to-catalogued-scientific-profile';

/**
 * Pure point-26.A.5 cataloguing assessment.
 *
 * The outcome is based exclusively on the persisted DiscoveryState and
 * observed ScientificEvidence. No PD balance/cost and no Ground Truth payload
 * are part of this result.
 */
export class VisitedToCataloguedScientificProgressionAssessment {

  constructor(
    readonly profileCode:
      string,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly completeness:
      ScientificCompleteness,

    readonly isEligible:
      boolean,

    readonly didAdvance:
      boolean,
  ) {

    DiscoveryStateTransitionContractV1
      .assertAllowed(
        stateBefore,
        stateAfter,
      );

    const expectedEligibility =
      stateBefore ===
      DiscoveryState.VISITED;

    if (
      isEligible !==
      expectedEligibility
    ) {
      throw new RangeError(
        'Point 26.A.5 cataloguing eligibility requires exactly VISITED.',
      );
    }

    const expectedAdvance =
      stateBefore ===
        DiscoveryState.VISITED &&
      stateAfter ===
        DiscoveryState.CATALOGUED;

    if (
      didAdvance !==
      expectedAdvance
    ) {
      throw new RangeError(
        'didAdvance must represent exactly VISITED -> CATALOGUED.',
      );
    }

    if (
      didAdvance &&
      !completeness.isComplete
    ) {
      throw new RangeError(
        'VISITED -> CATALOGUED requires complete point-26.A.5 scientific requirements.',
      );
    }

    Object.freeze(
      this,
    );
  }
}

/**
 * Point 26.A.5 scientific cataloguing policy.
 *
 * Rules:
 * - only VISITED is eligible to advance;
 * - every requirement from the object-specific profile must be satisfied;
 * - DISCOVERED cannot skip the VISITED milestone even with enough evidence;
 * - CATALOGUED/CONFIRMED remain idempotent and never regress;
 * - PD never enters the decision.
 */
export class VisitedToCataloguedScientificProgressionEngine {

  private constructor() {}

  static evaluate(
    currentState:
      DiscoveryStateValue,

    profile:
      VisitedToCataloguedScientificProfile,

    evidence:
      readonly ScientificEvidence[],
  ): VisitedToCataloguedScientificProgressionAssessment {

    const stateBefore =
      DiscoveryState
        .fromCode(
          currentState.code,
        );

    const completeness =
      evaluateScientificCompleteness(
        profile.requirements,
        evidence,
      );

    const isEligible =
      stateBefore ===
      DiscoveryState.VISITED;

    const stateAfter =
      isEligible &&
      completeness.isComplete
        ? DiscoveryState.CATALOGUED
        : stateBefore;

    return new VisitedToCataloguedScientificProgressionAssessment(
      profile.profileCode,
      stateBefore,
      stateAfter,
      completeness,
      isEligible,
      stateBefore ===
        DiscoveryState.VISITED &&
      stateAfter ===
        DiscoveryState.CATALOGUED,
    );
  }
}
