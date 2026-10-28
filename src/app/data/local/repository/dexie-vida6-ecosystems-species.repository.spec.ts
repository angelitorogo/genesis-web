import 'fake-indexeddb/auto';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {GenesisIndexedDb} from '../indexed-db/genesis-indexed-db';
import {DexieVida6EcosystemsSpeciesRepository} from './dexie-vida6-ecosystems-species.repository';
import {Vida6EcosystemsSpecies} from '../../../simulation/life/vida6-ecosystems-species';
import {ProceduralEcologyVIDA4} from '../../../simulation/life/procedural-ecology-vida4';
import {VIDA3_MODEL_REVISION,type Vida3MicrobialSnapshot} from '../../../domain/life/procedural-microbial-vida3';
function micro(digest:string):Vida3MicrobialSnapshot { return {
  revision:VIDA3_MODEL_REVISION,identity:{universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
    generatorVersionCode:3,kind:'MOON',galaxyIndex:'0',sectorKey:'1',
    galacticObjectIndex:'0',bodyIndex:'1',moonIndex:'0'},
  bodyStorageKey:'0:1:0:1:MOON:0',plausibility:'PLAUSIBLE',selectedRoute:'SUBSURFACE',
  habitat:'SUBSURFACE',lifePresent:true,biology:'MICROBIAL',biosphereId:'vida3:example',digest}; }
describe('VIDA.6 IndexedDB Ground Truth',()=>{
  let db:GenesisIndexedDb;
  beforeEach(()=>{db=new GenesisIndexedDb('vida6-repository-test',{indexedDB,IDBKeyRange});});
  afterEach(async()=>{await db.delete();});
  it('es inmutable, idempotente y solo usa la tabla privada V9',async()=>{
    const m=micro('a'.repeat(64)),s=Vida6EcosystemsSpecies.evaluate(m,ProceduralEcologyVIDA4.evaluate(m));
    const repo=new DexieVida6EcosystemsSpeciesRepository(db);
    expect(await repo.ensure(s)).toEqual(s);expect(await repo.ensure(s)).toEqual(s);
    expect(db.verno).toBe(10);
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
    expect(await db.discoveries.count()).toBe(0);
    expect(await db.observations.count()).toBe(0);
    const x=micro('b'.repeat(64));
    await expect(repo.ensure(Vida6EcosystemsSpecies.evaluate(x,ProceduralEcologyVIDA4.evaluate(x))))
      .rejects.toThrow('mismatch');
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
  });
});
