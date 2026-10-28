import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { VIDA8_REVISION, type Vida8ColonizationSnapshot } from '../../../domain/life/vida8-technological-colonization';
/** Nueva revision de la misma tabla privada V9, nunca publica/observada. */
export class DexieVida8TechnologicalColonizationRepository {
  constructor(private readonly db: GenesisIndexedDb){}
  async ensure(snapshot:Vida8ColonizationSnapshot):Promise<Vida8ColonizationSnapshot>{
    if(snapshot.revision!==VIDA8_REVISION || snapshot.identity.generatorVersionCode!==3 ||
      snapshot.colonialPopulationPresent!==(snapshot.colonies.length>0) ||
      snapshot.introducedLifePresent!==snapshot.colonies.some(c=>c.introducedOrganisms.length>0) ||
      snapshot.colonies.some(c=>c.terraform?.environmentChanged ||
        c.origin.sourceIdentity.universeSeed!==snapshot.identity.universeSeed ||
        c.origin.sourceIdentity.kind!=='PLANET' ||
        c.origin.sourceBodyStorageKey===snapshot.bodyStorageKey))
      throw Error('VIDA.8 invalid private colonial state');
    await this.db.openDatabase();
    const id=snapshot.identity;
    const key:[string,number,string]=[id.universeSeed,id.generatorVersionCode,
      `${snapshot.revision}|${snapshot.bodyStorageKey}`];
    const same=(row:{snapshotJson:string;digest:string;modelRevision:string})=>{
      const prior=JSON.parse(row.snapshotJson) as Vida8ColonizationSnapshot;
      if(row.modelRevision!==snapshot.revision || row.digest!==snapshot.digest ||
        prior.revision!==snapshot.revision || prior.digest!==snapshot.digest ||
        prior.ecosystemDigest!==snapshot.ecosystemDigest ||
        prior.nativeCivilizationDigest!==snapshot.nativeCivilizationDigest ||
        prior.bodyStorageKey!==snapshot.bodyStorageKey ||
        prior.colonies.length!==snapshot.colonies.length)
        throw Error('VIDA.8 immutable colonization mismatch; no overwrite');
      return prior;
    };
    try {
      return await this.db.transaction('rw',this.db.privateEcologicalBiospheres,async()=>{
        const prior=await this.db.privateEcologicalBiospheres.get(key);
        if(prior)return same(prior);
        await this.db.privateEcologicalBiospheres.add({
          universeSeed:id.universeSeed,generatorVersionCode:id.generatorVersionCode,
          bodyStorageKey:key[2],modelRevision:snapshot.revision,
          snapshotJson:JSON.stringify(snapshot),digest:snapshot.digest,
        });
        return snapshot;
      });
    }catch(error){
      if(!(error instanceof Error)||error.name!=='ConstraintError')throw error;
      const prior=await this.db.privateEcologicalBiospheres.get(key);
      if(!prior)throw error;
      return same(prior);
    }
  }
}
