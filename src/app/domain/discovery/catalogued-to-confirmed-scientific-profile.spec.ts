import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

import {
  CataloguedToConfirmedScientificProfile,
  ScientificConfirmationRequirement,
} from './catalogued-to-confirmed-scientific-profile';

function requirement(
  dimensionCode:
    string,

  minimumEvidenceCount:
    number,

  minimumIndependentSources:
    number,

  minimumQuality01:
    number,

  maximumUncertainty01:
    number,
): ScientificCompletenessRequirement {

  return new ScientificCompletenessRequirement({
    dimensionCode,
    weight:
      1,
    minimumEvidenceCount,
    minimumIndependentSources,
    minimumQuality01,
    maximumUncertainty01,
  });
}

describe(
  'CataloguedToConfirmedScientificProfile point 26.A.6',
  () => {
    it(
      'should freeze stronger confirmation thresholds that require additional independent evidence and lower uncertainty',
      () => {
        const baseline =
          requirement(
            'CHARACTERIZATION',
            1,
            1,
            0.7,
            0.3,
          );

        const confirmation =
          requirement(
            'CHARACTERIZATION',
            2,
            2,
            0.8,
            0.12,
          );

        const paired =
          new ScientificConfirmationRequirement({
            cataloguedBaseline:
              baseline,
            confirmationRequirement:
              confirmation,
          });

        const profile =
          new CataloguedToConfirmedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              paired,
            ],
          });

        expect(
          profile.profileCode,
        ).toBe(
          'TEST_OBJECT',
        );

        expect(
          profile.cataloguedBaselineRequirements,
        ).toEqual([
          baseline,
        ]);

        expect(
          profile.confirmationRequirements,
        ).toEqual([
          confirmation,
        ]);

        expect(
          Object.isFrozen(
            paired,
          ),
        ).toBe(true);

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
      'should allow either more evidence or more independent sources as the provenance strengthening rule',
      () => {
        const additionalEvidence =
          new ScientificConfirmationRequirement({
            cataloguedBaseline:
              requirement(
                'A',
                1,
                1,
                0.7,
                0.3,
              ),
            confirmationRequirement:
              requirement(
                'A',
                2,
                1,
                0.7,
                0.1,
              ),
          });

        const additionalIndependence =
          new ScientificConfirmationRequirement({
            cataloguedBaseline:
              requirement(
                'B',
                2,
                1,
                0.7,
                0.3,
              ),
            confirmationRequirement:
              requirement(
                'B',
                2,
                2,
                0.7,
                0.1,
              ),
          });

        expect(
          additionalEvidence
            .confirmationRequirement
            .minimumEvidenceCount,
        ).toBe(2);

        expect(
          additionalIndependence
            .confirmationRequirement
            .minimumIndependentSources,
        ).toBe(2);
      },
    );

    it(
      'should reject a different dimension, weakened thresholds, unchanged provenance or uncertainty that was not reduced',
      () => {
        const baseline =
          requirement(
            'CHARACTERIZATION',
            1,
            1,
            0.7,
            0.3,
          );

        expect(
          () =>
            new ScientificConfirmationRequirement({
              cataloguedBaseline:
                baseline,
              confirmationRequirement:
                requirement(
                  'OTHER',
                  2,
                  2,
                  0.8,
                  0.1,
                ),
            }),
        ).toThrow(
          /same scientific dimension/,
        );

        expect(
          () =>
            new ScientificConfirmationRequirement({
              cataloguedBaseline:
                baseline,
              confirmationRequirement:
                requirement(
                  'CHARACTERIZATION',
                  2,
                  1,
                  0.6,
                  0.1,
                ),
            }),
        ).toThrow(
          /cannot weaken/,
        );

        expect(
          () =>
            new ScientificConfirmationRequirement({
              cataloguedBaseline:
                baseline,
              confirmationRequirement:
                requirement(
                  'CHARACTERIZATION',
                  1,
                  1,
                  0.8,
                  0.1,
                ),
            }),
        ).toThrow(
          /additional evidence or additional independent sources/,
        );

        expect(
          () =>
            new ScientificConfirmationRequirement({
              cataloguedBaseline:
                baseline,
              confirmationRequirement:
                requirement(
                  'CHARACTERIZATION',
                  2,
                  2,
                  0.8,
                  0.3,
                ),
            }),
        ).toThrow(
          /strictly lower uncertainty/,
        );
      },
    );

    it(
      'should reject blank profile identifiers, empty rules and duplicate confirmation dimensions',
      () => {
        const pair =
          new ScientificConfirmationRequirement({
            cataloguedBaseline:
              requirement(
                'CHARACTERIZATION',
                1,
                1,
                0.7,
                0.3,
              ),
            confirmationRequirement:
              requirement(
                'CHARACTERIZATION',
                2,
                2,
                0.8,
                0.1,
              ),
          });

        expect(
          () =>
            new CataloguedToConfirmedScientificProfile({
              profileCode:
                ' ',
              requirements: [
                pair,
              ],
            }),
        ).toThrow(
          /profileCode/,
        );

        expect(
          () =>
            new CataloguedToConfirmedScientificProfile({
              profileCode:
                'TEST_OBJECT',
              requirements:
                [],
            }),
        ).toThrow(
          /at least one/,
        );

        expect(
          () =>
            new CataloguedToConfirmedScientificProfile({
              profileCode:
                'TEST_OBJECT',
              requirements: [
                pair,
                pair,
              ],
            }),
        ).toThrow(
          /Duplicate.*CHARACTERIZATION/,
        );
      },
    );
  },
);
