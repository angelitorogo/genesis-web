import type { StellarEvolutionStateName } from '../../domain/stellar/stellar-evolution-state';
import type { StellarSystem } from '../../domain/stellar/stellar-system';
import type { StellarHistoryComponent32_7, StellarHistoryComponentLabel32_7,
  StellarHistoryTransition32_7, StellarHistoryActivityRecord32_7,
  StellarHistoryResolvedActivity32_7, PlanetaryStellarHistoryInput32_7,
  PlanetaryStellarHistoryResult32_7, StellarHistoryComponentSnapshot32_7,
  StellarLineageEvent32_7 } from '../../domain/planetary-history/planetary-stellar-history-32-7';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const BILLION_YEARS = 1_000_000_000;
const VALID_STATES = new Set<StellarEvolutionStateName>([
  'BROWN_DWARF', 'MAIN_SEQUENCE', 'GIANT', 'SUPERGIANT',
  'WHITE_DWARF', 'NEUTRON_STAR', 'STELLAR_BLACK_HOLE',
]);
const REMNANTS = new Set<StellarEvolutionStateName>(['WHITE_DWARF', 'NEUTRON_STAR', 'STELLAR_BLACK_HOLE']);
const MAX_RECORDS = 100_000;

/**
 * GENESIS 32.7 — source-backed stellar lineage, not a stellar-time generator.
 * No stochastic flares, dates, orbital propagation, planetary heating,
 * supernova energy or biological consequences are invented.
 */
export class PlanetaryStellarHistoryResolver32_7 {
  private constructor() {}

  static resolve(input: PlanetaryStellarHistoryInput32_7): PlanetaryStellarHistoryResult32_7 {
    if (!input?.planet?.hostPlanetarySystem?.hostStellarSystem ||
        input.time?.kind !== 'CURRENT_SNAPSHOT') {
      throw new TypeError('32.7 requires the planetary host lineage and CT-0.');
    }
    const planet = input.planet;
    const system = planet.hostPlanetarySystem;
    const starSystem = system.hostStellarSystem;
    const multiplicity = starSystem.multiplicity.name;
    if (multiplicity !== 'SINGLE' && multiplicity !== 'BINARY' && multiplicity !== 'TRIPLE') {
      throw new RangeError('32.7 requires a valid stellar multiplicity.');
    }
    if (!Number.isSafeInteger(planet.planetOrdinal) || planet.planetOrdinal < 1 ||
        system.architecture.planetSlots[planet.planetOrdinal - 1] !== planet.architectureSlot ||
        planet.architectureSlot.planetOrdinal !== planet.planetOrdinal) {
      throw new RangeError('32.7 planet/slot identity mismatch.');
    }
    const l = planet.architectureSlot.bodyLocator;
    if (l.bodyIndex !== BigInt(planet.planetOrdinal - 1) ||
        l.galaxyIndex !== starSystem.locator.galaxyIndex ||
        l.sectorKey !== starSystem.locator.sectorKey ||
        l.galacticObjectIndex !== starSystem.locator.galacticObjectIndex) {
      throw new RangeError('32.7 planet must belong to the supplied stellar system.');
    }
    const bodyKey = `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
    const ageGyr = input.time.systemAgeBillionYears;
    if (ageGyr !== null && (!finite(ageGyr) || ageGyr < 0)) {
      throw new RangeError('32.7 invalid CT-0 age.');
    }
    const presentYear = ageGyr === null ? null : Math.round(ageGyr * BILLION_YEARS);
    if (presentYear !== null && !Number.isSafeInteger(presentYear)) {
      throw new RangeError('32.7 CT-0 cannot be represented safely.');
    }
    const preceding = input.precedingClimate;
    if (preceding && (preceding.bodyKey !== bodyKey ||
        preceding.chronology?.bodyKey !== bodyKey ||
        preceding.chronology.bodyKind !== 'PLANET' ||
        preceding.chronology.multiplicity !== multiplicity ||
        JSON.stringify(preceding.chronology.time) !== JSON.stringify(input.time))) {
      throw new RangeError('32.7 preceding climate/chronology belongs to another body or age.');
    }
    const labels = expectedLabels(multiplicity);
    if (!Array.isArray(input.components) || input.components.length !== labels.length) {
      throw new RangeError('32.7 must receive exactly one profile for every stellar component.');
    }
    const seen = new Set<StellarHistoryComponentLabel32_7>();
    const byComponent = new Map<StellarHistoryComponentLabel32_7, StellarHistoryComponent32_7>();
    const hosts: StellarHistoryComponentSnapshot32_7[] = [];
    for (const item of input.components) {
      if (!item || !labels.includes(item.label) || seen.has(item.label)) {
        throw new RangeError('32.7 invalid, duplicated or foreign stellar component.');
      }
      seen.add(item.label);
      const profile = item.lifetime;
      const assessment = profile?.evolutionAssessment;
      if (!assessment || !finite(profile.ageBillionYears) || profile.ageBillionYears < 0 ||
          !finite(assessment.input.ageBillionYears) ||
          !approx(profile.ageBillionYears, assessment.input.ageBillionYears) ||
          ageGyr === null || !approx(profile.ageBillionYears, ageGyr)) {
        throw new RangeError('32.7 stellar ages must be coeval with resolved CT-0.');
      }
      const expected = stateOf(starSystem, item.label);
      const state = assessment.evolutionState.name;
      if (expected !== state || !VALID_STATES.has(state)) {
        throw new RangeError('32.7 stellar phase does not match the frozen host lineage.');
      }
      // Companions must be the exact materialized frozen source: no unrelated
      // same-age/metallicity lookalike may be substituted as B or C.
      const comp = item.label === 'B' ? starSystem.secondaryCompanion :
        item.label === 'C' ? starSystem.tertiaryCompanion : null;
      if (comp && comp.lifetimeProfile !== profile) {
        throw new RangeError('32.7 companion lifetime does not belong to its host.');
      }
      const mainAge = assessment.mainSequenceLifetimeBillionYears;
      const terminalAge = profile.terminalAgeBillionYears;
      if (state === 'BROWN_DWARF' ? (mainAge !== null || terminalAge !== null) :
          !positive(mainAge) || !positive(terminalAge) || mainAge > terminalAge!) {
        throw new RangeError('32.7 invalid source stellar phase boundaries.');
      }
      if (item.activity && item.activity.ordinaryFlareModelApplicable &&
          (REMNANTS.has(state) || state === 'BROWN_DWARF')) {
        throw new RangeError('32.7 cannot use ordinary stellar flare statistics for compact/brown hosts.');
      }
      if (item.rotation && item.rotation.ordinaryRotationModelApplicable && REMNANTS.has(state)) {
        throw new RangeError('32.7 cannot use ordinary rotation model for a compact remnant.');
      }
      if (item.activity && !validNullableIndex(item.activity.magneticActivityIndex)) {
        throw new RangeError('32.7 invalid stellar magnetic proxy.');
      }
      if (item.rotation && !validNullableIndex(item.rotation.stabilityIndex)) {
        throw new RangeError('32.7 invalid stellar rotation stability proxy.');
      }
      const activity = item.activity?.ordinaryFlareModelApplicable === true ? item.activity : null;
      hosts.push(Object.freeze({
        component: item.label, state, ageBillionYears: profile.ageBillionYears,
        mainSequenceReferenceEndBillionYears: mainAge,
        terminalReferenceAgeBillionYears: terminalAge,
        historicalPhaseEvents: 'ONLY_SUPPLIED_DATED_TRANSITIONS',
        activity: activity ? 'CURRENT_STATISTICAL_PROFILE' : 'NOT_EVALUABLE',
        flareRatePerDay: activity?.flareRatePerDay ?? null,
        magneticActivityIndex01: activity?.magneticActivityIndex ?? null,
        rotationStabilityIndex01: item.rotation?.ordinaryRotationModelApplicable
          ? item.rotation.stabilityIndex : null,
        currentActivityIsHistoricalFlareEvent: false,
      }));
      byComponent.set(item.label, item);
    }
    const baseEpisodes = preceding?.sourceEpisodes ?? [];
    // Re-canonicalize preceding episodes before adding any new source records.
    if (preceding) {
      const check = PlanetaryHistoryEngine.build({ bodyKind: 'PLANET', bodyKey,
        multiplicity, time: input.time, episodes: baseEpisodes });
      if (JSON.stringify(check) !== JSON.stringify(preceding.chronology)) {
        throw new RangeError('32.7 preceding chronology is not canonical.');
      }
    }
    const provided = input.transitions ?? [];
    if (!Array.isArray(provided) || provided.length > MAX_RECORDS) {
      throw new RangeError('32.7 invalid stellar transition list.');
    }
    const ids = new Set<string>();
    const provenance = new Set<string>();
    const lineage: StellarLineageEvent32_7[] = [];
    const extra: PlanetaryHistorySourceEpisode32_1[] = [];
    for (const record of provided) {
      validateTransition(record, byComponent, presentYear);
      const id = `${record.component}:${record.eventKey}`;
      if (ids.has(id)) throw new RangeError('32.7 duplicated source stellar transition.');
      ids.add(id);
      const sourceId = `${record.component}:${record.sourceModel}:${record.sourceRecordKey}`;
      if (provenance.has(sourceId)) {
        throw new RangeError('32.7 duplicated physical source for stellar transition.');
      }
      provenance.add(sourceId);
      lineage.push(Object.freeze({
        eventKey: id, component: record.component, before: record.before, after: record.after,
        time: Object.freeze({ ...record.time }), sourceModel: record.sourceModel,
        sourceRecordKey: record.sourceRecordKey,
        planetaryIrradiationChange: 'NOT_QUANTIFIED',
        atmosphericOrClimateConsequence: 'NOT_RESOLVED',
      }));
      extra.push(Object.freeze({
        episodeKey: `stellar-32.7:${id}`,
        targetBodyKind: 'PLANET', targetBodyKey: bodyKey,
        kind: 'STELLAR_ENVIRONMENT_CHANGE',
        time: Object.freeze({ ...record.time }),
        source: Object.freeze({
          sourcePhase: record.sourcePhase, sourceModel: record.sourceModel,
          sourceRecordKey: `${record.component}:${record.sourceRecordKey}`,
          evidenceKind: record.evidenceKind,
        }),
        causedByEpisodeKeys: Object.freeze([]),
      }));
    }
    const resolvedActivity = input.resolvedActivityEvents ?? [];
    if (!Array.isArray(resolvedActivity) || resolvedActivity.length > MAX_RECORDS) {
      throw new RangeError('32.7 invalid resolved stellar activity event list.');
    }
    const activityEvents: StellarHistoryResolvedActivity32_7[] = [];
    for (const record of resolvedActivity) {
      validateActivityEvent(record, byComponent, presentYear);
      const id = `${record.component}:${record.eventKey}`;
      const sourceId = `${record.component}:${record.sourceModel}:${record.sourceRecordKey}`;
      if (ids.has(id) || provenance.has(sourceId)) {
        throw new RangeError('32.7 duplicated stellar source record or event identity.');
      }
      ids.add(id);
      provenance.add(sourceId);
      activityEvents.push(Object.freeze({
        eventKey: id, component: record.component, kind: record.kind,
        time: Object.freeze({ ...record.time }), sourceModel: record.sourceModel,
        sourceRecordKey: record.sourceRecordKey,
        planetaryEnergyDeposition: 'NOT_RESOLVED', planetaryEnvironmentalEffect: 'DEFERRED_TO_32_9',
      }));
      extra.push(Object.freeze({
        episodeKey: `stellar-activity-32.7:${id}`,
        targetBodyKind: 'PLANET', targetBodyKey: bodyKey,
        kind: 'STELLAR_ENVIRONMENT_CHANGE',
        time: Object.freeze({ ...record.time }),
        source: Object.freeze({ sourcePhase: record.sourcePhase, sourceModel: record.sourceModel,
          sourceRecordKey: `${record.component}:${record.sourceRecordKey}`,
          evidenceKind: 'RESOLVED_PHYSICAL_EVENT' }),
        causedByEpisodeKeys: Object.freeze([]),
      }));
    }
    // A resolved stellar sequence cannot move backwards, skip an intermediate
    // declared phase without stating it, or end in a state other than the
    // current profile. Missing transitions are allowed (history incomplete).
    for (const label of labels) {
      const chain = lineage.filter(x => x.component === label).sort((a, b) =>
        a.time.startYear - b.time.startYear || compare(a.eventKey, b.eventKey));
      for (let i = 1; i < chain.length; i++) {
        if (chain[i - 1].after !== chain[i].before ||
            chain[i - 1].time.endYear > chain[i].time.startYear) {
          throw new RangeError('32.7 incompatible or overlapping stellar lineage transitions.');
        }
      }
    }
    // Link successive source-backed phase changes of one star causally,
    // without claiming the next change is caused by a transient elsewhere.
    const byNewEpisodeKey = new Map(extra.map(x => [x.episodeKey, x]));
    const sourced: PlanetaryHistorySourceEpisode32_1[] = [];
    for (const label of labels) {
      const chain = lineage.filter(x => x.component === label).sort((a, b) =>
        a.time.startYear - b.time.startYear || compare(a.eventKey, b.eventKey));
      for (let i = 1; i < chain.length; i++) {
        const name = `stellar-32.7:${chain[i].eventKey}`;
        const original = byNewEpisodeKey.get(name)!;
        sourced.push(Object.freeze({ ...original,
          causedByEpisodeKeys: Object.freeze([`stellar-32.7:${chain[i - 1].eventKey}`]),
        }));
      }
    }
    const overwritten = new Map(sourced.map(x => [x.episodeKey, x]));
    const sourceEpisodes = Object.freeze([...baseEpisodes, ...extra.map(x => overwritten.get(x.episodeKey) ?? x).sort((a, b) =>
      compare(a.episodeKey, b.episodeKey))]);
    const chronology = PlanetaryHistoryEngine.build({
      bodyKind: 'PLANET', bodyKey, multiplicity, time: input.time, episodes: sourceEpisodes,
    });
    return Object.freeze({
      contractVersion: '32.7-CT0', layer: 'SIMULATED_REALITY', bodyKey,
      hosts: Object.freeze(hosts.sort((a, b) => compare(a.component, b.component))),
      planetaryHostCoupling: 'NOT_RESOLVED_FROM_LINEAGE_ALONE',
      transitions: Object.freeze(lineage.sort((a, b) =>
        a.time.startYear - b.time.startYear || compare(a.eventKey, b.eventKey))),
      resolvedActivityEvents: Object.freeze(activityEvents.sort((a, b) =>
        a.time.startYear - b.time.startYear || compare(a.eventKey, b.eventKey))),
      sourceEpisodes, chronology, transientEffects: 'DEFERRED_TO_32_9',
      historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function expectedLabels(m: string): StellarHistoryComponentLabel32_7[] {
  return m === 'SINGLE' ? ['A'] : m === 'BINARY' ? ['A', 'B'] : ['A', 'B', 'C'];
}
function stateOf(system: StellarSystem, label: StellarHistoryComponentLabel32_7): StellarEvolutionStateName {
  if (label === 'A') return system.primaryStar.evolutionState.name;
  const companion = label === 'B' ? system.secondaryCompanion : system.tertiaryCompanion;
  if (!companion || companion.componentLabel.name !== label) {
    throw new RangeError(`32.7 missing/incorrect host component ${label}.`);
  }
  return companion.currentEvolutionState.name;
}
function validateTransition(record: StellarHistoryTransition32_7,
  byComponent: ReadonlyMap<StellarHistoryComponentLabel32_7, StellarHistoryComponent32_7>,
  presentYear: number | null): void {
  if (!record || !byComponent.has(record.component) ||
      !nonempty(record.eventKey) || !nonempty(record.sourcePhase) ||
      !nonempty(record.sourceModel) || !nonempty(record.sourceRecordKey) ||
      record.evidenceKind !== 'RESOLVED_PHYSICAL_EVENT' &&
      record.evidenceKind !== 'INFERRED_PHYSICAL_EPISODE') {
    throw new RangeError('32.7 stellar transition must have component, source provenance and evidence kind.');
  }
  const time = record.time;
  if (!time || time.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
      !Number.isSafeInteger(time.startYear) || !Number.isSafeInteger(time.endYear) ||
      time.startYear < 0 || time.endYear < time.startYear ||
      presentYear === null || time.endYear > presentYear ||
      !['MODELLED_INSTANT', 'MODELLED_INTERVAL', 'INFERRED_INTERVAL'].includes(time.resolution) ||
      ((time.startYear === time.endYear) !== (time.resolution === 'MODELLED_INSTANT')) ||
      (record.evidenceKind === 'INFERRED_PHYSICAL_EPISODE' && time.resolution !== 'INFERRED_INTERVAL')) {
    throw new RangeError('32.7 requires an explicit justified CT-0 transition epoch.');
  }
  if (!VALID_STATES.has(record.before) || !VALID_STATES.has(record.after) ||
      record.before === record.after || REMNANTS.has(record.before) ||
      record.before === 'BROWN_DWARF' || record.after === 'BROWN_DWARF' ||
      (record.before === 'MAIN_SEQUENCE' && !(
        record.after === 'GIANT' || record.after === 'SUPERGIANT' || REMNANTS.has(record.after))) ||
      (record.before === 'GIANT' && !(
        record.after === 'SUPERGIANT' || REMNANTS.has(record.after))) ||
      (record.before === 'SUPERGIANT' && !REMNANTS.has(record.after))) {
    throw new RangeError('32.7 source transition violates the broad stellar evolutionary ordering.');
  }
  const current = byComponent.get(record.component)!.lifetime.evolutionAssessment.evolutionState.name;
  const reachedCurrent = record.after === current ||
    (record.after === 'GIANT' && (current === 'SUPERGIANT' || REMNANTS.has(current))) ||
    (record.after === 'SUPERGIANT' && REMNANTS.has(current));
  if (!reachedCurrent || current === 'MAIN_SEQUENCE' || current === 'BROWN_DWARF') {
    throw new RangeError('32.7 transition is incompatible with its current stellar lineage.');
  }
}
function finite(x: number): boolean { return Number.isFinite(x); }
function positive(x: number | null): x is number { return x !== null && finite(x) && x > 0; }
function approx(a: number, b: number): boolean {
  return finite(a) && finite(b) && Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
}
function validNullableIndex(x: number | null): boolean {
  return x === null || (finite(x) && x >= 0 && x <= 1);
}
function nonempty(s: string): boolean { return typeof s === 'string' && s.trim().length > 0 && s.length < 2048; }
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

/** Resolved events may belong to a compact star, but never originate in rate statistics. */
function validateActivityEvent(record: StellarHistoryActivityRecord32_7,
  byComponent: ReadonlyMap<StellarHistoryComponentLabel32_7, StellarHistoryComponent32_7>,
  presentYear: number | null): void {
  if (!record || !byComponent.has(record.component) ||
      !nonempty(record.eventKey) || !nonempty(record.sourcePhase) ||
      !nonempty(record.sourceModel) || !nonempty(record.sourceRecordKey) ||
      !['RESOLVED_STELLAR_FLARE', 'RESOLVED_MAGNETIC_OUTBURST',
        'OTHER_RESOLVED_STELLAR_ACTIVITY'].includes(record.kind)) {
    throw new RangeError('32.7 needs an actual resolved activity event with source identity.');
  }
  const time = record.time;
  if (!time || time.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
      !Number.isSafeInteger(time.startYear) || !Number.isSafeInteger(time.endYear) ||
      time.startYear < 0 || time.endYear < time.startYear ||
      presentYear === null || time.endYear > presentYear ||
      !['MODELLED_INSTANT', 'MODELLED_INTERVAL'].includes(time.resolution) ||
      ((time.startYear === time.endYear) !== (time.resolution === 'MODELLED_INSTANT'))) {
    throw new RangeError('32.7 resolved activity requires a physically dated CT-0 event.');
  }
}
