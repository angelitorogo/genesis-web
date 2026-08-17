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
 * Read-only point-9.1 dashboard projection for the currently active galaxy.
 *
 * The model deliberately separates:
 * - global Discovery Points;
 * - local galaxyProgressUnits.
 *
 * It contains no generated Ground Truth and no exploration-result data.
 */
export class HomeDashboardModel {

  readonly activeGalaxyDiscoveryState:
    DiscoveryStateValue;

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly activeGalaxyIndex:
      bigint,

    activeGalaxyDiscoveryState:
      DiscoveryStateValue,

    readonly galaxyProgressUnits:
      bigint,

    readonly discoveryPoints:
      bigint,

    readonly activeGalaxyKnownName:
      string | null =
        null,
  ) {
    assertNonNegativeSignedLong(
      activeGalaxyIndex,
      'activeGalaxyIndex',
    );

    assertNonNegativeSignedLong(
      galaxyProgressUnits,
      'galaxyProgressUnits',
    );

    assertNonNegativeSignedLong(
      discoveryPoints,
      'discoveryPoints',
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

    if (
      activeGalaxyKnownName !==
        null &&
      activeGalaxyKnownName
        .trim()
        .length ===
        0
    ) {
      throw new RangeError(
        'activeGalaxyKnownName must be null or non-blank.',
      );
    }

    if (
      canonicalState.code <
        DiscoveryState
          .DISCOVERED
          .code &&
      activeGalaxyKnownName !==
        null
    ) {
      throw new RangeError(
        'A DETECTED active galaxy cannot expose its proper name.',
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
