import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryStateTransitionContractV1,
} from '../../domain/discovery/discovery-state-transition-contract';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  DiscoveryRewardReason,
} from '../../domain/exploration/discovery-reward-reason';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  DiscoveryRewardEngine,
} from './discovery-reward-engine';

/**
 * Point-26.A.8 reward policy for the already-authorized STELLAR_SYSTEM
 * scientific lifecycle.
 *
 * This deliberately delegates the numbers to the existing DiscoveryRewardEngine
 * instead of creating a second PD economy. The result is a pure reward proposal:
 * it does not persist or spend PD. Point 26.A.9 can commit it atomically together
 * with the scientific transition that produced it.
 */
export class StellarSystemScientificRewardPolicyV1 {

  private constructor() {}

  static evaluate(
    generationKey:
      UniverseGenerationKey,

    stateBefore:
      DiscoveryStateValue,

    stateAfter:
      DiscoveryStateValue,
  ): ReturnType<
    typeof DiscoveryRewardEngine.evaluateDiscoveryReward
  > {

    const before =
      DiscoveryState.fromCode(
        stateBefore.code,
      );

    const after =
      DiscoveryState.fromCode(
        stateAfter.code,
      );

    DiscoveryStateTransitionContractV1
      .assertAllowed(
        before,
        after,
      );

    if (
      before.code <
        DiscoveryState.DETECTED.code ||
      after.code >
        DiscoveryState.CONFIRMED.code
    ) {
      throw new RangeError(
        'Point 26.A.8 STELLAR_SYSTEM rewards cover DETECTED through CONFIRMED only.',
      );
    }

    const rewardReasons =
      before ===
        DiscoveryState.DETECTED &&
      after ===
        DiscoveryState.DISCOVERED
        ? new Set([
            DiscoveryRewardReason
              .SYSTEM_DISCOVERY,
          ])
        : new Set<DiscoveryRewardReason>();

    return DiscoveryRewardEngine
      .evaluateDiscoveryReward(
        generationKey,
        DiscoveryTargetType.SYSTEM,
        before,
        after,
        rewardReasons,
      );
  }
}
