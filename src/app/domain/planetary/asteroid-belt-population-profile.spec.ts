import {
  AsteroidBeltPopulationProfile,
} from './asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

describe(
  'AsteroidBeltPopulationProfile point 22.2',
  () => {
    it(
      'should preserve one complete statistical belt profile without materializing asteroids',
      () => {
        const profile =
          new AsteroidBeltPopulationProfile(
            AsteroidBeltRegion.INNER,
            5,
            true,
            1.8,
            3.2,
            2.4,
            1.4,
            0.08,
            0.61,
          );

        expect(
          profile.region,
        ).toBe(
          AsteroidBeltRegion.INNER,
        );

        expect(
          profile.exists,
        ).toBe(true);

        expect(
          profile.retainedMassEarth,
        ).toBe(0.08);

        expect(
          'asteroids' in profile,
        ).toBe(false);

        expect(
          'asteroidSeeds' in profile,
        ).toBe(false);
      },
    );

    it(
      'should represent an absent belt only with null geometry and zero population',
      () => {
        const profile =
          new AsteroidBeltPopulationProfile(
            AsteroidBeltRegion.OUTER,
            2,
            false,
            null,
            null,
            null,
            null,
            0,
            0,
          );

        expect(
          profile.exists,
        ).toBe(false);
      },
    );

    it(
      'should reject inconsistent radial geometry, population or residual-mass accounting',
      () => {
        expect(
          () =>
            new AsteroidBeltPopulationProfile(
              AsteroidBeltRegion.INNER,
              1,
              true,
              3,
              2,
              2.5,
              1,
              0.1,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidBeltPopulationProfile(
              AsteroidBeltRegion.OUTER,
              1,
              false,
              null,
              null,
              null,
              null,
              0.1,
              0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new AsteroidBeltPopulationProfile(
              AsteroidBeltRegion.OUTER,
              0.05,
              true,
              4,
              5,
              4.5,
              1,
              0.1,
              0.4,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
