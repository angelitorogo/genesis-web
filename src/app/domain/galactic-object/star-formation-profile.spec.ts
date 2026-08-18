import {
  StarFormationActivity,
} from './star-formation-activity';

import {
  StarFormationProfile,
} from './star-formation-profile';

describe(
  'StarFormationProfile',
  () => {
    it(
      'should preserve the point-12.3 aggregate massive-star formation Ground Truth',
      () => {
        const profile =
          new StarFormationProfile(
            StarFormationActivity.HIGH,
            12_500,
            2.4,
            86,
            4.2e50,
          );

        expect(
          profile.activity,
        ).toBe(
          StarFormationActivity.HIGH,
        );

        expect(
          profile.starFormationRateSolarMassesPerMillionYears,
        ).toBe(
          12_500,
        );

        expect(
          profile.youngStellarAgeMillionYears,
        ).toBe(
          2.4,
        );

        expect(
          profile.ionizingStarCount,
        ).toBe(
          86,
        );

        expect(
          profile.ionizingPhotonRatePerSecond,
        ).toBe(
          4.2e50,
        );
      },
    );

    it(
      'should reject an unknown runtime activity level',
      () => {
        expect(
          () =>
            new StarFormationProfile(
              'UNKNOWN' as never,
              100,
              1,
              1,
              1e48,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it.each([
      [
        0,
        1,
        1,
        1e48,
      ],
      [
        Number.NaN,
        1,
        1,
        1e48,
      ],
      [
        100,
        0,
        1,
        1e48,
      ],
      [
        100,
        1,
        1,
        Number.POSITIVE_INFINITY,
      ],
    ])(
      'should reject non-positive or non-finite continuous measurements',
      (
        starFormationRateSolarMassesPerMillionYears,
        youngStellarAgeMillionYears,
        ionizingStarCount,
        ionizingPhotonRatePerSecond,
      ) => {
        expect(
          () =>
            new StarFormationProfile(
              StarFormationActivity.LOW,
              starFormationRateSolarMassesPerMillionYears,
              youngStellarAgeMillionYears,
              ionizingStarCount,
              ionizingPhotonRatePerSecond,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it.each([
      0,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER +
        1,
    ])(
      'should reject an invalid ionizing-star count',
      (
        ionizingStarCount,
      ) => {
        expect(
          () =>
            new StarFormationProfile(
              StarFormationActivity.MODERATE,
              1000,
              2,
              ionizingStarCount,
              1e49,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
