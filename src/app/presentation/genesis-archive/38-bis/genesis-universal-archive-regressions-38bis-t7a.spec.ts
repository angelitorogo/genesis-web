import {describe,it,expect} from 'vitest';
import {archiveSortOptions38BisB3,archiveSortOption38BisB3,archiveSortValue38BisB3}
  from './genesis-universal-archive-sort-38-bis-b3';
import {archiveCompactFields38BisB1} from './genesis-universal-archive-list-layout-38-bis-b1';
import type {UniversalArchiveIndexedCategory38Bis,UniversalArchiveRow38Bis}
  from './genesis-universal-archive-38-bis.model';

const row=(category:UniversalArchiveIndexedCategory38Bis,cells:Record<string,string>,
  sortNumbers?:Record<string,number|null>):UniversalArchiveRow38Bis=>({
  id:'t7a',scope:'scope',galaxyIndex:'1',category,subtype:'ALL',title:'Objeto',subtitle:'',
  sortTitle:'objeto',cells,actions:[],...(sortNumbers?{sortNumbers}:{})
});
const options=(category:UniversalArchiveIndexedCategory38Bis)=>
  archiveSortOptions38BisB3(category).map(option=>option.key);

describe('GENESIS 38.bis-T7a · compatibilidad ordenaciones T3 y población colonial T7',()=>{
  it('mantiene la ordenación anterior de planetas y lunas por galaxia y biología confirmada',()=>{
    for(const field of ['galaxy','life','colonies','civilization'])
      expect(options('planets')).toContain(field);
    for(const field of ['galaxy','life','colonies'])expect(options('moons')).toContain(field);
  });
  it('convierte criterios booleanos sin inventar un No para datos ausentes',()=>{
    for(const field of ['life','colonies','civilization']){
      const option=archiveSortOption38BisB3('planets',field);
      expect(archiveSortValue38BisB3(row('planets',{[field]:'Sí'}),option)).toBe(1);
      expect(archiveSortValue38BisB3(row('planets',{[field]:'No'}),option)).toBe(0);
      expect(archiveSortValue38BisB3(row('planets',{[field]:'No evaluable'}),option)).toBeNull();
    }
  });
  it('conserva población solo para las tres vistas coloniales',()=>{
    for(const category of ['colonies','colonized-planets','colonized-moons'] as const){
      expect(archiveSortOption38BisB3(category,'population').kind).toBe('number');
      const option=archiveSortOption38BisB3(category,'population');
      expect(archiveSortValue38BisB3(row(category,{population:'151–5.000'},
        {population:2575.5}),option)).toBe(2575.5);
      expect(archiveSortValue38BisB3(row(category,{population:'151–5.000'}),
        option)).toBeNull();
    }
    for(const category of ['planets','moons','civilizations'] as const)
      expect(archiveSortOption38BisB3(category,'population').key).toBe('name');
  });
  it('no elimina indicadores de civilización y presenta como indeterminados los datos no comprobables',()=>{
    const fields=archiveCompactFields38BisB1(row('planets',{
      life:'No evaluable',colonies:'No evaluable',civilization:'No evaluable'}),'Galaxia');
    for(const field of ['life','colonies','civilization'])
      expect(fields.find(x=>x.key===field)?.value).toBe('Sin determinar');
  });
  it('muestra los intervalos de población en cada categoría colonial',()=>{
    for(const category of ['colonies','colonized-planets','colonized-moons'] as const){
      const fields=archiveCompactFields38BisB1(row(category,{
        population:'151–5.000'}),'Galaxia');
      expect(fields.find(x=>x.key==='population')?.value).toContain('151–5.000');
    }
  });
});
