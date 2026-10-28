/** Private Ground Truth. Never expose directly to observed/knowledge read models. */
export interface PrivateMicrobialBiosphereVIDA3Entity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly bodyStorageKey: string;
  readonly modelRevision: 'VIDA.3/microbial/v1' | 'VIDA.3/microbial/v2-subsurface' | 'VIDA.3/microbial/v3-aquifer-lunar-surface';
  readonly snapshotJson: string;
  readonly digest: string;
}
