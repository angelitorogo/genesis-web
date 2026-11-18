import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import {describe,it,expect} from 'vitest';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import {archiveDirtyCategories38BisB6} from './genesis-universal-archive-dirty-38-bis-b6';
import {publishGenesisKnowledgeCommit38BisB6,
  subscribeGenesisKnowledgeCommits38BisB6,
  type GenesisKnowledgeCommit38BisB6}
  from '../../../data/local/repository/genesis-knowledge-commits-38-bis-b6';

const event:GenesisKnowledgeCommit38BisB6={
  universeSeed:'7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
  generatorVersionCode:3,galaxyIndex:'9',kind:'SYSTEM',
};
let seq=0;
async function db(){
  const store=createArchiveTestStore38Bis('test-genesis-38bis-b6-'+(++seq));
  await store.open();return store;
}

describe('38.bis-b6 — eventos y cola persistida de actualización incremental',()=>{
  it('solo selecciona las categorías afectadas por cada cambio',()=>{
    expect(archiveDirtyCategories38BisB6('SYSTEM')).toContain('moons');
    expect(archiveDirtyCategories38BisB6('SYSTEM')).toContain('colonized-moons');
    expect(archiveDirtyCategories38BisB6('GALACTIC_OBJECT')).toContain('nebulae');
    expect(archiveDirtyCategories38BisB6('GALACTIC_OBJECT')).not.toContain('moons');
    expect(archiveDirtyCategories38BisB6('VIDA9')).toEqual([
      'civilizations','colonies','colonized-planets','colonized-moons']);
    expect(archiveDirtyCategories38BisB6('SECTOR')).toEqual([]);
  });

  it('fusiona eventos consecutivos en una sola tarea por universo/galaxia/categoría',async()=>{
    const store=await db();try{
      await store.enqueueKnowledgeChange38BisB6(event,'scope-1');
      await store.enqueueKnowledgeChange38BisB6(event,'scope-1');
      const rows=await store.dirtyJobs.toArray();
      expect(rows.length).toBe(archiveDirtyCategories38BisB6('SYSTEM').length);
      expect(rows.every(row=>row.serial===2&&row.status==='PENDING')).toBe(true);
      expect(rows.every(row=>row.scope==='scope-1'&&row.galaxyIndex==='9')).toBe(true);
    }finally{await store.delete();}
  });

  it('reanuda los trabajos tras recargar, sin volver a crear los fragmentos publicados',async()=>{
    const store=await db();const name=store.name;
    await store.enqueueKnowledgeChange38BisB6({...event,kind:'BODY'},'scope-1');
    const claimed=await store.claimKnowledgeChange38BisB6(1000);
    expect(claimed?.status).toBe('RUNNING');
    store.close();
    const restored=createArchiveTestStore38Bis(name);
    try{
      expect(await restored.recoverKnowledgeChanges38BisB6(1002,500)).toBe(0);
      expect(await restored.recoverKnowledgeChanges38BisB6(1800,500)).toBe(1);
      const retried=await restored.claimKnowledgeChange38BisB6(1801);
      expect(retried?.serial).toBe(1);
      await restored.finishKnowledgeChange38BisB6(retried!);
      expect(await restored.dirtyJobs.get(retried!.id)).toBeUndefined();
    }finally{await restored.delete();}
  });

  it('un evento nuevo durante un procesamiento no se borra al completar el anterior',async()=>{
    const store=await db();try{
      const system={...event,kind:'CIVILIZATION'} as const;
      await store.enqueueKnowledgeChange38BisB6(system,'scope-1');
      const running=await store.claimKnowledgeChange38BisB6();
      expect(running).not.toBeNull();
      await store.enqueueKnowledgeChange38BisB6(system,'scope-1');
      await store.finishKnowledgeChange38BisB6(running!);
      const pending=await store.dirtyJobs.get(running!.id);
      expect(pending?.serial).toBe(2);
      expect(pending?.status).toBe('PENDING');
    }finally{await store.delete();}
  });

  it('no mezcla universos, galaxias ni trabajos de categorías distintas',async()=>{
    const store=await db();try{
      await store.enqueueKnowledgeChange38BisB6({...event,kind:'VIDA9'},'scope-1');
      await store.enqueueKnowledgeChange38BisB6({...event,galaxyIndex:'10',kind:'VIDA9'},'scope-1');
      await store.enqueueKnowledgeChange38BisB6({...event,kind:'VIDA9'},'scope-2');
      const jobs=await store.dirtyJobs.toArray();
      expect(jobs).toHaveLength(12);
      expect(new Set(jobs.map(row=>row.id)).size).toBe(12);
    }finally{await store.delete();}
  });

  it('un error retiene el trabajo y no altera los índices científicos',async()=>{
    const store=await db();try{
      await store.enqueueKnowledgeChange38BisB6({...event,kind:'VIDA9'},'scope-1');
      const job=await store.claimKnowledgeChange38BisB6();
      await store.finishKnowledgeChange38BisB6(job!,'Falló la validación de origen');
      const saved=await store.dirtyJobs.get(job!.id);
      expect(saved?.status).toBe('ERROR');
      expect(saved?.error).toBe('Falló la validación de origen');
      expect(await store.sections.count()).toBe(0);
    }finally{await store.delete();}
  });

  it('el publicador comunica solo coordenadas y permite desuscribirse',async()=>{
    const observed:GenesisKnowledgeCommit38BisB6[]=[];
    const unsubscribe=subscribeGenesisKnowledgeCommits38BisB6(e=>{observed.push(e);});
    await publishGenesisKnowledgeCommit38BisB6(event);
    unsubscribe();
    await publishGenesisKnowledgeCommit38BisB6(event);
    expect(observed).toEqual([event]);
  });
});
