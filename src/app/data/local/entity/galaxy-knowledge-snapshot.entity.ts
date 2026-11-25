export interface GalaxyKnowledgeSnapshotEntity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly galaxyIndex: string;
  readonly scientificModelVersion: number;
  readonly knowledgeRevision: string;

  /**
   * Derived read-model fragments are intentionally optional. One expensive
   * aggregate view may warm its fragment without forcing all other views to
   * regenerate in the same navigation.
   */
  readonly statisticsJson?: string;
  readonly explorationTelemetryJson?: string;
  /** CACHE-GAL.3: persisted, confirmed-only scientific projection. The record
   * is read-model data, never private Ground Truth nor an observation grant. */
  readonly confirmedScientificTelemetryJson?: string;
  /** Includes galaxy knowledge revision and its persisted DiscoveryState. */
  readonly confirmedScientificTelemetryRevision?: string;
  readonly waterWorldIndexJson?: string;
  readonly waterMoonIndexJson?: string;
  readonly planetMoonCatalogJson?: string;
  readonly minorBodyCatalogJson?: string;
  /** Materialized *observed* civilizational knowledge from CONFIRMED systems.
   * Optional for backwards-compatible V10 games; not Ground Truth. */
  readonly civilizationKnowledgeJson?: string;
  /** Revision of the canonical set of confirmed systems. */
  readonly civilizationKnowledgeRevision?: string;
  /** CACHE-CAT.1: bounded observed catalogue pages, never Ground Truth. */
  readonly catalogPagesJson?: string;

  readonly updatedAtEpochMs: number;
}
