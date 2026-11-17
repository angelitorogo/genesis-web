/** 38.bis-b1 · Localizadores de VIDA.9 para las filas públicas actualmente visibles.
 * Esta proyección no consulta ni conserva Ground Truth: la autorización y el
 * digest se verifican en el repositorio productivo antes de mostrar Sí o No. */
import type {UniversalArchiveRow38Bis} from './genesis-universal-archive-38-bis.model';
import type {Vida9BiologyRecord} from '../../../domain/life/vida9-biology-exploration';

export interface ArchivePageBiologyLocator38BisB1 {
  readonly galaxyIndex:string;
  readonly sectorKey:string;
  readonly galacticObjectIndex:string;
  readonly bodyStorageKey:string;
  readonly systemStorageKey:string;
}

export function archivePageBiologyLocator38BisB1(row:UniversalArchiveRow38Bis):ArchivePageBiologyLocator38BisB1|null {
  if(row.category!=='planets' && row.category!=='moons')return null;
  const action=row.actions.find(a=>a.label==='Abrir ficha científica');
  const route=action?.route;
  if(!route || route[0]!=='/system' || route[4]!=='planet' ||
      (row.category==='planets'?route.length!==6:route.length!==8 || route[6]!=='moon'))return null;
  // Destructure only by absolute positions to avoid confusion between route
  // segments and persistent ordinal numbers (zero-based moon indices).
  const gal=route[1], sector=route[2], system=route[3],body=route[5],moon=route[7];
  if(!gal||!sector||!system||!body || gal!==row.galaxyIndex)return null;
  const numeric=/^(?:0|[1-9]\d*)$/u;
  if(![gal,system,body].every(v=>numeric.test(v)) ||
      !/^-?(?:0|[1-9]\d*)$/u.test(sector))return null;
  if(row.category==='moons' && (!moon || !numeric.test(moon)))return null;
  const systemStorageKey=[gal,sector,system].join('/');
  return Object.freeze({galaxyIndex:gal,sectorKey:sector,galacticObjectIndex:system,
    systemStorageKey,
    bodyStorageKey:[gal,sector,system,body,row.category==='moons'?'MOON':'PLANET',
      row.category==='moons'?moon:'-'].join(':')});
}

/** Colonos son población biológica; se distingue de las colonias como infraestructura.
 * 'No' solo puede mostrarse cuando la lectura VIDA.9 completa pasó el digest. */
export function archiveObservedLife38BisB1(record:Vida9BiologyRecord):'Sí'|'No' {
  return record.nativeLifePresent || record.introducedLifePresent || record.colonialPopulationPresent?'Sí':'No';
}
