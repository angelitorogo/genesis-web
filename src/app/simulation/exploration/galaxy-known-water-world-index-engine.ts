import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import {
  type GalaxyKnownWaterWorld,
  type GalaxyKnownWaterWorldIndex,
  type GalaxyKnownWaterWorldSystem,
  isGalaxyKnownWaterWorldCoverage,
} from '../../domain/exploration/galaxy-known-water-world-index';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type GeneratedPublicPlanet, StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { stellarMultihostPublicPlanetDesignation } from '../stellar/stellar-multihost-public-designation';

const SIGNED_LONG_MAX = (1n << 63n) - 1n;

/**
 * Point-26.1c knowledge-safe locator index for already-known water-rich worlds.
 *
 * It never scans unknown sectors or unknown systems. Only a persisted CONFIRMED
 * SystemLocator may materialize its already-public planetary catalogue, exactly
 * like 26.1b. The returned BodyLocators are the same public route identities
 * consumed by 26.3/26.5 and never expose private B/C/P generation scopes.
 */
export class GalaxyKnownWaterWorldIndexEngine {
  private constructor() {}

  static build(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): GalaxyKnownWaterWorldIndex {
    if (galaxyIndex < 0n || galaxyIndex > SIGNED_LONG_MAX) {
      throw new RangeError(`galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`);
    }

    const canonicalState = DiscoveryState.fromCode(galaxyState.code);
    if (!DiscoveryState.isKnown(canonicalState)) {
      throw new RangeError('GalaxyKnownWaterWorldIndexEngine requires a known galaxy.');
    }

    if (canonicalState.code < DiscoveryState.DISCOVERED.code) {
      return emptyIndex(galaxyIndex);
    }

    const uniqueConfirmedSystems = new Map<string, SystemLocator>();
    for (const discovery of knownDiscoveries) {
      if (
        DiscoveryState.isKnown(discovery.state) &&
        discovery.state.code >= DiscoveryState.CONFIRMED.code &&
        discovery.locator instanceof SystemLocator &&
        discovery.locator.galaxyIndex === galaxyIndex
      ) {
        uniqueConfirmedSystems.set(systemKey(discovery.locator), discovery.locator);
      }
    }

    const systems: GalaxyKnownWaterWorldSystem[] = [];
    for (const locator of uniqueConfirmedSystems.values()) {
      const projected = projectConfirmedSystem(generationKey, locator);
      if (projected.worlds.length > 0) systems.push(projected);
    }

    systems.sort(compareSystems);

    const totalWorlds = systems.reduce(
      (total, system) => total + BigInt(system.worlds.length),
      0n,
    );

    return Object.freeze({
      galaxyIndex,
      systems: Object.freeze(systems),
      totalWorlds,
    });
  }
}

function projectConfirmedSystem(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): GalaxyKnownWaterWorldSystem {
  const physicalKey = multihostPhysicalSourceKey(generationKey);
  const designation = StellarDesignationGenerator.generate(physicalKey, locator).name;
  const multiple = StellarMultihostFormation.generateOrNull(generationKey, locator);

  if (multiple !== null) {
    const worlds = multiple.publicPlanets
      .filter(entry => isGalaxyKnownWaterWorldCoverage(
        entry.atmosphere.surfaceLiquidWaterCoverageFraction01,
      ))
      .map(entry => projectMultipleWorld(designation, entry));

    return Object.freeze({
      locator,
      designation,
      multiplicity: multiple.multiplicity.name,
      worlds: Object.freeze(worlds),
    });
  }

  const single = StellarMultihostFormation.generateSingleOrNull(generationKey, locator);
  if (single === null) {
    throw new Error('CONFIRMED stellar system could not resolve its physical host for 26.1c.');
  }

  const worlds: GalaxyKnownWaterWorld[] = [];
  for (let index = 0; index < single.planets.length; index += 1) {
    const planet = single.planets[index];
    const atmosphere = single.atmospheres[index];
    if (planet === undefined || atmosphere === undefined || atmosphere.hostPlanet !== planet) {
      throw new Error('CONFIRMED SINGLE water-world projection has inconsistent planet/atmosphere ordering.');
    }
    if (!isGalaxyKnownWaterWorldCoverage(atmosphere.surfaceLiquidWaterCoverageFraction01)) continue;

    worlds.push(Object.freeze({
      locator: new BodyLocator(
        locator.galaxyIndex,
        locator.sectorKey,
        locator.galacticObjectIndex,
        BigInt(index),
      ),
      designation: planet.designation.name,
      planetType: planet.planetType,
      surfaceLiquidWaterCoverageFraction01: atmosphere.surfaceLiquidWaterCoverageFraction01,
      hostLabel: 'A',
      orbitClass: 'SINGLE_HOST',
    }));
  }

  return Object.freeze({
    locator,
    designation,
    multiplicity: 'SINGLE',
    worlds: Object.freeze(worlds),
  });
}

function projectMultipleWorld(
  systemDesignation: string,
  entry: GeneratedPublicPlanet,
): GalaxyKnownWaterWorld {
  return Object.freeze({
    locator: entry.publicLocator,
    // Shared public alias contract used by scientific fiches and SystemScene.
    designation: stellarMultihostPublicPlanetDesignation(
      systemDesignation, entry.host, entry.sourcePlanetOrdinal,
    ),
    planetType: entry.planet.planetType,
    surfaceLiquidWaterCoverageFraction01: entry.atmosphere.surfaceLiquidWaterCoverageFraction01!,
    hostLabel: entry.host,
    orbitClass: entry.host === 'AB' ? 'P_TYPE' : 'S_TYPE',
  });
}

function emptyIndex(galaxyIndex: bigint): GalaxyKnownWaterWorldIndex {
  return Object.freeze({ galaxyIndex, systems: Object.freeze([]), totalWorlds: 0n });
}

function systemKey(locator: SystemLocator): string {
  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
}

function compareSystems(
  left: GalaxyKnownWaterWorldSystem,
  right: GalaxyKnownWaterWorldSystem,
): number {
  if (left.locator.sectorKey !== right.locator.sectorKey) {
    return left.locator.sectorKey < right.locator.sectorKey ? -1 : 1;
  }
  if (left.locator.galacticObjectIndex !== right.locator.galacticObjectIndex) {
    return left.locator.galacticObjectIndex < right.locator.galacticObjectIndex ? -1 : 1;
  }
  return 0;
}
