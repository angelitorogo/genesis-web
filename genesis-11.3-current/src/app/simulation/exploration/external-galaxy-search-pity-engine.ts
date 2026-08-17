import {
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

import {
  ExternalGalaxySearchPityProfile,
  ExternalGalaxySearchPityStage,
} from '../../domain/exploration/external-galaxy-search-pity-profile';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ExternalGalaxyDetectionProbabilityEngine,
} from './external-galaxy-detection-probability-engine';

/**
 * Pure V1 anti-blocking pity evaluator for the NEXT external-galaxy search.
 *
 * Point 7.9 centralizes pity-stage thresholds and recovery fractions in
 * ExplorationBalanceV1. The effective probability formula remains:
 *
 *   effective = base + (1 - base) * recoveryFraction
 *
 * HARD_PITY remains an exact guaranteed probability of 1.0.
 *
 * This engine performs no random draw, executes no search, mutates no streak,
 * unlocks no galaxy and persists nothing.
 */
export class ExternalGalaxySearchPityEngine {

  private constructor() {}

  static evaluateNextSearchProbability(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    consecutiveFailedSearches:
      bigint,
  ): ExternalGalaxySearchPityProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        generationKey,
        globalDiscoveryPoints,
        consecutiveFailedSearches,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,

    consecutiveFailedSearches:
      bigint,
  ): ExternalGalaxySearchPityProfile {

    const baseDetectionProfile =
      ExternalGalaxyDetectionProbabilityEngine
        .evaluateFutureSearchProbability(
          generationKey,
          globalDiscoveryPoints,
        );

    const pityBalance =
      ExplorationBalanceV1
        .externalGalaxyPityBalanceFor(
          consecutiveFailedSearches,
        );

    const pityStage =
      pityBalance.stage;

    const pityRecoveryFraction =
      pityBalance
        .recoveryFraction;

    const effectiveProbabilityPerNextSearch =
      pityStage ===
      ExternalGalaxySearchPityStage.HARD_PITY
        ? 1.0
        : baseDetectionProfile
            .probabilityPerFutureSearch +
          (
            1.0 -
            baseDetectionProfile
              .probabilityPerFutureSearch
          ) *
          pityRecoveryFraction;

    return new ExternalGalaxySearchPityProfile(
      baseDetectionProfile,
      consecutiveFailedSearches,
      pityStage,
      pityRecoveryFraction,
      effectiveProbabilityPerNextSearch,
    );
  }
}
