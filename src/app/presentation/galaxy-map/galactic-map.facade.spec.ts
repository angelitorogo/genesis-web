import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
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
  ExternalGalaxyMorphologyHint,
} from '../../domain/observation/galaxy/external-galaxy-preliminary-information';

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
    ): GenesisLocalRepositories {

      return {
        universeRepository: {
          async createIfAbsent() {
            throw new Error(
              '10.1 must not create universes.',
            );
          },

          async exists() {
            throw new Error(
              '10.1 uses the persisted universe list.',
            );
          },

          async getAll() {
            return universes;
          },

          async delete() {
            throw new Error(
              '10.1 must not delete universes.',
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
              '10.1 must not mutate navigation.',
            );
          },
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            throw new Error(
              '10.1 must not read PD.',
            );
          },

          async setGlobalDiscoveryPoints() {
            throw new Error(
              '10.1 must not write PD.',
            );
          },

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '10.1 must not read galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {
            throw new Error(
              '10.1 must not write galaxy PD.',
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
              '10.1 must not mutate DiscoveryState.',
            );
          },

          async getKnownDiscoveries() {
            throw new Error(
              '10.1 must not materialize marker collections.',
            );
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '10.1 must not materialize sector discoveries.',
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
      'should prepare the discovered active galaxy with detailed renderer-independent visual structure',
      async () => {
        const facade =
          configure(
            repositories(),
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
          model?.designationCode,
        ).toMatch(
          /^GEN-V1-G0-/,
        );
      },
    );

    it(
      'should keep a merely detected galaxy on the safe preliminary projection without detailed visual Ground Truth',
      async () => {
        const facade =
          configure(
            repositories(
              [
                generationKey,
              ],
              1n,
              DiscoveryState.DETECTED,
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
      'should not read progression or discovery collections while preparing point 10.1',
      async () => {
        const facade =
          configure(
            repositories(),
          );

        await facade.refresh();

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );
      },
    );
  },
);
