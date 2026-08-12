import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

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
  ObservationInstrumentKind,
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationEngine,
} from './observation-engine';

describe(
  'ObservationEngine instruments',
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

    function known(
      locator:
        ProceduralLocator,

      state:
        ConstructorParameters<
          typeof KnownDiscovery
        >[2] =
          DiscoveryState.DETECTED,

      generationKey =
        canonicalGenerationKey,
    ): KnownDiscovery {

      return new KnownDiscovery(
        generationKey,
        locator,
        state,
      );
    }

    it(
      'should expose exactly the seven canonical V1 instruments in official order',
      () => {
        const instruments =
          ObservationEngine
            .supportedInstruments(
              canonicalObservatory,
            );

        expect(
          instruments.length,
        ).toBe(
          7,
        );

        expect(
          instruments.map(
            (
              instrument,
            ) =>
              instrument.type,
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

        expect(
          Object.isFrozen(
            instruments,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should prepare the frozen Caeloria bootstrap target with OPTICAL',
      () => {
        const session =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState.DISCOVERED,
                ),
              ],
              ObservationInstrumentType
                .OPTICAL,
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

        expect(
          session.instrument.kind,
        ).toBe(
          ObservationInstrumentKind
            .ELECTROMAGNETIC_BAND,
        );
      },
    );

    it(
      'should prepare canonical external galaxy one with INFRARED at DETECTED',
      () => {
        const session =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new GalaxyLocator(
                1n,
              ),
              [
                known(
                  new GalaxyLocator(
                    1n,
                  ),
                  DiscoveryState.DETECTED,
                ),
              ],
              ObservationInstrumentType
                .INFRARED,
            );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          session.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .INFRARED,
        );
      },
    );

    it(
      'should preserve the exact type to kind mappings for spectroscopy and gravitational waves',
      () => {
        const discoveries =
          [
            known(
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState.DISCOVERED,
            ),
          ];

        const spectroscopy =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              discoveries,
              ObservationInstrumentType
                .SPECTROSCOPY,
            );

        expect(
          spectroscopy.instrument.kind,
        ).toBe(
          ObservationInstrumentKind
            .SPECTROSCOPIC_TECHNIQUE,
        );

        const gravitationalWave =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              discoveries,
              ObservationInstrumentType
                .GRAVITATIONAL_WAVE,
            );

        expect(
          gravitationalWave.instrument.kind,
        ).toBe(
          ObservationInstrumentKind
            .GRAVITATIONAL_WAVE_DETECTOR,
        );
      },
    );

    it(
      'should prepare all seven instrument families for the same known target',
      () => {
        const discoveries =
          [
            known(
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState.DISCOVERED,
            ),
          ];

        const instrumentTypes =
          ObservationEngine
            .supportedInstruments(
              canonicalObservatory,
            )
            .map(
              (
                instrument,
              ) =>
                instrument.type,
            );

        const sessions =
          instrumentTypes.map(
            (
              instrumentType,
            ) =>
              ObservationEngine
                .prepareInstrumentObservation(
                  canonicalObservatory,
                  new GalaxyLocator(
                    0n,
                  ),
                  discoveries,
                  instrumentType,
                ),
          );

        expect(
          sessions.map(
            (
              session,
            ) =>
              session.instrumentType,
          ),
        ).toEqual(
          instrumentTypes,
        );

        expect(
          sessions.every(
            (
              session,
            ) =>
              session.targetKnowledgeState ===
              DiscoveryState.DISCOVERED,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should support all 42 combinations of six real locator types and seven instruments',
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

        const discoveries =
          locators.map(
            (
              locator,
            ) =>
              known(
                locator,
                DiscoveryState.CONFIRMED,
              ),
          );

        let evaluated =
          0;

        for (
          const locator
          of locators
        ) {
          for (
            const instrument
            of ObservationEngine
              .supportedInstruments(
                canonicalObservatory,
              )
          ) {
            const session =
              ObservationEngine
                .prepareInstrumentObservation(
                  canonicalObservatory,
                  locator,
                  discoveries,
                  instrument.type,
                );

            expect(
              session.targetKnowledgeState,
            ).toBe(
              DiscoveryState.CONFIRMED,
            );

            expect(
              session.instrumentType,
            ).toBe(
              instrument.type,
            );

            evaluated +=
              1;
          }
        }

        expect(
          evaluated,
        ).toBe(
          42,
        );
      },
    );

    it(
      'should preserve all known target states from DETECTED through CONFIRMED',
      () => {
        const states = [
          DiscoveryState.DETECTED,
          DiscoveryState.DISCOVERED,
          DiscoveryState.VISITED,
          DiscoveryState.CATALOGUED,
          DiscoveryState.CONFIRMED,
        ] as const;

        for (
          let index =
            0;
          index <
            states.length;
          index +=
            1
        ) {
          const galaxyIndex =
            BigInt(
              index,
            );

          expect(
            ObservationEngine
              .prepareInstrumentObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  galaxyIndex,
                ),
                [
                  known(
                    new GalaxyLocator(
                      galaxyIndex,
                    ),
                    states[index],
                  ),
                ],
                ObservationInstrumentType
                  .RADIO,
              )
              .targetKnowledgeState,
          ).toBe(
            states[index],
          );
        }
      },
    );

    it(
      'should reuse all 8.1 eligibility validation for absent and corrupt UNKNOWN targets',
      () => {
        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  1n,
                ),
                [
                  known(
                    new GalaxyLocator(
                      0n,
                    ),
                    DiscoveryState.DISCOVERED,
                  ),
                ],
                ObservationInstrumentType
                  .X_RAY,
              ),
        ).toThrow(
          RangeError,
        );

        const corruptTarget =
          {
            generationKey:
              canonicalGenerationKey,

            locator:
              new GalaxyLocator(
                1n,
              ),

            state:
              DiscoveryState.UNKNOWN,
          } as unknown as
            KnownDiscovery;

        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  1n,
                ),
                [
                  corruptTarget,
                ],
                ObservationInstrumentType
                  .GAMMA_RAY,
              ),
        ).toThrow(
          RangeError,
        );

        const unrelatedCorrupt =
          {
            generationKey:
              canonicalGenerationKey,

            locator:
              new GalaxyLocator(
                99n,
              ),

            state:
              DiscoveryState.UNKNOWN,
          } as unknown as
            KnownDiscovery;

        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  0n,
                ),
                [
                  known(
                    new GalaxyLocator(
                      0n,
                    ),
                    DiscoveryState.DISCOVERED,
                  ),
                  unrelatedCorrupt,
                ],
                ObservationInstrumentType
                  .OPTICAL,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should be deterministic and independent of known-discovery query order',
      () => {
        const target =
          new BodyLocator(
            0n,
            10n,
            1n,
            2n,
          );

        const discoveries =
          [
            known(
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState.DISCOVERED,
            ),

            known(
              target,
              DiscoveryState.CATALOGUED,
            ),

            known(
              new SectorLocator(
                0n,
                10n,
              ),
              DiscoveryState.VISITED,
            ),
          ];

        const first =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new BodyLocator(
                0n,
                10n,
                1n,
                2n,
              ),
              discoveries,
              ObservationInstrumentType
                .SPECTROSCOPY,
            );

        const repeated =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new BodyLocator(
                0n,
                10n,
                1n,
                2n,
              ),
              discoveries,
              ObservationInstrumentType
                .SPECTROSCOPY,
            );

        const reverse =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new BodyLocator(
                0n,
                10n,
                1n,
                2n,
              ),
              [
                ...discoveries,
              ].reverse(),
              ObservationInstrumentType
                .SPECTROSCOPY,
            );

        expect(
          repeated,
        ).toEqual(
          first,
        );

        expect(
          reverse,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should keep the V1 instrument catalog seed-independent while preserving each session generation key',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const otherObservatory =
          new Observatory(
            otherGenerationKey,
          );

        expect(
          ObservationEngine
            .supportedInstruments(
              otherObservatory,
            ),
        ).toEqual(
          ObservationEngine
            .supportedInstruments(
              canonicalObservatory,
            ),
        );

        const first =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new GalaxyLocator(
                1n,
              ),
              [
                known(
                  new GalaxyLocator(
                    1n,
                  ),
                  DiscoveryState.DETECTED,
                  canonicalGenerationKey,
                ),
              ],
              ObservationInstrumentType
                .INFRARED,
            );

        const second =
          ObservationEngine
            .prepareInstrumentObservation(
              otherObservatory,
              new GalaxyLocator(
                1n,
              ),
              [
                known(
                  new GalaxyLocator(
                    1n,
                  ),
                  DiscoveryState.DETECTED,
                  otherGenerationKey,
                ),
              ],
              ObservationInstrumentType
                .INFRARED,
            );

        expect(
          first.generationKey,
        ).toBe(
          canonicalGenerationKey,
        );

        expect(
          second.generationKey,
        ).toBe(
          otherGenerationKey,
        );
      },
    );

    it(
      'should support Long.MAX_VALUE with gravitational waves and reject invalid instruments or versions without mutation',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const discoveries =
          [
            known(
              new GalaxyLocator(
                max,
              ),
              DiscoveryState.DETECTED,
            ),
          ];

        const before =
          [
            ...discoveries,
          ];

        const session =
          ObservationEngine
            .prepareInstrumentObservation(
              canonicalObservatory,
              new GalaxyLocator(
                max,
              ),
              discoveries,
              ObservationInstrumentType
                .GRAVITATIONAL_WAVE,
            );

        expect(
          session.targetLocator,
        ).toEqual(
          new GalaxyLocator(
            max,
          ),
        );

        expect(
          discoveries,
        ).toEqual(
          before,
        );

        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  max,
                ),
                discoveries,
                'INVALID' as
                  ObservationInstrumentType,
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

        const unsupportedObservatory =
          new Observatory(
            unsupportedGenerationKey,
          );

        expect(
          () =>
            ObservationEngine
              .supportedInstruments(
                unsupportedObservatory,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservation(
                unsupportedObservatory,
                new GalaxyLocator(
                  0n,
                ),
                [],
                ObservationInstrumentType
                  .OPTICAL,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
