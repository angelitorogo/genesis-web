import {describe,it,expect} from 'vitest';
import {archiveSortOptions38BisB3,archiveSortOption38BisB3,
  archiveNumericCell38BisB3,archiveSortValue38BisB3,archiveRangeBoundary38BisB3}
  from './genesis-universal-archive-sort-38-bis-b3';
import type {UniversalArchiveIndexedCategory38Bis,UniversalArchiveRow38Bis}
  from './genesis-universal-archive-38-bis.model';

const row=(category:UniversalArchiveIndexedCategory38Bis,cells:Record<string,string>,
  sortNumbers?:Record<string,number|null>):UniversalArchiveRow38Bis=>({id:'1',scope:'u',category,
    galaxyIndex:'0',subtype:'ADVANCED',title:'Cuerpo',sortTitle:'cuerpo\0'+1,subtitle:'',
    cells,...(sortNumbers?{sortNumbers}:{}),actions:[]});

describe('38.bis-b3 · criterios científicos de búsqueda/ordenación',()=>{
  it('ofrece a cada categoría magnitudes reales y no opciones globales ficticias',()=>{
    const planets=archiveSortOptions38BisB3('planets').map(v=>v.key);
    expect(planets).toContain('water');expect(planets).toContain('temperature');
    expect(archiveSortOptions38BisB3('comets').map(v=>v.key)).toContain('semi-major-axis');
    expect(archiveSortOptions38BisB3('civilizations').map(v=>v.key)).toContain('tier');
    expect(archiveSortOptions38BisB3('moons').map(v=>v.key)).toContain('subsurface-ocean');
    expect(archiveSortOptions38BisB3('extremes').map(v=>v.key)).not.toContain('temperature');
  });
  it('analiza cantidades españolas, decimales y notación científica sin confundirlas',()=>{
    expect(archiveNumericCell38BisB3('1.234,5 km')).toBe(1234.5);
    expect(archiveNumericCell38BisB3('−221,6 °C')).toBe(-221.6);
    expect(archiveNumericCell38BisB3('6,52E-7 M⊕')).toBe(6.52e-7);
    expect(archiveNumericCell38BisB3('0 %')).toBe(0);
  });
  it('nunca convierte ausencias en un cero físico',()=>{
    for(const value of ['No evaluable','No determinado','Sin registro',''])
      expect(archiveNumericCell38BisB3(value)).toBeNull();
  });
  it('prioriza los valores numéricos reales del catálogo frente a los redondeos visuales',()=>{
    const r=row('planets',{water:'13 %',temperature:'18 °C'},
      {water:13.274,temperature:18.433});
    expect(archiveSortValue38BisB3(r,archiveSortOption38BisB3('planets','water'))).toBe(13.274);
    expect(archiveSortValue38BisB3(r,archiveSortOption38BisB3('planets','temperature'))).toBe(18.433);
  });
  it('ordena niveles de civilización con jerarquía científica estable',()=>{
    const option=archiveSortOption38BisB3('civilizations','tier');
    const r=row('civilizations',{tier:'Civilización avanzada'});
    expect(archiveSortValue38BisB3({...r,subtype:'PRIMITIVE'},option)).toBe(0);
    expect(archiveSortValue38BisB3({...r,subtype:'ADVANCED'},option)).toBe(1);
    expect(archiveSortValue38BisB3({...r,subtype:'VERY_ADVANCED'},option)).toBe(2);
    expect(archiveSortValue38BisB3({...r,subtype:'UNCLASSIFIED'},option)).toBeNull();
  });
  it('no admite un criterio desconocido para otra categoría',()=>{
    expect(archiveSortOption38BisB3('moons','planetary-ground-truth').key).toBe('name');
    expect(archiveSortOption38BisB3('comets','water').key).toBe('name');
  });
  it('verifica límites numéricos, incluidos negativos, sin inventar rangos',()=>{
    expect(archiveRangeBoundary38BisB3('-25,5')).toBe(-25.5);
    expect(archiveRangeBoundary38BisB3('0')).toBe(0);
    expect(archiveRangeBoundary38BisB3('No disponible')).toBeNull();
    expect(archiveRangeBoundary38BisB3('')).toBeNull();
  });
});
