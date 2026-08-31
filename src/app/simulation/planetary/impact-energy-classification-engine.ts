import { type MinorBodyGroundTruthObject } from '../../domain/planetary/minor-body-ground-truth-inventory';
import { MinorBodyImpactConsequenceRegime } from '../../domain/planetary/minor-body-impact-consequence-regime';
import {
  impactConsequenceRegimeForV1,
  impactEnergyRegimeForJoules,
  MinorBodyImpactEnergyAssessment,
} from '../../domain/planetary/minor-body-impact-energy-assessment';
import { MinorBodyImpactEnergyCatalog } from '../../domain/planetary/minor-body-impact-energy-catalog';
import { MinorBodyImpactEnergyRegime } from '../../domain/planetary/minor-body-impact-energy-regime';
import { MinorBodyKind, type MinorBodyKindValue } from '../../domain/planetary/minor-body-kind';
import { type MinorBodyTemporalImpactProbabilityAssessment } from '../../domain/planetary/minor-body-temporal-impact-probability-assessment';
import { type MinorBodyTemporalImpactProbabilityCatalog } from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';
import { type RelevantAsteroid } from '../../domain/planetary/relevant-asteroid';
import { type RelevantCapturedExtrasolarObject } from '../../domain/planetary/relevant-captured-extrasolar-object';
import { type RelevantComet } from '../../domain/planetary/relevant-comet';
import { type RelevantInterstellarObject } from '../../domain/planetary/relevant-interstellar-object';
import { type RelevantTransNeptunianObject } from '../../domain/planetary/relevant-trans-neptunian-object';

const AU_METERS=149_597_870_700;
const GRAVITATIONAL_CONSTANT=6.67430e-11;
const TNT_MEGATON_JOULES=4.184e15;

interface MinorBodyPhysicalV1 {
  readonly diameterKilometers:number;
  readonly bulkDensityGramsPerCubicCentimeter:number;
}

/**
 * Point-23.9 conditional impact-energy/consequence classifier.
 *
 * The engine consumes the exact point-23.8 matrix. It never changes the temporal
 * probability and never materializes an impact event. For non-zero probability
 * pairs it derives an equivalent-volume impactor mass from frozen phase-22 size/
 * density, combines point-23.7 relative speed with target escape speed, and
 * classifies the conditional kinetic energy. Point 23.10 remains the owner of
 * target-specific atmosphere/geology/water consequences.
 */
export class ImpactEnergyClassificationEngine {
  private constructor() {}

  static generate(
    temporalCatalog:MinorBodyTemporalImpactProbabilityCatalog,
  ):MinorBodyImpactEnergyCatalog {
    return new MinorBodyImpactEnergyCatalog(
      temporalCatalog,
      temporalCatalog.assessments.map(assessmentV1),
    );
  }
}

function assessmentV1(source:MinorBodyTemporalImpactProbabilityAssessment):MinorBodyImpactEnergyAssessment {
  if(!source.hasNonZeroTemporalImpactProbability) {
    return new MinorBodyImpactEnergyAssessment(
      source,false,null,null,null,null,null,null,null,null,null,null,
      MinorBodyImpactEnergyRegime.NOT_APPLICABLE,
      MinorBodyImpactConsequenceRegime.NOT_APPLICABLE,
    );
  }

  const risk=source.impactRiskAssessment;
  const physical=minorBodyPhysicalV1(risk.minorBodyKind,risk.transition.minorBody.body);
  const impactorMass=equivalentSphereMassKilogramsV1(physical.diameterKilometers,physical.bulkDensityGramsPerCubicCentimeter);
  const preImpactSpeed=risk.characteristicRelativeSpeedKmPerSecond;
  const impactSpeed=Math.sqrt(preImpactSpeed**2+risk.targetEscapeVelocityKmPerSecond**2);
  const energy=0.5*impactorMass*(impactSpeed*1000)**2;
  const tnt=energy/TNT_MEGATON_JOULES;

  const targetRadiusMeters=risk.targetPhysicalRadiusAu*AU_METERS;
  const targetEscapeMetersPerSecond=risk.targetEscapeVelocityKmPerSecond*1000;
  const targetMass=targetEscapeMetersPerSecond**2*targetRadiusMeters/(2*GRAVITATIONAL_CONSTANT);
  const bindingEnergy=3*GRAVITATIONAL_CONSTANT*targetMass**2/(5*targetRadiusMeters);
  const bindingFraction=energy/bindingEnergy;

  return new MinorBodyImpactEnergyAssessment(
    source,true,
    physical.diameterKilometers,
    physical.bulkDensityGramsPerCubicCentimeter,
    impactorMass,
    preImpactSpeed,
    impactSpeed,
    energy,
    tnt,
    targetMass,
    bindingEnergy,
    bindingFraction,
    impactEnergyRegimeForJoules(energy),
    impactConsequenceRegimeForV1(energy,bindingFraction),
  );
}

function minorBodyPhysicalV1(kind:MinorBodyKindValue,body:MinorBodyGroundTruthObject):MinorBodyPhysicalV1 {
  if(kind===MinorBodyKind.ASTEROID) {
    const asteroid=body as RelevantAsteroid;
    return physical(asteroid.diameterKilometers,asteroid.taxonomy.bulkDensityGramsPerCubicCentimeter);
  }
  if(kind===MinorBodyKind.COMET) {
    const comet=body as RelevantComet;
    return physical(comet.diameterKilometers,comet.nucleusProperties.bulkDensityGramsPerCubicCentimeter);
  }
  if(kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT) {
    const tno=body as RelevantTransNeptunianObject;
    return physical(tno.diameterKilometers,tno.properties.bulkDensityGramsPerCubicCentimeter);
  }
  if(kind===MinorBodyKind.INTERSTELLAR_OBJECT) {
    const visitor=body as RelevantInterstellarObject;
    return physical(visitor.diameterKilometers,visitor.properties.bulkDensityGramsPerCubicCentimeter);
  }
  if(kind===MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT) {
    const captured=body as RelevantCapturedExtrasolarObject;
    return physical(captured.diameterKilometers,captured.properties.bulkDensityGramsPerCubicCentimeter);
  }
  throw new RangeError('Unsupported point-23.9 minor-body family.');
}

function physical(diameterKilometers:number,bulkDensityGramsPerCubicCentimeter:number):MinorBodyPhysicalV1 {
  if(!Number.isFinite(diameterKilometers)||diameterKilometers<=0) throw new RangeError('Point-23.9 impactor diameter must be positive and finite.');
  if(!Number.isFinite(bulkDensityGramsPerCubicCentimeter)||bulkDensityGramsPerCubicCentimeter<=0) throw new RangeError('Point-23.9 impactor density must be positive and finite.');
  return Object.freeze({diameterKilometers,bulkDensityGramsPerCubicCentimeter});
}

function equivalentSphereMassKilogramsV1(diameterKilometers:number,densityGramsPerCubicCentimeter:number):number {
  const radiusMeters=diameterKilometers*500;
  const densityKilogramsPerCubicMeter=densityGramsPerCubicCentimeter*1000;
  return 4*Math.PI/3*radiusMeters**3*densityKilogramsPerCubicMeter;
}
