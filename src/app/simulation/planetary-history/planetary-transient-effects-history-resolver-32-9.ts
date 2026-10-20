import type {
  HistoricalTransientEvent32_9, HistoricalTransientExposure32_9,
  HistoricalTransientResponse32_9, HistoricalTransientRecord32_9,
  PlanetaryTransientEffectsHistoryInput32_9, PlanetaryTransientEffectsHistoryResult32_9,
} from '../../domain/planetary-history/planetary-transient-effects-history-32-9';
import type { PlanetaryHistoryTime32_1, PlanetaryHistorySourceEpisode32_1 } from
  '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const MAX_RECORDS = 100_000;
const YEARS_PER_GYR = 1_000_000_000;
const KINDS = new Set(['SUPERNOVA','NOVA','KILONOVA','GRB','STELLAR_FLARE',
  'MAGNETAR_OUTBURST','COMPACT_MERGER','FRB','OTHER_TRANSIENT']);
const RESPONSES = new Set(['ATMOSPHERIC_IONIZATION','ATMOSPHERIC_ESCAPE',
  'ATMOSPHERIC_PHOTOCHEMISTRY','SURFACE_IRRADIATION','OCEAN_ENERGY_DEPOSITION',
  'OTHER_RESOLVED_RESPONSE']);
const geometries = new Set(['ISOTROPIC_MODEL','DIRECTIONALLY_RESOLVED','UNRESOLVED']);

/**
 * GENESIS 32.9 — STRICT hand-off of ALREADY RESOLVED phase-29 source events,
 * target fluence, and source-backed physical response. This is not a model
 * of GRB beaming, stellar distances, energy transport or planetary biology.
 *
 * In particular, source event !== exposure !== target consequence. No damage
 * or chronological episode is created from a frequency, luminosity, a
 * neighboring supernova, a risk score, or an undated effect.
 */
export class PlanetaryTransientEffectsHistoryResolver32_9 {
  private constructor() {}

  static resolve(input: PlanetaryTransientEffectsHistoryInput32_9): PlanetaryTransientEffectsHistoryResult32_9 {
    const preceding = input?.preceding;
    if (!preceding || preceding.contractVersion !== '32.8-CT0' ||
        preceding.layer !== 'SIMULATED_REALITY' ||
        !['PLANET','MOON'].includes(preceding.bodyKind) ||
        preceding.chronology?.bodyKind !== preceding.bodyKind ||
        preceding.chronology.bodyKey !== preceding.bodyKey ||
        preceding.chronology.time.kind !== 'CURRENT_SNAPSHOT' ||
        preceding.chronology.historicalCompleteness !== 'NOT_ESTABLISHED' ||
        preceding.chronology.lifePresence !== 'NOT_EVALUATED' ||
        !Array.isArray(preceding.sourceEpisodes)) {
      throw new TypeError('32.9 requires the real, canonical 32.8 history for this body.');
    }
    const {bodyKey, bodyKind} = preceding;
    const {multiplicity, time} = preceding.chronology;
    if (!['SINGLE','BINARY','TRIPLE'].includes(multiplicity) ||
        !key(bodyKey) || !finiteAge(time.systemAgeBillionYears)) {
      throw new RangeError('32.9 invalid target identity or CT-0 age.');
    }
    const canonical = PlanetaryHistoryEngine.build({bodyKind,bodyKey,multiplicity,time,
      episodes:preceding.sourceEpisodes});
    if (!equal(canonical, preceding.chronology)) {
      throw new RangeError('32.9 preceding chronology differs from canonical source episodes.');
    }
    const present = canonical.presentYearAfterFormation;
    const events = input.events ?? [];
    const exposures = input.exposures ?? [];
    const responses = input.responses ?? [];
    if (![events,exposures,responses].every(a => Array.isArray(a) && a.length <= MAX_RECORDS) ||
        (input.events === undefined && (exposures.length > 0 || responses.length > 0)) ||
        (input.exposures === undefined && responses.length > 0)) {
      throw new RangeError('32.9 requires bounded event -> exposure -> response source chains.');
    }
    const byEvent = new Map<string,HistoricalTransientEvent32_9>();
    const sourceKeys = new Set<string>();
    for (const event of events) {
      validateEvent(event,present,multiplicity,bodyKey.split('/B')[0]);
      const sourceKey = `${event.sourcePhase}:${event.sourceModel}:${event.sourceRecordKey}`;
      if (byEvent.has(event.eventId) || sourceKeys.has(sourceKey)) {
        throw new RangeError('32.9 duplicate physical event or provenance.');
      }
      byEvent.set(event.eventId,event);
      sourceKeys.add(sourceKey);
    }
    const byExposure = new Map<string,HistoricalTransientExposure32_9>();
    const exposureSources = new Set<string>();
    let targetExposures = 0;
    let unresolved = 0;
    for (const exposure of exposures) {
      if (!byEvent.has(exposure?.eventId)) {
        throw new RangeError('32.9 cannot resolve exposure from a non-existent event.');
      }
      validateExposure(exposure,byEvent.get(exposure.eventId)!);
      const sourceKey = `${exposure.sourceModel}:${exposure.sourceRecordKey}:${exposure.targetBodyKey}`;
      if (byExposure.has(exposure.exposureId) || exposureSources.has(sourceKey)) {
        throw new RangeError('32.9 duplicate target exposure or source provenance.');
      }
      byExposure.set(exposure.exposureId,exposure);
      exposureSources.add(sourceKey);
      if (exposure.targetBodyKind === bodyKind && exposure.targetBodyKey === bodyKey) {
        targetExposures++;
        if (exposure.resolution === 'NOT_EVALUABLE') unresolved++;
      }
    }
    const responseKeys = new Set<string>();
    const responseSources = new Set<string>();
    const physical: HistoricalTransientRecord32_9[] = [];
    const added: PlanetaryHistorySourceEpisode32_1[] = [];
    const prior = new Map(preceding.sourceEpisodes.map(episode=>[episode.episodeKey,episode]));
    for (const response of responses) {
      const exposure = byExposure.get(response?.exposureId);
      if (!exposure) throw new RangeError('32.9 target response is missing its source exposure.');
      validateResponse(response,exposure,present);
      const event = byEvent.get(exposure.eventId)!;
      const sourceKey = `${response.sourceModel}:${response.sourceRecordKey}:${response.targetBodyKey}`;
      if (responseKeys.has(response.responseId) || responseSources.has(sourceKey)) {
        throw new RangeError('32.9 duplicate target response/provenance.');
      }
      responseKeys.add(response.responseId);
      responseSources.add(sourceKey);
      if (event.time && response.time && response.time.startYear < event.time.startYear) {
        throw new RangeError('32.9 a resolved effect cannot precede its known source event.');
      }
      if (response.targetBodyKind !== bodyKind || response.targetBodyKey !== bodyKey) {
        continue; // Other targets' physical responses NEVER appear in this body's history.
      }
      const causeKey = response.causedByEpisodeKey ?? null;
      if (causeKey !== null) {
        const cause = prior.get(causeKey);
        if (!cause || cause.kind !== 'STELLAR_ENVIRONMENT_CHANGE' ||
            cause.source.sourceRecordKey !== event.sourceRecordKey ||
            !response.time || cause.time.startYear > response.time.startYear) {
          throw new RangeError('32.9 causal stellar link must identify the same physically resolved source.');
        }
      }
      // validateResponse guarantees actual resolved exposure, nonzero received fluence,
      // and a source-backed response on exactly the same target.
      physical.push(Object.freeze({
        responseId: response.responseId, sourceEventId:event.eventId,
        sourceEventKind:event.kind, exposureId:exposure.exposureId,
        targetBodyKind:bodyKind,targetBodyKey:bodyKey,
        sourceComponent:event.sourceLocation.hostComponent,
        distanceMeters:exposure.distanceMeters!,
        emissionGeometry:exposure.emissionGeometry as 'ISOTROPIC_MODEL'|'DIRECTIONALLY_RESOLVED',
        receivedFluenceJoulesPerSquareMeter:exposure.receivedFluenceJoulesPerSquareMeter!,
        responseKind:response.responseKind, responseIndex01:response.responseIndex01,
        responseSourceModel:response.sourceModel,
        dateStatus:response.time ? 'DATED_FROM_RESOLVED_RESPONSE':'RESPONSE_DATE_NOT_RESOLVED',
        time:response.time ? Object.freeze({...response.time}) : null,
        climateTemperatureChangeKelvin:null,atmosphericMassChangeKilograms:null,
        biologicalEffect:'NOT_EVALUATED',
      }));
      if (response.time) added.push(Object.freeze({
        episodeKey:`transient-effect:${response.responseId}`,targetBodyKind:bodyKind,
        targetBodyKey:bodyKey,kind:'RESOLVED_TRANSIENT_EFFECT',
        time:Object.freeze({...response.time}),
        source:Object.freeze({sourcePhase:event.sourcePhase,sourceModel:response.sourceModel,
          sourceRecordKey:response.sourceRecordKey,evidenceKind:'RESOLVED_PHYSICAL_EVENT'}),
        causedByEpisodeKeys:Object.freeze(causeKey ? [causeKey] : []),
      }));
    }
    physical.sort((a,b)=>(a.time?.startYear ?? Number.POSITIVE_INFINITY) -
      (b.time?.startYear ?? Number.POSITIVE_INFINITY) || compare(a.responseId,b.responseId));
    const sourceEpisodes = Object.freeze([...preceding.sourceEpisodes,...added]);
    const chronology = PlanetaryHistoryEngine.build({bodyKind,bodyKey,multiplicity,time,
      episodes:sourceEpisodes});
    return Object.freeze({
      contractVersion:'32.9-CT0',layer:'SIMULATED_REALITY',bodyKind,bodyKey,
      sourceCoverage:input.events === undefined ? 'NOT_SUPPLIED':'SUPPLIED_RECORDS_ONLY',
      eventCount:events.length,exposureCount:targetExposures,
      unresolvedExposureCount:unresolved,
      responses:Object.freeze(physical),sourceEpisodes,chronology,
      historicalCompleteness:'NOT_ESTABLISHED',lifePresence:'NOT_EVALUATED',
    });
  }
}

function validateEvent(event: HistoricalTransientEvent32_9, present: number|null,
  multiplicity: string, systemKey:string):void {
  if (!event || !key(event.eventId) || !KINDS.has(event.kind) ||
      event.realization !== 'RESOLVED_PHYSICAL_EVENT' ||
      typeof event.sourcePhase !== 'string' || !/^29\.(?:[1-9])(?:[a-z](?:\.\d+)?)?$/i.test(event.sourcePhase) ||
      !key(event.sourceModel) || !key(event.sourceRecordKey) ||
      !event.sourceLocation ||
      !['HOST_COMPONENT','EXTERNAL_SOURCE'].includes(event.sourceLocation.kind)) {
    throw new RangeError('32.9 requires a genuinely resolved phase-29 source event.');
  }
  const loc = event.sourceLocation;
  if (loc.kind === 'HOST_COMPONENT' ?
      (loc.externalSourceKey !== null || loc.sourceSystemKey !== systemKey ||
       !['A','B','C'].includes(loc.hostComponent ?? '') ||
       (multiplicity === 'SINGLE' && loc.hostComponent !== 'A') ||
       (multiplicity === 'BINARY' && loc.hostComponent === 'C')) :
      (loc.hostComponent !== null || loc.sourceSystemKey !== null || !key(loc.externalSourceKey))) {
    throw new RangeError('32.9 source stellar component or external identity is invalid.');
  }
  if (event.time !== null) validTime(event.time,present,'source event');
}

function validateExposure(exposure: HistoricalTransientExposure32_9,
  event: HistoricalTransientEvent32_9):void {
  if (!exposure || !key(exposure.exposureId) ||
      !['PLANET','MOON'].includes(exposure.targetBodyKind) ||
      !key(exposure.targetBodyKey) || !key(exposure.sourceModel) ||
      !key(exposure.sourceRecordKey) || !geometries.has(exposure.emissionGeometry) ||
      !['RESOLVED_TARGET_EXPOSURE','NOT_EVALUABLE'].includes(exposure.resolution)) {
    throw new RangeError('32.9 invalid target exposure.');
  }
  if (exposure.resolution === 'NOT_EVALUABLE') {
    if (exposure.distanceMeters !== null || exposure.receivedFluenceJoulesPerSquareMeter !== null ||
        exposure.emissionGeometry !== 'UNRESOLVED' || exposure.beamIntersectsTarget !== null) {
      throw new RangeError('32.9 unknown exposure cannot contain invented physical values.');
    }
    return;
  }
  if (!positive(exposure.distanceMeters) || !nonnegative(exposure.receivedFluenceJoulesPerSquareMeter) ||
      exposure.emissionGeometry === 'UNRESOLVED' ||
      (exposure.emissionGeometry === 'ISOTROPIC_MODEL' && exposure.beamIntersectsTarget !== null) ||
      (exposure.emissionGeometry === 'DIRECTIONALLY_RESOLVED' &&
       (typeof exposure.beamIntersectsTarget !== 'boolean' ||
        (exposure.beamIntersectsTarget === false && exposure.receivedFluenceJoulesPerSquareMeter! > 0))) ||
      (event.kind === 'GRB' && exposure.emissionGeometry !== 'DIRECTIONALLY_RESOLVED')) {
    throw new RangeError('32.9 requires physically resolved distance, beam and received fluence.');
  }
}

function validateResponse(response: HistoricalTransientResponse32_9,
  exposure: HistoricalTransientExposure32_9,present: number|null):void {
  if (!response || !key(response.responseId) ||
      response.targetBodyKind !== exposure.targetBodyKind ||
      response.targetBodyKey !== exposure.targetBodyKey ||
      !RESPONSES.has(response.responseKind) || !key(response.sourceModel) ||
      !key(response.sourceRecordKey) || response.realization !== 'RESOLVED_PHYSICAL_RESPONSE' ||
      !Number.isFinite(response.responseIndex01) || response.responseIndex01 <= 0 ||
      response.responseIndex01 > 1 || exposure.resolution !== 'RESOLVED_TARGET_EXPOSURE' ||
      !positive(exposure.receivedFluenceJoulesPerSquareMeter) ||
      (exposure.emissionGeometry === 'DIRECTIONALLY_RESOLVED' &&
       exposure.beamIntersectsTarget !== true) ||
      (response.causedByEpisodeKey != null && !key(response.causedByEpisodeKey))) {
    throw new RangeError('32.9 physical consequence requires resolved nonzero exposure on same body.');
  }
  if (response.time !== null) validTime(response.time,present,'physical response');
}
function validTime(t:PlanetaryHistoryTime32_1,present:number|null,what:string):void {
  if (!t || t.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
      present === null || !Number.isSafeInteger(t.startYear) || !Number.isSafeInteger(t.endYear) ||
      t.startYear < 0 || t.endYear < t.startYear || t.endYear > present ||
      !['MODELLED_INSTANT','MODELLED_INTERVAL'].includes(t.resolution) ||
      (t.startYear === t.endYear) !== (t.resolution === 'MODELLED_INSTANT')) {
    throw new RangeError(`32.9 invalid CT-0 date for ${what}.`);
  }
}
function key(s:unknown):s is string {
  return typeof s === 'string' && s.length > 0 && s.trim() === s && !s.includes('\0');
}
function finiteAge(n:number|null):boolean{return n===null || (Number.isFinite(n) && n>=0 &&
  Number.isSafeInteger(Math.round(n*YEARS_PER_GYR)));}
function nonnegative(n:number|null):boolean{return n!==null && Number.isFinite(n) && n>=0;}
function positive(n:number|null):boolean{return n!==null && Number.isFinite(n) && n>0;}
function compare(a:string,b:string):number{return a<b?-1:a>b?1:0;}
function equal(a:unknown,b:unknown):boolean{return JSON.stringify(a)===JSON.stringify(b);}
