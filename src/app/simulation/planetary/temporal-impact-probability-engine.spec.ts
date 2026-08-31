import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { type MinorBodyImpactRiskAssessment } from '../../domain/planetary/minor-body-impact-risk-assessment';
import { type MinorBodyImpactRiskCatalog } from '../../domain/planetary/minor-body-impact-risk-catalog';
import { MinorBodyTemporalImpactProbabilityRegime } from '../../domain/planetary/minor-body-temporal-impact-probability-regime';
import { MinorBodyDynamicsEngine } from './minor-body-dynamics-engine';
import { TemporalImpactProbabilityEngine } from './temporal-impact-probability-engine';

const ID='00000000000000000000000000000088';

describe('TemporalImpactProbabilityEngine point 23.8',()=>{
  it('should be exposed through the phase-23 MinorBodyDynamicsEngine coordinator',()=>{
    const source=planetCollisionRisk(false);
    const catalog={assessments:[source]} as unknown as MinorBodyImpactRiskCatalog;
    const direct=TemporalImpactProbabilityEngine.generate(catalog,100);
    const coordinated=MinorBodyDynamicsEngine.temporalImpactProbabilities(catalog,100);
    expect(coordinated.timeWindowYears).toBe(direct.timeWindowYears);
    expect(coordinated.assessments[0].temporalImpactProbability01).toBe(direct.assessments[0].temporalImpactProbability01);
  });

  it('should keep orbital risk fixed while cumulative bound impact probability grows monotonically with the requested horizon',()=>{
    const source=planetCollisionRisk(false);
    const catalog={assessments:[source]} as unknown as MinorBodyImpactRiskCatalog;
    const century=TemporalImpactProbabilityEngine.generate(catalog,100).assessments[0];
    const millennium=TemporalImpactProbabilityEngine.generate(catalog,1000).assessments[0];
    expect(century.impactRiskAssessment).toBe(source);
    expect(century.orbitalRiskIndex01).toBe(source.orbitalRiskIndex01);
    expect(century.temporalImpactProbability01).toBeGreaterThan(0);
    expect(millennium.temporalImpactProbability01).toBeGreaterThan(century.temporalImpactProbability01);
    expect(millennium.expectedOpportunityCount).toBeCloseTo(10*century.expectedOpportunityCount,12);
  });

  it('should preserve orbital risk but return zero current impact probability for a planet approach corridor outside the physical collision corridor',()=>{
    const source={...planetCollisionRisk(false),directCollisionGeometryCandidate:false} as unknown as MinorBodyImpactRiskAssessment;
    const result=TemporalImpactProbabilityEngine.generate({assessments:[source]} as unknown as MinorBodyImpactRiskCatalog,1_000_000).assessments[0];
    expect(result.orbitalRiskCandidate).toBe(true);
    expect(result.temporalImpactProbability01).toBe(0);
    expect(result.regime).toBe(MinorBodyTemporalImpactProbabilityRegime.ORBITAL_RISK_ONLY);
  });

  it('should treat a hyperbolic visitor as one passage whose probability does not grow with a longer horizon',()=>{
    const source=planetCollisionRisk(true);
    const catalog={assessments:[source]} as unknown as MinorBodyImpactRiskCatalog;
    const short=TemporalImpactProbabilityEngine.generate(catalog,10).assessments[0];
    const long=TemporalImpactProbabilityEngine.generate(catalog,1_000_000).assessments[0];
    expect(short.isSinglePassage).toBe(true);
    expect(short.opportunityFrequencyPerYear).toBeNull();
    expect(short.expectedOpportunityCount).toBe(1);
    expect(short.regime).toBe(MinorBodyTemporalImpactProbabilityRegime.SINGLE_PASSAGE);
    expect(long.temporalImpactProbability01).toBe(short.temporalImpactProbability01);
  });

  it('should require both heliocentric host phase and local lunar phase for a moon-region risk',()=>{
    const planet=planetFixture();
    const moon={orbit:{semiMajorAxisKilometers:384_400},name:'P1 I'};
    const source={
      ...planetCollisionRisk(false),
      targetKind:MinorBodyApproachTargetKind.MOON,
      targetPlanet:planet,
      targetMoon:moon,
      targetName:'P1 I',
      directCollisionGeometryCandidate:false,
      targetCorridorRadiusAu:384_400/149_597_870.7,
      effectiveImpactRadiusAu:20_000/149_597_870.7,
    } as unknown as MinorBodyImpactRiskAssessment;
    const result=TemporalImpactProbabilityEngine.generate({assessments:[source]} as unknown as MinorBodyImpactRiskCatalog,1000).assessments[0];
    expect(result.hostPhaseCoincidenceProbability01).toBeGreaterThan(0);
    expect(result.localTargetPhaseCoincidenceProbability01).toBeGreaterThan(0);
    expect(result.impactProbabilityPerOpportunity01).toBeCloseTo(
      result.hostPhaseCoincidenceProbability01*result.localTargetPhaseCoincidenceProbability01,
      15,
    );
  });
});

function planetCollisionRisk(hyperbolic:boolean):MinorBodyImpactRiskAssessment {
  return {
    evaluatedOrbitalElements:{
      isHyperbolic:hyperbolic,
      orbitalPeriodYears:hyperbolic?null:2,
    },
    targetKind:MinorBodyApproachTargetKind.PLANET,
    targetPlanet:planetFixture(),
    targetMoon:null,
    targetName:'P1',
    targetCorridorRadiusAu:0.01,
    effectiveImpactRadiusAu:0.00005,
    directCollisionGeometryCandidate:true,
    riskCandidate:true,
    orbitalRiskIndex01:0.8,
    minorBody:{},minorBodyProceduralId:ID,minorBodyDesignation:'AST',
  } as unknown as MinorBodyImpactRiskAssessment;
}
function planetFixture(){
  return {orbit:{semiMajorAxisAu:1}} as any;
}
