import { MinorBodyCloseEncounterOutcomeRegime } from './minor-body-close-encounter-outcome-regime';
import { type MinorBodyCloseEncounterAssessment } from './minor-body-close-encounter-assessment';
import { type MinorBodyGiantInfluenceCatalog } from './minor-body-giant-influence-catalog';
import { type MinorBodyOrbitalTransition } from './minor-body-orbital-transition';

/** Point-23.6 complete approach-candidate resolution plus one final transition per existing body. */
export class MinorBodyCloseEncounterCatalog {
  readonly assessments:readonly MinorBodyCloseEncounterAssessment[];
  readonly transitions:readonly MinorBodyOrbitalTransition[];

  constructor(
    readonly giantInfluenceCatalog:MinorBodyGiantInfluenceCatalog,
    assessments:readonly MinorBodyCloseEncounterAssessment[],
    transitions:readonly MinorBodyOrbitalTransition[],
  ) {
    this.assessments=Object.freeze([...assessments]);
    this.transitions=Object.freeze([...transitions]);
    validateCatalog(giantInfluenceCatalog,this.assessments,this.transitions);
  }

  get proximityCatalog(){return this.giantInfluenceCatalog.resonanceCatalog.proximityCatalog;}
  get orbitalCatalog(){return this.giantInfluenceCatalog.resonanceCatalog.orbitalCatalog;}
  get approachCandidateCount(){return this.assessments.length;}
  get temporalCoincidenceCandidateCount(){return this.assessments.filter(a=>a.temporalCoincidenceCandidate).length;}
  get encounterCount(){return this.assessments.filter(a=>a.encounterOccurred).length;}
  get orbitalChangeCount(){return this.transitions.filter(t=>t.orbitalChangeOccurred).length;}
  get boundPerturbationCount(){return this.assessments.filter(a=>a.outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.BOUND_PERTURBATION).length;}
  get temporaryCaptureCount(){return this.assessments.filter(a=>a.outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.TEMPORARY_CAPTURE).length;}
  get ejectionCount(){return this.assessments.filter(a=>a.outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.EJECTION).length;}
  get unboundDeflectionCount(){return this.assessments.filter(a=>a.outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.UNBOUND_DEFLECTION).length;}
  get resolvedEncounters(){return Object.freeze(this.assessments.filter(a=>a.encounterOccurred));}
  forMinorBody(proceduralId:string){return Object.freeze(this.assessments.filter(a=>a.minorBodyProceduralId===proceduralId));}
  transitionFor(proceduralId:string){return this.transitions.find(t=>t.minorBodyProceduralId===proceduralId)??null;}
}

function validateCatalog(
  giantCatalog:MinorBodyGiantInfluenceCatalog,
  assessments:readonly MinorBodyCloseEncounterAssessment[],
  transitions:readonly MinorBodyOrbitalTransition[],
):void {
  const proximity=giantCatalog.resonanceCatalog.proximityCatalog;
  const candidates=proximity.assessments.filter(item=>item.approachPossible);
  if(assessments.length!==candidates.length) throw new RangeError('MinorBodyCloseEncounterCatalog requires one assessment for every point-23.3 approachPossible candidate.');
  for(let index=0;index<candidates.length;index+=1) {
    if(assessments[index].proximityAssessment!==candidates[index]) throw new RangeError('Point-23.6 assessment order must preserve the exact point-23.3 approach-candidate order.');
  }
  const bodies=giantCatalog.resonanceCatalog.orbitalCatalog.entries;
  if(transitions.length!==bodies.length) throw new RangeError('Point-23.6 requires exactly one final orbital transition for every existing minor body.');
  for(let index=0;index<bodies.length;index+=1) {
    if(transitions[index].minorBody!==bodies[index]) throw new RangeError('Point-23.6 transitions must preserve exact point-23.2 body order/references.');
    const winners=assessments.filter(a=>a.minorBody===bodies[index]&&a.encounterOccurred);
    if(winners.length>1) throw new RangeError('Point-23.6 V1 permits at most one resolved close encounter per minor body snapshot.');
    if(winners.length===0 && transitions[index].encounterAssessment!==null) throw new RangeError('Transition cannot reference a missing resolved encounter.');
    if(winners.length===1 && transitions[index].encounterAssessment!==winners[0]) throw new RangeError('Transition must reference the unique resolved encounter for its minor body.');
  }
}
