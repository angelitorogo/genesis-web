import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationScientificCompletenessContext,
} from '../../domain/observation/observation-scientific-completeness';

import {
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationEngine,
} from './observation-engine';

import {
  ObservationScientificCompletenessCatalogV1,
} from './observation-scientific-completeness-catalog';

import {
  ObservationScientificCompletenessEngine,
} from './observation-scientific-completeness-engine';

describe(
  'ObservationScientificCompletenessEngine',
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

    const canonicalObservatory =
      new Observatory(
        canonicalGenerationKey,
      );

    const baseActions =
      ObservationScientificCompletenessCatalogV1
        .baseRequiredActions;

    it(
      'should preserve exactly seven supported actions six base requirements and conditional MEASURE_PERIOD in canonical order',
      () => {
        expect(
          ObservationScientificCompletenessCatalogV1
            .supportedActions,
        ).toEqual([
          ObservationActionType
            .OBSERVE,
          ObservationActionType
            .REOBSERVE,
          ObservationActionType
            .ACQUIRE_SPECTRUM,
          ObservationActionType
            .MEASURE_PERIOD,
          ObservationActionType
            .LOCATE_SOURCE,
          ObservationActionType
            .SEARCH_PERIODICITY,
          ObservationActionType
            .TEMPORAL_MONITORING,
        ]);

        expect(
          baseActions,
        ).toEqual([
          ObservationActionType
            .OBSERVE,
          ObservationActionType
            .REOBSERVE,
          ObservationActionType
            .ACQUIRE_SPECTRUM,
          ObservationActionType
            .LOCATE_SOURCE,
          ObservationActionType
            .SEARCH_PERIODICITY,
          ObservationActionType
            .TEMPORAL_MONITORING,
        ]);

        expect(
          ObservationScientificCompletenessCatalogV1
            .conditionalPeriodAction,
        ).toBe(
          ObservationActionType
            .MEASURE_PERIOD,
        );

        expect(
          ObservationScientificCompletenessCatalogV1
            .requiredActions(
              false,
            )
            .length,
        ).toBe(
          6,
        );

        expect(
          ObservationScientificCompletenessCatalogV1
            .requiredActions(
              true,
            )
            .length,
        ).toBe(
          7,
        );
      },
    );

    it(
      'should produce the frozen empty vector zero of six',
      () => {
        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              ObservationScientificCompletenessContext
                .EMPTY,
            );

        expect(
          result.requiredActionCount,
        ).toBe(
          6,
        );

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          0,
        );

        expect(
          result.missingRequiredActionCount,
        ).toBe(
          6,
        );

        expect(
          result.completenessFraction,
        ).toBe(
          0.0,
        );

        expect(
          result.isScientificallyComplete,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should produce one of six for OBSERVE only without inferring any other action',
      () => {
        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                [
                  ObservationActionType
                    .OBSERVE,
                ],
                false,
              ),
            );

        expect(
          result.completedRequiredActions,
        ).toEqual([
          ObservationActionType
            .OBSERVE,
        ]);

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          1,
        );

        expect(
          result.completenessFraction,
        ).toBe(
          1.0 /
            6.0,
        );
      },
    );

    it(
      'should produce five of six for five completed base actions',
      () => {
        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                baseActions
                  .slice(
                    0,
                    5,
                  ),
                false,
              ),
            );

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          5,
        );

        expect(
          result.missingRequiredActionCount,
        ).toBe(
          1,
        );

        expect(
          result.completenessFraction,
        ).toBe(
          5.0 /
            6.0,
        );

        expect(
          result.isScientificallyComplete,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should mark the base checklist complete at six of six when no periodicity candidate exists',
      () => {
        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                baseActions,
                false,
              ),
            );

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          6,
        );

        expect(
          result.missingRequiredActionCount,
        ).toBe(
          0,
        );

        expect(
          result.completenessFraction,
        ).toBe(
          1.0,
        );

        expect(
          result.isScientificallyComplete,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should expand a previously complete object to six of seven when a periodicity candidate appears',
      () => {
        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                baseActions,
                true,
              ),
            );

        expect(
          result.requiredActionCount,
        ).toBe(
          7,
        );

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          6,
        );

        expect(
          result.missingRequiredActions,
        ).toEqual([
          ObservationActionType
            .MEASURE_PERIOD,
        ]);

        expect(
          result.completenessFraction,
        ).toBe(
          6.0 /
            7.0,
        );

        expect(
          result.isScientificallyComplete,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should restore scientific completeness at seven of seven after MEASURE_PERIOD completes',
      () => {
        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                [
                  ...baseActions,
                  ObservationActionType
                    .MEASURE_PERIOD,
                ],
                true,
              ),
            );

        expect(
          result.requiredActionCount,
        ).toBe(
          7,
        );

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          7,
        );

        expect(
          result.completenessFraction,
        ).toBe(
          1.0,
        );

        expect(
          result.isScientificallyComplete,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should classify MEASURE_PERIOD as completed but non-required when there is no periodicity candidate',
      () => {
        const fiveBase =
          baseActions
            .slice(
              0,
              5,
            );

        const result =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                [
                  ObservationActionType
                    .MEASURE_PERIOD,
                  ...fiveBase,
                ],
                false,
              ),
            );

        expect(
          result.completedRequiredActionCount,
        ).toBe(
          5,
        );

        expect(
          result.completenessFraction,
        ).toBe(
          5.0 /
            6.0,
        );

        expect(
          result.completedNonRequiredActions,
        ).toEqual([
          ObservationActionType
            .MEASURE_PERIOD,
        ]);
      },
    );

    it(
      'should canonicalize completed-action input order and preserve identical structured results',
      () => {
        const canonical =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                [
                  ObservationActionType
                    .OBSERVE,
                  ObservationActionType
                    .ACQUIRE_SPECTRUM,
                  ObservationActionType
                    .TEMPORAL_MONITORING,
                ],
                false,
              ),
            );

        const reordered =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              new ObservationScientificCompletenessContext(
                [
                  ObservationActionType
                    .TEMPORAL_MONITORING,
                  ObservationActionType
                    .OBSERVE,
                  ObservationActionType
                    .ACQUIRE_SPECTRUM,
                ],
                false,
              ),
            );

        expect(
          reordered,
        ).toEqual(
          canonical,
        );

        expect(
          reordered.completedActions,
        ).toEqual([
          ObservationActionType
            .OBSERVE,
          ObservationActionType
            .ACQUIRE_SPECTRUM,
          ObservationActionType
            .TEMPORAL_MONITORING,
        ]);
      },
    );

    it(
      'should apply the same generic V1 checklist to all six procedural locator types and universe seeds',
      () => {
        const locators:
          readonly ProceduralLocator[] =
          [
            new GalaxyLocator(
              3n,
            ),
            new SectorLocator(
              3n,
              10n,
            ),
            new GalacticObjectLocator(
              3n,
              10n,
              1n,
            ),
            new SystemLocator(
              3n,
              10n,
              2n,
            ),
            new BodyLocator(
              3n,
              10n,
              2n,
              4n,
            ),
            new CivilizationLocator(
              3n,
              10n,
              2n,
              4n,
              1n,
            ),
          ];

        for (
          const locator
          of locators
        ) {
          const result =
            ObservationScientificCompletenessEngine
              .evaluate(
                canonicalGenerationKey,
                locator,
                ObservationScientificCompletenessContext
                  .EMPTY,
              );

          expect(
            result.requiredActions,
          ).toEqual(
            baseActions,
          );

          expect(
            result.generationKey,
          ).toBe(
            canonicalGenerationKey,
          );

          expect(
            result.targetLocator,
          ).toBe(
            locator,
          );
        }

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          ObservationScientificCompletenessEngine
            .evaluate(
              otherGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              ObservationScientificCompletenessContext
                .EMPTY,
            )
            .requiredActions,
        ).toEqual(
          baseActions,
        );
      },
    );

    it(
      'should delegate through ObservationEngine and reject duplicates or unsupported generator versions',
      () => {
        const direct =
          ObservationScientificCompletenessEngine
            .evaluate(
              canonicalGenerationKey,
              new GalaxyLocator(
                0n,
              ),
              ObservationScientificCompletenessContext
                .EMPTY,
            );

        const wrapped =
          ObservationEngine
            .scientificCompletenessForObject(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              ObservationScientificCompletenessContext
                .EMPTY,
            );

        expect(
          wrapped,
        ).toEqual(
          direct,
        );

        expect(
          () =>
            new ObservationScientificCompletenessContext(
              [
                ObservationActionType
                  .OBSERVE,
                ObservationActionType
                  .OBSERVE,
              ],
              false,
            ),
        ).toThrow(
          RangeError,
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
            ObservationScientificCompletenessEngine
              .evaluate(
                unsupportedGenerationKey,
                new GalaxyLocator(
                  0n,
                ),
                ObservationScientificCompletenessContext
                  .EMPTY,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
