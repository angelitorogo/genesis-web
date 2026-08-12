import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationActionAvailability,
  type ObservationActionContext,
  ObservationActionPrerequisite,
  ObservationActionType,
  PreparedObservationAction,
} from '../../domain/observation/observation-action';

import {
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  ObservationActionCatalogV1,
} from './observation-action-catalog';

/**
 * Pure point-8.7 action-availability and action-preparation engine.
 *
 * It prepares intentions only. It does NOT execute an observation and does NOT
 * produce measurements, spectra, periods, coordinates, time series,
 * periodicity findings, certainty changes, DiscoveryState changes, PD,
 * persistence or history.
 */
export class ObservationActionEngine {

  private constructor() {}

  static availability(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      ObservationActionType,

    context:
      ObservationActionContext,
  ): ObservationActionAvailability {

    assertMatchingGenerationKey(
      generationKey,
      observationSession
        .generationKey,
    );

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.availabilityV1(
        observationSession,
        actionType,
        context,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  static actionAvailabilities(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    context:
      ObservationActionContext,
  ): readonly ObservationActionAvailability[] {

    assertMatchingGenerationKey(
      generationKey,
      observationSession
        .generationKey,
    );

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return Object.freeze(
        ObservationActionCatalogV1
          .supportedActions
          .map(
            (
              actionType,
            ) =>
              this.availabilityV1(
                observationSession,
                actionType,
                context,
              ),
          ),
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  static prepareAction(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      ObservationActionType,

    context:
      ObservationActionContext,
  ): PreparedObservationAction {

    const availability =
      this.availability(
        generationKey,
        observationSession,
        actionType,
        context,
      );

    if (
      !availability
        .isAvailable
    ) {
      const missingPrerequisites =
        availability
          .missingPrerequisites
          .length ===
          0
          ? 'none'
          : availability
              .missingPrerequisites
              .join(
                ', ',
              );

      throw new RangeError(
        [
          `${actionType} is not available for ${observationSession.instrumentType}.`,
          `isInstrumentCompatible=${availability.isInstrumentCompatible}.`,
          `missingPrerequisites=${missingPrerequisites}.`,
        ].join(
          ' ',
        ),
      );
    }

    return new PreparedObservationAction(
      observationSession,
      actionType,
    );
  }

  private static availabilityV1(
    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      ObservationActionType,

    context:
      ObservationActionContext,
  ): ObservationActionAvailability {

    const rule =
      ObservationActionCatalogV1
        .rule(
          actionType,
        );

    const isInstrumentCompatible =
      rule
        .compatibleInstrumentTypes
        .includes(
          observationSession
            .instrumentType,
        );

    const missingPrerequisites:
      ObservationActionPrerequisite[] =
      [];

    for (
      const prerequisite
      of rule
        .requiredPrerequisites
    ) {
      if (
        prerequisite ===
          ObservationActionPrerequisite
            .PRIOR_OBSERVATION &&
        !context
          .hasPriorObservation
      ) {
        missingPrerequisites.push(
          prerequisite,
        );
      }

      if (
        prerequisite ===
          ObservationActionPrerequisite
            .PERIODICITY_CANDIDATE &&
        !context
          .hasPeriodicityCandidate
      ) {
        missingPrerequisites.push(
          prerequisite,
        );
      }
    }

    return new ObservationActionAvailability(
      actionType,
      observationSession
        .instrumentType,
      isInstrumentCompatible,
      missingPrerequisites,
    );
  }
}

function assertMatchingGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): void {

  if (
    !sameGenerationKey(
      left,
      right,
    )
  ) {
    throw new RangeError(
      'generationKey must match observationSession.generationKey.',
    );
  }
}

/**
 * Kotlin UniverseGenerationKey is a data class. Web classes use reference
 * identity by default, so the V1 action engine preserves Android equality
 * semantics through structural comparison.
 */
function sameGenerationKey(
  left:
    UniverseGenerationKey,

  right:
    UniverseGenerationKey,
): boolean {

  if (
    left ===
    right
  ) {
    return true;
  }

  if (
    left
      .generatorVersion
      .code !==
    right
      .generatorVersion
      .code
  ) {
    return false;
  }

  return sameStructuredValue(
    left.universeSeed,
    right.universeSeed,
  );
}

function sameStructuredValue(
  left:
    unknown,

  right:
    unknown,
): boolean {

  if (
    Object.is(
      left,
      right,
    )
  ) {
    return true;
  }

  if (
    typeof left !==
      typeof right ||
    left ===
      null ||
    right ===
      null
  ) {
    return false;
  }

  if (
    typeof left !==
      'object'
  ) {
    return false;
  }

  const leftText =
    String(
      left,
    );

  const rightText =
    String(
      right,
    );

  if (
    leftText !==
      '[object Object]' &&
    rightText !==
      '[object Object]' &&
    leftText ===
      rightText
  ) {
    return true;
  }

  if (
    left instanceof
      Uint8Array &&
    right instanceof
      Uint8Array
  ) {
    return (
      left.length ===
        right.length &&
      left.every(
        (
          value,
          index,
        ) =>
          value ===
          right[
            index
          ],
      )
    );
  }

  if (
    Array.isArray(
      left,
    ) &&
    Array.isArray(
      right,
    )
  ) {
    return (
      left.length ===
        right.length &&
      left.every(
        (
          value,
          index,
        ) =>
          sameStructuredValue(
            value,
            right[
              index
            ],
          ),
      )
    );
  }

  const leftObject =
    left as
      object;

  const rightObject =
    right as
      object;

  const leftKeys =
    Reflect.ownKeys(
      leftObject,
    );

  const rightKeys =
    Reflect.ownKeys(
      rightObject,
    );

  if (
    leftKeys.length ===
      0 ||
    leftKeys.length !==
      rightKeys.length
  ) {
    return false;
  }

  for (
    const key
    of leftKeys
  ) {
    if (
      !rightKeys.includes(
        key,
      )
    ) {
      return false;
    }

    const leftValue =
      (
        leftObject as
          Record<
            PropertyKey,
            unknown
          >
      )[
        key
      ];

    const rightValue =
      (
        rightObject as
          Record<
            PropertyKey,
            unknown
          >
      )[
        key
      ];

    if (
      !sameStructuredValue(
        leftValue,
        rightValue,
      )
    ) {
      return false;
    }
  }

  return true;
}
