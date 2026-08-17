import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

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
  ExplorationEngine,
} from './exploration-engine';

describe(
  'ExplorationEngine',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
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

    const orderedStates = [
      DiscoveryState.UNKNOWN,
      DiscoveryState.DETECTED,
      DiscoveryState.DISCOVERED,
      DiscoveryState.VISITED,
      DiscoveryState.CATALOGUED,
      DiscoveryState.CONFIRMED,
    ] as const;

    it(
      'should reproduce the frozen SYSTEM UNKNOWN to DISCOVERED vector',
      () => {
        const result =
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
            );

        expect(
          result.crossedMilestones,
        ).toEqual([
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
        ]);

        expect(
          result
            .awardedDiscoveryPoints,
        ).toBe(
          18,
        );

        expect(
          result.didProgress,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reproduce the frozen BODY DISCOVERED to CATALOGUED vector',
      () => {
        const result =
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.BODY,
              DiscoveryState.DISCOVERED,
              DiscoveryState.CATALOGUED,
            );

        expect(
          result.crossedMilestones,
        ).toEqual([
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
        ]);

        expect(
          result
            .awardedDiscoveryPoints,
        ).toBe(
          24,
        );
      },
    );

    it(
      'should reproduce the frozen GALACTIC_OBJECT DETECTED to CONFIRMED vector',
      () => {
        const result =
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.GALACTIC_OBJECT,
              DiscoveryState.DETECTED,
              DiscoveryState.CONFIRMED,
            );

        expect(
          result.crossedMilestones,
        ).toEqual([
          DiscoveryState.DISCOVERED,
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ]);

        expect(
          result
            .awardedDiscoveryPoints,
        ).toBe(
          216,
        );
      },
    );

    it(
      'should preserve frozen UNKNOWN to CONFIRMED totals for every target type',
      () => {
        const cases = [
          {
            targetType:
              DiscoveryTargetType.GALAXY,
            expected:
              760,
          },
          {
            targetType:
              DiscoveryTargetType.SECTOR,
            expected:
              38,
          },
          {
            targetType:
              DiscoveryTargetType.GALACTIC_OBJECT,
            expected:
              228,
          },
          {
            targetType:
              DiscoveryTargetType.SYSTEM,
            expected:
              114,
          },
          {
            targetType:
              DiscoveryTargetType.BODY,
            expected:
              57,
          },
          {
            targetType:
              DiscoveryTargetType.CIVILIZATION,
            expected:
              950,
          },
        ] as const;

        for (
          const item of
          cases
        ) {
          const result =
            ExplorationEngine
              .evaluateDiscoveryTransition(
                canonicalGenerationKey,
                item.targetType,
                DiscoveryState.UNKNOWN,
                DiscoveryState.CONFIRMED,
              );

          expect(
            result.crossedMilestones,
          ).toEqual([
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]);

          expect(
            result
              .awardedDiscoveryPoints,
          ).toBe(
            item.expected,
          );
        }
      },
    );

    it(
      'should preserve exact adjacent milestone rewards for every target type',
      () => {
        const expectedRewards = [
          {
            targetType:
              DiscoveryTargetType.GALAXY,
            rewards:
              [
                40,
                80,
                120,
                200,
                320,
              ],
          },
          {
            targetType:
              DiscoveryTargetType.SECTOR,
            rewards:
              [
                2,
                4,
                6,
                10,
                16,
              ],
          },
          {
            targetType:
              DiscoveryTargetType.GALACTIC_OBJECT,
            rewards:
              [
                12,
                24,
                36,
                60,
                96,
              ],
          },
          {
            targetType:
              DiscoveryTargetType.SYSTEM,
            rewards:
              [
                6,
                12,
                18,
                30,
                48,
              ],
          },
          {
            targetType:
              DiscoveryTargetType.BODY,
            rewards:
              [
                3,
                6,
                9,
                15,
                24,
              ],
          },
          {
            targetType:
              DiscoveryTargetType.CIVILIZATION,
            rewards:
              [
                50,
                100,
                150,
                250,
                400,
              ],
          },
        ] as const;

        for (
          const item of
          expectedRewards
        ) {
          for (
            let index =
              0;
            index <
              item.rewards.length;
            index +=
              1
          ) {
            const result =
              ExplorationEngine
                .evaluateDiscoveryTransition(
                  canonicalGenerationKey,
                  item.targetType,
                  orderedStates[index],
                  orderedStates[
                    index +
                    1
                  ],
                );

            expect(
              result
                .awardedDiscoveryPoints,
            ).toBe(
              item.rewards[
                index
              ],
            );
          }
        }
      },
    );

    it(
      'should award zero points when the discovery state does not change',
      () => {
        for (
          const targetType of
          allTargetTypes
        ) {
          for (
            const state of
            orderedStates
          ) {
            const result =
              ExplorationEngine
                .evaluateDiscoveryTransition(
                  canonicalGenerationKey,
                  targetType,
                  state,
                  state,
                );

            expect(
              result
                .crossedMilestones,
            ).toEqual(
              [],
            );

            expect(
              result
                .awardedDiscoveryPoints,
            ).toBe(
              0,
            );

            expect(
              result.didProgress,
            ).toBe(
              false,
            );
          }
        }
      },
    );

    it(
      'should reject regressive discovery transitions',
      () => {
        expect(
          () =>
            ExplorationEngine
              .evaluateDiscoveryTransition(
                canonicalGenerationKey,
                DiscoveryTargetType.SYSTEM,
                DiscoveryState.CATALOGUED,
                DiscoveryState.DISCOVERED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should make skipped transitions worth exactly the sum of sequential milestones',
      () => {
        for (
          const targetType of
          allTargetTypes
        ) {
          for (
            let start =
              0;
            start <
              orderedStates.length -
                1;
            start +=
              1
          ) {
            for (
              let end =
                start +
                1;
              end <
                orderedStates.length;
              end +=
                1
            ) {
              const direct =
                ExplorationEngine
                  .evaluateDiscoveryTransition(
                    canonicalGenerationKey,
                    targetType,
                    orderedStates[
                      start
                    ],
                    orderedStates[
                      end
                    ],
                  )
                  .awardedDiscoveryPoints;

              let sequential =
                0;

              for (
                let index =
                  start;
                index <
                  end;
                index +=
                  1
              ) {
                sequential +=
                  ExplorationEngine
                    .evaluateDiscoveryTransition(
                      canonicalGenerationKey,
                      targetType,
                      orderedStates[
                        index
                      ],
                      orderedStates[
                        index +
                        1
                      ],
                    )
                    .awardedDiscoveryPoints;
              }

              expect(
                direct,
              ).toBe(
                sequential,
              );
            }
          }
        }
      },
    );

    it(
      'should be deterministic and independent of UniverseSeed for equal V1 transitions',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.CIVILIZATION,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
            );

        const repeated =
          ExplorationEngine
            .evaluateDiscoveryTransition(
              canonicalGenerationKey,
              DiscoveryTargetType.CIVILIZATION,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
            );

        const otherSeed =
          ExplorationEngine
            .evaluateDiscoveryTransition(
              otherGenerationKey,
              DiscoveryTargetType.CIVILIZATION,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
            );

        expect(
          repeated,
        ).toEqual(
          first,
        );

        expect(
          otherSeed,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should preserve the V1 relative base reward ordering',
      () => {
        const rewardFor =
          (
            targetType:
              ReturnType<
                typeof DiscoveryTargetType.fromCode
              >,
          ):
            number =>
              ExplorationEngine
                .evaluateDiscoveryTransition(
                  canonicalGenerationKey,
                  targetType,
                  DiscoveryState.UNKNOWN,
                  DiscoveryState.DETECTED,
                )
                .awardedDiscoveryPoints;

        const civilization =
          rewardFor(
            DiscoveryTargetType.CIVILIZATION,
          );

        const galaxy =
          rewardFor(
            DiscoveryTargetType.GALAXY,
          );

        const galacticObject =
          rewardFor(
            DiscoveryTargetType.GALACTIC_OBJECT,
          );

        const system =
          rewardFor(
            DiscoveryTargetType.SYSTEM,
          );

        const body =
          rewardFor(
            DiscoveryTargetType.BODY,
          );

        const sector =
          rewardFor(
            DiscoveryTargetType.SECTOR,
          );

        expect(
          civilization,
        ).toBeGreaterThan(
          galaxy,
        );

        expect(
          galaxy,
        ).toBeGreaterThan(
          galacticObject,
        );

        expect(
          galacticObject,
        ).toBeGreaterThan(
          system,
        );

        expect(
          system,
        ).toBeGreaterThan(
          body,
        );

        expect(
          body,
        ).toBeGreaterThan(
          sector,
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            ExplorationEngine
              .evaluateDiscoveryTransition(
                unsupportedGenerationKey,
                DiscoveryTargetType.SYSTEM,
                DiscoveryState.UNKNOWN,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
