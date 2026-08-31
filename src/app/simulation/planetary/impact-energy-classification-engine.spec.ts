import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyImpactConsequenceRegime } from '../../domain/planetary/minor-body-impact-consequence-regime';
import { MinorBodyImpactEnergyRegime } from '../../domain/planetary/minor-body-impact-energy-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type MinorBodyTemporalImpactProbabilityAssessment } from '../../domain/planetary/minor-body-temporal-impact-probability-assessment';
import { type MinorBodyTemporalImpactProbabilityCatalog } from '../../domain/planetary/minor-body-temporal-impact-probability-catalog';
import { ImpactEnergyClassificationEngine } from './impact-energy-classification-engine';
import { MinorBodyDynamicsEngine } from './minor-body-dynamics-engine';

const ID='00000000000000000000000000000099';

describe('ImpactEnergyClassificationEngine point 23.9',()=>{
  it('should classify a 10-km rocky asteroid impact as a high-energy global conditional consequence without changing its temporal probability',()=>{
    const source=temporalAssessment(true,10,3,20,11.2);
    const catalog={assessments:[source]} as unknown as MinorBodyTemporalImpactProbabilityCatalog;
    const result=ImpactEnergyClassificationEngine.generate(catalog).assessments[0];
    expect(result.temporalAssessment).toBe(source);
    expect(result.temporalImpactProbability01).toBe(source.temporalImpactProbability01);
    expect(result.impactSpeedKmPerSecond).toBeGreaterThan(20);
    expect(result.kineticEnergyJoules).toBeGreaterThan(1e23);
    expect(result.energyRegime).toBe(MinorBodyImpactEnergyRegime.TERATON_CLASS);
    expect(result.consequenceRegime).toBe(MinorBodyImpactConsequenceRegime.GLOBAL);
  });

  it('should expose the same classification through MinorBodyDynamicsEngine',()=>{
    const source=temporalAssessment(true,1,2.5,15,11.2);
    const catalog={assessments:[source]} as unknown as MinorBodyTemporalImpactProbabilityCatalog;
    const direct=ImpactEnergyClassificationEngine.generate(catalog);
    const coordinated=MinorBodyDynamicsEngine.impactEnergies(catalog);
    expect(coordinated.assessments[0].kineticEnergyJoules).toBe(direct.assessments[0].kineticEnergyJoules);
  });



  it('should derive the same equivalent-volume mass contract from every phase-22 minor-body family',()=>{
    const bodies=[
      [MinorBodyKind.ASTEROID,{diameterKilometers:2,taxonomy:{bulkDensityGramsPerCubicCentimeter:2}}],
      [MinorBodyKind.COMET,{diameterKilometers:2,nucleusProperties:{bulkDensityGramsPerCubicCentimeter:2}}],
      [MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,{diameterKilometers:2,properties:{bulkDensityGramsPerCubicCentimeter:2}}],
      [MinorBodyKind.INTERSTELLAR_OBJECT,{diameterKilometers:2,properties:{bulkDensityGramsPerCubicCentimeter:2}}],
      [MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,{diameterKilometers:2,properties:{bulkDensityGramsPerCubicCentimeter:2}}],
    ] as const;
    const masses=bodies.map(([kind,body])=>{
      const source=temporalAssessmentForBody(true,kind,body,20,11.2);
      return ImpactEnergyClassificationEngine.generate({assessments:[source]} as unknown as MinorBodyTemporalImpactProbabilityCatalog).assessments[0].impactorMassKilograms;
    });
    expect(new Set(masses.map(value=>value?.toPrecision(14))).size).toBe(1);
  });

  it('should leave orbital-risk-only/zero-probability pairs physically unclassified',()=>{
    const source=temporalAssessment(false,10,3,20,11.2);
    const result=ImpactEnergyClassificationEngine.generate({assessments:[source]} as unknown as MinorBodyTemporalImpactProbabilityCatalog).assessments[0];
    expect(result.impactScenarioApplicable).toBe(false);
    expect(result.kineticEnergyJoules).toBeNull();
    expect(result.energyRegime).toBe(MinorBodyImpactEnergyRegime.NOT_APPLICABLE);
    expect(result.consequenceRegime).toBe(MinorBodyImpactConsequenceRegime.NOT_APPLICABLE);
  });
});

function temporalAssessment(applicable:boolean,diameterKilometers:number,density:number,relativeSpeed:number,escapeSpeed:number):MinorBodyTemporalImpactProbabilityAssessment {
  return temporalAssessmentForBody(applicable,MinorBodyKind.ASTEROID,{diameterKilometers,taxonomy:{bulkDensityGramsPerCubicCentimeter:density}},relativeSpeed,escapeSpeed);
}

function temporalAssessmentForBody(applicable:boolean,kind:typeof MinorBodyKind.values[number],body:unknown,relativeSpeed:number,escapeSpeed:number):MinorBodyTemporalImpactProbabilityAssessment {
  const risk={
    minorBodyKind:kind,
    transition:{minorBody:{body}},
    characteristicRelativeSpeedKmPerSecond:relativeSpeed,
    targetEscapeVelocityKmPerSecond:escapeSpeed,
    targetPhysicalRadiusAu:6371/149_597_870.7,
  };
  return {
    impactRiskAssessment:risk,
    hasNonZeroTemporalImpactProbability:applicable,
    temporalImpactProbability01:applicable?1e-6:0,
    minorBody:{},minorBodyProceduralId:ID,minorBodyDesignation:'AST-001',
    targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:{},targetMoon:null,targetName:'P1',
  } as unknown as MinorBodyTemporalImpactProbabilityAssessment;
}
