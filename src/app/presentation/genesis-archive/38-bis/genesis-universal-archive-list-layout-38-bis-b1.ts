/** 38.bis-b1 · Fichas compactas en dos líneas para el índice observado.
 * No consulta datos privados ni infiere valores científicos ausentes.
 */
import type {UniversalArchiveRow38Bis,UniversalArchiveIndexedCategory38Bis,
  UniversalArchiveAction38Bis} from './genesis-universal-archive-38-bis.model';
import {archivePublicCopyA6} from './genesis-universal-archive-public-labels-a6';

export interface ArchiveCompactField38BisB1 {
  readonly key:string;
  readonly label:string;
  readonly value:string;
}

type Definition = readonly (readonly [key:string,label:string])[];
const DEFINITIONS:Readonly<Record<Exclude<UniversalArchiveIndexedCategory38Bis,'sectors'>,Definition>>={
  systems:[['galaxy','Galaxia'],['state','Estado'],['multiplicity','Tipo de sistema']],
  planets:[['system','Sistema'],['galaxy','Galaxia'],['state','Estado'],['type','Tipo'],
    ['mass','Masa'],['radius','Radio'],['life','Vida'],['colonies','Colonias'],
    ['civilization','Civilización']],
  moons:[['planet','Planeta'],['system','Sistema'],['galaxy','Galaxia'],
    ['composition','Composición'],['mass','Masa'],['radius','Radio'],
    ['life','Vida'],['colonies','Colonias']],
  clusters:[['type','Tipo'],['state','Estado'],['stars','Estrellas'],['mass','Masa'],['age','Edad']],
  nebulae:[['type','Tipo'],['state','Estado'],['radius','Radio'],['mass','Masa'],
    ['temperature','Temperatura']],
  extremes:[['type','Tipo'],['state','Estado'],['family','Familia'],['semantic','Semántica']],
  asteroids:[['system','Sistema'],['host','Anfitrión'],['subtype','Subtipo'],
    ['diameter','Diámetro'],['orbit','Órbita']],
  comets:[['system','Sistema'],['host','Anfitrión'],['subtype','Subtipo'],
    ['diameter','Diámetro'],['orbit','Órbita']],
  tno:[['system','Sistema'],['host','Anfitrión'],['subtype','Subtipo'],
    ['diameter','Diámetro'],['orbit','Órbita']],
  captured:[['system','Sistema'],['host','Anfitrión'],['subtype','Subtipo'],
    ['diameter','Diámetro'],['orbit','Órbita']],
  civilizations:[['planet','Planeta'],['system','Sistema'],['tier','Nivel'],['lineage','Linaje']],
  colonies:[['system','Sistema'],['species','Especie fundadora'],
    ['originPlanet','Planeta natal'],['kind','Clase'],['population','Población colonial']],
  'colonized-planets':[['galaxy','Galaxia'],['system','Sistema'],['count','Colonias'],
    ['species','Especie fundadora'],['originPlanet','Planeta natal'],['kind','Clase'],
    ['population','Población colonial total']],
  'colonized-moons':[['galaxy','Galaxia'],['system','Sistema'],['planet','Planeta'],
    ['count','Colonias'],['species','Especie fundadora'],['originPlanet','Planeta natal'],['kind','Clase'],
    ['population','Población colonial total']],
};

/** Conserva la posición visual del campo, incluso si el censo aún no lo permite evaluar. */
export function archiveCompactFields38BisB1(row:UniversalArchiveRow38Bis,
  galaxyName:string):readonly ArchiveCompactField38BisB1[] {
  const definition=row.category==='sectors'?[]:DEFINITIONS[row.category];
  return definition.map(([key,label])=>{
    const original=key==='galaxy'?galaxyName:row.cells[key];
    const value=typeof original==='string'&&original.trim()
      ? archivePublicCopyA6(original) : 'No evaluable';
    const displayed=(key==='life'||key==='colonies'||key==='civilization') &&
      (value==='No evaluable'||value==='No determinado'||value==='Sin registro')
      ?'Sin determinar':value;
    // T7c: las filas persistidas en IndexedDB antes de esta presentación
    // conservan el sufijo obsoleto. Limpiarlo aquí evita reindexar o alterar
    // la cifra científica, la ordenación o el fragmento persistido.
    const colonial=(row.category==='colonies'||row.category==='colonized-planets'||
      row.category==='colonized-moons');
    const compact=colonial&&key==='population'
      ? displayed.replace(/\s+hab\.\s*\(intervalo estimado\)\s*$/iu,'')
      : displayed;
    return {key,label,value:compact||'No evaluable'};
  });
}

/** Las rutas se leen exclusivamente del catálogo certificado: jamás se construyen
 * enlaces adivinando localizadores, ni se revela un origen sin verificar. */
export function archiveCompactActions38BisB1(row:UniversalArchiveRow38Bis):readonly UniversalArchiveAction38Bis[]{
  const labels:Readonly<Record<Exclude<UniversalArchiveIndexedCategory38Bis,'sectors'>,readonly string[]>>={
    systems:['Abrir ficha científica','Ir al sistema'],
    planets:['Abrir ficha científica','Abrir sistema anfitrión'],
    moons:['Abrir ficha científica','Abrir planeta anfitrión','Abrir sistema'],
    clusters:['Abrir ficha científica'],nebulae:['Abrir ficha científica'],
    extremes:['Abrir ficha científica'],
    asteroids:['Abrir ficha científica','Abrir sistema anfitrión'],
    comets:['Abrir ficha científica','Abrir sistema anfitrión'],
    tno:['Abrir ficha científica','Abrir sistema anfitrión'],
    captured:['Abrir ficha científica','Abrir sistema anfitrión'],
    civilizations:['Ver especie','Ver planeta'],
    colonies:['Abrir ficha del cuerpo','Ver mundo natal'],
    'colonized-planets':['Abrir ficha del cuerpo','Ver mundo natal'],
    'colonized-moons':['Abrir ficha del cuerpo','Ver mundo natal'],
  };
  if(row.category==='sectors')return row.actions;
  const order=labels[row.category];
  return order.map(label=>row.actions.find(action=>action.label===label))
    .filter((action):action is UniversalArchiveAction38Bis=>action!==undefined);
}
