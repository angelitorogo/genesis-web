import Dexie from 'dexie';
import { TestBed } from '@angular/core/testing';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieDiscoveryRepository } from '../../data/local/repository/dexie-discovery.repository';
import { DexieUniverseNavigationRepository } from '../../data/local/repository/dexie-universe-navigation.repository';
import { DexieDiscoveryPointsRepository } from '../../data/local/repository/dexie-discovery-points.repository';
import { DexieUniverseRepository } from '../../data/local/repository/dexie-universe.repository';
import { GalaxyGenerator } from '../../simulation/universe/galaxy-generator';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { SystemMultihostGameCutover } from '../system/system-multihost-game-cutover';
import { GENESIS_LOCAL_REPOSITORIES, type GenesisLocalRepositories } from '../runtime/genesis-local-repositories';
import { UniverseBootstrapService } from './universe-bootstrap.service';
import { activeUniverseRef } from './active-universe-selection';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const v2 = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const v3 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V3);

function sources(db: GenesisIndexedDb): GenesisLocalRepositories {
  return {
    universeRepository: new DexieUniverseRepository(db),
    navigationRepository: new DexieUniverseNavigationRepository(db),
    pointsRepository: new DexieDiscoveryPointsRepository(db),
    discoveryRepository: new DexieDiscoveryRepository(db, {
      resolveTargetSeedNormalized(key, locator) {
        return ProceduralTargetResolver.resolveTargetSeed(key, locator).normalizedValue;
      },
    }),
  };
}

// Known, deterministic Elixisis / Elisoune coordinates; not generation exceptions.
const binary = new SystemLocator(0n, -30064771061n, 0n);
const triple = new SystemLocator(1n, 60129542150n, 1n);

describe('PRE-33.03a.2b.3b — ruta pública V3 sin mutación de V2', () => {
  it('almacena y reabre la identidad V3 en IndexedDB separada de V2', async () => {
    const name = 'genesis-v3-public-new-game';
    const dependencies = { indexedDB, IDBKeyRange };
    const first = new GenesisIndexedDb(name, dependencies);
    let reopened: GenesisIndexedDb | null = null;
    try {
      const firstRepositories = sources(first);
      TestBed.configureTestingModule({
        providers: [{ provide: GENESIS_LOCAL_REPOSITORIES, useValue: firstRepositories }],
      });
      const bootstrap = TestBed.inject(UniverseBootstrapService);
      expect(GeneratorVersion.fromCode(3)).toBe(GeneratorVersion.V3);
      expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V3)).toBe(true);
      expect((await bootstrap.ensureInitialized(v2)).created).toBe(true);
      expect((await bootstrap.ensureInitialized(v3)).created).toBe(true);
      expect((await bootstrap.ensureInitialized(v3)).created).toBe(false);
      expect(await firstRepositories.discoveryRepository.getState(v3, new GalaxyLocator(0n)))
        .toBe(DiscoveryState.DISCOVERED);
      expect(activeUniverseRef(v3)).not.toBe(activeUniverseRef(v2));
      await firstRepositories.pointsRepository.setGlobalDiscoveryPoints(v2, 27n);
      await firstRepositories.pointsRepository.setGlobalDiscoveryPoints(v3, 39n);
      await firstRepositories.navigationRepository.setNavigation(v3, {
        activeGalaxyIndex: 1n, recentGalaxyIndices: [0n],
      });
      first.closeDatabase();
      reopened = new GenesisIndexedDb(name, dependencies);
      const secondRepositories = sources(reopened);
      const loaded = await secondRepositories.universeRepository.getAll();
      expect(loaded.some(k => k.equals(v3))).toBe(true);
      expect(loaded.some(k => k.equals(v2))).toBe(true);
      expect(await secondRepositories.pointsRepository.getGlobalDiscoveryPoints(v3)).toBe(39n);
      expect(await secondRepositories.pointsRepository.getGlobalDiscoveryPoints(v2)).toBe(27n);
      expect((await secondRepositories.navigationRepository.getNavigation(v3)).activeGalaxyIndex).toBe(1n);
      expect(GalaxyGenerator.generate(v3, 0n).generationKey.generatorVersion).toBe(GeneratorVersion.V3);
      expect(GalaxyGenerator.generate(v2, 0n).generationKey.generatorVersion).toBe(GeneratorVersion.V2);
    } finally {
      first.closeDatabase();
      reopened?.closeDatabase();
      await new Dexie(name, dependencies).delete();
    }
  });

  it.each([['BINARY', binary], ['TRIPLE', triple]] as const)(
    '%s: la ficha y la escena V3 comparten la nueva formación coetánea', (kind, locator) => {
      const previous = StellarMultihostFormation.generateOrNull(v2, locator);
      const fresh = StellarMultihostFormation.generateOrNull(v3, locator);
      expect(previous).not.toBeNull();
      expect(fresh).not.toBeNull();
      if (!previous || !fresh) throw new Error('Missing deterministic multi-host fixture.');
      const legacyAges = previous.components.map(c => c.lifetime.ageBillionYears);
      const newAge = fresh.components[0]!.lifetime.ageBillionYears;
      expect(new Set(legacyAges).size).toBeGreaterThan(1);
      expect(fresh.multiplicity.name).toBe(kind);
      expect(fresh.parentGenerationKey.equals(v3)).toBe(true);
      expect(fresh.components.every(c => c.lifetime.ageBillionYears === newAge)).toBe(true);
      expect(fresh.publicPlanets.length).toBeLessThanOrEqual(previous.publicPlanets.length);
      expect(fresh.publicPlanets.every(e => e.atmosphere.hostPlanet === e.planet &&
        e.moonSystem.hostPlanet === e.planet)).toBe(true);
      expect(StellarMultihostFormation.generateOrNull(v2, locator)!.components
        .map(c => c.lifetime.ageBillionYears)).toEqual(legacyAges);
      const stellarSystemCard = ArchiveV2StellarSystemCardAssembler.build(v3, locator,
        DiscoveryState.CONFIRMED);
      const model = {
        universeSeed: seed.serialize(), generatorVersionCode: 3,
        locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
        galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
        galacticObjectIndex: locator.galacticObjectIndex,
        proceduralIdentity: `G${locator.galaxyIndex}/S${locator.sectorKey}/O${locator.galacticObjectIndex}`,
        discoveryState: DiscoveryState.CONFIRMED,
        discoveryStateLabel: DiscoveryState.CONFIRMED.name,
        stellarSystemCard,
      } as unknown as ArchiveDiscoveryDetailModel;
      const session = SystemMultihostGameCutover.sessionOrNull(model);
      expect(session).not.toBeNull();
      expect(session?.scene.generatorVersionCode).toBe(3);
      expect(session?.scene.planets.length).toBe(fresh.publicPlanets.length);
      expect(session?.stellarSystemCard.components.length).toBe(kind === 'TRIPLE' ? 3 : 2);
      expect(session?.stellarSystemCard.summary).toContain('no resueltas');
    },
  );
});
