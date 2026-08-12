import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

/**
 * Pure observational context for one GENESIS universe.
 *
 * Point 8.1 deliberately keeps Observatory minimal:
 *
 * - exactly one UniverseGenerationKey;
 * - no instruments;
 * - no upgrades;
 * - no operational flags;
 * - no persistence identity;
 * - no Ground Truth;
 * - no random entropy;
 * - no UI state.
 */
export class Observatory {

  constructor(
    readonly generationKey:
      UniverseGenerationKey,
  ) {}
}

/**
 * Prepared observational context directed at one already-known procedural
 * target.
 *
 * Point 8.1 does NOT perform a scientific observation yet. The session merely
 * proves that the target is already present in the player's known-discovery
 * snapshot with knowledge >= DETECTED.
 *
 * It contains no measurements, instruments, certainty, uncertainty, noise,
 * Ground Truth, Discovery Point rewards or persistence state.
 */
export class ObservationSession {

  readonly observatory:
    Observatory;

  readonly targetLocator:
    ProceduralLocator;

  readonly targetKnowledgeState:
    DiscoveryStateValue;

  constructor(
    observatory:
      Observatory,

    targetLocator:
      ProceduralLocator,

    targetKnowledgeState:
      DiscoveryStateValue,
  ) {
    const canonicalKnowledgeState =
      DiscoveryState
        .fromCode(
          targetKnowledgeState.code,
        );

    if (
      canonicalKnowledgeState.code <
      DiscoveryState.DETECTED.code
    ) {
      throw new RangeError(
        'targetKnowledgeState must be >= DETECTED.',
      );
    }

    this.observatory =
      observatory;

    this.targetLocator =
      targetLocator;

    this.targetKnowledgeState =
      canonicalKnowledgeState;
  }

  get generationKey():
    UniverseGenerationKey {

    return this
      .observatory
      .generationKey;
  }
}
