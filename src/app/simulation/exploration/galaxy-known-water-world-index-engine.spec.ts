import { vi } from 'vitest';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GalaxyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { PlanetType } from '../../domain/planetary/planet-type';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  GALAXY_KNOWN_WATER_WORLD_MIN_SURFACE_LIQUID_WATER_FRACTION_01,
} from '../../domain/exploration/galaxy-known-water-world-index';
import {
  type GeneratedSingleHost,
  StellarMultihostFormation,
} from '../stellar/stellar-multihost-formation';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import { GalaxyExplorationTelemetryEngine } from './galaxy-exploration-telemetry-engine';
import { GalaxyKnownWaterWorldIndexEngine } from './galaxy-known-water-world-index-engine';

describe('GalaxyKnownWaterWorldIndexEngine point 26.1c', () => {
  const key = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
    GeneratorVersion.V1,
  );
  const locator = new SystemLocator(0n, 0n, 0n);

  it('should share the exact 20 percent criterion with 26.1b and expose public planet locators only', () => {
    const fake = fakeSingle([0.19, 0.20, 0.75]);
    const multipleSpy = vi.spyOn(StellarMultihostFormation, 'generateOrNull').mockReturnValue(null);
    const singleSpy = vi.spyOn(StellarMultihostFormation, 'generateSingleOrNull').mockReturnValue(fake);
    const designationSpy = vi.spyOn(StellarDesignationGenerator, 'generate').mockReturnValue(
      { name: 'Asterion' } as ReturnType<typeof StellarDesignationGenerator.generate>,
    );

    const known = [
      new KnownDiscovery(key, new GalaxyLocator(0n), DiscoveryState.CONFIRMED),
      new KnownDiscovery(key, locator, DiscoveryState.CONFIRMED),
    ];

    const index = GalaxyKnownWaterWorldIndexEngine.build(
      key,
      0n,
      DiscoveryState.CONFIRMED,
      known,
    );
    const telemetry = GalaxyExplorationTelemetryEngine.build(
      key,
      0n,
      DiscoveryState.CONFIRMED,
      known,
    );

    expect(GALAXY_KNOWN_WATER_WORLD_MIN_SURFACE_LIQUID_WATER_FRACTION_01).toBe(0.20);
    expect(index.systems).toHaveLength(1);
    expect(index.totalWorlds).toBe(2n);
    expect(index.systems[0]?.worlds.map(world => world.locator.bodyIndex)).toEqual([1n, 2n]);
    expect(index.systems[0]?.worlds.map(world => world.designation)).toEqual(['Mundo 2', 'Mundo 3']);
    expect(telemetry.breakdown.planets.liquidSurfaceAtLeast20Percent).toBe(index.totalWorlds);

    multipleSpy.mockRestore();
    singleSpy.mockRestore();
    designationSpy.mockRestore();
  }, 30_000);

  it('should never materialize a merely DISCOVERED system', () => {
    const multipleSpy = vi.spyOn(StellarMultihostFormation, 'generateOrNull');
    const singleSpy = vi.spyOn(StellarMultihostFormation, 'generateSingleOrNull');

    const index = GalaxyKnownWaterWorldIndexEngine.build(
      key,
      0n,
      DiscoveryState.DISCOVERED,
      [
        new KnownDiscovery(key, new GalaxyLocator(0n), DiscoveryState.DISCOVERED),
        new KnownDiscovery(key, locator, DiscoveryState.DISCOVERED),
      ],
    );

    expect(index.totalWorlds).toBe(0n);
    expect(index.systems).toEqual([]);
    expect(multipleSpy).not.toHaveBeenCalled();
    expect(singleSpy).not.toHaveBeenCalled();

    multipleSpy.mockRestore();
    singleSpy.mockRestore();
  });
});

function fakeSingle(coverages: readonly number[]): GeneratedSingleHost {
  const planets = coverages.map((_, index) => ({
    designation: { name: `Mundo ${index + 1}` },
    planetType: index === 0 ? PlanetType.ROCKY : PlanetType.OCEAN,
  }));

  const atmospheres = planets.map((planet, index) => ({
    hostPlanet: planet,
    surfaceLiquidWaterCoverageFraction01: coverages[index]!,
  }));

  const moonSystems = planets.map(planet => ({
    hostPlanet: planet,
    moonCount: 0,
    relevantMoons: Object.freeze([]),
  }));

  return {
    label: 'A',
    internalGenerationKey: keyForFake(),
    stellarSystem: {} as GeneratedSingleHost['stellarSystem'],
    physical: {} as GeneratedSingleHost['physical'],
    spectral: {} as GeneratedSingleHost['spectral'],
    lifetime: {} as GeneratedSingleHost['lifetime'],
    planetarySystem: null,
    planets: Object.freeze(planets) as unknown as GeneratedSingleHost['planets'],
    atmospheres: Object.freeze(atmospheres) as unknown as GeneratedSingleHost['atmospheres'],
    moonSystems: Object.freeze(moonSystems) as unknown as GeneratedSingleHost['moonSystems'],
    asteroidBelts: null,
    protectedExtentAu: 0.2,
  };
}

function keyForFake(): UniverseGenerationKey {
  return new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
    GeneratorVersion.V1,
  );
}
