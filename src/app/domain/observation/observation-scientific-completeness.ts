import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  ObservationActionType,
} from './observation-action';

/**
 * Caller-supplied observed facts used to derive scientific completeness.
 *
 * completedActions represents actions that have actually completed according
 * to a future execution/history layer. A PreparedObservationAction from 8.7
 * is only an intention and must not be counted automatically.
 */
export class ObservationScientificCompletenessContext {

  static readonly EMPTY =
    Object.freeze(
      new ObservationScientificCompletenessContext(
        [],
        false,
      ),
    );

  readonly completedActions:
    readonly ObservationActionType[];

  constructor(
    completedActions:
      readonly ObservationActionType[],

    readonly hasPeriodicityCandidate:
      boolean,
  ) {
    if (
      typeof hasPeriodicityCandidate !==
        'boolean'
    ) {
      throw new TypeError(
        'hasPeriodicityCandidate must be boolean.',
      );
    }

    for (
      const actionType
      of completedActions
    ) {
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

    if (
      new Set(
        completedActions,
      ).size !==
      completedActions.length
    ) {
      throw new RangeError(
        'completedActions cannot contain duplicates.',
      );
    }

    this.completedActions =
      Object.freeze([
        ...completedActions,
      ]);
  }
}

/**
 * Derived scientific-completeness projection for one procedural object.
 *
 * Completeness is checklist coverage only:
 * - it is not ObservationCertainty;
 * - it is not DiscoveryState;
 * - it is not probability;
 * - it is not explored-universe percentage;
 * - it is not Ground Truth completeness.
 */
export class ObjectScientificCompleteness {

  readonly requiredActions:
    readonly ObservationActionType[];

  readonly completedActions:
    readonly ObservationActionType[];

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly targetLocator:
      ProceduralLocator,

    requiredActions:
      readonly ObservationActionType[],

    completedActions:
      readonly ObservationActionType[],
  ) {
    if (
      requiredActions.length ===
      0
    ) {
      throw new RangeError(
        'requiredActions cannot be empty.',
      );
    }

    validateActionList(
      requiredActions,
      'requiredActions',
    );

    validateActionList(
      completedActions,
      'completedActions',
    );

    this.requiredActions =
      Object.freeze([
        ...requiredActions,
      ]);

    this.completedActions =
      Object.freeze([
        ...completedActions,
      ]);
  }

  get completedRequiredActions():
    readonly ObservationActionType[] {

    return Object.freeze(
      this
        .requiredActions
        .filter(
          (
            actionType,
          ) =>
            this
              .completedActions
              .includes(
                actionType,
              ),
        ),
    );
  }

  get missingRequiredActions():
    readonly ObservationActionType[] {

    return Object.freeze(
      this
        .requiredActions
        .filter(
          (
            actionType,
          ) =>
            !this
              .completedActions
              .includes(
                actionType,
              ),
        ),
    );
  }

  get completedNonRequiredActions():
    readonly ObservationActionType[] {

    return Object.freeze(
      this
        .completedActions
        .filter(
          (
            actionType,
          ) =>
            !this
              .requiredActions
              .includes(
                actionType,
              ),
        ),
    );
  }

  get requiredActionCount():
    number {

    return this
      .requiredActions
      .length;
  }

  get completedRequiredActionCount():
    number {

    return this
      .completedRequiredActions
      .length;
  }

  get missingRequiredActionCount():
    number {

    return this
      .missingRequiredActions
      .length;
  }

  get completenessFraction():
    number {

    return this
      .completedRequiredActionCount /
      this
        .requiredActionCount;
  }

  get isScientificallyComplete():
    boolean {

    return this
      .missingRequiredActions
      .length ===
      0;
  }
}

function validateActionList(
  actionTypes:
    readonly ObservationActionType[],

  propertyName:
    string,
): void {

  for (
    const actionType
    of actionTypes
  ) {
    if (
      !Object.values(
        ObservationActionType,
      ).includes(
        actionType,
      )
    ) {
      throw new RangeError(
        `${propertyName} contains an unknown ObservationActionType: ${String(actionType)}.`,
      );
    }
  }

  if (
    new Set(
      actionTypes,
    ).size !==
    actionTypes.length
  ) {
    throw new RangeError(
      `${propertyName} cannot contain duplicates.`,
    );
  }
}
