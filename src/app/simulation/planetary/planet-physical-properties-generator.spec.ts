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
  type PlanetaryArchitectureSlot,
} from '../../domain/planetary/planetary-architecture-slot';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetPhysicalPropertiesGenerator,
} from './planet-physical-properties-generator';

describe(
  'PlanetPhysicalPropertiesGenerator point 19.2',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should preserve inherited solid mass and allocate only the frozen point-17.7 gas-capture budget',
      () => {
        const fixture =
          systemFixture(
            [
              slotInput(
                5,
                0.9,
                0.8,
                new ProtoplanetCompositionMixture(
                  0,
                  1,
                  0,
                  0,
                ),
              ),
              slotInput(
                8,
                0.95,
                0.9,
                new ProtoplanetCompositionMixture(
                  0,
                  0.5,
                  0.5,
                  0,
                ),
              ),
            ],
            40,
          );

        const properties =
          PlanetPhysicalPropertiesGenerator
            .generateAll(
              generationKey,
              fixture,
            );

        const totalEnvelope =
          properties.reduce(
            (
              total,
              value,
            ) =>
              total +
              value.accretedEnvelopeMassEarth,
            0,
          );

        expect(
          totalEnvelope,
        ).toBeLessThanOrEqual(
          40 +
            1e-9,
        );

        expect(
          totalEnvelope,
        ).toBeGreaterThan(0);

        for (
          let index = 0;
          index <
            properties.length;
          index += 1
        ) {
          expect(
            properties[index]
              .inheritedSolidCoreMassEarth,
          ).toBe(
            fixture
              .planetSlots[index]
              .inheritedSolidCoreMassEarth,
          );

          expect(
            properties[index]
              .massEarth,
          ).toBeCloseTo(
            properties[index]
              .inheritedSolidCoreMassEarth +
              properties[index]
                .accretedEnvelopeMassEarth,
            12,
          );
        }
      },
    );

    it(
      'should leave a zero-envelope-potential body at its inherited solid-core mass',
      () => {
        const fixture =
          systemFixture(
            [
              slotInput(
                1,
                0,
                0.2,
                new ProtoplanetCompositionMixture(
                  0,
                  1,
                  0,
                  0,
                ),
              ),
            ],
            500,
          );

        const properties =
          PlanetPhysicalPropertiesGenerator
            .generateAll(
              generationKey,
              fixture,
            )[0];

        expect(
          properties.accretedEnvelopeMassEarth,
        ).toBe(0);

        expect(
          properties.massEarth,
        ).toBe(1);
      },
    );

    it(
      'should make a refractory/rock-rich solid body denser and smaller than an ice/volatile-rich body at equal mass without assigning types',
      () => {
        const rocky =
          PlanetPhysicalPropertiesGenerator
            .generateAll(
              generationKey,
              systemFixture(
                [
                  slotInput(
                    3,
                    0,
                    0,
                    new ProtoplanetCompositionMixture(
                      0.25,
                      0.75,
                      0,
                      0,
                    ),
                  ),
                ],
                0,
              ),
            )[0];

        const icy =
          PlanetPhysicalPropertiesGenerator
            .generateAll(
              generationKey,
              systemFixture(
                [
                  slotInput(
                    3,
                    0,
                    0,
                    new ProtoplanetCompositionMixture(
                      0,
                      0,
                      0.7,
                      0.3,
                    ),
                  ),
                ],
                0,
              ),
            )[0];

        expect(
          rocky.densityGramsPerCubicCentimeter,
        ).toBeGreaterThan(
          icy.densityGramsPerCubicCentimeter,
        );

        expect(
          rocky.radiusEarth,
        ).toBeLessThan(
          icy.radiusEarth,
        );

        expect(
          'planetType' in
            rocky,
        ).toBe(false);
      },
    );

    it(
      'should produce finite coherent radius, density and gravity for gas-rich bodies',
      () => {
        const fixture =
          systemFixture(
            [
              slotInput(
                10,
                1,
                1,
                new ProtoplanetCompositionMixture(
                  0,
                  0.4,
                  0.6,
                  0,
                ),
              ),
            ],
            300,
          );

        const properties =
          PlanetPhysicalPropertiesGenerator
            .generateAll(
              generationKey,
              fixture,
            )[0];

        expect(
          properties.massEarth,
        ).toBeGreaterThan(10);

        expect(
          properties.radiusEarth,
        ).toBeGreaterThan(0);

        expect(
          properties.densityGramsPerCubicCentimeter,
        ).toBeGreaterThan(0);

        expect(
          properties.surfaceGravityEarth,
        ).toBeGreaterThan(0);

        expect(
          Number.isFinite(
            properties.surfaceGravityMetersPerSecondSquared,
          ),
        ).toBe(true);
      },
    );

    it(
      'should be exactly deterministic and independent from single/all materialization order',
      () => {
        const fixture =
          systemFixture(
            [
              slotInput(
                2,
                0.8,
                0.6,
                new ProtoplanetCompositionMixture(
                  0,
                  0.8,
                  0.2,
                  0,
                ),
              ),
              slotInput(
                4,
                0.9,
                0.9,
                new ProtoplanetCompositionMixture(
                  0,
                  0.3,
                  0.7,
                  0,
                ),
              ),
            ],
            25,
          );

        const before =
          PlanetPhysicalPropertiesGenerator
            .generate(
              generationKey,
              fixture,
              fixture
                .planetSlots[0]
                .bodyLocator,
            );

        PlanetPhysicalPropertiesGenerator
          .generateAll(
            generationKey,
            fixture,
          );

        const after =
          PlanetPhysicalPropertiesGenerator
            .generate(
              generationKey,
              fixture,
              fixture
                .planetSlots[0]
                .bodyLocator,
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should return an immutable empty collection for a planet-free system and reject foreign locators/keys',
      () => {
        const empty =
          systemFixture(
            [],
            20,
          );

        const result =
          PlanetPhysicalPropertiesGenerator
            .generateAll(
              generationKey,
              empty,
            );

        expect(
          result,
        ).toEqual([]);

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);

        const populated =
          systemFixture(
            [
              slotInput(
                1,
                0.5,
                0.5,
                new ProtoplanetCompositionMixture(
                  0,
                  1,
                  0,
                  0,
                ),
              ),
            ],
            5,
          );

        expect(
          () =>
            PlanetPhysicalPropertiesGenerator
              .generate(
                generationKey,
                populated,
                new BodyLocator(
                  populated.locator.galaxyIndex,
                  populated.locator.sectorKey,
                  populated.locator.galacticObjectIndex +
                    1n,
                  0n,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        const foreignKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetPhysicalPropertiesGenerator
              .generateAll(
                foreignKey,
                populated,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function slotInput(
      inheritedSolidCoreMassEarth:
        number,

      inheritedEnvelopeAcquisitionPotential01:
        number,

      inheritedVolatileRetentionPotential01:
        number,

      inheritedCompositionMixture:
        ProtoplanetCompositionMixture,
    ): {
      readonly inheritedSolidCoreMassEarth:
        number;
      readonly inheritedEnvelopeAcquisitionPotential01:
        number;
      readonly inheritedVolatileRetentionPotential01:
        number;
      readonly inheritedCompositionMixture:
        ProtoplanetCompositionMixture;
    } {
      return {
        inheritedSolidCoreMassEarth,
        inheritedEnvelopeAcquisitionPotential01,
        inheritedVolatileRetentionPotential01,
        inheritedCompositionMixture,
      };
    }

    function systemFixture(
      inputs:
        readonly ReturnType<typeof slotInput>[],

      maxGasCaptureBudgetEarth:
        number,
    ): PlanetarySystem {
      const locator =
        new SystemLocator(
          4n,
          -12n,
          7n,
        );

      const slots =
        inputs.map(
          (
            input,
            index,
          ) => {
            const bodyLocator =
              new BodyLocator(
                locator.galaxyIndex,
                locator.sectorKey,
                locator.galacticObjectIndex,
                BigInt(
                  index,
                ),
              );

            return {
              planetOrdinal:
                index +
                1,
              bodyLocator,
              bodySeed:
                new BodySeed(
                  `${index + 1}`
                    .repeat(32),
                ),
              inheritedSolidCoreMassEarth:
                input.inheritedSolidCoreMassEarth,
              inheritedEnvelopeAcquisitionPotential01:
                input.inheritedEnvelopeAcquisitionPotential01,
              inheritedVolatileRetentionPotential01:
                input.inheritedVolatileRetentionPotential01,
              inheritedCompositionMixture:
                input.inheritedCompositionMixture,
            } as PlanetaryArchitectureSlot;
          },
        );

      return {
        generationKey,
        locator,
        planetCount:
          slots.length,
        planetSlots:
          slots,
        formationBlueprint: {
          maxGasCaptureBudgetEarth,
        },
      } as unknown as PlanetarySystem;
    }
  },
);
