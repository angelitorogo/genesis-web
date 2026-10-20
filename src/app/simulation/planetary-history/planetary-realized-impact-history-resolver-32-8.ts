import { MinorBodyApproachTargetKind } from '../../domain/planetary/minor-body-approach-target-kind';
import type { MinorBodyHistoricalImpactEvent } from '../../domain/planetary/minor-body-historical-impact-event';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';
import type { PlanetaryRealizedImpactHistoryInput32_8, PlanetaryRealizedImpactHistoryResult32_8,
  PlanetaryRealizedImpactRecord32_8, ImpactHistoricalDateStatus32_8 } from '../../domain/planetary-history/planetary-realized-impact-history-32-8';
import { PlanetaryHistoryEngine } from './planetary-history-engine';

const YEARS_PER_GYR = 1_000_000_000;
const EVENT_ID = /^[0-9A-F]{32}$/;
const MAX_EVENTS = 100_000;

/**
 * GENESIS 32.8 — retrospective point-23.13 realization -> CT-0 chronology.
 * 23.8/23.13 use offsets inside a finite retrospective window ending NOW;
 * 32.1 uses integer model-years since system formation. Never use a 23.7
 * geometric-risk flag or 23.8 probability as a realized historical impact.
 *
 * Neither this adapter nor 23.13 resolves climatic/biological aftereffects.
 */
export class PlanetaryRealizedImpactHistoryResolver32_8 {
  private constructor() {}

  static resolve(input: PlanetaryRealizedImpactHistoryInput32_8): PlanetaryRealizedImpactHistoryResult32_8 {
    const planet = input?.planet;
    const system = planet?.hostPlanetarySystem;
    const star = system?.hostStellarSystem;
    if (!star || !planet || !input.time || input.time.kind !== 'CURRENT_SNAPSHOT') {
      throw new TypeError('32.8 requires canonical planet identity, system and CT-0.');
    }
    const multiplicity = star.multiplicity.name;
    if (multiplicity !== 'SINGLE' && multiplicity !== 'BINARY' && multiplicity !== 'TRIPLE') {
      throw new RangeError('32.8 requires the frozen stellar architecture.');
    }
    const l = planet.locator;
    if (!Number.isSafeInteger(planet.planetOrdinal) || planet.planetOrdinal < 1 ||
        l.bodyIndex !== BigInt(planet.planetOrdinal - 1) ||
        l.galaxyIndex !== star.locator.galaxyIndex || l.sectorKey !== star.locator.sectorKey ||
        l.galacticObjectIndex !== star.locator.galacticObjectIndex || planet.seed.kind !== 'body') {
      throw new RangeError('32.8 planet does not match its frozen host locator or ordinal.');
    }
    let bodyKind: 'PLANET' | 'MOON' = 'PLANET';
    let bodyKey = `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}`;
    if (input.moon) {
      const moon = input.moon;
      const ml = moon.identity?.locator;
      if (!Number.isSafeInteger(moon.moonOrdinal) || moon.moonOrdinal < 1 ||
          moon.hostPlanetOrdinal !== planet.planetOrdinal ||
          moon.hostPlanetLocator !== planet.locator || moon.hostPlanetSeed !== planet.seed ||
          moon.identity?.hostPlanetOrdinal !== moon.hostPlanetOrdinal ||
          moon.identity?.moonOrdinal !== moon.moonOrdinal ||
          moon.identity?.hostPlanetLocator !== planet.locator ||
          moon.identity?.hostPlanetSeed !== planet.seed ||
          moon.identity?.seed.kind !== 'moon' ||
          !ml || ml.galaxyIndex !== l.galaxyIndex || ml.sectorKey !== l.sectorKey ||
          ml.galacticObjectIndex !== l.galacticObjectIndex || ml.bodyIndex !== l.bodyIndex ||
          ml.moonIndex !== BigInt(moon.moonOrdinal - 1)) {
        throw new RangeError('32.8 moon does not belong to its canonical host planet.');
      }
      bodyKind = 'MOON';
      bodyKey += `/M${ml.moonIndex}`;
    }
    const age = input.time.systemAgeBillionYears;
    if (age !== null && (!Number.isFinite(age) || age < 0)) {
      throw new RangeError('32.8 invalid CT-0 system age.');
    }
    const present = age === null ? null : Math.round(age * YEARS_PER_GYR);
    if (present !== null && !Number.isSafeInteger(present)) {
      throw new RangeError('32.8 CT-0 age is outside integer-year precision.');
    }
    const previous = input.preceding;
    if (!!previous !== !!input.precedingSourceEpisodes) {
      throw new RangeError('32.8 requires preceding chronology together with its canonical source episodes.');
    }
    const priorEpisodes = input.precedingSourceEpisodes ?? [];
    if (previous) {
      if (previous.contractVersion !== '32.1-CT0' || previous.bodyKind !== bodyKind ||
          previous.bodyKey !== bodyKey || previous.multiplicity !== multiplicity ||
          previous.time.kind !== input.time.kind ||
          previous.time.systemAgeBillionYears !== input.time.systemAgeBillionYears) {
        throw new RangeError('32.8 preceding chronology belongs to another body or epoch.');
      }
      const canonical = PlanetaryHistoryEngine.build({ bodyKind, bodyKey, multiplicity,
        time: input.time, episodes: priorEpisodes });
      if (!sameCanonical(canonical.episodes, previous.episodes)) {
        throw new RangeError('32.8 preceding chronology cannot be reproduced from its supplied sources.');
      }
    }
    const source = input.impactHistory;
    const records: PlanetaryRealizedImpactRecord32_8[] = [];
    const extra: PlanetaryHistorySourceEpisode32_1[] = [];
    if (source) {
      if (source.planetarySystem !== system || !finitePositive(source.timeWindowYears) ||
          !Array.isArray(source.historicalMinorBodyImpactEvents) ||
          !Array.isArray(source.minorBodyRealizations) ||
          source.historicalMinorBodyImpactEvents.length > MAX_EVENTS ||
          source.minorBodyRealizations.length > MAX_EVENTS * 10) {
        throw new RangeError('32.8 requires an authoritative, bounded, same-system 23.13 catalogue.');
      }
      const events = source.historicalMinorBodyImpactEvents;
      const realized = source.minorBodyRealizations.map(item => item.event)
        .filter((item): item is MinorBodyHistoricalImpactEvent => item !== null);
      const realizedSet = new Set(realized);
      if (events.length !== realized.length || realizedSet.size !== events.length ||
          events.some(e => !realizedSet.has(e))) {
        throw new RangeError('32.8 accepts exactly the realized events from competing-risk 23.13 records.');
      }
      const seenIds = new Set<string>();
      const seenMinors = new Set<string>();
      for (const event of events) {
        validateEvent(event, system, source.timeWindowYears);
        if (seenIds.has(event.eventId) || seenMinors.has(event.minorBodyProceduralId)) {
          throw new RangeError('32.8 rejects duplicate events or two realized impacts for one minor body.');
        }
        seenIds.add(event.eventId);
        seenMinors.add(event.minorBodyProceduralId);
        const matchesPlanet = event.targetKind === MinorBodyApproachTargetKind.PLANET &&
          !input.moon && event.targetPlanet === planet;
        const matchesMoon = event.targetKind === MinorBodyApproachTargetKind.MOON &&
          !!input.moon && event.targetPlanet === planet && event.targetMoon === input.moon;
        if (!matchesPlanet && !matchesMoon) continue;
        const when = resolveDate(event, source.timeWindowYears, present);
        const effects = event.impactEffectsAssessment;
        records.push(Object.freeze({
          eventId: event.eventId, sourceModel: 'HISTORICAL_IMPACT_REALIZATION_23_13',
          targetBodyKind: bodyKind, targetBodyKey: bodyKey,
          sourceMinorBodyId: event.minorBodyProceduralId,
          timeWindowYears: source.timeWindowYears,
          yearsAfterWindowStart: event.yearsAfterWindowStart,
          yearsBeforeWindowEnd: event.yearsBeforeWindowEnd,
          yearSinceFormation: when.year, dateStatus: when.status,
          kineticEnergyJoules: event.kineticEnergyJoules!,
          surfaceResponseRegime: effects.surfaceResponseRegime.name,
          hasSolidSurface: effects.hasSolidSurface!,
          craterDiameterKilometers: effects.craterDiameterKilometers,
          atmosphericShockIndex01: effects.atmosphericShockIndex01!,
          atmosphericLossPotentialIndex01: effects.atmosphericLossPotentialIndex01!,
          hydrosphereShockIndex01: effects.hydrosphereShockIndex01,
          geologicalShockIndex01: effects.geologicalShockIndex01,
          surfaceWaterVaporizationPotentialIndex01: effects.surfaceWaterVaporizationPotentialIndex01,
          ejectaGenerationIndex01: effects.ejectaGenerationIndex01,
          realizedRetainedWaterMassKilograms: event.realizedRetainedWaterMassKilograms,
          realizedOrganicCarrierMassProxyKilograms: event.realizedRetainedOrganicCarrierMassProxyKilograms,
          climateDuration: 'NOT_QUANTIFIED', radiativeForcingWattsPerSquareMeter: null,
          biologicalEffect: 'NOT_EVALUATED',
        }));
        if (when.year !== null) extra.push(Object.freeze({
          episodeKey: `impact:${event.eventId}`, targetBodyKind: bodyKind,
          targetBodyKey: bodyKey, kind: 'REALIZED_IMPACT',
          time: Object.freeze({ timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
            startYear: when.year, endYear: when.year, resolution: 'MODELLED_INSTANT' }),
          source: Object.freeze({ sourcePhase: '23.13',
            sourceModel: 'HISTORICAL_IMPACT_REALIZATION_V1',
            sourceRecordKey: event.eventId, evidenceKind: 'RESOLVED_PHYSICAL_EVENT' }),
          causedByEpisodeKeys: Object.freeze([]),
        }));
      }
    }
    records.sort((a,b) => (a.yearSinceFormation ?? Number.POSITIVE_INFINITY) -
      (b.yearSinceFormation ?? Number.POSITIVE_INFINITY) || compare(a.eventId, b.eventId));
    const combined = Object.freeze([...priorEpisodes, ...extra]);
    const chronology = PlanetaryHistoryEngine.build({bodyKind, bodyKey, multiplicity,
      time: input.time, episodes: combined});
    return Object.freeze({
      contractVersion: '32.8-CT0', layer: 'SIMULATED_REALITY', bodyKind, bodyKey,
      impactCoverage: source ? 'SUPPLIED_EVENTS_ONLY' : 'SOURCE_NOT_SUPPLIED',
      realizedImpacts: Object.freeze(records), sourceEpisodes: combined,
      chronology, historicalCompleteness: 'NOT_ESTABLISHED', lifePresence: 'NOT_EVALUATED',
    });
  }
}

function validateEvent(event: MinorBodyHistoricalImpactEvent, system: unknown, window: number): void {
  if (!event || !EVENT_ID.test(event.eventId) ||
      !event.minorBodyProceduralId || !Number.isFinite(event.yearsAfterWindowStart) ||
      !Number.isFinite(event.yearsBeforeWindowEnd) ||
      event.yearsAfterWindowStart < 0 || event.yearsBeforeWindowEnd < 0 ||
      event.yearsAfterWindowStart > window || event.yearsBeforeWindowEnd > window ||
      !approx(event.yearsAfterWindowStart + event.yearsBeforeWindowEnd, window) ||
      event.timeWindowYears !== window ||
      event.targetPlanet.hostPlanetarySystem !== system ||
      (event.targetKind !== MinorBodyApproachTargetKind.PLANET &&
        event.targetKind !== MinorBodyApproachTargetKind.MOON) ||
      (event.targetKind === MinorBodyApproachTargetKind.PLANET && event.targetMoon !== null) ||
      (event.targetKind === MinorBodyApproachTargetKind.MOON &&
        (!event.targetMoon || event.targetMoon.hostPlanetOrdinal !== event.targetPlanet.planetOrdinal)) ||
      !finitePositive(event.kineticEnergyJoules!) ||
      !finiteNonnegative(event.realizedRetainedWaterMassKilograms) ||
      !finiteNonnegative(event.realizedRetainedOrganicCarrierMassProxyKilograms) ||
      !event.deliveryAssessment?.deliveryScenarioApplicable ||
      event.deliveryAssessment.targetPlanet !== event.targetPlanet ||
      event.deliveryAssessment.targetMoon !== event.targetMoon ||
      !event.impactEffectsAssessment?.impactScenarioApplicable ||
      event.impactEffectsAssessment.targetPlanet !== event.targetPlanet ||
      event.impactEffectsAssessment.targetMoon !== event.targetMoon ||
      (event.targetKind === MinorBodyApproachTargetKind.MOON &&
        event.targetMoon!.hostPlanetLocator !== event.targetPlanet.locator) ||
      ![true, false].includes(event.impactEffectsAssessment.hasSolidSurface!) ||
      !index(event.impactEffectsAssessment.atmosphericShockIndex01) ||
      !index(event.impactEffectsAssessment.atmosphericLossPotentialIndex01) ||
      (event.impactEffectsAssessment.hasSolidSurface === false &&
        (event.impactEffectsAssessment.craterDiameterKilometers !== null ||
         event.impactEffectsAssessment.hydrosphereShockIndex01 !== null ||
         event.impactEffectsAssessment.geologicalShockIndex01 !== null ||
         event.impactEffectsAssessment.surfaceWaterVaporizationPotentialIndex01 !== null ||
         event.impactEffectsAssessment.ejectaGenerationIndex01 !== null)) ||
      (event.impactEffectsAssessment.hasSolidSurface === true &&
        (!finitePositive(event.impactEffectsAssessment.craterDiameterKilometers!) ||
         !index(event.impactEffectsAssessment.hydrosphereShockIndex01) ||
         !index(event.impactEffectsAssessment.geologicalShockIndex01) ||
         !index(event.impactEffectsAssessment.surfaceWaterVaporizationPotentialIndex01) ||
         !index(event.impactEffectsAssessment.ejectaGenerationIndex01)))) {
    throw new RangeError('32.8 rejects invalid, untraceable or merely conditional impact events.');
  }
}
function resolveDate(event: MinorBodyHistoricalImpactEvent, window: number,
  present: number | null): {readonly year: number | null; readonly status: ImpactHistoricalDateStatus32_8} {
  if (present === null) return {year: null, status: 'CT0_AGE_NOT_RESOLVED'};
  if (window > present) return {year: null, status: 'WINDOW_EXCEEDS_SYSTEM_AGE'};
  // The 23.13 timing offset is a fraction of a retrospective window.
  // The canonical 32.1 axis stores integer years: round only once at entry.
  const year = Math.round(present - event.yearsBeforeWindowEnd);
  if (!Number.isSafeInteger(year) || year < 0 || year > present) {
    throw new RangeError('32.8 event falls outside the CT-0 system lifetime.');
  }
  return {year, status: 'DATED_FROM_23_13_WINDOW'};
}
function sameCanonical(a: readonly unknown[], b: readonly unknown[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
function compare(a: string, b: string): number {return a < b ? -1 : a > b ? 1 : 0;}
function approx(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) &&
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}
function finitePositive(n: number): boolean {return Number.isFinite(n) && n > 0;}
function finiteNonnegative(n: number): boolean {return Number.isFinite(n) && n >= 0;}
function index(n: number | null): boolean {return n !== null && Number.isFinite(n) && n >= 0 && n <= 1;}
