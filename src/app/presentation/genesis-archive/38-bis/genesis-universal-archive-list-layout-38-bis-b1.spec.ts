import {describe,it,expect} from 'vitest';
import type {UniversalArchiveRow38Bis,UniversalArchiveIndexedCategory38Bis,
  UniversalArchiveAction38Bis} from './genesis-universal-archive-38-bis.model';
import {archiveCompactFields38BisB1,archiveCompactActions38BisB1}
  from './genesis-universal-archive-list-layout-38-bis-b1';
import {archivePageBiologyLocator38BisB1,archiveObservedLife38BisB1}
  from './genesis-universal-archive-biology-page-38-bis-b1';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';

const action=(label:string,route:readonly string[]):UniversalArchiveAction38Bis=>({label,route});
function row(category:UniversalArchiveIndexedCategory38Bis,
  cells:Record<string,string>={},actions:readonly UniversalArchiveAction38Bis[]=[]):UniversalArchiveRow38Bis {
  return {id:'0',scope:'u',category,galaxyIndex:'42',subtype:'ALL',sortTitle:'x',
    title:'Aaras',subtitle:'',cells,actions};
}
const keys=(category:UniversalArchiveIndexedCategory38Bis)=>
  archiveCompactFields38BisB1(row(category), 'Galaxia comprobada').map(f=>f.label);

describe('38.bis-b1 · listados compactos, campos científicos y navegación',()=>{
  it('preserva orden de los campos solicitado para sistemas, planetas y lunas',()=>{
    expect(keys('systems')).toEqual(['Galaxia','Estado','Tipo de sistema']);
    expect(keys('planets')).toEqual(['Sistema','Galaxia','Estado','Tipo','Masa','Radio','Vida','Colonias','Civilización']);
    expect(keys('moons')).toEqual(['Planeta','Sistema','Galaxia','Composición','Masa','Radio','Vida','Colonias']);
  });
  it('conserva todas las familias de objetos y exactamente las magnitudes solicitadas',()=>{
    expect(keys('clusters')).toEqual(['Tipo','Estado','Estrellas','Masa','Edad']);
    expect(keys('nebulae')).toEqual(['Tipo','Estado','Radio','Masa','Temperatura']);
    expect(keys('extremes')).toEqual(['Tipo','Estado','Familia','Semántica']);
    for(const kind of ['asteroids','comets','tno','captured'] as const)
      expect(keys(kind)).toEqual(['Sistema','Anfitrión','Subtipo','Diámetro','Órbita']);
  });
  it('mantiene la procedencia y el planeta anfitrión de las colonias sin inventarlos',()=>{
    expect(keys('civilizations')).toEqual(['Planeta','Sistema','Nivel','Linaje']);
    expect(keys('colonies')).toEqual(['Sistema','Especie fundadora','Planeta natal','Clase']);
    expect(keys('colonized-planets')).toEqual(['Galaxia','Sistema','Colonias','Especie fundadora','Planeta natal','Clase']);
    expect(keys('colonized-moons')).toEqual(['Galaxia','Sistema','Planeta','Colonias','Especie fundadora','Planeta natal','Clase']);
    expect(archiveCompactFields38BisB1(row('colonized-moons',{count:'1',planet:'Aaras A-11'}),'Elixisis')
      .find(field=>field.key==='planet')?.value).toBe('Aaras A-11');
    expect(archiveCompactFields38BisB1(row('colonies',{count:'1'}),'Elixisis')
      .find(field=>field.key==='species')?.value).toBe('No evaluable');
  });
  it('no inventa acciones ni enlaces al mundo natal desconocido',()=>{
    const available=action('Abrir ficha del cuerpo',['/system','42']);
    const unknown=row('colonies',{system:'Aaras'},[available]);
    expect(archiveCompactActions38BisB1(unknown)).toEqual([available]);
    const origins=row('colonies',{},[
      action('Ver mundo natal',['/system','origin']),available]);
    expect(archiveCompactActions38BisB1(origins).map(a=>a.label))
      .toEqual(['Abrir ficha del cuerpo','Ver mundo natal']);
  });
  it('ordena los dos botones de sistemas y tres de lunas por su función',()=>{
    const a=action('Abrir sistema',['/system']);
    const b=action('Abrir planeta anfitrión',['/system','planet']);
    const c=action('Abrir ficha científica',['/system','planet','moon']);
    expect(archiveCompactActions38BisB1(row('moons',{},[a,b,c]))).toEqual([c,b,a]);
    const host=action('Ir al sistema',['/system']);
    expect(archiveCompactActions38BisB1(row('systems',{},[host,c]))).toEqual([c,host]);
  });
  it('vida y colonias no se infieren de la ausencia de un registro',()=>{
    const route=['/system','42','10','5','planet','8','moon','0'];
    const lunar=row('moons',{},[action('Abrir ficha científica',route)]);
    expect(archivePageBiologyLocator38BisB1(lunar)?.bodyStorageKey).toBe('42:10:5:8:MOON:0');
    expect(archivePageBiologyLocator38BisB1(row('moons'))).toBeNull();
    expect(archivePageBiologyLocator38BisB1(row('moons',{},[
      action('Abrir ficha científica',['/system','99','10','5','planet','8','moon','0'])]))).toBeNull();
    expect(archiveCompactFields38BisB1(lunar,'Elixisis').find(f=>f.key==='life')?.value)
      .toBe('Sin determinar');
    expect(archiveObservedLife38BisB1({nativeLifePresent:false,introducedLifePresent:false,
      colonialPopulationPresent:true} as Vida9BiologyRecord)).toBe('Sí');
    expect(archiveObservedLife38BisB1({nativeLifePresent:false,introducedLifePresent:false,
      colonialPopulationPresent:false} as Vida9BiologyRecord)).toBe('No');
  });
});
