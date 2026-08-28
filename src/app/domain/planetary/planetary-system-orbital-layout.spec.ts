import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitalElements,
} from './planetary-orbital-elements';

import {
  PlanetarySystemOrbitalLayout,
} from './planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

describe(
  'PlanetarySystemOrbitalLayout point 18.3',
  () => {
    const systemLocator =
      new SystemLocator(
        2n,
        4n,
        6n,
      );

    it(
      'should preserve a strictly ordered non-crossing orbit set inside its generation envelope',
      () => {
        const layout =
          new PlanetarySystemOrbitalLayout(
            systemLocator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            0.1,
            20,
            [
              orbit(
                1,
                0.8,
                0.05,
              ),
              orbit(
                2,
                2.5,
                0.1,
              ),
            ],
          );

        expect(
          layout.planetCount,
        ).toBe(2);

        expect(
          layout.hasPlanets,
        ).toBe(true);

        expect(
          layout.innerSemiMajorAxisAu,
        ).toBe(0.8);

        expect(
          layout.outerSemiMajorAxisAu,
        ).toBe(2.5);

        expect(
          layout.radialSpanRatio,
        ).toBeCloseTo(
          3.125,
          15,
        );
      },
    );

    it(
      'should support an explicitly unavailable envelope only for an empty dynamically excluded layout',
      () => {
        const layout =
          new PlanetarySystemOrbitalLayout(
            systemLocator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            null,
            null,
            [],
          );

        expect(
          layout.planetCount,
        ).toBe(0);

        expect(
          layout.innerSemiMajorAxisAu,
        ).toBeNull();

        expect(
          () =>
            new PlanetarySystemOrbitalLayout(
              systemLocator,
              PlanetarySystemOrbitTopology.CIRCUMBINARY,
              null,
              null,
              [
                orbit(
                  1,
                  2,
                  0,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unordered, envelope-breaking or geometrically crossing ellipses',
      () => {
        expect(
          () =>
            new PlanetarySystemOrbitalLayout(
              systemLocator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              0.5,
              10,
              [
                orbit(
                  1,
                  0.4,
                  0,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemOrbitalLayout(
              systemLocator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              0.1,
              10,
              [
                orbit(
                  1,
                  1,
                  0.3,
                ),
                orbit(
                  2,
                  1.5,
                  0.2,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function orbit(
      planetOrdinal:
        number,

      semiMajorAxisAu:
        number,

      eccentricity:
        number,
    ): PlanetaryOrbitalElements {

      return new PlanetaryOrbitalElements(
        planetOrdinal,
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(
            planetOrdinal -
              1,
          ),
        ),
        new BodySeed(
          planetOrdinal ===
            1
            ? '0123456789ABCDEFFEDCBA9876543210'
            : 'FEDCBA98765432100123456789ABCDEF',
        ),
        semiMajorAxisAu,
        eccentricity,
        1,
        30,
        60,
      );
    }
  },
);
