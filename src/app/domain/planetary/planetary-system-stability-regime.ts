/**
 * Point-18.5 basic orbital-stability result for one mature planetary system.
 *
 * EMPTY means there is no mature planet to assess. DYNAMICALLY_EXCLUDED keeps
 * the explicit point-18.2 multiple-star exclusion distinct from an unstable
 * orbit set that actually exists.
 */
export enum PlanetarySystemStabilityRegime {
  EMPTY =
    'EMPTY',

  DYNAMICALLY_EXCLUDED =
    'DYNAMICALLY_EXCLUDED',

  STABLE =
    'STABLE',

  MARGINAL =
    'MARGINAL',

  UNSTABLE =
    'UNSTABLE',
}
