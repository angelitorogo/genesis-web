const ASTEROID = Object.freeze({
  name: 'ASTEROID',
  code: 1,
} as const);

const COMET = Object.freeze({
  name: 'COMET',
  code: 2,
} as const);

const TRANS_NEPTUNIAN_OBJECT = Object.freeze({
  name: 'TRANS_NEPTUNIAN_OBJECT',
  code: 3,
} as const);

const INTERSTELLAR_OBJECT = Object.freeze({
  name: 'INTERSTELLAR_OBJECT',
  code: 4,
} as const);

const CAPTURED_EXTRASOLAR_OBJECT = Object.freeze({
  name: 'CAPTURED_EXTRASOLAR_OBJECT',
  code: 5,
} as const);

export type MinorBodyKindValue =
  | typeof ASTEROID
  | typeof COMET
  | typeof TRANS_NEPTUNIAN_OBJECT
  | typeof INTERSTELLAR_OBJECT
  | typeof CAPTURED_EXTRASOLAR_OBJECT;

const VALUES: readonly MinorBodyKindValue[] = Object.freeze([
  ASTEROID,
  COMET,
  TRANS_NEPTUNIAN_OBJECT,
  INTERSTELLAR_OBJECT,
  CAPTURED_EXTRASOLAR_OBJECT,
]);

/**
 * Point-22.10 minor-body family discriminator.
 *
 * This is intentionally separate from the historical persisted
 * DiscoveryTargetType ABI. Phase-22 objects use their already-frozen 128-bit
 * proceduralId as the individual identity inside this dedicated knowledge
 * projection instead of widening ProceduralLocator/IndexedDB contracts.
 */
export const MinorBodyKind = Object.freeze({
  ASTEROID,
  COMET,
  TRANS_NEPTUNIAN_OBJECT,
  INTERSTELLAR_OBJECT,
  CAPTURED_EXTRASOLAR_OBJECT,
  values: VALUES,

  fromCodeOrNull(
    code: number,
  ): MinorBodyKindValue | null {
    return VALUES.find(
      value => value.code === code,
    ) ?? null;
  },

  fromCode(
    code: number,
  ): MinorBodyKindValue {
    const value = this.fromCodeOrNull(
      code,
    );

    if (
      value === null
    ) {
      throw new RangeError(
        `Unknown MinorBodyKind code: ${code}.`,
      );
    }

    return value;
  },
});
