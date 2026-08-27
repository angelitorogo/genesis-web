import {
  StellarActivityProfile,
} from './stellar-activity-profile';

import {
  StellarActivityRegime,
} from './stellar-activity-regime';

describe(
  'StellarActivityProfile',
  () => {
    it(
      'should accept a coherent applicable point-15.4 flare profile',
      () => {
        const profile =
          new StellarActivityProfile(
            true,
            0.62,
            StellarActivityRegime.HIGH,
            0.35,
            2.5e24,
            1.2e26,
          );

        expect(
          profile.hasModeledFlares,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should represent compact-remnant ordinary-flare non-applicability explicitly with nulls',
      () => {
        const profile =
          new StellarActivityProfile(
            false,
            null,
            null,
            null,
            null,
            null,
          );

        expect(
          profile.hasModeledFlares,
        ).toBe(
          false,
        );

        expect(
          Object.keys(
            profile,
          ),
        ).toEqual([
          'ordinaryFlareModelApplicable',
          'magneticActivityIndex',
          'regime',
          'flareRatePerDay',
          'typicalFlareEnergyJoules',
          'maximumFlareEnergyJoules',
        ]);
      },
    );

    it(
      'should reject regime/index disagreement and invalid flare statistics',
      () => {
        expect(
          () =>
            new StellarActivityProfile(
              true,
              0.80,
              StellarActivityRegime.LOW,
              1,
              1e24,
              1e25,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarActivityProfile(
              true,
              0.30,
              StellarActivityRegime.MODERATE,
              -1,
              1e24,
              1e25,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarActivityProfile(
              true,
              0.30,
              StellarActivityRegime.MODERATE,
              1,
              1e25,
              1e24,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject leaking ordinary flare values into a non-applicable compact-remnant profile',
      () => {
        expect(
          () =>
            new StellarActivityProfile(
              false,
              0,
              null,
              null,
              null,
              null,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should not invent point-15.5 rotation/stability or individual flare-event history',
      () => {
        const profile =
          new StellarActivityProfile(
            true,
            0.12,
            StellarActivityRegime.LOW,
            0.01,
            1e23,
            1e25,
          );

        for (
          const deferredProperty
          of [
            'rotationPeriodDays',
            'equatorialVelocityKilometersPerSecond',
            'stabilityIndex',
            'magneticFieldTesla',
            'nextFlareTime',
            'flareEvents',
          ]
        ) {
          expect(
            deferredProperty in
              profile,
          ).toBe(
            false,
          );
        }
      },
    );
  },
);
