const EXISTING = Object.freeze({
  name: 'EXISTING',
  code: 0,
} as const);

const DISCOVERED = Object.freeze({
  name: 'DISCOVERED',
  code: 1,
} as const);

const CATALOGUED = Object.freeze({
  name: 'CATALOGUED',
  code: 2,
} as const);

export type MinorBodyKnowledgeStateValue =
  | typeof EXISTING
  | typeof DISCOVERED
  | typeof CATALOGUED;

const VALUES: readonly MinorBodyKnowledgeStateValue[] = Object.freeze([
  EXISTING,
  DISCOVERED,
  CATALOGUED,
]);

/**
 * Point-22.10 three-state projection for individually materialized minor bodies.
 *
 * EXISTING is Ground Truth only: the body exists procedurally but is not known
 * to the player. DISCOVERED and CATALOGUED are progressively stronger player
 * knowledge states. Missing knowledge records project to EXISTING; EXISTING is
 * therefore never persisted as a positive knowledge record.
 */
export const MinorBodyKnowledgeState = Object.freeze({
  EXISTING,
  DISCOVERED,
  CATALOGUED,
  values: VALUES,

  fromCodeOrNull(
    code: number,
  ): MinorBodyKnowledgeStateValue | null {
    return VALUES.find(
      value => value.code === code,
    ) ?? null;
  },

  fromCode(
    code: number,
  ): MinorBodyKnowledgeStateValue {
    const value = this.fromCodeOrNull(
      code,
    );

    if (
      value === null
    ) {
      throw new RangeError(
        `Unknown MinorBodyKnowledgeState code: ${code}.`,
      );
    }

    return value;
  },

  isKnown(
    state: MinorBodyKnowledgeStateValue,
  ): boolean {
    return state !== EXISTING;
  },
});
