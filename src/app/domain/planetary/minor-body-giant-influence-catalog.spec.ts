import { MinorBodyGiantInfluenceCatalog } from './minor-body-giant-influence-catalog';

describe('MinorBodyGiantInfluenceCatalog point 23.5',()=>{
  it('should allow a system with no giant planets and therefore no influence matrix',()=>{
    const resonanceCatalog={planets:[{massEarth:1}],orbitalCatalog:{entries:[{}]},assessments:[]} as any;
    const catalog=new MinorBodyGiantInfluenceCatalog(resonanceCatalog,[],[]);
    expect(catalog.giantPlanetCount).toBe(0);
    expect(catalog.assessmentCount).toBe(0);
  });
});
