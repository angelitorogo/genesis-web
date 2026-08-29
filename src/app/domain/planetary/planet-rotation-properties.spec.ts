import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  apparentSolarDayHours,
  PlanetRotationProperties,
} from './planet-rotation-properties';

describe(
  'PlanetRotationProperties point 19.3',
  () => {
    const locator =
      new BodyLocator(
        2n,
        -4n,
        7n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should preserve a coherent prograde sidereal spin, solar day and axial tilt',
      () => {
        const orbitalPeriodHours =
          365.25 *
          24;

        const rotationPeriodHours =
          24;

        const expectedDayLengthHours =
          apparentSolarDayHours(
            rotationPeriodHours,
            orbitalPeriodHours,
            false,
          )!;

        const properties =
          new PlanetRotationProperties(
            1,
            locator,
            seed,
            orbitalPeriodHours,
            rotationPeriodHours,
            expectedDayLengthHours,
            23.44,
          );

        expect(
          properties.rotationPeriodHours,
        ).toBe(24);

        expect(
          properties.dayLengthHours,
        ).toBeCloseTo(
          expectedDayLengthHours,
          12,
        );

        expect(
          properties.axialTiltDegrees,
        ).toBe(23.44);

        expect(
          properties.isRetrograde,
        ).toBe(false);

        expect(
          properties.isTidallySynchronized,
        ).toBe(false);

        expect(
          properties.hasFiniteDayLength,
        ).toBe(true);
      },
    );

    it(
      'should derive a shorter apparent solar day for retrograde rotation',
      () => {
        const orbitalPeriodHours =
          365.25 *
          24;

        const dayLengthHours =
          apparentSolarDayHours(
            24,
            orbitalPeriodHours,
            true,
          )!;

        const properties =
          new PlanetRotationProperties(
            1,
            locator,
            seed,
            orbitalPeriodHours,
            24,
            dayLengthHours,
            177,
          );

        expect(
          properties.isRetrograde,
        ).toBe(true);

        expect(
          properties.dayLengthHours,
        ).toBeLessThan(
          properties.rotationPeriodHours,
        );
      },
    );

    it(
      'should represent exact prograde synchronous rotation with no finite solar day',
      () => {
        const orbitalPeriodHours =
          240;

        const properties =
          new PlanetRotationProperties(
            1,
            locator,
            seed,
            orbitalPeriodHours,
            orbitalPeriodHours,
            null,
            0.4,
          );

        expect(
          properties.isTidallySynchronized,
        ).toBe(true);

        expect(
          properties.hasFiniteDayLength,
        ).toBe(false);

        expect(
          properties.dayLengthHours,
        ).toBeNull();
      },
    );

    it(
      'should reject invalid spin/tilt values or a solar day inconsistent with the beat period',
      () => {
        for (
          const rotationPeriodHours
          of [
            0,
            -1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new PlanetRotationProperties(
                1,
                locator,
                seed,
                100,
                rotationPeriodHours,
                10,
                10,
              ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const axialTiltDegrees
          of [
            -0.1,
            180.1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new PlanetRotationProperties(
                1,
                locator,
                seed,
                240,
                24,
                apparentSolarDayHours(
                  24,
                  240,
                  false,
                ),
                axialTiltDegrees,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            new PlanetRotationProperties(
              1,
              locator,
              seed,
              240,
              24,
              24,
              10,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetRotationProperties(
              1,
              locator,
              seed,
              240,
              240,
              240,
              1,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
