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
  type Planet,
} from './planet';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  MoonSystem,
} from './moon-system';

describe(
  'MoonSystem point 21.1',
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
      'should establish one exact host-planet boundary without materializing point-21.2+ moon products',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            2,
          );

        const moonSystem =
          new MoonSystem(
            planet,
          );

        expect(
          moonSystem.hostPlanet,
        ).toBe(
          planet,
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

        for (
          const laterProperty
          of [
            'moonCount',
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
      'should reject incoherent host planets and malformed canonical body identity',
      () => {
        expect(
          () =>
            new MoonSystem(
              planetFixture(
                planetarySystem,
                1,
                {
                  isTypePhysicallyCoherent:
                    false,
                },
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonSystem(
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
              ),
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonSystem({
              ...planetFixture(
                planetarySystem,
                1,
              ),
              planetOrdinal:
                0,
            } as unknown as Planet),
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
    isTypePhysicallyCoherent:
      true,
    ...overrides,
  } as unknown as Planet;
}
