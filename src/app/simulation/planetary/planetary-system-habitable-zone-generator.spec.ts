import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  CircumbinaryHabitabilityAssessment,
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from '../../domain/planetary/planetary-system-habitable-zone-evolution-regime';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
  PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
  PlanetarySystemHabitableZoneGenerator,
} from './planetary-system-habitable-zone-generator';

describe(
  'PlanetarySystemHabitableZoneGenerator point 18.6',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should reuse the frozen point-15.1 primary luminosity without reconstructing sector context',
      () => {
        const stellarSystem =
          singleSystem(
            new SystemLocator(
              0n,
              0n,
              0n,
            ),
          );

        const first =
          PlanetarySystemHabitableZoneGenerator
            .generate(
              generationKey,
              stellarSystem,
            );

        const second =
          PlanetarySystemHabitableZoneGenerator
            .generate(
              generationKey,
              stellarSystem,
            );

        expect(
          first,
        ).toEqual(
          second,
        );

        expect(
          first.orbitTopology,
        ).toBe(
          PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
        );

        expect(
          first.referenceLuminositySolar,
        ).toBe(1);

        expect(
          first.radiativeInnerEdgeAu,
        ).toBeCloseTo(
          Math.sqrt(
            first.referenceLuminositySolar /
            PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
          ),
          14,
        );

        expect(
          first.radiativeOuterEdgeAu,
        ).toBeCloseTo(
          Math.sqrt(
            first.referenceLuminositySolar /
            PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
          ),
          14,
        );

        expect(
          first.dynamicalRegime,
        ).toBe(
          PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
        );

        expect(
          first.dynamicalOverlapFraction01,
        ).toBe(1);
      },
    );

    it(
      'should keep non-main-sequence single hosts as reference-only without deleting their reference geometry',
      () => {
        const zone =
          PlanetarySystemHabitableZoneGenerator
            .generate(
              generationKey,
              singleSystem(
                new SystemLocator(
                  1n,
                  0n,
                  1n,
                ),
                StellarEvolutionState.WHITE_DWARF,
              ),
            );

        expect(
          zone.stellarEvolutionRegime,
        ).toBe(
          PlanetarySystemHabitableZoneEvolutionRegime.REFERENCE_ONLY,
        );

        expect(
          zone.hasDynamicallyAvailableHabitableZone,
        ).toBe(true);

        expect(
          zone.isPersistentReferenceCandidate,
        ).toBe(false);
      },
    );

    it(
      'should reuse the frozen point-16.6 circumbinary radiative and dynamically clipped HZ exactly',
      () => {
        const locator =
          new SystemLocator(
            2n,
            3n,
            4n,
          );

        const luminositySolar =
          1.5;

        const radiativeInner =
          Math.sqrt(
            luminositySolar /
            PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
          );

        const radiativeOuter =
          Math.sqrt(
            luminositySolar /
            PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
          );

        const stableInner =
          radiativeInner +
          0.1;

        const stableOuter =
          radiativeOuter -
          0.2;

        const overlap =
          (
            stableOuter -
            stableInner
          ) /
          (
            radiativeOuter -
            radiativeInner
          );

        const assessment =
          new CircumbinaryHabitabilityAssessment(
            StellarSystemMultiplicity.BINARY,
            luminositySolar,
            radiativeInner,
            radiativeOuter,
            stableInner,
            stableOuter,
            overlap,
            CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
            CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
          );

        const zone =
          PlanetarySystemHabitableZoneGenerator
            .generate(
              generationKey,
              {
                generationKey,
                locator,
                multiplicity:
                  StellarSystemMultiplicity.BINARY,
                circumbinaryHabitabilityAssessment:
                  assessment,
              } as unknown as StellarSystem,
            );

        expect(
          zone.referenceLuminositySolar,
        ).toBe(
          assessment.combinedReferenceLuminositySolar,
        );

        expect(
          zone.radiativeInnerEdgeAu,
        ).toBe(
          assessment.radiativeHabitableInnerEdgeAu,
        );

        expect(
          zone.dynamicallyHabitableInnerEdgeAu,
        ).toBe(
          assessment.stableHabitableInnerEdgeAu,
        );

        expect(
          zone.dynamicallyHabitableOuterEdgeAu,
        ).toBe(
          assessment.stableHabitableOuterEdgeAu,
        );

        expect(
          zone.dynamicalOverlapFraction01,
        ).toBe(
          assessment.stableHabitableZoneFraction,
        );

        expect(
          zone.dynamicalRegime,
        ).toBe(
          PlanetarySystemHabitableZoneDynamicalRegime.PARTIAL_DYNAMICAL_OVERLAP,
        );

        expect(
          zone.stellarEvolutionRegime,
        ).toBe(
          PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
        );
      },
    );

    it(
      'should preserve a radiative circumbinary HZ even when point 16.6 exposes no stable P-type overlap',
      () => {
        const locator =
          new SystemLocator(
            5n,
            6n,
            7n,
          );

        const luminositySolar =
          0.5;

        const radiativeInner =
          Math.sqrt(
            luminositySolar /
            PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
          );

        const radiativeOuter =
          Math.sqrt(
            luminositySolar /
            PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
          );

        const assessment =
          new CircumbinaryHabitabilityAssessment(
            StellarSystemMultiplicity.TRIPLE,
            luminositySolar,
            radiativeInner,
            radiativeOuter,
            null,
            null,
            0,
            CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE,
            CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY,
          );

        const zone =
          PlanetarySystemHabitableZoneGenerator
            .generate(
              generationKey,
              {
                generationKey,
                locator,
                multiplicity:
                  StellarSystemMultiplicity.TRIPLE,
                circumbinaryHabitabilityAssessment:
                  assessment,
              } as unknown as StellarSystem,
            );

        expect(
          zone.radiativeWidthAu,
        ).toBeGreaterThan(0);

        expect(
          zone.dynamicallyHabitableWidthAu,
        ).toBe(0);

        expect(
          zone.dynamicalRegime,
        ).toBe(
          PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP,
        );
      },
    );

    it(
      'should reject a single host that does not carry a valid frozen point-15.1 primary luminosity',
      () => {
        const locator =
          new SystemLocator(
            7n,
            8n,
            9n,
          );

        for (
          const referenceLuminositySolar
          of [
            null,
            0,
            -1,
            Number.NaN,
            Number.POSITIVE_INFINITY,
          ]
        ) {
          expect(
            () =>
              PlanetarySystemHabitableZoneGenerator
                .generate(
                  generationKey,
                  {
                    generationKey,
                    locator,
                    multiplicity:
                      StellarSystemMultiplicity.SINGLE,
                    primaryReferenceLuminositySolar:
                      referenceLuminositySolar,
                    primaryStar: {
                      evolutionState:
                        StellarEvolutionState.MAIN_SEQUENCE,
                    },
                  } as unknown as StellarSystem,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should reject a multiple host that does not carry its frozen point-16.6 assessment or uses another generation key',
      () => {
        const locator =
          new SystemLocator(
            8n,
            9n,
            10n,
          );

        expect(
          () =>
            PlanetarySystemHabitableZoneGenerator
              .generate(
                generationKey,
                {
                  generationKey,
                  locator,
                  multiplicity:
                    StellarSystemMultiplicity.BINARY,
                  circumbinaryHabitabilityAssessment:
                    null,
                } as unknown as StellarSystem,
              ),
        ).toThrow(
          RangeError,
        );

        const foreignKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '0000-0000-0000-0000-0000-0000-0000-0001',
            ),
            GeneratorVersion.V1,
          );

        expect(
          () =>
            PlanetarySystemHabitableZoneGenerator
              .generate(
                generationKey,
                singleSystem(
                  locator,
                  StellarEvolutionState.MAIN_SEQUENCE,
                  foreignKey,
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function singleSystem(
  locator:
    SystemLocator,

  evolutionState =
    StellarEvolutionState.MAIN_SEQUENCE,

  generationKey =
    new UniverseGenerationKey(
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      ),
      GeneratorVersion.V1,
    ),
): StellarSystem {

  return {
    generationKey,
    locator,
    multiplicity:
      StellarSystemMultiplicity.SINGLE,
    primaryReferenceLuminositySolar:
      1,
    primaryStar: {
      evolutionState,
    },
  } as unknown as StellarSystem;
}
