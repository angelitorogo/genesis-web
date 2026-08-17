import {
  GalaxyExplorationProgress,
} from './galaxy-exploration-progress';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Read-only exploration overview that keeps the two progression scopes
 * explicit:
 *
 * - globalDiscoveryPoints: accumulated global PD for the universe;
 * - galaxyProgress: local knowledge-derived progress for one galaxy.
 *
 * The two values deliberately use different semantics and must not be
 * conflated.
 */
export class ExplorationProgressOverview {

  constructor(
    readonly globalDiscoveryPoints:
      bigint,

    readonly galaxyProgress:
      GalaxyExplorationProgress,
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
  }
}
