export interface UniverseNavigationEntity {
  readonly universeSeed:
    string;

  readonly generatorVersionCode:
    number;

  /**
   * Decimal representation of the
   * non-negative signed 64-bit galaxy index.
   */
  readonly activeGalaxyIndex:
    string;

  /**
   * Recently visited galaxy indices.
   *
   * Values are decimal representations of
   * non-negative signed 64-bit indices.
   *
   * Order is preserved by persistence.
   * Most recent entry is stored first.
   *
   * Retention/bounding policy can be applied
   * later by the repository layer.
   */
  readonly recentGalaxyIndices:
    readonly string[];

  /**
   * Universe-wide point-7.5 anti-blocking state.
   *
   * This property is deliberately not indexed. Existing V3 navigation rows
   * created before the gameplay integration do not contain it; absence is
   * therefore interpreted as the canonical zero-failure state.
   *
   * Keeping the value on the universe-scoped navigation row avoids a schema
   * migration while still persisting the retry streak across reloads.
   */
  readonly externalGalaxySearchConsecutiveFailures?:
    string;

  /**
   * Number of extragalactic-search opportunities already consumed.
   *
   * V1 earns one non-spendable opportunity per 100 global Discovery Points.
   * Earned opportunities accumulate; therefore the current stock is derived as
   * floor(globalPD / 100) - consumedOpportunities.
   *
   * Existing rows created before this refinement omit the property and are
   * interpreted as zero consumed opportunities, so no IndexedDB schema
   * migration is required.
   */
  readonly externalGalaxySearchConsumedOpportunities?:
    string;

  /**
   * Highest total number of earned extragalactic-search opportunities already
   * announced to the player.
   *
   * This is presentation acknowledgement state only; it never changes the
   * number of available attempts. Persisting it prevents the same unlock toast
   * from reappearing on every reload while still allowing thresholds reached
   * elsewhere to be announced the next time Exploration is opened.
   */
  readonly externalGalaxySearchLastAnnouncedEarnedOpportunities?:
    string;

  readonly updatedAtEpochMs:
    number;
}
