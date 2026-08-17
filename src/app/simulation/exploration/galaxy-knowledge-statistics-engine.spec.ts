import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyKnowledgeStatisticsEngine,
} from './galaxy-knowledge-statistics-engine';

describe(
  'GalaxyKnowledgeStatisticsEngine',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function known(
      locator:
        | GalaxyLocator
        | SectorLocator
        | GalacticObjectLocator
        | SystemLocator
        | BodyLocator
        | CivilizationLocator,

      state:
        ReturnType<
          typeof DiscoveryState.fromCode
        >,

      key =
        generationKey,
    ): KnownDiscovery {

      return new KnownDiscovery(
        key,
        locator,
        state,
      );
    }

    it(
      'should reproduce the frozen Caeloria bootstrap statistics',
      () => {
        const statistics =
          GalaxyKnowledgeStatisticsEngine
            .build(
              generationKey,
              0n,
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                ),
              ],
            );

        expect(
          statistics
            .progressUnits,
        ).toBe(
          2n,
        );

        expect(
          statistics
            .knownRecords,
        ).toBe(
          1n,
        );

        expect(
          statistics
            .internalKnownRecords,
        ).toBe(
          0n,
        );

        expect(
          statistics
            .stateCounts
            .discovered,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should classify every current locator type and preserve the point-7.3 progress formula',
      () => {
        const statistics =
          GalaxyKnowledgeStatisticsEngine
            .build(
              generationKey,
              3n,
              [
                known(
                  new GalaxyLocator(
                    3n,
                  ),
                  DiscoveryState
                    .DETECTED,
                ),

                known(
                  new SectorLocator(
                    3n,
                    10n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                ),

                known(
                  new GalacticObjectLocator(
                    3n,
                    10n,
                    1n,
                  ),
                  DiscoveryState
                    .VISITED,
                ),

                known(
                  new SystemLocator(
                    3n,
                    10n,
                    2n,
                  ),
                  DiscoveryState
                    .CATALOGUED,
                ),

                known(
                  new BodyLocator(
                    3n,
                    10n,
                    2n,
                    4n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),

                known(
                  new CivilizationLocator(
                    3n,
                    10n,
                    2n,
                    4n,
                    1n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                ),
              ],
            );

        expect(
          statistics
            .progressUnits,
        ).toBe(
          17n,
        );

        expect(
          statistics
            .knownRecords,
        ).toBe(
          6n,
        );

        expect(
          statistics
            .targetCounts,
        ).toEqual({
          sectors:
            1n,

          galacticObjects:
            1n,

          systems:
            1n,

          bodies:
            1n,

          civilizations:
            1n,
        });

        expect(
          statistics
            .stateCounts,
        ).toEqual({
          detected:
            1n,

          discovered:
            2n,

          visited:
            1n,

          catalogued:
            1n,

          confirmed:
            1n,
        });
      },
    );

    it(
      'should ignore records from other galaxies without changing the selected-galaxy statistics',
      () => {
        const statistics =
          GalaxyKnowledgeStatisticsEngine
            .build(
              generationKey,
              0n,
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                ),

                known(
                  new SectorLocator(
                    0n,
                    7n,
                  ),
                  DiscoveryState
                    .DETECTED,
                ),

                known(
                  new GalaxyLocator(
                    1n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),

                known(
                  new SystemLocator(
                    1n,
                    9n,
                    2n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),
              ],
            );

        expect(
          statistics
            .progressUnits,
        ).toBe(
          3n,
        );

        expect(
          statistics
            .knownRecords,
        ).toBe(
          2n,
        );

        expect(
          statistics
            .targetCounts
            .sectors,
        ).toBe(
          1n,
        );

        expect(
          statistics
            .targetCounts
            .systems,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should be independent of repository query order',
      () => {
        const discoveries = [
          known(
            new GalaxyLocator(
              0n,
            ),
            DiscoveryState
              .DISCOVERED,
          ),

          known(
            new SectorLocator(
              0n,
              5n,
            ),
            DiscoveryState
              .DETECTED,
          ),

          known(
            new SystemLocator(
              0n,
              5n,
              2n,
            ),
            DiscoveryState
              .CONFIRMED,
          ),
        ];

        const first =
          GalaxyKnowledgeStatisticsEngine
            .build(
              generationKey,
              0n,
              discoveries,
            );

        const reversed =
          GalaxyKnowledgeStatisticsEngine
            .build(
              generationKey,
              0n,
              [
                ...discoveries,
              ].reverse(),
            );

        expect(
          reversed,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should reject a snapshot without exactly one GalaxyLocator for the requested known galaxy',
      () => {
        expect(
          () =>
            GalaxyKnowledgeStatisticsEngine
              .build(
                generationKey,
                0n,
                [
                  known(
                    new SectorLocator(
                      0n,
                      1n,
                    ),
                    DiscoveryState
                      .DETECTED,
                  ),
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject duplicate locators',
      () => {
        const galaxy =
          new GalaxyLocator(
            0n,
          );

        expect(
          () =>
            GalaxyKnowledgeStatisticsEngine
              .build(
                generationKey,
                0n,
                [
                  known(
                    galaxy,
                    DiscoveryState
                      .DISCOVERED,
                  ),

                  known(
                    galaxy,
                    DiscoveryState
                      .CONFIRMED,
                  ),
                ],
              ),
        ).toThrow(
          /duplicate locator/,
        );
      },
    );

    it(
      'should reject UNKNOWN records and cross-universe snapshots',
      () => {
        const invalidUnknown =
          {
            generationKey,

            locator:
              new GalaxyLocator(
                0n,
              ),

            state:
              DiscoveryState
                .UNKNOWN,
          } as unknown as
            KnownDiscovery;

        expect(
          () =>
            GalaxyKnowledgeStatisticsEngine
              .build(
                generationKey,
                0n,
                [
                  invalidUnknown,
                ],
              ),
        ).toThrow(
          RangeError,
        );

        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            GalaxyKnowledgeStatisticsEngine
              .build(
                generationKey,
                0n,
                [
                  known(
                    new GalaxyLocator(
                      0n,
                    ),
                    DiscoveryState
                      .DISCOVERED,
                    otherKey,
                  ),
                ],
              ),
        ).toThrow(
          /generationKey/,
        );
      },
    );
  },
);
