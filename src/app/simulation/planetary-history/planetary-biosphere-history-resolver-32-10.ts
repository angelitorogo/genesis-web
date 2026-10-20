import type {
  BiologicalHistoricalRecord32_10,
  EnvironmentalRecoveryMetric32_10,
  EnvironmentalRecoveryRecord32_10,
  PlanetaryBiosphereHistoryInput32_10,
  PlanetaryBiosphereHistoryResult32_10,
  ResolvedBiologicalHistoryEvent32_10,
  ResolvedBiospherePresence32_10,
  ResolvedEnvironmentalRecoveryEvidence32_10,
} from '../../domain/planetary-history/planetary-biosphere-history-32-10';
import type {
  PlanetaryHistorySourceEpisode32_1,
  PlanetaryHistoryTime32_1,
} from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const MAX_RECORDS = 100_000;
const PHYSICAL_CAUSES = new Set([
  'REALIZED_IMPACT', 'RESOLVED_TRANSIENT_EFFECT', 'VOLCANIC_EPISODE',
  'GLACIATION_TRANSITION', 'CLIMATE_GEOCHEMISTRY_TRANSITION',
  'ATMOSPHERE_TRANSITION', 'WATER_RESERVOIR_TRANSITION',
]);
const METRICS = new Set<EnvironmentalRecoveryMetric32_10>([
  'MEAN_SURFACE_TEMPERATURE_K', 'GAS_PRESSURE_PA',
  'LIQUID_WATER_COVERAGE_01', 'ICE_COVERAGE_01',
]);

/**
 * GENESIS 32.10 — Conservation of source-backed biological/physical history.
 * This phase cannot create a biosphere, extinction, recovery or missing date.
 * No statistical catastrophe index, habitat score or observed knowledge is
 * considered evidence for an actual biological outcome.
 */
export class PlanetaryBiosphereHistoryResolver32_10 {
  private constructor() {}

  static resolve(input: PlanetaryBiosphereHistoryInput32_10): PlanetaryBiosphereHistoryResult32_10 {
    const prior = input?.preceding;
    if (!prior || prior.contractVersion !== '32.9-CT0' ||
        prior.layer !== 'SIMULATED_REALITY' ||
        !['PLANET', 'MOON'].includes(prior.bodyKind) || !validKey(prior.bodyKey) ||
        !Array.isArray(prior.sourceEpisodes) ||
        prior.chronology?.bodyKind !== prior.bodyKind ||
        prior.chronology?.bodyKey !== prior.bodyKey ||
        prior.chronology?.lifePresence !== 'NOT_EVALUATED' ||
        prior.chronology?.historicalCompleteness !== 'NOT_ESTABLISHED' ||
        prior.historicalCompleteness !== 'NOT_ESTABLISHED' ||
        prior.lifePresence !== 'NOT_EVALUATED') {
      throw new TypeError('32.10 requires canonical physical history through 32.9.');
    }
    const {bodyKind, bodyKey, sourceEpisodes} = prior;
    const {multiplicity, time} = prior.chronology;
    const canonical = PlanetaryHistoryEngine.build({bodyKind, bodyKey, multiplicity, time,
      episodes:sourceEpisodes});
    if (JSON.stringify(canonical) !== JSON.stringify(prior.chronology)) {
      throw new RangeError('32.10 rejects altered or mismatched physical CT-0 history.');
    }
    const present = canonical.presentYearAfterFormation;
    const episodes = new Map<string, PlanetaryHistorySourceEpisode32_1>();
    const episodeIds = new Map<string,string>();
    for (const episode of sourceEpisodes) episodes.set(episode.episodeKey,episode);
    for (const episode of canonical.episodes) episodeIds.set(episode.episodeKey,episode.episodeId);

    const biological = input.biologicalEvents ?? [];
    const environmental = input.environmentalRecoveries ?? [];
    if (!Array.isArray(biological) || biological.length > MAX_RECORDS ||
        !Array.isArray(environmental) || environmental.length > MAX_RECORDS) {
      throw new RangeError('32.10 requires bounded biological and environmental source lists.');
    }
    const biosphere = input.biosphere ?? null;
    if (biosphere !== null) validateBiosphere(biosphere,bodyKind,bodyKey,present);
    if (biological.length > 0 && !biosphere) {
      throw new RangeError('An actual extinction/recovery requires an independently resolved prior biosphere.');
    }

    const byEvent = new Map<string,ResolvedBiologicalHistoryEvent32_10>();
    const eventSources = new Set<string>();
    for (const event of biological) {
      validateBiologicalEvent(event,biosphere,bodyKind,bodyKey,present,episodes);
      const sourceId = tuple(event.sourcePhase,event.sourceModel,event.sourceRecordKey);
      if (byEvent.has(event.eventId) || eventSources.has(sourceId)) {
        throw new RangeError('Duplicate resolved biological event or scientific provenance.');
      }
      byEvent.set(event.eventId,event);
      eventSources.add(sourceId);
    }
    const records:BiologicalHistoricalRecord32_10[] = [];
    for (const event of biological) {
      if (event.kind === 'MASS_EXTINCTION') {
        if (event.causedByExtinctionEventId !== null) {
          throw new RangeError('A mass extinction cannot pretend to be a recovery link.');
        }
      } else {
        const extinction = byEvent.get(event.causedByExtinctionEventId ?? '');
        if (!extinction || extinction.kind !== 'MASS_EXTINCTION' ||
            event.time.startYear < extinction.time.endYear ||
            (event.time.startYear === extinction.time.startYear)) {
          throw new RangeError('Biotic recovery requires a preceding resolved extinction for this biosphere.');
        }
      }
      records.push(Object.freeze({
        eventId:event.eventId, kind:event.kind, time:Object.freeze({...event.time}),
        sourcePhase:event.sourcePhase,sourceModel:event.sourceModel,
        sourceRecordKey:event.sourceRecordKey,
        causedByPhysicalEpisodeId:event.causedByPhysicalEpisodeKey === null ? null :
          episodeIds.get(event.causedByPhysicalEpisodeKey)!,
        causedByExtinctionEventId:event.causedByExtinctionEventId,
        lossFraction:null,recoveryDurationYears:null,
      }));
    }
    records.sort((a,b)=>a.time.startYear-b.time.startYear ||
      a.time.endYear-b.time.endYear || cmp(a.eventId,b.eventId));

    const recoveryIds = new Set<string>();
    const recoverySources = new Set<string>();
    const physicalRecoveries:EnvironmentalRecoveryRecord32_10[]=[];
    for (const recovery of environmental) {
      const cause = episodes.get(recovery?.disturbanceEpisodeKey);
      validateEnvironmentalRecovery(recovery,cause,bodyKind,bodyKey,present);
      const sourceId = tuple(recovery.sourcePhase,recovery.sourceModel,recovery.sourceRecordKey);
      if (recoveryIds.has(recovery.recordId) || recoverySources.has(sourceId)) {
        throw new RangeError('Duplicate physical environmental recovery or provenance.');
      }
      recoveryIds.add(recovery.recordId);
      recoverySources.add(sourceId);
      const excursion = Math.abs(recovery.disturbed.value-recovery.before.value);
      const returned = (excursion-Math.abs(recovery.later.value-recovery.before.value))/excursion;
      physicalRecoveries.push(Object.freeze({
        recordId:recovery.recordId,metric:recovery.metric,
        sourceModel:recovery.sourceModel,sourceRecordKey:recovery.sourceRecordKey,
        disturbanceEpisodeId:episodeIds.get(recovery.disturbanceEpisodeKey)!,
        before:Object.freeze({...recovery.before}),
        disturbed:Object.freeze({...recovery.disturbed}),
        later:Object.freeze({...recovery.later}),
        returnedFractionOfDisturbance:returned,
        interpretation:'PHYSICAL_TREND_TOWARD_REFERENCE_ONLY',
        biologicalConsequence:'NOT_EVALUATED',
      }));
    }
    physicalRecoveries.sort((a,b)=>a.later.year-b.later.year || cmp(a.recordId,b.recordId));
    return Object.freeze({
      contractVersion:'32.10-CT0',layer:'SIMULATED_REALITY',bodyKind,bodyKey,
      biosphereCoverage:input.biosphere === undefined ? 'NOT_SUPPLIED' :
        biosphere === null ? 'NO_RESOLVED_BIOSPHERE' : 'RESOLVED_SOURCE_SUPPLIED',
      biologicalEventCoverage:input.biologicalEvents === undefined ? 'NOT_SUPPLIED':'SUPPLIED_RECORDS_ONLY',
      environmentalCoverage:input.environmentalRecoveries === undefined ? 'NOT_SUPPLIED':'SUPPLIED_RECORDS_ONLY',
      biologicalEvents:Object.freeze(records),
      environmentalRecoveries:Object.freeze(physicalRecoveries),
      sourceEpisodes, chronology:prior.chronology,
      historicalCompleteness:'NOT_ESTABLISHED',lifePresence:'NOT_EVALUATED_BY_32_10',
    });
  }
}

function validateBiosphere(
  record:ResolvedBiospherePresence32_10,bodyKind:string,bodyKey:string,present:number|null,
):void {
  if (!record || record.targetBodyKind !== bodyKind || record.targetBodyKey !== bodyKey ||
      record.realization !== 'RESOLVED_EXISTING_BIOSPHERE' ||
      !validBiologicalPhase(record.sourcePhase) || !validKey(record.sourceModel) ||
      !validKey(record.sourceRecordKey) || !Number.isSafeInteger(record.establishedYear) ||
      present === null || record.establishedYear < 0 || record.establishedYear > present) {
    throw new RangeError('32.10 biosphere requires independently resolved source and CT-0 epoch.');
  }
}
function validateBiologicalEvent(
  e:ResolvedBiologicalHistoryEvent32_10,biosphere:ResolvedBiospherePresence32_10|null,
  bodyKind:string,bodyKey:string,present:number|null,
  episodes:ReadonlyMap<string,PlanetaryHistorySourceEpisode32_1>,
):void {
  if (!e || !validKey(e.eventId) || e.targetBodyKind !== bodyKind ||
      e.targetBodyKey !== bodyKey ||
      !['MASS_EXTINCTION','BIOTIC_RECOVERY'].includes(e.kind) ||
      e.realization !== 'RESOLVED_BIOLOGICAL_EVENT' ||
      !validBiologicalPhase(e.sourcePhase) || !validKey(e.sourceModel) ||
      !validKey(e.sourceRecordKey) || !validTime(e.time,present) ||
      !biosphere || e.time.startYear < biosphere.establishedYear ||
      (e.causedByPhysicalEpisodeKey !== null && !validKey(e.causedByPhysicalEpisodeKey)) ||
      (e.causedByExtinctionEventId !== null && !validKey(e.causedByExtinctionEventId))) {
    throw new RangeError('32.10 requires a real biological outcome after biosphere establishment.');
  }
  if (e.causedByPhysicalEpisodeKey !== null) {
    const physical = episodes.get(e.causedByPhysicalEpisodeKey);
    if (!physical || physical.source.evidenceKind !== 'RESOLVED_PHYSICAL_EVENT' ||
        physical.time.startYear > e.time.startYear) {
      throw new RangeError('Biological event references missing, speculative or later physical cause.');
    }
  }
}
function validateEnvironmentalRecovery(
  e:ResolvedEnvironmentalRecoveryEvidence32_10,
  cause:PlanetaryHistorySourceEpisode32_1|undefined,
  bodyKind:string,bodyKey:string,present:number|null,
):void {
  if (!e || !validKey(e.recordId) || e.targetBodyKind !== bodyKind ||
      e.targetBodyKey !== bodyKey ||
      e.realization !== 'RESOLVED_PHYSICAL_COMPARISON' ||
      !/^\d+\.\d+(?:[a-z])?$/i.test(e.sourcePhase) ||
      !validKey(e.sourceModel) || !validKey(e.sourceRecordKey) ||
      !validKey(e.disturbanceEpisodeKey) || !METRICS.has(e.metric) ||
      !cause || cause.source.evidenceKind !== 'RESOLVED_PHYSICAL_EVENT' ||
      !PHYSICAL_CAUSES.has(cause.kind) || present === null) {
    throw new RangeError('32.10 requires prior resolved physical disturbance and source provenance.');
  }
  for (const point of [e.before,e.disturbed,e.later]) {
    if (!point || !Number.isSafeInteger(point.year) || point.year < 0 ||
        point.year > present || !Number.isFinite(point.value) ||
        (e.metric !== 'MEAN_SURFACE_TEMPERATURE_K' && point.value < 0) ||
        (e.metric === 'MEAN_SURFACE_TEMPERATURE_K' && point.value <= 0) ||
        (e.metric.endsWith('_01') && point.value > 1)) {
      throw new RangeError('32.10 physical samples require real comparable values and CT-0 years.');
    }
  }
  if (e.before.year >= cause.time.startYear ||
      e.disturbed.year < cause.time.startYear ||
      e.disturbed.year > e.later.year || e.disturbed.year === e.later.year ||
      e.before.year >= e.disturbed.year) {
    throw new RangeError('32.10 sampled physical recovery must bracket and follow its disturbance.');
  }
  const excursion = Math.abs(e.disturbed.value-e.before.value);
  const later = Math.abs(e.later.value-e.before.value);
  if (!(excursion > 0) || !(later < excursion) ||
      !Number.isFinite(excursion) || !Number.isFinite(later)) {
    throw new RangeError('32.10 cannot call stable, worsening or unquantified states physical recovery.');
  }
}
function validTime(t:PlanetaryHistoryTime32_1,present:number|null):boolean {
  return !!t && t.timeScale === 'YEARS_SINCE_SYSTEM_FORMATION' && present !== null &&
    Number.isSafeInteger(t.startYear) && Number.isSafeInteger(t.endYear) &&
    t.startYear >= 0 && t.startYear <= t.endYear && t.endYear <= present &&
    ['MODELLED_INSTANT','MODELLED_INTERVAL'].includes(t.resolution) &&
    (t.startYear === t.endYear) === (t.resolution === 'MODELLED_INSTANT');
}
function validBiologicalPhase(s:string):boolean {
  return typeof s === 'string' && /^3[3-5](?:\.\d+[a-z]?)?$/i.test(s);
}
function validKey(s:unknown):s is string {
  return typeof s === 'string' && s.length>0 && s.trim()===s && !s.includes('\0');
}
function tuple(...v:string[]):string{return JSON.stringify(v);}
function cmp(a:string,b:string):number{return a<b?-1:a>b?1:0;}
