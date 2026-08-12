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
  'ObservationInstrumentCapability',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should preserve the five canonical levels with explicit ranks 1 through 5',
      () => {
        expect(
          ObservationInstrumentLevel
            .values
            .map(
              (
                level,
              ) => [
                level.name,
                level.rank,
              ],
            ),
        ).toEqual([
          [
            'LEVEL_1',
            1,
          ],
          [
            'LEVEL_2',
            2,
          ],
          [
            'LEVEL_3',
            3,
          ],
          [
            'LEVEL_4',
            4,
          ],
          [
            'LEVEL_5',
            5,
          ],
        ]);

        expect(
          ObservationInstrumentLevel
            .fromRank(
              3,
            ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_3,
        );

        expect(
          () =>
            ObservationInstrumentLevel
              .fromRank(
                0,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should validate normalized level capability metrics in range zero through one',
      () => {
        const capability =
          new InstrumentLevelCapability(
            ObservationInstrumentLevel
              .LEVEL_1,
            0.20,
            0.25,
            0.15,
          );

        expect(
          capability.normalizedSensitivity,
        ).toBe(
          0.20,
        );

        expect(
          capability.normalizedPrecision,
        ).toBe(
          0.25,
        );

        expect(
          capability.normalizedReach,
        ).toBe(
          0.15,
        );

        for (
          const invalid
          of
          [
            Number.NaN,
            Number.POSITIVE_INFINITY,
            -0.01,
            1.01,
          ]
        ) {
          expect(
            () =>
              new InstrumentLevelCapability(
                ObservationInstrumentLevel
                  .LEVEL_1,
                invalid,
                0.25,
                0.15,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new InstrumentLevelCapability(
                ObservationInstrumentLevel
                  .LEVEL_1,
                0.20,
                invalid,
                0.15,
              ),
          ).toThrow(
            RangeError,
          );

          expect(
            () =>
              new InstrumentLevelCapability(
                ObservationInstrumentLevel
                  .LEVEL_1,
                0.20,
                0.25,
                invalid,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should derive profile values from the level capability and reject invalid instrument types',
      () => {
        const levelCapability =
          new InstrumentLevelCapability(
            ObservationInstrumentLevel
              .LEVEL_4,
            0.80,
            0.82,
            0.74,
          );

        const profile =
          new InstrumentCapabilityProfile(
            ObservationInstrumentType
              .SPECTROSCOPY,
            levelCapability,
          );

        expect(
          Object.keys(
            profile,
          ),
        ).toEqual([
          'instrumentType',
          'levelCapability',
        ]);

        expect(
          profile.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_4,
        );

        expect(
          profile.normalizedSensitivity,
        ).toBe(
          0.80,
        );

        expect(
          profile.normalizedPrecision,
        ).toBe(
          0.82,
        );

        expect(
          profile.normalizedReach,
        ).toBe(
          0.74,
        );

        expect(
          () =>
            new InstrumentCapabilityProfile(
              'INVALID' as
                ObservationInstrumentType,
              levelCapability,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should compose the 8.1 and 8.2 sessions with a coherent capability profile',
      () => {
        const observatory =
          new Observatory(
            generationKey,
          );

        const targetLocator =
          new GalaxyLocator(
            0n,
          );

        const baseSession =
          new ObservationSession(
            observatory,
            targetLocator,
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

        const profile =
          new InstrumentCapabilityProfile(
            ObservationInstrumentType
              .OPTICAL,
            new InstrumentLevelCapability(
              ObservationInstrumentLevel
                .LEVEL_1,
              0.20,
              0.25,
              0.15,
            ),
          );

        const session =
          new LeveledInstrumentObservationSession(
            instrumentSession,
            profile,
          );

        expect(
          Object.keys(
            session,
          ),
        ).toEqual([
          'instrumentSession',
          'capabilityProfile',
        ]);

        expect(
          session.baseSession,
        ).toBe(
          baseSession,
        );

        expect(
          session.observatory,
        ).toBe(
          observatory,
        );

        expect(
          session.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          session.targetLocator,
        ).toBe(
          targetLocator,
        );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          session.instrument,
        ).toBe(
          instrument,
        );

        expect(
          session.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .OPTICAL,
        );

        expect(
          session.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_1,
        );

        expect(
          session.normalizedSensitivity,
        ).toBe(
          0.20,
        );

        expect(
          session.normalizedPrecision,
        ).toBe(
          0.25,
        );

        expect(
          session.normalizedReach,
        ).toBe(
          0.15,
        );

        expect(
          () =>
            new LeveledInstrumentObservationSession(
              instrumentSession,
              new InstrumentCapabilityProfile(
                ObservationInstrumentType
                  .RADIO,
                profile.levelCapability,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
