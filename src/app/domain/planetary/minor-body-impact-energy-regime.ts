const NOT_APPLICABLE=Object.freeze({name:'NOT_APPLICABLE',code:0} as const);
const SUB_MEGATON=Object.freeze({name:'SUB_MEGATON',code:1} as const);
const MEGATON_CLASS=Object.freeze({name:'MEGATON_CLASS',code:2} as const);
const GIGATON_CLASS=Object.freeze({name:'GIGATON_CLASS',code:3} as const);
const TERATON_CLASS=Object.freeze({name:'TERATON_CLASS',code:4} as const);
const PLANETARY_SCALE=Object.freeze({name:'PLANETARY_SCALE',code:5} as const);

export type MinorBodyImpactEnergyRegimeValue=
  | typeof NOT_APPLICABLE
  | typeof SUB_MEGATON
  | typeof MEGATON_CLASS
  | typeof GIGATON_CLASS
  | typeof TERATON_CLASS
  | typeof PLANETARY_SCALE;

const VALUES:readonly MinorBodyImpactEnergyRegimeValue[]=Object.freeze([
  NOT_APPLICABLE,
  SUB_MEGATON,
  MEGATON_CLASS,
  GIGATON_CLASS,
  TERATON_CLASS,
  PLANETARY_SCALE,
]);

/** Point-23.9 conditional impact-energy class using conventional TNT-yield decades. */
export const MinorBodyImpactEnergyRegime=Object.freeze({
  NOT_APPLICABLE,
  SUB_MEGATON,
  MEGATON_CLASS,
  GIGATON_CLASS,
  TERATON_CLASS,
  PLANETARY_SCALE,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyImpactEnergyRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyImpactEnergyRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyImpactEnergyRegime code: ${code}.`);
    return value;
  },
});
