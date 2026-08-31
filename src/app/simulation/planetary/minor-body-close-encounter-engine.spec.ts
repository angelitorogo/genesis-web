import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyCloseEncounterOutcomeRegime } from '../../domain/planetary/minor-body-close-encounter-outcome-regime';
import { type MinorBodyGiantInfluenceCatalog } from '../../domain/planetary/minor-body-giant-influence-catalog';
import { MinorBodyGiantInfluenceRegime } from '../../domain/planetary/minor-body-giant-influence-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { MinorBodyOrbitConicRegime } from '../../domain/planetary/minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from '../../domain/planetary/minor-body-orbital-elements';
import { MinorBodyCloseEncounterEngine } from './minor-body-close-encounter-engine';

const EJECTION_ID='00000000000000000000000000000001';

describe('MinorBodyCloseEncounterEngine point 23.6',()=>{
  it('should resolve a deterministic giant flyby into an actual bound-to-hyperbolic ejection while preserving minor-body identity',()=>{
    const fixture=giantFixture(EJECTION_ID);
    const catalog=MinorBodyCloseEncounterEngine.generate(fixture.catalog);
    expect(catalog.approachCandidateCount).toBe(1);
    expect(catalog.encounterCount).toBe(1);
    expect(catalog.ejectionCount).toBe(1);
    const encounter=catalog.resolvedEncounters[0];
    expect(encounter.outcomeRegime).toBe(MinorBodyCloseEncounterOutcomeRegime.EJECTION);
    expect(encounter.incomingOrbitalElements.isBound).toBe(true);
    expect(encounter.outgoingOrbitalElements.isHyperbolic).toBe(true);
    expect(encounter.outgoingOrbitalElements.proceduralId).toBe(EJECTION_ID);
    expect(encounter.outgoingOrbitalElements).not.toBe(encounter.incomingOrbitalElements);
    expect(catalog.transitionFor(EJECTION_ID)?.outgoingOrbitalElements).toBe(encounter.outgoingOrbitalElements);
  });

  it('should resolve at most one effective encounter per body even when several approach corridors qualify',()=>{
    const fixture=giantFixture(EJECTION_ID,true);
    const catalog=MinorBodyCloseEncounterEngine.generate(fixture.catalog);
    expect(catalog.approachCandidateCount).toBe(2);
    expect(catalog.encounterCount).toBeLessThanOrEqual(1);
    expect(catalog.transitions).toHaveLength(1);
    expect(catalog.orbitalChangeCount).toBe(catalog.encounterCount);
  });
});

function giantFixture(id:string,withSecondPlanet=false):{readonly catalog:MinorBodyGiantInfluenceCatalog} {
  const orbit=new MinorBodyOrbitalElements(
    MinorBodyKind.ASTEROID,id,'AST',MinorBodyOrbitConicRegime.ELLIPTIC,
    1,6,0.35,4,30,50,10,3.9,8.1,Math.sqrt(216),
  );
  const body={body:{proceduralId:id,localDesignation:'AST'},orbitalElements:orbit};
  const giant=planet(1,5.2);
  const proximity1=proximity(body,giant,0.02,0.4);
  const giantInfluence1=giantInfluence(body,giant);
  const assessments=[proximity1];
  const giants=[giant];
  const giantInfluences=[giantInfluence1];
  const resonances=[{minorBody:body,targetPlanet:giant,insideChaoticZone:true,resonanceCandidate:false}];
  if(withSecondPlanet) {
    const second=planet(2,6.4);
    assessments.push(proximity(body,second,0.03,0.45));
    giants.push(second);
    giantInfluences.push(giantInfluence(body,second));
    resonances.push({minorBody:body,targetPlanet:second,insideChaoticZone:true,resonanceCandidate:false});
  }
  const orbitalCatalog={entries:[body],existingObjectCount:1};
  const proximityCatalog={orbitalCatalog,assessments};
  const resonanceCatalog={orbitalCatalog,proximityCatalog,assessments:resonances,planets:giants};
  return {catalog:{resonanceCatalog,assessments:giantInfluences} as unknown as MinorBodyGiantInfluenceCatalog};
}

function planet(planetOrdinal:number,a:number) {
  return {
    planetOrdinal,
    name:`P${planetOrdinal}`,
    massEarth:318,
    radiusEarth:11.2,
    orbit:{semiMajorAxisAu:a,eccentricity:0.03,inclinationDegrees:1,longitudeOfAscendingNodeDegrees:20,argumentOfPeriapsisDegrees:30},
  } as any;
}

function proximity(body:any,targetPlanet:any,separation:number,corridor:number) {
  return {
    minorBody:body,
    targetKind:MinorBodyApproachTargetKind.PLANET,
    targetPlanet,
    targetMoon:null,
    radialRangesOverlap:true,
    radialGapAu:0,
    mutualInclinationDegrees:3,
    minimumNodalSeparationAu:separation,
    targetCorridorRadiusAu:corridor,
    corridorClearanceAu:0,
    approachPossible:true,
    regime:{},
    minorBodyKind:body.orbitalElements.kind,
    minorBodyProceduralId:body.orbitalElements.proceduralId,
    minorBodyDesignation:body.orbitalElements.localDesignation,
    targetPlanetOrdinal:targetPlanet.planetOrdinal,
    targetMoonOrdinal:null,
  } as any;
}

function giantInfluence(body:any,targetGiantPlanet:any) {
  return {
    minorBody:body,
    targetGiantPlanet,
    regime:MinorBodyGiantInfluenceRegime.EJECTION_CANDIDATE,
    perturbationPotentialIndex01:0.95,
    temporaryCapturePotentialIndex01:0.10,
    ejectionPotentialIndex01:0.98,
  } as any;
}
