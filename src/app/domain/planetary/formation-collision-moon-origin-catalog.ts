import { type EarlyPlanetaryDynamicsOutcome } from './early-planetary-dynamics-outcome';
import { type FormationCollisionMoonOriginAssessment } from './formation-collision-moon-origin-assessment';
import { FormationCollisionMoonOriginRegime } from './formation-collision-moon-origin-regime';
import { type MoonSystem } from './moon-system';
import { type Planet } from './planet';
import { type PlanetarySystem } from './planetary-system';

/** Point-23.12 traceable one-to-one projection over the frozen point-17.5 collision list. */
export class FormationCollisionMoonOriginCatalog {
  readonly planets:readonly Planet[];
  readonly moonSystems:readonly MoonSystem[];
  readonly assessments:readonly FormationCollisionMoonOriginAssessment[];

  constructor(
    readonly planetarySystem:PlanetarySystem,
    readonly earlyDynamicsOutcome:EarlyPlanetaryDynamicsOutcome,
    planets:readonly Planet[],
    moonSystems:readonly MoonSystem[],
    assessments:readonly FormationCollisionMoonOriginAssessment[],
  ) {
    this.planets=Object.freeze([...planets]);
    this.moonSystems=Object.freeze([...moonSystems]);
    this.assessments=Object.freeze([...assessments]);

    const collisions=earlyDynamicsOutcome.collisions;
    if(this.assessments.length!==collisions.length) {
      throw new RangeError('Point-23.12 requires exactly one assessment for every point-17.5 collision.');
    }
    for(let index=0;index<this.assessments.length;index+=1) {
      const assessment=this.assessments[index];
      if(assessment.collision!==collisions[index]) {
        throw new RangeError('Point-23.12 must preserve exact point-17.5 collision order/references.');
      }
      if(assessment.hostPlanet!==null) {
        const hostIndex=assessment.hostPlanet.planetOrdinal-1;
        if(this.planets[hostIndex]!==assessment.hostPlanet||this.moonSystems[hostIndex]!==assessment.moonSystem) {
          throw new RangeError('Mapped point-23.12 assessments must preserve exact mature Planet/MoonSystem population references.');
        }
      }
    }
    if(this.planets.length!==planetarySystem.planetCount||this.moonSystems.length!==this.planets.length) {
      throw new RangeError('Point-23.12 requires the complete mature Planet and MoonSystem populations.');
    }
    for(let index=0;index<this.planets.length;index+=1) {
      const planet=this.planets[index];
      if(planet.hostPlanetarySystem!==planetarySystem||planet.planetOrdinal!==index+1) {
        throw new RangeError('Point-23.12 planets must preserve complete point-19 order and exact host system reference.');
      }
      if(this.moonSystems[index].hostPlanet!==planet) {
        throw new RangeError('Point-23.12 MoonSystems must preserve exact point-21 host Planet references/order.');
      }
    }
  }

  get collisionCount(){return this.assessments.length;}
  get mappedCollisionCount(){return this.assessments.filter(item=>item.hostPlanet!==null).length;}
  get giantFormationCollisionCount(){return this.assessments.filter(item=>item.isGiantFormationCollision).length;}
  get collisionWithMoonOriginCandidateCount(){return this.assessments.filter(item=>item.hasMoonOriginCandidate).length;}
  get plausibleOrStrongMoonOriginCollisionCount(){return this.assessments.filter(item=>item.regime===FormationCollisionMoonOriginRegime.PLAUSIBLE_MOON_ORIGIN_CANDIDATE||item.regime===FormationCollisionMoonOriginRegime.STRONG_MOON_ORIGIN_CANDIDATE).length;}
  get strongestMoonOriginAssessment():FormationCollisionMoonOriginAssessment|null {
    return this.assessments.reduce<FormationCollisionMoonOriginAssessment|null>((best,item)=>item.bestMoonOriginPlausibilityIndex01!==null&&(best===null||item.bestMoonOriginPlausibilityIndex01>(best.bestMoonOriginPlausibilityIndex01??-1))?item:best,null);
  }
  forPlanet(planetOrdinal:number){return Object.freeze(this.assessments.filter(item=>item.hostPlanetOrdinal===planetOrdinal));}
}
