import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyFocusChoice,
} from '../../domain/exploration/external-galaxy-focus';

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
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  ExternalGalaxyFocusEngine,
} from './external-galaxy-focus-engine';

describe(
  'ExternalGalaxyFocusEngine',
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

    function canonicalOffer() {

      return ExternalGalaxyFocusEngine
        .buildFocusOffer(
          canonicalGenerationKey,
          0n,
          1n,
          DiscoveryState.DETECTED,
        );
    }

    it(
      'should reproduce the canonical 0 to 1 focus offer',
      () => {
        const offer =
          canonicalOffer();

        expect(
          offer.currentGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          offer.detectedGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          offer.detectedGalaxyKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          offer.availableChoices,
        ).toEqual([
          ExternalGalaxyFocusChoice
            .REMAIN_CURRENT,

          ExternalGalaxyFocusChoice
            .FOCUS_DETECTED,
        ]);
      },
    );

    it(
      'should resolve REMAIN_CURRENT to the current galaxy without changing focus',
      () => {
        const decision =
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              canonicalOffer(),
              ExternalGalaxyFocusChoice
                .REMAIN_CURRENT,
            );

        expect(
          decision.previousFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          decision.detectedGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          decision.resultingFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          decision.didChangeFocus,
        ).toBe(
          false,
        );

        expect(
          decision.remainedOnCurrentGalaxy,
        ).toBe(
          true,
        );

        expect(
          decision.focusedDetectedGalaxy,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should resolve FOCUS_DETECTED to the detected galaxy',
      () => {
        const decision =
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              canonicalOffer(),
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
            );

        expect(
          decision.previousFocusGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          decision.detectedGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          decision.resultingFocusGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          decision.didChangeFocus,
        ).toBe(
          true,
        );

        expect(
          decision.remainedOnCurrentGalaxy,
        ).toBe(
          false,
        );

        expect(
          decision.focusedDetectedGalaxy,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should integrate canonically with the point-7.6 preliminary projection using only galaxy index and knowledge state',
      () => {
        const preliminary =
          ExternalGalaxyPreliminaryInformationGenerator
            .generate(
              canonicalGenerationKey,
              1n,
              DiscoveryState.DETECTED,
            );

        const offer =
          ExternalGalaxyFocusEngine
            .buildFocusOffer(
              canonicalGenerationKey,
              0n,
              preliminary.galaxyIndex,
              preliminary.knowledgeState,
            );

        expect(
          offer.detectedGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          offer.detectedGalaxyKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );
      },
    );

    it(
      'should accept every detected-galaxy knowledge state from DETECTED through CONFIRMED',
      () => {
        for (
          const state of
          [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          expect(
            ExternalGalaxyFocusEngine
              .buildFocusOffer(
                canonicalGenerationKey,
                0n,
                1n,
                state,
              )
              .detectedGalaxyKnowledgeState,
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should reject UNKNOWN detected-galaxy knowledge',
      () => {
        expect(
          () =>
            ExternalGalaxyFocusEngine
              .buildFocusOffer(
                canonicalGenerationKey,
                0n,
                1n,
                DiscoveryState.UNKNOWN,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject offers where the detected galaxy is already the current focus',
      () => {
        for (
          const index of
          [
            0n,
            1n,
            42n,
          ]
        ) {
          expect(
            () =>
              ExternalGalaxyFocusEngine
                .buildFocusOffer(
                  canonicalGenerationKey,
                  index,
                  index,
                  DiscoveryState.DETECTED,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should support signed Long maximum galaxy indices without overflow or truncation',
      () => {
        const maxIndex =
          9_223_372_036_854_775_807n;

        const offer =
          ExternalGalaxyFocusEngine
            .buildFocusOffer(
              canonicalGenerationKey,
              0n,
              maxIndex,
              DiscoveryState.DETECTED,
            );

        const decision =
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              offer,
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
            );

        expect(
          decision.resultingFocusGalaxyIndex,
        ).toBe(
          maxIndex,
        );
      },
    );

    it(
      'should be deterministic for repeated equal offers and choices',
      () => {
        const firstOffer =
          canonicalOffer();

        const repeatedOffer =
          canonicalOffer();

        expect(
          repeatedOffer,
        ).toEqual(
          firstOffer,
        );

        expect(
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              repeatedOffer,
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
            ),
        ).toEqual(
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              firstOffer,
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
            ),
        );
      },
    );

    it(
      'should be query-order independent and UniverseSeed independent for equal focus inputs',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const inputs = [
          {
            current:
              0n,
            detected:
              1n,
          },
          {
            current:
              3n,
            detected:
              10n,
          },
          {
            current:
              42n,
            detected:
              987654321n,
          },
        ] as const;

        const forward =
          inputs.map(
            (
              input,
            ) =>
              ExternalGalaxyFocusEngine
                .resolveFocusChoice(
                  canonicalGenerationKey,
                  ExternalGalaxyFocusEngine
                    .buildFocusOffer(
                      canonicalGenerationKey,
                      input.current,
                      input.detected,
                      DiscoveryState.DETECTED,
                    ),
                  ExternalGalaxyFocusChoice
                    .FOCUS_DETECTED,
                ),
          );

        const reverse =
          [
            ...inputs,
          ]
            .reverse()
            .map(
              (
                input,
              ) =>
                ExternalGalaxyFocusEngine
                  .resolveFocusChoice(
                    canonicalGenerationKey,
                    ExternalGalaxyFocusEngine
                      .buildFocusOffer(
                        canonicalGenerationKey,
                        input.current,
                        input.detected,
                        DiscoveryState.DETECTED,
                      ),
                    ExternalGalaxyFocusChoice
                      .FOCUS_DETECTED,
                  ),
            )
            .reverse();

        expect(
          reverse,
        ).toEqual(
          forward,
        );

        expect(
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              otherGenerationKey,
              ExternalGalaxyFocusEngine
                .buildFocusOffer(
                  otherGenerationKey,
                  0n,
                  1n,
                  DiscoveryState.DETECTED,
                ),
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
            ),
        ).toEqual(
          forward[0],
        );
      },
    );

    it(
      'should keep explicit user choice as the only resulting-focus factor and reject unsupported versions',
      () => {
        for (
          let index =
            1n;
          index <=
            1_024n;
          index +=
            1n
        ) {
          const offer =
            ExternalGalaxyFocusEngine
              .buildFocusOffer(
                canonicalGenerationKey,
                0n,
                index,
                DiscoveryState.DETECTED,
              );

          expect(
            ExternalGalaxyFocusEngine
              .resolveFocusChoice(
                canonicalGenerationKey,
                offer,
                ExternalGalaxyFocusChoice
                  .REMAIN_CURRENT,
              )
              .resultingFocusGalaxyIndex,
          ).toBe(
            0n,
          );

          expect(
            ExternalGalaxyFocusEngine
              .resolveFocusChoice(
                canonicalGenerationKey,
                offer,
                ExternalGalaxyFocusChoice
                  .FOCUS_DETECTED,
              )
              .resultingFocusGalaxyIndex,
          ).toBe(
            index,
          );
        }

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
            ExternalGalaxyFocusEngine
              .buildFocusOffer(
                unsupportedGenerationKey,
                0n,
                1n,
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExternalGalaxyFocusEngine
              .resolveFocusChoice(
                unsupportedGenerationKey,
                canonicalOffer(),
                ExternalGalaxyFocusChoice
                  .REMAIN_CURRENT,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
