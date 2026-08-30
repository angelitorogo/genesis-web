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
  AtmosphereGas,
} from '../../domain/planetary/atmosphere-gas';

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
  AtmosphereBulkPropertiesGenerator,
} from './atmosphere-bulk-properties-generator';

describe(
  'AtmosphereBulkPropertiesGenerator point 20.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should generate finite normalized baseline pressure/density/gases for every solid planet family',
      () => {
        const types = [
          PlanetType.ROCKY,
          PlanetType.SUPER_EARTH,
          PlanetType.DESERT,
          PlanetType.OCEAN,
          PlanetType.ICE,
          PlanetType.VOLCANIC,
        ];

        for (
          let index = 0;
          index <
            types.length;
          index += 1
        ) {
          const planet =
            planetFixture(
              types[index],
              index +
                1,
            );

          const bulk =
            AtmosphereBulkPropertiesGenerator
              .generate(
                generationKey,
                planet,
              );

          expect(
            bulk.surfacePressurePascal,
          ).not.toBeNull();

          expect(
            bulk.surfacePressurePascal!,
          ).toBeGreaterThan(0);

          expect(
            bulk.referenceDensityKilogramsPerCubicMeter,
          ).toBeGreaterThan(0);

          expect(
            bulk.gasComponents.reduce(
              (
                total,
                component,
              ) =>
                total +
                component.moleFraction01,
              0,
            ),
          ).toBeCloseTo(1, 12);
        }
      },
    );

    it(
      'should use deep-envelope pressure semantics and hydrogen-rich chemistry for mini-Neptunes and giants',
      () => {
        for (
          const type
          of [
            PlanetType.MINI_NEPTUNE,
            PlanetType.GAS_GIANT,
            PlanetType.ICE_GIANT,
          ]
        ) {
          const bulk =
            AtmosphereBulkPropertiesGenerator
              .generate(
                generationKey,
                planetFixture(
                  type,
                  1,
                ),
              );

          expect(
            bulk.pressureRegime,
          ).toBe(
            AtmospherePressureRegime.DEEP_ENVELOPE,
          );

          expect(
            bulk.surfacePressurePascal,
          ).toBeNull();

          const hydrogen =
            bulk.gasComponents.find(
              component =>
                component.gas ===
                AtmosphereGas.HYDROGEN,
            );

          expect(
            hydrogen,
          ).toBeDefined();

          expect(
            hydrogen!.moleFraction01,
          ).toBeGreaterThan(0.5);
        }
      },
    );

    it(
      'should allow a truly depleted rocky source atmosphere to resolve to vacuum',
      () => {
        const planet =
          planetFixture(
            PlanetType.ROCKY,
            1,
            {
              physicalProperties: {
                envelopeMassFraction01:
                  0,
              },
              internalComposition: {
                iceBearingFractionOfSolids01:
                  0.001,
              },
            },
          );

        const bulk =
          AtmosphereBulkPropertiesGenerator
            .generate(
              generationKey,
              planet,
            );

        expect(
          bulk.pressureRegime,
        ).toBe(
          AtmospherePressureRegime.VACUUM,
        );

        expect(
          bulk.gasComponents,
        ).toEqual([]);
      },
    );

    it(
      'should be exactly deterministic for one BodySeed and independent from unrelated materialization order',
      () => {
        const target =
          planetFixture(
            PlanetType.OCEAN,
            1,
          );

        const unrelated =
          planetFixture(
            PlanetType.VOLCANIC,
            2,
          );

        const before =
          AtmosphereBulkPropertiesGenerator
            .generate(
              generationKey,
              target,
            );

        AtmosphereBulkPropertiesGenerator
          .generate(
            generationKey,
            unrelated,
          );

        const after =
          AtmosphereBulkPropertiesGenerator
            .generate(
              generationKey,
              target,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    function planetFixture(
      planetType:
        PlanetType,

      planetOrdinal:
        number,

      overrides:
        (
          Omit<
            Partial<Planet>,
            'physicalProperties' |
              'internalComposition'
          > & {
            readonly physicalProperties?:
              Partial<
                Planet['physicalProperties']
              >;

            readonly internalComposition?:
              Partial<
                Planet['internalComposition']
              >;
          }
        ) = {},
    ): Planet {
      const systemLocator =
        new SystemLocator(
          2n,
          -5n,
          15n,
        );

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          9,
      } as PlanetarySystem;

      const locator =
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(
            planetOrdinal -
              1,
          ),
        );

      const seed =
        new BodySeed(
          planetOrdinal
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
        systemLocator,
        planetOrdinal,
        locator,
        seed,
        planetType,
        massEarth:
          deep
            ? 20
            : 1.5,
        radiusEarth:
          deep
            ? 4
            : 1.1,
        surfaceGravityEarth:
          deep
            ? 1.3
            : 1.05,
        typeClassification: {
          referenceMeanInsolationEarth:
            1,
        },
        referenceBondAlbedo01:
          0.3,
        isTypePhysicallyCoherent:
          true,
        ...overrides,
        physicalProperties: {
          envelopeMassFraction01:
            deep
              ? 0.2
              : 0.005,
          ...overrides
            .physicalProperties,
        },
        internalComposition: {
          iceBearingFractionOfSolids01:
            planetType ===
              PlanetType.ICE ||
            planetType ===
              PlanetType.OCEAN ||
            planetType ===
              PlanetType.ICE_GIANT
              ? 0.65
              : 0.15,
          ...overrides
            .internalComposition,
        },
      } as unknown as Planet;
    }
  },
);
