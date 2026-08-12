import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalaxyInteractionStage,
  GalaxyInteractionStarburstProfile,
  GalaxyStarburstState,
} from '../../domain/interaction/galaxy-interaction-starburst-profile';

import {
  type Galaxy,
} from '../../domain/universe/galaxy';

/**
 * Future-support generator for galaxy interactions and starburst episodes.
 *
 * GeneratorVersion.V1 deliberately returns the baseline profile for every
 * galaxy. GENESIS does not yet have the intergalactic spatial/temporal context
 * required to infer companions, interactions, mergers or starbursts
 * coherently.
 *
 * V1 therefore:
 *
 * - consumes no PRNG draws;
 * - derives no seeds;
 * - performs no companion lookup;
 * - does not use galaxyIndex as a pseudo-selector;
 * - does not infer starburst from absolute SFR;
 * - does not use the point 6.5 formationActivityIndex;
 * - does not modify GalaxyPhysicalProperties;
 * - does not persist anything.
 */
export class GalaxyInteractionStarburstProfileGenerator {

  private constructor() {}

  static generate(
    galaxy:
      Galaxy,
  ): GalaxyInteractionStarburstProfile {

    if (
      galaxy
        .generationKey
        .generatorVersion ===
      GeneratorVersion.V1
    ) {
      return this.generateV1(
        galaxy,
      );
    }

    throw new RangeError(
      `Unsupported GeneratorVersion: ${galaxy.generationKey.generatorVersion.code}.`,
    );
  }

  private static generateV1(
    galaxy:
      Galaxy,
  ): GalaxyInteractionStarburstProfile {

    return new GalaxyInteractionStarburstProfile(
      galaxy.index,
      GalaxyInteractionStage.NONE,
      null,
      0.0,
      GalaxyStarburstState.NONE,
      1.0,
    );
  }
}
