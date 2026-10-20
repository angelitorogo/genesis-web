import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type { Planet } from '../planetary/planet';
import type { RelevantMoon } from '../planetary/relevant-moon';
import type { PlanetaryImpactHistoryCatalog } from '../planetary/planetary-impact-history-catalog';
import type { PlanetaryHistoryChronology32_1, PlanetaryHistorySourceEpisode32_1 } from './planetary-history-32-1';

/** GENESIS 32.8 — only frozen events realized by 23.13; risk is never history. */
export interface PlanetaryRealizedImpactHistoryInput32_8 {
  readonly planet: Pick<Planet, 'hostPlanetarySystem' | 'planetOrdinal' | 'locator' | 'seed'>;
  /** When supplied the result concerns this individual moon rather than its host planet. */
  readonly moon?: Pick<RelevantMoon, 'hostPlanetOrdinal' | 'hostPlanetLocator' | 'hostPlanetSeed' |
    'moonOrdinal' | 'identity'>;
  readonly time: HabitabilityTimeContextCt0;
  /** Missing is explicitly different from a supplied catalogue with no realized events. */
  readonly impactHistory?: Pick<PlanetaryImpactHistoryCatalog,
    'planetarySystem' | 'timeWindowYears' | 'minorBodyRealizations' | 'historicalMinorBodyImpactEvents'>;
  /** Optional 32.1–32.7 causal history for the SAME body and CT-0 snapshot. */
  readonly preceding?: Pick<PlanetaryHistoryChronology32_1,
    'bodyKind' | 'bodyKey' | 'multiplicity' | 'time' | 'episodes'> & {
      readonly contractVersion: '32.1-CT0';
    };
  /** Original source episodes; required with preceding for canonical reconstruction. */
  readonly precedingSourceEpisodes?: readonly PlanetaryHistorySourceEpisode32_1[];
}

export type ImpactHistoricalDateStatus32_8 =
  | 'DATED_FROM_23_13_WINDOW'
  | 'CT0_AGE_NOT_RESOLVED'
  | 'WINDOW_EXCEEDS_SYSTEM_AGE';

export interface PlanetaryRealizedImpactRecord32_8 {
  readonly eventId: string;
  readonly sourceModel: 'HISTORICAL_IMPACT_REALIZATION_23_13';
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly sourceMinorBodyId: string;
  readonly timeWindowYears: number;
  readonly yearsAfterWindowStart: number;
  readonly yearsBeforeWindowEnd: number;
  /** CT-0's integer-year resolution; fractional source offset remains above. */
  readonly yearSinceFormation: number | null;
  readonly dateStatus: ImpactHistoricalDateStatus32_8;
  readonly kineticEnergyJoules: number;
  readonly surfaceResponseRegime: string;
  readonly hasSolidSurface: boolean;
  readonly craterDiameterKilometers: number | null;
  readonly atmosphericShockIndex01: number;
  readonly atmosphericLossPotentialIndex01: number;
  readonly hydrosphereShockIndex01: number | null;
  readonly geologicalShockIndex01: number | null;
  readonly surfaceWaterVaporizationPotentialIndex01: number | null;
  readonly ejectaGenerationIndex01: number | null;
  /** Realized 23.11 retained payload, not the expectation over all risk candidates. */
  readonly realizedRetainedWaterMassKilograms: number;
  readonly realizedOrganicCarrierMassProxyKilograms: number;
  readonly climateDuration: 'NOT_QUANTIFIED';
  readonly radiativeForcingWattsPerSquareMeter: null;
  readonly biologicalEffect: 'NOT_EVALUATED';
}

export interface PlanetaryRealizedImpactHistoryResult32_8 {
  readonly contractVersion: '32.8-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly impactCoverage: 'SOURCE_NOT_SUPPLIED' | 'SUPPLIED_EVENTS_ONLY';
  readonly realizedImpacts: readonly PlanetaryRealizedImpactRecord32_8[];
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
