import {
  MoonAtmosphereRegime,
} from '../../domain/planetary/moon-atmosphere-regime';

import {
  MoonGeologyRegime,
} from '../../domain/planetary/moon-geology-regime';

import {
  MoonPhysicalProperties,
} from '../../domain/planetary/moon-physical-properties';

import {
  MoonTidalLockingRegime,
} from '../../domain/planetary/moon-tidal-locking-regime';

import {
  MoonTidalState,
  moonTidalMigrationRegimeV1,
  synchronousOrbitPlanetRadiiV1,
} from '../../domain/planetary/moon-tidal-state';

import {
  MoonTidalRegime,
} from '../../domain/planetary/moon-tidal-regime';

import {
  MoonWaterRegime,
} from '../../domain/planetary/moon-water-regime';

import {
  type Planet,
} from '../../domain/planetary/planet';

import {
  MoonEnvironmentEngine,
} from './moon-environment-engine';

const G =
  6.67430e-11;
const EARTH_MASS_KG =
  5.9722e24;
const EARTH_RADIUS_KM =
  6_371;
const SECONDS_PER_DAY =
  86_400;

describe(
  'MoonEnvironmentEngine point 21.5',
  () => {
    it(
      'should keep an Earth-Moon-scale dense satellite nearly airless, dry and only weakly geological',
      () => {
        const host =
          hostFixture(
            1,
            1,
            1,
          );

        const physical =
          new MoonPhysicalProperties(
            1,
            1,
            0.0109353,
            0.258576,
            3.488,
            0.16355,
          );

        const tidal =
          tidalFixture(
            host,
            physical,
            53.8058,
            0.25933,
          );

        const environment =
          MoonEnvironmentEngine
            .generate(
              host,
              physical,
              tidal,
            );

        expect(
          environment.atmosphereRegime,
        ).toBe(
          MoonAtmosphereRegime.EXOSPHERE,
        );
        expect(
          environment.waterRegime,
        ).toBe(
          MoonWaterRegime.NONE,
        );
        expect(
          environment.geologyRegime,
        ).toBe(
          MoonGeologyRegime.LOW_ACTIVITY,
        );
        expect(
          environment.sourceTidalHeatingIndex01,
        ).toBe(
          tidal.tidalHeatingIndex01,
        );
      },
    );

    it(
      'should allow a cold volatile-rich Titan-scale moon to retain a substantial atmosphere and a subsurface ocean',
      () => {
        const host =
          hostFixture(
            318,
            11.2,
            0.011,
          );

        const physical =
          new MoonPhysicalProperties(
            1,
            1,
            0.0225,
            0.404,
            1.88,
            0.138,
          );

        const tidal =
          tidalFixture(
            host,
            physical,
            20,
            0.10,
          );

        const environment =
          MoonEnvironmentEngine
            .generate(
              host,
              physical,
              tidal,
            );

        expect(
          environment.atmosphereRegime,
        ).toBe(
          MoonAtmosphereRegime.SUBSTANTIAL,
        );
        expect(
          environment.waterRegime,
        ).toBe(
          MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN,
        );
        expect(
          environment.hasSubsurfaceOcean,
        ).toBe(true);
        expect(
          environment.estimatedSurfaceTemperatureKelvin,
        ).toBeLessThan(100);
      },
    );

    it(
      'should turn extreme tidal heating into extreme geology without inventing water for a dense Io-scale moon',
      () => {
        const host =
          hostFixture(
            317.8,
            11.2,
            0.037,
          );

        const physical =
          new MoonPhysicalProperties(
            1,
            1,
            0.015,
            0.286,
            3.53,
            0.183,
          );

        const tidal =
          tidalFixture(
            host,
            physical,
            6,
            1,
          );

        const environment =
          MoonEnvironmentEngine
            .generate(
              host,
              physical,
              tidal,
            );

        expect(
          environment.geologyRegime,
        ).toBe(
          MoonGeologyRegime.EXTREME,
        );
        expect(
          environment.waterRegime,
        ).toBe(
          MoonWaterRegime.NONE,
        );
        expect(
          environment.atmosphereRegime,
        ).toBe(
          MoonAtmosphereRegime.THIN,
        );
      },
    );

    it(
      'should reject point-21.3/21.4 products belonging to different moon ordinals',
      () => {
        const host =
          hostFixture(
            1,
            1,
            1,
          );

        const physical =
          new MoonPhysicalProperties(
            1,
            1,
            0.01,
            0.25,
            3.4,
            0.16,
          );

        const wrongPhysical =
          new MoonPhysicalProperties(
            1,
            2,
            0.01,
            0.25,
            3.4,
            0.16,
          );

        const tidal =
          tidalFixture(
            host,
            physical,
            20,
            0.20,
          );

        expect(
          () =>
            MoonEnvironmentEngine
              .generate(
                host,
                wrongPhysical,
                tidal,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function hostFixture(
  massEarth:
    number,

  radiusEarth:
    number,

  referenceMeanInsolationEarth:
    number,
): Planet {
  return {
    planetOrdinal:
      1,
    massEarth,
    radiusEarth,
    rotationPeriodHours:
      12,
    isRetrogradeRotation:
      false,
    typeClassification: {
      referenceMeanInsolationEarth,
    },
  } as unknown as Planet;
}

function tidalFixture(
  host:
    Planet,

  physical:
    MoonPhysicalProperties,

  semiMajorAxisPlanetRadii:
    number,

  tidalHeatingIndex01:
    number,
): MoonTidalState {
  const semiMajorAxisKilometers =
    semiMajorAxisPlanetRadii *
    host.radiusEarth *
    EARTH_RADIUS_KM;

  const orbitalPeriodDays =
    2 *
    Math.PI *
    Math.sqrt(
      (
        semiMajorAxisKilometers *
        1_000
      ) **
        3 /
      (
        G *
        (
          host.massEarth +
          physical.massEarth
        ) *
        EARTH_MASS_KG
      ),
    ) /
    SECONDS_PER_DAY;

  const synchronousOrbitPlanetRadii =
    synchronousOrbitPlanetRadiiV1(
      host.massEarth,
      host.radiusEarth,
      host.rotationPeriodHours,
    );

  return new MoonTidalState(
    host.planetOrdinal,
    physical.moonOrdinal,
    host.massEarth,
    host.radiusEarth,
    host.rotationPeriodHours,
    host.isRetrogradeRotation,
    physical.massEarth,
    physical.radiusEarth,
    semiMajorAxisPlanetRadii,
    semiMajorAxisKilometers,
    0.01,
    orbitalPeriodDays,
    synchronousOrbitPlanetRadii,
    0.5,
    tidalHeatingIndex01,
    tidalHeatingIndex01 <
      0.05
      ? MoonTidalRegime.NEGLIGIBLE
      : tidalHeatingIndex01 <
          0.20
        ? MoonTidalRegime.WEAK
        : tidalHeatingIndex01 <
            0.45
          ? MoonTidalRegime.MODERATE
          : tidalHeatingIndex01 <
              0.75
            ? MoonTidalRegime.STRONG
            : MoonTidalRegime.EXTREME,
    0.80,
    MoonTidalLockingRegime.SYNCHRONIZED,
    orbitalPeriodDays *
      24,
    moonTidalMigrationRegimeV1(
      host.isRetrogradeRotation,
      semiMajorAxisPlanetRadii,
      synchronousOrbitPlanetRadii,
    ),
  );
}
