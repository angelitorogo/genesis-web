import { type MinorBodyResonanceCatalog } from './minor-body-resonance-catalog';
import { MinorBodyGiantInfluenceRegime } from './minor-body-giant-influence-regime';
import { type MinorBodyGiantInfluenceAssessment, MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH } from './minor-body-giant-influence-assessment';
import { type Planet } from './planet';

/** Point-23.5 complete existing-minor-body x giant-planet influence matrix. */
export class MinorBodyGiantInfluenceCatalog {
  readonly giantPlanets:readonly Planet[];
  readonly assessments:readonly MinorBodyGiantInfluenceAssessment[];

  constructor(
    readonly resonanceCatalog:MinorBodyResonanceCatalog,
    giantPlanets:readonly Planet[],
    assessments:readonly MinorBodyGiantInfluenceAssessment[],
  ) {
    const expectedGiants=resonanceCatalog.planets.filter(planet=>planet.massEarth>=MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH);
    if(giantPlanets.length!==expectedGiants.length||giantPlanets.some((planet,index)=>planet!==expectedGiants[index])) {
      throw new RangeError('Point-23.5 giantPlanets must be the exact mass-qualified subset of point-23.4 planets in frozen order.');
    }
    this.giantPlanets=Object.freeze([...giantPlanets]);
    this.assessments=Object.freeze([...assessments]);
    validateMatrix(resonanceCatalog,this.giantPlanets,this.assessments);
  }

  get giantPlanetCount(){return this.giantPlanets.length;}
  get assessmentCount(){return this.assessments.length;}
  get dynamicallyRelevantCount(){return this.assessments.filter(a=>a.isDynamicallyRelevant).length;}
  get perturbationCandidateCount(){return this.assessments.filter(a=>a.regime===MinorBodyGiantInfluenceRegime.PERTURBATION_CANDIDATE).length;}
  get temporaryCaptureCandidateCount(){return this.assessments.filter(a=>a.regime===MinorBodyGiantInfluenceRegime.TEMPORARY_CAPTURE_CANDIDATE).length;}
  get ejectionCandidateCount(){return this.assessments.filter(a=>a.regime===MinorBodyGiantInfluenceRegime.EJECTION_CANDIDATE).length;}
  get unboundDeflectionCandidateCount(){return this.assessments.filter(a=>a.regime===MinorBodyGiantInfluenceRegime.UNBOUND_DEFLECTION_CANDIDATE).length;}
  get relevantAssessments(){return Object.freeze(this.assessments.filter(a=>a.isDynamicallyRelevant));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(a=>a.minorBodyProceduralId===proceduralId));}
}

function validateMatrix(
  resonanceCatalog:MinorBodyResonanceCatalog,
  giantPlanets:readonly Planet[],
  assessments:readonly MinorBodyGiantInfluenceAssessment[],
):void {
  const bodies=resonanceCatalog.orbitalCatalog.entries;
  if(assessments.length!==bodies.length*giantPlanets.length) {
    throw new RangeError('MinorBodyGiantInfluenceCatalog requires one assessment for every existing minor-body x giant-planet pair.');
  }
  let cursor=0;
  for(const body of bodies) {
    for(const planet of giantPlanets) {
      const resonance=resonanceCatalog.assessments.find(candidate=>candidate.minorBody===body&&candidate.targetPlanet===planet);
      const actual=assessments[cursor];
      if(resonance===undefined||actual.resonanceAssessment!==resonance||actual.targetGiantPlanet!==planet) {
        throw new RangeError('Point-23.5 matrix must preserve exact point-23.4 body/giant references and deterministic order.');
      }
      cursor+=1;
    }
  }
}
