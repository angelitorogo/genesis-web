import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

export type ExplorationDiscoveryTargetType =
  ReturnType<
    typeof DiscoveryTargetType.fromCode
  >;

/**
 * Immutable result of evaluating one observed-knowledge state transition.
 *
 * Discovery Points in point 7.1 are progression rewards only. This model does
 * not persist them, spend them, split them by scope or unlock galaxies.
 */
export class ExplorationProgressResult {

  readonly crossedMilestones:
    readonly DiscoveryStateValue[];

  constructor(
    readonly targetType:
      ExplorationDiscoveryTargetType,

    readonly previousState:
      DiscoveryStateValue,

    readonly newState:
      DiscoveryStateValue,

    crossedMilestones:
      readonly DiscoveryStateValue[],

    readonly awardedDiscoveryPoints:
      number,
  ) {
    if (
      !Number.isSafeInteger(
        awardedDiscoveryPoints,
      ) ||
      awardedDiscoveryPoints <
        0
    ) {
      throw new RangeError(
        'awardedDiscoveryPoints must be a non-negative safe integer.',
      );
    }

    if (
      newState.code <
      previousState.code
    ) {
      throw new RangeError(
        [
          'Regressive discovery transitions are invalid:',
          `previousStateCode=${previousState.code},`,
          `newStateCode=${newState.code}.`,
        ].join(
          ' ',
        ),
      );
    }

    const milestones =
      [
        ...crossedMilestones,
      ];

    if (
      milestones.some(
        (
          milestone,
        ) =>
          milestone.code ===
          DiscoveryState.UNKNOWN.code,
      )
    ) {
      throw new RangeError(
        'crossedMilestones cannot contain UNKNOWN.',
      );
    }

    const milestoneCodes =
      milestones.map(
        (
          milestone,
        ) =>
          milestone.code,
      );

    if (
      new Set(
        milestoneCodes,
      ).size !==
      milestoneCodes.length
    ) {
      throw new RangeError(
        'crossedMilestones cannot contain duplicates.',
      );
    }

    for (
      let index =
        1;
      index <
        milestones.length;
      index +=
        1
    ) {
      if (
        milestones[
          index - 1
        ].code >
        milestones[index].code
      ) {
        throw new RangeError(
          'crossedMilestones must be sorted by ascending DiscoveryState code.',
        );
      }
    }

    if (
      milestones.some(
        (
          milestone,
        ) =>
          milestone.code <=
            previousState.code ||
          milestone.code >
            newState.code,
      )
    ) {
      throw new RangeError(
        'Every crossed milestone must be greater than previousState and less than or equal to newState.',
      );
    }

    if (
      newState.code ===
      previousState.code
    ) {
      if (
        milestones.length !==
        0
      ) {
        throw new RangeError(
          'A same-state transition cannot cross milestones.',
        );
      }

      if (
        awardedDiscoveryPoints !==
        0
      ) {
        throw new RangeError(
          'A same-state transition must award 0 Discovery Points.',
        );
      }
    } else if (
      milestones.length ===
      0
    ) {
      throw new RangeError(
        'A progressing transition must cross at least one milestone.',
      );
    }

    this.crossedMilestones =
      Object.freeze(
        milestones,
      );
  }

  get didProgress():
    boolean {

    return this.newState.code >
      this.previousState.code;
  }
}
