import {describe,it,expect} from 'vitest';
import type {UniversalArchiveRow38Bis,UniversalArchiveVerifiedFounder38Bis} from './genesis-universal-archive-38-bis.model';
import {archivePublicCellsA6,archivePublicCopyA6,archivePublicSubtitleA6,
  archivePublicGalaxyNameA6,archivePublicDiscoveryStateA6,archiveSharedFounderA6}
  from './genesis-universal-archive-public-labels-a6';

const named=Object.freeze([{index:'0',title:'Elixisis'},{index:'4724385831350389329',title:'Galetheron'}]);
function row(category:UniversalArchiveRow38Bis['category'],subtitle:string,
  cells:Readonly<Record<string,string>>={}):UniversalArchiveRow38Bis {
  return {id:'r',scope:'g',category,galaxyIndex:'0',subtype:'ALL',sortTitle:'a',
    title:'Aaras A-11 I',subtitle,cells,actions:[]};
}
const founder=(id:string):UniversalArchiveVerifiedFounder38Bis=>({
  id,galaxyIndex:'0',tier:'ADVANCED',name:'Ismera on7 · Xephus A-3',
  speciesName:'Ismera on7',planetName:'Xephus A-3',
  route:['/system','0','20','1','planet','2'],
});

describe('38.bis-a6 · designaciones públicas y procedencias sin códigos internos',()=>{
  it('usa nombres de galaxias reales sin inferir nombres a partir del índice',()=>{
    expect(archivePublicGalaxyNameA6('0',named)).toBe('Elixisis');
    expect(archivePublicGalaxyNameA6('4724385831350389329',named)).toBe('Galetheron');
    expect(archivePublicGalaxyNameA6('20',named)).toBe('Galaxia sin designación pública');
    expect(archivePublicDiscoveryStateA6(5)).toBe('Confirmada');
  });
  it('limpia subtítulos cacheados sin alterar nombres de especies ni notación científica',()=>{
    expect(archivePublicSubtitleA6(row('sectors','Galaxia 0'),named)).toBe('Elixisis');
    expect(archivePublicSubtitleA6(row('colonized-moons','1 colonia verificadas · VIDA.8'),named))
      .toBe('1 colonia verificada');
    expect(archivePublicCopyA6('Colonia tecnológica · VIDA.8')).toBe('Colonia tecnológica');
    expect(archivePublicCopyA6('Evidencia CT-0 · VIDA.9')).toBe('Evidencia');
    expect(archivePublicCopyA6('Tipo espectral B-V · 0,012 M⊕')).toBe('Tipo espectral B-V · 0,012 M⊕');
  });
  it('proyecta especie y planeta natal verificados en filas de colonias individuales y agrupadas',()=>{
    const data={body:'Aaras A-11 I',kind:'Luna',system:'Aaras',count:'1',
      species:'Ismera on7',originPlanet:'Xephus A-3',tier:'Avanzada',
      technology:'Subsuperficie'};
    for(const category of ['colonies','colonized-moons','colonized-planets'] as const){
      const visible=archivePublicCellsA6(row(category,'1 colonia · VIDA.8',data));
      expect(visible).toContainEqual({key:'species',value:'Ismera on7'});
      expect(visible).toContainEqual({key:'originPlanet',value:'Xephus A-3'});
    }
  });
  it('no muestra especies ni mundos natales si solo existe una referencia colonial sin confirmar',()=>{
    const visible=archivePublicCellsA6(row('colonized-moons','1 colonia',{system:'Aaras',count:'1',
      origin:'Procedencia no verificable'}));
    expect(visible.some(item=>item.key==='species'||item.key==='originPlanet')).toBe(false);
    expect(visible).toContainEqual({key:'origin',value:'Procedencia no verificable'});
  });
  it('agrega una fundadora solo cuando todas las colonias comparten la fuente exacta',()=>{
    const common=founder('source-1');
    const verified=new Map([['c-1',common],['c-2',common]]);
    expect(archiveSharedFounderA6(['c-1','c-2'],verified)).toEqual(common);
    expect(archiveSharedFounderA6(['c-1'],verified)).toEqual(common);
    expect(archiveSharedFounderA6(['c-1','c-3'],verified)).toBeNull();
    expect(archiveSharedFounderA6(['c-1','c-1'],verified)).toBeNull();
    expect(archiveSharedFounderA6([],verified)).toBeNull();
  });
  it('rechaza agrupar fundadoras distintas aunque compartan nombre o nivel',()=>{
    const first=founder('source-1');
    const different={...first,id:'source-2'};
    expect(archiveSharedFounderA6(['c-1','c-2'],new Map([['c-1',first],['c-2',different]])))
      .toBeNull();
    const withoutPublicNames={...first,speciesName:undefined};
    expect(archiveSharedFounderA6(['c-1'],new Map([['c-1',withoutPublicNames]])))
      .toBeNull();
  });
});
