import {
  BodyLocator,
  SystemLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetaryOrbitHabitableZoneClassification,
} from './planetary-orbit-habitable-zone-classification';

import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

import {
  PlanetarySystemHabitableZoneClassification,
} from './planetary-system-habitable-zone-classification';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

describe(
  'PlanetarySystemHabitableZoneClassification point 18.7',
  () => {
    const systemLocator =
      new SystemLocator(
        1n,
        2n,
        3n,
      );

    function classification(
      ordinal:
        number,

      relation:
        PlanetaryOrbitHabitableZoneRelation | null,
    ): PlanetaryOrbitHabitableZoneClassification {

      return new PlanetaryOrbitHabitableZoneClassification(
        ordinal,
        new BodyLocator(
          systemLocator.galaxyIndex,
          systemLocator.sectorKey,
          systemLocator.galacticObjectIndex,
          BigInt(
            ordinal -
              1,
          ),
        ),
        new BodySeed(
          ordinal ===
            1
            ? '0123456789ABCDEFFEDCBA9876543210'
            : '1123456789ABCDEFFEDCBA9876543210',
        ),
        ordinal,
        ordinal +
          0.2,
        PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
        relation,
      );
    }

    it(
      'should expose ordered counts without turning orbit intersection into a habitability claim',
      () => {
        const value =
          new PlanetarySystemHabitableZoneClassification(
            systemLocator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            2,
            true,
            [
              classification(
                1,
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              ),
              classification(
                2,
                PlanetaryOrbitHabitableZoneRelation.WHOLLY_EXTERIOR_TO_ZONE,
              ),
            ],
          );

        expect(
          value.dynamicallyIntersectingOrbitCount,
        ).toBe(1);

        expect(
          value.whollyWithinDynamicallyAvailableOrbitCount,
        ).toBe(1);

        expect(
          value.hasOrbitIntersectingDynamicallyAvailableHabitableZone,
        ).toBe(true);
      },
    );

    it(
      'should require null dynamic relations when point 18.6 exposes no dynamically available interval',
      () => {
        expect(
          () =>
            new PlanetarySystemHabitableZoneClassification(
              systemLocator,
              PlanetarySystemOrbitTopology.CIRCUMBINARY,
              1,
              false,
              [
                classification(
                  1,
                  PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemHabitableZoneClassification(
              systemLocator,
              PlanetarySystemOrbitTopology.CIRCUMBINARY,
              1,
              false,
              [
                classification(
                  1,
                  null,
                ),
              ],
            ),
        ).not.toThrow();
      },
    );
  },
);
