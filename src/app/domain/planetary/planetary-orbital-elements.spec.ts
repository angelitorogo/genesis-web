import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

describe(
  'PlanetaryOrbitalElements point 18.3',
  () => {
    const locator =
      new BodyLocator(
        1n,
        -2n,
        3n,
        0n,
      );

    const seed =
      new BodySeed(
        '0123456789ABCDEFFEDCBA9876543210',
      );

    it(
      'should expose plausible geometric elements and derive apsides without prematurely owning period or phase',
      () => {
        const orbit =
          new PlanetaryOrbitalElements(
            1,
            locator,
            seed,
            2,
            0.25,
            3.5,
            120,
            250,
          );

        expect(
          orbit.periastronAu,
        ).toBe(1.5);

        expect(
          orbit.apoastronAu,
        ).toBe(2.5);

        expect(
          'orbitalPeriodDays' in orbit,
        ).toBe(false);

        expect(
          'periodYears' in orbit,
        ).toBe(false);

        expect(
          'meanAnomalyDegrees' in orbit,
        ).toBe(false);
      },
    );

    it(
      'should reject broken body identity and invalid geometric ranges',
      () => {
        expect(
          () =>
            new PlanetaryOrbitalElements(
              2,
              locator,
              seed,
              1,
              0,
              0,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalElements(
              1,
              locator,
              seed,
              0,
              0,
              0,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalElements(
              1,
              locator,
              seed,
              1,
              1,
              0,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalElements(
              1,
              locator,
              seed,
              1,
              0,
              181,
              0,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitalElements(
              1,
              locator,
              seed,
              1,
              0,
              0,
              360,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
