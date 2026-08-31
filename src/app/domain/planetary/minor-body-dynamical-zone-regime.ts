export interface MinorBodyDynamicalZoneRegimeValue {
  readonly name:
    | 'UNBOUND_PASSAGE'
    | 'BACKGROUND'
    | 'RESONANT_BAND'
    | 'CHAOTIC_ZONE'
    | 'CHAOTIC_RESONANT_OVERLAP';
  readonly code:number;
}
const UNBOUND_PASSAGE=Object.freeze({name:'UNBOUND_PASSAGE',code:0} as const);
const BACKGROUND=Object.freeze({name:'BACKGROUND',code:1} as const);
const RESONANT_BAND=Object.freeze({name:'RESONANT_BAND',code:2} as const);
const CHAOTIC_ZONE=Object.freeze({name:'CHAOTIC_ZONE',code:3} as const);
const CHAOTIC_RESONANT_OVERLAP=Object.freeze({name:'CHAOTIC_RESONANT_OVERLAP',code:4} as const);
const VALUES: readonly MinorBodyDynamicalZoneRegimeValue[]=Object.freeze([UNBOUND_PASSAGE,BACKGROUND,RESONANT_BAND,CHAOTIC_ZONE,CHAOTIC_RESONANT_OVERLAP]);

/** Point-23.4 simplified local dynamical-zone diagnosis. No orbit is evolved here. */
export const MinorBodyDynamicalZoneRegime=Object.freeze({
  UNBOUND_PASSAGE,BACKGROUND,RESONANT_BAND,CHAOTIC_ZONE,CHAOTIC_RESONANT_OVERLAP,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyDynamicalZoneRegimeValue|null {
    return VALUES.find(value=>value.code===code) ?? null;
  },
  fromCode(code:number):MinorBodyDynamicalZoneRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyDynamicalZoneRegime code: ${code}.`);
    return value;
  },
});
