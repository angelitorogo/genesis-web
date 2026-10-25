/**
 * PRE-33.03a.2 — purely internal modeled H2O forcing. No player's observed
 * knowledge is updated. This is a deterministic, physically PARAMETERIZED
 * history, NOT a measured or independently reconstructed planetary past.
 *
 * The initial H2O mass from 03a is a chemical prior on MATURE 19.5 carriers;
 * it is not an independently modeled protoplanetary-formation inventory.
 */
import type { H2ODatedHistoryPRE3303A1, H2OEvolutionResultPRE3303A1 } from './planet-h2o-evolution-contract-pre33-03a1';
export const PLANET_H2O_HISTORICAL_PRE3303A2 = 'PRE-33.03a.2/physical-forcing/v1' as const;

/** Independently resolved frozen host properties; optical luminosity alone is NEVER historical XUV. */
export interface PlanetH2OHostSourcePRE3303A2 {
  readonly ageBillionYears: number;
  readonly massSolar: number;
  readonly luminositySolar: number;
  readonly mainSequenceLifetimeBillionYears: number | null;
  readonly evolutionState: 'MAIN_SEQUENCE' | 'OTHER';
  readonly sourceRecordKey: string;
  /** Distinguishes canonical single/component A/B/C from unresolved circumbinary geometry. */
  readonly orbitalFluxGeometry: 'HOST_CIRCUMSTELLAR' | 'UNRESOLVED_MULTIPLE_FLUX';
}

export type PlanetH2OHistoricalStatusPRE3303A2 =
  | 'MODELED_DATED_CONDITIONAL_HISTORY'
  | 'UNRESOLVED_STELLAR_AGE_OR_EVOLUTION'
  | 'UNRESOLVED_STELLAR_FLUX_GEOMETRY'
  | 'UNRESOLVED_SURFACE_REFERENCE';

export interface PlanetH2OHistoricalResultPRE3303A2 {
  readonly contractVersion: typeof PLANET_H2O_HISTORICAL_PRE3303A2;
  readonly bodyKey: string;
  readonly perspective: 'INTERNAL_SIMULATED_REALITY';
  readonly status: PlanetH2OHistoricalStatusPRE3303A2;
  readonly sourceKey: string | null;
  readonly history: H2ODatedHistoryPRE3303A1 | null;
  readonly evolution: H2OEvolutionResultPRE3303A1 | null;
  readonly physics: Readonly<{
    xuv: 'MASS_AND_AGE_PARAMETERIZED_SATURATION_DECAY_HYPOTHESIS' | 'UNRESOLVED';
    outgassing: 'VOLATILE_RESERVOIR_FIRST_ORDER_HYPOTHESIS' | 'UNRESOLVED';
    surfacePhases: 'ONLY_CT0_SATURATION_COLUMN_ESTIMATE' | 'UNRESOLVED';
    externalImpacts: 'NO_INDEPENDENT_DATED_DELIVERY_SOURCE';
    initialInventory: 'BACKPROJECTED_MATURE_19_5_CHEMISTRY_ONLY';
    historicalClimate: 'NOT_RECONSTRUCTED';
  }>;
  readonly chronologyPreserved: true;
  readonly phase32VolatileSourceValidated: boolean;
  readonly playerKnowledgeUpdated: false;
  readonly ct0Certified: false;
  readonly lifeEvaluated: false;
}
