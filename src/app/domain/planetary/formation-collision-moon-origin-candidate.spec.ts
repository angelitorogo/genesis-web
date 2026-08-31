import { FormationCollisionMoonOriginCandidate } from './formation-collision-moon-origin-candidate';
import type { Planet } from './planet';
import type { RelevantMoon } from './relevant-moon';

describe('FormationCollisionMoonOriginCandidate point 23.12',()=>{it('should conserve the exact moon/planet mass ratio',()=>{const planet={planetOrdinal:1,massEarth:1} as unknown as Planet;const moon={hostPlanetOrdinal:1,massEarth:.0123,moonOrdinal:1,name:'Test b I',proceduralCode:'MOON-1'} as unknown as RelevantMoon;expect(()=>new FormationCollisionMoonOriginCandidate(planet,moon,.0123,.9,.8,.7)).not.toThrow();expect(()=>new FormationCollisionMoonOriginCandidate(planet,moon,.02,.9,.8,.7)).toThrow(RangeError);});});
