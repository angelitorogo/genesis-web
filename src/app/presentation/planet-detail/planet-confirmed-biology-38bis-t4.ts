/** 38.bis-T4: authoritative VIDA.9 planet reader for a CONFIRMED system.
 * Parity with the already established lunar reader (38.bis-a4).
 * A missing or damaged record is UNKNOWN, never proof of zero colonies.
 * This layer does not materialize or mutate private scientific data.
 */
import {Injectable} from '@angular/core';
import {GenesisIndexedDb} from '../../data/local/indexed-db/genesis-indexed-db';
import {DexieVida9BiologyExplorationRepository} from '../../data/local/repository/dexie-vida9-biology-exploration.repository';
import {VIDA8_REVISION} from '../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../domain/life/vida9-biology-exploration';

export interface PlanetConfirmedBiologyRequest38BisT4 {
  readonly confirmed:boolean;
  readonly universeSeed:string;
  readonly generatorVersionCode:number;
  readonly galaxyIndex:bigint;
  readonly sectorKey:bigint;
  readonly galacticObjectIndex:bigint;
  readonly bodyIndex:bigint;
}

export function planetBiologyStorageKey38BisT4(request:PlanetConfirmedBiologyRequest38BisT4):string {
  return [request.galaxyIndex,request.sectorKey,request.galacticObjectIndex,
    request.bodyIndex,'PLANET','-'].join(':');
}

/** Repository.get() verifies the complete VIDA.9 identity/revision/digest.
 * This additional guard ensures the colonial chain is internally coherent,
 * including the correct target planet and colony provenance. */
export function verifiedPlanetBiology38BisT4(
  record:Vida9BiologyRecord|null, request:PlanetConfirmedBiologyRequest38BisT4,
):Vida9BiologyRecord|null {
  if(!request.confirmed || request.generatorVersionCode!==3 || !request.universeSeed ||
    request.galaxyIndex<0n || request.galacticObjectIndex<0n || request.bodyIndex<0n || !record ||
    record.revealPolicy!=='FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
    record.epoch!=='CT-0' || record.epochOffsetYears!==0 || record.historicalOriginEpochYears!==null ||
    record.identity.kind!=='PLANET' || record.identity.moonIndex!==null ||
    record.identity.universeSeed!==request.universeSeed ||
    record.identity.generatorVersionCode!==request.generatorVersionCode ||
    record.identity.galaxyIndex!==request.galaxyIndex.toString() ||
    record.identity.sectorKey!==request.sectorKey.toString() ||
    record.identity.galacticObjectIndex!==request.galacticObjectIndex.toString() ||
    record.identity.bodyIndex!==request.bodyIndex.toString() ||
    record.bodyStorageKey!==planetBiologyStorageKey38BisT4(request)) return null;
  const c=record.colonization;
  if(!c || c.revision!==VIDA8_REVISION || c.bodyStorageKey!==record.bodyStorageKey ||
    c.identity.kind!=='PLANET' || c.identity.moonIndex!==null ||
    c.identity.universeSeed!==record.identity.universeSeed ||
    c.identity.generatorVersionCode!==record.identity.generatorVersionCode ||
    c.identity.galaxyIndex!==record.identity.galaxyIndex ||
    c.identity.sectorKey!==record.identity.sectorKey ||
    c.identity.galacticObjectIndex!==record.identity.galacticObjectIndex ||
    c.identity.bodyIndex!==record.identity.bodyIndex ||
    c.ecosystemDigest!==record.ecosystem.digest ||
    c.nativeCivilizationDigest!==record.intelligence.digest ||
    !Array.isArray(c.colonies) ||
    record.colonialPopulationPresent!==(c.colonies.length>0) ||
    c.colonialPopulationPresent!==(c.colonies.length>0) ||
    (c.outcome==='COLONIZED')!==(c.colonies.length>0))return null;
  const seen=new Set<string>();
  for(const colony of c.colonies){
    if(!colony || colony.provenance!=='TECHNOLOGICAL_COLONIZATION' ||
       !colony.id || seen.has(colony.id) || !colony.settlement?.id ||
       !colony.origin?.sourceBodyStorageKey ||
       colony.origin.sourceBodyStorageKey===record.bodyStorageKey ||
       !['ADVANCED','VERY_ADVANCED'].includes(colony.origin.tier) ||
       !['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'].includes(colony.settlement.habitatTechnology) ||
       !['OUTPOST','SETTLEMENT','CITY','NETWORK'].includes(colony.settlement.populationBand))return null;
    seen.add(colony.id);
  }
  return record;
}

export async function readVerifiedPlanetBiology38BisT4(
  database:GenesisIndexedDb,request:PlanetConfirmedBiologyRequest38BisT4,
):Promise<Vida9BiologyRecord|null>{
  // Fail closed before even opening IndexedDB for an unauthorized locator.
  if(!request.confirmed || request.generatorVersionCode!==3 || !request.universeSeed ||
     request.galaxyIndex<0n || request.galacticObjectIndex<0n || request.bodyIndex<0n)return null;
  try {
    const repo=new DexieVida9BiologyExplorationRepository(database);
    const record=await repo.get(request.universeSeed,request.generatorVersionCode,
      planetBiologyStorageKey38BisT4(request));
    return verifiedPlanetBiology38BisT4(record,request);
  } catch {
    // A malformed row is *not* a verified barren planet. Never regenerate it here.
    return null;
  }
}

@Injectable({providedIn:'root'})
export class PlanetConfirmedBiologyDataSource38BisT4 {
  private readonly database=new GenesisIndexedDb();
  read(request:PlanetConfirmedBiologyRequest38BisT4):Promise<Vida9BiologyRecord|null>{
    return readVerifiedPlanetBiology38BisT4(this.database,request);
  }
}
