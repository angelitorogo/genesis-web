import type { EarlyPlanetaryDynamicsOutcome } from '../../domain/planetary/early-planetary-dynamics-outcome';
import type { EarlyProtoplanetCollision } from '../../domain/planetary/early-protoplanet-collision';
import { FormationCollisionMoonOriginRegime as R } from '../../domain/planetary/formation-collision-moon-origin-regime';
import type { MoonSystem } from '../../domain/planetary/moon-system';
import type { Planet } from '../../domain/planetary/planet';
import type { PlanetarySystem } from '../../domain/planetary/planetary-system';
import type { RelevantMoon } from '../../domain/planetary/relevant-moon';
import { hostSolidDominanceIndexV1, moonFormingDebrisPotentialIndexV1 } from '../../domain/planetary/formation-collision-moon-origin-assessment';
import { FormationCollisionMoonOriginEngine } from './formation-collision-moon-origin-engine';

describe('FormationCollisionMoonOriginEngine point 23.12',()=>{
  it('should map a strong early collision through mature lineage and score an existing relevant moon',()=>{
    const f=fixture(.72,.8,.0123,5,0.01);
    const catalog=FormationCollisionMoonOriginEngine.generate(f.system,f.early,[f.planet],[f.moons]);
    const a=catalog.assessments[0];
    expect(a.collision).toBe(f.collision);
    expect(a.hostPlanet).toBe(f.planet);
    expect(a.isGiantFormationCollision).toBe(true);
    expect(a.moonOriginCandidates[0].moon).toBe(f.moon);
    expect(a.bestMoonOriginPlausibilityIndex01).toBeGreaterThan(.45);
    expect([R.PLAUSIBLE_MOON_ORIGIN_CANDIDATE,R.STRONG_MOON_ORIGIN_CANDIDATE]).toContain(a.regime);
  });
  it('should not turn a low-severity merger into a moon-forming collision',()=>{const f=fixture(.25,.8,.0123,5,.01);const a=FormationCollisionMoonOriginEngine.generate(f.system,f.early,[f.planet],[f.moons]).assessments[0];expect(a.isGiantFormationCollision).toBe(false);expect(a.regime).toBe(R.NON_GIANT_COLLISION);expect(a.moonOriginCandidates).toEqual([]);});
  it('should retain dynamically excluded formation collisions as unmapped rather than deleting history',()=>{const f=fixture(.72,.8,.0123,5,.01);const system={...f.system,planetCount:0,planetSlots:[]} as unknown as PlanetarySystem;const catalog=FormationCollisionMoonOriginEngine.generate(system,f.early,[],[]);expect(catalog.assessments[0].regime).toBe(R.NO_MATURE_PLANET_MAPPING);expect(catalog.assessments[0].collision).toBe(f.collision);});
  it('should reject a point-17.5 outcome that does not match the frozen point-17.7 blueprint summary',()=>{const f=fixture(.72,.8,.0123,5,.01);const wrong={...f.early,sourceCandidateCount:3} as EarlyPlanetaryDynamicsOutcome;expect(()=>FormationCollisionMoonOriginEngine.generate(f.system,wrong,[f.planet],[f.moons])).toThrow(RangeError);});
  it('should keep the V1 debris proxy bounded and suppress gaseous hosts',()=>{const solid={physicalProperties:{solidMassFraction01:1}} as unknown as Planet;const gas={physicalProperties:{solidMassFraction01:.3}} as unknown as Planet;expect(hostSolidDominanceIndexV1(solid.physicalProperties.solidMassFraction01)).toBeCloseTo(1,12);expect(hostSolidDominanceIndexV1(gas.physicalProperties.solidMassFraction01)).toBe(0);expect(moonFormingDebrisPotentialIndexV1(.72,.8,1)).toBeGreaterThan(.7);});
});

function fixture(severity:number,collisionMass:number,moonMass:number,inclination:number,eccentricity:number){
  const slot={sourceFormationOrdinals:[1,2],inheritedSolidCoreMassEarth:1} as const;
  const system={planetCount:1,planetSlots:[slot],formationBlueprint:{sourceCandidateCount:2,sourceSurvivorCount:1,sourceMigratedBodyCount:0,sourceCollisionCount:1,sourceCandidateSolidMassEarth:1}} as unknown as PlanetarySystem;
  const planet={hostPlanetarySystem:system,planetOrdinal:1,architectureSlot:slot,massEarth:1,physicalProperties:{inheritedSolidCoreMassEarth:1,solidMassFraction01:1}} as unknown as Planet;
  const moon={hostPlanetOrdinal:1,moonOrdinal:1,massEarth:moonMass,name:'Test b I',proceduralCode:'TEST-MOON-1',semiMajorAxisPlanetRadii:60,orbit:{eccentricity,inclinationDegrees:inclination}} as unknown as RelevantMoon;
  const moons={hostPlanet:planet,relevantMoons:[moon]} as unknown as MoonSystem;
  const collision={eventOrdinal:1,participantSourceFormationOrdinals:[1,2],orbitalRadiusAu:1,combinedSolidMassEarth:collisionMass,impactSeverity01:severity} as EarlyProtoplanetCollision;
  const early={sourceCandidateCount:2,sourceCandidateSolidMassEarth:1,survivorCount:1,migratedBodyCount:0,collisionCount:1,collisions:[collision]} as unknown as EarlyPlanetaryDynamicsOutcome;
  return {system,planet,moon,moons,collision,early};
}
