import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { type KnownDiscovery } from '../../domain/discovery/known-discovery';
import {
  type GalaxyKnownWaterMoon,
  type GalaxyKnownWaterMoonIndex,
  type GalaxyKnownWaterMoonSystem,
  hasGalaxyKnownWaterMoonSubsurfaceOceanEvidence,
  isGalaxyKnownWaterMoonSurfaceLiquidPotential,
} from '../../domain/exploration/galaxy-known-water-moon-index';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  type GeneratedMultipleHost,
  type GeneratedSingleHost,
  StellarMultihostFormation,
} from '../stellar/stellar-multihost-formation';
import { StellarMultihostPublicTargetIndex } from '../stellar/stellar-multihost-public-target-index';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import {
  stellarMultihostPublicMoonDesignation,
  stellarMultihostPublicPlanetDesignation,
} from '../stellar/stellar-multihost-public-designation';

const SIGNED_LONG_MAX = (1n << 63n) - 1n;

/**
 * Point-26.1c lunar extension: knowledge-safe locator index for already-known
 * moons with either >=40% surface-liquid-water potential or evidence of a
 * subsurface ocean.
 *
 * It mirrors the 26.1b disclosure boundary: only persisted CONFIRMED systems
 * may materialize their already-public moon catalogue. Minor/uncharacterized
 * moons are intentionally absent because they have no detailed phase-21 water
 * state and no individual scientific fiche.
 */
export class GalaxyKnownWaterMoonIndexEngine {
  private constructor() {}

  static build(
    generationKey: UniverseGenerationKey,
    galaxyIndex: bigint,
    galaxyState: DiscoveryStateValue,
    knownDiscoveries: readonly KnownDiscovery[],
  ): GalaxyKnownWaterMoonIndex {
    if (galaxyIndex < 0n || galaxyIndex > SIGNED_LONG_MAX) {
      throw new RangeError(`galaxyIndex must be a non-negative signed Long: ${galaxyIndex}.`);
    }

    const canonicalState = DiscoveryState.fromCode(galaxyState.code);
    if (!DiscoveryState.isKnown(canonicalState)) {
      throw new RangeError('GalaxyKnownWaterMoonIndexEngine requires a known galaxy.');
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

    const systems: GalaxyKnownWaterMoonSystem[] = [];
    for (const locator of uniqueConfirmedSystems.values()) {
      const projected = projectConfirmedSystem(generationKey, locator);
      if (projected.moons.length > 0) systems.push(projected);
    }

    systems.sort(compareSystems);

    let totalUniqueMoons = 0n;
    let surfaceLiquidPotentialMoonCount = 0n;
    let subsurfaceOceanEvidenceMoonCount = 0n;

    for (const system of systems) {
      totalUniqueMoons += BigInt(system.moons.length);
      for (const moon of system.moons) {
        if (moon.surfaceLiquidPotentialAtLeast40Percent) surfaceLiquidPotentialMoonCount += 1n;
        if (moon.subsurfaceOceanEvidence) subsurfaceOceanEvidenceMoonCount += 1n;
      }
    }

    return Object.freeze({
      galaxyIndex,
      systems: Object.freeze(systems),
      totalUniqueMoons,
      surfaceLiquidPotentialMoonCount,
      subsurfaceOceanEvidenceMoonCount,
    });
  }
}

function projectConfirmedSystem(
  generationKey: UniverseGenerationKey,
  locator: SystemLocator,
): GalaxyKnownWaterMoonSystem {
  const physicalKey = multihostPhysicalSourceKey(generationKey);
  const designation = StellarDesignationGenerator.generate(physicalKey, locator).name;
  const multiple = StellarMultihostFormation.generateOrNull(generationKey, locator);

  if (multiple !== null) {
    return projectMultipleSystem(designation, locator, multiple);
  }

  const single = StellarMultihostFormation.generateSingleOrNull(generationKey, locator);
  if (single === null) {
    throw new Error('CONFIRMED stellar system could not resolve its physical host for lunar 26.1c.');
  }

  const moons: GalaxyKnownWaterMoon[] = [];
  for (let planetIndex = 0; planetIndex < single.planets.length; planetIndex += 1) {
    const planet = single.planets[planetIndex];
    const moonSystem = single.moonSystems[planetIndex];
    if (planet === undefined || moonSystem === undefined || moonSystem.hostPlanet !== planet) {
      throw new Error('CONFIRMED SINGLE lunar projection has inconsistent planet/moon-system ordering.');
    }

    for (const moon of moonSystem.relevantMoons) {
      const projected = projectMoon(
        moon.identity.locator,
        `${planet.designation.name} ${moonRomanNumeralV1(moon.moonOrdinal)}`,
        planet.designation.name,
        'A',
        'SINGLE_HOST',
        moon.environmentState.surfaceLiquidWaterPotentialIndex01,
        moon.environmentState.subsurfaceOceanPotentialIndex01,
        moon.environmentState.waterRegime,
      );
      if (projected !== null) moons.push(projected);
    }
  }

  return Object.freeze({
    locator,
    designation,
    multiplicity: 'SINGLE',
    moons: Object.freeze(moons),
  });
}

function projectMultipleSystem(
  systemDesignation: string,
  locator: SystemLocator,
  multiple: GeneratedMultipleHost,
): GalaxyKnownWaterMoonSystem {
  const publicIndex = StellarMultihostPublicTargetIndex.build(multiple);
  const moons: GalaxyKnownWaterMoon[] = [];

  for (const publicMoon of publicIndex.moons) {
    const moon = publicMoon.relevantMoon;
    if (moon === null) continue;

    const hostLabel = publicMoon.parent.host;
    const hostPlanetDesignation = stellarMultihostPublicPlanetDesignation(
      systemDesignation, hostLabel, publicMoon.parent.sourcePlanetOrdinal,
    );
    const designation = stellarMultihostPublicMoonDesignation(
      systemDesignation, hostLabel, publicMoon.parent.sourcePlanetOrdinal, moon.moonOrdinal,
    );

    const projected = projectMoon(
      publicMoon.publicLocator,
      designation,
      hostPlanetDesignation,
      hostLabel,
      hostLabel === 'AB' ? 'P_TYPE' : 'S_TYPE',
      moon.environmentState.surfaceLiquidWaterPotentialIndex01,
      moon.environmentState.subsurfaceOceanPotentialIndex01,
      moon.environmentState.waterRegime,
    );
    if (projected !== null) moons.push(projected);
  }

  return Object.freeze({
    locator,
    designation: systemDesignation,
    multiplicity: multiple.multiplicity.name,
    moons: Object.freeze(moons),
  });
}

function projectMoon(
  locator: GalaxyKnownWaterMoon['locator'],
  designation: string,
  hostPlanetDesignation: string,
  hostLabel: GalaxyKnownWaterMoon['hostLabel'],
  orbitClass: GalaxyKnownWaterMoon['orbitClass'],
  surfaceLiquidWaterPotentialIndex01: number,
  subsurfaceOceanPotentialIndex01: number,
  waterRegime: GalaxyKnownWaterMoon['waterRegime'],
): GalaxyKnownWaterMoon | null {
  const surfaceLiquidPotentialAtLeast40Percent =
    isGalaxyKnownWaterMoonSurfaceLiquidPotential(surfaceLiquidWaterPotentialIndex01);
  const subsurfaceOceanEvidence =
    hasGalaxyKnownWaterMoonSubsurfaceOceanEvidence(waterRegime);

  if (!surfaceLiquidPotentialAtLeast40Percent && !subsurfaceOceanEvidence) return null;

  return Object.freeze({
    locator,
    designation,
    hostPlanetDesignation,
    hostLabel,
    orbitClass,
    surfaceLiquidWaterPotentialIndex01,
    subsurfaceOceanPotentialIndex01,
    waterRegime,
    surfaceLiquidPotentialAtLeast40Percent,
    subsurfaceOceanEvidence,
  });
}

function emptyIndex(galaxyIndex: bigint): GalaxyKnownWaterMoonIndex {
  return Object.freeze({
    galaxyIndex,
    systems: Object.freeze([]),
    totalUniqueMoons: 0n,
    surfaceLiquidPotentialMoonCount: 0n,
    subsurfaceOceanEvidenceMoonCount: 0n,
  });
}

function systemKey(locator: SystemLocator): string {
  return `${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
}

function compareSystems(
  left: GalaxyKnownWaterMoonSystem,
  right: GalaxyKnownWaterMoonSystem,
): number {
  if (left.locator.sectorKey !== right.locator.sectorKey) {
    return left.locator.sectorKey < right.locator.sectorKey ? -1 : 1;
  }
  if (left.locator.galacticObjectIndex !== right.locator.galacticObjectIndex) {
    return left.locator.galacticObjectIndex < right.locator.galacticObjectIndex ? -1 : 1;
  }
  return 0;
}
