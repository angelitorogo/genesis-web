import {
  type MinorBodyGroundTruthObject,
} from './minor-body-ground-truth-inventory';

import {
  type MinorBodyKindValue,
} from './minor-body-kind';

import {
  MinorBodyKnowledgeState,
  type MinorBodyKnowledgeStateValue,
} from './minor-body-knowledge-state';

/**
 * One point-22.10 knowledge projection over one immutable Ground Truth body.
 *
 * The exact body object is preserved by reference. Advancing player knowledge
 * must never regenerate or mutate identity, orbit, size, composition or any
 * other physical property established by points 22.3..22.9.
 */
export class MinorBodyKnowledgeProjection {

  constructor(
    readonly kind:
      MinorBodyKindValue,

    readonly body:
      MinorBodyGroundTruthObject,

    readonly knowledgeState:
      MinorBodyKnowledgeStateValue,
  ) {}

  get proceduralId():
    string {
    return this.body
      .proceduralId;
  }

  get localDesignation():
    string {
    return this.body
      .localDesignation;
  }

  get exists():
    boolean {
    return true;
  }

  get isKnownToPlayer():
    boolean {
    return MinorBodyKnowledgeState
      .isKnown(
        this.knowledgeState,
      );
  }

  get isDiscovered():
    boolean {
    return this.knowledgeState ===
      MinorBodyKnowledgeState.DISCOVERED ||
      this.knowledgeState ===
      MinorBodyKnowledgeState.CATALOGUED;
  }

  get isCatalogued():
    boolean {
    return this.knowledgeState ===
      MinorBodyKnowledgeState.CATALOGUED;
  }

  get isArchiveVisible():
    boolean {
    return this.isKnownToPlayer;
  }
}
