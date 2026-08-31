const DISJOINT = Object.freeze({
  name: 'DISJOINT',
  code: 1,
} as const);

const RADIAL_CROSSING = Object.freeze({
  name: 'RADIAL_CROSSING',
  code: 2,
} as const);

const APPROACH_CORRIDOR = Object.freeze({
  name: 'APPROACH_CORRIDOR',
  code: 3,
} as const);

export type MinorBodyOrbitProximityRegimeValue =
  | typeof DISJOINT
  | typeof RADIAL_CROSSING
  | typeof APPROACH_CORRIDOR;

const VALUES:
  readonly MinorBodyOrbitProximityRegimeValue[] =
  Object.freeze([
    DISJOINT,
    RADIAL_CROSSING,
    APPROACH_CORRIDOR,
  ]);

/**
 * Point-23.3 geometry-only relationship between a minor-body path and one
 * planet/moon target.
 *
 * RADIAL_CROSSING only means that the allowed stellar-distance intervals
 * overlap. APPROACH_CORRIDOR is stronger: the two shared-focus orbital paths
 * are close enough at their mutual-node geometry to enter the target corridor.
 * It is still not a time-resolved close encounter (23.6) and not an impact
 * probability (23.7-23.8).
 */
export const MinorBodyOrbitProximityRegime =
  Object.freeze({
    DISJOINT,
    RADIAL_CROSSING,
    APPROACH_CORRIDOR,
    values: VALUES,

    fromCodeOrNull(
      code:
        number,
    ): MinorBodyOrbitProximityRegimeValue | null {
      return VALUES.find(
        value =>
          value.code ===
          code,
      ) ?? null;
    },

    fromCode(
      code:
        number,
    ): MinorBodyOrbitProximityRegimeValue {
      const value =
        this.fromCodeOrNull(
          code,
        );

      if (
        value ===
        null
      ) {
        throw new RangeError(
          `Unknown MinorBodyOrbitProximityRegime code: ${code}.`,
        );
      }

      return value;
    },
  });
