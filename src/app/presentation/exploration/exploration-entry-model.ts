import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GalaxyLocator,
} from '../../domain/generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Point-9.2 read-only entry context for the real exploration flow.
 *
 * It deliberately contains only the identity of the active universe/galaxy
 * and the observed knowledge state of that galaxy.
 *
 * It contains no:
 * - sector selection;
 * - scan;
 * - signal/anomaly;
 * - preliminary classification;
 * - result;
 * - reward;
 * - Ground Truth.
 */
export class ExplorationEntryModel {

  readonly activeGalaxyDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly activeGalaxyIndex:
      bigint,

    activeGalaxyDiscoveryState:
      DiscoveryStateValue,
  ) {
    assertNonNegativeSignedLong(
      activeGalaxyIndex,
      'activeGalaxyIndex',
    );

    const canonicalState =
      DiscoveryState
        .fromCode(
          activeGalaxyDiscoveryState
            .code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalState,
      )
    ) {
      throw new RangeError(
        'activeGalaxyDiscoveryState must be >= DETECTED.',
      );
    }

    this.activeGalaxyDiscoveryState =
      canonicalState;
  }

  get activeGalaxyLocator():
    GalaxyLocator {

    return new GalaxyLocator(
      this
        .activeGalaxyIndex,
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
    typeof value !==
      'bigint' ||
    value <
      0n ||
    value >
      SIGNED_LONG_MAX
  ) {
    throw new RangeError(
      `${propertyName} must be a non-negative signed Long: ${String(value)}.`,
    );
  }
}
