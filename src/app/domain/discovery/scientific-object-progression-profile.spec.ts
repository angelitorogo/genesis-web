import {
  CataloguedToConfirmedScientificProfile,
  ScientificConfirmationRequirement,
} from './catalogued-to-confirmed-scientific-profile';

import {
  DetectedToDiscoveredScientificDimension,
  DetectedToDiscoveredScientificProfile,
} from './detected-to-discovered-scientific-profile';

import {
  ScientificCompletenessRequirement,
} from './scientific-completeness';

import {
  ScientificObjectProgressionProfile,
} from './scientific-object-progression-profile';

import {
  VisitedToCataloguedScientificProfile,
} from './visited-to-catalogued-scientific-profile';

function requirement(
  dimensionCode:
    string,

  overrides: {
    readonly weight?:
      number;
    readonly minimumEvidenceCount?:
      number;
    readonly minimumIndependentSources?:
      number;
    readonly minimumQuality01?:
      number;
    readonly maximumUncertainty01?:
      number;
  } = {},
): ScientificCompletenessRequirement {

  return new ScientificCompletenessRequirement({
    dimensionCode,
    weight:
      overrides.weight ??
      1,
    minimumEvidenceCount:
      overrides.minimumEvidenceCount ??
      1,
    minimumIndependentSources:
      overrides.minimumIndependentSources ??
      1,
    minimumQuality01:
      overrides.minimumQuality01 ??
      0.7,
    maximumUncertainty01:
      overrides.maximumUncertainty01 ??
      0.3,
  });
}

function discoveryProfile():
  DetectedToDiscoveredScientificProfile {

  return new DetectedToDiscoveredScientificProfile({
    nature:
      requirement(
        DetectedToDiscoveredScientificDimension
          .NATURE,
      ),
    identity:
      requirement(
        DetectedToDiscoveredScientificDimension
          .IDENTITY,
      ),
    basicArchitecture:
      requirement(
        DetectedToDiscoveredScientificDimension
          .BASIC_ARCHITECTURE,
      ),
  });
}

describe(
  'ScientificObjectProgressionProfile point 26.A.7',
  () => {
    it(
      'should group one coherent object profile while keeping all progression engines external and reusable',
      () => {
        const catalogued =
          requirement(
            'CHARACTERIZATION',
          );

        const cataloguingProfile =
          new VisitedToCataloguedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              catalogued,
            ],
          });

        const confirmationProfile =
          new CataloguedToConfirmedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              new ScientificConfirmationRequirement({
                cataloguedBaseline:
                  catalogued,
                confirmationRequirement:
                  requirement(
                    'CHARACTERIZATION',
                    {
                      minimumEvidenceCount:
                        2,
                      minimumIndependentSources:
                        2,
                      minimumQuality01:
                        0.8,
                      maximumUncertainty01:
                        0.1,
                    },
                  ),
              }),
            ],
          });

        const profile =
          new ScientificObjectProgressionProfile({
            profileCode:
              'TEST_OBJECT',
            discoveryProfile:
              discoveryProfile(),
            cataloguingProfile,
            confirmationProfile,
          });

        expect(
          profile.profileCode,
        ).toBe(
          'TEST_OBJECT',
        );

        expect(
          profile.cataloguingProfile,
        ).toBe(
          cataloguingProfile,
        );

        expect(
          profile.confirmationProfile,
        ).toBe(
          confirmationProfile,
        );

        expect(
          Object.isFrozen(
            profile,
          ),
        ).toBe(true);
      },
    );

    it(
      'should reject cataloguing or confirmation profiles for another object code',
      () => {
        const catalogued =
          requirement(
            'CHARACTERIZATION',
          );

        const goodCataloguing =
          new VisitedToCataloguedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              catalogued,
            ],
          });

        const goodConfirmation =
          new CataloguedToConfirmedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              new ScientificConfirmationRequirement({
                cataloguedBaseline:
                  catalogued,
                confirmationRequirement:
                  requirement(
                    'CHARACTERIZATION',
                    {
                      minimumEvidenceCount:
                        2,
                      maximumUncertainty01:
                        0.1,
                    },
                  ),
              }),
            ],
          });

        expect(
          () =>
            new ScientificObjectProgressionProfile({
              profileCode:
                'OTHER_OBJECT',
              discoveryProfile:
                discoveryProfile(),
              cataloguingProfile:
                goodCataloguing,
              confirmationProfile:
                goodConfirmation,
            }),
        ).toThrow(
          /cataloguing profileCode/,
        );

        const otherConfirmation =
          new CataloguedToConfirmedScientificProfile({
            profileCode:
              'OTHER_OBJECT',
            requirements: [
              new ScientificConfirmationRequirement({
                cataloguedBaseline:
                  catalogued,
                confirmationRequirement:
                  requirement(
                    'CHARACTERIZATION',
                    {
                      minimumEvidenceCount:
                        2,
                      maximumUncertainty01:
                        0.1,
                    },
                  ),
              }),
            ],
          });

        expect(
          () =>
            new ScientificObjectProgressionProfile({
              profileCode:
                'TEST_OBJECT',
              discoveryProfile:
                discoveryProfile(),
              cataloguingProfile:
                goodCataloguing,
              confirmationProfile:
                otherConfirmation,
            }),
        ).toThrow(
          /confirmation profileCode/,
        );
      },
    );

    it(
      'should reject confirmation baseline drift from the exact cataloguing thresholds',
      () => {
        const catalogued =
          requirement(
            'CHARACTERIZATION',
            {
              minimumQuality01:
                0.7,
            },
          );

        const driftedBaseline =
          requirement(
            'CHARACTERIZATION',
            {
              minimumQuality01:
                0.75,
            },
          );

        const cataloguingProfile =
          new VisitedToCataloguedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              catalogued,
            ],
          });

        const confirmationProfile =
          new CataloguedToConfirmedScientificProfile({
            profileCode:
              'TEST_OBJECT',
            requirements: [
              new ScientificConfirmationRequirement({
                cataloguedBaseline:
                  driftedBaseline,
                confirmationRequirement:
                  requirement(
                    'CHARACTERIZATION',
                    {
                      minimumEvidenceCount:
                        2,
                      minimumQuality01:
                        0.8,
                      maximumUncertainty01:
                        0.1,
                    },
                  ),
              }),
            ],
          });

        expect(
          () =>
            new ScientificObjectProgressionProfile({
              profileCode:
                'TEST_OBJECT',
              discoveryProfile:
                discoveryProfile(),
              cataloguingProfile,
              confirmationProfile,
            }),
        ).toThrow(
          /exactly match cataloguing dimension CHARACTERIZATION/,
        );
      },
    );
  },
);
