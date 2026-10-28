import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { VIDA6_REVISION, type Vida6EcosystemSnapshot } from '../../../domain/life/vida6-ecosystems-species';

/** V9: persistir nueva revision en tabla privada existente, sin migracion ni datos observados. */
export class DexieVida6EcosystemsSpeciesRepository {
  constructor(private readonly db: GenesisIndexedDb) {}

  async ensure(snapshot: Vida6EcosystemSnapshot): Promise<Vida6EcosystemSnapshot> {
    if (snapshot.revision !== VIDA6_REVISION || snapshot.identity.generatorVersionCode !== 3)
      throw Error('VIDA.6 private persistence requires V3 and the current revision');
    await this.db.openDatabase();
    const identity = snapshot.identity;
    const key: [string,number,string] = [identity.universeSeed,identity.generatorVersionCode,
      `${snapshot.revision}|${snapshot.bodyStorageKey}`];
    const same = (row: {snapshotJson:string;digest:string;modelRevision:string}):Vida6EcosystemSnapshot => {
      const previous = JSON.parse(row.snapshotJson) as Vida6EcosystemSnapshot;
      if (row.modelRevision !== snapshot.revision || row.digest !== snapshot.digest ||
          previous.digest !== snapshot.digest || previous.bodyStorageKey !== snapshot.bodyStorageKey ||
          previous.microbialDigest !== snapshot.microbialDigest ||
          previous.originalEcologyDigest !== snapshot.originalEcologyDigest ||
          previous.calibrationDigest !== snapshot.calibrationDigest)
        throw Error('VIDA.6 immutable ecosystem mismatch; no overwrite');
      return previous;
    };
    try {
      return await this.db.transaction('rw',this.db.privateEcologicalBiospheres,async()=>{
        const previous = await this.db.privateEcologicalBiospheres.get(key);
        if (previous) return same(previous);
        await this.db.privateEcologicalBiospheres.add({universeSeed:identity.universeSeed,
          generatorVersionCode:identity.generatorVersionCode,bodyStorageKey:key[2],
          modelRevision:snapshot.revision,snapshotJson:JSON.stringify(snapshot),digest:snapshot.digest});
        return snapshot;
      });
    } catch(error) {
      if (!(error instanceof Error) || error.name !== 'ConstraintError') throw error;
      const previous = await this.db.privateEcologicalBiospheres.get(key);
      if (!previous) throw error;
      return same(previous);
    }
  }
}
