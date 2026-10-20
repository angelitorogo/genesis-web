import type { Planet } from '../planetary/planet';
import type { PlanetGeologyState } from '../planetary/planet-geology-state';
import type { PlanetaryImpactHistoryCatalog } from '../planetary/planetary-impact-history-catalog';
import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type { PlanetaryGlaciationHistoryResult32_4 } from './planetary-glaciation-history-32-4';
import type { PlanetaryHistoryChronology32_1, PlanetaryHistorySourceEpisode32_1 } from './planetary-history-32-1';

/** 32.5 consumes frozen 20.8 and realized 23.13 history; never the 23.8 risk catalogue. */
export interface PlanetaryCatastropheHistoryInput32_5 {
  readonly planet: Planet;
  readonly geology: PlanetGeologyState;
  readonly time: HabitabilityTimeContextCt0;
  readonly precedingGlaciation?: Pick<PlanetaryGlaciationHistoryResult32_4,
    'bodyKey' | 'chronology' | 'sourceEpisodes' | 'cryosphere'>;
  /** Optional real 23.13 catalogue. Omission != proof of no impacts. */
  readonly impactHistory?: Pick<PlanetaryImpactHistoryCatalog,
    'planetarySystem' | 'historicalMinorBodyImpactEvents' | 'minorBodyRealizations'>;
}

export interface PlanetaryVolcanismSnapshot32_5 {
  readonly sourceModel: 'GEOLOGY_20_8';
  readonly interpretation: 'CURRENT_NORMALIZED_PROXY_NOT_DATED_ERUPTION';
  readonly regime: string;
  readonly geologyRegime: string;
  readonly volcanismIndex01: number | null;
  readonly outgassingPotential01: number | null;
  readonly surfaceRenewalPotential01: number | null;
  readonly geologicalActivityIndex01: number | null;
  readonly supervolcanicEpisode: 'NOT_RESOLVED';
  readonly eruptedVolumeCubicKilometers: null;
  readonly volcanicAtmosphericMassDeltaKilograms: null;
  readonly volcanicRadiativeForcingWattsPerSquareMeter: null;
}

export interface PlanetaryResolvedImpactEffects32_5 {
  readonly sourceModel: 'REALIZED_IMPACT_23_13_EFFECTS_23_10';
  readonly sourceEventId: string;
  readonly targetBodyKey: string;
  readonly sourceMinorBodyId: string;
  readonly hasSolidSurface: boolean;
  readonly kineticEnergyJoules: number;
  readonly surfaceResponseRegime: string;
  readonly craterDiameterKilometers: number | null;
  readonly atmosphericShockIndex01: number;
  readonly atmosphericLossPotentialIndex01: number;
  readonly hydrosphereShockIndex01: number | null;
  readonly surfaceWaterVaporizationPotentialIndex01: number | null;
  readonly geologicalShockIndex01: number | null;
  readonly ejectaGenerationIndex01: number | null;
  readonly radiativeEffect: 'NOT_QUANTIFIED';
  readonly radiativeForcingWattsPerSquareMeter: null;
  readonly temperatureChangeKelvin: null;
  readonly atmosphericMassLossKilograms: null;
  readonly historicalDating: 'DEFERRED_TO_32_8';
}

export interface PlanetaryUndatedCatastropheProcess32_5 {
  readonly process: 'SUPERVOLCANIC_ERUPTION' | 'VOLCANIC_ATMOSPHERIC_CHANGE' | 'VOLCANIC_RADIATIVE_CHANGE';
  readonly status: 'EPOCH_AND_MAGNITUDE_NOT_RESOLVED';
  readonly sourceModel: 'GEOLOGY_20_8';
}

export interface PlanetaryCatastropheHistoryResult32_5 {
  readonly contractVersion: '32.5-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly volcanism: PlanetaryVolcanismSnapshot32_5;
  readonly undatedProcesses: readonly PlanetaryUndatedCatastropheProcess32_5[];
  /** Only actually realized 23.13 events, not expected counts or conditional 23.10 scenarios. */
  readonly realizedImpactEffects: readonly PlanetaryResolvedImpactEffects32_5[];
  readonly impactCoverage: 'SOURCE_NOT_SUPPLIED' | 'SUPPLIED_EVENTS_ONLY';
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
