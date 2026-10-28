import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieProceduralEcologyVIDA4Repository } from './dexie-procedural-ecology-vida4.repository';
import { ProceduralEcologyVIDA4 } from '../../../simulation/life/procedural-ecology-vida4';
import { VIDA3_MODEL_REVISION } from '../../../domain/life/procedural-microbial-vida3';
import type { Vida3MicrobialSnapshot } from '../../../domain/life/procedural-microbial-vida3';
const microbial:Vida3MicrobialSnapshot={ revision:VIDA3_MODEL_REVISION,
  identity:{universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',generatorVersionCode:3,
  kind:'PLANET',galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'0',bodyIndex:'1',moonIndex:null},
  bodyStorageKey:'0:1:0:1:PLANET:-',plausibility:'PLAUSIBLE',selectedRoute:'SURFACE',habitat:'SURFACE_OPEN',
  lifePresent:true,biology:'MICROBIAL',biosphereId:'vida3:immutable',digest:'a'.repeat(64)};
describe('VIDA.4 Dexie persistence',()=>{
 let db:GenesisIndexedDb;
 beforeEach(()=>{db=new GenesisIndexedDb('vida4-ecology-test',{indexedDB,IDBKeyRange});});
 afterEach(async()=>{await db.delete();});
 it('upgrades to V9, inserts once, and reads back identical data',async()=>{
   const repo=new DexieProceduralEcologyVIDA4Repository(db);
   const original=ProceduralEcologyVIDA4.evaluate(microbial);
   expect(await repo.ensure(original)).toEqual(original);
   expect(await repo.ensure(original)).toEqual(original);
   expect(db.verno).toBe(10);
   expect(await db.privateEcologicalBiospheres.count()).toBe(1);
   expect((await db.privateEcologicalBiospheres.toArray())[0].digest).toBe(original.digest);
 });
 it('does not overwrite a previously persisted revision if the source digest changes',async()=>{
   const repo=new DexieProceduralEcologyVIDA4Repository(db);
   const original=ProceduralEcologyVIDA4.evaluate(microbial);
   await repo.ensure(original);
   const changed=ProceduralEcologyVIDA4.evaluate({...microbial,digest:'b'.repeat(64)});
   await expect(repo.ensure(changed)).rejects.toThrow('mismatch');
   expect(await db.privateEcologicalBiospheres.count()).toBe(1);
 });
 it('does not use player observation tables for ecology',async()=>{
   await new DexieProceduralEcologyVIDA4Repository(db).ensure(ProceduralEcologyVIDA4.evaluate(microbial));
   expect(await db.observations.count()).toBe(0);
   expect(await db.discoveries.count()).toBe(0);
 });
 it('VIDA.4a adds V2 alongside legacy V1 in the same V9 table, no migration',async()=>{
   const repo=new DexieProceduralEcologyVIDA4Repository(db);
   const current=ProceduralEcologyVIDA4.evaluate(microbial);
   const legacy={...current,revision:'VIDA.4/ecology/v1' as const,digest:'1'.repeat(64)};
   // Historical V1 digest is kept as originally persisted; no recomputation.
   await db.openDatabase();
   // Simulate a real V1 row from an already existing VIDA.4 save.
   await db.privateEcologicalBiospheres.add({
     universeSeed:microbial.identity.universeSeed,
     generatorVersionCode:microbial.identity.generatorVersionCode,
     bodyStorageKey:`${legacy.revision}|${legacy.bodyStorageKey}`,
     modelRevision:'VIDA.4/ecology/v1',
     snapshotJson:JSON.stringify(legacy),digest:legacy.digest,
   });
   expect(await repo.ensure(current)).toEqual(current);
   const rows=await db.privateEcologicalBiospheres.toArray();
   expect(rows).toHaveLength(2);
   expect(new Set(rows.map(x=>x.modelRevision))).toEqual(new Set([
     'VIDA.4/ecology/v1','VIDA.4/ecology/v2-advanced-calibration'
   ]));
   expect(await repo.ensure(current)).toEqual(current);
   expect(await db.privateEcologicalBiospheres.count()).toBe(2);
 });

});
