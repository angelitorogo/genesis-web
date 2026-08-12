import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  ExternalGalaxyFocusChoice,
  ExternalGalaxyFocusDecision,
  ExternalGalaxyFocusOffer,
} from '../../domain/exploration/external-galaxy-focus';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

/**
 * Pure deterministic point-7.7 engine for choosing exploration focus after an
 * external galaxy has already been detected.
 *
 * Creating an offer never changes focus automatically. Resolving a choice
 * merely returns the resulting galaxy index:
 *
 * - REMAIN_CURRENT -> offer.currentGalaxyIndex
 * - FOCUS_DETECTED -> offer.detectedGalaxyIndex
 *
 * This engine does not:
 *
 * - persist activeGalaxyIndex;
 * - write navigation state;
 * - mutate DiscoveryState;
 * - unlock galaxies;
 * - award or spend Discovery Points;
 * - read pity/probability/progress;
 * - inspect galaxy Ground Truth;
 * - perform random draws, hashing or seed derivation;
 * - model physical travel.
 *
 * A future orchestrator/UI must explicitly persist the returned decision when
 * the roadmap reaches that integration responsibility.
 */
export class ExternalGalaxyFocusEngine {

  private constructor() {}

  static buildFocusOffer(
    generationKey:
      UniverseGenerationKey,

    currentGalaxyIndex:
      bigint,

    detectedGalaxyIndex:
      bigint,

    detectedGalaxyKnowledgeState:
      DiscoveryStateValue,
  ): ExternalGalaxyFocusOffer {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.buildV1(
        currentGalaxyIndex,
        detectedGalaxyIndex,
        DiscoveryState
          .fromCode(
            detectedGalaxyKnowledgeState
              .code,
          ),
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  static resolveFocusChoice(
    generationKey:
      UniverseGenerationKey,

    offer:
      ExternalGalaxyFocusOffer,

    choice:
      ExternalGalaxyFocusChoice,
  ): ExternalGalaxyFocusDecision {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.resolveV1(
        offer,
        choice,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static buildV1(
    currentGalaxyIndex:
      bigint,

    detectedGalaxyIndex:
      bigint,

    detectedGalaxyKnowledgeState:
      DiscoveryStateValue,
  ): ExternalGalaxyFocusOffer {

    return new ExternalGalaxyFocusOffer(
      currentGalaxyIndex,
      detectedGalaxyIndex,
      detectedGalaxyKnowledgeState,
    );
  }

  private static resolveV1(
    offer:
      ExternalGalaxyFocusOffer,

    choice:
      ExternalGalaxyFocusChoice,
  ): ExternalGalaxyFocusDecision {

    const resultingFocusGalaxyIndex =
      choice ===
        ExternalGalaxyFocusChoice
          .REMAIN_CURRENT
        ? offer.currentGalaxyIndex
        : choice ===
            ExternalGalaxyFocusChoice
              .FOCUS_DETECTED
          ? offer.detectedGalaxyIndex
          : invalidChoice(
              choice,
            );

    return new ExternalGalaxyFocusDecision(
      offer,
      choice,
      resultingFocusGalaxyIndex,
    );
  }
}

function invalidChoice(
  choice:
    never,
): never {

  throw new RangeError(
    `Unsupported ExternalGalaxyFocusChoice: ${String(choice)}.`,
  );
}
