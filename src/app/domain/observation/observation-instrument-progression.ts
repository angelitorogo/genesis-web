import {
  ObservationInstrumentType,
} from './observation-instrument';

import {
  ObservationInstrumentLevel,
} from './observation-instrument-capability';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Canonical V1 progression milestones used only to derive observational
 * instrument accessibility.
 *
 * These milestones summarize already-observed knowledge. They are not
 * Ground Truth requirements and are never persisted as a separate unlock
 * state.
 */
export enum ObservationProgressMilestone {
  FIRST_SYSTEM_DISCOVERED =
    'FIRST_SYSTEM_DISCOVERED',

  FIRST_BODY_DISCOVERED =
    'FIRST_BODY_DISCOVERED',

  FIRST_GALACTIC_OBJECT_CATALOGUED =
    'FIRST_GALACTIC_OBJECT_CATALOGUED',

  FIRST_TARGET_CONFIRMED =
    'FIRST_TARGET_CONFIRMED',

  FIRST_EXTERNAL_GALAXY_DETECTED =
    'FIRST_EXTERNAL_GALAXY_DETECTED',
}

/**
 * Immutable V1 unlock requirement.
 *
 * minimumGlobalDiscoveryPoints is a threshold over accumulated, non-spendable
 * global Discovery Points. It is not a purchase cost.
 */
export class ObservationUnlockRequirement {

  readonly requiredMilestones:
    readonly ObservationProgressMilestone[];

  constructor(
    readonly minimumGlobalDiscoveryPoints:
      bigint,

    requiredMilestones:
      readonly ObservationProgressMilestone[],
  ) {
    assertNonNegativeSignedLong(
      minimumGlobalDiscoveryPoints,
      'minimumGlobalDiscoveryPoints',
    );

    validateMilestones(
      requiredMilestones,
      'requiredMilestones',
    );

    this.requiredMilestones =
      Object.freeze([
        ...requiredMilestones,
      ]);
  }
}

/**
 * V1 unlock rule for one observation-instrument family.
 */
export class ObservationInstrumentFamilyUnlockRule {

  constructor(
    readonly instrumentType:
      ObservationInstrumentType,

    readonly requirement:
      ObservationUnlockRequirement,
  ) {
    if (
      !Object.values(
        ObservationInstrumentType,
      ).includes(
        instrumentType,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationInstrumentType: ${String(instrumentType)}.`,
      );
    }
  }
}

/**
 * V1 unlock rule for one instrument maturity level.
 */
export class ObservationInstrumentLevelUnlockRule {

  constructor(
    readonly level:
      ObservationInstrumentLevel,

    readonly requirement:
      ObservationUnlockRequirement,
  ) {
    if (
      !ObservationInstrumentLevel
        .values
        .includes(
          level,
        )
    ) {
      throw new RangeError(
        'level must be a canonical ObservationInstrumentLevel.',
      );
    }
  }
}

/**
 * Derived unlock state for one exact instrument-family + level combination.
 */
export class ObservationInstrumentLevelUnlockStatus {

  readonly missingMilestones:
    readonly ObservationProgressMilestone[];

  constructor(
    readonly instrumentType:
      ObservationInstrumentType,

    readonly level:
      ObservationInstrumentLevel,

    readonly requirement:
      ObservationUnlockRequirement,

    readonly missingGlobalDiscoveryPoints:
      bigint,

    missingMilestones:
      readonly ObservationProgressMilestone[],
  ) {
    if (
      !Object.values(
        ObservationInstrumentType,
      ).includes(
        instrumentType,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationInstrumentType: ${String(instrumentType)}.`,
      );
    }

    if (
      !ObservationInstrumentLevel
        .values
        .includes(
          level,
        )
    ) {
      throw new RangeError(
        'level must be a canonical ObservationInstrumentLevel.',
      );
    }

    assertNonNegativeSignedLong(
      missingGlobalDiscoveryPoints,
      'missingGlobalDiscoveryPoints',
    );

    if (
      missingGlobalDiscoveryPoints >
      requirement
        .minimumGlobalDiscoveryPoints
    ) {
      throw new RangeError(
        'missingGlobalDiscoveryPoints cannot exceed the requirement threshold.',
      );
    }

    validateMilestones(
      missingMilestones,
      'missingMilestones',
    );

    if (
      missingMilestones
        .some(
          (
            milestone,
          ) =>
            !requirement
              .requiredMilestones
              .includes(
                milestone,
              ),
        )
    ) {
      throw new RangeError(
        'missingMilestones must be a subset of requirement.requiredMilestones.',
      );
    }

    this.missingMilestones =
      Object.freeze([
        ...missingMilestones,
      ]);
  }

  get isUnlocked():
    boolean {

    return (
      this
        .missingGlobalDiscoveryPoints ===
        0n &&
      this
        .missingMilestones
        .length ===
        0
    );
  }
}

/**
 * Complete point-8.4 accessibility projection for the observatory.
 *
 * It is derived at runtime from:
 * - accumulated global Discovery Points;
 * - already-known discovery state.
 *
 * No unlock state is persisted and no Discovery Points are spent.
 */
export class ObservationInstrumentProgressionOverview {

  readonly achievedMilestones:
    readonly ObservationProgressMilestone[];

  readonly statuses:
    readonly ObservationInstrumentLevelUnlockStatus[];

  constructor(
    readonly globalDiscoveryPoints:
      bigint,

    achievedMilestones:
      readonly ObservationProgressMilestone[],

    statuses:
      readonly ObservationInstrumentLevelUnlockStatus[],
  ) {
    assertNonNegativeSignedLong(
      globalDiscoveryPoints,
      'globalDiscoveryPoints',
    );

    validateMilestones(
      achievedMilestones,
      'achievedMilestones',
    );

    const statusKeys =
      statuses.map(
        (
          status,
        ) =>
          `${status.instrumentType}:${status.level.rank}`,
      );

    if (
      new Set(
        statusKeys,
      ).size !==
      statusKeys.length
    ) {
      throw new RangeError(
        'statuses cannot contain duplicate instrument-type + level pairs.',
      );
    }

    this.achievedMilestones =
      Object.freeze([
        ...achievedMilestones,
      ]);

    this.statuses =
      Object.freeze([
        ...statuses,
      ]);
  }

  status(
    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): ObservationInstrumentLevelUnlockStatus {

    const status =
      this.statuses
        .find(
          (
            candidate,
          ) =>
            candidate
              .instrumentType ===
              instrumentType &&
            candidate
              .level ===
              level,
        );

    if (
      status ===
      undefined
    ) {
      throw new RangeError(
        `No progression status for ${String(instrumentType)} ${level.name}.`,
      );
    }

    return status;
  }

  isUnlocked(
    instrumentType:
      ObservationInstrumentType,

    level:
      ObservationInstrumentLevel,
  ): boolean {

    return this
      .status(
        instrumentType,
        level,
      )
      .isUnlocked;
  }

  unlockedLevels(
    instrumentType:
      ObservationInstrumentType,
  ): readonly ObservationInstrumentLevel[] {

    const unlockedSet =
      new Set(
        this.statuses
          .filter(
            (
              status,
            ) =>
              status.instrumentType ===
                instrumentType &&
              status.isUnlocked,
          )
          .map(
            (
              status,
            ) =>
              status.level,
          ),
      );

    return Object.freeze(
      ObservationInstrumentLevel
        .values
        .filter(
          (
            level,
          ) =>
            unlockedSet.has(
              level,
            ),
        ),
    );
  }

  highestUnlockedLevel(
    instrumentType:
      ObservationInstrumentType,
  ): ObservationInstrumentLevel | null {

    const levels =
      this.unlockedLevels(
        instrumentType,
      );

    return levels.length ===
      0
      ? null
      : levels[
          levels.length -
            1
        ];
  }

  get unlockedInstrumentTypes():
    readonly ObservationInstrumentType[] {

    const unlockedSet =
      new Set(
        this.statuses
          .filter(
            (
              status,
            ) =>
              status.level ===
                ObservationInstrumentLevel
                  .LEVEL_1 &&
              status.isUnlocked,
          )
          .map(
            (
              status,
            ) =>
              status.instrumentType,
          ),
      );

    return Object.freeze(
      Object.values(
        ObservationInstrumentType,
      )
        .filter(
          (
            instrumentType,
          ) =>
            unlockedSet.has(
              instrumentType,
            ),
        ),
    );
  }
}

function validateMilestones(
  milestones:
    readonly ObservationProgressMilestone[],

  propertyName:
    string,
): void {

  for (
    const milestone
    of milestones
  ) {
    if (
      !Object.values(
        ObservationProgressMilestone,
      ).includes(
        milestone,
      )
    ) {
      throw new RangeError(
        `${propertyName} contains an unknown ObservationProgressMilestone: ${String(milestone)}.`,
      );
    }
  }

  if (
    new Set(
      milestones,
    ).size !==
    milestones.length
  ) {
    throw new RangeError(
      `${propertyName} cannot contain duplicates.`,
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
