import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

import {
  DiscoveryRewardReason,
} from '../../domain/exploration/discovery-reward-reason';

import {
  DiscoveryRewardResult,
} from '../../domain/exploration/discovery-reward-result';

import {
  type ExplorationDiscoveryTargetType,
} from '../../domain/exploration/exploration-progress-result';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExplorationEngine,
} from './exploration-engine';

/**
 * Pure deterministic engine for differentiated Discovery Point bonuses.
 *
 * Point 7.9 centralizes V1 reward ordering, trigger milestones, bonus values and
 * target compatibility in ExplorationBalanceV1.
 *
 * rewardReasons still come from observed knowledge. This engine does not infer
 * whether systems, planets, biospheres, rare objects or extreme events exist.
 *
 * No PRNG, seed derivation, Ground Truth resolver, persistence, PD spending or
 * galaxy unlock logic is used here.
 */
export class DiscoveryRewardEngine {

  private constructor() {}

  static evaluateDiscoveryReward(
    generationKey:
      UniverseGenerationKey,

    targetType:
      ExplorationDiscoveryTargetType,

    previousState:
      DiscoveryStateValue,

    newState:
      DiscoveryStateValue,

    rewardReasons:
      ReadonlySet<DiscoveryRewardReason>,
  ): DiscoveryRewardResult {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        generationKey,
        DiscoveryTargetType
          .fromCode(
            targetType.code,
          ),
        DiscoveryState
          .fromCode(
            previousState.code,
          ),
        DiscoveryState
          .fromCode(
            newState.code,
          ),
        rewardReasons,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    generationKey:
      UniverseGenerationKey,

    targetType:
      ExplorationDiscoveryTargetType,

    previousState:
      DiscoveryStateValue,

    newState:
      DiscoveryStateValue,

    rewardReasons:
      ReadonlySet<DiscoveryRewardReason>,
  ): DiscoveryRewardResult {

    for (
      const reason
      of rewardReasons
    ) {
      if (
        !ExplorationBalanceV1
          .isRewardReasonCompatible(
            reason,
            targetType,
          )
      ) {
        throw new RangeError(
          `${reason} is incompatible with DiscoveryTargetType ${targetType.name}.`,
        );
      }
    }

    const progressResult =
      ExplorationEngine
        .evaluateDiscoveryTransition(
          generationKey,
          targetType,
          previousState,
          newState,
        );

    const awardedRewardReasons =
      ExplorationBalanceV1
        .rewardReasonsInCanonicalOrder
        .filter(
          (
            reason,
          ) => {
            if (
              !rewardReasons.has(
                reason,
              )
            ) {
              return false;
            }

            const balance =
              ExplorationBalanceV1
                .rewardReasonBalance(
                  reason,
                );

            return isTriggerCrossedV1(
              previousState,
              newState,
              balance.triggerState,
            );
          },
        );

    const bonusDiscoveryPoints =
      awardedRewardReasons
        .reduce(
          (
            total,
            reason,
          ) =>
            total +
            ExplorationBalanceV1
              .rewardReasonBalance(
                reason,
              )
              .bonusDiscoveryPoints,
          0,
        );

    return new DiscoveryRewardResult(
      progressResult,
      awardedRewardReasons,
      bonusDiscoveryPoints,
      progressResult
        .awardedDiscoveryPoints +
        bonusDiscoveryPoints,
    );
  }
}

function isTriggerCrossedV1(
  previousState:
    DiscoveryStateValue,

  newState:
    DiscoveryStateValue,

  triggerState:
    DiscoveryStateValue,
): boolean {

  return (
    previousState.code <
      triggerState.code &&
    newState.code >=
      triggerState.code
  );
}
