import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { MinorBodyCloseEncounterAssessment } from './minor-body-close-encounter-assessment';
import { MinorBodyCloseEncounterOutcomeRegime } from './minor-body-close-encounter-outcome-regime';
import { MinorBodyKind } from './minor-body-kind';
import { MinorBodyOrbitConicRegime } from './minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from './minor-body-orbital-elements';

const ID='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('MinorBodyCloseEncounterAssessment point 23.6',()=>{
  it('should keep the exact incoming orbit for an unresolved temporal candidate',()=>{
    const orbit=new MinorBodyOrbitalElements(MinorBodyKind.ASTEROID,ID,'AST',MinorBodyOrbitConicRegime.ELLIPTIC,1,2,0.1,2,3,4,5,1.8,2.2,Math.sqrt(8));
    const body={body:{},orbitalElements:orbit};
    const planet={planetOrdinal:1,massEarth:1,radiusEarth:1,orbit:{semiMajorAxisAu:1}};
    const proximity={minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,approachPossible:true,minorBodyKind:MinorBodyKind.ASTEROID,minorBodyProceduralId:ID} as any;
    const assessment=new MinorBodyCloseEncounterAssessment(proximity,null,0.8,0.2,false,false,0.01,null,null,0,0,MinorBodyCloseEncounterOutcomeRegime.NO_ENCOUNTER,orbit);
    expect(assessment.outgoingOrbitalElements).toBe(orbit);
    expect(assessment.orbitalChangeOccurred).toBe(false);
  });
});
