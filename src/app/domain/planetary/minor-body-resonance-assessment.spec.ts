import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { MinorBodyDynamicalZoneRegime } from './minor-body-dynamical-zone-regime';
import { MinorBodyKind } from './minor-body-kind';
import { MinorBodyOrbitConicRegime } from './minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { type MinorBodyOrbitalElementsCatalogEntry } from './minor-body-orbital-elements-catalog';
import { type MinorBodyOrbitProximityAssessment } from './minor-body-orbit-proximity-assessment';
import { MinorBodyResonanceAssessment } from './minor-body-resonance-assessment';
import { MinorBodyResonanceRegime } from './minor-body-resonance-regime';
import { type Planet } from './planet';

const BODY_ID='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('MinorBodyResonanceAssessment point 23.4',()=>{
  it('should preserve an exterior 2:1 candidate independently from local chaotic-zone membership',()=>{
    const a=Math.pow(2,2/3);
    const body=entry(a);
    const planet=planetFixture();
    const proximity=proximityFixture(body,planet);
    const assessment=new MinorBodyResonanceAssessment(
      body,planet,proximity,1,2,
      MinorBodyResonanceRegime.EXTERIOR,
      2,1,1,2,0,0.01,true,
      3e-6,0.95,1.05,false,
      MinorBodyDynamicalZoneRegime.RESONANT_BAND,
    );
    expect(assessment.resonanceCandidate).toBe(true);
    expect(assessment.insideChaoticZone).toBe(false);
    expect(assessment.isDynamicallyFlagged).toBe(true);
  });

  it('should reject resonance metadata for an unbound passage',()=>{
    const body=hyperbolicEntry();
    const planet=planetFixture();
    const proximity=proximityFixture(body,planet);
    expect(()=>new MinorBodyResonanceAssessment(
      body,planet,proximity,1,null,
      MinorBodyResonanceRegime.NOT_APPLICABLE_UNBOUND,
      null,null,null,null,null,0.01,false,
      3e-6,0.95,1.05,true,
      MinorBodyDynamicalZoneRegime.UNBOUND_PASSAGE,
    )).toThrow(RangeError);
  });
});

function entry(a:number):MinorBodyOrbitalElementsCatalogEntry {
  const e=0.05;
  return {
    body:{proceduralId:BODY_ID,localDesignation:'TEST-001'} as any,
    orbitalElements:new MinorBodyOrbitalElements(
      MinorBodyKind.ASTEROID,BODY_ID,'TEST-001',MinorBodyOrbitConicRegime.ELLIPTIC,
      1,a,e,2,30,40,10,a*(1-e),a*(1+e),Math.sqrt(a**3),
    ),
  };
}
function hyperbolicEntry():MinorBodyOrbitalElementsCatalogEntry {
  return {
    body:{proceduralId:BODY_ID,localDesignation:'ISO-001'} as any,
    orbitalElements:new MinorBodyOrbitalElements(
      MinorBodyKind.INTERSTELLAR_OBJECT,BODY_ID,'ISO-001',MinorBodyOrbitConicRegime.HYPERBOLIC,
      1,-10,1.1,20,30,40,null,1,null,null,
    ),
  };
}
function planetFixture():Planet {
  return {
    planetOrdinal:1,name:'Test b',massEarth:1,radiusEarth:1,
    orbit:{semiMajorAxisAu:1,eccentricity:0,inclinationDegrees:0,longitudeOfAscendingNodeDegrees:0,argumentOfPeriapsisDegrees:0} as any,
  } as unknown as Planet;
}
function proximityFixture(body:MinorBodyOrbitalElementsCatalogEntry,planet:Planet):MinorBodyOrbitProximityAssessment {
  return {
    minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,
  } as unknown as MinorBodyOrbitProximityAssessment;
}
