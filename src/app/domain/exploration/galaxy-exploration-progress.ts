const SIGNED_LONG_MAX =
  9_223_372_036_854_775_807n;

/**
 * Local exploration progress for one galaxy.
 *
 * galaxyProgressUnits are NOT Discovery Points:
 *
 * - they are not spendable;
 * - they are not a global currency;
 * - they are derived from observed knowledge already recorded for this galaxy;
 * - point 7.4 and later global-threshold mechanics must use global Discovery
 *   Points instead.
 */
export class GalaxyExplorationProgress {

  constructor(
    readonly galaxyIndex:
      bigint,

    readonly galaxyProgressUnits:
      bigint,
  ) {
    assertNonNegativeSignedLong(
      galaxyIndex,
      'galaxyIndex',
    );

    assertNonNegativeSignedLong(
      galaxyProgressUnits,
      'galaxyProgressUnits',
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
