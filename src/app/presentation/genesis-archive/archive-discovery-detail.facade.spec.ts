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
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

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
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  vi,
} from 'vitest';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';

import {
  ExplorationSectorResultEngine,
} from '../../simulation/exploration/exploration-sector-result-engine';

import {
  GalacticObjectScientificSubjectResolver,
} from '../../simulation/galactic-object/galactic-object-scientific-subject-resolver';

import {
  SupernovaRemnantGenerator,
} from '../../simulation/galactic-object/supernova-remnant-generator';

import {
  GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME,
} from '../runtime/galactic-object-scientific-action.runtime';

import {
  DEFAULT_UNIVERSE_SEED,
} from '../universe/universe-seed.facade';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveScientificInstrumentOption,
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

        /** Provide read-only scientific prerequisites for one real archive route. */
        readonly scientificActionsEnabled?:
          boolean;
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
              if (options.scientificActionsEnabled) return 0n;
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
              if (options.scientificActionsEnabled) return [];
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
      'should resolve one persisted SystemLocator into the point-16.7 state-safe Archive system card',
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

        expect(
          model?.galacticObjectCard,
        ).toBeNull();

        expect(
          model?.stellarSystemCard,
        ).not.toBeNull();

        expect(
          model?.stellarSystemCard?.knowledgeLevel,
        ).toBe(
          'IDENTIFIED',
        );
      },
    );

    it(
      'should open the default V2 active galactic-centre fiche and offer its EXTREME_OBJECT survey without a V1 mismatch',
      async () => {
        const v2 =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              DEFAULT_UNIVERSE_SEED,
            ),
            GeneratorVersion.V2,
          );
        const {
          facade,
        } =
          configure({
            universes: [
              v2,
            ],
            discoveryState:
              DiscoveryState.DETECTED,
            scientificActionsEnabled:
              true,
          });

        await facade.load({
          locatorKind:
            ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            '0',
          universeSeed:
            v2.universeSeed.serialize(),
          generatorVersionCode:
            '2',
        });

        expect(
          facade.state().kind,
        ).toBe(
          'content',
        );
        expect(
          facade.model()?.resultKind,
        ).toBe(
          ExplorationResultKind.EXTREME_OBJECT,
        );
        expect(
          facade.model()?.galacticObjectCard?.render.kind,
        ).toBe(
          'AGN_NUCLEUS',
        );
        expect(
          facade.model()?.scientificAction?.actionType,
        ).toBe(
          GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
        );
      },
    );

    it(
      'should expose both post-discovery V2 nucleus stages and finish without duplicating point 28.1',
      async () => {
        const v2 =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              DEFAULT_UNIVERSE_SEED,
            ),
            GeneratorVersion.V2,
          );
        const params = {
          locatorKind:
            ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            '0',
          universeSeed:
            v2.universeSeed.serialize(),
          generatorVersionCode:
            '2',
        } as const;

        const discovered = configure({
          universes: [v2],
          discoveryState: DiscoveryState.DISCOVERED,
          scientificActionsEnabled: true,
        }).facade;
        await discovered.load(params);
        expect(discovered.model()?.scientificAction?.actionType).toBe(
          GalacticObjectScientificActionType.ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION,
        );
        expect(discovered.model()?.scientificAction?.targetDiscoveryStateLabel)
          .toBe('Catalogado');

        TestBed.resetTestingModule();

        const catalogued = configure({
          universes: [v2],
          discoveryState: DiscoveryState.CATALOGUED,
          scientificActionsEnabled: true,
        }).facade;
        await catalogued.load(params);
        expect(catalogued.model()?.scientificAction?.actionType).toBe(
          GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
        );
        expect(catalogued.model()?.scientificAction?.targetDiscoveryStateLabel)
          .toBe('Confirmado');

        TestBed.resetTestingModule();

        const confirmed = configure({
          universes: [v2],
          discoveryState: DiscoveryState.CONFIRMED,
          scientificActionsEnabled: true,
        }).facade;
        await confirmed.load(params);
        expect(confirmed.model()?.scientificAction).toBeNull();
        expect(confirmed.model()?.galacticObjectCard?.nextScientificStep)
          .toBe('Confirmar la galaxia y observar el disco de acreción desde su ficha');
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

        const locator =
          findPersistentSupernovaRemnantLocator(
            generationKey,
          );

        const sectorKey =
          locator.sectorKey;

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
            locator
              .galacticObjectIndex
              .toString(
                10,
              ),
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
          locator,
        ]);

        const model =
          facade.model();

        expect(
          model,
        ).not.toBeNull();

        expect(
          model?.resultKind,
        ).toBe(
          ExplorationResultKind.EXTREME_OBJECT,
        );

        expect(
          model?.familyLabel,
        ).toBe(
          'Objeto extremo',
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

        expect(
          model?.galacticObjectCard,
        ).not.toBeNull();

        expect(
          model?.stellarSystemCard,
        ).toBeNull();

        expect(
          model?.galacticObjectCard?.knowledgeLevel,
        ).toBe(
          'CONFIRMED',
        );

        expect(
          model?.galacticObjectCard?.title,
        ).toBe(
          'Remanente de supernova',
        );
      },
    );

    it('27.10 V2 routes a genuine discovered IMBH from the persisted archive locator to its next action, without leaking facts', async () => {
      const key = new UniverseGenerationKey(UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2);
      const locator = new GalacticObjectLocator(0n, -73014444020n, 0n);
      const request = {
        locatorKind: ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
        galaxyIndex: '0', sectorKey: locator.sectorKey.toString(10),
        galacticObjectIndex: '0',
        universeSeed: key.universeSeed.serialize(), generatorVersionCode: '2',
      };

      // The route loads an already-persisted discovery; never inserts one.
      const discovered = configure({
        universes: [key], discoveryState: DiscoveryState.DISCOVERED,
        scientificActionsEnabled: true,
      });
      await discovered.facade.load(request);
      expect(discovered.facade.state().kind).toBe('content');
      // One persisted state read is sufficient; action derivation reuses it.
      expect(discovered.stateReads).toEqual([locator]);
      expect(discovered.facade.model()?.resultKind).toBe(ExplorationResultKind.EXTREME_OBJECT);
      expect(discovered.facade.model()?.galacticObjectCard?.scientificSubject).toBeNull();
      expect(discovered.facade.model()?.galacticObjectCard?.facts).toHaveLength(0);
      expect(discovered.facade.model()?.scientificAction?.actionType)
        .toBe(GalacticObjectScientificActionType.IMBH_COMPACT_CHARACTERIZATION);
      expect(discovered.facade.model()?.scientificAction?.minimumInstrumentLevelRank).toBe(3);
      // Tool unlocks depend on existing PD/instrument progression, never minted here.
      expect(discovered.facade.model()?.scientificAction?.canExecute).toBe(false);
    });

    it('27.10 V2 offers independent confirmation on a persisted catalogued IMBH, with actual model values', async () => {
      const key = new UniverseGenerationKey(UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2);
      const locator = new GalacticObjectLocator(0n, -73014444020n, 0n);
      const { facade } = configure({
        universes: [key], discoveryState: DiscoveryState.CATALOGUED,
        scientificActionsEnabled: true,
      });
      await facade.load({
        locatorKind: ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
        galaxyIndex: '0', sectorKey: locator.sectorKey.toString(10),
        galacticObjectIndex: '0', universeSeed: key.universeSeed.serialize(),
        generatorVersionCode: '2',
      });
      expect(facade.state().kind).toBe('content');
      expect(facade.model()?.galacticObjectCard?.title).toBe('Agujero negro de masa intermedia');
      expect(facade.model()?.galacticObjectCard?.facts.some(f => f.label === 'Masa (modelo)')).toBe(true);
      expect(facade.model()?.scientificAction?.actionType)
        .toBe(GalacticObjectScientificActionType.IMBH_INDEPENDENT_CONFIRMATION);
      expect(facade.model()?.scientificAction?.minimumInstrumentLevelRank).toBe(4);
      expect(facade.model()?.scientificAction?.instrumentOptions.map(i => i.instrumentType))
        .toEqual([ObservationInstrumentType.RADIO, ObservationInstrumentType.X_RAY]);
    });

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

    it(
      'should expose an executable DETECTED star-cluster survey with the unlocked optical level and reveal the physical subject after commit',
      async () => {
        const locator =
          (() => {
            for (
              let galacticObjectIndex = 0n;
              galacticObjectIndex < 4096n;
              galacticObjectIndex += 1n
            ) {
              const candidate =
                new GalacticObjectLocator(
                  0n,
                  0n,
                  galacticObjectIndex,
                );

              if (
                ExplorationSectorResultEngine
                  .resolveGalacticObjectKind(
                    generationKey,
                    candidate,
                  ) ===
                ExplorationResultKind.STAR_CLUSTER
              ) {
                return candidate;
              }
            }

            throw new Error(
              'Expected at least one deterministic STAR_CLUSTER locator in the V1 sample.',
            );
          })();

        let persistedState:
          DiscoveryStateValue =
          DiscoveryState.DETECTED;

        const commitAction =
          vi.fn(
            async (
              session:
                LeveledInstrumentObservationSession,

              actionType:
                GalacticObjectScientificActionType,
            ) => {
              expect(
                session.instrumentType,
              ).toBe(
                ObservationInstrumentType.OPTICAL,
              );

              expect(
                session.level.rank,
              ).toBe(
                1,
              );

              expect(
                actionType,
              ).toBe(
                GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY,
              );

              persistedState =
                DiscoveryState.DISCOVERED;

              return {
                actionResult: {
                  awardedDiscoveryPoints:
                    24,
                  newDiscoveryState:
                    DiscoveryState.DISCOVERED,
                },
                globalDiscoveryPointsBefore:
                  0n,
                globalDiscoveryPointsAfter:
                  24n,
              };
            },
          );

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
                  generationKey,
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
                return 0n;
              },

              async setGlobalDiscoveryPoints() {
                throw new Error(
                  'Facade must delegate scientific writes to the 12.7 runtime.',
                );
              },

              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected galaxy PD read.',
                );
              },

              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            discoveryRepository: {
              async getState() {
                return persistedState;
              },

              async setState() {
                throw new Error(
                  'Facade must delegate scientific writes to the 12.7 runtime.',
                );
              },

              async getKnownDiscoveries() {
                return [
                  new KnownDiscovery(
                    generationKey,
                    locator,
                    persistedState,
                  ),
                ];
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
            {
              provide:
                GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME,
              useValue: {
                commitAction,
              },
            },
          ],
        });

        const facade =
          TestBed.inject(
            ArchiveDiscoveryDetailFacade,
          );

        const request = {
          locatorKind:
            ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            locator
              .galacticObjectIndex
              .toString(),
          universeSeed:
            generationKey.universeSeed.serialize(),
          generatorVersionCode:
            '1',
        };

        await facade.load(
          request,
        );

        const detectedAction =
          facade.model()
            ?.scientificAction;

        expect(
          facade.model()?.resultKind,
        ).toBe(
          ExplorationResultKind.STAR_CLUSTER,
        );

        expect(
          detectedAction?.actionType,
        ).toBe(
          GalacticObjectScientificActionType.STAR_CLUSTER_SURVEY,
        );

        expect(
          detectedAction?.awardedDiscoveryPoints,
        ).toBe(
          24,
        );

        expect(
          detectedAction?.selectedInstrumentType,
        ).toBe(
          ObservationInstrumentType.OPTICAL,
        );

        expect(
          detectedAction?.canExecute,
        ).toBe(
          true,
        );

        expect(
          detectedAction?.pendingRequirements,
        ).toBeNull();

        expect(
          detectedAction?.instrumentOptions
            .find(
              (
                option:
                  ArchiveScientificInstrumentOption,
              ) =>
                option.instrumentType ===
                ObservationInstrumentType.INFRARED,
            )
            ?.isAvailable,
        ).toBe(
          false,
        );

        await facade
          .performScientificAction();

        expect(
          commitAction,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          facade.model()?.discoveryState,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect([
          'Cúmulo abierto',
          'Cúmulo globular',
        ]).toContain(
          facade.model()
            ?.galacticObjectCard
            ?.title,
        );

        expect(
          facade.actionFeedback(),
        ).toContain(
          '+24 PD',
        );
      },
    );

    it(
      'should expose the exact pending PD and named milestones for a blocked DISCOVERED nebula characterization',
      async () => {
        const locator =
          (() => {
            for (
              let galacticObjectIndex = 0n;
              galacticObjectIndex < 4096n;
              galacticObjectIndex += 1n
            ) {
              const candidate =
                new GalacticObjectLocator(
                  0n,
                  0n,
                  galacticObjectIndex,
                );

              if (
                ExplorationSectorResultEngine
                  .resolveGalacticObjectKind(
                    generationKey,
                    candidate,
                  ) ===
                  ExplorationResultKind.NEBULA &&
                GalacticObjectScientificSubjectResolver
                  .resolve(
                    generationKey,
                    candidate,
                    DiscoveryState.DISCOVERED,
                  ) ===
                  GalacticObjectScientificSubject.NEBULA
              ) {
                return candidate;
              }
            }

            throw new Error(
              'Expected at least one deterministic non-HII NEBULA locator in the V1 sample.',
            );
          })();

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
                  generationKey,
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
                return 602n;
              },
              async setGlobalDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected galaxy PD read.',
                );
              },
              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            discoveryRepository: {
              async getState() {
                return DiscoveryState.DISCOVERED;
              },
              async setState() {
                throw new Error(
                  'Unexpected write.',
                );
              },
              async getKnownDiscoveries() {
                return [
                  new KnownDiscovery(
                    generationKey,
                    locator,
                    DiscoveryState.DISCOVERED,
                  ),
                ];
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
            ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
          galaxyIndex:
            '0',
          sectorKey:
            '0',
          galacticObjectIndex:
            locator
              .galacticObjectIndex
              .toString(),
          universeSeed:
            generationKey.universeSeed.serialize(),
          generatorVersionCode:
            '1',
        });

        const action =
          facade.model()
            ?.scientificAction;

        expect(
          action?.actionType,
        ).toBe(
          GalacticObjectScientificActionType.NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
        );

        expect(
          action?.canExecute,
        ).toBe(
          false,
        );

        expect(
          action?.pendingRequirements,
        ).toEqual({
          instrumentLabel:
            'Espectroscopía',
          minimumLevelRank:
            2,
          items: [
            '1898 PD adicionales',
            'Descubrir el primer sistema',
          ],
        });
      },
    );

    it(
      'should keep a DETECTED extreme-object survey visible but blocked until a compatible level-2 instrument is unlocked',
      async () => {
        const locator =
          findPersistentSupernovaRemnantLocator(
            generationKey,
          );

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
                  generationKey,
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
                return 0n;
              },
              async setGlobalDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
              async getGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected galaxy PD read.',
                );
              },
              async setGalaxyDiscoveryPoints() {
                throw new Error(
                  'Unexpected write.',
                );
              },
            },

            discoveryRepository: {
              async getState() {
                return DiscoveryState.DETECTED;
              },
              async setState() {
                throw new Error(
                  'Unexpected write.',
                );
              },
              async getKnownDiscoveries() {
                return [
                  new KnownDiscovery(
                    generationKey,
                    locator,
                    DiscoveryState.DETECTED,
                  ),
                ];
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
            ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
          galaxyIndex:
            '0',
          sectorKey:
            locator
              .sectorKey
              .toString(
                10,
              ),
          galacticObjectIndex:
            locator
              .galacticObjectIndex
              .toString(
                10,
              ),
          universeSeed:
            generationKey.universeSeed.serialize(),
          generatorVersionCode:
            '1',
        });

        const action =
          facade.model()
            ?.scientificAction;

        expect(
          action?.actionType,
        ).toBe(
          GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
        );

        expect(
          action?.minimumInstrumentLevelRank,
        ).toBe(
          2,
        );

        expect(
          action?.canExecute,
        ).toBe(
          false,
        );

        expect(
          action?.selectedInstrumentType,
        ).toBeNull();

        expect(
          action?.instrumentOptions.every(
            (
              option:
                ArchiveScientificInstrumentOption,
            ) =>
              !option.isAvailable,
          ),
        ).toBe(
          true,
        );

        expect(
          action?.pendingRequirements,
        ).toEqual({
          instrumentLabel:
            'Radio',
          minimumLevelRank:
            2,
          items: [
            '1000 PD adicionales',
            'Descubrir el primer sistema',
          ],
        });
      },
    );

    it.each([StellarSystemMultiplicity.SINGLE, StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
      '13.2 resolves one persisted V2 %s archive card without private seeds or fabricated parent disk',
      async multiplicity => {
        const v2 = new UniverseGenerationKey(generationKey.universeSeed.copy(), GeneratorVersion.V2);
        let selected: SystemLocator | null = null;
        for (let i = 0n; i < 128n; i++) {
          const address = new SystemLocator(0n, 0n, i);
          const physicalSeed = ProceduralTargetResolver.resolveTargetSeed(generationKey, address);
          if (StellarSystemMultiplicitySelector.select(generationKey, physicalSeed as Parameters<
            typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) {
            selected = address;
            break;
          }
        }
        if (selected === null) throw new Error('Missing V2 stellar fixture.');
        const { facade, stateReads } = configure({ universes: [generationKey, v2],
          discoveryState: DiscoveryState.CONFIRMED });
        await facade.load({ locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
          galaxyIndex: selected.galaxyIndex.toString(), sectorKey: selected.sectorKey.toString(),
          galacticObjectIndex: selected.galacticObjectIndex.toString(),
          universeSeed: v2.universeSeed.serialize(), generatorVersionCode: '2',
          includeStellarSystemScientificProgression: false });
        expect(facade.state().kind).toBe('content');
        const loaded = facade.model()!;
        expect(loaded.generatorVersionCode).toBe(2);
        expect(loaded.stellarSystemCard?.render.multiplicity).toBe(multiplicity);
        expect(loaded.stellarSystemCard?.systemFacts.some(fact => fact.label === 'SystemSeed')).toBe(false);
        expect(JSON.stringify(loaded.stellarSystemCard)).not.toContain('GEN-V1');
        if (multiplicity !== StellarSystemMultiplicity.SINGLE) {
          const formation = StellarMultihostFormation.generateOrNull(v2, selected)!;
          expect(loaded.stellarSystemCard?.systemFacts.find(fact => fact.label === 'Planetas generados')?.value)
            .toBe(String(formation.publicPlanets.length));
          expect(loaded.protoplanetaryDiskAnalysis).toBeNull();
        }
        expect(stateReads).toEqual([selected]);
      }, 120_000,
    );
  },
);

function findPersistentSupernovaRemnantLocator(
  generationKey:
    UniverseGenerationKey,
): GalacticObjectLocator {

  for (
    let index =
      1n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const candidate =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          generationKey,
          candidate,
        )
    ) {
      return candidate;
    }
  }

  throw new RangeError(
    'Missing deterministic persistent supernova-remnant test locator outside the reserved galactic nucleus object.',
  );
}
