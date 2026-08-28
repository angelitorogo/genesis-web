import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  type DiscoveryRewardResult,
} from '../exploration/discovery-reward-result';

import {
  ObservationActionType,
} from '../observation/observation-action';

import {
  ObservationInstrumentType,
} from '../observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../observation/observation-instrument-capability';

import {
  type ProtoplanetaryDiskAnalysis,
} from './protoplanetary-disk-analysis';

/**
 * Point-17.6 system-level scientific action vocabulary.
 */
export enum StellarSystemScientificActionType {
  ANALYZE_DISK =
    'ANALYZE_DISK',
}

/**
 * Immutable V1 rule for ANALYZE DISK.
 *
 * The action is intentionally a CATALOGUED -> CONFIRMED transition. At
 * CATALOGUED the stellar architecture is already known, so merely offering the
 * disk-analysis action cannot leak multiplicity or hidden stellar physics.
 */
export class StellarSystemScientificActionRule {

  readonly compatibleInstrumentTypes:
    readonly ObservationInstrumentType[];

  readonly minimumDiscoveryState:
    DiscoveryStateValue;

  readonly targetDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly actionType:
      StellarSystemScientificActionType,

    readonly observationActionType:
      ObservationActionType,

    compatibleInstrumentTypes:
      readonly ObservationInstrumentType[],

    readonly minimumInstrumentLevel:
      ObservationInstrumentLevel,

    minimumDiscoveryState:
      DiscoveryStateValue,

    targetDiscoveryState:
      DiscoveryStateValue,
  ) {
    assertActionType(
      actionType,
    );

    if (
      !Object.values(
        ObservationActionType,
      ).includes(
        observationActionType,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationActionType: ${String(observationActionType)}.`,
      );
    }

    if (
      compatibleInstrumentTypes.length ===
        0
    ) {
      throw new RangeError(
        'compatibleInstrumentTypes cannot be empty.',
      );
    }

    for (
      const instrumentType
      of compatibleInstrumentTypes
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

    if (
      new Set(
        compatibleInstrumentTypes,
      ).size !==
      compatibleInstrumentTypes.length
    ) {
      throw new RangeError(
        'compatibleInstrumentTypes cannot contain duplicates.',
      );
    }

    if (
      !ObservationInstrumentLevel
        .values
        .includes(
          minimumInstrumentLevel,
        )
    ) {
      throw new RangeError(
        'minimumInstrumentLevel must be canonical.',
      );
    }

    const canonicalMinimumState =
      DiscoveryState.fromCode(
        minimumDiscoveryState.code,
      );

    const canonicalTargetState =
      DiscoveryState.fromCode(
        targetDiscoveryState.code,
      );

    if (
      canonicalMinimumState.code <
        DiscoveryState.CATALOGUED.code ||
      canonicalTargetState.code <=
        canonicalMinimumState.code
    ) {
      throw new RangeError(
        'Point-17.6 actions must start at CATALOGUED or later and advance DiscoveryState.',
      );
    }

    this.compatibleInstrumentTypes =
      Object.freeze([
        ...compatibleInstrumentTypes,
      ]);

    this.minimumDiscoveryState =
      canonicalMinimumState;

    this.targetDiscoveryState =
      canonicalTargetState;
  }
}

export class StellarSystemScientificActionAvailability {

  readonly currentDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly rule:
      StellarSystemScientificActionRule,

    currentDiscoveryState:
      DiscoveryStateValue,

    readonly isSystemTarget:
      boolean,

    readonly hasAnalyzableDisk:
      boolean,

    readonly isObservationActionAvailable:
      boolean,

    readonly isInstrumentAllowed:
      boolean,

    readonly meetsMinimumInstrumentLevel:
      boolean,

    readonly isStateEligible:
      boolean,
  ) {
    this.currentDiscoveryState =
      DiscoveryState.fromCode(
        currentDiscoveryState.code,
      );

    for (
      const flag
      of [
        isSystemTarget,
        hasAnalyzableDisk,
        isObservationActionAvailable,
        isInstrumentAllowed,
        meetsMinimumInstrumentLevel,
        isStateEligible,
      ]
    ) {
      if (
        typeof flag !==
          'boolean'
      ) {
        throw new TypeError(
          'StellarSystemScientificActionAvailability flags must be boolean.',
        );
      }
    }
  }

  get actionType():
    StellarSystemScientificActionType {

    return this.rule.actionType;
  }

  get isAvailable():
    boolean {

    return (
      this.isSystemTarget &&
      this.hasAnalyzableDisk &&
      this.isObservationActionAvailable &&
      this.isInstrumentAllowed &&
      this.meetsMinimumInstrumentLevel &&
      this.isStateEligible
    );
  }
}

export class StellarSystemScientificActionResult {

  readonly previousDiscoveryState:
    DiscoveryStateValue;

  readonly newDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly actionType:
      StellarSystemScientificActionType,

    previousDiscoveryState:
      DiscoveryStateValue,

    newDiscoveryState:
      DiscoveryStateValue,

    readonly reward:
      DiscoveryRewardResult,

    readonly analysis:
      ProtoplanetaryDiskAnalysis,
  ) {
    assertActionType(
      actionType,
    );

    this.previousDiscoveryState =
      DiscoveryState.fromCode(
        previousDiscoveryState.code,
      );

    this.newDiscoveryState =
      DiscoveryState.fromCode(
        newDiscoveryState.code,
      );

    if (
      reward
        .progressResult
        .targetType
        .code !==
      DiscoveryTargetType.SYSTEM.code
    ) {
      throw new RangeError(
        'Point-17.6 ANALYZE DISK must reward DiscoveryTargetType.SYSTEM.',
      );
    }

    if (
      reward
        .progressResult
        .previousState
        .code !==
        this.previousDiscoveryState.code ||
      reward
        .progressResult
        .newState
        .code !==
        this.newDiscoveryState.code
    ) {
      throw new RangeError(
        'Reward progression states must match the point-17.6 action result.',
      );
    }
  }

  get awardedDiscoveryPoints():
    number {

    return this.reward
      .totalAwardedDiscoveryPoints;
  }
}

function assertActionType(
  actionType:
    StellarSystemScientificActionType,
): void {

  if (
    !Object.values(
      StellarSystemScientificActionType,
    ).includes(
      actionType,
    )
  ) {
    throw new RangeError(
      `Unknown StellarSystemScientificActionType: ${String(actionType)}.`,
    );
  }
}
