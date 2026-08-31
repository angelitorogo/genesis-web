import { MinorBodyGiantInfluenceAssessment, minorBodyGiantInfluenceRegimeV1 } from './minor-body-giant-influence-assessment';
import { MinorBodyGiantInfluenceRegime } from './minor-body-giant-influence-regime';

describe('MinorBodyGiantInfluenceAssessment point 23.5',()=>{
  it('should classify bound ejection and unbound deflection without allowing impossible unbound ejection',()=>{
    expect(minorBodyGiantInfluenceRegimeV1(true,0.9,0.8,0.2,0.7)).toBe(MinorBodyGiantInfluenceRegime.EJECTION_CANDIDATE);
    expect(minorBodyGiantInfluenceRegimeV1(false,0.5,0.4,0.2,0)).toBe(MinorBodyGiantInfluenceRegime.UNBOUND_DEFLECTION_CANDIDATE);

    const planet={massEarth:318} as any;
    const resonance={targetPlanet:planet,minorBody:{orbitalElements:{isBound:false}},minorBodyKind:{},minorBodyProceduralId:'A'} as any;
    expect(()=>new MinorBodyGiantInfluenceAssessment(resonance,planet,60,13,2,10,0.9,0.8,0.7,0.1,0.3,MinorBodyGiantInfluenceRegime.UNBOUND_DEFLECTION_CANDIDATE)).toThrow(RangeError);
  });
});
