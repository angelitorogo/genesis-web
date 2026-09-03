import {
  DiscoveryState,
  type DiscoveryStateValue,
} from './discovery-state';

/**
 * Classification of a requested DiscoveryState change under the official
 * point-26.A.1 progression contract.
 */
export enum DiscoveryStateTransitionKind {
  IDEMPOTENT =
    'IDEMPOTENT',

  ADVANCE =
    'ADVANCE',

  SKIP =
    'SKIP',

  REGRESSION =
    'REGRESSION',
}

export interface DiscoveryStateTransitionAssessment {
  readonly stateBefore:
    DiscoveryStateValue;

  readonly stateAfter:
    DiscoveryStateValue;

  readonly kind:
    DiscoveryStateTransitionKind;

  /**
   * True for an adjacent forward step or an idempotent retry.
   */
  readonly isAllowed:
    boolean;

  /**
   * True only when observed knowledge advances exactly one official step.
   */
  readonly advancesKnowledge:
    boolean;
}

const PROGRESSION:
  readonly DiscoveryStateValue[] =
    Object.freeze([
      DiscoveryState.UNKNOWN,
      DiscoveryState.DETECTED,
      DiscoveryState.DISCOVERED,
      DiscoveryState.VISITED,
      DiscoveryState.CATALOGUED,
      DiscoveryState.CONFIRMED,
    ]);

/**
 * Official V1 DiscoveryState transition contract introduced by point 26.A.1.
 *
 * The lifecycle is deliberately sequential and one-way:
 *
 * UNKNOWN -> DETECTED -> DISCOVERED -> VISITED -> CATALOGUED -> CONFIRMED
 *
 * Rules:
 * - advancing knowledge may move exactly one step at a time;
 * - repeating the current state is an allowed idempotent no-op;
 * - forward skips are forbidden;
 * - regressions are forbidden;
 * - CONFIRMED is terminal for knowledge advancement;
 * - this contract only defines lifecycle legality. The scientific evidence,
 *   observation/instrument requirements and persistence orchestration belong to
 *   points 26.A.2-26.A.9.
 *
 * UNKNOWN remains the absence of persisted observed knowledge. This class does
 * not change that persistence rule and never materializes Ground Truth.
 */
export class DiscoveryStateTransitionContractV1 {

  static readonly progression =
    PROGRESSION;

  private constructor() {}

  static nextOrNull(
    state:
      DiscoveryStateValue,
  ): DiscoveryStateValue | null {

    const canonical =
      canonicalState(
        state,
      );

    const index =
      PROGRESSION
        .indexOf(
          canonical,
        );

    if (
      index <
      0
    ) {
      throw new RangeError(
        `DiscoveryState code ${canonical.code} is outside the point-26.A.1 progression contract.`,
      );
    }

    return (
      PROGRESSION[
        index +
          1
      ] ??
      null
    );
  }

  static assess(
    stateBefore:
      DiscoveryStateValue,

    stateAfter:
      DiscoveryStateValue,
  ): DiscoveryStateTransitionAssessment {

    const canonicalBefore =
      canonicalState(
        stateBefore,
      );

    const canonicalAfter =
      canonicalState(
        stateAfter,
      );

    const beforeIndex =
      progressionIndex(
        canonicalBefore,
      );

    const afterIndex =
      progressionIndex(
        canonicalAfter,
      );

    const delta =
      afterIndex -
      beforeIndex;

    let kind:
      DiscoveryStateTransitionKind;

    if (
      delta ===
      0
    ) {
      kind =
        DiscoveryStateTransitionKind
          .IDEMPOTENT;
    } else if (
      delta ===
      1
    ) {
      kind =
        DiscoveryStateTransitionKind
          .ADVANCE;
    } else if (
      delta >
      1
    ) {
      kind =
        DiscoveryStateTransitionKind
          .SKIP;
    } else {
      kind =
        DiscoveryStateTransitionKind
          .REGRESSION;
    }

    return Object.freeze({
      stateBefore:
        canonicalBefore,

      stateAfter:
        canonicalAfter,

      kind,

      isAllowed:
        kind ===
          DiscoveryStateTransitionKind
            .IDEMPOTENT ||
        kind ===
          DiscoveryStateTransitionKind
            .ADVANCE,

      advancesKnowledge:
        kind ===
        DiscoveryStateTransitionKind
          .ADVANCE,
    });
  }

  static isAllowed(
    stateBefore:
      DiscoveryStateValue,

    stateAfter:
      DiscoveryStateValue,
  ): boolean {

    return this
      .assess(
        stateBefore,
        stateAfter,
      )
      .isAllowed;
  }

  static assertAllowed(
    stateBefore:
      DiscoveryStateValue,

    stateAfter:
      DiscoveryStateValue,
  ): void {

    const assessment =
      this
        .assess(
          stateBefore,
          stateAfter,
        );

    if (
      assessment.isAllowed
    ) {
      return;
    }

    throw new RangeError(
      `DiscoveryState transition ${assessment.stateBefore.code} -> ${assessment.stateAfter.code} is not allowed by point 26.A.1 (${assessment.kind}).`,
    );
  }
}

function canonicalState(
  state:
    DiscoveryStateValue,
): DiscoveryStateValue {

  return DiscoveryState
    .fromCode(
      state.code,
    );
}

function progressionIndex(
  state:
    DiscoveryStateValue,
): number {

  const index =
    PROGRESSION
      .indexOf(
        state,
      );

  if (
    index <
    0
  ) {
    throw new RangeError(
      `DiscoveryState code ${state.code} is outside the point-26.A.1 progression contract.`,
    );
  }

  return index;
}
