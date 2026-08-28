import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  StellarSystemScientificActionRule,
  StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

import {
  ObservationActionCatalogV1,
} from '../observation/observation-action-catalog';

const ANALYZE_DISK_RULE =
  new StellarSystemScientificActionRule(
    StellarSystemScientificActionType
      .ANALYZE_DISK,
    ObservationActionType
      .REOBSERVE,
    [
      ObservationInstrumentType
        .INFRARED,
      ObservationInstrumentType
        .RADIO,
    ],
    ObservationInstrumentLevel
      .LEVEL_2,
    DiscoveryState
      .CATALOGUED,
    DiscoveryState
      .CONFIRMED,
  );

validateV1Catalog();

/**
 * Frozen point-17.6 catalog. A disk analysis is a level-2 infrared/radio
 * re-observation of an already-catalogued system and confirms the system when
 * an extant primordial disk exists in the deterministic 17.2 model.
 */
export class StellarSystemScientificActionCatalogV1 {

  private constructor() {}

  static readonly supportedActions =
    Object.freeze([
      StellarSystemScientificActionType
        .ANALYZE_DISK,
    ]);

  static readonly analyzeDiskRule =
    ANALYZE_DISK_RULE;

  static rule(
    actionType:
      StellarSystemScientificActionType,
  ): StellarSystemScientificActionRule {

    if (
      actionType !==
      StellarSystemScientificActionType
        .ANALYZE_DISK
    ) {
      throw new RangeError(
        `Unsupported StellarSystemScientificActionType: ${String(actionType)}.`,
      );
    }

    return ANALYZE_DISK_RULE;
  }
}

function validateV1Catalog():
  void {

  const genericRule =
    ObservationActionCatalogV1
      .rule(
        ANALYZE_DISK_RULE
          .observationActionType,
      );

  for (
    const instrumentType
    of ANALYZE_DISK_RULE
      .compatibleInstrumentTypes
  ) {
    if (
      !genericRule
        .compatibleInstrumentTypes
        .includes(
          instrumentType,
        )
    ) {
      throw new Error(
        `Point-17.6 ANALYZE DISK cannot broaden point-8.7 compatibility with ${instrumentType}.`,
      );
    }
  }
}
