import {
  ExternalGalaxyDetectionProbabilityTier,
} from '../../domain/exploration/external-galaxy-detection-probability-profile';

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
  ExternalGalaxyDetectionProbabilityEngine,
} from './external-galaxy-detection-probability-engine';

describe(
  'ExternalGalaxyDetectionProbabilityEngine',
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
      'should reproduce the frozen V1 bootstrap probability at 0 global PD',
      () => {
        const profile =
          ExternalGalaxyDetectionProbabilityEngine
            .evaluateFutureSearchProbability(
              canonicalGenerationKey,
              0n,
            );

        expect(
          profile.globalDiscoveryPoints,
        ).toBe(
          0n,
        );

        expect(
          profile.tier,
        ).toBe(
          ExternalGalaxyDetectionProbabilityTier
            .BASELINE,
        );

        expect(
          profile.probabilityPerFutureSearch,
        ).toBe(
          0.02,
        );
      },
    );

    it(
      'should preserve the BASELINE interval through 999 global PD',
      () => {
        for (
          const points of
          [
            0n,
            1n,
            500n,
            999n,
          ]
        ) {
          const profile =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                points,
              );

          expect(
            profile.tier,
          ).toBe(
            ExternalGalaxyDetectionProbabilityTier
              .BASELINE,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBe(
            0.02,
          );
        }
      },
    );

    it(
      'should switch exactly to ENHANCED at 1000 global PD and keep it through 2499',
      () => {
        for (
          const points of
          [
            1_000n,
            1_001n,
            2_499n,
          ]
        ) {
          const profile =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                points,
              );

          expect(
            profile.tier,
          ).toBe(
            ExternalGalaxyDetectionProbabilityTier
              .ENHANCED,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBe(
            0.05,
          );
        }
      },
    );

    it(
      'should switch exactly to ADVANCED at 2500 global PD and keep it through 4999',
      () => {
        for (
          const points of
          [
            2_500n,
            2_501n,
            4_999n,
          ]
        ) {
          const profile =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                points,
              );

          expect(
            profile.tier,
          ).toBe(
            ExternalGalaxyDetectionProbabilityTier
              .ADVANCED,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBe(
            0.10,
          );
        }
      },
    );

    it(
      'should switch exactly to DEEP at 5000 global PD and keep it through 9999',
      () => {
        for (
          const points of
          [
            5_000n,
            5_001n,
            9_999n,
          ]
        ) {
          const profile =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                points,
              );

          expect(
            profile.tier,
          ).toBe(
            ExternalGalaxyDetectionProbabilityTier
              .DEEP,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBe(
            0.18,
          );
        }
      },
    );

    it(
      'should switch exactly to FRONTIER at 10000 global PD and remain capped at 0.30',
      () => {
        for (
          const points of
          [
            10_000n,
            10_001n,
            1_000_000n,
            9_223_372_036_854_775_807n,
          ]
        ) {
          const profile =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                points,
              );

          expect(
            profile.tier,
          ).toBe(
            ExternalGalaxyDetectionProbabilityTier
              .FRONTIER,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBe(
            0.30,
          );
        }
      },
    );

    it(
      'should preserve the complete frozen V1 threshold table and monotonic probability ordering',
      () => {
        const cases = [
          {
            points:
              0n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .BASELINE,
            probability:
              0.02,
          },
          {
            points:
              1_000n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .ENHANCED,
            probability:
              0.05,
          },
          {
            points:
              2_500n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .ADVANCED,
            probability:
              0.10,
          },
          {
            points:
              5_000n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .DEEP,
            probability:
              0.18,
          },
          {
            points:
              10_000n,
            tier:
              ExternalGalaxyDetectionProbabilityTier
                .FRONTIER,
            probability:
              0.30,
          },
        ] as const;

        let previousProbability =
          -1.0;

        for (
          const item of
          cases
        ) {
          const profile =
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                item.points,
              );

          expect(
            profile.tier,
          ).toBe(
            item.tier,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBe(
            item.probability,
          );

          expect(
            profile.probabilityPerFutureSearch,
          ).toBeGreaterThan(
            previousProbability,
          );

          previousProbability =
            profile.probabilityPerFutureSearch;
        }
      },
    );

    it(
      'should be deterministic and independent of UniverseSeed for equal V1 global PD',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          ExternalGalaxyDetectionProbabilityEngine
            .evaluateFutureSearchProbability(
              canonicalGenerationKey,
              5_000n,
            );

        const repeated =
          ExternalGalaxyDetectionProbabilityEngine
            .evaluateFutureSearchProbability(
              canonicalGenerationKey,
              5_000n,
            );

        const otherSeed =
          ExternalGalaxyDetectionProbabilityEngine
            .evaluateFutureSearchProbability(
              otherGenerationKey,
              5_000n,
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
      'should depend on global PD only and require no galaxy-local progress input',
      () => {
        const before =
          ExternalGalaxyDetectionProbabilityEngine
            .evaluateFutureSearchProbability(
              canonicalGenerationKey,
              999n,
            );

        const after =
          ExternalGalaxyDetectionProbabilityEngine
            .evaluateFutureSearchProbability(
              canonicalGenerationKey,
              1_000n,
            );

        expect(
          before.tier,
        ).toBe(
          ExternalGalaxyDetectionProbabilityTier
            .BASELINE,
        );

        expect(
          after.tier,
        ).toBe(
          ExternalGalaxyDetectionProbabilityTier
            .ENHANCED,
        );

        expect(
          after.probabilityPerFutureSearch,
        ).toBeGreaterThan(
          before.probabilityPerFutureSearch,
        );
      },
    );

    it(
      'should reject global Discovery Points outside signed Long range',
      () => {
        expect(
          () =>
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                -1n,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                canonicalGenerationKey,
                9_223_372_036_854_775_808n,
              ),
        ).toThrow(
          RangeError,
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
            ExternalGalaxyDetectionProbabilityEngine
              .evaluateFutureSearchProbability(
                unsupportedGenerationKey,
                1_000n,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
