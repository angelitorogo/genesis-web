const NO_MATURE_PLANET_MAPPING=Object.freeze({name:'NO_MATURE_PLANET_MAPPING',code:0} as const);
const NON_GIANT_COLLISION=Object.freeze({name:'NON_GIANT_COLLISION',code:1} as const);
const GIANT_COLLISION_NO_MOON_ORIGIN_CANDIDATE=Object.freeze({name:'GIANT_COLLISION_NO_MOON_ORIGIN_CANDIDATE',code:2} as const);
const WEAK_MOON_ORIGIN_CANDIDATE=Object.freeze({name:'WEAK_MOON_ORIGIN_CANDIDATE',code:3} as const);
const PLAUSIBLE_MOON_ORIGIN_CANDIDATE=Object.freeze({name:'PLAUSIBLE_MOON_ORIGIN_CANDIDATE',code:4} as const);
const STRONG_MOON_ORIGIN_CANDIDATE=Object.freeze({name:'STRONG_MOON_ORIGIN_CANDIDATE',code:5} as const);

export type FormationCollisionMoonOriginRegimeValue=
  | typeof NO_MATURE_PLANET_MAPPING
  | typeof NON_GIANT_COLLISION
  | typeof GIANT_COLLISION_NO_MOON_ORIGIN_CANDIDATE
  | typeof WEAK_MOON_ORIGIN_CANDIDATE
  | typeof PLAUSIBLE_MOON_ORIGIN_CANDIDATE
  | typeof STRONG_MOON_ORIGIN_CANDIDATE;

const VALUES:readonly FormationCollisionMoonOriginRegimeValue[]=Object.freeze([
  NO_MATURE_PLANET_MAPPING,
  NON_GIANT_COLLISION,
  GIANT_COLLISION_NO_MOON_ORIGIN_CANDIDATE,
  WEAK_MOON_ORIGIN_CANDIDATE,
  PLAUSIBLE_MOON_ORIGIN_CANDIDATE,
  STRONG_MOON_ORIGIN_CANDIDATE,
]);

/** Point-23.12 coarse formation-collision / possible moon-origin verdict. */
export const FormationCollisionMoonOriginRegime=Object.freeze({
  NO_MATURE_PLANET_MAPPING,
  NON_GIANT_COLLISION,
  GIANT_COLLISION_NO_MOON_ORIGIN_CANDIDATE,
  WEAK_MOON_ORIGIN_CANDIDATE,
  PLAUSIBLE_MOON_ORIGIN_CANDIDATE,
  STRONG_MOON_ORIGIN_CANDIDATE,
  values:VALUES,
  fromCodeOrNull(code:number):FormationCollisionMoonOriginRegimeValue|null {
    return VALUES.find(value=>value.code===code)??null;
  },
  fromCode(code:number):FormationCollisionMoonOriginRegimeValue {
    const value=this.fromCodeOrNull(code);
    if(value===null) throw new RangeError(`Unknown FormationCollisionMoonOriginRegime code: ${code}.`);
    return value;
  },
});
