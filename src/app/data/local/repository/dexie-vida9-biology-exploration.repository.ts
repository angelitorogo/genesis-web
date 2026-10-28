import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { VIDA9_REVISION, vida9DigestForRecord, type Vida9BiologyRecord } from '../../../domain/life/vida9-biology-exploration';

/** Single source of truth, independent of pre-VIDA9 revision rows and observations. */
export class DexieVida9BiologyExplorationRepository {
  constructor(private readonly db:GenesisIndexedDb){}
  async ensure(record:Vida9BiologyRecord):Promise<Vida9BiologyRecord>{
    const {digest:claimedDigest,...content}=record;
    if (record.revision!==VIDA9_REVISION || record.epoch!=='CT-0' || record.epochOffsetYears!==0 ||
        record.identity.generatorVersionCode!==3 ||
        vida9DigestForRecord(content)!==claimedDigest)
      throw Error('VIDA.9 rejects invalid or non-deterministic Ground Truth');
    await this.db.openDatabase();
    const {identity:id,bodyStorageKey}=record;
    const key: [string,number,string]=[id.universeSeed,id.generatorVersionCode,bodyStorageKey];
    const same=(row:{digest:string;payloadJson:string})=>{
      if (row.digest!==record.digest || row.payloadJson!==JSON.stringify(record))
        throw Error('VIDA.9 immutable biological record mismatch; no overwrite');
      return JSON.parse(row.payloadJson) as Vida9BiologyRecord;
    };
    try {
      return await this.db.transaction('rw',this.db.privateBiologicalRecordsVIDA9,async()=>{
        const prior=await this.db.privateBiologicalRecordsVIDA9.get(key);
        if(prior)return same(prior);
        await this.db.privateBiologicalRecordsVIDA9.add({universeSeed:id.universeSeed,
          generatorVersionCode:id.generatorVersionCode,bodyStorageKey,
          systemStorageKey:[id.galaxyIndex,id.sectorKey,id.galacticObjectIndex].join('/'),
          revision:record.revision,epochOffsetYears:0,payloadJson:JSON.stringify(record),
          digest:record.digest});
        return record;
      });
    }catch(error){
      if (!(error instanceof Error) || error.name!=='ConstraintError') throw error;
      const prior=await this.db.privateBiologicalRecordsVIDA9.get(key);
      if(!prior)throw error;
      return same(prior);
    }
  }

  /** Reuse a validated CT-0 record before considering a newly projected fiche.
   * An existing immutable record is authoritative: a later adapter may produce
   * a different candidate but must never replace the stored original. get()
   * checks identity, revision and digest, so a damaged row still raises.
   * If a concurrent indexer wins the insert race, read its validated result.
   */
  async getOrInsertPreservingExisting(record:Vida9BiologyRecord):Promise<Vida9BiologyRecord>{
    // Even if a snapshot is already present, never silently accept a malformed candidate.
    const {digest,...content}=record;
    if(record.revision!==VIDA9_REVISION || record.epoch!=='CT-0' ||
        record.epochOffsetYears!==0 || record.identity.generatorVersionCode!==3 ||
        vida9DigestForRecord(content)!==digest)
      throw Error('VIDA.9 rejects invalid or non-deterministic Ground Truth');
    const {universeSeed,generatorVersionCode}=record.identity;
    const stored=await this.get(universeSeed,generatorVersionCode,record.bodyStorageKey);
    if(stored!==null)return stored;
    try{return await this.ensure(record);}
    catch(error){
      // A simultaneous catalogue indexer may insert another *valid* CT-0
      // record first. This single expected race is not a reason to overwrite.
      if(!(error instanceof Error) ||
          error.message!=='VIDA.9 immutable biological record mismatch; no overwrite')throw error;
      const winner=await this.get(universeSeed,generatorVersionCode,record.bodyStorageKey);
      if(winner===null)throw error;
      return winner;
    }
  }

  /** Read the immutable CT-0 snapshot before considering a new calculation.
   * A previously stored, valid record is authoritative for its revision: a
   * catalogue indexer must not re-evaluate it with a different adapter.
   * Corruption is reported, not treated as an empty record to be regenerated.
   */
  async get(seed:string,version:number,bodyStorageKey:string):Promise<Vida9BiologyRecord|null>{
    await this.db.openDatabase();
    const row=await this.db.privateBiologicalRecordsVIDA9.get([seed,version,bodyStorageKey]);
    if(!row)return null;
    let record:Vida9BiologyRecord;
    try { record=JSON.parse(row.payloadJson) as Vida9BiologyRecord; }
    catch { throw Error('VIDA.9 stored biological record is not valid JSON; no overwrite'); }
    if (!record || typeof record!=='object' || !record.identity ||
        record.identity.universeSeed!==seed || record.identity.generatorVersionCode!==version ||
        record.bodyStorageKey!==bodyStorageKey ||
        [record.identity.galaxyIndex,record.identity.sectorKey,record.identity.galacticObjectIndex,
          record.identity.bodyIndex,record.identity.kind,record.identity.moonIndex??'-'].join(':')!==bodyStorageKey ||
        record.revision!==VIDA9_REVISION || record.revealPolicy!=='FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
        record.historicalOriginEpochYears!==null ||
        record.epoch!=='CT-0' || record.epochOffsetYears!==0 ||
        row.universeSeed!==seed || row.generatorVersionCode!==version ||
        row.bodyStorageKey!==bodyStorageKey || row.revision!==VIDA9_REVISION ||
        row.epochOffsetYears!==0 || row.digest!==record.digest ||
        [record.identity.galaxyIndex,record.identity.sectorKey,
          record.identity.galacticObjectIndex].join('/')!==row.systemStorageKey)
      throw Error('VIDA.9 stored biological identity/revision mismatch; no overwrite');
    const {digest,...content}=record;
    if (vida9DigestForRecord(content)!==digest)
      throw Error('VIDA.9 stored biological digest mismatch; no overwrite');
    return record;
  }
}
