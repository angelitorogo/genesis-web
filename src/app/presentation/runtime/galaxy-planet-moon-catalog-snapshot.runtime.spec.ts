import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { PlanetType } from '../../domain/planetary/planet-type';
import { PlanetScientificTargetResolver } from '../../simulation/planetary/planet-scientific-target-resolver';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { type GalaxyKnowledgeSnapshotEntity } from '../../data/local/entity/galaxy-knowledge-snapshot.entity';
import { type GalaxyKnowledgeSnapshotRepository } from '../../data/local/repository/dexie-galaxy-knowledge-snapshot.repository';
import {
  DexieGalaxyPlanetMoonCatalogSnapshotRuntime,
  buildGalaxyPlanetMoonCatalogSnapshot,
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
    atmosphereProjectionVersion: 1,
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

  it('VIDA.9b invalida solo el catálogo V3 PRE-VIDA.5 y reutiliza la nueva proyección efectiva', async () => {
    const v3 = new UniverseGenerationKey(key.universeSeed, GeneratorVersion.V3);
    let stored: GalaxyKnowledgeSnapshotEntity | undefined;
    const repository: GalaxyKnowledgeSnapshotRepository = {
      async get() { return stored; },
      async put(entity) { stored = entity; },
    };
    const builder = vi.fn(() => Object.freeze({
      ...snapshot(),
      identityCoveragePRE3310: 1 as const,
      effectivePhysicalProjectionVIDA5: 2 as const,
    }));
    const known = [new KnownDiscovery(v3, system, DiscoveryState.CONFIRMED)];
    const first = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository, () => 1, builder);
    await first.resolve(v3, 0n, known);
    expect(builder).toHaveBeenCalledTimes(1);
    if (stored?.planetMoonCatalogJson === undefined) throw Error('Catálogo no almacenado');
    // Existing players have a complete V3 legacy projection, but its air/heat
    // columns predate the biological state. Keep other entity fields untouched.
    const previous = JSON.parse(stored.planetMoonCatalogJson) as Record<string,unknown>;
    delete previous['effectivePhysicalProjectionVIDA5'];
    stored = {...stored, planetMoonCatalogJson: JSON.stringify(previous)};
    const migrated = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository, () => 2, builder);
    await migrated.resolve(v3, 0n, known);
    expect(builder).toHaveBeenCalledTimes(2);
    expect(stored?.planetMoonCatalogJson).toContain('effectivePhysicalProjectionVIDA5');
    const subsequent = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository, () => 3, builder);
    const restored = await subsequent.resolve(v3, 0n, known);
    expect(builder).toHaveBeenCalledTimes(2);
    expect(restored.effectivePhysicalProjectionVIDA5).toBe(2);
    expect(restored.planets[0]?.locator).toBeInstanceOf(BodyLocator);
  });

  it('reconstruye una revisión V3 VIDA.5=1 exactamente una vez a revisión 2', async()=>{
    const v3=new UniverseGenerationKey(key.universeSeed,GeneratorVersion.V3);
    let stored:GalaxyKnowledgeSnapshotEntity|undefined;
    const repository:GalaxyKnowledgeSnapshotRepository={
      async get(){return stored;},async put(entity){stored=entity;},
    };
    const builder=vi.fn(()=>Object.freeze({...snapshot(),
      identityCoveragePRE3310:1 as const,effectivePhysicalProjectionVIDA5:2 as const}));
    const known=[new KnownDiscovery(v3,system,DiscoveryState.CONFIRMED)];
    await new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository,()=>1,builder)
      .resolve(v3,0n,known);
    if(!stored?.planetMoonCatalogJson)throw Error('Fixture catalogue not saved');
    const old={...JSON.parse(stored.planetMoonCatalogJson),effectivePhysicalProjectionVIDA5:1};
    stored={...stored,planetMoonCatalogJson:JSON.stringify(old)};
    const second=await new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository,()=>2,builder)
      .resolve(v3,0n,known);
    expect(second.effectivePhysicalProjectionVIDA5).toBe(2);
    const third=await new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository,()=>3,builder)
      .resolve(v3,0n,known);
    expect(third.effectivePhysicalProjectionVIDA5).toBe(2);
    expect(builder).toHaveBeenCalledTimes(2);
  });

  it('rebuilds old persisted catalogues without the atmosphere projection exactly once',async()=>{
    let stored:GalaxyKnowledgeSnapshotEntity|undefined;
    const repo:GalaxyKnowledgeSnapshotRepository={async get(){return stored;},async put(entity){stored=entity;}};
    const builder=vi.fn(()=>snapshot());
    const known=[new KnownDiscovery(key,system,DiscoveryState.CONFIRMED)];
    const first=new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repo,Date.now,builder);
    await first.resolve(key,0n,known);
    expect(builder).toHaveBeenCalledTimes(1);
    // Simulate the previously persisted, fully known but chemistry-free schema.
    if(stored===undefined)return;
    const old=JSON.parse(stored.planetMoonCatalogJson!) as Record<string,unknown>;
    delete old['atmosphereProjectionVersion'];
    stored={...stored,planetMoonCatalogJson:JSON.stringify(old)};
    const second=new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repo,Date.now,builder);
    await second.resolve(key,0n,known);
    expect(builder).toHaveBeenCalledTimes(2);
    const third=new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repo,Date.now,builder);
    await third.resolve(key,0n,known);
    expect(builder).toHaveBeenCalledTimes(2);
  });

});

// VIDA.0: the public catalogue must resolve without any biological side effects.
describe('VIDA.0 catalog isolation', () => {
  it('materializes a V3 catalogue without scheduling legacy abiogenesis', async () => {
    const v3 = new UniverseGenerationKey(key.universeSeed, GeneratorVersion.V3);
    const builder = vi.fn(() => snapshot());
    const repository: GalaxyKnowledgeSnapshotRepository = {
      get: vi.fn(async () => undefined),
      put: vi.fn(async () => {}),
    };
    const runtime = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(repository, () => 10, builder);
    const known = [new KnownDiscovery(v3, system, DiscoveryState.CONFIRMED)];
    const result = await runtime.resolve(v3, 0n, known);
    expect(result.planets).toHaveLength(1);
    expect(result.moons).toHaveLength(1);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(repository.put).toHaveBeenCalledTimes(1);
  });
});


describe('VIDA.9: catálogo no bloqueante con revelación total', () => {
  const v3Key = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'), GeneratorVersion.V3);
  const confirmed = [new KnownDiscovery(v3Key, system, DiscoveryState.CONFIRMED)];
  const repository = (): GalaxyKnowledgeSnapshotRepository => ({
    get: vi.fn(async () => undefined),
    put: vi.fn(async () => undefined),
  });

  it('devuelve el catálogo inmediatamente, materializa una sola vez y no espera al indexador', async () => {
    let release!: () => void;
    const blocked = new Promise<void>(resolve => { release = resolve; });
    const ensureConfirmedCatalog = vi.fn(async () => {
      await blocked;
      return { indexed: 1, withoutPhysicalModel: 0 };
    });
    const runtime = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(
      repository(), () => 456, () => snapshot(), { ensureConfirmedCatalog });
    const revealed = await runtime.resolve(v3Key, 0n, confirmed);
    expect(revealed.planets).toHaveLength(1);
    expect(revealed.moons).toHaveLength(1);
    await vi.waitFor(() => expect(ensureConfirmedCatalog).toHaveBeenCalledTimes(1));
    // Still awaiting private biology: a public re-read must be immediate.
    expect(await runtime.resolve(v3Key, 0n, confirmed)).toBe(revealed);
    expect(ensureConfirmedCatalog).toHaveBeenCalledTimes(1);
    release();
    // Let the queued promise fully settle and release its pending marker.
    await new Promise(resolve => setTimeout(resolve, 0));
    await runtime.resolve(v3Key, 0n, confirmed);
    expect(ensureConfirmedCatalog).toHaveBeenCalledTimes(1);
  });

  it('nunca precalcula VIDA.9 para V2 o sistemas sin confirmar', async () => {
    const ensureConfirmedCatalog = vi.fn(async () => ({ indexed: 0, withoutPhysicalModel: 0 }));
    const runtime = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(
      repository(), () => 123, () => snapshot(), { ensureConfirmedCatalog });
    await runtime.resolve(key, 0n, [new KnownDiscovery(key, system, DiscoveryState.CONFIRMED)]);
    await runtime.resolve(v3Key, 0n, [new KnownDiscovery(v3Key, system, DiscoveryState.CATALOGUED)]);
    expect(ensureConfirmedCatalog).not.toHaveBeenCalled();
  });

  it('un fallo privado no bloquea y permite reintentar la misma revisión', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const ensureConfirmedCatalog = vi.fn()
        .mockRejectedValueOnce(new Error('TEMPORARY_DB_ERROR'))
        .mockResolvedValue({ indexed: 1, withoutPhysicalModel: 0 });
      const runtime = new DexieGalaxyPlanetMoonCatalogSnapshotRuntime(
        repository(), () => 789, () => snapshot(), { ensureConfirmedCatalog });
      const first = await runtime.resolve(v3Key, 0n, confirmed);
      await vi.waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(await runtime.resolve(v3Key, 0n, confirmed)).toBe(first);
      await vi.waitFor(() => expect(ensureConfirmedCatalog).toHaveBeenCalledTimes(2));
    } finally {
      consoleError.mockRestore();
    }
  });
});

// A historical player's Phiater B-2 record (B12) is NOT a generated test
// fixture: its persisted system seed/identity is not recreated by asserting
// one arbitrary locator in an isolated test. Verify the public V3 resolution
// boundary without inventing a planet or silently accepting PRE-VIDA.5.
describe('VIDA.9b — V3 public catalogue never invokes the legacy planet resolver', () => {
  it('projects confirmed V3 without passing a V3 key into the V1-only resolver', () => {
    const generationKey = new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
      GeneratorVersion.V3,
    );
    const system = new SystemLocator(0n, 94489280510n, 0n);
    const legacy = vi.spyOn(PlanetScientificTargetResolver, 'resolveDetailed')
      .mockImplementation(() => { throw Error('Legacy planet resolver was invoked'); });
    try {
      const result = buildGalaxyPlanetMoonCatalogSnapshot(
        generationKey, 0n, [new KnownDiscovery(generationKey, system, DiscoveryState.CONFIRMED)],
      );
      expect(result.atmosphereProjectionVersion).toBe(1);
      expect(result.effectivePhysicalProjectionVIDA5).toBe(2);
      for (const planet of result.planets) {
        if (planet.locator !== null && planet.orbitClass !== 'COMPACT_HOST') {
          // V3 never falls back to the prebiotic atmosphere on unresolved targets.
          expect(planet.meanSurfaceTemperatureKelvin === null ||
            Number.isFinite(planet.meanSurfaceTemperatureKelvin)).toBe(true);
          expect(planet.atmosphere === null || planet.atmosphere?.conditional === false).toBe(true);
        }
      }
      expect(legacy).not.toHaveBeenCalled();
    } finally {
      legacy.mockRestore();
    }
  }, 30_000);
});
