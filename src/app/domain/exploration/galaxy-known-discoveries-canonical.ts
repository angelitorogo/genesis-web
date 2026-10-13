import { DiscoveryState } from '../discovery/discovery-state';
import { type KnownDiscovery } from '../discovery/known-discovery';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';
import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SectorLocator,
  SystemLocator,
  type ProceduralLocator,
} from '../generation/procedural-locator';

/**
 * 31.5: a knowledge read-model may receive repeated rows for one persisted
 * target (e.g. after synchronizing two discovery revisions). The most
 * advanced KNOWN state wins independently of repository iteration order.
 *
 * This is a view-only canonicalization. It neither promotes discovery state
 * nor regenerates/probes targets outside the supplied known rows.
 */
export function canonicalGalaxyKnownDiscoveries(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  discoveries: readonly KnownDiscovery[],
): readonly KnownDiscovery[] {
  const byTarget = new Map<string, KnownDiscovery>();
  for (const discovery of discoveries) {
    if (!discovery.generationKey.equals(generationKey)) {
      throw new RangeError('Known discovery belongs to a different universe generation.');
    }
    if (discovery.locator.galaxyIndex !== galaxyIndex ||
        !DiscoveryState.isKnown(discovery.state)) continue;
    const identity = knownLocatorIdentity(discovery.locator);
    const current = byTarget.get(identity);
    if (current === undefined || discovery.state.code > current.state.code) {
      byTarget.set(identity, discovery);
    }
  }
  return Object.freeze([...byTarget.values()]);
}

function knownLocatorIdentity(locator: ProceduralLocator): string {
  if (locator instanceof GalaxyLocator) return `G:${locator.galaxyIndex}`;
  if (locator instanceof SectorLocator) return `S:${locator.galaxyIndex}:${locator.sectorKey}`;
  if (locator instanceof GalacticObjectLocator) {
    return `O:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
  }
  if (locator instanceof SystemLocator) {
    return `Y:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
  }
  if (locator instanceof BodyLocator) {
    return `B:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}:${locator.bodyIndex}`;
  }
  if (locator instanceof CivilizationLocator) {
    return `C:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}:${locator.bodyIndex}:${locator.civilizationIndex}`;
  }
  const exhaustive: never = locator;
  throw new TypeError(`Unsupported known-discovery locator ${String(exhaustive)}`);
}
