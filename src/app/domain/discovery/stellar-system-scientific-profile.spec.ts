import {
  DetectedToDiscoveredScientificDimension,
} from './detected-to-discovered-scientific-profile';

import {
  evaluateScientificCompleteness,
} from './scientific-completeness';

import {
  ScientificEvidence,
} from './scientific-evidence';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1,
  StellarSystemScientificDimension,
} from './stellar-system-scientific-profile';

function evidence(
  dimensionCode:
    string,

  ordinal:
    number,

  independenceKey:
    string,

  quality01:
    number,

  uncertainty01:
    number,
): ScientificEvidence {

  return new ScientificEvidence({
    dimensionCode,
    evidenceCode:
      `EVIDENCE-${ordinal}`,
    sourceKey:
      `SOURCE-${ordinal}`,
    independenceKey,
    quality01,
    uncertainty01,
    observedAtEpochMs:
      1000 +
      ordinal,
  });
}

describe(
  'STELLAR_SYSTEM scientific profile point 26.A.7',
  () => {
    it(
      'should freeze the first real object profile and the three DETECTED to DISCOVERED requirements',
      () => {
        const profile =
          STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1;

        expect(
          profile.profileCode,
        ).toBe(
          STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
        );

        expect(
          profile.discoveryProfile
            .requirements
            .map(
              requirement => ({
                dimensionCode:
                  requirement.dimensionCode,
                weight:
                  requirement.weight,
                minimumEvidenceCount:
                  requirement.minimumEvidenceCount,
                minimumIndependentSources:
                  requirement.minimumIndependentSources,
                minimumQuality01:
                  requirement.minimumQuality01,
                maximumUncertainty01:
                  requirement.maximumUncertainty01,
              }),
            ),
        ).toEqual([
          {
            dimensionCode:
              DetectedToDiscoveredScientificDimension.NATURE,
            weight:
              1,
            minimumEvidenceCount:
              1,
            minimumIndependentSources:
              1,
            minimumQuality01:
              0.60,
            maximumUncertainty01:
              0.40,
          },
          {
            dimensionCode:
              DetectedToDiscoveredScientificDimension.IDENTITY,
            weight:
              1,
            minimumEvidenceCount:
              1,
            minimumIndependentSources:
              1,
            minimumQuality01:
              0.65,
            maximumUncertainty01:
              0.35,
          },
          {
            dimensionCode:
              DetectedToDiscoveredScientificDimension.BASIC_ARCHITECTURE,
            weight:
              2,
            minimumEvidenceCount:
              1,
            minimumIndependentSources:
              1,
            minimumQuality01:
              0.70,
            maximumUncertainty01:
              0.30,
          },
        ]);

        expect(
          Object.isFrozen(
            profile,
          ),
        ).toBe(true);
      },
    );

    it(
      'should require classification, physical properties and orbital architecture before CATALOGUED with a stable 2/5/3 weight split',
      () => {
        const requirements =
          STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
            .cataloguingProfile
            .requirements;

        expect(
          requirements.map(
            requirement => ({
              dimensionCode:
                requirement.dimensionCode,
              weight:
                requirement.weight,
              minimumEvidenceCount:
                requirement.minimumEvidenceCount,
              minimumIndependentSources:
                requirement.minimumIndependentSources,
              minimumQuality01:
                requirement.minimumQuality01,
              maximumUncertainty01:
                requirement.maximumUncertainty01,
            }),
          ),
        ).toEqual([
          {
            dimensionCode:
              StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
            weight:
              2,
            minimumEvidenceCount:
              1,
            minimumIndependentSources:
              1,
            minimumQuality01:
              0.75,
            maximumUncertainty01:
              0.25,
          },
          {
            dimensionCode:
              StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
            weight:
              5,
            minimumEvidenceCount:
              2,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.75,
            maximumUncertainty01:
              0.25,
          },
          {
            dimensionCode:
              StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
            weight:
              3,
            minimumEvidenceCount:
              2,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.75,
            maximumUncertainty01:
              0.25,
          },
        ]);

        const completeness =
          evaluateScientificCompleteness(
            requirements,
            [
              evidence(
                StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
                1,
                'SPECTROSCOPY',
                0.80,
                0.20,
              ),
              evidence(
                StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
                2,
                'SPECTROSCOPY',
                0.80,
                0.20,
              ),
              evidence(
                StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
                3,
                'PHOTOMETRY',
                0.82,
                0.18,
              ),
              evidence(
                StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
                4,
                'ASTROMETRY',
                0.81,
                0.19,
              ),
              evidence(
                StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
                5,
                'TEMPORAL',
                0.83,
                0.17,
              ),
            ],
          );

        expect(
          completeness.isComplete,
        ).toBe(true);

        expect(
          completeness.totalWeight,
        ).toBe(10);

        expect(
          completeness.satisfiedWeight,
        ).toBe(10);
      },
    );

    it(
      'should make CONFIRMED strictly stronger than the exact CATALOGUED baseline for every stellar-system dimension',
      () => {
        const profile =
          STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1;

        expect(
          profile.confirmationProfile
            .cataloguedBaselineRequirements,
        ).toEqual(
          profile.cataloguingProfile
            .requirements,
        );

        expect(
          profile.confirmationProfile
            .requirements
            .map(
              pair => ({
                dimensionCode:
                  pair.confirmationRequirement.dimensionCode,
                minimumEvidenceCount:
                  pair.confirmationRequirement.minimumEvidenceCount,
                minimumIndependentSources:
                  pair.confirmationRequirement.minimumIndependentSources,
                minimumQuality01:
                  pair.confirmationRequirement.minimumQuality01,
                maximumUncertainty01:
                  pair.confirmationRequirement.maximumUncertainty01,
              }),
            ),
        ).toEqual([
          {
            dimensionCode:
              StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
            minimumEvidenceCount:
              2,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.85,
            maximumUncertainty01:
              0.10,
          },
          {
            dimensionCode:
              StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
            minimumEvidenceCount:
              3,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.85,
            maximumUncertainty01:
              0.10,
          },
          {
            dimensionCode:
              StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
            minimumEvidenceCount:
              3,
            minimumIndependentSources:
              2,
            minimumQuality01:
              0.85,
            maximumUncertainty01:
              0.10,
          },
        ]);

        for (
          const pair
          of profile.confirmationProfile
            .requirements
        ) {
          expect(
            pair.confirmationRequirement
              .maximumUncertainty01,
          ).toBeLessThan(
            pair.cataloguedBaseline
              .maximumUncertainty01,
          );

          expect(
            pair.confirmationRequirement
              .minimumQuality01,
          ).toBeGreaterThanOrEqual(
            pair.cataloguedBaseline
              .minimumQuality01,
          );
        }
      },
    );

    it(
      'should not treat repeated same-method observations as enough independent evidence for CATALOGUED',
      () => {
        const requirements =
          STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1
            .cataloguingProfile
            .requirements;

        const completeness =
          evaluateScientificCompleteness(
            requirements,
            [
              evidence(
                StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
                1,
                'SPECTROSCOPY',
                0.9,
                0.1,
              ),
              evidence(
                StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
                2,
                'SPECTROSCOPY',
                0.9,
                0.1,
              ),
              evidence(
                StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
                3,
                'SPECTROSCOPY',
                0.9,
                0.1,
              ),
              evidence(
                StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
                4,
                'TEMPORAL',
                0.9,
                0.1,
              ),
              evidence(
                StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
                5,
                'TEMPORAL',
                0.9,
                0.1,
              ),
            ],
          );

        expect(
          completeness.isComplete,
        ).toBe(false);

        expect(
          completeness.requirements
            .find(
              result =>
                result.requirement.dimensionCode ===
                StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
            )
            ?.independentSourceCount,
        ).toBe(1);

        expect(
          completeness.requirements
            .find(
              result =>
                result.requirement.dimensionCode ===
                StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
            )
            ?.independentSourceCount,
        ).toBe(1);
      },
    );
  },
);
