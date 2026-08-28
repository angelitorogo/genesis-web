import {
  StellarYouthProfile,
} from './stellar-youth-profile';

import {
  StellarYouthStage,
} from './stellar-youth-stage';

describe(
  'StellarYouthProfile point 17.1',
  () => {
    it(
      'should model a stellar youth sequence without mutating canonical stellar properties',
      () => {
        const proto =
          new StellarYouthProfile(
            StellarYouthStage.PROTOSTAR,
            0.2,
            0.45,
            30,
            100,
            0.44,
            2.6,
            2.8,
            0.8,
          );

        const preMainSequence =
          new StellarYouthProfile(
            StellarYouthStage.PRE_MAIN_SEQUENCE,
            10,
            0.45,
            30,
            100,
            0.32,
            1.6,
            1.4,
            0.3,
          );

        const young =
          new StellarYouthProfile(
            StellarYouthStage.YOUNG_STAR,
            50,
            0.45,
            30,
            100,
            0.29,
            1.02,
            1.01,
            0,
          );

        expect(
          proto.isProtostar,
        ).toBe(
          true,
        );

        expect(
          preMainSequence.isPreMainSequence,
        ).toBe(
          true,
        );

        expect(
          young.isYoungMainSequenceStar,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should represent a young brown dwarf without fictitious stellar pre-main-sequence cutoffs',
      () => {
        const profile =
          new StellarYouthProfile(
            StellarYouthStage.YOUNG_BROWN_DWARF,
            25,
            null,
            null,
            100,
            0.25,
            1.25,
            1.30,
            0.20,
          );

        expect(
          profile.isYoungBrownDwarf,
        ).toBe(
          true,
        );

        expect(
          profile.protostellarUpperAgeMillionYears,
        ).toBeNull();

        expect(
          profile.preMainSequenceUpperAgeMillionYears,
        ).toBeNull();
      },
    );

    it(
      'should reject stage/age boundaries and normalized formation properties that are incoherent',
      () => {
        expect(
          () =>
            new StellarYouthProfile(
              StellarYouthStage.PROTOSTAR,
              1,
              0.45,
              30,
              100,
              0.5,
              2,
              2,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarYouthProfile(
              StellarYouthStage.PRE_MAIN_SEQUENCE,
              10,
              30,
              20,
              100,
              0.5,
              2,
              2,
              0.5,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarYouthProfile(
              StellarYouthStage.YOUNG_BROWN_DWARF,
              10,
              0.5,
              null,
              100,
              0.5,
              1.2,
              1.2,
              0.2,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarYouthProfile(
              StellarYouthStage.YOUNG_STAR,
              50,
              0.45,
              30,
              100,
              1.2,
              1.0,
              1.0,
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
