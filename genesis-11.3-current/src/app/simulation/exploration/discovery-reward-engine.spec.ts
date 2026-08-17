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

describe(
  'DiscoveryRewardEngine',
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

    it(
      'should reproduce SYSTEM UNKNOWN to DISCOVERED with SYSTEM_DISCOVERY',
      () => {
        const result =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              new Set([
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
              ]),
            );

        expect(
          result.baseDiscoveryPoints,
        ).toBe(
          18,
        );

        expect(
          result.bonusDiscoveryPoints,
        ).toBe(
          12,
        );

        expect(
          result.totalAwardedDiscoveryPoints,
        ).toBe(
          30,
        );

        expect(
          result.awardedRewardReasons,
        ).toEqual([
          DiscoveryRewardReason.SYSTEM_DISCOVERY,
        ]);
      },
    );

    it(
      'should reproduce BODY planet discovery reward',
      () => {
        const result =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.BODY,
              DiscoveryState.UNKNOWN,
              DiscoveryState.DISCOVERED,
              new Set([
                DiscoveryRewardReason.PLANET_DISCOVERY,
              ]),
            );

        expect(
          result.baseDiscoveryPoints,
        ).toBe(
          9,
        );

        expect(
          result.bonusDiscoveryPoints,
        ).toBe(
          6,
        );

        expect(
          result.totalAwardedDiscoveryPoints,
        ).toBe(
          15,
        );
      },
    );

    it(
      'should reproduce BODY planet plus biosphere UNKNOWN to CONFIRMED vector',
      () => {
        const result =
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
            );

        expect(
          result.baseDiscoveryPoints,
        ).toBe(
          57,
        );

        expect(
          result.bonusDiscoveryPoints,
        ).toBe(
          126,
        );

        expect(
          result.totalAwardedDiscoveryPoints,
        ).toBe(
          183,
        );

        expect(
          result.awardedRewardReasons,
        ).toEqual([
          DiscoveryRewardReason.PLANET_DISCOVERY,
          DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
        ]);
      },
    );

    it(
      'should reproduce rare object UNKNOWN to CATALOGUED vector',
      () => {
        const result =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.GALACTIC_OBJECT,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CATALOGUED,
              new Set([
                DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
              ]),
            );

        expect(
          result.baseDiscoveryPoints,
        ).toBe(
          132,
        );

        expect(
          result.bonusDiscoveryPoints,
        ).toBe(
          60,
        );

        expect(
          result.totalAwardedDiscoveryPoints,
        ).toBe(
          192,
        );
      },
    );

    it(
      'should reproduce rare object plus extreme event UNKNOWN to CONFIRMED vector',
      () => {
        const result =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.GALACTIC_OBJECT,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
              new Set([
                DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
              ]),
            );

        expect(
          result.baseDiscoveryPoints,
        ).toBe(
          228,
        );

        expect(
          result.bonusDiscoveryPoints,
        ).toBe(
          240,
        );

        expect(
          result.totalAwardedDiscoveryPoints,
        ).toBe(
          468,
        );

        expect(
          result.awardedRewardReasons,
        ).toEqual([
          DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
          DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
        ]);
      },
    );

    it(
      'should not award a differentiated bonus before its trigger and should award nothing for same-state transitions',
      () => {
        const beforeTrigger =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.BODY,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CATALOGUED,
              new Set([
                DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
              ]),
            );

        expect(
          beforeTrigger.bonusDiscoveryPoints,
        ).toBe(
          0,
        );

        expect(
          beforeTrigger.awardedRewardReasons,
        ).toEqual(
          [],
        );

        const sameState =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.SYSTEM,
              DiscoveryState.DISCOVERED,
              DiscoveryState.DISCOVERED,
              new Set([
                DiscoveryRewardReason.SYSTEM_DISCOVERY,
              ]),
            );

        expect(
          sameState.baseDiscoveryPoints,
        ).toBe(
          0,
        );

        expect(
          sameState.bonusDiscoveryPoints,
        ).toBe(
          0,
        );

        expect(
          sameState.totalAwardedDiscoveryPoints,
        ).toBe(
          0,
        );

        expect(
          sameState.awardedRewardReasons,
        ).toEqual(
          [],
        );
      },
    );

    it(
      'should reject regressions and incompatible reward reasons',
      () => {
        expect(
          () =>
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                canonicalGenerationKey,
                DiscoveryTargetType.SYSTEM,
                DiscoveryState.CATALOGUED,
                DiscoveryState.DISCOVERED,
                new Set(),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                canonicalGenerationKey,
                DiscoveryTargetType.SYSTEM,
                DiscoveryState.UNKNOWN,
                DiscoveryState.DISCOVERED,
                new Set([
                  DiscoveryRewardReason.PLANET_DISCOVERY,
                ]),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                canonicalGenerationKey,
                DiscoveryTargetType.GALAXY,
                DiscoveryState.UNKNOWN,
                DiscoveryState.CONFIRMED,
                new Set([
                  DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
                ]),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve path independence for BODY planet and biosphere rewards',
      () => {
        const reasons =
          new Set([
            DiscoveryRewardReason.PLANET_DISCOVERY,
            DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
          ]);

        const direct =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.BODY,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
              reasons,
            )
            .totalAwardedDiscoveryPoints;

        const states = [
          DiscoveryState.UNKNOWN,
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ] as const;

        let sequential =
          0;

        for (
          let index =
            0;
          index <
            states.length -
              1;
          index +=
            1
        ) {
          sequential +=
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                canonicalGenerationKey,
                DiscoveryTargetType.BODY,
                states[index],
                states[
                  index +
                  1
                ],
                reasons,
              )
              .totalAwardedDiscoveryPoints;
        }

        expect(
          direct,
        ).toBe(
          183,
        );

        expect(
          sequential,
        ).toBe(
          183,
        );
      },
    );

    it(
      'should preserve path independence for rare object and extreme event rewards',
      () => {
        const reasons =
          new Set([
            DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
            DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
          ]);

        const direct =
          DiscoveryRewardEngine
            .evaluateDiscoveryReward(
              canonicalGenerationKey,
              DiscoveryTargetType.GALACTIC_OBJECT,
              DiscoveryState.UNKNOWN,
              DiscoveryState.CONFIRMED,
              reasons,
            )
            .totalAwardedDiscoveryPoints;

        const states = [
          DiscoveryState.UNKNOWN,
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ] as const;

        let sequential =
          0;

        for (
          let index =
            0;
          index <
            states.length -
              1;
          index +=
            1
        ) {
          sequential +=
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                canonicalGenerationKey,
                DiscoveryTargetType.GALACTIC_OBJECT,
                states[index],
                states[
                  index +
                  1
                ],
                reasons,
              )
              .totalAwardedDiscoveryPoints;
        }

        expect(
          direct,
        ).toBe(
          468,
        );

        expect(
          sequential,
        ).toBe(
          468,
        );
      },
    );

    it(
      'should be UniverseSeed-independent and preserve deterministic canonical ordering across more than 256 combinations',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const states = [
          DiscoveryState.UNKNOWN,
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ] as const;

        const cases = [
          {
            target:
              DiscoveryTargetType.GALAXY,
            reasonSets:
              [
                new Set<DiscoveryRewardReason>(),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ]),
              ],
          },
          {
            target:
              DiscoveryTargetType.SECTOR,
            reasonSets:
              [
                new Set<DiscoveryRewardReason>(),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ]),
              ],
          },
          {
            target:
              DiscoveryTargetType.GALACTIC_OBJECT,
            reasonSets:
              [
                new Set<DiscoveryRewardReason>(),
                new Set([
                  DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
                ]),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ]),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                  DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
                ]),
              ],
          },
          {
            target:
              DiscoveryTargetType.SYSTEM,
            reasonSets:
              [
                new Set<DiscoveryRewardReason>(),
                new Set([
                  DiscoveryRewardReason.SYSTEM_DISCOVERY,
                ]),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ]),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                  DiscoveryRewardReason.SYSTEM_DISCOVERY,
                ]),
              ],
          },
          {
            target:
              DiscoveryTargetType.BODY,
            reasonSets:
              [
                new Set<DiscoveryRewardReason>(),
                new Set([
                  DiscoveryRewardReason.PLANET_DISCOVERY,
                ]),
                new Set([
                  DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
                ]),
                new Set([
                  DiscoveryRewardReason.PLANET_DISCOVERY,
                  DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
                ]),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ]),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                  DiscoveryRewardReason.PLANET_DISCOVERY,
                  DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
                ]),
              ],
          },
          {
            target:
              DiscoveryTargetType.CIVILIZATION,
            reasonSets:
              [
                new Set<DiscoveryRewardReason>(),
                new Set([
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ]),
              ],
          },
        ] as const;

        let evaluated =
          0;

        for (
          const item of
          cases
        ) {
          for (
            const reasons of
            item.reasonSets
          ) {
            for (
              let start =
                0;
              start <
                states.length;
              start +=
                1
            ) {
              for (
                let end =
                  start;
                end <
                  states.length;
                end +=
                  1
              ) {
                const first =
                  DiscoveryRewardEngine
                    .evaluateDiscoveryReward(
                      canonicalGenerationKey,
                      item.target,
                      states[start],
                      states[end],
                      reasons,
                    );

                const repeated =
                  DiscoveryRewardEngine
                    .evaluateDiscoveryReward(
                      canonicalGenerationKey,
                      item.target,
                      states[start],
                      states[end],
                      reasons,
                    );

                const otherSeed =
                  DiscoveryRewardEngine
                    .evaluateDiscoveryReward(
                      otherGenerationKey,
                      item.target,
                      states[start],
                      states[end],
                      reasons,
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

                const canonicalOrder = [
                  DiscoveryRewardReason.SYSTEM_DISCOVERY,
                  DiscoveryRewardReason.PLANET_DISCOVERY,
                  DiscoveryRewardReason.BIOSPHERE_CONFIRMATION,
                  DiscoveryRewardReason.RARE_OBJECT_CATALOGUING,
                  DiscoveryRewardReason.EXTREME_EVENT_CONFIRMATION,
                ];

                const indices =
                  first
                    .awardedRewardReasons
                    .map(
                      (
                        reason,
                      ) =>
                        canonicalOrder
                          .indexOf(
                            reason,
                          ),
                    );

                expect(
                  indices,
                ).toEqual(
                  [
                    ...indices,
                  ].sort(
                    (
                      a,
                      b,
                    ) =>
                      a -
                      b,
                  ),
                );

                evaluated +=
                  1;
              }
            }
          }
        }

        expect(
          evaluated,
        ).toBeGreaterThan(
          256,
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
            DiscoveryRewardEngine
              .evaluateDiscoveryReward(
                unsupportedGenerationKey,
                DiscoveryTargetType.SYSTEM,
                DiscoveryState.UNKNOWN,
                DiscoveryState.DISCOVERED,
                new Set([
                  DiscoveryRewardReason.SYSTEM_DISCOVERY,
                ]),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
