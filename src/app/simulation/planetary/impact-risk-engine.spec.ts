import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { type MinorBodyCloseEncounterCatalog } from '../../domain/planetary/minor-body-close-encounter-catalog';
import { MinorBodyImpactRiskRegime } from '../../domain/planetary/minor-body-impact-risk-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { MinorBodyOrbitConicRegime } from '../../domain/planetary/minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from '../../domain/planetary/minor-body-orbital-elements';
import { ImpactRiskEngine } from './impact-risk-engine';

const ID='00000000000000000000000000000077';

describe('ImpactRiskEngine point 23.7',()=>{
  it('should evaluate the post-23.6 outgoing orbit and flag an exact planet collision corridor without assigning temporal probability',()=>{
    const incoming=orbit(2,0.1,30);
    const outgoing=orbit(1,0,0);
    const body={body:{proceduralId:ID,localDesignation:'AST'},orbitalElements:incoming};
    const transition={minorBody:body,incomingOrbitalElements:incoming,outgoingOrbitalElements:outgoing,encounterAssessment:{},orbitalChangeOccurred:true,minorBodyProceduralId:ID};
    const planet=planetFixture();
    const catalog=closeCatalogFixture(body,transition,planet);
    const risks=ImpactRiskEngine.generate(catalog);
    expect(risks.assessmentCount).toBe(1);
    expect(risks.directPlanetCollisionGeometryCount).toBe(1);
    const assessment=risks.assessments[0];
    expect(assessment.evaluatedOrbitalElements).toBe(outgoing);
    expect(assessment.regime).toBe(MinorBodyImpactRiskRegime.PLANET_COLLISION_CORRIDOR);
    expect(assessment.gravitationalFocusingFactor).toBeGreaterThanOrEqual(1);
    expect(assessment.effectiveImpactRadiusAu).toBeGreaterThanOrEqual(assessment.targetPhysicalRadiusAu);
    expect('temporalImpactProbability' in assessment).toBe(false);
  });

  it('should keep a radial crossing with large nodal separation out of the impact-risk candidate set',()=>{
    const crossing=orbit(1.5,0.4,60);
    const body={body:{proceduralId:ID,localDesignation:'AST'},orbitalElements:crossing};
    const transition={minorBody:body,incomingOrbitalElements:crossing,outgoingOrbitalElements:crossing,encounterAssessment:null,orbitalChangeOccurred:false,minorBodyProceduralId:ID};
    const planet=planetFixture();
    const risks=ImpactRiskEngine.generate(closeCatalogFixture(body,transition,planet));
    const assessment=risks.assessments[0];
    expect(assessment.radialRangesOverlap).toBe(true);
    expect(assessment.riskCandidate).toBe(false);
    expect(assessment.regime).toBe(MinorBodyImpactRiskRegime.RADIAL_CROSSING_ONLY);
  });

  it('should classify a relevant moon only as orbital-region exposure and never invent an exact lunar collision corridor',()=>{
    const current=orbit(1,0,0);
    const body={body:{proceduralId:ID,localDesignation:'AST'},orbitalElements:current};
    const transition={minorBody:body,incomingOrbitalElements:current,outgoingOrbitalElements:current,encounterAssessment:null,orbitalChangeOccurred:false,minorBodyProceduralId:ID};
    const planet=planetFixture();
    const moon={hostPlanetOrdinal:1,hostPlanetLocator:planet.locator,moonOrdinal:1,locator:{},name:'P1 I',massEarth:0.0123,radiusEarth:0.273,orbit:{semiMajorAxisKilometers:384400,eccentricity:0.055}};
    const moonCorridor=moon.orbit.semiMajorAxisKilometers*(1+moon.orbit.eccentricity)/149_597_870.7;
    const planetSource={minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,targetCorridorRadiusAu:0.01};
    const moonSource={minorBody:body,targetKind:MinorBodyApproachTargetKind.MOON,targetPlanet:planet,targetMoon:moon,targetCorridorRadiusAu:moonCorridor};
    const close={
      transitions:[transition],
      proximityCatalog:{
        planets:[planet],moonSystems:[{relevantMoons:[moon]}],assessableTargetCount:2,assessments:[planetSource,moonSource],
      },
    } as unknown as MinorBodyCloseEncounterCatalog;
    const risks=ImpactRiskEngine.generate(close);
    const lunar=risks.assessments[1];
    expect(lunar.regime).toBe(MinorBodyImpactRiskRegime.MOON_ORBITAL_REGION);
    expect(lunar.riskCandidate).toBe(true);
    expect(lunar.directCollisionGeometryCandidate).toBe(false);
    expect(lunar.collisionCorridorClearanceAu).toBeNull();
  });

});

function orbit(a:number,e:number,i:number):MinorBodyOrbitalElements {
  return new MinorBodyOrbitalElements(
    MinorBodyKind.ASTEROID,ID,'AST',MinorBodyOrbitConicRegime.ELLIPTIC,1,a,e,i,0,0,0,
    a*(1-e),a*(1+e),Math.sqrt(a**3),
  );
}
function planetFixture(){
  return {
    planetOrdinal:1,name:'P1',massEarth:1,radiusEarth:1,locator:{},
    orbit:{semiMajorAxisAu:1,eccentricity:0,inclinationDegrees:0,longitudeOfAscendingNodeDegrees:0,argumentOfPeriapsisDegrees:0,periastronAu:1,apoastronAu:1},
  } as any;
}
function closeCatalogFixture(body:any,transition:any,planet:any):MinorBodyCloseEncounterCatalog {
  const sourceProximity={
    minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,targetCorridorRadiusAu:0.01,
  };
  const proximityCatalog={planets:[planet],moonSystems:[],assessableTargetCount:1,assessments:[sourceProximity]};
  return {transitions:[transition],proximityCatalog} as unknown as MinorBodyCloseEncounterCatalog;
}
