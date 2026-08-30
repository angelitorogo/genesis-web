import {
  MoonTidalLockingRegime,
  moonTidalLockingRegimeForIndex01,
} from './moon-tidal-locking-regime';

import {
  MoonTidalMigrationRegime,
} from './moon-tidal-migration-regime';

import {
  MoonTidalRegime,
  moonTidalRegimeForHeatingIndex01,
} from './moon-tidal-regime';

const SOURCE_TOLERANCE =
  1e-9;

const V1_GRAVITATIONAL_CONSTANT =
  6.67430e-11;

const V1_EARTH_MASS_KILOGRAMS =
  5.9722e24;

const V1_EARTH_RADIUS_KILOMETERS =
  6_371;

const V1_SECONDS_PER_DAY =
  86_400;

/**
 * Point-21.4 tidal/spin state for one relevant moon.
 *
 * V1 does not invent a system age, Love number k2 or dissipation factor Q. The
 * locking/heating values are normalized mature-system proxies derived from the
 * already frozen point-21.3 physical/orbital state. They are suitable for
 * deterministic Ground Truth branching, not absolute tidal times or heat flux.
 */
export class MoonTidalState {

  constructor(
    readonly hostPlanetOrdinal:
      number,

    readonly moonOrdinal:
      number,

    readonly sourceHostPlanetMassEarth:
      number,

    readonly sourceHostPlanetRadiusEarth:
      number,

    readonly sourceHostPlanetRotationPeriodHours:
      number,

    readonly sourceHostPlanetIsRetrogradeRotation:
      boolean,

    readonly sourceMoonMassEarth:
      number,

    readonly sourceMoonRadiusEarth:
      number,

    readonly sourceSemiMajorAxisPlanetRadii:
      number,

    readonly sourceSemiMajorAxisKilometers:
      number,

    readonly sourceEccentricity:
      number,

    readonly sourceOrbitalPeriodDays:
      number,

    readonly synchronousOrbitPlanetRadii:
      number,

    readonly tidalForcingIndex01:
      number,

    readonly tidalHeatingIndex01:
      number,

    readonly tidalRegime:
      MoonTidalRegime,

    readonly tidalLockingIndex01:
      number,

    readonly tidalLockingRegime:
      MoonTidalLockingRegime,

    readonly rotationPeriodHours:
      number,

    readonly migrationRegime:
      MoonTidalMigrationRegime,
  ) {
    assertPositiveInteger(
      hostPlanetOrdinal,
      'hostPlanetOrdinal',
    );

    assertPositiveInteger(
      moonOrdinal,
      'moonOrdinal',
    );

    assertPositiveFinite(
      sourceHostPlanetMassEarth,
      'sourceHostPlanetMassEarth',
    );

    assertPositiveFinite(
      sourceHostPlanetRadiusEarth,
      'sourceHostPlanetRadiusEarth',
    );

    assertPositiveFinite(
      sourceHostPlanetRotationPeriodHours,
      'sourceHostPlanetRotationPeriodHours',
    );

    assertPositiveFinite(
      sourceMoonMassEarth,
      'sourceMoonMassEarth',
    );

    assertPositiveFinite(
      sourceMoonRadiusEarth,
      'sourceMoonRadiusEarth',
    );

    assertPositiveFinite(
      sourceSemiMajorAxisPlanetRadii,
      'sourceSemiMajorAxisPlanetRadii',
    );

    assertPositiveFinite(
      sourceSemiMajorAxisKilometers,
      'sourceSemiMajorAxisKilometers',
    );

    if (
      !Number.isFinite(
        sourceEccentricity,
      ) ||
      sourceEccentricity <
        0 ||
      sourceEccentricity >=
        1
    ) {
      throw new RangeError(
        'sourceEccentricity must be finite in [0, 1).',
      );
    }

    assertPositiveFinite(
      sourceOrbitalPeriodDays,
      'sourceOrbitalPeriodDays',
    );

    assertPositiveFinite(
      synchronousOrbitPlanetRadii,
      'synchronousOrbitPlanetRadii',
    );

    assertUnitInterval(
      tidalForcingIndex01,
      'tidalForcingIndex01',
    );

    assertUnitInterval(
      tidalHeatingIndex01,
      'tidalHeatingIndex01',
    );

    assertUnitInterval(
      tidalLockingIndex01,
      'tidalLockingIndex01',
    );

    assertPositiveFinite(
      rotationPeriodHours,
      'rotationPeriodHours',
    );

    const expectedSemiMajorAxisKilometers =
      sourceSemiMajorAxisPlanetRadii *
      sourceHostPlanetRadiusEarth *
      V1_EARTH_RADIUS_KILOMETERS;

    if (
      !approximatelyEqual(
        sourceSemiMajorAxisKilometers,
        expectedSemiMajorAxisKilometers,
      )
    ) {
      throw new RangeError(
        'MoonTidalState sourceSemiMajorAxisKilometers must match the point-21.3 planet-radius projection.',
      );
    }

    const expectedOrbitalPeriodDays =
      keplerianOrbitalPeriodDaysV1(
        sourceHostPlanetMassEarth,
        sourceMoonMassEarth,
        sourceSemiMajorAxisKilometers,
      );

    if (
      !approximatelyEqual(
        sourceOrbitalPeriodDays,
        expectedOrbitalPeriodDays,
      )
    ) {
      throw new RangeError(
        'MoonTidalState sourceOrbitalPeriodDays must preserve the point-21.3 Keplerian orbit.',
      );
    }

    const expectedSynchronousOrbit =
      synchronousOrbitPlanetRadiiV1(
        sourceHostPlanetMassEarth,
        sourceHostPlanetRadiusEarth,
        sourceHostPlanetRotationPeriodHours,
      );

    if (
      !approximatelyEqual(
        synchronousOrbitPlanetRadii,
        expectedSynchronousOrbit,
      )
    ) {
      throw new RangeError(
        'MoonTidalState synchronousOrbitPlanetRadii must match the frozen host mass/radius/rotation sources.',
      );
    }

    if (
      tidalRegime !==
      moonTidalRegimeForHeatingIndex01(
        tidalHeatingIndex01,
      )
    ) {
      throw new RangeError(
        'MoonTidalState tidalRegime must match tidalHeatingIndex01.',
      );
    }

    if (
      tidalLockingRegime !==
      moonTidalLockingRegimeForIndex01(
        tidalLockingIndex01,
      )
    ) {
      throw new RangeError(
        'MoonTidalState tidalLockingRegime must match tidalLockingIndex01.',
      );
    }

    if (
      tidalLockingRegime ===
        MoonTidalLockingRegime.SYNCHRONIZED &&
      !approximatelyEqual(
        rotationPeriodHours,
        sourceOrbitalPeriodDays *
          24,
      )
    ) {
      throw new RangeError(
        'Synchronized MoonTidalState rotationPeriodHours must equal the orbital period.',
      );
    }

    const expectedMigrationRegime =
      moonTidalMigrationRegimeV1(
        sourceHostPlanetIsRetrogradeRotation,
        sourceSemiMajorAxisPlanetRadii,
        synchronousOrbitPlanetRadii,
      );

    if (
      migrationRegime !==
      expectedMigrationRegime
    ) {
      throw new RangeError(
        'MoonTidalState migrationRegime must match the host spin and moon/corotation radii.',
      );
    }
  }

  get isTidallyLocked():
    boolean {

    return this
      .tidalLockingRegime ===
      MoonTidalLockingRegime.SYNCHRONIZED;
  }

  get hasSignificantTidalHeating():
    boolean {

    return (
      this.tidalRegime ===
        MoonTidalRegime.MODERATE ||
      this.tidalRegime ===
        MoonTidalRegime.STRONG ||
      this.tidalRegime ===
        MoonTidalRegime.EXTREME
    );
  }

  get isMigratingInward():
    boolean {

    return this
      .migrationRegime ===
      MoonTidalMigrationRegime.INWARD;
  }
}

export function synchronousOrbitPlanetRadiiV1(
  hostPlanetMassEarth:
    number,

  hostPlanetRadiusEarth:
    number,

  hostPlanetRotationPeriodHours:
    number,
): number {

  assertPositiveFinite(
    hostPlanetMassEarth,
    'hostPlanetMassEarth',
  );

  assertPositiveFinite(
    hostPlanetRadiusEarth,
    'hostPlanetRadiusEarth',
  );

  assertPositiveFinite(
    hostPlanetRotationPeriodHours,
    'hostPlanetRotationPeriodHours',
  );

  const rotationPeriodSeconds =
    hostPlanetRotationPeriodHours *
    3_600;

  const synchronousOrbitMeters =
    (
      V1_GRAVITATIONAL_CONSTANT *
      hostPlanetMassEarth *
      V1_EARTH_MASS_KILOGRAMS *
      rotationPeriodSeconds **
        2 /
      (
        4 *
        Math.PI **
          2
      )
    ) **
      (1 / 3);

  const hostRadiusMeters =
    hostPlanetRadiusEarth *
    V1_EARTH_RADIUS_KILOMETERS *
    1_000;

  return synchronousOrbitMeters /
    hostRadiusMeters;
}

export function moonTidalMigrationRegimeV1(
  hostPlanetIsRetrogradeRotation:
    boolean,

  semiMajorAxisPlanetRadii:
    number,

  synchronousOrbitPlanetRadii:
    number,
): MoonTidalMigrationRegime {

  assertPositiveFinite(
    semiMajorAxisPlanetRadii,
    'semiMajorAxisPlanetRadii',
  );

  assertPositiveFinite(
    synchronousOrbitPlanetRadii,
    'synchronousOrbitPlanetRadii',
  );

  if (
    hostPlanetIsRetrogradeRotation
  ) {
    return MoonTidalMigrationRegime.INWARD;
  }

  const ratio =
    semiMajorAxisPlanetRadii /
    synchronousOrbitPlanetRadii;

  if (
    ratio <
    0.90
  ) {
    return MoonTidalMigrationRegime.INWARD;
  }

  if (
    ratio <=
    1.10
  ) {
    return MoonTidalMigrationRegime.NEAR_SYNCHRONOUS;
  }

  return MoonTidalMigrationRegime.OUTWARD;
}

function keplerianOrbitalPeriodDaysV1(
  hostPlanetMassEarth:
    number,

  moonMassEarth:
    number,

  semiMajorAxisKilometers:
    number,
): number {

  const semiMajorAxisMeters =
    semiMajorAxisKilometers *
    1_000;

  const totalMassKilograms =
    (
      hostPlanetMassEarth +
      moonMassEarth
    ) *
    V1_EARTH_MASS_KILOGRAMS;

  const periodSeconds =
    2 *
    Math.PI *
    Math.sqrt(
      semiMajorAxisMeters **
        3 /
      (
        V1_GRAVITATIONAL_CONSTANT *
        totalMassKilograms
      ),
    );

  return periodSeconds /
    V1_SECONDS_PER_DAY;
}

function assertPositiveInteger(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isInteger(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be a positive integer.`,
    );
  }
}

function assertPositiveFinite(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    throw new RangeError(
      `${label} must be finite and > 0.`,
    );
  }
}

function assertUnitInterval(
  value:
    number,

  label:
    string,
): void {

  if (
    !Number.isFinite(
      value,
    ) ||
    value <
      0 ||
    value >
      1
  ) {
    throw new RangeError(
      `${label} must be finite in [0, 1].`,
    );
  }
}

function approximatelyEqual(
  left:
    number,

  right:
    number,
): boolean {

  const scale =
    Math.max(
      1,
      Math.abs(
        left,
      ),
      Math.abs(
        right,
      ),
    );

  return Math.abs(
    left -
    right,
  ) <=
    SOURCE_TOLERANCE *
    scale;
}
