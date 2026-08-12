import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  ObservationActionContext,
  ObservationActionPrerequisite,
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  InstrumentObservationSession,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  InstrumentCapabilityProfile,
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationSession,
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationActionCatalogV1,
} from './observation-action-catalog';

import {
  ObservationActionEngine,
} from './observation-action-engine';

import {
  ObservationEngine,
} from './observation-engine';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

describe(
  'ObservationActionEngine',
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

    function leveledSession(
      instrumentType:
        ObservationInstrumentType,

      level:
        ObservationInstrumentLevel =
          ObservationInstrumentLevel
            .LEVEL_1,

      targetLocator:
        ProceduralLocator =
          new GalaxyLocator(
            0n,
          ),

      generationKey:
        UniverseGenerationKey =
          canonicalGenerationKey,
    ): LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          generationKey,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          targetLocator,
          DiscoveryState.DISCOVERED,
        );

      const instrument =
        ObservationInstrumentCatalogV1
          .instrument(
            instrumentType,
          );

      const instrumentSession =
        new InstrumentObservationSession(
          baseSession,
          instrument,
        );

      const profile =
        ObservationInstrumentCapabilityCatalogV1
          .profile(
            instrumentType,
            level,
          );

      return new LeveledInstrumentObservationSession(
        instrumentSession,
        profile,
      );
    }

    function availabilityMap(
      instrumentType:
        ObservationInstrumentType,

      context:
        ObservationActionContext,
    ): ReadonlyMap<
      ObservationActionType,
      boolean
    > {

      return new Map(
        ObservationActionEngine
          .actionAvailabilities(
            canonicalGenerationKey,
            leveledSession(
              instrumentType,
            ),
            context,
          )
          .map(
            (
              availability,
            ) => [
              availability
                .actionType,
              availability
                .isAvailable,
            ],
          ),
      );
    }

    it(
      'should preserve the definitive seven-action V1 catalog and exact rule matrix',
      () => {
        expect(
          ObservationActionCatalogV1
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
          ObservationActionCatalogV1
            .rules
            .map(
              (
                rule,
              ) => [
                rule.actionType,
                rule.compatibleInstrumentTypes,
                rule.requiredPrerequisites,
              ],
            ),
        ).toEqual([
          [
            ObservationActionType
              .OBSERVE,
            ObservationActionCatalogV1
              .allInstrumentTypes,
            [],
          ],
          [
            ObservationActionType
              .REOBSERVE,
            ObservationActionCatalogV1
              .allInstrumentTypes,
            [
              ObservationActionPrerequisite
                .PRIOR_OBSERVATION,
            ],
          ],
          [
            ObservationActionType
              .ACQUIRE_SPECTRUM,
            [
              ObservationInstrumentType
                .SPECTROSCOPY,
            ],
            [],
          ],
          [
            ObservationActionType
              .MEASURE_PERIOD,
            ObservationActionCatalogV1
              .allInstrumentTypes,
            [
              ObservationActionPrerequisite
                .PERIODICITY_CANDIDATE,
            ],
          ],
          [
            ObservationActionType
              .LOCATE_SOURCE,
            ObservationActionCatalogV1
              .allInstrumentTypes,
            [],
          ],
          [
            ObservationActionType
              .SEARCH_PERIODICITY,
            ObservationActionCatalogV1
              .allInstrumentTypes,
            [],
          ],
          [
            ObservationActionType
              .TEMPORAL_MONITORING,
            ObservationActionCatalogV1
              .allInstrumentTypes,
            [],
          ],
        ]);

        expect(
          ObservationActionCatalogV1
            .supportedActions
            .length,
        ).toBe(
          7,
        );

        expect(
          ObservationActionCatalogV1
            .rules
            .length,
        ).toBe(
          7,
        );
      },
    );

    it(
      'should expose exactly four available actions for Optical with empty context',
      () => {
        const availabilities =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentType
                  .OPTICAL,
              ),
              ObservationActionContext
                .EMPTY,
            );

        expect(
          availabilities.length,
        ).toBe(
          7,
        );

        expect(
          availabilities
            .filter(
              (
                availability,
              ) =>
                availability
                  .isAvailable,
            )
            .map(
              (
                availability,
              ) =>
                availability
                  .actionType,
            ),
        ).toEqual([
          ObservationActionType
            .OBSERVE,
          ObservationActionType
            .LOCATE_SOURCE,
          ObservationActionType
            .SEARCH_PERIODICITY,
          ObservationActionType
            .TEMPORAL_MONITORING,
        ]);
      },
    );

    it(
      'should expose exactly five available actions for Spectroscopy with empty context',
      () => {
        const available =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentType
                  .SPECTROSCOPY,
              ),
              ObservationActionContext
                .EMPTY,
            )
            .filter(
              (
                availability,
              ) =>
                availability
                  .isAvailable,
            )
            .map(
              (
                availability,
              ) =>
                availability
                  .actionType,
            );

        expect(
          available,
        ).toEqual([
          ObservationActionType
            .OBSERVE,
          ObservationActionType
            .ACQUIRE_SPECTRUM,
          ObservationActionType
            .LOCATE_SOURCE,
          ObservationActionType
            .SEARCH_PERIODICITY,
          ObservationActionType
            .TEMPORAL_MONITORING,
        ]);
      },
    );

    it(
      'should expose exactly six available actions for Optical with full context',
      () => {
        const fullContext =
          new ObservationActionContext(
            true,
            true,
          );

        const unavailable =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentType
                  .OPTICAL,
              ),
              fullContext,
            )
            .filter(
              (
                availability,
              ) =>
                !availability
                  .isAvailable,
            );

        expect(
          unavailable.length,
        ).toBe(
          1,
        );

        expect(
          unavailable[
            0
          ].actionType,
        ).toBe(
          ObservationActionType
            .ACQUIRE_SPECTRUM,
        );

        expect(
          unavailable[
            0
          ].isInstrumentCompatible,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should expose all seven actions for Spectroscopy with full context',
      () => {
        const availabilities =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentType
                  .SPECTROSCOPY,
              ),
              new ObservationActionContext(
                true,
                true,
              ),
            );

        expect(
          availabilities
            .filter(
              (
                availability,
              ) =>
                availability
                  .isAvailable,
            )
            .length,
        ).toBe(
          7,
        );
      },
    );

    it(
      'should let hasPriorObservation affect only REOBSERVE',
      () => {
        const withoutPrior =
          availabilityMap(
            ObservationInstrumentType
              .OPTICAL,
            new ObservationActionContext(
              false,
              false,
            ),
          );

        const withPrior =
          availabilityMap(
            ObservationInstrumentType
              .OPTICAL,
            new ObservationActionContext(
              true,
              false,
            ),
          );

        for (
          const actionType
          of ObservationActionCatalogV1
            .supportedActions
        ) {
          if (
            actionType ===
            ObservationActionType
              .REOBSERVE
          ) {
            expect(
              withoutPrior.get(
                actionType,
              ),
            ).toBe(
              false,
            );

            expect(
              withPrior.get(
                actionType,
              ),
            ).toBe(
              true,
            );
          } else {
            expect(
              withPrior.get(
                actionType,
              ),
            ).toBe(
              withoutPrior.get(
                actionType,
              ),
            );
          }
        }
      },
    );

    it(
      'should let periodicity candidate affect only MEASURE_PERIOD while SEARCH_PERIODICITY stays available',
      () => {
        const withoutCandidate =
          availabilityMap(
            ObservationInstrumentType
              .OPTICAL,
            new ObservationActionContext(
              false,
              false,
            ),
          );

        const withCandidate =
          availabilityMap(
            ObservationInstrumentType
              .OPTICAL,
            new ObservationActionContext(
              false,
              true,
            ),
          );

        expect(
          withoutCandidate.get(
            ObservationActionType
              .MEASURE_PERIOD,
          ),
        ).toBe(
          false,
        );

        expect(
          withCandidate.get(
            ObservationActionType
              .MEASURE_PERIOD,
          ),
        ).toBe(
          true,
        );

        expect(
          withoutCandidate.get(
            ObservationActionType
              .SEARCH_PERIODICITY,
          ),
        ).toBe(
          true,
        );

        expect(
          withCandidate.get(
            ObservationActionType
              .SEARCH_PERIODICITY,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should restrict ACQUIRE_SPECTRUM to spectroscopy and keep TEMPORAL_MONITORING available for all seven instruments',
      () => {
        for (
          const instrumentType
          of ObservationInstrumentCatalogV1
            .supportedInstrumentTypes
        ) {
          const session =
            leveledSession(
              instrumentType,
            );

          const spectrum =
            ObservationActionEngine
              .availability(
                canonicalGenerationKey,
                session,
                ObservationActionType
                  .ACQUIRE_SPECTRUM,
                ObservationActionContext
                  .EMPTY,
              );

          expect(
            spectrum
              .isInstrumentCompatible,
          ).toBe(
            instrumentType ===
              ObservationInstrumentType
                .SPECTROSCOPY,
          );

          const temporal =
            ObservationActionEngine
              .availability(
                canonicalGenerationKey,
                session,
                ObservationActionType
                  .TEMPORAL_MONITORING,
                ObservationActionContext
                  .EMPTY,
              );

          expect(
            temporal.isAvailable,
          ).toBe(
            true,
          );
        }
      },
    );

    it(
      'should be independent of instrument level and target locator type',
      () => {
        const reference =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              leveledSession(
                ObservationInstrumentType
                  .OPTICAL,
                ObservationInstrumentLevel
                  .LEVEL_1,
                new GalaxyLocator(
                  0n,
                ),
              ),
              ObservationActionContext
                .EMPTY,
            )
            .map(
              (
                availability,
              ) =>
                availability
                  .isAvailable,
            );

        for (
          const level
          of ObservationInstrumentLevel
            .values
        ) {
          expect(
            ObservationActionEngine
              .actionAvailabilities(
                canonicalGenerationKey,
                leveledSession(
                  ObservationInstrumentType
                    .OPTICAL,
                  level,
                ),
                ObservationActionContext
                  .EMPTY,
              )
              .map(
                (
                  availability,
                ) =>
                  availability
                    .isAvailable,
              ),
          ).toEqual(
            reference,
          );
        }

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
          expect(
            ObservationActionEngine
              .actionAvailabilities(
                canonicalGenerationKey,
                leveledSession(
                  ObservationInstrumentType
                    .OPTICAL,
                  ObservationInstrumentLevel
                    .LEVEL_1,
                  locator,
                ),
                ObservationActionContext
                  .EMPTY,
              )
              .map(
                (
                  availability,
                ) =>
                  availability
                    .isAvailable,
              ),
          ).toEqual(
            reference,
          );
        }
      },
    );

    it(
      'should prepare intentions through both engines while returning no scientific result',
      () => {
        const session =
          leveledSession(
            ObservationInstrumentType
              .SPECTROSCOPY,
          );

        const direct =
          ObservationActionEngine
            .prepareAction(
              canonicalGenerationKey,
              session,
              ObservationActionType
                .TEMPORAL_MONITORING,
              ObservationActionContext
                .EMPTY,
            );

        const wrapped =
          ObservationEngine
            .prepareObservationAction(
              session,
              ObservationActionType
                .TEMPORAL_MONITORING,
              ObservationActionContext
                .EMPTY,
            );

        expect(
          wrapped,
        ).toEqual(
          direct,
        );

        expect(
          wrapped.actionType,
        ).toBe(
          ObservationActionType
            .TEMPORAL_MONITORING,
        );

        const statuses =
          ObservationEngine
            .observationActionAvailabilities(
              session,
              ObservationActionContext
                .EMPTY,
            );

        expect(
          statuses.length,
        ).toBe(
          7,
        );

        for (
          const forbidden
          of [
            'result',
            'measurement',
            'spectrum',
            'period',
            'coordinates',
            'periodicityFound',
            'certainty',
            'success',
            'timestamp',
          ]
        ) {
          expect(
            Object.keys(
              wrapped,
            ),
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should be deterministic seed-independent and reject unavailable actions mismatching universes invalid actions and unsupported versions',
      () => {
        const optical =
          leveledSession(
            ObservationInstrumentType
              .OPTICAL,
          );

        const first =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              optical,
              ObservationActionContext
                .EMPTY,
            );

        const repeated =
          ObservationActionEngine
            .actionAvailabilities(
              canonicalGenerationKey,
              optical,
              ObservationActionContext
                .EMPTY,
            );

        expect(
          repeated,
        ).toEqual(
          first,
        );

        expect(
          () =>
            ObservationActionEngine
              .prepareAction(
                canonicalGenerationKey,
                optical,
                ObservationActionType
                  .REOBSERVE,
                ObservationActionContext
                  .EMPTY,
              ),
        ).toThrow(
          RangeError,
        );

        const sameValueGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V1,
          );

        expect(
          ObservationActionEngine
            .availability(
              sameValueGenerationKey,
              optical,
              ObservationActionType
                .OBSERVE,
              ObservationActionContext
                .EMPTY,
            )
            .isAvailable,
        ).toBe(
          true,
        );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            ObservationActionEngine
              .availability(
                otherGenerationKey,
                optical,
                ObservationActionType
                  .OBSERVE,
                ObservationActionContext
                  .EMPTY,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationActionCatalogV1
              .rule(
                'INVALID' as
                  ObservationActionType,
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

        const unsupportedSession =
          leveledSession(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentLevel
              .LEVEL_1,
            new GalaxyLocator(
              0n,
            ),
            unsupportedGenerationKey,
          );

        expect(
          () =>
            ObservationActionEngine
              .actionAvailabilities(
                unsupportedGenerationKey,
                unsupportedSession,
                ObservationActionContext
                  .EMPTY,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
