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

describe(
  'MoonTidalState point 21.4',
  () => {
    it(
      'should preserve a coherent synchronized Earth-Moon-scale tidal state',
      () => {
        const synchronousOrbitPlanetRadii =
          synchronousOrbitPlanetRadiiV1(
            1,
            1,
            24,
          );

        const orbitalPeriodDays =
          keplerianPeriodDays(
            1,
            0.0123,
            60 *
              6_371,
          );

        const state =
          new MoonTidalState(
            1,
            1,
            1,
            1,
            24,
            false,
            0.0123,
            0.2727,
            60,
            60 *
              6_371,
            0.055,
            orbitalPeriodDays,
            synchronousOrbitPlanetRadii,
            0.5,
            0.13,
            MoonTidalRegime.WEAK,
            0.75,
            MoonTidalLockingRegime.SYNCHRONIZED,
            orbitalPeriodDays *
              24,
            MoonTidalMigrationRegime.OUTWARD,
          );

        expect(
          state.isTidallyLocked,
        ).toBe(true);

        expect(
          state.hasSignificantTidalHeating,
        ).toBe(false);

        expect(
          state.isMigratingInward,
        ).toBe(false);
      },
    );

    it(
      'should reject source projections, locking verdicts or migration directions that contradict the frozen inputs',
      () => {
        const synchronousOrbitPlanetRadii =
          synchronousOrbitPlanetRadiiV1(
            1,
            1,
            24,
          );

        const orbitalPeriodDays =
          keplerianPeriodDays(
            1,
            0.0123,
            60 *
              6_371,
          );

        expect(
          () =>
            new MoonTidalState(
              1,
              1,
              1,
              1,
              24,
              false,
              0.0123,
              0.2727,
              60,
              300_000,
              0.055,
              orbitalPeriodDays,
              synchronousOrbitPlanetRadii,
              0.5,
              0.13,
              MoonTidalRegime.WEAK,
              0.75,
              MoonTidalLockingRegime.SYNCHRONIZED,
              orbitalPeriodDays *
                24,
              MoonTidalMigrationRegime.OUTWARD,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonTidalState(
              1,
              1,
              1,
              1,
              24,
              false,
              0.0123,
              0.2727,
              60,
              60 *
                6_371,
              0.055,
              orbitalPeriodDays,
              synchronousOrbitPlanetRadii,
              0.5,
              0.13,
              MoonTidalRegime.STRONG,
              0.75,
              MoonTidalLockingRegime.SYNCHRONIZED,
              orbitalPeriodDays *
                24,
              MoonTidalMigrationRegime.OUTWARD,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonTidalState(
              1,
              1,
              1,
              1,
              24,
              true,
              0.0123,
              0.2727,
              60,
              60 *
                6_371,
              0.055,
              orbitalPeriodDays,
              synchronousOrbitPlanetRadii,
              0.5,
              0.13,
              MoonTidalRegime.WEAK,
              0.75,
              MoonTidalLockingRegime.SYNCHRONIZED,
              orbitalPeriodDays *
                24,
              MoonTidalMigrationRegime.OUTWARD,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function keplerianPeriodDays(
  hostMassEarth:
    number,

  moonMassEarth:
    number,

  semiMajorAxisKilometers:
    number,
): number {

  const gravitationalConstant =
    6.67430e-11;

  const earthMassKilograms =
    5.9722e24;

  const semiMajorAxisMeters =
    semiMajorAxisKilometers *
    1_000;

  return 2 *
    Math.PI *
    Math.sqrt(
      semiMajorAxisMeters **
        3 /
      (
        gravitationalConstant *
        (
          hostMassEarth +
          moonMassEarth
        ) *
        earthMassKilograms
      ),
    ) /
    86_400;
}
