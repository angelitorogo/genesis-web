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
  PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
  PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
  PlanetPhysicalProperties,
} from '../../domain/planetary/planet-physical-properties';

import {
  type PlanetaryOrbitalElements,
} from '../../domain/planetary/planetary-orbital-elements';

import {
  type PlanetaryOrbitalPeriod,
} from '../../domain/planetary/planetary-orbital-period';

import {
  type PlanetarySystem,
} from '../../domain/planetary/planetary-system';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PlanetRotationPropertiesGenerator,
} from './planet-rotation-properties-generator';

const GRAVITATIONAL_CONSTANT_SI =
  6.67430e-11;

describe(
  'PlanetRotationPropertiesGenerator point 19.3',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should synchronize a strongly forced close low-eccentricity planet and damp its obliquity',
      () => {
        const fixture =
          systemFixture([
            {
              seedHex:
                '11111111111111111111111111111111',
              semiMajorAxisAu:
                0.05,
              eccentricity:
                0.02,
              excitation:
                0.8,
              collisionCount:
                2,
            },
          ]);

        const rotation =
          PlanetRotationPropertiesGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        expect(
          rotation.rotationPeriodHours,
        ).toBeCloseTo(
          fixture.periods[0].periodDays *
            24,
          12,
        );

        expect(
          rotation.dayLengthHours,
        ).toBeNull();

        expect(
          rotation.isTidallySynchronized,
        ).toBe(true);

        expect(
          rotation.axialTiltDegrees,
        ).toBeGreaterThanOrEqual(0);

        expect(
          rotation.axialTiltDegrees,
        ).toBeLessThanOrEqual(2);

        expect(
          rotation.isRetrograde,
        ).toBe(false);
      },
    );

    it(
      'should avoid exact synchronous locking for a strongly forced but eccentric orbit',
      () => {
        const fixture =
          systemFixture([
            {
              seedHex:
                'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
              semiMajorAxisAu:
                0.05,
              eccentricity:
                0.20,
              excitation:
                0.7,
              collisionCount:
                1,
            },
          ]);

        const rotation =
          PlanetRotationPropertiesGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        expect(
          rotation.isTidallySynchronized,
        ).toBe(false);

        expect(
          rotation.dayLengthHours,
        ).not.toBeNull();
      },
    );

    it(
      'should generate a finite distant free spin above the density-dependent breakup safety floor',
      () => {
        const fixture =
          systemFixture([
            {
              seedHex:
                '22222222222222222222222222222222',
              semiMajorAxisAu:
                1,
              eccentricity:
                0.03,
              excitation:
                0.25,
              collisionCount:
                0,
            },
          ]);

        const physical =
          fixture.physicalProperties[0];

        const rotation =
          PlanetRotationPropertiesGenerator
            .generate(
              generationKey,
              fixture.system,
              physical,
            );

        const breakupSafetyFloorHours =
          Math.sqrt(
            3 *
              Math.PI /
            (
              GRAVITATIONAL_CONSTANT_SI *
              physical.densityGramsPerCubicCentimeter *
              1_000
            ),
          ) /
          3_600 *
          1.15;

        expect(
          rotation.rotationPeriodHours,
        ).toBeGreaterThanOrEqual(
          breakupSafetyFloorHours,
        );

        expect(
          rotation.isTidallySynchronized,
        ).toBe(false);

        expect(
          rotation.dayLengthHours,
        ).not.toBeNull();

        expect(
          rotation.axialTiltDegrees,
        ).toBeGreaterThanOrEqual(0);

        expect(
          rotation.axialTiltDegrees,
        ).toBeLessThanOrEqual(180);
      },
    );

    it(
      'should be exactly deterministic and independent from unrelated body materialization order',
      () => {
        const fixture =
          systemFixture([
            {
              seedHex:
                '33333333333333333333333333333333',
              semiMajorAxisAu:
                0.8,
              eccentricity:
                0.04,
              excitation:
                0.4,
              collisionCount:
                0,
            },
            {
              seedHex:
                '44444444444444444444444444444444',
              semiMajorAxisAu:
                2.4,
              eccentricity:
                0.08,
              excitation:
                0.7,
              collisionCount:
                1,
            },
          ]);

        const before =
          PlanetRotationPropertiesGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        PlanetRotationPropertiesGenerator
          .generate(
            generationKey,
            fixture.system,
            fixture.physicalProperties[1],
          );

        const after =
          PlanetRotationPropertiesGenerator
            .generate(
              generationKey,
              fixture.system,
              fixture.physicalProperties[0],
            );

        expect(
          after,
        ).toEqual(
          before,
        );
      },
    );

    it(
      'should generate one frozen point-19.3 state per point-19.2 planet and preserve identity/order',
      () => {
        const fixture =
          systemFixture([
            {
              seedHex:
                '55555555555555555555555555555555',
              semiMajorAxisAu:
                0.6,
              eccentricity:
                0.02,
              excitation:
                0.2,
              collisionCount:
                0,
            },
            {
              seedHex:
                '66666666666666666666666666666666',
              semiMajorAxisAu:
                1.5,
              eccentricity:
                0.06,
              excitation:
                0.6,
              collisionCount:
                1,
            },
          ]);

        const rotations =
          PlanetRotationPropertiesGenerator
            .generateAll(
              generationKey,
              fixture.system,
              fixture.physicalProperties,
            );

        expect(
          Object.isFrozen(
            rotations,
          ),
        ).toBe(true);

        expect(
          rotations.map(
            value =>
              value.planetOrdinal,
          ),
        ).toEqual([
          1,
          2,
        ]);

        for (
          let index = 0;
          index <
            rotations.length;
          index += 1
        ) {
          expect(
            rotations[index].bodyLocator,
          ).toBe(
            fixture.physicalProperties[index].bodyLocator,
          );

          expect(
            rotations[index].bodySeed,
          ).toBe(
            fixture.physicalProperties[index].bodySeed,
          );
        }
      },
    );

    it(
      'should return an empty immutable rotation population for a planet-free system',
      () => {
        const fixture =
          systemFixture([]);

        const rotations =
          PlanetRotationPropertiesGenerator
            .generateAll(
              generationKey,
              fixture.system,
              [],
            );

        expect(
          rotations,
        ).toEqual([]);

        expect(
          Object.isFrozen(
            rotations,
          ),
        ).toBe(true);
      },
    );

    it(
      'should reject foreign point-19.2 identities or the wrong population cardinality/order',
      () => {
        const fixture =
          systemFixture([
            {
              seedHex:
                '77777777777777777777777777777777',
              semiMajorAxisAu:
                1,
              eccentricity:
                0.02,
              excitation:
                0.2,
              collisionCount:
                0,
            },
            {
              seedHex:
                '88888888888888888888888888888888',
              semiMajorAxisAu:
                2,
              eccentricity:
                0.03,
              excitation:
                0.3,
              collisionCount:
                0,
            },
          ]);

        const foreign =
          new PlanetPhysicalProperties(
            1,
            fixture.physicalProperties[0].bodyLocator,
            new BodySeed(
              '99999999999999999999999999999999',
            ),
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
            PlanetRotationPropertiesGenerator
              .generate(
                generationKey,
                fixture.system,
                foreign,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            PlanetRotationPropertiesGenerator
              .generateAll(
                generationKey,
                fixture.system,
                [
                  fixture.physicalProperties[0],
                ],
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            PlanetRotationPropertiesGenerator
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
      },
    );

    function systemFixture(
      definitions:
        readonly {
          readonly seedHex:
            string;
          readonly semiMajorAxisAu:
            number;
          readonly eccentricity:
            number;
          readonly excitation:
            number;
          readonly collisionCount:
            number;
        }[],
    ): {
      readonly system:
        PlanetarySystem;
      readonly periods:
        readonly PlanetaryOrbitalPeriod[];
      readonly physicalProperties:
        readonly PlanetPhysicalProperties[];
    } {
      const locator =
        new SystemLocator(
          5n,
          -9n,
          11n,
        );

      const slots:
        PlanetaryArchitectureSlot[] = [];

      const orbits:
        PlanetaryOrbitalElements[] = [];

      const periods:
        PlanetaryOrbitalPeriod[] = [];

      const physicalProperties:
        PlanetPhysicalProperties[] = [];

      definitions.forEach(
        (
          definition,
          index,
        ) => {
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

          slots.push({
            planetOrdinal,
            bodyLocator,
            bodySeed,
            inheritedDynamicalExcitationIndex01:
              definition.excitation,
            phase17CollisionCount:
              definition.collisionCount,
            phase18ConsolidationCount:
              0,
          } as PlanetaryArchitectureSlot);

          orbits.push({
            planetOrdinal,
            bodyLocator,
            bodySeed,
            semiMajorAxisAu:
              definition.semiMajorAxisAu,
            eccentricity:
              definition.eccentricity,
          } as PlanetaryOrbitalElements);

          const periodYears =
            Math.sqrt(
              definition.semiMajorAxisAu **
                3,
            );

          periods.push({
            planetOrdinal,
            bodyLocator,
            bodySeed,
            sourceSemiMajorAxisAu:
              definition.semiMajorAxisAu,
            gravitatingMassSolar:
              1,
            periodYears,
            periodDays:
              periodYears *
              365.25,
          } as PlanetaryOrbitalPeriod);

          physicalProperties.push(
            new PlanetPhysicalProperties(
              planetOrdinal,
              bodyLocator,
              bodySeed,
              1,
              0,
              1,
              1,
              PLANET_V1_EARTH_MEAN_DENSITY_GRAMS_PER_CUBIC_CENTIMETER,
              1,
              PLANET_V1_EARTH_SURFACE_GRAVITY_METERS_PER_SECOND_SQUARED,
            ),
          );
        },
      );

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
      } as unknown as PlanetarySystem;

      return {
        system,
        periods,
        physicalProperties,
      };
    }
  },
);
