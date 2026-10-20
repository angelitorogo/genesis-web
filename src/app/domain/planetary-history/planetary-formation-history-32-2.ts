import type { Planet } from '../planetary/planet';
import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type {
  PlanetaryHistorySourceEpisode32_1,
  PlanetaryHistoryChronology32_1,
} from './planetary-history-32-1';

/** 32.2 only reads the frozen 17.7 -> 18.2 -> 19.5 formation lineage. */
export interface PlanetaryFormationHistoryInput32_2 {
  readonly planet: Pick<Planet,
    'hostPlanetarySystem' | 'planetOrdinal' | 'architectureSlot' | 'internalComposition'>;
  /** CT-0 current system age, never the age of a particular companion star. */
  readonly time: HabitabilityTimeContextCt0;
}

export type PlanetaryFormationProcess32_2 =
  | 'PRECURSOR_ACCRETION' | 'PRECURSOR_ASSEMBLY'
  | 'INTERIOR_COOLING' | 'INTERIOR_DIFFERENTIATION';
export type PlanetaryFormationResolution32_2 =
  | 'INFERRED_EARLY_INTERVAL'
  | 'CURRENT_INTERIOR_BUDGET_ONLY'
  | 'TIME_NOT_RESOLVED';

export interface PlanetaryFormationStage32_2 {
  readonly process: PlanetaryFormationProcess32_2;
  readonly resolution: PlanetaryFormationResolution32_2;
  readonly startYear: number | null;
  readonly endYear: number | null;
  /** Documentation only. It is not a measured geological age or an event record. */
  readonly sourceModel: string;
  readonly note: string;
}

export interface PlanetaryFormationHistoryResult32_2 {
  readonly contractVersion: '32.2-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly stages: readonly PlanetaryFormationStage32_2[];
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
