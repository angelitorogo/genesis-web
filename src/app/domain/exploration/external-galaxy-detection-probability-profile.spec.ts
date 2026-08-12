import {
  ExternalGalaxyDetectionProbabilityProfile,
  ExternalGalaxyDetectionProbabilityTier,
} from './external-galaxy-detection-probability-profile';

describe(
  'ExternalGalaxyDetectionProbabilityProfile',
  () => {

    it(
      'should preserve valid global PD tier and future-search probability',
      () => {
        const profile =
          new ExternalGalaxyDetectionProbabilityProfile(
            2_500n,
            ExternalGalaxyDetectionProbabilityTier
              .ADVANCED,
            0.10,
          );

        expect(
          profile.globalDiscoveryPoints,
        ).toBe(
          2_500n,
        );

        expect(
          profile.tier,
        ).toBe(
          ExternalGalaxyDetectionProbabilityTier
            .ADVANCED,
        );

        expect(
          profile.probabilityPerFutureSearch,
        ).toBe(
          0.10,
        );
      },
    );

    it(
      'should reject global Discovery Points outside signed Long range',
      () => {
        expect(
          () =>
            new ExternalGalaxyDetectionProbabilityProfile(
              -1n,
              ExternalGalaxyDetectionProbabilityTier
                .BASELINE,
              0.02,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ExternalGalaxyDetectionProbabilityProfile(
              9_223_372_036_854_775_808n,
              ExternalGalaxyDetectionProbabilityTier
                .FRONTIER,
              0.30,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid future-search probabilities',
      () => {
        for (
          const probability of
          [
            -0.01,
            1.01,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              new ExternalGalaxyDetectionProbabilityProfile(
                0n,
                ExternalGalaxyDetectionProbabilityTier
                  .BASELINE,
                probability,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject an unknown probability tier at runtime',
      () => {
        expect(
          () =>
            new ExternalGalaxyDetectionProbabilityProfile(
              0n,
              'UNKNOWN' as
                ExternalGalaxyDetectionProbabilityTier,
              0.02,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
