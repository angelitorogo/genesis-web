import 'fake-indexeddb/auto';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';

let db:GenesisUniversalArchiveStore38Bis;
let sequence=0;
const scope='universe-v3';
const row=(id:string,galaxyIndex:string,title:string,subtype='ADVANCED'):UniversalArchiveRow38Bis=>({
  id,scope,category:'civilizations',galaxyIndex,sortTitle:title.toLowerCase()+'\u0000'+id,
  title,subtitle:'Civilización conocida',subtype,cells:{tier:subtype},
  actions:[{label:'Abrir ficha',route:['/system',galaxyIndex,'2','3','planet','0']}],
});
const section=(galaxyIndex:string,count:number,revision='rev1'):UniversalArchiveSection38Bis=>({
  scope,category:'civilizations',galaxyIndex,count,sourceRevision:revision,
  indexedAtEpochMs:0,knowledgeComplete:true,
});
const query=(overrides:Partial<{galaxyIndex:string|null;subtype:string|null;search:string;descending:boolean;
  page:number;pageSize:25|50|100}>={})=>({scope,category:'civilizations' as const,
    galaxyIndex:null,subtype:null,search:'',descending:false,page:1,pageSize:25 as const,...overrides});

describe('38.bis — IndexedDB real: índice global atómico y paginación',()=>{
  beforeEach(()=>{db=new GenesisUniversalArchiveStore38Bis(`archive-38bis-${++sequence}-${Date.now()}`);});
  afterEach(async()=>{db.close();await db.delete();});
  it('consulta todas las galaxias, filtra y pagina sin cargar un catálogo en Angular',async()=>{
    await db.publish(section('0',2),[row('a','0','Elízia'),row('b','0','Astra')]);
    await db.publish(section('1',1),[row('c','1','Asti')]);
    const all=await db.page(query());
    expect(all.total).toBe(3);
    // El índice de IndexedDB ordena por sortTitle normalizado: 'asti' < 'astra'.
    expect(all.items.map(r=>r.title)).toEqual(['Asti','Astra','Elízia']);
    const filtered=await db.page(query({galaxyIndex:'0',search:'Ast'}));
    expect(filtered.total).toBe(1);
    expect(filtered.items[0]?.id).toBe('b');
    const descending=await db.page(query({descending:true}));
    expect(descending.items.map(r=>r.title)).toEqual(['Elízia','Astra','Asti']);
  });
  it('filtra por nivel de civilización con un índice compuesto y conserva galaxia',async()=>{
    await db.publish(section('0',2),[row('a','0','Civ A','PRIMITIVE'),row('b','0','Civ B','ADVANCED')]);
    await db.publish(section('1',1),[row('c','1','Civ C','VERY_ADVANCED')]);
    expect((await db.page(query({subtype:'VERY_ADVANCED'}))).total).toBe(1);
    expect((await db.page(query({galaxyIndex:'0',subtype:'ADVANCED'}))).items[0]?.id).toBe('b');
  });
  it('rechaza publicación parcial y conserva la versión anterior',async()=>{
    await db.publish(section('0',1),[row('a','0','Alpha')]);
    await expect(db.publish(section('0',2),[row('b','0','Beta')])).rejects.toThrow('incoherente');
    expect((await db.page(query())).items.map(r=>r.id)).toEqual(['a']);
    await db.publish(section('0',1,'rev2'),[row('c','0','Gamma')]);
    expect((await db.page(query())).items.map(r=>r.id)).toEqual(['c']);
    expect((await db.sectionsFor(scope))[0]?.sourceRevision).toBe('rev2');
  });
  it('mantiene categorías y universos totalmente separados',async()=>{
    await db.publish(section('0',1),[row('a','0','Primera')]);
    expect((await db.page({...query(),scope:'otro-universo'})).total).toBe(0);
    expect((await db.page({...query(),category:'systems'})).total).toBe(0);
    expect((await db.sectionsFor('otro-universo'))).toHaveLength(0);
  });
});
