import {
  GalaxyLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  ObservationActionType,
} from './observation-action';

import {
  ObjectScientificCompleteness,
  ObservationScientificCompletenessContext,
} from './observation-scientific-completeness';

describe(
  'ObservationScientificCompleteness',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const baseRequiredActions =
      [
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
      ] as const;

    it(
      'should preserve EMPTY context and validate completed action facts without duplicates',
      () => {
        expect(
          ObservationScientificCompletenessContext
            .EMPTY
            .completedActions,
        ).toEqual(
          [],
        );

        expect(
          ObservationScientificCompletenessContext
            .EMPTY
            .hasPeriodicityCandidate,
        ).toBe(
          false,
        );

        expect(
          Object.isFrozen(
            ObservationScientificCompletenessContext
              .EMPTY,
          ),
        ).toBe(
          true,
        );

        const context =
          new ObservationScientificCompletenessContext(
            [
              ObservationActionType
                .OBSERVE,
              ObservationActionType
                .REOBSERVE,
            ],
            false,
          );

        expect(
          Object.isFrozen(
            context.completedActions,
          ),
        ).toBe(
          true,
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
      },
    );

    it(
      'should derive completed missing and non-required action partitions in checklist order',
      () => {
        const completeness =
          new ObjectScientificCompleteness(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            baseRequiredActions,
            [
              ObservationActionType
                .MEASURE_PERIOD,
              ObservationActionType
                .TEMPORAL_MONITORING,
              ObservationActionType
                .OBSERVE,
            ],
          );

        expect(
          completeness
            .completedRequiredActions,
        ).toEqual([
          ObservationActionType
            .OBSERVE,
          ObservationActionType
            .TEMPORAL_MONITORING,
        ]);

        expect(
          completeness
            .missingRequiredActions,
        ).toEqual([
          ObservationActionType
            .REOBSERVE,
          ObservationActionType
            .ACQUIRE_SPECTRUM,
          ObservationActionType
            .LOCATE_SOURCE,
          ObservationActionType
            .SEARCH_PERIODICITY,
        ]);

        expect(
          completeness
            .completedNonRequiredActions,
        ).toEqual([
          ObservationActionType
            .MEASURE_PERIOD,
        ]);
      },
    );

    it(
      'should derive counts fraction and complete flag strictly from required checklist coverage',
      () => {
        const partial =
          new ObjectScientificCompleteness(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            baseRequiredActions,
            [
              ObservationActionType
                .OBSERVE,
            ],
          );

        expect(
          partial.requiredActionCount,
        ).toBe(
          6,
        );

        expect(
          partial
            .completedRequiredActionCount,
        ).toBe(
          1,
        );

        expect(
          partial
            .missingRequiredActionCount,
        ).toBe(
          5,
        );

        expect(
          partial.completenessFraction,
        ).toBe(
          1.0 /
            6.0,
        );

        expect(
          partial
            .isScientificallyComplete,
        ).toBe(
          false,
        );

        const complete =
          new ObjectScientificCompleteness(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            baseRequiredActions,
            baseRequiredActions,
          );

        expect(
          complete.completenessFraction,
        ).toBe(
          1.0,
        );

        expect(
          complete
            .isScientificallyComplete,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should expose only completeness inputs while leaking no certainty DiscoveryState probability or Ground Truth fields',
      () => {
        const completeness =
          new ObjectScientificCompleteness(
            generationKey,
            new GalaxyLocator(
              0n,
            ),
            baseRequiredActions,
            [],
          );

        expect(
          Object.keys(
            completeness,
          ),
        ).toEqual([
          'generationKey',
          'targetLocator',
          'requiredActions',
          'completedActions',
        ]);

        for (
          const forbidden
          of [
            'certainty',
            'discoveryState',
            'probability',
            'confidence',
            'measurement',
            'uncertainty',
            'groundTruth',
            'instrumentType',
            'level',
          ]
        ) {
          expect(
            Object.keys(
              completeness,
            ),
          ).not.toContain(
            forbidden,
          );
        }
      },
    );
  },
);
