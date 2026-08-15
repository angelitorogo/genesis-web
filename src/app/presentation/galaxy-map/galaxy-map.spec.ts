import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  vi,
} from 'vitest';

import {
  KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
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
  type GalacticMapCameraState,
} from './galactic-map-camera-controller';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';

import {
  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,
  type GalacticMapSceneRuntime,
} from './galactic-map-scene';

import {
  GalacticMapPage,
} from './galaxy-map';

describe(
  'GalacticMapPage',
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
            throw new Error(
              '10.6 page must not read PD.',
            );
          },

          async setGlobalDiscoveryPoints() {},

          async getGalaxyDiscoveryPoints() {
            throw new Error(
              '10.6 page must not read galaxy PD.',
            );
          },

          async setGalaxyDiscoveryPoints() {},
        },

        discoveryRepository: {
          async getState() {
            return DiscoveryState
              .DISCOVERED;
          },

          async setState() {},

          async getKnownDiscoveries() {
            return [
              new KnownDiscovery(
                generationKey,
                new SectorLocator(
                  0n,
                  0n,
                ),
                DiscoveryState.DETECTED,
              ),
              new KnownDiscovery(
                generationKey,
                new SystemLocator(
                  0n,
                  0n,
                  0n,
                ),
                DiscoveryState.DETECTED,
              ),
            ];
          },

          async getKnownDiscoveriesInSector() {
            throw new Error(
              '10.6 page must not query or materialize sector content.',
            );
          },
        },
      };

    afterEach(
      () => {
        vi.restoreAllMocks();
      },
    );

    beforeEach(
      async () => {
        let cameraState:
          GalacticMapCameraState =
          Object.freeze({
            distance:
              3.5,
            azimuthRadians:
              0,
            polarRadians:
              0.9,
            targetX:
              0,
            targetY:
              0,
            targetZ:
              0,
            rotationEnabled:
              true,
          });

        let listener:
          ((state: GalacticMapCameraState) => void) | null =
          null;

        let galaxySpinRadians =
          0;

        let galaxySpinListener:
          ((radians: number) => void) | null =
          null;

        const runtime:
          GalacticMapSceneRuntime =
          {
            resize() {},

            render() {
              return {
                particleCount:
                  12_000,
              };
            },

            cameraState() {
              return cameraState;
            },

            galaxySpinRadians() {
              return galaxySpinRadians;
            },

            setCameraStateListener(
              value,
            ) {
              listener =
                value;
            },

            setGalaxySpinStateListener(
              value,
            ) {
              galaxySpinListener =
                value;

              galaxySpinListener?.(
                galaxySpinRadians,
              );
            },

            setRotationEnabled(
              enabled,
            ) {
              cameraState =
                Object.freeze({
                  ...cameraState,
                  rotationEnabled:
                    enabled,
                });

              listener?.(
                cameraState,
              );
            },

            setLayerVisibility() {},

            resetView() {
              galaxySpinRadians =
                0;

              galaxySpinListener?.(
                galaxySpinRadians,
              );
            },

            selectDiscoveryMarkerAt() {
              return null;
            },

            selectAt() {
              return null;
            },

            clearSelection() {},

            dispose() {},
          };

        await TestBed
          .configureTestingModule({
            imports: [
              GalacticMapPage,
            ],

            providers: [
              provideRouter(
                [],
              ),

              {
                provide:
                  GENESIS_LOCAL_REPOSITORIES,

                useValue:
                  repositories,
              },

              {
                provide:
                  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,

                useValue: () =>
                  runtime,
              },
            ],
          })
          .compileComponents();
      },
    );

    async function renderedPage():
      Promise<HTMLElement> {

      const fixture =
        TestBed.createComponent(
          GalacticMapPage,
        );

      fixture.detectChanges();

      await fixture
        .componentInstance
        .facade
        .refresh();

      fixture.detectChanges();

      return fixture
        .nativeElement as
          HTMLElement;
    }

    it(
      'should expose the point-10.6 interactive map with persisted marker navigation and thematic layers',
      async () => {
        const element =
          await renderedPage();

        expect(
          element.querySelector(
            '[data-testid="galaxy-map-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-scene"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-canvas"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-controls"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-rotation-toggle"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-reset-view"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-exploration-coverage"]',
          ),
        ).toBeTruthy();

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-explored-sector-count',
            ),
        ).toBe(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-explored-sector-count"]',
          )?.textContent,
        ).toContain(
          '1',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-markers"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-discovery-marker-count"]',
          )?.textContent,
        ).toContain(
          '1',
        );


        expect(
          element.querySelector(
            '[data-testid="galactic-map-layers"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid^="galactic-map-layer-"]',
          ),
        ).toHaveLength(
          6,
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-active-galaxy"]',
          )?.textContent,
        ).toContain(
          'Galaxia 0',
        );
      },
    );

    it(
      'should expose the exact galactic type once the active galaxy is discovered',
      async () => {
        const element =
          await renderedPage();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-knowledge-state"]',
          )?.textContent,
        ).toContain(
          'Descubierta',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-galaxy-type"]',
          )?.textContent,
        ).toContain(
          'Elíptica',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-context"]',
          )?.textContent,
        ).toContain(
          'TIPO GALÁCTICO',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-morphology-hint"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-designation"]',
          )?.textContent,
        ).toContain(
          'GEN-V1-G0-',
        );
      },
    );

    it(
      'should map every canonical GalaxyType to its Spanish UI label',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapPage,
          );

        const component =
          fixture.componentInstance;

        expect(
          component.galaxyTypeLabel(
            GalaxyType.BARRED_SPIRAL,
          ),
        ).toBe(
          'Espiral barrada',
        );

        expect(
          component.galaxyTypeLabel(
            GalaxyType.SPIRAL,
          ),
        ).toBe(
          'Espiral',
        );

        expect(
          component.galaxyTypeLabel(
            GalaxyType.ELLIPTICAL,
          ),
        ).toBe(
          'Elíptica',
        );

        expect(
          component.galaxyTypeLabel(
            GalaxyType.DWARF,
          ),
        ).toBe(
          'Enana',
        );

        expect(
          component.galaxyTypeLabel(
            GalaxyType.IRREGULAR,
          ),
        ).toBe(
          'Irregular',
        );
      },
    );

    it(
      'should preserve the consolidated presentation classes for the empty state',
      async () => {
        vi
          .spyOn(
            repositories
              .universeRepository,
            'getAll',
          )
          .mockResolvedValue(
            [],
          );

        const element =
          await renderedPage();

        const header =
          element.querySelector(
            '.galactic-map__header',
          );

        const homeLink =
          element.querySelector(
            '[data-testid="galaxy-map-home-link"]',
          );

        const emptyState =
          element.querySelector(
            '[data-testid="galaxy-map-empty"]',
          );

        const settingsLink =
          element.querySelector(
            '[data-testid="galaxy-map-settings-link"]',
          );

        expect(
          header?.classList.contains(
            'galactic-map__row',
          ),
        ).toBe(
          true,
        );

        expect(
          homeLink?.classList.contains(
            'galactic-map__link',
          ),
        ).toBe(
          true,
        );

        expect(
          emptyState?.classList.contains(
            'galactic-map__panel',
          ),
        ).toBe(
          true,
        );

        expect(
          emptyState?.classList.contains(
            'galactic-map__state',
          ),
        ).toBe(
          true,
        );

        expect(
          emptyState?.textContent,
        ).toContain(
          'SIN UNIVERSO ACTIVO',
        );

        expect(
          settingsLink?.classList.contains(
            'galactic-map__link',
          ),
        ).toBe(
          true,
        );

        expect(
          settingsLink?.getAttribute(
            'href',
          ),
        ).toBe(
          '/settings',
        );
      },
    );

    it(
      'should expose point-10.6 marker-navigation capability while keeping 10.7-plus capabilities absent before marker selection',
      async () => {
        const element =
          await renderedPage();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-controls"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-exploration-coverage"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-markers"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-selection"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-layers"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-marker-link"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-relative-position"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="galactic-map-point-boundary"]',
          )?.textContent,
        ).toContain(
          '10.7–10.9',
        );

        expect(
          element.querySelector(
            '[data-testid="galactic-map-point-boundary"]',
          )?.textContent,
        ).toContain(
          'SPECULATIVE_SIMPLIFIED',
        );
      },
    );

    it(
      'should expose the existing real route back to Home',
      async () => {
        const element =
          await renderedPage();

        const link =
          element.querySelector(
            '[data-testid="galaxy-map-home-link"]',
          ) as HTMLAnchorElement | null;

        expect(
          link?.getAttribute(
            'href',
          ),
        ).toBe(
          '/',
        );
      },
    );
  },
);
