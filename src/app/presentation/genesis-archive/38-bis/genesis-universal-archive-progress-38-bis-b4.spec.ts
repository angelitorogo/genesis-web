import 'fake-indexeddb/auto';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import {archiveProgressDetails38BisB4,archiveProgressOverview38BisB4,
  archiveProgressStatus38BisB4} from './genesis-universal-archive-progress-38-bis-b4';
import type {UniversalArchiveSection38Bis,UniversalArchiveRow38Bis} from './genesis-universal-archive-38-bis.model';

const scope='38bis-b4-v3';
const galaxies=[{index:'0',title:'Galaxia Alfa'},{index:'1',title:'Galaxia Beta'}] as const;
const section=(galaxyIndex:string,sourceRevision='v1'):UniversalArchiveSection38Bis=>({
  scope,galaxyIndex,category:'planets',count:1,sourceRevision,indexedAtEpochMs:0,
  knowledgeComplete:true,
});
const row:UniversalArchiveRow38Bis={id:'planet-1',scope,category:'planets',galaxyIndex:'0',subtype:'ALL',
  title:'Planeta A',subtitle:'',sortTitle:'planeta a\0planet-1',cells:{water:'10,2 %',temperature:'-30 °C'},
  sortNumbers:{water:10.2,temperature:-30},actions:[]};
let db:GenesisUniversalArchiveStore38Bis;
let sequence=0;

describe('38.bis-b4 · checkpoints persistentes, no científicos',()=>{
  beforeEach(()=>{db=new GenesisUniversalArchiveStore38Bis(`38bis-b4-${++sequence}-${Date.now()}`);});
  afterEach(async()=>{db.close();await db.delete();});

  it('muestra pendiente cuando no hay fragmentos y marca en curso solo durante la sesión activa',async()=>{
    const empty=await db.progressFor(scope);
    const initial=archiveProgressOverview38BisB4(galaxies,['planets'],empty,null);
    expect(initial[0]?.pending).toBe(2);
    const active=archiveProgressOverview38BisB4(galaxies,['planets'],empty,
      {category:'planets',galaxyIndex:'0',field:'base'});
    expect(active[0]?.active).toBe(1);
    expect(active[0]?.pending).toBe(1);
    expect(active[0]?.stored).toBe(0);
    expect(active[0]?.checked).toBe(0);
  });


  it('una galaxia guardada no desaparece del recuento mientras se vuelve a verificar',async()=>{
    await db.publish(section('0'),[row]);
    await db.publish(section('1'),[{...row,id:'planet-2',galaxyIndex:'1'}]);
    const snapshot=await db.progressFor(scope);
    const checked=new Set(['planets|0']);
    const reviewing=archiveProgressOverview38BisB4(galaxies,['planets'],snapshot,
      {category:'planets',galaxyIndex:'1',field:'base'},checked);
    expect(reviewing[0]).toMatchObject({stored:2,checked:1,active:1,pending:0,total:2});
    const after=archiveProgressOverview38BisB4(galaxies,['planets'],snapshot,null,
      new Set(['planets|0','planets|1']));
    expect(after[0]).toMatchObject({stored:2,checked:2,active:0,total:2});
    // En una apertura posterior, el contador de comprobaciones debe reiniciarse.
    const reopened=archiveProgressOverview38BisB4(galaxies,['planets'],snapshot,null);
    expect(reopened[0]).toMatchObject({stored:2,checked:0});
  });

  it('distingue una reconstrucción activa sin índice previo del índice ya publicado',async()=>{
    const snapshot=await db.progressFor(scope);
    const active=archiveProgressOverview38BisB4(galaxies,['planets'],snapshot,
      {category:'planets',galaxyIndex:'1',field:'base'},new Set(['planets|0']));
    expect(active[0]).toMatchObject({stored:0,checked:1,active:1,pending:1,total:2});
  });

  it('distingue el fragmento interrumpido de uno completado y lo recupera al publicar',async()=>{
    await db.checkpoint(scope,'planets','0','base','RUNNING');
    db.close();
    db=new GenesisUniversalArchiveStore38Bis(db.name);
    const interrupted=archiveProgressDetails38BisB4(galaxies,'planets',await db.progressFor(scope),null);
    expect(interrupted[0]?.base).toBe('INTERRUPTED');
    expect(interrupted[1]?.base).toBe('PENDING');
    await db.publish(section('0'),[row]);
    const stored=archiveProgressDetails38BisB4(galaxies,'planets',await db.progressFor(scope),null);
    expect(stored[0]?.base).toBe('STORED');
  });

  it('conserva ordenaciones por magnitud y marca pendientes las que nunca se construyeron',async()=>{
    await db.publish(section('0'),[row]);
    await db.ensureSortField(scope,'planets','0','water');
    db.close();db=new GenesisUniversalArchiveStore38Bis(db.name);
    const details=archiveProgressDetails38BisB4(galaxies,'planets',await db.progressFor(scope),null);
    expect(details[0]?.scientificSorts.find(f=>f.key==='water')?.status).toBe('STORED');
    expect(details[0]?.scientificSorts.find(f=>f.key==='temperature')?.status).toBe('PENDING');
    expect(details[1]?.scientificSorts.find(f=>f.key==='water')?.status).toBe('PENDING');
  });

  it('reconstruir un fragmento invalida solo sus ordenaciones y conserva otras galaxias',async()=>{
    await db.publish(section('0'),[row]);
    await db.ensureSortField(scope,'planets','0','water');
    await db.publish(section('0','v2'),[row]);
    const details=archiveProgressDetails38BisB4(galaxies,'planets',await db.progressFor(scope),null);
    expect(details[0]?.base).toBe('STORED');
    expect(details[0]?.scientificSorts.find(f=>f.key==='water')?.status).toBe('PENDING');
  });

  it('un error de reindexación no equivale a una categoría sin datos',async()=>{
    await db.checkpoint(scope,'planets','0','base','ERROR');
    expect(archiveProgressDetails38BisB4(galaxies,'planets',await db.progressFor(scope),null)[0]?.base).toBe('FAILED');
    expect(archiveProgressStatus38BisB4(true,'ERROR',false)).toBe('STORED');
  });

  it('el estado de otro universo no aparece al cambiar de partida',async()=>{
    await db.checkpoint(scope,'planets','0','base','RUNNING');
    expect((await db.progressFor('otra-partida')).checkpoints).toHaveLength(0);
    expect((await db.progressFor('otra-partida')).sections).toHaveLength(0);
  });
});
