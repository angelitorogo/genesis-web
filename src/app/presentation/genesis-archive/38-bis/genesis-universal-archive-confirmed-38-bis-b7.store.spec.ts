import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import type {UniversalArchiveSection38Bis, UniversalArchiveRow38Bis} from './genesis-universal-archive-38-bis.model';

const oldScope='GENESIS/38.bis/observed-index/v1|SEED|3';
const newScope='GENESIS/38.bis/scientific-confirmed/v2|SEED|3';
let sequence=0;
const stores:GenesisUniversalArchiveStore38Bis[]=[];
function db(){const d=createArchiveTestStore38Bis(`archive-b7-${++sequence}-${Date.now()}`);stores.push(d);return d;}
const section=(scope:string,galaxyIndex:string):UniversalArchiveSection38Bis=>({
  scope,category:'systems',galaxyIndex,count:1,sourceRevision:'known',indexedAtEpochMs:0,knowledgeComplete:true,
});
const row=(scope:string,galaxyIndex:string):UniversalArchiveRow38Bis=>({
  id:JSON.stringify([scope,'systems',galaxyIndex,'system']),scope,category:'systems',galaxyIndex,
  subtype:'ALL',sortTitle:'test',title:'Sistema detectado',subtitle:'',cells:{},actions:[],
});
afterEach(async()=>{for(const d of stores.splice(0)){d.close();await d.delete();}});

describe('38.bis-b7: migración no destructiva del índice derivado',()=>{
  it('elimina únicamente índices v1 prematuros sin tocar índices confirmados v2',async()=>{
    const store=db();
    await store.publish(section(oldScope,'1'),[row(oldScope,'1')]);
    await store.publish(section(newScope,'2'),[row(newScope,'2')]);
    await store.discardLegacyScope38BisB7(newScope);
    expect(await store.sectionsFor(oldScope)).toHaveLength(0);
    expect(await store.rows.where('[scope+category+galaxyIndex]').equals([oldScope,'systems','1']).count()).toBe(0);
    expect(await store.sectionsFor(newScope)).toHaveLength(1);
    expect(await store.rows.where('[scope+category+galaxyIndex]').equals([newScope,'systems','2']).count()).toBe(1);
    await store.discardLegacyScope38BisB7(newScope); // idempotente
  });

  it('b7a: limita la limpieza antigua por operación y mantiene intacto el ámbito confirmado',async()=>{
    const store=db();
    const oldRows=Array.from({length:300},(_,i)=>({
      ...row(oldScope,'1'),id:JSON.stringify([oldScope,'systems','1','s'+i]),title:'S'+i,
    }));
    await store.publish({...section(oldScope,'1'),count:oldRows.length},oldRows);
    await store.publish(section(newScope,'2'),[row(newScope,'2')]);
    const more=await store.discardLegacyScopeSlice38BisB7a(newScope,50);
    expect(more).toBe(true);
    expect(await store.rows.where('[scope+category+galaxyIndex]')
      .equals([oldScope,'systems','1']).count()).toBe(250);
    expect(await store.rows.where('[scope+category+galaxyIndex]')
      .equals([newScope,'systems','2']).count()).toBe(1);
    await store.discardLegacyScope38BisB7(newScope);
    expect(await store.sectionsFor(oldScope)).toHaveLength(0);
    expect(await store.sectionsFor(newScope)).toHaveLength(1);
  });

  it('b7a: programar mantenimiento no inicia ninguna lectura síncrona de IndexedDB',()=>{
    const store=db();
    const scan=vi.spyOn(store,'discardLegacyScopeSlice38BisB7a');
    vi.useFakeTimers();
    try{
      store.scheduleLegacyCleanup38BisB7a(newScope);
      store.scheduleLegacyCleanup38BisB7a(newScope); // debe coalescer
      expect(scan).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(1);
    }finally{
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('un retroceso tras restauración purga solo la galaxia ya no confirmada',async()=>{
    const store=db();
    await store.publish(section(newScope,'1'),[row(newScope,'1')]);
    await store.publish(section(newScope,'2'),[row(newScope,'2')]);
    await store.removeGalaxyFragment38BisB7(newScope,'1');
    expect((await store.sectionsFor(newScope)).map(s=>s.galaxyIndex)).toEqual(['2']);
  });
});
