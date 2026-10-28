/**
 * VIDA.9b — public V3 planet/moon sources for background biological indexing.
 *
 * V3 identifiers are aliases for already-generated physical sources.  The
 * legacy PlanetScientificTargetResolver.resolveDetailed(key, locator) cannot
 * accept a public V3 key; use the same SINGLE/MULTIHOST adapters as the
 * scientific fiche and never reinterpret a public ordinal as a V1 body.
 * This module is read-only and never changes discovery state or IndexedDB.
 */
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, type SystemLocator } from '../../domain/generation/procedural-locator';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
import { MoonScientificTargetResolver, type MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { PlanetScientificTargetResolver, type PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { multihostPhysicalSourceKey } from '../../simulation/stellar/stellar-multihost-physical-source-key';

export interface Vida9V3ConfirmedPhysicalTargets {
  readonly planetCount: number;
  readonly resolvePlanet: (locator: BodyLocator) => PlanetScientificResolvedTarget | null;
  readonly resolveMoon: (locator: BodyLocator, moonIndex: bigint) => MoonScientificResolvedTarget | null;
}

function belongsToSystem(body: BodyLocator, system: SystemLocator): boolean {
  return body.galaxyIndex === system.galaxyIndex &&
    body.sectorKey === system.sectorKey &&
    body.galacticObjectIndex === system.galacticObjectIndex;
}

export function vida9V3ConfirmedPhysicalTargets(
  key: UniverseGenerationKey,
  system: SystemLocator,
): Vida9V3ConfirmedPhysicalTargets | null {
  if (key.generatorVersion !== GeneratorVersion.V3) return null;
  // Compact remnants have no full V3 planetary/biological scientific contract.
  if (CompactHostPlanetarySystemGenerator.generateOrNull(key, system) !== null) return null;

  const multiple = StellarMultihostFormation.generateOrNull(key, system);
  if (multiple !== null) {
    const scientific = new StellarMultihostScientificTargetResolver(multiple);
    const cache = new Map<string, PlanetScientificResolvedTarget | null>();
    const resolvePlanet = (loc: BodyLocator): PlanetScientificResolvedTarget | null => {
      if (!belongsToSystem(loc, system) || loc.bodyIndex < 0n ||
        loc.bodyIndex >= BigInt(multiple.publicPlanets.length)) return null;
      const id = loc.bodyIndex.toString();
      if (cache.has(id)) return cache.get(id)!;
      const result = scientific.resolveDetailed(key, loc);
      cache.set(id, result);
      return result;
    };
    return {
      planetCount: multiple.publicPlanets.length,
      resolvePlanet,
      resolveMoon: (loc, moonIndex) => {
        if (!belongsToSystem(loc, system) || loc.bodyIndex < 0n ||
          loc.bodyIndex >= BigInt(multiple.publicPlanets.length)) return null;
        return scientific.resolveMoonDetailed(key, loc, moonIndex);
      },
    };
  }

  const single = StellarMultihostFormation.generateSingleOrNull(key, system);
  if (single === null || single.planetarySystem === null) return null;
  const designation = StellarDesignationGenerator.generate(multihostPhysicalSourceKey(key), system).name;
  const cache = new Map<string, PlanetScientificResolvedTarget | null>();
  const resolvePlanet = (loc: BodyLocator): PlanetScientificResolvedTarget | null => {
    if (!belongsToSystem(loc, system) || loc.bodyIndex < 0n ||
      loc.bodyIndex >= BigInt(single.planets.length)) return null;
    const id = loc.bodyIndex.toString();
    if (cache.has(id)) return cache.get(id)!;
    const index = Number(loc.bodyIndex);
    const planet = single.planets[index];
    const atmosphere = single.atmospheres[index];
    const moonSystem = single.moonSystems[index];
    const name = single.planetarySystem!.planetDesignations[index]?.name;
    if (!planet || !atmosphere || !moonSystem || !name ||
      atmosphere.hostPlanet !== planet || moonSystem.hostPlanet !== planet) {
      throw new Error('VIDA.9 SINGLE physical sources are inconsistent with the public planet identity.');
    }
    const resolved = PlanetScientificTargetResolver.projectGenerated(Object.freeze({
      locator: loc, planetOrdinal: index + 1, designation: name,
      hostSystemDesignation: designation,
      orbitTopology: single.planetarySystem!.architecture.orbitTopology,
      hostPlanetCount: single.planets.length,
    }), planet, atmosphere, moonSystem, Object.freeze({
      physical: single.physical, lifetime: single.lifetime,
    }), undefined, key.generatorVersionCode);
    cache.set(id, resolved);
    return resolved;
  };
  return {
    planetCount: single.planets.length,
    resolvePlanet,
    resolveMoon: (loc, moonIndex) => belongsToSystem(loc, system)
      ? MoonScientificTargetResolver.resolveDetailed(key, loc, moonIndex,
          { resolveDetailed: (_key, body) => resolvePlanet(body) })
      : null,
  };
}
