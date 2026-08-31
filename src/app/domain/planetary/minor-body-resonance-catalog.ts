import { type MinorBodyOrbitalElementsCatalog } from './minor-body-orbital-elements-catalog';
import { type MinorBodyOrbitProximityCatalog } from './minor-body-orbit-proximity-catalog';
import { type MinorBodyResonanceAssessment } from './minor-body-resonance-assessment';
import { type Planet } from './planet';

/** Point-23.4 complete minor-body x planet resonance/zone matrix. */
export class MinorBodyResonanceCatalog {
  readonly planets:readonly Planet[];
  readonly assessments:readonly MinorBodyResonanceAssessment[];
  constructor(
    readonly orbitalCatalog:MinorBodyOrbitalElementsCatalog,
    readonly proximityCatalog:MinorBodyOrbitProximityCatalog,
    planets:readonly Planet[],
    assessments:readonly MinorBodyResonanceAssessment[],
  ) {
    if(proximityCatalog.orbitalCatalog!==orbitalCatalog) throw new RangeError('Point-23.4 proximityCatalog must belong to the exact supplied orbitalCatalog.');
    if(planets.length!==proximityCatalog.planets.length || planets.some((planet,index)=>planet!==proximityCatalog.planets[index])) throw new RangeError('Point-23.4 planets must preserve the exact point-23.3 planet target list.');
    this.planets=Object.freeze([...planets]);
    this.assessments=Object.freeze([...assessments]);
    validateMatrix(orbitalCatalog,this.planets,proximityCatalog,this.assessments);
  }
  get assessmentCount(){return this.assessments.length;}
  get resonanceCandidateCount(){return this.assessments.filter(a=>a.resonanceCandidate).length;}
  get chaoticZoneCount(){return this.assessments.filter(a=>a.insideChaoticZone).length;}
  get chaoticResonantOverlapCount(){return this.assessments.filter(a=>a.insideChaoticZone&&a.resonanceCandidate).length;}
  get dynamicallyFlaggedCount(){return this.assessments.filter(a=>a.isDynamicallyFlagged).length;}
  get relevantAssessments(){return Object.freeze(this.assessments.filter(a=>a.isDynamicallyFlagged));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(a=>a.minorBodyProceduralId===proceduralId));}
}
function validateMatrix(orbitalCatalog:MinorBodyOrbitalElementsCatalog,planets:readonly Planet[],proximityCatalog:MinorBodyOrbitProximityCatalog,assessments:readonly MinorBodyResonanceAssessment[]):void {
  if(assessments.length!==orbitalCatalog.existingObjectCount*planets.length) throw new RangeError('MinorBodyResonanceCatalog requires one assessment for every minor-body x planet pair.');
  let cursor=0;
  for(const body of orbitalCatalog.entries){
    for(const planet of planets){
      const actual=assessments[cursor];
      const proximity=proximityCatalog.assessments.find(candidate=>candidate.minorBody===body&&candidate.targetPlanet===planet&&candidate.targetMoon===null);
      if(proximity===undefined||actual.minorBody!==body||actual.targetPlanet!==planet||actual.proximityAssessment!==proximity) throw new RangeError('Point-23.4 assessment matrix must preserve exact body/planet/proximity references and deterministic order.');
      cursor+=1;
    }
  }
}
