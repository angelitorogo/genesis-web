import type { RelevantMoon } from '../../domain/planetary/relevant-moon';
import type {
  LunarDatedPhysicalInterval32F5, LunarDatedEnvironmentalEvent32F5,
  LunarEnvironmentalDatedSlice32F5, LunarHistoricalRange32F5,
  LunarEnvironmentalEventAssessment32F5, MoonEnvironmentalHistory32F5,
} from '../../domain/planetary/moon-environmental-history-32-f-5';
import type { PhysicalWorldHistory31Fi3 } from '../planetary-history/planetary-v2-dated-physics-31-f-i-3';
import type { PlanetaryHistorySourceEpisode32_1 } from '../../domain/planetary-history/planetary-history-32-1';

const MAX_SLICES = 512;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const idealRadiativeTemperature32F5a = (watts: number): number =>
  Math.pow(watts / (4 * STEFAN_BOLTZMANN), 0.25);
const MAX_SOURCES = 256;
const MAX_EVENTS = 128;
const LIMITS: readonly string[] = Object.freeze([
  'YEAR_AXIS_SHARED_WITH_CT0_SYSTEM_AGE_NOT_UTC_OR_BROWSER_TIME',
  'HISTORIC_IRRADIANCE_FROM_RETAINED_31FI3_LUMINOSITY_AND_ORBIT_ENVELOPES',
  'CT0_OCEAN_HEAT_AND_RADIATION_NOT_PROPAGATED_BACKWARD',
  'EVENT_WITHOUT_INDEPENDENT_QUANTIFIED_EFFECT_PRESERVES_UNKNOWN',
  'DATED_EFFECT_DELTA_IS_NOT_A_COMPLETE_STATE_OR_POST_EVENT_EXTRAPOLATION',
  'NO_WATER_MASS_OR_OCEAN_TRANSITIONS_WITHOUT_DATED_RESERVOIR_HISTORY',
  'HEAT_FLUX_HISTORY_NOT_DERIVED_FROM_CURRENT_TIDAL_INDICES_OR_CURRENT_WATTS',
  'NO_ASSUMED_HISTORICAL_ATMOSPHERE_CHEMISTRY_RADIATION_OR_LIFE',
  'IDEAL_RADIATIVE_TEMPERATURE_IS_ZERO_ALBEDO_BLACKBODY_NOT_SURFACE_CLIMATE',
]);
const validKey = (x: unknown): x is string => typeof x === 'string' &&
  x.length > 0 && x.trim() === x && !x.includes('\0');
const year = (x: unknown): x is number => Number.isSafeInteger(x) && (x as number) >= 0;
const range = (x: LunarHistoricalRange32F5 | undefined, lower = 0): boolean =>
  x !== undefined && Number.isFinite(x.min) && Number.isFinite(x.max) &&
  x.min >= lower && x.max >= x.min;
const freezeRange = (x: LunarHistoricalRange32F5): LunarHistoricalRange32F5 =>
  Object.freeze({ min: x.min, max: x.max });

/** Strictly source-backed dated evolution of physical quantities on a lunar body.
 * Supports dated event deltas, but NEVER creates a history from its CT-0 snapshot.
 */
export class MoonEnvironmentalHistoryEngine32F5 {
  private constructor() {}
  /** 32.1/32.12 physical event adapter. Event kind and dates are retained;
   * missing event-response amplitudes remain UNKNOWN rather than fabricated.
   */
  static fromDatedHistoricalEpisode32_1(
    record: PlanetaryHistorySourceEpisode32_1,
  ): LunarDatedEnvironmentalEvent32F5 | null {
    if (record.targetBodyKind !== 'MOON') return null;
    const supported: readonly LunarDatedEnvironmentalEvent32F5['kind'][] = [
      'REALIZED_IMPACT', 'RESOLVED_TRANSIENT_EFFECT', 'STELLAR_ENVIRONMENT_CHANGE',
      'VOLCANIC_EPISODE', 'WATER_RESERVOIR_TRANSITION', 'GLACIATION_TRANSITION',
      'CLIMATE_GEOCHEMISTRY_TRANSITION', 'ATMOSPHERE_TRANSITION',
    ];
    if (!supported.some(kind => kind === record.kind)) return null;
    if (record.time.timeScale !== 'YEARS_SINCE_SYSTEM_FORMATION' ||
      !['MODELLED_INSTANT','MODELLED_INTERVAL','INFERRED_INTERVAL'].includes(record.time.resolution)) {
      throw new RangeError('32.F.5 does not accept a foreign episode calendar.');
    }
    return Object.freeze({ episodeKey: record.episodeKey,
      bodyKey: record.targetBodyKey,
      startYear: record.time.startYear, endYear: record.time.endYear,
      kind: record.kind as LunarDatedEnvironmentalEvent32F5['kind'],
      sourceRecordKey: record.source.sourceRecordKey,
      sourcePhase: record.source.sourcePhase,
      sourceModel: record.source.sourceModel,
      evidenceKind: record.source.evidenceKind,
    });
  }

  static fromMaterialized(
    moon: RelevantMoon,
    world: PhysicalWorldHistory31Fi3 | null = null,
    ageYearsCT0: number | null = null,
    datedEnvironment: readonly LunarDatedPhysicalInterval32F5[] = [],
    datedEvents: readonly LunarDatedEnvironmentalEvent32F5[] = [],
  ): MoonEnvironmentalHistory32F5 {
    const l = moon.hostPlanetLocator;
    const key = `G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}/B${l.bodyIndex}/M${moon.moonOrdinal - 1}`;
    if (!moon.oceanReality32F2c || !moon.geochemicalEnergy32F4 ||
      moon.oceanReality32F2c.hostPlanetOrdinal !== moon.hostPlanetOrdinal ||
      moon.oceanReality32F2c.moonOrdinal !== moon.moonOrdinal ||
      moon.geochemicalEnergy32F4.moonOrdinal !== moon.moonOrdinal) {
      throw new RangeError('32.F.5 requires an aligned CT-0 lunar ocean and thermal source.');
    }
    if ((ageYearsCT0 !== null && !year(ageYearsCT0)) ||
      (ageYearsCT0 === null && (world !== null || datedEnvironment.length > 0 || datedEvents.length > 0)) ||
      datedEnvironment.length > MAX_SOURCES || datedEvents.length > MAX_EVENTS) {
      throw new RangeError('32.F.5 requires a bounded independent CT-0 dated axis.');
    }
    if (world && (world.bodyKind !== 'MOON' || world.bodyKey !== key ||
      world.source.context.bodyKey !== key || world.source.context.bodyKind !== 'MOON' ||
      world.source.context.time.kind !== 'CURRENT_SNAPSHOT' ||
      Math.round((world.source.context.time.systemAgeBillionYears ?? NaN) * 1e9) !== ageYearsCT0 ||
      world.source.sourceRevision !== world.irradiation.sourceRevision ||
      world.irradiation.irradiance.length !== world.source.intervals.length ||
      world.historicalHabitability !== 'UNKNOWN')) {
      throw new RangeError('32.F.5 refuses foreign, undated or incoherent 31.F.i.3 history.');
    }
    const revision = world?.source.sourceRevision ?? null;
    const irradiance = world?.irradiation.irradiance ?? [];
    const interruptions = Object.freeze((world?.gaps ?? []).map(g => {
      if (!year(g.startYear) || !year(g.endYear) || g.endYear < g.startYear ||
        (ageYearsCT0 !== null && g.endYear > ageYearsCT0)) {
        throw new RangeError('32.F.5 malformed dated V2 interruption interval.');
      }
      return Object.freeze({startYear:g.startYear,endYear:g.endYear,reason:g.reason});
    }));
    const irradianceKeys = new Set<string>();
    let lastIrradianceEnd = -1;
    for (const i of irradiance) {
      if (!year(i.startYear) || !year(i.endYear) || i.startYear > i.endYear ||
        i.startYear <= lastIrradianceEnd ||
        (ageYearsCT0 !== null && i.endYear > ageYearsCT0) ||
        !range(i.wattsPerSquareMeter) || !Array.isArray(i.provenanceKeys) ||
        i.provenanceKeys.length === 0 || i.provenanceKeys.some(k =>
          !validKey(k) || irradianceKeys.has(k))) {
        throw new RangeError('32.F.5 invalid retained irradiation coverage.');
      }
      i.provenanceKeys.forEach(k => irradianceKeys.add(k));
      lastIrradianceEnd = i.endYear;
    }
    const dated = [...datedEnvironment].sort((a, b) => a.startYear - b.startYear);
    let prevEnd = -1;
    const sourceKeys = new Set<string>();
    for (const d of dated) {
      if (!year(d.startYear) || !year(d.endYear) || d.endYear < d.startYear ||
        d.endYear > ageYearsCT0! || d.startYear <= prevEnd ||
        !validKey(d.sourceModel) || !validKey(d.sourceRecordKey) ||
        d.temporalSupport !== 'CONTINUOUS_DATED_PHYSICAL_MODEL' ||
        sourceKeys.has(d.sourceRecordKey) ||
        ![d.heatFluxWattsPerSquareMeter, d.surfaceTemperatureKelvin,
          d.surfacePressurePascal, d.liquidH2OMassKilograms].some(x => x !== undefined) ||
        (d.heatFluxWattsPerSquareMeter !== undefined && !range(d.heatFluxWattsPerSquareMeter)) ||
        (d.surfaceTemperatureKelvin !== undefined && !range(d.surfaceTemperatureKelvin, 0.001)) ||
        (d.surfacePressurePascal !== undefined && !range(d.surfacePressurePascal)) ||
        (d.liquidH2OMassKilograms !== undefined && (
          !range(d.liquidH2OMassKilograms) ||
          d.liquidH2OMassKilograms.max > moon.oceanReality32F2c.waterInventoryKilograms * (1 + 1e-9)))) {
        throw new RangeError('32.F.5 invalid independent dated lunar environmental model.');
      }
      sourceKeys.add(d.sourceRecordKey);
      prevEnd = d.endYear;
    }
    const eventKeys = new Set<string>();
    const events: LunarEnvironmentalEventAssessment32F5[] = [...datedEvents].sort((a,b) =>
      a.startYear - b.startYear || a.episodeKey.localeCompare(b.episodeKey)).map(e => {
      const effect = e.resolvedEffect;
      if (!validKey(e.episodeKey) || eventKeys.has(e.episodeKey) || e.bodyKey !== key ||
        !validKey(e.sourceRecordKey) || !validKey(e.sourcePhase) || !validKey(e.sourceModel) ||
        !year(e.startYear) || !year(e.endYear) || e.endYear < e.startYear ||
        e.endYear > ageYearsCT0! ||
        !['RESOLVED_PHYSICAL_EVENT', 'INFERRED_PHYSICAL_EPISODE'].includes(e.evidenceKind) ||
        !['REALIZED_IMPACT','RESOLVED_TRANSIENT_EFFECT','STELLAR_ENVIRONMENT_CHANGE',
          'VOLCANIC_EPISODE','WATER_RESERVOIR_TRANSITION','GLACIATION_TRANSITION',
          'CLIMATE_GEOCHEMISTRY_TRANSITION','ATMOSPHERE_TRANSITION'].includes(e.kind) ||
        (effect && (e.evidenceKind !== 'RESOLVED_PHYSICAL_EVENT' ||
          !range(effect.delta, -Infinity) || !validKey(effect.sourceRecordKey) ||
          effect.temporalSupport !== 'DATED_PHYSICAL_EVENT_CONSEQUENCE' ||
          !['HEAT_FLUX_CHANGE','WATER_MASS_CHANGE','SURFACE_PRESSURE_CHANGE',
            'IRRADIANCE_CHANGE'].includes(effect.kind)))) {
        throw new RangeError('32.F.5 rejects ungrounded lunar event consequence.');
      }
      eventKeys.add(e.episodeKey);
      return Object.freeze({
        episodeKey: e.episodeKey, startYear: e.startYear, endYear: e.endYear,
        kind: e.kind, effectKind: effect?.kind ?? null,
        effectDelta: effect ? freezeRange(effect.delta) : null,
        sourceRecordKey: e.sourceRecordKey,
        consequenceSourceKey: effect?.sourceRecordKey ?? null,
        environmentalConsequence: effect
          ? 'DATED_DELTA_ONLY_NO_STATE_EXTRAPOLATION' as const
          : 'UNKNOWN_NOT_ZERO' as const,
      });
    });
    // A stellar-environment change may invalidate frozen Kepler/stars for all
    // subsequent epochs, not just the event day. Transient effects only mask
    // the physically affected dated window. Never infer a repaired orbit.
    const firstUnmodelledStellarChange = datedEvents
      .filter(e => e.kind === 'STELLAR_ENVIRONMENT_CHANGE')
      .reduce<number | null>((min, e) => min === null ? e.startYear : Math.min(min,e.startYear), null);
    // Break on every source/event boundary. Uncovered parts remain explicitly UNKNOWN.
    const slices: LunarEnvironmentalDatedSlice32F5[] = [];
    if (ageYearsCT0 !== null) {
      const boundaries = new Set<number>([0, ageYearsCT0 + 1]);
      for (const x of [...irradiance, ...dated, ...events]) {
        boundaries.add(x.startYear); boundaries.add(x.endYear + 1);
      }
      const sorted = [...boundaries].sort((a,b) => a-b);
      if (sorted.length - 1 > MAX_SLICES) {
        throw new RangeError('32.F.5 exceeded bounded timeline segmentation.');
      }
      for (let n=0; n<sorted.length-1; n++) {
        const startYear = sorted[n], endYear = sorted[n+1] - 1;
        const rad = irradiance.find(x => x.startYear <= startYear && x.endYear >= endYear);
        const env = dated.find(x => x.startYear <= startYear && x.endYear >= endYear);
        const affecting = events.filter(e => e.startYear <= endYear && e.endYear >= startYear);
        const irradianceInterrupted = (firstUnmodelledStellarChange !== null &&
          startYear >= firstUnmodelledStellarChange) ||
          affecting.some(e => e.kind === 'RESOLVED_TRANSIENT_EFFECT');
        const liquid = env?.liquidH2OMassKilograms;
        const state = !liquid ? 'UNKNOWN' as const : liquid.min > 0 ?
          'PRESENT_IN_DATED_MODEL' as const : liquid.max === 0 ?
            'ABSENT_IN_DATED_MODEL' as const : 'UNKNOWN' as const;
        slices.push(Object.freeze({
          startYear, endYear,
          irradianceWattsPerSquareMeter: rad && !irradianceInterrupted
            ? freezeRange(rad.wattsPerSquareMeter) : null,
          idealRadiativeEquilibriumKelvin32F5a: rad && !irradianceInterrupted
            ? Object.freeze({
              min: idealRadiativeTemperature32F5a(rad.wattsPerSquareMeter.min),
              max: idealRadiativeTemperature32F5a(rad.wattsPerSquareMeter.max),
            }) : null,
          heatFluxWattsPerSquareMeter: env?.heatFluxWattsPerSquareMeter
            ? freezeRange(env.heatFluxWattsPerSquareMeter) : null,
          surfaceTemperatureKelvin: env?.surfaceTemperatureKelvin
            ? freezeRange(env.surfaceTemperatureKelvin) : null,
          surfacePressurePascal: env?.surfacePressurePascal
            ? freezeRange(env.surfacePressurePascal) : null,
          liquidH2OMassKilograms: liquid ? freezeRange(liquid) : null,
          oceanState: state,
          irradianceProvenanceKeys: Object.freeze(rad && !irradianceInterrupted
            ? [...rad.provenanceKeys] : []),
          environmentalProvenanceKey: env?.sourceRecordKey ?? null,
          overlappingEventKeys: Object.freeze(affecting.map(e => e.episodeKey)),
          radiativeModelInterrupted: irradianceInterrupted,
        }));
      }
    }
    let oceanTransitions = 0;
    let previous: LunarEnvironmentalDatedSlice32F5 | null = null;
    for (const slice of slices) {
      if (previous && previous.endYear + 1 === slice.startYear &&
        previous.oceanState !== 'UNKNOWN' && slice.oceanState !== 'UNKNOWN' &&
        previous.oceanState !== slice.oceanState) oceanTransitions++;
      previous = slice;
    }
    const current = moon.oceanReality32F2c.state;
    // A separately dated source must not contradict the same body's CT-0 anchor
    // in the *current* model-year. A rejected mismatch is safer than changing
    // the present ocean or back-propagating present heat to make it fit.
    const presentSlice = ageYearsCT0 === null ? null :
      slices.find(s => s.startYear <= ageYearsCT0 && s.endYear >= ageYearsCT0) ?? null;
    const presentOcean = presentSlice?.oceanState;
    if ((current === 'PRESENT_IN_SIMULATED_MODEL' && presentOcean === 'ABSENT_IN_DATED_MODEL') ||
      (current === 'ABSENT_IN_SIMULATED_MODEL' && presentOcean === 'PRESENT_IN_DATED_MODEL')) {
      throw new RangeError('32.F.5 dated final ocean contradicts materialized CT-0 world state.');
    }
    const presentHeat = presentSlice?.heatFluxWattsPerSquareMeter;
    const ct0Heat = moon.oceanReality32F2c.generatedTotalSurfaceHeatFluxWattsPerSquareMeter;
    if (presentHeat && ct0Heat !== null &&
      (ct0Heat < presentHeat.min - 1e-9 || ct0Heat > presentHeat.max + 1e-9)) {
      throw new RangeError('32.F.5 dated final heat envelope contradicts materialized CT-0.');
    }
    const hasDatedOceanAcrossAll = ageYearsCT0 !== null &&
      slices.length > 0 && slices.every(s => s.oceanState !== 'UNKNOWN');
    return Object.freeze({
      contractVersion: '32.F.5-dated-lunar-environment-v1',
      provenance: 'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES',
      bodyKey: key, hostPlanetOrdinal: moon.hostPlanetOrdinal,
      moonOrdinal: moon.moonOrdinal, ageYearsCT0,
      sourceRevision: revision, timeScale: 'YEARS_SINCE_SYSTEM_FORMATION',
      conditionalIrradianceStatus32F5a: world?.conditionalIrradianceStatus32F5a ??
        'SOURCE_NOT_MATERIALIZED',
      intervals: Object.freeze(slices), events: Object.freeze(events),
      datedModelInterruptions: interruptions,
      currentOceanStateCT0: current === 'PRESENT_IN_SIMULATED_MODEL' ? 'PRESENT' :
        current === 'ABSENT_IN_SIMULATED_MODEL' ? 'ABSENT' : 'UNRESOLVED',
      currentHeatFluxCT0WattsPerSquareMeter:
        moon.oceanReality32F2c.generatedTotalSurfaceHeatFluxWattsPerSquareMeter,
      datedOceanTransitionCount: oceanTransitions,
      datedIrradianceIntervalCount: slices.filter(s => s.irradianceWattsPerSquareMeter !== null).length,
      historicalOceanContinuity: hasDatedOceanAcrossAll
        ? 'RESOLVED_WITH_DATED_INTERVALS' : 'UNKNOWN',
      sustainedTidalHeating: 'UNKNOWN', historicalHabitability: 'UNKNOWN',
      lifePresence: 'NOT_EVALUATED', historicalCompleteness: 'NOT_ESTABLISHED',
      scientificLimits: LIMITS,
    } satisfies MoonEnvironmentalHistory32F5);
  }
}
