import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  CircumbinaryPlanetCompatibility,
  CircumbinaryPlanetCompatibilityRegime,
} from '../../domain/planetary/circumbinary-planet-compatibility';

import {
  type Star,
} from '../../domain/stellar/star';

import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';

import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  CIRCUMBINARY_V1_INNER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
  CIRCUMBINARY_V1_OUTER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
  CircumbinaryHabitabilityAssessmentGenerator,
} from './circumbinary-habitability-assessment-generator';

describe(
  'CircumbinaryHabitabilityAssessmentGenerator point 16.6',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function physical(
      luminositySolar:
        number,
    ): StellarPhysicalProperties {
      return {
        luminositySolar,
      } as StellarPhysicalProperties;
    }

    function star(
      state =
        StellarEvolutionState.MAIN_SEQUENCE,
    ): Star {
      return {
        evolutionState:
          state,
      } as Star;
    }

    function companion(
      luminositySolar:
        number,

      state =
        StellarEvolutionState.MAIN_SEQUENCE,
    ): StellarCompanion {
      return {
        componentLabel:
          StellarSystemComponentLabel.B,

        physicalProperties: {
          luminositySolar,
        },

        currentEvolutionState:
          state,
      } as unknown as StellarCompanion;
    }

    function binaryCompatibility(
      minimumStableSemiMajorAxisAu:
        number,
    ): CircumbinaryPlanetCompatibility {
      return new CircumbinaryPlanetCompatibility(
        StellarSystemMultiplicity.BINARY,
        CircumbinaryPlanetCompatibilityRegime.OPEN_OUTER,
        minimumStableSemiMajorAxisAu,
        null,
        1,
        null,
        0.3,
        null,
      );
    }

    function tripleCompatibility(
      minimumStableSemiMajorAxisAu:
        number,

      maximumStableSemiMajorAxisAu:
        number,

      regime =
        CircumbinaryPlanetCompatibilityRegime.TERTIARY_BOUNDED,
    ): CircumbinaryPlanetCompatibility {
      return new CircumbinaryPlanetCompatibility(
        StellarSystemMultiplicity.TRIPLE,
        regime,
        minimumStableSemiMajorAxisAu,
        maximumStableSemiMajorAxisAu,
        1,
        10,
        0.3,
        0.15,
      );
    }

    it(
      'should derive the A+B solar-equivalent reference HZ from combined luminosity',
      () => {
        const report =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            binaryCompatibility(0.2),
            physical(0.75),
            star(),
            companion(0.25),
          );

        expect(report.combinedReferenceLuminositySolar).toBe(1);
        expect(report.radiativeHabitableInnerEdgeAu).toBeCloseTo(
          Math.sqrt(
            1 /
            CIRCUMBINARY_V1_INNER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
          ),
          12,
        );
        expect(report.radiativeHabitableOuterEdgeAu).toBeCloseTo(
          Math.sqrt(
            1 /
            CIRCUMBINARY_V1_OUTER_HABITABLE_EFFECTIVE_FLUX_SOLAR,
          ),
          12,
        );
        expect(report.planetaryStabilityRegime).toBe(
          CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE,
        );
        expect(report.stableHabitableZoneFraction).toBe(1);
        expect(report.isPersistentHabitabilityCandidate).toBe(true);
      },
    );

    it(
      'should truncate the radiative HZ at the binary dynamical inner edge',
      () => {
        const baseline =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            binaryCompatibility(0.2),
            physical(0.75),
            star(),
            companion(0.25),
          );

        const report =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            binaryCompatibility(1.2),
            physical(0.75),
            star(),
            companion(0.25),
          );

        expect(report.planetaryStabilityRegime).toBe(
          CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
        );
        expect(report.stableHabitableInnerEdgeAu).toBe(1.2);
        expect(report.stableHabitableOuterEdgeAu).toBeCloseTo(
          baseline.radiativeHabitableOuterEdgeAu,
          12,
        );
        expect(report.stableHabitableZoneFraction).toBeGreaterThan(0);
        expect(report.stableHabitableZoneFraction).toBeLessThan(1);
      },
    );

    it(
      'should apply the C-imposed triple outer cutoff and detect no-overlap triples',
      () => {
        const partial =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            tripleCompatibility(0.8, 1.3),
            physical(0.75),
            star(),
            companion(0.25),
          );

        expect(partial.planetaryStabilityRegime).toBe(
          CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
        );
        expect(partial.stableHabitableOuterEdgeAu).toBe(1.3);

        const none =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            tripleCompatibility(0.8, 0.9),
            physical(0.75),
            star(),
            companion(0.25),
          );

        expect(none.planetaryStabilityRegime).toBe(
          CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
        );
        expect(none.stableHabitableInnerEdgeAu).toBeNull();
        expect(none.stableHabitableOuterEdgeAu).toBeNull();
      },
    );

    it(
      'should carry point-16.5 dynamical exclusion directly into no stable HZ',
      () => {
        const report =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            tripleCompatibility(
              2,
              1,
              CircumbinaryPlanetCompatibilityRegime.DYNAMICALLY_EXCLUDED,
            ),
            physical(0.75),
            star(),
            companion(0.25),
          );

        expect(report.hasStableHabitableZone).toBe(false);
        expect(report.stableHabitableZoneFraction).toBe(0);
      },
    );

    it(
      'should mark evolved or substellar A-B states as reference-only even when a stable radiative overlap exists',
      () => {
        const evolvedPrimary =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            binaryCompatibility(0.2),
            physical(1),
            star(
              StellarEvolutionState.GIANT,
            ),
            companion(0.1),
          );

        expect(evolvedPrimary.stellarEvolutionRegime).toBe(
          CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY,
        );
        expect(evolvedPrimary.hasStableHabitableZone).toBe(true);
        expect(evolvedPrimary.isPersistentHabitabilityCandidate).toBe(false);

        const brownDwarfB =
          CircumbinaryHabitabilityAssessmentGenerator.generate(
            generationKey,
            binaryCompatibility(0.2),
            physical(1),
            star(),
            companion(
              0.01,
              StellarEvolutionState.BROWN_DWARF,
            ),
          );

        expect(brownDwarfB.stellarEvolutionRegime).toBe(
          CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY,
        );
      },
    );

    it(
      'should reject unsupported generator versions and non-B component input',
      () => {
        const unsupportedKey = {
          generatorVersion: {
            code: 2,
          },
        } as unknown as UniverseGenerationKey;

        expect(
          () =>
            CircumbinaryHabitabilityAssessmentGenerator.generate(
              unsupportedKey,
              binaryCompatibility(0.2),
              physical(1),
              star(),
              companion(0.1),
            ),
        ).toThrow(RangeError);

        expect(
          () =>
            CircumbinaryHabitabilityAssessmentGenerator.generate(
              generationKey,
              binaryCompatibility(0.2),
              physical(1),
              star(),
              {
                ...companion(0.1),
                componentLabel:
                  StellarSystemComponentLabel.C,
              } as StellarCompanion,
            ),
        ).toThrow(RangeError);
      },
    );
  },
);
