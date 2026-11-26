/** 38.bis-b3 · Opciones de ordenación públicas por categoría.
 * No se consultan estados privados ni se recalculan magnitudes científicas.
 */
import {universalArchiveSearchKey38Bis,
  type UniversalArchiveIndexedCategory38Bis,
  type UniversalArchiveRow38Bis} from './genesis-universal-archive-38-bis.model';

export type ArchiveSortKind38BisB3='number'|'text'|'tier'|'boolean';
export interface ArchiveSortOption38BisB3 {
  readonly key:string;
  readonly label:string;
  readonly kind:'name'|ArchiveSortKind38BisB3;
}
const name={key:'name',label:'Nombre / designación',kind:'name'} as const;
const text=(key:string,label:string):ArchiveSortOption38BisB3=>({key,label,kind:'text'});
const number=(key:string,label:string):ArchiveSortOption38BisB3=>({key,label,kind:'number'});
const boolean=(key:string,label:string):ArchiveSortOption38BisB3=>({key,label,kind:'boolean'});
const tier={key:'tier',label:'Nivel tecnológico',kind:'tier'} as const;

const OPTIONS:Readonly<Record<Exclude<UniversalArchiveIndexedCategory38Bis,'sectors'>,
  readonly ArchiveSortOption38BisB3[]>>={
  systems:[name,text('state','Estado'),text('multiplicity','Tipo de sistema')],
  stars:[name,text('system','Sistema anfitrión'),text('component','Componente'),
    text('evolution','Estado evolutivo'),text('stage','Etapa evolutiva'),
    text('spectral','Clase espectral'),text('family','Familia espectral'),
    number('radius','Radio (R☉)'),number('mass','Masa (M☉)'),
    number('temperature','Temperatura efectiva (K)'),number('luminosity','Luminosidad (L☉)'),
    number('age','Edad (Ga)')],
  planets:[name,text('galaxy','Galaxia'),boolean('life','Vida'),boolean('colonies','Colonias'),
    boolean('civilization','Civilización'),text('system','Sistema'),text('state','Estado'),text('type','Tipo planetario'),
    number('mass','Masa (M⊕)'),number('radius','Radio'),number('orbit','Semieje mayor'),
    number('period','Período orbital'),number('water','Agua líquida superficial (%)'),
    number('temperature','Temperatura superficial (°C)')],
  moons:[name,text('galaxy','Galaxia'),boolean('life','Vida'),boolean('colonies','Colonias'),
    text('planet','Planeta anfitrión'),text('system','Sistema'),
    text('composition','Composición'),number('mass','Masa (M⊕)'),number('radius','Radio'),
    number('period','Período orbital'),number('ice','Riqueza de hielo (%)'),
    number('surface-water','Agua superficial potencial (%)'),
    number('subsurface-ocean','Océano subsuperficial potencial (%)')],
  clusters:[name,text('type','Tipo'),text('state','Estado'),number('stars','Número de estrellas'),
    number('mass','Masa'),number('age','Edad'),number('radius','Radio')],
  nebulae:[name,text('type','Tipo'),text('state','Estado'),number('radius','Radio'),
    number('mass','Masa'),number('temperature','Temperatura del gas'),number('density','Densidad del gas')],
  extremes:[name,text('type','Tipo'),text('state','Estado'),text('family','Familia'),text('semantic','Régimen físico')],
  asteroids:[name,text('system','Sistema'),text('host','Anfitrión'),text('subtype','Subtipo'),
    number('diameter','Diámetro'),number('semi-major-axis','Semieje mayor'),
    number('eccentricity','Excentricidad'),number('inclination','Inclinación'),
    number('periapsis','Periapsis'),number('density','Densidad'),number('albedo','Albedo (%)')],
  comets:[name,text('system','Sistema'),text('host','Anfitrión'),text('subtype','Régimen orbital'),
    number('diameter','Diámetro'),number('period','Período orbital'),
    number('semi-major-axis','Semieje mayor'),number('eccentricity','Excentricidad'),
    number('inclination','Inclinación'),number('periapsis','Perihelio'),number('apoapsis','Afelio'),
    number('volatile','Riqueza volátil (%)')],
  tno:[name,text('system','Sistema'),text('host','Anfitrión'),text('subtype','Régimen dinámico'),
    number('diameter','Diámetro'),number('period','Período orbital'),
    number('semi-major-axis','Semieje mayor'),number('eccentricity','Excentricidad'),
    number('inclination','Inclinación'),number('periapsis','Perihelio'),number('ice','Hielo (%)')],
  captured:[name,text('system','Sistema'),text('host','Anfitrión'),text('subtype','Subtipo'),
    number('diameter','Diámetro'),number('period','Período orbital'),
    number('semi-major-axis','Semieje mayor'),number('eccentricity','Excentricidad'),
    number('inclination','Inclinación'),number('periapsis','Periapsis'),
    number('incoming-velocity','Velocidad de llegada'),number('volatile','Fracción volátil (%)')],
  civilizations:[name,text('planet','Planeta natal'),text('system','Sistema'),tier,text('lineage','Linaje')],
  colonies:[name,text('system','Sistema'),text('species','Especie fundadora'),
    text('originPlanet','Planeta natal'),text('kind','Clase'),text('technology','Hábitat'),
    text('purpose','Función'),number('population','Habitantes (estimación)')],
  'colonized-planets':[name,text('system','Sistema'),number('count','Número de colonias'),
    text('species','Especie fundadora'),text('originPlanet','Planeta natal'),text('kind','Clase'),
    number('population','Habitantes coloniales (estimación)')],
  'colonized-moons':[name,text('system','Sistema'),text('planet','Planeta anfitrión'),
    number('count','Número de colonias'),text('species','Especie fundadora'),
    text('originPlanet','Planeta natal'),text('kind','Clase'),
    number('population','Habitantes coloniales (estimación)')],
};
export function archiveSortOptions38BisB3(category:UniversalArchiveIndexedCategory38Bis):readonly ArchiveSortOption38BisB3[]{
  return category==='sectors'?[name]:OPTIONS[category];
}
export function archiveSortOption38BisB3(category:UniversalArchiveIndexedCategory38Bis,key:string):ArchiveSortOption38BisB3{
  return archiveSortOptions38BisB3(category).find(x=>x.key===key)??name;
}
/** Solo cadenas numéricas publicadas. No convertir 'No evaluable' en cero. */
export function archiveNumericCell38BisB3(cell:string|undefined):number|null {
  if(!cell)return null;
  const matched=cell.trim().replaceAll('−','-').match(/^([+-]?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?(?:[Ee][+-]?\d+)?)/u);
  if(!matched)return null;
  const value=Number(matched[1].replaceAll('.','').replace(',','.'));
  return Number.isFinite(value)?value:null;
}
export function archiveSortValue38BisB3(row:UniversalArchiveRow38Bis,
  option:ArchiveSortOption38BisB3):number|string|null {
  if(option.kind==='name')return row.sortTitle;
  if(option.kind==='tier'){
    const level=row.subtype==='PRIMITIVE'?0:row.subtype==='ADVANCED'?1:
      row.subtype==='VERY_ADVANCED'?2:null;
    return level;
  }
  if(option.kind==='boolean'){
    const value=row.cells[option.key]?.trim();
    return value==='Sí'?1:value==='No'?0:null;
  }
  if(option.kind==='number'){
    const raw=row.sortNumbers?.[option.key];
    if(raw!==undefined)return raw!==null && Number.isFinite(raw)?raw:null;
    // No convertir la banda poblacional pública en un número falso.
    if(option.key==='population')return null;
    return archiveNumericCell38BisB3(row.cells[option.key]);
  }
  const raw=row.cells[option.key];
  return raw && raw.trim() && !/^no (evaluable|resuelt|determinad|disponible)/iu.test(raw.trim())
    ?universalArchiveSearchKey38Bis(raw):null;
}
/** Permite límites negativos, decimales y el cero; rechaza entradas inválidas. */
export function archiveRangeBoundary38BisB3(value:string|null|undefined):number|null {
  if(value===null||value===undefined||value.trim()==='')return null;
  if(!/^[+-]?(?:\d+)(?:[.,]\d+)?$/u.test(value.trim()))return null;
  const parsed=Number(value.trim().replace(',','.'));
  return Number.isFinite(parsed)&&Math.abs(parsed)<1e300?parsed:null;
}
