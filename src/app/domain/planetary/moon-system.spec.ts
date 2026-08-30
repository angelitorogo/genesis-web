import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

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
  GiantMoonArchitectureRegime,
} from './giant-moon-architecture-regime';

import {
  GiantMoonCompositionRegime,
} from './giant-moon-composition-regime';

import {
  GiantMoonOrbitalFamily,
} from './giant-moon-orbital-family';

import {
  GiantMoonState,
} from './giant-moon-state';

import {
  GiantMoonSystemProfile,
} from './giant-moon-system-profile';

import {
  MoonAtmosphereRegime,
} from './moon-atmosphere-regime';

import {
  MoonEnvironmentState,
} from './moon-environment-state';

import {
  MoonGeologyRegime,
} from './moon-geology-regime';

import {
  MoonHabitabilityRegime,
} from './moon-habitability-regime';

import {
  MoonHabitabilityState,
} from './moon-habitability-state';

import {
  MoonOrbitalElements,
} from './moon-orbital-elements';

import {
  MoonPhysicalProperties,
} from './moon-physical-properties';

import {
  MoonPopulationProfile,
} from './moon-population-profile';

import {
  MoonTidalLockingRegime,
} from './moon-tidal-locking-regime';

import {
  MoonTidalMigrationRegime,
} from './moon-tidal-migration-regime';

import {
  MoonTidalRegime,
} from './moon-tidal-regime';

import {
  MoonTidalState,
  synchronousOrbitPlanetRadiiV1,
} from './moon-tidal-state';

import {
  MoonWaterRegime,
} from './moon-water-regime';

import {
  type Planet,
} from './planet';

import {
  PlanetType,
} from './planet-type';

import {
  type PlanetarySystem,
} from './planetary-system';

import {
  RelevantMoon,
} from './relevant-moon';

import {
  MoonSystem,
} from './moon-system';

describe(
  'MoonSystem through point 21.7',
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
        4n,
        -9n,
        12n,
      );

    const planetarySystem = {
      generationKey,
      locator:
        systemLocator,
      planetCount:
        2,
    } as unknown as PlanetarySystem;

    it(
      'should preserve host/population identity and expose a frozen ordered relevant-moon subset',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            2,
          );

        const population =
          populationFixture(
            planet,
            5,
          );

        const relevantMoons = [
          relevantMoonFixture(
            planet,
            1,
            12,
          ),
          relevantMoonFixture(
            planet,
            2,
            30,
          ),
        ];

        const moonSystem =
          moonSystemFixture(
            planet,
            population,
            relevantMoons,
          );

        relevantMoons.length =
          0;

        expect(
          moonSystem.hostPlanet,
        ).toBe(
          planet,
        );

        expect(
          moonSystem.populationProfile,
        ).toBe(
          population,
        );

        expect(
          moonSystem.relevantMoonCount,
        ).toBe(2);

        expect(
          moonSystem.unmaterializedMinorMoonCount,
        ).toBe(3);

        expect(
          moonSystem.hasRelevantMoons,
        ).toBe(true);

        expect(
          moonSystem.potentiallyHabitableMoonCount,
        ).toBe(0);

        expect(
          moonSystem.hasPotentiallyHabitableMoons,
        ).toBe(false);

        expect(
          moonSystem.hasGiantMoonArchitecture,
        ).toBe(false);

        expect(
          moonSystem.giantMoonArchitectureRegime,
        ).toBe(
          GiantMoonArchitectureRegime.NOT_APPLICABLE,
        );

        expect(
          Object.isFrozen(
            moonSystem.relevantMoons,
          ),
        ).toBe(true);

        expect(
          moonSystem.relevantMoons.map(
            moon =>
              moon.moonOrdinal,
          ),
        ).toEqual([
          1,
          2,
        ]);

        expect(
          moonSystem.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          moonSystem.hostPlanetSeed,
        ).toBe(
          planet.seed,
        );

        for (
          const laterProperty
          of [
            'moonSeeds',
            'tidalState',
            'atmospheres',
            'habitability',
            'designations',
          ]
        ) {
          expect(
            laterProperty in
              moonSystem,
          ).toBe(false);
        }
      },
    );

    it(
      'should allow moonless and minor-population-only systems without inventing relevant moons',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            1,
          );

        const moonless =
          moonSystemFixture(
            planet,
            populationFixture(
              planet,
              0,
            ),
            [],
          );

        expect(
          moonless.hasMoons,
        ).toBe(false);

        expect(
          moonless.relevantMoonCount,
        ).toBe(0);

        const minorOnly =
          moonSystemFixture(
            planet,
            populationFixture(
              planet,
              3,
            ),
            [],
          );

        expect(
          minorOnly.moonCount,
        ).toBe(3);

        expect(
          minorOnly.unmaterializedMinorMoonCount,
        ).toBe(3);
      },
    );

    it(
      'should reject too many, cross-body, non-contiguous or non-monotonic relevant moons',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            1,
          );

        const otherPlanet =
          planetFixture(
            planetarySystem,
            2,
          );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                planet,
                1,
              ),
              [
                relevantMoonFixture(
                  planet,
                  1,
                  10,
                ),
                relevantMoonFixture(
                  planet,
                  2,
                  20,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                planet,
                2,
              ),
              [
                relevantMoonFixture(
                  otherPlanet,
                  1,
                  10,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                planet,
                2,
              ),
              [
                relevantMoonFixture(
                  planet,
                  2,
                  10,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                planet,
                2,
              ),
              [
                relevantMoonFixture(
                  planet,
                  1,
                  20,
                ),
                relevantMoonFixture(
                  planet,
                  2,
                  10,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );


        const alteredRotationSource =
          planetFixture(
            planetarySystem,
            1,
            {
              rotationPeriodHours:
                1_000,
            },
          );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                planet,
                1,
              ),
              [
                relevantMoonFixture(
                  alteredRotationSource,
                  1,
                  10,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should still reject a population profile from another body or altered host sources',
      () => {
        const planet =
          planetFixture(
            planetarySystem,
            1,
          );

        const otherPlanet =
          planetFixture(
            planetarySystem,
            2,
          );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                otherPlanet,
                1,
              ),
              [],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            moonSystemFixture(
              planet,
              populationFixture(
                planet,
                1,
                {
                  sourceMassEarth:
                    planet.massEarth +
                    0.1,
                },
              ),
              [],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function moonSystemFixture(
  planet:
    Planet,

  populationProfile:
    MoonPopulationProfile,

  relevantMoons:
    readonly RelevantMoon[],
): MoonSystem {

  const unmaterializedMinorMoonCount =
    populationProfile.moonCount -
    relevantMoons.length;

  const giantMoonProfile =
    new GiantMoonSystemProfile(
      planet.planetOrdinal,
      planet.planetType,
      populationProfile.moonCount,
      relevantMoons.length,
      unmaterializedMinorMoonCount,
      populationProfile.satelliteCapacityIndex01,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      GiantMoonArchitectureRegime.NOT_APPLICABLE,
    );

  return new MoonSystem(
    planet,
    populationProfile,
    relevantMoons,
    giantMoonProfile,
  );
}

function planetFixture(
  planetarySystem:
    PlanetarySystem,

  planetOrdinal:
    number,

  overrides:
    Partial<Planet> = {},
): Planet {

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
        planetOrdinal ===
          1
          ? '11111111111111111111111111111111'
          : '22222222222222222222222222222222',
      ),
    planetType:
      PlanetType.ROCKY,
    massEarth:
      1,
    radiusEarth:
      1,
    orbit: {
      semiMajorAxisAu:
        1,
      eccentricity:
        0.01,
    },
    orbitalPeriod: {
      gravitatingMassSolar:
        1,
    },
    rotationPeriodHours:
      24,
    isRetrogradeRotation:
      false,
    isTypePhysicallyCoherent:
      true,
    typeClassification: {
      referenceMeanInsolationEarth:
        1,
    },
    ...overrides,
  } as unknown as Planet;
}

function populationFixture(
  planet:
    Planet,

  moonCount:
    number,

  overrides:
    Partial<MoonPopulationProfile> = {},
): MoonPopulationProfile {

  const values = {
    hostPlanetOrdinal:
      planet.planetOrdinal,
    hostPlanetLocator:
      planet.locator,
    hostPlanetSeed:
      planet.seed,
    sourcePlanetType:
      planet.planetType,
    sourceMassEarth:
      planet.massEarth,
    sourceRadiusEarth:
      planet.radiusEarth,
    sourceSemiMajorAxisAu:
      planet.orbit.semiMajorAxisAu,
    sourceEccentricity:
      planet.orbit.eccentricity,
    sourceGravitatingMassSolar:
      planet.orbitalPeriod.gravitatingMassSolar,
    hillSphereRadiusPlanetRadii:
      230,
    satelliteCapacityIndex01:
      0.67,
    moonCount,
    ...overrides,
  };

  return new MoonPopulationProfile(
    values.hostPlanetOrdinal,
    values.hostPlanetLocator,
    values.hostPlanetSeed,
    values.sourcePlanetType,
    values.sourceMassEarth,
    values.sourceRadiusEarth,
    values.sourceSemiMajorAxisAu,
    values.sourceEccentricity,
    values.sourceGravitatingMassSolar,
    values.hillSphereRadiusPlanetRadii,
    values.satelliteCapacityIndex01,
    values.moonCount,
  );
}

function relevantMoonFixture(
  planet:
    Planet,

  moonOrdinal:
    number,

  semiMajorAxisPlanetRadii:
    number,
): RelevantMoon {

  const physical =
    new MoonPhysicalProperties(
      planet.planetOrdinal,
      moonOrdinal,
      0.001,
      0.1,
      3,
      0.1,
    );

  const semiMajorAxisKilometers =
    semiMajorAxisPlanetRadii *
    planet.radiusEarth *
    6_371;

  const orbitalPeriodDays =
    keplerianPeriodDays(
      planet.massEarth,
      physical.massEarth,
      semiMajorAxisKilometers,
    );

  const orbit =
    new MoonOrbitalElements(
      planet.planetOrdinal,
      moonOrdinal,
      semiMajorAxisPlanetRadii,
      semiMajorAxisKilometers,
      0.01,
      1,
      orbitalPeriodDays,
      2.5,
      230,
    );

  const synchronousOrbitPlanetRadii =
    synchronousOrbitPlanetRadiiV1(
      planet.massEarth,
      planet.radiusEarth,
      planet.rotationPeriodHours,
    );

  const migrationRegime =
    planet.isRetrogradeRotation
      ? MoonTidalMigrationRegime.INWARD
      : semiMajorAxisPlanetRadii <
        synchronousOrbitPlanetRadii *
          0.9
        ? MoonTidalMigrationRegime.INWARD
        : semiMajorAxisPlanetRadii <=
          synchronousOrbitPlanetRadii *
            1.1
          ? MoonTidalMigrationRegime.NEAR_SYNCHRONOUS
          : MoonTidalMigrationRegime.OUTWARD;

  const tidalState =
    new MoonTidalState(
      planet.planetOrdinal,
      moonOrdinal,
      planet.massEarth,
      planet.radiusEarth,
      planet.rotationPeriodHours,
      planet.isRetrogradeRotation,
      physical.massEarth,
      physical.radiusEarth,
      orbit.semiMajorAxisPlanetRadii,
      orbit.semiMajorAxisKilometers,
      orbit.eccentricity,
      orbit.orbitalPeriodDays,
      synchronousOrbitPlanetRadii,
      0.5,
      0.1,
      MoonTidalRegime.WEAK,
      0.8,
      MoonTidalLockingRegime.SYNCHRONIZED,
      orbit.orbitalPeriodDays *
        24,
      migrationRegime,
    );

  const environmentState =
    new MoonEnvironmentState(
      planet.planetOrdinal,
      moonOrdinal,
      physical.massEarth,
      physical.radiusEarth,
      physical.meanDensityGramsPerCubicCentimeter,
      physical.surfaceGravityEarth,
      planet.typeClassification.referenceMeanInsolationEarth,
      tidalState.tidalHeatingIndex01,
      0.20,
      0.22,
      250,
      255,
      0.25,
      MoonAtmosphereRegime.TRACE,
      0.20,
      0.10,
      0.05,
      MoonWaterRegime.SURFACE_ICE,
      0.20,
      0.15,
      MoonGeologyRegime.LOW_ACTIVITY,
    );

  const subsurfaceHabitabilityIndex01 =
    0.10 *
    (
      0.55 +
      0.45 *
        environmentState.waterInventoryIndex01
    ) *
    (
      0.45 +
      0.55 *
        0.185
    );

  const habitabilityState =
    new MoonHabitabilityState(
      planet.planetOrdinal,
      moonOrdinal,
      environmentState.sourceMoonSurfaceGravityEarth,
      environmentState.estimatedSurfaceTemperatureKelvin,
      environmentState.atmosphereRetentionIndex01,
      environmentState.waterInventoryIndex01,
      environmentState.subsurfaceOceanPotentialIndex01,
      environmentState.surfaceLiquidWaterPotentialIndex01,
      environmentState.internalHeatRetentionIndex01,
      environmentState.geologicalActivityIndex01,
      environmentState.sourceTidalHeatingIndex01,
      5 / 23,
      0,
      1,
      1,
      0.185,
      0,
      subsurfaceHabitabilityIndex01,
      subsurfaceHabitabilityIndex01,
      false,
      false,
      MoonHabitabilityRegime.NONE,
    );

  const giantMoonState =
    new GiantMoonState(
      planet.planetOrdinal,
      moonOrdinal,
      planet.planetType,
      physical.massEarth,
      physical.radiusEarth,
      orbit.semiMajorAxisPlanetRadii,
      orbit.eccentricity,
      orbit.inclinationDegrees,
      environmentState.inferredIceRichnessIndex01,
      tidalState.tidalHeatingIndex01,
      environmentState.subsurfaceOceanPotentialIndex01,
      environmentState.surfaceLiquidWaterPotentialIndex01,
      habitabilityState.overallHabitabilityIndex01,
      habitabilityState.isPotentiallyHabitable,
      GiantMoonOrbitalFamily.NOT_APPLICABLE,
      GiantMoonCompositionRegime.NOT_APPLICABLE,
      false,
      false,
      false,
      false,
    );

  return new RelevantMoon(
    planet.planetOrdinal,
    planet.locator,
    planet.seed,
    moonOrdinal,
    physical,
    orbit,
    tidalState,
    environmentState,
    habitabilityState,
    giantMoonState,
  );
}

function keplerianPeriodDays(
  hostMassEarth:
    number,

  moonMassEarth:
    number,

  semiMajorAxisKilometers:
    number,
): number {

  const semiMajorAxisMeters =
    semiMajorAxisKilometers *
    1_000;

  return 2 *
    Math.PI *
    Math.sqrt(
      semiMajorAxisMeters **
        3 /
      (
        6.67430e-11 *
        (
          hostMassEarth +
          moonMassEarth
        ) *
        5.9722e24
      ),
    ) /
    86_400;
}
