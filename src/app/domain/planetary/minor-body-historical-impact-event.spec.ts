import { HistorySeed } from '../seed/hierarchical-seeds';
import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { MinorBodyHistoricalImpactEvent } from './minor-body-historical-impact-event';

function delivery():MinorBodyEarlyDeliveryAssessment {return {
  deliveryScenarioApplicable:true,timeWindowYears:100,conditionalRetainedWaterMassKilograms:20,conditionalRetainedOrganicCarrierMassProxyKilograms:5,
  minorBodyProceduralId:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',minorBodyDesignation:'AST-001',targetName:'P1',
  impactEffectsAssessment:{surfaceResponseRegime:{name:'CRATERING'}},energyAssessment:{kineticEnergyJoules:1e20,consequenceRegime:{name:'GLOBAL'}},
  temporalAssessment:{},impactRiskAssessment:{transition:{}},minorBody:{},targetKind:{code:1},targetPlanet:{},targetMoon:null,
} as unknown as MinorBodyEarlyDeliveryAssessment;}

describe('MinorBodyHistoricalImpactEvent point 23.13',()=>{
  it('should preserve the exact causal assessment and realized conditional payload',()=>{const source=delivery();const e=new MinorBodyHistoricalImpactEvent('0123456789ABCDEFFEDCBA9876543210',source,new HistorySeed('11111111111111111111111111111111'),25,75,.6,20,5);expect(e.deliveryAssessment).toBe(source);expect(e.impactEffectsAssessment).toBe(source.impactEffectsAssessment);expect(e.energyAssessment).toBe(source.energyAssessment);expect(e.yearsAfterWindowStart+e.yearsBeforeWindowEnd).toBe(100);});
  it('should reject expected/statistical payload in place of one realized impact payload',()=>{expect(()=>new MinorBodyHistoricalImpactEvent('0123456789ABCDEFFEDCBA9876543210',delivery(),new HistorySeed('11111111111111111111111111111111'),25,75,.6,40,5)).toThrow(RangeError);});
});
