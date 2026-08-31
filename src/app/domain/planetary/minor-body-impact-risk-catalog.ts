import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { type MinorBodyCloseEncounterCatalog } from './minor-body-close-encounter-catalog';
import { type MinorBodyImpactRiskAssessment } from './minor-body-impact-risk-assessment';
import { MinorBodyImpactRiskRegime } from './minor-body-impact-risk-regime';

/** Point-23.7 full post-encounter orbital-risk matrix. */
export class MinorBodyImpactRiskCatalog {
  readonly assessments:readonly MinorBodyImpactRiskAssessment[];

  constructor(
    readonly closeEncounterCatalog:MinorBodyCloseEncounterCatalog,
    assessments:readonly MinorBodyImpactRiskAssessment[],
  ) {
    this.assessments=Object.freeze([...assessments]);
    validateMatrix(closeEncounterCatalog,this.assessments);
  }

  get transitionCount(){return this.closeEncounterCatalog.transitions.length;}
  get assessableTargetCount(){return this.closeEncounterCatalog.proximityCatalog.assessableTargetCount;}
  get assessmentCount(){return this.assessments.length;}
  get riskCandidateCount(){return this.assessments.filter(item=>item.riskCandidate).length;}
  get planetRiskCandidateCount(){return this.assessments.filter(item=>item.isPlanetTarget&&item.riskCandidate).length;}
  get moonRiskCandidateCount(){return this.assessments.filter(item=>item.isMoonTarget&&item.riskCandidate).length;}
  get directPlanetCollisionGeometryCount(){return this.assessments.filter(item=>item.directCollisionGeometryCandidate).length;}
  get radialCrossingOnlyCount(){return this.assessments.filter(item=>item.regime===MinorBodyImpactRiskRegime.RADIAL_CROSSING_ONLY).length;}
  get highestOrbitalRiskIndex01(){return this.assessments.reduce((highest,item)=>Math.max(highest,item.orbitalRiskIndex01),0);}
  get relevantAssessments(){return Object.freeze(this.assessments.filter(item=>item.riskCandidate||item.radialRangesOverlap));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(item=>item.minorBodyProceduralId===proceduralId));}
}

function validateMatrix(closeCatalog:MinorBodyCloseEncounterCatalog,assessments:readonly MinorBodyImpactRiskAssessment[]):void {
  const proximity=closeCatalog.proximityCatalog;
  const relevantMoons=proximity.moonSystems.flatMap(system=>system.relevantMoons);
  const expected=closeCatalog.transitions.length*(proximity.planets.length+relevantMoons.length);
  if(assessments.length!==expected) throw new RangeError('MinorBodyImpactRiskCatalog requires one point-23.7 assessment for every post-23.6 transition x assessable target pair.');
  let cursor=0;
  for(const transition of closeCatalog.transitions) {
    for(const planet of proximity.planets) {
      const item=assessments[cursor++];
      if(item.transition!==transition||item.targetKind!==MinorBodyApproachTargetKind.PLANET||item.targetPlanet!==planet||item.targetMoon!==null) {
        throw new RangeError('Point-23.7 planet risk matrix must preserve exact transition/planet order and references.');
      }
    }
    for(const moon of relevantMoons) {
      const item=assessments[cursor++];
      const host=proximity.planets[moon.hostPlanetOrdinal-1];
      if(item.transition!==transition||item.targetKind!==MinorBodyApproachTargetKind.MOON||item.targetPlanet!==host||item.targetMoon!==moon) {
        throw new RangeError('Point-23.7 moon risk matrix must preserve exact transition/relevant-moon order and references.');
      }
    }
  }
}
