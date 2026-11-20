import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';
import {archiveSortOption38BisB3,archiveSortOptions38BisB3,archiveSortValue38BisB3}
  from './genesis-universal-archive-sort-38-bis-b3';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis,
  UniversalArchiveFilter38Bis, UniversalArchiveIndexedCategory38Bis}
  from './genesis-universal-archive-38-bis.model';
import {archiveDirtyCategories38BisB6} from './genesis-universal-archive-dirty-38-bis-b6';

const scope='GENESIS-38BIS-T3-TEST';
let store:GenesisUniversalArchiveStore38Bis;
let sequence=0;
const row=(id:string,galaxyIndex:string,category:'planets'|'moons',
  life='Sin determinar',colonies='Sin determinar',civilization='Sin determinar'):
  UniversalArchiveRow38Bis=>({
    id,scope,galaxyIndex,category,subtype:'ALL',title:id,
    sortTitle:id.toLowerCase()+'\0'+id,subtitle:'',
    cells:{life,colonies,civilization},actions:[],
  });
const section=(galaxyIndex:string,category:'planets'|'moons',count:number,rev='A'):
  UniversalArchiveSection38Bis=>({scope,galaxyIndex,category,count,
    knowledgeComplete:true,sourceRevision:rev,indexedAtEpochMs:Date.now()});
const filter=(category:'planets'|'moons',sortKey:string,descending=false,
  overrides:Partial<UniversalArchiveFilter38Bis>={}):UniversalArchiveFilter38Bis=>({
    scope,category,galaxyIndex:null,subtype:null,search:'',descending,sortKey,
    minimum:null,maximum:null,page:1,pageSize:25,...overrides,
  });

// T3 never changes the scientific source row. The same public, knowledge-safe
// projection is used by the application's Index facade and the sort store.
const galaxyNames:Record<string,string>={'0':'Zeta','1':'Áurea'};
const projection=(rows:readonly UniversalArchiveRow38Bis[])=>
  Promise.resolve(rows.map(r=>({...r,cells:{...r.cells,galaxy:galaxyNames[r.galaxyIndex]!}})));

describe('38.bis-T3 · 7 ordenaciones, persistencia e incrementos locales',()=>{
  beforeEach(()=>{store=createArchiveTestStore38Bis('38bis-t3-'+(++sequence)+'-'+Date.now());});
  afterEach(async()=>{store.close();await store.delete();});

  it('publica las 4 ordenaciones de planetas y 3 de lunas, sin otras categorías',()=>{
    const p=archiveSortOptions38BisB3('planets').map(o=>o.key);
    const m=archiveSortOptions38BisB3('moons').map(o=>o.key);
    expect(['galaxy','life','colonies','civilization'].every(k=>p.includes(k))).toBe(true);
    expect(['galaxy','life','colonies'].every(k=>m.includes(k))).toBe(true);
    expect(m).not.toContain('civilization');
    expect(archiveSortOption38BisB3('systems','life').key).toBe('name');
  });

  it('distingue Sí, No y Sin determinar: el desconocido nunca es No',()=>{
    for(const category of ['planets','moons'] as const){
      for(const field of ['life','colonies']){
        const option=archiveSortOption38BisB3(category,field);
        expect(option.kind).toBe('boolean');
        expect(archiveSortValue38BisB3(row('S','0',category,'Sí','Sí'),option)).toBe(1);
        expect(archiveSortValue38BisB3(row('N','0',category,'No','No'),option)).toBe(0);
        expect(archiveSortValue38BisB3(row('U','0',category),option)).toBeNull();
      }
    }
    const civ=archiveSortOption38BisB3('planets','civilization');
    expect(archiveSortValue38BisB3(row('S','0','planets','No','Sí','Sí'),civ)).toBe(1);
    expect(archiveSortValue38BisB3(row('N','0','planets','Sí','No','No'),civ)).toBe(0);
    expect(archiveSortValue38BisB3(row('U','0','planets'),civ)).toBeNull();
    // A technologically colonized planet can lack a native civilization.
    expect(archiveSortValue38BisB3(row('colonyOnly','0','planets','Sí','Sí','No'),civ)).toBe(0);
  });

  it('ordena booleanos globalmente antes de paginar; desconocidos al final en ambos sentidos',async()=>{
    await store.publish(section('0','planets',2),[
      row('A','0','planets','No','No'),row('D','0','planets','Sí','Sí')]);
    await store.publish(section('1','planets',2),[
      row('B','1','planets','Sí','No'),row('C','1','planets')]);
    for(const galaxy of ['0','1'])await store.ensureSortField(scope,'planets',galaxy,'life');
    expect((await store.page(filter('planets','life'))).items.map(r=>r.id)).toEqual(['A','D','B','C']);
    expect((await store.page(filter('planets','life',true))).items.map(r=>r.id)).toEqual(['B','D','A','C']);
    const subset=await store.page(filter('planets','life',true,{galaxyIndex:'1',search:'B'}));
    expect(subset.total).toBe(1);
    expect(subset.items[0]?.id).toBe('B');
  });

  it('ordena por nombre público de galaxia, no por índice ni bloque de fragmento',async()=>{
    await store.publish(section('0','moons',1),[row('Z1','0','moons')]);
    await store.publish(section('1','moons',2),[row('A1','1','moons'),row('A2','1','moons')]);
    for(const galaxy of ['0','1'])await store.ensureSortField(scope,'moons',galaxy,'galaxy',projection);
    expect((await store.page(filter('moons','galaxy'))).items.map(r=>r.id)).toEqual(['A1','A2','Z1']);
    expect((await store.page(filter('moons','galaxy',true))).items.map(r=>r.id)).toEqual(['Z1','A2','A1']);
  });

  it('conserva los campos utilizados al publicar otra revisión y reconstruye SOLO el fragmento afectado',async()=>{
    await store.publish(section('0','planets',1),[row('A','0','planets','No')]);
    await store.publish(section('1','planets',1),[row('B','1','planets','Sí')]);
    for(const galaxy of ['0','1'])await store.ensureSortField(scope,'planets',galaxy,'life');
    const prior=await store.sortRevisions.get(JSON.stringify([scope,'planets','1','life']));
    await store.publish(section('0','planets',2,'B'),[
      row('A','0','planets','No'),row('C','0','planets','Sí')]);
    expect(await store.usedSortFields38BisT3(scope,'planets')).toContain('life');
    expect((await store.sortRevisions.get(JSON.stringify([scope,'planets','1','life']))))
      .toEqual(prior);
    expect((await store.sortRevisions.get(JSON.stringify([scope,'planets','0','life'])))?.sourceRevision)
      .toBe('A');
    await store.ensureSortField(scope,'planets','0','life');
    expect((await store.page(filter('planets','life',true))).items.map(r=>r.id))
      .toEqual(['B','C','A']);
    expect((await store.sortRevisions.get(JSON.stringify([scope,'planets','0','life'])))?.sourceRevision)
      .toBe('B');
  });

  it('una reconstrucción manual con la MISMA revisión invalida igualmente el orden anterior',async()=>{
    await store.publish(section('0','planets',1),[row('A','0','planets','No')]);
    await store.ensureSortField(scope,'planets','0','life');
    await store.publish(section('0','planets',1),[row('B','0','planets','Sí')]);
    const saved=await store.sortRevisions.get(JSON.stringify([scope,'planets','0','life']));
    expect(saved?.sourceRevision).toMatch(/^stale\|/u);
    await store.ensureSortField(scope,'planets','0','life');
    expect((await store.page(filter('planets','life'))).items.map(r=>r.id)).toEqual(['B']);
  });

  it('conserva intactos los índices existentes al abrir la base y la cola es independiente',async()=>{
    await store.publish(section('0','planets',1),[row('A','0','planets','Sí')]);
    await store.ensureSortField(scope,'planets','0','life');
    const name=store.name;
    store.close();
    const reopened=createArchiveTestStore38Bis(name);
    try{
      const sections=await reopened.sectionsFor(scope);
      expect(sections).toHaveLength(1);
      expect(await reopened.usedSortFields38BisT3(scope,'planets')).toEqual(['life']);
      expect((await reopened.page(filter('planets','life'))).items[0]?.id).toBe('A');
      expect(await reopened.knowledgeJobsFor38BisT3(scope)).toHaveLength(0);
    }finally{reopened.close();}
  });

  it('una actualización VIDA9 invalida solamente los campos de categorías dependientes',()=>{
    const affected=archiveDirtyCategories38BisB6('VIDA9');
    expect(affected).toContain('planets');expect(affected).toContain('moons');
    expect(affected).toContain('civilizations');expect(affected).toContain('colonies');
    expect(affected).not.toContain('clusters');expect(affected).not.toContain('nebulae');
    expect(archiveDirtyCategories38BisB6('SECTOR')).toHaveLength(0);
  });
});
