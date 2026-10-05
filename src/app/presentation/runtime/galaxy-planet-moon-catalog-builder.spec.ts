import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { KnownDiscovery } from '../../domain/discovery/known-discovery';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, MoonLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { PlanetType } from '../../domain/planetary/planet-type';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { type GeneratedSingleHost, StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { buildGalaxyPlanetMoonCatalogSnapshot } from './galaxy-planet-moon-catalog-snapshot.runtime';

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V2,
);
const confirmed = new SystemLocator(0n, 0n, 1n);
const discovered = new SystemLocator(0n, 0n, 2n);

describe('26.1c.3 planet/moon catalogue knowledge boundary', () => {
  it('materializes detailed planets/moons only from CONFIRMED systems and leaves historical bodies unclassified', () => {
    const planetLocator = new BodyLocator(0n, 0n, 1n, 0n);
    const moonLocator = new MoonLocator(0n, 0n, 1n, 0n, 0n);
    const planet = {
      designation: { name: 'Asterion b' },
      planetType: PlanetType.OCEAN,
      massEarth: 1.8,
      radiusEarth: 1.2,
      orbit: { semiMajorAxisAu: 0.9 },
      orbitalPeriod: { periodDays: 300 },
    };
    const atmosphere = {
      hostPlanet: planet,
      meanSurfaceTemperatureKelvin: 286,
      surfaceLiquidWaterCoverageFraction01: 0.64,
    };
    const moon = {
      moonOrdinal: 1,
      identity: { locator: moonLocator },
      physicalProperties: { massEarth: 0.02, radiusEarth: 0.3 },
      orbit: { orbitalPeriodDays: 5 },
      environmentState: {
        inferredIceRichnessIndex01: 0.8,
        surfaceLiquidWaterPotentialIndex01: 0.42,
        subsurfaceOceanPotentialIndex01: 0.9,
        waterRegime: MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
      },
    };
    const moonSystem = {
      hostPlanet: planet,
      unmaterializedMinorMoonCount: 7,
      relevantMoons: Object.freeze([moon]),
    };
    const single = {
      planets: Object.freeze([planet]),
      atmospheres: Object.freeze([atmosphere]),
      moonSystems: Object.freeze([moonSystem]),
      pulsarPlanetPopulation: null,
    } as unknown as GeneratedSingleHost;

    const multipleSpy = vi.spyOn(StellarMultihostFormation, 'generateOrNull').mockImplementation(
      (_key, locator) => locator.galacticObjectIndex === confirmed.galacticObjectIndex ? null : null,
    );
    const singleSpy = vi.spyOn(StellarMultihostFormation, 'generateSingleOrNull').mockImplementation(
      (_key, locator) => locator.galacticObjectIndex === confirmed.galacticObjectIndex ? single : null,
    );
    const designationSpy = vi.spyOn(StellarDesignationGenerator, 'generate').mockReturnValue(
      { name: 'Asterion' } as ReturnType<typeof StellarDesignationGenerator.generate>,
    );

    const historicalBody = new BodyLocator(0n, 0n, 99n, 4n);
    const snapshot = buildGalaxyPlanetMoonCatalogSnapshot(key, 0n, [
      new KnownDiscovery(key, confirmed, DiscoveryState.CONFIRMED),
      new KnownDiscovery(key, discovered, DiscoveryState.DISCOVERED),
      new KnownDiscovery(key, historicalBody, DiscoveryState.CATALOGUED),
    ]);

    expect(snapshot.planets).toHaveLength(2);
    expect(snapshot.planets.find(entry => entry.locator?.bodyIndex === planetLocator.bodyIndex)?.subtype)
      .toBe(PlanetType.OCEAN);
    expect(snapshot.planets.find(entry => entry.locator?.galacticObjectIndex === 99n)?.subtype)
      .toBe('UNCLASSIFIED');
    expect(snapshot.moons).toHaveLength(1);
    expect(snapshot.moons[0]?.composition).toBe('ICY');
    expect(snapshot.unmaterializedMinorMoonCount).toBe(7n);
    expect(singleSpy).toHaveBeenCalledTimes(1);

    multipleSpy.mockRestore();
    singleSpy.mockRestore();
    designationSpy.mockRestore();
  });
});
