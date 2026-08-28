import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  type DiscoveryRewardReason,
} from '../../domain/exploration/discovery-reward-reason';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationActionContext,
} from '../../domain/observation/observation-action';

import {
  type LeveledInstrumentObservationSession,
} from '../../domain/observation/observation-instrument-capability';

import {
  StellarSystemScientificActionAvailability,
  StellarSystemScientificActionResult,
  type StellarSystemScientificActionType,
} from '../../domain/planetary/stellar-system-scientific-action';

import {
  DiscoveryRewardEngine,
} from '../exploration/discovery-reward-engine';

import {
  ObservationActionEngine,
} from '../observation/observation-action-engine';

import {
  ProtoplanetaryDiskAnalysisEngine,
} from './protoplanetary-disk-analysis-engine';

import {
  StellarSystemScientificActionCatalogV1,
} from './stellar-system-scientific-action-catalog';

const NO_REWARD_REASONS:
  ReadonlySet<DiscoveryRewardReason> =
  new Set<DiscoveryRewardReason>();

/**
 * Pure point-17.6 action engine.
 *
 * The availability path never resolves formation Ground Truth before
 * CATALOGUED. Once that state is reached, an extant 17.2 disk is required and
 * the frozen 17.1-17.5 chain is projected through ProtoplanetaryDiskAnalysis.
 */
export class StellarSystemScientificActionEngine {

  private constructor() {}

  static availability(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      StellarSystemScientificActionType,
  ): StellarSystemScientificActionAvailability {

    requireV1(
      generationKey,
    );

    const rule =
      StellarSystemScientificActionCatalogV1
        .rule(
          actionType,
        );

    const currentState =
      DiscoveryState.fromCode(
        observationSession
          .targetKnowledgeState
          .code,
      );

    const locator =
      observationSession
        .targetLocator;

    const isSystemTarget =
      locator instanceof
        SystemLocator;

    const isStateEligible =
      currentState.code >=
        rule.minimumDiscoveryState.code &&
      currentState.code <
        rule.targetDiscoveryState.code;

    const hasAnalyzableDisk =
      isSystemTarget &&
      currentState.code >=
        DiscoveryState.CATALOGUED.code
        ? ProtoplanetaryDiskAnalysisEngine
            .analyzeOrNull(
              generationKey,
              locator,
            ) !==
          null
        : false;

    const genericAvailability =
      ObservationActionEngine
        .availability(
          generationKey,
          observationSession,
          rule.observationActionType,
          new ObservationActionContext(
            currentState.code >=
              DiscoveryState.DISCOVERED.code,
            false,
          ),
        );

    const isInstrumentAllowed =
      rule
        .compatibleInstrumentTypes
        .includes(
          observationSession
            .instrumentType,
        );

    const meetsMinimumInstrumentLevel =
      observationSession
        .level
        .rank >=
      rule
        .minimumInstrumentLevel
        .rank;

    return new StellarSystemScientificActionAvailability(
      rule,
      currentState,
      isSystemTarget,
      hasAnalyzableDisk,
      genericAvailability
        .isAvailable,
      isInstrumentAllowed,
      meetsMinimumInstrumentLevel,
      isStateEligible,
    );
  }

  static evaluate(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      StellarSystemScientificActionType,
  ): StellarSystemScientificActionResult {

    const availability =
      this.availability(
        generationKey,
        observationSession,
        actionType,
      );

    if (
      !availability.isAvailable
    ) {
      throw new RangeError(
        [
          `${actionType} is not available for the current point-17.6 scientific context.`,
          `isSystemTarget=${availability.isSystemTarget}.`,
          `hasAnalyzableDisk=${availability.hasAnalyzableDisk}.`,
          `isObservationActionAvailable=${availability.isObservationActionAvailable}.`,
          `isInstrumentAllowed=${availability.isInstrumentAllowed}.`,
          `meetsMinimumInstrumentLevel=${availability.meetsMinimumInstrumentLevel}.`,
          `isStateEligible=${availability.isStateEligible}.`,
        ].join(
          ' ',
        ),
      );
    }

    const locator =
      observationSession
        .targetLocator;

    if (
      !(locator instanceof
        SystemLocator)
    ) {
      throw new RangeError(
        'Point-17.6 ANALYZE DISK requires SystemLocator.',
      );
    }

    const analysis =
      ProtoplanetaryDiskAnalysisEngine
        .analyzeOrNull(
          generationKey,
          locator,
        );

    if (
      analysis ===
        null
    ) {
      throw new RangeError(
        'Point-17.6 ANALYZE DISK requires an extant point-17.2 protoplanetary disk.',
      );
    }

    const reward =
      DiscoveryRewardEngine
        .evaluateDiscoveryReward(
          generationKey,
          DiscoveryTargetType.SYSTEM,
          availability
            .currentDiscoveryState,
          availability
            .rule
            .targetDiscoveryState,
          NO_REWARD_REASONS,
        );

    return new StellarSystemScientificActionResult(
      actionType,
      availability
        .currentDiscoveryState,
      availability
        .rule
        .targetDiscoveryState,
      reward,
      analysis,
    );
  }
}

function requireV1(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey.generatorVersion !==
      GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}
