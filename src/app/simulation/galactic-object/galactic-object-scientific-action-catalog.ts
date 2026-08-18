import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificActionRule,
  GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationActionCatalogV1,
} from '../observation/observation-action-catalog';

const RULES:
  readonly GalacticObjectScientificActionRule[] =
  Object.freeze([
    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .NEBULA_SURVEY,
      ObservationActionType
        .OBSERVE,
      [
        ObservationInstrumentType
          .OPTICAL,
        ObservationInstrumentType
          .INFRARED,
        ObservationInstrumentType
          .RADIO,
      ],
      ObservationInstrumentLevel
        .LEVEL_1,
      DiscoveryState
        .DETECTED,
      DiscoveryState
        .DISCOVERED,
      GalacticObjectScientificSurveyFamily
        .NEBULA,
      null,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .STAR_CLUSTER_SURVEY,
      ObservationActionType
        .OBSERVE,
      [
        ObservationInstrumentType
          .OPTICAL,
        ObservationInstrumentType
          .INFRARED,
      ],
      ObservationInstrumentLevel
        .LEVEL_1,
      DiscoveryState
        .DETECTED,
      DiscoveryState
        .DISCOVERED,
      GalacticObjectScientificSurveyFamily
        .STAR_CLUSTER,
      null,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .EXTREME_OBJECT_SURVEY,
      ObservationActionType
        .LOCATE_SOURCE,
      [
        ObservationInstrumentType
          .RADIO,
        ObservationInstrumentType
          .X_RAY,
        ObservationInstrumentType
          .GAMMA_RAY,
      ],
      ObservationInstrumentLevel
        .LEVEL_2,
      DiscoveryState
        .DETECTED,
      DiscoveryState
        .DISCOVERED,
      GalacticObjectScientificSurveyFamily
        .EXTREME_OBJECT,
      null,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .NEBULA_SPECTROSCOPIC_CHARACTERIZATION,
      ObservationActionType
        .ACQUIRE_SPECTRUM,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
      ],
      ObservationInstrumentLevel
        .LEVEL_2,
      DiscoveryState
        .DISCOVERED,
      DiscoveryState
        .CATALOGUED,
      null,
      GalacticObjectScientificSubject
        .NEBULA,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .NEBULA_PHYSICAL_CONFIRMATION,
      ObservationActionType
        .REOBSERVE,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
        ObservationInstrumentType
          .INFRARED,
        ObservationInstrumentType
          .RADIO,
      ],
      ObservationInstrumentLevel
        .LEVEL_3,
      DiscoveryState
        .CATALOGUED,
      DiscoveryState
        .CONFIRMED,
      null,
      GalacticObjectScientificSubject
        .NEBULA,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .HII_IONIZATION_CHARACTERIZATION,
      ObservationActionType
        .ACQUIRE_SPECTRUM,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
      ],
      ObservationInstrumentLevel
        .LEVEL_2,
      DiscoveryState
        .DISCOVERED,
      DiscoveryState
        .CATALOGUED,
      null,
      GalacticObjectScientificSubject
        .HII_REGION,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .HII_STAR_FORMATION_CONFIRMATION,
      ObservationActionType
        .REOBSERVE,
      [
        ObservationInstrumentType
          .INFRARED,
        ObservationInstrumentType
          .RADIO,
      ],
      ObservationInstrumentLevel
        .LEVEL_3,
      DiscoveryState
        .CATALOGUED,
      DiscoveryState
        .CONFIRMED,
      null,
      GalacticObjectScientificSubject
        .HII_REGION,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .OPEN_CLUSTER_POPULATION_CHARACTERIZATION,
      ObservationActionType
        .REOBSERVE,
      [
        ObservationInstrumentType
          .OPTICAL,
        ObservationInstrumentType
          .INFRARED,
      ],
      ObservationInstrumentLevel
        .LEVEL_2,
      DiscoveryState
        .DISCOVERED,
      DiscoveryState
        .CATALOGUED,
      null,
      GalacticObjectScientificSubject
        .OPEN_CLUSTER,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .OPEN_CLUSTER_AGE_METALLICITY_CONFIRMATION,
      ObservationActionType
        .ACQUIRE_SPECTRUM,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
      ],
      ObservationInstrumentLevel
        .LEVEL_3,
      DiscoveryState
        .CATALOGUED,
      DiscoveryState
        .CONFIRMED,
      null,
      GalacticObjectScientificSubject
        .OPEN_CLUSTER,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .GLOBULAR_CLUSTER_STRUCTURE_CHARACTERIZATION,
      ObservationActionType
        .REOBSERVE,
      [
        ObservationInstrumentType
          .OPTICAL,
        ObservationInstrumentType
          .INFRARED,
      ],
      ObservationInstrumentLevel
        .LEVEL_3,
      DiscoveryState
        .DISCOVERED,
      DiscoveryState
        .CATALOGUED,
      null,
      GalacticObjectScientificSubject
        .GLOBULAR_CLUSTER,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .GLOBULAR_CLUSTER_POPULATION_CONFIRMATION,
      ObservationActionType
        .ACQUIRE_SPECTRUM,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
      ],
      ObservationInstrumentLevel
        .LEVEL_4,
      DiscoveryState
        .CATALOGUED,
      DiscoveryState
        .CONFIRMED,
      null,
      GalacticObjectScientificSubject
        .GLOBULAR_CLUSTER,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION,
      ObservationActionType
        .ACQUIRE_SPECTRUM,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
      ],
      ObservationInstrumentLevel
        .LEVEL_3,
      DiscoveryState
        .DISCOVERED,
      DiscoveryState
        .CATALOGUED,
      null,
      GalacticObjectScientificSubject
        .SUPERNOVA_REMNANT,
    ),

    new GalacticObjectScientificActionRule(
      GalacticObjectScientificActionType
        .SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION,
      ObservationActionType
        .TEMPORAL_MONITORING,
      [
        ObservationInstrumentType
          .RADIO,
        ObservationInstrumentType
          .X_RAY,
      ],
      ObservationInstrumentLevel
        .LEVEL_4,
      DiscoveryState
        .CATALOGUED,
      DiscoveryState
        .CONFIRMED,
      null,
      GalacticObjectScientificSubject
        .SUPERNOVA_REMNANT,
    ),
  ]);

validateCatalogV1();

/**
 * Immutable point-12.7 V1 action catalog.
 *
 * Instrument choices and minimum levels are gameplay routing constraints. They
 * do not claim that the listed techniques are the only scientifically valid
 * ways to study the corresponding real astronomical object.
 */
export class GalacticObjectScientificActionCatalogV1 {

  private constructor() {}

  static readonly rules =
    RULES;

  static readonly supportedActions:
    readonly GalacticObjectScientificActionType[] =
    Object.freeze(
      RULES.map(
        (
          rule,
        ) =>
          rule.actionType,
      ),
    );

  static rule(
    actionType:
      GalacticObjectScientificActionType,
  ): GalacticObjectScientificActionRule {

    const rule =
      RULES.find(
        (
          candidate,
        ) =>
          candidate.actionType ===
          actionType,
      );

    if (
      rule ===
      undefined
    ) {
      throw new RangeError(
        `Unsupported GalacticObjectScientificActionType: ${String(actionType)}.`,
      );
    }

    return rule;
  }

  static surveyRule(
    surveyFamily:
      GalacticObjectScientificSurveyFamily,
  ): GalacticObjectScientificActionRule {

    const rule =
      RULES.find(
        (
          candidate,
        ) =>
          candidate.surveyFamily ===
          surveyFamily,
      );

    if (
      rule ===
      undefined
    ) {
      throw new RangeError(
        `No point-12.7 survey rule for ${String(surveyFamily)}.`,
      );
    }

    return rule;
  }

  static subjectRules(
    subject:
      GalacticObjectScientificSubject,
  ): readonly GalacticObjectScientificActionRule[] {

    if (
      !Object.values(
        GalacticObjectScientificSubject,
      ).includes(
        subject,
      )
    ) {
      throw new RangeError(
        `Unknown GalacticObjectScientificSubject: ${String(subject)}.`,
      );
    }

    return Object.freeze(
      RULES.filter(
        (
          rule,
        ) =>
          rule.scientificSubject ===
          subject,
      ),
    );
  }
}

function validateCatalogV1():
  void {

  if (
    RULES.length !==
    13
  ) {
    throw new Error(
      'Point-12.7 V1 catalog must contain exactly thirteen scientific actions.',
    );
  }

  if (
    new Set(
      RULES.map(
        (
          rule,
        ) =>
          rule.actionType,
      ),
    ).size !==
    RULES.length
  ) {
    throw new Error(
      'Point-12.7 V1 scientific action types cannot contain duplicates.',
    );
  }

  const surveyRules =
    RULES.filter(
      (
        rule,
      ) =>
        rule.isSurveyAction,
    );

  if (
    surveyRules.length !==
    3
  ) {
    throw new Error(
      'Point-12.7 V1 must contain exactly three coarse survey actions.',
    );
  }

  for (
    const surveyFamily
    of Object.values(
      GalacticObjectScientificSurveyFamily,
    )
  ) {
    if (
      surveyRules.filter(
        (
          rule,
        ) =>
          rule.surveyFamily ===
          surveyFamily,
      ).length !==
      1
    ) {
      throw new Error(
        `Point-12.7 V1 requires exactly one survey for ${surveyFamily}.`,
      );
    }
  }

  for (
    const subject
    of Object.values(
      GalacticObjectScientificSubject,
    )
  ) {
    const subjectRules =
      RULES.filter(
        (
          rule,
        ) =>
          rule.scientificSubject ===
          subject,
      );

    if (
      subjectRules.length !==
      2
    ) {
      throw new Error(
        `Point-12.7 V1 requires exactly two specific actions for ${subject}.`,
      );
    }

    if (
      subjectRules[0]
        .targetDiscoveryState !==
        DiscoveryState.CATALOGUED ||
      subjectRules[1]
        .targetDiscoveryState !==
        DiscoveryState.CONFIRMED
    ) {
      throw new Error(
        `Point-12.7 V1 specific actions for ${subject} must target CATALOGUED then CONFIRMED.`,
      );
    }
  }

  for (
    const rule
    of RULES
  ) {
    const genericRule =
      ObservationActionCatalogV1
        .rule(
          rule.observationActionType,
        );

    if (
      rule
        .compatibleInstrumentTypes
        .some(
          (
            instrumentType,
          ) =>
            !genericRule
              .compatibleInstrumentTypes
              .includes(
                instrumentType,
              ),
        )
    ) {
      throw new Error(
        `Point-12.7 action ${rule.actionType} cannot broaden point-8.7 instrument compatibility.`,
      );
    }
  }
}
