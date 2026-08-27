import {
  StellarEvolutionAssessment,
} from './stellar-evolution-assessment';

import {
  StellarEvolutionInput,
} from './stellar-evolution-input';

import {
  StellarEvolutionState,
} from './stellar-evolution-state';

import {
  StellarMainSequenceClass,
} from './stellar-main-sequence-class';

import {
  StellarBrownDwarfClass,
} from './stellar-brown-dwarf-class';

import {
  StellarWhiteDwarfComposition,
} from './stellar-white-dwarf-composition';

import {
  STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS,
  StellarLifetimeProfile,
} from './stellar-lifetime-profile';

describe(
  'StellarLifetimeProfile',
  () => {
    it(
      'should model age, terminal age and remaining stellar life coherently for a burning star',
      () => {
        const input =
          new StellarEvolutionInput(
            1.0,
            1.0,
            4.6,
          );

        const assessment =
          new StellarEvolutionAssessment(
            input,
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarMainSequenceClass.G,
            null,
            null,
            null,
            null,
            null,
            10.0,
            1.16,
          );

        const profile =
          new StellarLifetimeProfile(
            4.6,
            11.16,
            6.56,
            assessment,
          );

        expect(
          profile.ageBillionYears,
        ).toBe(
          4.6,
        );

        expect(
          profile.terminalAgeBillionYears,
        ).toBe(
          11.16,
        );

        expect(
          profile.remainingLifeBillionYears,
        ).toBeCloseTo(
          6.56,
          12,
        );
      },
    );

    it(
      'should represent a terminal remnant with zero remaining progenitor stellar life',
      () => {
        const input =
          new StellarEvolutionInput(
            1.0,
            1.0,
            12.0,
          );

        const assessment =
          new StellarEvolutionAssessment(
            input,
            StellarEvolutionState.WHITE_DWARF,
            null,
            null,
            null,
            StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE,
            null,
            null,
            10.0,
            1.16,
          );

        const profile =
          new StellarLifetimeProfile(
            12.0,
            11.16,
            0,
            assessment,
          );

        expect(
          profile.remainingLifeBillionYears,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should keep brown dwarfs without a fictitious finite terminal lifetime',
      () => {
        const input =
          new StellarEvolutionInput(
            0.05,
            1.0,
            2.0,
          );

        const assessment =
          new StellarEvolutionAssessment(
            input,
            StellarEvolutionState.BROWN_DWARF,
            null,
            StellarBrownDwarfClass.T,
            null,
            null,
            null,
            null,
            null,
            null,
          );

        const profile =
          new StellarLifetimeProfile(
            2.0,
            null,
            null,
            assessment,
          );

        expect(
          profile.terminalAgeBillionYears,
        ).toBeNull();

        expect(
          profile.remainingLifeBillionYears,
        ).toBeNull();
      },
    );

    it(
      'should reject impossible age/lifetime combinations and ages outside the V1 cosmic envelope',
      () => {
        const input =
          new StellarEvolutionInput(
            1.0,
            1.0,
            4.6,
          );

        const assessment =
          new StellarEvolutionAssessment(
            input,
            StellarEvolutionState.MAIN_SEQUENCE,
            StellarMainSequenceClass.G,
            null,
            null,
            null,
            null,
            null,
            10.0,
            1.0,
          );

        expect(
          () =>
            new StellarLifetimeProfile(
              STELLAR_LIFETIME_V1_MAX_AGE_BILLION_YEARS +
                0.001,
              11.0,
              6.4,
              assessment,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarLifetimeProfile(
              4.6,
              12.0,
              7.4,
              assessment,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarLifetimeProfile(
              4.6,
              11.0,
              4.0,
              assessment,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
