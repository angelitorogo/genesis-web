/** VIDA.9: versioned CT-0 Ground Truth. Revelation is a PLAYER KNOWLEDGE policy,
 * not a mutation of this biological world state. */
import type { Vida3BodyIdentity } from './procedural-microbial-vida3';
import type { Vida6EcosystemSnapshot } from './vida6-ecosystems-species';
import type { Vida7IntelligenceCivilizationSnapshot } from './vida7-intelligence-civilizations';
import type { Vida8ColonizationSnapshot } from './vida8-technological-colonization';

export const VIDA9_REVISION = 'VIDA.9/biology-exploration/v1' as const;
export const VIDA9_REVEAL_POLICY = 'FULL_SYSTEM_REVEAL_ON_CONFIRMED' as const;
export interface Vida9BiologyRecord {
  readonly revision: typeof VIDA9_REVISION;
  readonly identity: Vida3BodyIdentity;
  readonly bodyStorageKey: string;
  /** CT-0 = present snapshot, never an invented date of evolutionary origin. */
  readonly epoch: 'CT-0';
  readonly epochOffsetYears: 0;
  readonly revealPolicy: typeof VIDA9_REVEAL_POLICY;
  readonly ecosystem: Vida6EcosystemSnapshot;
  readonly intelligence: Vida7IntelligenceCivilizationSnapshot;
  readonly colonization: Vida8ColonizationSnapshot;
  readonly nativeLifePresent: boolean;
  readonly nativeIntelligencePresent: boolean;
  readonly nativeCivilizationPresent: boolean;
  readonly introducedLifePresent: boolean;
  readonly colonialPopulationPresent: boolean;
  /** Separates the biological CURRENT state from historical events not dated by VIDA.3–8. */
  readonly historicalOriginEpochYears: null;
  readonly digest: string;
}
export interface Vida9BiologyStoredEntity {
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly bodyStorageKey: string;
  readonly systemStorageKey: string;
  readonly revision: typeof VIDA9_REVISION;
  readonly epochOffsetYears: 0;
  readonly payloadJson: string;
  readonly digest: string;
}

/** Stable content fingerprint; checksum detects incompatible saved revisions on reload. */
export function vida9DigestForRecord(data:Omit<Vida9BiologyRecord,'digest'>):string {
  let h=2166136261;
  const serialized=JSON.stringify(data);
  for(let i=0;i<serialized.length;i++)h=Math.imul(h^serialized.charCodeAt(i),16777619)>>>0;
  return h.toString(16).padStart(8,'0').toUpperCase();
}
