import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
  type DiscoveryStateValue,
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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  HomeDashboardAssembler,
} from './home-dashboard-assembler';

describe(
  'HomeDashboardAssembler',
  () => {
    const canonicalGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function known(
      locator:
        ProceduralLocator,

      state:
        DiscoveryStateValue =
          DiscoveryState.DETECTED,

      generationKey:
        UniverseGenerationKey =
          canonicalGenerationKey,
    ): KnownDiscovery {

      return new KnownDiscovery(
        generationKey,
        locator,
        state,
      );
    }

    it(
      'should reproduce the frozen Caeloria bootstrap dashboard',
      () => {
        const dashboard =
          HomeDashboardAssembler
            .assemble(
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
          dashboard.activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          dashboard
            .activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          dashboard.galaxyProgressUnits,
        ).toBe(
          2n,
        );

        expect(
          dashboard.discoveryPoints,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should preserve global Discovery Points independently from local progress',
      () => {
        const dashboard =
          HomeDashboardAssembler
            .assemble(
              canonicalGenerationKey,
              0n,
              12_345n,
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
          dashboard.discoveryPoints,
        ).toBe(
          12_345n,
        );

        expect(
          dashboard.galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should support an external active galaxy from DETECTED onwards',
      () => {
        const dashboard =
          HomeDashboardAssembler
            .assemble(
              canonicalGenerationKey,
              7n,
              500n,
              [
                known(
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState
                    .CONFIRMED,
                ),

                known(
                  new GalaxyLocator(
                    7n,
                  ),
                  DiscoveryState
                    .DETECTED,
                ),
              ],
            );

        expect(
          dashboard.activeGalaxyIndex,
        ).toBe(
          7n,
        );

        expect(
          dashboard
            .activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DETECTED,
        );

        expect(
          dashboard.galaxyProgressUnits,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should delegate local progress across all six locator types in the active galaxy',
      () => {
        const dashboard =
          HomeDashboardAssembler
            .assemble(
              canonicalGenerationKey,
              3n,
              0n,
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
          dashboard.galaxyProgressUnits,
        ).toBe(
          17n,
        );
      },
    );

    it(
      'should ignore known discoveries from other galaxies when deriving local progress',
      () => {
        const dashboard =
          HomeDashboardAssembler
            .assemble(
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
          dashboard.galaxyProgressUnits,
        ).toBe(
          2n,
        );
      },
    );

    it(
      'should be independent of known-discovery query order',
      () => {
        const discoveries =
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
          ];

        expect(
          HomeDashboardAssembler
            .assemble(
              canonicalGenerationKey,
              0n,
              99n,
              [
                ...discoveries,
              ].reverse(),
            ),
        ).toEqual(
          HomeDashboardAssembler
            .assemble(
              canonicalGenerationKey,
              0n,
              99n,
              discoveries,
            ),
        );
      },
    );

    it(
      'should reject known discoveries belonging to another universe',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            HomeDashboardAssembler
              .assemble(
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
                    otherGenerationKey,
                  ),
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject structurally duplicate locators instead of using last-wins semantics',
      () => {
        expect(
          () =>
            HomeDashboardAssembler
              .assemble(
                canonicalGenerationKey,
                0n,
                0n,
                [
                  known(
                    new GalaxyLocator(
                      0n,
                    ),
                    DiscoveryState
                      .DETECTED,
                  ),

                  known(
                    new GalaxyLocator(
                      0n,
                    ),
                    DiscoveryState
                      .DISCOVERED,
                  ),
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a snapshot that does not contain the active GalaxyLocator',
      () => {
        expect(
          () =>
            HomeDashboardAssembler
              .assemble(
                canonicalGenerationKey,
                0n,
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
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject UNKNOWN or invalid runtime discovery states before delegating progress',
      () => {
        const corruptUnknown =
          {
            generationKey:
              canonicalGenerationKey,

            locator:
              new GalaxyLocator(
                0n,
              ),

            state:
              DiscoveryState
                .UNKNOWN,
          } as unknown as
            KnownDiscovery;

        const corruptInvalid =
          {
            generationKey:
              canonicalGenerationKey,

            locator:
              new GalaxyLocator(
                0n,
              ),

            state: {
              name:
                'INVALID',

              code:
                999,
            },
          } as unknown as
            KnownDiscovery;

        expect(
          () =>
            HomeDashboardAssembler
              .assemble(
                canonicalGenerationKey,
                0n,
                0n,
                [
                  corruptUnknown,
                ],
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            HomeDashboardAssembler
              .assemble(
                canonicalGenerationKey,
                0n,
                0n,
                [
                  corruptInvalid,
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should preserve signed Long boundary validation and reject unsupported generator versions',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const dashboard =
          HomeDashboardAssembler
            .assemble(
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
          dashboard.discoveryPoints,
        ).toBe(
          max,
        );

        expect(
          dashboard.activeGalaxyIndex,
        ).toBe(
          max,
        );

        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalGenerationKey
                .universeSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            HomeDashboardAssembler
              .assemble(
                unsupportedGenerationKey,
                0n,
                0n,
                [
                  new KnownDiscovery(
                    unsupportedGenerationKey,
                    new GalaxyLocator(
                      0n,
                    ),
                    DiscoveryState
                      .DISCOVERED,
                  ),
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
