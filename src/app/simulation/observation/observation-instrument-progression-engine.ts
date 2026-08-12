import {
  type KnownDiscovery,
} from '../../domain/discovery/known-discovery';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  BodyLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationInstrumentLevelUnlockStatus,
  ObservationInstrumentProgressionOverview,
  ObservationProgressMilestone,
} from '../../domain/observation/observation-instrument-progression';

import {
  ObservationInstrumentCapabilityCatalogV1,
} from './observation-instrument-capability-catalog';

import {
  ObservationInstrumentCatalogV1,
} from './observation-instrument-catalog';

import {
  ObservationInstrumentProgressionCatalogV1,
} from './observation-instrument-progression-catalog';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Pure V1 progression evaluator for observation-instrument accessibility.
 *
 * Unlocks are derived exclusively from:
 * - accumulated global Discovery Points;
 * - milestones already visible in knownDiscoveries.
 *
 * Discovery Points are not spent and no unlock state is persisted.
 */
export class ObservationInstrumentProgressionEngine {

  private constructor() {}

  static evaluate(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ObservationInstrumentProgressionOverview {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        globalDiscoveryPoints,
        knownDiscoveries,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    globalDiscoveryPoints:
      bigint,

    knownDiscoveries:
      readonly KnownDiscovery[],
  ): ObservationInstrumentProgressionOverview {

    assertNonNegativeSignedLong(
      globalDiscoveryPoints,
    );

    for (
      const discovery
      of knownDiscoveries
    ) {
      const stateCode:
        number =
        discovery
          .state
          .code;

      if (
        stateCode ===
        DiscoveryState.UNKNOWN.code
      ) {
        throw new RangeError(
          'knownDiscoveries cannot contain DiscoveryState.UNKNOWN.',
        );
      }
    }

    const achievedMilestones =
      ObservationInstrumentProgressionCatalogV1
        .milestonesInCanonicalOrder
        .filter(
          (
            milestone,
          ) =>
            isMilestoneAchieved(
              milestone,
              knownDiscoveries,
            ),
        );

    const achievedSet =
      new Set(
        achievedMilestones,
      );

    const statuses:
      ObservationInstrumentLevelUnlockStatus[] =
      [];

    for (
      const instrumentType
      of ObservationInstrumentCatalogV1
        .supportedInstrumentTypes
    ) {
      for (
        const level
        of ObservationInstrumentCapabilityCatalogV1
          .supportedLevels
      ) {
        const requirement =
          ObservationInstrumentProgressionCatalogV1
            .combinedRequirement(
              instrumentType,
              level,
            );

        const missingGlobalDiscoveryPoints =
          globalDiscoveryPoints >=
          requirement
            .minimumGlobalDiscoveryPoints
            ? 0n
            : requirement
                .minimumGlobalDiscoveryPoints -
              globalDiscoveryPoints;

        const missingMilestones =
          requirement
            .requiredMilestones
            .filter(
              (
                milestone,
              ) =>
                !achievedSet.has(
                  milestone,
                ),
            );

        statuses.push(
          new ObservationInstrumentLevelUnlockStatus(
            instrumentType,
            level,
            requirement,
            missingGlobalDiscoveryPoints,
            missingMilestones,
          ),
        );
      }
    }

    return new ObservationInstrumentProgressionOverview(
      globalDiscoveryPoints,
      achievedMilestones,
      statuses,
    );
  }
}

function isMilestoneAchieved(
  milestone:
    ObservationProgressMilestone,

  knownDiscoveries:
    readonly KnownDiscovery[],
): boolean {

  if (
    milestone ===
    ObservationProgressMilestone
      .FIRST_SYSTEM_DISCOVERED
  ) {
    return knownDiscoveries
      .some(
        (
          discovery,
        ) =>
          discovery.locator instanceof
            SystemLocator &&
          discovery.state.code >=
            DiscoveryState
              .DISCOVERED
              .code,
      );
  }

  if (
    milestone ===
    ObservationProgressMilestone
      .FIRST_BODY_DISCOVERED
  ) {
    return knownDiscoveries
      .some(
        (
          discovery,
        ) =>
          discovery.locator instanceof
            BodyLocator &&
          discovery.state.code >=
            DiscoveryState
              .DISCOVERED
              .code,
      );
  }

  if (
    milestone ===
    ObservationProgressMilestone
      .FIRST_GALACTIC_OBJECT_CATALOGUED
  ) {
    return knownDiscoveries
      .some(
        (
          discovery,
        ) =>
          discovery.locator instanceof
            GalacticObjectLocator &&
          discovery.state.code >=
            DiscoveryState
              .CATALOGUED
              .code,
      );
  }

  if (
    milestone ===
    ObservationProgressMilestone
      .FIRST_TARGET_CONFIRMED
  ) {
    return knownDiscoveries
      .some(
        (
          discovery,
        ) =>
          discovery.state.code >=
          DiscoveryState
            .CONFIRMED
            .code,
      );
  }

  if (
    milestone ===
    ObservationProgressMilestone
      .FIRST_EXTERNAL_GALAXY_DETECTED
  ) {
    return knownDiscoveries
      .some(
        (
          discovery,
        ) =>
          discovery.locator instanceof
            GalaxyLocator &&
          discovery.locator
            .galaxyIndex >
            0n &&
          discovery.state.code >=
            DiscoveryState
              .DETECTED
              .code,
      );
  }

  throw new RangeError(
    `Unsupported ObservationProgressMilestone: ${String(milestone)}.`,
  );
}

function assertNonNegativeSignedLong(
  globalDiscoveryPoints:
    bigint,
): void {

  if (
    typeof globalDiscoveryPoints !==
      'bigint' ||
    globalDiscoveryPoints <
      0n ||
    globalDiscoveryPoints >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `globalDiscoveryPoints must be a non-negative signed Long: ${String(globalDiscoveryPoints)}.`,
    );
  }
}
