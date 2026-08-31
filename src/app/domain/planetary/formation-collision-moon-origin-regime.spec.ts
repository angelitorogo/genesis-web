import { FormationCollisionMoonOriginRegime as R } from './formation-collision-moon-origin-regime';
describe('FormationCollisionMoonOriginRegime point 23.12',()=>{it('should preserve stable codes',()=>{expect(R.values.map(value=>value.code)).toEqual([0,1,2,3,4,5]);expect(R.fromCode(4)).toBe(R.PLAUSIBLE_MOON_ORIGIN_CANDIDATE);expect(R.fromCodeOrNull(99)).toBeNull();});});
