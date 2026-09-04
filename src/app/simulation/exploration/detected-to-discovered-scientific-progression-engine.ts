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
  type DetectedToDiscoveredScientificProfile,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  type ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

/**
 * Pure point-26.A.3 assessment.
 *
 * This result contains observed-knowledge state only. There is deliberately no
 * PD balance/cost and no physical Ground Truth payload.
 */
export class DetectedToDiscoveredScientificProgressionAssessment {

  constructor(
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

    if (
      didAdvance !==
      (
        stateBefore.code ===
          DiscoveryState.DETECTED.code &&
        stateAfter.code ===
          DiscoveryState.DISCOVERED.code
      )
    ) {
      throw new RangeError(
        'didAdvance must represent exactly DETECTED -> DISCOVERED.',
      );
    }

    if (
      didAdvance &&
      !completeness.isComplete
    ) {
      throw new RangeError(
        'DETECTED -> DISCOVERED requires complete point-26.A.3 scientific evidence.',
      );
    }

    Object.freeze(
      this,
    );
  }
}

/**
 * Point 26.A.3 scientific progression engine.
 *
 * It is intentionally generic across target types. Point 26.A.7 supplies the
 * first concrete STELLAR_SYSTEM thresholds, while this engine owns the common
 * rule that a DETECTED object can only become DISCOVERED after evidence has
 * resolved nature, identity and basic architecture.
 */
export class DetectedToDiscoveredScientificProgressionEngine {

  private constructor() {}

  static evaluate(
    currentState:
      DiscoveryStateValue,

    profile:
      DetectedToDiscoveredScientificProfile,

    evidence:
      readonly ScientificEvidence[],
  ): DetectedToDiscoveredScientificProgressionAssessment {

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
      DiscoveryState.DETECTED;

    const stateAfter =
      isEligible &&
      completeness.isComplete
        ? DiscoveryState.DISCOVERED
        : stateBefore;

    return new DetectedToDiscoveredScientificProgressionAssessment(
      stateBefore,
      stateAfter,
      completeness,
      isEligible,
      stateAfter ===
        DiscoveryState.DISCOVERED &&
      stateBefore ===
        DiscoveryState.DETECTED,
    );
  }
}
