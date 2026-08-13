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
  ExplorationEntryAssembler,
} from './exploration-entry-assembler';

describe(
  'ExplorationEntryAssembler',
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
        ProceduralLocator,

      state:
        DiscoveryStateValue =
          DiscoveryState
            .DETECTED,

      key:
        UniverseGenerationKey =
          generationKey,
    ): KnownDiscovery {

      return new KnownDiscovery(
        key,
        locator,
        state,
      );
    }

    it(
      'should reproduce the canonical V1 bootstrap exploration entry',
      () => {
        const model =
          ExplorationEntryAssembler
            .assemble(
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
          model.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          model.activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          model.activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );

        expect(
          model.activeGalaxyLocator,
        ).toEqual(
          new GalaxyLocator(
            0n,
          ),
        );
      },
    );

    it(
      'should accept every known active-galaxy state from DETECTED through CONFIRMED',
      () => {
        const states =
          [
            DiscoveryState
              .DETECTED,
            DiscoveryState
              .DISCOVERED,
            DiscoveryState
              .VISITED,
            DiscoveryState
              .CATALOGUED,
            DiscoveryState
              .CONFIRMED,
          ];

        for (
          const state
          of states
        ) {
          expect(
            ExplorationEntryAssembler
              .assemble(
                generationKey,
                2n,
                [
                  known(
                    new GalaxyLocator(
                      2n,
                    ),
                    state,
                  ),
                ],
              )
              .activeGalaxyDiscoveryState,
          ).toBe(
            state,
          );
        }
      },
    );

    it(
      'should preserve the active galaxy while allowing all six canonical locator kinds in the snapshot',
      () => {
        const discoveries =
          [
            known(
              new GalaxyLocator(
                3n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),

            known(
              new SectorLocator(
                3n,
                10n,
              ),
            ),

            known(
              new GalacticObjectLocator(
                3n,
                10n,
                1n,
              ),
            ),

            known(
              new SystemLocator(
                3n,
                10n,
                2n,
              ),
            ),

            known(
              new BodyLocator(
                3n,
                10n,
                2n,
                4n,
              ),
            ),

            known(
              new CivilizationLocator(
                3n,
                10n,
                2n,
                4n,
                1n,
              ),
            ),
          ];

        const model =
          ExplorationEntryAssembler
            .assemble(
              generationKey,
              3n,
              discoveries,
            );

        expect(
          model.activeGalaxyIndex,
        ).toBe(
          3n,
        );

        expect(
          model.activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DISCOVERED,
        );
      },
    );

    it(
      'should use only the explicitly active GalaxyLocator when other galaxies are known',
      () => {
        const model =
          ExplorationEntryAssembler
            .assemble(
              generationKey,
              7n,
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
          model.activeGalaxyIndex,
        ).toBe(
          7n,
        );

        expect(
          model.activeGalaxyDiscoveryState,
        ).toBe(
          DiscoveryState
            .DETECTED,
        );
      },
    );

    it(
      'should be independent from known-discovery input order',
      () => {
        const first =
          ExplorationEntryAssembler
            .assemble(
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
                    20n,
                  ),
                ),
              ],
            );

        const second =
          ExplorationEntryAssembler
            .assemble(
              generationKey,
              0n,
              [
                known(
                  new SectorLocator(
                    0n,
                    20n,
                  ),
                ),

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
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should reject discoveries from another UniverseGenerationKey',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1234-5678-9ABC-DEF0-1234-5678-9ABC-DEF0',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            ExplorationEntryAssembler
              .assemble(
                generationKey,
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
          'knownDiscoveries must all belong to generationKey.',
        );
      },
    );

    it(
      'should reject UNKNOWN materialized in knownDiscoveries',
      () => {
        const forged =
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
            ExplorationEntryAssembler
              .assemble(
                generationKey,
                0n,
                [
                  forged,
                ],
              ),
        ).toThrow(
          'knownDiscoveries cannot contain DiscoveryState.UNKNOWN.',
        );
      },
    );

    it(
      'should reject a duplicate active GalaxyLocator',
      () => {
        expect(
          () =>
            ExplorationEntryAssembler
              .assemble(
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
                    new GalaxyLocator(
                      0n,
                    ),
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
      'should reject duplicate non-galaxy locators as a corrupt repository snapshot',
      () => {
        expect(
          () =>
            ExplorationEntryAssembler
              .assemble(
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
                    new SystemLocator(
                      0n,
                      10n,
                      2n,
                    ),
                  ),

                  known(
                    new SystemLocator(
                      0n,
                      10n,
                      2n,
                    ),
                  ),
                ],
              ),
        ).toThrow(
          /duplicate locator/,
        );
      },
    );

    it(
      'should reject entry when the active galaxy is not a known GalaxyLocator',
      () => {
        expect(
          () =>
            ExplorationEntryAssembler
              .assemble(
                generationKey,
                4n,
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
                      4n,
                      10n,
                    ),
                  ),
                ],
              ),
        ).toThrow(
          'The active galaxy must already exist as a known GalaxyLocator.',
        );
      },
    );

    it(
      'should keep structurally overlapping GalacticObjectLocator and SystemLocator identities distinct',
      () => {
        const model =
          ExplorationEntryAssembler
            .assemble(
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
                  new GalacticObjectLocator(
                    0n,
                    10n,
                    2n,
                  ),
                ),

                known(
                  new SystemLocator(
                    0n,
                    10n,
                    2n,
                  ),
                ),
              ],
            );

        expect(
          model.activeGalaxyIndex,
        ).toBe(
          0n,
        );
      },
    );
  },
);
