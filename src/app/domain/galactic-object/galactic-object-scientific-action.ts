import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../discovery/discovery-target-type';

import {
  type DiscoveryRewardResult,
} from '../exploration/discovery-reward-result';

import {
  ObservationActionType,
} from '../observation/observation-action';

import {
  ObservationInstrumentType,
} from '../observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../observation/observation-instrument-capability';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from './galactic-object-scientific-subject';

/**
 * Point-12.7 dedicated scientific actions.
 *
 * The first three actions operate only on the coarse point-9.4 family and
 * advance DETECTED -> DISCOVERED. The remaining actions are physical-family
 * specific and become routeable only once the target is already DISCOVERED.
 */
export enum GalacticObjectScientificActionType {
  NEBULA_SURVEY =
    'NEBULA_SURVEY',

  STAR_CLUSTER_SURVEY =
    'STAR_CLUSTER_SURVEY',

  EXTREME_OBJECT_SURVEY =
    'EXTREME_OBJECT_SURVEY',

  NEBULA_SPECTROSCOPIC_CHARACTERIZATION =
    'NEBULA_SPECTROSCOPIC_CHARACTERIZATION',

  NEBULA_PHYSICAL_CONFIRMATION =
    'NEBULA_PHYSICAL_CONFIRMATION',

  HII_IONIZATION_CHARACTERIZATION =
    'HII_IONIZATION_CHARACTERIZATION',

  HII_STAR_FORMATION_CONFIRMATION =
    'HII_STAR_FORMATION_CONFIRMATION',

  OPEN_CLUSTER_POPULATION_CHARACTERIZATION =
    'OPEN_CLUSTER_POPULATION_CHARACTERIZATION',

  OPEN_CLUSTER_AGE_METALLICITY_CONFIRMATION =
    'OPEN_CLUSTER_AGE_METALLICITY_CONFIRMATION',

  GLOBULAR_CLUSTER_STRUCTURE_CHARACTERIZATION =
    'GLOBULAR_CLUSTER_STRUCTURE_CHARACTERIZATION',

  GLOBULAR_CLUSTER_POPULATION_CONFIRMATION =
    'GLOBULAR_CLUSTER_POPULATION_CONFIRMATION',

  SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION =
    'SUPERNOVA_REMNANT_SHOCK_CHARACTERIZATION',

  SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION =
    'SUPERNOVA_REMNANT_EVOLUTION_CONFIRMATION',
}

/**
 * One immutable V1 rule connecting a point-12.7 scientific action to the
 * already-frozen point-8.x observation vocabulary and point-7.x discovery
 * progression.
 *
 * Exactly one applicability dimension is set:
 * - surveyFamily for coarse DETECTED -> DISCOVERED surveys;
 * - scientificSubject for physical-family specific actions.
 */
export class GalacticObjectScientificActionRule {

  readonly compatibleInstrumentTypes:
    readonly ObservationInstrumentType[];

  readonly minimumDiscoveryState:
    DiscoveryStateValue;

  readonly targetDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly actionType:
      GalacticObjectScientificActionType,

    readonly observationActionType:
      ObservationActionType,

    compatibleInstrumentTypes:
      readonly ObservationInstrumentType[],

    readonly minimumInstrumentLevel:
      ObservationInstrumentLevel,

    minimumDiscoveryState:
      DiscoveryStateValue,

    targetDiscoveryState:
      DiscoveryStateValue,

    readonly surveyFamily:
      GalacticObjectScientificSurveyFamily | null,

    readonly scientificSubject:
      GalacticObjectScientificSubject | null,
  ) {
    assertScientificActionType(
      actionType,
    );

    if (
      !Object.values(
        ObservationActionType,
      ).includes(
        observationActionType,
      )
    ) {
      throw new RangeError(
        `Unknown ObservationActionType: ${String(observationActionType)}.`,
      );
    }

    if (
      compatibleInstrumentTypes.length ===
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

    if (
      !ObservationInstrumentLevel
        .values
        .includes(
          minimumInstrumentLevel,
        )
    ) {
      throw new RangeError(
        'minimumInstrumentLevel must be a canonical ObservationInstrumentLevel.',
      );
    }

    const canonicalMinimumState =
      DiscoveryState
        .fromCode(
          minimumDiscoveryState.code,
        );

    const canonicalTargetState =
      DiscoveryState
        .fromCode(
          targetDiscoveryState.code,
        );

    if (
      canonicalMinimumState.code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'minimumDiscoveryState must be >= DETECTED.',
      );
    }

    if (
      canonicalTargetState.code <=
      canonicalMinimumState.code
    ) {
      throw new RangeError(
        'targetDiscoveryState must be greater than minimumDiscoveryState.',
      );
    }

    const hasSurveyFamily =
      surveyFamily !==
      null;

    const hasScientificSubject =
      scientificSubject !==
      null;

    if (
      hasSurveyFamily ===
      hasScientificSubject
    ) {
      throw new RangeError(
        'Exactly one of surveyFamily or scientificSubject must be defined.',
      );
    }

    if (
      surveyFamily !==
        null &&
      !Object.values(
        GalacticObjectScientificSurveyFamily,
      ).includes(
        surveyFamily,
      )
    ) {
      throw new RangeError(
        `Unknown GalacticObjectScientificSurveyFamily: ${String(surveyFamily)}.`,
      );
    }

    if (
      scientificSubject !==
        null &&
      !Object.values(
        GalacticObjectScientificSubject,
      ).includes(
        scientificSubject,
      )
    ) {
      throw new RangeError(
        `Unknown GalacticObjectScientificSubject: ${String(scientificSubject)}.`,
      );
    }

    this.compatibleInstrumentTypes =
      Object.freeze([
        ...compatibleInstrumentTypes,
      ]);

    this.minimumDiscoveryState =
      canonicalMinimumState;

    this.targetDiscoveryState =
      canonicalTargetState;
  }

  get isSurveyAction():
    boolean {

    return this.surveyFamily !==
      null;
  }
}

/**
 * Pure availability assessment for one point-12.7 action.
 */
export class GalacticObjectScientificActionAvailability {

  constructor(
    readonly rule:
      GalacticObjectScientificActionRule,

    readonly currentDiscoveryState:
      DiscoveryStateValue,

    readonly matchesScientificTarget:
      boolean,

    readonly isObservationActionAvailable:
      boolean,

    readonly isInstrumentAllowed:
      boolean,

    readonly meetsMinimumInstrumentLevel:
      boolean,

    readonly isStateEligible:
      boolean,
  ) {
    this.currentDiscoveryState =
      DiscoveryState
        .fromCode(
          currentDiscoveryState.code,
        );

    for (
      const flag
      of [
        matchesScientificTarget,
        isObservationActionAvailable,
        isInstrumentAllowed,
        meetsMinimumInstrumentLevel,
        isStateEligible,
      ]
    ) {
      if (
        typeof flag !==
        'boolean'
      ) {
        throw new TypeError(
          'GalacticObjectScientificActionAvailability flags must be boolean.',
        );
      }
    }
  }

  get actionType():
    GalacticObjectScientificActionType {

    return this.rule
      .actionType;
  }

  get isAvailable():
    boolean {

    return (
      this.matchesScientificTarget &&
      this.isObservationActionAvailable &&
      this.isInstrumentAllowed &&
      this.meetsMinimumInstrumentLevel &&
      this.isStateEligible
    );
  }
}

/**
 * Pure result of executing one point-12.7 action against observed state.
 * Persistence is deliberately owned by presentation/runtime.
 */
export class GalacticObjectScientificActionResult {

  readonly previousDiscoveryState:
    DiscoveryStateValue;

  readonly newDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly actionType:
      GalacticObjectScientificActionType,

    previousDiscoveryState:
      DiscoveryStateValue,

    newDiscoveryState:
      DiscoveryStateValue,

    readonly reward:
      DiscoveryRewardResult,
  ) {
    assertScientificActionType(
      actionType,
    );

    this.previousDiscoveryState =
      DiscoveryState
        .fromCode(
          previousDiscoveryState.code,
        );

    this.newDiscoveryState =
      DiscoveryState
        .fromCode(
          newDiscoveryState.code,
        );

    if (
      reward
        .progressResult
        .targetType
        .code !==
      DiscoveryTargetType
        .GALACTIC_OBJECT
        .code
    ) {
      throw new RangeError(
        'Point-12.7 scientific actions must reward DiscoveryTargetType.GALACTIC_OBJECT.',
      );
    }

    if (
      reward
        .progressResult
        .previousState
        .code !==
        this.previousDiscoveryState.code ||
      reward
        .progressResult
        .newState
        .code !==
        this.newDiscoveryState.code
    ) {
      throw new RangeError(
        'reward progression states must match the scientific action result states.',
      );
    }
  }

  get awardedDiscoveryPoints():
    number {

    return this.reward
      .totalAwardedDiscoveryPoints;
  }
}

function assertScientificActionType(
  actionType:
    GalacticObjectScientificActionType,
): void {

  if (
    !Object.values(
      GalacticObjectScientificActionType,
    ).includes(
      actionType,
    )
  ) {
    throw new RangeError(
      `Unknown GalacticObjectScientificActionType: ${String(actionType)}.`,
    );
  }
}
