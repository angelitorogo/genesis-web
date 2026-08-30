import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

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
  MoonOrbitalElements,
} from './moon-orbital-elements';

import {
  MoonPhysicalProperties,
} from './moon-physical-properties';

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
  RelevantMoon,
} from './relevant-moon';

describe(
  'RelevantMoon through point 21.5',
  () => {
    const locator =
      new BodyLocator(
        4n,
        -9n,
        12n,
        1n,
      );

    const seed =
      new BodySeed(
        '22222222222222222222222222222222',
      );

    it(
      'should preserve the exact physical/orbital/tidal/environment products while keeping later identity/habitability absent',
      () => {
        const physical =
          physicalFixture();

        const orbit =
          orbitFixture(
            physical,
          );

        const tidalState =
          tidalFixture(
            physical,
            orbit,
          );

        const environmentState =
          environmentFixture(
            physical,
            tidalState,
          );

        const moon =
          new RelevantMoon(
            2,
            locator,
            seed,
            1,
            physical,
            orbit,
            tidalState,
            environmentState,
          );

        expect(
          moon.physicalProperties,
        ).toBe(physical);

        expect(
          moon.orbit,
        ).toBe(orbit);

        expect(
          moon.tidalState,
        ).toBe(tidalState);

        expect(
          moon.environmentState,
        ).toBe(environmentState);

        expect(
          moon.atmosphereRegime,
        ).toBe(
          MoonAtmosphereRegime.EXOSPHERE,
        );

        expect(
          moon.waterRegime,
        ).toBe(
          MoonWaterRegime.NONE,
        );

        expect(
          moon.massEarth,
        ).toBe(0.01);

        expect(
          moon.isTidallyLocked,
        ).toBe(true);

        expect(
          moon.rotationPeriodHours,
        ).toBeCloseTo(
          orbit.orbitalPeriodDays *
            24,
          12,
        );

        for (
          const reservedProperty
          of [
            'locator',
            'seed',
            'moonSeed',
            'designation',
            'atmosphere',
            'waterInventory',
            'geology',
            'habitability',
          ]
        ) {
          expect(
            reservedProperty in
              moon,
          ).toBe(false);
        }
      },
    );

    it(
      'should reject host/local ordinal mismatches or a tidal state sourced from another physical orbit',
      () => {
        const physical =
          physicalFixture();

        const orbit =
          orbitFixture(
            physical,
          );

        const tidalState =
          tidalFixture(
            physical,
            orbit,
          );

        const environmentState =
          environmentFixture(
            physical,
            tidalState,
          );

        expect(
          () =>
            new RelevantMoon(
              1,
              locator,
              seed,
              1,
              physical,
              orbit,
              tidalState,
              environmentState,
            ),
        ).toThrow(
          RangeError,
        );

        const otherPhysical =
          new MoonPhysicalProperties(
            2,
            1,
            0.02,
            0.3,
            4,
            0.2,
          );

        expect(
          () =>
            new RelevantMoon(
              2,
              locator,
              seed,
              1,
              otherPhysical,
              orbit,
              tidalState,
              environmentState,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function physicalFixture():
  MoonPhysicalProperties {

  return new MoonPhysicalProperties(
    2,
    1,
    0.01,
    0.25,
    3.5,
    0.16,
  );
}

function orbitFixture(
  physical:
    MoonPhysicalProperties,
): MoonOrbitalElements {

  const semiMajorAxisPlanetRadii =
    20;

  const semiMajorAxisKilometers =
    semiMajorAxisPlanetRadii *
    6_371;

  const orbitalPeriodDays =
    keplerianPeriodDays(
      1,
      physical.massEarth,
      semiMajorAxisKilometers,
    );

  return new MoonOrbitalElements(
    2,
    1,
    semiMajorAxisPlanetRadii,
    semiMajorAxisKilometers,
    0.02,
    2,
    orbitalPeriodDays,
    2.5,
    200,
  );
}

function tidalFixture(
  physical:
    MoonPhysicalProperties,

  orbit:
    MoonOrbitalElements,
): MoonTidalState {

  return new MoonTidalState(
    2,
    1,
    1,
    1,
    24,
    false,
    physical.massEarth,
    physical.radiusEarth,
    orbit.semiMajorAxisPlanetRadii,
    orbit.semiMajorAxisKilometers,
    orbit.eccentricity,
    orbit.orbitalPeriodDays,
    synchronousOrbitPlanetRadiiV1(
      1,
      1,
      24,
    ),
    0.7,
    0.3,
    MoonTidalRegime.MODERATE,
    0.8,
    MoonTidalLockingRegime.SYNCHRONIZED,
    orbit.orbitalPeriodDays *
      24,
    MoonTidalMigrationRegime.OUTWARD,
  );
}

function environmentFixture(
  physical:
    MoonPhysicalProperties,

  tidalState:
    MoonTidalState,
): MoonEnvironmentState {

  return new MoonEnvironmentState(
    2,
    1,
    physical.massEarth,
    physical.radiusEarth,
    physical.meanDensityGramsPerCubicCentimeter,
    physical.surfaceGravityEarth,
    1,
    tidalState.tidalHeatingIndex01,
    0.05,
    0.16,
    260,
    270,
    0.15,
    MoonAtmosphereRegime.EXOSPHERE,
    0.05,
    0.05,
    0.01,
    MoonWaterRegime.NONE,
    0.30,
    0.30,
    MoonGeologyRegime.ACTIVE,
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
