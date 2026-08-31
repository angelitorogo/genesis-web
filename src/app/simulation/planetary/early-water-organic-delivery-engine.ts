import { type MinorBodyGroundTruthObject } from '../../domain/planetary/minor-body-ground-truth-inventory';
import { MinorBodyKind, type MinorBodyKindValue } from '../../domain/planetary/minor-body-kind';
import { MinorBodyEarlyDeliveryAssessment, earlyDeliveryRegimeForRetainedFractionsV1 } from '../../domain/planetary/minor-body-early-delivery-assessment';
import { MinorBodyEarlyDeliveryCatalog } from '../../domain/planetary/minor-body-early-delivery-catalog';
import { MinorBodyEarlyDeliveryRegime } from '../../domain/planetary/minor-body-early-delivery-regime';
import { type MinorBodyImpactEffectsAssessment } from '../../domain/planetary/minor-body-impact-effects-assessment';
import { type MinorBodyImpactEffectsCatalog } from '../../domain/planetary/minor-body-impact-effects-catalog';
import { type RelevantAsteroid } from '../../domain/planetary/relevant-asteroid';
import { type RelevantCapturedExtrasolarObject } from '../../domain/planetary/relevant-captured-extrasolar-object';
import { type RelevantComet } from '../../domain/planetary/relevant-comet';
import { type RelevantInterstellarObject } from '../../domain/planetary/relevant-interstellar-object';
import { type RelevantTransNeptunianObject } from '../../domain/planetary/relevant-trans-neptunian-object';

export interface MinorBodyDeliveryCompositionV1 {
  readonly sourceWaterEquivalentFraction01:number;
  readonly sourceOrganicCarrierFractionProxy01:number;
  readonly sourceVolatileRichnessIndex01:number;
}

export interface MinorBodyPayloadRetentionV1 {
  readonly gravitationalRetentionIndex01:number;
  readonly waterRetentionEfficiency01:number;
  readonly organicCarrierRetentionEfficiency01:number;
}

/**
 * Point-23.11 deterministic early water/organic-carrier delivery projection.
 *
 * The engine consumes only frozen phase-22 composition plus the exact 23.8-23.10
 * impact chain. It derives no seeds/hashes/PRNG draws and never rewrites the
 * target's phase-20/21 water state. Expected delivered masses use point-23.8
 * expectedImpactCount, so a caller can evaluate an early-system time window
 * without pretending that the individual impacts have already been realized.
 *
 * sourceOrganicCarrierFractionProxy01 is explicitly a carrier-material proxy;
 * V1 does not invent amino-acid abundance, molecular speciation or biosignatures.
 */
export class EarlyWaterOrganicDeliveryEngine {
  private constructor() {}

  static generate(
    impactEffectsCatalog:MinorBodyImpactEffectsCatalog,
  ):MinorBodyEarlyDeliveryCatalog {
    return new MinorBodyEarlyDeliveryCatalog(
      impactEffectsCatalog,
      impactEffectsCatalog.assessments.map(assessmentV1),
    );
  }
}

function assessmentV1(source:MinorBodyImpactEffectsAssessment):MinorBodyEarlyDeliveryAssessment {
  if(!source.impactScenarioApplicable) {
    return new MinorBodyEarlyDeliveryAssessment(
      source,false,null,null,null,null,null,null,null,null,null,null,null,null,
      MinorBodyEarlyDeliveryRegime.NOT_APPLICABLE,
    );
  }

  const risk=source.impactRiskAssessment;
  const composition=minorBodyDeliveryCompositionV1(
    risk.minorBodyKind,
    risk.transition.minorBody.body,
  );
  const impactSpeed=requiredPositive(source.energyAssessment.impactSpeedKmPerSecond,'impactSpeedKmPerSecond');
  const escapeSpeed=requiredPositive(risk.targetEscapeVelocityKmPerSecond,'targetEscapeVelocityKmPerSecond');
  const severity=requiredIndex(source.targetResponseSeverityIndex01,'targetResponseSeverityIndex01');
  const disruption=requiredIndex(source.bulkDisruptionPotentialIndex01,'bulkDisruptionPotentialIndex01');
  const retention=impactPayloadRetentionV1(impactSpeed,escapeSpeed,severity,disruption);
  const retainedWaterFraction=composition.sourceWaterEquivalentFraction01*retention.waterRetentionEfficiency01;
  const retainedOrganicFraction=composition.sourceOrganicCarrierFractionProxy01*retention.organicCarrierRetentionEfficiency01;
  const impactorMass=requiredPositive(source.energyAssessment.impactorMassKilograms,'impactorMassKilograms');
  const conditionalWaterMass=impactorMass*retainedWaterFraction;
  const conditionalOrganicMass=impactorMass*retainedOrganicFraction;
  const expectedImpactCount=requiredNonNegative(source.temporalAssessment.expectedImpactCount,'expectedImpactCount');
  const expectedWaterMass=conditionalWaterMass*expectedImpactCount;
  const expectedOrganicMass=conditionalOrganicMass*expectedImpactCount;

  return new MinorBodyEarlyDeliveryAssessment(
    source,true,
    composition.sourceWaterEquivalentFraction01,
    composition.sourceOrganicCarrierFractionProxy01,
    composition.sourceVolatileRichnessIndex01,
    retention.gravitationalRetentionIndex01,
    retention.waterRetentionEfficiency01,
    retention.organicCarrierRetentionEfficiency01,
    retainedWaterFraction,
    retainedOrganicFraction,
    conditionalWaterMass,
    conditionalOrganicMass,
    expectedWaterMass,
    expectedOrganicMass,
    earlyDeliveryRegimeForRetainedFractionsV1(retainedWaterFraction,retainedOrganicFraction),
  );
}

export function minorBodyDeliveryCompositionV1(
  kind:MinorBodyKindValue,
  body:MinorBodyGroundTruthObject,
):MinorBodyDeliveryCompositionV1 {
  if(kind===MinorBodyKind.ASTEROID) {
    const taxonomy=(body as RelevantAsteroid).taxonomy;
    return composition(
      clamp01(taxonomy.iceFraction01+0.10*taxonomy.carbonaceousFraction01),
      clamp01(0.45*taxonomy.carbonaceousFraction01),
      clamp01(taxonomy.iceFraction01+0.35*taxonomy.carbonaceousFraction01),
    );
  }
  if(kind===MinorBodyKind.COMET) {
    const properties=(body as RelevantComet).nucleusProperties;
    return composition(
      clamp01(properties.iceFraction01*(0.65+0.25*properties.volatileRichnessIndex01)),
      clamp01(properties.dustFraction01*(0.20+0.45*properties.volatileRichnessIndex01)),
      properties.volatileRichnessIndex01,
    );
  }
  if(kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT) {
    const properties=(body as RelevantTransNeptunianObject).properties;
    return composition(
      clamp01(0.70*properties.iceFraction01),
      clamp01(0.12*properties.rockFraction01+0.06*properties.iceFraction01),
      properties.iceFraction01,
    );
  }
  if(kind===MinorBodyKind.INTERSTELLAR_OBJECT) {
    const properties=(body as RelevantInterstellarObject).properties;
    return composition(
      clamp01(0.50*properties.volatileFraction01),
      clamp01(0.15*properties.refractoryFraction01+0.05*properties.volatileFraction01),
      properties.volatileFraction01,
    );
  }
  if(kind===MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT) {
    const properties=(body as RelevantCapturedExtrasolarObject).properties;
    return composition(
      clamp01(0.50*properties.volatileFraction01),
      clamp01(0.15*properties.refractoryFraction01+0.05*properties.volatileFraction01),
      properties.volatileFraction01,
    );
  }
  throw new RangeError('Unsupported point-23.11 minor-body family.');
}

export function impactPayloadRetentionV1(
  impactSpeedKmPerSecond:number,
  targetEscapeVelocityKmPerSecond:number,
  targetResponseSeverityIndex01:number,
  bulkDisruptionPotentialIndex01:number,
):MinorBodyPayloadRetentionV1 {
  requiredPositive(impactSpeedKmPerSecond,'impactSpeedKmPerSecond');
  requiredPositive(targetEscapeVelocityKmPerSecond,'targetEscapeVelocityKmPerSecond');
  requiredIndex(targetResponseSeverityIndex01,'targetResponseSeverityIndex01');
  requiredIndex(bulkDisruptionPotentialIndex01,'bulkDisruptionPotentialIndex01');

  const gravitationalRetentionIndex01=clamp01(
    1.35*(targetEscapeVelocityKmPerSecond/impactSpeedKmPerSecond)**0.65,
  );
  const thermalShockIndex01=clamp01((impactSpeedKmPerSecond-5)/45);
  const bulkRetentionIndex01=clamp01(1-0.65*bulkDisruptionPotentialIndex01);
  const waterThermalSurvivalIndex01=clamp01(
    1-0.35*targetResponseSeverityIndex01-0.20*thermalShockIndex01,
  );
  const organicThermalSurvivalIndex01=clamp01(
    1-0.70*targetResponseSeverityIndex01-0.25*thermalShockIndex01,
  );

  return Object.freeze({
    gravitationalRetentionIndex01,
    waterRetentionEfficiency01:clamp01(gravitationalRetentionIndex01*waterThermalSurvivalIndex01*bulkRetentionIndex01),
    organicCarrierRetentionEfficiency01:clamp01(gravitationalRetentionIndex01*organicThermalSurvivalIndex01*bulkRetentionIndex01),
  });
}

function composition(water:number,organic:number,volatile:number):MinorBodyDeliveryCompositionV1 {
  requiredIndex(water,'sourceWaterEquivalentFraction01');
  requiredIndex(organic,'sourceOrganicCarrierFractionProxy01');
  requiredIndex(volatile,'sourceVolatileRichnessIndex01');
  return Object.freeze({
    sourceWaterEquivalentFraction01:water,
    sourceOrganicCarrierFractionProxy01:organic,
    sourceVolatileRichnessIndex01:volatile,
  });
}
function requiredPositive(value:number|null,name:string):number {if(value===null||!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be finite and > 0.`);return value;}
function requiredNonNegative(value:number,name:string):number {if(!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);return value;}
function requiredIndex(value:number|null,name:string):number {if(value===null||!Number.isFinite(value)||value<0||value>1) throw new RangeError(`${name} must be finite in [0, 1].`);return value;}
function clamp01(value:number):number{return Math.max(0,Math.min(1,value));}
