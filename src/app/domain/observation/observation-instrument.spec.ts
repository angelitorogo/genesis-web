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
  ObservationSession,
  Observatory,
} from './observatory';

describe(
  'ObservationInstrument',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should preserve the exact canonical V1 instrument type order',
      () => {
        expect(
          Object.values(
            ObservationInstrumentType,
          ),
        ).toEqual([
          ObservationInstrumentType
            .OPTICAL,

          ObservationInstrumentType
            .INFRARED,

          ObservationInstrumentType
            .RADIO,

          ObservationInstrumentType
            .SPECTROSCOPY,

          ObservationInstrumentType
            .X_RAY,

          ObservationInstrumentType
            .GAMMA_RAY,

          ObservationInstrumentType
            .GRAVITATIONAL_WAVE,
        ]);
      },
    );

    it(
      'should preserve the exact three scientific instrument kinds',
      () => {
        expect(
          Object.values(
            ObservationInstrumentKind,
          ),
        ).toEqual([
          ObservationInstrumentKind
            .ELECTROMAGNETIC_BAND,

          ObservationInstrumentKind
            .SPECTROSCOPIC_TECHNIQUE,

          ObservationInstrumentKind
            .GRAVITATIONAL_WAVE_DETECTOR,
        ]);
      },
    );

    it(
      'should contain only type and kind and reject invalid runtime enum values',
      () => {
        const optical =
          new ObservationInstrument(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentKind
              .ELECTROMAGNETIC_BAND,
          );

        expect(
          Object.keys(
            optical,
          ),
        ).toEqual([
          'type',
          'kind',
        ]);

        expect(
          () =>
            new ObservationInstrument(
              'INVALID' as
                ObservationInstrumentType,
              ObservationInstrumentKind
                .ELECTROMAGNETIC_BAND,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationInstrument(
              ObservationInstrumentType
                .OPTICAL,
              'INVALID' as
                ObservationInstrumentKind,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should derive all observational context from the base session',
      () => {
        const observatory =
          new Observatory(
            generationKey,
          );

        const locator =
          new GalaxyLocator(
            0n,
          );

        const baseSession =
          new ObservationSession(
            observatory,
            locator,
            DiscoveryState.DISCOVERED,
          );

        const instrument =
          new ObservationInstrument(
            ObservationInstrumentType
              .OPTICAL,
            ObservationInstrumentKind
              .ELECTROMAGNETIC_BAND,
          );

        const session =
          new InstrumentObservationSession(
            baseSession,
            instrument,
          );

        expect(
          Object.keys(
            session,
          ),
        ).toEqual([
          'baseSession',
          'instrument',
        ]);

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
          locator,
        );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          session.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .OPTICAL,
        );
      },
    );
  },
);
