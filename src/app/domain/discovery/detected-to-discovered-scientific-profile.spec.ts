import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

import {
  DetectedToDiscoveredScientificDimension,
  DetectedToDiscoveredScientificProfile,
} from './detected-to-discovered-scientific-profile';

function requirement(
  dimensionCode:
    string,
): ScientificCompletenessRequirement {

  return new ScientificCompletenessRequirement({
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
}

describe(
  'DetectedToDiscoveredScientificProfile point 26.A.3',
  () => {
    it(
      'should require exactly nature, identity and basic architecture without defining object-specific thresholds',
      () => {
        const nature =
          requirement(
            DetectedToDiscoveredScientificDimension
              .NATURE,
          );

        const identity =
          new ScientificCompletenessRequirement({
            dimensionCode:
              DetectedToDiscoveredScientificDimension
                .IDENTITY,
            weight:
              2,
            minimumEvidenceCount:
              2,
            minimumIndependentSources:
              1,
            minimumQuality01:
              0.75,
            maximumUncertainty01:
              0.25,
          });

        const basicArchitecture =
          requirement(
            DetectedToDiscoveredScientificDimension
              .BASIC_ARCHITECTURE,
          );

        const profile =
          new DetectedToDiscoveredScientificProfile({
            nature,
            identity,
            basicArchitecture,
          });

        expect(
          profile.requirements,
        ).toEqual([
          nature,
          identity,
          basicArchitecture,
        ]);

        expect(
          profile.requirements
            .map(
              item =>
                item.dimensionCode,
            ),
        ).toEqual([
          'NATURE',
          'IDENTITY',
          'BASIC_ARCHITECTURE',
        ]);

        expect(
          identity.minimumEvidenceCount,
        ).toBe(2);

        expect(
          Object.isFrozen(
            profile.requirements,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            profile,
          ),
        ).toBe(true);
      },
    );

    it(
      'should reject a profile that swaps or substitutes a mandatory discovery dimension',
      () => {
        expect(
          () =>
            new DetectedToDiscoveredScientificProfile({
              nature:
                requirement(
                  'IDENTITY',
                ),
              identity:
                requirement(
                  'IDENTITY',
                ),
              basicArchitecture:
                requirement(
                  'BASIC_ARCHITECTURE',
                ),
            }),
        ).toThrow(
          /nature.*NATURE/,
        );

        expect(
          () =>
            new DetectedToDiscoveredScientificProfile({
              nature:
                requirement(
                  'NATURE',
                ),
              identity:
                requirement(
                  'CLASSIFICATION',
                ),
              basicArchitecture:
                requirement(
                  'BASIC_ARCHITECTURE',
                ),
            }),
        ).toThrow(
          /identity.*IDENTITY/,
        );

        expect(
          () =>
            new DetectedToDiscoveredScientificProfile({
              nature:
                requirement(
                  'NATURE',
                ),
              identity:
                requirement(
                  'IDENTITY',
                ),
              basicArchitecture:
                requirement(
                  'ORBITAL_DETAILS',
                ),
            }),
        ).toThrow(
          /basicArchitecture.*BASIC_ARCHITECTURE/,
        );
      },
    );
  },
);
