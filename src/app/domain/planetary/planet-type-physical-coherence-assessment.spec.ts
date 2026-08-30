import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  BodySeed,
} from '../seed/hierarchical-seeds';

import {
  PlanetType,
} from './planet-type';

import {
  PlanetTypePhysicalCoherenceAssessment,
} from './planet-type-physical-coherence-assessment';

import {
  PlanetTypePhysicalCoherenceIssue,
} from './planet-type-physical-coherence-issue';

describe(
  'PlanetTypePhysicalCoherenceAssessment point 19.7',
  () => {
    const locator =
      new BodyLocator(
        0n,
        0n,
        0n,
        0n,
      );

    const seed =
      new BodySeed(
        '11111111111111111111111111111111',
      );

    it(
      'should represent a fully coherent type/bulk/composition assessment',
      () => {
        const assessment =
          new PlanetTypePhysicalCoherenceAssessment(
            1,
            locator,
            seed,
            PlanetType.ROCKY,
            PlanetType.ROCKY,
            1,
            1,
            5.514,
            5.514,
            0,
            0,
            0.1,
            0.1,
            0.122,
            0.122,
            [],
          );

        expect(
          assessment.isCoherent,
        ).toBe(true);

        expect(
          assessment.issues,
        ).toEqual([]);

        expect(
          Object.isFrozen(
            assessment.issues,
          ),
        ).toBe(true);
      },
    );

    it(
      'should require every recorded issue to match the corresponding physical discrepancy',
      () => {
        const issues = [
          PlanetTypePhysicalCoherenceIssue.BULK_MASS_RADIUS_DENSITY_MISMATCH,
          PlanetTypePhysicalCoherenceIssue.ENVELOPE_MASS_FRACTION_MISMATCH,
          PlanetTypePhysicalCoherenceIssue.ICE_BEARING_COMPOSITION_MISMATCH,
          PlanetTypePhysicalCoherenceIssue.TYPE_RULE_MISMATCH,
        ];

        const assessment =
          new PlanetTypePhysicalCoherenceAssessment(
            1,
            locator,
            seed,
            PlanetType.ROCKY,
            PlanetType.SUPER_EARTH,
            2,
            1,
            8,
            11.028,
            0.1,
            0.2,
            0.1,
            0.4,
            0.4,
            0.2,
            issues,
          );

        expect(
          assessment.isCoherent,
        ).toBe(false);

        expect(
          assessment.issues,
        ).toEqual(
          issues,
        );

        expect(
          () =>
            new PlanetTypePhysicalCoherenceAssessment(
              1,
              locator,
              seed,
              PlanetType.ROCKY,
              PlanetType.ROCKY,
              1,
              1,
              5.514,
              5.514,
              0,
              0,
              0.1,
              0.1,
              0.122,
              0.122,
              [
                PlanetTypePhysicalCoherenceIssue.TYPE_RULE_MISMATCH,
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
