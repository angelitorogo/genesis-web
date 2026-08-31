import { BodySeed, SystemSeed } from '../../domain/seed/hierarchical-seeds';
import { type FormationCollisionMoonOriginCatalog } from '../../domain/planetary/formation-collision-moon-origin-catalog';
import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import { type MinorBodyEarlyDeliveryAssessment } from '../../domain/planetary/minor-body-early-delivery-assessment';
import { type MinorBodyEarlyDeliveryCatalog } from '../../domain/planetary/minor-body-early-delivery-catalog';
import { type Planet } from '../../domain/planetary/planet';
import { type PlanetarySystem } from '../../domain/planetary/planetary-system';
import { HistoricalImpactRealizationEngine } from './historical-impact-realization-engine';
import { MinorBodyDynamicsEngine } from './minor-body-dynamics-engine';

const ID='AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

describe('HistoricalImpactRealizationEngine point 23.13',()=>{
  it('should realize at most one impact per minor body across competing planet targets and remain deterministic',()=>{const f=fixture([20,30]);const first=HistoricalImpactRealizationEngine.generate(f.system,f.early,f.formation);const second=HistoricalImpactRealizationEngine.generate(f.system,f.early,f.formation);expect(first.historicalMinorBodyImpactCount).toBe(1);expect(first.historicalMinorBodyImpactEvents[0].minorBodyProceduralId).toBe(ID);expect(first.historicalMinorBodyImpactEvents[0].eventId).toBe(second.historicalMinorBodyImpactEvents[0].eventId);expect(first.historicalMinorBodyImpactEvents[0].yearsAfterWindowStart).toBe(second.historicalMinorBodyImpactEvents[0].yearsAfterWindowStart);expect(first.historicalMinorBodyImpactEvents[0].targetHistorySeed.kind).toBe('history');});
  it('should consume no realization samples when all target probabilities are zero',()=>{const f=fixture([0,0]);const c=HistoricalImpactRealizationEngine.generate(f.system,f.early,f.formation);expect(c.historicalMinorBodyImpactCount).toBe(0);expect(c.minorBodyRealizations[0].realizationSample01).toBeNull();});
  it('should preserve the full 23.11 -> 23.6 causal chain on a realized event',()=>{const f=fixture([20]);const event=HistoricalImpactRealizationEngine.generate(f.system,f.early,f.formation).historicalMinorBodyImpactEvents[0];expect(event.deliveryAssessment).toBe(f.assessments[0]);expect(event.orbitalTransition).toBe(f.transition);expect(event.realizedRetainedWaterMassKilograms).toBe(10);});
  it('should expose the same history through the phase-23 coordinator',()=>{const f=fixture([20]);const direct=HistoricalImpactRealizationEngine.generate(f.system,f.early,f.formation);const coordinated=MinorBodyDynamicsEngine.impactHistory(f.system,f.early,f.formation);expect(coordinated.historicalMinorBodyImpactEvents[0].eventId).toBe(direct.historicalMinorBodyImpactEvents[0].eventId);});
});

function fixture(lambdas:readonly number[]){
  const system={seed:new SystemSeed('0123456789ABCDEFFEDCBA9876543210')} as unknown as PlanetarySystem;
  const planets=lambdas.map((_,i)=>({planetOrdinal:i+1,name:`P${i+1}`,seed:new BodySeed(String(i+1).repeat(32)),hostPlanetarySystem:system}) as unknown as Planet);
  const transition={minorBody:{body:{proceduralId:ID}}};
  const assessments=lambdas.map((lambda,i)=>({
    deliveryScenarioApplicable:lambda>0,minorBodyProceduralId:ID,minorBodyDesignation:'AST-001',targetKind:MinorBodyApproachTargetKind.PLANET,targetPlanet:planets[i],targetMoon:null,targetName:planets[i].name,
    timeWindowYears:100,expectedImpactCount:lambda,temporalImpactProbability01:lambda>0?1-Math.exp(-lambda):0,
    temporalAssessment:{isSinglePassage:false,expectedImpactCount:lambda},impactRiskAssessment:{transition},impactEffectsAssessment:{},energyAssessment:{},minorBody:{},
    conditionalRetainedWaterMassKilograms:lambda>0?10:null,conditionalRetainedOrganicCarrierMassProxyKilograms:lambda>0?2:null,
  }) as unknown as MinorBodyEarlyDeliveryAssessment);
  const early={assessments,impactEffectsCatalog:{impactEnergyCatalog:{temporalImpactProbabilityCatalog:{timeWindowYears:100}}}} as unknown as MinorBodyEarlyDeliveryCatalog;
  const formation={planetarySystem:system,collisionCount:0,forPlanet:()=>[]} as unknown as FormationCollisionMoonOriginCatalog;
  return {system,early,formation,assessments,transition};
}
