import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

describe(
  'PlanetaryOrbitalPeriod point 18.4',
  () => {
    const locator =
      new BodyLocator(
        1n,
        2n,
        3n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should preserve an Earth-reference one-year orbit around one solar mass',
      () => {
        const period =
          new PlanetaryOrbitalPeriod(
            1,
            locator,
            seed,
            1,
            1,
            1,
            365.25,
          );

        expect(
          period.periodYears,
        ).toBe(1);

        expect(
          period.periodDays,
        ).toBe(365.25);
      },
    );

    it(
      'should accept the V1 Kepler relation for a wider orbit around a heavier host',
      () => {
        const expectedYears =
          Math.sqrt(
            4 ** 3 /
            2,
          );

        const period =
          new PlanetaryOrbitalPeriod(
            1,
            locator,
            seed,
            4,
            2,
            expectedYears,
            expectedYears *
              365.25,
          );

        expect(
          period.periodYears,
        ).toBeCloseTo(
          Math.sqrt(32),
          14,
        );
      },
    );

    it(
      'should reject identity mismatches and periods that contradict the frozen semi-major axis or day/year conversion',
      () => {
        expect(
          () =>
            new PlanetaryOrbitalPeriod(
              2,
              locator,
              seed,
              1,
              1,
              1,
              365.25,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalPeriod(
              1,
              locator,
              seed,
              1,
              1,
              2,
              730.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalPeriod(
              1,
              locator,
              seed,
              1,
              1,
              1,
              365,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
