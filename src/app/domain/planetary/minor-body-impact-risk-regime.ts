const NONE=Object.freeze({name:'NONE',code:0} as const);
const RADIAL_CROSSING_ONLY=Object.freeze({name:'RADIAL_CROSSING_ONLY',code:1} as const);
const PLANET_APPROACH_CORRIDOR=Object.freeze({name:'PLANET_APPROACH_CORRIDOR',code:2} as const);
const PLANET_COLLISION_CORRIDOR=Object.freeze({name:'PLANET_COLLISION_CORRIDOR',code:3} as const);
const MOON_ORBITAL_REGION=Object.freeze({name:'MOON_ORBITAL_REGION',code:4} as const);

export type MinorBodyImpactRiskRegimeValue=
  | typeof NONE
  | typeof RADIAL_CROSSING_ONLY
  | typeof PLANET_APPROACH_CORRIDOR
  | typeof PLANET_COLLISION_CORRIDOR
  | typeof MOON_ORBITAL_REGION;

const VALUES:readonly MinorBodyImpactRiskRegimeValue[]=Object.freeze([
  NONE,
  RADIAL_CROSSING_ONLY,
  PLANET_APPROACH_CORRIDOR,
  PLANET_COLLISION_CORRIDOR,
  MOON_ORBITAL_REGION,
]);

/**
 * Point-23.7 geometry-only impact-risk regime.
 *
 * These values are not temporal impact probabilities. PLANET_COLLISION_CORRIDOR
 * means the current osculating paths enter the gravitationally-focused physical
 * collision cross-section. MOON_ORBITAL_REGION is deliberately weaker because
 * point-21 moon data do not freeze a complete heliocentric lunar orientation/
 * phase. Point 23.8 owns temporal coincidence/probability.
 */
export const MinorBodyImpactRiskRegime=Object.freeze({
  NONE,
  RADIAL_CROSSING_ONLY,
  PLANET_APPROACH_CORRIDOR,
  PLANET_COLLISION_CORRIDOR,
  MOON_ORBITAL_REGION,
  values:VALUES,
  fromCodeOrNull(code:number):MinorBodyImpactRiskRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):MinorBodyImpactRiskRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown MinorBodyImpactRiskRegime code: ${code}.`);
    return value;
  },
});
