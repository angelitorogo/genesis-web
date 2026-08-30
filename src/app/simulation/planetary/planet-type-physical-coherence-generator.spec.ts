import {
  BodyLocator,
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
  PlanetInternalComposition,
} from '../../domain/planetary/planet-internal-composition';

import {
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  PlanetType,
} from '../../domain/planetary/planet-type';

import {
  PlanetTypeClassification,
} from '../../domain/planetary/planet-type-classification';

import {
  PlanetTypePhysicalCoherenceIssue,
} from '../../domain/planetary/planet-type-physical-coherence-issue';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from '../../domain/planetary/planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetTypePhysicalCoherenceGenerator,
} from './planet-type-physical-coherence-generator';

interface CoherenceCase {
  readonly type:
    PlanetType;

  readonly massEarth:
    number;

  readonly envelopeFraction01:
    number;

  readonly density:
    number;

  readonly iceBearingSolidFraction01:
    number;

  readonly relation:
    PlanetaryOrbitHabitableZoneRelation;

  readonly insolation:
    number;

  readonly tidalHeating:
    number;
}

describe(
  'PlanetTypePhysicalCoherenceGenerator point 19.7',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should independently confirm all nine point-19.4 families against realized point-19.2/19.5 physics',
      () => {
        const cases:
          readonly CoherenceCase[] = [
            {
              type: PlanetType.ROCKY,
              massEarth: 1,
              envelopeFraction01: 0,
              density: 5.5,
              iceBearingSolidFraction01: 0.1,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              insolation: 1,
              tidalHeating: 0,
            },
            {
              type: PlanetType.SUPER_EARTH,
              massEarth: 5,
              envelopeFraction01: 0,
              density: 5.8,
              iceBearingSolidFraction01: 0.1,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              insolation: 1,
              tidalHeating: 0,
            },
            {
              type: PlanetType.DESERT,
              massEarth: 1,
              envelopeFraction01: 0,
              density: 5.4,
              iceBearingSolidFraction01: 0.1,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
              insolation: 2,
              tidalHeating: 0,
            },
            {
              type: PlanetType.OCEAN,
              massEarth: 1.3,
              envelopeFraction01: 0,
              density: 4.2,
              iceBearingSolidFraction01: 0.6,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              insolation: 1,
              tidalHeating: 0,
            },
            {
              type: PlanetType.ICE,
              massEarth: 1.2,
              envelopeFraction01: 0,
              density: 3.2,
              iceBearingSolidFraction01: 0.7,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              insolation: 0.1,
              tidalHeating: 0,
            },
            {
              type: PlanetType.VOLCANIC,
              massEarth: 1,
              envelopeFraction01: 0,
              density: 5.7,
              iceBearingSolidFraction01: 0.05,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_INTERIOR_TO_ZONE,
              insolation: 400,
              tidalHeating: 0,
            },
            {
              type: PlanetType.MINI_NEPTUNE,
              massEarth: 6,
              envelopeFraction01: 0.08,
              density: 2.2,
              iceBearingSolidFraction01: 0.2,
              relation: PlanetaryOrbitHabitableZoneRelation.CROSSES_OUTER_EDGE,
              insolation: 0.5,
              tidalHeating: 0,
            },
            {
              type: PlanetType.GAS_GIANT,
              massEarth: 100,
              envelopeFraction01: 0.8,
              density: 1.3,
              iceBearingSolidFraction01: 0.1,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              insolation: 0.04,
              tidalHeating: 0,
            },
            {
              type: PlanetType.ICE_GIANT,
              massEarth: 15,
              envelopeFraction01: 0.18,
              density: 1.6,
              iceBearingSolidFraction01: 0.65,
              relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              insolation: 0.02,
              tidalHeating: 0,
            },
          ];

        for (
          const testCase
          of cases
        ) {
          const fixture =
            physicalFixture(
              testCase,
            );

          const assessment =
            PlanetTypePhysicalCoherenceGenerator
              .generate(
                generationKey,
                fixture.physical,
                fixture.classification,
                fixture.composition,
              );

          expect(
            assessment.isCoherent,
          ).toBe(true);

          expect(
            assessment.expectedPlanetType,
          ).toBe(
            testCase.type,
          );

          expect(
            assessment.issues,
          ).toEqual([]);
        }
      },
    );

    it(
      'should diagnose a type label that contradicts the same frozen bulk/composition state without mutating it',
      () => {
        const fixture =
          physicalFixture({
            type: PlanetType.ROCKY,
            massEarth: 5,
            envelopeFraction01: 0,
            density: 5.8,
            iceBearingSolidFraction01: 0.1,
            relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            insolation: 1,
            tidalHeating: 0,
          });

        const assessment =
          PlanetTypePhysicalCoherenceGenerator
            .generate(
              generationKey,
              fixture.physical,
              fixture.classification,
              fixture.composition,
            );

        expect(
          assessment.planetType,
        ).toBe(
          PlanetType.ROCKY,
        );

        expect(
          assessment.expectedPlanetType,
        ).toBe(
          PlanetType.SUPER_EARTH,
        );

        expect(
          assessment.issues,
        ).toEqual([
          PlanetTypePhysicalCoherenceIssue.TYPE_RULE_MISMATCH,
        ]);
      },
    );

    it(
      'should diagnose internal envelope and ice-bearing budgets that drift from the point-19.2/19.4 sources',
      () => {
        const fixture =
          physicalFixture({
            type: PlanetType.ROCKY,
            massEarth: 1,
            envelopeFraction01: 0,
            density: 5.5,
            iceBearingSolidFraction01: 0.1,
            relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            insolation: 1,
            tidalHeating: 0,
          });

        const driftedComposition =
          compositionFor(
            fixture.physical,
            0.10,
            fixture.classification.sourceIceBearingSolidFraction01,
            0.40,
          );

        const assessment =
          PlanetTypePhysicalCoherenceGenerator
            .generate(
              generationKey,
              fixture.physical,
              fixture.classification,
              driftedComposition,
            );

        expect(
          assessment.issues,
        ).toEqual([
          PlanetTypePhysicalCoherenceIssue.ENVELOPE_MASS_FRACTION_MISMATCH,
          PlanetTypePhysicalCoherenceIssue.ICE_BEARING_COMPOSITION_MISMATCH,
        ]);
      },
    );

    it(
      'should keep the V1 ice-giant upper mass boundary explicit so an ice-rich 50-Earth-mass world resolves as a gas giant',
      () => {
        const fixture =
          physicalFixture({
            type: PlanetType.GAS_GIANT,
            massEarth: 50,
            envelopeFraction01: 0.5,
            density: 1.5,
            iceBearingSolidFraction01: 0.7,
            relation: PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
            insolation: 0.05,
            tidalHeating: 0,
          });

        const assessment =
          PlanetTypePhysicalCoherenceGenerator
            .generate(
              generationKey,
              fixture.physical,
              fixture.classification,
              fixture.composition,
            );

        expect(
          assessment.expectedPlanetType,
        ).toBe(
          PlanetType.GAS_GIANT,
        );

        expect(
          assessment.isCoherent,
        ).toBe(true);
      },
    );

    function physicalFixture(
      testCase:
        CoherenceCase,
    ): {
      readonly physical:
        PlanetPhysicalProperties;
      readonly classification:
        PlanetTypeClassification;
      readonly composition:
        PlanetInternalComposition;
    } {
      const locator =
        new BodyLocator(
          0n,
          0n,
          0n,
          0n,
        );

      const seed =
        new BodySeed(
          '11111111111111111111111111111111',
        );

      const envelopeMassEarth =
        testCase.massEarth *
        testCase.envelopeFraction01;

      const solidMassEarth =
        testCase.massEarth -
        envelopeMassEarth;

      const radiusEarth =
        Math.cbrt(
          testCase.massEarth *
          PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER /
          testCase.density,
        );

      const surfaceGravityEarth =
        testCase.massEarth /
        radiusEarth **
          2;

      const physical =
        new PlanetPhysicalProperties(
          1,
          locator,
          seed,
          solidMassEarth,
          envelopeMassEarth,
          testCase.massEarth,
          radiusEarth,
          testCase.density,
          surfaceGravityEarth,
          surfaceGravityEarth *
            PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
        );

      const classification =
        new PlanetTypeClassification(
          1,
          locator,
          seed,
          testCase.type,
          physical.massEarth,
          physical.radiusEarth,
          physical.densityGramsPerCubicCentimeter,
          physical.envelopeMassFraction01,
          testCase.iceBearingSolidFraction01,
          testCase.relation,
          PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
          testCase.insolation,
          testCase.tidalHeating,
        );

      return {
        physical,
        classification,
        composition:
          compositionFor(
            physical,
            physical.envelopeMassFraction01,
            testCase.iceBearingSolidFraction01,
          ),
      };
    }

    function compositionFor(
      physical:
        PlanetPhysicalProperties,

      envelopeFraction01:
        number,

      sourceIceBearingFraction01:
        number,

      internalIceBearingFractionOverride01?:
        number,
    ): PlanetInternalComposition {
      const envelopeMassEarth =
        physical.massEarth *
        envelopeFraction01;

      const solidMassEarth =
        physical.massEarth -
        envelopeMassEarth;

      const sourceRockyFraction01 =
        1 -
        sourceIceBearingFraction01;

      const sourceVolatileRichFraction01 =
        sourceIceBearingFraction01;

      const expectedInternalIceBearingFraction01 =
        sourceRockyFraction01 *
          0.06 +
        sourceVolatileRichFraction01 *
          0.68;

      const internalIceBearingFraction01 =
        internalIceBearingFractionOverride01 ??
        expectedInternalIceBearingFraction01;

      const iceBearingMassEarth =
        solidMassEarth *
        internalIceBearingFraction01;

      const dryMassEarth =
        solidMassEarth -
        iceBearingMassEarth;

      return new PlanetInternalComposition(
        physical.planetOrdinal,
        physical.bodyLocator,
        physical.bodySeed,
        solidMassEarth,
        envelopeMassEarth,
        0,
        sourceRockyFraction01,
        0,
        sourceVolatileRichFraction01,
        dryMassEarth *
          0.32,
        dryMassEarth *
          0.68,
        iceBearingMassEarth *
          0.7,
        iceBearingMassEarth *
          0.3,
        envelopeMassEarth,
      );
    }
  },
);
