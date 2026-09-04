import {
  ObservationActionType,
} from '../observation/observation-action';

import {
  ObservationInstrumentType,
} from '../observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../observation/observation-instrument-capability';

export interface ScientificObservationEvidenceRuleInput {
  readonly profileCode:
    string;

  readonly ruleCode:
    string;

  readonly observationActionType:
    ObservationActionType;

  readonly compatibleInstrumentTypes:
    readonly ObservationInstrumentType[];

  readonly minimumInstrumentLevel:
    ObservationInstrumentLevel;

  readonly dimensionCode:
    string;

  readonly evidenceCode:
    string;

  readonly sourceKey:
    string;

  readonly independenceKey:
    string;
}

/**
 * Generic point-26.A.8 mapping from one real observation intent/instrument
 * capability to one piece of point-26.A.2 ScientificEvidence.
 *
 * This is deliberately an observed-knowledge contract. It contains no target
 * identity, Ground Truth payload, PD cost, DiscoveryState mutation or reward.
 * Concrete object profiles can therefore reuse the same acquisition engine.
 */
export class ScientificObservationEvidenceRule {

  readonly compatibleInstrumentTypes:
    readonly ObservationInstrumentType[];

  constructor(
    input:
      ScientificObservationEvidenceRuleInput,
  ) {

    assertNonBlank(
      input.profileCode,
      'profileCode',
    );
    assertNonBlank(
      input.ruleCode,
      'ruleCode',
    );
    assertNonBlank(
      input.dimensionCode,
      'dimensionCode',
    );
    assertNonBlank(
      input.evidenceCode,
      'evidenceCode',
    );
    assertNonBlank(
      input.sourceKey,
      'sourceKey',
    );
    assertNonBlank(
      input.independenceKey,
      'independenceKey',
    );

    if (
      !Object.values(
        ObservationActionType,
      ).includes(
        input.observationActionType,
      )
    ) {
      throw new RangeError(
        `Unsupported observationActionType: ${String(input.observationActionType)}.`,
      );
    }

    if (
      input.compatibleInstrumentTypes.length ===
      0
    ) {
      throw new RangeError(
        'compatibleInstrumentTypes must not be empty.',
      );
    }

    const uniqueInstrumentTypes =
      new Set(
        input.compatibleInstrumentTypes,
      );

    if (
      uniqueInstrumentTypes.size !==
      input.compatibleInstrumentTypes.length
    ) {
      throw new RangeError(
        'compatibleInstrumentTypes must not contain duplicates.',
      );
    }

    for (
      const instrumentType
      of input.compatibleInstrumentTypes
    ) {
      if (
        !Object.values(
          ObservationInstrumentType,
        ).includes(
          instrumentType,
        )
      ) {
        throw new RangeError(
          `Unsupported ObservationInstrumentType: ${String(instrumentType)}.`,
        );
      }
    }

    if (
      !Number.isInteger(
        input.minimumInstrumentLevel.rank,
      ) ||
      input.minimumInstrumentLevel.rank <
        1 ||
      input.minimumInstrumentLevel.rank >
        5
    ) {
      throw new RangeError(
        'minimumInstrumentLevel must be one of the five canonical V1 levels.',
      );
    }

    this.profileCode =
      input.profileCode;
    this.ruleCode =
      input.ruleCode;
    this.observationActionType =
      input.observationActionType;
    this.compatibleInstrumentTypes =
      Object.freeze([
        ...input.compatibleInstrumentTypes,
      ]);
    this.minimumInstrumentLevel =
      input.minimumInstrumentLevel;
    this.dimensionCode =
      input.dimensionCode;
    this.evidenceCode =
      input.evidenceCode;
    this.sourceKey =
      input.sourceKey;
    this.independenceKey =
      input.independenceKey;

    Object.freeze(
      this,
    );
  }

  readonly profileCode:
    string;

  readonly ruleCode:
    string;

  readonly observationActionType:
    ObservationActionType;

  readonly minimumInstrumentLevel:
    ObservationInstrumentLevel;

  readonly dimensionCode:
    string;

  readonly evidenceCode:
    string;

  readonly sourceKey:
    string;

  readonly independenceKey:
    string;
}

function assertNonBlank(
  value:
    string,

  propertyName:
    string,
): void {

  if (
    value.trim().length ===
    0
  ) {
    throw new RangeError(
      `${propertyName} must not be blank.`,
    );
  }
}
