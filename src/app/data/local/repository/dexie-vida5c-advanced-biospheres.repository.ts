import type { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import type { Vida5cAdvancedBiosphere } from '../../../domain/life/vida5c-advanced-biospheres';
/** No V10: V9's versioned private ecological table can store the new V5c revision. */
export class DexieVida5cAdvancedBiospheresRepository {
  constructor(private readonly db: GenesisIndexedDb) {}
  async ensure(snapshot: Vida5cAdvancedBiosphere): Promise<Vida5cAdvancedBiosphere> {
    await this.db.openDatabase();
    const id = snapshot.identity;
    const storageKey = `${snapshot.revision}|${snapshot.bodyStorageKey}`;
    const key: [string, number, string] = [id.universeSeed, id.generatorVersionCode, storageKey];
    const same = (value: {snapshotJson: string;digest: string;modelRevision:string}) => {
      const prior = JSON.parse(value.snapshotJson) as Vida5cAdvancedBiosphere;
      if (prior.revision!==snapshot.revision || prior.bodyStorageKey!==snapshot.bodyStorageKey ||
          prior.digest!==snapshot.digest || value.digest!==snapshot.digest ||
          value.modelRevision!==snapshot.revision)
        throw Error('VIDA.5c immutable private ecology mismatch; no overwrite');
      return prior;
    };
    try {
      return await this.db.transaction('rw', this.db.privateEcologicalBiospheres, async () => {
        const old = await this.db.privateEcologicalBiospheres.get(key);
        if (old) return same(old);
        await this.db.privateEcologicalBiospheres.add({universeSeed:id.universeSeed,
          generatorVersionCode:id.generatorVersionCode,
          bodyStorageKey:storageKey,modelRevision:snapshot.revision,
          snapshotJson:JSON.stringify(snapshot),digest:snapshot.digest});
        return snapshot;
      });
    } catch(e) {
      if (!(e instanceof Error) || e.name!=='ConstraintError') throw e;
      const old = await this.db.privateEcologicalBiospheres.get(key);
      if (!old) throw e;
      return same(old);
    }
  }
}
