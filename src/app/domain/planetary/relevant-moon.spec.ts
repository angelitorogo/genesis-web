import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

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
  RelevantMoon,
} from './relevant-moon';

describe(
  'RelevantMoon through point 21.4',
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
      'should preserve the exact physical/orbital/tidal products while keeping later identities/environment absent',
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

        const moon =
          new RelevantMoon(
            2,
            locator,
            seed,
            1,
            physical,
            orbit,
            tidalState,
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
