import {
  MinorBodyKind,
  type MinorBodyKindValue,
} from './minor-body-kind';

import {
  MinorBodyKnowledgeState,
  type MinorBodyKnowledgeStateValue,
} from './minor-body-knowledge-state';

const PROCEDURAL_ID_PATTERN = /^[0-9A-F]{32}$/u;

/**
 * Positive point-22.10 player-knowledge record for one existing minor body.
 *
 * EXISTING is deliberately represented by absence of a record. This mirrors
 * the broader GENESIS principle that procedural Ground Truth is regenerated and
 * only player knowledge needs stateful storage.
 */
export class MinorBodyKnowledgeRecord {

  constructor(
    readonly kind:
      MinorBodyKindValue,

    readonly proceduralId:
      string,

    readonly state:
      MinorBodyKnowledgeStateValue,
  ) {
    if (
      !MinorBodyKind.values.includes(
        kind,
      )
    ) {
      throw new RangeError(
        'MinorBodyKnowledgeRecord kind must be a known MinorBodyKind.',
      );
    }

    if (
      !MinorBodyKnowledgeState.values.includes(
        state,
      )
    ) {
      throw new RangeError(
        'MinorBodyKnowledgeRecord state must be a known MinorBodyKnowledgeState.',
      );
    }

    if (
      !PROCEDURAL_ID_PATTERN.test(
        proceduralId,
      )
    ) {
      throw new RangeError(
        'MinorBodyKnowledgeRecord proceduralId must be exactly 32 uppercase hexadecimal characters.',
      );
    }

    if (
      state ===
      MinorBodyKnowledgeState.EXISTING
    ) {
      throw new RangeError(
        'EXISTING is Ground Truth and must be represented by absence of a MinorBodyKnowledgeRecord.',
      );
    }
  }

  get key():
    string {
    return `${this.kind.code}:${this.proceduralId}`;
  }
}
