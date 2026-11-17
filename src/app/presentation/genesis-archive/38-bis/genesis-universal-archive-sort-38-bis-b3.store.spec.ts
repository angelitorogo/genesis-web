import 'fake-indexeddb/auto';
import {beforeEach,afterEach,describe,it,expect} from 'vitest';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis,
  UniversalArchiveFilter38Bis} from './genesis-universal-archive-38-bis.model';

const scope='38bis-b3-repo';let sequence=0;let db:GenesisUniversalArchiveStore38Bis;
const row=(id:string,g:string,title:string,water:number|null,temp:number|null,subtype='ALL'):
  UniversalArchiveRow38Bis=>({id,scope,category:'planets',galaxyIndex:g,subtype,
    sortTitle:title.toLocaleLowerCase('es')+'\0'+id,title,subtitle:'',
    cells:{water:water===null?'No evaluable':`${water.toFixed(0)} %`,
      temperature:temp===null?'No evaluable':`${temp.toFixed(0)} °C`},
    sortNumbers:{water,temperature:temp},actions:[]});
const section=(galaxyIndex:string,count:number,sourceRevision='v1'):UniversalArchiveSection38Bis=>({
  scope,galaxyIndex,count,category:'planets',sourceRevision,indexedAtEpochMs:0,
  knowledgeComplete:true,
});
const filter=(overrides:Partial<UniversalArchiveFilter38Bis>={}):UniversalArchiveFilter38Bis=>({
  scope,category:'planets',galaxyIndex:null,subtype:null,search:'',descending:false,
  sortKey:'water',minimum:null,maximum:null,page:1,pageSize:25,...overrides,
});
const prepare=async(field='water')=>{
  for(const galaxy of ['0','1'])await db.ensureSortField(scope,'planets',galaxy,field);
};
describe('38.bis-b3 · ordenación numérica indexada de todas las galaxias',()=>{
  beforeEach(()=>{db=new GenesisUniversalArchiveStore38Bis('b3-'+(++sequence)+'-'+Date.now());});
  afterEach(async()=>{db.close();await db.delete();});
  it('ordena cifras científicas, no las cadenas ni las filas de la página visible',async()=>{
    await db.publish(section('0',2),[row('a','0','A',10.1,-90),row('b','0','B',2.8,30)]);
    await db.publish(section('1',2),[row('c','1','C',80.8,-20),row('d','1','D',null,null)]);
    await prepare();
    expect((await db.page(filter())).items.map(x=>x.id)).toEqual(['b','a','c','d']);
    expect((await db.page(filter({descending:true}))).items.map(x=>x.id)).toEqual(['c','a','b','d']);
    await prepare('temperature');
    expect((await db.page(filter({sortKey:'temperature'}))).items.map(x=>x.id)).toEqual(['a','c','b','d']);
  });
  it('combina galaxia, búsqueda, límites y paginación antes de seleccionar filas',async()=>{
    await db.publish(section('0',3),[row('a','0','Asti',10,-40),row('b','0','Astro',50,20),row('c','0','Beta',90,40)]);
    await db.publish(section('1',1),[row('d','1','Astra',60,10)]);
    await prepare();
    const result=await db.page(filter({search:'Ast',minimum:40,maximum:70}));
    expect(result.total).toBe(2);
    expect(result.items.map(x=>x.id)).toEqual(['b','d']);
    expect((await db.page(filter({galaxyIndex:'0',search:'Ast',minimum:40}))).items.map(x=>x.id)).toEqual(['b']);
    expect((await db.page(filter({minimum:40,maximum:70,pageSize:25,page:90}))).page).toBe(1);
  });
  it('invalida el índice derivado tras reemplazar un fragmento sin alterar el CT-0',async()=>{
    await db.publish(section('0',1),[row('a','0','A',12,10)]);
    await db.publish(section('1',0),[]);
    await prepare();
    expect((await db.page(filter())).items[0]?.id).toBe('a');
    await db.publish(section('0',1,'v2'),[row('b','0','B',2,10)]);
    await prepare();
    expect((await db.page(filter())).items.map(x=>x.id)).toEqual(['b']);
    expect((await db.page(filter())).total).toBe(1);
  });
  it('un límite excluye registros sin medida, que nunca equivalen a cero',async()=>{
    await db.publish(section('0',2),[row('a','0','A',null,null),row('b','0','B',0,0)]);
    await db.publish(section('1',0),[]);
    await prepare();
    expect((await db.page(filter({minimum:0,maximum:0}))).items.map(x=>x.id)).toEqual(['b']);
  });
});
