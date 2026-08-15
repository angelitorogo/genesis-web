import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectLocator,
  SystemLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorCoordinates,
} from '../../domain/sector/galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
} from './archive-discovery-detail.facade';

describe(
  'ArchiveDiscoveryDetailFacade',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    function configure(
      options: {
        readonly universes?:
          readonly UniverseGenerationKey[];

        readonly discoveryState?:
          DiscoveryStateValue;
      } = {},
    ): {
      readonly facade:
        ArchiveDiscoveryDetailFacade;

      readonly stateReads:
        ProceduralLocator[];
    } {
      const stateReads:
        ProceduralLocator[] =
        [];

      const repositories:
        GenesisLocalRepositories =
        {
          universeRepository: {
            async createIfAbsent() {
              throw new Error(
                '10.6 archive detail must not create universes.',
              );
            },

            async exists() {
              throw new Error(
                '10.6 archive detail resolves the persisted universe list.',
              );
            },

            async getAll() {
              return options.universes ??
                [
                  generationKey,
                ];
            },

            async delete() {
              throw new Error(
                '10.6 archive detail must not delete universes.',
              );
            },
          },

          navigationRepository: {
            async getNavigation() {
              throw new Error(
                '10.6 archive detail must not read navigation.',
              );
            },

            async setNavigation() {
              throw new Error(
                '10.6 archive detail must not write navigation.',
              );
            },
          },

          pointsRepository: {
            async getGlobalDiscoveryPoints() {
              throw new Error(
                '10.6 archive detail must not read global PD.',
              );
            },

            async setGlobalDiscoveryPoints() {
              throw new Error(
                '10.6 archive detail must not write global PD.',
              );
            },

            async getGalaxyDiscoveryPoints() {
              throw new Error(
                '10.6 archive detail must not read galaxy PD.',
              );
            },

            async setGalaxyDiscoveryPoints() {
              throw new Error(
                '10.6 archive detail must not write galaxy PD.',
              );
            },
          },

          discoveryRepository: {
            async getState(
              _key,
              locator,
            ) {
              stateReads.push(
                locator,
              );

              return options.discoveryState ??
                DiscoveryState.DETECTED;
            },

            async setState() {
              throw new Error(
                '10.6 archive detail must not mutate DiscoveryState.',
              );
            },

            async getKnownDiscoveries() {
              throw new Error(
                '10.6 archive detail must resolve only the requested persisted locator.',
              );
            },

            async getKnownDiscoveriesInSector() {
              throw new Error(
                '10.6 archive detail must not materialize sector content.',
              );
            },
          },
        };

      TestBed.configureTestingModule({
        providers: [
          {
            provide:
              GENESIS_LOCAL_REPOSITORIES,

            useValue:
              repositories,
          },
        ],
      });

      return {
        facade:
          TestBed.inject(
            ArchiveDiscoveryDetailFacade,
          ),

        stateReads,
      };
    }

    it(
      'should resolve one persisted SystemLocator into a minimal read-only Archive record',
      async () => {
        const {
          facade,
          stateReads,
        } =
          configure({
            discoveryState:
              DiscoveryState.DISCOVERED,
          });

        const coordinates =
          new GalaxySectorCoordinates(
            -2,
            3,
          );

        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            );

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '0',
          sectorKey:
            sectorKey.toString(
              10,
            ),
          galacticObjectIndex:
            '7',
          universeSeed:
            generationKey
              .universeSeed
              .serialize(),
          generatorVersionCode:
            '1',
        });

        expect(
          stateReads,
        ).toEqual([
          new SystemLocator(
            0n,
            sectorKey,
            7n,
          ),
        ]);

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        const model =
          facade.model();

        expect(
          model,
        ).not.toBeNull();

        expect(
          model?.universeSeed,
        ).toBe(
          DEFAULT_UNIVERSE_SEED,
        );

        expect(
          model?.generatorVersionCode,
        ).toBe(
          1,
        );

        expect(
          model?.resultKind,
        ).toBe(
          ExplorationResultKind.SYSTEM,
        );

        expect(
          model?.familyLabel,
        ).toBe(
          'Sistema',
        );

        expect(
          model?.discoveryStateLabel,
        ).toBe(
          'Descubierto',
        );

        expect(
          model?.sectorX,
        ).toBe(
          -2,
        );

        expect(
          model?.sectorY,
        ).toBe(
          3,
        );

        expect(
          model?.proceduralIdentity,
        ).toBe(
          `G0 / S${sectorKey.toString(10)} / O7`,
        );
      },
    );

    it(
      'should resolve a persisted GalacticObjectLocator through the frozen point-9.4 family classifier',
      async () => {
        const {
          facade,
          stateReads,
        } =
          configure({
            discoveryState:
              DiscoveryState.CONFIRMED,
          });

        const coordinates =
          new GalaxySectorCoordinates(
            1,
            -1,
          );

        const sectorKey =
          GalaxySectorKeyCodec
            .encode(
              coordinates,
            );

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
          galaxyIndex:
            '0',
          sectorKey:
            sectorKey.toString(
              10,
            ),
          galacticObjectIndex:
            '3',
          universeSeed:
            generationKey
              .universeSeed
              .serialize(),
          generatorVersionCode:
            '1',
        });

        expect(
          stateReads,
        ).toEqual([
          new GalacticObjectLocator(
            0n,
            sectorKey,
            3n,
          ),
        ]);

        const model =
          facade.model();

        expect(
          model,
        ).not.toBeNull();

        expect(
          [
            ExplorationResultKind.NEBULA,
            ExplorationResultKind.STAR_CLUSTER,
            ExplorationResultKind.EXTREME_OBJECT,
          ],
        ).toContain(
          model?.resultKind,
        );

        expect(
          [
            'Nebulosa',
            'Cúmulo estelar',
            'Objeto extremo',
          ],
        ).toContain(
          model?.familyLabel,
        );

        expect(
          model?.locatorKindLabel,
        ).toBe(
          'GalacticObjectLocator',
        );

        expect(
          model?.discoveryStateLabel,
        ).toBe(
          'Confirmado',
        );
      },
    );

    it(
      'should keep an absent persisted locator as not-found instead of materializing it',
      async () => {
        const {
          facade,
        } =
          configure({
            discoveryState:
              DiscoveryState.UNKNOWN,
          });

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            '0',
          universeSeed:
            null,
          generatorVersionCode:
            null,
        });

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'not-found',
        });

        expect(
          facade.model(),
        ).toBeNull();
      },
    );

    it(
      'should reject malformed or out-of-range route identity before repository lookup',
      async () => {
        const {
          facade,
          stateReads,
        } =
          configure();

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '-1',
          sectorKey:
            '0',
          galacticObjectIndex:
            '0',
          universeSeed:
            null,
          generatorVersionCode:
            null,
        });

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );

        expect(
          facade.errorMessage(),
        ).toContain(
          'galaxyIndex',
        );

        expect(
          stateReads,
        ).toHaveLength(
          0,
        );

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '0',
          sectorKey:
            '9223372036854775808',
          galacticObjectIndex:
            '0',
          universeSeed:
            null,
          generatorVersionCode:
            null,
        });

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );

        expect(
          stateReads,
        ).toHaveLength(
          0,
        );
      },
    );

    it(
      'should honor the exact seed/version identity from a reloadable Archive URL when multiple universes exist',
      async () => {
        const requestedGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              'ABCD-0000-0000-0000-0000-0000-0000-0001',
            ),
            GeneratorVersion.V1,
          );

        const requestedKeys:
          UniverseGenerationKey[] =
          [];

        const repositories:
          GenesisLocalRepositories =
          {
            universeRepository: {
              async createIfAbsent() {
                throw new Error(
                  'Unexpected write.',
                );
              },

              async exists() {
                throw new Error(
                  'Unexpected exists read.',
                );
              },

              async getAll() {
                return [
                  generationKey,
                  requestedGenerationKey,
                ];
              },

              async delete() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            navigationRepository: {
              async getNavigation() {
                throw new Error(
                  'Unexpected navigation read.',
                );
              },

              async setNavigation() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            pointsRepository: {
              async getGlobalDiscoveryPoints() {
                throw new Error(
                  'Unexpected PD read.',
                );
              },

              async setGlobalDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },

              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected PD read.',
                );
              },

              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            discoveryRepository: {
              async getState(
                key,
              ) {
                requestedKeys.push(
                  key,
                );

                return DiscoveryState.DETECTED;
              },

              async setState() {
                throw new Error(
                  'Unexpected write.',
                );
              },

              async getKnownDiscoveries() {
                throw new Error(
                  'Unexpected collection read.',
                );
              },

              async getKnownDiscoveriesInSector() {
                throw new Error(
                  'Unexpected sector read.',
                );
              },
            },
          };

        TestBed.resetTestingModule();

        TestBed.configureTestingModule({
          providers: [
            {
              provide:
                GENESIS_LOCAL_REPOSITORIES,

              useValue:
                repositories,
            },
          ],
        });

        const facade =
          TestBed.inject(
            ArchiveDiscoveryDetailFacade,
          );

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            '0',
          universeSeed:
            requestedGenerationKey
              .universeSeed
              .serialize(),
          generatorVersionCode:
            '1',
        });

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        expect(
          requestedKeys,
        ).toEqual([
          requestedGenerationKey,
        ]);

        expect(
          facade.model()?.universeSeed,
        ).toBe(
          requestedGenerationKey
            .universeSeed
            .serialize(),
        );
      },
    );

    it(
      'should reuse the sole persisted universe when the in-memory seed selection is not the persisted one',
      async () => {
        const foreignGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              'ABCD-0000-0000-0000-0000-0000-0000-0001',
            ),
            GeneratorVersion.V1,
          );

        const stateReads:
          ProceduralLocator[] =
          [];

        const repositories:
          GenesisLocalRepositories =
          {
            universeRepository: {
              async createIfAbsent() {
                throw new Error(
                  'Unexpected write.',
                );
              },

              async exists() {
                return true;
              },

              async getAll() {
                return [
                  foreignGenerationKey,
                ];
              },

              async delete() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            navigationRepository: {
              async getNavigation() {
                throw new Error(
                  'Unexpected navigation read.',
                );
              },

              async setNavigation() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            pointsRepository: {
              async getGlobalDiscoveryPoints() {
                throw new Error(
                  'Unexpected PD read.',
                );
              },

              async setGlobalDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },

              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected PD read.',
                );
              },

              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            discoveryRepository: {
              async getState(
                key,
                locator,
              ) {
                expect(
                  key,
                ).toBe(
                  foreignGenerationKey,
                );

                stateReads.push(
                  locator,
                );

                return DiscoveryState.DETECTED;
              },

              async setState() {
                throw new Error(
                  'Unexpected write.',
                );
              },

              async getKnownDiscoveries() {
                throw new Error(
                  'Unexpected collection read.',
                );
              },

              async getKnownDiscoveriesInSector() {
                throw new Error(
                  'Unexpected sector read.',
                );
              },
            },
          };

        TestBed.resetTestingModule();

        TestBed.configureTestingModule({
          providers: [
            {
              provide:
                GENESIS_LOCAL_REPOSITORIES,

              useValue:
                repositories,
            },
          ],
        });

        const facade =
          TestBed.inject(
            ArchiveDiscoveryDetailFacade,
          );

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            '0',
          universeSeed:
            null,
          generatorVersionCode:
            null,
        });

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        expect(
          stateReads,
        ).toEqual([
          new SystemLocator(
            0n,
            0n,
            0n,
          ),
        ]);
      },
    );
  },
);
