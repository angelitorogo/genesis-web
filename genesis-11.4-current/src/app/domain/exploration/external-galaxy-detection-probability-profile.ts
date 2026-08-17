const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Progression tier that determines the base probability of detecting an
 * external galaxy in a future search.
 *
 * Point 7.4 evaluates probability only. It does not execute a search.
 */
export enum ExternalGalaxyDetectionProbabilityTier {
  BASELINE =
    'BASELINE',

  ENHANCED =
    'ENHANCED',

  ADVANCED =
    'ADVANCED',

  DEEP =
    'DEEP',

  FRONTIER =
    'FRONTIER',
}

/**
 * Immutable V1 probability profile for a future external-galaxy search.
 *
 * globalDiscoveryPoints are the GLOBAL Discovery Points introduced by 7.3.
 * galaxyProgressUnits deliberately do not participate in this contract.
 *
 * probabilityPerFutureSearch is a base probability. Point 7.4 performs no
 * random draw and therefore cannot itself detect or unlock a galaxy.
 */
export class ExternalGalaxyDetectionProbabilityProfile {

  constructor(
    readonly globalDiscoveryPoints:
      bigint,

    readonly tier:
      ExternalGalaxyDetectionProbabilityTier,

    readonly probabilityPerFutureSearch:
      number,
  ) {
    if (
      globalDiscoveryPoints <
        0n ||
      globalDiscoveryPoints >
        SIGNED_LONG_MAX
    ) {
      throw new RangeError(
        `globalDiscoveryPoints must be a non-negative signed Long: ${globalDiscoveryPoints}.`,
      );
    }

    if (
      !Object.values(
        ExternalGalaxyDetectionProbabilityTier,
      ).includes(
        tier,
      )
    ) {
      throw new RangeError(
        `Unknown ExternalGalaxyDetectionProbabilityTier: ${String(tier)}.`,
      );
    }

    if (
      !Number.isFinite(
        probabilityPerFutureSearch,
      ) ||
      probabilityPerFutureSearch <
        0.0 ||
      probabilityPerFutureSearch >
        1.0
    ) {
      throw new RangeError(
        `probabilityPerFutureSearch must be finite and in range [0, 1]: ${probabilityPerFutureSearch}.`,
      );
    }
  }
}
