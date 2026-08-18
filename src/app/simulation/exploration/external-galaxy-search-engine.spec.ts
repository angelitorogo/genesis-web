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
  ExternalGalaxySearchEngine,
} from './external-galaxy-search-engine';

describe(
  'ExternalGalaxySearchEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should preserve the frozen B5 first-search V1 vector',
      () => {
        const result =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              0n,
              0n,
              0n,
              [
                0n,
              ],
            );

        expect(
          result
            .probabilityProfile
            .baseProbabilityPerFutureSearch,
        ).toBe(
          0.02,
        );

        expect(
          result
            .probabilityProfile
            .effectiveProbabilityPerNextSearch,
        ).toBe(
          0.02,
        );

        expect(
          result
            .detectionRoll,
        ).toBeCloseTo(
          0.24945188957711262,
          15,
        );

        expect(
          result.detected,
        ).toBe(
          false,
        );

        expect(
          result
            .detectedGalaxyIndex,
        ).toBeNull();

        expect(
          result
            .consecutiveFailedSearchesAfter,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should detect the frozen B5 external galaxy on the seventh baseline-cycle attempt',
      () => {
        const result =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              0n,
              6n,
              0n,
              [
                0n,
              ],
            );

        expect(
          result
            .probabilityProfile
            .effectiveProbabilityPerNextSearch,
        ).toBe(
          0.51,
        );

        expect(
          result
            .detectionRoll,
        ).toBeCloseTo(
          0.03985791525420468,
          15,
        );

        expect(
          result.detected,
        ).toBe(
          true,
        );

        expect(
          result
            .detectedGalaxyIndex,
        ).toBe(
          6_144_476_401_109_999_526n,
        );

        expect(
          result
            .consecutiveFailedSearchesAfter,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should guarantee detection at hard pity without changing the frozen 7.5 balance',
      () => {
        const result =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              0n,
              9n,
              0n,
              [
                0n,
              ],
            );

        expect(
          result
            .probabilityProfile
            .pityStage,
        ).toBe(
          ExternalGalaxySearchPityStage
            .HARD_PITY,
        );

        expect(
          result
            .probabilityProfile
            .effectiveProbabilityPerNextSearch,
        ).toBe(
          1,
        );

        expect(
          result.detected,
        ).toBe(
          true,
        );

        expect(
          result
            .detectedGalaxyIndex,
        ).toBe(
          3_471_737_127_698_859_625n,
        );
      },
    );

    it(
      'should deterministically probe past a galaxy index that is already known',
      () => {
        const frozenCandidate =
          6_144_476_401_109_999_526n;

        const result =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              0n,
              6n,
              0n,
              [
                0n,
                frozenCandidate,
              ],
            );

        expect(
          result.detected,
        ).toBe(
          true,
        );

        expect(
          result
            .detectedGalaxyIndex,
        ).toBe(
          frozenCandidate +
          1n,
        );
      },
    );

    it(
      'should isolate later search cycles from the first external-galaxy cycle',
      () => {
        const firstCycle =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              0n,
              9n,
              0n,
              [
                0n,
              ],
            );

        const secondCycle =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              0n,
              9n,
              1n,
              [
                0n,
                firstCycle
                  .detectedGalaxyIndex ??
                  1n,
              ],
            );

        expect(
          secondCycle
            .detectedGalaxyIndex,
        ).toBe(
          4_174_905_149_368_781_301n,
        );

        expect(
          secondCycle
            .detectedGalaxyIndex,
        ).not.toBe(
          firstCycle
            .detectedGalaxyIndex,
        );
      },
    );

    it(
      'should be deterministic and independent of unrelated search queries',
      () => {
        const expected =
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              1_250n,
              3n,
              2n,
              [
                0n,
                7n,
              ],
            );

        for (
          const failures
          of [
            0n,
            1n,
            5n,
            9n,
          ]
        ) {
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              10_000n,
              failures,
              4n,
              [
                0n,
                1n,
                2n,
              ],
            );
        }

        expect(
          ExternalGalaxySearchEngine
            .resolveNextSearch(
              generationKey,
              1_250n,
              3n,
              2n,
              [
                0n,
                7n,
              ],
            ),
        ).toEqual(
          expected,
        );
      },
    );

    it(
      'should reject invalid signed-Long state and unsupported generator versions',
      () => {
        expect(
          () =>
            ExternalGalaxySearchEngine
              .resolveNextSearch(
                generationKey,
                0n,
                -1n,
                0n,
                [],
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExternalGalaxySearchEngine
              .resolveNextSearch(
                generationKey,
                0n,
                0n,
                -1n,
                [],
              ),
        ).toThrow(
          RangeError,
        );

        const unsupported =
          {
            universeSeed:
              generationKey
                .universeSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            ExternalGalaxySearchEngine
              .resolveNextSearch(
                unsupported,
                0n,
                0n,
                0n,
                [],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
