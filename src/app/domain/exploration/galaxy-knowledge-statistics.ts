const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

export interface GalaxyKnowledgeTargetCounts {
  readonly sectors:
    bigint;

  readonly galacticObjects:
    bigint;

  readonly systems:
    bigint;

  readonly bodies:
    bigint;

  readonly civilizations:
    bigint;
}

export interface GalaxyKnowledgeStateCounts {
  readonly detected:
    bigint;

  readonly discovered:
    bigint;

  readonly visited:
    bigint;

  readonly catalogued:
    bigint;

  readonly confirmed:
    bigint;
}

/**
 * Point-11.4 read-only statistics for one already-known galaxy.
 *
 * Every value is derived exclusively from persisted KnownDiscovery records:
 *
 * - progressUnits reuse the frozen point-7.3 structural progress formula;
 * - knownRecords includes exactly one GalaxyLocator for the requested galaxy;
 * - targetCounts classify only records inside that galaxy;
 * - stateCounts preserve the full global DiscoveryState precision.
 *
 * This model deliberately has no completion percentage. GENESIS does not
 * materialize hidden procedural content merely to invent a denominator.
 *
 * progressUnits are NOT Discovery Points and are not spendable.
 */
export class GalaxyKnowledgeStatistics {

  readonly targetCounts:
    Readonly<
      GalaxyKnowledgeTargetCounts
    >;

  readonly stateCounts:
    Readonly<
      GalaxyKnowledgeStateCounts
    >;

  constructor(
    readonly galaxyIndex:
      bigint,

    readonly progressUnits:
      bigint,

    readonly knownRecords:
      bigint,

    targetCounts:
      GalaxyKnowledgeTargetCounts,

    stateCounts:
      GalaxyKnowledgeStateCounts,
  ) {
    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    assertNonNegativeSignedLong(
      progressUnits,
      'progressUnits',
    );

    assertNonNegativeSignedLong(
      knownRecords,
      'knownRecords',
    );

    if (
      knownRecords <
      1n
    ) {
      throw new RangeError(
        'knownRecords must include the known GalaxyLocator itself.',
      );
    }

    const frozenTargetCounts =
      Object.freeze({
        sectors:
          canonicalCount(
            targetCounts
              .sectors,
            'targetCounts.sectors',
          ),

        galacticObjects:
          canonicalCount(
            targetCounts
              .galacticObjects,
            'targetCounts.galacticObjects',
          ),

        systems:
          canonicalCount(
            targetCounts
              .systems,
            'targetCounts.systems',
          ),

        bodies:
          canonicalCount(
            targetCounts
              .bodies,
            'targetCounts.bodies',
          ),

        civilizations:
          canonicalCount(
            targetCounts
              .civilizations,
            'targetCounts.civilizations',
          ),
      });

    const categorizedRecords =
      1n +
      frozenTargetCounts
        .sectors +
      frozenTargetCounts
        .galacticObjects +
      frozenTargetCounts
        .systems +
      frozenTargetCounts
        .bodies +
      frozenTargetCounts
        .civilizations;

    if (
      categorizedRecords !==
      knownRecords
    ) {
      throw new RangeError(
        'knownRecords must equal the GalaxyLocator plus every categorized internal record.',
      );
    }

    const frozenStateCounts =
      Object.freeze({
        detected:
          canonicalCount(
            stateCounts
              .detected,
            'stateCounts.detected',
          ),

        discovered:
          canonicalCount(
            stateCounts
              .discovered,
            'stateCounts.discovered',
          ),

        visited:
          canonicalCount(
            stateCounts
              .visited,
            'stateCounts.visited',
          ),

        catalogued:
          canonicalCount(
            stateCounts
              .catalogued,
            'stateCounts.catalogued',
          ),

        confirmed:
          canonicalCount(
            stateCounts
              .confirmed,
            'stateCounts.confirmed',
          ),
      });

    const stateRecordTotal =
      frozenStateCounts
        .detected +
      frozenStateCounts
        .discovered +
      frozenStateCounts
        .visited +
      frozenStateCounts
        .catalogued +
      frozenStateCounts
        .confirmed;

    if (
      stateRecordTotal !==
      knownRecords
    ) {
      throw new RangeError(
        'stateCounts must classify every known record exactly once.',
      );
    }

    this.targetCounts =
      frozenTargetCounts;

    this.stateCounts =
      frozenStateCounts;
  }

  get internalKnownRecords():
    bigint {

    return (
      this.knownRecords -
      1n
    );
  }
}

function canonicalCount(
  value:
    bigint,

  propertyName:
    string,
): bigint {

  assertNonNegativeSignedLong(
    value,
    propertyName,
  );

  return value;
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
