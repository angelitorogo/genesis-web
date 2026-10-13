import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type CompactHostPlanet } from '../../domain/planetary/compact-host-planetary-system';
import { type CompactPlanetaryHost } from '../../domain/stellar/compact-planetary-host';
import { CompactHostPlanetarySystemGenerator } from '../planetary/compact-host-planetary-system-generator';

/** Disclosure-safe preview for 31.4; planet bodies remain hidden until CONFIRMED. */
export interface KnownCompactHostEntry {
  readonly host: CompactPlanetaryHost;
  readonly planets: readonly CompactHostPlanet[] | null;
}

/**
 * Knowledge-safe adapter for stage 31.4. Never scans undiscovered sectors.
 * CATALOGUED reveals compact host class only; CONFIRMED also reveals planets.
 * This is not connected to the active conventional fiche until 31.4 builds
 * a matching compact-host scientific/visual route.
 */
export function generateKnownCompactHostCatalog(
  key: UniverseGenerationKey,
  galaxyIndex: bigint,
  discoveries: readonly KnownDiscovery[],
): readonly KnownCompactHostEntry[] {
  const known = new Map<string, { locator: SystemLocator; stateCode: number }>();
  for (const discovery of discoveries) {
    if (!discovery.generationKey.equals(key) ||
        !(discovery.locator instanceof SystemLocator) ||
        discovery.locator.galaxyIndex !== galaxyIndex ||
        discovery.state.code < DiscoveryState.CATALOGUED.code) continue;
    const locator = discovery.locator;
    const id = `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
    const previous = known.get(id);
    if (previous === undefined || previous.stateCode < discovery.state.code) {
      known.set(id, { locator, stateCode: discovery.state.code });
    }
  }

  const result: KnownCompactHostEntry[] = [];
  for (const { locator, stateCode } of known.values()) {
    const system = CompactHostPlanetarySystemGenerator.generateOrNull(key, locator);
    if (system === null) continue;
    result.push(Object.freeze({
      host: system.host,
      planets: stateCode >= DiscoveryState.CONFIRMED.code ? system.planets : null,
    }));
  }
  return Object.freeze(result);
}
