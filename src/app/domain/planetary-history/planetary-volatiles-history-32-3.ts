import type { Atmosphere } from '../planetary/atmosphere';
import type { AtmosphereGas } from '../planetary/atmosphere-gas';
import type { PlanetWaterPhaseRegime } from '../planetary/planet-water-phase-regime';
import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistorySourceEpisode32_1,
} from './planetary-history-32-1';

/** Read-only current physical projections. No original planet generation is rerun. */
export interface PlanetaryVolatilesHistoryInput32_3 {
  readonly atmosphere: Pick<Atmosphere,
    'hostPlanet' | 'bulkProperties' | 'retentionState' | 'greenhouseEffect' |
    'waterInventory' | 'climateState'>;
  readonly time: HabitabilityTimeContextCt0;
  /** Optional dated episodes from 32.2, already verified for this exact body. */
  readonly precedingFormation?: {
    readonly bodyKey: string;
    readonly chronology: PlanetaryHistoryChronology32_1;
    readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  };
}

export interface PlanetaryVolatileGasBudget32_3 {
  readonly gas: AtmosphereGas;
  /** All three are fractions of *20.2 source moles*, not percentages of final atmosphere. */
  readonly sourceEquivalentFraction01: number;
  readonly retainedSourceEquivalentFraction01: number;
  readonly lostSourceEquivalentFraction01: number;
  /** Composition normalized *only among the surviving gases*. */
  readonly retainedAtmosphereMoleFraction01: number;
}

export interface PlanetaryAtmosphereBalance32_3 {
  readonly sourceSurfacePressurePascal: number | null;
  readonly retainedSurfacePressurePascal: number | null;
  /** Dimensionless aggregate 20.3 source-equivalent molecular inventory fractions. */
  readonly retainedSourceInventoryFraction01: number;
  readonly lostSourceInventoryFraction01: number;
  readonly species: readonly PlanetaryVolatileGasBudget32_3[];
  readonly sourceModel: 'ATMOSPHERE_20_2_20_3';
  readonly interpretation: 'INTEGRATED_MODEL_BALANCE_NOT_DATED';
}

export interface PlanetaryCondensateBalance32_3 {
  readonly gas: AtmosphereGas;
  /** 20.4 equivalent partial pressures; NOT converted to kilograms or ocean mass. */
  readonly sourcePartialPressurePascal: number;
  readonly gasPhasePartialPressurePascal: number;
  readonly condensedEquivalentPressurePascal: number;
  readonly sourceModel: 'ATMOSPHERE_20_4_CONDENSATION';
}

export interface PlanetaryWaterSnapshot32_3 {
  readonly inventoryIndex01: number;
  readonly phaseRegime: PlanetWaterPhaseRegime;
  readonly iceFraction01: number | null;
  readonly liquidFraction01: number | null;
  readonly vaporFraction01: number | null;
  readonly surfaceIceCoverageFraction01: number | null;
  readonly surfaceLiquidWaterCoverageFraction01: number | null;
  readonly surfaceLiquidPersistenceModelled: boolean;
  readonly sourceModel: 'PLANET_WATER_20_7';
  /** Fractions, coverage and inventory index cannot be converted to a historic mass budget. */
  readonly interpretation: 'CURRENT_PHASE_PARTITION_NOT_HISTORICAL_MASS';
}

export type PlanetaryVolatilesProcess32_3 =
  | 'ATMOSPHERE_FORMATION' | 'ATMOSPHERE_ESCAPE' |
    'ATMOSPHERE_CONDENSATION' | 'WATER_RESERVOIR_TRANSFORMATION' |
    'WATER_DELIVERY_OR_LOSS';

export interface PlanetaryUndatedProcess32_3 {
  readonly process: PlanetaryVolatilesProcess32_3;
  readonly temporalStatus: 'EPOCH_NOT_RESOLVED';
  readonly evidence: 'MODELED_INTEGRATED_BALANCE' | 'CURRENT_STATE_ONLY' | 'NOT_RESOLVED';
  readonly sourcePhase: string;
  readonly note: string;
}

export interface PlanetaryVolatilesHistoryResult32_3 {
  readonly contractVersion: '32.3-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly atmosphere: PlanetaryAtmosphereBalance32_3;
  readonly condensates: readonly PlanetaryCondensateBalance32_3[];
  readonly water: PlanetaryWaterSnapshot32_3;
  readonly processes: readonly PlanetaryUndatedProcess32_3[];
  /** Only dated episodes inherited from 32.2; 20.2-20.7 do not date historical transitions. */
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
