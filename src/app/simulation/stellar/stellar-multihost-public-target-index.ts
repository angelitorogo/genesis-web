import { BodyLocator, MoonLocator, type SystemLocator } from '../../domain/generation/procedural-locator';
import { type MoonIdentity } from '../../domain/planetary/moon-identity';
import { type RelevantMoon } from '../../domain/planetary/relevant-moon';
import { type GeneratedMultipleHost, type GeneratedPublicPlanet } from './stellar-multihost-formation';

/**
 * One moon's public *address*, not a new MoonIdentity or MoonSeed.
 * Existing phase-21 entities retain their private A/B/C/P generation lineage.
 * Only the parent-system locator is appropriate for a future public route.
 */
export interface GeneratedPublicMoon {
  readonly publicLocator: MoonLocator;
  readonly parent: GeneratedPublicPlanet;
  readonly sourceIdentity: MoonIdentity;
  readonly relevantMoon: RelevantMoon | null;
}

/**
 * Read-only, zero-regeneration lookup for the stage-3 physical aggregate.
 * Public addresses are contiguous by parent planet; moon indices stay local
 * to each parent. This boundary deliberately does NOT activate V1 routes or
 * reinterpret pre-existing saves. Public addresses are not yet public seeds.
 */
export class StellarMultihostPublicTargetIndex {
  readonly planets: readonly GeneratedPublicPlanet[];
  readonly moons: readonly GeneratedPublicMoon[];
  private readonly moonSlots: readonly (readonly GeneratedPublicMoon[])[];
  private readonly parentLocator: SystemLocator;

  private constructor(source: GeneratedMultipleHost) {
    this.parentLocator = source.parentLocator;
    const slots: (readonly GeneratedPublicMoon[])[] = [];
    const moons: GeneratedPublicMoon[] = [];

    for (const [planetIndex, entry] of source.publicPlanets.entries()) {
      if (!matchesSystem(entry.publicLocator, source.parentLocator) ||
        entry.publicLocator.bodyIndex !== BigInt(planetIndex) ||
        entry.planet.planetOrdinal !== entry.sourcePlanetOrdinal ||
        entry.atmosphere.hostPlanet !== entry.planet ||
        entry.moonSystem.hostPlanet !== entry.planet) {
        throw new Error('Multihost catalog has inconsistent public planet identity.');
      }
      const identities = entry.moonSystem.moonIdentities;
      const relevant = entry.moonSystem.relevantMoons;
      if (identities.length !== entry.moonSystem.moonCount ||
        relevant.length !== entry.moonSystem.relevantMoonCount) {
        throw new Error('Multihost moon population is incomplete.');
      }
      const relevantByOrdinal = new Map<number, RelevantMoon>(
        relevant.map(moon => [moon.moonOrdinal, moon] as const),
      );
      if (relevantByOrdinal.size !== relevant.length) {
        throw new Error('Multihost relevant moon ordinals are not unique.');
      }

      const siblings = identities.map((identity, moonIndex): GeneratedPublicMoon => {
        const ordinal = moonIndex + 1;
        if (identity.moonOrdinal !== ordinal ||
          identity.locator.moonIndex !== BigInt(moonIndex) ||
          identity.hostPlanetLocator !== entry.planet.locator ||
          identity.hostPlanetSeed !== entry.planet.seed) {
          throw new Error('Multihost moon identity does not belong to its source planet.');
        }
        const relevantMoon = relevantByOrdinal.get(ordinal) ?? null;
        if (relevantMoon !== null && relevantMoon.identity !== identity) {
          throw new Error('Multihost relevant moon identity mismatch.');
        }
        return Object.freeze({
          publicLocator: new MoonLocator(
            source.parentLocator.galaxyIndex, source.parentLocator.sectorKey,
            source.parentLocator.galacticObjectIndex, entry.publicLocator.bodyIndex,
            BigInt(moonIndex),
          ),
          parent: entry,
          sourceIdentity: identity,
          relevantMoon,
        });
      });
      if (relevantByOrdinal.size !== siblings.filter(moon => moon.relevantMoon !== null).length) {
        throw new Error('Multihost relevant moon is outside its modeled population.');
      }
      slots.push(Object.freeze(siblings));
      moons.push(...siblings);
    }

    this.planets = source.publicPlanets;
    this.moonSlots = Object.freeze(slots);
    this.moons = Object.freeze(moons);
    Object.freeze(this);
  }

  static build(source: GeneratedMultipleHost): StellarMultihostPublicTargetIndex {
    return new StellarMultihostPublicTargetIndex(source);
  }

  resolvePlanet(locator: BodyLocator): GeneratedPublicPlanet | null {
    if (!matchesSystem(locator, this.parentLocator) ||
      locator.bodyIndex >= BigInt(this.planets.length)) return null;
    return this.planets[Number(locator.bodyIndex)] ?? null;
  }

  resolveMoon(locator: MoonLocator): GeneratedPublicMoon | null {
    if (!matchesSystem(locator, this.parentLocator) ||
      locator.bodyIndex >= BigInt(this.moonSlots.length)) return null;
    const siblings = this.moonSlots[Number(locator.bodyIndex)]!;
    if (locator.moonIndex >= BigInt(siblings.length)) return null;
    return siblings[Number(locator.moonIndex)] ?? null;
  }
}

function matchesSystem(
  locator: BodyLocator | MoonLocator,
  parent: GeneratedMultipleHost['parentLocator'],
): boolean {
  return locator.galaxyIndex === parent.galaxyIndex &&
    locator.sectorKey === parent.sectorKey &&
    locator.galacticObjectIndex === parent.galacticObjectIndex;
}
