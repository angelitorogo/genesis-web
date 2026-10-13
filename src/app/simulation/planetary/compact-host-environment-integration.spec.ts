import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactHostPlanetarySystemGenerator } from './compact-host-planetary-system-generator';
import { CompactHostEnvironmentEngine } from './compact-host-environment-engine';

describe('31.3: generation integration without cutover', () => {
  it('adds one immutable environmental snapshot per generated compact planet, without changing V2 seed', () => {
    const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
    const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
    let sample: NonNullable<ReturnType<typeof CompactHostPlanetarySystemGenerator.generateOrNull>> | null = null;
    let sampleLocator: SystemLocator | null = null;
    for (let i = 0n; i < 5000n; i += 1n) {
      const locator = new SystemLocator(0n, 0n, i);
      const candidate = CompactHostPlanetarySystemGenerator.generateOrNull(key, locator);
      if (candidate && candidate.planets.length > 0) { sample = candidate; sampleLocator = locator; break; }
    }
    if (sample === null || sampleLocator === null) throw new Error('No compact-host fixture found');
    const before = sample.planets.map(planet => [planet.massEarth, planet.radiusEarth, planet.semiMajorAxisAu, planet.orbitalPeriodDays]);
    expect(sample.environments.length).toBe(sample.planets.length);
    expect(sample.environments).toEqual(CompactHostEnvironmentEngine.projectSystem(sample));
    expect(Object.isFrozen(sample.environments)).toBe(true);
    expect(sample.environments.every(env => Object.isFrozen(env))).toBe(true);
    expect(sample.environments.every(env => env.newPlanetaryTaxon === false)).toBe(true);
    expect(sample.planets.map(planet => [planet.massEarth, planet.radiusEarth, planet.semiMajorAxisAu, planet.orbitalPeriodDays])).toEqual(before);
    const second = CompactHostPlanetarySystemGenerator.generateOrNull(key, sampleLocator);
    expect(second!.environments).toEqual(sample.environments);
    expect(seed.normalizedValue).toBe('7F21A9D418CE4B7092F16A0C6E35D8B1');
  });
});
