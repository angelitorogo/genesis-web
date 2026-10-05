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
  readonly waterWorldIndexJson?: string;
  readonly waterMoonIndexJson?: string;
  readonly planetMoonCatalogJson?: string;
  readonly minorBodyCatalogJson?: string;

  readonly updatedAtEpochMs: number;
}
