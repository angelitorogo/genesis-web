const ELLIPTIC = Object.freeze({
  name: 'ELLIPTIC',
  code: 1,
} as const);

const HYPERBOLIC = Object.freeze({
  name: 'HYPERBOLIC',
  code: 2,
} as const);

export type MinorBodyOrbitConicRegimeValue =
  | typeof ELLIPTIC
  | typeof HYPERBOLIC;

const VALUES: readonly MinorBodyOrbitConicRegimeValue[] =
  Object.freeze([
    ELLIPTIC,
    HYPERBOLIC,
  ]);

/**
 * Point-23.2 common conic family for all individually materialized minor bodies.
 *
 * Phase 22 currently contributes bound ellipses (asteroids, comets, TNOs and
 * captured extrasolar objects) plus explicitly unbound hyperbolae (22.8
 * interstellar visitors). Parabolic trajectories are intentionally absent: no
 * phase-22 Ground Truth object is frozen with exactly e = 1.
 */
export const MinorBodyOrbitConicRegime =
  Object.freeze({
    ELLIPTIC,
    HYPERBOLIC,
    values: VALUES,

    fromCodeOrNull(
      code: number,
    ): MinorBodyOrbitConicRegimeValue | null {
      return VALUES.find(
        value => value.code === code,
      ) ?? null;
    },

    fromCode(
      code: number,
    ): MinorBodyOrbitConicRegimeValue {
      const value =
        this.fromCodeOrNull(
          code,
        );

      if (
        value === null
      ) {
        throw new RangeError(
          `Unknown MinorBodyOrbitConicRegime code: ${code}.`,
        );
      }

      return value;
    },
  });
