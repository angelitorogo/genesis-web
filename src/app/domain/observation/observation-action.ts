import {
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  ObservationInstrumentType,
  type ObservationInstrument,
} from './observation-instrument';

import {
  type LeveledInstrumentObservationSession,
  type ObservationInstrumentLevel,
} from './observation-instrument-capability';

import {
  type Observatory,
} from './observatory';

/**
 * Canonical V1 observational actions in strict roadmap order.
 *
 * Point 8.7 models preparation/availability only. An action type is not a
 * scientific result and does not imply that the action has actually executed.
 */
export enum ObservationActionType {
  OBSERVE =
    'OBSERVE',

  REOBSERVE =
    'REOBSERVE',

  ACQUIRE_SPECTRUM =
    'ACQUIRE_SPECTRUM',

  MEASURE_PERIOD =
    'MEASURE_PERIOD',

  LOCATE_SOURCE =
    'LOCATE_SOURCE',

  SEARCH_PERIODICITY =
    'SEARCH_PERIODICITY',

  TEMPORAL_MONITORING =
    'TEMPORAL_MONITORING',
}

/**
 * V1 contextual facts that can gate preparation of an observational action.
 *
 * PERIODICITY_CANDIDATE is a fact about a possible periodic signal. It is NOT
 * ObservationCertainty.CANDIDATE from point 8.5.
 */
export enum ObservationActionPrerequisite {
  PRIOR_OBSERVATION =
    'PRIOR_OBSERVATION',

  PERIODICITY_CANDIDATE =
    'PERIODICITY_CANDIDATE',
}

/**
 * Caller-supplied observed context used only to evaluate point-8.7
 * prerequisites.
 */
export class ObservationActionContext {

  static readonly EMPTY =
    Object.freeze(
      new ObservationActionContext(
        false,
        false,
      ),
    );

  constructor(
    readonly hasPriorObservation:
      boolean,

    readonly hasPeriodicityCandidate:
      boolean,
  ) {
    if (
      typeof hasPriorObservation !==
        'boolean' ||
      typeof hasPeriodicityCandidate !==
        'boolean'
    ) {
      throw new TypeError(
        'ObservationActionContext flags must be boolean.',
      );
    }
  }
}

/**
 * Frozen rule for one V1 observational action.
 */
export class ObservationActionRule {

  readonly compatibleInstrumentTypes:
    readonly ObservationInstrumentType[];

  readonly requiredPrerequisites:
    readonly ObservationActionPrerequisite[];

  constructor(
    readonly actionType:
      ObservationActionType,

    compatibleInstrumentTypes:
      readonly ObservationInstrumentType[],

    requiredPrerequisites:
      readonly ObservationActionPrerequisite[],
  ) {
    assertActionType(
      actionType,
    );

    if (
      compatibleInstrumentTypes
        .length ===
      0
    ) {
      throw new RangeError(
        'compatibleInstrumentTypes cannot be empty.',
      );
    }

    for (
      const instrumentType
      of compatibleInstrumentTypes
    ) {
      if (
        !Object.values(
          ObservationInstrumentType,
        ).includes(
          instrumentType,
        )
      ) {
        throw new RangeError(
          `Unknown ObservationInstrumentType: ${String(instrumentType)}.`,
        );
      }
    }

    if (
      new Set(
        compatibleInstrumentTypes,
      ).size !==
      compatibleInstrumentTypes.length
    ) {
      throw new RangeError(
        'compatibleInstrumentTypes cannot contain duplicates.',
      );
    }

    for (
      const prerequisite
      of requiredPrerequisites
    ) {
      if (
        !Object.values(
          ObservationActionPrerequisite,
        ).includes(
          prerequisite,
        )
      ) {
        throw new RangeError(
          `Unknown ObservationActionPrerequisite: ${String(prerequisite)}.`,
        );
      }
    }

    if (
      new Set(
        requiredPrerequisites,
      ).size !==
      requiredPrerequisites.length
    ) {
      throw new RangeError(
        'requiredPrerequisites cannot contain duplicates.',
      );
    }

    this.compatibleInstrumentTypes =
      Object.freeze([
        ...compatibleInstrumentTypes,
      ]);

    this.requiredPrerequisites =
      Object.freeze([
        ...requiredPrerequisites,
      ]);
  }
}

/**
 * Availability of one V1 action for one already-prepared leveled instrument
 * session and caller context.
 */
export class ObservationActionAvailability {

  readonly missingPrerequisites:
    readonly ObservationActionPrerequisite[];

  constructor(
    readonly actionType:
      ObservationActionType,

    readonly instrumentType:
      ObservationInstrumentType,

    readonly isInstrumentCompatible:
      boolean,

    missingPrerequisites:
      readonly ObservationActionPrerequisite[],
  ) {
    assertActionType(
      actionType,
    );

    if (
      !Object.values(
        ObservationInstrumentType,
      ).includes(
        instrumentType,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationInstrumentType: ${String(instrumentType)}.`,
      );
    }

    if (
      typeof isInstrumentCompatible !==
      'boolean'
    ) {
      throw new TypeError(
        'isInstrumentCompatible must be boolean.',
      );
    }

    for (
      const prerequisite
      of missingPrerequisites
    ) {
      if (
        !Object.values(
          ObservationActionPrerequisite,
        ).includes(
          prerequisite,
        )
      ) {
        throw new RangeError(
          `Unknown ObservationActionPrerequisite: ${String(prerequisite)}.`,
        );
      }
    }

    if (
      new Set(
        missingPrerequisites,
      ).size !==
      missingPrerequisites.length
    ) {
      throw new RangeError(
        'missingPrerequisites cannot contain duplicates.',
      );
    }

    this.missingPrerequisites =
      Object.freeze([
        ...missingPrerequisites,
      ]);
  }

  get isAvailable():
    boolean {

    return (
      this
        .isInstrumentCompatible &&
      this
        .missingPrerequisites
        .length ===
        0
    );
  }
}

/**
 * Prepared point-8.7 observational intention.
 *
 * It intentionally contains NO:
 * - result;
 * - measurement;
 * - spectrum;
 * - period;
 * - coordinates;
 * - periodicity-found flag;
 * - certainty transition;
 * - success flag;
 * - timestamp;
 * - observation id.
 */
export class PreparedObservationAction {

  constructor(
    readonly observationSession:
      LeveledInstrumentObservationSession,

    readonly actionType:
      ObservationActionType,
  ) {
    assertActionType(
      actionType,
    );
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .observationSession
      .generationKey;
  }

  get observatory():
    Observatory {

    return this
      .observationSession
      .observatory;
  }

  get targetLocator():
    ProceduralLocator {

    return this
      .observationSession
      .targetLocator;
  }

  get targetKnowledgeState():
    DiscoveryStateValue {

    return this
      .observationSession
      .targetKnowledgeState;
  }

  get instrument():
    ObservationInstrument {

    return this
      .observationSession
      .instrument;
  }

  get instrumentType():
    ObservationInstrumentType {

    return this
      .observationSession
      .instrumentType;
  }

  get level():
    ObservationInstrumentLevel {

    return this
      .observationSession
      .level;
  }
}

function assertActionType(
  actionType:
    ObservationActionType,
): void {

  if (
    !Object.values(
      ObservationActionType,
    ).includes(
      actionType,
    )
  ) {
    throw new RangeError(
      `Unknown ObservationActionType: ${String(actionType)}.`,
    );
  }
}
