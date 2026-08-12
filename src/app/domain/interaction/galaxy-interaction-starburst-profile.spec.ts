import {
  GalaxyInteractionStage,
  GalaxyInteractionStarburstProfile,
  GalaxyStarburstState,
} from './galaxy-interaction-starburst-profile';

describe(
  'GalaxyInteractionStarburstProfile',
  () => {

    it(
      'should expose derived flags for a valid baseline profile',
      () => {
        const profile =
          new GalaxyInteractionStarburstProfile(
            0n,
            GalaxyInteractionStage.NONE,
            null,
            0.0,
            GalaxyStarburstState.NONE,
            1.0,
          );

        expect(
          profile.hasInteraction,
        ).toBe(
          false,
        );

        expect(
          profile.hasCompanion,
        ).toBe(
          false,
        );

        expect(
          profile.isStarFormationEnhanced,
        ).toBe(
          false,
        );

        expect(
          profile.isStarburst,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reject invalid galaxy and companion indices',
      () => {
        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              -1n,
              GalaxyInteractionStage.NONE,
              null,
              0.0,
              GalaxyStarburstState.NONE,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              0n,
              GalaxyInteractionStage.CLOSE_PAIR,
              -1n,
              0.2,
              GalaxyStarburstState.NONE,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              7n,
              GalaxyInteractionStage.CLOSE_PAIR,
              7n,
              0.2,
              GalaxyStarburstState.NONE,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid strength multiplier and stage invariants',
      () => {
        for (
          const strength of
          [
            -0.01,
            1.01,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new GalaxyInteractionStarburstProfile(
                0n,
                GalaxyInteractionStage.NONE,
                null,
                strength,
                GalaxyStarburstState.NONE,
                1.0,
              ),
          ).toThrow(
            RangeError,
          );
        }

        for (
          const multiplier of
          [
            0.0,
            -1.0,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new GalaxyInteractionStarburstProfile(
                0n,
                GalaxyInteractionStage.NONE,
                null,
                0.0,
                GalaxyStarburstState.NONE,
                multiplier,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              0n,
              GalaxyInteractionStage.NONE,
              1n,
              0.0,
              GalaxyStarburstState.NONE,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              0n,
              GalaxyInteractionStage.TIDAL_INTERACTION,
              null,
              0.5,
              GalaxyStarburstState.NONE,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              0n,
              GalaxyInteractionStage.MERGER,
              1n,
              0.0,
              GalaxyStarburstState.NONE,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should keep interaction and starburst conceptually independent while enforcing enhanced multipliers',
      () => {
        const internalStarburst =
          new GalaxyInteractionStarburstProfile(
            0n,
            GalaxyInteractionStage.NONE,
            null,
            0.0,
            GalaxyStarburstState.STARBURST,
            3.0,
          );

        expect(
          internalStarburst.hasInteraction,
        ).toBe(
          false,
        );

        expect(
          internalStarburst.isStarburst,
        ).toBe(
          true,
        );

        const tidalWithoutStarburst =
          new GalaxyInteractionStarburstProfile(
            0n,
            GalaxyInteractionStage.TIDAL_INTERACTION,
            1n,
            0.6,
            GalaxyStarburstState.NONE,
            1.0,
          );

        expect(
          tidalWithoutStarburst.hasInteraction,
        ).toBe(
          true,
        );

        expect(
          tidalWithoutStarburst.isStarburst,
        ).toBe(
          false,
        );

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              0n,
              GalaxyInteractionStage.NONE,
              null,
              0.0,
              GalaxyStarburstState.ELEVATED,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new GalaxyInteractionStarburstProfile(
              0n,
              GalaxyInteractionStage.NONE,
              null,
              0.0,
              GalaxyStarburstState.STARBURST,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
