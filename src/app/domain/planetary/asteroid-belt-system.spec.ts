import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  AsteroidBeltSystem,
} from './asteroid-belt-system';

import {
  type PlanetarySystem,
} from './planetary-system';

describe(
  'AsteroidBeltSystem point 22.1',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const locator =
      new SystemLocator(
        4n,
        -27n,
        12n,
      );

    const seed =
      new SystemSeed(
        '0123456789ABCDEFFEDCBA9876543210',
      );

    it(
      'should retain only the exact mature PlanetarySystem context before point 22.2 materializes belts',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            5,
          );

        const beltSystem =
          new AsteroidBeltSystem(
            planetarySystem,
          );

        expect(
          beltSystem
            .hostPlanetarySystem,
        ).toBe(
          planetarySystem,
        );

        expect(
          beltSystem
            .generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          beltSystem
            .systemLocator,
        ).toBe(
          locator,
        );

        expect(
          beltSystem
            .systemSeed,
        ).toBe(
          seed,
        );

        expect(
          beltSystem
            .maturePlanetCount,
        ).toBe(5);

        for (
          const reservedProperty
          of [
            'beltCount',
            'belts',
            'innerBelts',
            'outerBelts',
            'populationProfiles',
            'asteroids',
            'comets',
            'transNeptunianObjects',
            'interstellarObjects',
            'capturedExtrasolarObjects',
          ]
        ) {
          expect(
            reservedProperty in
              beltSystem,
          ).toBe(false);
        }
      },
    );

    it(
      'should allow the phase-22 boundary to exist even when the mature planetary architecture contains zero planets',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            0,
          );

        const beltSystem =
          new AsteroidBeltSystem(
            planetarySystem,
          );

        expect(
          beltSystem
            .maturePlanetCount,
        ).toBe(0);
      },
    );

    it(
      'should reject a forged host that does not expose the canonical SystemSeed kind',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            {
              kind:
                'body',
              normalizedValue:
                seed.normalizedValue,
            } as unknown as SystemSeed,
            1,
          );

        expect(
          () =>
            new AsteroidBeltSystem(
              planetarySystem,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function systemFixture(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  seed:
    SystemSeed,

  planetCount:
    number,
): PlanetarySystem {

  return {
    generationKey,
    locator,
    seed,
    planetCount,
  } as unknown as PlanetarySystem;
}
