import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryArchitectureSlot,
} from './planetary-architecture-slot';

import {
  PlanetarySystemArchitecture,
} from './planetary-system-architecture';

import {
  PlanetarySystemArchitectureRegime,
} from './planetary-system-architecture-regime';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'PlanetarySystemArchitecture point 18.2',
  () => {
    const locator =
      new SystemLocator(
        1n,
        -2n,
        3n,
      );

    it(
      'should expose final planet count, radial-zone diagnostics and frozen slots',
      () => {
        const architecture =
          new PlanetarySystemArchitecture(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            PlanetarySystemArchitectureRegime.MULTI_ZONE_MULTIPLANET,
            3,
            3,
            0,
            0,
            [
              slot(
                1,
                0n,
                1,
                1,
              ),
              slot(
                2,
                1n,
                1.8,
                1,
                2,
              ),
              slot(
                3,
                2n,
                6,
                1,
                3,
              ),
            ],
          );

        expect(
          architecture.planetCount,
        ).toBe(3);

        expect(
          architecture.hasPlanets,
        ).toBe(true);

        expect(
          architecture.referenceRadialSpanRatio,
        ).toBe(6);

        expect(
          architecture.largestReferenceGapRatio,
        ).toBeCloseTo(
          6 /
            1.8,
          12,
        );

        expect(
          architecture.radialZoneCount,
        ).toBe(2);

        expect(
          Object.isFrozen(
            architecture.planetSlots,
          ),
        ).toBe(true);
      },
    );

    it(
      'should distinguish a truly empty formation from dynamically excluded inherited cores',
      () => {
        const empty =
          new PlanetarySystemArchitecture(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            PlanetarySystemArchitectureRegime.EMPTY,
            0,
            0,
            0,
            0,
            [],
          );

        const excluded =
          new PlanetarySystemArchitecture(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            PlanetarySystemArchitectureRegime.DYNAMICALLY_EXCLUDED,
            2,
            3,
            2,
            3,
            [],
          );

        expect(
          empty.planetCount,
        ).toBe(0);

        expect(
          excluded.planetCount,
        ).toBe(0);

        expect(
          excluded.excludedSourceAnchorCount,
        ).toBe(2);

        expect(
          excluded.excludedSolidCoreMassEarth,
        ).toBe(3);
      },
    );



    it(
      'should reject a radial-regime label that contradicts the frozen inherited layout',
      () => {
        expect(
          () =>
            new PlanetarySystemArchitecture(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET,
              2,
              2,
              0,
              0,
              [
                slot(
                  1,
                  0n,
                  1,
                  1,
                ),
                slot(
                  2,
                  1n,
                  4,
                  1,
                  2,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject lost inherited mass or duplicated source-anchor lineage',
      () => {
        expect(
          () =>
            new PlanetarySystemArchitecture(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              PlanetarySystemArchitectureRegime.SINGLE_PLANET,
              1,
              2,
              0,
              0,
              [
                slot(
                  1,
                  0n,
                  1,
                  1,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemArchitecture(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              PlanetarySystemArchitectureRegime.COMPACT_MULTIPLANET,
              2,
              2,
              0,
              0,
              [
                slot(
                  1,
                  0n,
                  1,
                  1,
                ),
                slot(
                  2,
                  1n,
                  2,
                  1,
                  1,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    function slot(
      planetOrdinal:
        number,

      bodyIndex:
        bigint,

      radiusAu:
        number,

      massEarth:
        number,

      anchorOrdinal =
        planetOrdinal,
    ): PlanetaryArchitectureSlot {

      return new PlanetaryArchitectureSlot(
        planetOrdinal,
        new BodyLocator(
          locator.galaxyIndex,
          locator.sectorKey,
          locator.galacticObjectIndex,
          bodyIndex,
        ),
        new BodySeed(
          `${planetOrdinal}`
            .padStart(
              32,
              '0',
            ),
        ),
        [
          anchorOrdinal,
        ],
        [
          anchorOrdinal,
        ],
        radiusAu,
        massEarth,
        new ProtoplanetCompositionMixture(
          0,
          1,
          0,
          0,
        ),
        0.8,
        0.2,
        0.4,
        0.1,
        0,
        0,
      );
    }
  },
);
