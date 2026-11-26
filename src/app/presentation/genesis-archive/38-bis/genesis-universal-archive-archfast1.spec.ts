import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import type {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';
import type {GenesisKnowledgeCommit38BisB6} from '../../../data/local/repository/genesis-knowledge-commits-38-bis-b6';

const scope='GENESIS/38.bis/scientific-confirmed/v2|TEST|3';
const event:GenesisKnowledgeCommit38BisB6={universeSeed:'TEST',generatorVersionCode:3,
  galaxyIndex:'19',kind:'GALAXY'};
const row=(id:string,galaxy:string,mass:number):UniversalArchiveRow38Bis=>({
  id,scope,category:'planets',galaxyIndex:galaxy,subtype:'ALL',sortTitle:id+'\u0000'+id,
  title:id,subtitle:'',cells:{mass:String(mass),radius:'4',galaxy:'Prueba'},
  sortNumbers:{mass},actions:[],
});
const section=(galaxy:string,rev:string,entries:number):UniversalArchiveSection38Bis=>({
  scope,galaxyIndex:galaxy,category:'planets',sourceRevision:rev,
  count:entries,indexedAtEpochMs:Date.now(),knowledgeComplete:true,
});
let counter=0,store:GenesisUniversalArchiveStore38Bis;
describe('ARCHFAST.1 — consolidación y trazabilidad de trabajos masivos',()=>{
  beforeEach(()=>{store=createArchiveTestStore38Bis('archfast1-'+(++counter)+'-'+Date.now());});
  afterEach(async()=>{await store.delete();});

  it('reutiliza el lote de filas para varias ordenaciones y conserva la paginación científica',async()=>{
    await store.publish(section('19','r1',2),[row('planet-a','19',4),row('planet-b','19',2)]);
    const shared=await store.sortSourceRowsArchfast1(scope,'planets','19');
    const project=async(rows:readonly UniversalArchiveRow38Bis[])=>rows;
    await store.ensureSortField(scope,'planets','19','mass',project,shared);
    await store.ensureSortField(scope,'planets','19','radius',project,shared);
    expect(await store.outdatedSortFieldsArchfast1(scope,'planets','19',['mass','radius'])).toEqual([]);
    const results=await store.page({scope,category:'planets',galaxyIndex:'19',
      subtype:null,sortKey:'mass',descending:false,search:'',minimum:null,maximum:null,
      page:1,pageSize:25});
    expect(results.items.map(r=>r.id)).toEqual(['planet-b','planet-a']);
    expect(await store.sortSourceRowsArchfast1(scope,'planets','20')).toEqual([]);
  });

  it('una nueva revisión invalida únicamente los campos derivados de esa galaxia',async()=>{
    await store.publish(section('19','r1',1),[row('old','19',1)]);
    await store.publish(section('20','r1',1),[row('stable','20',3)]);
    await store.ensureSortField(scope,'planets','19','mass');
    await store.ensureSortField(scope,'planets','20','mass');
    await store.publish(section('19','r2',1),[row('new','19',8)]);
    expect(await store.outdatedSortFieldsArchfast1(scope,'planets','19',['mass','radius'])).toEqual(['mass','radius']);
    expect(await store.outdatedSortFieldsArchfast1(scope,'planets','20',['mass'])).toEqual([]);
    await store.ensureSortField(scope,'planets','19','mass');
    expect(await store.outdatedSortFieldsArchfast1(scope,'planets','19',['mass'])).toEqual([]);
  });

  it('registra progreso real, rechaza una actualización tardía y conserva el trabajo nuevo',async()=>{
    await store.enqueueKnowledgeChange38BisB6(event,scope);
    const job=await store.claimKnowledgeChange38BisB6();
    expect(job?.phase).toBe('FRAGMENT');
    await store.setKnowledgeChangeProgressArchfast1(job!,'SORTS','mass',1,3);
    const running=await store.dirtyJobs.get(job!.id);
    expect([running?.phase,running?.currentField,running?.completedSorts,running?.totalSorts])
      .toEqual(['SORTS','mass',1,3]);
    await store.enqueueKnowledgeChange38BisB6(event,scope);
    await store.setKnowledgeChangeProgressArchfast1(job!,'SORTS','radius',2,3);
    await store.finishKnowledgeChange38BisB6(job!);
    const pending=await store.dirtyJobs.get(job!.id);
    expect(pending?.status).toBe('PENDING');
    expect(pending?.serial).toBe(2);
    expect(pending?.currentField).toBeUndefined();
  });

  it('un error no destruye la última sección válida ni su ordenación',async()=>{
    await store.publish(section('19','r1',1),[row('visible','19',4)]);
    await store.ensureSortField(scope,'planets','19','mass');
    await store.enqueueKnowledgeChange38BisB6({...event,kind:'BODY'},scope);
    const job=await store.claimKnowledgeChange38BisB6();
    await store.finishKnowledgeChange38BisB6(job!,'Fallo de lectura de origen');
    expect((await store.sectionsFor(scope))[0]?.sourceRevision).toBe('r1');
    expect(await store.outdatedSortFieldsArchfast1(scope,'planets','19',['mass'])).toEqual([]);
    expect((await store.dirtyJobs.get(job!.id))?.status).toBe('ERROR');
  });
});
