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
  AtmospherePressureRegime,
} from '../../domain/planetary/atmosphere-pressure-regime';

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
  'AtmosphereGenerator through point 20.3',
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
      'should materialize one Atmosphere with source bulk properties and point-20.3 retained atmosphere while preserving identity',
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
          atmosphere.surfacePressurePascal,
        ).not.toBeNull();

        expect(
          atmosphere.referenceDensityKilogramsPerCubicMeter,
        ).toBeGreaterThan(0);

        expect(
          atmosphere.gasComposition.length,
        ).toBeGreaterThan(0);

        expect(
          atmosphere.retainedGasComposition.length,
        ).toBeGreaterThan(0);

        expect(
          atmosphere.atmosphericInventoryRetentionFraction01,
        ).toBeGreaterThan(0);

        expect(
          atmosphere.retainedSurfacePressurePascal! <=
            atmosphere.surfacePressurePascal!,
        ).toBe(true);
      },
    );

    it(
      'should preserve deep-envelope semantics for giant planets',
      () => {
        const fixture =
          systemFixture(
            1,
            15n,
            PlanetType.GAS_GIANT,
          );

        const atmosphere =
          AtmosphereGenerator
            .generate(
              generationKey,
              fixture.planets[0],
            );

        expect(
          atmosphere.pressureRegime,
        ).toBe(
          AtmospherePressureRegime.DEEP_ENVELOPE,
        );

        expect(
          atmosphere.surfacePressurePascal,
        ).toBeNull();

        expect(
          atmosphere.isDeepEnvelope,
        ).toBe(true);

        expect(
          atmosphere.retainedSurfacePressurePascal,
        ).toBeNull();

        expect(
          atmosphere.atmosphericInventoryRetentionFraction01,
        ).toBeGreaterThan(0.97);
      },
    );

    it(
      'should generate a frozen ordered collection and reject cross-context inputs',
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
          atmospheres.map(
            atmosphere =>
              atmosphere.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

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

        expect(
          () =>
            AtmosphereGenerator
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.planets[1],
                  fixture.planets[0],
                  fixture.planets[2],
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

      planetType:
        PlanetType = PlanetType.ROCKY,
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
                planetType,
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

      planetType:
        PlanetType,
    ): Planet {
      const bodyIndex =
        BigInt(
          planetOrdinal -
            1,
        );

      const locator =
        new BodyLocator(
          system.locator.galaxyIndex,
          system.locator.sectorKey,
          system.locator.galacticObjectIndex,
          bodyIndex,
        );

      const seed =
        new BodySeed(
          (planetOrdinal +
            1)
            .toString(16)
            .toUpperCase()
            .repeat(32)
            .slice(0, 32),
        );

      const deep =
        planetType ===
          PlanetType.MINI_NEPTUNE ||
        planetType ===
          PlanetType.GAS_GIANT ||
        planetType ===
          PlanetType.ICE_GIANT;

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
        planetType,
        massEarth:
          deep
            ? 100
            : 1 +
              planetOrdinal *
                0.1,
        radiusEarth:
          deep
            ? 9
            : 1,
        surfaceGravityEarth:
          1,
        physicalProperties: {
          envelopeMassFraction01:
            deep
              ? 0.6
              : 0.01,
        },
        internalComposition: {
          iceBearingFractionOfSolids01:
            deep
              ? 0.2
              : 0.15,
        },
        typeClassification: {
          referenceMeanInsolationEarth:
            1,
        },
        referenceBondAlbedo01:
          0.2,
        isTypePhysicallyCoherent:
          true,
      } as unknown as Planet;
    }
  },
);
