import { MinorBodyImpactConsequenceRegime, type MinorBodyImpactConsequenceRegimeValue } from './minor-body-impact-consequence-regime';
import { MinorBodyImpactEnergyRegime, type MinorBodyImpactEnergyRegimeValue } from './minor-body-impact-energy-regime';
import { type MinorBodyTemporalImpactProbabilityAssessment } from './minor-body-temporal-impact-probability-assessment';

const TOLERANCE=1e-10;

/**
 * Point-23.9 conditional impact-physics projection for one point-23.8 pair.
 *
 * When point 23.8 assigns zero temporal impact probability, the energy scenario
 * is NOT_APPLICABLE and all conditional physical outputs are null. Otherwise the
 * assessment answers "what energy/consequence class would this collision have if
 * that probabilistic impact occurs?" without materializing an actual event.
 */
export class MinorBodyImpactEnergyAssessment {
  constructor(
    readonly temporalAssessment:MinorBodyTemporalImpactProbabilityAssessment,
    readonly impactScenarioApplicable:boolean,
    readonly impactorDiameterKilometers:number|null,
    readonly impactorBulkDensityGramsPerCubicCentimeter:number|null,
    readonly impactorMassKilograms:number|null,
    readonly preImpactRelativeSpeedKmPerSecond:number|null,
    readonly impactSpeedKmPerSecond:number|null,
    readonly kineticEnergyJoules:number|null,
    readonly tntEquivalentMegatons:number|null,
    readonly targetMassKilograms:number|null,
    readonly targetBindingEnergyJoules:number|null,
    readonly targetBindingEnergyFraction:number|null,
    readonly energyRegime:MinorBodyImpactEnergyRegimeValue,
    readonly consequenceRegime:MinorBodyImpactConsequenceRegimeValue,
  ) {
    if(impactScenarioApplicable!==temporalAssessment.hasNonZeroTemporalImpactProbability) {
      throw new RangeError('Point-23.9 impactScenarioApplicable must exactly match non-zero point-23.8 temporal impact probability.');
    }
    if(!MinorBodyImpactEnergyRegime.values.includes(energyRegime)) throw new RangeError('Unknown MinorBodyImpactEnergyRegime.');
    if(!MinorBodyImpactConsequenceRegime.values.includes(consequenceRegime)) throw new RangeError('Unknown MinorBodyImpactConsequenceRegime.');

    const nullableValues=[
      impactorDiameterKilometers,
      impactorBulkDensityGramsPerCubicCentimeter,
      impactorMassKilograms,
      preImpactRelativeSpeedKmPerSecond,
      impactSpeedKmPerSecond,
      kineticEnergyJoules,
      tntEquivalentMegatons,
      targetMassKilograms,
      targetBindingEnergyJoules,
      targetBindingEnergyFraction,
    ] as const;

    if(!impactScenarioApplicable) {
      if(nullableValues.some(value=>value!==null)) throw new RangeError('Non-applicable point-23.9 assessments must not invent conditional impact physics.');
      if(energyRegime!==MinorBodyImpactEnergyRegime.NOT_APPLICABLE||consequenceRegime!==MinorBodyImpactConsequenceRegime.NOT_APPLICABLE) {
        throw new RangeError('Non-applicable point-23.9 assessments must use NOT_APPLICABLE regimes.');
      }
      return;
    }

    for(const [name,value] of [
      ['impactorDiameterKilometers',impactorDiameterKilometers],
      ['impactorBulkDensityGramsPerCubicCentimeter',impactorBulkDensityGramsPerCubicCentimeter],
      ['impactorMassKilograms',impactorMassKilograms],
      ['preImpactRelativeSpeedKmPerSecond',preImpactRelativeSpeedKmPerSecond],
      ['impactSpeedKmPerSecond',impactSpeedKmPerSecond],
      ['kineticEnergyJoules',kineticEnergyJoules],
      ['tntEquivalentMegatons',tntEquivalentMegatons],
      ['targetMassKilograms',targetMassKilograms],
      ['targetBindingEnergyJoules',targetBindingEnergyJoules],
      ['targetBindingEnergyFraction',targetBindingEnergyFraction],
    ] as const) {
      if(value===null||!Number.isFinite(value)||value<=0) throw new RangeError(`${name} must be positive and finite for an applicable point-23.9 impact scenario.`);
    }

    const requiredPre=required(preImpactRelativeSpeedKmPerSecond);
    const requiredImpact=required(impactSpeedKmPerSecond);
    if(requiredImpact+TOLERANCE<requiredPre) throw new RangeError('Impact speed cannot be lower than the point-23.7 pre-impact relative speed.');

    const expectedEnergy=0.5*required(impactorMassKilograms)*(requiredImpact*1000)**2;
    if(relativeError(required(kineticEnergyJoules),expectedEnergy)>1e-9) throw new RangeError('Point-23.9 kinetic energy must equal 0.5 m v^2.');
    const expectedTnt=required(kineticEnergyJoules)/4.184e15;
    if(relativeError(required(tntEquivalentMegatons),expectedTnt)>1e-9) throw new RangeError('Point-23.9 TNT equivalent must use 4.184e15 J per megaton.');
    const expectedBindingFraction=required(kineticEnergyJoules)/required(targetBindingEnergyJoules);
    if(relativeError(required(targetBindingEnergyFraction),expectedBindingFraction)>1e-9) throw new RangeError('Point-23.9 target binding-energy fraction must equal impact energy / target binding energy.');

    if(energyRegime!==impactEnergyRegimeForJoules(required(kineticEnergyJoules))) {
      throw new RangeError('Point-23.9 energy regime must match the conditional kinetic energy.');
    }
    if(consequenceRegime!==impactConsequenceRegimeForV1(required(kineticEnergyJoules),required(targetBindingEnergyFraction))) {
      throw new RangeError('Point-23.9 consequence regime must match the V1 energy/target-relative severity proxy.');
    }
  }

  get impactRiskAssessment(){return this.temporalAssessment.impactRiskAssessment;}
  get minorBody(){return this.temporalAssessment.minorBody;}
  get minorBodyProceduralId(){return this.temporalAssessment.minorBodyProceduralId;}
  get minorBodyDesignation(){return this.temporalAssessment.minorBodyDesignation;}
  get targetKind(){return this.temporalAssessment.targetKind;}
  get targetPlanet(){return this.temporalAssessment.targetPlanet;}
  get targetMoon(){return this.temporalAssessment.targetMoon;}
  get targetName(){return this.temporalAssessment.targetName;}
  get temporalImpactProbability01(){return this.temporalAssessment.temporalImpactProbability01;}
}

function required(value:number|null):number {
  if(value===null) throw new RangeError('Required point-23.9 value is null.');
  return value;
}
function relativeError(actual:number,expected:number):number{return Math.abs(actual-expected)/Math.max(1,Math.abs(expected));}

export function impactEnergyRegimeForJoules(energyJoules:number):MinorBodyImpactEnergyRegimeValue {
  if(!Number.isFinite(energyJoules)||energyJoules<=0) throw new RangeError('energyJoules must be positive and finite.');
  if(energyJoules<4.184e15) return MinorBodyImpactEnergyRegime.SUB_MEGATON;
  if(energyJoules<4.184e18) return MinorBodyImpactEnergyRegime.MEGATON_CLASS;
  if(energyJoules<4.184e21) return MinorBodyImpactEnergyRegime.GIGATON_CLASS;
  if(energyJoules<4.184e24) return MinorBodyImpactEnergyRegime.TERATON_CLASS;
  return MinorBodyImpactEnergyRegime.PLANETARY_SCALE;
}

export function impactConsequenceRegimeForV1(energyJoules:number,targetBindingEnergyFraction:number):MinorBodyImpactConsequenceRegimeValue {
  if(!Number.isFinite(energyJoules)||energyJoules<=0) throw new RangeError('energyJoules must be positive and finite.');
  if(!Number.isFinite(targetBindingEnergyFraction)||targetBindingEnergyFraction<=0) throw new RangeError('targetBindingEnergyFraction must be positive and finite.');
  if(energyJoules>=1e25||targetBindingEnergyFraction>=1e-2) return MinorBodyImpactConsequenceRegime.CATASTROPHIC;
  if(energyJoules>=1e20||targetBindingEnergyFraction>=1e-6) return MinorBodyImpactConsequenceRegime.GLOBAL;
  if(energyJoules>=1e16||targetBindingEnergyFraction>=1e-10) return MinorBodyImpactConsequenceRegime.REGIONAL;
  return MinorBodyImpactConsequenceRegime.LOCAL;
}
