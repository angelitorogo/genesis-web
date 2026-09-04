import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ScientificCompletenessRequirement,
} from '../../domain/discovery/scientific-completeness';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  VisitedToCataloguedScientificProfile,
} from '../../domain/discovery/visited-to-catalogued-scientific-profile';

import {
  VisitedToCataloguedScientificProgressionEngine,
} from './visited-to-catalogued-scientific-progression-engine';

function profile():
  VisitedToCataloguedScientificProfile {

  return new VisitedToCataloguedScientificProfile({
    profileCode:
      'TEST_OBJECT',
    requirements: [
      new ScientificCompletenessRequirement({
        dimensionCode:
          'CHARACTERIZATION',
        weight:
          2,
        minimumEvidenceCount:
          1,
        minimumIndependentSources:
          1,
        minimumQuality01:
          0.7,
        maximumUncertainty01:
          0.3,
      }),
      new ScientificCompletenessRequirement({
        dimensionCode:
          'ORBITAL_ARCHITECTURE',
        weight:
          1,
        minimumEvidenceCount:
          1,
        minimumIndependentSources:
          1,
        minimumQuality01:
          0.75,
        maximumUncertainty01:
          0.25,
      }),
    ],
  });
}

function evidence(
  dimensionCode:
    string,

  sourceKey:
    string,

  quality01 =
    0.9,

  uncertainty01 =
    0.1,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode,
    evidenceCode:
      `EVIDENCE:${sourceKey}`,
    sourceKey,
    independenceKey:
      `INDEPENDENCE:${sourceKey}`,
    quality01,
    uncertainty01,
    observedAtEpochMs:
      1000,
  });
}

describe(
  'VisitedToCataloguedScientificProgressionEngine point 26.A.5',
  () => {
    const completeEvidence = [
      evidence(
        'CHARACTERIZATION',
        'SPECTRUM',
      ),
      evidence(
        'ORBITAL_ARCHITECTURE',
        'PERIOD',
      ),
    ] as const;

    it(
      'should keep VISITED while minimum scientific requirements remain incomplete',
      () => {
        const result =
          VisitedToCataloguedScientificProgressionEngine
            .evaluate(
              DiscoveryState.VISITED,
              profile(),
              [
                completeEvidence[0],
              ],
            );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          result.isEligible,
        ).toBe(true);

        expect(
          result.didAdvance,
        ).toBe(false);

        expect(
          result.completeness
            .isComplete,
        ).toBe(false);
      },
    );

    it(
      'should advance exactly VISITED to CATALOGUED when every object-specific requirement is satisfied',
      () => {
        const result =
          VisitedToCataloguedScientificProgressionEngine
            .evaluate(
              DiscoveryState.VISITED,
              profile(),
              completeEvidence,
            );

        expect(
          result.profileCode,
        ).toBe(
          'TEST_OBJECT',
        );

        expect(
          result.stateBefore,
        ).toBe(
          DiscoveryState.VISITED,
        );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          result.completeness
            .isComplete,
        ).toBe(true);

        expect(
          result.didAdvance,
        ).toBe(true);
      },
    );

    it(
      'should never skip DISCOVERED to CATALOGUED even when the complete evidence set already exists',
      () => {
        const result =
          VisitedToCataloguedScientificProgressionEngine
            .evaluate(
              DiscoveryState.DISCOVERED,
              profile(),
              completeEvidence,
            );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          result.isEligible,
        ).toBe(false);

        expect(
          result.didAdvance,
        ).toBe(false);
      },
    );

    it(
      'should not accept evidence below the frozen quality and uncertainty thresholds',
      () => {
        const result =
          VisitedToCataloguedScientificProgressionEngine
            .evaluate(
              DiscoveryState.VISITED,
              profile(),
              [
                evidence(
                  'CHARACTERIZATION',
                  'SPECTRUM',
                ),
                evidence(
                  'ORBITAL_ARCHITECTURE',
                  'PERIOD',
                  0.7,
                  0.35,
                ),
              ],
            );

        expect(
          result.completeness
            .satisfiedRequirementCount,
        ).toBe(1);

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.VISITED,
        );
      },
    );

    it(
      'should preserve CATALOGUED and CONFIRMED idempotently regardless of later evidence',
      () => {
        for (
          const state
          of [
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          const result =
            VisitedToCataloguedScientificProgressionEngine
              .evaluate(
                state,
                profile(),
                completeEvidence,
              );

          expect(
            result.stateAfter,
          ).toBe(
            state,
          );

          expect(
            result.didAdvance,
          ).toBe(false);
        }
      },
    );
  },
);
