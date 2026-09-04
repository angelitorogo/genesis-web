import {
  DetectedToDiscoveredScientificDimension,
} from '../../domain/discovery/detected-to-discovered-scientific-profile';

import {
  ScientificObservationEvidenceRule,
} from '../../domain/discovery/scientific-observation-evidence-rule';

import {
  STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
  StellarSystemScientificDimension,
} from '../../domain/discovery/stellar-system-scientific-profile';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

export const StellarSystemScientificObservationRuleCode =
  Object.freeze({
    RESOLVE_NATURE_OPTICAL:
      'RESOLVE_NATURE_OPTICAL',

    RESOLVE_IDENTITY_OPTICAL:
      'RESOLVE_IDENTITY_OPTICAL',

    RESOLVE_BASIC_ARCHITECTURE_OPTICAL:
      'RESOLVE_BASIC_ARCHITECTURE_OPTICAL',

    CLASSIFICATION_PHOTOMETRY:
      'CLASSIFICATION_PHOTOMETRY',

    PHYSICAL_PROPERTIES_OPTICAL:
      'PHYSICAL_PROPERTIES_OPTICAL',

    PHYSICAL_PROPERTIES_RADIO:
      'PHYSICAL_PROPERTIES_RADIO',

    ORBITAL_ARCHITECTURE_ASTROMETRY:
      'ORBITAL_ARCHITECTURE_ASTROMETRY',

    ORBITAL_ARCHITECTURE_RADIO_TIMING:
      'ORBITAL_ARCHITECTURE_RADIO_TIMING',

    CLASSIFICATION_SPECTROSCOPY:
      'CLASSIFICATION_SPECTROSCOPY',

    PHYSICAL_PROPERTIES_INFRARED:
      'PHYSICAL_PROPERTIES_INFRARED',

    ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS:
      'ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS',
  } as const);

export type StellarSystemScientificObservationRuleCode =
  typeof StellarSystemScientificObservationRuleCode[
    keyof typeof StellarSystemScientificObservationRuleCode
  ];

const rules =
  Object.freeze([
    rule(
      StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
      ObservationActionType.OBSERVE,
      ObservationInstrumentType.OPTICAL,
      ObservationInstrumentLevel.LEVEL_1,
      DetectedToDiscoveredScientificDimension.NATURE,
      'STELLAR_NATURE_OPTICAL',
      'NATURE_OPTICAL',
      'OPTICAL_IMAGING',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.RESOLVE_IDENTITY_OPTICAL,
      ObservationActionType.LOCATE_SOURCE,
      ObservationInstrumentType.OPTICAL,
      ObservationInstrumentLevel.LEVEL_1,
      DetectedToDiscoveredScientificDimension.IDENTITY,
      'STELLAR_IDENTITY_OPTICAL',
      'IDENTITY_OPTICAL',
      'OPTICAL_ASTROMETRY',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.RESOLVE_BASIC_ARCHITECTURE_OPTICAL,
      ObservationActionType.SEARCH_PERIODICITY,
      ObservationInstrumentType.OPTICAL,
      ObservationInstrumentLevel.LEVEL_1,
      DetectedToDiscoveredScientificDimension.BASIC_ARCHITECTURE,
      'STELLAR_BASIC_ARCHITECTURE_OPTICAL',
      'BASIC_ARCHITECTURE_OPTICAL',
      'OPTICAL_TIME_SERIES',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.CLASSIFICATION_PHOTOMETRY,
      ObservationActionType.OBSERVE,
      ObservationInstrumentType.OPTICAL,
      ObservationInstrumentLevel.LEVEL_2,
      StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
      'STELLAR_CLASSIFICATION_PHOTOMETRY',
      'CLASSIFICATION_PHOTOMETRY',
      'PHOTOMETRY',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_OPTICAL,
      ObservationActionType.REOBSERVE,
      ObservationInstrumentType.OPTICAL,
      ObservationInstrumentLevel.LEVEL_2,
      StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
      'STELLAR_PHYSICAL_PROPERTIES_OPTICAL',
      'PHYSICAL_PROPERTIES_OPTICAL',
      'PHOTOMETRY',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_RADIO,
      ObservationActionType.OBSERVE,
      ObservationInstrumentType.RADIO,
      ObservationInstrumentLevel.LEVEL_2,
      StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
      'STELLAR_PHYSICAL_PROPERTIES_RADIO',
      'PHYSICAL_PROPERTIES_RADIO',
      'RADIO_CONTINUUM',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_ASTROMETRY,
      ObservationActionType.LOCATE_SOURCE,
      ObservationInstrumentType.OPTICAL,
      ObservationInstrumentLevel.LEVEL_2,
      StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
      'STELLAR_ORBITAL_ARCHITECTURE_ASTROMETRY',
      'ORBITAL_ARCHITECTURE_ASTROMETRY',
      'OPTICAL_ASTROMETRY',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_RADIO_TIMING,
      ObservationActionType.SEARCH_PERIODICITY,
      ObservationInstrumentType.RADIO,
      ObservationInstrumentLevel.LEVEL_2,
      StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
      'STELLAR_ORBITAL_ARCHITECTURE_RADIO_TIMING',
      'ORBITAL_ARCHITECTURE_RADIO_TIMING',
      'RADIO_TIMING',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.CLASSIFICATION_SPECTROSCOPY,
      ObservationActionType.ACQUIRE_SPECTRUM,
      ObservationInstrumentType.SPECTROSCOPY,
      ObservationInstrumentLevel.LEVEL_4,
      StellarSystemScientificDimension.STELLAR_CLASSIFICATION,
      'STELLAR_CLASSIFICATION_SPECTROSCOPY',
      'CLASSIFICATION_SPECTROSCOPY',
      'SPECTROSCOPY',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.PHYSICAL_PROPERTIES_INFRARED,
      ObservationActionType.REOBSERVE,
      ObservationInstrumentType.INFRARED,
      ObservationInstrumentLevel.LEVEL_4,
      StellarSystemScientificDimension.STELLAR_PHYSICAL_PROPERTIES,
      'STELLAR_PHYSICAL_PROPERTIES_INFRARED',
      'PHYSICAL_PROPERTIES_INFRARED',
      'INFRARED_SED',
    ),
    rule(
      StellarSystemScientificObservationRuleCode.ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS,
      ObservationActionType.SEARCH_PERIODICITY,
      ObservationInstrumentType.SPECTROSCOPY,
      ObservationInstrumentLevel.LEVEL_4,
      StellarSystemScientificDimension.ORBITAL_ARCHITECTURE,
      'STELLAR_ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS',
      'ORBITAL_ARCHITECTURE_SPECTROSCOPIC_DYNAMICS',
      'SPECTROSCOPIC_DYNAMICS',
    ),
  ]);

/**
 * First concrete point-26.A.8 observation-to-evidence mapping.
 *
 * The L1 optical bootstrap avoids a circular dependency: the first stellar
 * system can be scientifically discovered before FIRST_SYSTEM_DISCOVERED has
 * unlocked higher instrument levels. L2 methods can satisfy the A7 CATALOGUED
 * thresholds; L4 follow-up is precise enough for the A7 confirmation thresholds.
 *
 * Rules only describe evidence methods. They do not execute ObservationEngine,
 * persist evidence, award/spend PD or mutate DiscoveryState; orchestration belongs
 * to point 26.A.9.
 */
export class StellarSystemScientificObservationCatalogV1 {

  static readonly rules =
    rules;

  private constructor() {}

  static rule(
    ruleCode:
      StellarSystemScientificObservationRuleCode,
  ): ScientificObservationEvidenceRule {

    const match =
      rules.find(
        candidate =>
          candidate.ruleCode ===
          ruleCode,
      );

    if (
      match ===
      undefined
    ) {
      throw new RangeError(
        `Unknown STELLAR_SYSTEM scientific observation rule: ${String(ruleCode)}.`,
      );
    }

    return match;
  }

  static rulesForDimension(
    dimensionCode:
      string,
  ): readonly ScientificObservationEvidenceRule[] {

    return Object.freeze(
      rules.filter(
        candidate =>
          candidate.dimensionCode ===
          dimensionCode,
      ),
    );
  }
}

function rule(
  ruleCode:
    StellarSystemScientificObservationRuleCode,

  observationActionType:
    ObservationActionType,

  instrumentType:
    ObservationInstrumentType,

  minimumInstrumentLevel:
    ObservationInstrumentLevel,

  dimensionCode:
    string,

  evidenceCode:
    string,

  sourceKey:
    string,

  independenceKey:
    string,
): ScientificObservationEvidenceRule {

  return new ScientificObservationEvidenceRule({
    profileCode:
      STELLAR_SYSTEM_SCIENTIFIC_PROFILE_CODE,
    ruleCode,
    observationActionType,
    compatibleInstrumentTypes: [
      instrumentType,
    ],
    minimumInstrumentLevel,
    dimensionCode,
    evidenceCode,
    sourceKey:
      `STELLAR_SYSTEM:${sourceKey}`,
    independenceKey,
  });
}
