import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  DiscoveryRewardReason,
} from './discovery-reward-reason';

import {
  DiscoveryRewardReasonBalance,
  DiscoveryStateMilestoneBalance,
  DiscoveryTargetPointBalance,
  ExternalGalaxyDetectionTierBalance,
  ExternalGalaxyPityStageBalance,
} from './exploration-balance';

import {
  ExternalGalaxyDetectionProbabilityTier,
} from './external-galaxy-detection-probability-profile';

import {
  ExternalGalaxySearchPityStage,
} from './external-galaxy-search-pity-profile';

describe(
  'Exploration balance models',
  () => {

    it(
      'should accept valid target milestone and reward rows',
      () => {
        expect(
          new DiscoveryTargetPointBalance(
            DiscoveryTargetType.SYSTEM,
            6,
          )
            .baseDiscoveryPoints,
        ).toBe(
          6,
        );

        expect(
          new DiscoveryStateMilestoneBalance(
            DiscoveryState.UNKNOWN,
            0,
          )
            .multiplier,
        ).toBe(
          0,
        );

        const reward =
          new DiscoveryRewardReasonBalance(
            DiscoveryRewardReason.SYSTEM_DISCOVERY,
            DiscoveryState.DISCOVERED,
            12,
            [
              DiscoveryTargetType.SYSTEM,
            ],
          );

        expect(
          reward.compatibleTargetTypes,
        ).toEqual([
          DiscoveryTargetType.SYSTEM,
        ]);

        expect(
          Object.isFrozen(
            reward.compatibleTargetTypes,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reject invalid point milestone and reward rows',
      () => {
        expect(
          () =>
            new DiscoveryTargetPointBalance(
              DiscoveryTargetType.SYSTEM,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryStateMilestoneBalance(
              DiscoveryState.UNKNOWN,
              1,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryStateMilestoneBalance(
              DiscoveryState.DETECTED,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardReasonBalance(
              DiscoveryRewardReason.SYSTEM_DISCOVERY,
              DiscoveryState.UNKNOWN,
              12,
              [
                DiscoveryTargetType.SYSTEM,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardReasonBalance(
              DiscoveryRewardReason.SYSTEM_DISCOVERY,
              DiscoveryState.DISCOVERED,
              0,
              [
                DiscoveryTargetType.SYSTEM,
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new DiscoveryRewardReasonBalance(
              DiscoveryRewardReason.SYSTEM_DISCOVERY,
              DiscoveryState.DISCOVERED,
              12,
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should validate external-galaxy detection balance boundaries',
      () => {
        const valid =
          new ExternalGalaxyDetectionTierBalance(
            ExternalGalaxyDetectionProbabilityTier.ADVANCED,
            2_500n,
            0.10,
          );

        expect(
          valid.minimumGlobalDiscoveryPoints,
        ).toBe(
          2_500n,
        );

        expect(
          () =>
            new ExternalGalaxyDetectionTierBalance(
              ExternalGalaxyDetectionProbabilityTier.BASELINE,
              -1n,
              0.02,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyDetectionTierBalance(
              ExternalGalaxyDetectionProbabilityTier.BASELINE,
              0n,
              Number.NaN,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should validate external-galaxy pity balance boundaries and runtime stage names',
      () => {
        const valid =
          new ExternalGalaxyPityStageBalance(
            ExternalGalaxySearchPityStage.HARD_PITY,
            9n,
            1.0,
          );

        expect(
          valid.minimumConsecutiveFailures,
        ).toBe(
          9n,
        );

        expect(
          () =>
            new ExternalGalaxyPityStageBalance(
              ExternalGalaxySearchPityStage.ASSIST_I,
              -1n,
              0.10,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyPityStageBalance(
              'UNKNOWN' as
                ExternalGalaxySearchPityStage,
              0n,
              0.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyPityStageBalance(
              ExternalGalaxySearchPityStage.NONE,
              0n,
              1.01,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
