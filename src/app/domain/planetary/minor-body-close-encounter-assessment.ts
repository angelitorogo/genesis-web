import { type MinorBodyGiantInfluenceAssessment } from './minor-body-giant-influence-assessment';
import { MinorBodyCloseEncounterOutcomeRegime, type MinorBodyCloseEncounterOutcomeRegimeValue } from './minor-body-close-encounter-outcome-regime';
import { type MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { type MinorBodyOrbitProximityAssessment } from './minor-body-orbit-proximity-assessment';

const TOLERANCE=1e-12;

/**
 * Point-23.6 temporal resolution for one point-23.3 approach corridor.
 *
 * `encounterOccurred` is deliberately stronger than `approachPossible`: it says
 * this candidate won the deterministic V1 phase/geometry resolution for its
 * minor body. Impacts are excluded here and remain owned by points 23.7+.
 */
export class MinorBodyCloseEncounterAssessment {
  constructor(
    readonly proximityAssessment:MinorBodyOrbitProximityAssessment,
    readonly giantInfluenceAssessment:MinorBodyGiantInfluenceAssessment|null,
    readonly temporalOpportunitySample01:number,
    readonly encounterLikelihood01:number,
    readonly temporalCoincidenceCandidate:boolean,
    readonly encounterOccurred:boolean,
    readonly targetInfluenceRadiusAu:number,
    readonly closestApproachAu:number|null,
    readonly relativeSpeedKmPerSecond:number|null,
    readonly encounterStrengthIndex01:number,
    readonly deltaSpecificOrbitalEnergyAu2PerYear2:number,
    readonly outcomeRegime:MinorBodyCloseEncounterOutcomeRegimeValue,
    readonly outgoingOrbitalElements:MinorBodyOrbitalElements,
  ) {
    if(!proximityAssessment.approachPossible) {
      throw new RangeError('Point-23.6 assessments require a point-23.3 approachPossible corridor.');
    }
    if(giantInfluenceAssessment!==null) {
      if(proximityAssessment.targetMoon!==null ||
        giantInfluenceAssessment.minorBody!==proximityAssessment.minorBody ||
        giantInfluenceAssessment.targetGiantPlanet!==proximityAssessment.targetPlanet) {
        throw new RangeError('Point-23.6 giant influence must belong to the exact minor-body/planet proximity target.');
      }
    }
    assertIndex(temporalOpportunitySample01,'temporalOpportunitySample01');
    assertProbability(encounterLikelihood01,'encounterLikelihood01');
    const expectedTemporal=temporalOpportunitySample01<encounterLikelihood01;
    if(temporalCoincidenceCandidate!==expectedTemporal) {
      throw new RangeError('temporalCoincidenceCandidate must reflect sample < encounterLikelihood01.');
    }
    if(encounterOccurred&&!temporalCoincidenceCandidate) {
      throw new RangeError('A resolved encounter must first qualify as a temporal coincidence candidate.');
    }
    assertPositive(targetInfluenceRadiusAu,'targetInfluenceRadiusAu');
    assertIndex(encounterStrengthIndex01,'encounterStrengthIndex01');
    if(!Number.isFinite(deltaSpecificOrbitalEnergyAu2PerYear2)) {
      throw new RangeError('deltaSpecificOrbitalEnergyAu2PerYear2 must be finite.');
    }
    if(!MinorBodyCloseEncounterOutcomeRegime.values.includes(outcomeRegime)) {
      throw new RangeError('Unknown MinorBodyCloseEncounterOutcomeRegime.');
    }

    const incoming=this.incomingOrbitalElements;
    assertSameIdentity(incoming,outgoingOrbitalElements);

    if(!encounterOccurred) {
      if(closestApproachAu!==null || relativeSpeedKmPerSecond!==null ||
        encounterStrengthIndex01>TOLERANCE || Math.abs(deltaSpecificOrbitalEnergyAu2PerYear2)>TOLERANCE ||
        outcomeRegime!==MinorBodyCloseEncounterOutcomeRegime.NO_ENCOUNTER || outgoingOrbitalElements!==incoming) {
        throw new RangeError('Unresolved point-23.6 candidates must preserve the exact incoming orbit and carry no encounter diagnostics.');
      }
      return;
    }

    assertPositive(closestApproachAu as number,'closestApproachAu');
    assertPositive(relativeSpeedKmPerSecond as number,'relativeSpeedKmPerSecond');
    if((closestApproachAu as number)>targetInfluenceRadiusAu+TOLERANCE) {
      throw new RangeError('Resolved close encounters must occur inside the target influence radius.');
    }
    if(encounterStrengthIndex01<=0 || outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.NO_ENCOUNTER || outgoingOrbitalElements===incoming) {
      throw new RangeError('Resolved point-23.6 encounters require a non-zero strength, non-NO_ENCOUNTER outcome and a new outgoing orbit.');
    }
    const expectedDelta=outgoingOrbitalElements.specificOrbitalEnergyAu2PerYear2-incoming.specificOrbitalEnergyAu2PerYear2;
    if(Math.abs(expectedDelta-deltaSpecificOrbitalEnergyAu2PerYear2)>Math.max(TOLERANCE,Math.abs(expectedDelta)*1e-9)) {
      throw new RangeError('deltaSpecificOrbitalEnergyAu2PerYear2 must match outgoing minus incoming orbital energy.');
    }

    if(outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.EJECTION) {
      if(!incoming.isBound||outgoingOrbitalElements.isBound) throw new RangeError('EJECTION must transition a bound orbit to an unbound hyperbola.');
    } else if(outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.BOUND_PERTURBATION) {
      if(!incoming.isBound||!outgoingOrbitalElements.isBound) throw new RangeError('BOUND_PERTURBATION must preserve bound status.');
    } else if(outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.UNBOUND_DEFLECTION) {
      if(incoming.isBound||outgoingOrbitalElements.isBound) throw new RangeError('UNBOUND_DEFLECTION must preserve unbound status.');
    } else if(outcomeRegime===MinorBodyCloseEncounterOutcomeRegime.TEMPORARY_CAPTURE && incoming.isBound!==outgoingOrbitalElements.isBound) {
      throw new RangeError('TEMPORARY_CAPTURE is an encounter episode; the post-release star-centric orbit must preserve the incoming bound/unbound class in V1.');
    }
  }

  get minorBody(){return this.proximityAssessment.minorBody;}
  get minorBodyKind(){return this.proximityAssessment.minorBodyKind;}
  get minorBodyProceduralId(){return this.proximityAssessment.minorBodyProceduralId;}
  get targetKind(){return this.proximityAssessment.targetKind;}
  get targetPlanet(){return this.proximityAssessment.targetPlanet;}
  get targetMoon(){return this.proximityAssessment.targetMoon;}
  get incomingOrbitalElements(){return this.proximityAssessment.minorBody.orbitalElements;}
  get orbitalChangeOccurred(){return this.encounterOccurred&&this.outgoingOrbitalElements!==this.incomingOrbitalElements;}
}

function assertSameIdentity(left:MinorBodyOrbitalElements,right:MinorBodyOrbitalElements):void {
  if(left.kind!==right.kind||left.proceduralId!==right.proceduralId||left.localDesignation!==right.localDesignation||left.gravitatingMassSolar!==right.gravitatingMassSolar) {
    throw new RangeError('Point-23.6 outgoing orbits must preserve the exact minor-body identity and gravitating host mass.');
  }
}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function assertProbability(value:number,name:string):void {if(!Number.isFinite(value)||value<=0||value>1) throw new RangeError(`${name} must be finite in (0, 1].`);}
function assertPositive(value:number,name:string):void {if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);}
