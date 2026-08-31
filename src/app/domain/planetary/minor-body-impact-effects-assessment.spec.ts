import { MinorBodyImpactEffectsAssessment, impactBulkDisruptionPotentialIndexV1, impactSurfaceResponseRegimeV1, impactTargetResponseSeverityIndexV1 } from './minor-body-impact-effects-assessment';
import { MinorBodyImpactSurfaceResponseRegime } from './minor-body-impact-surface-response-regime';
import { type MinorBodyImpactEnergyAssessment } from './minor-body-impact-energy-assessment';

function energyAssessment(applicable=true):MinorBodyImpactEnergyAssessment {
  return {
    impactScenarioApplicable:applicable,
    kineticEnergyJoules:applicable?1e20:null,
    targetBindingEnergyFraction:applicable?1e-6:null,
  } as unknown as MinorBodyImpactEnergyAssessment;
}

describe('MinorBodyImpactEffectsAssessment point 23.10',()=>{
  it('should freeze logarithmic severity, disruption and solid-surface regime boundaries',()=>{
    expect(impactTargetResponseSeverityIndexV1(1e12,1e-14)).toBe(0);
    expect(impactTargetResponseSeverityIndexV1(1e25,1e-14)).toBe(1);
    expect(impactTargetResponseSeverityIndexV1(1e12,1e-2)).toBe(1);
    expect(impactBulkDisruptionPotentialIndexV1(1e-2)).toBe(1);
    expect(impactSurfaceResponseRegimeV1(false,null,1e-8)).toBe(MinorBodyImpactSurfaceResponseRegime.NO_SOLID_SURFACE);
    expect(impactSurfaceResponseRegimeV1(true,0.005,1e-8)).toBe(MinorBodyImpactSurfaceResponseRegime.CRATERING);
    expect(impactSurfaceResponseRegimeV1(true,0.02,1e-8)).toBe(MinorBodyImpactSurfaceResponseRegime.LARGE_CRATER_BASIN);
    expect(impactSurfaceResponseRegimeV1(true,0.20,1e-8)).toBe(MinorBodyImpactSurfaceResponseRegime.GLOBAL_RESHAPING);
    expect(impactSurfaceResponseRegimeV1(true,0.20,1e-2)).toBe(MinorBodyImpactSurfaceResponseRegime.BULK_DISRUPTION);
  });

  it('should forbid physical target outputs when point 23.9 is not applicable',()=>{
    expect(()=>new MinorBodyImpactEffectsAssessment(
      energyAssessment(false),false,null,null,null,null,null,null,null,null,null,null,null,null,null,
      MinorBodyImpactSurfaceResponseRegime.NOT_APPLICABLE,
    )).not.toThrow();
    expect(()=>new MinorBodyImpactEffectsAssessment(
      energyAssessment(false),false,null,1,null,null,null,null,null,null,null,null,null,null,null,
      MinorBodyImpactSurfaceResponseRegime.NOT_APPLICABLE,
    )).toThrow(RangeError);
  });
});
