import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from './stellar-system-multiplicity-selector';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { StellarMultihostScientificTargetResolver } from './stellar-multihost-scientific-target-resolver';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);

/** Choose a real nonempty multiple; a valid empty multiple must not make this test vacuous. */
function populatedFixture(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let i = 0n; i < 128n; i += 1n) {
    const locator = new SystemLocator(0n, 0n, i);
    const seed = ProceduralTargetResolver.resolveTargetSeed(key, locator);
    if (StellarSystemMultiplicitySelector.select(key, seed as Parameters<
      typeof StellarSystemMultiplicitySelector.select
    >[1]) !== multiplicity) continue;
    if ((StellarMultihostFormation.generateOrNull(key, locator)?.publicPlanets.length ?? 0) > 0) return locator;
  }
  throw new Error(`Missing populated ${multiplicity.name} fixture.`);
}

describe('Stage 5 multihost scientific resolution — opt-in, not active in routes', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    'projects exactly the generated planets and relevant moons for %s without regeneration', multiplicity => {
      const system = StellarMultihostFormation.generateOrNull(key, populatedFixture(multiplicity))!;
      const resolver = new StellarMultihostScientificTargetResolver(system);
      expect(system.publicPlanets.length).toBeGreaterThan(0);
      expect(system.publicPlanets.filter(entry => entry.host === 'AB').length)
        .toBe(system.circumbinary.planets.length);
      for (const entry of system.publicPlanets) {
        const identity = resolver.resolve(key, entry.publicLocator)!;
        const target = resolver.resolveDetailed(key, entry.publicLocator)!;
        expect(target.identity).toEqual(identity);
        expect(identity.locator).toBe(entry.publicLocator);
        expect(identity.planetOrdinal).toBe(Number(entry.publicLocator.bodyIndex) + 1);
        expect(identity.hostPlanetCount).toBe(system.publicPlanets.length);
        expect(identity.designation).toContain(`${entry.host}-${entry.sourcePlanetOrdinal}`);
        expect(identity.orbitTopology).toBe(entry.planet.hostPlanetarySystem.architecture.orbitTopology);
        expect(target.detail.general.massEarth).toBe(entry.planet.massEarth);
        expect(target.detail.general.planetType).toBe(entry.planet.planetType);
        expect(target.detail.orbit.semiMajorAxisAu).toBe(entry.planet.orbit.semiMajorAxisAu);
        expect(target.detail.atmosphere.isVacuum).toBe(entry.atmosphere.isVacuum);
        expect(target.detail.moons.moonCount).toBe(entry.moonSystem.moonCount);
        expect(target.detail.moons.relevantMoonCount).toBe(entry.moonSystem.relevantMoonCount);
        expect(Object.isFrozen(target.detail)).toBe(true);
        for (const moon of entry.moonSystem.relevantMoons) {
          const resolved = resolver.resolveMoonDetailed(key, entry.publicLocator, BigInt(moon.moonOrdinal - 1))!;
          expect(resolver.moonCardResolver.resolveDetailed(key, entry.publicLocator, BigInt(moon.moonOrdinal - 1)))
            .toEqual(resolved);
          expect(resolver.moonCardResolver.resolveHostPlanetDetailed(key, entry.publicLocator))
            .toEqual(target);
          expect(resolved.identity.hostPlanetDesignation).toBe(identity.designation);
          expect(resolved.identity.hostSystemDesignation).toBe(identity.hostSystemDesignation);
          expect(resolved.identity.moonOrdinal).toBe(moon.moonOrdinal);
          expect(resolved.detail.general.massEarth).toBe(moon.massEarth);
        }
        expect(resolver.resolveMoonDetailed(key, entry.publicLocator, BigInt(entry.moonSystem.moonCount))).toBeNull();
        expect(resolver.resolveMoonDetailed(key, entry.publicLocator, -1n)).toBeNull();
      }
    },
  );

  it('rejects another universe, another system and unmodeled public bodies, without falling back to V1', () => {
    const source = StellarMultihostFormation.generateOrNull(key, populatedFixture(StellarSystemMultiplicity.BINARY))!;
    const resolver = new StellarMultihostScientificTargetResolver(source);
    const foreignKey = new UniverseGenerationKey(
      UniverseSeed.parse('1234-5678-9ABC-DEF0-1234-5678-9ABC-DEF0'), GeneratorVersion.V1,
    );
    const original = source.publicPlanets[0]!;
    expect(resolver.resolve(foreignKey, original.publicLocator)).toBeNull();
    expect(resolver.resolveDetailed(foreignKey, original.publicLocator)).toBeNull();
    expect(resolver.resolveMoonDetailed(foreignKey, original.publicLocator, 0n)).toBeNull();
    const outside = new BodyLocator(source.parentLocator.galaxyIndex, source.parentLocator.sectorKey,
      source.parentLocator.galacticObjectIndex, BigInt(source.publicPlanets.length));
    expect(resolver.resolve(key, outside)).toBeNull();
    expect(resolver.resolveDetailed(key, outside)).toBeNull();
    expect(resolver.resolveMoonDetailed(key, outside, 0n)).toBeNull();
    const otherSystem = new BodyLocator(source.parentLocator.galaxyIndex, source.parentLocator.sectorKey,
      source.parentLocator.galacticObjectIndex + 1n, original.publicLocator.bodyIndex);
    expect(resolver.resolve(key, otherSystem)).toBeNull();
  });

  it('rebuilds the same public scientific identities and body properties deterministically', () => {
    const locator = populatedFixture(StellarSystemMultiplicity.TRIPLE);
    const first = new StellarMultihostScientificTargetResolver(StellarMultihostFormation.generateOrNull(key, locator)!);
    const replay = new StellarMultihostScientificTargetResolver(StellarMultihostFormation.generateOrNull(key, locator)!);
    for (let i = 0n; ; i += 1n) {
      const address = new BodyLocator(locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex, i);
      const one = first.resolveDetailed(key, address);
      const two = replay.resolveDetailed(key, address);
      expect(one).toEqual(two);
      if (one === null) break;
    }
  });
});
