/** STARCAT.1b — Etiquetas públicas de estrellas. Los códigos de generación,
 * filtros, subtipo de IndexedDB y claves de ordenación NO se traducen. */
import type {StellarEvolutionStateName} from '../../domain/stellar/stellar-evolution-state';

const EVOLUTION_LABELS:Readonly<Record<StellarEvolutionStateName,string>>=Object.freeze({
  BROWN_DWARF:'Enana marrón',
  MAIN_SEQUENCE:'Secuencia principal',
  GIANT:'Gigante',
  SUPERGIANT:'Supergigante',
  WHITE_DWARF:'Enana blanca',
  NEUTRON_STAR:'Estrella de neutrones',
  STELLAR_BLACK_HOLE:'Remanente de agujero negro estelar',
});
const STAGE_LABELS:Readonly<Record<string,string>>=Object.freeze({
  RED_GIANT_BRANCH:'Gigante roja (RGB)',
  ASYMPTOTIC_GIANT_BRANCH:'Gigante de rama asintótica (AGB)',
});
const FILTER_LABELS:Readonly<Record<string,string>>=Object.freeze({
  ...EVOLUTION_LABELS,
  RGB:'Gigantes rojas (RGB)',
  AGB:'Gigantes de rama asintótica (AGB)',
  O:'Clase espectral O',B:'Clase espectral B',A:'Clase espectral A',
  F:'Clase espectral F',G:'Clase espectral G',K:'Clase espectral K',
  M:'Clase espectral M',L:'Clase espectral L',T:'Clase espectral T',Y:'Clase espectral Y',
  RED_GIANT_BRANCH:'Gigantes rojas (RGB)',
  ASYMPTOTIC_GIANT_BRANCH:'Gigantes de rama asintótica (AGB)',
});

export function stellarEvolutionPublicLabel(value:string):string {
  return EVOLUTION_LABELS[value as StellarEvolutionStateName]??value;
}
export function stellarStagePublicLabel(value:string):string {
  return STAGE_LABELS[value]??value;
}
export function stellarFilterPublicLabel(value:string):string {
  return FILTER_LABELS[value]??value;
}
/** Proyección idempotente y contextual: respeta designaciones y tipos espectrales. */
export function stellarCatalogPublicCellLabel(category:string,key:string,
  value:string|undefined):string {
  if(value===undefined||value.trim()==='')return '—';
  if(category!=='stars')return value;
  if(key==='evolution')return stellarEvolutionPublicLabel(value);
  if(key==='stage')return stellarStagePublicLabel(value);
  return value;
}
