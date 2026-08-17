import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

import {
  ExplorationProgressResult,
  type ExplorationDiscoveryTargetType,
} from '../../domain/exploration/exploration-progress-result';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

/**
 * Pure V1 Exploration Engine for Discovery Point progression.
 *
 * Point 7.9 centralizes all V1 economic/progression balance in
 * ExplorationBalanceV1. This engine owns transition evaluation only.
 *
 * Rules:
 *
 * - PD are awarded only when new DiscoveryState milestones are crossed.
 * - Re-evaluating the same state awards 0 PD.
 * - Skipped transitions award every intermediate milestone exactly once.
 * - Regressive transitions are invalid.
 * - The engine does not persist points or discovery state.
 * - The engine does not unlock galaxies.
 *
 * This engine consumes no PRNG draws and does not use UniverseSeed as entropy.
 */
export class ExplorationEngine {

  private constructor() {}

  static evaluateDiscoveryTransition(
    generationKey:
      UniverseGenerationKey,

    targetType:
      ExplorationDiscoveryTargetType,

    previousState:
      DiscoveryStateValue,

    newState:
      DiscoveryStateValue,
  ): ExplorationProgressResult {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        DiscoveryTargetType
          .fromCode(
            targetType.code,
          ),
        DiscoveryState
          .fromCode(
            previousState.code,
          ),
        DiscoveryState
          .fromCode(
            newState.code,
          ),
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    targetType:
      ExplorationDiscoveryTargetType,

    previousState:
      DiscoveryStateValue,

    newState:
      DiscoveryStateValue,
  ): ExplorationProgressResult {

    if (
      newState.code <
      previousState.code
    ) {
      throw new RangeError(
        [
          'Regressive discovery transitions are invalid:',
          `previousStateCode=${previousState.code},`,
          `newStateCode=${newState.code}.`,
        ].join(
          ' ',
        ),
      );
    }

    if (
      newState.code ===
      previousState.code
    ) {
      return new ExplorationProgressResult(
        targetType,
        previousState,
        newState,
        [],
        0,
      );
    }

    const crossedMilestones =
      ExplorationBalanceV1
        .discoveryMilestones
        .filter(
          (
            milestone,
          ) =>
            milestone.code >
              previousState.code &&
            milestone.code <=
              newState.code,
        );

    const base =
      ExplorationBalanceV1
        .baseDiscoveryPoints(
          targetType,
        );

    const awardedDiscoveryPoints =
      crossedMilestones
        .reduce(
          (
            total,
            milestone,
          ) =>
            total +
            base *
              ExplorationBalanceV1
                .milestoneMultiplier(
                  milestone,
                ),
          0,
        );

    return new ExplorationProgressResult(
      targetType,
      previousState,
      newState,
      crossedMilestones,
      awardedDiscoveryPoints,
    );
  }
}
