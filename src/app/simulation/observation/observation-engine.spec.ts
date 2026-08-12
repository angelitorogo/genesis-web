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
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationEngine,
} from './observation-engine';

describe(
  'ObservationEngine',
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
      'should prepare the frozen Caeloria bootstrap target as DISCOVERED',
      () => {
        const session =
          ObservationEngine
            .prepareObservation(
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
            );

        expect(
          session.targetLocator,
        ).toEqual(
          new GalaxyLocator(
            0n,
          ),
        );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          session.generationKey,
        ).toBe(
          canonicalGenerationKey,
        );
      },
    );

    it(
      'should prepare canonical external galaxy one at DETECTED',
      () => {
        const session =
          ObservationEngine
            .prepareObservation(
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
            );

        expect(
          session.targetKnowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );
      },
    );

    it(
      'should prepare targets in every known state from DETECTED through CONFIRMED',
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
          const locator =
            new GalaxyLocator(
              BigInt(
                index,
              ),
            );

          expect(
            ObservationEngine
              .prepareObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  BigInt(
                    index,
                  ),
                ),
                [
                  known(
                    locator,
                    states[index],
                  ),
                ],
              )
              .targetKnowledgeState,
          ).toBe(
            states[index],
          );
        }
      },
    );

    it(
      'should reject a target absent from the known-discovery snapshot',
      () => {
        expect(
          () =>
            ObservationEngine
              .prepareObservation(
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
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a corrupt UNKNOWN target entry',
      () => {
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
              .prepareObservation(
                canonicalObservatory,
                new GalaxyLocator(
                  1n,
                ),
                [
                  corrupt,
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject the whole snapshot when any unrelated entry is corrupt UNKNOWN',
      () => {
        const corrupt =
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
              .prepareObservation(
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

                  corrupt,
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should support all six real procedural locator types using structural locator equality',
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

        const freshEquivalentLocators:
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
          of freshEquivalentLocators
        ) {
          expect(
            ObservationEngine
              .prepareObservation(
                canonicalObservatory,
                locator,
                discoveries,
              )
              .targetKnowledgeState,
          ).toBe(
            DiscoveryState.CONFIRMED,
          );
        }
      },
    );

    it(
      'should be deterministic for repeated equal inputs',
      () => {
        const discoveries =
          [
            known(
              new SystemLocator(
                0n,
                123n,
                7n,
              ),
              DiscoveryState.VISITED,
            ),
          ];

        const first =
          ObservationEngine
            .prepareObservation(
              canonicalObservatory,
              new SystemLocator(
                0n,
                123n,
                7n,
              ),
              discoveries,
            );

        const repeated =
          ObservationEngine
            .prepareObservation(
              canonicalObservatory,
              new SystemLocator(
                0n,
                123n,
                7n,
              ),
              discoveries,
            );

        expect(
          repeated,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should be independent of known-discovery query order',
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

        const forward =
          ObservationEngine
            .prepareObservation(
              canonicalObservatory,
              new BodyLocator(
                0n,
                10n,
                1n,
                2n,
              ),
              discoveries,
            );

        const reverse =
          ObservationEngine
            .prepareObservation(
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
            );

        expect(
          reverse,
        ).toEqual(
          forward,
        );
      },
    );

    it(
      'should keep V1 eligibility seed-independent while preserving each universe generation key',
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

        const first =
          ObservationEngine
            .prepareObservation(
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
            );

        const second =
          ObservationEngine
            .prepareObservation(
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
            );

        expect(
          first.targetKnowledgeState,
        ).toBe(
          second.targetKnowledgeState,
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
      'should support signed Long maximum locator indices and reject unsupported generator versions',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const maxSession =
          ObservationEngine
            .prepareObservation(
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
            );

        expect(
          maxSession.targetLocator,
        ).toEqual(
          new GalaxyLocator(
            max,
          ),
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
            ObservationEngine
              .prepareObservation(
                new Observatory(
                  unsupportedGenerationKey,
                ),
                new GalaxyLocator(
                  0n,
                ),
                [],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
