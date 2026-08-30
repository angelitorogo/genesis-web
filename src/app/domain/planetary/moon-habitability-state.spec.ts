import {
  MoonHabitabilityRegime,
} from './moon-habitability-regime';

import {
  MoonHabitabilityState,
} from './moon-habitability-state';

describe(
  'MoonHabitabilityState point 21.6',
  () => {
    it(
      'should preserve independent surface/subsurface candidate routes without claiming life',
      () => {
        const surface =
          0.55;
        const subsurface =
          0.45;

        const state =
          new MoonHabitabilityState(
            2,
            1,
            0.40,
            288,
            0.70,
            0.75,
            0.70,
            0.65,
            0.55,
            0.60,
            0.25,
            1,
            1,
            1,
            1,
            0.50,
            surface,
            subsurface,
            Math.max(
              surface,
              subsurface,
            ) +
              0.10 *
                Math.min(
                  surface,
                  subsurface,
                ),
            true,
            true,
            MoonHabitabilityRegime.SURFACE_AND_SUBSURFACE_CANDIDATE,
          );

        expect(
          state.isPotentiallyHabitable,
        ).toBe(true);
        expect(
          state.supportsPotentialSurfaceHabitability,
        ).toBe(true);
        expect(
          state.supportsPotentialSubsurfaceHabitability,
        ).toBe(true);
        expect(
          'lifeDetected' in state,
        ).toBe(false);
        expect(
          'biosignature' in state,
        ).toBe(false);
      },
    );

    it(
      'should reject an inconsistent regime or overall aggregation',
      () => {
        const args = [
          1,
          1,
          0.2,
          280,
          0.5,
          0.5,
          0.4,
          0.4,
          0.4,
          0.4,
          0.2,
          1,
          0.8,
          1,
          1,
          0.4,
          0.4,
          0.3,
          0.43,
          true,
          false,
          MoonHabitabilityRegime.SUBSURFACE_CANDIDATE,
        ] as const;

        expect(
          () =>
            new MoonHabitabilityState(
              ...args,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new MoonHabitabilityState(
              1,
              1,
              0.2,
              280,
              0.5,
              0.5,
              0.4,
              0.4,
              0.4,
              0.4,
              0.2,
              1,
              0.8,
              1,
              1,
              0.4,
              0.4,
              0.3,
              0.90,
              true,
              false,
              MoonHabitabilityRegime.SURFACE_CANDIDATE,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
