import { vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { DiscoveryTargetType } from '../../domain/discovery/discovery-target-type';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type DiscoveryRepository } from '../../domain/repository/genesis-repositories';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxyDiscoveryReadCacheRuntime } from './galaxy-discovery-read-cache.runtime';

const generationKey = new UniverseGenerationKey(
  UniverseSeed.parse('1234-5678-90AB-CDEF-1234-5678-90AB-CDEF'),
  GeneratorVersion.V3,
);

function repoWithoutOptionalGalaxyQuery() {
  const discoveries = [
    new KnownDiscovery(generationKey, new GalaxyLocator(0n), DiscoveryState.CONFIRMED),
    new KnownDiscovery(generationKey, new SystemLocator(0n, 1n, 2n), DiscoveryState.CONFIRMED),
    new KnownDiscovery(generationKey, new GalaxyLocator(1n), DiscoveryState.CONFIRMED),
  ];
  const getKnownDiscoveries = vi.fn(async () => discoveries);
  const source: DiscoveryRepository = {
    getState: async () => DiscoveryState.CONFIRMED,
    setState: async () => undefined,
    getKnownDiscoveries,
    getKnownDiscoveriesInSector: async () => [],
  };
  return { source, getKnownDiscoveries };
}

describe('CACHE-GAL.1a · consulta galáctica alternativa sin método opcional', () => {
  it('filtra por galaxia y tipo real de locator sin invocar nombres inexistentes', async () => {
    const { source, getKnownDiscoveries } = repoWithoutOptionalGalaxyQuery();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source);
    const galaxy = await cache.getKnownDiscoveriesInGalaxy(
      generationKey, 0n, DiscoveryTargetType.GALAXY.code,
    );
    const systems = await cache.getKnownDiscoveriesInGalaxy(
      generationKey, 0n, DiscoveryTargetType.SYSTEM.code,
    );
    const empty = await cache.getKnownDiscoveriesInGalaxy(
      generationKey, 1n, DiscoveryTargetType.SYSTEM.code,
    );
    expect(galaxy).toHaveLength(1);
    expect(galaxy[0]?.locator).toBeInstanceOf(GalaxyLocator);
    expect(systems).toHaveLength(1);
    expect(systems[0]?.locator).toBeInstanceOf(SystemLocator);
    expect(empty).toHaveLength(0);
    expect(getKnownDiscoveries).toHaveBeenCalledTimes(1);
  });

  it('conserva el filtrado cuando se llama dentro de una transacción', async () => {
    const { source } = repoWithoutOptionalGalaxyQuery();
    const cache = new GalaxyDiscoveryReadCacheRuntime(source, () => true);
    const result = await cache.getKnownDiscoveriesInGalaxy(
      generationKey, 0n, DiscoveryTargetType.SYSTEM.code,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.locator).toBeInstanceOf(SystemLocator);
  });
});
