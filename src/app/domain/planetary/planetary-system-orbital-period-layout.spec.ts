import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitalPeriod,
} from './planetary-orbital-period';

import {
  PlanetarySystemOrbitalPeriodLayout,
} from './planetary-system-orbital-period-layout';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

describe(
  'PlanetarySystemOrbitalPeriodLayout point 18.4',
  () => {
    const locator =
      new SystemLocator(
        2n,
        4n,
        6n,
      );

    it(
      'should preserve one ordered period per mature planet around a common V1 host mass',
      () => {
        const layout =
          new PlanetarySystemOrbitalPeriodLayout(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            1,
            [
              period(
                1,
                1,
                1,
              ),
              period(
                2,
                4,
                1,
              ),
            ],
          );

        expect(
          layout.planetCount,
        ).toBe(2);

        expect(
          layout.hasPeriods,
        ).toBe(true);

        expect(
          layout.innerPeriodDays,
        ).toBe(365.25);

        expect(
          layout.outerPeriodDays,
        ).toBeCloseTo(
          8 *
            365.25,
          12,
        );
      },
    );

    it(
      'should represent empty mature systems without asserting a host period mass',
      () => {
        const layout =
          new PlanetarySystemOrbitalPeriodLayout(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            null,
            [],
          );

        expect(
          layout.planetCount,
        ).toBe(0);

        expect(
          layout.gravitatingMassSolar,
        ).toBeNull();

        expect(
          layout.innerPeriodDays,
        ).toBeNull();
      },
    );

    it(
      'should reject non-common host masses, non-contiguous identities and non-increasing periods',
      () => {
        expect(
          () =>
            new PlanetarySystemOrbitalPeriodLayout(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              1,
              [
                period(
                  1,
                  1,
                  1.1,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemOrbitalPeriodLayout(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              1,
              [
                period(
                  2,
                  4,
                  1,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        const outer =
          period(
            2,
            4,
            1,
          );

        const inner =
          period(
            1,
            9,
            1,
          );

        expect(
          () =>
            new PlanetarySystemOrbitalPeriodLayout(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              1,
              [
                inner,
                outer,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function period(
      ordinal:
        number,

      semiMajorAxisAu:
        number,

      massSolar:
        number,
    ): PlanetaryOrbitalPeriod {

      const years =
        Math.sqrt(
          semiMajorAxisAu **
            3 /
          massSolar,
        );

      return new PlanetaryOrbitalPeriod(
        ordinal,
        new BodyLocator(
          locator.galaxyIndex,
          locator.sectorKey,
          locator.galacticObjectIndex,
          BigInt(
            ordinal -
              1,
          ),
        ),
        new BodySeed(
          ordinal ===
            1
            ? '11111111111111111111111111111111'
            : '22222222222222222222222222222222',
        ),
        semiMajorAxisAu,
        massSolar,
        years,
        years *
          365.25,
      );
    }
  },
);
