import { type MinorBodyResonanceAssessment } from './minor-body-resonance-assessment';
import { MinorBodyGiantInfluenceRegime, type MinorBodyGiantInfluenceRegimeValue } from './minor-body-giant-influence-regime';
import { type Planet } from './planet';

export const MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH=10;
const TOLERANCE=1e-12;

/**
 * Point-23.5 immutable influence diagnosis for one minor body against one
 * dynamically significant giant planet.
 *
 * Capture/ejection values are potentials only. No osculating element is
 * changed here; point 23.6 owns the concrete close-encounter transition.
 */
export class MinorBodyGiantInfluenceAssessment {
  constructor(
    readonly resonanceAssessment:MinorBodyResonanceAssessment,
    readonly targetGiantPlanet:Planet,
    readonly planetEscapeVelocityKmPerSecond:number,
    readonly planetOrbitalVelocityKmPerSecond:number,
    readonly hillEscapeVelocityKmPerSecond:number,
    readonly safronovNumber:number,
    readonly scatteringPowerIndex01:number,
    readonly interactionGeometryIndex01:number,
    readonly perturbationPotentialIndex01:number,
    readonly temporaryCapturePotentialIndex01:number,
    readonly ejectionPotentialIndex01:number,
    readonly regime:MinorBodyGiantInfluenceRegimeValue,
  ) {
    if(resonanceAssessment.targetPlanet!==targetGiantPlanet) {
      throw new RangeError('Point-23.5 assessment must retain the exact point-23.4 target Planet reference.');
    }
    if(!Number.isFinite(targetGiantPlanet.massEarth)||targetGiantPlanet.massEarth<MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH) {
      throw new RangeError(`Point-23.5 target planets must have at least ${MINOR_BODY_V1_GIANT_PERTURBER_MIN_MASS_EARTH} Earth masses.`);
    }
    assertPositive(planetEscapeVelocityKmPerSecond,'planetEscapeVelocityKmPerSecond');
    assertPositive(planetOrbitalVelocityKmPerSecond,'planetOrbitalVelocityKmPerSecond');
    assertPositive(hillEscapeVelocityKmPerSecond,'hillEscapeVelocityKmPerSecond');
    assertNonNegative(safronovNumber,'safronovNumber');
    assertIndex(scatteringPowerIndex01,'scatteringPowerIndex01');
    assertIndex(interactionGeometryIndex01,'interactionGeometryIndex01');
    assertIndex(perturbationPotentialIndex01,'perturbationPotentialIndex01');
    assertIndex(temporaryCapturePotentialIndex01,'temporaryCapturePotentialIndex01');
    assertIndex(ejectionPotentialIndex01,'ejectionPotentialIndex01');
    if(!MinorBodyGiantInfluenceRegime.values.includes(regime)) throw new RangeError('Unknown MinorBodyGiantInfluenceRegime.');

    const bound=this.minorBody.orbitalElements.isBound;
    if(!bound && ejectionPotentialIndex01>TOLERANCE) {
      throw new RangeError('Already-unbound minor bodies cannot carry an ejection potential.');
    }
    if(!bound && regime===MinorBodyGiantInfluenceRegime.EJECTION_CANDIDATE) {
      throw new RangeError('Already-unbound minor bodies cannot be classified as ejection candidates.');
    }
    if(bound && regime===MinorBodyGiantInfluenceRegime.UNBOUND_DEFLECTION_CANDIDATE) {
      throw new RangeError('Bound minor bodies cannot be classified as unbound deflection candidates.');
    }

    const expected=expectedRegimeV1(
      bound,
      interactionGeometryIndex01,
      perturbationPotentialIndex01,
      temporaryCapturePotentialIndex01,
      ejectionPotentialIndex01,
    );
    if(regime!==expected) throw new RangeError('Point-23.5 regime must match the frozen potential thresholds.');
  }

  get minorBody(){return this.resonanceAssessment.minorBody;}
  get minorBodyKind(){return this.resonanceAssessment.minorBodyKind;}
  get minorBodyProceduralId(){return this.resonanceAssessment.minorBodyProceduralId;}
  get targetPlanetOrdinal(){return this.targetGiantPlanet.planetOrdinal;}
  get isBoundMinorBody(){return this.minorBody.orbitalElements.isBound;}
  get isDynamicallyRelevant(){return this.regime!==MinorBodyGiantInfluenceRegime.BACKGROUND;}
}

export function minorBodyGiantInfluenceRegimeV1(
  bound:boolean,
  interactionGeometryIndex01:number,
  perturbationPotentialIndex01:number,
  temporaryCapturePotentialIndex01:number,
  ejectionPotentialIndex01:number,
):MinorBodyGiantInfluenceRegimeValue {
  assertIndex(interactionGeometryIndex01,'interactionGeometryIndex01');
  assertIndex(perturbationPotentialIndex01,'perturbationPotentialIndex01');
  assertIndex(temporaryCapturePotentialIndex01,'temporaryCapturePotentialIndex01');
  assertIndex(ejectionPotentialIndex01,'ejectionPotentialIndex01');
  return expectedRegimeV1(bound,interactionGeometryIndex01,perturbationPotentialIndex01,temporaryCapturePotentialIndex01,ejectionPotentialIndex01);
}

function expectedRegimeV1(
  bound:boolean,
  interaction:number,
  perturbation:number,
  capture:number,
  ejection:number,
):MinorBodyGiantInfluenceRegimeValue {
  if(!bound) {
    if(capture>=0.55) return MinorBodyGiantInfluenceRegime.TEMPORARY_CAPTURE_CANDIDATE;
    if(interaction>=0.35||perturbation>=0.30) return MinorBodyGiantInfluenceRegime.UNBOUND_DEFLECTION_CANDIDATE;
    return MinorBodyGiantInfluenceRegime.BACKGROUND;
  }
  if(ejection>=0.58 && ejection>=capture) return MinorBodyGiantInfluenceRegime.EJECTION_CANDIDATE;
  if(capture>=0.58) return MinorBodyGiantInfluenceRegime.TEMPORARY_CAPTURE_CANDIDATE;
  if(perturbation>=0.24) return MinorBodyGiantInfluenceRegime.PERTURBATION_CANDIDATE;
  return MinorBodyGiantInfluenceRegime.BACKGROUND;
}

function assertPositive(value:number,name:string):void {if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);}
function assertNonNegative(value:number,name:string):void {if(!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
