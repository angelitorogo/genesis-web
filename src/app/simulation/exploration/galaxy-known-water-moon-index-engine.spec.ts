import { vi } from 'vitest';

import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import {
  GALAXY_KNOWN_WATER_MOON_MIN_SURFACE_LIQUID_POTENTIAL_01,
} from '../../domain/exploration/galaxy-known-water-moon-index';
import { GalaxyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  type GeneratedSingleHost,
  StellarMultihostFormation,
} from '../stellar/stellar-multihost-formation';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import { GalaxyExplorationTelemetryEngine } from './galaxy-exploration-telemetry-engine';
import { GalaxyKnownWaterMoonIndexEngine } from './galaxy-known-water-moon-index-engine';

describe('GalaxyKnownWaterMoonIndexEngine point 26.1c lunar extension', () => {
  const key = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
    GeneratorVersion.V1,
  );
  const locator = new SystemLocator(0n, 0n, 0n);

  it('should share the exact lunar criteria with 26.1b and expose only moons with navigable detailed science', () => {
    const fake = fakeSingle();
    const multipleSpy = vi.spyOn(StellarMultihostFormation, 'generateOrNull').mockReturnValue(null);
    const singleSpy = vi.spyOn(StellarMultihostFormation, 'generateSingleOrNull').mockReturnValue(fake);
    const designationSpy = vi.spyOn(StellarDesignationGenerator, 'generate').mockReturnValue(
      { name: 'Asterion' } as ReturnType<typeof StellarDesignationGenerator.generate>,
    );

    const known = [
      new KnownDiscovery(key, new GalaxyLocator(0n), DiscoveryState.CONFIRMED),
      new KnownDiscovery(key, locator, DiscoveryState.CONFIRMED),
    ];

    const index = GalaxyKnownWaterMoonIndexEngine.build(
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

    expect(GALAXY_KNOWN_WATER_MOON_MIN_SURFACE_LIQUID_POTENTIAL_01).toBe(0.40);
    expect(index.systems).toHaveLength(1);
    expect(index.totalUniqueMoons).toBe(3n);
    expect(index.surfaceLiquidPotentialMoonCount).toBe(2n);
    expect(index.subsurfaceOceanEvidenceMoonCount).toBe(2n);
    expect(index.systems[0]?.moons.map(moon => moon.locator.moonIndex)).toEqual([1n, 2n, 3n]);
    expect(index.systems[0]?.moons.map(moon => moon.designation)).toEqual([
      'Mundo 1 II',
      'Mundo 1 III',
      'Mundo 1 IV',
    ]);
    expect(telemetry.breakdown.moons.surfaceLiquidPotentialAtLeast40Percent)
      .toBe(index.surfaceLiquidPotentialMoonCount);
    expect(telemetry.breakdown.moons.subsurfaceOceanEvidence)
      .toBe(index.subsurfaceOceanEvidenceMoonCount);

    multipleSpy.mockRestore();
    singleSpy.mockRestore();
    designationSpy.mockRestore();
  });

  it('should never materialize lunar science from a merely DISCOVERED system', () => {
    const multipleSpy = vi.spyOn(StellarMultihostFormation, 'generateOrNull');
    const singleSpy = vi.spyOn(StellarMultihostFormation, 'generateSingleOrNull');

    const index = GalaxyKnownWaterMoonIndexEngine.build(
      key,
      0n,
      DiscoveryState.DISCOVERED,
      [
        new KnownDiscovery(key, new GalaxyLocator(0n), DiscoveryState.DISCOVERED),
        new KnownDiscovery(key, locator, DiscoveryState.DISCOVERED),
      ],
    );

    expect(index.totalUniqueMoons).toBe(0n);
    expect(index.systems).toEqual([]);
    expect(multipleSpy).not.toHaveBeenCalled();
    expect(singleSpy).not.toHaveBeenCalled();

    multipleSpy.mockRestore();
    singleSpy.mockRestore();
  });
});

function fakeSingle(): GeneratedSingleHost {
  const planet = {
    designation: { name: 'Mundo 1' },
    planetType: PlanetType.OCEAN,
  };
  const atmosphere = {
    hostPlanet: planet,
    surfaceLiquidWaterCoverageFraction01: 0.20,
  };

  const definitions = [
    [0.39, 0.10, MoonWaterRegime.SURFACE_ICE],
    [0.40, 0.10, MoonWaterRegime.SURFACE_LIQUID],
    [0.20, 0.80, MoonWaterRegime.SUBSURFACE_OCEAN],
    [0.70, 0.85, MoonWaterRegime.MIXED],
  ] as const;

  const relevantMoons = definitions.map(([surface, subsurface, regime], index) => ({
    moonOrdinal: index + 1,
    identity: {
      locator: new MoonLocator(0n, 0n, 0n, 0n, BigInt(index)),
    },
    environmentState: {
      inferredIceRichnessIndex01: 0.5,
      surfaceLiquidWaterPotentialIndex01: surface,
      subsurfaceOceanPotentialIndex01: subsurface,
      waterRegime: regime,
    },
  }));

  const moonSystem = {
    hostPlanet: planet,
    moonCount: definitions.length,
    relevantMoons: Object.freeze(relevantMoons),
  };

  return {
    label: 'A',
    internalGenerationKey: keyForFake(),
    stellarSystem: {} as GeneratedSingleHost['stellarSystem'],
    physical: {} as GeneratedSingleHost['physical'],
    spectral: {} as GeneratedSingleHost['spectral'],
    lifetime: {} as GeneratedSingleHost['lifetime'],
    planetarySystem: null,
    planets: Object.freeze([planet]) as unknown as GeneratedSingleHost['planets'],
    atmospheres: Object.freeze([atmosphere]) as unknown as GeneratedSingleHost['atmospheres'],
    moonSystems: Object.freeze([moonSystem]) as unknown as GeneratedSingleHost['moonSystems'],
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
