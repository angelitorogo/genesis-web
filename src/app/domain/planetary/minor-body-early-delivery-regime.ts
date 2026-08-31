const NOT_APPLICABLE=Object.freeze({name:'NOT_APPLICABLE',code:0} as const);
const REFRACTORY_DOMINATED=Object.freeze({name:'REFRACTORY_DOMINATED',code:1} as const);
const TRACE_DELIVERY=Object.freeze({name:'TRACE_DELIVERY',code:2} as const);
const WATER_RICH=Object.freeze({name:'WATER_RICH',code:3} as const);
const ORGANIC_CARRIER_RICH=Object.freeze({name:'ORGANIC_CARRIER_RICH',code:4} as const);
const MIXED_WATER_ORGANIC=Object.freeze({name:'MIXED_WATER_ORGANIC',code:5} as const);

export type MinorBodyEarlyDeliveryRegimeValue=
  | typeof NOT_APPLICABLE
  | typeof REFRACTORY_DOMINATED
  | typeof TRACE_DELIVERY
  | typeof WATER_RICH
  | typeof ORGANIC_CARRIER_RICH
  | typeof MIXED_WATER_ORGANIC;

const VALUES:readonly MinorBodyEarlyDeliveryRegimeValue[]=Object.freeze([
  NOT_APPLICABLE,
  REFRACTORY_DOMINATED,
  TRACE_DELIVERY,
  WATER_RICH,
  ORGANIC_CARRIER_RICH,
  MIXED_WATER_ORGANIC,
]);

/** Point-23.11 coarse retained water/organic-carrier delivery regime. */
export const MinorBodyEarlyDeliveryRegime=Object.freeze({
  NOT_APPLICABLE,
  REFRACTORY_DOMINATED,
  TRACE_DELIVERY,
  WATER_RICH,
  ORGANIC_CARRIER_RICH,
  MIXED_WATER_ORGANIC,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyEarlyDeliveryRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyEarlyDeliveryRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyEarlyDeliveryRegime code: ${code}.`);
    return value;
  },
});
