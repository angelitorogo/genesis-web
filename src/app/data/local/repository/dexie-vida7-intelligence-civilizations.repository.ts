import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { VIDA7_REVISION, type Vida7IntelligenceCivilizationSnapshot } from
  '../../../domain/life/vida7-intelligence-civilizations';

/** Inmutable y versionado sobre V9, sin migracion ni alteracion de conocimiento observado. */
export class DexieVida7IntelligenceCivilizationsRepository {
  constructor(private readonly db: GenesisIndexedDb) {}

  async ensure(snapshot: Vida7IntelligenceCivilizationSnapshot):
    Promise<Vida7IntelligenceCivilizationSnapshot> {
    if (snapshot.revision!==VIDA7_REVISION || snapshot.identity.generatorVersionCode!==3 ||
        snapshot.civilizationPresent!==Boolean(snapshot.civilization) ||
        snapshot.intelligencePresent!==Boolean(snapshot.intelligentSpecies) ||
        (snapshot.civilizationPresent && !snapshot.intelligencePresent) ||
        (snapshot.identity.kind==='MOON' && (snapshot.civilizationPresent || snapshot.intelligencePresent)))
      throw Error('VIDA.7 refuses invalid or non-V3 private civilization state');
    await this.db.openDatabase();
    const id=snapshot.identity;
    const storageKey=`${snapshot.revision}|${snapshot.bodyStorageKey}`;
    const key: [string,number,string]=[id.universeSeed,id.generatorVersionCode,storageKey];
    const same=(row:{snapshotJson:string;digest:string;modelRevision:string})=>{
      const prior=JSON.parse(row.snapshotJson) as Vida7IntelligenceCivilizationSnapshot;
      if(row.modelRevision!==snapshot.revision || row.digest!==snapshot.digest ||
          prior.revision!==snapshot.revision || prior.digest!==snapshot.digest ||
          prior.bodyStorageKey!==snapshot.bodyStorageKey ||
          prior.ecosystemDigest!==snapshot.ecosystemDigest ||
          prior.calibrationDigest!==snapshot.calibrationDigest ||
          prior.intelligencePresent!==snapshot.intelligencePresent ||
          prior.civilizationPresent!==snapshot.civilizationPresent)
        throw Error('VIDA.7 immutable civilization mismatch; no overwrite');
      return prior;
    };
    try {
      return await this.db.transaction('rw',this.db.privateEcologicalBiospheres,async()=>{
        const prior=await this.db.privateEcologicalBiospheres.get(key);
        if(prior) return same(prior);
        await this.db.privateEcologicalBiospheres.add({
          universeSeed:id.universeSeed,generatorVersionCode:id.generatorVersionCode,
          bodyStorageKey:storageKey,modelRevision:snapshot.revision,
          snapshotJson:JSON.stringify(snapshot),digest:snapshot.digest,
        });
        return snapshot;
      });
    } catch(error) {
      if(!(error instanceof Error)||error.name!=='ConstraintError') throw error;
      const prior=await this.db.privateEcologicalBiospheres.get(key);
      if(!prior) throw error;
      return same(prior);
    }
  }
}
