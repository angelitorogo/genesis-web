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
  type PlanetaryDesignation,
} from './planetary-designation';

import {
  type PlanetaryOrbitHabitableZoneClassification,
} from './planetary-orbit-habitable-zone-classification';

import {
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from './planet-physical-properties';

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
  'Planet points 19.1-19.2',
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
      'should bind the frozen point-18 projections and coherent point-19.2 bulk physics into one planet',
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

        for (
          const laterPhysicalProperty
          of [
            'rotationPeriodHours',
            'dayLengthHours',
            'axialTiltDegrees',
            'planetType',
            'internalComposition',
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
      };
    }
  },
);
