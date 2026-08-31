const NOT_APPLICABLE=Object.freeze({name:'NOT_APPLICABLE',code:0} as const);
const NO_SOLID_SURFACE=Object.freeze({name:'NO_SOLID_SURFACE',code:1} as const);
const CRATERING=Object.freeze({name:'CRATERING',code:2} as const);
const LARGE_CRATER_BASIN=Object.freeze({name:'LARGE_CRATER_BASIN',code:3} as const);
const GLOBAL_RESHAPING=Object.freeze({name:'GLOBAL_RESHAPING',code:4} as const);
const BULK_DISRUPTION=Object.freeze({name:'BULK_DISRUPTION',code:5} as const);

export type MinorBodyImpactSurfaceResponseRegimeValue=
  | typeof NOT_APPLICABLE
  | typeof NO_SOLID_SURFACE
  | typeof CRATERING
  | typeof LARGE_CRATER_BASIN
  | typeof GLOBAL_RESHAPING
  | typeof BULK_DISRUPTION;

const VALUES:readonly MinorBodyImpactSurfaceResponseRegimeValue[]=Object.freeze([
  NOT_APPLICABLE,
  NO_SOLID_SURFACE,
  CRATERING,
  LARGE_CRATER_BASIN,
  GLOBAL_RESHAPING,
  BULK_DISRUPTION,
]);

/** Point-23.10 coarse solid-surface response to a conditional minor-body impact. */
export const MinorBodyImpactSurfaceResponseRegime=Object.freeze({
  NOT_APPLICABLE,
  NO_SOLID_SURFACE,
  CRATERING,
  LARGE_CRATER_BASIN,
  GLOBAL_RESHAPING,
  BULK_DISRUPTION,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyImpactSurfaceResponseRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyImpactSurfaceResponseRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyImpactSurfaceResponseRegime code: ${code}.`);
    return value;
  },
});
