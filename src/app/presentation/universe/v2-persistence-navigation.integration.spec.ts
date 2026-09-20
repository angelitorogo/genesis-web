import Dexie from 'dexie';
import { TestBed } from '@angular/core/testing';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GalaxyLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository } from '../../data/local/repository/dexie-discovery.repository';
import { DexieUniverseNavigationRepository } from '../../data/local/repository/dexie-universe-navigation.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExplorationSectorScanEngine } from '../../simulation/exploration/exploration-sector-scan-engine';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { HomeFacade } from '../home/home.facade';
import { DexieExplorationSectorProgressRuntime } from '../runtime/exploration-sector-progress.runtime';
import { GENESIS_LOCAL_REPOSITORIES, type GenesisLocalRepositories } from '../runtime/genesis-local-repositories';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';
import { ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY, activeUniverseRef } from './active-universe-selection';
import { UniverseBootstrapService } from './universe-bootstrap.service';
import { UniverseSeedFacade } from './universe-seed.facade';

const seed = UniverseSeed.parse('1433-0000-0000-0000-0000-0000-0000-0001');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function makeRepositories(database: GenesisIndexedDb): GenesisLocalRepositories {
  return {
    universeRepository: new DexieUniverseRepository(database),
    navigationRepository: new DexieUniverseNavigationRepository(database),
    pointsRepository: new DexieDiscoveryPointsRepository(database),
    discoveryRepository: new DexieDiscoveryRepository(database, {
      resolveTargetSeedNormalized(key, locator) {
        return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
      },
    }),
  };
}

describe('14.3 — recarga real de V2 frente a una partida V1 homónima', () => {
  it('recupera selección, PD, progreso, navegación e identidad sin regenerar ni intercambiar versiones', async () => {
    const name = 'genesis-14-3-persistence-navigation';
    const deps = { indexedDB, IDBKeyRange };
    const database = new GenesisIndexedDb(name, deps);
    let reopened: GenesisIndexedDb | null = null;
    try {
      let repositories = makeRepositories(database);
      TestBed.configureTestingModule({
        providers: [{ provide: GENESIS_LOCAL_REPOSITORIES, useValue: repositories }],
      });
      const bootstrap = TestBed.inject(UniverseBootstrapService);
      expect((await bootstrap.ensureInitialized(v1)).created).toBe(true);
      expect((await bootstrap.ensureInitialized(v2)).created).toBe(true);
      await repositories.pointsRepository.setGlobalDiscoveryPoints(v1, 77n);
      const resolved = ExplorationSectorResultEngine.resolve(
        ExplorationSectorScanEngine.scan(
          ExplorationSectorScanEngine.prepareSector(v2, 0n, 0, 0),
        ),
      );
      const progress = new DexieExplorationSectorProgressRuntime(
        database, repositories.pointsRepository, repositories.discoveryRepository,
      );
      const first = await progress.commitResolvedResult(resolved);
      expect(first.awardedDiscoveryPoints).toBeGreaterThan(0);
      await repositories.navigationRepository.setNavigation(v2, {
        activeGalaxyIndex: 0n, recentGalaxyIndices: [3n],
      });
      const selected = TestBed.inject(UniverseSeedFacade);
      selected.activatePersistedUniverse(v2);
      selected.markUniverseActivated();
      expect(localStorage.getItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY)).toBe(activeUniverseRef(v2));
      const reference = scientificRouteUniverseRef(seed.serialize(), 2);
      expect(reference).not.toBe(scientificRouteUniverseRef(seed.serialize(), 1));

      // A browser reload creates a new Angular injector and reopens IndexedDB.
      database.closeDatabase();
      TestBed.resetTestingModule();
      reopened = new GenesisIndexedDb(name, deps);
      repositories = makeRepositories(reopened);
      TestBed.configureTestingModule({
        providers: [{ provide: GENESIS_LOCAL_REPOSITORIES, useValue: repositories }],
      });
      const freshSelection = TestBed.inject(UniverseSeedFacade);
      expect(freshSelection.generatorVersion()).toBe(GeneratorVersion.V1);
      const dashboard = TestBed.inject(HomeFacade);
      await dashboard.refresh();
      expect(dashboard.state().kind).toBe('content');
      expect(freshSelection.activeGenerationKey().equals(v2)).toBe(true);
      expect(dashboard.dashboard()?.discoveryPoints).toBe(BigInt(first.awardedDiscoveryPoints));
      expect(dashboard.dashboard()?.generationKey.generatorVersionCode).toBe(2);
      expect((await repositories.navigationRepository.getNavigation(v2)).recentGalaxyIndices).toEqual([3n]);
      expect(await repositories.discoveryRepository.getState(v2, new GalaxyLocator(0n)))
        .toBe(DiscoveryState.DISCOVERED);
      expect(await repositories.discoveryRepository.getState(v2, resolved.scanResult.selection.sectorLocator))
        .toBe(DiscoveryState.DETECTED);
      expect(await repositories.pointsRepository.getGlobalDiscoveryPoints(v1)).toBe(77n);
      expect(await repositories.discoveryRepository.getState(v1, resolved.scanResult.selection.sectorLocator))
        .toBe(DiscoveryState.UNKNOWN);
      expect(freshSelection.resolvePersistedUniverse(await repositories.universeRepository.getAll()))
        .toBeTruthy();
      expect(activeUniverseRef(freshSelection.activeGenerationKey())).toBe(reference);

      // A retry after reload is idempotent and does not award PD a second time.
      const repeated = await new DexieExplorationSectorProgressRuntime(
        reopened, repositories.pointsRepository, repositories.discoveryRepository,
      ).commitResolvedResult(resolved);
      expect(repeated.awardedDiscoveryPoints).toBe(0);
      expect(await repositories.pointsRepository.getGlobalDiscoveryPoints(v2))
        .toBe(BigInt(first.awardedDiscoveryPoints));
    } finally {
      database.closeDatabase();
      reopened?.closeDatabase();
      TestBed.resetTestingModule();
      try { localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY); } catch { /* unavailable */ }
      await new Dexie(name, deps).delete();
    }
  });
});
