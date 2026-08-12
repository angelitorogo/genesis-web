import {
  ExplorationBalanceV1,
} from '../../domain/exploration/exploration-balance';

import {
  ExternalGalaxyDetectionProbabilityProfile,
} from '../../domain/exploration/external-galaxy-detection-probability-profile';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

/**
 * Pure V1 evaluator for the base probability of detecting an external galaxy
 * in a FUTURE search.
 *
 * Point 7.9 centralizes all V1 thresholds and probabilities in
 * ExplorationBalanceV1. This engine performs no random draw, search attempt,
 * unlock, DiscoveryState mutation, PD spending or persistence.
 */
export class ExternalGalaxyDetectionProbabilityEngine {

  private constructor() {}

  static evaluateFutureSearchProbability(
    generationKey:
      UniverseGenerationKey,

    globalDiscoveryPoints:
      bigint,
  ): ExternalGalaxyDetectionProbabilityProfile {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        globalDiscoveryPoints,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    globalDiscoveryPoints:
      bigint,
  ): ExternalGalaxyDetectionProbabilityProfile {

    const balance =
      ExplorationBalanceV1
        .externalGalaxyDetectionBalanceFor(
          globalDiscoveryPoints,
        );

    return new ExternalGalaxyDetectionProbabilityProfile(
      globalDiscoveryPoints,
      balance.tier,
      balance
        .probabilityPerFutureSearch,
    );
  }
}
