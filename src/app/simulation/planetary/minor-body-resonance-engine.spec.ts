import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { MinorBodyDynamicalZoneRegime } from '../../domain/planetary/minor-body-dynamical-zone-regime';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { MinorBodyOrbitConicRegime } from '../../domain/planetary/minor-body-orbit-conic-regime';
import { MinorBodyOrbitalElements } from '../../domain/planetary/minor-body-orbital-elements';
import { type MinorBodyOrbitalElementsCatalog } from '../../domain/planetary/minor-body-orbital-elements-catalog';
import { type MinorBodyOrbitProximityCatalog } from '../../domain/planetary/minor-body-orbit-proximity-catalog';
import { MinorBodyResonanceRegime } from '../../domain/planetary/minor-body-resonance-regime';
import { type Planet } from '../../domain/planetary/planet';
import { MinorBodyResonanceEngine } from './minor-body-resonance-engine';

const ID1='11111111111111111111111111111111';
const ID2='22222222222222222222222222222222';
const ID3='33333333333333333333333333333333';

describe('MinorBodyResonanceEngine point 23.4',()=>{
  it('should distinguish a clean 2:1 resonant band, a co-orbital chaotic overlap and an unbound passage',()=>{
    const planet=planetFixture(1,1,0,1);
    const exteriorA=Math.pow(2,2/3);
    const entries=[
      entry(ID1,MinorBodyKind.ASTEROID,exteriorA,0.05),
      entry(ID2,MinorBodyKind.COMET,1,0.01),
      hyperbolicEntry(),
    ];
    const orbitalCatalog={entries,existingObjectCount:entries.length} as unknown as MinorBodyOrbitalElementsCatalog;
    const proximityAssessments=entries.map(minorBody=>({minorBody,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planet,targetMoon:null,approachPossible:false,radialRangesOverlap:false}) as any);
    const proximityCatalog={orbitalCatalog,planets:[planet],assessments:proximityAssessments} as unknown as MinorBodyOrbitProximityCatalog;
    const catalog=MinorBodyResonanceEngine.generate(orbitalCatalog,proximityCatalog);

    expect(catalog.assessmentCount).toBe(3);
    expect(catalog.assessments[0].resonanceRegime).toBe(MinorBodyResonanceRegime.EXTERIOR);
    expect(catalog.assessments[0].resonanceNumerator).toBe(2);
    expect(catalog.assessments[0].resonanceDenominator).toBe(1);
    expect(catalog.assessments[0].zoneRegime).toBe(MinorBodyDynamicalZoneRegime.RESONANT_BAND);

    expect(catalog.assessments[1].resonanceRegime).toBe(MinorBodyResonanceRegime.CO_ORBITAL);
    expect(catalog.assessments[1].insideChaoticZone).toBe(true);
    expect(catalog.assessments[1].zoneRegime).toBe(MinorBodyDynamicalZoneRegime.CHAOTIC_RESONANT_OVERLAP);

    expect(catalog.assessments[2].resonanceRegime).toBe(MinorBodyResonanceRegime.NOT_APPLICABLE_UNBOUND);
    expect(catalog.assessments[2].zoneRegime).toBe(MinorBodyDynamicalZoneRegime.UNBOUND_PASSAGE);
  });

  it('should scale the simplified chaotic zone wider for a more massive planet',()=>{
    const body=entry(ID1,MinorBodyKind.ASTEROID,1.4,0.01);
    const earth=planetFixture(1,1,0,1);
    const giant=planetFixture(2,1,0,318);
    const orbitalCatalog={entries:[body],existingObjectCount:1} as unknown as MinorBodyOrbitalElementsCatalog;
    const proximityCatalog={orbitalCatalog,planets:[earth,giant],assessments:[earth,giant].map(targetPlanet=>({minorBody:body,targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet,targetMoon:null}) as any)} as unknown as MinorBodyOrbitProximityCatalog;
    const result=MinorBodyResonanceEngine.generate(orbitalCatalog,proximityCatalog);
    const earthWidth=result.assessments[0].chaoticZoneOuterAu-result.assessments[0].chaoticZoneInnerAu;
    const giantWidth=result.assessments[1].chaoticZoneOuterAu-result.assessments[1].chaoticZoneInnerAu;
    expect(giantWidth).toBeGreaterThan(earthWidth);
  });
});

function entry(id:string,kind:any,a:number,e:number){
  return {body:{proceduralId:id,localDesignation:id.slice(0,4)} as any,orbitalElements:new MinorBodyOrbitalElements(kind,id,id.slice(0,4),MinorBodyOrbitConicRegime.ELLIPTIC,1,a,e,2,20,30,10,a*(1-e),a*(1+e),Math.sqrt(a**3))};
}
function hyperbolicEntry(){
  return {body:{proceduralId:ID3,localDesignation:'ISO'} as any,orbitalElements:new MinorBodyOrbitalElements(MinorBodyKind.INTERSTELLAR_OBJECT,ID3,'ISO',MinorBodyOrbitConicRegime.HYPERBOLIC,1,-20,1.1,30,20,10,null,2,null,null)};
}
function planetFixture(planetOrdinal:number,a:number,e:number,massEarth:number):Planet {
  return {planetOrdinal,name:`P${planetOrdinal}`,massEarth,radiusEarth:1,orbit:{semiMajorAxisAu:a,eccentricity:e,inclinationDegrees:0,longitudeOfAscendingNodeDegrees:0,argumentOfPeriapsisDegrees:0}} as unknown as Planet;
}
