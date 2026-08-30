import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  MoonGenerator,
} from './moon-generator';

describe(
  'MoonGenerator point 21.1 V1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const otherGenerationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '1020-3040-5060-7080-90A0-B0C0-D0E0-F001',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        7n,
        -42n,
        3n,
      );

    const planetarySystem =
      planetarySystemFixture(
        generationKey,
        systemLocator,
        3,
      );

    it(
      'should deterministically materialize the exact MoonSystem boundary for one host Planet with zero moon products',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            2,
          );

        const first =
          MoonGenerator
            .generate(
              generationKey,
              planet,
            );

        const second =
          MoonGenerator
            .generate(
              generationKey,
              planet,
            );

        expect(
          first.hostPlanet,
        ).toBe(
          planet,
        );

        expect(
          second.hostPlanet,
        ).toBe(
          planet,
        );

        expect(
          second.hostPlanetLocator,
        ).toBe(
          first.hostPlanetLocator,
        );

        expect(
          second.hostPlanetSeed,
        ).toBe(
          first.hostPlanetSeed,
        );

        expect(
          'moonCount' in
            first,
        ).toBe(false);

        expect(
          'moonSeed' in
            first,
        ).toBe(false);
      },
    );

    it(
      'should generate one frozen MoonSystem per mature Planet in exact planetOrdinal order',
      () => {
        const planets = [
          planetFixture(
            planetarySystem,
            1,
          ),
          planetFixture(
            planetarySystem,
            2,
          ),
          planetFixture(
            planetarySystem,
            3,
          ),
        ];

        const moonSystems =
          MoonGenerator
            .generateAll(
              generationKey,
              planetarySystem,
              planets,
            );

        expect(
          Object.isFrozen(
            moonSystems,
          ),
        ).toBe(true);

        expect(
          moonSystems,
        ).toHaveLength(3);

        expect(
          moonSystems.map(
            system =>
              system
                .hostPlanetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          moonSystems.map(
            system =>
              system
                .hostPlanet,
          ),
        ).toEqual(
          planets,
        );
      },
    );

    it(
      'should reject mismatched generation context, incomplete populations and reordered/foreign Planets',
      () => {
        const planets = [
          planetFixture(
            planetarySystem,
            1,
          ),
          planetFixture(
            planetarySystem,
            2,
          ),
          planetFixture(
            planetarySystem,
            3,
          ),
        ];

        expect(
          () =>
            MoonGenerator
              .generate(
                otherGenerationKey,
                planets[0],
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            MoonGenerator
              .generateAll(
                generationKey,
                planetarySystem,
                planets.slice(
                  0,
                  2,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            MoonGenerator
              .generateAll(
                generationKey,
                planetarySystem,
                [
                  planets[1],
                  planets[0],
                  planets[2],
                ],
              ),
        ).toThrow(
          RangeError,
        );

        const foreignSystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            3,
          );

        expect(
          () =>
            MoonGenerator
              .generateAll(
                generationKey,
                planetarySystem,
                [
                  planets[0],
                  planetFixture(
                    foreignSystem,
                    2,
                  ),
                  planets[2],
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a physically incoherent Planet before establishing the moon boundary',
      () => {
        const planet =
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
            MoonGenerator
              .generate(
                generationKey,
                planet,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function planetarySystemFixture(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  planetCount:
    number,
): PlanetarySystem {

  return {
    generationKey,
    locator,
    planetCount,
  } as unknown as PlanetarySystem;
}

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
        `${planetOrdinal}`
          .repeat(32),
      ),
    isTypePhysicallyCoherent:
      true,
    ...overrides,
  } as unknown as Planet;
}
