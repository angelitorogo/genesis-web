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
import { DexieExplorationSectorProgressRuntime } from '../runtime/exploration-sector-progress.runtime';
import {
  GENESIS_LOCAL_REPOSITORIES,
  type GenesisLocalRepositories,
} from '../runtime/genesis-local-repositories';
import { UniverseBootstrapService } from './universe-bootstrap.service';

const seed = UniverseSeed.parse('1401-0000-0000-0000-0000-0000-0000-0001');
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const v1 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V1);

/** Stage 14.1: real repository + real generation, not mocked bootstrap replies. */
describe('14.1 — primera sesión V2 y exploración inicial', () => {
  it('crea V2 con el estado inicial correcto y registra una exploración sin duplicar PD ni alterar V1', async () => {
    const databaseName = 'genesis-14-1-first-session';
    const dependencies = { indexedDB, IDBKeyRange };
    const database = new GenesisIndexedDb(databaseName, dependencies);
    const universeRepository = new DexieUniverseRepository(database, () => 1401);
    const navigationRepository = new DexieUniverseNavigationRepository(database, () => 1401);
    const pointsRepository = new DexieDiscoveryPointsRepository(database, () => 1401);
    const discoveryRepository = new DexieDiscoveryRepository(database, {
      resolveTargetSeedNormalized(key, locator) {
        return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
      },
    }, () => 1401);
    const repositories: GenesisLocalRepositories = {
      universeRepository,
      navigationRepository,
      pointsRepository,
      discoveryRepository,
    };
    TestBed.configureTestingModule({
      providers: [{ provide: GENESIS_LOCAL_REPOSITORIES, useValue: repositories }],
    });
    const bootstrap = TestBed.inject(UniverseBootstrapService);
    const exploration = new DexieExplorationSectorProgressRuntime(
      database, pointsRepository, discoveryRepository,
    );

    try {
      const created = await bootstrap.ensureInitialized(v2);
      expect(created.created).toBe(true);
      expect(created.generationKey.equals(v2)).toBe(true);
      expect((await universeRepository.getAll()).some(key => key.equals(v2))).toBe(true);
      expect((await navigationRepository.getNavigation(v2)).activeGalaxyIndex).toBe(0n);
      expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(0n);
      expect(await discoveryRepository.getState(v2, new GalaxyLocator(0n)))
        .toBe(DiscoveryState.DISCOVERED);
      expect((await discoveryRepository.getKnownDiscoveries(v2)).length).toBe(1);

      // A V1 save with the very same seed has its own namespace.
      expect((await bootstrap.ensureInitialized(v1)).created).toBe(true);
      const resolved = ExplorationSectorResultEngine.resolve(
        ExplorationSectorScanEngine.scan(
          ExplorationSectorScanEngine.prepareSector(v2, 0n, 0, 0),
        ),
      );
      expect(resolved.scanResult.selection.generationKey.equals(v2)).toBe(true);
      const first = await exploration.commitResolvedResult(resolved);
      const pointsAfter = await pointsRepository.getGlobalDiscoveryPoints(v2);
      expect(first.awardedDiscoveryPoints).toBeGreaterThan(0);
      expect(pointsAfter).toBe(BigInt(first.awardedDiscoveryPoints));
      expect(first.sectorState).toBe(DiscoveryState.DETECTED);

      const repeated = await exploration.commitResolvedResult(resolved);
      expect(repeated.awardedDiscoveryPoints).toBe(0);
      expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(pointsAfter);
      expect((await bootstrap.ensureInitialized(v2)).created).toBe(false);
      expect(await pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(pointsAfter);
      expect(await pointsRepository.getGlobalDiscoveryPoints(v1)).toBe(0n);
      expect(await discoveryRepository.getState(v1, resolved.scanResult.selection.sectorLocator))
        .toBe(DiscoveryState.UNKNOWN);
      expect((await discoveryRepository.getKnownDiscoveries(v2))
        .every(discovery => discovery.generationKey.equals(v2))).toBe(true);
    } finally {
      database.closeDatabase();
      await new Dexie(databaseName, dependencies).delete();
    }
  });
});
