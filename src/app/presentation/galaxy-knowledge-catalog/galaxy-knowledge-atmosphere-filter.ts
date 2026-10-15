import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';

/** Final gas mole fractions. `null` means not scientifically resolved, not zero. */
export type CatalogAtmosphereFractions = Readonly<Partial<Record<AtmosphereGas, number>>> | null;
export interface CatalogAtmosphereState {
  readonly fractions: CatalogAtmosphereFractions;
  readonly pressureBar: number | null;
  readonly conditional: boolean;
}

export const CATALOG_ATMOSPHERE_GASES: readonly Readonly<{gas: AtmosphereGas; label: string; symbol: string; lunar: boolean}>[] = Object.freeze([
  {gas: AtmosphereGas.NITROGEN,label:'Nitrógeno',symbol:'N₂',lunar:true},
  {gas: AtmosphereGas.OXYGEN,label:'Oxígeno',symbol:'O₂',lunar:false},
  {gas: AtmosphereGas.ARGON,label:'Argón',symbol:'Ar',lunar:true},
  {gas: AtmosphereGas.CARBON_DIOXIDE,label:'Dióxido de carbono',symbol:'CO₂',lunar:true},
  {gas: AtmosphereGas.CARBON_MONOXIDE,label:'Monóxido de carbono',symbol:'CO',lunar:false},
  {gas: AtmosphereGas.HYDROGEN,label:'Hidrógeno',symbol:'H₂',lunar:false},
  {gas: AtmosphereGas.HELIUM,label:'Helio',symbol:'He',lunar:false},
  {gas: AtmosphereGas.METHANE,label:'Metano',symbol:'CH₄',lunar:true},
  {gas: AtmosphereGas.AMMONIA,label:'Amoniaco',symbol:'NH₃',lunar:true},
  {gas: AtmosphereGas.WATER_VAPOR,label:'Vapor de agua',symbol:'H₂O',lunar:true},
  {gas: AtmosphereGas.SULFUR_DIOXIDE,label:'Dióxido de azufre',symbol:'SO₂',lunar:true},
]);

export interface CatalogGasRange {
  readonly gas: AtmosphereGas;
  readonly minPercent: number | null;
  readonly maxPercent: number | null;
}
export interface CatalogAtmosphereFilter {
  readonly ranges: readonly CatalogGasRange[];
  readonly combine: 'AND' | 'OR';
  readonly minPressureBar: number | null;
  readonly maxPressureBar: number | null;
  readonly minEarthSimilarityPercent: number | null;
}
export const EMPTY_ATMOSPHERE_FILTER: CatalogAtmosphereFilter = Object.freeze({
  ranges:Object.freeze([]),combine:'AND',minPressureBar:null,maxPressureBar:null,minEarthSimilarityPercent:null,
});

/** Supported URL encoding, validated before any query or cache operation. */
export function parseCatalogAtmosphereFilter(raw: {
  readonly gasRanges?: string | null;
  readonly gasCombine?: string | null;
  readonly pressureMin?: string | null;
  readonly pressureMax?: string | null;
  readonly earthMin?: string | null;
}, lunar: boolean): CatalogAtmosphereFilter {
  const source=(raw.gasRanges ?? '').trim();
  if (source.length > 500) throw new RangeError('Demasiados filtros atmosféricos.');
  const allowed=new Set(CATALOG_ATMOSPHERE_GASES.filter(g=>!lunar||g.lunar).map(g=>g.gas));
  const ranges: CatalogGasRange[]=[];
  if (source.length>0) for(const part of source.split(';')) {
    const tokens=part.split(':');
    if(tokens.length!==3 || !allowed.has(tokens[0] as AtmosphereGas)) throw new RangeError('Filtro de gas no válido.');
    const min=parseNullableDecimal(tokens[1],100,'Porcentaje mínimo');
    const max=parseNullableDecimal(tokens[2],100,'Porcentaje máximo');
    if(min===null && max===null) throw new RangeError('Introduce un límite para el gas.');
    if(min!==null&&max!==null&&min>max) throw new RangeError('El porcentaje mínimo supera al máximo.');
    if(ranges.some(r=>r.gas===tokens[0])) throw new RangeError('No dupliques el mismo gas.');
    ranges.push(Object.freeze({gas:tokens[0] as AtmosphereGas,minPercent:min,maxPercent:max}));
  }
  if(ranges.length>11) throw new RangeError('Demasiados gases seleccionados.');
  const minPressureBar=parseNullableDecimal(raw.pressureMin ?? '',1e9,'Presión mínima');
  const maxPressureBar=parseNullableDecimal(raw.pressureMax ?? '',1e9,'Presión máxima');
  if(minPressureBar!==null&&maxPressureBar!==null&&minPressureBar>maxPressureBar) {
    throw new RangeError('La presión mínima supera a la máxima.');
  }
  const minEarthSimilarityPercent=lunar ? null : parseNullableDecimal(raw.earthMin ?? '',100,'Similitud terrestre');
  return Object.freeze({ranges:Object.freeze(ranges),combine:raw.gasCombine==='OR'?'OR':'AND',
    minPressureBar,maxPressureBar,minEarthSimilarityPercent});
}
function parseNullableDecimal(s: string | undefined, max: number, label: string): number | null {
  if(s==null || s.trim()==='') return null;
  if(!/^(?:\d+\.?\d*|\.\d+)$/.test(s) || s.length>24) throw new RangeError(`${label}: valor incorrecto.`);
  const value=Number(s);
  if(!Number.isFinite(value)||value<0||value>max) throw new RangeError(`${label}: fuera de rango.`);
  return value;
}
export function atmosphericMolePercent(data: CatalogAtmosphereFractions, gas: AtmosphereGas): number | null {
  return data === null || data === undefined ? null : (data[gas] ?? 0)*100;
}

const EARTH_DRY = Object.freeze([
  [AtmosphereGas.NITROGEN,78.084], [AtmosphereGas.OXYGEN,20.946],
  [AtmosphereGas.ARGON,0.934], [AtmosphereGas.CARBON_DIOXIDE,0.042],
] as const);
/** L1 overlap of the four principal dry-air species; not a biosignature or habitability score. */
export function catalogEarthDrySimilarityPercent(data: CatalogAtmosphereFractions): number | null {
  if(data===null || data===undefined) return null;
  const vapor=Math.max(0,Math.min(1,data[AtmosphereGas.WATER_VAPOR] ?? 0));
  if(vapor>=1) return null;
  const norm=100/(1-vapor);
  const overlap=EARTH_DRY.reduce((sum,[gas,expected])=>sum+Math.min(expected,(data[gas]??0)*norm),0);
  // Mass on those gases outside the four-species reference is not counted as similarity.
  return Math.max(0,Math.min(100,overlap));
}
export function matchesCatalogAtmosphere(state: CatalogAtmosphereState | null | undefined, filter: CatalogAtmosphereFilter): boolean {
  if(filter.ranges.length===0 && filter.minPressureBar===null && filter.maxPressureBar===null
    && filter.minEarthSimilarityPercent===null) return true;
  if(!state) return false;
  if(filter.ranges.length) {
    if(state.fractions===null) return false;
    const matches=filter.ranges.map(r=>{
      const v=atmosphericMolePercent(state.fractions,r.gas);
      return v!==null && (r.minPercent===null||v>=r.minPercent-1e-9)
        && (r.maxPercent===null||v<=r.maxPercent+1e-9);
    });
    if(filter.combine==='AND'?!matches.every(Boolean):!matches.some(Boolean)) return false;
  }
  if(filter.minPressureBar!==null || filter.maxPressureBar!==null) {
    if(state.pressureBar===null) return false;
    if(filter.minPressureBar!==null && state.pressureBar<filter.minPressureBar) return false;
    if(filter.maxPressureBar!==null && state.pressureBar>filter.maxPressureBar) return false;
  }
  if(filter.minEarthSimilarityPercent!==null) {
    const score=catalogEarthDrySimilarityPercent(state.fractions);
    if(score===null||score<filter.minEarthSimilarityPercent) return false;
  }
  return true;
}
export function catalogAtmosphereSortValue(state:CatalogAtmosphereState|null|undefined,key:string):number|null {
  if(!state)return null;
  if(key==='pressure-atm') return state.pressureBar;
  if(key==='earth-similarity') return catalogEarthDrySimilarityPercent(state.fractions);
  if(key.startsWith('gas-')) {
    const gas=key.slice(4) as AtmosphereGas;
    return CATALOG_ATMOSPHERE_GASES.some(item=>item.gas===gas)?atmosphericMolePercent(state.fractions,gas):null;
  }
  return null;
}
/** Scientific numeric comparator. An unresolved composition is not a real 0 %.
 * Keep unknown values at the END in both directions, rather than putting them
 * first on ascending sorts. Ties are resolved by the caller's stable identity.
 */
export function compareCatalogAtmosphereByKey(
  left: CatalogAtmosphereState | null | undefined,
  right: CatalogAtmosphereState | null | undefined,
  key: string,
  direction: 'asc' | 'desc',
): number {
  const a = catalogAtmosphereSortValue(left, key);
  const b = catalogAtmosphereSortValue(right, key);
  if (a === null) return b === null ? 0 : 1;
  if (b === null) return -1;
  const difference = a - b;
  return direction === 'desc' ? -difference : difference;
}

/** When most bodies have no resolved O₂ (or all have 0 %), an unchanged
 * designation order is a valid tie, not evidence that the sort was skipped.
 * Provide whole-filter-result counts so the UI can explain that situation.
 */
export function catalogAtmosphereSortAvailability(
  states: readonly (CatalogAtmosphereState | null | undefined)[],
  key: string,
): Readonly<{resolved: number; positive: number; unresolved: number}> {
  let resolved = 0;
  let positive = 0;
  for (const state of states) {
    const value = catalogAtmosphereSortValue(state, key);
    if (value === null) continue;
    resolved++;
    if (value > 0) positive++;
  }
  return Object.freeze({resolved, positive, unresolved: states.length - resolved});
}

export function catalogAtmosphereCell(state:CatalogAtmosphereState|null|undefined,key:string):string {
  const value=catalogAtmosphereSortValue(state,key);
  if(value===null)return 'No determinado';
  const text=value.toLocaleString('es-ES',{maximumFractionDigits:key==='pressure-atm'?7:6});
  return `${text}${key==='pressure-atm'?' bar':' %'}${state?.conditional?' (esc.)':''}`;
}
export function catalogAtmosphereSortOptions(lunar:boolean):readonly Readonly<{key:string;label:string}>[] {
  return Object.freeze([
    {key:'pressure-atm',label:'Presión atmosférica (bar)'},
    ...CATALOG_ATMOSPHERE_GASES.filter(g=>!lunar||g.lunar).map(g=>({key:`gas-${g.gas}`,label:`${g.label} (${g.symbol}) %`})),
    ...(lunar ? [] : [{key:'earth-similarity',label:'Similitud con aire terrestre seco %'}]),
  ]);
}
