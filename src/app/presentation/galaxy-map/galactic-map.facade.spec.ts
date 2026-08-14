import {
  TestBed,
} from '@angular/core/testing';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
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
  ExternalGalaxyMorphologyHint,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

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
  GalacticMapFacade,
} from './galactic-map.facade';

describe(
  'GalacticMapFacade',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    function knownSector(
      galaxyIndex:
        bigint,

      x:
        number,

      y:
        number,

      state:
        DiscoveryStateValue =
          DiscoveryState.DETECTED,
    ): KnownDiscovery {

      return new KnownDiscovery(
        generationKey,
        new SectorLocator(
          galaxyIndex,
          GalaxySectorKeyCodec
            .encode(
              new GalaxySectorCoordinates(
                x,
                y,
              ),
            ),
        ),
        state,
      );
    }

    function repositories(
      universes:
        readonly UniverseGenerationKey[] =
          [
            generationKey,
          ],

      activeGalaxyIndex =
        0n,

      knowledgeState:
        DiscoveryStateValue =
          DiscoveryState
            .DISCOVERED,

      knownDiscoveries:
        readonly KnownDiscovery[] =
          [],

      onKnownDiscoveriesRead:
        (() => void) | null =
          null,
    ): GenesisLocalRepositories {

      return {
        universeRepository: {
          async createIfAbsent() {
            throw new Error(
              '10.3 must not create universes.',
            );
          },

          async exists() {
            throw new Error(
              '10.3 uses the persisted universe list.',
            );
          },

          async getAll() {
            return universes;
          },

          async delete() {
            throw new Error(
              '10.3 must not delete universes.',
            );
          },
        },

        navigationRepository: {
          async getNavigation() {
            return {
              activeGalaxyIndex,
              recentGalaxyIndices:
                [],
            };
          },

          async setNavigation() {
            throw new Error(
              '10.3 must not mutate navigation.',
            );
          },
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            throw new Error(
              '10.3 must not read PD.',
            );
          },

          async setGlobalDiscoveryPoints() {
            throw new Error(
              '10.3 must not write PD.',
            );
          },

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '10.3 must not read galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {
            throw new Error(
              '10.3 must not write galaxy PD.',
            );
          },
        },

        discoveryRepository: {
          async getState(
            _generationKey,
            locator,
          ) {
            expect(
              locator,
            ).toEqual(
              new GalaxyLocator(
                activeGalaxyIndex,
              ),
            );

            return knowledgeState;
          },

          async setState() {
            throw new Error(
              '10.3 must not mutate DiscoveryState.',
            );
          },

          async getKnownDiscoveries() {
            onKnownDiscoveriesRead?.();

            return knownDiscoveries;
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '10.3 must not issue one repository query per sector.',
            );
          },
        },
      };
    }

    function configure(
      bundle:
        GenesisLocalRepositories,
    ): GalacticMapFacade {

      TestBed.configureTestingModule({
        providers: [
          {
            provide:
              GENESIS_LOCAL_REPOSITORIES,

            useValue:
              bundle,
          },
        ],
      });

      return TestBed.inject(
        GalacticMapFacade,
      );
    }

    it(
      'should prepare the discovered active galaxy with binary explored-sector coverage from persisted SectorLocators only',
      async () => {
        const facade =
          configure(
            repositories(
              [
                generationKey,
              ],
              0n,
              DiscoveryState.DISCOVERED,
              [
                new KnownDiscovery(
                  generationKey,
                  new GalaxyLocator(
                    0n,
                  ),
                  DiscoveryState.DISCOVERED,
                ),
                knownSector(
                  0n,
                  0,
                  0,
                ),
                knownSector(
                  0n,
                  1,
                  -1,
                  DiscoveryState.CONFIRMED,
                ),
                new KnownDiscovery(
                  generationKey,
                  new SystemLocator(
                    0n,
                    GalaxySectorKeyCodec
                      .encode(
                        new GalaxySectorCoordinates(
                          2,
                          2,
                        ),
                      ),
                    0n,
                  ),
                  DiscoveryState.CONFIRMED,
                ),
                knownSector(
                  1n,
                  0,
                  0,
                ),
              ],
            ),
          );

        await facade.refresh();

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        const model =
          facade.model();

        expect(
          model?.galaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          model?.knowledgeState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          model?.visualStructure,
        ).not.toBeNull();

        expect(
          model
            ?.preliminaryInformation
            .morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .SPHEROIDAL,
        );

        expect(
          model
            ?.explorationCoverage
            ?.exploredSectors,
        ).toEqual([
          new GalaxySectorCoordinates(
            0,
            0,
          ),
          new GalaxySectorCoordinates(
            1,
            -1,
          ),
        ]);

        expect(
          model
            ?.explorationCoverage
            ?.exploredSectorCount,
        ).toBe(
          2,
        );

        expect(
          model
            ?.explorationCoverage
            ?.totalSectorCount,
        ).toBe(
          29_929n,
        );
      },
    );

    it(
      'should keep a merely detected galaxy on the safe preliminary projection without reading sector coverage',
      async () => {
        let knownDiscoveryReads =
          0;

        const facade =
          configure(
            repositories(
              [
                generationKey,
              ],
              1n,
              DiscoveryState.DETECTED,
              [],
              () => {
                knownDiscoveryReads +=
                  1;
              },
            ),
          );

        await facade.refresh();

        const model =
          facade.model();

        expect(
          model?.knowledgeState,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          model?.visualStructure,
        ).toBeNull();

        expect(
          model?.explorationCoverage,
        ).toBeNull();

        expect(
          knownDiscoveryReads,
        ).toBe(
          0,
        );

        expect(
          model
            ?.preliminaryInformation
            .morphologyHint,
        ).toBe(
          ExternalGalaxyMorphologyHint
            .DISK_LIKE,
        );
      },
    );

    it(
      'should expose Empty when there is no persisted universe',
      async () => {
        const facade =
          configure(
            repositories(
              [],
            ),
          );

        await facade.refresh();

        expect(
          facade.state(),
        ).toEqual({
          kind:
            'empty',
        });

        expect(
          facade.model(),
        ).toBeNull();
      },
    );

    it(
      'should expose Error when persisted navigation points to an unknown active galaxy',
      async () => {
        const facade =
          configure(
            repositories(
              [
                generationKey,
              ],
              7n,
              DiscoveryState.UNKNOWN,
            ),
          );

        await facade.refresh();

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );

        expect(
          facade.errorMessage(),
        ).toContain(
          'active galaxy',
        );
      },
    );

    it(
      'should read one known-discovery snapshot but never PD, per-sector queries or sector content generation for point 10.3',
      async () => {
        let knownDiscoveryReads =
          0;

        const facade =
          configure(
            repositories(
              [
                generationKey,
              ],
              0n,
              DiscoveryState.DISCOVERED,
              [],
              () => {
                knownDiscoveryReads +=
                  1;
              },
            ),
          );

        await facade.refresh();

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );

        expect(
          knownDiscoveryReads,
        ).toBe(
          1,
        );

        expect(
          facade
            .model()
            ?.explorationCoverage
            ?.exploredSectorCount,
        ).toBe(
          0,
        );
      },
    );
  },
);
