import { MinorBodyDynamicalZoneRegime } from './minor-body-dynamical-zone-regime';
import { MinorBodyKind } from './minor-body-kind';
import { MinorBodyOrbitConicRegime } from './minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from './minor-body-orbital-elements';
import { type MinorBodyOrbitalElementsCatalog } from './minor-body-orbital-elements-catalog';
import { type MinorBodyOrbitProximityCatalog } from './minor-body-orbit-proximity-catalog';
import { MinorBodyResonanceAssessment } from './minor-body-resonance-assessment';
import { MinorBodyResonanceCatalog } from './minor-body-resonance-catalog';
import { MinorBodyResonanceRegime } from './minor-body-resonance-regime';
import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { type Planet } from './planet';

const ID='BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

describe('MinorBodyResonanceCatalog point 23.4',()=>{
  it('should require one deterministic assessment for every body x planet pair',()=>{
    const body={body:{proceduralId:ID,localDesignation:'T-1'} as any,orbitalElements:new MinorBodyOrbitalElements(MinorBodyKind.ASTEROID,ID,'T-1',MinorBodyOrbitConicRegime.ELLIPTIC,1,1,0,0,0,0,0,1,1,1)};
    const planet={planetOrdinal:1,name:'P1',massEarth:1,orbit:{semiMajorAxisAu:1,eccentricity:0}} as unknown as Planet;
    const proximity={minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null} as any;
    const orbitalCatalog={entries:[body],existingObjectCount:1} as unknown as MinorBodyOrbitalElementsCatalog;
    const proximityCatalog={orbitalCatalog,planets:[planet],assessments:[proximity]} as unknown as MinorBodyOrbitProximityCatalog;
    const assessment=new MinorBodyResonanceAssessment(body,planet,proximity,1,1,MinorBodyResonanceRegime.CO_ORBITAL,1,1,0,1,0,0.01,true,3e-6,0.95,1.05,true,MinorBodyDynamicalZoneRegime.CHAOTIC_RESONANT_OVERLAP);
    const catalog=new MinorBodyResonanceCatalog(orbitalCatalog,proximityCatalog,[planet],[assessment]);
    expect(catalog.assessmentCount).toBe(1);
    expect(catalog.resonanceCandidateCount).toBe(1);
    expect(catalog.chaoticResonantOverlapCount).toBe(1);
    expect(catalog.relevantAssessments[0]).toBe(assessment);
  });
});
