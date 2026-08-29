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
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  type PlanetaryOrbitHabitableZoneClassification,
} from '../../domain/planetary/planetary-orbit-habitable-zone-classification';

import {
  type PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  type PlanetaryOrbitalPeriod,
} from '../../domain/planetary/planetary-orbital-period';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

import {
  ProtoplanetCompositionMixture,
} from '../../domain/planetary/protoplanet-composition-mixture';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetTypeGenerator,
} from './planet-type-generator';

interface TypeCase {
  readonly massEarth:
    number;

  readonly envelopeFraction01:
    number;

  readonly densityGramsPerCubicCentimeter:
    number;

  readonly iceBearingSolidFraction01:
    number;

  readonly semiMajorAxisAu:
    number;

  readonly eccentricity:
    number;

  readonly radiativeRelation:
    PlanetaryOrbitHabitableZoneRelation;

  readonly expectedType:
    PlanetType;
}

describe(
  'PlanetTypeGenerator point 19.4',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should derive all nine roadmap families from distinct frozen physical/formation/orbit contexts',
      () => {
        const cases:
          readonly TypeCase[] = [
            {
              massEarth: 1,
              envelopeFraction01: 0,
              densityGramsPerCubicCentimeter: 5.5,
              iceBearingSolidFraction01: 0.10,
              semiMajorAxisAu: 1,
              eccentricity: 0.02,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              expectedType:
                PlanetType.ROCKY,
            },
            {
              massEarth: 5,
              envelopeFraction01: 0,
              densityGramsPerCubicCentimeter: 5.8,
              iceBearingSolidFraction01: 0.10,
              semiMajorAxisAu: 1,
              eccentricity: 0.02,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              expectedType:
                PlanetType.SUPER_EARTH,
            },
            {
              massEarth: 1,
              envelopeFraction01: 0,
              densityGramsPerCubicCentimeter: 5.4,
              iceBearingSolidFraction01: 0.10,
              semiMajorAxisAu: 0.7,
              eccentricity: 0.02,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
              expectedType:
                PlanetType.DESERT,
            },
            {
              massEarth: 1.3,
              envelopeFraction01: 0,
              densityGramsPerCubicCentimeter: 4.2,
              iceBearingSolidFraction01: 0.60,
              semiMajorAxisAu: 1,
              eccentricity: 0.03,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              expectedType:
                PlanetType.OCEAN,
            },
            {
              massEarth: 1.2,
              envelopeFraction01: 0,
              densityGramsPerCubicCentimeter: 3.2,
              iceBearingSolidFraction01: 0.70,
              semiMajorAxisAu: 3,
              eccentricity: 0.04,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              expectedType:
                PlanetType.ICE,
            },
            {
              massEarth: 1,
              envelopeFraction01: 0,
              densityGramsPerCubicCentimeter: 5.7,
              iceBearingSolidFraction01: 0.05,
              semiMajorAxisAu: 0.05,
              eccentricity: 0.10,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
              expectedType:
                PlanetType.VOLCANIC,
            },
            {
              massEarth: 6,
              envelopeFraction01: 0.08,
              densityGramsPerCubicCentimeter: 2.2,
              iceBearingSolidFraction01: 0.20,
              semiMajorAxisAu: 1.4,
              eccentricity: 0.04,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.CROSSES_OUTER_EDGE,
              expectedType:
                PlanetType.MINI_NEPTUNE,
            },
            {
              massEarth: 100,
              envelopeFraction01: 0.80,
              densityGramsPerCubicCentimeter: 1.3,
              iceBearingSolidFraction01: 0.10,
              semiMajorAxisAu: 5,
              eccentricity: 0.05,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              expectedType:
                PlanetType.GAS_GIANT,
            },
            {
              massEarth: 15,
              envelopeFraction01: 0.18,
              densityGramsPerCubicCentimeter: 1.6,
              iceBearingSolidFraction01: 0.65,
              semiMajorAxisAu: 8,
              eccentricity: 0.06,
              radiativeRelation:
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              expectedType:
                PlanetType.ICE_GIANT,
            },
          ];

        for (
          const testCase
          of cases
        ) {
          const fixture =
            singlePlanetFixture(
              testCase,
            );

          const classification =
            PlanetTypeGenerator
              .generate(
                generationKey,
                fixture.system,
                fixture.physicalProperties,
              );

          expect(
            classification.planetType,
          ).toBe(
            testCase.expectedType,
          );

          expect(
            classification.sourceMassEarth,
          ).toBe(
            testCase.massEarth,
          );

          expect(
            classification.sourceEnvelopeMassFraction01,
          ).toBeCloseTo(
            testCase.envelopeFraction01,
            12,
          );

          expect(
            classification.sourceIceBearingSolidFraction01,
          ).toBeCloseTo(
            testCase.iceBearingSolidFraction01,
            12,
          );
        }
      },
    );

    it(
      'should prefer an ice giant over a gas giant when a Neptune-scale envelope-rich world inherits an ice-rich solid reservoir',
      () => {
        const fixture =
          singlePlanetFixture({
            massEarth: 20,
            envelopeFraction01: 0.50,
            densityGramsPerCubicCentimeter: 1.5,
            iceBearingSolidFraction01: 0.75,
            semiMajorAxisAu: 10,
            eccentricity: 0.03,
            radiativeRelation:
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
            expectedType:
              PlanetType.ICE_GIANT,
          });

        expect(
          PlanetTypeGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            )
            .planetType,
        ).toBe(
          PlanetType.ICE_GIANT,
        );
      },
    );

    it(
      'should not promote reference-only stellar HZ geometry into present-day ocean/desert/ice thermal phenotypes',
      () => {
        const fixture =
          singlePlanetFixture({
            massEarth: 1.3,
            envelopeFraction01: 0,
            densityGramsPerCubicCentimeter: 4.2,
            iceBearingSolidFraction01: 0.60,
            semiMajorAxisAu: 1,
            eccentricity: 0.03,
            radiativeRelation:
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            expectedType:
              PlanetType.OCEAN,
          });

        (
          fixture.system.habitableZone as {
            stellarEvolutionRegime:
              PlanetarySystemHabitableZoneEvolutionRegime;
          }
        ).stellarEvolutionRegime =
          PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY;

        expect(
          PlanetTypeGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            )
            .planetType,
        ).toBe(
          PlanetType.ROCKY,
        );
      },
    );

    it(
      'should expose auditable mean-insolation and tidal-heating diagnostics without creating new random identity',
      () => {
        const fixture =
          singlePlanetFixture({
            massEarth: 1,
            envelopeFraction01: 0,
            densityGramsPerCubicCentimeter: 5.5,
            iceBearingSolidFraction01: 0.1,
            semiMajorAxisAu: 0.5,
            eccentricity: 0.2,
            radiativeRelation:
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
            expectedType:
              PlanetType.DESERT,
          });

        const before =
          PlanetTypeGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            );

        const after =
          PlanetTypeGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            );

        const expectedMeanInsolation =
          1 /
          (
            0.5 **
              2 *
            Math.sqrt(
              1 -
              0.2 **
                2,
            )
          );

        expect(
          before.referenceMeanInsolationEarth,
        ).toBeCloseTo(
          expectedMeanInsolation,
          12,
        );

        expect(
          before.tidalHeatingProxy,
        ).toBeGreaterThanOrEqual(0);

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should generate one frozen classification per physical planet and preserve ordinal order',
      () => {
        const fixture =
          multiPlanetFixture();

        const classifications =
          PlanetTypeGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            );

        expect(
          Object.isFrozen(
            classifications,
          ),
        ).toBe(true);

        expect(
          classifications.map(
            classification =>
              classification.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
        ]);

        expect(
          classifications.map(
            classification =>
              classification.planetType,
          ),
        ).toEqual([
          PlanetType.ROCKY,
          PlanetType.ICE,
        ]);
      },
    );

    it(
      'should reject foreign generation context, foreign BodySeed identity and incomplete physical populations',
      () => {
        const fixture =
          multiPlanetFixture();

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '1111-2222-3333-4444-5555-6666-7777-8888',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetTypeGenerator
              .generateAll(
                otherGenerationKey,
                fixture.system,
                fixture.physicalProperties,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            PlanetTypeGenerator
              .generateAll(
                generationKey,
                fixture.system,
                fixture.physicalProperties.slice(
                  0,
                  1,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        const first =
          fixture.physicalProperties[0];

        const foreign =
          new PlanetPhysicalProperties(
            first.planetOrdinal,
            first.bodyLocator,
            new BodySeed(
              'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
            ),
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
            PlanetTypeGenerator
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

    function singlePlanetFixture(
      testCase:
        TypeCase,
    ): {
      readonly system:
        PlanetarySystem;
      readonly physicalProperties:
        PlanetPhysicalProperties;
    } {
      const locator =
        new SystemLocator(
          4n,
          -12n,
          7n,
        );

      const bodyLocator =
        new BodyLocator(
          locator.galaxyIndex,
          locator.sectorKey,
          locator.galacticObjectIndex,
          0n,
        );

      const bodySeed =
        new BodySeed(
          '11111111111111111111111111111111',
        );

      const inheritedSolidCoreMassEarth =
        testCase.massEarth *
        (
          1 -
          testCase.envelopeFraction01
        );

      const physicalProperties =
        physical(
          1,
          bodyLocator,
          bodySeed,
          inheritedSolidCoreMassEarth,
          testCase.massEarth,
          testCase.densityGramsPerCubicCentimeter,
        );

      const slot = {
        planetOrdinal:
          1,
        bodyLocator,
        bodySeed,
        inheritedSolidCoreMassEarth,
        inheritedCompositionMixture:
          mixture(
            testCase.iceBearingSolidFraction01,
          ),
      } as PlanetaryArchitectureSlot;

      const orbit = {
        planetOrdinal:
          1,
        bodyLocator,
        bodySeed,
        semiMajorAxisAu:
          testCase.semiMajorAxisAu,
        eccentricity:
          testCase.eccentricity,
      } as PlanetaryOrbitalElements;

      const period = {
        planetOrdinal:
          1,
        bodyLocator,
        bodySeed,
        gravitatingMassSolar:
          1,
      } as PlanetaryOrbitalPeriod;

      const hzClassification = {
        planetOrdinal:
          1,
        bodyLocator,
        bodySeed,
        radiativeRelation:
          testCase.radiativeRelation,
      } as PlanetaryOrbitHabitableZoneClassification;

      const system = {
        generationKey,
        locator,
        planetCount:
          1,
        planetSlots: [
          slot,
        ],
        orbits: [
          orbit,
        ],
        orbitalPeriods: [
          period,
        ],
        orbitHabitableZoneClassifications: [
          hzClassification,
        ],
        habitableZone: {
          referenceLuminositySolar:
            1,
          stellarEvolutionRegime:
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
        },
      } as unknown as PlanetarySystem;

      return {
        system,
        physicalProperties,
      };
    }

    function multiPlanetFixture(): {
      readonly system:
        PlanetarySystem;
      readonly physicalProperties:
        readonly PlanetPhysicalProperties[];
    } {
      const locator =
        new SystemLocator(
          5n,
          22n,
          3n,
        );

      const definitions = [
        {
          seedHex:
            '22222222222222222222222222222222',
          massEarth:
            1,
          density:
            5.5,
          iceFraction:
            0.1,
          semiMajorAxisAu:
            1,
          relation:
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        },
        {
          seedHex:
            '33333333333333333333333333333333',
          massEarth:
            1.2,
          density:
            3.2,
          iceFraction:
            0.7,
          semiMajorAxisAu:
            3,
          relation:
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
        },
      ] as const;

      const slots:
        PlanetaryArchitectureSlot[] = [];

      const orbits:
        PlanetaryOrbitalElements[] = [];

      const periods:
        PlanetaryOrbitalPeriod[] = [];

      const classifications:
        PlanetaryOrbitHabitableZoneClassification[] = [];

      const physicalProperties:
        PlanetPhysicalProperties[] = [];

      for (
        let index = 0;
        index <
          definitions.length;
        index += 1
      ) {
        const definition =
          definitions[index];

        const planetOrdinal =
          index +
          1;

        const bodyLocator =
          new BodyLocator(
            locator.galaxyIndex,
            locator.sectorKey,
            locator.galacticObjectIndex,
            BigInt(
              index,
            ),
          );

        const bodySeed =
          new BodySeed(
            definition.seedHex,
          );

        const properties =
          physical(
            planetOrdinal,
            bodyLocator,
            bodySeed,
            definition.massEarth,
            definition.massEarth,
            definition.density,
          );

        slots.push({
          planetOrdinal,
          bodyLocator,
          bodySeed,
          inheritedSolidCoreMassEarth:
            definition.massEarth,
          inheritedCompositionMixture:
            mixture(
              definition.iceFraction,
            ),
        } as PlanetaryArchitectureSlot);

        orbits.push({
          planetOrdinal,
          bodyLocator,
          bodySeed,
          semiMajorAxisAu:
            definition.semiMajorAxisAu,
          eccentricity:
            0.02,
        } as PlanetaryOrbitalElements);

        periods.push({
          planetOrdinal,
          bodyLocator,
          bodySeed,
          gravitatingMassSolar:
            1,
        } as PlanetaryOrbitalPeriod);

        classifications.push({
          planetOrdinal,
          bodyLocator,
          bodySeed,
          radiativeRelation:
            definition.relation,
        } as PlanetaryOrbitHabitableZoneClassification);

        physicalProperties.push(
          properties,
        );
      }

      const system = {
        generationKey,
        locator,
        planetCount:
          definitions.length,
        planetSlots:
          slots,
        orbits,
        orbitalPeriods:
          periods,
        orbitHabitableZoneClassifications:
          classifications,
        habitableZone: {
          referenceLuminositySolar:
            1,
          stellarEvolutionRegime:
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
        },
      } as unknown as PlanetarySystem;

      return {
        system,
        physicalProperties,
      };
    }

    function physical(
      planetOrdinal:
        number,

      bodyLocator:
        BodyLocator,

      bodySeed:
        BodySeed,

      inheritedSolidCoreMassEarth:
        number,

      massEarth:
        number,

      densityGramsPerCubicCentimeter:
        number,
    ): PlanetPhysicalProperties {

      const accretedEnvelopeMassEarth =
        massEarth -
        inheritedSolidCoreMassEarth;

      const radiusEarth =
        Math.cbrt(
          massEarth *
          PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER /
          densityGramsPerCubicCentimeter,
        );

      const surfaceGravityEarth =
        massEarth /
        radiusEarth **
          2;

      return new PlanetPhysicalProperties(
        planetOrdinal,
        bodyLocator,
        bodySeed,
        inheritedSolidCoreMassEarth,
        accretedEnvelopeMassEarth,
        massEarth,
        radiusEarth,
        densityGramsPerCubicCentimeter,
        surfaceGravityEarth,
        surfaceGravityEarth *
          PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
      );
    }

    function mixture(
      iceBearingFraction01:
        number,
    ): ProtoplanetCompositionMixture {

      return new ProtoplanetCompositionMixture(
        0,
        1 -
          iceBearingFraction01,
        iceBearingFraction01,
        0,
      );
    }
  },
);
