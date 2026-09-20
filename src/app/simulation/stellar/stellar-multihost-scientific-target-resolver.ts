import { BodyLocator, MoonLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  PlanetScientificTargetResolver,
  type PlanetScientificIdentitySource,
  type PlanetScientificResolvedTarget,
} from '../planetary/planet-scientific-target-resolver';
import {
  MoonScientificTargetResolver,
  type MoonScientificResolvedTarget,
} from '../planetary/moon-scientific-target-resolver';
import { StellarDesignationGenerator } from './stellar-designation-generator';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { type GeneratedMultipleHost, type GeneratedPublicPlanet } from './stellar-multihost-formation';
import { StellarMultihostPublicTargetIndex } from './stellar-multihost-public-target-index';

/**
 * Stage 5: read-only bridge from ONE generated physical aggregate to the
 * existing 26.3/26.4/26.5 scientific primitives. The same aggregate must
 * eventually be supplied to the renderer and scientific routes atomically.
 *
 * This resolver deliberately has NO global fallback: it cannot accidentally
 * resolve an internal B/C/P seed or return a legacy V1 body for an unknown
 * public locator. It does not switch any persisted route over by itself.
 */
export class StellarMultihostScientificTargetResolver {
  private readonly index: StellarMultihostPublicTargetIndex;
  private readonly parentDesignation: string;

  /** Adapter for MoonScientificCardAssembler's pre-existing injection seam. */
  readonly moonCardResolver: Readonly<{
    resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint) => MoonScientificResolvedTarget | null;
    resolveHostPlanetDetailed: (key: UniverseGenerationKey, locator: BodyLocator) => PlanetScientificResolvedTarget | null;
  }>;

  constructor(private readonly source: GeneratedMultipleHost) {
    this.index = StellarMultihostPublicTargetIndex.build(source);
    this.parentDesignation = StellarDesignationGenerator.generate(
      multihostPhysicalSourceKey(source.parentGenerationKey), source.parentLocator,
    ).name;
    this.moonCardResolver = Object.freeze({
      resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint) =>
        this.resolveMoonDetailed(key, locator, moonIndex),
      resolveHostPlanetDetailed: (key: UniverseGenerationKey, locator: BodyLocator) =>
        this.resolveDetailed(key, locator),
    });
  }

  resolve(generationKey: UniverseGenerationKey, locator: BodyLocator): PlanetScientificIdentitySource | null {
    const entry = this.findPlanet(generationKey, locator);
    return entry === null ? null : this.identity(entry);
  }

  /** Matches the existing planet card's injectable resolveDetailed contract. */
  resolveDetailed(generationKey: UniverseGenerationKey, locator: BodyLocator): PlanetScientificResolvedTarget | null {
    const entry = this.findPlanet(generationKey, locator);
    if (entry === null) return null;
    return PlanetScientificTargetResolver.projectGenerated(
      this.identity(entry), entry.planet, entry.atmosphere, entry.moonSystem,
    );
  }

  /** Matches the existing moon card's optional host-planet resolver contract. */
  resolveHostPlanetDetailed(
    generationKey: UniverseGenerationKey, locator: BodyLocator,
  ): PlanetScientificResolvedTarget | null {
    return this.resolveDetailed(generationKey, locator);
  }

  /** Moon index is local to its public host planet; minor moons lack detailed data. */
  resolveMoonDetailed(
    generationKey: UniverseGenerationKey, planetLocator: BodyLocator, moonIndex: bigint,
  ): MoonScientificResolvedTarget | null {
    if (!this.matchesKey(generationKey) || moonIndex < 0n || moonIndex > BigInt(Number.MAX_SAFE_INTEGER) ||
      this.index.resolvePlanet(planetLocator) === null) return null;
    const publicMoon = this.index.resolveMoon(new MoonLocator(
      planetLocator.galaxyIndex, planetLocator.sectorKey, planetLocator.galacticObjectIndex,
      planetLocator.bodyIndex, moonIndex,
    ));
    if (publicMoon === null || publicMoon.relevantMoon === null) return null;
    // Existing moon projection consumes the EXACT same planet's already
    // materialized moon science; there is no second MoonGenerator invocation.
    return MoonScientificTargetResolver.resolveDetailed(
      generationKey, planetLocator, moonIndex,
      { resolveDetailed: (key, locator) => this.resolveDetailed(key, locator) },
    );
  }

  private findPlanet(generationKey: UniverseGenerationKey, locator: BodyLocator): GeneratedPublicPlanet | null {
    if (!this.matchesKey(generationKey)) return null;
    return this.index.resolvePlanet(locator);
  }

  private matchesKey(key: UniverseGenerationKey): boolean {
    return key.equals(this.source.parentGenerationKey);
  }

  private identity(entry: GeneratedPublicPlanet): PlanetScientificIdentitySource {
    return Object.freeze({
      locator: entry.publicLocator,
      planetOrdinal: Number(entry.publicLocator.bodyIndex) + 1,
      // Parent-system names are public aliases. Internal child universe keys,
      // planet seeds and private child system designations never reach cards.
      designation: `${this.parentDesignation} ${entry.host}-${entry.sourcePlanetOrdinal}`,
      hostSystemDesignation: this.parentDesignation,
      orbitTopology: entry.planet.hostPlanetarySystem.architecture.orbitTopology,
      hostPlanetCount: this.index.planets.length,
    });
  }
}
