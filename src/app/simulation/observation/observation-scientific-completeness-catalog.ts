import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationActionCatalogV1,
} from './observation-action-catalog';

const SUPPORTED_ACTIONS =
  ObservationActionCatalogV1
    .supportedActions;

const CONDITIONAL_PERIOD_ACTION =
  ObservationActionType
    .MEASURE_PERIOD;

const BASE_REQUIRED_ACTIONS:
  readonly ObservationActionType[] =
  Object.freeze(
    SUPPORTED_ACTIONS
      .filter(
        (
          actionType,
        ) =>
          actionType !==
          CONDITIONAL_PERIOD_ACTION,
      ),
  );

validateV1CompletenessCatalog();

/**
 * Frozen V1 scientific-completeness checklist.
 *
 * Base checklist:
 * - OBSERVE
 * - REOBSERVE
 * - ACQUIRE_SPECTRUM
 * - LOCATE_SOURCE
 * - SEARCH_PERIODICITY
 * - TEMPORAL_MONITORING
 *
 * MEASURE_PERIOD becomes required only when a periodicity candidate exists.
 */
export class ObservationScientificCompletenessCatalogV1 {

  private constructor() {}

  static readonly supportedActions =
    SUPPORTED_ACTIONS;

  static readonly baseRequiredActions =
    BASE_REQUIRED_ACTIONS;

  static readonly conditionalPeriodAction =
    CONDITIONAL_PERIOD_ACTION;

  static requiredActions(
    hasPeriodicityCandidate:
      boolean,
  ): readonly ObservationActionType[] {

    if (
      typeof hasPeriodicityCandidate !==
        'boolean'
    ) {
      throw new TypeError(
        'hasPeriodicityCandidate must be boolean.',
      );
    }

    return hasPeriodicityCandidate
      ? SUPPORTED_ACTIONS
      : BASE_REQUIRED_ACTIONS;
  }
}

function validateV1CompletenessCatalog():
  void {

  if (
    SUPPORTED_ACTIONS.length !==
      7
  ) {
    throw new Error(
      'V1 scientific completeness requires exactly the seven point-8.7 actions.',
    );
  }

  if (
    BASE_REQUIRED_ACTIONS.length !==
      6
  ) {
    throw new Error(
      'V1 base scientific completeness checklist must contain exactly six actions.',
    );
  }

  if (
    CONDITIONAL_PERIOD_ACTION !==
      ObservationActionType
        .MEASURE_PERIOD
  ) {
    throw new Error(
      'V1 conditional completeness action must be MEASURE_PERIOD.',
    );
  }

  if (
    BASE_REQUIRED_ACTIONS
      .includes(
        CONDITIONAL_PERIOD_ACTION,
      )
  ) {
    throw new Error(
      'V1 base checklist must not contain MEASURE_PERIOD.',
    );
  }

  const expectedBase =
    [
      ObservationActionType
        .OBSERVE,

      ObservationActionType
        .REOBSERVE,

      ObservationActionType
        .ACQUIRE_SPECTRUM,

      ObservationActionType
        .LOCATE_SOURCE,

      ObservationActionType
        .SEARCH_PERIODICITY,

      ObservationActionType
        .TEMPORAL_MONITORING,
    ];

  if (
    expectedBase.length !==
      BASE_REQUIRED_ACTIONS.length ||
    expectedBase.some(
      (
        actionType,
        index,
      ) =>
        BASE_REQUIRED_ACTIONS[
          index
        ] !==
        actionType,
    )
  ) {
    throw new Error(
      'V1 base scientific completeness checklist must preserve canonical action order.',
    );
  }
}
