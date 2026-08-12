import {
  GalacticHabitabilityBand,
  GalacticHabitabilityModelStatus,
  GalacticHabitabilityProfile,
} from './galactic-habitability-profile';

describe(
  'GalacticHabitabilityProfile',
  () => {

    it(
      'should accept a valid speculative simplified profile',
      () => {
        const profile =
          new GalacticHabitabilityProfile(
            GalacticHabitabilityModelStatus
              .SPECULATIVE_SIMPLIFIED,
            0.8,
            0.7,
            0.6,
            0.3,
            0.2,
            0.7,
            0.4,
            GalacticHabitabilityBand
              .FAVORED,
          );

        expect(
          profile.modelStatus,
        ).toBe(
          GalacticHabitabilityModelStatus
            .SPECULATIVE_SIMPLIFIED,
        );

        expect(
          profile.band,
        ).toBe(
          GalacticHabitabilityBand
            .FAVORED,
        );
      },
    );

    it(
      'should reject any normalized component outside the unit interval',
      () => {
        const invalidFactories = [
          () =>
            new GalacticHabitabilityProfile(
              GalacticHabitabilityModelStatus
                .SPECULATIVE_SIMPLIFIED,
              -0.01,
              0.7,
              0.6,
              0.3,
              0.2,
              0.7,
              0.4,
              GalacticHabitabilityBand
                .FAVORED,
            ),

          () =>
            new GalacticHabitabilityProfile(
              GalacticHabitabilityModelStatus
                .SPECULATIVE_SIMPLIFIED,
              0.8,
              1.01,
              0.6,
              0.3,
              0.2,
              0.7,
              0.4,
              GalacticHabitabilityBand
                .FAVORED,
            ),

          () =>
            new GalacticHabitabilityProfile(
              GalacticHabitabilityModelStatus
                .SPECULATIVE_SIMPLIFIED,
              0.8,
              0.7,
              Number.NaN,
              0.3,
              0.2,
              0.7,
              0.4,
              GalacticHabitabilityBand
                .FAVORED,
            ),

          () =>
            new GalacticHabitabilityProfile(
              GalacticHabitabilityModelStatus
                .SPECULATIVE_SIMPLIFIED,
              0.8,
              0.7,
              0.6,
              0.3,
              0.2,
              0.7,
              1.01,
              GalacticHabitabilityBand
                .FAVORED,
            ),
        ];

        for (
          const invalidFactory of
          invalidFactories
        ) {
          expect(
            invalidFactory,
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject an unknown model status at runtime',
      () => {
        expect(
          () =>
            new GalacticHabitabilityProfile(
              'UNKNOWN' as
                GalacticHabitabilityModelStatus,
              0.8,
              0.7,
              0.6,
              0.3,
              0.2,
              0.7,
              0.4,
              GalacticHabitabilityBand
                .FAVORED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an unknown habitability band at runtime',
      () => {
        expect(
          () =>
            new GalacticHabitabilityProfile(
              GalacticHabitabilityModelStatus
                .SPECULATIVE_SIMPLIFIED,
              0.8,
              0.7,
              0.6,
              0.3,
              0.2,
              0.7,
              0.4,
              'UNKNOWN' as
                GalacticHabitabilityBand,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
