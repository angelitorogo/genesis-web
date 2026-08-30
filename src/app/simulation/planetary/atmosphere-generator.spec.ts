import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

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
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  AtmosphereGenerator,
} from './atmosphere-generator';

describe(
  'AtmosphereGenerator point 20.1',
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
          '1111-2222-3333-4444-5555-6666-7777-8888',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should materialize one Atmosphere from the exact Planet without deriving a new identity',
      () => {
        const fixture =
          systemFixture(2);

        const atmosphere =
          AtmosphereGenerator
            .generate(
              generationKey,
              fixture.planets[1],
            );

        expect(
          atmosphere.hostPlanet,
        ).toBe(
          fixture.planets[1],
        );

        expect(
          atmosphere.locator,
        ).toBe(
          fixture.planets[1].locator,
        );

        expect(
          atmosphere.seed,
        ).toBe(
          fixture.planets[1].seed,
        );

        expect(
          atmosphere.planetOrdinal,
        ).toBe(2);
      },
    );

    it(
      'should reject a Planet from a different UniverseGenerationKey or an incoherent point-19 state',
      () => {
        const fixture =
          systemFixture(1);

        expect(
          () =>
            AtmosphereGenerator
              .generate(
                otherGenerationKey,
                fixture.planets[0],
              ),
        ).toThrow(
          RangeError,
        );

        const incoherent =
          planetFixture(
            fixture.system,
            1,
            {
              isTypePhysicallyCoherent:
                false,
            },
          );

        expect(
          () =>
            AtmosphereGenerator
              .generate(
                generationKey,
                incoherent,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should generate one frozen Atmosphere per mature Planet in frozen planetOrdinal order',
      () => {
        const fixture =
          systemFixture(3);

        const atmospheres =
          AtmosphereGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.planets,
            );

        expect(
          Object.isFrozen(
            atmospheres,
          ),
        ).toBe(true);

        expect(
          atmospheres,
        ).toHaveLength(3);

        expect(
          atmospheres.map(
            atmosphere =>
              atmosphere
                .planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          atmospheres.map(
            atmosphere =>
              atmosphere
                .hostPlanet,
          ),
        ).toEqual(
          fixture.planets,
        );
      },
    );

    it(
      'should reject incomplete, reordered or cross-system Planet collections',
      () => {
        const fixture =
          systemFixture(2);

        expect(
          () =>
            AtmosphereGenerator
              .generateAll(
                generationKey,
                fixture.system,
                fixture.planets.slice(
                  0,
                  1,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            AtmosphereGenerator
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.planets[1],
                  fixture.planets[0],
                ],
              ),
        ).toThrow(
          RangeError,
        );

        const otherFixture =
          systemFixture(
            1,
            99n,
          );

        expect(
          () =>
            AtmosphereGenerator
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.planets[0],
                  otherFixture.planets[0],
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should return a frozen empty collection for a mature system with zero planets',
      () => {
        const fixture =
          systemFixture(0);

        const atmospheres =
          AtmosphereGenerator
            .generateAll(
              generationKey,
              fixture.system,
              [],
            );

        expect(
          atmospheres,
        ).toEqual([]);

        expect(
          Object.isFrozen(
            atmospheres,
          ),
        ).toBe(true);
      },
    );

    function systemFixture(
      planetCount:
        number,

      galacticObjectIndex:
        bigint = 15n,
    ): {
      readonly system:
        PlanetarySystem;
      readonly planets:
        readonly Planet[];
    } {
      const systemLocator =
        new SystemLocator(
          2n,
          -5n,
          galacticObjectIndex,
        );

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount,
      } as PlanetarySystem;

      const planets =
        Object.freeze(
          Array.from(
            {
              length:
                planetCount,
            },
            (
              _,
              index,
            ) =>
              planetFixture(
                system,
                index +
                  1,
              ),
          ),
        );

      return {
        system,
        planets,
      };
    }

    function planetFixture(
      system:
        PlanetarySystem,

      planetOrdinal:
        number,

      overrides:
        Partial<Planet> = {},
    ): Planet {
      const bodyIndex =
        BigInt(
          planetOrdinal -
            1,
        );

      const locator =
        new BodyLocator(
          system
            .locator
            .galaxyIndex,
          system
            .locator
            .sectorKey,
          system
            .locator
            .galacticObjectIndex,
          bodyIndex,
        );

      const seedHex =
        (planetOrdinal +
          1)
          .toString(16)
          .toUpperCase()
          .repeat(32)
          .slice(0, 32);

      const seed =
        new BodySeed(
          seedHex,
        );

      return {
        generationKey,
        hostPlanetarySystem:
          system,
        systemLocator:
          system.locator,
        planetOrdinal,
        locator,
        seed,
        designation: {
          name:
            `Testara ${String.fromCharCode(97 + planetOrdinal)}`,
        },
        name:
          `Testara ${String.fromCharCode(97 + planetOrdinal)}`,
        planetType:
          PlanetType.ROCKY,
        massEarth:
          1 +
          planetOrdinal *
            0.1,
        radiusEarth:
          1,
        surfaceGravityEarth:
          1,
        physicalProperties: {
          envelopeMassFraction01:
            0.01,
        },
        typeClassification: {
          referenceMeanInsolationEarth:
            1,
        },
        referenceBondAlbedo01:
          0.2,
        isTypePhysicallyCoherent:
          true,
        ...overrides,
      } as unknown as Planet;
    }
  },
);
