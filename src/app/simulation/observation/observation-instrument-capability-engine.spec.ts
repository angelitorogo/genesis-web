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
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

import {
  ObservationEngine,
} from './observation-engine';

describe(
  'ObservationEngine instrument capabilities',
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
      'should expose exactly five canonical levels and the frozen V1 capability curve',
      () => {
        expect(
          ObservationEngine
            .supportedInstrumentLevels(
              canonicalObservatory,
              ObservationInstrumentType
                .OPTICAL,
            ),
        ).toEqual([
          ObservationInstrumentLevel
            .LEVEL_1,
          ObservationInstrumentLevel
            .LEVEL_2,
          ObservationInstrumentLevel
            .LEVEL_3,
          ObservationInstrumentLevel
            .LEVEL_4,
          ObservationInstrumentLevel
            .LEVEL_5,
        ]);

        expect(
          ObservationInstrumentCapabilityCatalogV1
            .levelCapabilities
            .map(
              (
                capability,
              ) => [
                capability.level.name,
                capability.normalizedSensitivity,
                capability.normalizedPrecision,
                capability.normalizedReach,
              ],
            ),
        ).toEqual([
          [
            'LEVEL_1',
            0.20,
            0.25,
            0.15,
          ],
          [
            'LEVEL_2',
            0.40,
            0.45,
            0.32,
          ],
          [
            'LEVEL_3',
            0.60,
            0.65,
            0.52,
          ],
          [
            'LEVEL_4',
            0.80,
            0.82,
            0.74,
          ],
          [
            'LEVEL_5',
            1.00,
            1.00,
            1.00,
          ],
        ]);

        expect(
          Object.isFrozen(
            ObservationInstrumentCapabilityCatalogV1
              .supportedLevels,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should preserve profile catalog structure, all 35 profiles and next-level mapping',
      () => {
        expect(
          ObservationInstrumentCapabilityCatalogV1
            .allProfiles
            .length,
        ).toBe(
          35,
        );

        const keys =
          ObservationInstrumentCapabilityCatalogV1
            .allProfiles
            .map(
              (
                profile,
              ) =>
                `${profile.instrumentType}:${profile.level.rank}`,
            );

        expect(
          new Set(
            keys,
          ).size,
        ).toBe(
          35,
        );

        expect(
          ObservationInstrumentCapabilityCatalogV1
            .profilesForInstrument(
              ObservationInstrumentType
                .RADIO,
            )
            .length,
        ).toBe(
          5,
        );

        expect(
          ObservationInstrumentCapabilityCatalogV1
            .nextLevel(
              ObservationInstrumentLevel
                .LEVEL_1,
            ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_2,
        );

        expect(
          ObservationInstrumentCapabilityCatalogV1
            .nextLevel(
              ObservationInstrumentLevel
                .LEVEL_4,
            ),
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_5,
        );

        expect(
          ObservationInstrumentCapabilityCatalogV1
            .nextLevel(
              ObservationInstrumentLevel
                .LEVEL_5,
            ),
        ).toBeNull();
      },
    );

    it(
      'should reproduce the frozen Caeloria OPTICAL LEVEL_1 and LEVEL_5 sessions',
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

        const level1 =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              discoveries,
              ObservationInstrumentType
                .OPTICAL,
              ObservationInstrumentLevel
                .LEVEL_1,
            );

        expect(
          level1.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          level1.instrumentType,
        ).toBe(
          ObservationInstrumentType
            .OPTICAL,
        );

        expect(
          level1.level,
        ).toBe(
          ObservationInstrumentLevel
            .LEVEL_1,
        );

        expect(
          level1.normalizedSensitivity,
        ).toBe(
          0.20,
        );

        expect(
          level1.normalizedPrecision,
        ).toBe(
          0.25,
        );

        expect(
          level1.normalizedReach,
        ).toBe(
          0.15,
        );

        const level5 =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
              canonicalObservatory,
              new GalaxyLocator(
                0n,
              ),
              discoveries,
              ObservationInstrumentType
                .OPTICAL,
              ObservationInstrumentLevel
                .LEVEL_5,
            );

        expect(
          level5.normalizedSensitivity,
        ).toBe(
          1.0,
        );

        expect(
          level5.normalizedPrecision,
        ).toBe(
          1.0,
        );

        expect(
          level5.normalizedReach,
        ).toBe(
          1.0,
        );
      },
    );

    it(
      'should reproduce canonical INFRARED L3, SPECTROSCOPY L4 and GRAVITATIONAL_WAVE L2 vectors',
      () => {
        const galaxyOne =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        expect(
          galaxyOne.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          galaxyOne.instrument.kind,
        ).toBe(
          ObservationInstrumentKind
            .ELECTROMAGNETIC_BAND,
        );

        expect(
          galaxyOne.normalizedSensitivity,
        ).toBe(
          0.60,
        );

        expect(
          galaxyOne.normalizedPrecision,
        ).toBe(
          0.65,
        );

        expect(
          galaxyOne.normalizedReach,
        ).toBe(
          0.52,
        );

        const spectroscopy =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
                .SPECTROSCOPY,
              ObservationInstrumentLevel
                .LEVEL_4,
            );

        expect(
          spectroscopy.instrument.kind,
        ).toBe(
          ObservationInstrumentKind
            .SPECTROSCOPIC_TECHNIQUE,
        );

        expect(
          spectroscopy.normalizedSensitivity,
        ).toBe(
          0.80,
        );

        expect(
          spectroscopy.normalizedPrecision,
        ).toBe(
          0.82,
        );

        expect(
          spectroscopy.normalizedReach,
        ).toBe(
          0.74,
        );

        const gravitationalWave =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
                .GRAVITATIONAL_WAVE,
              ObservationInstrumentLevel
                .LEVEL_2,
            );

        expect(
          gravitationalWave.instrument.kind,
        ).toBe(
          ObservationInstrumentKind
            .GRAVITATIONAL_WAVE_DETECTOR,
        );

        expect(
          gravitationalWave.normalizedSensitivity,
        ).toBe(
          0.40,
        );

        expect(
          gravitationalWave.normalizedPrecision,
        ).toBe(
          0.45,
        );

        expect(
          gravitationalWave.normalizedReach,
        ).toBe(
          0.32,
        );
      },
    );

    it(
      'should support all 210 combinations of six real locator types seven instruments and five levels',
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
            for (
              const level
              of ObservationEngine
                .supportedInstrumentLevels(
                  canonicalObservatory,
                  instrument.type,
                )
            ) {
              const session =
                ObservationEngine
                  .prepareInstrumentObservationAtLevel(
                    canonicalObservatory,
                    locator,
                    discoveries,
                    instrument.type,
                    level,
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

              expect(
                session.level,
              ).toBe(
                level,
              );

              evaluated +=
                1;
            }
          }
        }

        expect(
          evaluated,
        ).toBe(
          210,
        );
      },
    );

    it(
      'should preserve all known states from DETECTED through CONFIRMED',
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

          const session =
            ObservationEngine
              .prepareInstrumentObservationAtLevel(
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
                ObservationInstrumentLevel
                  .LEVEL_3,
              );

          expect(
            session.targetKnowledgeState,
          ).toBe(
            states[index],
          );
        }
      },
    );

    it(
      'should reuse 8.1 eligibility validation for absent and corrupt UNKNOWN targets',
      () => {
        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservationAtLevel(
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
                ObservationInstrumentLevel
                  .LEVEL_2,
              ),
        ).toThrow(
          RangeError,
        );

        const corrupt =
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
              .prepareInstrumentObservationAtLevel(
                canonicalObservatory,
                new GalaxyLocator(
                  1n,
                ),
                [
                  corrupt,
                ],
                ObservationInstrumentType
                  .GAMMA_RAY,
                ObservationInstrumentLevel
                  .LEVEL_4,
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
            .prepareInstrumentObservationAtLevel(
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
              ObservationInstrumentLevel
                .LEVEL_4,
            );

        const repeated =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
              ObservationInstrumentLevel
                .LEVEL_4,
            );

        const reverse =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
              ObservationInstrumentLevel
                .LEVEL_4,
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
      'should keep capability catalogs seed-independent while preserving each session generation key',
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
            .supportedInstrumentLevels(
              otherObservatory,
              ObservationInstrumentType
                .INFRARED,
            ),
        ).toEqual(
          ObservationEngine
            .supportedInstrumentLevels(
              canonicalObservatory,
              ObservationInstrumentType
                .INFRARED,
            ),
        );

        expect(
          ObservationEngine
            .instrumentCapabilityProfile(
              otherObservatory,
              ObservationInstrumentType
                .INFRARED,
              ObservationInstrumentLevel
                .LEVEL_3,
            ),
        ).toEqual(
          ObservationEngine
            .instrumentCapabilityProfile(
              canonicalObservatory,
              ObservationInstrumentType
                .INFRARED,
              ObservationInstrumentLevel
                .LEVEL_3,
            ),
        );

        const first =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
              ObservationInstrumentLevel
                .LEVEL_3,
            );

        const second =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
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
              ObservationInstrumentLevel
                .LEVEL_3,
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
      'should not let reach filter targets sensitivity detect signals or precision create certainty',
      () => {
        const session =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
              canonicalObservatory,
              new GalaxyLocator(
                42n,
              ),
              [
                known(
                  new GalaxyLocator(
                    42n,
                  ),
                  DiscoveryState.DETECTED,
                ),
              ],
              ObservationInstrumentType
                .OPTICAL,
              ObservationInstrumentLevel
                .LEVEL_1,
            );

        expect(
          session.normalizedReach,
        ).toBe(
          0.15,
        );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          Object.keys(
            session,
          ),
        ).not.toContain(
          'signalDetected',
        );

        expect(
          Object.keys(
            session,
          ),
        ).not.toContain(
          'certainty',
        );
      },
    );

    it(
      'should support Long.MAX_VALUE and reject invalid levels instruments and versions',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const maxSession =
          ObservationEngine
            .prepareInstrumentObservationAtLevel(
              canonicalObservatory,
              new GalaxyLocator(
                max,
              ),
              [
                known(
                  new GalaxyLocator(
                    max,
                  ),
                  DiscoveryState.DETECTED,
                ),
              ],
              ObservationInstrumentType
                .GRAVITATIONAL_WAVE,
              ObservationInstrumentLevel
                .LEVEL_5,
            );

        expect(
          maxSession.targetLocator,
        ).toEqual(
          new GalaxyLocator(
            max,
          ),
        );

        expect(
          maxSession.normalizedReach,
        ).toBe(
          1.0,
        );

        expect(
          () =>
            ObservationEngine
              .supportedInstrumentLevels(
                canonicalObservatory,
                'INVALID' as
                  ObservationInstrumentType,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationEngine
              .instrumentCapabilityProfile(
                canonicalObservatory,
                ObservationInstrumentType
                  .OPTICAL,
                {
                  name:
                    'INVALID',
                  rank:
                    999,
                } as unknown as
                  ObservationInstrumentLevel,
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
              .supportedInstrumentLevels(
                unsupportedObservatory,
                ObservationInstrumentType
                  .OPTICAL,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationEngine
              .instrumentCapabilityProfile(
                unsupportedObservatory,
                ObservationInstrumentType
                  .OPTICAL,
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationEngine
              .prepareInstrumentObservationAtLevel(
                unsupportedObservatory,
                new GalaxyLocator(
                  0n,
                ),
                [],
                ObservationInstrumentType
                  .OPTICAL,
                ObservationInstrumentLevel
                  .LEVEL_1,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
