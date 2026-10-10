/**
 * 29.11: read-only evidence contract. A past intrinsic event, a statistical
 * population and a prediction are different things. These records never
 * change the generated system/atmosphere/biosphere state.
 */
export type HistoricalTransientFamily =
  | 'STELLAR_FLARE' | 'SUPERNOVA' | 'NOVA' | 'KILONOVA'
  | 'COMPACT_MERGER' | 'GRB' | 'FRB' | 'TDE';
export type HistoricalEventState =
  | 'PAST_INTRINSIC_EXPLICIT' | 'FUTURE_CANONICAL'
  | 'STATISTICAL_ONLY' | 'UNCONFIRMED_CANDIDATE'
  | 'INTRINSIC_REFERENCE_ONLY';
export type HistoricalPhotonBand =
  | 'BOLOMETRIC' | 'OPTICAL' | 'UV' | 'X_RAY' | 'GAMMA';
/**
 * ISOTROPIC_TOTAL: total photon energy distributed isotropically (laboratory assumption).
 * BEAM_INTERSECTION_EXPLICIT: energy is ALREADY isotropic equivalent (E_iso)
 * for a known intersecting beam. This is NOT the true total jet energy.
 * BEAM_ORIENTATION_UNKNOWN: no geometric interception may be inferred.
 */
export type HistoricalPhotonGeometry =
  | 'ISOTROPIC_TOTAL' | 'BEAM_INTERSECTION_EXPLICIT'
  | 'BEAM_ORIENTATION_UNKNOWN' | 'UNRESOLVED';

export interface HistoricalTransientEvent {
  readonly id: string;
  readonly label: string;
  readonly family: HistoricalTransientFamily;
  readonly state: HistoricalEventState;
  /** Years BEFORE an explicit local study reference; null means unplaced. */
  readonly yearsBeforeReference: number | null;
  /** Photon energy in given band; total or E_iso according to geometry. */
  readonly photonEnergyJoules: number | null;
  readonly band: HistoricalPhotonBand | null;
  readonly geometry: HistoricalPhotonGeometry;
  readonly sourceDurationSeconds: number | null;
}

export interface HistoricalTargetBody {
  readonly id: string;
  readonly label: string;
  readonly kind: 'PLANET' | 'MOON';
  /** Source-to-target distance at encounter, not an inferred orbital average. */
  readonly separationAu: number | null;
  /** Explicit effective optical depth in the SAME band; null = unknown. */
  readonly effectiveOpticalDepth: number | null;
  /** Means only that the user's biosphere characterization is known, not its response. */
  readonly biosphereCharacterized: boolean;
}

export type HistoricalExposureState =
  | 'NO_INDIVIDUAL_PAST_EVENT' | 'NO_RADIANT_SPECTRUM'
  | 'GEOMETRY_UNRESOLVED' | 'DISTANCE_UNRESOLVED'
  | 'TOA_RESOLVED_ATMOSPHERE_UNRESOLVED' | 'BAND_ATTENUATION_RESOLVED';

export interface HistoricalEventExposure {
  readonly eventId: string;
  readonly label: string;
  readonly family: HistoricalTransientFamily;
  readonly eventState: HistoricalEventState;
  readonly state: HistoricalExposureState;
  readonly band: HistoricalPhotonBand | null;
  readonly yearsBeforeReference: number | null;
  readonly topOfAtmosphereFluenceJoulesPerSquareMeter: number | null;
  readonly meanTopOfAtmosphereFluxWattsPerSquareMeter: number | null;
  readonly transmittedFluenceJoulesPerSquareMeter: number | null;
  readonly biosphereResponse: 'NOT_DERIVED';
  readonly atmosphereEvolution: 'NOT_DERIVED';
  readonly inventedPlanetaryMutations: 0;
}
export interface HistoricalKnownBandSubtotal {
  readonly band: HistoricalPhotonBand;
  /** KNOWN subtotal only, not a complete exposure history. */
  readonly knownTopOfAtmosphereFluenceJoulesPerSquareMeter: number;
  readonly contributingEventCount: number;
}
export interface HistoricalEffectsReport {
  readonly targetId: string;
  readonly targetLabel: string;
  /** Ordered oldest→newest only for explicitly placed events. Unknown dates stay unknown. */
  readonly events: readonly HistoricalEventExposure[];
  readonly knownBandSubtotals: readonly HistoricalKnownBandSubtotal[];
  readonly unresolvedPastEventCount: number;
  readonly eventCountPersisted: 0;
  readonly alteredAtmospheres: 0;
  readonly alteredBiospheres: 0;
  readonly historicalCompleteness: 'PARTIAL_ONLY';
}
