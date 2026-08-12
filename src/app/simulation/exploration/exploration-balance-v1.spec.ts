import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  DiscoveryRewardReason,
} from '../../domain/exploration/discovery-reward-reason';

import {
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

import {
  ExternalGalaxyDetectionProbabilityTier,
} from '../../domain/exploration/external-galaxy-detection-probability-profile';

import {
  ExternalGalaxySearchPityStage,
} from '../../domain/exploration/external-galaxy-search-pity-profile';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  DiscoveryRewardEngine,
} from './discovery-reward-engine';

import {
  ExplorationEngine,
} from './exploration-engine';

import {
  ExternalGalaxyDetectionProbabilityEngine,
} from './external-galaxy-detection-probability-engine';

import {
  ExternalGalaxySearchPityEngine,
} from './external-galaxy-search-pity-engine';

describe(
  'ExplorationBalanceV1',
  () => {
    const canonicalGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const allTargetTypes = [
      DiscoveryTargetType.GALAXY,
      DiscoveryTargetType.SECTOR,
      DiscoveryTargetType.GALACTIC_OBJECT,
      DiscoveryTargetType.SYSTEM,
      DiscoveryTargetType.BODY,
      DiscoveryTargetType.CIVILIZATION,
    ] as const;

    const states = [
      DiscoveryState.UNKNOWN,
      DiscoveryState.DETECTED,
      DiscoveryState.DISCOVERED,
      DiscoveryState.VISITED,
      DiscoveryState.CATALOGUED,
      DiscoveryState.CONFIRMED,
    ] as const;

    it(
      'should preserve the complete frozen 7.1 base Discovery Point table',
      () => {
        expect(
          ExplorationBalanceV1
            .discoveryTargetPointBalances
            .map(
              (
                balance,
              ) => [
                balance.targetType.name,
                balance.baseDiscoveryPoints,
              ],
            ),
        ).toEqual([
          [
            'GALAXY',
            40,
          ],
          [
            'SECTOR',
            2,
          ],
          [
            'GALACTIC_OBJECT',
            12,
          ],
          [
            'SYSTEM',
            6,
          ],
          [
            'BODY',
            3,
          ],
          [
            'CIVILIZATION',
            50,
          ],
        ]);
      },
    );

    it(
      'should preserve the complete frozen 7.1 milestone multiplier table and canonical milestone order',
      () => {
        expect(
          ExplorationBalanceV1
            .discoveryStateMilestoneBalances
            .map(
              (
                balance,
              ) => [
                balance.state.name,
                balance.multiplier,
              ],
            ),
        ).toEqual([
          [
            'UNKNOWN',
            0,
          ],
          [
            'DETECTED',
            1,
          ],
          [
            'DISCOVERED',
            2,
          ],
          [
            'VISITED',
            3,
          ],
          [
            'CATALOGUED',
            5,
          ],
          [
            'CONFIRMED',
            8,
          ],
        ]);

        expect(
          ExplorationBalanceV1
            .discoveryMilestones,
        ).toEqual([
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ]);
      },
    );

    it(
      'should preserve the complete frozen 7.2 differentiated reward table and canonical order',
      () => {
        expect(
          ExplorationBalanceV1
            .rewardReasonsInCanonicalOrder,
        ).toEqual([
          DiscoveryRewardReason.SYSTEM_DISCOVERY,
          DiscoveryRewardReason.PLANET_DISCOVERY,
          DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
          DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
          DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
        ]);

        expect(
          ExplorationBalanceV1
            .discoveryRewardReasonBalances
            .map(
              (
                balance,
              ) => ({
                reason:
                  balance.reason,

                trigger:
                  balance
                    .triggerState
                    .name,

                bonus:
                  balance
                    .bonusDiscoveryPoints,

                compatible:
                  balance
                    .compatibleTargetTypes
                    .map(
                      (
                        target,
                      ) =>
                        target.name,
                    ),
              }),
            ),
        ).toEqual([
          {
            reason:
              DiscoveryRewardReason.SYSTEM_DISCOVERY,
            trigger:
              'DISCOVERED',
            bonus:
              12,
            compatible:
              [
                'SYSTEM',
              ],
          },
          {
            reason:
              DiscoveryRewardReason.PLANET_DISCOVERY,
            trigger:
              'DISCOVERED',
            bonus:
              6,
            compatible:
              [
                'BODY',
              ],
          },
          {
            reason:
              DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
            trigger:
              'CONFIRMED',
            bonus:
              120,
            compatible:
              [
                'BODY',
              ],
          },
          {
            reason:
              DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
            trigger:
              'CATALOGUED',
            bonus:
              60,
            compatible:
              [
                'GALACTIC_OBJECT',
              ],
          },
          {
            reason:
              DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
            trigger:
              'CONFIRMED',
            bonus:
              180,
            compatible:
              [
                'GALAXY',
                'SECTOR',
                'GALACTIC_OBJECT',
                'SYSTEM',
                'BODY',
                'CIVILIZATION',
              ],
          },
        ]);
      },
    );

    it(
      'should preserve the complete frozen 7.4 external-galaxy detection table and next thresholds',
      () => {
        expect(
          ExplorationBalanceV1
            .externalGalaxyDetectionTierBalances
            .map(
              (
                balance,
              ) => [
                balance.tier,
                balance.minimumGlobalDiscoveryPoints,
                balance.probabilityPerFutureSearch,
              ],
            ),
        ).toEqual([
          [
            ExternalGalaxyDetectionProbabilityTier.BASELINE,
            0n,
            0.02,
          ],
          [
            ExternalGalaxyDetectionProbabilityTier.ENHANCED,
            1_000n,
            0.05,
          ],
          [
            ExternalGalaxyDetectionProbabilityTier.ADVANCED,
            2_500n,
            0.10,
          ],
          [
            ExternalGalaxyDetectionProbabilityTier.DEEP,
            5_000n,
            0.18,
          ],
          [
            ExternalGalaxyDetectionProbabilityTier.FRONTIER,
            10_000n,
            0.30,
          ],
        ]);

        expect(
          ExplorationBalanceV1
            .nextExternalGalaxyDetectionThreshold(
              ExternalGalaxyDetectionProbabilityTier.BASELINE,
            ),
        ).toBe(
          1_000n,
        );

        expect(
          ExplorationBalanceV1
            .nextExternalGalaxyDetectionThreshold(
              ExternalGalaxyDetectionProbabilityTier.FRONTIER,
            ),
        ).toBeNull();
      },
    );

    it(
      'should preserve the complete frozen 7.5 pity table and hard-pity derivations',
      () => {
        expect(
          ExplorationBalanceV1
            .externalGalaxyPityStageBalances
            .map(
              (
                balance,
              ) => [
                balance.stage,
                balance.minimumConsecutiveFailures,
                balance.recoveryFraction,
              ],
            ),
        ).toEqual([
          [
            ExternalGalaxySearchPityStage.NONE,
            0n,
            0.00,
          ],
          [
            ExternalGalaxySearchPityStage.ASSIST_I,
            1n,
            0.10,
          ],
          [
            ExternalGalaxySearchPityStage.ASSIST_II,
            3n,
            0.25,
          ],
          [
            ExternalGalaxySearchPityStage.ASSIST_III,
            5n,
            0.50,
          ],
          [
            ExternalGalaxySearchPityStage.ASSIST_IV,
            7n,
            0.75,
          ],
          [
            ExternalGalaxySearchPityStage.HARD_PITY,
            9n,
            1.00,
          ],
        ]);

        expect(
          ExplorationBalanceV1
            .hardPityFailureThreshold,
        ).toBe(
          9n,
        );

        expect(
          ExplorationBalanceV1
            .hardPityRecoveryFraction,
        ).toBe(
          1.0,
        );
      },
    );

    it(
      'should expose immutable unique monotonic V1 balance tables',
      () => {
        for (
          const table of
          [
            ExplorationBalanceV1
              .discoveryTargetPointBalances,
            ExplorationBalanceV1
              .discoveryStateMilestoneBalances,
            ExplorationBalanceV1
              .discoveryRewardReasonBalances,
            ExplorationBalanceV1
              .externalGalaxyDetectionTierBalances,
            ExplorationBalanceV1
              .externalGalaxyPityStageBalances,
          ]
        ) {
          expect(
            Object.isFrozen(
              table,
            ),
          ).toBe(
            true,
          );
        }

        const detection =
          ExplorationBalanceV1
            .externalGalaxyDetectionTierBalances;

        for (
          let index =
            1;
          index <
            detection.length;
          index +=
            1
        ) {
          expect(
            detection[index]
              .minimumGlobalDiscoveryPoints,
          ).toBeGreaterThan(
            detection[
              index -
                1
            ].minimumGlobalDiscoveryPoints,
          );

          expect(
            detection[index]
              .probabilityPerFutureSearch,
          ).toBeGreaterThanOrEqual(
            detection[
              index -
                1
            ].probabilityPerFutureSearch,
          );
        }

        const pity =
          ExplorationBalanceV1
            .externalGalaxyPityStageBalances;

        for (
          let index =
            1;
          index <
            pity.length;
          index +=
            1
        ) {
          expect(
            pity[index]
              .minimumConsecutiveFailures,
          ).toBeGreaterThan(
            pity[
              index -
                1
            ].minimumConsecutiveFailures,
          );

          expect(
            pity[index]
              .recoveryFraction,
          ).toBeGreaterThanOrEqual(
            pity[
              index -
                1
            ].recoveryFraction,
          );
        }
      },
    );

    it(
      'should preserve frozen 7.1 engine outputs after centralization',
      () => {
        expect(
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
            )
            .awardedDiscoveryPoints,
        ).toBe(
          18,
        );

        expect(
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.BODY,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
            )
            .awardedDiscoveryPoints,
        ).toBe(
          57,
        );

        expect(
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.CIVILIZATION,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
            )
            .awardedDiscoveryPoints,
        ).toBe(
          950,
        );
      },
    );

    it(
      'should preserve frozen 7.2 engine outputs after centralization',
      () => {
        expect(
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              new Set([
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
              ]),
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(
          30,
        );

        expect(
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.BODY,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
              new Set([
                DiscoveryRewardReason.PLANET_DISCOVERY,
                DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
              ]),
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(
          183,
        );

        expect(
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.GALACTIC_OBJECT,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
              new Set([
                DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
                DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
              ]),
            )
            .totalAwardedDiscoveryPoints,
        ).toBe(
          468,
        );
      },
    );

    it(
      'should preserve frozen 7.4 engine thresholds after centralization',
      () => {
        const samples = [
          0n,
          1_000n,
          2_500n,
          5_000n,
          10_000n,
        ] as const;

        for (
          const points
          of samples
        ) {
          const expected =
            ExplorationBalanceV1
              .externalGalaxyDetectionBalanceFor(
                points,
              );

          const actual =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                points,
              );

          expect(
            actual.tier,
          ).toBe(
            expected.tier,
          );

          expect(
            actual.probabilityPerFutureSearch,
          ).toBe(
            expected.probabilityPerFutureSearch,
          );
        }
      },
    );

    it(
      'should preserve the frozen 7.5 baseline pity vector after centralization',
      () => {
        const failures = [
          0n,
          1n,
          3n,
          5n,
          7n,
          9n,
        ] as const;

        const expected = [
          0.02,
          0.118,
          0.265,
          0.51,
          0.755,
          1.0,
        ] as const;

        for (
          let index =
            0;
          index <
            failures.length;
          index +=
            1
        ) {
          expect(
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                canonicalGenerationKey,
                0n,
                failures[index],
              )
              .effectiveProbabilityPerNextSearch,
          ).toBeCloseTo(
            expected[index],
            12,
          );
        }
      },
    );

    it(
      'should keep all four public engines aligned with ExplorationBalanceV1 across exactly 4288 deterministic combinations',
      () => {
        const globalPointSamples = [
          0n,
          999n,
          1_000n,
          2_499n,
          2_500n,
          4_999n,
          5_000n,
          9_999n,
          10_000n,
          1_000_000n,
        ] as const;

        let evaluated =
          0;

        for (
          let index =
            0;
          index <
            4_288;
          index +=
            1
        ) {
          const targetType =
            allTargetTypes[
              index %
                allTargetTypes.length
            ];

          const previousStateIndex =
            index %
            states.length;

          const newStateIndex =
            Math.min(
              states.length -
                1,
              previousStateIndex +
                (
                  (
                    index /
                    states.length
                  ) |
                  0
                ) %
                (
                  states.length -
                  previousStateIndex
                ),
            );

          const previousState =
            states[
              previousStateIndex
            ];

          const newState =
            states[
              newStateIndex
            ];

          const base =
            ExplorationBalanceV1
              .baseDiscoveryPoints(
                targetType,
              );

          const expectedBaseAward =
            ExplorationBalanceV1
              .discoveryMilestones
              .filter(
                (
                  milestone,
                ) =>
                  milestone.code >
                    previousState.code &&
                  milestone.code <=
                    newState.code,
              )
              .reduce(
                (
                  total,
                  milestone,
                ) =>
                  total +
                  base *
                    ExplorationBalanceV1
                      .milestoneMultiplier(
                        milestone,
                      ),
                0,
              );

          const progress =
            ExplorationEngine
              .evaluateDiscoveryTransition(
                canonicalGenerationKey,
                targetType,
                previousState,
                newState,
              );

          expect(
            progress
              .awardedDiscoveryPoints,
          ).toBe(
            expectedBaseAward,
          );

          const extreme =
            ExplorationBalanceV1
              .rewardReasonBalance(
                DiscoveryRewardReason
                  .EXTREME_EVENT_CONFIRMATION,
              );

          const expectedBonus =
            previousState.code <
                extreme
                  .triggerState
                  .code &&
              newState.code >=
                extreme
                  .triggerState
                  .code
              ? extreme
                  .bonusDiscoveryPoints
              : 0;

          const reward =
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                canonicalGenerationKey,
                targetType,
                previousState,
                newState,
                new Set([
                  DiscoveryRewardReason
                    .EXTREME_EVENT_CONFIRMATION,
                ]),
              );

          expect(
            reward
              .bonusDiscoveryPoints,
          ).toBe(
            expectedBonus,
          );

          const globalPoints =
            globalPointSamples[
              index %
                globalPointSamples.length
            ];

          const detectionBalance =
            ExplorationBalanceV1
              .externalGalaxyDetectionBalanceFor(
                globalPoints,
              );

          const detection =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                globalPoints,
              );

          expect(
            detection.tier,
          ).toBe(
            detectionBalance.tier,
          );

          expect(
            detection
              .probabilityPerFutureSearch,
          ).toBe(
            detectionBalance
              .probabilityPerFutureSearch,
          );

          const failures =
            BigInt(
              index %
                20,
            );

          const pityBalance =
            ExplorationBalanceV1
              .externalGalaxyPityBalanceFor(
                failures,
              );

          const pity =
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                canonicalGenerationKey,
                globalPoints,
                failures,
              );

          expect(
            pity.pityStage,
          ).toBe(
            pityBalance.stage,
          );

          expect(
            pity.pityRecoveryFraction,
          ).toBe(
            pityBalance.recoveryFraction,
          );

          evaluated +=
            1;
        }

        expect(
          evaluated,
        ).toBe(
          4_288,
        );
      },
    );
  },
);
