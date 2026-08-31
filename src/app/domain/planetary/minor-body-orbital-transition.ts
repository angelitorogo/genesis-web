import { type MinorBodyCloseEncounterAssessment } from './minor-body-close-encounter-assessment';
import { type MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { type MinorBodyOrbitalElementsCatalogEntry } from './minor-body-orbital-elements-catalog';

/** Point-23.6 one-to-one pre/post orbit record for an existing minor body. */
export class MinorBodyOrbitalTransition {
  constructor(
    readonly minorBody:MinorBodyOrbitalElementsCatalogEntry,
    readonly incomingOrbitalElements:MinorBodyOrbitalElements,
    readonly outgoingOrbitalElements:MinorBodyOrbitalElements,
    readonly encounterAssessment:MinorBodyCloseEncounterAssessment|null,
  ) {
    if(minorBody.orbitalElements!==incomingOrbitalElements) {
      throw new RangeError('MinorBodyOrbitalTransition must begin from the exact point-23.2 incoming orbit reference.');
    }
    if(incomingOrbitalElements.kind!==outgoingOrbitalElements.kind ||
      incomingOrbitalElements.proceduralId!==outgoingOrbitalElements.proceduralId ||
      incomingOrbitalElements.localDesignation!==outgoingOrbitalElements.localDesignation ||
      incomingOrbitalElements.gravitatingMassSolar!==outgoingOrbitalElements.gravitatingMassSolar) {
      throw new RangeError('MinorBodyOrbitalTransition cannot change the physical minor-body identity or host mass.');
    }
    if(encounterAssessment===null) {
      if(outgoingOrbitalElements!==incomingOrbitalElements) throw new RangeError('Bodies without a resolved encounter must retain the exact incoming orbit reference.');
    } else if(!encounterAssessment.encounterOccurred || encounterAssessment.minorBody!==minorBody || encounterAssessment.outgoingOrbitalElements!==outgoingOrbitalElements) {
      throw new RangeError('Resolved orbital transitions must retain the exact winning point-23.6 encounter assessment and outgoing orbit.');
    }
  }
  get orbitalChangeOccurred(){return this.outgoingOrbitalElements!==this.incomingOrbitalElements;}
  get minorBodyProceduralId(){return this.incomingOrbitalElements.proceduralId;}
}
