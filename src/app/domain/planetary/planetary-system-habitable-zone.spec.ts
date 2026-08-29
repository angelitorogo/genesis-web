import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  PlanetarySystemHabitableZoneDynamicalRegime,
} from './planetary-system-habitable-zone-dynamical-regime';

import {
  PlanetarySystemHabitableZoneEvolutionRegime,
} from './planetary-system-habitable-zone-evolution-regime';

import {
  PlanetarySystemHabitableZone,
} from './planetary-system-habitable-zone';

import {
  PlanetarySystemOrbitTopology,
} from './planetary-system-orbit-topology';

const INNER_FLUX =
  1.107;

const OUTER_FLUX =
  0.356;

const INNER_EDGE =
  Math.sqrt(
    1 /
    INNER_FLUX,
  );

const OUTER_EDGE =
  Math.sqrt(
    1 /
    OUTER_FLUX,
  );

describe(
  'PlanetarySystemHabitableZone point 18.6',
  () => {
    const locator =
      new SystemLocator(
        2n,
        3n,
        4n,
      );

    it(
      'should expose a complete circumstellar reference zone without classifying any planet',
      () => {
        const zone =
          new PlanetarySystemHabitableZone(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
            1,
            INNER_FLUX,
            OUTER_FLUX,
            INNER_EDGE,
            OUTER_EDGE,
            INNER_EDGE,
            OUTER_EDGE,
            1,
            PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
          );

        expect(
          zone.radiativeWidthAu,
        ).toBeCloseTo(
          OUTER_EDGE -
            INNER_EDGE,
          14,
        );

        expect(
          zone.dynamicallyHabitableWidthAu,
        ).toBeCloseTo(
          zone.radiativeWidthAu,
          14,
        );

        expect(
          zone.hasDynamicallyAvailableHabitableZone,
        ).toBe(true);

        expect(
          zone.isPersistentReferenceCandidate,
        ).toBe(true);

        expect(
          'orbitClassifications' in zone,
        ).toBe(false);
      },
    );

    it(
      'should preserve a partial circumbinary overlap and a reference-only stellar state',
      () => {
        const dynamicInner =
          INNER_EDGE +
          0.1;

        const dynamicOuter =
          OUTER_EDGE -
          0.2;

        const overlap =
          (
            dynamicOuter -
            dynamicInner
          ) /
          (
            OUTER_EDGE -
            INNER_EDGE
          );

        const zone =
          new PlanetarySystemHabitableZone(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            1,
            INNER_FLUX,
            OUTER_FLUX,
            INNER_EDGE,
            OUTER_EDGE,
            dynamicInner,
            dynamicOuter,
            overlap,
            PlanetarySystemHabitableZoneDynamicalRegime.PARTIAL_DYNAMICAL_OVERLAP,
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
      'should allow a circumbinary radiative zone with no dynamically usable overlap',
      () => {
        const zone =
          new PlanetarySystemHabitableZone(
            locator,
            PlanetarySystemOrbitTopology.CIRCUMBINARY,
            1,
            INNER_FLUX,
            OUTER_FLUX,
            INNER_EDGE,
            OUTER_EDGE,
            null,
            null,
            0,
            PlanetarySystemHabitableZoneDynamicalRegime.NO_DYNAMICAL_OVERLAP,
            PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
          );

        expect(
          zone.dynamicallyHabitableWidthAu,
        ).toBe(0);

        expect(
          zone.hasDynamicallyAvailableHabitableZone,
        ).toBe(false);

        expect(
          zone.isPersistentReferenceCandidate,
        ).toBe(false);
      },
    );

    it(
      'should reject inconsistent flux geometry, overlap fractions and topology-specific evolution labels',
      () => {
        expect(
          () =>
            new PlanetarySystemHabitableZone(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              1,
              INNER_FLUX,
              OUTER_FLUX,
              INNER_EDGE +
                0.1,
              OUTER_EDGE,
              INNER_EDGE +
                0.1,
              OUTER_EDGE,
              1,
              PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
              PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_HOST,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemHabitableZone(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMBINARY,
              1,
              INNER_FLUX,
              OUTER_FLUX,
              INNER_EDGE,
              OUTER_EDGE,
              INNER_EDGE,
              OUTER_EDGE -
                0.2,
              0.9,
              PlanetarySystemHabitableZoneDynamicalRegime.PARTIAL_DYNAMICAL_OVERLAP,
              PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemHabitableZone(
              locator,
              PlanetarySystemOrbitTopology.CIRCUMSTELLAR,
              1,
              INNER_FLUX,
              OUTER_FLUX,
              INNER_EDGE,
              OUTER_EDGE,
              INNER_EDGE,
              OUTER_EDGE,
              1,
              PlanetarySystemHabitableZoneDynamicalRegime.FULL_DYNAMICAL_OVERLAP,
              PlanetarySystemHabitableZoneEvolutionRegime.MAIN_SEQUENCE_INNER_PAIR,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
