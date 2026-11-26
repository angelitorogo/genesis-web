import {describe,expect,it} from 'vitest';
import {createArchiveTestStore38Bis} from './genesis-universal-archive-test-db-38bis';
import {GENESIS_UNIVERSAL_ARCHIVE_REVISION_38BIS,
  UNIVERSAL_ARCHIVE_CATEGORIES_38BIS,type UniversalArchiveRow38Bis,
  type UniversalArchiveSection38Bis} from './genesis-universal-archive-38-bis.model';
import {archiveSortOptions38BisB3,archiveSortValue38BisB3} from './genesis-universal-archive-sort-38-bis-b3';
import {archiveDirtyCategories38BisB6} from './genesis-universal-archive-dirty-38-bis-b6';

const seed='7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const scope=`${GENESIS_UNIVERSAL_ARCHIVE_REVISION_38BIS}|${seed}|3`;

describe('STARCAT.1 — archivo global y migración sin reconstruir otras categorías',()=>{
  it('incorpora Estrellas sin eliminar Sistemas ni las categorías existentes',()=>{
    const categories=UNIVERSAL_ARCHIVE_CATEGORIES_38BIS.map(c=>c.id);
    expect(categories).toContain('stars');
    expect(categories.indexOf('stars')).toBe(categories.indexOf('systems')+1);
    expect(categories).toContain('colonized-moons');
  });
  it('indexa nuevos componentes para confirmaciones y restauraciones, nunca para VIDA.9 o BODY',()=>{
    for(const kind of ['GALAXY','SYSTEM','RESTORE'] as const)
      expect(archiveDirtyCategories38BisB6(kind)).toContain('stars');
    for(const kind of ['BODY','VIDA9','CIVILIZATION','SECTOR','GALACTIC_OBJECT'] as const)
      expect(archiveDirtyCategories38BisB6(kind)).not.toContain('stars');
  });
  it('mantiene los radios y temperaturas sin redondear y añade ordenaciones evolutivas',()=>{
    const options=archiveSortOptions38BisB3('stars');
    expect(options.find(option=>option.key==='radius')?.kind).toBe('number');
    expect(options.find(option=>option.key==='temperature')?.kind).toBe('number');
    expect(options.find(option=>option.key==='evolution')?.kind).toBe('text');
    // Fila de catálogo completa: evita ocultar contratos nuevos con un cast parcial.
    const row:UniversalArchiveRow38Bis={
      id:JSON.stringify([scope,'stars','0','Paedoria-A']),scope,category:'stars',galaxyIndex:'0',
      subtype:'WHITE_DWARF',sortTitle:'paedoria a',title:'Paedoria A',subtitle:'',
      cells:{radius:'0,01 R☉',temperature:'12.500,5 K'},
      sortNumbers:{radius:0.0090123456,temperature:12500.5},actions:[],
    };
    expect(archiveSortValue38BisB3(row,
      options.find(option=>option.key==='radius')!)).toBe(0.0090123456);
    expect(archiveSortValue38BisB3(row,
      options.find(option=>option.key==='temperature')!)).toBe(12500.5);
  });
  it('añade solo trabajos faltantes, idempotentemente, preservando los fragmentos ya guardados',async()=>{
    const store=createArchiveTestStore38Bis('archive-starcat-migrate-'+Date.now());
    const systemSection:UniversalArchiveSection38Bis={scope,category:'systems',galaxyIndex:'7',
      sourceRevision:'old-system-v3',count:0,indexedAtEpochMs:3,knowledgeComplete:true};
    try{
      await store.publish(systemSection,[]);
      expect(await store.enqueueMissingStarsStarcat1()).toBe(1);
      expect(await store.enqueueMissingStarsStarcat1()).toBe(0);
      const jobs=await store.knowledgeJobsFor38BisT3(scope);
      expect(jobs.filter(j=>j.category==='stars'&&j.galaxyIndex==='7')).toHaveLength(1);
      const saved=await store.sections.get([scope,'systems','7']);
      expect(saved?.sourceRevision).toBe('old-system-v3');
      expect(await store.sections.get([scope,'stars','7'])).toBeUndefined();
    }finally{store.close();await store.delete();}
  });
});
