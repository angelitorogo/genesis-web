import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationSectorProgressResult,
} from '../../domain/exploration/exploration-sector-progress-result';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

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
  EXPLORATION_SECTOR_PROGRESS_RUNTIME,
  type ExplorationSectorProgressRuntime,
} from '../runtime/exploration-sector-progress.runtime';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';

import {
  Exploration,
} from './exploration';

describe(
  'Exploration point 9.5',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    const repositories:
      GenesisLocalRepositories =
      {
        universeRepository: {
          async createIfAbsent() {
            return false;
          },

          async exists() {
            return true;
          },

          async getAll() {
            return [generationKey];
          },

          async delete() {
            return false;
          },
        },

        navigationRepository: {
          async getNavigation() {
            return {
              activeGalaxyIndex:
                0n,

              recentGalaxyIndices:
                [],
            };
          },

          async setNavigation() {},
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            return 0n;
          },

          async setGlobalDiscoveryPoints() {},

          async getGalaxyDiscoveryPoints() {
            return 0n;
          },

          async setGalaxyDiscoveryPoints() {},
        },

        discoveryRepository: {
          async getState() {
            return DiscoveryState.UNKNOWN;
          },

          async setState() {},

          async getKnownDiscoveries() {
            return [
              new KnownDiscovery(
                generationKey,
                new GalaxyLocator(0n),
                DiscoveryState.DISCOVERED,
              ),
            ];
          },

          async getKnownDiscoveriesInSector() {
            return [];
          },
        },
      };

    const runtime:
      ExplorationSectorProgressRuntime =
      {
        async commitResolvedResult(
          result,
        ) {
          const staticResult =
            result.targetLocator !==
            null;

          const award =
            !staticResult
              ? 2
              : result.resultKind ===
                ExplorationResultKind.SYSTEM
                ? 8
                : 14;

          return new ExplorationSectorProgressResult(
            award,
            0n,
            BigInt(award),
            2n,
            staticResult
              ? 4n
              : 3n,
            DiscoveryState.DETECTED,
            staticResult
              ? DiscoveryState.DETECTED
              : null,
          );
        },
      };

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              Exploration,
            ],

            providers: [
              provideRouter([]),
              {
                provide:
                  GENESIS_LOCAL_REPOSITORIES,

                useValue:
                  repositories,
              },
              {
                provide:
                  EXPLORATION_SECTOR_PROGRESS_RUNTIME,

                useValue:
                  runtime,
              },
            ],
          })
          .compileComponents();
      },
    );

    async function fixtureAndElement() {
      const fixture =
        TestBed.createComponent(
          Exploration,
        );

      fixture.detectChanges();

      await fixture
        .componentInstance
        .facade
        .refresh();

      fixture.detectChanges();

      return {
        fixture,
        element:
          fixture.nativeElement as
            HTMLElement,
      };
    }

    it(
      'should render the active exploration context without reward before scanning',
      async () => {
        const {
          element,
        } =
          await fixtureAndElement();

        expect(
          element.querySelector(
            '[data-testid="exploration-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-reward"]',
          ),
        ).toBeNull();
      },
    );

    it(
      'should render the resolved result and point-9.5 reward/progress without changing scientific classification',
      async () => {
        const {
          fixture,
          element,
        } =
          await fixtureAndElement();

        await fixture
          .componentInstance
          .facade
          .scanSector(
            '0',
            '0',
          );

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="exploration-result"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-reward"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="exploration-result-scientific-classification"]',
          )?.textContent,
        ).toContain(
          'Sin clasificar',
        );

        expect(
          element.querySelector(
            '[data-testid="exploration-sector-state"]',
          )?.textContent,
        ).toContain(
          'Detectada',
        );
      },
    );

    it(
      'should render transient progression as non-persisted event identity',
      async () => {
        const {
          fixture,
          element,
        } =
          await fixtureAndElement();

        await fixture
          .componentInstance
          .facade
          .scanSector(
            '86',
            '86',
          );

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="exploration-result-state"]',
          )?.textContent,
        ).toContain(
          'Evento no persistido',
        );

        expect(
          element.querySelector(
            '[data-testid="exploration-reward-points"]',
          )?.textContent,
        ).toContain(
          '+2 PD',
        );
      },
    );

    it(
      'should keep the point-9.5 boundary explicit in the real screen',
      async () => {
        const {
          element,
        } =
          await fixtureAndElement();

        expect(
          element.textContent,
        ).toContain(
          'Límite del punto 9.5',
        );

        expect(
          element.textContent,
        ).toContain(
          'Ground Truth oculto',
        );
      },
    );
  },
);
