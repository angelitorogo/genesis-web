import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

describe(
  'PlanetarySystemHabitableZoneEvolutionRegime point 18.6',
  () => {
    it(
      'should separate main-sequence reference candidates from reference-only geometries',
      () => {
        expect(
          Object.values(
            PlanetarySystemHabitableZoneEvolutionRegime,
          ),
        ).toEqual([
          'MAIN_SEQUENCE_HOST',
          'MAIN_SEQUENCE_INNER_PAIR',
          'REFERENCE_ONLY',
        ]);
      },
    );
  },
);
