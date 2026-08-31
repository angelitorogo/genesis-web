import { FormationCollisionMoonOriginAssessment, formationCollisionMoonOriginRegimeV1, giantFormationCollisionIndexV1, giantFormationCollisionV1 } from './formation-collision-moon-origin-assessment';
import { FormationCollisionMoonOriginRegime as R } from './formation-collision-moon-origin-regime';
import type { EarlyProtoplanetCollision } from './early-protoplanet-collision';

describe('FormationCollisionMoonOriginAssessment point 23.12',()=>{
  it('should freeze giant-collision thresholds without claiming moon origin',()=>{expect(giantFormationCollisionV1(.7,.8)).toBe(true);expect(giantFormationCollisionV1(.3,.8)).toBe(false);expect(giantFormationCollisionIndexV1(.7,.8)).toBeGreaterThan(.7);expect(formationCollisionMoonOriginRegimeV1(true,.8,1)).toBe(R.STRONG_MOON_ORIGIN_CANDIDATE);});
  it('should preserve an unmapped frozen formation collision without invented target data',()=>{const collision={eventOrdinal:1,participantSourceFormationOrdinals:[1,2],orbitalRadiusAu:1,impactSeverity01:.7,combinedSolidMassEarth:1} as EarlyProtoplanetCollision;expect(()=>new FormationCollisionMoonOriginAssessment(collision,null,null,null,null,null,null,false,[],R.NO_MATURE_PLANET_MAPPING)).not.toThrow();});
});
