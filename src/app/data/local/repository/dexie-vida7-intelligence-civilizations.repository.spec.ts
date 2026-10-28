import 'fake-indexeddb/auto';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {GenesisIndexedDb} from '../indexed-db/genesis-indexed-db';
import {DexieVida7IntelligenceCivilizationsRepository} from './dexie-vida7-intelligence-civilizations.repository';
import {VIDA7_REVISION,type Vida7IntelligenceCivilizationSnapshot} from '../../../domain/life/vida7-intelligence-civilizations';

function sample(key:string,digest:string):Vida7IntelligenceCivilizationSnapshot {
  return {revision:VIDA7_REVISION,identity:{universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
    generatorVersionCode:3,kind:'PLANET',galaxyIndex:'0',sectorKey:'1',galacticObjectIndex:'2',
    bodyIndex:key,moonIndex:null},bodyStorageKey:key,ecosystemRevision:'VIDA.6/ecosystems-species/v1',
    ecosystemDigest:'ecosystem',calibrationDigest:'calibration',eligibility:'ELIGIBLE',
    intelligentSpecies:null,civilization:null,intelligencePresent:false,civilizationPresent:false,digest};
}

describe('VIDA.7 IndexedDB persistencia privada',()=>{
  let db:GenesisIndexedDb;
  beforeEach(()=>{db=new GenesisIndexedDb('vida7-repository-test',{indexedDB,IDBKeyRange});});
  afterEach(async()=>{await db.delete();});
  it('es idempotente e inmutable en tabla V9, sin escribir observaciones',async()=>{
    const r=new DexieVida7IntelligenceCivilizationsRepository(db);
    const s=sample('body-1','a'.repeat(64));
    expect(await r.ensure(s)).toEqual(s);
    expect(await r.ensure(s)).toEqual(s);
    expect(db.verno).toBe(10);
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
    expect(await db.discoveries.count()).toBe(0);
    expect(await db.observations.count()).toBe(0);
    await expect(r.ensure(sample('body-1','b'.repeat(64)))).rejects.toThrow('mismatch');
    expect(await db.privateEcologicalBiospheres.count()).toBe(1);
  });
  it('rechaza civilizacion sin inteligencia y la inteligencia lunar',async()=>{
    const r=new DexieVida7IntelligenceCivilizationsRepository(db);
    const s=sample('body-2','c'.repeat(64));
    await expect(r.ensure({...s,civilizationPresent:true})).rejects.toThrow('invalid');
    await expect(r.ensure({...s,identity:{...s.identity,kind:'MOON'},
      intelligencePresent:true})).rejects.toThrow('invalid');
  });
});
