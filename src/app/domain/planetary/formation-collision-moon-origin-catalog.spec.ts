import { FormationCollisionMoonOriginCatalog } from './formation-collision-moon-origin-catalog';
import { FormationCollisionMoonOriginAssessment } from './formation-collision-moon-origin-assessment';
import { FormationCollisionMoonOriginRegime as R } from './formation-collision-moon-origin-regime';
import type { EarlyPlanetaryDynamicsOutcome } from './early-planetary-dynamics-outcome';
import type { EarlyProtoplanetCollision } from './early-protoplanet-collision';
import type { PlanetarySystem } from './planetary-system';

describe('FormationCollisionMoonOriginCatalog point 23.12',()=>{it('should preserve exact point-17.5 collision order/references',()=>{const collision={eventOrdinal:1} as unknown as EarlyProtoplanetCollision;const early={collisions:[collision]} as unknown as EarlyPlanetaryDynamicsOutcome;const system={planetCount:0} as unknown as PlanetarySystem;const assessment=new FormationCollisionMoonOriginAssessment(collision,null,null,null,null,null,null,false,[],R.NO_MATURE_PLANET_MAPPING);const catalog=new FormationCollisionMoonOriginCatalog(system,early,[],[],[assessment]);expect(catalog.assessments[0].collision).toBe(collision);expect(catalog.collisionCount).toBe(1);});});
