import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { type MinorBodyImpactRiskAssessment } from './minor-body-impact-risk-assessment';
import { MinorBodyTemporalImpactProbabilityRegime, type MinorBodyTemporalImpactProbabilityRegimeValue } from './minor-body-temporal-impact-probability-regime';

const TOLERANCE=1e-12;

/**
 * Point-23.8 separates point-23.7 orbital geometry from a finite-horizon impact
 * probability estimate.
 *
 * Bound bodies use repeated node-passage opportunities and a Poisson cumulative
 * model. Hyperbolic visitors are one-shot passages, so their probability never
 * grows merely because the requested horizon is made longer.
 */
export class MinorBodyTemporalImpactProbabilityAssessment {
  constructor(
    readonly impactRiskAssessment:MinorBodyImpactRiskAssessment,
    readonly timeWindowYears:number,
    readonly isSinglePassage:boolean,
    readonly opportunityFrequencyPerYear:number|null,
    readonly expectedOpportunityCount:number,
    readonly hostPhaseCoincidenceProbability01:number,
    readonly localTargetPhaseCoincidenceProbability01:number,
    readonly impactProbabilityPerOpportunity01:number,
    readonly expectedImpactCount:number,
    readonly temporalImpactProbability01:number,
    readonly regime:MinorBodyTemporalImpactProbabilityRegimeValue,
  ) {
    assertPositive(timeWindowYears,'timeWindowYears');
    if(opportunityFrequencyPerYear!==null) assertPositive(opportunityFrequencyPerYear,'opportunityFrequencyPerYear');
    assertNonNegative(expectedOpportunityCount,'expectedOpportunityCount');
    assertIndex(hostPhaseCoincidenceProbability01,'hostPhaseCoincidenceProbability01');
    assertIndex(localTargetPhaseCoincidenceProbability01,'localTargetPhaseCoincidenceProbability01');
    assertIndex(impactProbabilityPerOpportunity01,'impactProbabilityPerOpportunity01');
    assertNonNegative(expectedImpactCount,'expectedImpactCount');
    assertIndex(temporalImpactProbability01,'temporalImpactProbability01');
    if(!MinorBodyTemporalImpactProbabilityRegime.values.includes(regime)) throw new RangeError('Unknown MinorBodyTemporalImpactProbabilityRegime.');

    const orbit=impactRiskAssessment.evaluatedOrbitalElements;
    if(isSinglePassage!==orbit.isHyperbolic) throw new RangeError('Point-23.8 single-passage mode must exactly match a hyperbolic outgoing orbit.');
    if(isSinglePassage) {
      if(opportunityFrequencyPerYear!==null) throw new RangeError('Single-passage visitors must not expose a repeating annual opportunity frequency.');
      if(Math.abs(expectedOpportunityCount-1)>TOLERANCE) throw new RangeError('Single-passage visitors must expose exactly one encounter opportunity.');
      if(Math.abs(expectedImpactCount-impactProbabilityPerOpportunity01)>TOLERANCE) throw new RangeError('Single-passage expected impact count must equal its one-pass impact probability.');
      if(Math.abs(temporalImpactProbability01-impactProbabilityPerOpportunity01)>TOLERANCE) throw new RangeError('Single-passage temporal probability must equal the one-pass probability.');
    } else {
      if(opportunityFrequencyPerYear===null) throw new RangeError('Bound temporal-impact assessments require a repeating opportunity frequency.');
      const expectedOpportunities=opportunityFrequencyPerYear*timeWindowYears;
      if(relativeError(expectedOpportunityCount,expectedOpportunities)>1e-9) throw new RangeError('Bound expectedOpportunityCount must equal frequency x time window.');
      const expectedImpacts=expectedOpportunityCount*impactProbabilityPerOpportunity01;
      if(relativeError(expectedImpactCount,expectedImpacts)>1e-9) throw new RangeError('Bound expectedImpactCount must equal opportunities x per-opportunity probability.');
      const expectedProbability=1-Math.exp(-expectedImpactCount);
      if(Math.abs(temporalImpactProbability01-expectedProbability)>1e-10) throw new RangeError('Bound temporal probability must use the point-23.8 Poisson cumulative model.');
    }

    const source=impactRiskAssessment;
    const exactPlanetCollision=source.targetKind===MinorBodyApproachTargetKind.PLANET&&source.directCollisionGeometryCandidate;
    const probabilisticGeometry=source.targetKind===MinorBodyApproachTargetKind.MOON
      ? source.riskCandidate
      : exactPlanetCollision;

    if(!source.riskCandidate) {
      if(impactProbabilityPerOpportunity01!==0||temporalImpactProbability01!==0||regime!==MinorBodyTemporalImpactProbabilityRegime.NONE) {
        throw new RangeError('A non-risk point-23.7 geometry must have zero point-23.8 temporal impact probability.');
      }
    } else if(!probabilisticGeometry) {
      if(impactProbabilityPerOpportunity01!==0||temporalImpactProbability01!==0||regime!==MinorBodyTemporalImpactProbabilityRegime.ORBITAL_RISK_ONLY) {
        throw new RangeError('A planet approach corridor without a physical collision corridor remains orbital risk only in point 23.8.');
      }
    } else if(isSinglePassage) {
      if(regime!==MinorBodyTemporalImpactProbabilityRegime.SINGLE_PASSAGE) throw new RangeError('Probabilistic hyperbolic passages must use SINGLE_PASSAGE.');
    } else if(regime!==regimeForProbability(temporalImpactProbability01)) {
      throw new RangeError('Bound point-23.8 probability regime must match the cumulative temporal probability.');
    }
  }

  get minorBody(){return this.impactRiskAssessment.minorBody;}
  get minorBodyProceduralId(){return this.impactRiskAssessment.minorBodyProceduralId;}
  get minorBodyDesignation(){return this.impactRiskAssessment.minorBodyDesignation;}
  get targetKind(){return this.impactRiskAssessment.targetKind;}
  get targetPlanet(){return this.impactRiskAssessment.targetPlanet;}
  get targetMoon(){return this.impactRiskAssessment.targetMoon;}
  get targetName(){return this.impactRiskAssessment.targetName;}
  get orbitalRiskCandidate(){return this.impactRiskAssessment.riskCandidate;}
  get orbitalRiskIndex01(){return this.impactRiskAssessment.orbitalRiskIndex01;}
  get hasNonZeroTemporalImpactProbability(){return this.temporalImpactProbability01>0;}
}

export function regimeForProbability(probability01:number):MinorBodyTemporalImpactProbabilityRegimeValue {
  assertIndex(probability01,'probability01');
  if(probability01<1e-8) return MinorBodyTemporalImpactProbabilityRegime.EXTREMELY_LOW;
  if(probability01<1e-6) return MinorBodyTemporalImpactProbabilityRegime.VERY_LOW;
  if(probability01<1e-4) return MinorBodyTemporalImpactProbabilityRegime.LOW;
  return MinorBodyTemporalImpactProbabilityRegime.MATERIAL;
}

function assertPositive(value:number,name:string):void {if(!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);}
function assertNonNegative(value:number,name:string):void {if(!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);}
function assertIndex(value:number,name:string):void {if(!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);}
function relativeError(actual:number,expected:number):number {return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}
