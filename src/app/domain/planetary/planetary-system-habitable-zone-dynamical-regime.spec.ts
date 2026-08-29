import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from './planetary-system-habitable-zone-dynamical-regime';

describe(
  'PlanetarySystemHabitableZoneDynamicalRegime point 18.6',
  () => {
    it(
      'should expose only the frozen V1 radiative/dynamical overlap regimes',
      () => {
        expect(
          Object.values(
            PlanetarySystemHabitableZoneDynamicalRegime,
          ),
        ).toEqual([
          'NO_DYNAMICAL_OVERLAP',
          'PARTIAL_DYNAMICAL_OVERLAP',
          'FULL_DYNAMICAL_OVERLAP',
        ]);
      },
    );
  },
);
