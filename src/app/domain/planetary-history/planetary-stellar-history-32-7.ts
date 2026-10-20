import type { Planet } from '../planetary/planet';
import type { StellarLifetimeProfile } from '../stellar/stellar-lifetime-profile';
import type { StellarActivityProfile } from '../stellar/stellar-activity-profile';
import type { StellarRotationStabilityProfile } from '../stellar/stellar-rotation-stability-profile';
import type { StellarEvolutionStateName } from '../stellar/stellar-evolution-state';
import type { HabitabilityTimeContextCt0 } from '../habitability/habitability-scenario';
import type { PlanetaryClimateGeochemistryHistoryResult32_6 } from './planetary-climate-geochemistry-history-32-6';
import type {
  PlanetaryHistoryChronology32_1,
  PlanetaryHistorySourceEpisode32_1,
  PlanetaryHistoryTime32_1,
} from './planetary-history-32-1';

export type StellarHistoryComponentLabel32_7 = 'A' | 'B' | 'C';

/** 15.3 source-backed coeval profile; primary A is supplied separately by its materializer. */
export interface StellarHistoryComponent32_7 {
  readonly label: StellarHistoryComponentLabel32_7;
  readonly lifetime: StellarLifetimeProfile;
  readonly activity?: StellarActivityProfile | null;
  readonly rotation?: StellarRotationStabilityProfile | null;
}

/**
 * An actual source-backed *stellar phase transition*. Transient emissions,
 * flares and their planetary consequences belong to 32.9. A model threshold
 * or present-day flare rate is NOT a resolved transition record.
 */
export interface StellarHistoryTransition32_7 {
  readonly component: StellarHistoryComponentLabel32_7;
  readonly eventKey: string;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly evidenceKind: 'RESOLVED_PHYSICAL_EVENT' | 'INFERRED_PHYSICAL_EPISODE';
  readonly before: StellarEvolutionStateName;
  readonly after: StellarEvolutionStateName;
  /** Explicit source date already transformed to CT-0. Never inferred from today's class. */
  readonly time: PlanetaryHistoryTime32_1;
}

/** Dated activity from an actual resolved source record, never from 15.4 statistics. */
export interface StellarHistoryActivityRecord32_7 {
  readonly component: StellarHistoryComponentLabel32_7;
  readonly eventKey: string;
  readonly sourcePhase: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly kind: 'RESOLVED_STELLAR_FLARE' | 'RESOLVED_MAGNETIC_OUTBURST' |
    'OTHER_RESOLVED_STELLAR_ACTIVITY';
  readonly time: PlanetaryHistoryTime32_1;
}

export interface PlanetaryStellarHistoryInput32_7 {
  readonly planet: Pick<Planet, 'hostPlanetarySystem' | 'architectureSlot' | 'planetOrdinal'>;
  readonly time: HabitabilityTimeContextCt0;
  readonly components: readonly StellarHistoryComponent32_7[];
  /** Optional, physically resolved stellar lineage events. Absence means unknown history. */
  readonly transitions?: readonly StellarHistoryTransition32_7[];
  readonly resolvedActivityEvents?: readonly StellarHistoryActivityRecord32_7[];
  readonly precedingClimate?: Pick<PlanetaryClimateGeochemistryHistoryResult32_6,
    'bodyKey' | 'chronology' | 'sourceEpisodes'>;
}

export interface StellarHistoryComponentSnapshot32_7 {
  readonly component: StellarHistoryComponentLabel32_7;
  readonly state: StellarEvolutionStateName;
  readonly ageBillionYears: number;
  readonly mainSequenceReferenceEndBillionYears: number | null;
  readonly terminalReferenceAgeBillionYears: number | null;
  readonly historicalPhaseEvents: 'ONLY_SUPPLIED_DATED_TRANSITIONS';
  readonly activity: 'CURRENT_STATISTICAL_PROFILE' | 'NOT_EVALUABLE';
  readonly flareRatePerDay: number | null;
  readonly magneticActivityIndex01: number | null;
  readonly rotationStabilityIndex01: number | null;
  readonly currentActivityIsHistoricalFlareEvent: false;
}

export interface StellarLineageEvent32_7 {
  readonly eventKey: string;
  readonly component: StellarHistoryComponentLabel32_7;
  readonly before: StellarEvolutionStateName;
  readonly after: StellarEvolutionStateName;
  readonly time: PlanetaryHistoryTime32_1;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly planetaryIrradiationChange: 'NOT_QUANTIFIED';
  readonly atmosphericOrClimateConsequence: 'NOT_RESOLVED';
}

export interface StellarHistoryResolvedActivity32_7 {
  readonly eventKey: string;
  readonly component: StellarHistoryComponentLabel32_7;
  readonly kind: StellarHistoryActivityRecord32_7['kind'];
  readonly time: PlanetaryHistoryTime32_1;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly planetaryEnergyDeposition: 'NOT_RESOLVED';
  readonly planetaryEnvironmentalEffect: 'DEFERRED_TO_32_9';
}

export interface PlanetaryStellarHistoryResult32_7 {
  readonly contractVersion: '32.7-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKey: string;
  readonly hosts: readonly StellarHistoryComponentSnapshot32_7[];
  /** A star may be part of the system but not radiatively coupled to this planet. */
  readonly planetaryHostCoupling: 'NOT_RESOLVED_FROM_LINEAGE_ALONE';
  readonly transitions: readonly StellarLineageEvent32_7[];
  readonly resolvedActivityEvents: readonly StellarHistoryResolvedActivity32_7[];
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly transientEffects: 'DEFERRED_TO_32_9';
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
