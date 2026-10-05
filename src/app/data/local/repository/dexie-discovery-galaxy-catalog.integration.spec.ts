import Dexie from 'dexie';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

import { DiscoveryState } from '../../../domain/discovery/discovery-state';
import { DiscoveryTargetType } from '../../../domain/discovery/discovery-target-type';
import {
  BodyLocator,
  type ProceduralLocator,
  SystemLocator,
} from '../../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import {
  DexieDiscoveryRepository,
  type ProceduralTargetSeedResolver,
} from './dexie-discovery.repository';
import { DexieUniverseRepository } from './dexie-universe.repository';

const databaseName = 'genesis-web-26-1c2-galaxy-catalog-tests';
const dependencies = Object.freeze({ indexedDB, IDBKeyRange });
const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V1,
);
const targetSeedResolver: ProceduralTargetSeedResolver = {
  resolveTargetSeedNormalized(_key, locator): string {
    return syntheticTargetSeed(locator);
  },
};

describe('26.1c.2 Dexie galaxy-scoped catalogue path', () => {
  let database: GenesisIndexedDb;
  let universes: DexieUniverseRepository;
  let discoveries: DexieDiscoveryRepository;

  beforeEach(() => {
    database = new GenesisIndexedDb(databaseName, dependencies);
    universes = new DexieUniverseRepository(database, () => 1000);
    discoveries = new DexieDiscoveryRepository(database, targetSeedResolver, () => 1000);
  });

  afterEach(async () => {
    database.closeDatabase();
    await new Dexie(databaseName, dependencies).delete();
  });

  it('returns only the requested galaxy and target type without scanning other catalogue rows', async () => {
    await universes.createIfAbsent(generationKey);

    const wanted = new SystemLocator(0n, 10n, 2n);
    const otherGalaxy = new SystemLocator(1n, 10n, 2n);
    const otherType = new BodyLocator(0n, 10n, 2n, 0n);

    await discoveries.setState(generationKey, wanted, DiscoveryState.CONFIRMED);
    await discoveries.setState(generationKey, otherGalaxy, DiscoveryState.CONFIRMED);
    await discoveries.setState(generationKey, otherType, DiscoveryState.CONFIRMED);

    const result = await discoveries.getKnownDiscoveriesInGalaxy(
      generationKey,
      0n,
      DiscoveryTargetType.SYSTEM.code,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.locator).toBeInstanceOf(SystemLocator);
    expect((result[0]?.locator as SystemLocator).galaxyIndex).toBe(0n);
    expect((result[0]?.locator as SystemLocator).sectorKey).toBe(10n);
    expect((result[0]?.locator as SystemLocator).galacticObjectIndex).toBe(2n);
  });
});

function syntheticTargetSeed(locator: ProceduralLocator): string {
  const parts = locator instanceof BodyLocator
    ? [locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex, locator.bodyIndex]
    : locator instanceof SystemLocator
      ? [locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex]
      : [0n];
  const value = parts.reduce((acc, part) => (acc * 131n + BigInt.asUintN(64, part)), 17n);
  return BigInt.asUintN(128, value).toString(16).toUpperCase().padStart(32, '0');
}
