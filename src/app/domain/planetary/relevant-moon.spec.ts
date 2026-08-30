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
  RelevantMoon,
} from './relevant-moon';

describe(
  'RelevantMoon point 21.3',
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
      'should use only host body context plus a local moonOrdinal and expose the exact physical/orbital products',
      () => {
        const physical =
          new MoonPhysicalProperties(
            2,
            1,
            0.01,
            0.25,
            3.5,
            0.16,
          );

        const orbit =
          new MoonOrbitalElements(
            2,
            1,
            20,
            200_000,
            0.02,
            2,
            10,
            2.5,
            200,
          );

        const moon =
          new RelevantMoon(
            2,
            locator,
            seed,
            1,
            physical,
            orbit,
          );

        expect(
          moon.physicalProperties,
        ).toBe(physical);

        expect(
          moon.orbit,
        ).toBe(orbit);

        expect(
          moon.massEarth,
        ).toBe(0.01);

        expect(
          moon.orbitalPeriodDays,
        ).toBe(10);

        for (
          const reservedProperty
          of [
            'locator',
            'seed',
            'moonSeed',
            'designation',
            'tidalState',
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
      'should reject host/body and local ordinal mismatches',
      () => {
        const physical =
          new MoonPhysicalProperties(
            2,
            1,
            0.01,
            0.25,
            3.5,
            0.16,
          );

        const orbit =
          new MoonOrbitalElements(
            2,
            1,
            20,
            200_000,
            0.02,
            2,
            10,
            2.5,
            200,
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
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new RelevantMoon(
              2,
              locator,
              seed,
              2,
              physical,
              orbit,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
