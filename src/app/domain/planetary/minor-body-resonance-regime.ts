export interface MinorBodyResonanceRegimeValue {
  readonly name:
    | 'NOT_APPLICABLE_UNBOUND'
    | 'NONE'
    | 'CO_ORBITAL'
    | 'INTERIOR'
    | 'EXTERIOR';
  readonly code:number;
}

const NOT_APPLICABLE_UNBOUND = Object.freeze({name:'NOT_APPLICABLE_UNBOUND',code:0} as const);
const NONE = Object.freeze({name:'NONE',code:1} as const);
const CO_ORBITAL = Object.freeze({name:'CO_ORBITAL',code:2} as const);
const INTERIOR = Object.freeze({name:'INTERIOR',code:3} as const);
const EXTERIOR = Object.freeze({name:'EXTERIOR',code:4} as const);
const VALUES: readonly MinorBodyResonanceRegimeValue[] = Object.freeze([NOT_APPLICABLE_UNBOUND,NONE,CO_ORBITAL,INTERIOR,EXTERIOR]);

/** Point-23.4 coarse relation of one minor-body mean motion to one planet. */
export const MinorBodyResonanceRegime = Object.freeze({
  NOT_APPLICABLE_UNBOUND,
  NONE,
  CO_ORBITAL,
  INTERIOR,
  EXTERIOR,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyResonanceRegimeValue|null {
    return VALUES.find(value=>value.code===code) ?? null;
  },
  fromCode(code:number):MinorBodyResonanceRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyResonanceRegime code: ${code}.`);
    return value;
  },
});
