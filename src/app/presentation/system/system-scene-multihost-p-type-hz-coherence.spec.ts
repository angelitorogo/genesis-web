import {
  CircumbinaryHabitabilityAssessment,
  CircumbinaryPlanetaryStabilityRegime,
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  systemSceneClipMultihostPTypeHabitableZone,
} from './system-scene-multihost-p-type-hz-coherence';

function assessment(
  radiativeInnerEdgeAu:
    number,

  radiativeOuterEdgeAu:
    number,

  stableInnerEdgeAu:
    number | null = radiativeInnerEdgeAu,

  stableOuterEdgeAu:
    number | null = radiativeOuterEdgeAu,
): CircumbinaryHabitabilityAssessment {

  const hasStable =
    stableInnerEdgeAu !== null &&
    stableOuterEdgeAu !== null;

  const fraction =
    hasStable
      ? (stableOuterEdgeAu - stableInnerEdgeAu) /
        (radiativeOuterEdgeAu - radiativeInnerEdgeAu)
      : 0;

  const full =
    hasStable &&
    stableInnerEdgeAu === radiativeInnerEdgeAu &&
    stableOuterEdgeAu === radiativeOuterEdgeAu;

  return new CircumbinaryHabitabilityAssessment(
    StellarSystemMultiplicity.BINARY,
    100_000,
    radiativeInnerEdgeAu,
    radiativeOuterEdgeAu,
    stableInnerEdgeAu,
    stableOuterEdgeAu,
    fraction,
    !hasStable
      ? CircumbinaryPlanetaryStabilityRegime.NO_STABLE_HABITABLE_ZONE
      : full
        ? CircumbinaryPlanetaryStabilityRegime.FULL_STABLE_HABITABLE_ZONE
        : CircumbinaryPlanetaryStabilityRegime.PARTIAL_STABLE_HABITABLE_ZONE,
    CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
  );
}

describe(
  '29.1E-f.3 multihost P-type HZ coherence',
  () => {
    it(
      'removes the false Jiovara dynamic P-type HZ while preserving its radiative reference upstream',
      () => {
        const source =
          assessment(
            531.5,
            937.3,
          );

        const clipped =
          systemSceneClipMultihostPTypeHabitableZone(
            source,
            10.2604,
            15.6942,
          );

        expect(source.radiativeHabitableInnerEdgeAu).toBe(531.5);
        expect(source.radiativeHabitableOuterEdgeAu).toBe(937.3);
        expect(clipped.dynamicallyHabitableInnerEdgeAu).toBeNull();
        expect(clipped.dynamicallyHabitableOuterEdgeAu).toBeNull();
        expect(clipped.dynamicalOverlapFraction01).toBe(0);
      },
    );

    it(
      'clips a partial P-type overlap to the actual generated window',
      () => {
        const clipped =
          systemSceneClipMultihostPTypeHabitableZone(
            assessment(
              10,
              20,
              12,
              18,
            ),
            15,
            16,
          );

        expect(clipped.dynamicallyHabitableInnerEdgeAu).toBe(15);
        expect(clipped.dynamicallyHabitableOuterEdgeAu).toBe(16);
        expect(clipped.dynamicalOverlapFraction01).toBeCloseTo(0.1, 12);
      },
    );

    it(
      'never upgrades a point-16.6 radiative-only assessment into a stable P-type HZ',
      () => {
        expect(
          systemSceneClipMultihostPTypeHabitableZone(
            assessment(
              1,
              2,
              null,
              null,
            ),
            0.5,
            3,
          ),
        ).toEqual({
          dynamicallyHabitableInnerEdgeAu:
            null,
          dynamicallyHabitableOuterEdgeAu:
            null,
          dynamicalOverlapFraction01:
            0,
        });
      },
    );

    it(
      'preserves a fully overlapping P-type HZ when the generated window contains it',
      () => {
        expect(
          systemSceneClipMultihostPTypeHabitableZone(
            assessment(
              1,
              2,
            ),
            0.8,
            3,
          ),
        ).toEqual({
          dynamicallyHabitableInnerEdgeAu:
            1,
          dynamicallyHabitableOuterEdgeAu:
            2,
          dynamicalOverlapFraction01:
            1,
        });
      },
    );
  },
);
