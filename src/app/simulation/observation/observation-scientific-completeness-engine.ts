import {
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  type ObjectScientificCompleteness,
  type ObservationScientificCompletenessContext,
  ObjectScientificCompleteness as ObjectScientificCompletenessModel,
} from '../../domain/observation/observation-scientific-completeness';

import {
  ObservationScientificCompletenessCatalogV1,
} from './observation-scientific-completeness-catalog';

/**
 * Pure V1 scientific-completeness evaluator.
 *
 * Completeness is derived on demand from:
 * - the procedural object identity;
 * - caller-provided facts about actually completed observational actions;
 * - whether a periodicity candidate currently exists.
 *
 * It does NOT:
 * - execute actions;
 * - infer completed actions;
 * - inspect action availability;
 * - inspect instruments, levels or unlock state;
 * - inspect ObservationCertainty;
 * - inspect DiscoveryState;
 * - inspect measurement uncertainty;
 * - query Ground Truth;
 * - grant/spend Discovery Points;
 * - persist completeness.
 */
export class ObservationScientificCompletenessEngine {

  private constructor() {}

  static evaluate(
    generationKey:
      UniverseGenerationKey,

    targetLocator:
      ProceduralLocator,

    context:
      ObservationScientificCompletenessContext,
  ): ObjectScientificCompleteness {

    if (
      generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.evaluateV1(
        generationKey,
        targetLocator,
        context,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
    );
  }

  private static evaluateV1(
    generationKey:
      UniverseGenerationKey,

    targetLocator:
      ProceduralLocator,

    context:
      ObservationScientificCompletenessContext,
  ): ObjectScientificCompleteness {

    const requiredActions =
      ObservationScientificCompletenessCatalogV1
        .requiredActions(
          context
            .hasPeriodicityCandidate,
        );

    const completedActions =
      ObservationScientificCompletenessCatalogV1
        .supportedActions
        .filter(
          (
            actionType,
          ) =>
            context
              .completedActions
              .includes(
                actionType,
              ),
        );

    return new ObjectScientificCompletenessModel(
      generationKey,
      targetLocator,
      requiredActions,
      completedActions,
    );
  }
}
