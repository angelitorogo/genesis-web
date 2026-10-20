import type {
  MaterializedPhysicalHistory31Fi3,
  PhysicalWorldHistory31Fi3,
} from './planetary-v2-dated-physics-31-f-i-3';
import type { PaleoEnvironmentalResult31Fi4, PaleoQuantityInterval31Fi4 } from './planetary-paleoenvironment-31-f-i-4';

/**
 * 31.F.i.5 — PRIVATE, reproducible accounting of genuinely materialized CT-0
 * history. It reports actual modeled coverage, not a new scientific model.
 * Irradiance is a *conditional* phase-15/16/18/21 calculation (31.F.i.3);
 * atmosphere, water, ionising radiation and climate are UNKNOWN unless their
 * own separately dated sources exist. Coverage NEVER implies habitability.
 *
 * Built once at the canonical materialization boundary, not from DTOs or
 * regenerated seeds. The report is not added to any player-facing model.
 */
export interface HistoricalCoveragePeriod31Fi5 {
  readonly startYear: number;
  readonly endYear: number;
}
export interface HistoricalWorldCoverage31Fi5 {
  readonly bodyKey: string;
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly ageYearsCT0: number;
  readonly irradiance: {
    readonly classification: 'CONDITIONAL_MODEL' | 'UNKNOWN';
    readonly intervals: number;
    readonly yearsCovered: number;
    readonly intervalsCovered: readonly HistoricalCoveragePeriod31Fi5[];
    readonly unknown: readonly HistoricalCoveragePeriod31Fi5[];
  };
  readonly interruptions: readonly (HistoricalCoveragePeriod31Fi5 & {
    readonly reason: 'UNRESOLVED_EVENT' | 'NOT_MODELLED_STELLAR_ORBITAL_EVOLUTION' |
      'PRE_MAIN_SEQUENCE_OR_FORMATION' | 'UNRESOLVED_ORBIT_GEOMETRY';
  })[];
  readonly pressure: 'UNKNOWN' | 'CONDITIONAL_DATED_MASS_BALANCE';
  readonly waterMass: 'UNKNOWN' | 'CONDITIONAL_DATED_MASS_BALANCE';
  readonly radiation: 'UNKNOWN' | 'CONDITIONAL_DATED_RADIATION_TRANSFER';
  readonly paleoCoverage: {
    readonly pressureYears: number;
    readonly waterYears: number;
    readonly radiationYears: number;
  };
  readonly thermal: 'UNKNOWN_NO_DATED_THERMAL_BOUNDARY' | 'CONDITIONAL_DATED_ENERGY_BALANCE';
  readonly habitability: 'UNKNOWN';
  readonly lifePresence: 'NOT_EVALUATED';
  readonly playerVisible: false;
}
export interface HistoricalCoverageReport31Fi5 {
  readonly contractVersion: '31.F.i.5-v1';
  readonly source: 'ALREADY_MATERIALIZED_STELLAR_ORBITAL_MODEL';
  readonly multiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE';
  /** Public V2 host is not necessarily the private S-type component host. */
  readonly publicMultiplicity: 'SINGLE' | 'BINARY' | 'TRIPLE';
  readonly radiativeScope: 'HOST_STELLAR_SYSTEM_CONDITIONAL' |
    'ONE_COMPONENT_ONLY_NOT_MULTIPLE_TOTAL';
  readonly ageYearsCT0: number;
  readonly worlds: readonly HistoricalWorldCoverage31Fi5[];
  readonly fullEnvironmentalCoverage: 'NOT_CERTIFIED';
  readonly climateHistoricalCompleteness: 'UNKNOWN';
  readonly playerVisible: false;
}

function years(items: readonly HistoricalCoveragePeriod31Fi5[]): number {
  return items.reduce((sum, item) => sum + item.endYear - item.startYear + 1, 0);
}
function count(items: readonly PaleoQuantityInterval31Fi4[]): number { return years(items); }
function frozenPeriods(items: readonly HistoricalCoveragePeriod31Fi5[]): readonly HistoricalCoveragePeriod31Fi5[] {
  return Object.freeze(items.map(i => Object.freeze({startYear:i.startYear, endYear:i.endYear})));
}
function coverage(world: PhysicalWorldHistory31Fi3, now: number,
  paleo: PaleoEnvironmentalResult31Fi4 | undefined): HistoricalWorldCoverage31Fi5 {
  if (world.source.context.bodyKey !== world.bodyKey ||
      world.source.context.bodyKind !== world.bodyKind ||
      Math.round((world.source.context.time.systemAgeBillionYears ?? -1) * 1e9) !== now ||
      world.irradiation.sourceRevision !== world.source.sourceRevision ||
      world.irradiation.irradiance.length !== world.source.intervals.length ||
      world.irradiation.forcing.length > world.source.intervals.length ||
      world.historicalHabitability !== 'UNKNOWN') {
    throw new RangeError('31.F.i.5 incoherent materialized physical provenance.');
  }
  if (paleo && (paleo.bodyKey !== world.bodyKey || paleo.bodyKind !== world.bodyKind ||
      paleo.playerVisible !== false || paleo.historicalCompleteness !== 'NOT_ESTABLISHED')) {
    throw new RangeError('31.F.i.5 cannot mix the paleoenvironment of two bodies.');
  }
  const actual = world.irradiation.irradiance.map(i =>
    ({ startYear: i.startYear, endYear: i.endYear }));
  const unknown = world.irradiation.missingStellarOrbitalHistory;
  let cursor = 0;
  const all = [...actual, ...unknown].sort((a,b) => a.startYear - b.startYear);
  for (const period of all) {
    if (!Number.isSafeInteger(period.startYear) || !Number.isSafeInteger(period.endYear) ||
        period.startYear !== cursor || period.endYear < period.startYear || period.endYear > now) {
      throw new RangeError('31.F.i.5 gaps and dated irradiance must exactly partition CT-0.');
    }
    cursor = period.endYear + 1;
  }
  if (cursor !== now + 1) throw new RangeError('31.F.i.5 missing temporal coverage accounting.');
  return Object.freeze({
    bodyKey: world.bodyKey, bodyKind: world.bodyKind, ageYearsCT0: now,
    irradiance: Object.freeze({
      classification: actual.length > 0 ? 'CONDITIONAL_MODEL' : 'UNKNOWN',
      intervals: actual.length, yearsCovered: years(actual),
      intervalsCovered: frozenPeriods(actual), unknown: frozenPeriods(unknown),
    }),
    interruptions: Object.freeze(world.gaps.map(g => Object.freeze({startYear:g.startYear,
      endYear:g.endYear,reason:g.reason}))),
    pressure: paleo && paleo.surfacePressurePascal.length > 0
      ? 'CONDITIONAL_DATED_MASS_BALANCE' : 'UNKNOWN',
    waterMass: paleo && paleo.totalWaterMassKilograms.length > 0
      ? 'CONDITIONAL_DATED_MASS_BALANCE' : 'UNKNOWN',
    radiation: paleo && paleo.surfaceIonisingDoseGrayPerYear.length > 0
      ? 'CONDITIONAL_DATED_RADIATION_TRANSFER' : 'UNKNOWN',
    paleoCoverage: Object.freeze({
      pressureYears: paleo ? count(paleo.surfacePressurePascal) : 0,
      waterYears: paleo ? count(paleo.totalWaterMassKilograms) : 0,
      radiationYears: paleo ? count(paleo.surfaceIonisingDoseGrayPerYear) : 0,
    }),
    thermal: world.irradiation.forcing.length > 0
      ? 'CONDITIONAL_DATED_ENERGY_BALANCE' : 'UNKNOWN_NO_DATED_THERMAL_BOUNDARY',
    habitability: 'UNKNOWN', lifePresence: 'NOT_EVALUATED', playerVisible: false,
  });
}

export class PlanetaryAutomaticHistoricalCoverage31Fi5 {
  private constructor() {}

  static fromMaterialized(physical: MaterializedPhysicalHistory31Fi3,
    planetPaleo?: PaleoEnvironmentalResult31Fi4,
    publicHost?: { readonly multiplicity: 'BINARY' | 'TRIPLE';
      readonly component: 'A' | 'B' | 'C' | 'AB' }): HistoricalCoverageReport31Fi5 {
    if (physical?.contractVersion !== '31.F.i.3-v1' ||
        !Number.isSafeInteger(physical.ageYearsCT0) || physical.ageYearsCT0 < 0 ||
        !['SINGLE','BINARY','TRIPLE'].includes(physical.planet.source.context.multiplicity) ||
        physical.playerVisible !== false ||
        physical.certification !== 'CONDITIONAL_IRRADIANCE_ONLY_NOT_COMPLETE_HABITABILITY' ||
        physical.moons.some(m => m.bodyKind !== 'MOON' || m.bodyKey === physical.planet.bodyKey)) {
      throw new RangeError('31.F.i.5 requires the retained, canonical V2 physical timeline.');
    }
    if (publicHost && (
        (publicHost.component === 'AB'
          ? physical.planet.source.context.multiplicity !== publicHost.multiplicity
          : physical.planet.source.context.multiplicity !== 'SINGLE') ||
        (publicHost.multiplicity === 'BINARY' && publicHost.component === 'C'))) {
      throw new RangeError('31.F.i.5 cannot equate a multiple host with an unrelated private irradiance source.');
    }
    const worlds = [coverage(physical.planet, physical.ageYearsCT0, planetPaleo),
      ...physical.moons.map(m => coverage(m, physical.ageYearsCT0, undefined))];
    if (new Set(worlds.map(w => w.bodyKey)).size !== worlds.length) {
      throw new RangeError('31.F.i.5 duplicated planet/moon history identity.');
    }
    return Object.freeze({
      contractVersion:'31.F.i.5-v1', source:'ALREADY_MATERIALIZED_STELLAR_ORBITAL_MODEL',
      multiplicity: physical.planet.source.context.multiplicity as 'SINGLE'|'BINARY'|'TRIPLE',
      publicMultiplicity: publicHost?.multiplicity ?? physical.planet.source.context.multiplicity as
        'SINGLE'|'BINARY'|'TRIPLE',
      radiativeScope: !publicHost || publicHost.component === 'AB'
        ? 'HOST_STELLAR_SYSTEM_CONDITIONAL' : 'ONE_COMPONENT_ONLY_NOT_MULTIPLE_TOTAL',
      ageYearsCT0: physical.ageYearsCT0, worlds: Object.freeze(worlds),
      fullEnvironmentalCoverage: 'NOT_CERTIFIED', climateHistoricalCompleteness: 'UNKNOWN',
      playerVisible: false,
    });
  }
}
