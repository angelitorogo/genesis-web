import type { PlanetaryHistoryTime32_1, PlanetaryHistorySourceEpisode32_1,
  PlanetaryHistoryChronology32_1 } from './planetary-history-32-1';
import type { PlanetaryRealizedImpactHistoryResult32_8 } from './planetary-realized-impact-history-32-8';

/** GENESIS 32.9: event existence, target exposure and actual physical response are NOT interchangeable. */
export type TransientKind32_9 = 'SUPERNOVA' | 'NOVA' | 'KILONOVA' | 'GRB' |
  'STELLAR_FLARE' | 'MAGNETAR_OUTBURST' | 'COMPACT_MERGER' | 'FRB' | 'OTHER_TRANSIENT';
export type TransientHostComponent32_9 = 'A' | 'B' | 'C';
export type TransientEmissionGeometry32_9 = 'ISOTROPIC_MODEL' |
  'DIRECTIONALLY_RESOLVED' | 'UNRESOLVED';

/** An actual phase-29 event. A statistical frequency or hypothetical scenario is invalid. */
export interface HistoricalTransientEvent32_9 {
  readonly eventId: string;
  readonly kind: TransientKind32_9;
  readonly realization: 'RESOLVED_PHYSICAL_EVENT';
  readonly sourcePhase: `29.${number}`;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly sourceLocation: {
    readonly kind: 'HOST_COMPONENT' | 'EXTERNAL_SOURCE';
    readonly hostComponent: TransientHostComponent32_9 | null;
    /** Canonical G/S/O prefix; required for local hosts to prevent cross-system misattribution. */
    readonly sourceSystemKey: string | null;
    readonly externalSourceKey: string | null;
  };
  /** Explicit CT-0 source epoch, or null if the original source has no defensible date. */
  readonly time: PlanetaryHistoryTime32_1 | null;
}

/** An exposure computed by a source-specific radiative/particle transport model. */
export interface HistoricalTransientExposure32_9 {
  readonly exposureId: string;
  readonly eventId: string;
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly resolution: 'RESOLVED_TARGET_EXPOSURE' | 'NOT_EVALUABLE';
  /** Physical source-to-target distance, NOT an arbitrary threshold or host separation guess. */
  readonly distanceMeters: number | null;
  readonly emissionGeometry: TransientEmissionGeometry32_9;
  /** Null when orientation is unresolved; false excludes an assumed collimated hit. */
  readonly beamIntersectsTarget: boolean | null;
  /** Transport-integrated received fluence; never inferred from event kind alone. */
  readonly receivedFluenceJoulesPerSquareMeter: number | null;
}

export type TransientResponseKind32_9 = 'ATMOSPHERIC_IONIZATION' |
  'ATMOSPHERIC_ESCAPE' | 'ATMOSPHERIC_PHOTOCHEMISTRY' |
  'SURFACE_IRRADIATION' | 'OCEAN_ENERGY_DEPOSITION' |
  'OTHER_RESOLVED_RESPONSE';

/** A physical response on THIS target, computed from the actual exposure, not a risk proxy. */
export interface HistoricalTransientResponse32_9 {
  readonly responseId: string;
  readonly exposureId: string;
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly responseKind: TransientResponseKind32_9;
  readonly sourceModel: string;
  readonly sourceRecordKey: string;
  readonly realization: 'RESOLVED_PHYSICAL_RESPONSE';
  /** Dimensionless response proxy supplied by the response model; NOT a measured dose. */
  readonly responseIndex01: number;
  /** Dated independently by the physical response model; null is allowed. */
  readonly time: PlanetaryHistoryTime32_1 | null;
  /** Optional same-body causal episode already present in the supplied chronology. */
  readonly causedByEpisodeKey?: string | null;
}

export interface PlanetaryTransientEffectsHistoryInput32_9 {
  /** Frozen, validated canonical history through 32.8, including impacts. */
  readonly preceding: PlanetaryRealizedImpactHistoryResult32_8;
  /** Omitted means source coverage unknown, [] means no supplied records, NEVER no actual events. */
  readonly events?: readonly HistoricalTransientEvent32_9[];
  readonly exposures?: readonly HistoricalTransientExposure32_9[];
  readonly responses?: readonly HistoricalTransientResponse32_9[];
}

export interface HistoricalTransientRecord32_9 {
  readonly responseId: string;
  readonly sourceEventId: string;
  readonly sourceEventKind: TransientKind32_9;
  readonly exposureId: string;
  readonly targetBodyKind: 'PLANET' | 'MOON';
  readonly targetBodyKey: string;
  readonly sourceComponent: TransientHostComponent32_9 | null;
  readonly distanceMeters: number;
  readonly emissionGeometry: Exclude<TransientEmissionGeometry32_9, 'UNRESOLVED'>;
  readonly receivedFluenceJoulesPerSquareMeter: number;
  readonly responseKind: TransientResponseKind32_9;
  readonly responseIndex01: number;
  readonly responseSourceModel: string;
  readonly dateStatus: 'DATED_FROM_RESOLVED_RESPONSE' | 'RESPONSE_DATE_NOT_RESOLVED';
  readonly time: PlanetaryHistoryTime32_1 | null;
  readonly climateTemperatureChangeKelvin: null;
  readonly atmosphericMassChangeKilograms: null;
  readonly biologicalEffect: 'NOT_EVALUATED';
}

export interface PlanetaryTransientEffectsHistoryResult32_9 {
  readonly contractVersion: '32.9-CT0';
  readonly layer: 'SIMULATED_REALITY';
  readonly bodyKind: 'PLANET' | 'MOON';
  readonly bodyKey: string;
  readonly sourceCoverage: 'NOT_SUPPLIED' | 'SUPPLIED_RECORDS_ONLY';
  readonly eventCount: number;
  readonly exposureCount: number;
  readonly unresolvedExposureCount: number;
  readonly responses: readonly HistoricalTransientRecord32_9[];
  readonly sourceEpisodes: readonly PlanetaryHistorySourceEpisode32_1[];
  readonly chronology: PlanetaryHistoryChronology32_1;
  readonly historicalCompleteness: 'NOT_ESTABLISHED';
  readonly lifePresence: 'NOT_EVALUATED';
}
