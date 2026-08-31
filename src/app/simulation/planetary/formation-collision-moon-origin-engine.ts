import { type EarlyPlanetaryDynamicsOutcome } from '../../domain/planetary/early-planetary-dynamics-outcome';
import { type EarlyProtoplanetCollision } from '../../domain/planetary/early-protoplanet-collision';
import {
  FormationCollisionMoonOriginAssessment,
  formationCollisionMoonOriginRegimeV1,
  giantFormationCollisionIndexV1,
  giantFormationCollisionV1,
  hostSolidDominanceIndexV1,
  moonFormingDebrisPotentialIndexV1,
} from '../../domain/planetary/formation-collision-moon-origin-assessment';
import { FormationCollisionMoonOriginCandidate } from '../../domain/planetary/formation-collision-moon-origin-candidate';
import { FormationCollisionMoonOriginCatalog } from '../../domain/planetary/formation-collision-moon-origin-catalog';
import { FormationCollisionMoonOriginRegime } from '../../domain/planetary/formation-collision-moon-origin-regime';
import { type MoonSystem } from '../../domain/planetary/moon-system';
import { type Planet } from '../../domain/planetary/planet';
import { type PlanetarySystem } from '../../domain/planetary/planetary-system';
import { type RelevantMoon } from '../../domain/planetary/relevant-moon';

const TOLERANCE=1e-9;
const V1_MAX_IMPACT_DERIVED_MOON_MASS_FRACTION=0.03;
const V1_MIN_MOON_ORIGIN_CANDIDATE_PLAUSIBILITY=0.05;

/**
 * Point-23.12 zero-entropy bridge from point-17.5 formation collisions to the
 * mature point-19/21 planet/moon system.
 *
 * V1 never creates a moon, never changes point-21 moon properties and never
 * claims a historical moon-forming event. It maps collision lineages through
 * point-18.2 sourceFormationOrdinals and scores existing relevant moons as
 * possible debris-accretion outcomes. Missing impact angle/angular momentum is
 * represented as uncertainty, not filled with invented random values.
 */
export class FormationCollisionMoonOriginEngine {
  private constructor() {}

  static generate(
    planetarySystem:PlanetarySystem,
    earlyDynamicsOutcome:EarlyPlanetaryDynamicsOutcome,
    planets:readonly Planet[],
    moonSystems:readonly MoonSystem[],
  ):FormationCollisionMoonOriginCatalog {
    assertFormationHistoryConsistencyV1(planetarySystem,earlyDynamicsOutcome);
    assertMatureTargetsV1(planetarySystem,planets,moonSystems);

    const assessments=earlyDynamicsOutcome.collisions.map(collision=>assessmentV1(collision,planets,moonSystems));
    return new FormationCollisionMoonOriginCatalog(
      planetarySystem,
      earlyDynamicsOutcome,
      planets,
      moonSystems,
      assessments,
    );
  }
}

function assessmentV1(
  collision:EarlyProtoplanetCollision,
  planets:readonly Planet[],
  moonSystems:readonly MoonSystem[],
):FormationCollisionMoonOriginAssessment {
  const hostPlanet=hostPlanetForCollisionV1(collision,planets);
  if(hostPlanet===null) {
    return new FormationCollisionMoonOriginAssessment(
      collision,null,null,null,null,null,null,false,[],
      FormationCollisionMoonOriginRegime.NO_MATURE_PLANET_MAPPING,
    );
  }

  const moonSystem=moonSystems[hostPlanet.planetOrdinal-1];
  const inheritedCoreMass=requiredPositive(hostPlanet.physicalProperties.inheritedSolidCoreMassEarth,'inheritedSolidCoreMassEarth');
  const rawMassFraction=collision.combinedSolidMassEarth/inheritedCoreMass;
  if(rawMassFraction>1+TOLERANCE) {
    throw new RangeError('Point-23.12 collision mass cannot exceed the inherited mature-planet solid-core lineage mass.');
  }
  const massFraction=clamp01(rawMassFraction);
  const giantIndex=giantFormationCollisionIndexV1(collision.impactSeverity01,massFraction);
  const isGiant=giantFormationCollisionV1(collision.impactSeverity01,massFraction);
  const hostSolidDominance=hostSolidDominanceIndexV1(hostPlanet.physicalProperties.solidMassFraction01);
  const debrisPotential=isGiant
    ? moonFormingDebrisPotentialIndexV1(collision.impactSeverity01,massFraction,hostSolidDominance)
    : 0;

  const candidates=isGiant
    ? moonSystem.relevantMoons
        .map(moon=>moonOriginCandidateV1(hostPlanet,moon,debrisPotential,hostSolidDominance))
        .filter(candidate=>candidate.originPlausibilityIndex01>=V1_MIN_MOON_ORIGIN_CANDIDATE_PLAUSIBILITY)
    : [];
  const best=candidates.reduce<number|null>((maximum,candidate)=>maximum===null||candidate.originPlausibilityIndex01>maximum?candidate.originPlausibilityIndex01:maximum,null);
  const regime=isGiant
    ? formationCollisionMoonOriginRegimeV1(true,best,candidates.length)
    : FormationCollisionMoonOriginRegime.NON_GIANT_COLLISION;

  return new FormationCollisionMoonOriginAssessment(
    collision,
    hostPlanet,
    moonSystem,
    massFraction,
    giantIndex,
    debrisPotential,
    hostSolidDominance,
    isGiant,
    candidates,
    regime,
  );
}

function hostPlanetForCollisionV1(collision:EarlyProtoplanetCollision,planets:readonly Planet[]):Planet|null {
  const matches=planets.filter(planet=>{
    const lineage=new Set(planet.architectureSlot.sourceFormationOrdinals);
    return collision.participantSourceFormationOrdinals.every(ordinal=>lineage.has(ordinal));
  });
  if(matches.length>1) throw new RangeError('Point-23.12 collision lineage cannot map to more than one mature planet.');
  return matches[0]??null;
}

function moonOriginCandidateV1(
  hostPlanet:Planet,
  moon:RelevantMoon,
  debrisPotentialIndex01:number,
  hostSolidDominanceIndex01:number,
):FormationCollisionMoonOriginCandidate {
  const massRatio=moon.massEarth/hostPlanet.massEarth;
  const supportedMassFraction=V1_MAX_IMPACT_DERIVED_MOON_MASS_FRACTION*debrisPotentialIndex01;
  const massCompatibility=massRatio<=0
    ? 0
    : clamp01(supportedMassFraction/massRatio);

  const eccentricityCompatibility=1-clamp01(moon.orbit.eccentricity/0.25);
  const inclinationCompatibility=1-clamp01(moon.orbit.inclinationDegrees/30);
  const radialCompatibility=moon.semiMajorAxisPlanetRadii<=120
    ? 1
    : clamp01(1-(moon.semiMajorAxisPlanetRadii-120)/180);
  const orbitCompatibility=clamp01(
    0.45*inclinationCompatibility+
    0.35*eccentricityCompatibility+
    0.20*radialCompatibility
  );
  const plausibility=clamp01(
    debrisPotentialIndex01*
    hostSolidDominanceIndex01*
    (0.45*massCompatibility+0.55*orbitCompatibility)
  );

  return new FormationCollisionMoonOriginCandidate(
    hostPlanet,
    moon,
    massRatio,
    massCompatibility,
    orbitCompatibility,
    plausibility,
  );
}

function assertFormationHistoryConsistencyV1(
  planetarySystem:PlanetarySystem,
  earlyDynamics:EarlyPlanetaryDynamicsOutcome,
):void {
  const blueprint=planetarySystem.formationBlueprint;
  if(
    earlyDynamics.sourceCandidateCount!==blueprint.sourceCandidateCount||
    earlyDynamics.survivorCount!==blueprint.sourceSurvivorCount||
    earlyDynamics.migratedBodyCount!==blueprint.sourceMigratedBodyCount||
    earlyDynamics.collisionCount!==blueprint.sourceCollisionCount||
    relativeError(earlyDynamics.sourceCandidateSolidMassEarth,blueprint.sourceCandidateSolidMassEarth)>TOLERANCE
  ) {
    throw new RangeError('Point-23.12 requires the exact point-17.5 history summarized by the supplied point-17.7 formation blueprint.');
  }
}

function assertMatureTargetsV1(
  planetarySystem:PlanetarySystem,
  planets:readonly Planet[],
  moonSystems:readonly MoonSystem[],
):void {
  if(planets.length!==planetarySystem.planetCount||moonSystems.length!==planets.length) {
    throw new RangeError('Point-23.12 requires complete point-19 Planet and point-21 MoonSystem populations.');
  }
  for(let index=0;index<planets.length;index+=1) {
    const planet=planets[index];
    if(planet.hostPlanetarySystem!==planetarySystem||planet.planetOrdinal!==index+1||planetarySystem.planetSlots[index]!==planet.architectureSlot) {
      throw new RangeError('Point-23.12 Planet population must preserve canonical mature order/lineage.');
    }
    if(moonSystems[index].hostPlanet!==planet) {
      throw new RangeError('Point-23.12 MoonSystem population must preserve exact host Planet references/order.');
    }
  }
}

function requiredPositive(value:number,name:string):number {if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);return value;}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function clamp01(value:number):number{return Math.min(1,Math.max(0,value));}
function relativeError(actual:number,expected:number):number{return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
