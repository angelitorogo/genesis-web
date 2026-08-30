import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  AsteroidBeltGenerator,
} from './asteroid-belt-generator';

describe(
  'AsteroidBeltGenerator point 22.1 V1',
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
        6n,
        113n,
        9n,
      );

    const seed =
      new SystemSeed(
        '89ABCDEF0123456776543210FEDCBA98',
      );

    it(
      'should deterministically materialize one exact asteroid-belt boundary without generating point-22.2+ products',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            7,
          );

        const first =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        const second =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          first
            .hostPlanetarySystem,
        ).toBe(
          planetarySystem,
        );

        expect(
          second
            .hostPlanetarySystem,
        ).toBe(
          planetarySystem,
        );

        expect(
          second
            .systemLocator,
        ).toBe(
          first
            .systemLocator,
        );

        expect(
          second
            .systemSeed,
        ).toBe(
          first
            .systemSeed,
        );

        expect(
          'beltCount' in first,
        ).toBe(false);

        expect(
          'asteroidSeed' in first,
        ).toBe(false);
      },
    );

    it(
      'should preserve a zero-planet mature system instead of inventing or suppressing a belt population before 22.2',
      () => {
        const planetarySystem =
          systemFixture(
            generationKey,
            locator,
            seed,
            0,
          );

        const generated =
          AsteroidBeltGenerator
            .generate(
              generationKey,
              planetarySystem,
            );

        expect(
          generated
            .maturePlanetCount,
        ).toBe(0);

        expect(
          'hasBelts' in generated,
        ).toBe(false);
      },
    );

    it(
      'should reject a PlanetarySystem from a different UniverseGenerationKey',
      () => {
        const otherKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0123-4567-89AB-CDEF-FEDC-BA98-7654-3210',
            ),
            GeneratorVersion.V1,
          );

        const foreignSystem =
          systemFixture(
            otherKey,
            locator,
            seed,
            2,
          );

        expect(
          () =>
            AsteroidBeltGenerator
              .generate(
                generationKey,
                foreignSystem,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an unsupported generator version before materialization',
      () => {
        const unsupportedKey = {
          ...generationKey,
          generatorVersion: {
            code:
              999,
          },
        } as unknown as UniverseGenerationKey;

        const planetarySystem =
          systemFixture(
            unsupportedKey,
            locator,
            seed,
            2,
          );

        expect(
          () =>
            AsteroidBeltGenerator
              .generate(
                unsupportedKey,
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
