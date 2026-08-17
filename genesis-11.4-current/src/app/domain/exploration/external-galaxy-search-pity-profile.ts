import {
  ExplorationBalanceV1,
} from './exploration-balance';

import {
  ExternalGalaxyDetectionProbabilityProfile,
} from './external-galaxy-detection-probability-profile';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * V1 pity stage for future external-galaxy searches.
 */
export enum ExternalGalaxySearchPityStage {
  NONE =
    'NONE',

  ASSIST_I =
    'ASSIST_I',

  ASSIST_II =
    'ASSIST_II',

  ASSIST_III =
    'ASSIST_III',

  ASSIST_IV =
    'ASSIST_IV',

  HARD_PITY =
    'HARD_PITY',
}

/**
 * Immutable pity profile for the NEXT future external-galaxy search.
 *
 * The base probability always comes from point 7.4. Point 7.5 only recovers
 * part of the remaining distance from that base probability to 1.0.
 *
 * Point 7.9 obtains HARD_PITY threshold/recovery invariants exclusively from
 * ExplorationBalanceV1.
 *
 * This model does not execute a search, perform a random draw, increment or
 * reset the failure streak, unlock a galaxy or persist anything.
 */
export class ExternalGalaxySearchPityProfile {

  constructor(
    readonly baseDetectionProfile:
      ExternalGalaxyDetectionProbabilityProfile,

    readonly consecutiveFailedSearches:
      bigint,

    readonly pityStage:
      ExternalGalaxySearchPityStage,

    readonly pityRecoveryFraction:
      number,

    readonly effectiveProbabilityPerNextSearch:
      number,
  ) {
    if (
      consecutiveFailedSearches <
        0n ||
      consecutiveFailedSearches >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `consecutiveFailedSearches must be a non-negative signed Long: ${consecutiveFailedSearches}.`,
      );
    }

    if (
      !Object.values(
        ExternalGalaxySearchPityStage,
      ).includes(
        pityStage,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxySearchPityStage: ${String(pityStage)}.`,
      );
    }

    assertNormalized(
      pityRecoveryFraction,
      'pityRecoveryFraction',
    );

    assertNormalized(
      effectiveProbabilityPerNextSearch,
      'effectiveProbabilityPerNextSearch',
    );

    if (
      effectiveProbabilityPerNextSearch <
      this.baseProbabilityPerFutureSearch
    ) {
      throw new RangeError(
        'effectiveProbabilityPerNextSearch cannot be lower than the base future-search probability.',
      );
    }

    if (
      pityStage ===
      ExternalGalaxySearchPityStage.NONE
    ) {
      if (
        consecutiveFailedSearches !==
          0n ||
        pityRecoveryFraction !==
          0.0 ||
        effectiveProbabilityPerNextSearch !==
          this.baseProbabilityPerFutureSearch
      ) {
        throw new RangeError(
          'NONE pity stage requires 0 failures, 0 recovery and effective probability equal to base probability.',
        );
      }
    }

    if (
      pityStage ===
      ExternalGalaxySearchPityStage.HARD_PITY
    ) {
      if (
        consecutiveFailedSearches <
          ExplorationBalanceV1
            .hardPityFailureThreshold ||
        pityRecoveryFraction !==
          ExplorationBalanceV1
            .hardPityRecoveryFraction ||
        effectiveProbabilityPerNextSearch !==
          1.0
      ) {
        throw new RangeError(
          [
            'HARD_PITY requires at least',
            `${ExplorationBalanceV1.hardPityFailureThreshold}`,
            'consecutive failures, the canonical hard-pity recovery fraction',
            `${ExplorationBalanceV1.hardPityRecoveryFraction}`,
            'and guaranteed effective probability 1.0.',
          ].join(
            ' ',
          ),
        );
      }
    }
  }

  get globalDiscoveryPoints():
    bigint {

    return this
      .baseDetectionProfile
      .globalDiscoveryPoints;
  }

  get baseProbabilityPerFutureSearch():
    number {

    return this
      .baseDetectionProfile
      .probabilityPerFutureSearch;
  }

  get hasPityBoost():
    boolean {

    return this.pityStage !==
      ExternalGalaxySearchPityStage.NONE;
  }

  get isGuaranteedNextSearch():
    boolean {

    return this.pityStage ===
      ExternalGalaxySearchPityStage.HARD_PITY;
  }
}

function assertNormalized(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0.0 ||
    value >
      1.0
  ) {
    throw new RangeError(
      `${propertyName} must be finite and in range [0, 1]: ${value}.`,
    );
  }
}
