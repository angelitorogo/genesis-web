import { type CompactPlanetaryHost } from '../stellar/compact-planetary-host';
import { ExtremeType } from '../galactic-object/extreme-object-type';
import { DiscoveryState } from '../discovery/discovery-state';
import { type KnownDiscovery } from '../discovery/known-discovery';
import { SystemLocator } from '../generation/procedural-locator';
import { type UniverseGenerationKey } from '../generation/universe-generation-key';

/** Counts are an overlapping subset of Systems, never additional systems. */
export interface GalaxyCompactHostKnowledgeCounts {
  readonly total: bigint;
  readonly neutronStars: bigint;
  readonly pulsars: bigint;
  readonly millisecondPulsars: bigint;
  readonly magnetars: bigint;
  readonly stellarMassBlackHoles: bigint;
}

export const EMPTY_GALAXY_COMPACT_HOST_KNOWLEDGE: GalaxyCompactHostKnowledgeCounts = Object.freeze({
  total: 0n,
  neutronStars: 0n,
  pulsars: 0n,
  millisecondPulsars: 0n,
  magnetars: 0n,
  stellarMassBlackHoles: 0n,
});

function locatorKey(l: SystemLocator): string {
  return `${l.galaxyIndex}:${l.sectorKey}:${l.galacticObjectIndex}`;
}

/**
 * Read-only projection of ALREADY DISCOVERED SystemLocator records. Exact
 * compact taxonomy becomes public at CATALOGUED, as for ExtremeType itself.
 * It does not enumerate hidden systems, materialize worlds or modify storage.
 *
 * 31.2 will supply the canonical compact-host descriptors. Until then no
 * candidate is invented and all five supplementary counters remain zero.
 */
export function projectGalaxyCompactHostKnowledge(
  generationKey: UniverseGenerationKey,
  galaxyIndex: bigint,
  discoveries: readonly KnownDiscovery[],
  hosts: readonly CompactPlanetaryHost[],
): GalaxyCompactHostKnowledgeCounts {
  const known = new Set<string>();
  for (const discovery of discoveries) {
    if (!discovery.generationKey.equals(generationKey) ||
      !(discovery.locator instanceof SystemLocator) ||
      discovery.locator.galaxyIndex !== galaxyIndex ||
      discovery.state.code < DiscoveryState.CATALOGUED.code) continue;
    known.add(locatorKey(discovery.locator));
  }

  const seenSystem = new Set<string>();
  const seenPhysicalExtreme = new Set<string>();
  const byType = {
    neutronStars: 0n,
    pulsars: 0n,
    millisecondPulsars: 0n,
    magnetars: 0n,
    stellarMassBlackHoles: 0n,
  };

  for (const host of hosts) {
    if (!host.generationKey.equals(generationKey)) {
      throw new RangeError('Compact hosts must belong to the requested generation.');
    }
    if (host.systemLocator.galaxyIndex !== galaxyIndex) continue;
    const key = locatorKey(host.systemLocator);
    if (seenSystem.has(key)) {
      throw new RangeError('One system cannot have two compact-host classifications.');
    }
    seenSystem.add(key);
    if (host.extremeObjectLocator !== null) {
      const physical = `${host.extremeObjectLocator.galaxyIndex}:${host.extremeObjectLocator.sectorKey}:${host.extremeObjectLocator.galacticObjectIndex}`;
      if (seenPhysicalExtreme.has(physical)) {
        throw new RangeError('The same physical extreme object cannot host two independent systems.');
      }
      seenPhysicalExtreme.add(physical);
    }
    if (!known.has(key)) continue; // no hidden Ground Truth leakage
    switch (host.type) {
      case ExtremeType.NEUTRON_STAR: byType.neutronStars++; break;
      case ExtremeType.PULSAR: byType.pulsars++; break;
      case ExtremeType.MILLISECOND_PULSAR: byType.millisecondPulsars++; break;
      case ExtremeType.MAGNETAR: byType.magnetars++; break;
      case ExtremeType.STELLAR_MASS_BLACK_HOLE: byType.stellarMassBlackHoles++; break;
    }
  }

  return Object.freeze({
    ...byType,
    total: byType.neutronStars + byType.pulsars + byType.millisecondPulsars + byType.magnetars + byType.stellarMassBlackHoles,
  });
}
