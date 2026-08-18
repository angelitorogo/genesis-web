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
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  GalacticObjectScientificActionAvailability,
  GalacticObjectScientificActionResult,
  type GalacticObjectScientificActionType,
} from '../../domain/galactic-object/galactic-object-scientific-action';

import {
  type GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

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
  DiscoveryRewardEngine,
} from '../exploration/discovery-reward-engine';

import {
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  ObservationActionEngine,
} from '../observation/observation-action-engine';

import {
  GalacticObjectScientificActionCatalogV1,
} from './galactic-object-scientific-action-catalog';

import {
  GalacticObjectScientificSubjectResolver,
} from './galactic-object-scientific-subject-resolver';

const NO_REWARD_REASONS:
  ReadonlySet<DiscoveryRewardReason> =
  new Set<DiscoveryRewardReason>();

/**
 * Pure point-12.7 scientific-action engine.
 *
 * It reuses:
 * - point-8.7 generic action compatibility;
 * - point-8.3 instrument levels;
 * - point-9.4 coarse result families for DETECTED surveys;
 * - point-12.x physical models only after DISCOVERED;
 * - point-7.x DiscoveryState/PD progression via DiscoveryRewardEngine.
 *
 * It does not persist anything and it adds no second PD economy.
 */
export class GalacticObjectScientificActionEngine {

  private constructor() {}

  static availability(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      GalacticObjectScientificActionType,
  ): GalacticObjectScientificActionAvailability {

    requireV1(
      generationKey,
    );

    const rule =
      GalacticObjectScientificActionCatalogV1
        .rule(
          actionType,
        );

    const currentState =
      DiscoveryState
        .fromCode(
          observationSession
            .targetKnowledgeState
            .code,
        );

    const targetLocator =
      observationSession
        .targetLocator;

    const isGalacticObject =
      targetLocator instanceof
      GalacticObjectLocator;

    const matchesScientificTarget =
      isGalacticObject
        ? this.matchesRuleTargetV1(
            generationKey,
            targetLocator,
            currentState,
            rule.surveyFamily,
            rule.scientificSubject,
          )
        : false;

    const context =
      new ObservationActionContext(
        currentState.code >=
          DiscoveryState.DISCOVERED.code,
        false,
      );

    const genericAvailability =
      ObservationActionEngine
        .availability(
          generationKey,
          observationSession,
          rule.observationActionType,
          context,
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

    const isStateEligible =
      currentState.code >=
        rule.minimumDiscoveryState.code &&
      currentState.code <
        rule.targetDiscoveryState.code;

    return new GalacticObjectScientificActionAvailability(
      rule,
      currentState,
      matchesScientificTarget,
      genericAvailability
        .isAvailable,
      isInstrumentAllowed,
      meetsMinimumInstrumentLevel,
      isStateEligible,
    );
  }

  static availabilities(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,
  ): readonly GalacticObjectScientificActionAvailability[] {

    return Object.freeze(
      GalacticObjectScientificActionCatalogV1
        .supportedActions
        .map(
          (
            actionType,
          ) =>
            this.availability(
              generationKey,
              observationSession,
              actionType,
            ),
        ),
    );
  }

  static evaluate(
    generationKey:
      UniverseGenerationKey,

    observationSession:
      LeveledInstrumentObservationSession,

    actionType:
      GalacticObjectScientificActionType,
  ): GalacticObjectScientificActionResult {

    const availability =
      this.availability(
        generationKey,
        observationSession,
        actionType,
      );

    if (
      !availability
        .isAvailable
    ) {
      throw new RangeError(
        [
          `${actionType} is not available for the current point-12.7 scientific context.`,
          `matchesScientificTarget=${availability.matchesScientificTarget}.`,
          `isObservationActionAvailable=${availability.isObservationActionAvailable}.`,
          `isInstrumentAllowed=${availability.isInstrumentAllowed}.`,
          `meetsMinimumInstrumentLevel=${availability.meetsMinimumInstrumentLevel}.`,
          `isStateEligible=${availability.isStateEligible}.`,
        ].join(
          ' ',
        ),
      );
    }

    const reward =
      DiscoveryRewardEngine
        .evaluateDiscoveryReward(
          generationKey,
          DiscoveryTargetType
            .GALACTIC_OBJECT,
          availability
            .currentDiscoveryState,
          availability
            .rule
            .targetDiscoveryState,
          NO_REWARD_REASONS,
        );

    return new GalacticObjectScientificActionResult(
      actionType,
      availability
        .currentDiscoveryState,
      availability
        .rule
        .targetDiscoveryState,
      reward,
    );
  }

  private static matchesRuleTargetV1(
    generationKey:
      UniverseGenerationKey,

    locator:
      GalacticObjectLocator,

    currentState:
      ReturnType<
        typeof DiscoveryState.fromCode
      >,

    surveyFamily:
      GalacticObjectScientificSurveyFamily | null,

    scientificSubject:
      GalacticObjectScientificSubject | null,
  ): boolean {

    if (
      surveyFamily !==
      null
    ) {
      return surveyFamilyForV1(
        ExplorationSectorResultEngine
          .resolveGalacticObjectKind(
            generationKey,
            locator,
          ),
      ) ===
      surveyFamily;
    }

    if (
      scientificSubject ===
      null ||
      currentState.code <
      DiscoveryState.DISCOVERED.code
    ) {
      return false;
    }

    return GalacticObjectScientificSubjectResolver
      .resolve(
        generationKey,
        locator,
        currentState,
      ) ===
      scientificSubject;
  }
}

function surveyFamilyForV1(
  resultKind:
    ReturnType<
      typeof ExplorationSectorResultEngine.resolveGalacticObjectKind
    >,
): GalacticObjectScientificSurveyFamily | null {

  switch (
    resultKind
  ) {
    case ExplorationResultKind.NEBULA:
      return GalacticObjectScientificSurveyFamily
        .NEBULA;

    case ExplorationResultKind.STAR_CLUSTER:
      return GalacticObjectScientificSurveyFamily
        .STAR_CLUSTER;

    case ExplorationResultKind.EXTREME_OBJECT:
      return GalacticObjectScientificSurveyFamily
        .EXTREME_OBJECT;

    default:
      return null;
  }
}

function requireV1(
  generationKey:
    UniverseGenerationKey,
): void {

  if (
    generationKey
      .generatorVersion !==
    GeneratorVersion.V1
  ) {
    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }
}
