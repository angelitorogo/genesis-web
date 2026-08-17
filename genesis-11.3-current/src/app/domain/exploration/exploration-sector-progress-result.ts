import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../discovery/discovery-state';

const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Safe point-9.5 projection of one persisted scan progression.
 *
 * It exposes only observed/progression data. It deliberately contains no
 * hidden procedural content, physical properties, reward reasons inferred
 * from Ground Truth or transient persistence identity.
 */
export class ExplorationSectorProgressResult {

  readonly sectorState:
    DiscoveryStateValue;

  readonly resultState:
    DiscoveryStateValue | null;

  constructor(
    readonly awardedDiscoveryPoints:
      number,

    readonly globalDiscoveryPointsBefore:
      bigint,

    readonly globalDiscoveryPointsAfter:
      bigint,

    readonly galaxyProgressUnitsBefore:
      bigint,

    readonly galaxyProgressUnitsAfter:
      bigint,

    sectorState:
      DiscoveryStateValue,

    resultState:
      DiscoveryStateValue | null,
  ) {
    if (
      !Number.isSafeInteger(
        awardedDiscoveryPoints,
      ) ||
      awardedDiscoveryPoints <
        0
    ) {
      throw new RangeError(
        'awardedDiscoveryPoints must be a non-negative safe integer.',
      );
    }

    assertNonNegativeSignedLong(
      globalDiscoveryPointsBefore,
      'globalDiscoveryPointsBefore',
    );

    assertNonNegativeSignedLong(
      globalDiscoveryPointsAfter,
      'globalDiscoveryPointsAfter',
    );

    assertNonNegativeSignedLong(
      galaxyProgressUnitsBefore,
      'galaxyProgressUnitsBefore',
    );

    assertNonNegativeSignedLong(
      galaxyProgressUnitsAfter,
      'galaxyProgressUnitsAfter',
    );

    if (
      globalDiscoveryPointsAfter !==
      globalDiscoveryPointsBefore +
        BigInt(
          awardedDiscoveryPoints,
        )
    ) {
      throw new RangeError(
        'globalDiscoveryPointsAfter must equal globalDiscoveryPointsBefore plus awardedDiscoveryPoints.',
      );
    }

    if (
      galaxyProgressUnitsAfter <
      galaxyProgressUnitsBefore
    ) {
      throw new RangeError(
        'galaxyProgressUnitsAfter cannot regress.',
      );
    }

    const canonicalSectorState =
      DiscoveryState
        .fromCode(
          sectorState.code,
        );

    if (
      !DiscoveryState.isKnown(
        canonicalSectorState,
      )
    ) {
      throw new RangeError(
        'sectorState must be a known DiscoveryState.',
      );
    }

    this.sectorState =
      canonicalSectorState;

    if (
      resultState ===
      null
    ) {
      this.resultState =
        null;
    } else {
      const canonicalResultState =
        DiscoveryState
          .fromCode(
            resultState.code,
          );

      if (
        !DiscoveryState.isKnown(
          canonicalResultState,
        )
      ) {
        throw new RangeError(
          'resultState must be null or a known DiscoveryState.',
        );
      }

      this.resultState =
        canonicalResultState;
    }
  }

  get didAwardDiscoveryPoints():
    boolean {

    return this
      .awardedDiscoveryPoints >
      0;
  }

  get galaxyProgressDelta():
    bigint {

    return this
      .galaxyProgressUnitsAfter -
      this
        .galaxyProgressUnitsBefore;
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
