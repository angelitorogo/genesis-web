import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import {
  GalaxyLocator, GalacticObjectLocator, SectorLocator, SystemLocator,
} from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository } from '../../data/local/repository/dexie-discovery.repository';
import { DexieUniverseNavigationRepository } from '../../data/local/repository/dexie-universe-navigation.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { FocusedGalaxyConfirmationRuntime } from './focused-galaxy-confirmation.runtime';

const dependencies = { indexedDB, IDBKeyRange };
const databaseName = 'genesis-c0de-6a1a-v3-integration';
const seed = UniverseSeed.parse('C0DE-6A1A-0000-0000-0000-0000-0000-0003');
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const v3 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V3);
const targetSeedResolver = {
  resolveTargetSeedNormalized(key: UniverseGenerationKey, locator: Parameters<typeof ProceduralTargetResolver.resolveTargetSeed>[1]) {
    return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
  },
};

// This test covers real IndexedDB writes. It never scans or materializes a full galaxy.
describe('QA focused-galaxy confirmation in new V3 universes', () => {
  afterEach(async () => {
    await new Dexie(databaseName, dependencies).delete();
  });

  it('confirma el foco V3 sin PD, guarda los hijos y no toca V2 ni otras galaxias', async () => {
    const db = new GenesisIndexedDb(databaseName, dependencies);
    try {
      const universes = new DexieUniverseRepository(db);
      const navigation = new DexieUniverseNavigationRepository(db);
      const discoveries = new DexieDiscoveryRepository(db, targetSeedResolver);
      const points = new DexieDiscoveryPointsRepository(db);
      await universes.createIfAbsent(v2);
      await universes.createIfAbsent(v3);
      await navigation.setNavigation(v3, { activeGalaxyIndex: 0n, recentGalaxyIndices: [1n] });
      await discoveries.setState(v3, new GalaxyLocator(0n), DiscoveryState.DISCOVERED);
      await discoveries.setState(v3, new GalaxyLocator(1n), DiscoveryState.DISCOVERED);
      await discoveries.setState(v2, new GalaxyLocator(0n), DiscoveryState.DISCOVERED);
      await points.setGlobalDiscoveryPoints(v3, 42n);
      const sector = new SectorLocator(0n, 10n);
      const system = new SystemLocator(0n, 10n, 0n);
      const object = new GalacticObjectLocator(0n, 10n, 1n);
      const runtime = new FocusedGalaxyConfirmationRuntime(navigation, discoveries, () => ({
        totalSectors: 1n,
        sectors: [{ sectorLocator: sector, systemLocators: [system], galacticObjectLocators: [object] }],
      }));

      await expect(runtime.confirmFocusedGalaxy(v3)).resolves.toEqual({
        kind: 'confirmed', galaxyIndex: 0n, sectors: 1n, systems: 1n, galacticObjects: 1n,
      });
      for (const locator of [new GalaxyLocator(0n), sector, system, object]) {
        expect(await discoveries.getState(v3, locator)).toBe(DiscoveryState.CONFIRMED);
      }
      expect(await discoveries.getState(v3, new GalaxyLocator(1n))).toBe(DiscoveryState.DISCOVERED);
      expect(await discoveries.getState(v2, new GalaxyLocator(0n))).toBe(DiscoveryState.DISCOVERED);
      expect(await discoveries.getState(v2, system)).toBe(DiscoveryState.UNKNOWN);
      expect(await points.getGlobalDiscoveryPoints(v3)).toBe(42n);
      db.closeDatabase();

      const reopened = new GenesisIndexedDb(databaseName, dependencies);
      try {
        const persisted = new DexieDiscoveryRepository(reopened, targetSeedResolver);
        expect(await persisted.getState(v3, system)).toBe(DiscoveryState.CONFIRMED);
        expect(await persisted.getState(v3, object)).toBe(DiscoveryState.CONFIRMED);
        expect(await persisted.getState(v2, system)).toBe(DiscoveryState.UNKNOWN);
      } finally {
        reopened.closeDatabase();
      }
    } finally {
      db.closeDatabase();
    }
  });
});
