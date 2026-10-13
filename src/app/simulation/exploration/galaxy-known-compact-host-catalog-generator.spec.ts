import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE, projectGalaxyCompactHostKnowledge } from
  '../../domain/exploration/galaxy-compact-host-knowledge';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactHostPlanetarySystemGenerator } from '../planetary/compact-host-planetary-system-generator';
import { generateKnownCompactHostCatalog } from './galaxy-known-compact-host-catalog-generator';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2,
);

function findCompact(): SystemLocator {
  for (let i = 0n; i < 5000n; i++) {
    const locator = new SystemLocator(0n, 0n, i);
    if (CompactHostPlanetarySystemGenerator.generateOrNull(key, locator)) return locator;
  }
  throw new Error('No deterministic compact candidate in fixture range.');
}

describe('31.2 known compact catalogue projection (not activated in runtime yet)', () => {
  it('never materializes undiscovered or merely DISCOVERED systems', () => {
    const locator = findCompact();
    const rows = [new KnownDiscovery(key, locator, DiscoveryState.DISCOVERED)];
    expect(generateKnownCompactHostCatalog(key, 0n, rows)).toEqual([]);
    expect(projectGalaxyCompactHostKnowledge(key, 0n, rows, [])).toEqual(EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE);
  });

  it('deduplicates known locators and produces 31.1 counts only after CATALOGUED', () => {
    const locator = findCompact();
    const rows = [new KnownDiscovery(key, locator, DiscoveryState.CATALOGUED),
      new KnownDiscovery(key, locator, DiscoveryState.CONFIRMED),
      new KnownDiscovery(key, new SystemLocator(2n, 0n, locator.galacticObjectIndex), DiscoveryState.CONFIRMED)];
    const catalogue = generateKnownCompactHostCatalog(key, 0n, rows);
    expect(catalogue.length).toBe(1);
    expect(Object.isFrozen(catalogue)).toBe(true);
    const counts = projectGalaxyCompactHostKnowledge(key, 0n, rows, catalogue.map(s => s.host));
    expect(catalogue[0]!.planets !== null).toBe(true);
    expect(counts.total).toBe(1n);
    expect(counts.neutronStars + counts.pulsars + counts.millisecondPulsars +
      counts.magnetars + counts.stellarMassBlackHoles).toBe(1n);
    expect(generateKnownCompactHostCatalog(key, 1n, rows)).toEqual([]);
    const catalogued = generateKnownCompactHostCatalog(key, 0n,
      [new KnownDiscovery(key, locator, DiscoveryState.CATALOGUED)]);
    expect(catalogued[0]!.host.type).toBe(catalogue[0]!.host.type);
    expect(catalogued[0]!.planets).toBeNull();
  });
});
