import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  type PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

import {
  type PlanetaryDesignation,
} from './planetary-designation';

import {
  type PlanetaryOrbitHabitableZoneClassification,
} from './planetary-orbit-habitable-zone-classification';

import {
  PlanetInternalComposition,
} from './planet-internal-composition';

import {
  PlanetSurfaceBaseProperties,
} from './planet-surface-base-properties';

import {
  PlanetSurfaceBaseRegime,
} from './planet-surface-base-regime';

import {
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from './planet-physical-properties';

import {
  apparentSolarDayHours,
  PlanetRotationProperties,
} from './planet-rotation-properties';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetTypeClassification,
} from './planet-type-classification';

import {
  type PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

import {
  type PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

import {
  Planet,
} from './planet';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

describe(
  'Planet points 19.1-19.6',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        3n,
        -17n,
        8n,
      );

    const firstLocator =
      new BodyLocator(
        3n,
        -17n,
        8n,
        0n,
      );

    const firstSeed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should bind frozen point-18 projections plus coherent point-19.2-19.6 physical products into one planet',
      () => {
        const fixture =
          planetFixture();

        const planet =
          new Planet(
            fixture.system,
            1,
            fixture.slot,
            fixture.orbit,
            fixture.period,
            fixture.hzClassification,
            fixture.designation,
            fixture.physicalProperties,
            fixture.rotationProperties,
            fixture.typeClassification,
            fixture.internalComposition,
            fixture.surfaceBaseProperties,
          );

        expect(
          planet.hostPlanetarySystem,
        ).toBe(
          fixture.system,
        );

        expect(
          planet.architectureSlot,
        ).toBe(
          fixture.slot,
        );

        expect(
          planet.orbit,
        ).toBe(
          fixture.orbit,
        );

        expect(
          planet.orbitalPeriod,
        ).toBe(
          fixture.period,
        );

        expect(
          planet.habitableZoneClassification,
        ).toBe(
          fixture.hzClassification,
        );

        expect(
          planet.designation,
        ).toBe(
          fixture.designation,
        );

        expect(
          planet.physicalProperties,
        ).toBe(
          fixture.physicalProperties,
        );

        expect(
          planet.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          planet.systemLocator,
        ).toBe(
          systemLocator,
        );

        expect(
          planet.locator,
        ).toBe(
          firstLocator,
        );

        expect(
          planet.seed,
        ).toBe(
          firstSeed,
        );

        expect(
          planet.bodyIndex,
        ).toBe(0n);

        expect(
          planet.name,
        ).toBe(
          'Testara b',
        );

        expect(
          planet.orbitTopology,
        ).toBe(
          PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        );

        expect(
          planet.massEarth,
        ).toBe(1);

        expect(
          planet.radiusEarth,
        ).toBe(1);

        expect(
          planet.densityGramsPerCubicCentimeter,
        ).toBe(
          PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
        );

        expect(
          planet.surfaceGravityEarth,
        ).toBe(1);

        expect(
          planet.surfaceGravityMetersPerSecondSquared,
        ).toBe(
          PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
        );

        expect(
          planet.rotationProperties,
        ).toBe(
          fixture.rotationProperties,
        );

        expect(
          planet.typeClassification,
        ).toBe(
          fixture.typeClassification,
        );

        expect(
          planet.internalComposition,
        ).toBe(
          fixture.internalComposition,
        );

        expect(
          planet.surfaceBaseProperties,
        ).toBe(
          fixture.surfaceBaseProperties,
        );

        expect(
          planet.planetType,
        ).toBe(
          PlanetType.ROCKY,
        );

        expect(
          planet.rotationPeriodHours,
        ).toBe(24);

        expect(
          planet.dayLengthHours,
        ).toBeCloseTo(
          apparentSolarDayHours(
            24,
            365.25 *
              24,
            false,
          )!,
          12,
        );

        expect(
          planet.axialTiltDegrees,
        ).toBe(23.44);

        expect(
          planet.isRetrogradeRotation,
        ).toBe(false);

        expect(
          planet.isTidallySynchronized,
        ).toBe(false);

        expect(
          planet.metallicCoreMassEarth,
        ).toBeCloseTo(
          0.28,
          12,
        );

        expect(
          planet.silicateInteriorMassEarth,
        ).toBeCloseTo(
          0.621,
          12,
        );

        expect(
          planet.condensedIceMassEarth,
        ).toBeCloseTo(
          0.072,
          12,
        );

        expect(
          planet.volatileRichInteriorMassEarth,
        ).toBeCloseTo(
          0.027,
          12,
        );

        expect(
          planet.gaseousEnvelopeMassEarth,
        ).toBe(0);

        expect(
          planet.referenceBondAlbedo01,
        ).toBe(
          fixture.surfaceBaseProperties.referenceBondAlbedo01,
        );

        expect(
          planet.surfaceBaseRegime,
        ).toBe(
          PlanetSurfaceBaseRegime.MINERAL_REGOLITH,
        );

        expect(
          planet.hasDefinedSolidSurfaceBase,
        ).toBe(true);

        expect(
          planet.baseSolidSurfaceRoughness01,
        ).toBe(0.7);

        for (
          const laterPhysicalProperty
          of [
            'albedo',
            'surface',
            'rarities',
          ]
        ) {
          expect(
            laterPhysicalProperty in
              planet,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject invalid or non-existing planet ordinals',
      () => {
        const fixture =
          planetFixture();

        for (
          const planetOrdinal
          of [
            0,
            -1,
            1.5,
            2,
          ]
        ) {
          expect(
            () =>
              new Planet(
                fixture.system,
                planetOrdinal,
                fixture.slot,
                fixture.orbit,
                fixture.period,
                fixture.hzClassification,
                fixture.designation,
                fixture.physicalProperties,
                fixture.rotationProperties,
                fixture.typeClassification,
                fixture.internalComposition,
                fixture.surfaceBaseProperties,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should require the exact point-18 projection instances carried by the host PlanetarySystem',
      () => {
        const fixture =
          planetFixture();

        const equivalentOrbit = {
          ...fixture.orbit,
        } as PlanetaryOrbitalElements;

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              equivalentOrbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              fixture.typeClassification,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a point-19.2 physical state with another BodySeed or inherited solid-core mass',
      () => {
        const fixture =
          planetFixture();

        const otherSeed =
          new BodySeed(
            '22222222222222222222222222222222',
          );

        const foreignIdentity =
          new PlanetPhysicalProperties(
            1,
            firstLocator,
            otherSeed,
            1,
            0,
            1,
            1,
            PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
            1,
            PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              foreignIdentity,
              fixture.rotationProperties,
              fixture.typeClassification,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );

        const differentCoreMass =
          new PlanetPhysicalProperties(
            1,
            firstLocator,
            firstSeed,
            0.5,
            0.5,
            1,
            1,
            PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
            1,
            PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              differentCoreMass,
              fixture.rotationProperties,
              fixture.typeClassification,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );


    it(
      'should reject a point-19.3 rotational state with another BodySeed or orbital-period source',
      () => {
        const fixture =
          planetFixture();

        const otherSeed =
          new BodySeed(
            '33333333333333333333333333333333',
          );

        const foreignIdentity =
          new PlanetRotationProperties(
            1,
            firstLocator,
            otherSeed,
            365.25 *
              24,
            24,
            apparentSolarDayHours(
              24,
              365.25 *
                24,
              false,
            ),
            23.44,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              foreignIdentity,
              fixture.typeClassification,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );

        const wrongOrbitalSource =
          new PlanetRotationProperties(
            1,
            firstLocator,
            firstSeed,
            300 *
              24,
            24,
            apparentSolarDayHours(
              24,
              300 *
                24,
              false,
            ),
            23.44,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              wrongOrbitalSource,
              fixture.typeClassification,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a point-19.4 type classification with another BodySeed or mismatched point-19.2 source values',
      () => {
        const fixture =
          planetFixture();

        const otherSeed =
          new BodySeed(
            '44444444444444444444444444444444',
          );

        const foreignIdentity =
          new PlanetTypeClassification(
            1,
            firstLocator,
            otherSeed,
            PlanetType.ROCKY,
            1,
            1,
            PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
            0,
            0.1,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
            1,
            0,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              foreignIdentity,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );

        const wrongMassSource =
          new PlanetTypeClassification(
            1,
            firstLocator,
            firstSeed,
            PlanetType.ROCKY,
            2,
            1,
            PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
            0,
            0.1,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
            1,
            0,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              wrongMassSource,
              fixture.internalComposition,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a point-19.5 internal composition with another identity, mass budget or source-family mixture',
      () => {
        const fixture =
          planetFixture();

        const otherSeed =
          new BodySeed(
            '55555555555555555555555555555555',
          );

        const foreignIdentity =
          new PlanetInternalComposition(
            1,
            firstLocator,
            otherSeed,
            1,
            0,
            0,
            0.9,
            0.1,
            0,
            0.28,
            0.621,
            0.072,
            0.027,
            0,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              fixture.typeClassification,
              foreignIdentity,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );

        const wrongMassBudget =
          new PlanetInternalComposition(
            1,
            firstLocator,
            firstSeed,
            0.8,
            0.2,
            0,
            0.9,
            0.1,
            0,
            0.224,
            0.4968,
            0.0576,
            0.0216,
            0.2,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              fixture.typeClassification,
              wrongMassBudget,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );

        const wrongSourceMixture =
          new PlanetInternalComposition(
            1,
            firstLocator,
            firstSeed,
            1,
            0,
            0,
            1,
            0,
            0,
            0.30,
            0.64,
            0.04,
            0.02,
            0,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              fixture.typeClassification,
              wrongSourceMixture,
              fixture.surfaceBaseProperties,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject a point-19.6 surface base with another identity or mismatched point-19.4/19.5 sources',
      () => {
        const fixture =
          planetFixture();

        const foreignIdentity =
          new PlanetSurfaceBaseProperties(
            1,
            firstLocator,
            new BodySeed(
              '66666666666666666666666666666666',
            ),
            PlanetType.ROCKY,
            0,
            fixture.internalComposition.iceBearingFractionOfSolids01,
            fixture.typeClassification.referenceMeanInsolationEarth,
            PlanetSurfaceBaseRegime.MINERAL_REGOLITH,
            0.2,
            1,
            0,
            0,
            0,
            0.7,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              fixture.typeClassification,
              fixture.internalComposition,
              foreignIdentity,
            ),
        ).toThrow(
          RangeError,
        );

        const wrongTypeSource =
          new PlanetSurfaceBaseProperties(
            1,
            firstLocator,
            firstSeed,
            PlanetType.SUPER_EARTH,
            0,
            fixture.internalComposition.iceBearingFractionOfSolids01,
            fixture.typeClassification.referenceMeanInsolationEarth,
            PlanetSurfaceBaseRegime.MASSIVE_MINERAL_REGOLITH,
            0.2,
            1,
            0,
            0,
            0,
            0.7,
          );

        expect(
          () =>
            new Planet(
              fixture.system,
              1,
              fixture.slot,
              fixture.orbit,
              fixture.period,
              fixture.hzClassification,
              fixture.designation,
              fixture.physicalProperties,
              fixture.rotationProperties,
              fixture.typeClassification,
              fixture.internalComposition,
              wrongTypeSource,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function planetFixture(): {
      readonly system:
        PlanetarySystem;
      readonly slot:
        PlanetaryArchitectureSlot;
      readonly orbit:
        PlanetaryOrbitalElements;
      readonly period:
        PlanetaryOrbitalPeriod;
      readonly hzClassification:
        PlanetaryOrbitHabitableZoneClassification;
      readonly designation:
        PlanetaryDesignation;
      readonly physicalProperties:
        PlanetPhysicalProperties;
      readonly rotationProperties:
        PlanetRotationProperties;
      readonly typeClassification:
        PlanetTypeClassification;
      readonly internalComposition:
        PlanetInternalComposition;
      readonly surfaceBaseProperties:
        PlanetSurfaceBaseProperties;
    } {
      const slot = {
        planetOrdinal:
          1,
        bodyLocator:
          firstLocator,
        bodySeed:
          firstSeed,
        inheritedSolidCoreMassEarth:
          1,
        inheritedCompositionMixture:
          new ProtoplanetCompositionMixture(
            0,
            0.9,
            0.1,
            0,
          ),
      } as PlanetaryArchitectureSlot;

      const orbit = {
        planetOrdinal:
          1,
        bodyLocator:
          firstLocator,
        bodySeed:
          firstSeed,
        semiMajorAxisAu:
          1,
        eccentricity:
          0.02,
        periastronAu:
          0.98,
        apoastronAu:
          1.02,
      } as PlanetaryOrbitalElements;

      const period = {
        planetOrdinal:
          1,
        bodyLocator:
          firstLocator,
        bodySeed:
          firstSeed,
        sourceSemiMajorAxisAu:
          1,
        gravitatingMassSolar:
          1,
        periodYears:
          1,
        periodDays:
          365.25,
      } as PlanetaryOrbitalPeriod;

      const hzClassification = {
        planetOrdinal:
          1,
        bodyLocator:
          firstLocator,
        bodySeed:
          firstSeed,
        radiativeRelation:
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
      } as PlanetaryOrbitHabitableZoneClassification;

      const designation = {
        planetOrdinal:
          1,
        bodyLocator:
          firstLocator,
        bodySeed:
          firstSeed,
        name:
          'Testara b',
      } as PlanetaryDesignation;

      const physicalProperties =
        new PlanetPhysicalProperties(
          1,
          firstLocator,
          firstSeed,
          1,
          0,
          1,
          1,
          PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
          1,
          PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
        );

      const orbitalPeriodHours =
        period.periodDays *
        24;

      const rotationProperties =
        new PlanetRotationProperties(
          1,
          firstLocator,
          firstSeed,
          orbitalPeriodHours,
          24,
          apparentSolarDayHours(
            24,
            orbitalPeriodHours,
            false,
          ),
          23.44,
        );

      const referenceMeanInsolationEarth =
        1 /
        Math.sqrt(
          1 -
          orbit.eccentricity **
            2,
        );

      const tidalHeatingProxy =
        period.gravitatingMassSolar **
          2 *
        physicalProperties.radiusEarth **
          5 *
        orbit.eccentricity **
          2 /
        (
          physicalProperties.massEarth *
          orbit.semiMajorAxisAu **
            6
        );

      const typeClassification =
        new PlanetTypeClassification(
          1,
          firstLocator,
          firstSeed,
          PlanetType.ROCKY,
          physicalProperties.massEarth,
          physicalProperties.radiusEarth,
          physicalProperties.densityGramsPerCubicCentimeter,
          physicalProperties.envelopeMassFraction01,
          0.1,
          PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
          PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
          referenceMeanInsolationEarth,
          tidalHeatingProxy,
        );

      const internalComposition =
        new PlanetInternalComposition(
          1,
          firstLocator,
          firstSeed,
          1,
          0,
          0,
          0.9,
          0.1,
          0,
          0.28,
          0.621,
          0.072,
          0.027,
          0,
        );

      const surfaceBaseProperties =
        new PlanetSurfaceBaseProperties(
          1,
          firstLocator,
          firstSeed,
          PlanetType.ROCKY,
          physicalProperties.envelopeMassFraction01,
          internalComposition.iceBearingFractionOfSolids01,
          typeClassification.referenceMeanInsolationEarth,
          PlanetSurfaceBaseRegime.MINERAL_REGOLITH,
          0.20,
          0.95,
          0.05,
          0,
          0,
          0.70,
        );

      const system = {
        generationKey,
        locator:
          systemLocator,
        planetCount:
          1,
        architecture: {
          orbitTopology:
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        },
        habitableZone: {
          referenceLuminositySolar:
            1,
          stellarEvolutionRegime:
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
        },
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
        planetDesignations: [
          designation,
        ],
      } as unknown as PlanetarySystem;

      return {
        system,
        slot,
        orbit,
        period,
        hzClassification,
        designation,
        physicalProperties,
        rotationProperties,
        typeClassification,
        internalComposition,
        surfaceBaseProperties,
      };
    }
  },
);
