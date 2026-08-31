import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { type FormationCollisionMoonOriginCatalog } from '../../domain/planetary/formation-collision-moon-origin-catalog';
import { type MinorBodyEarlyDeliveryAssessment } from '../../domain/planetary/minor-body-early-delivery-assessment';
import { type MinorBodyEarlyDeliveryCatalog } from '../../domain/planetary/minor-body-early-delivery-catalog';
import { MinorBodyHistoricalImpactEvent } from '../../domain/planetary/minor-body-historical-impact-event';
import {
  historicalImpactAggregateV1,
  historicalImpactProbabilityV1,
  historicalImpactSelectedAssessmentV1,
  historicalImpactTimeYearsAfterWindowStartV1,
  MinorBodyHistoricalImpactRealization,
} from '../../domain/planetary/minor-body-historical-impact-realization';
import { groupAssessmentsByMinorBodyV1, PlanetaryImpactHistoryCatalog } from '../../domain/planetary/planetary-impact-history-catalog';
import { type PlanetarySystem } from '../../domain/planetary/planetary-system';
import { SeedDeriver } from '../seed/seed-deriver';

const REALIZATION_DOMAIN=utf8ToBytes('GENESIS-P23.13-HISTORICAL-IMPACT-REALIZATION-V1');
const EVENT_ID_DOMAIN=utf8ToBytes('GENESIS-P23.13-HISTORICAL-IMPACT-EVENT-ID-V1');

/**
 * Point-23.13 deterministic history realizer.
 *
 * Point 23.8 probabilities are interpreted retrospectively over their already
 * frozen finite window. One domain-separated SHA-256 realization digest is used
 * per minor body with non-zero competing risk. If an impact is realized, the
 * existing host BodySeed -> HistorySeed hierarchy anchors it in target history
 * and a second SHA-256 digest gives the stable 128-bit event id. No PRNG draws or
 * new seed type/level are introduced.
 */
export class HistoricalImpactRealizationEngine {
  private constructor() {}

  static generate(
    planetarySystem:PlanetarySystem,
    earlyDeliveryCatalog:MinorBodyEarlyDeliveryCatalog,
    formationCollisionMoonOriginCatalog:FormationCollisionMoonOriginCatalog,
  ):PlanetaryImpactHistoryCatalog {
    assertInputConsistencyV1(planetarySystem,earlyDeliveryCatalog,formationCollisionMoonOriginCatalog);
    const groups=groupAssessmentsByMinorBodyV1(earlyDeliveryCatalog);
    const realizations=groups.map(group=>realizationV1(planetarySystem,group.id,group.assessments));
    const events=realizations.map(item=>item.event).filter((item):item is MinorBodyHistoricalImpactEvent=>item!==null)
      .sort((left,right)=>left.yearsAfterWindowStart-right.yearsAfterWindowStart||left.eventId.localeCompare(right.eventId));
    return new PlanetaryImpactHistoryCatalog(planetarySystem,earlyDeliveryCatalog,formationCollisionMoonOriginCatalog,realizations,events);
  }
}

function realizationV1(
  planetarySystem:PlanetarySystem,
  proceduralId:string,
  assessments:readonly MinorBodyEarlyDeliveryAssessment[],
):MinorBodyHistoricalImpactRealization {
  const singlePassage=assessments[0].temporalAssessment.isSinglePassage;
  const aggregate=historicalImpactAggregateV1(assessments,singlePassage);
  const probability=historicalImpactProbabilityV1(aggregate,singlePassage);
  if(probability===0) return new MinorBodyHistoricalImpactRealization(proceduralId,assessments,singlePassage,aggregate,0,null,null,null,null);

  const samples=realizationSamplesV1(planetarySystem,proceduralId);
  if(samples.realization>=probability) {
    return new MinorBodyHistoricalImpactRealization(proceduralId,assessments,singlePassage,aggregate,probability,samples.realization,samples.target,samples.timing,null);
  }

  const selected=historicalImpactSelectedAssessmentV1(assessments,singlePassage,samples.target);
  const source=selected.assessment;
  const yearsAfter=historicalImpactTimeYearsAfterWindowStartV1(source.timeWindowYears,singlePassage,aggregate,probability,samples.timing);
  const historySeed=SeedDeriver.history(source.targetPlanet.seed);
  const event=new MinorBodyHistoricalImpactEvent(
    eventIdV1(planetarySystem,source,historySeed.normalizedValue),source,historySeed,yearsAfter,source.timeWindowYears-yearsAfter,selected.weight01,
    requiredNonNegative(source.conditionalRetainedWaterMassKilograms,'conditionalRetainedWaterMassKilograms'),
    requiredNonNegative(source.conditionalRetainedOrganicCarrierMassProxyKilograms,'conditionalRetainedOrganicCarrierMassProxyKilograms'),
  );
  return new MinorBodyHistoricalImpactRealization(proceduralId,assessments,singlePassage,aggregate,probability,samples.realization,samples.target,samples.timing,event);
}

function realizationSamplesV1(planetarySystem:PlanetarySystem,proceduralId:string):{readonly realization:number;readonly target:number;readonly timing:number} {
  const digest=sha256.create().update(REALIZATION_DOMAIN).update(hexToBytes(planetarySystem.seed.normalizedValue)).update(hexToBytes(proceduralId)).digest();
  return Object.freeze({realization:fraction48(digest,0),target:fraction48(digest,6),timing:fraction48(digest,12)});
}

function eventIdV1(planetarySystem:PlanetarySystem,source:MinorBodyEarlyDeliveryAssessment,historySeedHex:string):string {
  const targetSeed=source.targetMoon?.seed.normalizedValue??source.targetPlanet.seed.normalizedValue;
  const digest=sha256.create().update(EVENT_ID_DOMAIN).update(hexToBytes(planetarySystem.seed.normalizedValue))
    .update(hexToBytes(historySeedHex)).update(hexToBytes(source.minorBodyProceduralId)).update(Uint8Array.of(source.targetKind.code))
    .update(hexToBytes(targetSeed)).digest();
  return bytesToHex(digest.slice(0,16)).toUpperCase();
}

function fraction48(bytes:Uint8Array,offset:number):number {
  let value=0;
  for(let index=0;index<6;index+=1) value=value*256+bytes[offset+index];
  return value/281_474_976_710_656;
}

function assertInputConsistencyV1(
  planetarySystem:PlanetarySystem,
  earlyDeliveryCatalog:MinorBodyEarlyDeliveryCatalog,
  formationCatalog:FormationCollisionMoonOriginCatalog,
):void {
  if(formationCatalog.planetarySystem!==planetarySystem) throw new RangeError('Point-23.13 formation-collision catalog must belong to the supplied PlanetarySystem.');
  const window=earlyDeliveryCatalog.impactEffectsCatalog.impactEnergyCatalog.temporalImpactProbabilityCatalog.timeWindowYears;
  if(!Number.isFinite(window)||window<=0) throw new RangeError('Point-23.13 requires the positive frozen point-23.8 time window.');
  for(const assessment of earlyDeliveryCatalog.assessments) {
    if(assessment.targetPlanet.hostPlanetarySystem!==planetarySystem) throw new RangeError('Every point-23.13 minor-body target must belong to the supplied PlanetarySystem.');
    if(assessment.targetMoon!==null&&assessment.targetMoon.hostPlanetOrdinal!==assessment.targetPlanet.planetOrdinal) {
      throw new RangeError('Point-23.13 moon impact targets must preserve their exact host planet.');
    }
    if(assessment.timeWindowYears!==window) throw new RangeError('Point-23.13 requires one shared point-23.8 retrospective window.');
  }
}

function requiredNonNegative(value:number|null,name:string):number {
  if(value===null||!Number.isFinite(value)||value<0) throw new RangeError(`${name} must be finite and >= 0.`);
  return value;
}
