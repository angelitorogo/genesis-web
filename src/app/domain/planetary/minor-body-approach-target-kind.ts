const PLANET = Object.freeze({
  name: 'PLANET',
  code: 1,
} as const);

const MOON = Object.freeze({
  name: 'MOON',
  code: 2,
} as const);

export type MinorBodyApproachTargetKindValue =
  | typeof PLANET
  | typeof MOON;

const VALUES:
  readonly MinorBodyApproachTargetKindValue[] =
  Object.freeze([
    PLANET,
    MOON,
  ]);

/**
 * Point-23.3 target family for geometry-only minor-body proximity analysis.
 *
 * PLANET targets use the planet's heliocentric/circumbinary osculating orbit
 * and a Hill-scale approach corridor. MOON targets deliberately use the host
 * planet orbit plus the relevant moon's planetocentric orbital extent because
 * point 21.3 does not freeze a full heliocentric node/periapsis orientation for
 * moons. That distinction prevents false precision before later encounter work.
 */
export const MinorBodyApproachTargetKind =
  Object.freeze({
    PLANET,
    MOON,
    values: VALUES,

    fromCodeOrNull(
      code:
        number,
    ): MinorBodyApproachTargetKindValue | null {
      return VALUES.find(
        value =>
          value.code ===
          code,
      ) ?? null;
    },

    fromCode(
      code:
        number,
    ): MinorBodyApproachTargetKindValue {
      const value =
        this.fromCodeOrNull(
          code,
        );

      if (
        value ===
        null
      ) {
        throw new RangeError(
          `Unknown MinorBodyApproachTargetKind code: ${code}.`,
        );
      }

      return value;
    },
  });
