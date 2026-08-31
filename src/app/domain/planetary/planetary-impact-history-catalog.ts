import { MinorBodyApproachTargetKind } from './minor-body-approach-target-kind';
import { type FormationCollisionMoonOriginCatalog } from './formation-collision-moon-origin-catalog';
import { type MinorBodyEarlyDeliveryAssessment } from './minor-body-early-delivery-assessment';
import { type MinorBodyEarlyDeliveryCatalog } from './minor-body-early-delivery-catalog';
import { type MinorBodyHistoricalImpactEvent } from './minor-body-historical-impact-event';
import { type MinorBodyHistoricalImpactRealization } from './minor-body-historical-impact-realization';
import { type PlanetarySystem } from './planetary-system';

/**
 * Point-23.13 authoritative causal impact-history projection for one planetary
 * system. Formation collisions come from 17.5 -> 23.12; minor-body historical
 * events come from the exact 23.6 -> 23.11 impact chain.
 */
export class PlanetaryImpactHistoryCatalog {
  readonly minorBodyRealizations:readonly MinorBodyHistoricalImpactRealization[];
  readonly historicalMinorBodyImpactEvents:readonly MinorBodyHistoricalImpactEvent[];

  constructor(
    readonly planetarySystem:PlanetarySystem,
    readonly earlyDeliveryCatalog:MinorBodyEarlyDeliveryCatalog,
    readonly formationCollisionMoonOriginCatalog:FormationCollisionMoonOriginCatalog,
    realizations:readonly MinorBodyHistoricalImpactRealization[],
    events:readonly MinorBodyHistoricalImpactEvent[],
  ) {
    if(formationCollisionMoonOriginCatalog.planetarySystem!==planetarySystem) {
      throw new RangeError('Point-23.13 formation-collision history must belong to the supplied PlanetarySystem.');
    }
    this.minorBodyRealizations=Object.freeze([...realizations]);
    this.historicalMinorBodyImpactEvents=Object.freeze([...events]);

    const expectedGroups=groupAssessmentsByMinorBodyV1(earlyDeliveryCatalog);
    if(this.minorBodyRealizations.length!==expectedGroups.length) {
      throw new RangeError('Point-23.13 requires exactly one competing-risk realization per point-23.11 minor body.');
    }
    for(let index=0;index<expectedGroups.length;index+=1) {
      const group=expectedGroups[index];
      const realization=this.minorBodyRealizations[index];
      if(realization.minorBodyProceduralId!==group.id||realization.sourceAssessments.length!==group.assessments.length) {
        throw new RangeError('Point-23.13 must preserve point-23.11 first-appearance minor-body ordering/group coverage.');
      }
      for(let sourceIndex=0;sourceIndex<group.assessments.length;sourceIndex+=1) {
        if(realization.sourceAssessments[sourceIndex]!==group.assessments[sourceIndex]) {
          throw new RangeError('Point-23.13 realization must preserve exact point-23.11 assessment references/order.');
        }
      }
    }

    const expectedEvents=this.minorBodyRealizations.map(item=>item.event).filter((item):item is MinorBodyHistoricalImpactEvent=>item!==null)
      .sort(compareEventsV1);
    if(expectedEvents.length!==this.historicalMinorBodyImpactEvents.length) throw new RangeError('Point-23.13 event list must contain every and only realized minor-body impact.');
    for(let index=0;index<expectedEvents.length;index+=1) {
      if(this.historicalMinorBodyImpactEvents[index]!==expectedEvents[index]) throw new RangeError('Point-23.13 historical events must be chronologically ordered with stable eventId tie-breaks.');
    }
    const uniqueBodies=new Set(this.historicalMinorBodyImpactEvents.map(event=>event.minorBodyProceduralId));
    if(uniqueBodies.size!==this.historicalMinorBodyImpactEvents.length) throw new RangeError('One minor body cannot generate multiple realized historical impacts in point 23.13.');
    for(const event of this.historicalMinorBodyImpactEvents) {
      if(event.targetPlanet.hostPlanetarySystem!==planetarySystem) throw new RangeError('Point-23.13 historical impact target must belong to the supplied PlanetarySystem.');
    }
  }

  get timeWindowYears(){return this.earlyDeliveryCatalog.impactEffectsCatalog.impactEnergyCatalog.temporalImpactProbabilityCatalog.timeWindowYears;}
  get minorBodyCount(){return this.minorBodyRealizations.length;}
  get historicalMinorBodyImpactCount(){return this.historicalMinorBodyImpactEvents.length;}
  get noHistoricalMinorBodyImpactCount(){return this.minorBodyRealizations.filter(item=>!item.realized).length;}
  get planetImpactCount(){return this.historicalMinorBodyImpactEvents.filter(item=>item.targetKind===MinorBodyApproachTargetKind.PLANET).length;}
  get moonImpactCount(){return this.historicalMinorBodyImpactEvents.filter(item=>item.targetKind===MinorBodyApproachTargetKind.MOON).length;}
  get traceableFormationCollisionCount(){return this.formationCollisionMoonOriginCatalog.collisionCount;}
  get totalTraceablePhysicalImpactCauseCount(){return this.traceableFormationCollisionCount+this.historicalMinorBodyImpactCount;}
  get realizedRetainedWaterMassKilograms(){return this.historicalMinorBodyImpactEvents.reduce((sum,item)=>sum+item.realizedRetainedWaterMassKilograms,0);}
  get realizedRetainedOrganicCarrierMassProxyKilograms(){return this.historicalMinorBodyImpactEvents.reduce((sum,item)=>sum+item.realizedRetainedOrganicCarrierMassProxyKilograms,0);}
  get hasCompletePhysicalTraceability(){return true;}
  forMinorBody(proceduralId:string){return this.minorBodyRealizations.find(item=>item.minorBodyProceduralId===proceduralId)??null;}
  minorBodyEventsForPlanet(planetOrdinal:number){return Object.freeze(this.historicalMinorBodyImpactEvents.filter(item=>item.targetPlanet.planetOrdinal===planetOrdinal));}
  formationCollisionsForPlanet(planetOrdinal:number){return this.formationCollisionMoonOriginCatalog.forPlanet(planetOrdinal);}
}

export function groupAssessmentsByMinorBodyV1(catalog:MinorBodyEarlyDeliveryCatalog):readonly {readonly id:string;readonly assessments:readonly MinorBodyEarlyDeliveryAssessment[]}[] {
  const groups:{id:string;assessments:MinorBodyEarlyDeliveryAssessment[]}[]=[];
  const byId=new Map<string,{id:string;assessments:MinorBodyEarlyDeliveryAssessment[]}>();
  for(const assessment of catalog.assessments) {
    let group=byId.get(assessment.minorBodyProceduralId);
    if(group===undefined) {group={id:assessment.minorBodyProceduralId,assessments:[]};byId.set(group.id,group);groups.push(group);}
    group.assessments.push(assessment);
  }
  return Object.freeze(groups.map(group=>Object.freeze({id:group.id,assessments:Object.freeze([...group.assessments])})));
}

function compareEventsV1(left:MinorBodyHistoricalImpactEvent,right:MinorBodyHistoricalImpactEvent):number {
  return left.yearsAfterWindowStart-right.yearsAfterWindowStart||left.eventId.localeCompare(right.eventId);
}
