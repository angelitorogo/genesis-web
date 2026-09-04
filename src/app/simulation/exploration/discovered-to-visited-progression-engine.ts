import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryStateTransitionContractV1,
} from '../../domain/discovery/discovery-state-transition-contract';

import {
  DiscoveredToVisitedEntry,
  type DiscoveredToVisitedEntryKindValue,
} from '../../domain/discovery/discovered-to-visited-entry';

/**
 * Pure point-26.A.4 interaction assessment.
 *
 * The result deliberately contains no Ground Truth, no ScientificEvidence and
 * no Discovery Point balance. VISITED is an interaction milestone only.
 */
export class DiscoveredToVisitedProgressionAssessment {

  constructor(
    readonly entryKind:
      DiscoveredToVisitedEntryKindValue,

    readonly stateBefore:
      DiscoveryStateValue,

    readonly stateAfter:
      DiscoveryStateValue,

    readonly isVisitEligible:
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
      stateBefore.code >=
      DiscoveryState.DISCOVERED.code;

    if (
      isVisitEligible !==
      expectedEligibility
    ) {
      throw new RangeError(
        'Point 26.A.4 visit eligibility must start exactly at DISCOVERED.',
      );
    }

    const expectedAdvance =
      stateBefore ===
        DiscoveryState.DISCOVERED &&
      stateAfter ===
        DiscoveryState.VISITED;

    if (
      didAdvance !==
      expectedAdvance
    ) {
      throw new RangeError(
        'didAdvance must represent exactly DISCOVERED -> VISITED.',
      );
    }

    Object.freeze(
      this,
    );
  }
}

/**
 * Point 26.A.4 progression policy.
 *
 * Rules:
 * - UNKNOWN cannot be entered because no observed target exists;
 * - DETECTED may still have an unresolved/read-only route, but entering it does
 *   not count as a scientific visit and therefore remains DETECTED;
 * - the first valid detailed entry at DISCOVERED advances exactly to VISITED;
 * - later entries are idempotent and never regress CATALOGUED/CONFIRMED;
 * - no extra disclosure is produced by this engine.
 */
export class DiscoveredToVisitedProgressionEngine {

  private constructor() {}

  static evaluate(
    currentState:
      DiscoveryStateValue,

    entryKind:
      DiscoveredToVisitedEntryKindValue,
  ): DiscoveredToVisitedProgressionAssessment {

    const entry =
      new DiscoveredToVisitedEntry(
        entryKind,
      );

    const stateBefore =
      DiscoveryState
        .fromCode(
          currentState.code,
        );

    if (
      stateBefore ===
      DiscoveryState.UNKNOWN
    ) {
      throw new RangeError(
        'Point 26.A.4 cannot record a visit for an UNKNOWN target.',
      );
    }

    const isVisitEligible =
      stateBefore.code >=
      DiscoveryState.DISCOVERED.code;

    const stateAfter =
      stateBefore ===
        DiscoveryState.DISCOVERED
        ? DiscoveryState.VISITED
        : stateBefore;

    return new DiscoveredToVisitedProgressionAssessment(
      entry.kind,
      stateBefore,
      stateAfter,
      isVisitEligible,
      stateBefore ===
        DiscoveryState.DISCOVERED,
    );
  }
}
