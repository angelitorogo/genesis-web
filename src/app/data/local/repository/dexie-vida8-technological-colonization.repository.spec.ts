import 'fake-indexeddb/auto';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {GenesisIndexedDb} from '../indexed-db/genesis-indexed-db';
import {DexieVida8TechnologicalColonizationRepository} from './dexie-vida8-technological-colonization.repository';
import {VIDA8_REVISION,type Vida8ColonizationSnapshot} from '../../../domain/life/vida8-technological-colonization';
function sample(digest:string):Vida8ColonizationSnapshot {
  return {revision:VIDA8_REVISION,identity:{universeSeed:'seed',generatorVersionCode:3,kind:'MOON',
    galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',bodyIndex:'3',moonIndex:'1'},
    bodyStorageKey:'dest',ecosystemRevision:'VIDA.6/ecosystems-species/v1',
    ecosystemDigest:'original',nativeCivilizationRevision:'VIDA.7/intelligence-civilizations/v1',
    nativeCivilizationDigest:'uninhabited',nativeLifePresent:false,nativeIntelligencePresent:false,
    nativeCivilizationPresent:false,introducedLifePresent:false,colonialPopulationPresent:false,
    outcome:'NO_ELIGIBLE_ORIGIN',colonies:[],digest};
}
describe('VIDA.8 persistencia privada V9',()=>{
  let db:GenesisIndexedDb;
  beforeEach(()=>{db=new GenesisIndexedDb('vida8-repository-test',{indexedDB,IDBKeyRange});});
  afterEach(async()=>{await db.delete();});
  it('inserta revision en V9, idempotente e inmutable sin descubrimientos',async()=>{
    const repo=new DexieVida8TechnologicalColonizationRepository(db);
    const s=sample('a'.repeat(64));
    expect(await repo.ensure(s)).toEqual(s);
    expect(await repo.ensure(s)).toEqual(s);
    expect(db.verno).toBe(10);
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
    expect(await db.discoveries.count()).toBe(0);
    expect(await db.observations.count()).toBe(0);
    await expect(repo.ensure(sample('b'.repeat(64)))).rejects.toThrow('mismatch');
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
  });
  it('rechaza estado colonial incoherente',async()=>{
    const repo=new DexieVida8TechnologicalColonizationRepository(db);
    await expect(repo.ensure({...sample('c'.repeat(64)),colonialPopulationPresent:true}))
      .rejects.toThrow('invalid');
  });
});
