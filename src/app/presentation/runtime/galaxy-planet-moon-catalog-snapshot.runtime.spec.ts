import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import { type GalaxyKnowledgeSnapshotRepository } from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import {
  DexieGalaxyPlanetMoonCatalogSnapshotRuntime,
  type GalaxyKnowledgePlanetMoonCatalogSnapshot,
} from './galaxy-planet-moon-catalog-snapshot.runtime';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const system = new SystemLocator(0n, 3n, 8n);
const body = new BodyLocator(0n, 3n, 8n, 1n);
const moon = new MoonLocator(0n, 3n, 8n, 1n, 0n);

function snapshot(): GalaxyKnowledgePlanetMoonCatalogSnapshot {
  return Object.freeze({
    galaxyIndex: 0n,
    planets: Object.freeze([
      Object.freeze({
        id: 'planet-1',
        locator: body,
        parentSystemLocator: system,
        designation: 'Test c',
        systemDesignation: 'Test',
        stateName: 'CONFIRMED',
        subtype: PlanetType.OCEAN,
        hostLabel: 'A',
        orbitClass: 'SINGLE_HOST',
        massEarth: 2,
        radiusEarth: 1.2,
        semiMajorAxisAu: 1,
        orbitalPeriodDays: 365,
        meanSurfaceTemperatureKelvin: 288,
        surfaceLiquidWaterCoverageFraction01: 0.7,
        postCollapseIdentityHex: null,
      }),
    ]),
    moons: Object.freeze([
      Object.freeze({
        id: 'moon-1',
        locator: moon,
        parentSystemLocator: system,
        designation: 'Test c I',
        hostPlanetDesignation: 'Test c',
        systemDesignation: 'Test',
        stateName: 'CONFIRMED',
        composition: 'ICY',
        hostLabel: 'A',
        orbitClass: 'SINGLE_HOST',
        massEarth: 0.01,
        radiusEarth: 0.2,
        orbitalPeriodDays: 4,
        inferredIceRichnessIndex01: 0.8,
        surfaceLiquidWaterPotentialIndex01: 0.3,
        subsurfaceOceanPotentialIndex01: 0.9,
        waterRegime: MoonWaterRegime.SUBSURFACE_OCEAN,
      }),
    ]),
    unmaterializedMinorMoonCount: 12n,
  });
}

describe('26.1c.3 galaxy planet/moon catalog snapshot runtime', () => {
  it('persists the expensive derived catalogue once and restores typed locators for the same knowledge revision', async () => {
    let stored: GalaxyKnowledgeSnapshotEntity | undefined;
    const get = vi.fn(async () => stored);
    const put = vi.fn(async (entity: GalaxyKnowledgeSnapshotEntity) => { stored = entity; });
    const repository: GalaxyKnowledgeSnapshotRepository = { get, put };
    const builder = vi.fn(() => snapshot());
    const runtime = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(
      repository,
      () => 1234,
      builder,
    );
    const known = Object.freeze([
      new KnownDiscovery(key, system, DiscoveryState.CONFIRMED),
    ]);

    const first = await runtime.resolve(key, 0n, known);
    const second = await runtime.resolve(key, 0n, known);

    expect(builder).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledTimes(1);
    expect(put).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(first.planets[0]?.locator).toBeInstanceOf(BodyLocator);
    expect(second.planets[0]?.locator).toBeInstanceOf(BodyLocator);
    expect(second.moons[0]?.locator).toBeInstanceOf(MoonLocator);
    expect(second.unmaterializedMinorMoonCount).toBe(12n);
    expect(stored?.planetMoonCatalogJson).toBeTypeOf('string');
    expect(stored?.updatedAtEpochMs).toBe(1234);
  });

  it('invalidates the derived catalogue when persisted scientific knowledge changes', async () => {
    let stored: GalaxyKnowledgeSnapshotEntity | undefined;
    const repository: GalaxyKnowledgeSnapshotRepository = {
      async get() { return stored; },
      async put(entity) { stored = entity; },
    };
    const builder = vi.fn(() => snapshot());
    const runtime = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository, Date.now, builder);

    await runtime.resolve(key, 0n, [
      new KnownDiscovery(key, system, DiscoveryState.CATALOGUED),
    ]);
    await runtime.resolve(key, 0n, [
      new KnownDiscovery(key, system, DiscoveryState.CONFIRMED),
    ]);

    expect(builder).toHaveBeenCalledTimes(2);
  });
});
