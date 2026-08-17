import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ExplorationProgressOverviewEngine,
} from './exploration-progress-overview-engine';

describe(
  'ExplorationProgressOverviewEngine',
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
      'should reproduce the frozen Caeloria bootstrap overview',
      () => {
        const overview =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              0n,
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
          overview
            .globalDiscoveryPoints,
        ).toBe(
          0n,
        );

        expect(
          overview
            .galaxyProgress
            .galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          overview
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should preserve global Discovery Points independently from local galaxy progress',
      () => {
        const overview =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              12_345n,
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
          overview
            .globalDiscoveryPoints,
        ).toBe(
          12_345n,
        );

        expect(
          overview
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should return zero local progress for a galaxy with no known discoveries',
      () => {
        const overview =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              500n,
              7n,
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),
              ],
            );

        expect(
          overview
            .globalDiscoveryPoints,
        ).toBe(
          500n,
        );

        expect(
          overview
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should sum DiscoveryState codes for every locator type in the selected galaxy',
      () => {
        const overview =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              0n,
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
          overview
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          17n,
        );
      },
    );

    it(
      'should ignore discoveries that belong to other galaxies',
      () => {
        const overview =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              0n,
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
                  new GalaxyLocator(
                    1n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),

                known(
                  new SystemLocator(
                    1n,
                    20n,
                    2n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),
              ],
            );

        expect(
          overview
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should reflect local knowledge progression without changing global PD',
      () => {
        const detected =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              777n,
              0n,
              [
                known(
                  new SystemLocator(
                    0n,
                    10n,
                    1n,
                  ),
                  DiscoveryState
                    .DETECTED,
                ),
              ],
            );

        const confirmed =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              777n,
              0n,
              [
                known(
                  new SystemLocator(
                    0n,
                    10n,
                    1n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),
              ],
            );

        expect(
          detected
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          1n,
        );

        expect(
          confirmed
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          5n,
        );

        expect(
          detected
            .globalDiscoveryPoints,
        ).toBe(
          777n,
        );

        expect(
          confirmed
            .globalDiscoveryPoints,
        ).toBe(
          777n,
        );
      },
    );

    it(
      'should be independent of known-discovery query order',
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
              .VISITED,
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

          known(
            new BodyLocator(
              1n,
              7n,
              3n,
              1n,
            ),
            DiscoveryState
              .CONFIRMED,
          ),
        ];

        const first =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              99n,
              0n,
              discoveries,
            );

        const reversed =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              99n,
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
      'should be UniverseSeed-independent for structurally equal V1 snapshots',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              123n,
              4n,
              [
                known(
                  new GalaxyLocator(
                    4n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                ),

                known(
                  new SystemLocator(
                    4n,
                    8n,
                    1n,
                  ),
                  DiscoveryState
                    .CATALOGUED,
                ),
              ],
            );

        const second =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              otherKey,
              123n,
              4n,
              [
                known(
                  new GalaxyLocator(
                    4n,
                  ),
                  DiscoveryState
                    .DISCOVERED,
                  otherKey,
                ),

                known(
                  new SystemLocator(
                    4n,
                    8n,
                    1n,
                  ),
                  DiscoveryState
                    .CATALOGUED,
                  otherKey,
                ),
              ],
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should support maximum signed Long global PD and galaxy index',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const overview =
          ExplorationProgressOverviewEngine
            .buildProgressOverview(
              canonicalGenerationKey,
              max,
              max,
              [
                known(
                  new GalaxyLocator(
                    max,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),
              ],
            );

        expect(
          overview
            .globalDiscoveryPoints,
        ).toBe(
          max,
        );

        expect(
          overview
            .galaxyProgress
            .galaxyIndex,
        ).toBe(
          max,
        );

        expect(
          overview
            .galaxyProgress
            .galaxyProgressUnits,
        ).toBe(
          5n,
        );
      },
    );

    it(
      'should reject negative global PD or galaxy indices',
      () => {
        expect(
          () =>
            ExplorationProgressOverviewEngine
              .buildProgressOverview(
                canonicalGenerationKey,
                -1n,
                0n,
                [],
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ExplorationProgressOverviewEngine
              .buildProgressOverview(
                canonicalGenerationKey,
                0n,
                -1n,
                [],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unsupported generator versions',
      () => {
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
            ExplorationProgressOverviewEngine
              .buildProgressOverview(
                unsupportedGenerationKey,
                0n,
                0n,
                [],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
