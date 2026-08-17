import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyKnowledgeState,
} from '../../domain/exploration/galaxy-knowledge-state';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxyDesignationGenerator,
} from '../universe/galaxy-designation-generator';

/**
 * Point-11.2 knowledge-gated resolver for a galaxy proper name.
 *
 * The procedural designation exists deterministically for every galaxy, but
 * presentation is allowed to know the proper name only from DISCOVERED onward.
 *
 * UNKNOWN and DETECTED therefore resolve to null without invoking the
 * designation generator. VISITED/CATALOGUED/CONFIRMED preserve their global
 * precision while exposing the same already-known proper name.
 */
export class GalaxyKnownNameResolver {

  private constructor() {}

  static resolve(
    generationKey:
      UniverseGenerationKey,

    galaxyIndex:
      bigint,

    discoveryState:
      DiscoveryStateValue,
  ): string | null {

    const galaxyKnowledgeState =
      GalaxyKnowledgeState
        .fromDiscoveryState(
          discoveryState,
        );

    if (
      galaxyKnowledgeState ===
        GalaxyKnowledgeState.UNKNOWN ||
      galaxyKnowledgeState ===
        GalaxyKnowledgeState.DETECTED
    ) {
      return null;
    }

    const name =
      GalaxyDesignationGenerator
        .generate(
          generationKey,
          galaxyIndex,
        )
        .name
        .trim();

    if (
      name.length ===
      0
    ) {
      throw new RangeError(
        'Discovered galaxy proper name must not be blank.',
      );
    }

    return name;
  }
}
