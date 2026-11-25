/** GENESIS 38.bis-T7 · Población colonial publicada: intervalos VIDA.8.
 * Proyección puramente visual, sin población exacta ni habitantes nativos.
 * Una cifra no verificable invalida el agregado completo; nunca se convierte en 0.
 */
import type {Vida8Colony,Vida8PopulationBand} from '../../../domain/life/vida8-technological-colonization';

export interface ArchiveColonialPopulation38BisT7 {
  readonly minimum:number;
  readonly maximum:number;
  /** Solo criterio de ordenación aproximado; nunca un censo exacto. */
  readonly midpoint:number;
  readonly colonyCount:number;
}

type PopulationColony = Pick<Vida8Colony,'settlement'>;

/** Tabla científica VIDA.8/technological-colonization/v1, idéntica a la usada
 * por Vida8TechnologicalColonization.evaluate. Nunca estimar un intervalo desde
 * el tier tecnológico, número de colonias o nombre de la población.
 *
 * Los registros CT-0 inmutables pueden conservar la banda VIDA.8 aunque su
 * proyección histórica no incluyera colonialPopulationRange. Esta recuperación
 * es exclusivamente de lectura: no modifica ni reescribe los snapshots VIDA.9.
 */
const VIDA8_POPULATION_INTERVALS_38BIS_T7B:Readonly<Record<Vida8PopulationBand,readonly [number,number]>>={
  OUTPOST:[12,150],SETTLEMENT:[151,5000],CITY:[5001,120000],NETWORK:[120001,1500000],
};

export function archiveColonyPopulationInterval38BisT7b(colony:PopulationColony):readonly [number,number]|null {
  const settlement=colony?.settlement;
  const persisted=settlement?.colonialPopulationRange;
  // Un rango presente pero defectuoso NO se disfraza con la banda. Es distinto
  // de un dato ausente en un registro persistido de una revisión anterior.
  const effective=persisted==null
    ? (settlement && Object.prototype.hasOwnProperty.call(VIDA8_POPULATION_INTERVALS_38BIS_T7B,
        settlement.populationBand)
        ? VIDA8_POPULATION_INTERVALS_38BIS_T7B[settlement.populationBand] : null)
    : persisted;
  if(!Array.isArray(effective)||effective.length!==2)return null;
  const [lower,upper]=effective;
  return Number.isSafeInteger(lower)&&Number.isSafeInteger(upper)&&
    lower>=0&&upper>=lower?[lower,upper]:null;
}

export function archiveColonialPopulation38BisT7(
  colonies:readonly PopulationColony[],
):ArchiveColonialPopulation38BisT7|null {
  if(colonies.length===0)return null;
  let minimum=0,maximum=0;
  for(const colony of colonies){
    const range=archiveColonyPopulationInterval38BisT7b(colony);
    if(range===null)return null;
    const [lower,upper]=range;
    minimum+=lower;maximum+=upper;
    if(!Number.isSafeInteger(minimum)||!Number.isSafeInteger(maximum))return null;
  }
  return Object.freeze({minimum,maximum,midpoint:minimum+(maximum-minimum)/2,
    colonyCount:colonies.length});
}

/** El rango es una estimación registrada, no un recuento real de habitantes. */
export function archiveColonialPopulationLabel38BisT7(
  range:ArchiveColonialPopulation38BisT7|null,
):string {
  if(range===null)return 'No evaluable';
  // Mostrar también miles de cuatro cifras (el ICU de es-ES los omite a veces).
  const grouped=(value:number)=>String(value).replace(/\B(?=(\d{3})+(?!\d))/gu,'.');
  return `${grouped(range.minimum)}–${grouped(range.maximum)}`;
}
