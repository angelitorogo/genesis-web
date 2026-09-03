import {
  TestBed,
} from '@angular/core/testing';

import {
  ActivatedRoute,
  provideRouter,
} from '@angular/router';

import {
  DiscoveryState,
  type DiscoveryStateValue,
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
  GalaxyType,
} from '../../domain/universe/galaxy-type';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalaxyScientificStateTransitionEngine,
} from '../../simulation/exploration/galaxy-scientific-state-transition-engine';

import {
  GALAXY_FOCUS_RUNTIME,
  type GalaxyFocusRuntime,
} from '../runtime/galaxy-focus.runtime';

import {
  GALAXY_SCIENTIFIC_KNOWLEDGE_RUNTIME,
  type GalaxyScientificKnowledgeRuntime,
} from '../runtime/galaxy-scientific-knowledge.runtime';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';

import {
  GalaxyDetailFacade,
} from './galaxy-detail.facade';

import {
  GalaxyDetailPage,
} from './galaxy-detail';

describe(
  'GalaxyDetailPage',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          DEFAULT_UNIVERSE_SEED,
        ),
        GeneratorVersion.V1,
      );

    const defaultStates =
      new Map<
        bigint,
        DiscoveryStateValue
      >([
        [
          0n,
          DiscoveryState
            .DISCOVERED,
        ],
        [
          1n,
          DiscoveryState
            .DETECTED,
        ],
      ]);

    function galaxyDiscoveriesFromStates(
      states:
        ReadonlyMap<
          bigint,
          DiscoveryStateValue
        >,
    ): readonly KnownDiscovery[] {

      return [
        ...states,
      ]
        .filter(
          (
            [
              ,
              state,
            ],
          ) =>
            DiscoveryState
              .isKnown(
                state,
              ),
        )
        .map(
          (
            [
              galaxyIndex,
              state,
            ],
          ) =>
            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                galaxyIndex,
              ),
              state,
            ),
        );
    }

    function repositories(
      states:
        ReadonlyMap<
          bigint,
          DiscoveryStateValue
        > =
          defaultStates,

      activeGalaxyIndex =
        0n,

      universes:
        readonly UniverseGenerationKey[] =
          [
            generationKey,
          ],

      knownDiscoveries:
        readonly KnownDiscovery[] =
          galaxyDiscoveriesFromStates(
            states,
          ),
    ): GenesisLocalRepositories {

      return {
        universeRepository: {
          async createIfAbsent() {
            return false;
          },

          async exists() {
            return true;
          },

          async getAll() {
            return universes;
          },

          async delete() {
            return false;
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
              'GalaxyDetailFacade must not write navigation directly.',
            );
          },
        },

        pointsRepository: {
          async getGlobalDiscoveryPoints() {
            return 1000n;
          },

          async setGlobalDiscoveryPoints() {
            throw new Error(
              '11.5 must not write global PD.',
            );
          },

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '11.5 structural progress must not be conflated with per-galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {
            throw new Error(
              '11.5 must not write per-galaxy PD.',
            );
          },
        },

        discoveryRepository: {
          async getState(
            _generationKey,
            locator,
          ) {
            if (
              !(
                locator instanceof
                GalaxyLocator
              )
            ) {
              throw new Error(
                'Galaxy detail must query exactly one GalaxyLocator before loading statistics.',
              );
            }

            return (
              states.get(
                locator
                  .galaxyIndex,
              ) ??
              DiscoveryState
                .UNKNOWN
            );
          },

          async setState() {
            throw new Error(
              'GalaxyDetailFacade must not mutate DiscoveryState directly.',
            );
          },

          async getKnownDiscoveries() {
            return knownDiscoveries;
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '11.5 must not materialize sector content.',
            );
          },
        },
      };
    }

    function configure(
      galaxyIndex:
        string,

      repositoryBundle:
        GenesisLocalRepositories =
          repositories(),

      focusRuntime:
        GalaxyFocusRuntime =
          {
            async changeFocus() {
              throw new Error(
                '11.5 focus mutation was not expected in this test.',
              );
            },

            async returnToRecentGalaxy() {
              throw new Error(
                '11.6 return path was not expected in this test.',
              );
            },
          },

      scientificRuntime:
        GalaxyScientificKnowledgeRuntime =
          {
            async commit() {
              throw new Error(
                '26.1 scientific milestone mutation was not expected in this test.',
              );
            },
          },
    ): void {

      TestBed.configureTestingModule({
        imports: [
          GalaxyDetailPage,
        ],

        providers: [
          provideRouter(
            [],
          ),

          {
            provide:
              ActivatedRoute,

            useValue: {
              snapshot: {
                paramMap: {
                  get(
                    key:
                      string,
                  ) {
                    return key ===
                      'galaxyIndex'
                      ? galaxyIndex
                      : null;
                  },
                },
              },
            },
          },

          {
            provide:
              GENESIS_LOCAL_REPOSITORIES,

            useValue:
              repositoryBundle,
          },

          {
            provide:
              GALAXY_FOCUS_RUNTIME,

            useValue:
              focusRuntime,
          },

          {
            provide:
              GALAXY_SCIENTIFIC_KNOWLEDGE_RUNTIME,

            useValue:
              scientificRuntime,
          },
        ],
      });
    }

    it(
      'should load the default B5 origin galaxy with its bootstrap statistics and global PD affordability without changing focus',
      async () => {
        configure(
          '0',
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '0',
          );

        const model =
          facade.model();

        expect(
          model,
        ).not.toBeNull();

        expect(
          model
            ?.profile
            .knownName,
        ).toBe(
          'Elixisis',
        );

        expect(
          model
            ?.profile
            .galaxyType,
        ).toBe(
          GalaxyType
            .BARRED_SPIRAL,
        );

        expect(
          model
            ?.scientificProfile
            .physicalProperties,
        ).toBeNull();

        expect(
          model
            ?.globalDiscoveryPoints,
        ).toBe(
          1000n,
        );

        expect(
          model
            ?.statistics
            .progressUnits,
        ).toBe(
          2n,
        );

        expect(
          model
            ?.statistics
            .knownRecords,
        ).toBe(
          1n,
        );

        expect(
          model
            ?.statistics
            .internalKnownRecords,
        ).toBe(
          0n,
        );

        expect(
          model
            ?.explorationTelemetry
            .totalSectors,
        ).toBe(
          20_449n,
        );

        expect(
          model
            ?.explorationTelemetry
            .exploredPercentageBasisPoints,
        ).toBe(
          0n,
        );

        expect(
          model
            ?.explorationTelemetry
            .inventory
            .sectors,
        ).toBe(
          0n,
        );

        expect(
          model
            ?.isCurrentFocus,
        ).toBe(true);

        expect(
          model
            ?.isVisitable,
        ).toBe(false);

        expect(
          model
            ?.isOriginGalaxy,
        ).toBe(true);
      },
      15_000,
    );

    it(
      'should render the 26.1 V2 scientific hierarchy while keeping DISCOVERED physical values locked',
      async () => {
        configure(
          '0',
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '0',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-visual"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-science-layout"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-science-summary"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-knowledge-ladder"]',
          )?.textContent,
        ).toContain(
          'Requiere Catalogada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-name"]',
          )?.textContent,
        ).toContain(
          'Elixisis',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-index"]',
          )?.textContent,
        ).toContain(
          'Galaxia 0',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Descubierta',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-type"]',
          )?.textContent,
        ).toContain(
          'Espiral barrada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-morphology"]',
          )?.textContent,
        ).toContain(
          'Disco galáctico',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-scale"]',
          )?.textContent,
        ).toMatch(
          /Compacta|Media|Grande|Extendida/,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-population"]',
          )?.textContent,
        ).toMatch(
          /Baja|Moderada|Alta|Muy alta/,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nuclear"]',
          )?.textContent,
        ).toMatch(
          /Sin actividad nuclear clara|Candidata a núcleo activo|Candidata a actividad nuclear extrema/,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-scientific-lock"]',
          )?.textContent,
        ).toContain(
          'Catalogada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-action"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-prerequisite"]',
          )?.textContent,
        ).toContain(
          'DISCOVERED → VISITED',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-physical-properties"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-progress"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-total-sectors"]',
          )?.textContent,
        ).toContain(
          '20.449',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-explored-percentage"]',
          )?.textContent,
        ).toContain(
          '0,00 %',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-known-sectors"]',
          )?.textContent,
        ).toContain(
          '0',
        );

        for (
          const testId
          of [
            'galaxy-detail-known-star-clusters',
            'galaxy-detail-known-nebulae',
            'galaxy-detail-known-extreme-objects',
            'galaxy-detail-known-planets',
            'galaxy-detail-known-moons',
            'galaxy-detail-known-asteroids',
            'galaxy-detail-known-comets',
            'galaxy-detail-known-tno',
            'galaxy-detail-known-captured',
            'galaxy-detail-known-civilizations',
          ]
        ) {
          expect(
            element.querySelector(
              `[data-testid="${testId}"]`,
            ),
          ).toBeTruthy();
        }

        expect(
          element.querySelector(
            '.gd__distribution',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-progress"]',
          )?.textContent,
        ).not.toContain(
          'Las unidades son la suma estructural',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-badge"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-origin-badge"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-control"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-current"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          )?.textContent,
        ).toContain(
          'Establecer como foco de exploración',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-boundary"]',
          )?.textContent,
        ).toContain(
          '26.1',
        );
      },
      15_000,
    );

    it(
      'should derive statistics from every known locator in the requested galaxy only',
      async () => {
        const knownDiscoveries =
          [
            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                0n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),

            new KnownDiscovery(
              generationKey,
              new SectorLocator(
                0n,
                10n,
              ),
              DiscoveryState
                .DETECTED,
            ),

            new KnownDiscovery(
              generationKey,
              new GalacticObjectLocator(
                0n,
                10n,
                1n,
              ),
              DiscoveryState
                .VISITED,
            ),

            new KnownDiscovery(
              generationKey,
              new SystemLocator(
                0n,
                10n,
                2n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),

            new KnownDiscovery(
              generationKey,
              new BodyLocator(
                0n,
                10n,
                2n,
                4n,
              ),
              DiscoveryState
                .CATALOGUED,
            ),

            new KnownDiscovery(
              generationKey,
              new CivilizationLocator(
                0n,
                10n,
                2n,
                4n,
                1n,
              ),
              DiscoveryState
                .DISCOVERED,
            ),

            new KnownDiscovery(
              generationKey,
              new GalaxyLocator(
                1n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),

            new KnownDiscovery(
              generationKey,
              new SystemLocator(
                1n,
                20n,
                3n,
              ),
              DiscoveryState
                .CONFIRMED,
            ),
          ];

        configure(
          '0',
          repositories(
            defaultStates,
            0n,
            [
              generationKey,
            ],
            knownDiscoveries,
          ),
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '0',
          );

        const statistics =
          facade
            .model()
            ?.statistics;

        expect(
          statistics
            ?.progressUnits,
        ).toBe(
          17n,
        );

        expect(
          statistics
            ?.knownRecords,
        ).toBe(
          6n,
        );

        expect(
          statistics
            ?.targetCounts,
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
            ?.stateCounts,
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

        const telemetry =
          facade
            .model()
            ?.explorationTelemetry;

        expect(
          telemetry
            ?.totalSectors,
        ).toBe(
          20_449n,
        );

        expect(
          telemetry
            ?.inventory
            .sectors,
        ).toBe(
          1n,
        );
        expect(
          telemetry
            ?.inventory
            .systems,
        ).toBe(
          1n,
        );
        expect(
          telemetry
            ?.inventory
            .planets,
        ).toBe(
          1n,
        );
        expect(
          telemetry
            ?.inventory
            .civilizations,
        ).toBe(
          1n,
        );

        expect(
          (
            telemetry
              ?.inventory
              .starClusters ??
            0n
          ) +
          (
            telemetry
              ?.inventory
              .nebulae ??
            0n
          ) +
          (
            telemetry
              ?.inventory
              .extremeObjects ??
            0n
          ),
        ).toBe(
          1n,
        );
      },
      15_000,
    );

    it(
      'should render a DETECTED external galaxy without leaking proper name or exact GalaxyType',
      async () => {
        configure(
          '1',
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '1',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-name"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-index"]',
          )?.textContent,
        ).toContain(
          'Galaxia 1',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-name-restricted"]',
          )?.textContent,
        ).toContain(
          'Nombre propio aún no resuelto',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-type"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-type-restricted"]',
          )?.textContent,
        ).toContain(
          'Aún no resuelto',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Detectada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-morphology"]',
          )?.textContent,
        ).toContain(
          'Disco galáctico',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-total-sectors"]',
          )?.textContent,
        ).toContain(
          '—',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-explored-percentage"]',
          )?.textContent,
        ).toContain(
          '—',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-validate-detection-action"]',
          )?.textContent,
        ).toContain(
          'Validar detección · 0 PD',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-validate-detection-cost"]',
          )?.textContent,
        ).toContain(
          'DETECTED → DISCOVERED',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-prerequisite"]',
          )?.textContent,
        ).toContain(
          'no puede',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-scientific-lock"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-physical-properties"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-focus-semantics"]',
          )?.textContent,
        ).toContain(
          'no representa ni afirma un',
        );
      },
      15_000,
    );

    it(
      'should expose baseline scientific magnitudes at CATALOGUED while keeping confirmed detail locked',
      async () => {
        const states =
          new Map<
            bigint,
            DiscoveryStateValue
          >([
            [
              0n,
              DiscoveryState
                .CATALOGUED,
            ],
          ]);

        configure(
          '0',
          repositories(
            states,
          ),
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '0',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Catalogada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-physical-properties"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-knowledge-ladder"]',
          )?.textContent,
        ).toContain(
          'Catalogada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-knowledge-ladder"]',
          )?.textContent,
        ).toContain(
          'Requiere Confirmada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-age"]',
          )?.textContent,
        ).toContain(
          'Ga',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-diameter"]',
          )?.textContent,
        ).toContain(
          'años luz',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-total-mass"]',
          )?.textContent,
        ).toContain(
          'M☉',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-exact-population"]',
          )?.textContent,
        ).toContain(
          'estrellas',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-metallicity"]',
          )?.textContent,
        ).toContain(
          'Z☉',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-star-formation-rate"]',
          )?.textContent,
        ).toContain(
          'M☉/año',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-structure"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nucleus"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-confirmation-lock"]',
          )?.textContent,
        ).toContain(
          'Confirmada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-confirm-action"]',
          )?.textContent,
        ).toContain(
          'Confirmar galaxia',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-action"]',
          ),
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should add structural and nuclear scientific detail at CONFIRMED',
      async () => {
        const states =
          new Map<
            bigint,
            DiscoveryStateValue
          >([
            [
              0n,
              DiscoveryState
                .CONFIRMED,
            ],
          ]);

        configure(
          '0',
          repositories(
            states,
          ),
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '0',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Confirmada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-physical-properties"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-structure"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-confirmed-science"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-knowledge-ladder"]',
          )?.textContent,
        ).not.toContain(
          'Requiere Confirmada',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-central-concentration"]',
          )?.textContent?.trim(),
        ).not.toBe(
          '',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nucleus"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nucleus-state"]',
          )?.textContent,
        ).toContain(
          'Quiescente',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-smbh"]',
          )?.textContent,
        ).toContain(
          'M☉',
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-confirmation-lock"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-action"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-confirm-action"]',
          ),
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should spend 250 PD to catalogue and 500 PD to confirm a VISITED galaxy from the scientific card',
      async () => {
        const mutableStates =
          new Map<
            bigint,
            DiscoveryStateValue
          >([
            [
              0n,
              DiscoveryState
                .VISITED,
            ],
          ]);

        let globalDiscoveryPoints =
          1000n;

        const baseRepositories =
          repositories(
            mutableStates,
          );

        const repositoryBundle:
          GenesisLocalRepositories =
          {
            ...baseRepositories,

            pointsRepository: {
              async getGlobalDiscoveryPoints() {
                return globalDiscoveryPoints;
              },

              async setGlobalDiscoveryPoints(
                _generationKey,
                value,
              ) {
                globalDiscoveryPoints =
                  value;
              },

              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  '26.1 galaxy scientific milestones use global PD only.',
                );
              },

              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  '26.1 galaxy scientific milestones must not write per-galaxy PD.',
                );
              },
            },

            discoveryRepository: {
              async getState(
                _generationKey,
                locator,
              ) {
                if (
                  !(
                    locator instanceof
                    GalaxyLocator
                  )
                ) {
                  throw new Error(
                    '26.1 scientific transitions operate on GalaxyLocator only.',
                  );
                }

                return (
                  mutableStates.get(
                    locator
                      .galaxyIndex,
                  ) ??
                  DiscoveryState
                    .UNKNOWN
                );
              },

              async setState(
                _generationKey,
                locator,
                state,
              ) {
                if (
                  !(
                    locator instanceof
                    GalaxyLocator
                  )
                ) {
                  throw new Error(
                    '26.1 scientific transitions mutate GalaxyLocator only.',
                  );
                }

                mutableStates.set(
                  locator
                    .galaxyIndex,
                  state,
                );
              },

              async getKnownDiscoveries() {
                return galaxyDiscoveriesFromStates(
                  mutableStates,
                );
              },

              async getKnownDiscoveriesInSector() {
                throw new Error(
                  '26.1 scientific transitions must not materialize sector content.',
                );
              },
            },
          };

        const scientificRuntime:
          GalaxyScientificKnowledgeRuntime =
          {
            async commit(
              _generationKey,
              galaxyIndex,
              action,
            ) {
              const stateBefore =
                mutableStates.get(
                  galaxyIndex,
                ) ??
                DiscoveryState.UNKNOWN;

              const transition =
                GalaxyScientificStateTransitionEngine
                  .evaluate(
                    stateBefore,
                    action,
                  );

              if (
                globalDiscoveryPoints <
                transition.discoveryPointCost
              ) {
                throw new RangeError(
                  'PD insuficientes.',
                );
              }

              const globalDiscoveryPointsBefore =
                globalDiscoveryPoints;

              globalDiscoveryPoints -=
                transition.discoveryPointCost;

              mutableStates.set(
                galaxyIndex,
                transition.stateAfter,
              );

              return Object.freeze({
                ...transition,
                globalDiscoveryPointsBefore,
                globalDiscoveryPointsAfter:
                  globalDiscoveryPoints,
              });
            },
          };

        configure(
          '0',
          repositoryBundle,
          undefined,
          scientificRuntime,
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '0',
          );

        fixture.detectChanges();

        let element =
          fixture.nativeElement as
            HTMLElement;

        const catalogueAction =
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-action"]',
          ) as HTMLButtonElement | null;

        expect(
          catalogueAction
            ?.textContent,
        ).toContain(
          '250 PD',
        );

        expect(
          catalogueAction
            ?.disabled,
        ).toBe(false);

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-cost"]',
          )?.textContent,
        ).toContain(
          '1000 PD',
        );

        await fixture
          .componentInstance
          .facade
          .catalogueDisplayedGalaxy();

        fixture.detectChanges();

        element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          mutableStates.get(
            0n,
          ),
        ).toBe(
          DiscoveryState
            .CATALOGUED,
        );

        expect(
          globalDiscoveryPoints,
        ).toBe(
          750n,
        );

        expect(
          fixture
            .componentInstance
            .facade
            .model()
            ?.globalDiscoveryPoints,
        ).toBe(
          750n,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-physical-properties"]',
          ),
        ).toBeTruthy();

        const confirmAction =
          element.querySelector(
            '[data-testid="galaxy-detail-confirm-action"]',
          ) as HTMLButtonElement | null;

        expect(
          confirmAction
            ?.textContent,
        ).toContain(
          '500 PD',
        );

        expect(
          confirmAction
            ?.disabled,
        ).toBe(false);

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-scientific-action-success"]',
          )?.textContent,
        ).toContain(
          '250 PD',
        );

        await fixture
          .componentInstance
          .facade
          .confirmDisplayedGalaxy();

        fixture.detectChanges();

        element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          mutableStates.get(
            0n,
          ),
        ).toBe(
          DiscoveryState
            .CONFIRMED,
        );

        expect(
          globalDiscoveryPoints,
        ).toBe(
          250n,
        );

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-structure"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-nucleus"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-confirm-action"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-scientific-action-success"]',
          )?.textContent,
        ).toContain(
          '500 PD',
        );
      },
      15_000,
    );

    it(
      'should disable galaxy cataloguing when the global PD balance is below 250',
      async () => {
        const visitedStates =
          new Map<
            bigint,
            DiscoveryStateValue
          >([
            [
              0n,
              DiscoveryState.VISITED,
            ],
          ]);

        const baseRepositories =
          repositories(
            visitedStates,
          );

        const repositoryBundle:
          GenesisLocalRepositories =
          {
            ...baseRepositories,

            pointsRepository: {
              ...baseRepositories.pointsRepository,

              async getGlobalDiscoveryPoints() {
                return 249n;
              },
            },
          };

        configure(
          '0',
          repositoryBundle,
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '0',
          );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const action =
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-action"]',
          ) as HTMLButtonElement | null;

        expect(
          action
            ?.disabled,
        ).toBe(true);

        expect(
          element.querySelector(
            '[data-testid="galaxy-detail-catalogue-insufficient-pd"]',
          )?.textContent,
        ).toContain(
          '1 PD',
        );
      },
      15_000,
    );

    it(
      'should validate DETECTED to DISCOVERED before explicitly establishing focus and recording VISITED',
      async () => {
        const mutableStates =
          new Map<
            bigint,
            DiscoveryStateValue
          >([
            [
              0n,
              DiscoveryState
                .DISCOVERED,
            ],
            [
              1n,
              DiscoveryState
                .DETECTED,
            ],
          ]);

        let activeGalaxyIndex =
          0n;

        let recentGalaxyIndices:
          readonly bigint[] =
          [];

        const repositoryBundle:
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
                return [
                  generationKey,
                ];
              },

              async delete() {
                return false;
              },
            },

            navigationRepository: {
              async getNavigation() {
                return {
                  activeGalaxyIndex,
                  recentGalaxyIndices,
                };
              },

              async setNavigation(
                _generationKey,
                navigation,
              ) {
                activeGalaxyIndex =
                  navigation
                    .activeGalaxyIndex;

                recentGalaxyIndices =
                  [
                    ...navigation
                      .recentGalaxyIndices,
                  ];
              },
            },

            pointsRepository: {
              async getGlobalDiscoveryPoints() {
                return 1000n;
              },

              async setGlobalDiscoveryPoints() {
                throw new Error(
                  '11.5 must not write global PD.',
                );
              },

              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  '11.5 must not read per-galaxy PD.',
                );
              },

              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  '11.5 must not write per-galaxy PD.',
                );
              },
            },

            discoveryRepository: {
              async getState(
                _generationKey,
                locator,
              ) {
                if (
                  !(
                    locator instanceof
                    GalaxyLocator
                  )
                ) {
                  throw new Error(
                    '11.5 focus tests query GalaxyLocator state only.',
                  );
                }

                return (
                  mutableStates.get(
                    locator
                      .galaxyIndex,
                  ) ??
                  DiscoveryState
                    .UNKNOWN
                );
              },

              async setState(
                _generationKey,
                locator,
                state,
              ) {
                if (
                  !(
                    locator instanceof
                    GalaxyLocator
                  )
                ) {
                  throw new Error(
                    '11.5 focus tests mutate GalaxyLocator state only.',
                  );
                }

                mutableStates.set(
                  locator
                    .galaxyIndex,
                  state,
                );
              },

              async getKnownDiscoveries() {
                return galaxyDiscoveriesFromStates(
                  mutableStates,
                );
              },

              async getKnownDiscoveriesInSector() {
                throw new Error(
                  '11.5 must not materialize sector content.',
                );
              },
            },
          };

        const scientificRuntime:
          GalaxyScientificKnowledgeRuntime =
          {
            async commit(
              _generationKey,
              galaxyIndex,
              action,
            ) {
              const stateBefore =
                mutableStates.get(
                  galaxyIndex,
                ) ??
                DiscoveryState.UNKNOWN;

              const transition =
                GalaxyScientificStateTransitionEngine
                  .evaluate(
                    stateBefore,
                    action,
                  );

              const globalDiscoveryPointsBefore =
                1000n;

              mutableStates.set(
                galaxyIndex,
                transition.stateAfter,
              );

              return Object.freeze({
                ...transition,
                globalDiscoveryPointsBefore,
                globalDiscoveryPointsAfter:
                  globalDiscoveryPointsBefore,
              });
            },
          };

        const focusRuntime:
          GalaxyFocusRuntime =
          {
            async changeFocus(
              _generationKey,
              targetGalaxyIndex,
            ) {
              const targetStateBefore =
                mutableStates.get(
                  targetGalaxyIndex,
                ) ??
                DiscoveryState
                  .UNKNOWN;

              expect(
                targetStateBefore,
              ).toBe(
                DiscoveryState.DISCOVERED,
              );

              mutableStates.set(
                targetGalaxyIndex,
                DiscoveryState
                  .VISITED,
              );

              const previousFocusGalaxyIndex =
                activeGalaxyIndex;

              activeGalaxyIndex =
                targetGalaxyIndex;

              recentGalaxyIndices =
                [
                  previousFocusGalaxyIndex,
                ];

              return Object.freeze({
                previousFocusGalaxyIndex,
                activeGalaxyIndex:
                  targetGalaxyIndex,
                targetStateBefore,
                targetStateAfter:
                  DiscoveryState
                    .VISITED,
                didPromoteTargetToVisited:
                  true,
                recentGalaxyIndices,
              });
            },

            async returnToRecentGalaxy() {
              throw new Error(
                '11.6 return path was not expected in the 11.5 focus test.',
              );
            },
          };

        configure(
          '1',
          repositoryBundle,
          focusRuntime,
          scientificRuntime,
        );

        await TestBed
          .compileComponents();

        const fixture =
          TestBed.createComponent(
            GalaxyDetailPage,
          );

        fixture.detectChanges();

        await fixture
          .componentInstance
          .facade
          .load(
            '1',
          );

        fixture.detectChanges();

        const before =
          fixture.nativeElement as
            HTMLElement;

        expect(
          before.querySelector(
            '[data-testid="galaxy-detail-name-restricted"]',
          ),
        ).toBeTruthy();

        expect(
          before.querySelector(
            '[data-testid="galaxy-detail-validate-detection-action"]',
          ),
        ).toBeTruthy();

        expect(
          before.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          ),
        ).toBeNull();

        await fixture
          .componentInstance
          .facade
          .validateDisplayedGalaxyDetection();

        fixture.detectChanges();

        const validated =
          fixture.nativeElement as
            HTMLElement;

        expect(
          mutableStates.get(
            1n,
          ),
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          activeGalaxyIndex,
        ).toBe(
          0n,
        );

        expect(
          recentGalaxyIndices,
        ).toEqual([]);

        expect(
          validated.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Descubierta',
        );

        expect(
          validated.querySelector(
            '[data-testid="galaxy-detail-name"]',
          ),
        ).toBeTruthy();

        expect(
          validated.querySelector(
            '[data-testid="galaxy-detail-scientific-action-success"]',
          )?.textContent,
        ).toContain(
          'sin coste de PD',
        );

        expect(
          validated.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          )?.textContent,
        ).toContain(
          'Establecer como foco de exploración',
        );

        await fixture
          .componentInstance
          .facade
          .changeFocusToDisplayedGalaxy();

        fixture.detectChanges();

        const after =
          fixture.nativeElement as
            HTMLElement;

        expect(
          activeGalaxyIndex,
        ).toBe(
          1n,
        );

        expect(
          recentGalaxyIndices,
        ).toEqual([
          0n,
        ]);

        expect(
          mutableStates.get(
            1n,
          ),
        ).toBe(
          DiscoveryState
            .VISITED,
        );

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-state"]',
          )?.textContent,
        ).toContain(
          'Visitada',
        );

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-name"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-exact-type"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-focus-badge"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-map-link"]',
          ),
        ).toBeTruthy();

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-focus-success"]',
          )?.textContent,
        ).toContain(
          'Visitada',
        );

        expect(
          after.querySelector(
            '[data-testid="galaxy-detail-change-focus-action"]',
          ),
        ).toBeNull();
      },
      15_000,
    );

    it(
      'should expose not-found for an UNKNOWN URL target without enumerating hidden content',
      async () => {
        const baseRepositories =
          repositories();

        const repositoryBundle:
          GenesisLocalRepositories =
          {
            ...baseRepositories,

            discoveryRepository: {
              ...baseRepositories
                .discoveryRepository,

              async getKnownDiscoveries() {
                throw new Error(
                  'UNKNOWN targets must be rejected before statistics are enumerated.',
                );
              },
            },
          };

        configure(
          '99',
          repositoryBundle,
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '99',
          );

        expect(
          facade.state().kind,
        ).toBe(
          'not-found',
        );

        expect(
          facade.model(),
        ).toBeNull();
      },
    );

    it(
      'should expose Empty when no persisted universe exists',
      async () => {
        configure(
          '0',
          repositories(
            new Map<
              bigint,
              DiscoveryStateValue
            >(),
            0n,
            [],
            [],
          ),
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '0',
          );

        expect(
          facade.state().kind,
        ).toBe(
          'empty',
        );
      },
    );

    it(
      'should reject malformed or out-of-range galaxyIndex route values',
      async () => {
        configure(
          '0',
        );

        const facade =
          TestBed.inject(
            GalaxyDetailFacade,
          );

        await facade
          .load(
            '-1',
          );

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );

        await facade
          .load(
            (
              1n <<
              63n
            ).toString(
              10,
            ),
          );

        expect(
          facade.state().kind,
        ).toBe(
          'error',
        );
      },
    );
  },
);