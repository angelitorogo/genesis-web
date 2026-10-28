/** Private Ground Truth. VIDA.4 never appears in observed knowledge tables. */
export interface PrivateEcologicalBiosphereVIDA4Entity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly bodyStorageKey: string;
  readonly modelRevision: 'VIDA.4/ecology/v1' | 'VIDA.4/ecology/v2-advanced-calibration' | 'VIDA.5c/advanced-biosphere/v1' | 'VIDA.6/ecosystems-species/v1' | 'VIDA.7/intelligence-civilizations/v1' | 'VIDA.8/technological-colonization/v1';
  readonly snapshotJson: string;
  readonly digest: string;
}
