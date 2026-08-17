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
  ExternalGalaxySearchPityEngine,
} from './external-galaxy-search-pity-engine';

describe(
  'ExternalGalaxySearchPityEngine',
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
      'should preserve the exact 7.4 probability when there are zero failures',
      () => {
        const profile =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              0n,
              0n,
            );

        expect(
          profile.pityStage,
        ).toBe(
          ExternalGalaxySearchPityStage
            .NONE,
        );

        expect(
          profile.pityRecoveryFraction,
        ).toBe(
          0.0,
        );

        expect(
          profile.baseProbabilityPerFutureSearch,
        ).toBe(
          0.02,
        );

        expect(
          profile.effectiveProbabilityPerNextSearch,
        ).toBe(
          0.02,
        );
      },
    );

    it(
      'should reproduce the complete frozen BASELINE pity vector',
      () => {
        const cases = [
          {
            failures:
              0n,
            stage:
              ExternalGalaxySearchPityStage
                .NONE,
            recovery:
              0.0,
            probability:
              0.02,
          },
          {
            failures:
              1n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_I,
            recovery:
              0.10,
            probability:
              0.118,
          },
          {
            failures:
              2n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_I,
            recovery:
              0.10,
            probability:
              0.118,
          },
          {
            failures:
              3n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_II,
            recovery:
              0.25,
            probability:
              0.265,
          },
          {
            failures:
              4n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_II,
            recovery:
              0.25,
            probability:
              0.265,
          },
          {
            failures:
              5n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_III,
            recovery:
              0.50,
            probability:
              0.51,
          },
          {
            failures:
              6n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_III,
            recovery:
              0.50,
            probability:
              0.51,
          },
          {
            failures:
              7n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_IV,
            recovery:
              0.75,
            probability:
              0.755,
          },
          {
            failures:
              8n,
            stage:
              ExternalGalaxySearchPityStage
                .ASSIST_IV,
            recovery:
              0.75,
            probability:
              0.755,
          },
          {
            failures:
              9n,
            stage:
              ExternalGalaxySearchPityStage
                .HARD_PITY,
            recovery:
              1.0,
            probability:
              1.0,
          },
        ] as const;

        for (
          const item of
          cases
        ) {
          const profile =
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                canonicalGenerationKey,
                0n,
                item.failures,
              );

          expect(
            profile.pityStage,
          ).toBe(
            item.stage,
          );

          expect(
            profile.pityRecoveryFraction,
          ).toBe(
            item.recovery,
          );

          expect(
            profile.effectiveProbabilityPerNextSearch,
          ).toBeCloseTo(
            item.probability,
            12,
          );
        }
      },
    );

    it(
      'should reproduce frozen assisted probabilities for every 7.4 tier',
      () => {
        const cases = [
          {
            points:
              0n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .BASELINE,
            expected:
              [
                0.02,
                0.118,
                0.265,
                0.51,
                0.755,
                1.0,
              ],
          },
          {
            points:
              1_000n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .ENHANCED,
            expected:
              [
                0.05,
                0.145,
                0.2875,
                0.525,
                0.7625,
                1.0,
              ],
          },
          {
            points:
              2_500n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .ADVANCED,
            expected:
              [
                0.10,
                0.19,
                0.325,
                0.55,
                0.775,
                1.0,
              ],
          },
          {
            points:
              5_000n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .DEEP,
            expected:
              [
                0.18,
                0.262,
                0.385,
                0.59,
                0.795,
                1.0,
              ],
          },
          {
            points:
              10_000n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .FRONTIER,
            expected:
              [
                0.30,
                0.37,
                0.475,
                0.65,
                0.825,
                1.0,
              ],
          },
        ] as const;

        const failureSamples = [
          0n,
          1n,
          3n,
          5n,
          7n,
          9n,
        ] as const;

        for (
          const item of
          cases
        ) {
          for (
            let index =
              0;
            index <
              failureSamples.length;
            index +=
              1
          ) {
            const profile =
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  canonicalGenerationKey,
                  item.points,
                  failureSamples[index],
                );

            expect(
              profile
                .baseDetectionProfile
                .tier,
            ).toBe(
              item.tier,
            );

            expect(
              profile.effectiveProbabilityPerNextSearch,
            ).toBeCloseTo(
              item.expected[index],
              12,
            );
          }
        }
      },
    );

    it(
      'should guarantee the next search after nine consecutive failures and not before',
      () => {
        const before =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              0n,
              8n,
            );

        const guaranteed =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              0n,
              9n,
            );

        expect(
          before
            .isGuaranteedNextSearch,
        ).toBe(
          false,
        );

        expect(
          before
            .effectiveProbabilityPerNextSearch,
        ).toBeLessThan(
          1.0,
        );

        expect(
          guaranteed
            .isGuaranteedNextSearch,
        ).toBe(
          true,
        );

        expect(
          guaranteed
            .effectiveProbabilityPerNextSearch,
        ).toBe(
          1.0,
        );
      },
    );

    it(
      'should remain at HARD_PITY for arbitrarily large valid failure streaks without overflow',
      () => {
        const profile =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              0n,
              9_223_372_036_854_775_807n,
            );

        expect(
          profile.pityStage,
        ).toBe(
          ExternalGalaxySearchPityStage
            .HARD_PITY,
        );

        expect(
          profile.effectiveProbabilityPerNextSearch,
        ).toBe(
          1.0,
        );
      },
    );

    it(
      'should be monotonic across increasing failure streaks',
      () => {
        let previous =
          -1.0;

        for (
          let failures =
            0n;
          failures <=
            20n;
          failures +=
            1n
        ) {
          const current =
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                canonicalGenerationKey,
                0n,
                failures,
              )
              .effectiveProbabilityPerNextSearch;

          expect(
            current,
          ).toBeGreaterThanOrEqual(
            previous,
          );

          previous =
            current;
        }
      },
    );

    it(
      'should remain monotonic when global PD increase across 7.4 tiers for an equal failure streak',
      () => {
        const pointSamples = [
          0n,
          1_000n,
          2_500n,
          5_000n,
          10_000n,
        ];

        for (
          const failures of
          [
            0n,
            1n,
            3n,
            5n,
            7n,
            8n,
          ]
        ) {
          let previous =
            -1.0;

          for (
            const points of
            pointSamples
          ) {
            const current =
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  canonicalGenerationKey,
                  points,
                  failures,
                )
                .effectiveProbabilityPerNextSearch;

            expect(
              current,
            ).toBeGreaterThanOrEqual(
              previous,
            );

            previous =
              current;
          }
        }
      },
    );

    it(
      'should be deterministic and independent of UniverseSeed for equal V1 inputs',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              5_000n,
              7n,
            );

        const repeated =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              5_000n,
              7n,
            );

        const otherSeed =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              otherGenerationKey,
              5_000n,
              7n,
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
      'should preserve the failure streak when global PD move to another 7.4 tier',
      () => {
        const before =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              999n,
              5n,
            );

        const after =
          ExternalGalaxySearchPityEngine
            .evaluateNextSearchProbability(
              canonicalGenerationKey,
              1_000n,
              5n,
            );

        expect(
          before.consecutiveFailedSearches,
        ).toBe(
          5n,
        );

        expect(
          after.consecutiveFailedSearches,
        ).toBe(
          5n,
        );

        expect(
          before.pityStage,
        ).toBe(
          ExternalGalaxySearchPityStage
            .ASSIST_III,
        );

        expect(
          after.pityStage,
        ).toBe(
          ExternalGalaxySearchPityStage
            .ASSIST_III,
        );

        expect(
          after.effectiveProbabilityPerNextSearch,
        ).toBeGreaterThan(
          before.effectiveProbabilityPerNextSearch,
        );
      },
    );

    it(
      'should reject negative or overflowing failure counts',
      () => {
        expect(
          () =>
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                canonicalGenerationKey,
                0n,
                -1n,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                canonicalGenerationKey,
                0n,
                9_223_372_036_854_775_808n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve deterministic V1 contracts across more than 1024 combinations and reject unsupported versions',
      () => {
        const pointSamples = [
          0n,
          1_000n,
          2_500n,
          5_000n,
          10_000n,
        ] as const;

        let evaluated =
          0;

        for (
          const points of
          pointSamples
        ) {
          for (
            let failures =
              0n;
            failures <=
              240n;
            failures +=
              1n
          ) {
            const first =
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  canonicalGenerationKey,
                  points,
                  failures,
                );

            const repeated =
              ExternalGalaxySearchPityEngine
                .evaluateNextSearchProbability(
                  canonicalGenerationKey,
                  points,
                  failures,
                );

            expect(
              repeated,
            ).toEqual(
              first,
            );

            expect(
              first.effectiveProbabilityPerNextSearch,
            ).toBeGreaterThanOrEqual(
              first.baseProbabilityPerFutureSearch,
            );

            expect(
              first.effectiveProbabilityPerNextSearch,
            ).toBeLessThanOrEqual(
              1.0,
            );

            evaluated +=
              1;
          }
        }

        expect(
          evaluated,
        ).toBeGreaterThan(
          1_024,
        );

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
            ExternalGalaxySearchPityEngine
              .evaluateNextSearchProbability(
                unsupportedGenerationKey,
                0n,
                0n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);