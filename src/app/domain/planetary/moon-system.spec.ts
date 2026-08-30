import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  MoonPopulationProfile,
} from './moon-population-profile';

import {
  type Planet,
} from './planet';

import {
  PlanetType,
} from './planet-type';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  MoonSystem,
} from './moon-system';

describe(
  'MoonSystem through point 21.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        4n,
        -9n,
        12n,
      );

    const planetarySystem = {
      generationKey,
      locator:
        systemLocator,
      planetCount:
        2,
    } as unknown as PlanetarySystem;

    it(
      'should preserve the exact point-21.1 host boundary and expose the point-21.2 population count',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            2,
          );

        const population =
          populationFixture(
            planet,
            2,
          );

        const moonSystem =
          new MoonSystem(
            planet,
            population,
          );

        expect(
          moonSystem.hostPlanet,
        ).toBe(
          planet,
        );

        expect(
          moonSystem.populationProfile,
        ).toBe(
          population,
        );

        expect(
          moonSystem.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          moonSystem.hostPlanetarySystem,
        ).toBe(
          planetarySystem,
        );

        expect(
          moonSystem.systemLocator,
        ).toBe(
          systemLocator,
        );

        expect(
          moonSystem.hostPlanetOrdinal,
        ).toBe(2);

        expect(
          moonSystem.hostPlanetLocator,
        ).toBe(
          planet.locator,
        );

        expect(
          moonSystem.hostPlanetSeed,
        ).toBe(
          planet.seed,
        );

        expect(
          moonSystem.moonCount,
        ).toBe(2);

        expect(
          moonSystem.hasMoons,
        ).toBe(true);

        for (
          const laterProperty
          of [
            'moons',
            'moonLocators',
            'moonSeeds',
            'orbitalProperties',
            'physicalProperties',
            'tidalState',
            'atmospheres',
            'habitability',
            'designations',
          ]
        ) {
          expect(
            laterProperty in
              moonSystem,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject a population profile from another body or with altered frozen host sources',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            1,
          );

        const otherPlanet =
          planetFixture(
            planetarySystem,
            2,
          );

        expect(
          () =>
            new MoonSystem(
              planet,
              populationFixture(
                otherPlanet,
                1,
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonSystem(
              planet,
              populationFixture(
                planet,
                1,
                {
                  sourceMassEarth:
                    planet.massEarth +
                    0.1,
                },
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject incoherent host planets and malformed canonical body identity',
      () => {
        const incoherent =
          planetFixture(
            planetarySystem,
            1,
            {
              isTypePhysicallyCoherent:
                false,
            },
          );

        expect(
          () =>
            new MoonSystem(
              incoherent,
              populationFixture(
                incoherent,
                0,
              ),
            ),
        ).toThrow(
          RangeError,
        );

        const wrongLocatorPlanet =
          planetFixture(
            planetarySystem,
            1,
            {
              locator:
                new BodyLocator(
                  4n,
                  -9n,
                  12n,
                  1n,
                ),
            },
          );

        expect(
          () =>
            new MoonSystem(
              wrongLocatorPlanet,
              populationFixture(
                wrongLocatorPlanet,
                0,
              ),
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function planetFixture(
  planetarySystem:
    PlanetarySystem,

  planetOrdinal:
    number,

  overrides:
    Partial<Planet> = {},
): Planet {

  return {
    generationKey:
      planetarySystem
        .generationKey,
    hostPlanetarySystem:
      planetarySystem,
    systemLocator:
      planetarySystem
        .locator,
    planetOrdinal,
    locator:
      new BodyLocator(
        planetarySystem
          .locator
          .galaxyIndex,
        planetarySystem
          .locator
          .sectorKey,
        planetarySystem
          .locator
          .galacticObjectIndex,
        BigInt(
          planetOrdinal -
            1,
        ),
      ),
    seed:
      new BodySeed(
        planetOrdinal ===
          1
          ? '11111111111111111111111111111111'
          : '22222222222222222222222222222222',
      ),
    planetType:
      PlanetType.ROCKY,
    massEarth:
      1,
    radiusEarth:
      1,
    orbit: {
      semiMajorAxisAu:
        1,
      eccentricity:
        0.01,
    },
    orbitalPeriod: {
      gravitatingMassSolar:
        1,
    },
    isTypePhysicallyCoherent:
      true,
    ...overrides,
  } as unknown as Planet;
}

function populationFixture(
  planet:
    Planet,

  moonCount:
    number,

  overrides:
    Partial<MoonPopulationProfile> = {},
): MoonPopulationProfile {

  const values = {
    hostPlanetOrdinal:
      planet.planetOrdinal,
    hostPlanetLocator:
      planet.locator,
    hostPlanetSeed:
      planet.seed,
    sourcePlanetType:
      planet.planetType,
    sourceMassEarth:
      planet.massEarth,
    sourceRadiusEarth:
      planet.radiusEarth,
    sourceSemiMajorAxisAu:
      planet.orbit.semiMajorAxisAu,
    sourceEccentricity:
      planet.orbit.eccentricity,
    sourceGravitatingMassSolar:
      planet.orbitalPeriod.gravitatingMassSolar,
    hillSphereRadiusPlanetRadii:
      230,
    satelliteCapacityIndex01:
      0.67,
    moonCount,
    ...overrides,
  };

  return new MoonPopulationProfile(
    values.hostPlanetOrdinal,
    values.hostPlanetLocator,
    values.hostPlanetSeed,
    values.sourcePlanetType,
    values.sourceMassEarth,
    values.sourceRadiusEarth,
    values.sourceSemiMajorAxisAu,
    values.sourceEccentricity,
    values.sourceGravitatingMassSolar,
    values.hillSphereRadiusPlanetRadii,
    values.satelliteCapacityIndex01,
    values.moonCount,
  );
}
