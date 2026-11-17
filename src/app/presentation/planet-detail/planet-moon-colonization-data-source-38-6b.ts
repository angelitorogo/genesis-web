/** 38.6b · Read-only, fail-closed projection of CONFIRMED lunar VIDA.9 rows.
 * No scientific or biological generation on the UI thread; no raw Ground Truth
 * reaches the planet component. A missing row is not evidence of sterility.
 */
import { Injectable } from '@angular/core';
import { GenesisIndexedDb } from '../../data/local/indexed-db/genesis-indexed-db';
import { DexieVida9BiologyExplorationRepository } from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import { VIDA8_REVISION } from '../../domain/life/vida8-technological-colonization';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';

export interface PlanetMoonColonizationRequest386b {
  readonly confirmed: boolean;
  readonly universeSeed: string;
  readonly generatorVersionCode: number;
  readonly galaxyIndex: bigint;
  readonly sectorKey: bigint;
  readonly galacticObjectIndex: bigint;
  readonly bodyIndex: bigint;
  readonly moonIndices: readonly number[];
}

function moonStorageKey(request: PlanetMoonColonizationRequest386b, moonIndex: number): string {
  return [request.galaxyIndex,request.sectorKey,request.galacticObjectIndex,
    request.bodyIndex,'MOON',moonIndex].join(':');
}

/** Invalid content is UNKNOWN, not zero. The repository separately checks the
 * immutable row identity, revision, and full VIDA.9 digest before this guard.
 */
export function verifiedMoonColonyCount386b(
  record: Vida9BiologyRecord | null,
  request: PlanetMoonColonizationRequest386b,
  moonIndex: number,
): number | null {
  if (!request.confirmed || request.generatorVersionCode !== 3 || !record ||
      record.revealPolicy !== 'FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
      record.epoch !== 'CT-0' || record.epochOffsetYears !== 0 ||
      record.identity.kind !== 'MOON' || record.identity.universeSeed !== request.universeSeed ||
      record.identity.generatorVersionCode !== request.generatorVersionCode ||
      record.identity.galaxyIndex !== request.galaxyIndex.toString() ||
      record.identity.sectorKey !== request.sectorKey.toString() ||
      record.identity.galacticObjectIndex !== request.galacticObjectIndex.toString() ||
      record.identity.bodyIndex !== request.bodyIndex.toString() ||
      record.identity.moonIndex !== String(moonIndex) ||
      record.bodyStorageKey !== moonStorageKey(request, moonIndex)) return null;
  const colonization = record.colonization;
  if (!colonization || colonization.revision !== VIDA8_REVISION ||
      colonization.bodyStorageKey !== record.bodyStorageKey ||
      colonization.identity.kind !== 'MOON' ||
      colonization.identity.moonIndex !== record.identity.moonIndex ||
      colonization.identity.universeSeed !== record.identity.universeSeed ||
      colonization.identity.generatorVersionCode !== record.identity.generatorVersionCode ||
      colonization.identity.galaxyIndex !== record.identity.galaxyIndex ||
      colonization.identity.sectorKey !== record.identity.sectorKey ||
      colonization.identity.galacticObjectIndex !== record.identity.galacticObjectIndex ||
      colonization.identity.bodyIndex !== record.identity.bodyIndex ||
      colonization.ecosystemDigest !== record.ecosystem?.digest ||
      colonization.nativeCivilizationDigest !== record.intelligence?.digest ||
      !Array.isArray(colonization.colonies)) return null;
  const colonies = colonization.colonies;
  if (record.colonialPopulationPresent !== (colonies.length > 0) ||
      colonization.colonialPopulationPresent !== (colonies.length > 0) ||
      (colonies.length > 0) !== (colonization.outcome === 'COLONIZED')) return null;
  const identities = new Set<string>();
  for (const colony of colonies) {
    if (!colony || colony.provenance !== 'TECHNOLOGICAL_COLONIZATION' ||
        !colony.id || !colony.settlement?.id || !colony.origin?.sourceBodyStorageKey ||
        colony.origin.sourceBodyStorageKey === record.bodyStorageKey || identities.has(colony.id)) return null;
    identities.add(colony.id);
  }
  return colonies.length;
}

/** The sole database entrypoint. It never reads when the caller is not CONFIRMED.
 * Only indexed known moons of the requested parent body can be consulted.
 */
export async function readPlanetMoonColonies386b(
  database: GenesisIndexedDb,
  request: PlanetMoonColonizationRequest386b,
): Promise<ReadonlyMap<number,number|null>> {
  if (!request.confirmed || request.generatorVersionCode !== 3 ||
      request.galaxyIndex < 0n || request.galacticObjectIndex < 0n ||
      request.bodyIndex < 0n || !request.universeSeed) return new Map();
  const moonIndices = [...new Set(request.moonIndices)].filter(n=>Number.isSafeInteger(n) && n >= 0);
  if (moonIndices.length === 0) return new Map();
  await database.openDatabase();
  const repository = new DexieVida9BiologyExplorationRepository(database);
  const counts = new Map<number,number|null>();
  for (let offset=0;offset<moonIndices.length;offset+=32) {
    const batch = moonIndices.slice(offset,offset+32);
    const keys = batch.map(index => [request.universeSeed,request.generatorVersionCode,
      moonStorageKey(request,index)] as [string,number,string]);
    const rows = await database.privateBiologicalRecordsVIDA9.bulkGet(keys);
    for (let i=0;i<batch.length;i++) {
      const index = batch[i]!;
      if (!rows[i]) { counts.set(index,null); continue; }
      try {
        // Do not bypass the productive repository's identity/digest verification.
        const record = await repository.get(request.universeSeed, request.generatorVersionCode, keys[i]![2]);
        counts.set(index,verifiedMoonColonyCount386b(record,request,index));
      } catch {
        counts.set(index,null);
      }
    }
  }
  return counts;
}

/** 38.bis-a4: canonical persisted CT-0 lunar record, not a fresh physical
 * reconstruction. Used by the moon fiche so it agrees with 38.6b and Archive.
 * Returns null (never a false zero) for missing/corrupt/unauthorized records.
 */
export async function readVerifiedMoonBiology386c(
  database: GenesisIndexedDb,
  request: PlanetMoonColonizationRequest386b,
  moonIndex: number,
): Promise<Vida9BiologyRecord | null> {
  if (!request.confirmed || request.generatorVersionCode !== 3 ||
      !request.universeSeed || request.galaxyIndex < 0n ||
      request.galacticObjectIndex < 0n || request.bodyIndex < 0n ||
      !Number.isSafeInteger(moonIndex) || moonIndex < 0 ||
      !request.moonIndices.includes(moonIndex)) return null;
  try {
    await database.openDatabase();
    const repo = new DexieVida9BiologyExplorationRepository(database);
    const record = await repo.get(request.universeSeed,request.generatorVersionCode,
      moonStorageKey(request,moonIndex));
    return verifiedMoonColonyCount386b(record,request,moonIndex) === null ? null : record;
  } catch {
    return null;
  }
}

@Injectable({providedIn:'root'})
export class PlanetMoonColonizationDataSource386b {
  private readonly database = new GenesisIndexedDb();
  read(request: PlanetMoonColonizationRequest386b): Promise<ReadonlyMap<number,number|null>> {
    return readPlanetMoonColonies386b(this.database,request);
  }
  readVerifiedMoonRecord(request: PlanetMoonColonizationRequest386b,
    moonIndex: number): Promise<Vida9BiologyRecord | null> {
    return readVerifiedMoonBiology386c(this.database,request,moonIndex);
  }
}
