const NONE=Object.freeze({name:'NONE',code:0} as const);
const ORBITAL_RISK_ONLY=Object.freeze({name:'ORBITAL_RISK_ONLY',code:1} as const);
const SINGLE_PASSAGE=Object.freeze({name:'SINGLE_PASSAGE',code:2} as const);
const EXTREMELY_LOW=Object.freeze({name:'EXTREMELY_LOW',code:3} as const);
const VERY_LOW=Object.freeze({name:'VERY_LOW',code:4} as const);
const LOW=Object.freeze({name:'LOW',code:5} as const);
const MATERIAL=Object.freeze({name:'MATERIAL',code:6} as const);

export type MinorBodyTemporalImpactProbabilityRegimeValue=
  | typeof NONE
  | typeof ORBITAL_RISK_ONLY
  | typeof SINGLE_PASSAGE
  | typeof EXTREMELY_LOW
  | typeof VERY_LOW
  | typeof LOW
  | typeof MATERIAL;

const VALUES:readonly MinorBodyTemporalImpactProbabilityRegimeValue[]=Object.freeze([
  NONE,
  ORBITAL_RISK_ONLY,
  SINGLE_PASSAGE,
  EXTREMELY_LOW,
  VERY_LOW,
  LOW,
  MATERIAL,
]);

/**
 * Point-23.8 temporal-impact probability classification.
 *
 * ORBITAL_RISK_ONLY deliberately means that point 23.7 found a dynamically
 * relevant corridor but the current osculating geometry does not establish a
 * physical planet-collision corridor. SINGLE_PASSAGE is reserved for unbound
 * visitors: extending the requested horizon does not create repeated returns.
 */
export const MinorBodyTemporalImpactProbabilityRegime=Object.freeze({
  NONE,
  ORBITAL_RISK_ONLY,
  SINGLE_PASSAGE,
  EXTREMELY_LOW,
  VERY_LOW,
  LOW,
  MATERIAL,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyTemporalImpactProbabilityRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyTemporalImpactProbabilityRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyTemporalImpactProbabilityRegime code: ${code}.`);
    return value;
  },
});
