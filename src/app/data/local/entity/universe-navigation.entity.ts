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

  readonly updatedAtEpochMs:
    number;
}