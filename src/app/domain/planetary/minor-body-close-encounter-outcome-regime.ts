const NO_ENCOUNTER=Object.freeze({name:'NO_ENCOUNTER',code:0} as const);
const BOUND_PERTURBATION=Object.freeze({name:'BOUND_PERTURBATION',code:1} as const);
const TEMPORARY_CAPTURE=Object.freeze({name:'TEMPORARY_CAPTURE',code:2} as const);
const EJECTION=Object.freeze({name:'EJECTION',code:3} as const);
const UNBOUND_DEFLECTION=Object.freeze({name:'UNBOUND_DEFLECTION',code:4} as const);

export type MinorBodyCloseEncounterOutcomeRegimeValue=
  | typeof NO_ENCOUNTER
  | typeof BOUND_PERTURBATION
  | typeof TEMPORARY_CAPTURE
  | typeof EJECTION
  | typeof UNBOUND_DEFLECTION;

const VALUES:readonly MinorBodyCloseEncounterOutcomeRegimeValue[]=Object.freeze([
  NO_ENCOUNTER,
  BOUND_PERTURBATION,
  TEMPORARY_CAPTURE,
  EJECTION,
  UNBOUND_DEFLECTION,
]);

/** Point-23.6 resolved close-encounter outcome without any impact verdict. */
export const MinorBodyCloseEncounterOutcomeRegime=Object.freeze({
  NO_ENCOUNTER,
  BOUND_PERTURBATION,
  TEMPORARY_CAPTURE,
  EJECTION,
  UNBOUND_DEFLECTION,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyCloseEncounterOutcomeRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyCloseEncounterOutcomeRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyCloseEncounterOutcomeRegime code: ${code}.`);
    return value;
  },
});
