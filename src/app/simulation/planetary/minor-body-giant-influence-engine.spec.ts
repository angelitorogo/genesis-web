import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyDynamicalZoneRegime } from '../../domain/planetary/minor-body-dynamical-zone-regime';
import { MinorBodyGiantInfluenceRegime } from '../../domain/planetary/minor-body-giant-influence-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { MinorBodyOrbitConicRegime } from '../../domain/planetary/minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from '../../domain/planetary/minor-body-orbital-elements';
import { MinorBodyResonanceAssessment } from '../../domain/planetary/minor-body-resonance-assessment';
import { MinorBodyResonanceCatalog } from '../../domain/planetary/minor-body-resonance-catalog';
import { MinorBodyResonanceRegime } from '../../domain/planetary/minor-body-resonance-regime';
import { type Planet } from '../../domain/planetary/planet';
import { MinorBodyGiantInfluenceEngine } from './minor-body-giant-influence-engine';

const ID1='11111111111111111111111111111111';
const ID2='22222222222222222222222222222222';
const ID3='33333333333333333333333333333333';

describe('MinorBodyGiantInfluenceEngine point 23.5',()=>{
  it('should ignore terrestrial planets and classify giant perturbation/ejection candidates without mutating the source orbit',()=>{
    const terrestrial=planetFixture(1,1,1,1);
    const giant=planetFixture(2,5.2,318,11.2);
    const body=boundEntry(ID1,6,0.35);
    const orbitalCatalog={entries:[body],existingObjectCount:1} as any;
    const terrestrialRes=resonance(body,terrestrial,false);
    const giantRes=resonance(body,giant,true);
    const resonanceCatalog=new MinorBodyResonanceCatalog(
      orbitalCatalog,
      {orbitalCatalog,planets:[terrestrial,giant],assessments:[terrestrialRes.proximityAssessment,giantRes.proximityAssessment]} as any,
      [terrestrial,giant],
      [terrestrialRes,giantRes],
    );
    const before={a:body.orbitalElements.semiMajorAxisAu,e:body.orbitalElements.eccentricity};
    const catalog=MinorBodyGiantInfluenceEngine.generate(resonanceCatalog);
    expect(catalog.giantPlanets).toEqual([giant]);
    expect(catalog.assessmentCount).toBe(1);
    expect(catalog.assessments[0].scatteringPowerIndex01).toBeGreaterThan(0.5);
    expect(catalog.assessments[0].regime).not.toBe(MinorBodyGiantInfluenceRegime.BACKGROUND);
    expect({a:body.orbitalElements.semiMajorAxisAu,e:body.orbitalElements.eccentricity}).toEqual(before);
  });

  it('should let a slow hyperbolic visitor become a temporary-capture candidate while never assigning it ejection potential',()=>{
    const giant=planetFixture(1,5.2,318,11.2);
    const body=hyperbolicEntry();
    const orbitalCatalog={entries:[body],existingObjectCount:1} as any;
    const res=resonance(body,giant,true);
    const resonanceCatalog=new MinorBodyResonanceCatalog(
      orbitalCatalog,
      {orbitalCatalog,planets:[giant],assessments:[res.proximityAssessment]} as any,
      [giant],
      [res],
    );
    const assessment=MinorBodyGiantInfluenceEngine.generate(resonanceCatalog).assessments[0];
    expect(assessment.ejectionPotentialIndex01).toBe(0);
    expect([
      MinorBodyGiantInfluenceRegime.TEMPORARY_CAPTURE_CANDIDATE,
      MinorBodyGiantInfluenceRegime.UNBOUND_DEFLECTION_CANDIDATE,
    ]).toContain(assessment.regime);
  });
});

function boundEntry(id:string,a:number,e:number){
  return {body:{proceduralId:id,localDesignation:'AST'} as any,orbitalElements:new MinorBodyOrbitalElements(MinorBodyKind.ASTEROID,id,'AST',MinorBodyOrbitConicRegime.ELLIPTIC,1,a,e,4,30,50,10,a*(1-e),a*(1+e),Math.sqrt(a**3))};
}
function hyperbolicEntry(){
  return {body:{proceduralId:ID3,localDesignation:'ISO'} as any,orbitalElements:new MinorBodyOrbitalElements(MinorBodyKind.INTERSTELLAR_OBJECT,ID3,'ISO',MinorBodyOrbitConicRegime.HYPERBOLIC,1,-120,1.02,30,20,10,null,2.4,null,null)};
}
function planetFixture(planetOrdinal:number,a:number,massEarth:number,radiusEarth:number):Planet {
  return {planetOrdinal,name:`P${planetOrdinal}`,massEarth,radiusEarth,orbit:{semiMajorAxisAu:a,eccentricity:0.03,inclinationDegrees:1,longitudeOfAscendingNodeDegrees:20,argumentOfPeriapsisDegrees:30}} as unknown as Planet;
}
function resonance(body:any,planet:Planet,approach:boolean):MinorBodyResonanceAssessment {
  const hill=0.35;
  const proximity={minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,radialRangesOverlap:approach,radialGapAu:approach?0:1,mutualInclinationDegrees:3,minimumNodalSeparationAu:approach?0.1:1,targetCorridorRadiusAu:hill,corridorClearanceAu:approach?0:0.65,approachPossible:approach,regime:{}} as any;
  const period=Math.sqrt(planet.orbit.semiMajorAxisAu**3);
  const ratio=body.orbitalElements.isBound?(body.orbitalElements.orbitalPeriodYears as number)/period:null;
  const massRatio=planet.massEarth/332946.0487;
  const width=1.5*planet.orbit.semiMajorAxisAu*massRatio**(2/7)+planet.orbit.semiMajorAxisAu*planet.orbit.eccentricity;
  const inner=Math.max(0,planet.orbit.semiMajorAxisAu-width);
  const outer=planet.orbit.semiMajorAxisAu+width;
  if(!body.orbitalElements.isBound) return new MinorBodyResonanceAssessment(body,planet,proximity,period,null,MinorBodyResonanceRegime.NOT_APPLICABLE_UNBOUND,null,null,null,null,null,0.01,false,massRatio,inner,outer,false,MinorBodyDynamicalZoneRegime.UNBOUND_PASSAGE);
  const inside=body.orbitalElements.semiMajorAxisAu>=inner&&body.orbitalElements.semiMajorAxisAu<=outer;
  return new MinorBodyResonanceAssessment(body,planet,proximity,period,ratio,MinorBodyResonanceRegime.NONE,null,null,null,null,null,0.01,false,massRatio,inner,outer,inside,inside?MinorBodyDynamicalZoneRegime.CHAOTIC_ZONE:MinorBodyDynamicalZoneRegime.BACKGROUND);
}
