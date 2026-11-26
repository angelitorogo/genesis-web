import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { afterEach, describe, expect, it } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import {
  GalaxyLocator, GalacticObjectLocator, SectorLocator, SystemLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryRepository } from '../../data/local/repository/dexie-discovery.repository';
import { DexieUniverseNavigationRepository } from '../../data/local/repository/dexie-universe-navigation.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { subscribeGenesisKnowledgeCommits38BisB6 } from '../../data/local/repository/genesis-knowledge-commits-38-bis-b6';
import { FocusedGalaxyConfirmationRuntime } from './focused-galaxy-confirmation.runtime';

const dependencies = { indexedDB, IDBKeyRange };
const databaseName = 'genesis-bulkconf-archperf1-isolated';
const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const v3 = new UniverseGenerationKey(seed, GeneratorVersion.V3);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
const resolver = {
  resolveTargetSeedNormalized(key: UniverseGenerationKey, locator: ProceduralLocator): string {
    // Strict 32-character hexadecimal identity, including the V2/V3 scope.
    const label = locator instanceof GalaxyLocator ? `g:${locator.galaxyIndex}` :
      locator instanceof SectorLocator ? `s:${locator.galaxyIndex}:${locator.sectorKey}` :
      locator instanceof SystemLocator ? `y:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}` :
      locator instanceof GalacticObjectLocator ? `o:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}` :
      'unsupported';
    const source = `${key.generatorVersionCode}:${label}`;
    let hash = 2166136261;
    for (const char of source) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    const hex = (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
    return hex.repeat(4);
  },
};

const focus = new GalaxyLocator(2n);
const other = new GalaxyLocator(9n);
const sectorA = new SectorLocator(2n, 10n);
const sectorB = new SectorLocator(2n, 11n);
const systemA = new SystemLocator(2n, 10n, 0n);
const systemB = new SystemLocator(2n, 11n, 1n);
const objectA = new GalacticObjectLocator(2n, 10n, 2n);
const objectB = new GalacticObjectLocator(2n, 11n, 3n);
const plan = () => ({
  totalSectors: 2n,
  sectors: [
    { sectorLocator: sectorA, systemLocators: [systemA], galacticObjectLocators: [objectA] },
    { sectorLocator: sectorB, systemLocators: [systemB], galacticObjectLocators: [objectB] },
  ],
});

describe('BULKCONF-ARCHPERF.1: confirmación por lotes sin saturar Archivo', () => {
  afterEach(async () => { await new Dexie(databaseName, dependencies).delete(); });

  it('omite registros confirmados sin actualizar su fecha, preserva identidades y PD de V3/V2', async () => {
    const db = new GenesisIndexedDb(databaseName, dependencies);
    try {
      const universe = new DexieUniverseRepository(db);
      await universe.createIfAbsent(v3);
      await universe.createIfAbsent(v2);
      const repo = new DexieDiscoveryRepository(db, resolver, () => 1234);
      await repo.setState(v3, focus, DiscoveryState.DISCOVERED);
      await repo.setState(v3, other, DiscoveryState.CONFIRMED);
      await repo.setState(v3, sectorA, DiscoveryState.CONFIRMED);
      await repo.setState(v3, systemA, DiscoveryState.DETECTED);
      const unchangedBefore = (await db.discoveries.toArray())
        .find(e => e.targetTypeCode === 2 && e.galaxyIndex === '2');
      expect(unchangedBefore).toBeDefined();
      const one = await repo.confirmLocatorsBatch(v3, [focus, sectorA, systemA, objectA]);
      expect(one).toBe(3);
      expect(await repo.confirmLocatorsBatch(v3, [focus, sectorA, systemA, objectA])).toBe(0);
      const unchangedAfter = (await db.discoveries.toArray())
        .find(e => e.targetTypeCode === 2 && e.galaxyIndex === '2');
      expect(unchangedAfter).toEqual(unchangedBefore);
      expect(await repo.getState(v3, systemA)).toBe(DiscoveryState.CONFIRMED);
      expect(await repo.getState(v3, other)).toBe(DiscoveryState.CONFIRMED);
      expect(await repo.getState(v2, systemA)).toBe(DiscoveryState.UNKNOWN);
      expect(await repo.getState(v2, focus)).toBe(DiscoveryState.UNKNOWN);
      db.closeDatabase();
      const reopened = new GenesisIndexedDb(databaseName, dependencies);
      try {
        const restored = new DexieDiscoveryRepository(reopened, resolver);
        expect(await restored.getState(v3, systemA)).toBe(DiscoveryState.CONFIRMED);
        expect(await restored.getState(v3, objectA)).toBe(DiscoveryState.CONFIRMED);
      } finally { reopened.closeDatabase(); }
    } finally { db.closeDatabase(); }
  });

  it('reanuda una confirmación previa interrumpida, sin confiar en el estado aislado de un sector', async () => {
    const db = new GenesisIndexedDb(databaseName, dependencies);
    try {
      await new DexieUniverseRepository(db).createIfAbsent(v3);
      const repo = new DexieDiscoveryRepository(db, resolver);
      const nav = new DexieUniverseNavigationRepository(db);
      await nav.setNavigation(v3, {activeGalaxyIndex: 2n, recentGalaxyIndices: []});
      await repo.setState(v3, focus, DiscoveryState.CONFIRMED);
      await repo.setState(v3, sectorA, DiscoveryState.CONFIRMED);
      await repo.setState(v3, systemA, DiscoveryState.CONFIRMED);
      // Old implementation died before recording the last child of sector A.
      expect(await repo.getState(v3, objectA)).toBe(DiscoveryState.UNKNOWN);
      const all = new FocusedGalaxyConfirmationRuntime(nav, repo, plan);
      const events: string[] = [];
      const unsubscribe = subscribeGenesisKnowledgeCommits38BisB6(
        e => { if (e.galaxyIndex === '2' && e.generatorVersionCode === 3) events.push(e.kind); },
      );
      try {
        await expect(all.confirmFocusedGalaxy(v3)).resolves.toEqual({
          kind: 'confirmed', galaxyIndex: 2n, sectors: 2n, systems: 2n, galacticObjects: 2n,
        });
        expect(await repo.getState(v3, objectA)).toBe(DiscoveryState.CONFIRMED);
        expect(await repo.getState(v3, systemB)).toBe(DiscoveryState.CONFIRMED);
        expect(await repo.getState(v3, objectB)).toBe(DiscoveryState.CONFIRMED);
        // Two durable, galaxy-scoped invalidations instead of one per child.
        expect(events).toEqual(['GALAXY', 'GALAXY']);
      } finally { unsubscribe(); }
    } finally { db.closeDatabase(); }
  });

  it('una interrupción conserva las transacciones completas y permite continuar', async () => {
    const db = new GenesisIndexedDb(databaseName, dependencies);
    try {
      await new DexieUniverseRepository(db).createIfAbsent(v3);
      const repo = new DexieDiscoveryRepository(db, resolver);
      const nav = new DexieUniverseNavigationRepository(db);
      await nav.setNavigation(v3, {activeGalaxyIndex: 2n, recentGalaxyIndices: []});
      await repo.setState(v3, focus, DiscoveryState.DISCOVERED);
      const sectors = Array.from({length: 17}, (_, n) => ({
        sectorLocator: new SectorLocator(2n, BigInt(n + 100)),
        systemLocators: [new SystemLocator(2n, BigInt(n + 100), 0n)],
        galacticObjectLocators: [] as GalacticObjectLocator[],
      }));
      const partialPlan = () => ({totalSectors: 17n, sectors});
      const original = repo.confirmLocatorsBatch.bind(repo);
      let writes = 0;
      repo.confirmLocatorsBatch = async (key, targets) => {
        if (++writes === 2) throw new Error('simulated interruption');
        return original(key, targets);
      };
      const interrupted = new FocusedGalaxyConfirmationRuntime(nav, repo, partialPlan);
      await expect(interrupted.confirmFocusedGalaxy(v3)).rejects.toThrow('simulated interruption');
      expect(await repo.getState(v3, sectors[0]!.sectorLocator)).toBe(DiscoveryState.CONFIRMED);
      expect(await repo.getState(v3, sectors[16]!.sectorLocator)).toBe(DiscoveryState.UNKNOWN);
      repo.confirmLocatorsBatch = original;
      await new FocusedGalaxyConfirmationRuntime(nav, repo, partialPlan).confirmFocusedGalaxy(v3);
      for (const sector of sectors) {
        expect(await repo.getState(v3, sector.sectorLocator)).toBe(DiscoveryState.CONFIRMED);
        expect(await repo.getState(v3, sector.systemLocators[0]!)).toBe(DiscoveryState.CONFIRMED);
      }
    } finally { db.closeDatabase(); }
  });

  it('no comienza la operación si falla registrar la actualización persistente del Archivo', async () => {
    const db = new GenesisIndexedDb(databaseName, dependencies);
    try {
      await new DexieUniverseRepository(db).createIfAbsent(v3);
      const repo = new DexieDiscoveryRepository(db, resolver);
      const nav = new DexieUniverseNavigationRepository(db);
      await nav.setNavigation(v3, {activeGalaxyIndex: 2n, recentGalaxyIndices: []});
      await repo.setState(v3, focus, DiscoveryState.DISCOVERED);
      const unsubscribe = subscribeGenesisKnowledgeCommits38BisB6(() => {
        throw new Error('archive queue unavailable');
      });
      try {
        await expect(new FocusedGalaxyConfirmationRuntime(nav, repo, plan)
          .confirmFocusedGalaxy(v3)).rejects.toThrow('archive queue unavailable');
      } finally { unsubscribe(); }
      expect(await repo.getState(v3, focus)).toBe(DiscoveryState.DISCOVERED);
      expect(await repo.getState(v3, sectorA)).toBe(DiscoveryState.UNKNOWN);
    } finally { db.closeDatabase(); }
  });

  it('una galaxia grande se procesa en lotes acotados y notificaciones globales', async () => {
    const requested: number[] = [];
    const state = new Map<string, number>();
    state.set('g:2', DiscoveryState.DISCOVERED.code);
    const address = (locator: ProceduralLocator) =>
      locator instanceof GalaxyLocator ? `g:${locator.galaxyIndex}` :
      locator instanceof SectorLocator ? `s:${locator.galaxyIndex}:${locator.sectorKey}` :
      'unknown';
    const fake = {
      getState: async (_key: UniverseGenerationKey, locator: ProceduralLocator) =>
        state.get(address(locator)) === DiscoveryState.DISCOVERED.code
          ? DiscoveryState.DISCOVERED : DiscoveryState.UNKNOWN,
      setState: async () => { throw new Error('Must use batch confirmation'); },
      confirmLocatorsBatch: async (_key: UniverseGenerationKey, locators: readonly ProceduralLocator[]) => {
        requested.push(locators.length);
        for (const locator of locators) state.set(address(locator), DiscoveryState.CONFIRMED.code);
        return locators.length;
      },
      getKnownDiscoveries: async () => [],
      getKnownDiscoveriesInSector: async () => [],
    };
    const navigation = {getNavigation: async () => ({activeGalaxyIndex: 2n, recentGalaxyIndices: []}),
      setNavigation: async () => { throw new Error('focus changed'); }};
    const sectors = Array.from({length: 320}, (_, i) => ({
      sectorLocator: new SectorLocator(2n, BigInt(i + 1000)),
      systemLocators: [], galacticObjectLocators: [],
    }));
    const runtime = new FocusedGalaxyConfirmationRuntime(navigation, fake, () => ({
      totalSectors: 320n, sectors,
    }));
    const progress: bigint[] = [];
    await runtime.confirmFocusedGalaxy(v3, done => progress.push(done));
    expect(requested.length).toBeGreaterThan(1);
    expect(Math.max(...requested)).toBeLessThanOrEqual(256);
    expect(requested.reduce((sum, size) => sum + size, 0)).toBe(321);
    expect(progress.at(-1)).toBe(320n);
  });

  it('lotes vacíos y límites protegen contra transacciones gigantes', async () => {
    const db = new GenesisIndexedDb(databaseName, dependencies);
    try {
      const repo = new DexieDiscoveryRepository(db, resolver);
      expect(await repo.confirmLocatorsBatch(v3, [])).toBe(0);
      await expect(repo.confirmLocatorsBatch(v3, Array(257).fill(focus)))
        .rejects.toThrow(/256/);
    } finally { db.closeDatabase(); }
  });
});
