import {
  PlanetaryOrbitHabitableZoneRelation,
} from './planetary-orbit-habitable-zone-relation';

describe(
  'PlanetaryOrbitHabitableZoneRelation point 18.7',
  () => {
    it(
      'should expose exactly the six frozen geometric relations',
      () => {
        expect(
          Object.values(
            PlanetaryOrbitHabitableZoneRelation,
          ),
        ).toEqual([
          'WHOLLY_INTERIOR_TO_ZONE',
          'CROSSES_INNER_EDGE',
          'WHOLLY_WITHIN_ZONE',
          'CROSSES_OUTER_EDGE',
          'SPANS_BOTH_EDGES',
          'WHOLLY_EXTERIOR_TO_ZONE',
        ]);
      },
    );
  },
);
