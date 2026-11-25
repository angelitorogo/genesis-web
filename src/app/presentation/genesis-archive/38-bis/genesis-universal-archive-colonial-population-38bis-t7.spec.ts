import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import type {Vida8Colony} from '../../../domain/life/vida8-technological-colonization';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';
import type {UniversalArchiveRow38Bis,UniversalArchiveSection38Bis,
  UniversalArchiveFilter38Bis,UniversalArchiveIndexedCategory38Bis}
  from './genesis-universal-archive-38-bis.model';
import {archiveColonyPopulationInterval38BisT7b,archiveColonialPopulation38BisT7,archiveColonialPopulationLabel38BisT7}
  from './genesis-universal-archive-colonial-population-38bis-t7';
import {projectColonyRow} from './genesis-universal-archive-38-bis.index';
import {archiveCompactFields38BisB1} from './genesis-universal-archive-list-layout-38-bis-b1';
import {archiveSortOptions38BisB3,archiveSortOption38BisB3,archiveSortValue38BisB3}
  from './genesis-universal-archive-sort-38-bis-b3';
import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import {GenesisUniversalArchiveStore38Bis} from './genesis-universal-archive-38-bis.store';

const scope='T7-verified';
function colony(id:string,low:number,high:number):Vida8Colony {
  return {id,origin:{tier:'ADVANCED'},settlement:{id:'settlement-'+id,
    habitatTechnology:'SEALED_SURFACE',function:'RESEARCH',
    colonialPopulationRange:[low,high]},provenance:'TECHNOLOGICAL_COLONIZATION'} as unknown as Vida8Colony;
}
function record(kind:'PLANET'|'MOON',key:string):Vida9BiologyRecord {
  return {bodyStorageKey:key,identity:{kind,galaxyIndex:'1',sectorKey:'2',
    galacticObjectIndex:'3',bodyIndex:'7',moonIndex:kind==='MOON'?'1':null}} as unknown as Vida9BiologyRecord;
}
function project(category:'colonies'|'colonized-planets'|'colonized-moons',
  key:string,entries:Vida8Colony[],individual?:Vida8Colony,galaxyIndex='1'){
  return projectColonyRow(scope,category,galaxyIndex,
    record(category==='colonized-moons'?'MOON':'PLANET',key),'Mundo '+key,'Sistema',entries,individual);
}
function section(category:UniversalArchiveIndexedCategory38Bis,galaxyIndex:string,
  rows:readonly UniversalArchiveRow38Bis[],sourceRevision='T7-1'):UniversalArchiveSection38Bis{
  return {scope,category,galaxyIndex,sourceRevision,indexedAtEpochMs:0,
    count:rows.length,knowledgeComplete:false};
}
function filter(category:UniversalArchiveIndexedCategory38Bis,
  opts:Partial<UniversalArchiveFilter38Bis>={}):UniversalArchiveFilter38Bis {
  return {scope,category,galaxyIndex:null,subtype:null,search:'',descending:false,
    sortKey:'population',minimum:null,maximum:null,page:1,pageSize:25,...opts};
}

describe('38.bis-T7b · recuperación científica de bandas VIDA.8 CT-0',()=>{
  const legacy=(id:string,band:'OUTPOST'|'SETTLEMENT'|'CITY'|'NETWORK')=>({
    ...colony(id,12,150),settlement:{id:'s-'+id,habitatTechnology:'SEALED_SURFACE',
      function:'RESEARCH',populationBand:band},
  }) as unknown as Vida8Colony;
  it('recupera cada intervalo desde la banda oficial cuando falta la tupla persistida',()=>{
    expect(archiveColonialPopulation38BisT7([legacy('a','OUTPOST')])).toEqual({
      minimum:12,maximum:150,midpoint:81,colonyCount:1});
    expect(archiveColonialPopulation38BisT7([legacy('a','SETTLEMENT')])?.minimum).toBe(151);
    expect(archiveColonialPopulation38BisT7([legacy('b','CITY')])?.maximum).toBe(120000);
    expect(archiveColonialPopulation38BisT7([legacy('c','NETWORK')])?.maximum).toBe(1500000);
    expect(archiveColonyPopulationInterval38BisT7b(legacy('c','NETWORK'))).toEqual([120001,1500000]);
  });
  it('ordena individual/agregado con fuentes mixtas sin duplicar ninguna colonia',()=>{
    const native=colony('a',151,5000);
    const old=legacy('b','CITY');
    expect(project('colonies','A',[native,old],old).sortNumbers?.['population']).toBe(62500.5);
    const aggregated=project('colonized-planets','A',[native,old]);
    const lunar=project('colonized-moons','B',[old,native]);
    expect(aggregated.cells['population']).toContain('5.152–125.000');
    expect(lunar.sortNumbers?.['population']).toBe(65076);
  });
  it('no crea habitantes si no existe banda o si hay un intervalo presente inválido',()=>{
    const missing={settlement:{populationBand:'DESCONOCIDA'}} as unknown as Vida8Colony;
    expect(archiveColonialPopulation38BisT7([missing])).toBeNull();
    const corrupt={...legacy('a','CITY'),settlement:{...legacy('a','CITY').settlement,
      colonialPopulationRange:[-3,12]}} as unknown as Vida8Colony;
    expect(archiveColonialPopulation38BisT7([corrupt])).toBeNull();
    expect(archiveColonialPopulation38BisT7([legacy('a','CITY'),missing])).toBeNull();
  });
});

describe('38.bis-T7 · rangos poblacionales VIDA.8 sin inventar habitantes',()=>{
  it('conserva ambos extremos y usa el punto medio solo para ordenar',()=>{
    const one=archiveColonialPopulation38BisT7([colony('a',12,150)]);
    expect(one).toEqual({minimum:12,maximum:150,midpoint:81,colonyCount:1});
    expect(archiveColonialPopulationLabel38BisT7(one)).toBe('12–150');
  });
  it('suma cada colonia una única vez en el cuerpo, sin población nativa',()=>{
    const all=[colony('a',151,5000),colony('b',5001,120000),colony('c',12,150)];
    expect(archiveColonialPopulation38BisT7(all)).toEqual({minimum:5164,
      maximum:125150,midpoint:65157,colonyCount:3});
    expect(archiveColonialPopulation38BisT7([all[1]!])?.midpoint).toBe(62500.5);
  });
  it('desconocidos, tuplas corruptas o desbordamientos nunca equivalen a cero',()=>{
    expect(archiveColonialPopulation38BisT7([])).toBeNull();
    expect(archiveColonialPopulation38BisT7([colony('a',12,150),
      {settlement:{}} as unknown as Vida8Colony])).toBeNull();
    expect(archiveColonialPopulation38BisT7([colony('a',-1,150)])).toBeNull();
    expect(archiveColonialPopulation38BisT7([colony('a',150,12)])).toBeNull();
    expect(archiveColonialPopulation38BisT7([colony('a',Number.NaN,12)])).toBeNull();
    expect(archiveColonialPopulation38BisT7([colony('a',Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER),
      colony('b',12,150)])).toBeNull();
    expect(archiveColonialPopulationLabel38BisT7(null)).toBe('No evaluable');
  });
  it('proyecta el dato individual y agregado sin atribuir fundadoras desconocidas',()=>{
    const a=colony('a',12,150),b=colony('b',151,5000);
    const single=project('colonies','body',[a,b],a);
    const planet=project('colonized-planets','body',[a,b]);
    const moon=project('colonized-moons','moon',[a,b]);
    expect(single.cells['population']).toContain('12–150');
    expect(planet.cells['population']).toContain('163–5.150');
    expect(moon.cells['population']).toBe(planet.cells['population']);
    expect(single.sortNumbers?.['population']).toBe(81);
    expect(planet.sortNumbers?.['population']).toBe(2656.5);
    expect(moon.sortNumbers?.['population']).toBe(2656.5);
    expect(planet.cells['species']).toBeUndefined();
    expect(moon.cells['species']).toBeUndefined();
    expect(single.actions[0]?.label).toBe('Abrir ficha del cuerpo');
    expect(archiveCompactFields38BisB1(moon,'Galaxia 1')
      .some(field=>field.key==='population'&&field.label==='Población colonial total')).toBe(true);
  });
  it('expone la opción numérica únicamente en las tres categorías coloniales',()=>{
    for(const category of ['colonies','colonized-planets','colonized-moons'] as const){
      const option=archiveSortOption38BisB3(category,'population');
      expect(option.kind).toBe('number');
      expect(archiveSortOptions38BisB3(category).filter(x=>x.key==='population')).toHaveLength(1);
      expect(archiveSortValue38BisB3(project(category,'key',[colony('a',12,150)]),option)).toBe(81);
    }
    const noNumeric={...project('colonies','legacy',[colony('x',12,150)]),sortNumbers:undefined};
    expect(archiveSortValue38BisB3(noNumeric,archiveSortOption38BisB3('colonies','population'))).toBeNull();
    expect(archiveSortOption38BisB3('planets','population').key).toBe('name');
    expect(archiveSortOption38BisB3('moons','population').key).toBe('name');
  });
});

describe('38.bis-T7 · índices globales de tres categorías coloniales',()=>{
  let store:GenesisUniversalArchiveStore38Bis;let n=0;
  beforeEach(()=>{store=createArchiveTestStore38Bis('t7-'+(++n)+'-'+Date.now());});
  afterEach(async()=>{store.close();await store.delete();});
  for(const category of ['colonies','colonized-planets','colonized-moons'] as const){
    it(`${category}: orden ascendente/descendente, filtros y paginación entre galaxias`,async()=>{
      const low=[colony('a',12,150)],medium=[colony('b',151,5000)],
        high=[colony('c',5001,120000)],missing=[{...colony('d',12,150),
          settlement:{...colony('d',12,150).settlement,colonialPopulationRange:[20,10] as const}}];
      const a=project(category,'a',low,category==='colonies'?low[0]:undefined,'0');
      const b=project(category,'b',medium,category==='colonies'?medium[0]:undefined,'1');
      const c=project(category,'c',high,category==='colonies'?high[0]:undefined,'0');
      const d=project(category,'d',missing,category==='colonies'?missing[0]:undefined,'1');
      await store.publish(section(category,'0',[a,c]),[a,c]);
      await store.publish(section(category,'1',[b,d]),[b,d]);
      for(const galaxy of ['0','1'])await store.ensureSortField(scope,category,galaxy,'population');
      const first=await store.page(filter(category));
      expect(first.items.map(r=>r.id)).toEqual([a,b,c,d].map(r=>r.id));
      expect((await store.page(filter(category,{descending:true}))).items.map(r=>r.id))
        .toEqual([c,b,a,d].map(r=>r.id));
      expect((await store.page(filter(category,{minimum:100,maximum:5000}))).items.map(r=>r.id))
        .toEqual([b.id]);
      expect((await store.page(filter(category,{galaxyIndex:'0'}))).items.map(r=>r.id))
        .toEqual([a.id,c.id]);
      expect((await store.page(filter(category,{page:2,pageSize:25}))).page).toBe(1);
      expect((await store.page(filter(category,{minimum:0,maximum:0}))).total).toBe(0);
      // New CONFIRMED revision: publish atomically invalidates the former sort.
      const replacement=project(category,'new',[colony('e',120001,1500000)],
        category==='colonies'?colony('e',120001,1500000):undefined,'0');
      await store.publish(section(category,'0',[replacement],'T7-2'),[replacement]);
      await store.ensureSortField(scope,category,'0','population');
      const updated=await store.page(filter(category,{descending:true}));
      expect(updated.items.map(r=>r.id)).toEqual([replacement.id,b.id,d.id]);
    });
  }
});
