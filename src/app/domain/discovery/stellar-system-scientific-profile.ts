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

/**
 * Stable object-profile identifier for the first real point-26.A scientific
 * progression profile.
 */
export const STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE =
  'STELLAR_SYSTEM';

/**
 * Scientific dimensions that must be characterized quantitatively before a
 * visited stellar system can become CATALOGUED.
 *
 * They intentionally describe observed knowledge, not Ground Truth fields:
 * - classification covers spectral/evolutionary characterization;
 * - physical properties covers quantitative stellar parameters;
 * - orbital architecture covers quantitative stellar hierarchy/orbits.
 */
export const StellarSystemScientificDimension =
  Object.freeze({
    STELLAR_CLASSIFICATION:
      'STELLAR_CLASSIFICATION',

    STELLAR_PHYSICAL_PROPERTIES:
      'STELLAR_PHYSICAL_PROPERTIES',

    ORBITAL_ARCHITECTURE:
      'ORBITAL_ARCHITECTURE',
  } as const);

export type StellarSystemScientificDimensionCode =
  typeof StellarSystemScientificDimension[
    keyof typeof StellarSystemScientificDimension
  ];

const DISCOVERY_NATURE =
  requirement(
    DetectedToDiscoveredScientificDimension
      .NATURE,
    1,
    1,
    0.60,
    0.40,
    1,
  );

const DISCOVERY_IDENTITY =
  requirement(
    DetectedToDiscoveredScientificDimension
      .IDENTITY,
    1,
    1,
    0.65,
    0.35,
    1,
  );

const DISCOVERY_BASIC_ARCHITECTURE =
  requirement(
    DetectedToDiscoveredScientificDimension
      .BASIC_ARCHITECTURE,
    1,
    1,
    0.70,
    0.30,
    2,
  );

const CATALOGUED_CLASSIFICATION =
  requirement(
    StellarSystemScientificDimension
      .STELLAR_CLASSIFICATION,
    1,
    1,
    0.75,
    0.25,
    2,
  );

const CATALOGUED_PHYSICAL_PROPERTIES =
  requirement(
    StellarSystemScientificDimension
      .STELLAR_PHYSICAL_PROPERTIES,
    2,
    2,
    0.75,
    0.25,
    5,
  );

const CATALOGUED_ORBITAL_ARCHITECTURE =
  requirement(
    StellarSystemScientificDimension
      .ORBITAL_ARCHITECTURE,
    2,
    2,
    0.75,
    0.25,
    3,
  );

const CONFIRMED_CLASSIFICATION =
  requirement(
    StellarSystemScientificDimension
      .STELLAR_CLASSIFICATION,
    2,
    2,
    0.85,
    0.10,
    2,
  );

const CONFIRMED_PHYSICAL_PROPERTIES =
  requirement(
    StellarSystemScientificDimension
      .STELLAR_PHYSICAL_PROPERTIES,
    3,
    2,
    0.85,
    0.10,
    5,
  );

const CONFIRMED_ORBITAL_ARCHITECTURE =
  requirement(
    StellarSystemScientificDimension
      .ORBITAL_ARCHITECTURE,
    3,
    2,
    0.85,
    0.10,
    3,
  );

const DISCOVERY_PROFILE =
  new DetectedToDiscoveredScientificProfile({
    nature:
      DISCOVERY_NATURE,
    identity:
      DISCOVERY_IDENTITY,
    basicArchitecture:
      DISCOVERY_BASIC_ARCHITECTURE,
  });

const CATALOGUING_PROFILE =
  new VisitedToCataloguedScientificProfile({
    profileCode:
      STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
    requirements: [
      CATALOGUED_CLASSIFICATION,
      CATALOGUED_PHYSICAL_PROPERTIES,
      CATALOGUED_ORBITAL_ARCHITECTURE,
    ],
  });

const CONFIRMATION_PROFILE =
  new CataloguedToConfirmedScientificProfile({
    profileCode:
      STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
    requirements: [
      new ScientificConfirmationRequirement({
        cataloguedBaseline:
          CATALOGUED_CLASSIFICATION,
        confirmationRequirement:
          CONFIRMED_CLASSIFICATION,
      }),
      new ScientificConfirmationRequirement({
        cataloguedBaseline:
          CATALOGUED_PHYSICAL_PROPERTIES,
        confirmationRequirement:
          CONFIRMED_PHYSICAL_PROPERTIES,
      }),
      new ScientificConfirmationRequirement({
        cataloguedBaseline:
          CATALOGUED_ORBITAL_ARCHITECTURE,
        confirmationRequirement:
          CONFIRMED_ORBITAL_ARCHITECTURE,
      }),
    ],
  });

/**
 * First concrete point-26.A scientific progression profile.
 *
 * This profile deliberately owns thresholds only. It does not perform
 * observations, choose instruments, spend/award PD, regenerate Ground Truth or
 * mutate DiscoveryState. Points 26.A.8-26.A.9 will map real observation actions
 * and instruments onto these dimensions and feed the already-generic 26.A.3,
 * 26.A.5 and 26.A.6 progression engines.
 */
export const STELLAR_SYSTEM_SCIENTIFIC_PROFILE_V1 =
  new ScientificObjectProgressionProfile({
    profileCode:
      STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
    discoveryProfile:
      DISCOVERY_PROFILE,
    cataloguingProfile:
      CATALOGUING_PROFILE,
    confirmationProfile:
      CONFIRMATION_PROFILE,
  });

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

  weight:
    number,
): ScientificCompletenessRequirement {

  return new ScientificCompletenessRequirement({
    dimensionCode,
    weight,
    minimumEvidenceCount,
    minimumIndependentSources,
    minimumQuality01,
    maximumUncertainty01,
  });
}
