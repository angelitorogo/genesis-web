import { type FormationCollisionMoonOriginCatalog } from './formation-collision-moon-origin-catalog';
import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { type MinorBodyEarlyDeliveryCatalog } from './minor-body-early-delivery-catalog';
import { MinorBodyHistoricalImpactRealization } from './minor-body-historical-impact-realization';
import { PlanetaryImpactHistoryCatalog } from './planetary-impact-history-catalog';
import { type PlanetarySystem } from './planetary-system';

describe('PlanetaryImpactHistoryCatalog point 23.13',()=>{it('should preserve one realization per unique minor body and retain point-23.12 formation collisions',()=>{
  const system={} as unknown as PlanetarySystem;const assessment={minorBodyProceduralId:'A'.repeat(32),timeWindowYears:100,temporalAssessment:{isSinglePassage:false},expectedImpactCount:0,temporalImpactProbability01:0} as unknown as MinorBodyEarlyDeliveryAssessment;
  const early={assessments:[assessment],impactEffectsCatalog:{impactEnergyCatalog:{temporalImpactProbabilityCatalog:{timeWindowYears:100}}}} as unknown as MinorBodyEarlyDeliveryCatalog;
  const formation={planetarySystem:system,collisionCount:2,forPlanet:()=>[]} as unknown as FormationCollisionMoonOriginCatalog;
  const r=new MinorBodyHistoricalImpactRealization(assessment.minorBodyProceduralId,[assessment],false,0,0,null,null,null,null);
  const c=new PlanetaryImpactHistoryCatalog(system,early,formation,[r],[]);expect(c.minorBodyCount).toBe(1);expect(c.traceableFormationCollisionCount).toBe(2);expect(c.totalTraceablePhysicalImpactCauseCount).toBe(2);expect(c.hasCompletePhysicalTraceability).toBe(true);
});});
