import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { MinorBodyImpactRiskAssessment } from './minor-body-impact-risk-assessment';
import { MinorBodyImpactRiskRegime } from './minor-body-impact-risk-regime';
import { MinorBodyKind } from './minor-body-kind';
import { MinorBodyOrbitConicRegime } from './minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { MinorBodyOrbitalTransition } from './minor-body-orbital-transition';

const ID='00000000000000000000000000000071';

describe('MinorBodyImpactRiskAssessment point 23.7',()=>{
  it('should preserve the exact point-23.6 outgoing orbit and distinguish a planet collision corridor from temporal impact probability',()=>{
    const orbit=new MinorBodyOrbitalElements(MinorBodyKind.ASTEROID,ID,'AST',MinorBodyOrbitConicRegime.ELLIPTIC,1,1,0,0,0,0,0,1,1,1);
    const body={body:{proceduralId:ID,localDesignation:'AST'},orbitalElements:orbit} as any;
    const transition=new MinorBodyOrbitalTransition(body,orbit,orbit,null);
    const planet={planetOrdinal:1,name:'P1',massEarth:1,radiusEarth:1,locator:{},orbit:{}} as any;
    const assessment=new MinorBodyImpactRiskAssessment(
      transition,MinorBodyApproachTargetKind.PLANET,planet,null,true,0,0,0,0.01,0,true,
      0.00005,11.2,12,1.87,0.000068,0.000046,0,true,1,0.0068,true,MinorBodyImpactRiskRegime.PLANET_COLLISION_CORRIDOR,
    );
    expect(assessment.evaluatedOrbitalElements).toBe(orbit);
    expect(assessment.directCollisionGeometryCandidate).toBe(true);
    expect('temporalImpactProbability' in assessment).toBe(false);
  });
});
