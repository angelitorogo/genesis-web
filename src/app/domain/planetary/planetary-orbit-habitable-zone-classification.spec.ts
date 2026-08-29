import {
  BodyLocator,
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

describe(
  'PlanetaryOrbitHabitableZoneClassification point 18.7',
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
        '0123456789ABCDEFFEDCBA9876543210',
      );

    it(
      'should preserve orbit identity and distinguish radiative from dynamically available relations',
      () => {
        const value =
          new PlanetaryOrbitHabitableZoneClassification(
            1,
            locator,
            seed,
            0.9,
            1.3,
            PlanetaryOrbitHabitableZoneRelation.CROSSES_INNER_EDGE,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
          );

        expect(
          value.intersectsRadiativeHabitableZone,
        ).toBe(true);

        expect(
          value.intersectsDynamicallyAvailableHabitableZone,
        ).toBe(true);

        expect(
          value.isWhollyWithinDynamicallyAvailableHabitableZone,
        ).toBe(true);
      },
    );

    it(
      'should represent absence of a dynamically available habitable interval without erasing radiative geometry',
      () => {
        const value =
          new PlanetaryOrbitHabitableZoneClassification(
            1,
            locator,
            seed,
            1.1,
            1.2,
            PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            null,
          );

        expect(
          value.intersectsRadiativeHabitableZone,
        ).toBe(true);

        expect(
          value.intersectsDynamicallyAvailableHabitableZone,
        ).toBe(false);
      },
    );

    it(
      'should reject invalid identity, radial extrema and relation codes',
      () => {
        expect(
          () =>
            new PlanetaryOrbitHabitableZoneClassification(
              2,
              locator,
              seed,
              1,
              1.2,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitHabitableZoneClassification(
              1,
              locator,
              seed,
              1.2,
              1.1,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
              PlanetaryOrbitHabitableZoneRelation.WHOLLY_WITHIN_ZONE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetaryOrbitHabitableZoneClassification(
              1,
              locator,
              seed,
              1,
              1.2,
              'UNKNOWN' as PlanetaryOrbitHabitableZoneRelation,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
