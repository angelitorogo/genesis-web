import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { StellarSystemMultiplicitySelector } from './stellar-system-multiplicity-selector';
import { StellarMultihostFormation } from './stellar-multihost-formation';

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
  throw new Error(`No ${multiplicity.name} fixture in first 512 objects.`);
}

describe('Production multihost physical assembly boundary (not activated in routes)', () => {
  it('leaves the production SINGLE generator untouched', () => {
    expect(StellarMultihostFormation.generateOrNull(key, fixture(StellarSystemMultiplicity.SINGLE))).toBeNull();
  });

  it('generates independent complete A/B sources, stable spacing and repeatable P materialization', () => {
    const locator = fixture(StellarSystemMultiplicity.BINARY);
    const first = StellarMultihostFormation.generateOrNull(key, locator)!;
    const replay = StellarMultihostFormation.generateOrNull(key, locator)!;
    expect(first.multiplicity).toBe(StellarSystemMultiplicity.BINARY);
    expect(first.components.map(component => component.label)).toEqual(['A', 'B']);
    expect(first.components[0]!.internalGenerationKey.equals(key)).toBe(true);
    expect(first.components[1]!.internalGenerationKey.equals(key)).toBe(false);
    expect(first.components[0]!.stellarSystem.seed.normalizedValue)
      .not.toBe(first.components[1]!.stellarSystem.seed.normalizedValue);
    for (const component of first.components) {
      expect(component.planets.length).toBe(component.planetarySystem?.planetCount ?? 0);
      expect(component.moonSystems.length).toBe(component.planets.length);
      expect(component.atmospheres.length).toBe(component.planets.length);
      expect(component.planets.every(planet => planet.hostPlanetarySystem === component.planetarySystem)).toBe(true);
    }
    expect(first.publicPlanets.length).toBe(first.components.reduce(
      (count, component) => count + component.planets.length, 0,
    ) + first.circumbinary.planets.length);
    for (const [index, body] of first.publicPlanets.entries()) {
      expect(body.publicLocator.bodyIndex).toBe(BigInt(index));
      expect(body.publicLocator.galacticObjectIndex).toBe(locator.galacticObjectIndex);
      expect(body.atmosphere.hostPlanet).toBe(body.planet);
      expect(body.moonSystem.hostPlanet).toBe(body.planet);
    }
    expect(first.innerOrbit.semiMajorAxisAu).toBeGreaterThan(0);
    expect(first.outerOrbit).toBeNull();
    expect(first.components.map(component => component.stellarSystem.seed.normalizedValue))
      .toEqual(replay.components.map(component => component.stellarSystem.seed.normalizedValue));
    expect(first.innerOrbit.semiMajorAxisAu).toBe(replay.innerOrbit.semiMajorAxisAu);
    expect(first.publicPlanets.map(body => [body.host, body.planet.seed.normalizedValue]))
      .toEqual(replay.publicPlanets.map(body => [body.host, body.planet.seed.normalizedValue]));
    expect(new Set(first.publicPlanets.map(body => body.planet.seed.normalizedValue)).size)
      .toBe(first.publicPlanets.length);
    expect(first.circumbinary.planets.map(planet => planet.seed.normalizedValue))
      .toEqual(replay.circumbinary.planets.map(planet => planet.seed.normalizedValue));
    for (const planet of first.circumbinary.planets) {
      expect(planet.orbit.semiMajorAxisAu).toBeGreaterThanOrEqual(first.circumbinary.stableInnerAu!);
      expect(planet.orbit.apoastronAu).toBeLessThanOrEqual(first.circumbinary.stableOuterAu!);
    }
  });

  it('builds (A–B)–C with independent C, protects exterior separation and bounds P orbits', () => {
    const triple = StellarMultihostFormation.generateOrNull(key, fixture(StellarSystemMultiplicity.TRIPLE))!;
    expect(triple.multiplicity).toBe(StellarSystemMultiplicity.TRIPLE);
    expect(triple.components.map(component => component.label)).toEqual(['A', 'B', 'C']);
    expect(new Set(triple.components.map(component => component.stellarSystem.seed.normalizedValue)).size).toBe(3);
    expect(triple.publicPlanets.map(body => body.publicLocator.bodyIndex)).toEqual(
      triple.publicPlanets.map((_, index) => BigInt(index)),
    );
    expect(triple.outerOrbit).not.toBeNull();
    expect(triple.outerOrbit!.periastronAu).toBeGreaterThan(5 * triple.innerOrbit.apoastronAu);
    for (const planet of triple.circumbinary.planets) {
      expect(planet.orbit.apoastronAu).toBeLessThanOrEqual(triple.circumbinary.stableOuterAu!);
      expect(planet.orbit.apoastronAu).toBeLessThan(triple.outerOrbit!.periastronAu);
    }
  });
});
