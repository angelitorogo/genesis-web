import { IDBKeyRange,indexedDB } from 'fake-indexeddb';
import { GenesisIndexedDb } from '../indexed-db/genesis-indexed-db';
import { DexieProceduralMicrobialVIDA3Repository } from './dexie-procedural-microbial-vida3.repository';
import { ProceduralMicrobialLifeVIDA3 as Life } from '../../../simulation/life/procedural-microbial-life-vida3';
import { LifePlausibilityEngineVIDA2 } from '../../../simulation/life/life-plausibility-engine-vida2';
import type { Vida2PhysicalRoute } from '../../../simulation/life/life-plausibility-engine-vida2';
const generic=(route:'SURFACE'|'SUBSURFACE'):Vida2PhysicalRoute=>({
  route,water:'PRESENT',temperatureKelvin:299,interiorLiquidModeled:true,interiorPotential:true,
  pressurePascal:101325,hasIceOrRockCover:true,coverPotential:true,
  stellarInsolationEarth:1,internalHeatFluxWattsPerSquareMeter:0.1,internalEnergyPotential:true,
  solidSurface:true,provenance:'test'});
const id={universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode:3,kind:'PLANET' as const,galaxyIndex:'0',sectorKey:'1',
  galacticObjectIndex:'0',bodyIndex:'5',moonIndex:null};
describe('VIDA.3 Dexie private store V8',()=>{
  let db:GenesisIndexedDb;
  beforeEach(()=>{db=new GenesisIndexedDb('genesis-vida3-test',{indexedDB,IDBKeyRange});});
  afterEach(async()=>{db.closeDatabase();await db.delete();});
  it('creates V8 and keeps one private snapshot on repeated inserts',async()=>{
    const repo=new DexieProceduralMicrobialVIDA3Repository(db);
    const snapshot=Life.evaluate(id,LifePlausibilityEngineVIDA2.evaluate(generic('SURFACE'),generic('SUBSURFACE')));
    expect(await repo.ensure(snapshot)).toEqual(snapshot);
    expect(await repo.ensure(snapshot)).toEqual(snapshot);
    expect(await db.privateMicrobialBiospheres.count()).toBe(1);
    expect(db.verno).toBe(10);
  });
  it('does not overwrite an already persisted result with an altered decision',async()=>{
    const repo=new DexieProceduralMicrobialVIDA3Repository(db);
    const p=LifePlausibilityEngineVIDA2.evaluate(generic('SURFACE'),generic('SUBSURFACE'));
    const s=Life.evaluate(id,p);
    await repo.ensure(s);
    await expect(repo.ensure({...s,digest:'f'.repeat(64)})).rejects.toThrow('mismatch');
    expect((await db.privateMicrobialBiospheres.toArray())[0].digest).toBe(s.digest);
  });
});
