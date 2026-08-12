import {
  DiscoveryState,
} from '../discovery/discovery-state';

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
  ObservationActionAvailability,
  ObservationActionContext,
  ObservationActionPrerequisite,
  ObservationActionRule,
  ObservationActionType,
  PreparedObservationAction,
} from './observation-action';

import {
  InstrumentObservationSession,
  ObservationInstrument,
  ObservationInstrumentKind,
  ObservationInstrumentType,
} from './observation-instrument';

import {
  InstrumentCapabilityProfile,
  InstrumentLevelCapability,
  LeveledInstrumentObservationSession,
  ObservationInstrumentLevel,
} from './observation-instrument-capability';

import {
  ObservationSession,
  Observatory,
} from './observatory';

describe(
  'ObservationAction',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function session():
      LeveledInstrumentObservationSession {

      const observatory =
        new Observatory(
          generationKey,
        );

      const baseSession =
        new ObservationSession(
          observatory,
          new GalaxyLocator(
            0n,
          ),
          DiscoveryState.DISCOVERED,
        );

      const instrument =
        new ObservationInstrument(
          ObservationInstrumentType
            .OPTICAL,
          ObservationInstrumentKind
            .ELECTROMAGNETIC_BAND,
        );

      const instrumentSession =
        new InstrumentObservationSession(
          baseSession,
          instrument,
        );

      const capability =
        new InstrumentLevelCapability(
          ObservationInstrumentLevel
            .LEVEL_1,
          0.20,
          0.25,
          0.15,
        );

      return new LeveledInstrumentObservationSession(
        instrumentSession,
        new InstrumentCapabilityProfile(
          ObservationInstrumentType
            .OPTICAL,
          capability,
        ),
      );
    }

    it(
      'should preserve the exact seven action order two prerequisites and empty context',
      () => {
        expect(
          Object.values(
            ObservationActionType,
          ),
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
          Object.values(
            ObservationActionPrerequisite,
          ),
        ).toEqual([
          ObservationActionPrerequisite
            .PRIOR_OBSERVATION,
          ObservationActionPrerequisite
            .PERIODICITY_CANDIDATE,
        ]);

        expect(
          ObservationActionContext
            .EMPTY
            .hasPriorObservation,
        ).toBe(
          false,
        );

        expect(
          ObservationActionContext
            .EMPTY
            .hasPeriodicityCandidate,
        ).toBe(
          false,
        );

        expect(
          Object.isFrozen(
            ObservationActionContext
              .EMPTY,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should freeze rule collections and reject invalid or duplicate rule data',
      () => {
        const rule =
          new ObservationActionRule(
            ObservationActionType
              .REOBSERVE,
            [
              ObservationInstrumentType
                .OPTICAL,
            ],
            [
              ObservationActionPrerequisite
                .PRIOR_OBSERVATION,
            ],
          );

        expect(
          Object.isFrozen(
            rule.compatibleInstrumentTypes,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            rule.requiredPrerequisites,
          ),
        ).toBe(
          true,
        );

        expect(
          () =>
            new ObservationActionRule(
              ObservationActionType
                .OBSERVE,
              [],
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationActionRule(
              ObservationActionType
                .OBSERVE,
              [
                ObservationInstrumentType
                  .OPTICAL,
                ObservationInstrumentType
                  .OPTICAL,
              ],
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should derive availability only from instrument compatibility and missing prerequisites',
      () => {
        const available =
          new ObservationActionAvailability(
            ObservationActionType
              .OBSERVE,
            ObservationInstrumentType
              .OPTICAL,
            true,
            [],
          );

        expect(
          available.isAvailable,
        ).toBe(
          true,
        );

        const missing =
          new ObservationActionAvailability(
            ObservationActionType
              .REOBSERVE,
            ObservationInstrumentType
              .OPTICAL,
            true,
            [
              ObservationActionPrerequisite
                .PRIOR_OBSERVATION,
            ],
          );

        expect(
          missing.isAvailable,
        ).toBe(
          false,
        );

        const incompatible =
          new ObservationActionAvailability(
            ObservationActionType
              .ACQUIRE_SPECTRUM,
            ObservationInstrumentType
              .OPTICAL,
            false,
            [],
          );

        expect(
          incompatible.isAvailable,
        ).toBe(
          false,
        );

        expect(
          Object.isFrozen(
            missing.missingPrerequisites,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should prepare only an intention and derive the complete session context without scientific result fields',
      () => {
        const observationSession =
          session();

        const prepared =
          new PreparedObservationAction(
            observationSession,
            ObservationActionType
              .TEMPORAL_MONITORING,
          );

        expect(
          Object.keys(
            prepared,
          ),
        ).toEqual([
          'observationSession',
          'actionType',
        ]);

        expect(
          prepared.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          prepared.observatory,
        ).toBe(
          observationSession
            .observatory,
        );

        expect(
          prepared.targetLocator,
        ).toEqual(
          new GalaxyLocator(
            0n,
          ),
        );

        expect(
          prepared.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          prepared.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .OPTICAL,
        );

        expect(
          prepared.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_1,
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
            'observationId',
          ]
        ) {
          expect(
            Object.keys(
              prepared,
            ),
          ).not.toContain(
            forbidden,
          );
        }
      },
    );
  },
);
