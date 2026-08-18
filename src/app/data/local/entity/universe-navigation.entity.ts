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

  readonly updatedAtEpochMs:
    number;
}
