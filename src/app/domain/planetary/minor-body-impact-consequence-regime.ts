const NOT_APPLICABLE=Object.freeze({name:'NOT_APPLICABLE',code:0} as const);
const LOCAL=Object.freeze({name:'LOCAL',code:1} as const);
const REGIONAL=Object.freeze({name:'REGIONAL',code:2} as const);
const GLOBAL=Object.freeze({name:'GLOBAL',code:3} as const);
const CATASTROPHIC=Object.freeze({name:'CATASTROPHIC',code:4} as const);

export type MinorBodyImpactConsequenceRegimeValue=
  | typeof NOT_APPLICABLE
  | typeof LOCAL
  | typeof REGIONAL
  | typeof GLOBAL
  | typeof CATASTROPHIC;

const VALUES:readonly MinorBodyImpactConsequenceRegimeValue[]=Object.freeze([
  NOT_APPLICABLE,
  LOCAL,
  REGIONAL,
  GLOBAL,
  CATASTROPHIC,
]);

/**
 * Point-23.9 broad consequence-potential class.
 *
 * This is intentionally not a mutation of atmosphere/geology/water. Point 23.10
 * owns target-specific physical effects; this regime only ranks the conditional
 * impact severity from kinetic energy and target-relative binding-energy scale.
 */
export const MinorBodyImpactConsequenceRegime=Object.freeze({
  NOT_APPLICABLE,
  LOCAL,
  REGIONAL,
  GLOBAL,
  CATASTROPHIC,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyImpactConsequenceRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyImpactConsequenceRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyImpactConsequenceRegime code: ${code}.`);
    return value;
  },
});
