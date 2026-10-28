/** Private, versioned microbial identity and snapshot contract for VIDA.3. */
export const VIDA3_MODEL_REVISION = 'VIDA.3/microbial/v3-aquifer-lunar-surface' as const;
export const VIDA3_LIFE_PROBABILITY = 0.2 as const;
/** Keep the v1 LIFE_PRESENT draw stable for bodies that remain plausible. */
export const VIDA3_LIFE_ROLL_NAMESPACE = 'VIDA.3/microbial/v1' as const;
export type Vida3BodyKind = 'PLANET' | 'MOON';

export interface Vida3BodyIdentity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly kind: Vida3BodyKind;
  readonly galaxyIndex: string;
  readonly sectorKey: string;
  readonly galacticObjectIndex: string;
  readonly bodyIndex: string;
  readonly moonIndex: string | null;
}
export interface Vida3MicrobialSnapshot {
  readonly revision: typeof VIDA3_MODEL_REVISION;
  readonly identity: Vida3BodyIdentity;
  readonly bodyStorageKey: string;
  readonly plausibility: 'PLAUSIBLE' | 'NOT_PLAUSIBLE' | 'INDETERMINATE';
  readonly selectedRoute: 'SURFACE' | 'SUBSURFACE' | null;
  /** Keep sheltered moon seepages separate from open-air complex-life habitats. */
  readonly habitat: 'SURFACE_OPEN' | 'SURFACE_PROTECTED_SEEP' | 'SUBSURFACE' | null;
  readonly lifePresent: boolean;
  readonly biology: 'MICROBIAL' | 'NONE';
  readonly biosphereId: string | null;
  readonly digest: string;
}

