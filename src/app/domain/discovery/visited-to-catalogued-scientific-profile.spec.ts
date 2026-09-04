import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

import {
  VisitedToCataloguedScientificProfile,
} from './visited-to-catalogued-scientific-profile';

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
      0.7,
    maximumUncertainty01:
      0.3,
  });
}

describe(
  'VisitedToCataloguedScientificProfile point 26.A.5',
  () => {
    it(
      'should freeze one object-specific profile code plus its minimum scientific requirements',
      () => {
        const characterization =
          requirement(
            'CHARACTERIZATION',
          );

        const architecture =
          requirement(
            'ORBITAL_ARCHITECTURE',
          );

        const profile =
          new VisitedToCataloguedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              characterization,
              architecture,
            ],
          });

        expect(
          profile.profileCode,
        ).toBe(
          'TEST_OBJECT',
        );

        expect(
          profile.requirements,
        ).toEqual([
          characterization,
          architecture,
        ]);

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
      'should reject blank profile identifiers, empty requirements and duplicate scientific dimensions',
      () => {
        expect(
          () =>
            new VisitedToCataloguedScientificProfile({
              profileCode:
                ' ',
              requirements: [
                requirement(
                  'CHARACTERIZATION',
                ),
              ],
            }),
        ).toThrow(
          /profileCode/,
        );

        expect(
          () =>
            new VisitedToCataloguedScientificProfile({
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
            new VisitedToCataloguedScientificProfile({
              profileCode:
                'TEST_OBJECT',
              requirements: [
                requirement(
                  'CHARACTERIZATION',
                ),
                requirement(
                  'CHARACTERIZATION',
                ),
              ],
            }),
        ).toThrow(
          /Duplicate.*CHARACTERIZATION/,
        );
      },
    );
  },
);
