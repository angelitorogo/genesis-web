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
  CataloguedToConfirmedScientificProfile,
  ScientificConfirmationRequirement,
} from '../../domain/discovery/catalogued-to-confirmed-scientific-profile';

import {
  CataloguedToConfirmedScientificProgressionEngine,
} from './catalogued-to-confirmed-scientific-progression-engine';

function profile():
  CataloguedToConfirmedScientificProfile {

  return new CataloguedToConfirmedScientificProfile({
    profileCode:
      'TEST_OBJECT',
    requirements: [
      new ScientificConfirmationRequirement({
        cataloguedBaseline:
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
        confirmationRequirement:
          new ScientificCompletenessRequirement({
            dimensionCode:
              'CHARACTERIZATION',
            weight:
              2,
            minimumEvidenceCount:
              2,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.8,
            maximumUncertainty01:
              0.1,
          }),
      }),
    ],
  });
}

function evidence(
  sourceKey:
    string,

  independenceKey:
    string,

  uncertainty01:
    number = 0.05,

  quality01:
    number = 0.9,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode:
      'CHARACTERIZATION',
    evidenceCode:
      `CONFIRM:${sourceKey}`,
    sourceKey,
    independenceKey,
    quality01,
    uncertainty01,
    observedAtEpochMs:
      1000,
  });
}

describe(
  'CataloguedToConfirmedScientificProgressionEngine point 26.A.6',
  () => {
    const baselineEvidence =
      evidence(
        'SPECTRUM:A',
        'SPECTROSCOPY:A',
      );

    it(
      'should keep CATALOGUED when only the former catalogue-level evidence exists',
      () => {
        const result =
          CataloguedToConfirmedScientificProgressionEngine
            .evaluate(
              DiscoveryState.CATALOGUED,
              profile(),
              [
                baselineEvidence,
              ],
            );

        expect(
          result.cataloguedBaselineCompleteness
            .isComplete,
        ).toBe(true);

        expect(
          result.confirmationCompleteness
            .isComplete,
        ).toBe(false);

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          result.didAdvance,
        ).toBe(false);
      },
    );

    it(
      'should reject nominally additional evidence when it is not scientifically independent enough',
      () => {
        const result =
          CataloguedToConfirmedScientificProgressionEngine
            .evaluate(
              DiscoveryState.CATALOGUED,
              profile(),
              [
                baselineEvidence,
                evidence(
                  'SPECTRUM:B',
                  'SPECTROSCOPY:A',
                ),
              ],
            );

        expect(
          result.confirmationCompleteness
            .requirements[0]
            .qualifyingEvidenceCount,
        ).toBe(2);

        expect(
          result.confirmationCompleteness
            .requirements[0]
            .independentSourceCount,
        ).toBe(1);

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should keep CATALOGUED when independent follow-up evidence has not reduced uncertainty enough',
      () => {
        const result =
          CataloguedToConfirmedScientificProgressionEngine
            .evaluate(
              DiscoveryState.CATALOGUED,
              profile(),
              [
                baselineEvidence,
                evidence(
                  'PERIOD:B',
                  'TEMPORAL:B',
                  0.2,
                ),
              ],
            );

        expect(
          result.confirmationCompleteness
            .requirements[0]
            .qualifyingEvidenceCount,
        ).toBe(1);

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );
      },
    );

    it(
      'should advance exactly CATALOGUED to CONFIRMED when stronger independent evidence reaches the reduced uncertainty threshold',
      () => {
        const result =
          CataloguedToConfirmedScientificProgressionEngine
            .evaluate(
              DiscoveryState.CATALOGUED,
              profile(),
              [
                baselineEvidence,
                evidence(
                  'PERIOD:B',
                  'TEMPORAL:B',
                  0.08,
                ),
              ],
            );

        expect(
          result.profileCode,
        ).toBe(
          'TEST_OBJECT',
        );

        expect(
          result.stateBefore,
        ).toBe(
          DiscoveryState.CATALOGUED,
        );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          result.confirmationCompleteness
            .isComplete,
        ).toBe(true);

        expect(
          result.didAdvance,
        ).toBe(true);
      },
    );

    it(
      'should never skip an earlier state directly to CONFIRMED even with a complete confirmation evidence set',
      () => {
        const completeEvidence = [
          baselineEvidence,
          evidence(
            'PERIOD:B',
            'TEMPORAL:B',
            0.08,
          ),
        ] as const;

        for (
          const state
          of [
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
          ]
        ) {
          const result =
            CataloguedToConfirmedScientificProgressionEngine
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
            result.isEligible,
          ).toBe(false);

          expect(
            result.didAdvance,
          ).toBe(false);
        }
      },
    );

    it(
      'should preserve CONFIRMED idempotently regardless of later evidence',
      () => {
        const result =
          CataloguedToConfirmedScientificProgressionEngine
            .evaluate(
              DiscoveryState.CONFIRMED,
              profile(),
              [
                baselineEvidence,
              ],
            );

        expect(
          result.stateAfter,
        ).toBe(
          DiscoveryState.CONFIRMED,
        );

        expect(
          result.isEligible,
        ).toBe(false);

        expect(
          result.didAdvance,
        ).toBe(false);
      },
    );
  },
);
