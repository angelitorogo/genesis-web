import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ScientificCompletenessRequirement,
} from '../../domain/discovery/scientific-completeness';

import {
  DetectedToDiscoveredScientificDimension,
  DetectedToDiscoveredScientificProfile,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  ScientificEvidence,
} from '../../domain/discovery/scientific-evidence';

import {
  DetectedToDiscoveredScientificProgressionEngine,
} from './detected-to-discovered-scientific-progression-engine';

function profile():
  DetectedToDiscoveredScientificProfile {

  const create =
    (
      dimensionCode:
        string,
    ) =>
      new ScientificCompletenessRequirement({
        dimensionCode,
        weight:
          1,
        minimumEvidenceCount:
          1,
        minimumIndependentSources:
          1,
        minimumQuality01:
          0.6,
        maximumUncertainty01:
          0.4,
      });

  return new DetectedToDiscoveredScientificProfile({
    nature:
      create(
        DetectedToDiscoveredScientificDimension
          .NATURE,
      ),
    identity:
      create(
        DetectedToDiscoveredScientificDimension
          .IDENTITY,
      ),
    basicArchitecture:
      create(
        DetectedToDiscoveredScientificDimension
          .BASIC_ARCHITECTURE,
      ),
  });
}

function evidence(
  dimensionCode:
    string,

  quality01 =
    0.9,

  uncertainty01 =
    0.1,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode,
    evidenceCode:
      `RESOLUTION:${dimensionCode}`,
    sourceKey:
      `OBSERVATION:${dimensionCode}`,
    independenceKey:
      `INSTRUMENT:${dimensionCode}`,
    quality01,
    uncertainty01,
    observedAtEpochMs:
      1000,
  });
}

describe(
  'DetectedToDiscoveredScientificProgressionEngine point 26.A.3',
  () => {
    const completeEvidence =
      [
        evidence(
          'NATURE',
        ),
        evidence(
          'IDENTITY',
        ),
        evidence(
          'BASIC_ARCHITECTURE',
        ),
      ] as const;

    it(
      'should advance DETECTED to DISCOVERED only when nature, identity and basic architecture are all scientifically sufficient',
      () => {
        const incomplete =
          DetectedToDiscoveredScientificProgressionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              profile(),
              completeEvidence.slice(
                0,
                2,
              ),
            );

        expect(
          incomplete.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        expect(
          incomplete.didAdvance,
        ).toBe(false);

        expect(
          incomplete.completeness
            .satisfiedRequirementCount,
        ).toBe(2);

        const complete =
          DetectedToDiscoveredScientificProgressionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              profile(),
              completeEvidence,
            );

        expect(
          complete.stateAfter,
        ).toBe(
          DiscoveryState.DISCOVERED,
        );

        expect(
          complete.didAdvance,
        ).toBe(true);

        expect(
          complete.completeness
            .isComplete,
        ).toBe(true);
      },
    );

    it(
      'should treat low-quality or high-uncertainty observations as insufficient instead of buying the transition',
      () => {
        const lowQuality =
          DetectedToDiscoveredScientificProgressionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              profile(),
              [
                evidence(
                  'NATURE',
                ),
                evidence(
                  'IDENTITY',
                ),
                evidence(
                  'BASIC_ARCHITECTURE',
                  0.59,
                  0.1,
                ),
              ],
            );

        expect(
          lowQuality.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );

        const highUncertainty =
          DetectedToDiscoveredScientificProgressionEngine
            .evaluate(
              DiscoveryState.DETECTED,
              profile(),
              [
                evidence(
                  'NATURE',
                ),
                evidence(
                  'IDENTITY',
                ),
                evidence(
                  'BASIC_ARCHITECTURE',
                  0.9,
                  0.41,
                ),
              ],
            );

        expect(
          highUncertainty.stateAfter,
        ).toBe(
          DiscoveryState.DETECTED,
        );
      },
    );

    it(
      'should never use the DETECTED discovery threshold to skip VISITED or advance an already discovered target',
      () => {
        for (
          const state
          of [
            DiscoveryState.UNKNOWN,
            DiscoveryState.DISCOVERED,
            DiscoveryState.VISITED,
            DiscoveryState.CATALOGUED,
            DiscoveryState.CONFIRMED,
          ]
        ) {
          const assessment =
            DetectedToDiscoveredScientificProgressionEngine
              .evaluate(
                state,
                profile(),
                completeEvidence,
              );

          expect(
            assessment.stateAfter,
          ).toBe(
            state,
          );

          expect(
            assessment.didAdvance,
          ).toBe(false);
        }
      },
    );
  },
);
