import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, GalacticObjectLocator, SystemLocator, type ProceduralLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieDiscoveryRepository, type ProceduralTargetSeedResolver } from '../../data/local/repository/dexie-discovery.repository';
import { DexieScientificEvidenceRepository } from '../../data/local/repository/dexie-scientific-evidence.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { ExplorationSectorResultEngine } from '../../simulation/exploration/exploration-sector-result-engine';
import { ExtremeObjectTypeResolver } from '../../simulation/galactic-object/extreme-object-type-resolver';
import { GalaxySectorContentGenerator } from '../../simulation/sector/galaxy-sector-content-generator';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { DexieMagnetarActivityObservationRuntime } from './magnetar-activity-observation.runtime';
import { DexiePulsarTimingObservationRuntime } from './pulsar-timing-observation.runtime';

const dependencies = { indexedDB, IDBKeyRange };
const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const resolver: ProceduralTargetSeedResolver = {
  resolveTargetSeedNormalized(k: UniverseGenerationKey, locator: ProceduralLocator): string {
    if (locator instanceof BodyLocator) {
      // The V2 production body identity is resolved through the stage-13 public
      // multihost index. This runtime spec only needs one persisted BODY
      // milestone to unlock the canonical instrument progression, so encode the
      // public locator fields directly into a deterministic 128-bit test seed.
      return [
        locator.galaxyIndex,
        locator.sectorKey,
        locator.galacticObjectIndex,
        locator.bodyIndex,
      ]
        .map(value => BigInt.asUintN(32, value).toString(16).padStart(8, '0'))
        .join('');
    }
    return ProceduralTargetResolver.resolveTargetSeed(k, locator).normalizedValue;
  },
};
const magnetar = findMagnetar();

describe('28.4 persisted magnetar magnetic-activity runtime', () => {
  const dbName = 'genesis-phase-28-4-magnetar-activity-runtime';
  let db: GenesisIndexedDb;
  let discoveries: DexieDiscoveryRepository;
  let points: DexieDiscoveryPointsRepository;
  let evidence: DexieScientificEvidenceRepository;
  let timingRuntime: DexiePulsarTimingObservationRuntime;
  let runtime: DexieMagnetarActivityObservationRuntime;

  beforeEach(async () => {
    db = new GenesisIndexedDb(dbName, dependencies);
    discoveries = new DexieDiscoveryRepository(db, resolver, () => 1000);
    points = new DexieDiscoveryPointsRepository(db, () => 1000);
    evidence = new DexieScientificEvidenceRepository(db, resolver);
    timingRuntime = new DexiePulsarTimingObservationRuntime(db, points, discoveries, resolver);
    runtime = new DexieMagnetarActivityObservationRuntime(db, points, discoveries, resolver);
    await new DexieUniverseRepository(db, () => 1000).createIfAbsent(key);
    await points.setGlobalDiscoveryPoints(key, 0n);
  });

  afterEach(async () => {
    db.closeDatabase();
    await new Dexie(dbName, dependencies).delete();
  });

  it('is absent before CONFIRMED and cannot leak magnetic/burst values', async () => {
    for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED, DiscoveryState.CATALOGUED]) {
      await discoveries.setState(key, magnetar, state);
      expect(await runtime.inspect(key, magnetar)).toBeNull();
      await expect(runtime.measure(key, magnetar)).rejects.toThrow();
    }
    expect(await evidence.getEvidence(key, magnetar)).toHaveLength(0);
  });

  it('requires 28.3 timing plus genuine level-4 high-energy unlocks and persists one campaign', async () => {
    await discoveries.setState(key, magnetar, DiscoveryState.CONFIRMED);

    const beforeTiming = await runtime.inspect(key, magnetar);
    expect(beforeTiming).not.toBeNull();
    expect(beforeTiming!.timingSynchronized).toBe(false);
    expect(beforeTiming!.canMeasure).toBe(false);
    expect(beforeTiming!.facts).toHaveLength(0);
    await expect(runtime.measure(key, magnetar)).rejects.toThrow(/28\.3/);

    // Unlock level 4 and the X-ray family without bypassing the canonical
    // progression catalog: system catalogued + body discovered + target itself
    // already confirmed/catalogued, with sufficient accumulated PD.
    await discoveries.setState(key, new SystemLocator(0n, 1n, 0n), DiscoveryState.CATALOGUED);
    await discoveries.setState(key, new BodyLocator(0n, 1n, 0n, 0n), DiscoveryState.DISCOVERED);
    await points.setGlobalDiscoveryPoints(key, 10_000n);

    await timingRuntime.measure(key, magnetar);
    const afterTiming = await runtime.inspect(key, magnetar);
    expect(afterTiming!.timingSynchronized).toBe(true);
    expect(afterTiming!.canMeasure).toBe(true);

    const pointsBefore = await points.getGlobalDiscoveryPoints(key);
    await runtime.measure(key, magnetar);
    const after = await runtime.inspect(key, magnetar);
    expect(after!.measured).toBe(true);
    expect(after!.canMeasure).toBe(false);
    expect(after!.measuredInstrumentLabel).toBe('Rayos X');
    expect(after!.facts.some(f => f.label === 'Campo dipolar inferido')).toBe(true);
    expect(after!.facts.some(f => f.label === 'Estallidos detectados')).toBe(true);
    expect(await points.getGlobalDiscoveryPoints(key)).toBe(pointsBefore);
    expect(await discoveries.getState(key, magnetar)).toBe(DiscoveryState.CONFIRMED);
    expect(await evidence.getEvidence(key, magnetar)).toHaveLength(2);

    await runtime.measure(key, magnetar);
    expect(await evidence.getEvidence(key, magnetar)).toHaveLength(2);

    const reloaded = new DexieMagnetarActivityObservationRuntime(db, points, discoveries, resolver);
    expect((await reloaded.inspect(key, magnetar))?.facts).toEqual(after!.facts);
  });
});

function findMagnetar(): GalacticObjectLocator {
  const galaxy = GalaxyGenerator.generate(key, 0n);
  const physicalKey = frozenPhysicalSourceKey(key);
  for (let x = -40; x <= 40; x += 1) {
    for (let y = -40; y <= 40; y += 1) {
      if (x === 0 && y === 0) continue;
      const content = GalaxySectorContentGenerator.generate(galaxy, { x, y });
      for (const locator of content.galacticObjectLocators) {
        if (ExplorationSectorResultEngine.resolveGalacticObjectKind(physicalKey, locator) !==
            ExplorationResultKind.EXTREME_OBJECT) continue;
        if (ExtremeObjectTypeResolver.resolve(key, locator) === ExtremeType.MAGNETAR) return locator;
      }
    }
  }
  throw new Error('Missing deterministic V2 magnetar fixture for 28.4 runtime.');
}
