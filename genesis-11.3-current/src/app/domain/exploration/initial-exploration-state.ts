import {
  DiscoveryState,
} from '../discovery/discovery-state';

import {
  type ProceduralLocator,
} from '../generation/procedural-locator';

const SIGNED_LONG_MAX =
  (1n << 63n) -
  1n;

/**
 * Type of a canonical DiscoveryState value.
 *
 * DiscoveryState itself is a runtime value object in GENESIS Web,
 * so it must not be used directly as a TypeScript type.
 */
export type InitialExplorationDiscoveryState =
  | typeof DiscoveryState.UNKNOWN
  | typeof DiscoveryState.DETECTED
  | typeof DiscoveryState.DISCOVERED
  | typeof DiscoveryState.VISITED
  | typeof DiscoveryState.CATALOGUED
  | typeof DiscoveryState.CONFIRMED;

/**
 * Initial observed-knowledge and progression state of a GENESIS universe.
 *
 * UNKNOWN procedural targets are represented by absence from
 * knownDiscoveries.
 *
 * This state belongs to observed knowledge and progression.
 * It does not contain procedural Ground Truth.
 */
export class InitialExplorationState {

  readonly knownDiscoveries:
    ReadonlyMap<
      ProceduralLocator,
      InitialExplorationDiscoveryState
    >;

  constructor(
    readonly activeGalaxyIndex:
      bigint,

    readonly discoveryPoints:
      bigint,

    knownDiscoveries:
      ReadonlyMap<
        ProceduralLocator,
        InitialExplorationDiscoveryState
      >,
  ) {
    assertNonNegativeSignedLong(
      activeGalaxyIndex,
      'activeGalaxyIndex',
    );

    assertNonNegativeSignedLong(
      discoveryPoints,
      'discoveryPoints',
    );

    for (
      const discoveryState
      of knownDiscoveries.values()
    ) {
      if (
        discoveryState ===
        DiscoveryState.UNKNOWN
      ) {
        throw new RangeError(
          'knownDiscoveries must not materialize DiscoveryState.UNKNOWN.',
        );
      }
    }

    this.knownDiscoveries =
      new Map<
        ProceduralLocator,
        InitialExplorationDiscoveryState
      >(
        knownDiscoveries,
      );
  }
}

function assertNonNegativeSignedLong(
  value:
    bigint,

  propertyName:
    string,
): void {

  if (
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${value}.`,
    );
  }
}