import {
  StellarRotationRegime,
} from './stellar-rotation-regime';

import {
  StellarRotationStabilityProfile,
} from './stellar-rotation-stability-profile';

import {
  StellarStabilityRegime,
} from './stellar-stability-regime';

describe(
  'StellarRotationStabilityProfile',
  () => {
    it(
      'should materialize a coherent applicable rotation/stability profile and derived cycles per day',
      () => {
        const profile =
          new StellarRotationStabilityProfile(
            true,
            25,
            StellarRotationRegime.SLOW,
            0.80,
            StellarStabilityRegime.HIGHLY_STABLE,
          );

        expect(
          profile.rotationCyclesPerDay,
        ).toBeCloseTo(
          0.04,
          12,
        );
      },
    );

    it(
      'should represent compact-remnant exclusion with an all-null ordinary rotation payload',
      () => {
        const profile =
          new StellarRotationStabilityProfile(
            false,
            null,
            null,
            null,
            null,
          );

        expect(
          profile.rotationCyclesPerDay,
        ).toBeNull();

        expect(
          Object.keys(
            profile,
          ),
        ).toEqual([
          'ordinaryRotationModelApplicable',
          'rotationPeriodDays',
          'rotationRegime',
          'stabilityIndex',
          'stabilityRegime',
        ]);
      },
    );

    it(
      'should reject partially populated non-applicable profiles and inconsistent regime/value pairs',
      () => {
        expect(
          () =>
            new StellarRotationStabilityProfile(
              false,
              1,
              null,
              null,
              null,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarRotationStabilityProfile(
              true,
              25,
              StellarRotationRegime.FAST,
              0.80,
              StellarStabilityRegime.HIGHLY_STABLE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarRotationStabilityProfile(
              true,
              25,
              StellarRotationRegime.SLOW,
              0.80,
              StellarStabilityRegime.VARIABLE,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject invalid periods and stability indices for applicable ordinary stars',
      () => {
        expect(
          () =>
            new StellarRotationStabilityProfile(
              true,
              0,
              StellarRotationRegime.VERY_FAST,
              0.80,
              StellarStabilityRegime.HIGHLY_STABLE,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarRotationStabilityProfile(
              true,
              25,
              StellarRotationRegime.SLOW,
              1.1,
              StellarStabilityRegime.HIGHLY_STABLE,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
