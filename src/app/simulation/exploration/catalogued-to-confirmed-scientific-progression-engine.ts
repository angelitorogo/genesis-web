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
  type CataloguedToConfirmedScientificProfile,
} from '../../domain/discovery/catalogued-to-confirmed-scientific-profile';

/**
 * Pure point-26.A.6 confirmation assessment.
 *
 * The result carries both the former CATALOGUED baseline assessment and the
 * stronger confirmation assessment so callers can explain why confirmation is
 * still blocked without inventing a separate persisted percentage.
 */
export class CataloguedToConfirmedScientificProgressionAssessment {

  constructor(
    readonly profileCode:
      string,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly cataloguedBaselineCompleteness:
      ScientificCompleteness,

    readonly confirmationCompleteness:
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
      DiscoveryState.CATALOGUED;

    if (
      isEligible !==
      expectedEligibility
    ) {
      throw new RangeError(
        'Point 26.A.6 confirmation eligibility requires exactly CATALOGUED.',
      );
    }

    const expectedAdvance =
      stateBefore ===
        DiscoveryState.CATALOGUED &&
      stateAfter ===
        DiscoveryState.CONFIRMED;

    if (
      didAdvance !==
      expectedAdvance
    ) {
      throw new RangeError(
        'didAdvance must represent exactly CATALOGUED -> CONFIRMED.',
      );
    }

    if (
      didAdvance &&
      (
        !cataloguedBaselineCompleteness
          .isComplete ||
        !confirmationCompleteness
          .isComplete
      )
    ) {
      throw new RangeError(
        'CATALOGUED -> CONFIRMED requires both the catalogued baseline and the stronger confirmation evidence to be complete.',
      );
    }

    Object.freeze(
      this,
    );
  }
}

/**
 * Point 26.A.6 scientific confirmation policy.
 *
 * Rules:
 * - only CATALOGUED is eligible to advance;
 * - confirmation requirements are guaranteed by the profile to demand
 *   additional/independent evidence and strictly lower uncertainty;
 * - earlier states cannot skip directly to CONFIRMED;
 * - CONFIRMED is terminal/idempotent;
 * - PD and Ground Truth never enter the decision.
 */
export class CataloguedToConfirmedScientificProgressionEngine {

  private constructor() {}

  static evaluate(
    currentState:
      DiscoveryStateValue,

    profile:
      CataloguedToConfirmedScientificProfile,

    evidence:
      readonly ScientificEvidence[],
  ): CataloguedToConfirmedScientificProgressionAssessment {

    const stateBefore =
      DiscoveryState
        .fromCode(
          currentState.code,
        );

    const cataloguedBaselineCompleteness =
      evaluateScientificCompleteness(
        profile.cataloguedBaselineRequirements,
        evidence,
      );

    const confirmationCompleteness =
      evaluateScientificCompleteness(
        profile.confirmationRequirements,
        evidence,
      );

    const isEligible =
      stateBefore ===
      DiscoveryState.CATALOGUED;

    const stateAfter =
      isEligible &&
      cataloguedBaselineCompleteness
        .isComplete &&
      confirmationCompleteness
        .isComplete
        ? DiscoveryState.CONFIRMED
        : stateBefore;

    return new CataloguedToConfirmedScientificProgressionAssessment(
      profile.profileCode,
      stateBefore,
      stateAfter,
      cataloguedBaselineCompleteness,
      confirmationCompleteness,
      isEligible,
      stateBefore ===
        DiscoveryState.CATALOGUED &&
      stateAfter ===
        DiscoveryState.CONFIRMED,
    );
  }
}
