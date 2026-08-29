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
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

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
  PlanetInternalCompositionGenerator,
} from './planet-internal-composition-generator';

describe(
  'PlanetInternalCompositionGenerator point 19.5',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should map the four frozen source families to distinct conserved V1 material profiles',
      () => {
        const fixture =
          systemFixture([
            new ProtoplanetCompositionMixture(
              1,
              0,
              0,
              0,
            ),
            new ProtoplanetCompositionMixture(
              0,
              1,
              0,
              0,
            ),
            new ProtoplanetCompositionMixture(
              0,
              0,
              1,
              0,
            ),
            new ProtoplanetCompositionMixture(
              0,
              0,
              0,
              1,
            ),
          ]);

        const compositions =
          PlanetInternalCompositionGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            );

        expectProfile(
          compositions[0],
          0.46,
          0.53,
          0.005,
          0.005,
        );

        expectProfile(
          compositions[1],
          0.30,
          0.64,
          0.04,
          0.02,
        );

        expectProfile(
          compositions[2],
          0.10,
          0.45,
          0.36,
          0.09,
        );

        expectProfile(
          compositions[3],
          0.08,
          0.24,
          0.34,
          0.34,
        );
      },
    );

    it(
      'should linearly preserve a mixed formation lineage without introducing a new random composition draw',
      () => {
        const fixture =
          systemFixture([
            new ProtoplanetCompositionMixture(
              0.25,
              0.25,
              0.25,
              0.25,
            ),
          ]);

        const first =
          PlanetInternalCompositionGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        const second =
          PlanetInternalCompositionGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          first.metallicCoreMassEarth /
          first.sourceSolidMassEarth,
        ).toBeCloseTo(
          0.235,
          12,
        );

        expect(
          first.silicateInteriorMassEarth /
          first.sourceSolidMassEarth,
        ).toBeCloseTo(
          0.465,
          12,
        );

        expect(
          first.condensedIceMassEarth /
          first.sourceSolidMassEarth,
        ).toBeCloseTo(
          0.18625,
          12,
        );

        expect(
          first.volatileRichInteriorMassEarth /
          first.sourceSolidMassEarth,
        ).toBeCloseTo(
          0.11375,
          12,
        );
      },
    );

    it(
      'should preserve the exact point-19.2 gas envelope instead of allocating a second gas reservoir',
      () => {
        const fixture =
          systemFixture([
            new ProtoplanetCompositionMixture(
              0,
              0.2,
              0.4,
              0.4,
            ),
          ], 3);

        const composition =
          PlanetInternalCompositionGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        expect(
          composition.sourceSolidMassEarth,
        ).toBe(10);

        expect(
          composition.sourceEnvelopeMassEarth,
        ).toBe(3);

        expect(
          composition.gaseousEnvelopeMassEarth,
        ).toBe(3);

        expect(
          composition.totalMassEarth,
        ).toBe(13);

        expect(
          composition.gaseousEnvelopeMassFraction01,
        ).toBeCloseTo(
          3 /
            13,
          12,
        );
      },
    );

    it(
      'should return an immutable ordered population and reject reordered or foreign physical states',
      () => {
        const fixture =
          systemFixture([
            new ProtoplanetCompositionMixture(
              0,
              1,
              0,
              0,
            ),
            new ProtoplanetCompositionMixture(
              0,
              0,
              1,
              0,
            ),
          ]);

        const compositions =
          PlanetInternalCompositionGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            );

        expect(
          Object.isFrozen(
            compositions,
          ),
        ).toBe(true);

        expect(
          compositions.map(
            value =>
              value.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
        ]);

        expect(
          () =>
            PlanetInternalCompositionGenerator
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.physicalProperties[1],
                  fixture.physicalProperties[0],
                ],
              ),
        ).toThrow(
          RangeError,
        );

        const otherSeed =
          new BodySeed(
            'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
          );

        const first =
          fixture.physicalProperties[0];

        const foreign =
          new PlanetPhysicalProperties(
            first.planetOrdinal,
            first.bodyLocator,
            otherSeed,
            first.inheritedSolidCoreMassEarth,
            first.accretedEnvelopeMassEarth,
            first.massEarth,
            first.radiusEarth,
            first.densityGramsPerCubicCentimeter,
            first.surfaceGravityEarth,
            first.surfaceGravityMetersPerSecondSquared,
          );

        expect(
          () =>
            PlanetInternalCompositionGenerator
              .generate(
                generationKey,
                fixture.system,
                foreign,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a system from another UniverseGenerationKey',
      () => {
        const fixture =
          systemFixture([
            new ProtoplanetCompositionMixture(
              0,
              1,
              0,
              0,
            ),
          ]);

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetInternalCompositionGenerator
              .generate(
                otherGenerationKey,
                fixture.system,
                fixture.physicalProperties[0],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function systemFixture(
      mixtures:
        readonly ProtoplanetCompositionMixture[],

      envelopeMassEarth =
        0,
    ): {
      readonly system:
        PlanetarySystem;
      readonly physicalProperties:
        readonly PlanetPhysicalProperties[];
    } {
      const systemLocator =
        new SystemLocator(
          4n,
          -12n,
          7n,
        );

      const slots:
        PlanetaryArchitectureSlot[] = [];

      const physicalProperties:
        PlanetPhysicalProperties[] = [];

      for (
        let index = 0;
        index <
          mixtures.length;
        index +=
          1
      ) {
        const planetOrdinal =
          index +
          1;

        const bodyLocator =
          new BodyLocator(
            systemLocator.galaxyIndex,
            systemLocator.sectorKey,
            systemLocator.galacticObjectIndex,
            BigInt(
              index,
            ),
          );

        const bodySeed =
          new BodySeed(
            `${planetOrdinal}`
              .repeat(32),
          );

        const solidMassEarth =
          10;

        slots.push({
          planetOrdinal,
          bodyLocator,
          bodySeed,
          inheritedSolidCoreMassEarth:
            solidMassEarth,
          inheritedCompositionMixture:
            mixtures[index],
        } as PlanetaryArchitectureSlot);

        const massEarth =
          solidMassEarth +
          envelopeMassEarth;

        const density =
          PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER;

        const radiusEarth =
          Math.cbrt(
            massEarth,
          );

        const surfaceGravityEarth =
          massEarth /
          radiusEarth **
            2;

        physicalProperties.push(
          new PlanetPhysicalProperties(
            planetOrdinal,
            bodyLocator,
            bodySeed,
            solidMassEarth,
            envelopeMassEarth,
            massEarth,
            radiusEarth,
            density,
            surfaceGravityEarth,
            surfaceGravityEarth *
              PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
          ),
        );
      }

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          mixtures.length,
        planetSlots:
          slots,
      } as unknown as PlanetarySystem;

      return {
        system,
        physicalProperties,
      };
    }

    function expectProfile(
      composition:
        ReturnType<
          typeof PlanetInternalCompositionGenerator.generate
        >,

      metallicFraction:
        number,

      silicateFraction:
        number,

      iceFraction:
        number,

      volatileFraction:
        number,
    ): void {
      expect(
        composition.metallicCoreMassEarth /
        composition.sourceSolidMassEarth,
      ).toBeCloseTo(
        metallicFraction,
        12,
      );

      expect(
        composition.silicateInteriorMassEarth /
        composition.sourceSolidMassEarth,
      ).toBeCloseTo(
        silicateFraction,
        12,
      );

      expect(
        composition.condensedIceMassEarth /
        composition.sourceSolidMassEarth,
      ).toBeCloseTo(
        iceFraction,
        12,
      );

      expect(
        composition.volatileRichInteriorMassEarth /
        composition.sourceSolidMassEarth,
      ).toBeCloseTo(
        volatileFraction,
        12,
      );

      expect(
        composition.totalMassEarth,
      ).toBeCloseTo(
        composition.sourceSolidMassEarth +
          composition.sourceEnvelopeMassEarth,
        12,
      );
    }
  },
);
