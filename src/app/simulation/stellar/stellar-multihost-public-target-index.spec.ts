import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from './stellar-system-multiplicity-selector';
import { StellarMultihostFormation } from './stellar-multihost-formation';
import { StellarMultihostPublicTargetIndex } from './stellar-multihost-public-target-index';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);

function fixture(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 512n; index += 1n) {
    const locator = new SystemLocator(0n, 0n, index);
    const seed = ProceduralTargetResolver.resolveTargetSeed(key, locator);
    if (StellarSystemMultiplicitySelector.select(key, seed as Parameters<typeof StellarSystemMultiplicitySelector.select>[1])
      === multiplicity) return locator;
  }
  throw new Error(`No ${multiplicity.name} fixture.`);
}

describe('Stage 4 multihost public lookup (not activated in game routes)', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    'resolves every real planet and every modeled moon by parent address for %s', multiplicity => {
      const locator = fixture(multiplicity);
      const formation = StellarMultihostFormation.generateOrNull(key, locator)!;
      const index = StellarMultihostPublicTargetIndex.build(formation);
      expect(index.planets).toBe(formation.publicPlanets);
      expect(Object.isFrozen(index)).toBe(true);
      expect(Object.isFrozen(index.moons)).toBe(true);
      expect(index.planets.map(p => p.host)).toEqual(formation.publicPlanets.map(p => p.host));
      expect(index.moons.length).toBe(index.planets.reduce((sum, p) => sum + p.moonSystem.moonCount, 0));
      for (const planet of index.planets) {
        expect(index.resolvePlanet(planet.publicLocator)).toBe(planet);
        const publicMoons = index.moons.filter(m => m.parent === planet);
        expect(publicMoons.length).toBe(planet.moonSystem.moonIdentities.length);
        for (const [moonIndex, moon] of publicMoons.entries()) {
          expect(moon.publicLocator.bodyIndex).toBe(planet.publicLocator.bodyIndex);
          expect(moon.publicLocator.moonIndex).toBe(BigInt(moonIndex));
          expect(moon.sourceIdentity).toBe(planet.moonSystem.moonIdentities[moonIndex]);
          expect(moon.relevantMoon).toBe(planet.moonSystem.relevantMoons.find(
            candidate => candidate.moonOrdinal === moonIndex + 1,
          ) ?? null);
          expect(index.resolveMoon(moon.publicLocator)).toBe(moon);
        }
        expect(index.resolveMoon(new MoonLocator(locator.galaxyIndex, locator.sectorKey,
          locator.galacticObjectIndex, planet.publicLocator.bodyIndex, BigInt(publicMoons.length)))).toBeNull();
      }
      expect(index.resolvePlanet(new BodyLocator(locator.galaxyIndex, locator.sectorKey,
        locator.galacticObjectIndex, BigInt(index.planets.length)))).toBeNull();
      expect(index.resolvePlanet(new BodyLocator(locator.galaxyIndex, locator.sectorKey,
        locator.galacticObjectIndex + 1n, 0n))).toBeNull();
      expect(index.resolveMoon(new MoonLocator(locator.galaxyIndex, locator.sectorKey,
        locator.galacticObjectIndex + 1n, 0n, 0n))).toBeNull();
    },
  );

  it('preserves public address/host and source seeds across deterministic regeneration', () => {
    const locator = fixture(StellarSystemMultiplicity.BINARY);
    const first = StellarMultihostPublicTargetIndex.build(StellarMultihostFormation.generateOrNull(key, locator)!);
    const replay = StellarMultihostPublicTargetIndex.build(StellarMultihostFormation.generateOrNull(key, locator)!);
    expect(first.planets.map(planet => [planet.publicLocator.bodyIndex, planet.host,
      planet.planet.seed.normalizedValue])).toEqual(replay.planets.map(planet => [
      planet.publicLocator.bodyIndex, planet.host, planet.planet.seed.normalizedValue,
    ]));
    expect(first.moons.map(moon => [moon.publicLocator.bodyIndex, moon.publicLocator.moonIndex,
      moon.sourceIdentity.seed.normalizedValue])).toEqual(replay.moons.map(moon => [
      moon.publicLocator.bodyIndex, moon.publicLocator.moonIndex, moon.sourceIdentity.seed.normalizedValue,
    ]));
  });
});
