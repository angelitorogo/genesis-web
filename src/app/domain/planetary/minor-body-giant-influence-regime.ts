export interface MinorBodyGiantInfluenceRegimeValue {
  readonly name:
    | 'BACKGROUND'
    | 'PERTURBATION_CANDIDATE'
    | 'TEMPORARY_CAPTURE_CANDIDATE'
    | 'EJECTION_CANDIDATE'
    | 'UNBOUND_DEFLECTION_CANDIDATE';
  readonly code:number;
}

const BACKGROUND=Object.freeze({name:'BACKGROUND',code:0} as const);
const PERTURBATION_CANDIDATE=Object.freeze({name:'PERTURBATION_CANDIDATE',code:1} as const);
const TEMPORARY_CAPTURE_CANDIDATE=Object.freeze({name:'TEMPORARY_CAPTURE_CANDIDATE',code:2} as const);
const EJECTION_CANDIDATE=Object.freeze({name:'EJECTION_CANDIDATE',code:3} as const);
const UNBOUND_DEFLECTION_CANDIDATE=Object.freeze({name:'UNBOUND_DEFLECTION_CANDIDATE',code:4} as const);
const VALUES:readonly MinorBodyGiantInfluenceRegimeValue[]=Object.freeze([
  BACKGROUND,
  PERTURBATION_CANDIDATE,
  TEMPORARY_CAPTURE_CANDIDATE,
  EJECTION_CANDIDATE,
  UNBOUND_DEFLECTION_CANDIDATE,
]);

/** Point-23.5 giant-planet influence tendency. Actual orbit changes remain 23.6. */
export const MinorBodyGiantInfluenceRegime=Object.freeze({
  BACKGROUND,
  PERTURBATION_CANDIDATE,
  TEMPORARY_CAPTURE_CANDIDATE,
  EJECTION_CANDIDATE,
  UNBOUND_DEFLECTION_CANDIDATE,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyGiantInfluenceRegimeValue|null {
    return VALUES.find(value=>value.code===code) ?? null;
  },
  fromCode(code:number):MinorBodyGiantInfluenceRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyGiantInfluenceRegime code: ${code}.`);
    return value;
  },
});
