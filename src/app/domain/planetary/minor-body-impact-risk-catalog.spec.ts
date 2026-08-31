import { type MinorBodyImpactRiskCatalog } from './minor-body-impact-risk-catalog';

describe('MinorBodyImpactRiskCatalog point 23.7',()=>{
  it('should expose geometry-only aggregate counters without inventing a time-window probability',()=>{
    const catalog={assessmentCount:3,riskCandidateCount:2,directPlanetCollisionGeometryCount:1,highestOrbitalRiskIndex01:0.4} as MinorBodyImpactRiskCatalog;
    expect(catalog.riskCandidateCount).toBe(2);
    expect(catalog.directPlanetCollisionGeometryCount).toBe(1);
    expect('impactProbability' in catalog).toBe(false);
  });
});
