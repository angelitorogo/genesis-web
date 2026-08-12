import {
  ObservationActionPrerequisite,
  ObservationActionRule,
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

const ALL_INSTRUMENT_TYPES =
  ObservationInstrumentCatalogV1
    .supportedInstrumentTypes;

const SUPPORTED_ACTIONS:
  readonly ObservationActionType[] =
  Object.freeze([
    ObservationActionType
      .OBSERVE,

    ObservationActionType
      .REOBSERVE,

    ObservationActionType
      .ACQUIRE_SPECTRUM,

    ObservationActionType
      .MEASURE_PERIOD,

    ObservationActionType
      .LOCATE_SOURCE,

    ObservationActionType
      .SEARCH_PERIODICITY,

    ObservationActionType
      .TEMPORAL_MONITORING,
  ]);

const RULES:
  readonly ObservationActionRule[] =
  Object.freeze([
    new ObservationActionRule(
      ObservationActionType
        .OBSERVE,
      ALL_INSTRUMENT_TYPES,
      [],
    ),

    new ObservationActionRule(
      ObservationActionType
        .REOBSERVE,
      ALL_INSTRUMENT_TYPES,
      [
        ObservationActionPrerequisite
          .PRIOR_OBSERVATION,
      ],
    ),

    new ObservationActionRule(
      ObservationActionType
        .ACQUIRE_SPECTRUM,
      [
        ObservationInstrumentType
          .SPECTROSCOPY,
      ],
      [],
    ),

    new ObservationActionRule(
      ObservationActionType
        .MEASURE_PERIOD,
      ALL_INSTRUMENT_TYPES,
      [
        ObservationActionPrerequisite
          .PERIODICITY_CANDIDATE,
      ],
    ),

    new ObservationActionRule(
      ObservationActionType
        .LOCATE_SOURCE,
      ALL_INSTRUMENT_TYPES,
      [],
    ),

    new ObservationActionRule(
      ObservationActionType
        .SEARCH_PERIODICITY,
      ALL_INSTRUMENT_TYPES,
      [],
    ),

    new ObservationActionRule(
      ObservationActionType
        .TEMPORAL_MONITORING,
      ALL_INSTRUMENT_TYPES,
      [],
    ),
  ]);

validateV1ActionCatalog();

/**
 * Frozen V1 catalog of observational-action availability rules.
 *
 * Point 8.7 deliberately has no minimum instrument level and no dependency on
 * instrument unlock state. It evaluates only:
 * - action/instrument compatibility;
 * - two caller-supplied observed-context prerequisites.
 */
export class ObservationActionCatalogV1 {

  private constructor() {}

  static readonly supportedActions =
    SUPPORTED_ACTIONS;

  static readonly allInstrumentTypes =
    ALL_INSTRUMENT_TYPES;

  static readonly rules =
    RULES;

  static rule(
    actionType:
      ObservationActionType,
  ): ObservationActionRule {

    const rule =
      RULES
        .find(
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
        `Unsupported ObservationActionType: ${String(actionType)}.`,
      );
    }

    return rule;
  }
}

function validateV1ActionCatalog():
  void {

  if (
    SUPPORTED_ACTIONS.length !==
      7 ||
    RULES.length !==
      7
  ) {
    throw new Error(
      'V1 observation action catalog must contain exactly seven actions and seven rules.',
    );
  }

  if (
    ALL_INSTRUMENT_TYPES.length !==
      7
  ) {
    throw new Error(
      'V1 observation action catalog requires exactly seven point-8.2 instrument families.',
    );
  }

  if (
    new Set(
      SUPPORTED_ACTIONS,
    ).size !==
    SUPPORTED_ACTIONS.length
  ) {
    throw new Error(
      'V1 supported actions cannot contain duplicates.',
    );
  }

  for (
    let index =
      0;
    index <
      SUPPORTED_ACTIONS.length;
    index +=
      1
  ) {
    if (
      RULES[
        index
      ].actionType !==
      SUPPORTED_ACTIONS[
        index
      ]
    ) {
      throw new Error(
        'V1 action rules must follow canonical action order.',
      );
    }
  }

  const spectrumRule =
    RULES[
      2
    ];

  if (
    spectrumRule
      .compatibleInstrumentTypes
      .length !==
      1 ||
    spectrumRule
      .compatibleInstrumentTypes[
        0
      ] !==
      ObservationInstrumentType
        .SPECTROSCOPY
  ) {
    throw new Error(
      'V1 ACQUIRE_SPECTRUM must be compatible only with SPECTROSCOPY.',
    );
  }

  const temporalRule =
    RULES[
      6
    ];

  if (
    temporalRule
      .compatibleInstrumentTypes
      .length !==
      ALL_INSTRUMENT_TYPES
        .length ||
    temporalRule
      .requiredPrerequisites
      .length !==
      0
  ) {
    throw new Error(
      'V1 TEMPORAL_MONITORING must support all instruments with no prerequisites.',
    );
  }
}
