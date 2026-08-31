import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { type MinorBodyImpactRiskAssessment } from '../../domain/planetary/minor-body-impact-risk-assessment';
import { type MinorBodyImpactRiskCatalog } from '../../domain/planetary/minor-body-impact-risk-catalog';
import { MinorBodyTemporalImpactProbabilityAssessment, regimeForProbability } from '../../domain/planetary/minor-body-temporal-impact-probability-assessment';
import { MinorBodyTemporalImpactProbabilityCatalog } from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';
import { MinorBodyTemporalImpactProbabilityRegime } from '../../domain/planetary/minor-body-temporal-impact-probability-regime';

const AU_KILOMETERS=149_597_870.7;

/**
 * Point-23.8 finite-horizon impact probability estimator.
 *
 * Orbital risk from 23.7 is intentionally left untouched. Bound bodies are
 * treated as repeated node-passage opportunities and accumulated with a Poisson
 * model. Hyperbolic visitors receive exactly one passage opportunity. No impact
 * event is materialized here; point 23.9+ remain responsible for impact physics.
 */
export class TemporalImpactProbabilityEngine {
  private constructor() {}

  static generate(
    impactRiskCatalog:MinorBodyImpactRiskCatalog,
    timeWindowYears:number,
  ):MinorBodyTemporalImpactProbabilityCatalog {
    if(!Number.isFinite(timeWindowYears)||timeWindowYears<=0) throw new RangeError('Point-23.8 timeWindowYears must be finite and > 0.');
    const assessments=impactRiskCatalog.assessments.map(source=>assessmentV1(source,timeWindowYears));
    return new MinorBodyTemporalImpactProbabilityCatalog(impactRiskCatalog,timeWindowYears,assessments);
  }
}

function assessmentV1(source:MinorBodyImpactRiskAssessment,timeWindowYears:number):MinorBodyTemporalImpactProbabilityAssessment {
  const orbit=source.evaluatedOrbitalElements;
  const singlePassage=orbit.isHyperbolic;
  const frequency=singlePassage?null:repeatingOpportunityFrequencyPerYearV1(source);
  const opportunities=singlePassage?1:requiredFrequency(frequency)*timeWindowYears;
  const phases=phaseCoincidenceV1(source);
  const probabilisticGeometry=source.targetKind===MinorBodyApproachTargetKind.MOON
    ? source.riskCandidate
    : source.directCollisionGeometryCandidate;
  const perOpportunity=source.riskCandidate&&probabilisticGeometry
    ? clamp01(phases.host*phases.local)
    : 0;
  const expectedImpacts=opportunities*perOpportunity;
  const probability=singlePassage
    ? perOpportunity
    : 1-Math.exp(-expectedImpacts);
  const regime=!source.riskCandidate
    ? MinorBodyTemporalImpactProbabilityRegime.NONE
    : !probabilisticGeometry
      ? MinorBodyTemporalImpactProbabilityRegime.ORBITAL_RISK_ONLY
      : singlePassage
        ? MinorBodyTemporalImpactProbabilityRegime.SINGLE_PASSAGE
        : regimeForProbability(probability);

  return new MinorBodyTemporalImpactProbabilityAssessment(
    source,
    timeWindowYears,
    singlePassage,
    frequency,
    opportunities,
    phases.host,
    phases.local,
    perOpportunity,
    expectedImpacts,
    probability,
    regime,
  );
}

function repeatingOpportunityFrequencyPerYearV1(source:MinorBodyImpactRiskAssessment):number {
  const period=source.evaluatedOrbitalElements.orbitalPeriodYears;
  if(period===null||!Number.isFinite(period)||period<=0) throw new RangeError('Point-23.8 bound bodies require their frozen point-23.2 orbital period.');
  // Two geometrically relevant node passages per complete bound orbit.
  return 2/period;
}

function phaseCoincidenceV1(source:MinorBodyImpactRiskAssessment):{readonly host:number;readonly local:number} {
  if(!source.riskCandidate) return Object.freeze({host:0,local:0});
  const planetAxis=source.targetPlanet.orbit.semiMajorAxisAu;
  if(!Number.isFinite(planetAxis)||planetAxis<=0) throw new RangeError('Point-23.8 target planet requires a positive semi-major axis.');

  if(source.targetKind===MinorBodyApproachTargetKind.PLANET) {
    if(!source.directCollisionGeometryCandidate) return Object.freeze({host:0,local:0});
    // Fraction of target orbital longitude covered by the focused impact radius.
    return Object.freeze({
      host:clamp01(source.effectiveImpactRadiusAu/(Math.PI*planetAxis)),
      local:1,
    });
  }

  const moon=source.targetMoon;
  if(moon===null) throw new RangeError('Point-23.8 moon risk requires the frozen relevant moon target.');
  const moonAxisAu=moon.orbit.semiMajorAxisKilometers/AU_KILOMETERS;
  if(!Number.isFinite(moonAxisAu)||moonAxisAu<=0) throw new RangeError('Point-23.8 relevant moon requires a positive planetocentric semi-major axis.');

  // First the host planet/moon system must be at the heliocentric crossing; then
  // the moon itself must occupy the local collision arc around its orbit.
  return Object.freeze({
    host:clamp01(source.targetCorridorRadiusAu/(Math.PI*planetAxis)),
    local:clamp01(source.effectiveImpactRadiusAu/(Math.PI*moonAxisAu)),
  });
}

function requiredFrequency(value:number|null):number {
  if(value===null) throw new RangeError('Point-23.8 repeating opportunity frequency is missing.');
  return value;
}
function clamp01(value:number):number{return Math.max(0,Math.min(1,value));}
