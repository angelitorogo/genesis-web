import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  DiscoveryRewardReason,
} from './discovery-reward-reason';

import {
  ExternalGalaxyDetectionProbabilityTier,
} from './external-galaxy-detection-probability-profile';

import {
  type ExternalGalaxySearchPityStage,
} from './external-galaxy-search-pity-profile';

import {
  type ExplorationDiscoveryTargetType,
} from './exploration-progress-result';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

const VALID_PITY_STAGE_NAMES =
  Object.freeze([
    'NONE',
    'ASSIST_I',
    'ASSIST_II',
    'ASSIST_III',
    'ASSIST_IV',
    'HARD_PITY',
  ] as const);

type ExternalGalaxySearchPityStageName =
  typeof VALID_PITY_STAGE_NAMES[number];

/**
 * Frozen V1 balance row for base Discovery Points by procedural target type.
 */
export class DiscoveryTargetPointBalance {

  constructor(
    readonly targetType:
      ExplorationDiscoveryTargetType,

    readonly baseDiscoveryPoints:
      number,
  ) {
    if (
      !Number.isSafeInteger(
        baseDiscoveryPoints,
      ) ||
      baseDiscoveryPoints <=
        0
    ) {
      throw new RangeError(
        'baseDiscoveryPoints must be a positive safe integer.',
      );
    }
  }
}

/**
 * Frozen V1 balance row for one DiscoveryState milestone.
 */
export class DiscoveryStateMilestoneBalance {

  constructor(
    readonly state:
      DiscoveryStateValue,

    readonly multiplier:
      number,
  ) {
    if (
      !Number.isSafeInteger(
        multiplier,
      ) ||
      multiplier <
        0
    ) {
      throw new RangeError(
        'multiplier must be a non-negative safe integer.',
      );
    }

    if (
      state.code ===
        DiscoveryState.UNKNOWN.code
    ) {
      if (
        multiplier !==
        0
      ) {
        throw new RangeError(
          'UNKNOWN milestone multiplier must be 0.',
        );
      }
    } else if (
      multiplier <=
      0
    ) {
      throw new RangeError(
        'Known DiscoveryState milestone multipliers must be positive.',
      );
    }
  }
}

/**
 * Frozen V1 differentiated-reward balance row.
 */
export class DiscoveryRewardReasonBalance {

  readonly compatibleTargetTypes:
    readonly ExplorationDiscoveryTargetType[];

  constructor(
    readonly reason:
      DiscoveryRewardReason,

    readonly triggerState:
      DiscoveryStateValue,

    readonly bonusDiscoveryPoints:
      number,

    compatibleTargetTypes:
      readonly ExplorationDiscoveryTargetType[],
  ) {
    if (
      triggerState.code ===
      DiscoveryState.UNKNOWN.code
    ) {
      throw new RangeError(
        'Reward triggerState cannot be UNKNOWN.',
      );
    }

    if (
      !Number.isSafeInteger(
        bonusDiscoveryPoints,
      ) ||
      bonusDiscoveryPoints <=
        0
    ) {
      throw new RangeError(
        'bonusDiscoveryPoints must be a positive safe integer.',
      );
    }

    if (
      compatibleTargetTypes.length ===
      0
    ) {
      throw new RangeError(
        'compatibleTargetTypes cannot be empty.',
      );
    }

    const canonicalTypes =
      compatibleTargetTypes.map(
        (
          targetType,
        ) =>
          DiscoveryTargetType
            .fromCode(
              targetType.code,
            ),
      );

    const codes =
      canonicalTypes.map(
        (
          targetType,
        ) =>
          targetType.code,
      );

    if (
      new Set(
        codes,
      ).size !==
      codes.length
    ) {
      throw new RangeError(
        'compatibleTargetTypes cannot contain duplicates.',
      );
    }

    this.compatibleTargetTypes =
      Object.freeze(
        canonicalTypes,
      );
  }
}

/**
 * Frozen V1 base-probability balance row for external-galaxy detection.
 */
export class ExternalGalaxyDetectionTierBalance {

  constructor(
    readonly tier:
      ExternalGalaxyDetectionProbabilityTier,

    readonly minimumGlobalDiscoveryPoints:
      bigint,

    readonly probabilityPerFutureSearch:
      number,
  ) {
    assertNonNegativeSignedLong(
      minimumGlobalDiscoveryPoints,
      'minimumGlobalDiscoveryPoints',
    );

    assertNormalized(
      probabilityPerFutureSearch,
      'probabilityPerFutureSearch',
    );

    if (
      !Object.values(
        ExternalGalaxyDetectionProbabilityTier,
      ).includes(
        tier,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyDetectionProbabilityTier: ${String(tier)}.`,
      );
    }
  }
}

/**
 * Frozen V1 pity-stage balance row.
 *
 * The runtime stage import is deliberately avoided so
 * ExternalGalaxySearchPityProfile can consume ExplorationBalanceV1 without an
 * ES-module initialization cycle.
 */
export class ExternalGalaxyPityStageBalance {

  constructor(
    readonly stage:
      ExternalGalaxySearchPityStage,

    readonly minimumConsecutiveFailures:
      bigint,

    readonly recoveryFraction:
      number,
  ) {
    assertNonNegativeSignedLong(
      minimumConsecutiveFailures,
      'minimumConsecutiveFailures',
    );

    assertNormalized(
      recoveryFraction,
      'recoveryFraction',
    );

    if (
      !VALID_PITY_STAGE_NAMES
        .includes(
          String(
            stage,
          ) as
            ExternalGalaxySearchPityStageName,
        )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxySearchPityStage: ${String(stage)}.`,
      );
    }
  }
}

const ALL_TARGET_TYPES:
  readonly ExplorationDiscoveryTargetType[] =
  Object.freeze([
    DiscoveryTargetType.GALAXY,
    DiscoveryTargetType.SECTOR,
    DiscoveryTargetType.GALACTIC_OBJECT,
    DiscoveryTargetType.SYSTEM,
    DiscoveryTargetType.BODY,
    DiscoveryTargetType.CIVILIZATION,
  ]);

const DISCOVERY_TARGET_POINT_BALANCES:
  readonly DiscoveryTargetPointBalance[] =
  Object.freeze([
    new DiscoveryTargetPointBalance(
      DiscoveryTargetType.GALAXY,
      40,
    ),
    new DiscoveryTargetPointBalance(
      DiscoveryTargetType.SECTOR,
      2,
    ),
    new DiscoveryTargetPointBalance(
      DiscoveryTargetType.GALACTIC_OBJECT,
      12,
    ),
    new DiscoveryTargetPointBalance(
      DiscoveryTargetType.SYSTEM,
      6,
    ),
    new DiscoveryTargetPointBalance(
      DiscoveryTargetType.BODY,
      3,
    ),
    new DiscoveryTargetPointBalance(
      DiscoveryTargetType.CIVILIZATION,
      50,
    ),
  ]);

const DISCOVERY_STATE_MILESTONE_BALANCES:
  readonly DiscoveryStateMilestoneBalance[] =
  Object.freeze([
    new DiscoveryStateMilestoneBalance(
      DiscoveryState.UNKNOWN,
      0,
    ),
    new DiscoveryStateMilestoneBalance(
      DiscoveryState.DETECTED,
      1,
    ),
    new DiscoveryStateMilestoneBalance(
      DiscoveryState.DISCOVERED,
      2,
    ),
    new DiscoveryStateMilestoneBalance(
      DiscoveryState.VISITED,
      3,
    ),
    new DiscoveryStateMilestoneBalance(
      DiscoveryState.CATALOGUED,
      5,
    ),
    new DiscoveryStateMilestoneBalance(
      DiscoveryState.CONFIRMED,
      8,
    ),
  ]);

const DISCOVERY_REWARD_REASON_BALANCES:
  readonly DiscoveryRewardReasonBalance[] =
  Object.freeze([
    new DiscoveryRewardReasonBalance(
      DiscoveryRewardReason.SYSTEM_DISCOVERY,
      DiscoveryState.DISCOVERED,
      12,
      [
        DiscoveryTargetType.SYSTEM,
      ],
    ),
    new DiscoveryRewardReasonBalance(
      DiscoveryRewardReason.PLANET_DISCOVERY,
      DiscoveryState.DISCOVERED,
      6,
      [
        DiscoveryTargetType.BODY,
      ],
    ),
    new DiscoveryRewardReasonBalance(
      DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
      DiscoveryState.CONFIRMED,
      120,
      [
        DiscoveryTargetType.BODY,
      ],
    ),
    new DiscoveryRewardReasonBalance(
      DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
      DiscoveryState.CATALOGUED,
      60,
      [
        DiscoveryTargetType.GALACTIC_OBJECT,
      ],
    ),
    new DiscoveryRewardReasonBalance(
      DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
      DiscoveryState.CONFIRMED,
      180,
      ALL_TARGET_TYPES,
    ),
  ]);

/**
 * One external-galaxy search opportunity is unlocked for each new 100-PD
 * global progression bucket. The points are never spent.
 *
 * Opportunities accumulate: persistence records how many attempts were already
 * consumed and the runtime derives the remaining stock from total earned
 * opportunities minus consumed opportunities.
 */
const EXTERNAL_GALAXY_SEARCH_DISCOVERY_POINT_STEP =
  100n;

const EXTERNAL_GALAXY_DETECTION_TIER_BALANCES:
  readonly ExternalGalaxyDetectionTierBalance[] =
  Object.freeze([
    new ExternalGalaxyDetectionTierBalance(
      ExternalGalaxyDetectionProbabilityTier.BASELINE,
      0n,
      0.02,
    ),
    new ExternalGalaxyDetectionTierBalance(
      ExternalGalaxyDetectionProbabilityTier.ENHANCED,
      1_000n,
      0.05,
    ),
    new ExternalGalaxyDetectionTierBalance(
      ExternalGalaxyDetectionProbabilityTier.ADVANCED,
      2_500n,
      0.10,
    ),
    new ExternalGalaxyDetectionTierBalance(
      ExternalGalaxyDetectionProbabilityTier.DEEP,
      5_000n,
      0.18,
    ),
    new ExternalGalaxyDetectionTierBalance(
      ExternalGalaxyDetectionProbabilityTier.FRONTIER,
      10_000n,
      0.30,
    ),
  ]);

function pityStage(
  name:
    ExternalGalaxySearchPityStageName,
): ExternalGalaxySearchPityStage {

  return name as
    ExternalGalaxySearchPityStage;
}

const EXTERNAL_GALAXY_PITY_STAGE_BALANCES:
  readonly ExternalGalaxyPityStageBalance[] =
  Object.freeze([
    new ExternalGalaxyPityStageBalance(
      pityStage(
        'NONE',
      ),
      0n,
      0.00,
    ),
    new ExternalGalaxyPityStageBalance(
      pityStage(
        'ASSIST_I',
      ),
      1n,
      0.10,
    ),
    new ExternalGalaxyPityStageBalance(
      pityStage(
        'ASSIST_II',
      ),
      3n,
      0.25,
    ),
    new ExternalGalaxyPityStageBalance(
      pityStage(
        'ASSIST_III',
      ),
      5n,
      0.50,
    ),
    new ExternalGalaxyPityStageBalance(
      pityStage(
        'ASSIST_IV',
      ),
      7n,
      0.75,
    ),
    new ExternalGalaxyPityStageBalance(
      pityStage(
        'HARD_PITY',
      ),
      9n,
      1.00,
    ),
  ]);

validateUnique(
  DISCOVERY_TARGET_POINT_BALANCES,
  (
    balance,
  ) =>
    balance.targetType.code,
  'DiscoveryTargetPointBalance targetType',
);

validateUnique(
  DISCOVERY_STATE_MILESTONE_BALANCES,
  (
    balance,
  ) =>
    balance.state.code,
  'DiscoveryStateMilestoneBalance state',
);

validateUnique(
  DISCOVERY_REWARD_REASON_BALANCES,
  (
    balance,
  ) =>
    balance.reason,
  'DiscoveryRewardReasonBalance reason',
);

validateUnique(
  EXTERNAL_GALAXY_DETECTION_TIER_BALANCES,
  (
    balance,
  ) =>
    balance.tier,
  'ExternalGalaxyDetectionTierBalance tier',
);

validateUnique(
  EXTERNAL_GALAXY_PITY_STAGE_BALANCES,
  (
    balance,
  ) =>
    String(
      balance.stage,
    ),
  'ExternalGalaxyPityStageBalance stage',
);

validateStrictlyAscendingBigInt(
  EXTERNAL_GALAXY_DETECTION_TIER_BALANCES,
  (
    balance,
  ) =>
    balance
      .minimumGlobalDiscoveryPoints,
  'external-galaxy detection thresholds',
);

validateNonDecreasingNumber(
  EXTERNAL_GALAXY_DETECTION_TIER_BALANCES,
  (
    balance,
  ) =>
    balance
      .probabilityPerFutureSearch,
  'external-galaxy detection probabilities',
);

validateStrictlyAscendingBigInt(
  EXTERNAL_GALAXY_PITY_STAGE_BALANCES,
  (
    balance,
  ) =>
    balance
      .minimumConsecutiveFailures,
  'external-galaxy pity thresholds',
);

validateNonDecreasingNumber(
  EXTERNAL_GALAXY_PITY_STAGE_BALANCES,
  (
    balance,
  ) =>
    balance
      .recoveryFraction,
  'external-galaxy pity recovery fractions',
);

const DISCOVERY_MILESTONES:
  readonly DiscoveryStateValue[] =
  Object.freeze(
    DISCOVERY_STATE_MILESTONE_BALANCES
      .filter(
        (
          balance,
        ) =>
          balance.state.code !==
          DiscoveryState.UNKNOWN.code,
      )
      .map(
        (
          balance,
        ) =>
          balance.state,
      ),
  );

const REWARD_REASONS_IN_CANONICAL_ORDER:
  readonly DiscoveryRewardReason[] =
  Object.freeze(
    DISCOVERY_REWARD_REASON_BALANCES
      .map(
        (
          balance,
        ) =>
          balance.reason,
      ),
  );

/**
 * Single immutable source of truth for GeneratorVersion.V1 exploration balance.
 *
 * Point 7.9 CENTRALIZES existing values. It does not rebalance them.
 *
 * Included:
 * - 7.1 base PD and DiscoveryState milestone multipliers;
 * - 7.2 differentiated bonuses, triggers and target compatibility;
 * - 7.4 external-galaxy detection thresholds and base probabilities;
 * - external-search opportunity cadence: one non-spendable attempt per 100
 *   global PD progression bucket; unused opportunities accumulate persistently;
 * - 7.5 pity thresholds and recovery fractions.
 *
 * Deliberately not included:
 * - 7.3 galaxyProgressUnits;
 * - 7.6 observational projection thresholds;
 * - 7.8 DETECTED archive membership;
 * because those are structural/observational contracts rather than economic
 * progression balance.
 */
export class ExplorationBalanceV1 {

  private constructor() {}

  static readonly discoveryTargetPointBalances =
    DISCOVERY_TARGET_POINT_BALANCES;

  static readonly discoveryStateMilestoneBalances =
    DISCOVERY_STATE_MILESTONE_BALANCES;

  static readonly discoveryMilestones =
    DISCOVERY_MILESTONES;

  static readonly discoveryRewardReasonBalances =
    DISCOVERY_REWARD_REASON_BALANCES;

  static readonly rewardReasonsInCanonicalOrder =
    REWARD_REASONS_IN_CANONICAL_ORDER;

  static readonly externalGalaxySearchDiscoveryPointStep =
    EXTERNAL_GALAXY_SEARCH_DISCOVERY_POINT_STEP;

  static readonly externalGalaxyDetectionTierBalances =
    EXTERNAL_GALAXY_DETECTION_TIER_BALANCES;

  static readonly externalGalaxyPityStageBalances =
    EXTERNAL_GALAXY_PITY_STAGE_BALANCES;

  static readonly hardPityFailureThreshold =
    EXTERNAL_GALAXY_PITY_STAGE_BALANCES[
      EXTERNAL_GALAXY_PITY_STAGE_BALANCES.length -
        1
    ].minimumConsecutiveFailures;

  static readonly hardPityRecoveryFraction =
    EXTERNAL_GALAXY_PITY_STAGE_BALANCES[
      EXTERNAL_GALAXY_PITY_STAGE_BALANCES.length -
        1
    ].recoveryFraction;

  static baseDiscoveryPoints(
    targetType:
      ExplorationDiscoveryTargetType,
  ): number {

    const canonicalTargetType =
      DiscoveryTargetType
        .fromCode(
          targetType.code,
        );

    const balance =
      DISCOVERY_TARGET_POINT_BALANCES
        .find(
          (
            candidate,
          ) =>
            candidate
              .targetType
              .code ===
            canonicalTargetType.code,
        );

    if (
      balance ===
      undefined
    ) {
      throw new RangeError(
        `No V1 base Discovery Point balance for target type code ${canonicalTargetType.code}.`,
      );
    }

    return balance
      .baseDiscoveryPoints;
  }

  static milestoneMultiplier(
    state:
      DiscoveryStateValue,
  ): number {

    const canonicalState =
      DiscoveryState
        .fromCode(
          state.code,
        );

    const balance =
      DISCOVERY_STATE_MILESTONE_BALANCES
        .find(
          (
            candidate,
          ) =>
            candidate
              .state
              .code ===
            canonicalState.code,
        );

    if (
      balance ===
      undefined
    ) {
      throw new RangeError(
        `No V1 milestone balance for DiscoveryState code ${canonicalState.code}.`,
      );
    }

    return balance
      .multiplier;
  }

  static rewardReasonBalance(
    reason:
      DiscoveryRewardReason,
  ): DiscoveryRewardReasonBalance {

    const balance =
      DISCOVERY_REWARD_REASON_BALANCES
        .find(
          (
            candidate,
          ) =>
            candidate.reason ===
            reason,
        );

    if (
      balance ===
      undefined
    ) {
      throw new RangeError(
        `Unsupported DiscoveryRewardReason: ${String(reason)}.`,
      );
    }

    return balance;
  }

  static isRewardReasonCompatible(
    reason:
      DiscoveryRewardReason,

    targetType:
      ExplorationDiscoveryTargetType,
  ): boolean {

    const canonicalTargetType =
      DiscoveryTargetType
        .fromCode(
          targetType.code,
        );

    return this
      .rewardReasonBalance(
        reason,
      )
      .compatibleTargetTypes
      .some(
        (
          compatible,
        ) =>
          compatible.code ===
          canonicalTargetType.code,
      );
  }

  static externalGalaxyDetectionBalanceFor(
    globalDiscoveryPoints:
      bigint,
  ): ExternalGalaxyDetectionTierBalance {

    assertNonNegativeSignedLong(
      globalDiscoveryPoints,
      'globalDiscoveryPoints',
    );

    for (
      let index =
        EXTERNAL_GALAXY_DETECTION_TIER_BALANCES.length -
          1;
      index >=
        0;
      index -=
        1
    ) {
      const balance =
        EXTERNAL_GALAXY_DETECTION_TIER_BALANCES[
          index
        ];

      if (
        globalDiscoveryPoints >=
        balance
          .minimumGlobalDiscoveryPoints
      ) {
        return balance;
      }
    }

    throw new Error(
      'ExplorationBalanceV1 invariant broken: no external-galaxy detection tier matched.',
    );
  }

  static nextExternalGalaxyDetectionThreshold(
    tier:
      ExternalGalaxyDetectionProbabilityTier,
  ): bigint | null {

    const index =
      EXTERNAL_GALAXY_DETECTION_TIER_BALANCES
        .findIndex(
          (
            balance,
          ) =>
            balance.tier ===
            tier,
        );

    if (
      index <
      0
    ) {
      throw new RangeError(
        `Unsupported ExternalGalaxyDetectionProbabilityTier: ${String(tier)}.`,
      );
    }

    const next =
      EXTERNAL_GALAXY_DETECTION_TIER_BALANCES[
        index +
          1
      ];

    return next ===
      undefined
      ? null
      : next
          .minimumGlobalDiscoveryPoints;
  }

  static externalGalaxyPityBalanceFor(
    consecutiveFailedSearches:
      bigint,
  ): ExternalGalaxyPityStageBalance {

    assertNonNegativeSignedLong(
      consecutiveFailedSearches,
      'consecutiveFailedSearches',
    );

    for (
      let index =
        EXTERNAL_GALAXY_PITY_STAGE_BALANCES.length -
          1;
      index >=
        0;
      index -=
        1
    ) {
      const balance =
        EXTERNAL_GALAXY_PITY_STAGE_BALANCES[
          index
        ];

      if (
        consecutiveFailedSearches >=
        balance
          .minimumConsecutiveFailures
      ) {
        return balance;
      }
    }

    throw new Error(
      'ExplorationBalanceV1 invariant broken: no external-galaxy pity stage matched.',
    );
  }
}

function assertNonNegativeSignedLong(
  value:
    bigint,

  propertyName:
    string,
): void {

  if (
    typeof value !==
      'bigint' ||
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${String(value)}.`,
    );
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

function validateUnique<T>(
  values:
    readonly T[],

  keyOf:
    (
      value:
        T,
    ) =>
      string | number,

  label:
    string,
): void {

  const keys =
    values.map(
      keyOf,
    );

  if (
    new Set(
      keys,
    ).size !==
    keys.length
  ) {
    throw new Error(
      `${label} values must be unique.`,
    );
  }
}

function validateStrictlyAscendingBigInt<T>(
  values:
    readonly T[],

  valueOf:
    (
      value:
        T,
    ) =>
      bigint,

  label:
    string,
): void {

  for (
    let index =
      1;
    index <
      values.length;
    index +=
      1
  ) {
    if (
      valueOf(
        values[
          index -
            1
        ],
      ) >=
      valueOf(
        values[
          index
        ],
      )
    ) {
      throw new Error(
        `${label} must be strictly ascending.`,
      );
    }
  }
}

function validateNonDecreasingNumber<T>(
  values:
    readonly T[],

  valueOf:
    (
      value:
        T,
    ) =>
      number,

  label:
    string,
): void {

  for (
    let index =
      1;
    index <
      values.length;
    index +=
      1
  ) {
    if (
      valueOf(
        values[
          index -
            1
        ],
      ) >
      valueOf(
        values[
          index
        ],
      )
    ) {
      throw new Error(
        `${label} must be non-decreasing.`,
      );
    }
  }
}
