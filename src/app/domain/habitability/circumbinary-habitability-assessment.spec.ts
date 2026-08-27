import {
  StellarSystemMultiplicity,
} from '../stellar/stellar-system-multiplicity';

import {
  CircumbinaryHabitabilityAssessment,
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from './circumbinary-habitability-assessment';

describe(
  'CircumbinaryHabitabilityAssessment point 16.6',
  () => {
    it(
      'should expose a full persistent stable HZ for a main-sequence binary pair',
      () => {
        const assessment =
          new CircumbinaryHabitabilityAssessment(
            StellarSystemMultiplicity.BINARY,
            1.5,
            1,
            2,
            1,
            2,
            1,
            CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE,
            CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
          );

        expect(assessment.hasStableHabitableZone).toBe(true);
        expect(assessment.isPersistentHabitabilityCandidate).toBe(true);
        expect(assessment.stableHabitableZoneWidthAu).toBe(1);
      },
    );

    it(
      'should preserve a partial dynamically stable reference zone without overclaiming evolved-host habitability',
      () => {
        const assessment =
          new CircumbinaryHabitabilityAssessment(
            StellarSystemMultiplicity.TRIPLE,
            1.5,
            1,
            2,
            1.4,
            1.8,
            0.4,
            CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
            CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY,
          );

        expect(assessment.hasStableHabitableZone).toBe(true);
        expect(assessment.isPersistentHabitabilityCandidate).toBe(false);
        expect(assessment.stableHabitableZoneWidthAu).toBeCloseTo(0.4, 12);
      },
    );

    it(
      'should represent no stable HZ without inventing interval edges',
      () => {
        const assessment =
          new CircumbinaryHabitabilityAssessment(
            StellarSystemMultiplicity.TRIPLE,
            1.5,
            1,
            2,
            null,
            null,
            0,
            CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
            CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
          );

        expect(assessment.hasStableHabitableZone).toBe(false);
        expect(assessment.isPersistentHabitabilityCandidate).toBe(false);
        expect(assessment.stableHabitableZoneWidthAu).toBe(0);
      },
    );

    it(
      'should reject SINGLE hosts and inconsistent overlap contracts',
      () => {
        expect(
          () =>
            new CircumbinaryHabitabilityAssessment(
              StellarSystemMultiplicity.SINGLE,
              1,
              1,
              2,
              1,
              2,
              1,
              CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE,
              CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new CircumbinaryHabitabilityAssessment(
              StellarSystemMultiplicity.BINARY,
              1,
              1,
              2,
              1.2,
              1.8,
              1,
              CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
              CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            new CircumbinaryHabitabilityAssessment(
              StellarSystemMultiplicity.BINARY,
              1,
              1,
              2,
              null,
              null,
              0.2,
              CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
              CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
