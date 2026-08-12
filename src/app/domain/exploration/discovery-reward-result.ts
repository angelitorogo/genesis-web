import {
  DiscoveryRewardReason,
} from './discovery-reward-reason';

import {
  ExplorationBalanceV1,
} from './exploration-balance';

import {
  type ExplorationProgressResult,
} from './exploration-progress-result';

/**
 * Immutable result that combines the base 7.1 progression reward with the
 * differentiated 7.2 significance bonuses.
 *
 * Point 7.9 obtains canonical reward ordering from ExplorationBalanceV1 so
 * this value object does not duplicate gameplay balance/order configuration.
 */
export class DiscoveryRewardResult {

  readonly awardedRewardReasons:
    readonly DiscoveryRewardReason[];

  constructor(
    readonly progressResult:
      ExplorationProgressResult,

    awardedRewardReasons:
      readonly DiscoveryRewardReason[],

    readonly bonusDiscoveryPoints:
      number,

    readonly totalAwardedDiscoveryPoints:
      number,
  ) {
    assertNonNegativeSafeInteger(
      bonusDiscoveryPoints,
      'bonusDiscoveryPoints',
    );

    assertNonNegativeSafeInteger(
      totalAwardedDiscoveryPoints,
      'totalAwardedDiscoveryPoints',
    );

    const reasons =
      [
        ...awardedRewardReasons,
      ];

    if (
      new Set(
        reasons,
      ).size !==
      reasons.length
    ) {
      throw new RangeError(
        'awardedRewardReasons cannot contain duplicates.',
      );
    }

    const canonicalIndices =
      reasons.map(
        (
          reason,
        ) =>
          ExplorationBalanceV1
            .rewardReasonsInCanonicalOrder
            .indexOf(
              reason,
            ),
      );

    if (
      canonicalIndices.some(
        (
          index,
        ) =>
          index <
          0,
      )
    ) {
      throw new RangeError(
        'awardedRewardReasons contains an unsupported DiscoveryRewardReason.',
      );
    }

    for (
      let index =
        1;
      index <
        canonicalIndices.length;
      index +=
        1
    ) {
      if (
        canonicalIndices[
          index -
            1
        ] >
        canonicalIndices[index]
      ) {
        throw new RangeError(
          'awardedRewardReasons must follow the canonical V1 reward reason order.',
        );
      }
    }

    if (
      totalAwardedDiscoveryPoints !==
      progressResult
        .awardedDiscoveryPoints +
        bonusDiscoveryPoints
    ) {
      throw new RangeError(
        'totalAwardedDiscoveryPoints must equal base Discovery Points plus bonus Discovery Points.',
      );
    }

    if (
      !progressResult
        .didProgress
    ) {
      if (
        reasons.length !==
        0
      ) {
        throw new RangeError(
          'A non-progressing transition cannot award differentiated reward reasons.',
        );
      }

      if (
        bonusDiscoveryPoints !==
          0 ||
        totalAwardedDiscoveryPoints !==
          0
      ) {
        throw new RangeError(
          'A non-progressing transition must award 0 base, bonus and total Discovery Points.',
        );
      }
    }

    this.awardedRewardReasons =
      Object.freeze(
        reasons,
      );
  }

  get baseDiscoveryPoints():
    number {

    return this
      .progressResult
      .awardedDiscoveryPoints;
  }

  get didAwardBonus():
    boolean {

    return this
      .bonusDiscoveryPoints >
      0;
  }
}

function assertNonNegativeSafeInteger(
  value:
    number,

  propertyName:
    string,
): void {

  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative safe integer.`,
    );
  }
}
