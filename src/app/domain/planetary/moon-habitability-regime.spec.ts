import {
  MoonHabitabilityRegime,
  moonHabitabilityRegimeV1,
} from './moon-habitability-regime';

describe(
  'MoonHabitabilityRegime point 21.6',
  () => {
    it(
      'should expose only candidate routes and never a life verdict',
      () => {
        expect(
          Object.values(
            MoonHabitabilityRegime,
          ),
        ).toEqual([
          'NONE',
          'SUBSURFACE_CANDIDATE',
          'SURFACE_CANDIDATE',
          'SURFACE_AND_SUBSURFACE_CANDIDATE',
        ]);
      },
    );

    it(
      'should map the independent surface/subsurface candidate flags exactly',
      () => {
        expect(
          moonHabitabilityRegimeV1(
            false,
            false,
          ),
        ).toBe(
          MoonHabitabilityRegime.NONE,
        );
        expect(
          moonHabitabilityRegimeV1(
            false,
            true,
          ),
        ).toBe(
          MoonHabitabilityRegime.SUBSURFACE_CANDIDATE,
        );
        expect(
          moonHabitabilityRegimeV1(
            true,
            false,
          ),
        ).toBe(
          MoonHabitabilityRegime.SURFACE_CANDIDATE,
        );
        expect(
          moonHabitabilityRegimeV1(
            true,
            true,
          ),
        ).toBe(
          MoonHabitabilityRegime.SURFACE_AND_SUBSURFACE_CANDIDATE,
        );
      },
    );
  },
);
