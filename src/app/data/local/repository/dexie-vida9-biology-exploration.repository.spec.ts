import 'fake-indexeddb/auto';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import Dexie from 'dexie';
import {GenesisIndexedDb} from '../indexed-db/genesis-indexed-db';
import {GENESIS_INDEXED_DB_V9_STORES} from '../indexed-db/genesis-indexed-db-schema';
import {DexieVida9BiologyExplorationRepository} from './dexie-vida9-biology-exploration.repository';
import {Vida9BiologyExploration} from '../../../simulation/life/vida9-biology-exploration';
import {vida9DigestForRecord} from '../../../domain/life/vida9-biology-exploration';
import {vida9TestSources} from '../../../simulation/life/vida9-test-fixture';

describe('VIDA.9 migración V9->V10 y recarga inmutable',()=>{
  const name='genesis-vida9-independent-test';
  let db:GenesisIndexedDb;
  beforeEach(()=>{db=new GenesisIndexedDb(name,{indexedDB,IDBKeyRange});});
  afterEach(async()=>{await db.delete();});
  it('migra V9 sin borrar datos y crea una tabla biológica separada',async()=>{
    const old=new Dexie(name,{indexedDB,IDBKeyRange});
    old.version(9).stores(GENESIS_INDEXED_DB_V9_STORES);
    await old.open();
    await old.table('metadata').put({key:'storage',schemaVersion:9,storageFormatVersion:1,updatedAtEpochMs:100});
    await old.table('privateEcologicalBiospheres').add({universeSeed:'seed',generatorVersionCode:3,
      bodyStorageKey:'old',modelRevision:'VIDA.8/technological-colonization/v1',snapshotJson:'{}',digest:'old'});
    old.close();
    await db.openDatabase();
    expect(db.verno).toBe(10);
    expect((await db.metadata.get('storage'))?.schemaVersion).toBe(10);
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(0);
    expect(await db.discoveries.count()).toBe(0);
  });
  it('reproduce vida, colonización y CT-0 tras recarga, sin exploraciones individuales',async()=>{
    const {ecosystem,intelligence,colonization}=vida9TestSources();
    const snapshot=Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
    const repo=new DexieVida9BiologyExplorationRepository(db);
    expect(await repo.ensure(snapshot)).toEqual(snapshot);
    expect(await repo.ensure(snapshot)).toEqual(snapshot);
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(1);
    expect(await db.discoveries.count()).toBe(0);
    db.closeDatabase();
    const reopened=new GenesisIndexedDb(name,{indexedDB,IDBKeyRange});
    try {
      const restored=await new DexieVida9BiologyExplorationRepository(reopened)
        .get(snapshot.identity.universeSeed,3,snapshot.bodyStorageKey);
      expect(restored).toEqual(snapshot);
      expect(restored?.epochOffsetYears).toBe(0);
      await expect(new DexieVida9BiologyExplorationRepository(reopened)
        .ensure({...snapshot,digest:'corrupted'})).rejects.toThrow();
      expect(await reopened.privateBiologicalRecordsVIDA9.count()).toBe(1);
    }finally{reopened.closeDatabase();}
  });
  it('reutiliza un CT-0 persistido y rechaza otro contenido para la misma clave sin sobrescribir',async()=>{
    const {ecosystem,intelligence,colonization}=vida9TestSources();
    const original=Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
    const repo=new DexieVida9BiologyExplorationRepository(db);
    await repo.ensure(original);
    expect(await repo.get(original.identity.universeSeed,3,original.bodyStorageKey)).toEqual(original);
    // Another *validly digested* candidate with the same identity is still a
    // different world state, and must not overwrite an immutable CT-0 record.
    const {digest:unused,...content}=original;
    const changed={...content,nativeLifePresent:!original.nativeLifePresent};
    const other={...changed,digest:vida9DigestForRecord(changed)};
    expect(other.digest).not.toBe(original.digest);
    await expect(repo.ensure(other)).rejects.toThrow('immutable biological record mismatch');
    expect(await repo.get(original.identity.universeSeed,3,original.bodyStorageKey)).toEqual(original);
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(1);
  });
  it('la ficha reutiliza el registro CT-0 previo aunque su proyección posterior difiera',async()=>{
    const {ecosystem,intelligence,colonization}=vida9TestSources();
    const original=Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
    const repo=new DexieVida9BiologyExplorationRepository(db);
    await repo.ensure(original);
    const {digest:_old,...rest}=original;
    const changed={...rest,nativeLifePresent:!original.nativeLifePresent};
    const candidate={...changed,digest:vida9DigestForRecord(changed)};
    expect(candidate.digest).not.toBe(original.digest);
    // Unchanged original identity / seed / species / population snapshot wins.
    expect(await repo.getOrInsertPreservingExisting(candidate)).toEqual(original);
    expect(await db.privateBiologicalRecordsVIDA9.count()).toBe(1);
    expect(await repo.get(original.identity.universeSeed,3,original.bodyStorageKey)).toEqual(original);
    // The strict insert-only API deliberately continues rejecting conflicts.
    await expect(repo.ensure(candidate)).rejects.toThrow('immutable biological record mismatch');
  });
  it('no trata una fila corrupta como registro ausente o regenerable',async()=>{
    const {ecosystem,intelligence,colonization}=vida9TestSources();
    const original=Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
    const repo=new DexieVida9BiologyExplorationRepository(db);
    await repo.ensure(original);
    const key:[string,number,string]=[original.identity.universeSeed,3,original.bodyStorageKey];
    const row=await db.privateBiologicalRecordsVIDA9.get(key);
    if(!row)throw Error('Missing fixture');
    await db.privateBiologicalRecordsVIDA9.put({...row,digest:'INVALID'});
    await expect(repo.getOrInsertPreservingExisting(original))
      .rejects.toThrow('stored biological identity/revision mismatch');
  });

  it('no acepta un registro CT-0 alterado en IndexedDB al leerlo',async()=>{
    const {ecosystem,intelligence,colonization}=vida9TestSources();
    const original=Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
    const repo=new DexieVida9BiologyExplorationRepository(db);
    await repo.ensure(original);
    const key:[string,number,string]=[original.identity.universeSeed,3,original.bodyStorageKey];
    const row=await db.privateBiologicalRecordsVIDA9.get(key);
    if(!row)throw Error('Missing fixture record');
    const tampered={...original,nativeLifePresent:!original.nativeLifePresent};
    await db.privateBiologicalRecordsVIDA9.put({...row,payloadJson:JSON.stringify(tampered)});
    await expect(repo.get(...key)).rejects.toThrow('stored biological digest mismatch');
    expect((await db.privateBiologicalRecordsVIDA9.get(key))?.payloadJson)
      .toBe(JSON.stringify(tampered)); // audit does not silently repair the row
  });

});
