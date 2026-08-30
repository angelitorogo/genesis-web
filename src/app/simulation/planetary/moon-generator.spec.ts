import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  BodyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  BodySeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  MoonTidalLockingRegime,
} from '../../domain/planetary/moon-tidal-locking-regime';

import {
  MoonTidalMigrationRegime,
} from '../../domain/planetary/moon-tidal-migration-regime';

import {
  MoonTidalRegime,
} from '../../domain/planetary/moon-tidal-regime';

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
  MoonGenerator,
} from './moon-generator';

describe(
  'MoonGenerator point 21.4 V1',
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
          '1020-3040-5060-7080-90A0-B0C0-D0E0-F001',
        ),
        GeneratorVersion.V1,
      );

    const systemLocator =
      new SystemLocator(
        7n,
        -42n,
        3n,
      );

    it(
      'should freeze deterministic regression vectors for representative rocky, giant and ice-giant satellite populations',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            3,
          );

        const rocky =
          MoonGenerator
            .generate(
              generationKey,
              planetFixture(
                planetarySystem,
                1,
                {
                  seedHex:
                    '11111111111111111111111111111111',
                  planetType:
                    PlanetType.ROCKY,
                  massEarth:
                    1,
                  radiusEarth:
                    1,
                  semiMajorAxisAu:
                    1,
                  eccentricity:
                    0.0167,
                },
              ),
            );

        const gasGiant =
          MoonGenerator
            .generate(
              generationKey,
              planetFixture(
                planetarySystem,
                2,
                {
                  seedHex:
                    '33333333333333333333333333333333',
                  planetType:
                    PlanetType.GAS_GIANT,
                  massEarth:
                    318,
                  radiusEarth:
                    11.2,
                  semiMajorAxisAu:
                    5.2,
                  eccentricity:
                    0.05,
                  rotationPeriodHours:
                    10,
                },
              ),
            );

        const iceGiant =
          MoonGenerator
            .generate(
              generationKey,
              planetFixture(
                planetarySystem,
                3,
                {
                  seedHex:
                    '44444444444444444444444444444444',
                  planetType:
                    PlanetType.ICE_GIANT,
                  massEarth:
                    17,
                  radiusEarth:
                    4,
                  semiMajorAxisAu:
                    19,
                  eccentricity:
                    0.01,
                  rotationPeriodHours:
                    17,
                },
              ),
            );

        expect(
          rocky.moonCount,
        ).toBe(1);

        expect(
          rocky.hillSphereRadiusPlanetRadii,
        ).toBeCloseTo(
          230.72034955593907,
          10,
        );

        expect(
          rocky.satelliteCapacityIndex01,
        ).toBeCloseTo(
          0.6709258667143848,
          10,
        );

        expect(
          gasGiant.moonCount,
        ).toBe(100);

        expect(
          gasGiant.satelliteCapacityIndex01,
        ).toBeCloseTo(
          0.8942461242620243,
          10,
        );

        expect(
          iceGiant.moonCount,
        ).toBe(35);

        expect(
          iceGiant.satelliteCapacityIndex01,
        ).toBe(1);

        expect(
          rocky.relevantMoonCount,
        ).toBe(1);

        expect(
          rocky.relevantMoons[0].massEarth,
        ).toBeCloseTo(
          0.01093528370860394,
          12,
        );

        expect(
          rocky.relevantMoons[0].radiusEarth,
        ).toBeCloseTo(
          0.2585761221550917,
          12,
        );

        expect(
          rocky.relevantMoons[0].semiMajorAxisPlanetRadii,
        ).toBeCloseTo(
          53.805765907874715,
          10,
        );

        expect(
          rocky.relevantMoons[0].orbitalPeriodDays,
        ).toBeCloseTo(
          22.99265111732967,
          10,
        );

        expect(
          rocky.relevantMoons[0].tidalState.tidalHeatingIndex01,
        ).toBeCloseTo(
          0.25932775948683745,
          12,
        );

        expect(
          rocky.relevantMoons[0].tidalState.tidalLockingIndex01,
        ).toBeCloseTo(
          0.8200666583638972,
          12,
        );

        expect(
          rocky.relevantMoons[0].tidalState.tidalRegime,
        ).toBe(
          MoonTidalRegime.MODERATE,
        );

        expect(
          rocky.relevantMoons[0].tidalState.tidalLockingRegime,
        ).toBe(
          MoonTidalLockingRegime.SYNCHRONIZED,
        );

        expect(
          rocky.relevantMoons[0].tidalState.migrationRegime,
        ).toBe(
          MoonTidalMigrationRegime.OUTWARD,
        );

        expect(
          rocky.relevantMoons[0].rotationPeriodHours,
        ).toBeCloseTo(
          rocky.relevantMoons[0].orbitalPeriodDays *
            24,
          12,
        );

        expect(
          gasGiant.relevantMoonCount,
        ).toBe(8);

        expect(
          gasGiant.unmaterializedMinorMoonCount,
        ).toBe(92);

        expect(
          iceGiant.relevantMoonCount,
        ).toBe(8);

        expect(
          iceGiant.unmaterializedMinorMoonCount,
        ).toBe(27);


        expect(
          gasGiant.relevantMoons[0].tidalState.tidalRegime,
        ).toBe(
          MoonTidalRegime.EXTREME,
        );

        expect(
          gasGiant.relevantMoons[7].tidalState.tidalRegime,
        ).toBe(
          MoonTidalRegime.NEGLIGIBLE,
        );

        expect(
          gasGiant.relevantMoons.every(
            moon =>
              moon.isTidallyLocked,
          ),
        ).toBe(true);

        expect(
          iceGiant.relevantMoons[0].tidalState.migrationRegime,
        ).toBe(
          MoonTidalMigrationRegime.NEAR_SYNCHRONOUS,
        );
      },
    );

    it(
      'should use planet family to bound the total population while keeping seeds/designations absent',
      () => {
        const cases:
          readonly [
            PlanetType,
            number,
            number,
            number,
          ][] = [
            [
              PlanetType.ROCKY,
              1,
              1,
              3,
            ],
            [
              PlanetType.SUPER_EARTH,
              6,
              1.6,
              5,
            ],
            [
              PlanetType.DESERT,
              1,
              1,
              3,
            ],
            [
              PlanetType.OCEAN,
              1.5,
              1.2,
              4,
            ],
            [
              PlanetType.ICE,
              3,
              1.7,
              6,
            ],
            [
              PlanetType.VOLCANIC,
              1,
              1,
              3,
            ],
            [
              PlanetType.MINI_NEPTUNE,
              10,
              3,
              16,
            ],
            [
              PlanetType.GAS_GIANT,
              318,
              11.2,
              120,
            ],
            [
              PlanetType.ICE_GIANT,
              17,
              4,
              60,
            ],
          ];

        for (
          let index = 0;
          index <
          cases.length;
          index +=
            1
        ) {
          const [
            planetType,
            massEarth,
            radiusEarth,
            maximumMoonCount,
          ] =
            cases[index];

          const planetarySystem =
            planetarySystemFixture(
              generationKey,
              new SystemLocator(
                7n,
                -42n,
                BigInt(
                  100 +
                  index,
                ),
              ),
              1,
            );

          const moonSystem =
            MoonGenerator
              .generate(
                generationKey,
                planetFixture(
                  planetarySystem,
                  1,
                  {
                    seedHex:
                      `${(
                        index +
                        1
                      ).toString(16)}`
                        .repeat(32)
                        .toUpperCase(),
                    planetType,
                    massEarth,
                    radiusEarth,
                    semiMajorAxisAu:
                      planetType ===
                        PlanetType.GAS_GIANT ||
                      planetType ===
                        PlanetType.ICE_GIANT
                        ? 5
                        : 1,
                  },
                ),
              );

          expect(
            Number.isInteger(
              moonSystem.moonCount,
            ),
          ).toBe(true);

          expect(
            moonSystem.moonCount,
          ).toBeGreaterThanOrEqual(0);

          expect(
            moonSystem.moonCount,
          ).toBeLessThanOrEqual(
            maximumMoonCount,
          );

          expect(
            moonSystem.populationProfile
              .sourcePlanetType,
          ).toBe(
            planetType,
          );

          expect(
            'moons' in
              moonSystem,
          ).toBe(false);

          expect(
            'moonSeeds' in
              moonSystem,
          ).toBe(false);
        }
      },
    );

    it(
      'should materialize a bounded frozen relevant subset with coherent bulk physics and ordered stable orbits',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            3,
          );

        const cases = [
          planetFixture(
            planetarySystem,
            1,
            {
              seedHex:
                '11111111111111111111111111111111',
              planetType:
                PlanetType.ROCKY,
              massEarth:
                1,
              radiusEarth:
                1,
              semiMajorAxisAu:
                1,
            },
          ),
          planetFixture(
            planetarySystem,
            2,
            {
              seedHex:
                '33333333333333333333333333333333',
              planetType:
                PlanetType.GAS_GIANT,
              massEarth:
                318,
              radiusEarth:
                11.2,
              semiMajorAxisAu:
                5.2,
              eccentricity:
                0.05,
            },
          ),
          planetFixture(
            planetarySystem,
            3,
            {
              seedHex:
                '44444444444444444444444444444444',
              planetType:
                PlanetType.ICE_GIANT,
              massEarth:
                17,
              radiusEarth:
                4,
              semiMajorAxisAu:
                19,
            },
          ),
        ];

        const systems =
          cases.map(
            planet =>
              MoonGenerator
                .generate(
                  generationKey,
                  planet,
                ),
          );

        expect(
          systems.map(
            system =>
              system.relevantMoonCount,
          ),
        ).toEqual([
          1,
          8,
          8,
        ]);

        for (
          let systemIndex = 0;
          systemIndex <
          systems.length;
          systemIndex +=
            1
        ) {
          const system =
            systems[systemIndex];

          const planet =
            cases[systemIndex];

          expect(
            Object.isFrozen(
              system.relevantMoons,
            ),
          ).toBe(true);

          let previousOrbit =
            0;

          let totalRelevantMass =
            0;

          for (
            const moon
            of system.relevantMoons
          ) {
            expect(
              moon.massEarth,
            ).toBeGreaterThan(0);

            expect(
              moon.radiusEarth,
            ).toBeGreaterThan(0);

            expect(
              moon.meanDensityGramsPerCubicCentimeter,
            ).toBeGreaterThan(0);

            expect(
              moon.surfaceGravityEarth,
            ).toBeGreaterThan(0);

            expect(
              moon.semiMajorAxisPlanetRadii,
            ).toBeGreaterThan(
              moon.orbit.rocheLimitPlanetRadii,
            );

            expect(
              moon.semiMajorAxisPlanetRadii,
            ).toBeLessThan(
              system.hillSphereRadiusPlanetRadii *
                0.5,
            );

            expect(
              moon.semiMajorAxisPlanetRadii,
            ).toBeGreaterThan(
              previousOrbit,
            );

            expect(
              moon.orbitalPeriodDays,
            ).toBeGreaterThan(0);

            expect(
              'seed' in moon,
            ).toBe(false);

            expect(
              'designation' in moon,
            ).toBe(false);

            expect(
              'tidalState' in moon,
            ).toBe(true);

            expect(
              moon.tidalState
                .hostPlanetOrdinal,
            ).toBe(
              planet.planetOrdinal,
            );

            expect(
              moon.tidalState
                .moonOrdinal,
            ).toBe(
              moon.moonOrdinal,
            );

            previousOrbit =
              moon.semiMajorAxisPlanetRadii;

            totalRelevantMass +=
              moon.massEarth;
          }

          expect(
            totalRelevantMass,
          ).toBeLessThan(
            planet.massEarth *
              0.03,
          );

          expect(
            system.unmaterializedMinorMoonCount,
          ).toBe(
            system.moonCount -
            system.relevantMoonCount,
          );
        }
      },
    );

    it(
      'should suppress a giant satellite system when the periapsis Hill sphere is too small',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            1,
          );

        const closeInGiant =
          MoonGenerator
            .generate(
              generationKey,
              planetFixture(
                planetarySystem,
                1,
                {
                  seedHex:
                    '33333333333333333333333333333333',
                  planetType:
                    PlanetType.GAS_GIANT,
                  massEarth:
                    318,
                  radiusEarth:
                    11.2,
                  semiMajorAxisAu:
                    0.05,
                  eccentricity:
                    0.01,
                },
              ),
            );

        expect(
          closeInGiant
            .hillSphereRadiusPlanetRadii,
        ).toBeLessThan(8);

        expect(
          closeInGiant
            .satelliteCapacityIndex01,
        ).toBe(0);

        expect(
          closeInGiant
            .moonCount,
        ).toBe(0);

        expect(
          closeInGiant
            .hasMoons,
        ).toBe(false);
      },
    );

    it(
      'should remain exactly deterministic for the same BodySeed and independent of repeated query order',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            2,
          );

        const firstPlanet =
          planetFixture(
            planetarySystem,
            1,
            {
              seedHex:
                '55555555555555555555555555555555',
              planetType:
                PlanetType.MINI_NEPTUNE,
              massEarth:
                10,
              radiusEarth:
                3,
            },
          );

        const secondPlanet =
          planetFixture(
            planetarySystem,
            2,
            {
              seedHex:
                'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
              planetType:
                PlanetType.ROCKY,
              massEarth:
                1,
              radiusEarth:
                1,
            },
          );

        const firstBefore =
          MoonGenerator
            .generate(
              generationKey,
              firstPlanet,
            );

        MoonGenerator
          .generate(
            generationKey,
            secondPlanet,
          );

        const firstAfter =
          MoonGenerator
            .generate(
              generationKey,
              firstPlanet,
            );

        expect(
          firstBefore
            .populationProfile,
        ).toEqual(
          firstAfter
            .populationProfile,
        );

        expect(
          firstBefore
            .relevantMoons,
        ).toEqual(
          firstAfter
            .relevantMoons,
        );

        expect(
          firstBefore.moonCount,
        ).toBe(4);

        expect(
          MoonGenerator
            .generate(
              generationKey,
              secondPlanet,
            )
            .moonCount,
        ).toBe(0);
      },
    );

    it(
      'should generate one frozen aligned MoonSystem per mature Planet and reject mismatched collections/context',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            3,
          );

        const planets = [
          planetFixture(
            planetarySystem,
            1,
            {
              seedHex:
                '11111111111111111111111111111111',
            },
          ),
          planetFixture(
            planetarySystem,
            2,
            {
              seedHex:
                '33333333333333333333333333333333',
              planetType:
                PlanetType.GAS_GIANT,
              massEarth:
                318,
              radiusEarth:
                11.2,
              semiMajorAxisAu:
                5.2,
            },
          ),
          planetFixture(
            planetarySystem,
            3,
            {
              seedHex:
                '44444444444444444444444444444444',
              planetType:
                PlanetType.ICE_GIANT,
              massEarth:
                17,
              radiusEarth:
                4,
              semiMajorAxisAu:
                19,
            },
          ),
        ];

        const moonSystems =
          MoonGenerator
            .generateAll(
              generationKey,
              planetarySystem,
              planets,
            );

        expect(
          Object.isFrozen(
            moonSystems,
          ),
        ).toBe(true);

        expect(
          moonSystems.map(
            system =>
              system
                .hostPlanetOrdinal,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          moonSystems.map(
            system =>
              system.moonCount,
          ),
        ).toEqual([
          1,
          101,
          35,
        ]);

        expect(
          moonSystems.map(
            system =>
              system.relevantMoonCount,
          ),
        ).toEqual([
          1,
          8,
          8,
        ]);

        expect(
          () =>
            MoonGenerator
              .generate(
                otherGenerationKey,
                planets[0],
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            MoonGenerator
              .generateAll(
                generationKey,
                planetarySystem,
                planets.slice(
                  0,
                  2,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            MoonGenerator
              .generateAll(
                generationKey,
                planetarySystem,
                [
                  planets[1],
                  planets[0],
                  planets[2],
                ],
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should change tidal migration with host spin without mutating the frozen point-21.3 moon mass or orbit',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            1,
          );

        const commonOptions = {
          seedHex:
            '11111111111111111111111111111111',
          planetType:
            PlanetType.ROCKY,
          massEarth:
            1,
          radiusEarth:
            1,
          semiMajorAxisAu:
            1,
          eccentricity:
            0.0167,
        } as const;

        const fastHost =
          MoonGenerator.generate(
            generationKey,
            planetFixture(
              planetarySystem,
              1,
              {
                ...commonOptions,
                rotationPeriodHours:
                  24,
              },
            ),
          );

        const slowHost =
          MoonGenerator.generate(
            generationKey,
            planetFixture(
              planetarySystem,
              1,
              {
                ...commonOptions,
                rotationPeriodHours:
                  1_000,
              },
            ),
          );

        expect(
          slowHost.relevantMoons[0].massEarth,
        ).toBe(
          fastHost.relevantMoons[0].massEarth,
        );

        expect(
          slowHost.relevantMoons[0].semiMajorAxisPlanetRadii,
        ).toBe(
          fastHost.relevantMoons[0].semiMajorAxisPlanetRadii,
        );

        expect(
          fastHost.relevantMoons[0].tidalState.migrationRegime,
        ).toBe(
          MoonTidalMigrationRegime.OUTWARD,
        );

        expect(
          slowHost.relevantMoons[0].tidalState.migrationRegime,
        ).toBe(
          MoonTidalMigrationRegime.INWARD,
        );

        expect(
          slowHost.relevantMoons[0].tidalHeatingIndex01,
        ).toBe(
          fastHost.relevantMoons[0].tidalHeatingIndex01,
        );
      },
    );

    it(
      'should reject a physically incoherent Planet before deriving the count profile',
      () => {
        const planetarySystem =
          planetarySystemFixture(
            generationKey,
            systemLocator,
            1,
          );

        const planet =
          planetFixture(
            planetarySystem,
            1,
            {
              isTypePhysicallyCoherent:
                false,
            },
          );

        expect(
          () =>
            MoonGenerator
              .generate(
                generationKey,
                planet,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

interface PlanetFixtureOptions {
  readonly seedHex?:
    string;

  readonly planetType?:
    PlanetType;

  readonly massEarth?:
    number;

  readonly radiusEarth?:
    number;

  readonly semiMajorAxisAu?:
    number;

  readonly eccentricity?:
    number;

  readonly gravitatingMassSolar?:
    number;

  readonly rotationPeriodHours?:
    number;

  readonly isRetrogradeRotation?:
    boolean;

  readonly isTypePhysicallyCoherent?:
    boolean;
}

function planetarySystemFixture(
  generationKey:
    UniverseGenerationKey,

  locator:
    SystemLocator,

  planetCount:
    number,
): PlanetarySystem {

  return {
    generationKey,
    locator,
    planetCount,
  } as unknown as PlanetarySystem;
}

function planetFixture(
  planetarySystem:
    PlanetarySystem,

  planetOrdinal:
    number,

  options:
    PlanetFixtureOptions = {},
): Planet {

  const planetType =
    options.planetType ??
    PlanetType.ROCKY;

  const massEarth =
    options.massEarth ??
    1;

  const radiusEarth =
    options.radiusEarth ??
    1;

  const semiMajorAxisAu =
    options.semiMajorAxisAu ??
    1;

  const eccentricity =
    options.eccentricity ??
    0.0167;

  const gravitatingMassSolar =
    options.gravitatingMassSolar ??
    1;

  const rotationPeriodHours =
    options.rotationPeriodHours ??
    24;

  const isRetrogradeRotation =
    options.isRetrogradeRotation ??
    false;

  return {
    generationKey:
      planetarySystem
        .generationKey,
    hostPlanetarySystem:
      planetarySystem,
    systemLocator:
      planetarySystem
        .locator,
    planetOrdinal,
    locator:
      new BodyLocator(
        planetarySystem
          .locator
          .galaxyIndex,
        planetarySystem
          .locator
          .sectorKey,
        planetarySystem
          .locator
          .galacticObjectIndex,
        BigInt(
          planetOrdinal -
            1,
        ),
      ),
    seed:
      new BodySeed(
        options.seedHex ??
        `${planetOrdinal}`
          .repeat(32),
      ),
    planetType,
    massEarth,
    radiusEarth,
    orbit: {
      semiMajorAxisAu,
      eccentricity,
    },
    orbitalPeriod: {
      gravitatingMassSolar,
    },
    rotationPeriodHours,
    isRetrogradeRotation,
    isTypePhysicallyCoherent:
      options
        .isTypePhysicallyCoherent ??
      true,
  } as unknown as Planet;
}
