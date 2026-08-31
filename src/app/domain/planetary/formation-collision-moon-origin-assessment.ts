import { type EarlyProtoplanetCollision } from './early-protoplanet-collision';
import { type FormationCollisionMoonOriginCandidate } from './formation-collision-moon-origin-candidate';
import { FormationCollisionMoonOriginRegime, type FormationCollisionMoonOriginRegimeValue } from './formation-collision-moon-origin-regime';
import { type MoonSystem } from './moon-system';
import { type Planet } from './planet';

const TOLERANCE=1e-9;

/**
 * Point-23.12 traceable interpretation of one frozen point-17.5 collision.
 *
 * A STRONG/PLAUSIBLE verdict is still only an origin candidate. V1 lacks impact
 * angle, resolved impactor/target masses and angular momentum, so it deliberately
 * does not claim that a moon was actually formed by this collision.
 */
export class FormationCollisionMoonOriginAssessment {
  readonly moonOriginCandidates:readonly FormationCollisionMoonOriginCandidate[];

  constructor(
    readonly collision:EarlyProtoplanetCollision,
    readonly hostPlanet:Planet|null,
    readonly moonSystem:MoonSystem|null,
    readonly collisionSolidMassFractionOfHostCore01:number|null,
    readonly giantCollisionIndex01:number|null,
    readonly moonFormingDebrisPotentialIndex01:number|null,
    readonly hostSolidDominanceIndex01:number|null,
    readonly isGiantFormationCollision:boolean,
    moonOriginCandidates:readonly FormationCollisionMoonOriginCandidate[],
    readonly regime:FormationCollisionMoonOriginRegimeValue,
  ) {
    if(!FormationCollisionMoonOriginRegime.values.includes(regime)) {
      throw new RangeError('Unknown FormationCollisionMoonOriginRegime.');
    }
    this.moonOriginCandidates=Object.freeze([...moonOriginCandidates]);

    if(hostPlanet===null) {
      if(moonSystem!==null||collisionSolidMassFractionOfHostCore01!==null||giantCollisionIndex01!==null||moonFormingDebrisPotentialIndex01!==null||hostSolidDominanceIndex01!==null||isGiantFormationCollision||this.moonOriginCandidates.length!==0) {
        throw new RangeError('Unmapped point-23.12 formation collisions cannot invent mature-planet or moon-origin quantities.');
      }
      if(regime!==FormationCollisionMoonOriginRegime.NO_MATURE_PLANET_MAPPING) {
        throw new RangeError('Unmapped point-23.12 collisions must use NO_MATURE_PLANET_MAPPING.');
      }
      return;
    }

    if(moonSystem===null||moonSystem.hostPlanet!==hostPlanet) {
      throw new RangeError('Mapped point-23.12 collisions require the exact point-21 MoonSystem of the mature host planet.');
    }
    const massFraction=requiredIndex(collisionSolidMassFractionOfHostCore01,'collisionSolidMassFractionOfHostCore01');
    const giantIndex=requiredIndex(giantCollisionIndex01,'giantCollisionIndex01');
    const debris=requiredIndex(moonFormingDebrisPotentialIndex01,'moonFormingDebrisPotentialIndex01');
    const hostSolid=requiredIndex(hostSolidDominanceIndex01,'hostSolidDominanceIndex01');

    const expectedMassFraction=collision.combinedSolidMassEarth/hostPlanet.physicalProperties.inheritedSolidCoreMassEarth;
    if(expectedMassFraction>1+TOLERANCE||relativeError(massFraction,Math.min(1,expectedMassFraction))>TOLERANCE) {
      throw new RangeError('Point-23.12 collision mass fraction must preserve point-17.5 collision mass against the mature inherited solid core.');
    }

    const expectedHostSolid=hostSolidDominanceIndexV1(hostPlanet.physicalProperties.solidMassFraction01);
    if(Math.abs(hostSolid-expectedHostSolid)>TOLERANCE) {
      throw new RangeError('Point-23.12 hostSolidDominanceIndex01 must preserve the point-19 solid mass fraction.');
    }

    const expectedGiantIndex=giantFormationCollisionIndexV1(collision.impactSeverity01,massFraction);
    if(Math.abs(giantIndex-expectedGiantIndex)>TOLERANCE) {
      throw new RangeError('Point-23.12 giantCollisionIndex01 must match the frozen V1 projection.');
    }

    const expectedGiant=giantFormationCollisionV1(collision.impactSeverity01,massFraction);
    if(isGiantFormationCollision!==expectedGiant) {
      throw new RangeError('Point-23.12 giant-collision verdict must match the frozen V1 severity/mass criterion.');
    }
    if(!isGiantFormationCollision) {
      if(debris!==0||this.moonOriginCandidates.length!==0||regime!==FormationCollisionMoonOriginRegime.NON_GIANT_COLLISION) {
        throw new RangeError('Non-giant point-23.12 collisions cannot produce moon-origin candidates.');
      }
      return;
    }

    const expectedDebris=moonFormingDebrisPotentialIndexV1(collision.impactSeverity01,massFraction,hostSolid);
    if(Math.abs(debris-expectedDebris)>TOLERANCE) {
      throw new RangeError('Point-23.12 debris-potential index must match the frozen V1 collision/host projection.');
    }

    for(const candidate of this.moonOriginCandidates) {
      if(candidate.hostPlanet!==hostPlanet||!moonSystem.relevantMoons.includes(candidate.moon)) {
        throw new RangeError('Point-23.12 candidates must preserve exact host Planet and relevant Moon references.');
      }
    }
    const uniqueMoons=new Set(this.moonOriginCandidates.map(candidate=>candidate.moon));
    if(uniqueMoons.size!==this.moonOriginCandidates.length) {
      throw new RangeError('Point-23.12 cannot score the same moon more than once for one collision.');
    }

    const expectedRegime=formationCollisionMoonOriginRegimeV1(true,this.bestMoonOriginPlausibilityIndex01,this.moonOriginCandidates.length);
    if(regime!==expectedRegime) {
      throw new RangeError('Point-23.12 regime must match the giant-collision moon-origin candidate score.');
    }
  }

  get eventOrdinal(){return this.collision.eventOrdinal;}
  get participantSourceFormationOrdinals(){return this.collision.participantSourceFormationOrdinals;}
  get impactSeverity01(){return this.collision.impactSeverity01;}
  get hostPlanetOrdinal(){return this.hostPlanet?.planetOrdinal??null;}
  get bestMoonOriginCandidate():FormationCollisionMoonOriginCandidate|null {
    return this.moonOriginCandidates.reduce<FormationCollisionMoonOriginCandidate|null>((best,candidate)=>best===null||candidate.originPlausibilityIndex01>best.originPlausibilityIndex01?candidate:best,null);
  }
  get bestMoonOriginPlausibilityIndex01():number|null {
    return this.bestMoonOriginCandidate?.originPlausibilityIndex01??null;
  }
  get hasMoonOriginCandidate(){return this.moonOriginCandidates.length>0;}
}

export function giantFormationCollisionIndexV1(impactSeverity01:number,collisionSolidMassFractionOfHostCore01:number):number {
  assertIndex(impactSeverity01,'impactSeverity01');
  assertIndex(collisionSolidMassFractionOfHostCore01,'collisionSolidMassFractionOfHostCore01');
  return clamp01(0.62*impactSeverity01+0.38*Math.sqrt(collisionSolidMassFractionOfHostCore01));
}

export function giantFormationCollisionV1(impactSeverity01:number,collisionSolidMassFractionOfHostCore01:number):boolean {
  const index=giantFormationCollisionIndexV1(impactSeverity01,collisionSolidMassFractionOfHostCore01);
  return impactSeverity01>=0.45&&collisionSolidMassFractionOfHostCore01>=0.20&&index>=0.50;
}

export function hostSolidDominanceIndexV1(solidMassFraction01:number):number {
  assertIndex(solidMassFraction01,'solidMassFraction01');
  return clamp01((solidMassFraction01-0.55)/0.45);
}

export function moonFormingDebrisPotentialIndexV1(
  impactSeverity01:number,
  collisionSolidMassFractionOfHostCore01:number,
  hostSolidDominanceIndex01:number,
):number {
  assertIndex(impactSeverity01,'impactSeverity01');
  assertIndex(collisionSolidMassFractionOfHostCore01,'collisionSolidMassFractionOfHostCore01');
  assertIndex(hostSolidDominanceIndex01,'hostSolidDominanceIndex01');
  const severityWindow=clamp01(1-Math.abs(impactSeverity01-0.72)/0.72);
  const participatingMassIndex=Math.sqrt(collisionSolidMassFractionOfHostCore01);
  return clamp01(hostSolidDominanceIndex01*(0.52*participatingMassIndex+0.48*severityWindow));
}

export function formationCollisionMoonOriginRegimeV1(
  isGiantFormationCollision:boolean,
  bestMoonOriginPlausibilityIndex01:number|null,
  candidateCount:number,
):FormationCollisionMoonOriginRegimeValue {
  if(!isGiantFormationCollision) return FormationCollisionMoonOriginRegime.NON_GIANT_COLLISION;
  if(!Number.isInteger(candidateCount)||candidateCount<0) throw new RangeError('candidateCount must be a non-negative integer.');
  if(candidateCount===0) {
    if(bestMoonOriginPlausibilityIndex01!==null) throw new RangeError('A collision without candidates cannot have a best plausibility score.');
    return FormationCollisionMoonOriginRegime.GIANT_COLLISION_NO_MOON_ORIGIN_CANDIDATE;
  }
  if(bestMoonOriginPlausibilityIndex01===null) throw new RangeError('A collision with candidates requires a best plausibility score.');
  assertIndex(bestMoonOriginPlausibilityIndex01,'bestMoonOriginPlausibilityIndex01');
  if(bestMoonOriginPlausibilityIndex01>=0.72) return FormationCollisionMoonOriginRegime.STRONG_MOON_ORIGIN_CANDIDATE;
  if(bestMoonOriginPlausibilityIndex01>=0.45) return FormationCollisionMoonOriginRegime.PLAUSIBLE_MOON_ORIGIN_CANDIDATE;
  return FormationCollisionMoonOriginRegime.WEAK_MOON_ORIGIN_CANDIDATE;
}

function requiredIndex(value:number|null,name:string):number {if(value===null) throw new RangeError(`${name} is required.`);assertIndex(value,name);return value;}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function clamp01(value:number):number{return Math.min(1,Math.max(0,value));}
function relativeError(actual:number,expected:number):number{return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
