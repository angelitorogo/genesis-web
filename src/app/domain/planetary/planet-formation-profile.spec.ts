import {
  PlanetFormationProfile,
  PlanetFormationRegime,
} from './planet-formation-profile';

describe(
  'PlanetFormationProfile',
  () => {

    it(
      'should accept a valid normalized planetary formation profile',
      () => {
        const profile =
          new PlanetFormationProfile(
            1.0,
            0.8,
            0.85,
            0.9,
            0.7,
            0.6,
            PlanetFormationRegime.MIXED,
          );

        expect(
          profile.regime,
        ).toBe(
          PlanetFormationRegime.MIXED,
        );
      },
    );

    it(
      'should reject invalid metallicity',
      () => {
        expect(
          () =>
            new PlanetFormationProfile(
              -0.01,
              0.5,
              0.5,
              0.5,
              0.5,
              0.5,
              PlanetFormationRegime.MIXED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject propensity values outside the normalized range',
      () => {
        expect(
          () =>
            new PlanetFormationProfile(
              1.0,
              1.01,
              0.5,
              0.5,
              0.5,
              0.5,
              PlanetFormationRegime.MIXED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject an unknown regime at runtime',
      () => {
        expect(
          () =>
            new PlanetFormationProfile(
              1.0,
              0.5,
              0.5,
              0.5,
              0.5,
              0.5,
              'UNKNOWN' as
                PlanetFormationRegime,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
