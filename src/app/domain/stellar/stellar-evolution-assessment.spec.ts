import {
  StellarBrownDwarfClass,
} from './stellar-brown-dwarf-class';

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

describe(
  'StellarEvolutionAssessment',
  () => {
    const input =
      new StellarEvolutionInput(
        1.0,
        1.0,
        4.6,
      );

    it(
      'should preserve a valid main-sequence assessment and its theoretical phase durations',
      () => {
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
          assessment.input,
        ).toBe(
          input,
        );

        expect(
          assessment.evolutionState,
        ).toBe(
          StellarEvolutionState.MAIN_SEQUENCE,
        );

        expect(
          assessment.mainSequenceLifetimeBillionYears,
        ).toBe(
          10.0,
        );
      },
    );

    it(
      'should allow brown dwarfs without pretending they have a hydrogen-burning main-sequence lifetime',
      () => {
        const assessment =
          new StellarEvolutionAssessment(
            new StellarEvolutionInput(
              0.05,
              1.0,
              2.0,
            ),
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

        expect(
          assessment.mainSequenceLifetimeBillionYears,
        ).toBeNull();

        expect(
          assessment.postMainSequenceDurationBillionYears,
        ).toBeNull();
      },
    );

    it(
      'should reject contradictory main-sequence and brown-dwarf classifications',
      () => {
        expect(
          () =>
            new StellarEvolutionAssessment(
              input,
              StellarEvolutionState.MAIN_SEQUENCE,
              StellarMainSequenceClass.G,
              StellarBrownDwarfClass.L,
              null,
              null,
              null,
              null,
              10.0,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new StellarEvolutionAssessment(
              input,
              StellarEvolutionState.MAIN_SEQUENCE,
              null,
              null,
              null,
              null,
              null,
              null,
              10.0,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject missing or invalid theoretical phase durations on hydrogen-burning progenitors',
      () => {
        expect(
          () =>
            new StellarEvolutionAssessment(
              input,
              StellarEvolutionState.MAIN_SEQUENCE,
              StellarMainSequenceClass.G,
              null,
              null,
              null,
              null,
              null,
              null,
              1.0,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
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
              0,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
