import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyFocusChoice,
} from '../../domain/exploration/external-galaxy-focus';

import {
  BodyLocator,
  CivilizationLocator,
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
  ExternalGalaxyFocusEngine,
} from './external-galaxy-focus-engine';

import {
  GalaxyArchiveEngine,
} from './galaxy-archive-engine';

describe(
  'GalaxyArchiveEngine',
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

    function knownGalaxy(
      galaxyIndex:
        bigint,

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
        new GalaxyLocator(
          galaxyIndex,
        ),
        state,
      );
    }

    it(
      'should reproduce the frozen Caeloria bootstrap archive',
      () => {
        const archive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              0n,
              [
                knownGalaxy(
                  0n,
                  DiscoveryState.DISCOVERED,
                ),
              ],
            );

        expect(
          archive.knownGalaxyCount,
        ).toBe(
          1n,
        );

        expect(
          archive.focusedEntry
            .galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          archive.entries[0]
            .knowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );
      },
    );

    it(
      'should reproduce the canonical 0 plus 1 archive with galaxy zero focused',
      () => {
        const archive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              0n,
              [
                knownGalaxy(
                  1n,
                  DiscoveryState.DETECTED,
                ),

                knownGalaxy(
                  0n,
                  DiscoveryState.DISCOVERED,
                ),
              ],
            );

        expect(
          archive
            .entries
            .map(
              (
                entry,
              ) =>
                entry.galaxyIndex,
            ),
        ).toEqual([
          0n,
          1n,
        ]);

        expect(
          archive
            .entryForGalaxy(
              1n,
            )
            ?.designationCode,
        ).toBe(
          'GEN-V1-G1-A448D6B11BAF31F30904C808DE482290',
        );

        expect(
          archive
            .entryForGalaxy(
              0n,
            )
            ?.isCurrentFocus,
        ).toBe(
          true,
        );

        expect(
          archive
            .entryForGalaxy(
              1n,
            )
            ?.isCurrentFocus,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should preserve identical membership for REMAIN_CURRENT and FOCUS_DETECTED and only move the focus marker',
      () => {
        const discoveries =
          [
            knownGalaxy(
              0n,
              DiscoveryState.DISCOVERED,
            ),

            knownGalaxy(
              1n,
              DiscoveryState.DETECTED,
            ),
          ];

        const offer =
          ExternalGalaxyFocusEngine
            .buildFocusOffer(
              canonicalGenerationKey,
              0n,
              1n,
              DiscoveryState.DETECTED,
            );

        const remain =
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              offer,
              ExternalGalaxyFocusChoice
                .REMAIN_CURRENT,
            );

        const focusDetected =
          ExternalGalaxyFocusEngine
            .resolveFocusChoice(
              canonicalGenerationKey,
              offer,
              ExternalGalaxyFocusChoice
                .FOCUS_DETECTED,
            );

        const remainArchive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              remain
                .resultingFocusGalaxyIndex,
              discoveries,
            );

        const focusArchive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              focusDetected
                .resultingFocusGalaxyIndex,
              discoveries,
            );

        expect(
          remainArchive
            .entries
            .map(
              (
                entry,
              ) =>
                entry.galaxyIndex,
            ),
        ).toEqual(
          focusArchive
            .entries
            .map(
              (
                entry,
              ) =>
                entry.galaxyIndex,
            ),
        );

        expect(
          remainArchive
            .focusedEntry
            .galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          focusArchive
            .focusedEntry
            .galaxyIndex,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should include GalaxyLocator discoveries from DETECTED through CONFIRMED',
      () => {
        const states =
          [
            DiscoveryState.DETECTED,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ] as const;

        const archive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              0n,
              states.map(
                (
                  state,
                  index,
                ) =>
                  knownGalaxy(
                    BigInt(
                      index,
                    ),
                    state,
                  ),
              ),
            );

        expect(
          archive.knownGalaxyCount,
        ).toBe(
          5n,
        );

        expect(
          archive
            .entries
            .map(
              (
                entry,
              ) =>
                entry.knowledgeState,
            ),
        ).toEqual(
          states,
        );
      },
    );

    it(
      'should ignore every known non-galaxy locator',
      () => {
        const knownDiscoveries:
          readonly KnownDiscovery[] =
          [
            knownGalaxy(
              0n,
              DiscoveryState.DISCOVERED,
            ),

            new KnownDiscovery(
              canonicalGenerationKey,
              new SectorLocator(
                0n,
                10n,
              ),
              DiscoveryState.CONFIRMED,
            ),

            new KnownDiscovery(
              canonicalGenerationKey,
              new SystemLocator(
                0n,
                10n,
                1n,
              ),
              DiscoveryState.CONFIRMED,
            ),

            new KnownDiscovery(
              canonicalGenerationKey,
              new BodyLocator(
                0n,
                10n,
                1n,
                2n,
              ),
              DiscoveryState.CONFIRMED,
            ),

            new KnownDiscovery(
              canonicalGenerationKey,
              new CivilizationLocator(
                0n,
                10n,
                1n,
                2n,
                3n,
              ),
              DiscoveryState.CONFIRMED,
            ),
          ];

        const archive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              0n,
              knownDiscoveries,
            );

        expect(
          archive.knownGalaxyCount,
        ).toBe(
          1n,
        );

        expect(
          archive.entries[0]
            .galaxyIndex,
        ).toBe(
          0n,
        );
      },
    );

    it(
      'should reject UNKNOWN knowledge even when supplied through a corrupt runtime snapshot',
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
            GalaxyArchiveEngine
              .buildArchive(
                canonicalGenerationKey,
                0n,
                [
                  knownGalaxy(
                    0n,
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
      'should reject archives whose current focus is not a known detected galaxy',
      () => {
        expect(
          () =>
            GalaxyArchiveEngine
              .buildArchive(
                canonicalGenerationKey,
                7n,
                [
                  knownGalaxy(
                    0n,
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
      'should be independent of known-discovery input order',
      () => {
        const discoveries =
          [
            knownGalaxy(
              42n,
              DiscoveryState.CONFIRMED,
            ),

            knownGalaxy(
              0n,
              DiscoveryState.DISCOVERED,
            ),

            knownGalaxy(
              10n,
              DiscoveryState.VISITED,
            ),

            knownGalaxy(
              1n,
              DiscoveryState.DETECTED,
            ),
          ];

        const forward =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              10n,
              discoveries,
            );

        const reverse =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              10n,
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
      'should preserve archive membership across UniverseSeed while allowing 7.6 preliminary hints to change',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const first =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              0n,
              [
                knownGalaxy(
                  0n,
                  DiscoveryState.DISCOVERED,
                ),

                knownGalaxy(
                  1n,
                  DiscoveryState.DETECTED,
                ),
              ],
            );

        const second =
          GalaxyArchiveEngine
            .buildArchive(
              otherKey,
              0n,
              [
                knownGalaxy(
                  0n,
                  DiscoveryState.DISCOVERED,
                  otherKey,
                ),

                knownGalaxy(
                  1n,
                  DiscoveryState.DETECTED,
                  otherKey,
                ),
              ],
            );

        expect(
          second
            .entries
            .map(
              (
                entry,
              ) =>
                entry.galaxyIndex,
            ),
        ).toEqual(
          first
            .entries
            .map(
              (
                entry,
              ) =>
                entry.galaxyIndex,
            ),
        );

        expect(
          second
            .entryForGalaxy(
              1n,
            )
            ?.designationCode,
        ).not.toBe(
          first
            .entryForGalaxy(
              1n,
            )
            ?.designationCode,
        );
      },
    );

    it(
      'should support signed Long maximum galaxy index',
      () => {
        const max =
          9_223_372_036_854_775_807n;

        const archive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              max,
              [
                knownGalaxy(
                  0n,
                  DiscoveryState.DISCOVERED,
                ),

                knownGalaxy(
                  max,
                  DiscoveryState.DETECTED,
                ),
              ],
            );

        expect(
          archive.focusedEntry
            .galaxyIndex,
        ).toBe(
          max,
        );

        expect(
          archive
            .entryForGalaxy(
              max,
            )
            ?.galaxyIndex,
        ).toBe(
          max,
        );
      },
    );

    it(
      'should preserve deterministic V1 archive contracts across 1024 galaxies and reject unsupported versions',
      () => {
        const discoveries:
          KnownDiscovery[] =
          [];

        for (
          let index =
            0n;
          index <
            1_024n;
          index +=
            1n
        ) {
          discoveries.push(
            knownGalaxy(
              index,
              index ===
                0n
                ? DiscoveryState.DISCOVERED
                : DiscoveryState.DETECTED,
            ),
          );
        }

        const archive =
          GalaxyArchiveEngine
            .buildArchive(
              canonicalGenerationKey,
              0n,
              discoveries,
            );

        expect(
          archive.knownGalaxyCount,
        ).toBe(
          1_024n,
        );

        expect(
          archive.entries[0]
            .galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          archive.entries[
            archive.entries.length -
              1
          ].galaxyIndex,
        ).toBe(
          1_023n,
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
            GalaxyArchiveEngine
              .buildArchive(
                unsupportedGenerationKey,
                0n,
                [
                  knownGalaxy(
                    0n,
                    DiscoveryState.DISCOVERED,
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
