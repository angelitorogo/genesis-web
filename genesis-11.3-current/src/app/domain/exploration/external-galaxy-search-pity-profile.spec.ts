import {
  ExternalGalaxyDetectionProbabilityProfile,
  ExternalGalaxyDetectionProbabilityTier,
} from './external-galaxy-detection-probability-profile';

import {
  ExternalGalaxySearchPityProfile,
  ExternalGalaxySearchPityStage,
} from './external-galaxy-search-pity-profile';

describe(
  'ExternalGalaxySearchPityProfile',
  () => {

    function baseProfile(
      probability:
        number =
          0.02,
    ): ExternalGalaxyDetectionProbabilityProfile {

      return new ExternalGalaxyDetectionProbabilityProfile(
        0n,
        ExternalGalaxyDetectionProbabilityTier
          .BASELINE,
        probability,
      );
    }

    it(
      'should expose derived values for a valid assisted pity profile',
      () => {
        const profile =
          new ExternalGalaxySearchPityProfile(
            baseProfile(),
            3n,
            ExternalGalaxySearchPityStage
              .ASSIST_II,
            0.25,
            0.265,
          );

        expect(
          profile.globalDiscoveryPoints,
        ).toBe(
          0n,
        );

        expect(
          profile.baseProbabilityPerFutureSearch,
        ).toBe(
          0.02,
        );

        expect(
          profile.hasPityBoost,
        ).toBe(
          true,
        );

        expect(
          profile.isGuaranteedNextSearch,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reject invalid failure counts probabilities and unknown stages',
      () => {
        expect(
          () =>
            new ExternalGalaxySearchPityProfile(
              baseProfile(),
              -1n,
              ExternalGalaxySearchPityStage
                .ASSIST_I,
              0.10,
              0.118,
            ),
        ).toThrow(
          RangeError,
        );

        for (
          const recovery of
          [
            -0.01,
            1.01,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new ExternalGalaxySearchPityProfile(
                baseProfile(),
                1n,
                ExternalGalaxySearchPityStage
                  .ASSIST_I,
                recovery,
                0.118,
              ),
          ).toThrow(
            RangeError,
          );
        }

        expect(
          () =>
            new ExternalGalaxySearchPityProfile(
              baseProfile(),
              1n,
              'UNKNOWN' as
                ExternalGalaxySearchPityStage,
              0.10,
              0.118,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce NONE pity invariants',
      () => {
        const valid =
          new ExternalGalaxySearchPityProfile(
            baseProfile(),
            0n,
            ExternalGalaxySearchPityStage
              .NONE,
            0.0,
            0.02,
          );

        expect(
          valid.hasPityBoost,
        ).toBe(
          false,
        );

        expect(
          () =>
            new ExternalGalaxySearchPityProfile(
              baseProfile(),
              1n,
              ExternalGalaxySearchPityStage
                .NONE,
              0.0,
              0.02,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxySearchPityProfile(
              baseProfile(),
              0n,
              ExternalGalaxySearchPityStage
                .NONE,
              0.10,
              0.118,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should enforce HARD_PITY invariants and guaranteed next search',
      () => {
        const valid =
          new ExternalGalaxySearchPityProfile(
            baseProfile(),
            9n,
            ExternalGalaxySearchPityStage
              .HARD_PITY,
            1.0,
            1.0,
          );

        expect(
          valid.hasPityBoost,
        ).toBe(
          true,
        );

        expect(
          valid.isGuaranteedNextSearch,
        ).toBe(
          true,
        );

        expect(
          () =>
            new ExternalGalaxySearchPityProfile(
              baseProfile(),
              8n,
              ExternalGalaxySearchPityStage
                .HARD_PITY,
              1.0,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxySearchPityProfile(
              baseProfile(),
              9n,
              ExternalGalaxySearchPityStage
                .HARD_PITY,
              0.75,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
