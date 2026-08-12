import {
  StellarPopulationProfile,
  StellarPopulationRegime,
} from './stellar-population-profile';

describe(
  'StellarPopulationProfile',
  () => {

    it(
      'should accept a valid normalized stellar population profile',
      () => {
        const profile =
          new StellarPopulationProfile(
            8.0,
            0.4,
            0.2,
            0.5,
            0.3,
            0.8,
            0.7,
            0.2,
            0.5,
            StellarPopulationRegime.MIXED,
          );

        expect(
          profile.regime,
        ).toBe(
          StellarPopulationRegime.MIXED,
        );
      },
    );

    it(
      'should reject invalid characteristic stellar age',
      () => {
        expect(
          () =>
            new StellarPopulationProfile(
              0.0,
              0.4,
              0.2,
              0.5,
              0.3,
              0.8,
              0.7,
              0.2,
              0.5,
              StellarPopulationRegime.MIXED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject normalized values outside the unit interval',
      () => {
        expect(
          () =>
            new StellarPopulationProfile(
              8.0,
              1.01,
              0.2,
              0.5,
              0.3,
              0.8,
              0.7,
              0.2,
              0.5,
              StellarPopulationRegime.MIXED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject age cohort fractions that do not sum to one',
      () => {
        expect(
          () =>
            new StellarPopulationProfile(
              8.0,
              0.4,
              0.2,
              0.4,
              0.3,
              0.8,
              0.7,
              0.2,
              0.5,
              StellarPopulationRegime.MIXED,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
